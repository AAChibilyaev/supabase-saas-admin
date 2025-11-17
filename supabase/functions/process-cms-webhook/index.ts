import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
}

interface WebhookPayload {
  integration_id: string
  event_type: string
  payload: unknown
  signature?: string
}

/**
 * Verify webhook signature to ensure authenticity
 */
async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    )

    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    return signature === expectedSignature
  } catch (error) {
    console.error('Signature verification failed:', error)
    return false
  }
}

/**
 * Process CMS webhook events
 * This function handles real-time webhook notifications from CMS platforms
 * and triggers appropriate sync operations
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client 
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Parse request
    const rawBody = await req.text()
    const webhookSignature = req.headers.get('x-webhook-signature')

    let webhookData: WebhookPayload
    try {
      webhookData = JSON.parse(rawBody)
    } catch (error: unknown) {
      console.error('Invalid JSON payload:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { integration_id, event_type, payload } = webhookData

    if (!integration_id || !event_type || !payload) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: integration_id, event_type, payload'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get integration configuration
    const { data: integration, error: integrationError } = await supabaseClient
      .from('cms_connections')
      .select('*')
      .eq('id', integration_id)
      .single()

    if (integrationError || !integration) {
      console.error('Integration not found:', integrationError)
      return new Response(
        JSON.stringify({ error: 'Integration not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify webhook signature if present
    if (webhookSignature && integration.webhook_secret) {
      const isValid = await verifyWebhookSignature(
        rawBody,
        webhookSignature,
        integration.webhook_secret
      )

      if (!isValid) {
        console.error('Invalid webhook signature')
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Store webhook event
    const { data: webhookEvent, error: eventError } = await supabaseClient
      .from('cms_webhook_events')
      .insert({
        integration_id,
        event_type,
        payload,
        processed: false,
        received_at: new Date().toISOString()
      })
      .select()
      .single()

    if (eventError) {
      console.error('Failed to store webhook event:', eventError)
      return new Response(
        JSON.stringify({
          error: 'Failed to store webhook event',
          details: eventError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Process webhook based on event type
    const processResult = { success: true, message: 'Event queued for processing' }

    try {
      switch (event_type) {
        case 'content.created':
        case 'content.updated':
          // Trigger incremental sync for the specific content
            const documentId = (payload as { id?: string, documentId?: string }).id || (payload as { id?: string, documentId?: string }).documentId
          if (documentId) {
            // Call sync function for this specific document
            const syncResponse = await fetch(
              `${Deno.env.get('SUPABASE_URL') ?? ''}/functions/v1/sync-to-typesense`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''}`
                },
                body: JSON.stringify({
                  integration_id,
                  document_id: documentId,
                  operation: event_type === 'content.created' ? 'INSERT' : 'UPDATE'
                })
              }
            )

            if (!syncResponse.ok) {
              throw new Error(`Sync failed: ${await syncResponse.text()}`)
            }
          }
          break

        case 'content.deleted':
          // Remove document from Typesense
          const deletedDocId = (payload as { id?: string, documentId?: string }).id || (payload as { id?: string, documentId?: string }).documentId
          if (deletedDocId) {
            const syncResponse = await fetch(
              `${Deno.env.get('SUPABASE_URL') ?? ''}/functions/v1/sync-to-typesense`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''}`
                },
                body: JSON.stringify({
                  integration_id,
                  document_id: deletedDocId,
                  operation: 'DELETE'
                })
              }
            )

            if (!syncResponse.ok) {
              throw new Error(`Delete sync failed: ${await syncResponse.text()}`)
            }
          }
          break

        case 'content.published':
        case 'content.unpublished':
          // Handle publish state changes
          processResult.message = `${event_type} event queued`
          break

        default:
          console.warn(`Unknown event type: ${event_type}`)
          processResult.message = `Unknown event type: ${event_type}`
      }

      // Mark webhook event as processed
      await supabaseClient
        .from('cms_webhook_events')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
          processing_result: processResult
        })
        .eq('id', webhookEvent.id)

    } catch (processingError) {
      console.error('Webhook processing error:', processingError)

      // Log processing error
      await supabaseClient
        .from('cms_webhook_events')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
          processing_error: processingError instanceof Error
            ? processingError.message
            : 'Unknown error'
        })
        .eq('id', webhookEvent.id)

      return new Response(
        JSON.stringify({
          error: 'Processing failed',
          details: processingError instanceof Error ? processingError.message : 'Unknown error'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        webhook_event_id: webhookEvent.id,
        result: processResult
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

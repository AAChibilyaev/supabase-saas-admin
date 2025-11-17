// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Email configuration
const EMAIL_CONFIG = {
  from: Deno.env.get('EMAIL_FROM') || 'noreply@yourdomain.com',
  fromAlerts: Deno.env.get('EMAIL_FROM_ALERTS') || 'alerts@yourdomain.com',
  fromNotifications: Deno.env.get('EMAIL_FROM_NOTIFICATIONS') || 'notifications@yourdomain.com',
}

interface EmailRequest {
  to: string
  subject: string
  html: string
  from?: string
  type: string
  metadata?: Record<string, unknown>
}

interface EmailResponse {
  success: boolean
  emailId?: string
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Verify request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Validate Resend API key
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ success: false, error: 'Email service not configured' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Parse request body
    const emailRequest: EmailRequest = await req.json()

    // Validate required fields
    if (!emailRequest.to || !emailRequest.subject || !emailRequest.html) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: to, subject, html'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Determine sender address based on email type
    let from = emailRequest.from || EMAIL_CONFIG.from
    if (emailRequest.type === 'usage_alert' || emailRequest.type === 'system_alert') {
      from = EMAIL_CONFIG.fromAlerts
    } else if (emailRequest.type === 'notification') {
      from = EMAIL_CONFIG.fromNotifications
    }

    // Send email via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from,
        to: emailRequest.to,
        subject: emailRequest.subject,
        html: emailRequest.html,
      }),
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text()
      console.error('Resend API error:', errorData)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to send email',
          details: errorData,
        }),
        {
          status: resendResponse.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    const resendData = await resendResponse.json()
    const emailId = resendData.id

    // Track email in database if Supabase is configured
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        await supabase.from('email_tracking').insert({
          email_id: emailId,
          recipient: emailRequest.to,
          subject: emailRequest.subject,
          type: emailRequest.type,
          status: 'sent',
          metadata: emailRequest.metadata || {},
          sent_at: new Date().toISOString(),
        })
      } catch (dbError) {
        console.error('Failed to track email in database:', dbError)
        // Don't fail the request if tracking fails
      }
    }

    // Return success response
    const response: EmailResponse = {
      success: true,
      emailId,
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})

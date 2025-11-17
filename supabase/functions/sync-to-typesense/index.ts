import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Typesense from 'https://esm.sh/typesense@1.7.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncRequest {
  table: string
  record: unknown
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
}

serve(async (req) => {
  // Handle CORS
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

    // Initialize Typesense client
    const typesenseClient = new Typesense.Client({
      nodes: [{
        host: Deno.env.get('TYPESENSE_HOST') ?? '',
        port: parseInt(Deno.env.get('TYPESENSE_PORT') ?? ''),
        protocol: Deno.env.get('TYPESENSE_PROTOCOL') ?? ''
      }],
      apiKey: Deno.env.get('TYPESENSE_API_KEY') as string,
      connectionTimeoutSeconds: 10, as string as number,
    })

    // Parse request body
    const { table, record, operation }: SyncRequest = await req.json()

    if (!table || !record) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: table, record' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Map table names to Typesense collections
    const collectionName = table.replace(/_/g, '-')

    switch (operation) {
      case 'INSERT':
      case 'UPDATE':
        // Upsert document to Typesense
        await typesenseClient
          .collections(collectionName)
          .documents()
          .upsert({
            id: (record as { id: string }).id,
            ...record,
            // Convert timestamps to Unix epoch for Typesense
            created_at: (record as { created_at: string }).created_at ? new Date((record as { created_at: string }).created_at).getTime() / 1000 : undefined,
            updated_at: (record as { updated_at: string }).updated_at ? new Date((record as { updated_at: string }).updated_at).getTime() / 1000 : undefined,
          })

        return new Response(
          JSON.stringify({
            success: true,
            message: `Document ${(record as { id: string }).id} synced to collection ${collectionName}`
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )

      case 'DELETE':
        // Delete document from Typesense
        await typesenseClient
          .collections(collectionName)
          .documents((record as { id: string }).id)
          .delete()

        return new Response(
          JSON.stringify({
            success: true,
            message: `Document ${(record as { id: string }).id} deleted from collection ${collectionName}`
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid operation. Must be INSERT, UPDATE, or DELETE' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }
  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An error occurred while syncing to Typesense'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

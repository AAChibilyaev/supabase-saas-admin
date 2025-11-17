import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Typesense from 'https://esm.sh/typesense@1.7.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BatchSyncRequest {
  table: string
  limit?: number
  offset?: number
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
    )

    // Initialize Typesense client
    const typesenseClient = new Typesense.Client({
      nodes: [{
        host: Deno.env.get('TYPESENSE_HOST') || 'localhost',
        port: parseInt(Deno.env.get('TYPESENSE_PORT') || '8108'),
        protocol: Deno.env.get('TYPESENSE_PROTOCOL') || 'http'
      }],
      apiKey: Deno.env.get('TYPESENSE_API_KEY') || '',
      connectionTimeoutSeconds: 10,
    })

    // Parse request body
    const { table, limit = 1000, offset = 0 }: BatchSyncRequest = await req.json()

    if (!table) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: table' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Fetch documents from Supabase
    const { data: records, error } = await supabaseClient
      .from(table)
      .select('*')
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to fetch records from ${table}: ${error.message}`)
    }

    if (!records || records.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No records to sync',
          synced: 0
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Map table names to Typesense collections
    const collectionName = table.replace(/_/g, '-')

    // Transform records for Typesense
    const documents = records.map(record => ({
      ...record,
      // Ensure id is a string
      id: String(record.id),
      // Convert timestamps to Unix epoch for Typesense
      created_at: record.created_at ? new Date(record.created_at).getTime() / 1000 : undefined,
      updated_at: record.updated_at ? new Date(record.updated_at).getTime() / 1000 : undefined,
    }))

    // Batch import to Typesense (using upsert action)
    const importResults = await typesenseClient
      .collections(collectionName)
      .documents()
      .import(documents, {
        action: 'upsert',
        batch_size: 100
      })

    // Parse import results
    const results = importResults
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Batch sync completed for ${table}`,
        synced: successful,
        failed: failed.length,
        errors: failed.length > 0 ? failed : undefined,
        total: records.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Batch sync error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred during batch sync'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

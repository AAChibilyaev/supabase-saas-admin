import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://deno.land/x/openai@v4.20.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmbeddingRequest {
  documentId: string
  model?: 'text-embedding-3-small' | 'text-embedding-3-large' | 'text-embedding-ada-002'
  forceRegenerate?: boolean
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize OpenAI client
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    })

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Parse request body
    const { documentId, model = 'text-embedding-3-small', forceRegenerate = false }: EmbeddingRequest =
      await req.json()

    if (!documentId) {
      throw new Error('documentId is required')
    }

    // Fetch document
    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message}`)
    }

    // Check if embedding already exists and regeneration is not forced
    if (document.embedding_generated && !forceRegenerate) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Embedding already exists',
          skipped: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate content
    if (!document.content || document.content.trim().length === 0) {
      throw new Error('Document has no content to embed')
    }

    // Generate embedding
    const startTime = Date.now()
    const maxChars = 8000 * 4 // Rough token limit (8000 tokens ≈ 32000 chars)
    const truncatedContent = document.content.substring(0, maxChars)

    const embeddingResponse = await openai.embeddings.create({
      model: model,
      input: truncatedContent,
    })

    const embedding = embeddingResponse.data[0].embedding
    const processingTime = Date.now() - startTime
    const tokenCount = embeddingResponse.usage.total_tokens

    // Convert embedding array to PostgreSQL vector format
    const embeddingVector = `[${embedding.join(',')}`

    // Update document with embedding
    const { error: updateError } = await supabaseClient
      .from('documents')
      .update({
        embedding: embeddingVector,
        embedding_generated: true,
        embedding_updated_at: new Date().toISOString(),
        embedding_model: model,
        embedding_dimensions: embedding.length,
        embedding_hash: await generateHash(document.content),
      })
      .eq('id', documentId)

    if (updateError) {
      throw new Error(`Failed to update document: ${updateError.message}`)
    }

    // Log analytics
    const { error: analyticsError } = await supabaseClient
      .from('embedding_analytics')
      .insert({
        tenant_id: document.tenant_id,
        document_id: documentId,
        embedding_model: model,
        embedding_dimensions: embedding.length,
        token_count: tokenCount,
        processing_time_ms: processingTime,
        success: true,
        error_message: null,
      })

    if (analyticsError) {
      console.error('Failed to log analytics:', analyticsError)
      // Don't throw - analytics failure shouldn't fail the whole operation
    }

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        model,
        dimensions: embedding.length,
        tokens: tokenCount,
        processingTime,
        cost: calculateCost(tokenCount, model),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error generating embedding:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

// Helper function to generate content hash
async function generateHash(content: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

// Helper function to calculate cost
function calculateCost(
  tokens: number,
  model: string
): number {
  const costs = {
    'text-embedding-3-small': 0.02,
    'text-embedding-3-large': 0.13,
    'text-embedding-ada-002': 0.10,
  }
  const costPer1M = costs[model as keyof typeof costs] || 0.02
  return (tokens / 1_000_000) * costPer1M
}

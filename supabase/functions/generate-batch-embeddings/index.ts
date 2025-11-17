import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://deno.land/x/openai@v4.20.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BatchEmbeddingRequest {
  documentIds: string[]
  model?: 'text-embedding-3-small' | 'text-embedding-3-large' | 'text-embedding-ada-002'
  forceRegenerate?: boolean
  batchSize?: number
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
    const {
      documentIds,
      model = 'text-embedding-3-small',
      forceRegenerate = false,
      batchSize = 10,
    }: BatchEmbeddingRequest = await req.json()

    if (!documentIds || documentIds.length === 0) {
      throw new Error('documentIds array is required and must not be empty')
    }

    const results = {
      total: documentIds.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[],
      totalTokens: 0,
      totalCost: 0,
      totalProcessingTime: 0,
    }

    // Process documents in batches
    for (let i = 0; i < documentIds.length; i += batchSize) {
      const batch = documentIds.slice(i, i + batchSize)

      // Fetch batch of documents
      const { data: documents, error: docsError } = await supabaseClient
        .from('documents')
        .select('*')
        .in('id', batch)

      if (docsError) {
        throw new Error(`Failed to fetch documents: ${docsError.message}`)
      }

      // Process each document in the batch
      for (const document of documents || []) {
        try {
          // Skip if embedding exists and regeneration is not forced
          if (document.embedding_generated && !forceRegenerate) {
            results.skipped++
            results.details.push({
              documentId: document.id,
              status: 'skipped',
              message: 'Embedding already exists',
            })
            continue
          }

          // Validate content
          if (!document.content || document.content.trim().length === 0) {
            results.failed++
            results.details.push({
              documentId: document.id,
              status: 'failed',
              error: 'No content to embed',
            })
            continue
          }

          // Generate embedding
          const startTime = Date.now()
          const maxChars = 8000 * 4
          const truncatedContent = document.content.substring(0, maxChars)

          const embeddingResponse = await openai.embeddings.create({
            model: model,
            input: truncatedContent,
          })

          const embedding = embeddingResponse.data[0].embedding
          const processingTime = Date.now() - startTime
          const tokenCount = embeddingResponse.usage.total_tokens

          // Convert embedding array to PostgreSQL vector format
          const embeddingVector = `[${embedding.join(',')}]`

          // Update document
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
            .eq('id', document.id)

          if (updateError) {
            throw new Error(`Failed to update document: ${updateError.message}`)
          }

          // Log analytics
          await supabaseClient.from('embedding_analytics').insert({
            tenant_id: document.tenant_id,
            document_id: document.id,
            embedding_model: model,
            embedding_dimensions: embedding.length,
            token_count: tokenCount,
            processing_time_ms: processingTime,
            success: true,
            error_message: null,
          })

          const cost = calculateCost(tokenCount, model)

          results.successful++
          results.totalTokens += tokenCount
          results.totalCost += cost
          results.totalProcessingTime += processingTime
          results.details.push({
            documentId: document.id,
            status: 'success',
            tokens: tokenCount,
            processingTime,
            cost,
          })

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error: any) {
          results.failed++
          results.details.push({
            documentId: document.id,
            status: 'failed',
            error: error.message,
          })

          // Log failed analytics
          await supabaseClient.from('embedding_analytics').insert({
            tenant_id: document.tenant_id,
            document_id: document.id,
            embedding_model: model,
            embedding_dimensions: 0,
            token_count: 0,
            processing_time_ms: 0,
            success: false,
            error_message: error.message,
          })
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error in batch embedding generation:', error)

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
function calculateCost(tokens: number, model: string): number {
  const costs = {
    'text-embedding-3-small': 0.02,
    'text-embedding-3-large': 0.13,
    'text-embedding-ada-002': 0.10,
  }
  const costPer1M = costs[model as keyof typeof costs] || 0.02
  return (tokens / 1_000_000) * costPer1M
}

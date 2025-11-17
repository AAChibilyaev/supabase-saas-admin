import OpenAI from 'openai'

// Get API key from environment
const apiKey = import.meta.env.VITE_OPENAI_API_KEY

if (!apiKey) {
  console.warn(
    'VITE_OPENAI_API_KEY is not configured. Please add it to your .env file:\n' +
    'VITE_OPENAI_API_KEY=sk-your-openai-api-key'
  )
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: apiKey || '', // Provide empty string to avoid undefined error
  dangerouslyAllowBrowser: true, // Note: For production, use Edge Functions instead
})

export type EmbeddingModel = 'text-embedding-3-small' | 'text-embedding-3-large' | 'text-embedding-ada-002'

export interface EmbeddingConfig {
  model?: EmbeddingModel
  maxTokens?: number
  dimensions?: number // Optional for text-embedding-3-* models
}

export interface EmbeddingResult {
  embedding: number[] | null
  model: string
  dimensions: number
  tokens: number
  processingTime: number
  success: boolean
  error?: string
}

const DEFAULT_CONFIG: Required<EmbeddingConfig> = {
  model: 'text-embedding-3-small',
  maxTokens: 8000,
  dimensions: 1536,
}

// Model specifications
export const EMBEDDING_MODELS = {
  'text-embedding-3-small': {
    name: 'Text Embedding 3 Small',
    dimensions: 1536,
    maxTokens: 8191,
    costPer1M: 0.02,
    description: 'General purpose, cost-effective',
  },
  'text-embedding-3-large': {
    name: 'Text Embedding 3 Large',
    dimensions: 3072,
    maxTokens: 8191,
    costPer1M: 0.13,
    description: 'Higher accuracy, semantic search',
  },
  'text-embedding-ada-002': {
    name: 'Ada 002',
    dimensions: 1536,
    maxTokens: 8191,
    costPer1M: 0.10,
    description: 'Legacy, still supported',
  },
} as const

/**
 * Generate embedding for a single text string
 */
export async function generateEmbedding(
  text: string,
  config: EmbeddingConfig = {}
): Promise<EmbeddingResult> {
  const startTime = Date.now()
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  if (!apiKey) {
    return {
      embedding: null,
      model: finalConfig.model,
      dimensions: 0,
      tokens: 0,
      processingTime: Date.now() - startTime,
      success: false,
      error: 'VITE_OPENAI_API_KEY is not configured. Please add it to your .env file.',
    }
  }

  try {
    // Truncate text to max tokens (rough estimate: 1 token ≈ 4 characters)
    const maxChars = finalConfig.maxTokens * 4
    const truncatedText = text.substring(0, maxChars)

    if (!truncatedText.trim()) {
      throw new Error('Text content is empty after truncation')
    }

    const requestParams: OpenAI.EmbeddingCreateParams = {
      model: finalConfig.model,
      input: truncatedText,
    }

    // Add dimensions parameter for text-embedding-3-* models
    if (
      finalConfig.model.startsWith('text-embedding-3') &&
      finalConfig.dimensions &&
      finalConfig.dimensions !== EMBEDDING_MODELS[finalConfig.model].dimensions
    ) {
      requestParams.dimensions = finalConfig.dimensions
    }

    const response = await openai.embeddings.create(requestParams)

    const embedding = response.data[0].embedding
    const processingTime = Date.now() - startTime

    return {
      embedding,
      model: finalConfig.model,
      dimensions: embedding.length,
      tokens: response.usage.total_tokens,
      processingTime,
      success: true,
    }
  } catch (error: unknown) {
    const processingTime = Date.now(  ) - startTime
    console.error('Embedding generation failed:', error)

    return {
      embedding: null,
      model: finalConfig.model,
      dimensions: 0,
      tokens: 0,
      processingTime,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * Note: OpenAI API supports batch requests, but processes them as separate requests internally
 */
export async function generateBatchEmbeddings(
  texts: string[],
  config: EmbeddingConfig = {},
  onProgress?: (completed: number, total: number) => void
): Promise<EmbeddingResult[]> {
  const results: EmbeddingResult[] = []

  for (let i = 0; i < texts.length; i++) {
    const result = await generateEmbedding(texts[i], config)
    results.push(result)

    if (onProgress) {
      onProgress(i + 1, texts.length)
    }

    // Add small delay to avoid rate limiting
    if (i < texts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return results
}

/**
 * Calculate estimated cost for embedding generation
 */
export function calculateEmbeddingCost(
  tokens: number,
  model: EmbeddingModel = 'text-embedding-3-small'
): number {
  const costPer1M = EMBEDDING_MODELS[model].costPer1M
  return (tokens / 1_000_000) * costPer1M
}

/**
 * Estimate tokens from text (rough approximation)
 */
export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4)
}

/**
 * Check if OpenAI API key is configured
 */
export function isOpenAIConfigured(): boolean {
  return !!import.meta.env.VITE_OPENAI_API_KEY
}

/**
 * Validate OpenAI API key
 */
export async function validateOpenAIKey(): Promise<boolean> {
  try {
    // Try to list models to validate the API key
    await openai.models.list()
    return true
  } catch (error) {
    console.error('OpenAI API key validation failed:', error)
    return false
  }
}

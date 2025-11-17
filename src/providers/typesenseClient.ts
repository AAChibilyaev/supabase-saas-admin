import Typesense, { Client } from 'typesense'
import type { ConfigurationOptions } from 'typesense/lib/Typesense/Configuration'

// Validate required environment variables
const validateEnvVars = () => {
  const typesenseUrl = import.meta.env.VITE_TYPESENSE_URL
  const typesenseApiKey = import.meta.env.VITE_TYPESENSE_API_KEY

  if (!typesenseUrl || !typesenseApiKey) {
    console.warn(
      'Missing Typesense environment variables (VITE_TYPESENSE_URL or VITE_TYPESENSE_API_KEY). Typesense features will be disabled.'
    )
    return false
  }

  return true
}

// Parse additional Typesense nodes from environment (for failover support)
const parseAdditionalNodes = (): Array<{ host: string; port: number; protocol: 'http' | 'https' }> => {
  const additionalNodesStr = import.meta.env.VITE_TYPESENSE_ADDITIONAL_NODES
  if (!additionalNodesStr) {
    return []
  }

  try {
    const nodes = JSON.parse(additionalNodesStr)
    if (!Array.isArray(nodes)) {
      console.warn('VITE_TYPESENSE_ADDITIONAL_NODES must be an array')
      return []
    }
    return nodes
  } catch (error) {
    console.warn('Failed to parse VITE_TYPESENSE_ADDITIONAL_NODES:', error)
    return []
  }
}

// Create Typesense client configuration
const createTypesenseClient = (): Client | null => {
  if (!validateEnvVars()) {
    return null
  }

  // Parse URL to get host, port, protocol
  const typesenseUrl = import.meta.env.VITE_TYPESENSE_URL!
  const url = new URL(typesenseUrl)

  const primaryNode = {
    host: url.hostname,
    port: parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80),
    protocol: url.protocol.replace(':', '') as 'http' | 'https',
  }

  const additionalNodes = parseAdditionalNodes()
  const allNodes = [primaryNode, ...additionalNodes]

  // Configuration with retry mechanism and health checks
  const config: ConfigurationOptions = {
    nodes: allNodes,
    apiKey: import.meta.env.VITE_TYPESENSE_API_KEY!,
    connectionTimeoutSeconds: 10,
    numRetries: 3,
    retryIntervalSeconds: 0.1,
    healthcheckIntervalSeconds: 60,
    logLevel: 'info',
  }

  try {
    const client = new Typesense.Client(config)
    console.info('Typesense client initialized successfully', {
      nodes: allNodes.map((n) => `${n.protocol}://${n.host}:${n.port}`),
      retryConfig: {
        numRetries: config.numRetries,
        retryIntervalSeconds: config.retryIntervalSeconds,
      },
    })
    return client
  } catch (error) {
    console.error('Failed to initialize Typesense client:', error)
    return null
  }
}

// Export the client instance
export const typesenseClient = createTypesenseClient()

// Optional: SearchClient for frontend (with caching)
export const createTypesenseSearchClient = () => {
  if (!validateEnvVars()) {
    return null
  }

  try {
    const typesenseUrl = import.meta.env.VITE_TYPESENSE_URL!
    const url = new URL(typesenseUrl)

    return new Typesense.SearchClient({
      nodes: [{
        host: url.hostname,
        port: parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80),
        protocol: url.protocol.replace(':', '') as 'http' | 'https',
      }],
      apiKey: import.meta.env.VITE_TYPESENSE_SEARCH_API_KEY || import.meta.env.VITE_TYPESENSE_API_KEY!,
      connectionTimeoutSeconds: 2,
      cacheSearchResultsForSeconds: 300, // Cache for 5 minutes
    })
  } catch (error) {
    console.error('Failed to initialize Typesense SearchClient:', error)
    return null
  }
}

export const typesenseSearchClient = createTypesenseSearchClient()

// Check if Typesense is enabled
export const isTypesenseEnabled = (): boolean => {
  return typesenseClient !== null
}

// Retry mechanism with exponential backoff
export interface RetryOptions {
  maxRetries?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
}

export const withRetry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
  } = options

  let lastError: Error | undefined
  let currentDelay = initialDelayMs

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break
      }

      // Log retry attempt
      console.warn(
        `Operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${currentDelay}ms...`,
        error
      )

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, currentDelay))

      // Increase delay with exponential backoff, capped at maxDelayMs
      currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelayMs)
    }
  }

  throw lastError || new Error('Operation failed after retries')
}

// Type definitions for Typesense operations
export interface TypesenseSearchParams {
  q: string
  query_by: string
  filter_by?: string
  sort_by?: string
  per_page?: number
  page?: number
  facet_by?: string
  max_facet_values?: number
  num_typos?: number
  prefix?: boolean
  drop_tokens_threshold?: number
  typo_tokens_threshold?: number
  highlight_full_fields?: string
  include_fields?: string
  exclude_fields?: string
}

export interface TypesenseDocument {
  id: string
  [key: string]: unknown
}

export interface TypesenseSearchResult<T = TypesenseDocument> {
  found: number
  hits: Array<{
    document: T
    highlights?: Array<{
      field: string
      snippet: string
      matched_tokens: string[]
    }>
    text_match: number
  }>
  facet_counts?: Array<{
    field_name: string
    counts: Array<{
      value: string
      count: number
    }>
  }>
  search_time_ms: number
  page: number
}

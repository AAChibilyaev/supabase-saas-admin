import type { DataProvider } from 'react-admin'
import { dataProvider as supabaseDataProvider } from './dataProvider'
import { typesenseDataProvider } from './typesenseDataProvider'
import {
  typesenseClient,
  isTypesenseEnabled,
  withRetry,
  type TypesenseSearchParams,
  type TypesenseSearchResult,
} from './typesenseClient'

/**
 * Configuration for Typesense-enabled resources
 */
export interface TypesenseResourceConfig {
  collectionName: string
  searchFields: string[] // Fields to search in
  filterFields?: string[] // Fields that can be filtered
  sortFields?: string[] // Fields that can be sorted
  facetFields?: string[] // Fields for faceting
}

/**
 * Map of resources that use Typesense for search
 */
const TYPESENSE_RESOURCES: Record<string, TypesenseResourceConfig> = {
  documents: {
    collectionName: 'documents',
    searchFields: ['title', 'content', 'url'],
    filterFields: ['tenant_id', 'status', 'created_at'],
    sortFields: ['created_at', 'updated_at', 'title'],
    facetFields: ['status', 'tenant_id'],
  },
  search_logs: {
    collectionName: 'search_logs',
    searchFields: ['query', 'user_id'],
    filterFields: ['tenant_id', 'created_at', 'result_count'],
    sortFields: ['created_at', 'result_count'],
    facetFields: ['tenant_id'],
  },
  // Add more resources here as needed
}

/**
 * Check if a resource uses Typesense for search
 */
const isTypesenseResource = (resource: string): boolean => {
  return resource in TYPESENSE_RESOURCES
}

/**
 * Get Typesense configuration for a resource
 */
const getTypesenseConfig = (resource: string): TypesenseResourceConfig | null => {
  return TYPESENSE_RESOURCES[resource] || null
}

/**
 * Convert React Admin filter to Typesense filter format
 */
const buildTypesenseFilter = (
  filter: Record<string, unknown>,
  config: TypesenseResourceConfig
): string | undefined => {
  const filters: string[] = []

  Object.entries(filter).forEach(([key, value]) => {
    // Skip search query (handled separately)
    if (key === 'q') return

    // Only allow configured filter fields
    if (config.filterFields && !config.filterFields.includes(key)) {
      console.warn(`Field ${key} is not configured for filtering`)
      return
    }

    if (value === null || value === undefined) {
      return
    }

    // Handle different value types
    if (Array.isArray(value)) {
      // Array: field:[value1, value2]
      const escapedValues = value.map((v) => `\`${String(v)}\``)
      filters.push(`${key}:[${escapedValues.join(',')}]`)
    } else if (typeof value === 'string') {
      // String: field:=value or field:value (for contains)
      filters.push(`${key}:=\`${value}\``)
    } else if (typeof value === 'number') {
      // Number: field:=value
      filters.push(`${key}:=${value}`)
    } else if (typeof value === 'boolean') {
      // Boolean: field:=true/false
      filters.push(`${key}:=${value}`)
    } else if (typeof value === 'object' && value !== null) {
      // Range queries: { gte: X, lte: Y }
      const rangeValue = value as Record<string, unknown>
      if ('gte' in rangeValue && rangeValue.gte !== undefined) {
        filters.push(`${key}:>=${rangeValue.gte}`)
      }
      if ('lte' in rangeValue && rangeValue.lte !== undefined) {
        filters.push(`${key}:<=${rangeValue.lte}`)
      }
      if ('gt' in rangeValue && rangeValue.gt !== undefined) {
        filters.push(`${key}:>${rangeValue.gt}`)
      }
      if ('lt' in rangeValue && rangeValue.lt !== undefined) {
        filters.push(`${key}:<${rangeValue.lt}`)
      }
    }
  })

  return filters.length > 0 ? filters.join(' && ') : undefined
}

/**
 * Convert React Admin sort to Typesense sort format
 */
const buildTypesenseSort = (
  sort: { field: string; order: string },
  config: TypesenseResourceConfig
): string | undefined => {
  // Only allow configured sort fields
  if (config.sortFields && !config.sortFields.includes(sort.field)) {
    console.warn(`Field ${sort.field} is not configured for sorting`)
    return undefined
  }

  const order = sort.order.toLowerCase() === 'asc' ? 'asc' : 'desc'
  return `${sort.field}:${order}`
}

/**
 * Perform a search using Typesense
 */
const searchWithTypesense = async (
  resource: string,
  params: {
    pagination: { page: number; perPage: number }
    sort: { field: string; order: string }
    filter: Record<string, unknown>
  }
) => {
  if (!isTypesenseEnabled() || !typesenseClient) {
    throw new Error('Typesense is not enabled')
  }

  const config = getTypesenseConfig(resource)
  if (!config) {
    throw new Error(`No Typesense configuration found for resource: ${resource}`)
  }

  // Extract search query
  const searchQuery = params.filter.q as string | undefined
  if (!searchQuery || searchQuery.trim() === '') {
    // If no search query, use wildcard
    return null // Fall back to Supabase
  }

  try {
    // Build Typesense search parameters
    const searchParams: TypesenseSearchParams = {
      q: searchQuery,
      query_by: config.searchFields.join(','),
      filter_by: buildTypesenseFilter(params.filter, config),
      sort_by: buildTypesenseSort(params.sort, config),
      per_page: params.pagination.perPage,
      page: params.pagination.page,
      facet_by: config.facetFields?.join(','),
      num_typos: 2, // Allow up to 2 typos
      prefix: true, // Enable prefix searching
      drop_tokens_threshold: 1,
      typo_tokens_threshold: 1,
    }

    // Perform search with retry
    const result = await withRetry(
      async () => {
        return await typesenseClient!
          .collections(config.collectionName)
          .documents()
          .search(searchParams)
      },
      {
        maxRetries: 2,
        initialDelayMs: 500,
      }
    )

    // Convert Typesense result to React Admin format
    const data = result.hits?.map((hit: TypesenseSearchResult['hits'][number]) => hit.document) || []
    const total = result.found || 0

    return {
      data: data as any,
      total,
    }
  } catch (error) {
    console.error(`Typesense search failed for ${resource}:`, error)
    // Fall back to Supabase on error
    return null
  }
}

/**
 * Check if a resource is a native Typesense resource (not a collection)
 */
const isNativeTypesenseResource = (resource: string): boolean => {
  return resource.startsWith('typesense-') || resource === 'presets'
}

/**
 * Create composite data provider that uses Typesense for search and Supabase for everything else
 */
export const createCompositeDataProvider = (): DataProvider => {
  return {
    // Use Typesense for getList if search query is present or for native Typesense resources
    getList: async (resource, params) => {
      // Route native Typesense resources to typesenseDataProvider
      if (isNativeTypesenseResource(resource)) {
        return typesenseDataProvider.getList(resource, params)
      }

      // Check if this resource supports Typesense search
      if (
        isTypesenseEnabled() &&
        isTypesenseResource(resource) &&
        params.filter?.q
      ) {
        const typesenseResult = await searchWithTypesense(resource, {
          pagination: { page: params.pagination?.page ?? 1, perPage: params.pagination?.perPage ?? 10 },
          sort: { field: params.sort?.field ?? '', order: params.sort?.order ?? 'asc' },
          filter: params.filter ?? {},
        })

        // If Typesense search succeeded, return the result
        if (typesenseResult) {
          return typesenseResult as unknown as GetListResult<any>
        }
      }

      // Fall back to Supabase
      return supabaseDataProvider.getList(resource, params)
    },

    // Route operations based on resource type
    getOne: (resource, params) => {
      if (isNativeTypesenseResource(resource)) {
        return typesenseDataProvider.getOne(resource, params)
      }
      return supabaseDataProvider.getOne(resource, params)
    },

    getMany: (resource, params) => {
      if (isNativeTypesenseResource(resource)) {
        return typesenseDataProvider.getMany(resource, params)
      }
      return supabaseDataProvider.getMany(resource, params)
    },

    getManyReference: (resource, params) =>
      supabaseDataProvider.getManyReference(resource, params),

    create: (resource, params) => {
      if (isNativeTypesenseResource(resource)) {
        return typesenseDataProvider.create(resource, params)
      }
      return supabaseDataProvider.create(resource, params)
    },

    update: (resource, params) => {
      if (isNativeTypesenseResource(resource)) {
        return typesenseDataProvider.update(resource, params)
      }
      return supabaseDataProvider.update(resource, params)
    },

    updateMany: (resource, params) => {
      if (isNativeTypesenseResource(resource)) {
        return typesenseDataProvider.updateMany(resource, params)
      }
      return supabaseDataProvider.updateMany(resource, params)
    },

    delete: (resource, params) => {
      if (isNativeTypesenseResource(resource)) {
        return typesenseDataProvider.delete(resource, params)
      }
      return supabaseDataProvider.delete(resource, params)
    },

    deleteMany: (resource, params) => {
      if (isNativeTypesenseResource(resource)) {
        return typesenseDataProvider.deleteMany(resource, params)
      }
      return supabaseDataProvider.deleteMany(resource, params)
    },
  }
}

/**
 * Export the composite data provider instance
 */
export const compositeDataProvider = createCompositeDataProvider()

/**
 * Helper function to add a resource to Typesense configuration
 */
export const registerTypesenseResource = (
  resource: string,
  config: TypesenseResourceConfig
): void => {
  TYPESENSE_RESOURCES[resource] = config
  console.info(`Registered Typesense resource: ${resource}`, config)
}

/**
 * Helper function to get all registered Typesense resources
 */
export const getTypesenseResources = (): string[] => {
  return Object.keys(TYPESENSE_RESOURCES)
}

/**
 * Helper function to check Typesense availability
 */
export const checkTypesenseAvailability = async (): Promise<{
  available: boolean
  collections: string[]
  error?: string
}> => {
  if (!isTypesenseEnabled() || !typesenseClient) {
    return {
      available: false,
      collections: [],
      error: 'Typesense client is not initialized',
    }
  }

  try {
    const collections = await typesenseClient.collections().retrieve()
    return {
      available: true,
      collections: (collections as any[]).map((c: any) => c.name ?? ''),
    }
  } catch (error: unknown) {
    return {
      available: false,
      collections: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

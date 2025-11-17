// Typesense Collection Types
// Based on Typesense API: https://typesense.org/docs/api/collections.html

export type FieldType =
  | 'string'
  | 'int32'
  | 'int64'
  | 'float'
  | 'bool'
  | 'geopoint'
  | 'geopoint[]'
  | 'string[]'
  | 'int32[]'
  | 'int64[]'
  | 'float[]'
  | 'bool[]'
  | 'object'
  | 'object[]'
  | 'auto'
  | 'string*'
  | 'image'

export interface CollectionField {
  name: string
  type: FieldType
  facet?: boolean
  optional?: boolean
  index?: boolean
  sort?: boolean
  infix?: boolean
  locale?: string
  stem?: boolean
  store?: boolean
  embed?: {
    from?: string[]
    model_config?: {
      model_name: string
      [key: string]: any
    }
  }
}

export interface CollectionSchema {
  name: string
  fields: CollectionField[]
  default_sorting_field?: string
  enable_nested_fields?: boolean
  token_separators?: string[]
  symbols_to_index?: string[]
  metadata?: Record<string, any>
}

export interface CollectionResponse extends CollectionSchema {
  created_at: number
  num_documents: number
  num_memory_shards?: number
}

export interface CollectionListResponse {
  collections: CollectionResponse[]
}

// Schema Update Types
export interface CollectionUpdateSchema {
  fields: CollectionField[]
  drop_tokens?: string[]
  add_tokens?: string[]
}

// Validation Types
export interface FieldValidationError {
  field: string
  message: string
}

export interface SchemaValidationResult {
  valid: boolean
  errors: FieldValidationError[]
}

// UI Helper Types
export interface FieldFormData {
  name: string
  type: FieldType
  facet: boolean
  optional: boolean
  index: boolean
  sort: boolean
  infix: boolean
}

// Typesense API Error
export interface TypesenseError {
  message: string
  httpStatus?: number
}

// ==========================================
// Multi-Search and Advanced Search Types
// ==========================================

export interface TypesenseNode {
  host: string
  port: number
  protocol: 'http' | 'https'
}

export interface TypesenseConfig {
  nodes: TypesenseNode[]
  apiKey: string
  connectionTimeoutSeconds?: number
  numRetries?: number
  retryIntervalSeconds?: number
  healthcheckIntervalSeconds?: number
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
  cacheSearchResultsForSeconds?: number
}

// Search Request Types
export interface SearchParams {
  q: string
  query_by: string
  filter_by?: string
  sort_by?: string
  facet_by?: string
  max_facet_values?: number
  facet_query?: string
  num_typos?: number | string
  page?: number
  per_page?: number
  group_by?: string
  group_limit?: number
  include_fields?: string
  exclude_fields?: string
  highlight_full_fields?: string
  highlight_affix_num_tokens?: number
  highlight_start_tag?: string
  highlight_end_tag?: string
  snippet_threshold?: number
  drop_tokens_threshold?: number
  typo_tokens_threshold?: number
  pinned_hits?: string
  hidden_hits?: string
  enable_overrides?: boolean
  pre_segmented_query?: boolean
  vector_query?: string
  limit_hits?: number
  search_cutoff_ms?: number
  exhaustive_search?: boolean
  infix?: 'off' | 'always' | 'fallback'
  prefix?: boolean | string
  split_join_tokens?: 'off' | 'fallback' | 'always'
  text_match_type?: 'max_score' | 'max_weight'
}

export interface MultiSearchRequest {
  searches: Array<{
    collection: string
  } & SearchParams>
}

// Search Result Types
export interface SearchResultHit<T = any> {
  document: T
  highlights?: Array<{
    field: string
    snippet?: string
    snippets?: string[]
    matched_tokens: string[]
    value?: string
  }>
  text_match?: number
  text_match_info?: {
    best_field_score: string
    best_field_weight: number
    fields_matched: number
    score: string
    tokens_matched: number
  }
  geo_distance_meters?: number
  vector_distance?: number
}

export interface FacetCount {
  counts: Array<{
    count: number
    highlighted: string
    value: string
  }>
  field_name: string
  stats: {
    avg?: number
    max?: number
    min?: number
    sum?: number
    total_values?: number
  }
}

export interface SearchResult<T = any> {
  facet_counts?: FacetCount[]
  found: number
  hits?: SearchResultHit<T>[]
  out_of: number
  page: number
  request_params: {
    collection_name: string
    per_page: number
    q: string
  }
  search_time_ms: number
  search_cutoff?: boolean
  grouped_hits?: Array<{
    group_key: string[]
    hits: SearchResultHit<T>[]
  }>
}

export interface MultiSearchResult {
  results: SearchResult[]
}

// UI State Types
export interface SearchQuery {
  id: string
  collection: string
  query: string
  queryBy: string[]
  filterBy: FilterCondition[]
  sortBy: SortOption[]
  facetBy: string[]
  maxFacetValues: number
  perPage: number
  enabled: boolean
}

export interface FilterCondition {
  id: string
  field: string
  operator: '=' | '!=' | '>' | '>=' | '<' | '<=' | ':' | ':=' | 'in' | 'range'
  value: string | number | boolean | [number, number]
  logicalOperator?: 'AND' | 'OR'
}

export interface SortOption {
  field: string
  order: 'asc' | 'desc'
}

export interface FacetValue {
  value: string
  count: number
  highlighted: string
  selected: boolean
}

export interface Facet {
  fieldName: string
  values: FacetValue[]
  stats?: {
    avg?: number
    max?: number
    min?: number
    sum?: number
  }
}

export interface SearchResultsState {
  results: MultiSearchResult | null
  loading: boolean
  error: string | null
  performanceMetrics: {
    totalTime: number
    searchTimes: Array<{
      collection: string
      time: number
    }>
  }
}

// Search Preset Types
export interface SearchPreset {
  id: string
  name: string
  description?: string
  queries: SearchQuery[]
  createdAt: string
  updatedAt: string
}

// Performance Metrics
export interface PerformanceMetrics {
  totalResponseTime: number
  searchTimes: Record<string, number>
  facetComputeTime?: number
  highlightTime?: number
  networkLatency?: number
}

// Export Configuration
export interface SearchConfiguration {
  version: string
  queries: SearchQuery[]
  facetFilters?: Record<string, string[]>
  sortOptions?: SortOption[]
  exportedAt: string
}

// Query Builder Types
export interface QueryBuilderField {
  name: string
  label: string
  type: FieldType
  facetable: boolean
  sortable: boolean
}

export interface QueryBuilderCollection {
  name: string
  fields: QueryBuilderField[]
}

// ==========================================
// Collection Aliases Types
// ==========================================

export interface CollectionAlias {
  name: string
  collection_name: string
}

export interface CollectionAliasSchema {
  collection_name: string
}

export interface AliasListResponse {
  aliases: CollectionAlias[]
}

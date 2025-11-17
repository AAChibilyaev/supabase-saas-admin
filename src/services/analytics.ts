import { supabaseClient } from '../providers/supabaseClient'
import { subDays, subMonths, format } from 'date-fns'

export interface TenantGrowthData {
  date: string
  total_tenants: number
  new_tenants: number
  active_tenants: number
  free_count: number
  pro_count: number
  scale_count: number
}

export interface SearchPerformanceData {
  date: string
  search_count: number
  avg_response_time: number
  results_count_avg: number
  success_rate: number
}

export interface StorageUsageData {
  tenant_id: string
  tenant_name: string
  storage_used_bytes: number
  storage_limit_bytes: number
  percentage: number
  documents_count: number
}

export interface ApiUsageData {
  date: string
  api_calls_count: number
  search_count: number
  document_count: number
  unique_users_count: number
  error_count: number
}

export interface EmbeddingStatsData {
  date: string
  embeddings_generated: number
  success_count: number
  failure_count: number
  avg_processing_time_ms: number
  total_tokens_used: number
}

export interface SearchHeatmapData {
  hour: number
  day: string
  search_count: number
}

export interface PlanDistributionData {
  plan: string
  count: number
  revenue: number
  percentage: number
}

/**
 * Get tenant growth data with plan distribution
 */
export async function getTenantGrowth(days: number = 30): Promise<TenantGrowthData[]> {
  try {
    const startDate = subDays(new Date(), days)

    const { data: tenants, error } = await supabaseClient
      .from('tenants')
      .select('created_at, plan_type')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error

    // Group by date and calculate cumulative totals
    const groupedData = new Map<string, TenantGrowthData>()
    let cumulativeTotal = 0
    let cumulativeFree = 0
    let cumulativePro = 0
    let cumulativeScale = 0

    tenants?.forEach((tenant) => {
      const date = format(new Date(tenant.created_at), 'yyyy-MM-dd')

      if (!groupedData.has(date)) {
        groupedData.set(date, {
          date,
          total_tenants: 0,
          new_tenants: 0,
          active_tenants: 0,
          free_count: 0,
          pro_count: 0,
          scale_count: 0
        })
      }

      const dayData = groupedData.get(date)!
      dayData.new_tenants++

      // Update cumulative counts
      cumulativeTotal++
      if (tenant.plan_type === 'free') cumulativeFree++
      else if (tenant.plan_type === 'pro') cumulativePro++
      else if (tenant.plan_type === 'scale') cumulativeScale++

      dayData.total_tenants = cumulativeTotal
      dayData.free_count = cumulativeFree
      dayData.pro_count = cumulativePro
      dayData.scale_count = cumulativeScale
      dayData.active_tenants = Math.floor(cumulativeTotal * 0.85) // Estimate 85% active
    })

    return Array.from(groupedData.values())
  } catch (error) {
    console.error('Error fetching tenant growth:', error)
    return []
  }
}

/**
 * Get search performance metrics
 */
export async function getSearchPerformance(days: number = 7): Promise<SearchPerformanceData[]> {
  try {
    const startDate = subDays(new Date(), days)

    const { data: searchLogs, error } = await supabaseClient
      .from('search_logs')
      .select('created_at, response_time_ms, results_count')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error

    // Group by date and calculate averages
    const groupedData = new Map<string, {
      date: string
      search_count: number
      total_response_time: number
      total_results: number
      success_count: number
    }>()

    searchLogs?.forEach((log) => {
      const date = format(new Date(log.created_at), 'yyyy-MM-dd')

      if (!groupedData.has(date)) {
        groupedData.set(date, {
          date,
          search_count: 0,
          total_response_time: 0,
          total_results: 0,
          success_count: 0
        })
      }

      const dayData = groupedData.get(date)!
      dayData.search_count++
      dayData.total_response_time += log.response_time_ms || 0
      dayData.total_results += log.results_count || 0
      if (log.results_count > 0) dayData.success_count++
    })

    return Array.from(groupedData.values()).map(day => ({
      date: day.date,
      search_count: day.search_count,
      avg_response_time: day.search_count > 0 ? Math.round(day.total_response_time / day.search_count) : 0,
      results_count_avg: day.search_count > 0 ? Math.round(day.total_results / day.search_count) : 0,
      success_rate: day.search_count > 0 ? Math.round((day.success_count / day.search_count) * 100) : 0
    }))
  } catch (error) {
    console.error('Error fetching search performance:', error)
    return []
  }
}

/**
 * Get storage usage by tenant
 */
export async function getStorageUsage(): Promise<StorageUsageData[]> {
  try {
    const { data: tenantUsage, error: usageError } = await supabaseClient
      .from('tenant_usage')
      .select('tenant_id, total_storage_bytes, plan_max_storage_mb, documents_count')
      .order('total_storage_bytes', { ascending: false })
      .limit(20)

    if (usageError) throw usageError

    const { data: tenants, error: tenantsError } = await supabaseClient
      .from('tenants')
      .select('id, name')

    if (tenantsError) throw tenantsError

    const tenantMap = new Map(tenants?.map(t => [t.id, t.name]))

    return tenantUsage?.map(usage => {
      const limitBytes = (usage.plan_max_storage_mb || 100) * 1024 * 1024
      return {
        tenant_id: usage.tenant_id,
        tenant_name: tenantMap.get(usage.tenant_id) || 'Unknown',
        storage_used_bytes: usage.total_storage_bytes || 0,
        storage_limit_bytes: limitBytes,
        percentage: limitBytes > 0 ? Math.round((usage.total_storage_bytes / limitBytes) * 100) : 0,
        documents_count: usage.documents_count || 0
      }
    }) || []
  } catch (error) {
    console.error('Error fetching storage usage:', error)
    return []
  }
}

/**
 * Get API usage statistics
 */
export async function getApiUsage(days: number = 30): Promise<ApiUsageData[]> {
  try {
    const startDate = subDays(new Date(), days)

    const { data: dailyStats, error } = await supabaseClient
      .from('daily_usage_stats')
      .select('date, api_calls_count, search_count, document_count, unique_users_count')
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .order('date', { ascending: true })

    if (error) throw error

    return dailyStats?.map(stat => ({
      date: stat.date,
      api_calls_count: stat.api_calls_count || 0,
      search_count: stat.search_count || 0,
      document_count: stat.document_count || 0,
      unique_users_count: stat.unique_users_count || 0,
      error_count: Math.floor(Math.random() * 10) // Mock error count for now
    })) || []
  } catch (error) {
    console.error('Error fetching API usage:', error)
    return []
  }
}

/**
 * Get embedding generation statistics
 */
export async function getEmbeddingStats(days: number = 30): Promise<EmbeddingStatsData[]> {
  try {
    const startDate = subDays(new Date(), days)

    // Query documents with embeddings
    const { data: documents, error } = await supabaseClient
      .from('documents')
      .select('created_at, embedding_generated, file_size')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error

    // Group by date
    const groupedData = new Map<string, {
      date: string
      total: number
      success: number
      failure: number
      total_size: number
    }>()

    documents?.forEach((doc) => {
      const date = format(new Date(doc.created_at), 'yyyy-MM-dd')

      if (!groupedData.has(date)) {
        groupedData.set(date, {
          date,
          total: 0,
          success: 0,
          failure: 0,
          total_size: 0
        })
      }

      const dayData = groupedData.get(date)!
      dayData.total++
      if (doc.embedding_generated) {
        dayData.success++
      } else {
        dayData.failure++
      }
      dayData.total_size += doc.file_size || 0
    })

    return Array.from(groupedData.values()).map(day => ({
      date: day.date,
      embeddings_generated: day.total,
      success_count: day.success,
      failure_count: day.failure,
      avg_processing_time_ms: Math.floor(Math.random() * 500 + 100), // Mock processing time
      total_tokens_used: Math.floor(day.total_size / 4) // Rough estimate: 1 token ≈ 4 chars
    }))
  } catch (error) {
    console.error('Error fetching embedding stats:', error)
    return []
  }
}

/**
 * Get search activity heatmap (by hour and day)
 */
export async function getSearchHeatmap(days: number = 7): Promise<SearchHeatmapData[]> {
  try {
    const startDate = subDays(new Date(), days)

    const { data: searchLogs, error } = await supabaseClient
      .from('search_logs')
      .select('created_at')
      .gte('created_at', startDate.toISOString())

    if (error) throw error

    // Group by day and hour
    const heatmapData = new Map<string, number>()

    searchLogs?.forEach((log) => {
      const timestamp = new Date(log.created_at)
      const day = format(timestamp, 'EEE') // Mon, Tue, etc.
      const hour = timestamp.getHours()
      const key = `${day}-${hour}`

      heatmapData.set(key, (heatmapData.get(key) || 0) + 1)
    })

    const result: SearchHeatmapData[] = []
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    daysOfWeek.forEach(day => {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${day}-${hour}`
        result.push({
          day,
          hour,
          search_count: heatmapData.get(key) || 0
        })
      }
    })

    return result
  } catch (error) {
    console.error('Error fetching search heatmap:', error)
    return []
  }
}

/**
 * Get top search queries
 */
export async function getTopSearchQueries(limit: number = 10): Promise<Array<{ query: string; count: number }>> {
  try {
    const { data: searchLogs, error } = await supabaseClient
      .from('search_logs')
      .select('query')
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) throw error

    // Count query frequencies
    const queryCounts = new Map<string, number>()

    searchLogs?.forEach((log) => {
      const query = log.query?.toLowerCase().trim()
      if (query) {
        queryCounts.set(query, (queryCounts.get(query) || 0) + 1)
      }
    })

    return Array.from(queryCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  } catch (error) {
    console.error('Error fetching top queries:', error)
    return []
  }
}

/**
 * Subscribe to real-time updates for analytics
 */
export function subscribeToAnalyticsUpdates(
  table: 'search_logs' | 'documents' | 'tenants',
  callback: () => void
) {
  const subscription = supabaseClient
    .channel(`analytics-${table}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table
      },
      () => {
        callback()
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}

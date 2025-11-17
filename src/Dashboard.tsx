import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Badge } from './components/ui/badge'
import { Alert, AlertDescription } from './components/ui/alert'
import { useGetList } from 'react-admin'
import { useState, useEffect, useMemo } from 'react'
import { Activity, Users, FileText, Search, TrendingUp, AlertCircle, Shield } from 'lucide-react'
import { useRBAC } from './hooks/useRBAC'
import { RoleGate } from './components/permissions'
import { subDays } from 'date-fns'
import type { Database } from './types/database.types'
import type { TenantGrowthData } from './services/analytics'

// Import dashboard components
import { DateRangeSelector, type DateRange } from './components/dashboard/DateRangeSelector'
import { TenantGrowthChart } from './components/dashboard/TenantGrowthChart'
import { SearchVolumeChart, type SearchVolumeData } from './components/dashboard/SearchVolumeChart'
import { StorageUsageChart, type StorageUsageData } from './components/dashboard/StorageUsageChart'
import { ApiUsageChart, type ApiUsageData } from './components/dashboard/ApiUsageChart'
import { ExportData } from './components/dashboard/ExportData'
import { TypesenseHealthWidget } from './components/dashboard/TypesenseHealthWidget'
import { EmbeddingStatsChart } from './components/dashboard/EmbeddingStatsChart'
import { PlanDistributionChart } from './components/dashboard/PlanDistributionChart'
import { SearchHeatmapChart } from './components/dashboard/SearchHeatmapChart'

// Import analytics services
import {
  getEmbeddingStats,
  getSearchHeatmap,
  type EmbeddingStatsData,
  type SearchHeatmapData,
  type PlanDistributionData
} from './services/analytics'

// Import real-time hook
import { useRealtimeAnalytics } from './hooks/useRealtimeAnalytics'

interface StatsData {
  totalTenants: number
  totalDocuments: number
  totalSearches: number
  activeUsers: number
  tenantGrowth: number
  searchGrowth: number
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  description
}: {
  title: string
  value: string | number
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  trend?: number
  description: string
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">
        {trend !== undefined && (
          <span className={trend >= 0 ? 'text-green-600' : 'text-red-600'}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}{' '}
        {description}
      </p>
    </CardContent>
  </Card>
)

// Define proper types for data
interface TenantData {
  id: string
  name: string
  slug: string
  plan_type: string
}

interface DocumentData {
  id: string
  title: string
  created_at: string
  embedding_generated: boolean
  file_type?: string
}

interface SearchLogData {
  id: string
  query: string
  created_at: string
  results_count: number
  response_time_ms: number
}

interface DailyStatsData {
  unique_users_count: number
  search_count: number
  api_calls_count: number
  document_count: number
  date: string
}

type TenantUsageDashboardRow = Database['public']['Views']['tenant_usage_dashboard']['Row']

export const Dashboard = () => {
  const { role, isOwner } = useRBAC()
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  })

  const [chartData, setChartData] = useState<{
    tenantGrowth: TenantGrowthData[]
    searchVolume: SearchVolumeData[]
    storageUsage: StorageUsageData[]
    apiUsage: ApiUsageData[]
    embeddingStats: EmbeddingStatsData[]
    searchHeatmap: SearchHeatmapData[]
    planDistribution: PlanDistributionData[]
  }>({
    tenantGrowth: [],
    searchVolume: [],
    storageUsage: [],
    apiUsage: [],
    embeddingStats: [],
    searchHeatmap: [],
    planDistribution: []
  })

  // Get real data from Supabase
  const { data: tenants, isLoading: tenantsLoading } = useGetList('tenants', {
    pagination: { page: 1, perPage: 100 }
  })

  const { data: documents, isLoading: documentsLoading } = useGetList('documents', {
    pagination: { page: 1, perPage: 100 }
  })

  const { data: searchLogs, isLoading: searchLogsLoading } = useGetList('search_logs', {
    pagination: { page: 1, perPage: 100 }
  })

  const { data: userTenants, isLoading: userTenantsLoading } = useGetList('user_tenants', {
    pagination: { page: 1, perPage: 100 }
  })

  // Get daily usage stats for trends
  const { data: dailyStats, isLoading: dailyStatsLoading } = useGetList('daily_usage_stats', {
    pagination: { page: 1, perPage: 90 },
    sort: { field: 'date', order: 'ASC' }
  })

  const { data: tenantUsage, isLoading: tenantUsageLoading } = useGetList('tenant_usage', {
    pagination: { page: 1, perPage: 100 }
  })

  // Calculate growth trends function
  const calculateGrowth = (data: DailyStatsData[], field: keyof DailyStatsData): number => {
    if (!data || data.length < 2) return 0
    const recent = data.slice(0, 7).reduce((sum, item) => sum + (Number(item[field]) || 0), 0)
    const previous = data.slice(7, 14).reduce((sum, item) => sum + (Number(item[field]) || 0), 0)
    if (previous === 0) return 0
    return Math.round(((recent - previous) / previous) * 100)
  }

  // Calculate stats using useMemo to avoid setState in useEffect
  const stats: StatsData = useMemo(() => {
    const tenantData = tenants as TenantData[] || []
    const documentData = documents as DocumentData[] || []
    const searchLogData = searchLogs as SearchLogData[] || []
    const userTenantData = userTenants || []
    const dailyStatsData = dailyStats as DailyStatsData[] || []

    return {
      totalTenants: tenantData.length,
      totalDocuments: documentData.length,
      totalSearches: searchLogData.length,
      activeUsers: userTenantData.length,
      tenantGrowth: calculateGrowth(dailyStatsData, 'unique_users_count'),
      searchGrowth: calculateGrowth(dailyStatsData, 'search_count')
    }
  }, [tenants, documents, searchLogs, userTenants, dailyStats])

  // Fetch and process chart data
  useEffect(() => {
    const fetchChartData = async () => {
      const dailyStatsRows = (dailyStats as DailyStatsData[] | undefined) ?? []
      const tenantUsageRows = (tenantUsage as TenantUsageDashboardRow[] | undefined) ?? []
      const tenantRows = (tenants as TenantData[] | undefined) ?? []

      if (dailyStatsRows.length === 0) return

      // Process Tenant Growth Data
      const tenantGrowthData: TenantGrowthData[] = []
      let cumulativeTenants = 0

      dailyStatsRows.forEach((stat) => {
        cumulativeTenants += Number(stat.unique_users_count) || 0
        tenantGrowthData.push({
          date: stat.date,
          total_tenants: cumulativeTenants,
          new_tenants: Number(stat.unique_users_count) || 0,
          active_tenants: Math.floor(cumulativeTenants * 0.8), // Estimate active as 80%
          free_count: 0,
          pro_count: 0,
          scale_count: 0
        })
      })

      // Process Search Volume Data
      const searchVolumeData: SearchVolumeData[] = dailyStatsRows.map((stat) => ({
        date: stat.date,
        search_count: Number(stat.search_count) || 0,
        avg_response_time: Math.floor(Math.random() * 100 + 50), // Mock data for response time
        results_count_avg: Math.floor(Math.random() * 20 + 5) // Mock data for avg results
      }))

      // Process Storage Usage Data
      const storageUsageData: StorageUsageData[] = tenantUsageRows.map((usage: TenantUsageDashboardRow, index) => ({
        tenant_name: usage.plan_display_name || `Tenant ${index + 1}`,
        storage_used_mb: Number(usage.storage_used_mb) / (1024 * 1024) || 0,
        storage_limit_mb: Number(usage.storage_limit_mb) || 100,
        percentage: usage.storage_limit_mb
          ? Math.round((Number(usage.storage_used_mb) / (1024 * 1024) / Number(usage.storage_limit_mb)) * 100)
          : 0
      }))

      // Process API Usage Data
      const apiUsageData: ApiUsageData[] = dailyStatsRows.map((stat) => ({
        date: stat.date,
        api_calls_count: Number(stat.api_calls_count) || 0,
        search_count: Number(stat.search_count) || 0,
        document_count: Number(stat.document_count) || 0,
        unique_users_count: Number(stat.unique_users_count) || 0
      }))

      // Fetch additional analytics data
      const embeddingStatsData = await getEmbeddingStats(30)
      const searchHeatmapData = await getSearchHeatmap(7)

      // Calculate plan distribution
      const planCounts = new Map<string, { count: number; revenue: number }>()
      const planPrices: Record<string, number> = { free: 0, pro: 29, scale: 99, enterprise: 299 }

      tenantRows.forEach((tenant) => {
        const plan = tenant.plan_type || 'free'
        if (!planCounts.has(plan)) {
          planCounts.set(plan, { count: 0, revenue: 0 })
        }
        const planData = planCounts.get(plan)!
        planData.count++
        planData.revenue += planPrices[plan] || 0
      })

      const totalTenants = tenantRows.length || 1
      const planDistributionData: PlanDistributionData[] = Array.from(planCounts.entries()).map(([plan, data]) => ({
        plan,
        count: data.count,
        revenue: data.revenue,
        percentage: (data.count / totalTenants) * 100
      }))

      setChartData({
        tenantGrowth: tenantGrowthData,
        searchVolume: searchVolumeData,
        storageUsage: storageUsageData,
        apiUsage: apiUsageData,
        embeddingStats: embeddingStatsData,
        searchHeatmap: searchHeatmapData,
        planDistribution: planDistributionData
      })
    }

    fetchChartData()
  }, [dailyStats, tenantUsage, tenants])

  const isLoading = tenantsLoading || documentsLoading || searchLogsLoading || userTenantsLoading
  const tenantUsageRows: TenantUsageDashboardRow[] = (tenantUsage as TenantUsageDashboardRow[] | undefined) ?? []
  const dailyStatsRows: DailyStatsData[] = (dailyStats as DailyStatsData[] | undefined) ?? []

  // Enable real-time analytics updates
  const { isLive } = useRealtimeAnalytics(
    () => {
      // Refresh data when updates occur
      window.location.reload() // Simple refresh for now
    },
    {
      enabled: true,
      refreshInterval: 30000 // 30 seconds
    }
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of your SaaS Search Service
            {isLive && (
              <Badge variant="outline" className="ml-3">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                Live Updates
              </Badge>
            )}
          </p>
        </div>
        <ExportData data={(dailyStats as Record<string, unknown>[]) || []} filename="dashboard-metrics" />
      </div>

      {/* Alert for important info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>Welcome to your admin panel! Monitor usage, manage tenants, and track search analytics.</span>
            {role && (
              <Badge variant={isOwner() ? 'default' : 'secondary'} className="ml-4">
                <Shield className="w-3 h-3 mr-1" />
                {role.toUpperCase()}
              </Badge>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Typesense Health Widget */}
      <TypesenseHealthWidget />

      {/* Date Range Selector */}
      <DateRangeSelector value={dateRange} onChange={setDateRange} />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tenants"
          value={isLoading ? '...' : stats.totalTenants}
          icon={Users}
          trend={stats.tenantGrowth}
          description="from last week"
        />
        <StatCard
          title="Documents"
          value={isLoading ? '...' : stats.totalDocuments}
          icon={FileText}
          description="indexed documents"
        />
        <StatCard
          title="Search Queries"
          value={isLoading ? '...' : stats.totalSearches}
          icon={Search}
          trend={stats.searchGrowth}
          description="from last week"
        />
        <StatCard
          title="Active Users"
          value={isLoading ? '...' : stats.activeUsers}
          icon={Activity}
          description="team members"
        />
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="charts">Charts & Analytics</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <RoleGate minRole="member">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Tenant Overview</CardTitle>
                  <CardDescription>
                    List of active tenants and their plans
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {((tenants as TenantData[]) || []).slice(0, 5).map((tenant) => (
                      <div key={tenant.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{tenant.name}</p>
                          <p className="text-sm text-muted-foreground">{tenant.slug}</p>
                        </div>
                        <Badge variant={tenant.plan_type === 'free' ? 'secondary' : 'default'}>
                          {tenant.plan_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </RoleGate>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Usage Breakdown</CardTitle>
                <CardDescription>
                  Resource usage by service
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Storage Used</span>
                    <Badge variant="outline">
                      {tenantUsageRows[0]?.storage_used_mb ?? 0} MB
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Calls</span>
                    <Badge variant="outline">
                      {dailyStatsRows[0]?.api_calls_count ?? 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Today's Searches</span>
                    <Badge variant="outline">
                      {dailyStatsRows[0]?.search_count ?? 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          {/* Interactive Charts Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <TenantGrowthChart
              data={chartData.tenantGrowth}
              isLoading={dailyStatsLoading}
            />
            <PlanDistributionChart
              data={chartData.planDistribution}
              isLoading={tenantsLoading}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SearchVolumeChart
              data={chartData.searchVolume}
              isLoading={dailyStatsLoading}
            />
            <ApiUsageChart
              data={chartData.apiUsage}
              isLoading={dailyStatsLoading}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <StorageUsageChart
              data={chartData.storageUsage}
              isLoading={tenantUsageLoading}
            />
            <EmbeddingStatsChart
              data={chartData.embeddingStats}
              isLoading={documentsLoading}
            />
          </div>

          {/* Full width heatmap */}
          <div className="grid gap-4">
            <SearchHeatmapChart
              data={chartData.searchHeatmap}
              isLoading={searchLogsLoading}
            />
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Searches</CardTitle>
                <CardDescription>
                  Latest search queries and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {((searchLogs as SearchLogData[]) || []).slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-2 border-b">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{log.query}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">{log.results_count} results</Badge>
                        <span className="text-xs text-muted-foreground">
                          {log.response_time_ms}ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Documents</CardTitle>
                <CardDescription>
                  Latest indexed documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {((documents as DocumentData[]) || []).slice(0, 10).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between py-2 border-b">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.embedding_generated && (
                          <Badge variant="outline">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Embedded
                          </Badge>
                        )}
                        {doc.file_type && (
                          <Badge variant="secondary">{doc.file_type}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

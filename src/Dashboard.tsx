import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Badge } from './components/ui/badge'
import { Alert, AlertDescription } from './components/ui/alert'
import { useGetList, useDataProvider } from 'react-admin'
import { useState, useEffect } from 'react'
import { Activity, Users, FileText, Search, TrendingUp, AlertCircle } from 'lucide-react'

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
  icon: any
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

export const Dashboard = () => {
  const dataProvider = useDataProvider()
  const [stats, setStats] = useState<StatsData>({
    totalTenants: 0,
    totalDocuments: 0,
    totalSearches: 0,
    activeUsers: 0,
    tenantGrowth: 0,
    searchGrowth: 0
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
  const { data: dailyStats } = useGetList('daily_usage_stats', {
    pagination: { page: 1, perPage: 30 },
    sort: { field: 'date', order: 'DESC' }
  })

  useEffect(() => {
    if (tenants && documents && searchLogs && userTenants) {
      // Calculate growth trends
      const calculateGrowth = (data: any[], field: string) => {
        if (!data || data.length < 2) return 0
        const recent = data.slice(0, 7).reduce((sum, item) => sum + (item[field] || 0), 0)
        const previous = data.slice(7, 14).reduce((sum, item) => sum + (item[field] || 0), 0)
        if (previous === 0) return 0
        return Math.round(((recent - previous) / previous) * 100)
      }

      setStats({
        totalTenants: tenants?.length || 0,
        totalDocuments: documents?.length || 0,
        totalSearches: searchLogs?.length || 0,
        activeUsers: userTenants?.length || 0,
        tenantGrowth: calculateGrowth(dailyStats || [], 'unique_users_count'),
        searchGrowth: calculateGrowth(dailyStats || [], 'search_count')
      })
    }
  }, [tenants, documents, searchLogs, userTenants, dailyStats])

  const isLoading = tenantsLoading || documentsLoading || searchLogsLoading || userTenantsLoading

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your SaaS Search Service
        </p>
      </div>

      {/* Alert for important info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Welcome to your admin panel! Monitor usage, manage tenants, and track search analytics.
        </AlertDescription>
      </Alert>

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
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Tenant Overview</CardTitle>
                <CardDescription>
                  List of active tenants and their plans
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tenants?.slice(0, 5).map((tenant: any) => (
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
                      {dailyStats?.[0]?.storage_used_mb || 0} MB
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Calls</span>
                    <Badge variant="outline">
                      {dailyStats?.[0]?.api_calls_count || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Today's Searches</span>
                    <Badge variant="outline">
                      {dailyStats?.[0]?.search_count || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Analytics</CardTitle>
              <CardDescription>
                Recent search queries and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {searchLogs?.slice(0, 10).map((log: any) => (
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
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Documents</CardTitle>
              <CardDescription>
                Latest indexed documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documents?.slice(0, 10).map((doc: any) => (
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
        </TabsContent>
      </Tabs>
    </div>
  )
}

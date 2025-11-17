import { useState, useEffect } from 'react'
import { useNotify } from 'react-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import {
  BarChart3,
  TrendingUp,
  Search,
  Clock,
  MousePointer,
  AlertCircle,
  Activity
} from 'lucide-react'
import { typesenseClient } from '../../providers/typesenseClient'
import { format, subDays } from 'date-fns'

interface AnalyticsMetrics {
  totalSearches: number
  avgSearchLatency: number
  clickThroughRate: number
  noResultQueries: number
  popularQueries: Array<{ query: string; count: number }>
  searchTrends: Array<{ date: string; searches: number; avgLatency: number }>
  queryPerformance: Array<{ query: string; avgLatency: number; count: number }>
  clickPatterns: Array<{ position: number; clicks: number }>
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export const AnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    totalSearches: 0,
    avgSearchLatency: 0,
    clickThroughRate: 0,
    noResultQueries: 0,
    popularQueries: [],
    searchTrends: [],
    queryPerformance: [],
    clickPatterns: []
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d')
  const notify = useNotify()

  useEffect(() => {
    loadAnalytics()
  }, [dateRange])

  const loadAnalytics = async () => {
    if (!typesenseClient) {
      notify('Typesense client not configured', { type: 'error' })
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Fetch analytics status
      const status = await (typesenseClient as any).analytics.status().retrieve()

      // Generate mock data based on date range
      // In production, this would fetch real analytics data from Typesense
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
      const mockTrends = Array.from({ length: days }, (_, i) => {
        const date = subDays(new Date(), days - i - 1)
        return {
          date: format(date, 'MMM dd'),
          searches: Math.floor(Math.random() * 1000) + 500,
          avgLatency: Math.floor(Math.random() * 50) + 20
        }
      })

      const mockPopularQueries = [
        { query: 'laptop', count: 1543 },
        { query: 'smartphone', count: 1231 },
        { query: 'headphones', count: 987 },
        { query: 'keyboard', count: 876 },
        { query: 'monitor', count: 654 },
        { query: 'mouse', count: 543 },
        { query: 'tablet', count: 432 },
        { query: 'camera', count: 321 }
      ]

      const mockQueryPerformance = [
        { query: 'laptop', avgLatency: 23, count: 1543 },
        { query: 'smartphone', avgLatency: 18, count: 1231 },
        { query: 'headphones', avgLatency: 31, count: 987 },
        { query: 'keyboard', avgLatency: 15, count: 876 },
        { query: 'monitor', avgLatency: 42, count: 654 }
      ]

      const mockClickPatterns = [
        { position: 1, clicks: 3421 },
        { position: 2, clicks: 1876 },
        { position: 3, clicks: 987 },
        { position: 4, clicks: 543 },
        { position: 5, clicks: 321 },
        { position: 6, clicks: 198 },
        { position: 7, clicks: 123 },
        { position: 8, clicks: 87 }
      ]

      const totalSearches = mockTrends.reduce((sum, item) => sum + item.searches, 0)
      const avgLatency = Math.round(
        mockTrends.reduce((sum, item) => sum + item.avgLatency, 0) / mockTrends.length
      )

      setMetrics({
        totalSearches,
        avgSearchLatency: avgLatency,
        clickThroughRate: 68.5,
        noResultQueries: Math.floor(totalSearches * 0.05),
        popularQueries: mockPopularQueries,
        searchTrends: mockTrends,
        queryPerformance: mockQueryPerformance,
        clickPatterns: mockClickPatterns
      })
    } catch (error: any) {
      notify(`Failed to load analytics: ${error.message}`, { type: 'error' })
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!typesenseClient) {
    return (
      <div className="p-8 text-center">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold mb-2">Typesense Not Configured</h2>
        <p className="text-gray-600">
          Please configure Typesense environment variables to use this feature.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
        <p>Loading analytics data...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor search usage, performance, and user behavior
          </p>
        </div>
        <div className="flex gap-2">
          <Badge
            variant={dateRange === '7d' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setDateRange('7d')}
          >
            7 Days
          </Badge>
          <Badge
            variant={dateRange === '30d' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setDateRange('30d')}
          >
            30 Days
          </Badge>
          <Badge
            variant={dateRange === '90d' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setDateRange('90d')}
          >
            90 Days
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Total Searches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics.totalSearches.toLocaleString()}
            </div>
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              +12.5% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Avg Search Latency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.avgSearchLatency}ms</div>
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              -5ms from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <MousePointer className="w-4 h-4" />
              Click-Through Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.clickThroughRate}%</div>
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              +3.2% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              No-Result Queries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics.noResultQueries.toLocaleString()}
            </div>
            <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
              5% of total searches
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Search Trends</TabsTrigger>
          <TabsTrigger value="popular">Popular Queries</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="clicks">Click Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Volume Trends</CardTitle>
              <CardDescription>
                Search volume and average latency over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={metrics.searchTrends}>
                  <defs>
                    <linearGradient id="colorSearches" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="searches"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorSearches)"
                    name="Searches"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgLatency"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Avg Latency (ms)"
                    dot={{ r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="popular" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Popular Search Queries</CardTitle>
              <CardDescription>
                Most frequently searched terms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={metrics.popularQueries}
                  layout="vertical"
                  margin={{ left: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    type="number"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="query"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                    {metrics.popularQueries.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Query Performance Metrics</CardTitle>
              <CardDescription>
                Average latency vs query volume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={metrics.queryPerformance}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="query"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    label={{ value: 'Count', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="avgLatency"
                    fill="#f59e0b"
                    name="Avg Latency (ms)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="count"
                    fill="#3b82f6"
                    name="Query Count"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clicks" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Click Position Distribution</CardTitle>
                <CardDescription>
                  Clicks by result position
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.clickPatterns}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="position"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar
                      dataKey="clicks"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      name="Clicks"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Click-Through Rate by Position</CardTitle>
                <CardDescription>
                  Distribution of clicks across positions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.clickPatterns.slice(0, 5)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ position, percent }) =>
                        `Pos ${position}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="clicks"
                    >
                      {metrics.clickPatterns.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

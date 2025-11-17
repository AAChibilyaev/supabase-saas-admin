import { Grid } from '@mui/material'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import {
  TrendingUp,
  Eye,
  MousePointer,
  Clock,
  Users,
  Search,
  Activity
} from 'lucide-react'

// Mock analytics data - in production, this would come from the API
const MOCK_ANALYTICS = {
  totalViews: 12458,
  totalSearches: 8932,
  totalClicks: 6547,
  avgResponseTime: 245,
  uniqueUsers: 3421,
  topQueries: [
    { query: 'getting started', count: 456, ctr: 0.85 },
    { query: 'documentation', count: 389, ctr: 0.92 },
    { query: 'api reference', count: 312, ctr: 0.78 },
    { query: 'tutorial', count: 287, ctr: 0.81 },
    { query: 'pricing', count: 234, ctr: 0.69 },
  ],
  recentSearches: [
    { query: 'search widget setup', timestamp: '2 minutes ago', results: 12 },
    { query: 'integration guide', timestamp: '5 minutes ago', results: 8 },
    { query: 'custom styling', timestamp: '8 minutes ago', results: 15 },
    { query: 'api authentication', timestamp: '12 minutes ago', results: 6 },
    { query: 'faceted search', timestamp: '15 minutes ago', results: 9 },
  ],
  performanceMetrics: {
    avgSearchTime: 245,
    p95SearchTime: 412,
    p99SearchTime: 589,
    errorRate: 0.2,
  },
  usageByDay: [
    { day: 'Mon', searches: 1234 },
    { day: 'Tue', searches: 1456 },
    { day: 'Wed', searches: 1678 },
    { day: 'Thu', searches: 1523 },
    { day: 'Fri', searches: 1789 },
    { day: 'Sat', searches: 892 },
    { day: 'Sun', searches: 734 },
  ],
}

export const AnalyticsDashboard = () => {
  const analytics = MOCK_ANALYTICS

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <Grid container spacing={3}>
        <Grid size={12} columns={4}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</div>
              <p className="text-xs text-gray-500 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +12% from last week
              </p>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12} columns={4}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
              <Search className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalSearches.toLocaleString()}</div>
              <p className="text-xs text-gray-500 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +8% from last week
              </p>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12} columns={4}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalClicks.toLocaleString()}</div>
              <p className="text-xs text-gray-500 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +15% from last week
              </p>
            </CardContent>
          </Card>
        </Grid>

          <Grid size={12} columns={4}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.avgResponseTime}ms</div>
              <p className="text-xs text-gray-500 flex items-center mt-1">
                <Badge className="bg-green-100 text-green-800">Excellent</Badge>
              </p>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12} columns={4}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.uniqueUsers.toLocaleString()}</div>
              <p className="text-xs text-gray-500 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +10% from last week
              </p>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12} columns={6}>
          <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
              <Activity className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">73.3%</div>
              <p className="text-xs text-gray-500 flex items-center mt-1">
                <Badge className="bg-green-100 text-green-800">Above average</Badge>
              </p>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Queries */}
      <Grid container spacing={3}>
        <Grid size={12} columns={6}>
          <Card>
            <CardHeader>
              <CardTitle>Top Search Queries</CardTitle>
              <CardDescription>Most popular searches in the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topQueries.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.query}</p>
                      <p className="text-xs text-gray-500">{item.count} searches</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      {(item.ctr * 100).toFixed(0)}% CTR
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12} columns={6}>
          <Card>
            <CardHeader>
              <CardTitle>Recent Searches</CardTitle>
              <CardDescription>Real-time search activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recentSearches.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.query}</p>
                      <p className="text-xs text-gray-500">{item.timestamp}</p>
                    </div>
                    <Badge variant="outline">{item.results} results</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Usage Chart */}
      <Grid container spacing={3}>
        <Grid size={12} columns={12}>
          <Card>
            <CardHeader>
              <CardTitle>Search Activity</CardTitle>
              <CardDescription>Number of searches per day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2">
                {analytics.usageByDay.map((day, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                      style={{
                        height: `${(day.searches / Math.max(...analytics.usageByDay.map(d => d.searches))) * 100}%`,
                        minHeight: '20px',
                      }}
                      title={`${day.searches} searches`}
                    />
                    <span className="text-xs text-gray-600 mt-2">{day.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Metrics */}
      <Grid container spacing={3}>
        <Grid size={12} columns={12}>
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Search performance statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <Grid container spacing={3}>
                <Grid size={12} columns={3}>
                  <div className="p-4 bg-blue-50 rounded">
                    <p className="text-sm text-gray-600 mb-1">Average Search Time</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {analytics.performanceMetrics.avgSearchTime}ms
                    </p>
                  </div>
                </Grid>
                <Grid size={12} columns={3}>
                  <div className="p-4 bg-purple-50 rounded">
                    <p className="text-sm text-gray-600 mb-1">P95 Search Time</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {analytics.performanceMetrics.p95SearchTime}ms
                    </p>
                  </div>
                </Grid>
                <Grid size={12} columns={3}>
                  <div className="p-4 bg-orange-50 rounded">
                    <p className="text-sm text-gray-600 mb-1">P99 Search Time</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {analytics.performanceMetrics.p99SearchTime}ms
                    </p>
                  </div>
                </Grid>
                <Grid size={12} columns={3}>
                  <div className="p-4 bg-green-50 rounded">
                    <p className="text-sm text-gray-600 mb-1">Error Rate</p>
                    <p className="text-2xl font-bold text-green-600">
                      {analytics.performanceMetrics.errorRate}%
                    </p>
                  </div>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  )
}

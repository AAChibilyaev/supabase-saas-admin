import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'
import { Activity, TrendingUp } from 'lucide-react'

export interface ApiUsageData {
  date: string
  api_calls_count: number
  search_count: number
  document_count: number
  unique_users_count: number
}

interface ApiUsageChartProps {
  data: ApiUsageData[]
  isLoading?: boolean
}

export const ApiUsageChart = ({ data, isLoading }: ApiUsageChartProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Usage Metrics</CardTitle>
          <CardDescription>Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formattedData = data.map(item => ({
    ...item,
    date: format(new Date(item.date), 'MMM dd')
  }))

  const totalApiCalls = data.reduce((sum, item) => sum + (item.api_calls_count || 0), 0)
  const totalSearches = data.reduce((sum, item) => sum + (item.search_count || 0), 0)
  const avgDailyUsers = data.length > 0
    ? Math.round(data.reduce((sum, item) => sum + (item.unique_users_count || 0), 0) / data.length)
    : 0

  // Calculate growth trend
  const recentSum = data.slice(-7).reduce((sum, item) => sum + (item.api_calls_count || 0), 0)
  const previousSum = data.slice(-14, -7).reduce((sum, item) => sum + (item.api_calls_count || 0), 0)
  const growthPercentage = previousSum > 0
    ? Math.round(((recentSum - previousSum) / previousSum) * 100)
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <span>API Usage Metrics</span>
          </div>
          {growthPercentage !== 0 && (
            <div className={`flex items-center gap-1 text-sm font-normal ${
              growthPercentage > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className="h-4 w-4" />
              {growthPercentage > 0 ? '+' : ''}{growthPercentage}%
            </div>
          )}
        </CardTitle>
        <CardDescription>
          Total API calls: {totalApiCalls.toLocaleString()} | Searches: {totalSearches.toLocaleString()} | Avg daily users: {avgDailyUsers}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
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
            <Line
              type="monotone"
              dataKey="api_calls_count"
              stroke="#3b82f6"
              strokeWidth={2}
              name="API Calls"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="search_count"
              stroke="#10b981"
              strokeWidth={2}
              name="Searches"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="document_count"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Documents"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="unique_users_count"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Unique Users"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

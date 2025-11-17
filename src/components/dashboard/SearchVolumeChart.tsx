import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'

export interface SearchVolumeData {
  date: string
  search_count: number
  avg_response_time: number
  results_count_avg: number
}

interface SearchVolumeChartProps {
  data: SearchVolumeData[]
  isLoading?: boolean
}

export const SearchVolumeChart = ({ data, isLoading }: SearchVolumeChartProps) => {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar')

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Search Volume Trends</CardTitle>
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
    date: format(new Date(item.date), 'MMM dd'),
    avg_response_time: Math.round(item.avg_response_time || 0)
  }))

  const totalSearches = data.reduce((sum, item) => sum + (item.search_count || 0), 0)
  const avgResponseTime = data.length > 0
    ? Math.round(data.reduce((sum, item) => sum + (item.avg_response_time || 0), 0) / data.length)
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            <span>Search Volume Trends</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
            >
              Bar
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
            >
              Line
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Total searches: {totalSearches.toLocaleString()} | Avg response time: {avgResponseTime}ms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'bar' ? (
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                yAxisId="left"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
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
              <Bar
                yAxisId="left"
                dataKey="search_count"
                fill="#3b82f6"
                name="Search Count"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="avg_response_time"
                fill="#10b981"
                name="Avg Response Time (ms)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                yAxisId="left"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
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
                yAxisId="left"
                type="monotone"
                dataKey="search_count"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Search Count"
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avg_response_time"
                stroke="#10b981"
                strokeWidth={2}
                name="Avg Response Time (ms)"
                dot={{ r: 4 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

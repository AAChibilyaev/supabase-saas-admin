import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'
import { Sparkles } from 'lucide-react'
import { Badge } from '../ui/badge'

export interface EmbeddingStatsData {
  date: string
  embeddings_generated: number
  success_count: number
  failure_count: number
  avg_processing_time_ms: number
  total_tokens_used: number
}

interface EmbeddingStatsChartProps {
  data: EmbeddingStatsData[]
  isLoading?: boolean
}

export const EmbeddingStatsChart = ({ data, isLoading }: EmbeddingStatsChartProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Embedding Generation Stats</CardTitle>
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
    success_rate: item.embeddings_generated > 0
      ? Math.round((item.success_count / item.embeddings_generated) * 100)
      : 0
  }))

  const totalEmbeddings = data.reduce((sum, item) => sum + (item.embeddings_generated || 0), 0)
  const totalSuccess = data.reduce((sum, item) => sum + (item.success_count || 0), 0)
  const totalFailure = data.reduce((sum, item) => sum + (item.failure_count || 0), 0)
  const totalTokens = data.reduce((sum, item) => sum + (item.total_tokens_used || 0), 0)
  const avgSuccessRate = totalEmbeddings > 0
    ? Math.round((totalSuccess / totalEmbeddings) * 100)
    : 0
  const avgProcessingTime = data.length > 0
    ? Math.round(data.reduce((sum, item) => sum + (item.avg_processing_time_ms || 0), 0) / data.length)
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <span>Embedding Generation Stats</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={avgSuccessRate >= 95 ? 'default' : avgSuccessRate >= 80 ? 'secondary' : 'destructive'}>
              {avgSuccessRate}% Success Rate
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          Total embeddings: {totalEmbeddings.toLocaleString()} |
          Success: {totalSuccess.toLocaleString()} |
          Failed: {totalFailure.toLocaleString()} |
          Avg time: {avgProcessingTime}ms |
          Tokens: {totalTokens.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={formattedData}>
            <defs>
              <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
              </linearGradient>
              <linearGradient id="colorFailure" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
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
              label={{ value: 'Processing Time (ms)', angle: 90, position: 'insideRight' }}
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
              dataKey="success_count"
              fill="url(#colorSuccess)"
              name="Successful"
              stackId="a"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              yAxisId="left"
              dataKey="failure_count"
              fill="url(#colorFailure)"
              name="Failed"
              stackId="a"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avg_processing_time_ms"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Avg Processing Time (ms)"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Additional Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{totalSuccess.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">Successful</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{totalFailure.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">Failed</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{avgProcessingTime}ms</div>
            <div className="text-xs text-muted-foreground mt-1">Avg Time</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

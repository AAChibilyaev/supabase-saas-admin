import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Activity } from 'lucide-react'
import { Badge } from '../ui/badge'

export interface SearchHeatmapData {
  day: string
  hour: number
  search_count: number
}

interface SearchHeatmapChartProps {
  data: SearchHeatmapData[]
  isLoading?: boolean
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

// Get color based on search count (heat intensity)
const getHeatColor = (count: number, maxCount: number): string => {
  if (count === 0) return 'hsl(var(--muted))'

  const intensity = count / maxCount

  if (intensity < 0.2) return '#dbeafe' // blue-100
  if (intensity < 0.4) return '#93c5fd' // blue-300
  if (intensity < 0.6) return '#60a5fa' // blue-400
  if (intensity < 0.8) return '#3b82f6' // blue-500
  return '#1d4ed8' // blue-700
}

export const SearchHeatmapChart = ({ data, isLoading }: SearchHeatmapChartProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Search Activity Heatmap</CardTitle>
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

  // Create a map for quick lookup
  const heatmapMap = new Map<string, number>()
  data.forEach(item => {
    const key = `${item.day}-${item.hour}`
    heatmapMap.set(key, item.search_count)
  })

  // Find max count for color scaling
  const maxCount = Math.max(...data.map(d => d.search_count), 1)
  const totalSearches = data.reduce((sum, item) => sum + item.search_count, 0)

  // Find peak hour
  const peakActivity = data.reduce((max, item) =>
    item.search_count > max.search_count ? item : max
  , { day: '', hour: 0, search_count: 0 })

  // Calculate average by day
  const avgByDay = DAYS.map(day => {
    const dayData = data.filter(d => d.day === day)
    const total = dayData.reduce((sum, d) => sum + d.search_count, 0)
    return { day, avg: Math.round(total / 24) }
  })

  const busyDays = avgByDay
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3)
    .map(d => d.day)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <span>Search Activity Heatmap</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Peak: {peakActivity.day} {peakActivity.hour}:00
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          Total searches: {totalSearches.toLocaleString()} |
          Peak searches: {peakActivity.search_count} |
          Busiest days: {busyDays.join(', ')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Hour labels */}
            <div className="flex mb-1">
              <div className="w-12" /> {/* Spacer for day labels */}
              {HOURS.map(hour => (
                <div
                  key={hour}
                  className="text-xs text-muted-foreground text-center"
                  style={{ width: '28px' }}
                >
                  {hour % 3 === 0 ? hour : ''}
                </div>
              ))}
            </div>

            {/* Heatmap rows */}
            {DAYS.map(day => (
              <div key={day} className="flex items-center mb-1">
                <div className="w-12 text-xs text-muted-foreground font-medium pr-2 text-right">
                  {day}
                </div>
                {HOURS.map(hour => {
                  const key = `${day}-${hour}`
                  const count = heatmapMap.get(key) || 0
                  const color = getHeatColor(count, maxCount)

                  return (
                    <div
                      key={hour}
                      className="group relative cursor-pointer transition-all hover:ring-2 hover:ring-blue-500 hover:z-10"
                      style={{
                        width: '26px',
                        height: '26px',
                        backgroundColor: color,
                        margin: '1px',
                        borderRadius: '3px'
                      }}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                        <div className="bg-popover text-popover-foreground border rounded-md shadow-lg p-2 text-xs whitespace-nowrap">
                          <div className="font-semibold">{day}, {hour}:00</div>
                          <div className="text-muted-foreground">
                            {count} {count === 1 ? 'search' : 'searches'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Less</span>
            <div className="flex gap-1">
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity, idx) => (
                <div
                  key={idx}
                  className="w-5 h-5 rounded"
                  style={{ backgroundColor: getHeatColor(intensity * maxCount, maxCount) }}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">More</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Max: {maxCount} searches/hour
          </div>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Peak Activity</div>
            <div className="font-semibold">
              {peakActivity.day} at {peakActivity.hour}:00
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {peakActivity.search_count} searches
            </div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Busiest Days</div>
            <div className="font-semibold">
              {busyDays.join(', ')}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Based on avg searches/hour
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

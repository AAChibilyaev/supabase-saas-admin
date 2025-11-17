import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { HardDrive } from 'lucide-react'
import { Progress } from '../ui/progress'

export interface StorageUsageData {
  tenant_name: string
  storage_used_mb: number
  storage_limit_mb: number
  percentage: number
}

interface StorageUsageChartProps {
  data: StorageUsageData[]
  isLoading?: boolean
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export const StorageUsageChart = ({ data, isLoading }: StorageUsageChartProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Storage Usage</CardTitle>
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

  const totalUsed = data.reduce((sum, item) => sum + (item.storage_used_mb || 0), 0)
  const totalLimit = data.reduce((sum, item) => sum + (item.storage_limit_mb || 0), 0)
  const overallPercentage = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0

  const pieData = data.slice(0, 8).map(item => ({
    name: item.tenant_name,
    value: item.storage_used_mb
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          <span>Storage Usage</span>
        </CardTitle>
        <CardDescription>
          {totalUsed.toLocaleString()} MB of {totalLimit.toLocaleString()} MB used ({overallPercentage}%)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Storage</span>
              <span className="font-medium">{overallPercentage}%</span>
            </div>
            <Progress value={overallPercentage} className="h-2" />
          </div>

          {/* Pie Chart */}
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                formatter={(value: number) => `${value} MB`}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          {/* Individual Tenant Progress Bars */}
          <div className="space-y-3">
            {data.slice(0, 5).map((tenant, index) => (
              <div key={tenant.tenant_name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-muted-foreground">{tenant.tenant_name}</span>
                  </div>
                  <span className="font-medium">
                    {tenant.storage_used_mb} / {tenant.storage_limit_mb} MB
                  </span>
                </div>
                <Progress
                  value={tenant.percentage}
                  className="h-1.5"
                  style={{
                    ['--progress-background' as string]: COLORS[index % COLORS.length]
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'
import { TrendingUp } from 'lucide-react'

interface TenantGrowthData {
  date: string
  total_tenants: number
  new_tenants: number
  active_tenants: number
}

interface TenantGrowthChartProps {
  data: TenantGrowthData[]
  isLoading?: boolean
}

export const TenantGrowthChart = ({ data, isLoading }: TenantGrowthChartProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tenant Growth</CardTitle>
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

  const totalGrowth = data.length > 0
    ? ((data[data.length - 1]?.total_tenants || 0) - (data[0]?.total_tenants || 0))
    : 0

  const growthPercentage = data.length > 0 && data[0]?.total_tenants
    ? Math.round((totalGrowth / data[0].total_tenants) * 100)
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Tenant Growth</span>
          {totalGrowth > 0 && (
            <div className="flex items-center gap-1 text-sm font-normal text-green-600">
              <TrendingUp className="h-4 w-4" />
              +{totalGrowth} ({growthPercentage}%)
            </div>
          )}
        </CardTitle>
        <CardDescription>Total and new tenants over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
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
            <Area
              type="monotone"
              dataKey="total_tenants"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorTotal)"
              name="Total Tenants"
            />
            <Area
              type="monotone"
              dataKey="new_tenants"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorNew)"
              name="New Tenants"
            />
            <Area
              type="monotone"
              dataKey="active_tenants"
              stroke="#f59e0b"
              fillOpacity={1}
              fill="url(#colorActive)"
              name="Active Tenants"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

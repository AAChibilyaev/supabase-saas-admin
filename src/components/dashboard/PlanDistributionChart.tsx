import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts'
import { CreditCard, TrendingUp } from 'lucide-react'
import { Badge } from '../ui/badge'
import { useState } from 'react'

export interface PlanDistributionData {
  plan: string
  count: number
  revenue: number
  percentage: number
}

interface PlanDistributionChartProps {
  data: PlanDistributionData[]
  isLoading?: boolean
}

const PLAN_COLORS: Record<string, string> = {
  free: '#94a3b8',
  pro: '#3b82f6',
  scale: '#8b5cf6',
  enterprise: '#f59e0b'
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  scale: 'Scale',
  enterprise: 'Enterprise'
}

interface PieChartProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  startAngle: number
  endAngle: number
  fill: string
  payload: PlanDistributionData
  percent: number
  value: number
}

// Custom active shape for interactive pie chart
const renderActiveShape = (props: PieChartProps) => {
  const RADIAN = Math.PI / 180
  const {
    cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value
  } = props
  const sin = Math.sin(-RADIAN * midAngle)
  const cos = Math.cos(-RADIAN * midAngle)
  const sx = cx + (outerRadius + 10) * cos
  const sy = cy + (outerRadius + 10) * sin
  const mx = cx + (outerRadius + 30) * cos
  const my = cy + (outerRadius + 30) * sin
  const ex = mx + (cos >= 0 ? 1 : -1) * 22
  const ey = my
  const textAnchor = cos >= 0 ? 'start' : 'end'

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-bold text-lg">
        {payload.plan}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="hsl(var(--foreground))"
        className="text-sm font-semibold"
      >
        {value} tenants
      </text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={18}
        textAnchor={textAnchor}
        fill="hsl(var(--muted-foreground))"
        className="text-xs"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  )
}

export const PlanDistributionChart = ({ data, isLoading }: PlanDistributionChartProps) => {
  const [, setActiveIndex] = useState(0)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plan Distribution</CardTitle>
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

  const totalTenants = data.reduce((sum, item) => sum + item.count, 0)
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0)
  const paidTenants = data
    .filter(item => item.plan !== 'free')
    .reduce((sum, item) => sum + item.count, 0)
  const conversionRate = totalTenants > 0
    ? Math.round((paidTenants / totalTenants) * 100)
    : 0

  const chartData = data.map(item => ({
    ...item,
    plan: PLAN_LABELS[item.plan] || item.plan,
    fill: PLAN_COLORS[item.plan.toLowerCase()] || '#64748b'
  }))

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <span>Plan Distribution</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default">
              {conversionRate}% Paid
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          Total tenants: {totalTenants.toLocaleString()} |
          Paid: {paidTenants.toLocaleString()} |
          MRR: ${totalRevenue.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              activeShape={renderActiveShape as any}
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
              onMouseEnter={onPieEnter}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value: number, _name: string, props: any) => [
                `${value} tenants (${props.payload.percentage.toFixed(1)}%)`,
                props.payload.plan
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Plan Details Grid */}
        <div className="space-y-3 mt-6">
          {data.map((plan, index) => (
            <div
              key={plan.plan}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              onClick={() => setActiveIndex(index)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: PLAN_COLORS[plan.plan.toLowerCase()] }}
                />
                <div>
                  <div className="font-medium">{PLAN_LABELS[plan.plan] || plan.plan}</div>
                  <div className="text-xs text-muted-foreground">
                    {plan.count} tenants ({plan.percentage.toFixed(1)}%)
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">${plan.revenue.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">revenue</div>
              </div>
            </div>
          ))}
        </div>

        {/* Conversion Rate */}
        {conversionRate > 0 && (
          <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Conversion Rate</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{conversionRate}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {paidTenants} of {totalTenants} tenants are on paid plans
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

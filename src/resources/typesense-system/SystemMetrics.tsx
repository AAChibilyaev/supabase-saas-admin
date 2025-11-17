import { useState, useEffect } from 'react'
import { useDataProvider, Title, Loading, useNotify } from 'react-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  BarChart3,
  Network,
  Gauge,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { Button } from '../../components/ui/button'

interface StatsData {
  latency_ms?: {
    [endpoint: string]: number
  }
  requests_per_second?: {
    [endpoint: string]: number
  }
  pending_write_batches?: number
  [key: string]: unknown
}

interface MetricsData {
  system_cpu_active_percentage: string
  system_memory_used_bytes: string
  system_memory_total_bytes: string
  system_disk_used_bytes: string
  system_disk_total_bytes: string
  system_network_received_bytes: string
  system_network_sent_bytes: string
  typesense_memory_active_bytes: string
  typesense_memory_allocated_bytes: string
  typesense_memory_mapped_bytes: string
  typesense_memory_metadata_bytes: string
  typesense_memory_resident_bytes: string
}

interface MetricHistory {
  timestamp: number
  cpu: number
  memory: number
  disk: number
}

export const SystemMetrics = () => {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [history, setHistory] = useState<MetricHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const dataProvider = useDataProvider()
  const notify = useNotify()

  const fetchMetricsData = async (showNotification = false) => {
    try {
      if (showNotification) setRefreshing(true)
      if (!stats && !metrics) setLoading(true)
      setError(null)

      const [statsData, metricsData] = await Promise.all([
        dataProvider.getOne('typesense-system', { id: 'stats' }),
        dataProvider.getOne('typesense-system', { id: 'metrics' })
      ])

      setStats(statsData.data as StatsData)
      setMetrics(metricsData.data as MetricsData)

      // Add to history for charts
      const newMetrics = metricsData.data as MetricsData
      const newHistoryPoint: MetricHistory = {
        timestamp: Date.now(),
        cpu: parseFloat(newMetrics.system_cpu_active_percentage),
        memory: calculatePercentage(
          newMetrics.system_memory_used_bytes,
          newMetrics.system_memory_total_bytes
        ),
        disk: calculatePercentage(
          newMetrics.system_disk_used_bytes,
          newMetrics.system_disk_total_bytes
        )
      }

      setHistory(prev => {
        const updated = [...prev, newHistoryPoint]
        // Keep last 60 data points (10 minutes at 10s interval)
        return updated.slice(-60)
      })

      if (showNotification) {
        notify('Metrics refreshed', { type: 'success' })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch metrics data'
      setError(message)
      notify(message, { type: 'error' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchMetricsData()

    // Refresh every 10 seconds
    const interval = setInterval(() => fetchMetricsData(), 10000)
    return () => clearInterval(interval)
  }, [])

  const formatBytes = (bytes: string | number): string => {
    const value = typeof bytes === 'string' ? parseFloat(bytes) : bytes
    if (value === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(value) / Math.log(k))
    return `${(value / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const calculatePercentage = (used: string, total: string): number => {
    const usedNum = parseFloat(used)
    const totalNum = parseFloat(total)
    if (totalNum === 0) return 0
    return Math.round((usedNum / totalNum) * 100)
  }

  if (loading && !stats && !metrics) {
    return <Loading />
  }

  // Calculate network metrics
  const networkReceived = metrics ? parseFloat(metrics.system_network_received_bytes) : 0
  const networkSent = metrics ? parseFloat(metrics.system_network_sent_bytes) : 0
  const totalNetwork = networkReceived + networkSent

  // Calculate average latency and request rates
  const avgLatency = stats?.latency_ms
    ? Object.values(stats.latency_ms).reduce((a, b) => a + b, 0) / Object.values(stats.latency_ms).length
    : 0

  const totalRequests = stats?.requests_per_second
    ? Object.values(stats.requests_per_second).reduce((a, b) => a + b, 0)
    : 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Title title="System Metrics" />
        <Button
          onClick={() => fetchMetricsData(true)}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="performance">
            <Gauge className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="network">
            <Network className="h-4 w-4 mr-2" />
            Network
          </TabsTrigger>
          <TabsTrigger value="endpoints">
            <BarChart3 className="h-4 w-4 mr-2" />
            Endpoints
          </TabsTrigger>
        </TabsList>

        {/* Performance Metrics */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Average Latency</CardTitle>
                <CardDescription>Response time per request</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {avgLatency.toFixed(2)} ms
                </div>
                <Badge variant={avgLatency < 100 ? 'default' : avgLatency < 500 ? 'secondary' : 'destructive'} className="mt-2">
                  {avgLatency < 100 ? 'Excellent' : avgLatency < 500 ? 'Good' : 'Slow'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Request Rate</CardTitle>
                <CardDescription>Requests per second</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {totalRequests.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  req/sec
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pending Writes</CardTitle>
                <CardDescription>Batches waiting to be written</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats?.pending_write_batches ?? 0}
                </div>
                <Badge variant={
                  (stats?.pending_write_batches ?? 0) < 10 ? 'default' :
                  (stats?.pending_write_batches ?? 0) < 50 ? 'secondary' : 'destructive'
                } className="mt-2">
                  {(stats?.pending_write_batches ?? 0) < 10 ? 'Normal' :
                   (stats?.pending_write_batches ?? 0) < 50 ? 'Moderate' : 'High'}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Performance History */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Usage Over Time</CardTitle>
              <CardDescription>
                Last {history.length} data points (10-second intervals)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="space-y-6">
                  {/* Simple text-based chart visualization */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">CPU Usage</span>
                        <span className="font-mono">{history[history.length - 1].cpu.toFixed(1)}%</span>
                      </div>
                      <div className="h-20 flex items-end gap-1">
                        {history.slice(-30).map((point, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-blue-500 rounded-t transition-all"
                            style={{ height: `${point.cpu}%` }}
                            title={`${point.cpu.toFixed(1)}%`}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Memory Usage</span>
                        <span className="font-mono">{history[history.length - 1].memory}%</span>
                      </div>
                      <div className="h-20 flex items-end gap-1">
                        {history.slice(-30).map((point, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-green-500 rounded-t transition-all"
                            style={{ height: `${point.memory}%` }}
                            title={`${point.memory}%`}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Disk Usage</span>
                        <span className="font-mono">{history[history.length - 1].disk}%</span>
                      </div>
                      <div className="h-20 flex items-end gap-1">
                        {history.slice(-30).map((point, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-yellow-500 rounded-t transition-all"
                            style={{ height: `${point.disk}%` }}
                            title={`${point.disk}%`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Collecting data...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Network Metrics */}
        <TabsContent value="network" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Received</CardTitle>
                <CardDescription>Total bytes received</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatBytes(networkReceived)}
                </div>
                <Badge variant="outline" className="mt-2">
                  {((networkReceived / totalNetwork) * 100 || 0).toFixed(1)}%
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sent</CardTitle>
                <CardDescription>Total bytes sent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatBytes(networkSent)}
                </div>
                <Badge variant="outline" className="mt-2">
                  {((networkSent / totalNetwork) * 100 || 0).toFixed(1)}%
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Total Traffic</CardTitle>
                <CardDescription>Combined network usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatBytes(totalNetwork)}
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">RX</Badge>
                  <Badge variant="outline">TX</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Endpoint Statistics */}
        <TabsContent value="endpoints" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Latency by Endpoint */}
            <Card>
              <CardHeader>
                <CardTitle>Latency by Endpoint</CardTitle>
                <CardDescription>Average response time (ms)</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.latency_ms && Object.keys(stats.latency_ms).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(stats.latency_ms)
                      .sort(([, a], [, b]) => b - a)
                      .map(([endpoint, latency]) => (
                        <div key={endpoint} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <code className="text-xs">{endpoint}</code>
                            <Badge variant={latency < 100 ? 'default' : latency < 500 ? 'secondary' : 'destructive'}>
                              {latency.toFixed(2)} ms
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No endpoint data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Requests by Endpoint */}
            <Card>
              <CardHeader>
                <CardTitle>Requests by Endpoint</CardTitle>
                <CardDescription>Request rate (req/sec)</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.requests_per_second && Object.keys(stats.requests_per_second).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(stats.requests_per_second)
                      .sort(([, a], [, b]) => b - a)
                      .map(([endpoint, rate]) => (
                        <div key={endpoint} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <code className="text-xs">{endpoint}</code>
                            <Badge variant="outline">
                              {rate.toFixed(2)} req/s
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No endpoint data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

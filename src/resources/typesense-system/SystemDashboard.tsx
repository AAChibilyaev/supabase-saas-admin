import { useState, useEffect } from 'react'
import { useDataProvider, Title, Loading, useNotify } from 'react-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Progress } from '../../components/ui/progress'
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Server,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock
} from 'lucide-react'

interface HealthData {
  ok: boolean
  message?: string
}

interface MetricsData {
  system_cpu_active_percentage: string
  system_memory_used_bytes: string
  system_memory_total_bytes: string
  system_disk_used_bytes: string
  system_disk_total_bytes: string
  typesense_memory_active_bytes: string
  typesense_memory_allocated_bytes: string
  typesense_memory_mapped_bytes: string
  typesense_memory_metadata_bytes: string
  typesense_memory_resident_bytes: string
}

interface DebugInfo {
  version: string
  uptime: number
}

export const SystemDashboard = () => {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [debug, setDebug] = useState<DebugInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dataProvider = useDataProvider()
  const notify = useNotify()

  const fetchSystemData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch health, metrics, and debug data in parallel
      const [healthData, metricsData, debugData] = await Promise.all([
        dataProvider.getOne('typesense-system', { id: 'health' }),
        dataProvider.getOne('typesense-system', { id: 'metrics' }),
        dataProvider.getOne('typesense-system', { id: 'debug' })
      ])

      setHealth(healthData.data as HealthData)
      setMetrics(metricsData.data as MetricsData)
      setDebug(debugData.data as DebugInfo)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch system data'
      setError(message)
      notify(message, { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemData()

    // Refresh every 10 seconds
    const interval = setInterval(fetchSystemData, 10000)
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

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)

    return parts.length > 0 ? parts.join(' ') : '< 1m'
  }

  const calculatePercentage = (used: string, total: string): number => {
    const usedNum = parseFloat(used)
    const totalNum = parseFloat(total)
    if (totalNum === 0) return 0
    return Math.round((usedNum / totalNum) * 100)
  }

  const getStatusColor = (percentage: number): string => {
    if (percentage < 70) return 'bg-green-500'
    if (percentage < 90) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (loading && !health && !metrics && !debug) {
    return <Loading />
  }

  const cpuPercentage = metrics ? parseFloat(metrics.system_cpu_active_percentage) : 0
  const memoryPercentage = metrics ? calculatePercentage(
    metrics.system_memory_used_bytes,
    metrics.system_memory_total_bytes
  ) : 0
  const diskPercentage = metrics ? calculatePercentage(
    metrics.system_disk_used_bytes,
    metrics.system_disk_total_bytes
  ) : 0

  return (
    <div className="p-6 space-y-6">
      <Title title="System Dashboard" />

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>Current health status and uptime</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {health?.ok ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <div>
                    <div className="text-lg font-semibold">Healthy</div>
                    <div className="text-sm text-muted-foreground">
                      All systems operational
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-8 w-8 text-red-500" />
                  <div>
                    <div className="text-lg font-semibold">Unhealthy</div>
                    <div className="text-sm text-muted-foreground">
                      {health?.message || 'System issues detected'}
                    </div>
                  </div>
                </>
              )}
            </div>
            <Badge variant={health?.ok ? 'default' : 'destructive'} className="text-sm">
              {health?.ok ? 'OK' : 'ERROR'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Server Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Version</span>
              <Badge variant="outline">{debug?.version || 'Unknown'}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Uptime
              </span>
              <span className="font-mono text-sm">
                {debug?.uptime ? formatUptime(debug.uptime) : 'Unknown'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MemoryStick className="h-5 w-5" />
              Typesense Memory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Active</span>
              <span className="font-mono">
                {metrics ? formatBytes(metrics.typesense_memory_active_bytes) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Allocated</span>
              <span className="font-mono">
                {metrics ? formatBytes(metrics.typesense_memory_allocated_bytes) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Resident</span>
              <span className="font-mono">
                {metrics ? formatBytes(metrics.typesense_memory_resident_bytes) : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CPU Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="h-4 w-4" />
              CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold">{cpuPercentage.toFixed(1)}%</div>
              <Badge variant={cpuPercentage < 70 ? 'default' : cpuPercentage < 90 ? 'secondary' : 'destructive'}>
                {cpuPercentage < 70 ? 'Normal' : cpuPercentage < 90 ? 'High' : 'Critical'}
              </Badge>
            </div>
            <Progress value={cpuPercentage} className="h-2" />
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MemoryStick className="h-4 w-4" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold">{memoryPercentage}%</div>
              <Badge variant={memoryPercentage < 70 ? 'default' : memoryPercentage < 90 ? 'secondary' : 'destructive'}>
                {memoryPercentage < 70 ? 'Normal' : memoryPercentage < 90 ? 'High' : 'Critical'}
              </Badge>
            </div>
            <Progress value={memoryPercentage} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {metrics ? `${formatBytes(metrics.system_memory_used_bytes)} / ${formatBytes(metrics.system_memory_total_bytes)}` : 'N/A'}
            </div>
          </CardContent>
        </Card>

        {/* Disk Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="h-4 w-4" />
              Disk Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold">{diskPercentage}%</div>
              <Badge variant={diskPercentage < 70 ? 'default' : diskPercentage < 90 ? 'secondary' : 'destructive'}>
                {diskPercentage < 70 ? 'Normal' : diskPercentage < 90 ? 'High' : 'Critical'}
              </Badge>
            </div>
            <Progress value={diskPercentage} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {metrics ? `${formatBytes(metrics.system_disk_used_bytes)} / ${formatBytes(metrics.system_disk_total_bytes)}` : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Indicators */}
      {(cpuPercentage > 90 || memoryPercentage > 90 || diskPercentage > 90) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Warning: System resources are running critically high. Consider scaling or optimizing your deployment.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

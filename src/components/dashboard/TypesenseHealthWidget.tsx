import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { useState, useEffect } from 'react'
import { Server, Activity, Database, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { checkTypesenseHealth, getTypesenseClusterStats } from '../../utils/typesenseHealth'
import type { TypesenseHealthStatus, TypesenseClusterStats } from '../../utils/typesenseHealth'
import { isTypesenseEnabled } from '../../providers/typesenseClient'

export const TypesenseHealthWidget = () => {
  const [health, setHealth] = useState<TypesenseHealthStatus | null>(null)
  const [stats, setStats] = useState<TypesenseClusterStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHealth = async () => {
      setLoading(true)
      try {
        const [healthData, statsData] = await Promise.all([
          checkTypesenseHealth(),
          getTypesenseClusterStats()
        ])
        setHealth(healthData)
        setStats(statsData)
      } catch (error) {
        console.error('Error fetching Typesense health:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHealth()
    // Refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000)

    return () => clearInterval(interval)
  }, [])

  if (!isTypesenseEnabled()) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Typesense Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Typesense is not configured. Set VITE_TYPESENSE_URL and VITE_TYPESENSE_API_KEY to enable.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Typesense Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Typesense Status
            </CardTitle>
            <CardDescription>
              Search engine health and metrics
            </CardDescription>
          </div>
          <Badge variant={health?.isHealthy ? 'default' : 'destructive'}>
            {health?.isHealthy ? (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            ) : (
              <XCircle className="h-3 w-3 mr-1" />
            )}
            {health?.isHealthy ? 'Healthy' : 'Unhealthy'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Collections Count */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Database className="h-4 w-4" />
              Collections
            </div>
            <div className="text-2xl font-bold">{stats?.collections || 0}</div>
          </div>

          {/* Memory Usage */}
          {stats?.memory_used_bytes && (
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                Memory Used
              </div>
              <div className="text-2xl font-bold">
                {(stats.memory_used_bytes / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>
          )}

          {/* Uptime */}
          {stats?.uptime_seconds && (
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Server className="h-4 w-4" />
                Uptime
              </div>
              <div className="text-2xl font-bold">
                {Math.floor(stats.uptime_seconds / 3600)}h {Math.floor((stats.uptime_seconds % 3600) / 60)}m
              </div>
            </div>
          )}

          {/* Version */}
          {stats?.version && (
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                Version
              </div>
              <div className="text-2xl font-bold">{stats.version}</div>
            </div>
          )}
        </div>

        {/* Node Health Details */}
        {health?.nodes && health.nodes.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Nodes</p>
            {health.nodes.map((node, index) => (
              <div key={index} className="flex items-center justify-between text-sm border rounded-md p-2">
                <div className="flex items-center gap-2">
                  {node.isHealthy ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-mono text-xs">{node.url}</span>
                </div>
                {node.responseTimeMs && (
                  <Badge variant="outline">{node.responseTimeMs}ms</Badge>
                )}
                {node.error && (
                  <span className="text-xs text-red-600">{node.error}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {health?.error && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{health.error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

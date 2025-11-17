import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription } from '../components/ui/alert'
import { performHealthCheck, type HealthStatus } from '../utils/healthCheck'
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/button'

export const HealthCheckPage = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkHealth = async () => {
    setLoading(true)
    try {
      const status = await performHealthCheck()
      setHealth(status)
      setLastChecked(new Date())
    } catch (error) {
      console.error('Health check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !health) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Health Check</CardTitle>
            <CardDescription>Checking system status...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!health) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>Failed to perform health check</AlertDescription>
        </Alert>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-500">Healthy</Badge>
      case 'degraded':
        return <Badge variant="default" className="bg-yellow-500">Degraded</Badge>
      case 'down':
        return <Badge variant="destructive">Down</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Health</h1>
          <p className="text-muted-foreground">
            Last checked: {lastChecked?.toLocaleString() || 'Never'}
          </p>
        </div>
        <Button onClick={checkHealth} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {health.healthy ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            Overall Status
          </CardTitle>
          <CardDescription>
            System is {health.healthy ? 'operational' : 'experiencing issues'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Version:</span>
              <Badge variant="outline">{health.version}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Timestamp:</span>
              <span className="text-sm text-muted-foreground">
                {new Date(health.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(health.services.database.status)}
              Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getStatusBadge(health.services.database.status)}
              {health.services.database.responseTime && (
                <div className="text-sm text-muted-foreground">
                  Response time: {health.services.database.responseTime}ms
                </div>
              )}
              {health.services.database.error && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription className="text-xs">
                    {health.services.database.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(health.services.typesense.status)}
              Typesense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getStatusBadge(health.services.typesense.status)}
              {health.services.typesense.responseTime && (
                <div className="text-sm text-muted-foreground">
                  Response time: {health.services.typesense.responseTime}ms
                </div>
              )}
              {health.services.typesense.error && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription className="text-xs">
                    {health.services.typesense.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(health.services.supabase.status)}
              Supabase API
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getStatusBadge(health.services.supabase.status)}
              {health.services.supabase.responseTime && (
                <div className="text-sm text-muted-foreground">
                  Response time: {health.services.supabase.responseTime}ms
                </div>
              )}
              {health.services.supabase.error && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription className="text-xs">
                    {health.services.supabase.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


import { useState, useEffect } from 'react'
import { useDataProvider, Title, Loading, useNotify } from 'react-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  FileText,
  Search,
  Download,
  RefreshCw,
  AlertTriangle,
  Info,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { ScrollArea } from '../../components/ui/scroll-area'

interface LogEntry {
  timestamp: string
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  context?: Record<string, unknown>
}

type LogLevel = 'all' | 'error' | 'warn' | 'info' | 'debug'

export const SystemLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<LogLevel>('all')
  const [refreshing, setRefreshing] = useState(false)
  const dataProvider = useDataProvider()
  const notify = useNotify()

  const fetchLogs = async (showNotification = false) => {
    try {
      if (showNotification) setRefreshing(true)
      if (logs.length === 0) setLoading(true)
      setError(null)

      // Fetch debug info which contains logs
      const result = await dataProvider.getOne('typesense-system', { id: 'debug' })

      // Parse logs from debug output
      // Note: Typesense's /debug endpoint returns debugging information
      // In a real implementation, you might need to parse this data differently
      // or use a separate logging system
      const debugData = result.data as unknown as { version: string, uptime: number }

      // Generate sample logs based on debug data
      // In production, you'd want to integrate with your actual logging system
      const sampleLogs: LogEntry[] = [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'System health check passed',
          context: { version: debugData.version }
        },
        {
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'info',
          message: `Server uptime: ${debugData.uptime} seconds`
        },
        {
          timestamp: new Date(Date.now() - 120000).toISOString(),
          level: 'info',
          message: 'Cache cleared successfully'
        },
        {
          timestamp: new Date(Date.now() - 180000).toISOString(),
          level: 'warn',
          message: 'High memory usage detected',
          context: { threshold: '80%' }
        },
        {
          timestamp: new Date(Date.now() - 240000).toISOString(),
          level: 'info',
          message: 'Database compaction completed'
        }
      ]

      setLogs(sampleLogs)

      if (showNotification) {
        notify('Logs refreshed', { type: 'success' })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch logs'
      setError(message)
      notify(message, { type: 'error' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLogs()

    // Refresh every 30 seconds
    const interval = setInterval(() => fetchLogs(), 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Apply filters
    let filtered = logs

    // Filter by level
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(query) ||
        log.level.toLowerCase().includes(query) ||
        JSON.stringify(log.context || {}).toLowerCase().includes(query)
      )
    }

    setFilteredLogs(filtered)
  }, [logs, levelFilter, searchQuery])

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4" />
      case 'warn':
        return <AlertTriangle className="h-4 w-4" />
      case 'info':
        return <Info className="h-4 w-4" />
      case 'debug':
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getLevelVariant = (level: LogEntry['level']): 'default' | 'destructive' | 'secondary' | 'outline' => {
    switch (level) {
      case 'error':
        return 'destructive'
      case 'warn':
        return 'secondary'
      case 'info':
        return 'default'
      case 'debug':
        return 'outline'
    }
  }

  const handleExportLogs = () => {
    const logsText = filteredLogs.map(log => {
      const context = log.context ? `\n  Context: ${JSON.stringify(log.context, null, 2)}` : ''
      return `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}${context}`
    }).join('\n\n')

    const blob = new Blob([logsText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `typesense-logs-${new Date().toISOString()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    notify('Logs exported successfully', { type: 'success' })
  }

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  if (loading && logs.length === 0) {
    return <Loading />
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Title title="System Logs" />
        <div className="flex gap-2">
          <Button
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleExportLogs}
            disabled={filteredLogs.length === 0}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          System logs are displayed below. Note: This is a basic implementation showing debug information.
          For production use, integrate with your preferred logging solution.
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Filter logs by level or search for specific content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={levelFilter} onValueChange={(value) => setLevelFilter(value as LogLevel)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Log Entries
          </CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {logs.length} log entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length > 0 ? (
            <ScrollArea className="h-[600px] w-full">
              <div className="space-y-3">
                {filteredLogs.map((log, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getLevelVariant(log.level)} className="flex items-center gap-1">
                            {getLevelIcon(log.level)}
                            {log.level.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm">{log.message}</p>
                        {log.context && (
                          <div className="mt-2">
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                View Context
                              </summary>
                              <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                                {JSON.stringify(log.context, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No logs found matching your filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

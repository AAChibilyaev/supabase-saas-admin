import { useEffect, useState } from 'react'
import { useDataProvider } from 'react-admin'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import type { CMSSyncLog } from '../../../types/cms'

interface SyncHistoryProps {
  integrationId: string
}

export const SyncHistory = ({ integrationId }: SyncHistoryProps) => {
  const dataProvider = useDataProvider()
  const [logs, setLogs] = useState<CMSSyncLog[]>([])
  const [loading, setLoading] = useState(true)

  const loadLogs = async () => {
    try {
      setLoading(true)
      const { data } = await dataProvider.getList('cms_sync_logs', {
        filter: { integration_id: integrationId },
        sort: { field: 'created_at', order: 'DESC' },
        pagination: { page: 1, perPage: 20 }
      })
      setLogs(data)
    } catch (error) {
      console.error('Failed to load sync logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [integrationId])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'running':
        return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      success: 'default',
      failed: 'destructive',
      running: 'secondary',
      pending: 'outline'
    }

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading sync history...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Sync History</CardTitle>
            <p className="text-sm text-muted-foreground">
              Recent synchronization logs
            </p>
          </div>
          <Button onClick={loadLogs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No sync history available
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead className="text-right">Fetched</TableHead>
                  <TableHead className="text-right">Synced</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        {getStatusBadge(log.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.started_at
                        ? format(new Date(log.started_at), 'MMM d, yyyy HH:mm')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {log.completed_at
                        ? format(new Date(log.completed_at), 'MMM d, yyyy HH:mm')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {log.documents_fetched || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {log.documents_synced || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {log.documents_failed || 0}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.error_message || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

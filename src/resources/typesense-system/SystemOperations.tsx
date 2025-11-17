import { useState } from 'react'
import { useDataProvider, Title, useNotify } from 'react-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Alert, AlertDescription } from '../../components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog'
import {
  Camera,
  Trash2,
  Database,
  Vote,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Info
} from 'lucide-react'

interface OperationResult {
  success: boolean
  message?: string
  data?: any
}

export const SystemOperations = () => {
  const [snapshotLoading, setSnapshotLoading] = useState(false)
  const [cacheLoading, setCacheLoading] = useState(false)
  const [compactLoading, setCompactLoading] = useState(false)
  const [voteLoading, setVoteLoading] = useState(false)
  const [operationResult, setOperationResult] = useState<OperationResult | null>(null)
  const [dialogOpen, setDialogOpen] = useState<string | null>(null)
  const dataProvider = useDataProvider()
  const notify = useNotify()

  const handleOperation = async (
    operation: string,
    loadingSetter: (loading: boolean) => void,
    successMessage: string
  ) => {
    try {
      loadingSetter(true)
      setOperationResult(null)

      const result = await dataProvider.create('typesense-system', {
        data: { operation }
      })

      setOperationResult({
        success: true,
        message: result.data?.message || successMessage,
        data: result.data
      })

      notify(successMessage, { type: 'success' })
      setDialogOpen(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to ${operation}`
      setOperationResult({
        success: false,
        message
      })
      notify(message, { type: 'error' })
    } finally {
      loadingSetter(false)
    }
  }

  const handleSnapshot = () => {
    handleOperation(
      'snapshot',
      setSnapshotLoading,
      'Snapshot created successfully'
    )
  }

  const handleClearCache = () => {
    handleOperation(
      'cache/clear',
      setCacheLoading,
      'Cache cleared successfully'
    )
  }

  const handleCompactDB = () => {
    handleOperation(
      'db/compact',
      setCompactLoading,
      'Database compaction initiated'
    )
  }

  const handleTriggerVote = () => {
    handleOperation(
      'vote',
      setVoteLoading,
      'Leader re-election triggered'
    )
  }

  const ConfirmDialog = ({
    trigger,
    title,
    description,
    onConfirm,
    loading,
    variant = 'default'
  }: {
    trigger: React.ReactNode
    title: string
    description: string
    onConfirm: () => void
    loading: boolean
    variant?: 'default' | 'destructive'
  }) => (
    <Dialog open={dialogOpen === title} onOpenChange={(open) => setDialogOpen(open ? title : null)}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setDialogOpen(null)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="p-6 space-y-6">
      <Title title="System Operations" />

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Administrative operations for managing your Typesense cluster. Use with caution.
        </AlertDescription>
      </Alert>

      {operationResult && (
        <Alert variant={operationResult.success ? 'default' : 'destructive'}>
          {operationResult.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription>{operationResult.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Snapshot Operation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Create Snapshot
            </CardTitle>
            <CardDescription>
              Create a point-in-time backup of the current database state
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                Creates a snapshot for backup purposes. This is useful for:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Creating backups before major changes</li>
                <li>Disaster recovery planning</li>
                <li>Testing and development</li>
              </ul>
            </div>
            <ConfirmDialog
              trigger={
                <Button className="w-full" disabled={snapshotLoading}>
                  {snapshotLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Create Snapshot
                    </>
                  )}
                </Button>
              }
              title="Create Snapshot"
              description="This will create a point-in-time snapshot of your database. The operation may take a few moments to complete."
              onConfirm={handleSnapshot}
              loading={snapshotLoading}
            />
          </CardContent>
        </Card>

        {/* Clear Cache Operation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Clear Cache
            </CardTitle>
            <CardDescription>
              Clear the search cache to free memory and reset cached results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                Clears the search cache. Use this when:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Memory usage is high</li>
                <li>Search results seem stale</li>
                <li>After bulk data updates</li>
              </ul>
            </div>
            <ConfirmDialog
              trigger={
                <Button className="w-full" variant="outline" disabled={cacheLoading}>
                  {cacheLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Cache
                    </>
                  )}
                </Button>
              }
              title="Clear Cache"
              description="This will clear all cached search results. Searches may be slower temporarily until the cache is rebuilt."
              onConfirm={handleClearCache}
              loading={cacheLoading}
            />
          </CardContent>
        </Card>

        {/* Compact Database Operation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Compact Database
            </CardTitle>
            <CardDescription>
              Optimize database storage by removing deleted records and defragmenting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                Compacts the database to optimize storage. Benefits include:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Reduced disk usage</li>
                <li>Improved read performance</li>
                <li>Removal of deleted records</li>
              </ul>
              <Alert variant="default" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This operation may take time and increase CPU usage temporarily
                </AlertDescription>
              </Alert>
            </div>
            <ConfirmDialog
              trigger={
                <Button className="w-full" variant="outline" disabled={compactLoading}>
                  {compactLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Compacting...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Compact Database
                    </>
                  )}
                </Button>
              }
              title="Compact Database"
              description="This will compact the database to optimize storage and remove deleted records. The operation may take several minutes and temporarily increase CPU usage."
              onConfirm={handleCompactDB}
              loading={compactLoading}
            />
          </CardContent>
        </Card>

        {/* Trigger Re-election Operation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Trigger Re-election
            </CardTitle>
            <CardDescription>
              Force a leader re-election in the cluster (multi-node deployments)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                Triggers a leader re-election. Use this for:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Resolving cluster leader issues</li>
                <li>Load balancing across nodes</li>
                <li>Planned maintenance operations</li>
              </ul>
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  May cause brief service interruption in multi-node clusters
                </AlertDescription>
              </Alert>
            </div>
            <ConfirmDialog
              trigger={
                <Button className="w-full" variant="destructive" disabled={voteLoading}>
                  {voteLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Triggering...
                    </>
                  ) : (
                    <>
                      <Vote className="h-4 w-4 mr-2" />
                      Trigger Re-election
                    </>
                  )}
                </Button>
              }
              title="Trigger Leader Re-election"
              description="This will force a leader re-election in the cluster. This may cause a brief service interruption. Only proceed if you understand the implications."
              onConfirm={handleTriggerVote}
              loading={voteLoading}
              variant="destructive"
            />
          </CardContent>
        </Card>
      </div>

      {/* Operation Status */}
      {(snapshotLoading || cacheLoading || compactLoading || voteLoading) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Operation in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please wait while the operation completes. Do not close this window.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

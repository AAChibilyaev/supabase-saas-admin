import {
  List,
  Datagrid,
  TextField,
  DateField,
  BooleanField,
  FunctionField,
  EditButton,
  DeleteButton,
  FilterButton,
  CreateButton,
  TopToolbar,
  TextInput,
  SelectInput,
  BulkDeleteButton,
  usePermissions,
  useDataProvider,
  useNotify,
  useRefresh
} from 'react-admin'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { RefreshCw, Play } from 'lucide-react'
import { PermissionGate } from '../../components/permissions'
import { CMS_TYPES, SYNC_STATUSES } from '../../types/cms'
import { useState } from 'react'

const IntegrationListActions = () => (
  <TopToolbar>
    <FilterButton />
    <PermissionGate resource="cms_connections" action="create">
      <CreateButton />
    </PermissionGate>
  </TopToolbar>
)

const integrationFilters = [
  <TextInput key="search" label="Search" source="q" alwaysOn />,
  <TextInput key="name" label="Name" source="name" />,
  <SelectInput
    key="type"
    source="type"
    label="CMS Type"
    choices={CMS_TYPES.map(t => ({ id: t.id, name: t.name }))}
  />,
  <SelectInput
    key="is_active"
    source="is_active"
    label="Status"
    choices={[
      { id: 'true', name: 'Active' },
      { id: 'false', name: 'Inactive' }
    ]}
  />,
  <SelectInput
    key="sync_mode"
    source="sync_mode"
    label="Sync Mode"
    choices={[
      { id: 'manual', name: 'Manual' },
      { id: 'scheduled', name: 'Scheduled' },
      { id: 'webhook', name: 'Webhook' }
    ]}
  />
]

const SyncButton = ({ record }: any) => {
  const dataProvider = useDataProvider()
  const notify = useNotify()
  const refresh = useRefresh()
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      // Call a custom endpoint or edge function to trigger sync
      await dataProvider.update('cms_connections', {
        id: record.id,
        data: { action: 'sync' },
        previousData: record
      })
      notify('Sync started successfully', { type: 'success' })
      refresh()
    } catch (error) {
      // Log detailed error information
      console.error('CMS sync failed:', {
        integrationId: record.id,
        integrationName: record.name,
        cmsType: record.type,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error,
        timestamp: new Date().toISOString()
      })

      const errorMessage = error instanceof Error
        ? `Failed to start sync: ${error.message}`
        : 'Failed to start sync'

      notify(errorMessage, { type: 'error' })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Button
      onClick={handleSync}
      disabled={syncing || !record.is_active}
      size="sm"
      variant="outline"
    >
      {syncing ? (
        <>
          <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <Play className="mr-2 h-3 w-3" />
          Sync Now
        </>
      )}
    </Button>
  )
}

const CMSTypeBadge = ({ record }: any) => {
  const cmsType = CMS_TYPES.find(t => t.id === record.type)
  return <Badge variant="outline">{cmsType?.name || record.type}</Badge>
}

const SyncStatusBadge = ({ record }: any) => {
  const status = SYNC_STATUSES.find(s => s.id === record.last_sync_status)
  const variant = status?.color === 'green' ? 'default' :
                 status?.color === 'red' ? 'destructive' :
                 status?.color === 'yellow' ? 'secondary' : 'outline'

  return <Badge variant={variant as any}>{status?.name || 'Never'}</Badge>
}

const BulkActionButtons = () => (
  <>
    <BulkDeleteButton />
  </>
)

export const IntegrationList = () => {
  return (
    <List
      filters={integrationFilters}
      actions={<IntegrationListActions />}
      sort={{ field: 'created_at', order: 'DESC' }}
    >
      <Datagrid
        bulkActionButtons={<BulkActionButtons />}
        rowClick="edit"
      >
        <TextField source="name" label="Name" />
        <FunctionField
          label="CMS Type"
          render={(record: any) => <CMSTypeBadge record={record} />}
        />
        <TextField source="typesense_collection" label="Collection" />
        <BooleanField source="is_active" label="Active" />
        <TextField source="sync_mode" label="Sync Mode" />
        <FunctionField
          label="Last Sync Status"
          render={(record: any) => <SyncStatusBadge record={record} />}
        />
        <DateField source="last_sync_at" label="Last Sync" showTime />
        <TextField source="last_sync_count" label="Documents" />
        <FunctionField
          label="Actions"
          render={(record: any) => (
            <div className="flex items-center gap-2">
              <SyncButton record={record} />
              <EditButton />
              <PermissionGate resource="cms_connections" action="delete">
                <DeleteButton />
              </PermissionGate>
            </div>
          )}
        />
      </Datagrid>
    </List>
  )
}

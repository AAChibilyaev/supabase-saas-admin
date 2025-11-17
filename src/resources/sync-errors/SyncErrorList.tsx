import {
  List,
  Datagrid,
  TextField,
  DateField,
  ReferenceField,
  FunctionField,
  FilterButton,
  ExportButton,
  TopToolbar,
  TextInput,
  SelectInput,
  BooleanField,
  usePermissions,
  ShowButton,
  Button,
  useRefresh,
  useNotify,
  useRecordContext,
  useUpdate,
} from 'react-admin'
import { Badge } from '../../components/ui/badge'
import { PermissionGate } from '../../components/permissions'
import type { UserPermissions } from '../../types/permissions'
import { DateRangeFilter } from '../../components/filters/DateRangeFilter'
import { FilterPresets } from '../../components/filters/FilterPresets'
import {
  createExporter,
  formatDateForExport,
} from '../../utils/exporter'
import { RefreshCw, CheckCircle } from 'lucide-react'

const SyncErrorListActions = () => {
  const { permissions } = usePermissions<UserPermissions>()

  return (
    <TopToolbar>
      <FilterPresets resource="sync_errors" />
      <FilterButton />
      <ExportButton />
    </TopToolbar>
  )
}

const syncErrorFilters = [
  <TextInput key="search" label="Search" source="q" alwaysOn />,
  <SelectInput
    key="operation_type"
    source="operation_type"
    label="Operation"
    choices={[
      { id: 'INSERT', name: 'Insert' },
      { id: 'UPDATE', name: 'Update' },
      { id: 'DELETE', name: 'Delete' },
    ]}
  />,
  <SelectInput
    key="resolved"
    source="resolved"
    label="Status"
    choices={[
      { id: 'false', name: 'Unresolved' },
      { id: 'true', name: 'Resolved' },
    ]}
  />,
  <DateRangeFilter key="created_at" source="created_at" label="Date Range" />
]

const OperationBadge = ({ record }: { record?: any }) => {
  if (!record) return null

  const operation = record.operation_type
  const variant = operation === 'INSERT' ? 'default' :
                  operation === 'UPDATE' ? 'secondary' : 'outline'

  return <Badge variant={variant}>{operation}</Badge>
}

const ResolvedBadge = ({ record }: { record?: any }) => {
  if (!record) return null

  const isResolved = !!record.resolved_at
  const variant = isResolved ? 'secondary' : 'default'
  const label = isResolved ? 'Resolved' : 'Unresolved'

  return <Badge variant={variant}>{label}</Badge>
}

const ErrorPreview = ({ record }: { record?: any }) => {
  if (!record || !record.error_message) return null

  const preview = record.error_message.length > 80
    ? record.error_message.substring(0, 80) + '...'
    : record.error_message

  return <span style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: '0.875rem' }}>{preview}</span>
}

const RetryButton = () => {
  const record = useRecordContext()
  const refresh = useRefresh()
  const notify = useNotify()
  const [update, { isLoading }] = useUpdate()

  if (!record || record.resolved_at) return null

  const handleRetry = async (e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      await update(
        'sync_errors',
        {
          id: record.id,
          data: {
            retry_count: (record.retry_count || 0) + 1,
            last_attempt_at: new Date().toISOString(),
          },
        },
        {
          onSuccess: () => {
            notify('Retry initiated successfully', { type: 'success' })
            refresh()
          },
          onError: () => {
            notify('Failed to retry sync', { type: 'error' })
          },
        }
      )
    } catch (error) {
      notify('Failed to retry sync', { type: 'error' })
    }
  }

  return (
    <Button
      label="Retry"
      onClick={handleRetry}
      disabled={isLoading}
    >
      <RefreshCw size={16} />
    </Button>
  )
}

const MarkResolvedButton = () => {
  const record = useRecordContext()
  const refresh = useRefresh()
  const notify = useNotify()
  const [update, { isLoading }] = useUpdate()

  if (!record || record.resolved_at) return null

  const handleMarkResolved = async (e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      await update(
        'sync_errors',
        {
          id: record.id,
          data: {
            resolved_at: new Date().toISOString(),
          },
        },
        {
          onSuccess: () => {
            notify('Marked as resolved', { type: 'success' })
            refresh()
          },
          onError: () => {
            notify('Failed to mark as resolved', { type: 'error' })
          },
        }
      )
    } catch (error) {
      notify('Failed to mark as resolved', { type: 'error' })
    }
  }

  return (
    <Button
      label="Resolve"
      onClick={handleMarkResolved}
      disabled={isLoading}
    >
      <CheckCircle size={16} />
    </Button>
  )
}

// CSV Exporter configuration
const syncErrorExporter = createExporter('sync_errors', {
  'ID': 'id',
  'Tenant ID': 'tenant_id',
  'Document ID': 'document_id',
  'Operation': 'operation_type',
  'Error Message': 'error_message',
  'Retry Count': 'retry_count',
  'Created At': (record: any) => formatDateForExport(record.created_at),
  'Last Attempt': (record: any) => formatDateForExport(record.last_attempt_at),
  'Resolved At': (record: any) => formatDateForExport(record.resolved_at),
})

export const SyncErrorList = () => {
  const { permissions } = usePermissions<UserPermissions>()

  return (
    <List
      filters={syncErrorFilters}
      actions={<SyncErrorListActions />}
      exporter={syncErrorExporter}
      perPage={25}
      sort={{ field: 'created_at', order: 'DESC' }}
    >
      <Datagrid rowClick="show">
        <ReferenceField source="tenant_id" reference="tenants" link="show">
          <TextField source="name" />
        </ReferenceField>
        <ReferenceField source="document_id" reference="documents" link="show">
          <TextField source="title" />
        </ReferenceField>
        <OperationBadge label="Operation" />
        <FunctionField
          label="Error"
          render={(record: any) => <ErrorPreview record={record} />}
        />
        <TextField source="retry_count" label="Retries" />
        <DateField source="created_at" label="Created" showTime />
        <ResolvedBadge label="Status" />
        {permissions?.canAccess('sync_errors', 'edit') && (
          <>
            <RetryButton />
            <MarkResolvedButton />
          </>
        )}
        {permissions?.canAccess('sync_errors', 'show') && <ShowButton />}
      </Datagrid>
    </List>
  )
}

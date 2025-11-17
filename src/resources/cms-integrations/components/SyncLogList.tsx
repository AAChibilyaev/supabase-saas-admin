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
  usePermissions,
  ShowButton,
  useListContext,
} from 'react-admin'
import { Box, Typography, LinearProgress, Chip } from '@mui/material'
import { Badge } from '../../../components/ui/badge'
import { PermissionGate } from '../../../components/permissions'
import type { UserPermissions } from '../../../types/permissions'
import { DateRangeFilter } from '../../../components/filters/DateRangeFilter'
import { FilterPresets } from '../../../components/filters/FilterPresets'
import {
  createExporter,
  formatDateForExport,
} from '../../../utils/exporter'
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react'

const SyncLogListActions = () => {
  const { permissions } = usePermissions<UserPermissions>()

  return (
    <TopToolbar>
      <FilterPresets resource="cms_sync_logs" />
      <FilterButton />
      <ExportButton />
    </TopToolbar>
  )
}

const syncLogFilters = [
  <TextInput key="search" label="Search" source="q" alwaysOn />,
  <SelectInput
    key="status"
    source="status"
    label="Status"
    choices={[
      { id: 'running', name: 'Running' },
      { id: 'success', name: 'Success' },
      { id: 'partial', name: 'Partial' },
      { id: 'failed', name: 'Failed' },
    ]}
  />,
  <DateRangeFilter key="started_at" source="started_at" label="Date Range" />
]

const StatusBadge = ({ record }: { record?: any }) => {
  if (!record) return null

  const status = record.status
  let variant: 'default' | 'secondary' | 'outline' | 'destructive' = 'default'
  let icon = null

  switch (status) {
    case 'running':
      variant = 'default'
      icon = <Clock size={14} style={{ marginRight: '4px' }} />
      break
    case 'success':
      variant = 'secondary'
      icon = <CheckCircle size={14} style={{ marginRight: '4px' }} />
      break
    case 'partial':
      variant = 'outline'
      icon = <AlertTriangle size={14} style={{ marginRight: '4px' }} />
      break
    case 'failed':
      variant = 'destructive'
      icon = <XCircle size={14} style={{ marginRight: '4px' }} />
      break
  }

  return (
    <Badge variant={variant}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {icon}
        {status}
      </Box>
    </Badge>
  )
}

const DurationField = ({ record }: { record?: any }) => {
  if (!record || !record.started_at || !record.completed_at) {
    return record?.status === 'running' ? <span>In progress...</span> : <span>-</span>
  }

  const start = new Date(record.started_at).getTime()
  const end = new Date(record.completed_at).getTime()
  const durationMs = end - start

  const seconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes > 0) {
    return <span>{minutes}m {remainingSeconds}s</span>
  }

  return <span>{seconds}s</span>
}

const SyncStatsField = ({ record }: { record?: any }) => {
  if (!record) return null

  const fetched = record.documents_fetched || 0
  const synced = record.documents_synced || 0
  const failed = record.documents_failed || 0

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <Chip
        label={`${synced} synced`}
        size="small"
        sx={{ bgcolor: '#dcfce7', color: '#166534' }}
      />
      {failed > 0 && (
        <Chip
          label={`${failed} failed`}
          size="small"
          sx={{ bgcolor: '#fee2e2', color: '#991b1b' }}
        />
      )}
    </Box>
  )
}

const SuccessRateField = ({ record }: { record?: any }) => {
  if (!record || !record.documents_fetched) return null

  const fetched = record.documents_fetched || 0
  const synced = record.documents_synced || 0
  const rate = fetched > 0 ? (synced / fetched) * 100 : 0

  const color = rate === 100 ? '#22c55e' : rate >= 80 ? '#eab308' : '#ef4444'

  return (
    <Box sx={{ width: '100%', minWidth: 120 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption">{rate.toFixed(0)}%</Typography>
        <Typography variant="caption">{synced}/{fetched}</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={rate}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: '#e5e7eb',
          '& .MuiLinearProgress-bar': {
            bgcolor: color,
          },
        }}
      />
    </Box>
  )
}

// CSV Exporter configuration
const syncLogExporter = createExporter('cms_sync_logs', {
  'ID': 'id',
  'Integration ID': 'integration_id',
  'Status': 'status',
  'Documents Fetched': 'documents_fetched',
  'Documents Synced': 'documents_synced',
  'Documents Failed': 'documents_failed',
  'Error Message': 'error_message',
  'Started At': (record: any) => formatDateForExport(record.started_at),
  'Completed At': (record: any) => formatDateForExport(record.completed_at),
})

export const SyncLogList = () => {
  const { permissions } = usePermissions<UserPermissions>()

  return (
    <List
      filters={syncLogFilters}
      actions={<SyncLogListActions />}
      exporter={syncLogExporter}
      perPage={25}
      sort={{ field: 'started_at', order: 'DESC' }}
    >
      <Datagrid rowClick="show">
        <ReferenceField source="integration_id" reference="cms_connections" link="show" label="Integration">
          <TextField source="name" />
        </ReferenceField>
        <StatusBadge label="Status" />
        <FunctionField
          label="Stats"
          render={(record: any) => <SyncStatsField record={record} />}
        />
        <FunctionField
          label="Success Rate"
          render={(record: any) => <SuccessRateField record={record} />}
        />
        <FunctionField
          label="Duration"
          render={(record: any) => <DurationField record={record} />}
        />
        <DateField source="started_at" label="Started" showTime />
        <DateField source="completed_at" label="Completed" showTime emptyText="Running" />
        {permissions?.canAccess('cms_sync_logs', 'show') && <ShowButton />}
      </Datagrid>
    </List>
  )
}

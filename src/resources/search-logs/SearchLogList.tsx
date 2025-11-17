import {
  List,
  Datagrid,
  TextField,
  DateField,
  NumberField,
  ReferenceField,
  FilterButton,
  ExportButton,
  TopToolbar,
  TextInput,
  DateInput,
  ReferenceInput,
  SelectInput,
  NumberInput,
  BulkDeleteButton
} from 'react-admin'
import { Badge } from '../../components/ui/badge'
import { DateRangeFilter } from '../../components/filters/DateRangeFilter'
import { FilterPresets } from '../../components/filters/FilterPresets'
import {
  createExporter,
  formatDateForExport
} from '../../utils/exporter'
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription'
import { PermissionGate } from '../../components/permissions'

const SearchLogListActions = () => (
  <TopToolbar>
    <FilterPresets resource="search_logs" />
    <FilterButton />
    <PermissionGate resource="search_logs" action="export">
      <ExportButton />
    </PermissionGate>
  </TopToolbar>
)

const searchLogFilters = [
  <TextInput key="search" label="Search Query" source="query" alwaysOn />,
  <TextInput key="ip" label="IP Address" source="ip_address" />,
  <ReferenceInput
    key="tenant"
    source="tenant_id"
    reference="tenants"
    label="Tenant"
  >
    <SelectInput optionText="name" />
  </ReferenceInput>,
  <NumberInput key="min_results" source="results_count_gte" label="Min Results" />,
  <NumberInput key="max_results" source="results_count_lte" label="Max Results" />,
  <NumberInput key="max_response_time" source="response_time_ms_lte" label="Max Response Time (ms)" />,
  <DateRangeFilter key="created_at" source="created_at" label="Date Range" />
]

const ResponseTimeField = ({ record }: { record?: any }) => {
  if (!record?.response_time_ms) return null

  const getVariant = (ms: number) => {
    if (ms < 100) return 'default'
    if (ms < 500) return 'secondary'
    return 'destructive'
  }

  return (
    <Badge variant={getVariant(record.response_time_ms)}>
      {record.response_time_ms}ms
    </Badge>
  )
}

const ResultsCountField = ({ record }: { record?: any }) => {
  if (record?.results_count === undefined) return null

  return (
    <Badge variant="outline">
      {record.results_count} results
    </Badge>
  )
}

// CSV Exporter configuration
const searchLogExporter = createExporter('search-logs', {
  'ID': 'id',
  'Query': 'query',
  'Tenant ID': 'tenant_id',
  'Results Count': 'results_count',
  'Response Time (ms)': 'response_time_ms',
  'IP Address': 'ip_address',
  'User Agent': 'user_agent',
  'Created At': (record: any) => formatDateForExport(record.created_at),
})

// Bulk action buttons - allowing bulk delete for search logs
const SearchLogBulkActionButtons = () => (
  <>
    <BulkDeleteButton
      mutationMode="pessimistic"
      confirmTitle="Delete Search Logs"
      confirmContent="Are you sure you want to delete these search logs?"
    />
  </>
)

export const SearchLogList = () => {
  // Enable real-time updates for search logs
  useRealtimeSubscription({
    resource: 'search_logs',
    showNotifications: true,
  })

  return (
    <List
      filters={searchLogFilters}
      actions={<SearchLogListActions />}
      exporter={searchLogExporter}
      perPage={50}
      sort={{ field: 'created_at', order: 'DESC' }}
    >
      <Datagrid bulkActionButtons={<SearchLogBulkActionButtons />}>
        <TextField source="query" label="Query" />
        <ReferenceField source="tenant_id" reference="tenants" label="Tenant" link="show">
          <TextField source="name" />
        </ReferenceField>
        <ResultsCountField label="Results" />
        <ResponseTimeField label="Response Time" />
        <TextField source="ip_address" label="IP" />
        <DateField source="created_at" label="Timestamp" showTime />
      </Datagrid>
    </List>
  )
}

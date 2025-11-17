import {
  List,
  Datagrid,
  TextField,
  DateField,
  NumberField,
  ReferenceField,
  FilterButton,
  TopToolbar,
  TextInput,
  DateInput,
  ReferenceInput,
  SelectInput
} from 'react-admin'
import { Badge } from '../../components/ui/badge'

const SearchLogListActions = () => (
  <TopToolbar>
    <FilterButton />
  </TopToolbar>
)

const searchLogFilters = [
  <TextInput key="search" label="Search Query" source="query" alwaysOn />,
  <ReferenceInput
    key="tenant"
    source="tenant_id"
    reference="tenants"
    label="Tenant"
  >
    <SelectInput optionText="name" />
  </ReferenceInput>,
  <DateInput key="date_from" source="created_at_gte" label="From" />,
  <DateInput key="date_to" source="created_at_lte" label="To" />
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

export const SearchLogList = () => (
  <List
    filters={searchLogFilters}
    actions={<SearchLogListActions />}
    perPage={50}
    sort={{ field: 'created_at', order: 'DESC' }}
  >
    <Datagrid bulkActionButtons={false}>
      <TextField source="query" label="Query" />
      <ReferenceField source="tenant_id" reference="tenants" label="Tenant" link="show">
        <TextField source="name" />
      </ReferenceField>
      <ResultsCountField source="results_count" label="Results" />
      <ResponseTimeField source="response_time_ms" label="Response Time" />
      <TextField source="ip_address" label="IP" />
      <DateField source="created_at" label="Timestamp" showTime />
    </Datagrid>
  </List>
)

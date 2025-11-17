import {
  List,
  Datagrid,
  TextField,
  DateField,
  EditButton,
  DeleteButton,
  FilterButton,
  CreateButton,
  ExportButton,
  TopToolbar,
  TextInput,
  usePermissions,
  FunctionField,
  CloneButton,
  ShowButton
} from 'react-admin'
import { Badge } from '../../components/ui/badge'
import { PermissionGate } from '../../components/permissions'
import type { UserPermissions } from '../../types/permissions'
import { createExporter, formatDateForExport } from '../../utils/exporter'

const PresetListActions = () => {
  return (
    <TopToolbar>
      <FilterButton />
      <ExportButton />
      <PermissionGate resource="presets" action="create">
        <CreateButton />
      </PermissionGate>
    </TopToolbar>
  )
}

const presetFilters = [
  <TextInput key="search" label="Search" source="q" alwaysOn />,
  <TextInput key="name" label="Name" source="name" />,
  <TextInput key="description" label="Description" source="description" />
]

// Display parameters as a formatted badge/chip
const ParametersField = ({ record }: { record?: any }) => {
  if (!record || !record.parameters) return null

  const params = record.parameters
  const paramCount = Object.keys(params).filter(
    key => params[key] !== null && params[key] !== undefined && params[key] !== ''
  ).length

  return <Badge variant="outline">{paramCount} parameters</Badge>
}

// Display query by fields
const QueryByField = ({ record }: { record?: any }) => {
  if (!record || !record.parameters || !record.parameters.query_by) return null

  const queryBy = record.parameters.query_by
  const fields = Array.isArray(queryBy) ? queryBy : queryBy.split(',')

  return (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      {fields.slice(0, 3).map((field: string, idx: number) => (
        <Badge key={idx} variant="secondary">
          {field.trim()}
        </Badge>
      ))}
      {fields.length > 3 && (
        <Badge variant="outline">+{fields.length - 3} more</Badge>
      )}
    </div>
  )
}

// CSV Exporter configuration
const presetExporter = createExporter('presets', {
  'ID': 'id',
  'Name': 'name',
  'Description': 'description',
  'Query By': (record: any) => record.parameters?.query_by || '',
  'Filter By': (record: any) => record.parameters?.filter_by || '',
  'Sort By': (record: any) => record.parameters?.sort_by || '',
  'Per Page': (record: any) => record.parameters?.per_page || '',
  'Created At': (record: any) => formatDateForExport(record.created_at),
  'Updated At': (record: any) => formatDateForExport(record.updated_at),
})

export const PresetList = () => {
  const { permissions } = usePermissions<UserPermissions>()

  return (
    <List
      filters={presetFilters}
      actions={<PresetListActions />}
      exporter={presetExporter}
      perPage={25}
      sort={{ field: 'created_at', order: 'DESC' }}
    >
      <Datagrid rowClick="edit">
        <TextField source="name" label="Preset Name" />
        <TextField source="description" label="Description" />
        <QueryByField label="Query Fields" />
        <ParametersField label="Parameters" />
        <DateField source="created_at" label="Created" showTime />
        <DateField source="updated_at" label="Updated" showTime />
        {permissions?.canAccess('presets', 'edit') && (
          <>
            <CloneButton />
            <EditButton />
          </>
        )}
        {permissions?.canAccess('presets', 'show') && <ShowButton />}
        {permissions?.canAccess('presets', 'delete') && <DeleteButton />}
      </Datagrid>
    </List>
  )
}

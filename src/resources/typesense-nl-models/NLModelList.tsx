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

const NLModelListActions = () => {
  return (
    <TopToolbar>
      <FilterButton />
      <ExportButton />
      <PermissionGate resource="typesense-nl-models" action="create">
        <CreateButton />
      </PermissionGate>
    </TopToolbar>
  )
}

const nlModelFilters = [
  <TextInput key="search" label="Search" source="q" alwaysOn />,
  <TextInput key="name" label="Model Name" source="model_name" />,
  <TextInput key="type" label="Type" source="model_type" />
]

// Display model type with appropriate styling
const ModelTypeField = ({ record }: { record?: any }) => {
  if (!record || !record.model_type) return null

  const typeColors: Record<string, string> = {
    'embedding': 'default',
    'semantic': 'secondary',
    'conversational': 'outline'
  }

  const variant = typeColors[record.model_type] || 'default'

  return (
    <Badge variant={variant as any}>
      {record.model_type}
    </Badge>
  )
}

// Display model status
const StatusField = ({ record }: { record?: any }) => {
  if (!record || !record.status) return null

  const statusColors: Record<string, string> = {
    'active': 'default',
    'training': 'secondary',
    'inactive': 'outline',
    'error': 'destructive'
  }

  const variant = statusColors[record.status] || 'default'

  return (
    <Badge variant={variant as any}>
      {record.status}
    </Badge>
  )
}

// Display embedding dimensions
const EmbeddingDimensionsField = ({ record }: { record?: any }) => {
  if (!record || !record.embedding_dimensions) return null

  return (
    <Badge variant="outline">
      {record.embedding_dimensions}D
    </Badge>
  )
}

// CSV Exporter configuration
const nlModelExporter = createExporter('nl-models', {
  'ID': 'id',
  'Model Name': 'model_name',
  'Model Type': 'model_type',
  'Status': 'status',
  'Embedding Dimensions': 'embedding_dimensions',
  'Base Model': 'base_model',
  'Description': 'description',
  'Created At': (record: any) => formatDateForExport(record.created_at),
  'Updated At': (record: any) => formatDateForExport(record.updated_at),
})

export const NLModelList = () => {
  const { permissions } = usePermissions<UserPermissions>()

  return (
    <List
      filters={nlModelFilters}
      actions={<NLModelListActions />}
      exporter={nlModelExporter}
      perPage={25}
      sort={{ field: 'created_at', order: 'DESC' }}
    >
      <Datagrid rowClick="edit">
        <TextField source="model_name" label="Model Name" />
        <ModelTypeField label="Type" />
        <StatusField label="Status" />
        <TextField source="base_model" label="Base Model" />
        <EmbeddingDimensionsField label="Dimensions" />
        <DateField source="created_at" label="Created" showTime />
        <DateField source="updated_at" label="Updated" showTime />
        {permissions?.canAccess('typesense-nl-models', 'edit') && (
          <>
            <CloneButton />
            <EditButton />
          </>
        )}
        {permissions?.canAccess('typesense-nl-models', 'show') && <ShowButton />}
        {permissions?.canAccess('typesense-nl-models', 'delete') && <DeleteButton />}
      </Datagrid>
    </List>
  )
}

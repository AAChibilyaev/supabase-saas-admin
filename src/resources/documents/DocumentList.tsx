import {
  List,
  Datagrid,
  TextField,
  DateField,
  NumberField,
  BooleanField,
  ReferenceField,
  EditButton,
  FilterButton,
  CreateButton,
  TopToolbar,
  TextInput,
  SelectInput,
  ReferenceInput
} from 'react-admin'
import { Badge } from '../../components/ui/badge'
import { CheckCircle2, XCircle } from 'lucide-react'

const DocumentListActions = () => (
  <TopToolbar>
    <FilterButton />
    <CreateButton />
  </TopToolbar>
)

const documentFilters = [
  <TextInput key="search" label="Search" source="q" alwaysOn />,
  <ReferenceInput
    key="tenant"
    source="tenant_id"
    reference="tenants"
    label="Tenant"
  >
    <SelectInput optionText="name" />
  </ReferenceInput>,
  <SelectInput
    key="file_type"
    source="file_type"
    label="File Type"
    choices={[
      { id: 'pdf', name: 'PDF' },
      { id: 'docx', name: 'DOCX' },
      { id: 'txt', name: 'TXT' },
      { id: 'md', name: 'Markdown' },
      { id: 'html', name: 'HTML' }
    ]}
  />
]

const EmbeddingStatusField = ({ record }: { record?: any }) => {
  if (!record) return null

  return (
    <div className="flex items-center gap-2">
      {record.embedding_generated ? (
        <>
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <Badge variant="outline">Generated</Badge>
        </>
      ) : (
        <>
          <XCircle className="w-4 h-4 text-gray-400" />
          <Badge variant="secondary">Pending</Badge>
        </>
      )}
    </div>
  )
}

const FileSizeField = ({ record }: { record?: any }) => {
  if (!record?.file_size) return null

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return <span>{formatBytes(record.file_size)}</span>
}

export const DocumentList = () => (
  <List
    filters={documentFilters}
    actions={<DocumentListActions />}
    perPage={25}
    sort={{ field: 'created_at', order: 'DESC' }}
  >
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="title" />
      <ReferenceField source="tenant_id" reference="tenants" label="Tenant">
        <TextField source="name" />
      </ReferenceField>
      <TextField source="file_type" label="Type" />
      <FileSizeField source="file_size" label="Size" />
      <EmbeddingStatusField source="embedding_generated" label="Embedding" />
      <DateField source="created_at" label="Created" showTime />
      <EditButton />
    </Datagrid>
  </List>
)

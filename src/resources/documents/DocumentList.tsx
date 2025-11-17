import {
  List,
  Datagrid,
  TextField,
  DateField,
  NumberField,
  BooleanField,
  ReferenceField,
  EditButton,
  DeleteButton,
  FilterButton,
  CreateButton,
  ExportButton,
  TopToolbar,
  TextInput,
  SelectInput,
  ReferenceInput,
  BulkDeleteButton,
  usePermissions
} from 'react-admin'
import { Badge } from '../../components/ui/badge'
import { CheckCircle2, XCircle } from 'lucide-react'
import { DateRangeFilter } from '../../components/filters/DateRangeFilter'
import { FilterPresets } from '../../components/filters/FilterPresets'
import {
  createExporter,
  formatDateForExport,
  formatBooleanForExport
} from '../../utils/exporter'
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription'
import { PermissionGate } from '../../components/permissions'
import type { UserPermissions } from '../../types/permissions'
import { EmbeddingStatus } from './EmbeddingStatus'
import { BatchEmbeddingButton } from './BatchEmbedding'

const DocumentListActions = () => (
  <TopToolbar>
    <FilterPresets resource="documents" />
    <FilterButton />
    <BatchEmbeddingButton />
    <PermissionGate resource="documents" action="export">
      <ExportButton />
    </PermissionGate>
    <PermissionGate resource="documents" action="create">
      <CreateButton />
    </PermissionGate>
  </TopToolbar>
)

const documentFilters = [
  <TextInput key="search" label="Search" source="q" alwaysOn />,
  <TextInput key="title" label="Title" source="title" />,
  <TextInput key="content" label="Content" source="content_text" />,
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
  />,
  <SelectInput
    key="embedding"
    source="embedding_generated"
    label="Embedding Status"
    choices={[
      { id: 'true', name: 'Generated' },
      { id: 'false', name: 'Pending' }
    ]}
  />,
  <DateRangeFilter key="created_at" source="created_at" label="Created Date" />
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

// CSV Exporter configuration
const documentExporter = createExporter('documents', {
  'ID': 'id',
  'Title': 'title',
  'Tenant ID': 'tenant_id',
  'File Type': 'file_type',
  'File Size': (record: any) => record.file_size || '',
  'File Path': 'file_path',
  'Embedding Generated': (record: any) => formatBooleanForExport(record.embedding_generated),
  'Content Preview': (record: any) => record.content_text?.substring(0, 100) || '',
  'Created At': (record: any) => formatDateForExport(record.created_at),
  'Updated At': (record: any) => formatDateForExport(record.updated_at),
})

// Bulk action buttons
const DocumentBulkActionButtons = () => (
  <>
    <BulkDeleteButton
      mutationMode="pessimistic"
      confirmTitle="Delete Documents"
      confirmContent="Are you sure you want to delete these documents? This action cannot be undone."
    />
  </>
)

export const DocumentList = () => {
  const { permissions } = usePermissions<UserPermissions>()

  // Enable real-time updates for documents
  useRealtimeSubscription({
    resource: 'documents',
    showNotifications: true,
  })

  return (
    <List
      filters={documentFilters}
      actions={<DocumentListActions />}
      exporter={documentExporter}
      perPage={25}
      sort={{ field: 'created_at', order: 'DESC' }}
    >
      <Datagrid
        rowClick="edit"
        bulkActionButtons={<DocumentBulkActionButtons />}
      >
        <TextField source="title" />
        <ReferenceField source="tenant_id" reference="tenants" label="Tenant">
          <TextField source="name" />
        </ReferenceField>
        <TextField source="file_type" label="Type" />
        <FileSizeField label="Size" />
        <EmbeddingStatus label="Embedding" />
        <DateField source="created_at" label="Created" showTime />
        {permissions?.canAccess('documents', 'edit') && <EditButton />}
        {permissions?.canAccess('documents', 'delete') && <DeleteButton />}
      </Datagrid>
    </List>
  )
}

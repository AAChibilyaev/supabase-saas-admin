import {
  List,
  Datagrid,
  TextField,
  DateField,
  EmailField,
  FunctionField,
  FilterButton,
  ExportButton,
  TopToolbar,
  TextInput,
  SelectInput,
  BulkDeleteButton,
  BulkUpdateButton,
  usePermissions,
  ShowButton,
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

const ContactMessageListActions = () => {
  const { permissions } = usePermissions<UserPermissions>()

  return (
    <TopToolbar>
      <FilterPresets resource="contact_messages" />
      <FilterButton />
      <ExportButton />
    </TopToolbar>
  )
}

const contactMessageFilters = [
  <TextInput key="search" label="Search" source="q" alwaysOn />,
  <TextInput key="email" label="Email" source="email" />,
  <TextInput key="name" label="Name" source="name" />,
  <SelectInput
    key="status"
    source="status"
    label="Status"
    choices={[
      { id: 'new', name: 'New' },
      { id: 'read', name: 'Read' },
      { id: 'archived', name: 'Archived' },
    ]}
  />,
  <DateRangeFilter key="created_at" source="created_at" label="Date Range" />
]

const StatusField = ({ record }: { record?: any }) => {
  if (!record) return null

  const status = record.status || 'new'
  const variant = status === 'new' ? 'default' :
                  status === 'read' ? 'secondary' : 'outline'

  return <Badge variant={variant}>{status}</Badge>
}

const MessagePreview = ({ record }: { record?: any }) => {
  if (!record || !record.body) return null

  const preview = record.body.length > 100
    ? record.body.substring(0, 100) + '...'
    : record.body

  return <span style={{ color: '#6b7280' }}>{preview}</span>
}

// CSV Exporter configuration
const contactMessageExporter = createExporter('contact_messages', {
  'ID': 'id',
  'Name': 'name',
  'Email': 'email',
  'Subject': 'subject',
  'Message': 'body',
  'Status': 'status',
  'Created At': (record: any) => formatDateForExport(record.created_at),
  'Updated At': (record: any) => formatDateForExport(record.updated_at),
})

// Bulk action buttons
const ContactMessageBulkActionButtons = () => {
  const { permissions } = usePermissions<UserPermissions>()

  if (!permissions?.canAccess('contact_messages', 'edit')) {
    return false
  }

  return (
    <>
      <BulkUpdateButton
        data={{ status: 'read' }}
        label="Mark as Read"
      />
      <BulkUpdateButton
        data={{ status: 'archived' }}
        label="Archive"
      />
      <BulkDeleteButton
        mutationMode="pessimistic"
        confirmTitle="Delete Messages"
        confirmContent="Are you sure you want to delete these messages? This action cannot be undone."
      />
    </>
  )
}

export const ContactMessageList = () => {
  const { permissions } = usePermissions<UserPermissions>()

  return (
    <List
      filters={contactMessageFilters}
      actions={<ContactMessageListActions />}
      exporter={contactMessageExporter}
      perPage={25}
      sort={{ field: 'created_at', order: 'DESC' }}
    >
      <Datagrid
        rowClick="show"
        bulkActionButtons={<ContactMessageBulkActionButtons />}
      >
        <TextField source="name" label="Name" />
        <EmailField source="email" label="Email" />
        <TextField source="subject" label="Subject" />
        <FunctionField
          label="Message Preview"
          render={(record: any) => <MessagePreview record={record} />}
        />
        <StatusField label="Status" />
        <DateField source="created_at" label="Date" showTime />
        {permissions?.canAccess('contact_messages', 'show') && <ShowButton />}
      </Datagrid>
    </List>
  )
}

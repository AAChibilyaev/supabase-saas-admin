import {
  List,
  Datagrid,
  TextField,
  DateField,
  NumberField,
  BooleanField,
  ReferenceField,
  FilterButton,
  CreateButton,
  ExportButton,
  TopToolbar,
  TextInput,
  ReferenceInput,
  SelectInput,
  BooleanInput,
  BulkDeleteButton,
  BulkUpdateButton
} from 'react-admin'
import { Badge } from '../../components/ui/badge'
import { Key, Shield, AlertTriangle } from 'lucide-react'
import { DateRangeFilter } from '../../components/filters/DateRangeFilter'
import { FilterPresets } from '../../components/filters/FilterPresets'
import {
  createExporter,
  formatDateForExport,
  formatArrayForExport,
  formatBooleanForExport
} from '../../utils/exporter'
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription'

const ApiKeyListActions = () => (
  <TopToolbar>
    <FilterPresets resource="api_keys" />
    <FilterButton />
    <ExportButton />
    <CreateButton />
  </TopToolbar>
)

const apiKeyFilters = [
  <TextInput key="search" label="Search" source="name" alwaysOn />,
  <TextInput key="key_prefix" label="Key Prefix" source="key_prefix" />,
  <ReferenceInput
    key="tenant"
    source="tenant_id"
    reference="tenants"
    label="Tenant"
  >
    <SelectInput optionText="name" />
  </ReferenceInput>,
  <BooleanInput key="active" source="is_active" label="Active Only" />,
  <SelectInput
    key="scope"
    source="scopes"
    label="Scope"
    choices={[
      { id: 'read', name: 'Read' },
      { id: 'write', name: 'Write' },
      { id: 'admin', name: 'Admin' }
    ]}
  />,
  <DateRangeFilter key="created_at" source="created_at" label="Created Date" />,
  <DateRangeFilter key="expires_at" source="expires_at" label="Expiration Date" />,
  <DateRangeFilter key="last_used_at" source="last_used_at" label="Last Used Date" />
]

const KeyPrefixField = ({ record }: { record?: any }) => {
  if (!record?.key_prefix) return null

  return (
    <div className="flex items-center gap-2">
      <Key className="w-4 h-4 text-muted-foreground" />
      <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
        {record.key_prefix}...
      </code>
    </div>
  )
}

const ScopesField = ({ record }: { record?: any }) => {
  if (!record?.scopes) return null

  return (
    <div className="flex gap-1 flex-wrap">
      {record.scopes.map((scope: string) => (
        <Badge
          key={scope}
          variant={scope === 'admin' ? 'destructive' : scope === 'write' ? 'default' : 'secondary'}
        >
          <Shield className="w-3 h-3 mr-1" />
          {scope}
        </Badge>
      ))}
    </div>
  )
}

const StatusField = ({ record }: { record?: any }) => {
  if (!record) return null

  const isExpired = record.expires_at && new Date(record.expires_at) < new Date()
  const isRevoked = record.revoked_at !== null

  if (isRevoked) {
    return (
      <Badge variant="destructive">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Revoked
      </Badge>
    )
  }

  if (isExpired) {
    return (
      <Badge variant="secondary">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Expired
      </Badge>
    )
  }

  if (record.is_active) {
    return <Badge variant="default">Active</Badge>
  }

  return <Badge variant="outline">Inactive</Badge>
}

// CSV Exporter configuration
const apiKeyExporter = createExporter('api-keys', {
  'ID': 'id',
  'Name': 'name',
  'Tenant ID': 'tenant_id',
  'Key Prefix': 'key_prefix',
  'Scopes': (record: any) => formatArrayForExport(record.scopes),
  'Is Active': (record: any) => formatBooleanForExport(record.is_active),
  'Usage Count': 'usage_count',
  'Rate Limit': 'rate_limit_per_minute',
  'Created At': (record: any) => formatDateForExport(record.created_at),
  'Expires At': (record: any) => formatDateForExport(record.expires_at),
  'Last Used At': (record: any) => formatDateForExport(record.last_used_at),
  'Revoked At': (record: any) => formatDateForExport(record.revoked_at),
})

// Bulk action buttons
const ApiKeyBulkActionButtons = () => (
  <>
    <BulkUpdateButton
      data={{ is_active: true }}
      label="Activate Keys"
    />
    <BulkUpdateButton
      data={{ is_active: false }}
      label="Deactivate Keys"
    />
    <BulkUpdateButton
      data={{ revoked_at: new Date().toISOString() }}
      label="Revoke Keys"
    />
    <BulkDeleteButton
      mutationMode="pessimistic"
      confirmTitle="Delete API Keys"
      confirmContent="Are you sure you want to delete these API keys? This action cannot be undone."
    />
  </>
)

export const ApiKeyList = () => {
  // Enable real-time updates for API keys
  useRealtimeSubscription({
    resource: 'tenant_api_keys',
    showNotifications: true,
  })

  return (
    <List
      filters={apiKeyFilters}
      actions={<ApiKeyListActions />}
      exporter={apiKeyExporter}
      perPage={25}
      sort={{ field: 'created_at', order: 'DESC' }}
    >
      <Datagrid
        rowClick="edit"
        bulkActionButtons={<ApiKeyBulkActionButtons />}
      >
        <TextField source="name" label="Name" />
        <ReferenceField source="tenant_id" reference="tenants" label="Tenant" link="show">
          <TextField source="name" />
        </ReferenceField>
        <KeyPrefixField label="Key" />
        <ScopesField label="Scopes" />
        <StatusField label="Status" />
        <NumberField source="usage_count" label="Usage" />
        <DateField source="last_used_at" label="Last Used" showTime />
        <DateField source="expires_at" label="Expires" showTime />
      </Datagrid>
    </List>
  )
}

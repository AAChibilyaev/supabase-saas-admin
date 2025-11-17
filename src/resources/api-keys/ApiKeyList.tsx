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
  TopToolbar,
  TextInput,
  ReferenceInput,
  SelectInput,
  BooleanInput
} from 'react-admin'
import { Badge } from '../../components/ui/badge'
import { Key, Shield, AlertTriangle } from 'lucide-react'

const ApiKeyListActions = () => (
  <TopToolbar>
    <FilterButton />
    <CreateButton />
  </TopToolbar>
)

const apiKeyFilters = [
  <TextInput key="search" label="Search" source="name" alwaysOn />,
  <ReferenceInput
    key="tenant"
    source="tenant_id"
    reference="tenants"
    label="Tenant"
  >
    <SelectInput optionText="name" />
  </ReferenceInput>,
  <BooleanInput key="active" source="is_active" label="Active Only" />
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

export const ApiKeyList = () => (
  <List
    filters={apiKeyFilters}
    actions={<ApiKeyListActions />}
    perPage={25}
    sort={{ field: 'created_at', order: 'DESC' }}
  >
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="name" label="Name" />
      <ReferenceField source="tenant_id" reference="tenants" label="Tenant" link="show">
        <TextField source="name" />
      </ReferenceField>
      <KeyPrefixField source="key_prefix" label="Key" />
      <ScopesField source="scopes" label="Scopes" />
      <StatusField label="Status" />
      <NumberField source="usage_count" label="Usage" />
      <DateField source="last_used_at" label="Last Used" showTime />
      <DateField source="expires_at" label="Expires" showTime />
    </Datagrid>
  </List>
)

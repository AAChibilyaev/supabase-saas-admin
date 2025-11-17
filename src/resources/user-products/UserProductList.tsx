import {
  List,
  Datagrid,
  TextField,
  DateField,
  ReferenceField,
  ChipField,
  ShowButton,
  FilterButton,
  TopToolbar,
  TextInput,
  SelectInput,
  usePermissions,
  BooleanField,
} from 'react-admin'
import { Badge } from '@/components/ui/badge'
import { PermissionGate } from '@/components/permissions'
import type { UserPermissions } from '@/types/permissions'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { useTenantContext } from '@/contexts/TenantContext'

const UserProductListActions = () => {
  return (
    <TopToolbar>
      <FilterButton />
    </TopToolbar>
  )
}

const userProductFilters = [
  <TextInput key="search" label="Search" source="q" alwaysOn />,
  <SelectInput
    key="type"
    source="type"
    label="Type"
    choices={[
      { id: 'payment', name: 'Payment' },
      { id: 'subscription', name: 'Subscription' },
    ]}
  />,
  <SelectInput
    key="is_active"
    source="is_active"
    label="Status"
    choices={[
      { id: true, name: 'Active' },
      { id: false, name: 'Inactive' },
    ]}
  />,
]

const StatusBadge = ({ record }: { record?: any }) => {
  if (!record) return null

  const variant = record.is_active ? 'default' : 'secondary'
  const label = record.is_active ? 'Active' : 'Inactive'

  return <Badge variant={variant}>{label}</Badge>
}

const TypeBadge = ({ record }: { record?: any }) => {
  if (!record) return null

  const variant = record.type === 'subscription' ? 'default' : 'outline'

  return <Badge variant={variant}>{record.type}</Badge>
}

export const UserProductList = () => {
  const { permissions } = usePermissions<UserPermissions>()
  const { selectedTenant } = useTenantContext()

  // Enable real-time updates
  useRealtimeSubscription({
    resource: 'user_products',
    showNotifications: true,
  })

  return (
    <List
      filters={userProductFilters}
      actions={<UserProductListActions />}
      perPage={25}
      sort={{ field: 'created_at', order: 'DESC' }}
    >
      <Datagrid rowClick="show">
        <TextField source="stripe_product_id" label="Product ID" />
        <TextField source="stripe_price_id" label="Price ID" />
        <TypeBadge label="Type" />
        <StatusBadge label="Status" />

        <ReferenceField
          source="user_id"
          reference="profiles"
          label="User"
          link="show"
        >
          <TextField source="name" />
        </ReferenceField>

        <ReferenceField
          source="tenant_id"
          reference="tenants"
          label="Tenant"
          link="show"
        >
          <TextField source="name" />
        </ReferenceField>

        <DateField source="created_at" label="Created" showTime />
        {permissions?.canAccess('user_products', 'show') && <ShowButton />}
      </Datagrid>
    </List>
  )
}

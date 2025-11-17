import {
  List,
  Datagrid,
  TextField,
  DateField,
  ReferenceField,
  ChipField,
  ShowButton,
  FilterButton,
  ExportButton,
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
import { DateRangeFilter } from '@/components/filters/DateRangeFilter'
import { FilterPresets } from '@/components/filters/FilterPresets'
import {
  createExporter,
  formatDateForExport,
} from '@/utils/exporter'

const UserProductListActions = () => {
  return (
    <TopToolbar>
      <FilterPresets resource="user_products" />
      <FilterButton />
      <ExportButton />
    </TopToolbar>
  )
}

const userProductFilters = [
  <TextInput key="search" label="Search" source="q" alwaysOn />,
  <TextInput key="stripe_product_id" label="Product ID" source="stripe_product_id" />,
  <TextInput key="stripe_price_id" label="Price ID" source="stripe_price_id" />,
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
  <DateRangeFilter key="created_at" source="created_at" label="Date Range" />,
]

// CSV Exporter configuration
const userProductExporter = createExporter('user_products', {
  'ID': 'id',
  'Stripe Product ID': 'stripe_product_id',
  'Stripe Price ID': 'stripe_price_id',
  'Type': 'type',
  'Status': (record: any) => record.is_active ? 'Active' : 'Inactive',
  'Stripe Customer ID': 'stripe_customer_id',
  'User ID': 'user_id',
  'Tenant ID': 'tenant_id',
  'Created At': (record: any) => formatDateForExport(record.created_at),
  'Updated At': (record: any) => formatDateForExport(record.updated_at),
})

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
      exporter={userProductExporter}
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

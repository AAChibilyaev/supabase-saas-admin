import {
  List,
  Datagrid,
  TextField,
  EmailField,
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
} from 'react-admin'
import { Badge } from '@/components/ui/badge'
import { PermissionGate } from '@/components/permissions'
import type { UserPermissions } from '@/types/permissions'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { DateRangeFilter } from '@/components/filters/DateRangeFilter'
import { FilterPresets } from '@/components/filters/FilterPresets'
import {
  createExporter,
  formatDateForExport,
} from '@/utils/exporter'

const StripeCustomerListActions = () => {
  return (
    <TopToolbar>
      <FilterPresets resource="stripe_customers" />
      <FilterButton />
      <ExportButton />
    </TopToolbar>
  )
}

const stripeCustomerFilters = [
  <TextInput key="search" label="Search" source="q" alwaysOn />,
  <TextInput key="email" label="Email" source="email" />,
  <TextInput key="stripe_customer_id" label="Stripe Customer ID" source="stripe_customer_id" />,
  <TextInput key="name" label="Name" source="name" />,
  <DateRangeFilter key="created_at" source="created_at" label="Date Range" />,
]

// CSV Exporter configuration
const stripeCustomerExporter = createExporter('stripe_customers', {
  'ID': 'id',
  'Email': 'email',
  'Name': 'name',
  'Stripe Customer ID': 'stripe_customer_id',
  'User ID': 'user_id',
  'Created At': (record: any) => formatDateForExport(record.created_at),
  'Updated At': (record: any) => formatDateForExport(record.updated_at),
})

const SubscriptionStatusField = ({ record }: { record?: any }) => {
  if (!record?.stripe_customer_id) {
    return <Badge variant="secondary">No Customer</Badge>
  }

  return <Badge variant="default">Active</Badge>
}

export const StripeCustomerList = () => {
  const { permissions } = usePermissions<UserPermissions>()

  // Enable real-time updates
  useRealtimeSubscription({
    resource: 'stripe_customers',
    showNotifications: true,
  })

  return (
    <List
      filters={stripeCustomerFilters}
      actions={<StripeCustomerListActions />}
      exporter={stripeCustomerExporter}
      perPage={25}
      sort={{ field: 'created_at', order: 'DESC' }}
    >
      <Datagrid rowClick="show">
        <EmailField source="email" label="Email" />
        <TextField source="stripe_customer_id" label="Stripe Customer ID" />
        <ReferenceField
          source="user_id"
          reference="profiles"
          label="User"
          link="show"
        >
          <TextField source="name" />
        </ReferenceField>
        <SubscriptionStatusField label="Status" />
        <DateField source="created_at" label="Created" showTime />
        {permissions?.canAccess('stripe_customers', 'show') && <ShowButton />}
      </Datagrid>
    </List>
  )
}

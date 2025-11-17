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
  TopToolbar,
  TextInput,
  SelectInput,
  usePermissions,
} from 'react-admin'
import { Badge } from '@/components/ui/badge'
import { PermissionGate } from '@/components/permissions'
import type { UserPermissions } from '@/types/permissions'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

const StripeCustomerListActions = () => {
  return (
    <TopToolbar>
      <FilterButton />
    </TopToolbar>
  )
}

const stripeCustomerFilters = [
  <TextInput key="search" label="Search" source="q" alwaysOn />,
  <TextInput key="email" label="Email" source="email" />,
  <TextInput key="stripe_customer_id" label="Stripe Customer ID" source="stripe_customer_id" />,
]

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

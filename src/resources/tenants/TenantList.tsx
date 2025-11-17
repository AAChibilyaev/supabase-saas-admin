import {
  List,
  Datagrid,
  TextField,
  DateField,
  ChipField,
  NumberField,
  EditButton,
  ShowButton,
  FilterButton,
  CreateButton,
  TopToolbar,
  TextInput,
  SelectInput
} from 'react-admin'
import { Badge } from '../../components/ui/badge'

const TenantListActions = () => (
  <TopToolbar>
    <FilterButton />
    <CreateButton />
  </TopToolbar>
)

const tenantFilters = [
  <TextInput key="search" label="Search" source="q" alwaysOn />,
  <SelectInput
    key="plan"
    source="plan_type"
    label="Plan"
    choices={[
      { id: 'free', name: 'Free' },
      { id: 'starter', name: 'Starter' },
      { id: 'pro', name: 'Pro' },
      { id: 'enterprise', name: 'Enterprise' }
    ]}
  />
]

const PlanField = ({ record }: { record?: any }) => {
  if (!record) return null

  const variant = record.plan_type === 'free' ? 'secondary' :
                  record.plan_type === 'enterprise' ? 'default' : 'outline'

  return <Badge variant={variant}>{record.plan_type}</Badge>
}

export const TenantList = () => (
  <List
    filters={tenantFilters}
    actions={<TenantListActions />}
    perPage={25}
    sort={{ field: 'created_at', order: 'DESC' }}
  >
    <Datagrid rowClick="show" bulkActionButtons={false}>
      <TextField source="name" label="Tenant Name" />
      <TextField source="slug" label="Slug" />
      <PlanField source="plan_type" label="Plan" />
      <TextField source="custom_domain" label="Domain" />
      <DateField source="created_at" label="Created" showTime />
      <DateField source="billing_cycle_end" label="Billing Cycle End" />
      <EditButton />
      <ShowButton />
    </Datagrid>
  </List>
)

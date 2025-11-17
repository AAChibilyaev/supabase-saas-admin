import {
  Show,
  SimpleShowLayout,
  TextField,
  EmailField,
  DateField,
  ReferenceField,
  TabbedShowLayout,
  Tab,
  ReferenceManyField,
  Datagrid,
  NumberField,
  ChipField,
  useRecordContext,
} from 'react-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, User, Calendar, DollarSign } from 'lucide-react'

const CustomerInfoCard = () => {
  const record = useRecordContext()
  if (!record) return null

  return (
    <div className="grid gap-4 md:grid-cols-2 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stripe Customer</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{record.stripe_customer_id}</div>
          <p className="text-xs text-muted-foreground mt-1">{record.email}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Customer Since</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {new Date(record.created_at).toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(record.created_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

const ProductStatusBadge = ({ record }: { record?: any }) => {
  if (!record) return null

  const variant = record.is_active ? 'default' : 'secondary'
  const label = record.is_active ? 'Active' : 'Inactive'

  return <Badge variant={variant}>{label}</Badge>
}

const ProductTypeBadge = ({ record }: { record?: any }) => {
  if (!record) return null

  const variant = record.type === 'subscription' ? 'default' : 'outline'

  return <Badge variant={variant}>{record.type}</Badge>
}

export const StripeCustomerShow = () => {
  return (
    <Show>
      <TabbedShowLayout>
        <Tab label="Overview">
          <CustomerInfoCard />

          <SimpleShowLayout>
            <EmailField source="email" label="Email" />
            <TextField source="stripe_customer_id" label="Stripe Customer ID" />
            <TextField source="name" label="Customer Name" />

            <ReferenceField
              source="user_id"
              reference="profiles"
              label="User Profile"
              link="show"
            >
              <TextField source="name" />
            </ReferenceField>

            <DateField source="created_at" label="Created At" showTime />
            <DateField source="updated_at" label="Updated At" showTime />
          </SimpleShowLayout>
        </Tab>

        <Tab label="Subscriptions & Products">
          <ReferenceManyField
            reference="user_products"
            target="stripe_customer_id"
            label="Products & Subscriptions"
          >
            <Datagrid rowClick="show">
              <TextField source="stripe_product_id" label="Product ID" />
              <TextField source="stripe_price_id" label="Price ID" />
              <ProductTypeBadge label="Type" />
              <ProductStatusBadge label="Status" />
              <ReferenceField
                source="tenant_id"
                reference="tenants"
                label="Tenant"
                link="show"
              >
                <TextField source="name" />
              </ReferenceField>
              <DateField source="created_at" label="Created" showTime />
            </Datagrid>
          </ReferenceManyField>
        </Tab>

        <Tab label="Metadata">
          <SimpleShowLayout>
            <TextField source="metadata" label="Metadata (JSON)" />
          </SimpleShowLayout>
        </Tab>
      </TabbedShowLayout>
    </Show>
  )
}

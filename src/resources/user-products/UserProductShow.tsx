import {
  Show,
  SimpleShowLayout,
  TextField,
  DateField,
  ReferenceField,
  BooleanField,
  useRecordContext,
} from 'react-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, CreditCard, Calendar, Building2 } from 'lucide-react'

const ProductInfoCard = () => {
  const record = useRecordContext()
  if (!record) return null

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Product Type</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold capitalize">{record.type}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {record.is_active ? 'Active' : 'Inactive'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stripe Product</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-mono truncate">{record.stripe_product_id}</div>
          {record.stripe_price_id && (
            <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
              {record.stripe_price_id}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Created</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {new Date(record.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(record.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

const StatusBadgeField = ({ record }: { record?: any }) => {
  if (!record) return null

  const variant = record.is_active ? 'default' : 'secondary'
  const label = record.is_active ? 'Active' : 'Inactive'

  return <Badge variant={variant}>{label}</Badge>
}

const TypeBadgeField = ({ record }: { record?: any }) => {
  if (!record) return null

  const variant = record.type === 'subscription' ? 'default' : 'outline'

  return <Badge variant={variant}>{record.type}</Badge>
}

export const UserProductShow = () => {
  return (
    <Show>
      <ProductInfoCard />

      <SimpleShowLayout>
        <TextField source="id" label="ID" />

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <TextField source="stripe_product_id" label="Stripe Product ID" />
          </div>
          <div>
            <TextField source="stripe_price_id" label="Stripe Price ID" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <TypeBadgeField label="Type" />
          </div>
          <div>
            <StatusBadgeField label="Status" />
          </div>
        </div>

        <TextField source="stripe_customer_id" label="Stripe Customer ID" />

        <ReferenceField
          source="user_id"
          reference="profiles"
          label="User Profile"
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

        <BooleanField source="is_active" label="Active" />

        <DateField source="created_at" label="Created At" showTime />
        <DateField source="updated_at" label="Updated At" showTime />
      </SimpleShowLayout>
    </Show>
  )
}

import {
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  DateInput,
  required,
  TabbedForm,
  FormTab,
  ReferenceManyField,
  Datagrid,
  TextField,
  DateField,
  NumberField,
  BooleanInput
} from 'react-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'

const validateName = [required()]
const validateSlug = [required()]

export const TenantEdit = () => (
  <Edit>
    <TabbedForm>
      <FormTab label="General" sx={{ maxWidth: '40em' }}>
        <TextInput source="name" validate={validateName} fullWidth />
        <TextInput source="slug" validate={validateSlug} fullWidth />
        <SelectInput
          source="plan_type"
          choices={[
            { id: 'free', name: 'Free' },
            { id: 'starter', name: 'Starter' },
            { id: 'pro', name: 'Pro' },
            { id: 'enterprise', name: 'Enterprise' }
          ]}
          fullWidth
        />
        <TextInput source="custom_domain" fullWidth />
        <DateInput source="billing_cycle_start" />
        <DateInput source="billing_cycle_end" />
      </FormTab>

      <FormTab label="Branding">
        <TextInput source="branding_logo_url" label="Logo URL" fullWidth />
        <TextInput source="branding_primary_color" label="Primary Color" />
        <SelectInput
          source="timezone"
          choices={[
            { id: 'UTC', name: 'UTC' },
            { id: 'America/New_York', name: 'America/New York' },
            { id: 'America/Los_Angeles', name: 'America/Los Angeles' },
            { id: 'Europe/London', name: 'Europe/London' },
            { id: 'Europe/Paris', name: 'Europe/Paris' },
            { id: 'Asia/Tokyo', name: 'Asia/Tokyo' }
          ]}
        />
        <SelectInput
          source="default_language"
          choices={[
            { id: 'en', name: 'English' },
            { id: 'ru', name: 'Russian' },
            { id: 'es', name: 'Spanish' },
            { id: 'fr', name: 'French' },
            { id: 'de', name: 'German' }
          ]}
        />
      </FormTab>

      <FormTab label="Documents">
        <ReferenceManyField reference="documents" target="tenant_id" label="">
          <Datagrid rowClick="show">
            <TextField source="title" />
            <TextField source="file_type" />
            <NumberField source="file_size" />
            <BooleanInput source="embedding_generated" disabled />
            <DateField source="created_at" showTime />
          </Datagrid>
        </ReferenceManyField>
      </FormTab>

      <FormTab label="Users">
        <ReferenceManyField reference="user_tenants" target="tenant_id" label="">
          <Datagrid>
            <TextField source="role" />
            <DateField source="created_at" showTime />
          </Datagrid>
        </ReferenceManyField>
      </FormTab>

      <FormTab label="Usage">
        <ReferenceManyField reference="tenant_usage" target="tenant_id" label="">
          <Datagrid>
            <NumberField source="document_count" />
            <NumberField source="search_queries_count" />
            <NumberField source="active_users_count" />
            <NumberField source="total_storage_bytes" />
            <DateField source="billing_month" />
          </Datagrid>
        </ReferenceManyField>
      </FormTab>
    </TabbedForm>
  </Edit>
)

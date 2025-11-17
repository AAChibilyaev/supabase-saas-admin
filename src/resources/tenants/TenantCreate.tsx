import {
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  required
} from 'react-admin'

const validateName = [required()]
const validateSlug = [required()]

export const TenantCreate = () => (
  <Create redirect="show">
    <SimpleForm>
      <TextInput source="name" validate={validateName} fullWidth />
      <TextInput
        source="slug"
        validate={validateSlug}
        helperText="URL-friendly identifier (lowercase, no spaces)"
        fullWidth
      />
      <SelectInput
        source="plan_type"
        choices={[
          { id: 'free', name: 'Free' },
          { id: 'starter', name: 'Starter' },
          { id: 'pro', name: 'Pro' },
          { id: 'enterprise', name: 'Enterprise' }
        ]}
        defaultValue="free"
        fullWidth
      />
      <TextInput source="custom_domain" label="Custom Domain (optional)" fullWidth />
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
        defaultValue="UTC"
      />
    </SimpleForm>
  </Create>
)

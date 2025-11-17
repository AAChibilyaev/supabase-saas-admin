import {
  Create,
  SimpleForm,
  TextInput,
  required,
} from 'react-admin'

export const UserCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="email" validate={[required()]} type="email" />
      <TextInput source="full_name" label="Full Name" />
    </SimpleForm>
  </Create>
)

import {
  Edit,
  SimpleForm,
  TextInput,
  DateInput,
  required,
} from 'react-admin'

export const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="email" validate={[required()]} type="email" />
      <TextInput source="full_name" label="Full Name" />
      <DateInput source="created_at" disabled />
    </SimpleForm>
  </Edit>
)

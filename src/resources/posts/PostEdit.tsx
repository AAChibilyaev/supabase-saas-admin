import {
  Edit,
  SimpleForm,
  TextInput,
  ReferenceInput,
  SelectInput,
  required,
} from 'react-admin'

export const PostEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="title" validate={[required()]} />
      <TextInput source="content" multiline rows={5} />
      <ReferenceInput source="user_id" reference="users">
        <SelectInput optionText="full_name" validate={[required()]} />
      </ReferenceInput>
    </SimpleForm>
  </Edit>
)

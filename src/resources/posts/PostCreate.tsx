import {
  Create,
  SimpleForm,
  TextInput,
  ReferenceInput,
  SelectInput,
  required,
} from 'react-admin'

export const PostCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="title" validate={[required()]} />
      <TextInput source="content" multiline rows={5} />
      <ReferenceInput source="user_id" reference="users">
        <SelectInput optionText="full_name" validate={[required()]} />
      </ReferenceInput>
    </SimpleForm>
  </Create>
)

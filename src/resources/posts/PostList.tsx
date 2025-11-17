import {
  List,
  Datagrid,
  TextField,
  ReferenceField,
  DateField,
} from 'react-admin'

export const PostList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <TextField source="title" />
      <ReferenceField source="user_id" reference="users" label="Author">
        <TextField source="full_name" />
      </ReferenceField>
      <DateField source="created_at" />
    </Datagrid>
  </List>
)

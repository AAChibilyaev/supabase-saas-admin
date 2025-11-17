import {
  List,
  Datagrid,
  TextField,
  EmailField,
  DateField,
} from 'react-admin'

export const UserList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <EmailField source="email" />
      <TextField source="full_name" label="Full Name" />
      <DateField source="created_at" />
    </Datagrid>
  </List>
)

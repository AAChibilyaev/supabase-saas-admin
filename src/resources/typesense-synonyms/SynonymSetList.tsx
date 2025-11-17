import {
  List,
  Datagrid,
  TextField,
  NumberField,
  EditButton,
  DeleteButton,
  CreateButton,
  TopToolbar,
  TextInput,
  FunctionField,
  usePermissions
} from 'react-admin'
import { Badge } from '../../components/ui/badge'
import { PermissionGate } from '../../components/permissions'
import type { UserPermissions } from '../../types/permissions'

const SynonymSetListActions = () => {
  const { permissions } = usePermissions<UserPermissions>()

  return (
    <TopToolbar>
      <PermissionGate resource="typesense-synonyms" action="create">
        <CreateButton />
      </PermissionGate>
    </TopToolbar>
  )
}

const synonymSetFilters = [
  <TextInput key="search" label="Search" source="q" alwaysOn />
]

const SynonymTypeField = ({ record }: { record?: any }) => {
  if (!record) return null

  const variant = record.root ? 'default' : 'secondary'
  const label = record.root ? 'One-way (A → B)' : 'Multi-way (A ↔ B)'

  return <Badge variant={variant}>{label}</Badge>
}

export const SynonymSetList = () => {
  const { permissions } = usePermissions<UserPermissions>()

  return (
    <List
      filters={synonymSetFilters}
      actions={<SynonymSetListActions />}
      perPage={25}
      sort={{ field: 'id', order: 'ASC' }}
    >
      <Datagrid rowClick="edit">
        <TextField source="id" label="Synonym Set Name" />
        <SynonymTypeField label="Type" />
        <FunctionField
          label="Synonyms"
          render={(record: any) => {
            if (record.root) {
              // One-way: show root → synonyms
              const synonyms = record.synonyms || []
              return `${record.root} → ${synonyms.join(', ')}`
            } else {
              // Multi-way: show all synonyms
              const synonyms = record.synonyms || []
              return synonyms.join(' ↔ ')
            }
          }}
        />
        <NumberField
          source="synonyms.length"
          label="Count"
          sortable={false}
        />
        {permissions?.canAccess('typesense-synonyms', 'edit') && <EditButton />}
        {permissions?.canAccess('typesense-synonyms', 'delete') && (
          <DeleteButton
            mutationMode="pessimistic"
            confirmTitle="Delete Synonym Set"
            confirmContent="Are you sure you want to delete this synonym set?"
          />
        )}
      </Datagrid>
    </List>
  )
}

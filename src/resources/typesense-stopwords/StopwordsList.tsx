import {
  List,
  Datagrid,
  TextField,
  FunctionField,
  EditButton,
  DeleteButton,
  FilterButton,
  CreateButton,
  TopToolbar,
  TextInput,
  SelectInput,
  usePermissions,
  BulkDeleteButton
} from 'react-admin'
import { Badge } from '../../components/ui/badge'
import { PermissionGate } from '../../components/permissions'
import type { UserPermissions } from '../../types/permissions'

const StopwordsListActions = () => {
  const { permissions } = usePermissions<UserPermissions>()

  return (
    <TopToolbar>
      <FilterButton />
      <PermissionGate resource="typesense-stopwords" action="create">
        <CreateButton />
      </PermissionGate>
    </TopToolbar>
  )
}

const stopwordsFilters = [
  <TextInput key="search" label="Search Set Name" source="q" alwaysOn />,
  <SelectInput
    key="locale"
    source="locale"
    label="Locale"
    choices={[
      { id: 'en', name: 'English' },
      { id: 'ru', name: 'Russian' },
      { id: 'es', name: 'Spanish' },
      { id: 'fr', name: 'French' },
      { id: 'de', name: 'German' },
      { id: 'it', name: 'Italian' },
      { id: 'pt', name: 'Portuguese' },
      { id: 'zh', name: 'Chinese' },
      { id: 'ja', name: 'Japanese' },
      { id: 'ko', name: 'Korean' }
    ]}
  />
]

const LocaleField = ({ record }: { record?: any }) => {
  if (!record || !record.locale) return <span>-</span>

  const localeNames: Record<string, string> = {
    'en': 'English',
    'ru': 'Russian',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean'
  }

  return <Badge variant="outline">{localeNames[record.locale] || record.locale}</Badge>
}

const WordCountField = ({ record }: { record?: any }) => {
  if (!record || !record.stopwords) return <span>0</span>

  return <span>{Array.isArray(record.stopwords) ? record.stopwords.length : 0}</span>
}

// Bulk action buttons
const StopwordsBulkActionButtons = () => {
  const { permissions } = usePermissions<UserPermissions>()

  if (!permissions?.canAccess('typesense-stopwords', 'edit')) {
    return false
  }

  return (
    <>
      <BulkDeleteButton
        mutationMode="pessimistic"
        confirmTitle="Delete Stopwords Sets"
        confirmContent="Are you sure you want to delete these stopwords sets? This action cannot be undone."
      />
    </>
  )
}

export const StopwordsList = () => {
  const { permissions } = usePermissions<UserPermissions>()

  return (
    <List
      filters={stopwordsFilters}
      actions={<StopwordsListActions />}
      perPage={25}
      sort={{ field: 'id', order: 'ASC' }}
    >
      <Datagrid
        rowClick="edit"
        bulkActionButtons={<StopwordsBulkActionButtons />}
      >
        <TextField source="id" label="Set ID" />
        <LocaleField label="Locale" />
        <FunctionField
          label="Word Count"
          render={(record: any) => <WordCountField record={record} />}
        />
        <FunctionField
          label="Preview"
          render={(record: any) => {
            if (!record || !record.stopwords || !Array.isArray(record.stopwords)) {
              return <span>-</span>
            }
            const preview = record.stopwords.slice(0, 5).join(', ')
            const more = record.stopwords.length > 5 ? '...' : ''
            return <span style={{ fontStyle: 'italic', color: '#666' }}>{preview}{more}</span>
          }}
        />
        {permissions?.canAccess('typesense-stopwords', 'edit') && <EditButton />}
        {permissions?.canAccess('typesense-stopwords', 'delete') && <DeleteButton />}
      </Datagrid>
    </List>
  )
}

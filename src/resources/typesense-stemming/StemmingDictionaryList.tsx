import {
  List,
  Datagrid,
  TextField,
  FunctionField,
  DeleteButton,
  CreateButton,
  TopToolbar,
  TextInput,
  SelectInput,
  usePermissions,
  BulkDeleteButton,
  ShowButton
} from 'react-admin'
import { Badge } from '../../components/ui/badge'
import { PermissionGate } from '../../components/permissions'
import type { UserPermissions } from '../../types/permissions'

const StemmingDictionaryListActions = () => {
  const { permissions } = usePermissions<UserPermissions>()

  return (
    <TopToolbar>
      <PermissionGate resource="typesense-stemming" action="create">
        <CreateButton label="Import Dictionary" />
      </PermissionGate>
    </TopToolbar>
  )
}

const stemmingDictionaryFilters = [
  <TextInput key="search" label="Search Dictionary" source="q" alwaysOn />,
  <SelectInput
    key="language"
    source="language"
    label="Language"
    choices={[
      { id: 'en', name: 'English' },
      { id: 'ru', name: 'Russian' },
      { id: 'es', name: 'Spanish' },
      { id: 'fr', name: 'French' },
      { id: 'de', name: 'German' },
      { id: 'it', name: 'Italian' },
      { id: 'pt', name: 'Portuguese' },
      { id: 'nl', name: 'Dutch' },
      { id: 'sv', name: 'Swedish' },
      { id: 'no', name: 'Norwegian' },
      { id: 'da', name: 'Danish' },
      { id: 'fi', name: 'Finnish' },
      { id: 'pl', name: 'Polish' },
      { id: 'cs', name: 'Czech' },
      { id: 'hu', name: 'Hungarian' },
      { id: 'ro', name: 'Romanian' },
      { id: 'tr', name: 'Turkish' },
      { id: 'ar', name: 'Arabic' },
      { id: 'zh', name: 'Chinese' },
      { id: 'ja', name: 'Japanese' },
      { id: 'ko', name: 'Korean' }
    ]}
  />
]

const LanguageField = ({ record }: { record?: any }) => {
  if (!record || !record.language) return <span>-</span>

  const languageNames: Record<string, string> = {
    'en': 'English',
    'ru': 'Russian',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'no': 'Norwegian',
    'da': 'Danish',
    'fi': 'Finnish',
    'pl': 'Polish',
    'cs': 'Czech',
    'hu': 'Hungarian',
    'ro': 'Romanian',
    'tr': 'Turkish',
    'ar': 'Arabic',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean'
  }

  return <Badge variant="outline">{languageNames[record.language] || record.language}</Badge>
}

const WordCountField = ({ record }: { record?: any }) => {
  if (!record || !record.rules) return <span>0</span>

  const count = Array.isArray(record.rules)
    ? record.rules.length
    : typeof record.rules === 'object'
      ? Object.keys(record.rules).length
      : 0

  return <span>{count}</span>
}

// Bulk action buttons
const StemmingDictionaryBulkActionButtons = () => {
  const { permissions } = usePermissions<UserPermissions>()

  if (!permissions?.canAccess('typesense-stemming', 'delete')) {
    return false
  }

  return (
    <>
      <BulkDeleteButton
        mutationMode="pessimistic"
        confirmTitle="Delete Stemming Dictionaries"
        confirmContent="Are you sure you want to delete these stemming dictionaries? This action cannot be undone."
      />
    </>
  )
}

export const StemmingDictionaryList = () => {
  const { permissions } = usePermissions<UserPermissions>()

  return (
    <List
      filters={stemmingDictionaryFilters}
      actions={<StemmingDictionaryListActions />}
      perPage={25}
      sort={{ field: 'id', order: 'ASC' }}
    >
      <Datagrid
        rowClick="show"
        bulkActionButtons={<StemmingDictionaryBulkActionButtons />}
      >
        <TextField source="id" label="Dictionary ID" />
        <FunctionField
          label="Language"
          render={(record: any) => <LanguageField record={record} />}
        />
        <FunctionField
          label="Word Count"
          render={(record: any) => <WordCountField record={record} />}
        />
        <FunctionField
          label="Preview"
          render={(record: any) => {
            if (!record || !record.rules) {
              return <span>-</span>
            }

            let preview = ''
            if (Array.isArray(record.rules)) {
              const sample = record.rules.slice(0, 2)
              preview = sample.map((rule: any) =>
                typeof rule === 'string' ? rule : `${rule.base} → ${rule.stem || rule.variant}`
              ).join(', ')
            } else if (typeof record.rules === 'object') {
              const entries = Object.entries(record.rules).slice(0, 2)
              preview = entries.map(([key, value]) => `${key} → ${value}`).join(', ')
            }

            const hasMore = (Array.isArray(record.rules) && record.rules.length > 2) ||
                           (typeof record.rules === 'object' && Object.keys(record.rules).length > 2)

            return (
              <span style={{ fontStyle: 'italic', color: '#666' }}>
                {preview}{hasMore ? '...' : ''}
              </span>
            )
          }}
        />
        {permissions?.canAccess('typesense-stemming', 'read') && <ShowButton />}
        {permissions?.canAccess('typesense-stemming', 'delete') && (
          <DeleteButton
            mutationMode="pessimistic"
            confirmTitle="Delete Stemming Dictionary"
            confirmContent="Are you sure you want to delete this stemming dictionary?"
          />
        )}
      </Datagrid>
    </List>
  )
}

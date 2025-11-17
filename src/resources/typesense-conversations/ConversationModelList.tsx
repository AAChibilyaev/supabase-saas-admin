import {
  List,
  Datagrid,
  TextField,
  DateField,
  EditButton,
  DeleteButton,
  FilterButton,
  CreateButton,
  ExportButton,
  TopToolbar,
  TextInput,
  usePermissions,
  FunctionField,
  ShowButton
} from 'react-admin'
import { Badge } from '../../components/ui/badge'
import { PermissionGate } from '../../components/permissions'
import type { UserPermissions } from '../../types/permissions'
import { createExporter, formatDateForExport } from '../../utils/exporter'

const ConversationModelListActions = () => {
  return (
    <TopToolbar>
      <FilterButton />
      <ExportButton />
      <PermissionGate resource="typesense-conversations" action="create">
        <CreateButton />
      </PermissionGate>
    </TopToolbar>
  )
}

const conversationModelFilters = [
  <TextInput key="search" label="Search" source="q" alwaysOn />,
  <TextInput key="model_name" label="Model Name" source="model_name" />,
  <TextInput key="llm_provider" label="LLM Provider" source="llm_provider" />
]

// Display LLM Provider with badge
const LLMProviderField = ({ record }: { record?: any }) => {
  if (!record || !record.llm_model) return null

  const provider = record.llm_model.model_name?.split('/')[0] || 'Unknown'

  const variantMap: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    'openai': 'default',
    'anthropic': 'secondary',
    'google': 'outline',
    'cohere': 'outline',
  }

  return (
    <Badge variant={variantMap[provider.toLowerCase()] || 'outline'}>
      {provider}
    </Badge>
  )
}

// Display model status
const StatusField = ({ record }: { record?: any }) => {
  if (!record) return null

  const status = record.enabled === false ? 'disabled' : 'active'

  return (
    <Badge variant={status === 'active' ? 'default' : 'outline'}>
      {status}
    </Badge>
  )
}

// Display retrieval configuration
const RetrievalConfigField = ({ record }: { record?: any }) => {
  if (!record || !record.conversation_config) return null

  const config = record.conversation_config
  const topK = config.top_k || 5

  return (
    <Badge variant="secondary">
      Top {topK} results
    </Badge>
  )
}

// CSV Exporter configuration
const conversationModelExporter = createExporter('conversation-models', {
  'ID': 'id',
  'Model Name': 'model_name',
  'LLM Provider': (record: any) => record.llm_model?.model_name || '',
  'API Key': (record: any) => record.llm_model?.api_key ? '***' : '',
  'Temperature': (record: any) => record.llm_model?.temperature || '',
  'Max Tokens': (record: any) => record.llm_model?.max_tokens || '',
  'Top K Results': (record: any) => record.conversation_config?.top_k || '',
  'System Prompt': (record: any) => record.conversation_config?.system_prompt || '',
  'Status': (record: any) => record.enabled === false ? 'disabled' : 'active',
  'Created At': (record: any) => formatDateForExport(record.created_at),
  'Updated At': (record: any) => formatDateForExport(record.updated_at),
})

export const ConversationModelList = () => {
  const { permissions } = usePermissions<UserPermissions>()

  return (
    <List
      filters={conversationModelFilters}
      actions={<ConversationModelListActions />}
      exporter={conversationModelExporter}
      perPage={25}
      sort={{ field: 'created_at', order: 'DESC' }}
    >
      <Datagrid rowClick="edit">
        <TextField source="model_name" label="Model Name" />
        <FunctionField
          label="LLM Provider"
          render={(record: any) => <LLMProviderField record={record} />}
        />
        <FunctionField
          label="Retrieval Config"
          render={(record: any) => <RetrievalConfigField record={record} />}
        />
        <FunctionField
          label="Status"
          render={(record: any) => <StatusField record={record} />}
        />
        <DateField source="created_at" label="Created" showTime />
        <DateField source="updated_at" label="Updated" showTime />
        {permissions?.canAccess('typesense-conversations', 'edit') && (
          <EditButton />
        )}
        {permissions?.canAccess('typesense-conversations', 'show') && <ShowButton />}
        {permissions?.canAccess('typesense-conversations', 'delete') && <DeleteButton />}
      </Datagrid>
    </List>
  )
}

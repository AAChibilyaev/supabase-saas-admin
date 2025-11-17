import {
  List,
  Datagrid,
  TextField,
  DateField,
  DeleteButton,
  FilterButton,
  CreateButton,
  TopToolbar,
  FunctionField,
  ShowButton
} from 'react-admin'
import { Badge } from '../../components/ui/badge'
import { Key, Shield } from 'lucide-react'

const ApiKeyListActions = () => (
  <TopToolbar>
    <FilterButton />
    <CreateButton />
  </TopToolbar>
)

const ActionsField = ({ record }: { record?: any }) => {
  if (!record?.actions) return null

  return (
    <div className="flex gap-1 flex-wrap">
      {record.actions.map((action: string) => {
        const isAdmin = action === '*'
        const isWrite = action.includes('create') || action.includes('update') || action.includes('delete')

        return (
          <Badge
            key={action}
            variant={isAdmin ? 'destructive' : isWrite ? 'default' : 'secondary'}
          >
            <Shield className="w-3 h-3 mr-1" />
            {action}
          </Badge>
        )
      })}
    </div>
  )
}

const CollectionsField = ({ record }: { record?: any }) => {
  if (!record?.collections) return null

  return (
    <div className="flex gap-1 flex-wrap">
      {record.collections.map((collection: string, index: number) => (
        <Badge key={index} variant="outline">
          {collection}
        </Badge>
      ))}
    </div>
  )
}

const KeyIdField = ({ record }: { record?: any }) => {
  if (!record?.id) return null

  return (
    <div className="flex items-center gap-2">
      <Key className="w-4 h-4 text-muted-foreground" />
      <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
        {record.id}
      </code>
    </div>
  )
}

export const ApiKeyList = () => {
  return (
    <List
      actions={<ApiKeyListActions />}
      perPage={25}
      sort={{ field: 'id', order: 'DESC' }}
    >
      <Datagrid>
        <TextField source="description" label="Description" />
        <KeyIdField label="Key ID" sortable={false} />
        <ActionsField label="Actions" sortable={false} />
        <CollectionsField label="Collections" sortable={false} />
        <FunctionField
          label="Expires At"
          render={(record: any) => {
            if (!record.expires_at) {
              return <Badge variant="outline">Never</Badge>
            }
            const expiresAt = new Date(record.expires_at * 1000)
            const now = new Date()
            const isExpired = expiresAt < now

            return (
              <div className="flex flex-col gap-1">
                <DateField record={{ expires_at: expiresAt.toISOString() }} source="expires_at" showTime />
                {isExpired && (
                  <Badge variant="destructive" className="w-fit">
                    Expired
                  </Badge>
                )}
              </div>
            )
          }}
        />
        <ShowButton />
        <DeleteButton
          mutationMode="pessimistic"
          confirmTitle="Delete API Key"
          confirmContent="Are you sure you want to delete this API key? This action cannot be undone and will immediately revoke access."
        />
      </Datagrid>
    </List>
  )
}

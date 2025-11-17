import {
  Show,
  SimpleShowLayout,
  TextField,
  DateField,
  FunctionField,
  TopToolbar,
  ListButton,
  DeleteButton
} from 'react-admin'
import { Badge } from '../../components/ui/badge'
import { Alert } from '../../components/ui/alert'
import { Key, Shield, AlertTriangle, Calendar, Clock } from 'lucide-react'

const ApiKeyShowActions = () => (
  <TopToolbar>
    <ListButton />
    <DeleteButton
      mutationMode="pessimistic"
      confirmTitle="Delete API Key"
      confirmContent="Are you sure you want to delete this API key? This action cannot be undone and will immediately revoke access."
    />
  </TopToolbar>
)

const KeyIdDisplay = ({ record }: { record?: any }) => {
  if (!record?.id) return null

  return (
    <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
      <Key className="w-5 h-5 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground mb-1">Key ID</p>
        <code className="text-sm font-mono bg-background px-2 py-1 rounded border">
          {record.id}
        </code>
      </div>
    </div>
  )
}

const ActionsDisplay = ({ record }: { record?: any }) => {
  if (!record?.actions || !Array.isArray(record.actions)) return null

  const hasAdminAccess = record.actions.includes('*')

  return (
    <div className="space-y-3">
      {hasAdminAccess && (
        <Alert variant="default" className="bg-red-50 border-red-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-semibold">Full Admin Access</p>
              <p>This key has unrestricted access to all operations. Never expose this key in frontend applications.</p>
            </div>
          </div>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        {record.actions.map((action: string) => {
          const isAdmin = action === '*'
          const isWrite = action.includes('create') || action.includes('update') || action.includes('delete')
          const isWildcard = action.includes('*')

          return (
            <Badge
              key={action}
              variant={isAdmin ? 'destructive' : isWildcard || isWrite ? 'default' : 'secondary'}
              className="text-sm px-3 py-1"
            >
              <Shield className="w-3 h-3 mr-1" />
              {action}
            </Badge>
          )
        })}
      </div>

      <div className="text-xs text-muted-foreground space-y-1 mt-2">
        <p><strong>Permission Summary:</strong></p>
        <ul className="list-disc list-inside ml-2 space-y-0.5">
          {record.actions.includes('*') && (
            <li>Full administrative access to all operations</li>
          )}
          {record.actions.includes('documents:search') && (
            <li>Can search documents (safe for frontend)</li>
          )}
          {record.actions.includes('documents:get') && (
            <li>Can retrieve individual documents</li>
          )}
          {record.actions.some((a: string) => a.includes('create')) && (
            <li>Can create new documents/collections</li>
          )}
          {record.actions.some((a: string) => a.includes('update')) && (
            <li>Can modify existing documents/collections</li>
          )}
          {record.actions.some((a: string) => a.includes('delete')) && (
            <li>Can delete documents/collections</li>
          )}
        </ul>
      </div>
    </div>
  )
}

const CollectionsDisplay = ({ record }: { record?: any }) => {
  if (!record?.collections || !Array.isArray(record.collections)) return null

  const hasWildcard = record.collections.includes('*')

  return (
    <div className="space-y-3">
      {hasWildcard && (
        <Alert variant="default" className="bg-amber-50 border-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold">All Collections Access</p>
              <p>This key can access all collections, including future ones.</p>
            </div>
          </div>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        {record.collections.map((collection: string, index: number) => (
          <Badge
            key={index}
            variant={collection === '*' ? 'default' : 'outline'}
            className="text-sm px-3 py-1"
          >
            {collection}
          </Badge>
        ))}
      </div>
    </div>
  )
}

const ExpirationDisplay = ({ record }: { record?: any }) => {
  if (!record?.expires_at) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
        <Clock className="w-4 h-4 text-green-600" />
        <span className="text-sm text-green-800">This key never expires</span>
      </div>
    )
  }

  const expiresAt = new Date(record.expires_at * 1000)
  const now = new Date()
  const isExpired = expiresAt < now
  const timeUntilExpiry = expiresAt.getTime() - now.getTime()
  const daysUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-3">
      <div className={`flex items-start gap-3 p-3 rounded border ${
        isExpired
          ? 'bg-red-50 border-red-200'
          : daysUntilExpiry < 7
          ? 'bg-amber-50 border-amber-200'
          : 'bg-blue-50 border-blue-200'
      }`}>
        <Calendar className={`w-4 h-4 mt-0.5 ${
          isExpired
            ? 'text-red-600'
            : daysUntilExpiry < 7
            ? 'text-amber-600'
            : 'text-blue-600'
        }`} />
        <div className="flex-1">
          <p className={`text-sm font-semibold ${
            isExpired
              ? 'text-red-800'
              : daysUntilExpiry < 7
              ? 'text-amber-800'
              : 'text-blue-800'
          }`}>
            {isExpired ? 'Expired' : daysUntilExpiry < 7 ? `Expires in ${daysUntilExpiry} days` : 'Active'}
          </p>
          <p className={`text-xs ${
            isExpired
              ? 'text-red-700'
              : daysUntilExpiry < 7
              ? 'text-amber-700'
              : 'text-blue-700'
          }`}>
            {expiresAt.toLocaleString()}
          </p>
        </div>
        {isExpired && (
          <Badge variant="destructive">EXPIRED</Badge>
        )}
      </div>

      {isExpired && (
        <Alert variant="default" className="bg-red-50 border-red-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-semibold">This key has expired</p>
              <p>It will no longer work for API requests. Create a new key if you need to restore access.</p>
            </div>
          </div>
        </Alert>
      )}
    </div>
  )
}

export const ApiKeyShow = () => {
  return (
    <Show actions={<ApiKeyShowActions />}>
      <SimpleShowLayout>
        {/* Key Value Warning */}
        <FunctionField
          render={() => (
            <Alert variant="default" className="bg-yellow-50 border-yellow-200 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold">Key Value Not Displayed</p>
                  <p>For security reasons, the actual API key value cannot be retrieved after creation.
                  If you've lost the key, you'll need to delete this one and create a new key.</p>
                </div>
              </div>
            </Alert>
          )}
        />

        {/* Description */}
        <TextField source="description" label="Description" />

        {/* Key ID */}
        <FunctionField label="Key Identifier" render={(record: any) => <KeyIdDisplay record={record} />} />

        {/* Actions/Permissions */}
        <FunctionField
          label="Allowed Actions"
          render={(record: any) => <ActionsDisplay record={record} />}
        />

        {/* Collections */}
        <FunctionField
          label="Allowed Collections"
          render={(record: any) => <CollectionsDisplay record={record} />}
        />

        {/* Expiration */}
        <FunctionField
          label="Expiration Status"
          render={(record: any) => <ExpirationDisplay record={record} />}
        />

        {/* Metadata */}
        <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Metadata</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Created At</p>
              <DateField source="created_at" showTime className="font-mono" />
            </div>
            {/* Typesense doesn't provide last_used_at, but we keep the structure for consistency */}
          </div>
        </div>
      </SimpleShowLayout>
    </Show>
  )
}

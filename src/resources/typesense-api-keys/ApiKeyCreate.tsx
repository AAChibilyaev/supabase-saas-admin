import { useState } from 'react'
import {
  Create,
  SimpleForm,
  TextInput,
  ArrayInput,
  SimpleFormIterator,
  DateTimeInput,
  SelectArrayInput,
  useNotify,
  useRedirect,
  required
} from 'react-admin'
import { Alert } from '../../components/ui/alert'
import { AlertTriangle, Info, Shield } from 'lucide-react'
import { ApiKeyValue } from './ApiKeyValue'

export const ApiKeyCreate = () => {
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const notify = useNotify()
  const redirect = useRedirect()

  const handleSuccess = (data: any) => {
    // IMPORTANT: Key value shown only once!
    if (data.value) {
      setCreatedKey(data.value)
      notify('API Key created successfully. Save it now - you won\'t see it again!', { type: 'success' })
    }
  }

  const handleError = (error: any) => {
    notify(`Error creating API key: ${error.message}`, { type: 'error' })
  }

  return (
    <Create
      mutationOptions={{
        onSuccess: handleSuccess,
        onError: handleError
      }}
      redirect={false}
    >
      <SimpleForm>
        {/* Security Warning */}
        <Alert variant="default" className="bg-blue-50 border-blue-200 mb-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="font-semibold text-blue-900">
                Create Typesense API Key
              </p>
              <p className="text-sm text-blue-800">
                API keys control access to your Typesense collections and operations.
                Choose permissions carefully based on the principle of least privilege.
              </p>
            </div>
          </div>
        </Alert>

        {/* Description */}
        <TextInput
          source="description"
          label="Description"
          validate={required()}
          helperText="Describe the purpose of this API key (e.g., 'Frontend search', 'Admin dashboard', 'Mobile app')"
          fullWidth
          disabled={!!createdKey}
        />

        {/* Actions/Permissions */}
        <SelectArrayInput
          source="actions"
          label="Allowed Actions"
          validate={required()}
          choices={[
            { id: '*', name: '⚠️ All operations (admin access)' },
            { id: 'documents:search', name: 'Search documents (recommended for frontend)' },
            { id: 'documents:get', name: 'Get documents' },
            { id: 'documents:create', name: 'Create documents' },
            { id: 'documents:update', name: 'Update documents' },
            { id: 'documents:delete', name: 'Delete documents' },
            { id: 'documents:*', name: 'All document operations' },
            { id: 'collections:*', name: 'All collection operations' },
            { id: 'collections:create', name: 'Create collections' },
            { id: 'collections:list', name: 'List collections' },
            { id: 'collections:get', name: 'Get collection details' },
            { id: 'collections:delete', name: 'Delete collections' },
          ]}
          helperText="Select the permissions this key should have. For frontend use, select only 'documents:search'"
          fullWidth
          disabled={!!createdKey}
        />

        {/* Permission Guidance */}
        <Alert variant="default" className="bg-amber-50 border-amber-200 my-3">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800 space-y-2">
              <p className="font-medium">Permission Guidelines:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Frontend/Client:</strong> Use only <code className="bg-amber-100 px-1 rounded">documents:search</code></li>
                <li><strong>Backend API:</strong> Use specific permissions like <code className="bg-amber-100 px-1 rounded">documents:*</code></li>
                <li><strong>Admin:</strong> Use <code className="bg-amber-100 px-1 rounded">*</code> (never expose in frontend!)</li>
              </ul>
            </div>
          </div>
        </Alert>

        {/* Collections */}
        <ArrayInput
          source="collections"
          label="Allowed Collections"
          helperText="Specify which collections this key can access. Leave empty or add '*' for all collections."
          disabled={!!createdKey}
        >
          <SimpleFormIterator>
            <TextInput
              label="Collection name"
              helperText="Use * for all collections"
            />
          </SimpleFormIterator>
        </ArrayInput>

        {/* Expiration */}
        <DateTimeInput
          source="expires_at"
          label="Expiration Date (Optional)"
          helperText="Set an expiration date for temporary access. Leave empty for keys that never expire."
          fullWidth
          disabled={!!createdKey}
        />

        {/* Security Best Practices */}
        <Alert variant="default" className="bg-red-50 border-red-200 mt-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
            <div className="text-sm text-red-800 space-y-2">
              <p className="font-medium">Security Best Practices:</p>
              <div className="space-y-1 ml-2">
                <p><strong>✅ DO:</strong></p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>Use <code className="bg-red-100 px-1 rounded">documents:search</code> for frontend applications</li>
                  <li>Set expiration dates for temporary access</li>
                  <li>Use specific collections instead of <code className="bg-red-100 px-1 rounded">*</code></li>
                  <li>Store keys securely in environment variables</li>
                  <li>Create separate keys for different apps/environments</li>
                </ul>
                <p className="mt-2"><strong>❌ DON'T:</strong></p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>Don't expose admin keys (<code className="bg-red-100 px-1 rounded">*</code>) in frontend code</li>
                  <li>Don't hardcode keys in source code</li>
                  <li>Don't share keys across environments (dev/staging/prod)</li>
                  <li>Don't use keys without expiration for untrusted clients</li>
                </ul>
              </div>
            </div>
          </div>
        </Alert>

        {/* Display created key */}
        {createdKey && (
          <div className="mt-6">
            <ApiKeyValue value={createdKey} />
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => redirect('list', 'typesense-api-keys')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Go to API Keys List
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-input bg-background rounded hover:bg-accent"
              >
                Create Another Key
              </button>
            </div>
          </div>
        )}
      </SimpleForm>
    </Create>
  )
}

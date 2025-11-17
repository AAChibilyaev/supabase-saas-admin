import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useNotify } from 'react-admin'
import { Button } from '../../components/ui/button'
import { Label } from '../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Save, ArrowLeft, AlertCircle, Link as LinkIcon } from 'lucide-react'
import { typesenseClient } from '../../providers/typesenseClient'
import type { CollectionResponse, CollectionAlias } from '../../types/typesense'
import { Alert, AlertDescription } from '../../components/ui/alert'

export const AliasEdit = () => {
  const { id: aliasName } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const notify = useNotify()

  const [alias, setAlias] = useState<CollectionAlias | null>(null)
  const [collectionName, setCollectionName] = useState('')
  const [collections, setCollections] = useState<CollectionResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (aliasName) {
      loadAliasAndCollections()
    }
  }, [aliasName])

  const loadAliasAndCollections = async () => {
    if (!typesenseClient) {
      notify('Typesense client not configured', { type: 'error' })
      setLoadingData(false)
      return
    }

    try {
      setLoadingData(true)

      // Load alias details
      const aliasResponse = await typesenseClient.aliases(aliasName!).retrieve()
      setAlias(aliasResponse)
      setCollectionName(aliasResponse.collection_name)

      // Load all collections
      const collectionsResponse = await typesenseClient.collections().retrieve()
      setCollections(collectionsResponse)
    } catch (error: any) {
      notify(`Failed to load alias: ${error.message}`, { type: 'error' })
      console.error('Error loading alias:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleUpdate = async () => {
    if (!collectionName) {
      notify('Collection name is required', { type: 'error' })
      return
    }

    if (!typesenseClient || !aliasName) {
      notify('Typesense client not configured', { type: 'error' })
      return
    }

    // Check if collection has changed
    if (collectionName === alias?.collection_name) {
      notify('No changes to save', { type: 'info' })
      return
    }

    setLoading(true)

    try {
      await typesenseClient.aliases().upsert(aliasName, {
        collection_name: collectionName,
      })

      notify(
        `Alias "${aliasName}" updated to point to "${collectionName}"`,
        {
          type: 'success',
        }
      )
      navigate('/typesense-aliases')
    } catch (error: any) {
      notify(`Failed to update alias: ${error.message}`, { type: 'error' })
      console.error('Error updating alias:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="p-8 text-center">
        <p>Loading alias details...</p>
      </div>
    )
  }

  if (!alias) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Alias Not Found</h2>
        <p className="text-gray-600 mb-4">
          The alias "{aliasName}" could not be found.
        </p>
        <Button onClick={() => navigate('/typesense-aliases')}>
          Back to Aliases
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Collection Alias</h1>
          <p className="text-gray-600 mt-1">
            Update the target collection for this alias
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/typesense-aliases')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="space-y-6">
        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Updating an alias will immediately redirect all queries using this
            alias name to the new collection. Use this for zero-downtime
            migrations.
          </AlertDescription>
        </Alert>

        {/* Current Alias Info */}
        <Card>
          <CardHeader>
            <CardTitle>Alias Information</CardTitle>
            <CardDescription>Current alias configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Alias Name</Label>
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-gray-500" />
                <span className="font-mono font-semibold">{alias.name}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Current Target</Label>
              <Badge variant="outline">{alias.collection_name}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Update Form */}
        <Card>
          <CardHeader>
            <CardTitle>Update Target Collection</CardTitle>
            <CardDescription>
              Select a new collection for this alias to point to
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collection">New Target Collection *</Label>
              {collections.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No collections found. Please create a collection first.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select value={collectionName} onValueChange={setCollectionName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map((collection) => (
                      <SelectItem key={collection.name} value={collection.name}>
                        {collection.name} ({collection.num_documents || 0}{' '}
                        documents)
                        {collection.name === alias.collection_name && ' (current)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-sm text-gray-500">
                The collection that this alias will point to after update
              </p>
            </div>

            {collectionName !== alias.collection_name && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Migration Preview:</strong> Alias "{alias.name}" will
                  redirect from "{alias.collection_name}" to "{collectionName}"
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Migration Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Zero-Downtime Migration Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Create new collection with updated schema (e.g., products_v2)</li>
              <li>Migrate and validate data in the new collection</li>
              <li>Test the new collection thoroughly</li>
              <li>Update this alias to point to the new collection</li>
              <li>Monitor for any issues</li>
              <li>Delete the old collection once satisfied</li>
            </ol>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/typesense-aliases')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={loading || collections.length === 0 || collectionName === alias.collection_name}
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Updating...' : 'Update Alias'}
          </Button>
        </div>
      </div>
    </div>
  )
}

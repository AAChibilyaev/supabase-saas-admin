import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotify } from 'react-admin'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
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
import { Save, ArrowLeft, AlertCircle } from 'lucide-react'
import { typesenseClient } from '../../providers/typesenseClient'
import type { CollectionResponse } from '../../types/typesense'
import { Alert, AlertDescription } from '../../components/ui/alert'

export const AliasCreate = () => {
  const navigate = useNavigate()
  const notify = useNotify()

  const [aliasName, setAliasName] = useState('')
  const [collectionName, setCollectionName] = useState('')
  const [collections, setCollections] = useState<CollectionResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCollections, setLoadingCollections] = useState(true)

  useEffect(() => {
    loadCollections()
  }, [])

  const loadCollections = async () => {
    if (!typesenseClient) {
      notify('Typesense client not configured', { type: 'error' })
      setLoadingCollections(false)
      return
    }

    try {
      setLoadingCollections(true)
      const response = await typesenseClient.collections().retrieve()
      setCollections(response)
    } catch (error: any) {
      notify(`Failed to load collections: ${error.message}`, { type: 'error' })
      console.error('Error loading collections:', error)
    } finally {
      setLoadingCollections(false)
    }
  }

  const validateForm = (): string | null => {
    if (!aliasName.trim()) {
      return 'Alias name is required'
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(aliasName)) {
      return 'Alias name can only contain alphanumeric characters, underscores, and hyphens'
    }

    if (!collectionName) {
      return 'Collection name is required'
    }

    return null
  }

  const handleCreate = async () => {
    const error = validateForm()
    if (error) {
      notify(error, { type: 'error' })
      return
    }

    if (!typesenseClient) {
      notify('Typesense client not configured', { type: 'error' })
      return
    }

    setLoading(true)

    try {
      await typesenseClient.aliases().upsert(aliasName, {
        collection_name: collectionName,
      })

      notify(`Alias "${aliasName}" created successfully`, {
        type: 'success',
      })
      navigate('/typesense-aliases')
    } catch (error: any) {
      notify(`Failed to create alias: ${error.message}`, { type: 'error' })
      console.error('Error creating alias:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Create Collection Alias</h1>
          <p className="text-gray-600 mt-1">
            Point an alias to a specific collection
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
            Aliases allow you to reference collections by a stable name, making
            it easy to switch between different collection versions without
            updating your application code.
          </AlertDescription>
        </Alert>

        {/* Alias Form */}
        <Card>
          <CardHeader>
            <CardTitle>Alias Configuration</CardTitle>
            <CardDescription>
              Define the alias name and target collection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aliasName">Alias Name *</Label>
              <Input
                id="aliasName"
                placeholder="e.g., products, users, posts"
                value={aliasName}
                onChange={(e) => setAliasName(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Only alphanumeric characters, underscores, and hyphens are allowed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="collection">Target Collection *</Label>
              {loadingCollections ? (
                <p className="text-sm text-gray-500">Loading collections...</p>
              ) : collections.length === 0 ? (
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
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-sm text-gray-500">
                The collection that this alias will point to
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Use Cases */}
        <Card>
          <CardHeader>
            <CardTitle>Common Use Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <strong>Zero-downtime migrations:</strong>
                <p className="text-gray-600">
                  Create products_v2 with new schema → Migrate data → Test → Update
                  "products" alias to point to products_v2
                </p>
              </div>
              <div>
                <strong>A/B Testing:</strong>
                <p className="text-gray-600">
                  Create two collections with different configurations and switch
                  between them using aliases
                </p>
              </div>
              <div>
                <strong>Staging environments:</strong>
                <p className="text-gray-600">
                  Use "products-staging" alias for testing before updating the
                  production "products" alias
                </p>
              </div>
            </div>
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
            onClick={handleCreate}
            disabled={loading || loadingCollections || collections.length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Alias'}
          </Button>
        </div>
      </div>
    </div>
  )
}

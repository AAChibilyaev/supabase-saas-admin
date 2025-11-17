import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useNotify } from 'react-admin'
import { Button } from '../../components/ui/button'
import { Label } from '../../components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Database,
  FileText,
  Calendar,
  Settings
} from 'lucide-react'
import { typesenseClient } from '../../providers/typesenseClient'
import type { CollectionResponse } from '../../types/typesense'
import {
  Alert,
  AlertDescription,
} from '../../components/ui/alert'

export const CollectionShow = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const notify = useNotify()

  const [collection, setCollection] = useState<CollectionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadCollection()
  }, [id])

  const loadCollection = async () => {
    if (!typesenseClient || !id) {
      notify('Typesense client not configured or collection ID missing', { type: 'error' })
      return
    }

    try {
      setLoading(true)
      const response = await typesenseClient.collections(id).retrieve()
      setCollection(response)
    } catch (error: any) {
      notify(`Failed to load collection: ${error.message}`, { type: 'error' })
      console.error('Error loading collection:', error)
      navigate('/typesense-collections')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!typesenseClient || !id) {
      notify('Typesense client not configured', { type: 'error' })
      return
    }

    const confirmMessage = collection?.num_documents && collection.num_documents > 0
      ? `This collection contains ${collection.num_documents} documents. Are you sure you want to delete "${id}"? This action cannot be undone.`
      : `Are you sure you want to delete collection "${id}"? This action cannot be undone.`

    if (!window.confirm(confirmMessage)) {
      return
    }

    setDeleting(true)

    try {
      await typesenseClient.collections(id).delete()
      notify(`Collection "${id}" deleted successfully`, { type: 'success' })
      navigate('/typesense-collections')
    } catch (error: any) {
      notify(`Failed to delete collection: ${error.message}`, { type: 'error' })
      console.error('Error deleting collection:', error)
    } finally {
      setDeleting(false)
    }
  }

  const handleEdit = () => {
    navigate(`/typesense-collections/${id}/edit`)
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p>Loading collection...</p>
      </div>
    )
  }

  if (!collection) {
    return null
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">{collection.name}</h1>
            <p className="text-gray-600 mt-1">Collection details and schema</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/typesense-collections')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button variant="default" onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Collection Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{collection.num_documents?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total indexed documents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fields</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{collection.fields?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Schema fields defined
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Created</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date(collection.created_at * 1000).toLocaleDateString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(collection.created_at * 1000).toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Collection Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Collection Settings</CardTitle>
            <CardDescription>Configuration and metadata</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Collection Name</Label>
                <p className="font-mono font-semibold mt-1">{collection.name}</p>
              </div>

              {collection.default_sorting_field && (
                <div>
                  <Label className="text-sm text-gray-600">Default Sorting Field</Label>
                  <p className="font-mono mt-1">
                    <Badge variant="outline">{collection.default_sorting_field}</Badge>
                  </p>
                </div>
              )}

              {collection.enable_nested_fields && (
                <div>
                  <Label className="text-sm text-gray-600">Nested Fields</Label>
                  <p className="mt-1">
                    <Badge variant="default">Enabled</Badge>
                  </p>
                </div>
              )}

              {collection.num_memory_shards !== undefined && (
                <div>
                  <Label className="text-sm text-gray-600">Memory Shards</Label>
                  <p className="font-semibold mt-1">{collection.num_memory_shards}</p>
                </div>
              )}
            </div>

            {collection.token_separators && collection.token_separators.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm text-gray-600">Token Separators</Label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {collection.token_separators.map((sep, idx) => (
                    <Badge key={idx} variant="outline" className="font-mono">
                      {sep}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {collection.symbols_to_index && collection.symbols_to_index.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm text-gray-600">Symbols to Index</Label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {collection.symbols_to_index.map((symbol, idx) => (
                    <Badge key={idx} variant="outline" className="font-mono">
                      {symbol}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schema Details */}
        <Card>
          <CardHeader>
            <CardTitle>Schema Definition</CardTitle>
            <CardDescription>
              Field definitions and their properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            {collection.fields && collection.fields.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Properties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collection.fields.map((field, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono font-semibold">
                          {field.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{field.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {field.facet && (
                              <Badge variant="secondary" className="text-xs">
                                Facet
                              </Badge>
                            )}
                            {field.optional && (
                              <Badge variant="secondary" className="text-xs">
                                Optional
                              </Badge>
                            )}
                            {field.index !== false && (
                              <Badge variant="secondary" className="text-xs">
                                Index
                              </Badge>
                            )}
                            {field.sort && (
                              <Badge variant="secondary" className="text-xs">
                                Sort
                              </Badge>
                            )}
                            {field.infix && (
                              <Badge variant="secondary" className="text-xs">
                                Infix
                              </Badge>
                            )}
                            {field.locale && (
                              <Badge variant="secondary" className="text-xs">
                                Locale: {field.locale}
                              </Badge>
                            )}
                            {field.stem && (
                              <Badge variant="secondary" className="text-xs">
                                Stem
                              </Badge>
                            )}
                            {field.store !== undefined && !field.store && (
                              <Badge variant="secondary" className="text-xs">
                                Not Stored
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  No fields defined for this collection.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common operations for this collection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(`/typesense-documents?collection=${collection.name}`)}
              >
                <FileText className="w-4 h-4 mr-2" />
                View Documents
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/typesense-search?collection=${collection.name}`)}
              >
                <Database className="w-4 h-4 mr-2" />
                Search Collection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import {
  List,
  Datagrid,
  TextField,
  NumberField,
  FunctionField,
  FilterButton,
  CreateButton,
  ExportButton,
  TopToolbar,
  TextInput,
  useListContext,
  useNotify,
  useRefresh,
  Button as RAButton,
  DeleteButton,
} from 'react-admin'
import { useState, useEffect } from 'react'
import { Badge } from '../../components/ui/badge'
import { Database, Info } from 'lucide-react'
import { typesenseClient } from '../../providers/typesenseClient'
import type { CollectionResponse } from '../../types/typesense'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'

const CollectionListActions = () => (
  <TopToolbar>
    <FilterButton />
    <ExportButton />
    <CreateButton />
  </TopToolbar>
)

const collectionFilters = [
  <TextInput key="search" label="Search" source="q" alwaysOn />,
]

// Field Schema Display Component
const FieldsField = ({ record }: { record?: CollectionResponse }) => {
  const [open, setOpen] = useState(false)

  if (!record?.fields) return null

  return (
    <>
      <RAButton
        label={`${record.fields.length} fields`}
        onClick={() => setOpen(true)}
        size="small"
      >
        <Info className="w-4 h-4 mr-1" />
        {record.fields.length} fields
      </RAButton>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schema: {record.name}</DialogTitle>
            <DialogDescription>
              Collection fields and their configuration
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Documents:</span> {record.num_documents || 0}
              </div>
              {record.default_sorting_field && (
                <div>
                  <span className="font-semibold">Default Sort:</span>{' '}
                  {record.default_sorting_field}
                </div>
              )}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Properties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {record.fields.map((field, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-sm">
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Format timestamp to readable date
const CreatedAtField = ({ record }: { record?: CollectionResponse }) => {
  if (!record?.created_at) return null

  const date = new Date(record.created_at * 1000)
  return <span>{date.toLocaleString()}</span>
}

// Custom List component that fetches from Typesense directly
const TypesenseCollectionList = () => {
  const [collections, setCollections] = useState<CollectionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const notify = useNotify()
  const refresh = useRefresh()

  useEffect(() => {
    loadCollections()
  }, [])

  const loadCollections = async () => {
    if (!typesenseClient) {
      notify('Typesense client not configured', { type: 'error' })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await typesenseClient.collections().retrieve()
      setCollections(response)
    } catch (error: any) {
      notify(`Failed to load collections: ${error.message}`, { type: 'error' })
      console.error('Error loading collections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (collectionName: string) => {
    if (!typesenseClient) {
      notify('Typesense client not configured', { type: 'error' })
      return
    }

    if (!window.confirm(`Are you sure you want to delete collection "${collectionName}"? This action cannot be undone.`)) {
      return
    }

    try {
      await typesenseClient.collections(collectionName).delete()
      notify(`Collection "${collectionName}" deleted successfully`, { type: 'success' })
      loadCollections()
    } catch (error: any) {
      notify(`Failed to delete collection: ${error.message}`, { type: 'error' })
      console.error('Error deleting collection:', error)
    }
  }

  if (!typesenseClient) {
    return (
      <div className="p-8 text-center">
        <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold mb-2">Typesense Not Configured</h2>
        <p className="text-gray-600">
          Please configure Typesense environment variables to use this feature.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p>Loading collections...</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Typesense Collections</h1>
        <div className="flex gap-2">
          <RAButton label="Refresh" onClick={loadCollections} />
          <CreateButton />
        </div>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Collections</h3>
          <p className="text-gray-600 mb-4">
            Create your first collection to start indexing documents.
          </p>
          <CreateButton />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collections.map((collection) => (
                <TableRow key={collection.name}>
                  <TableCell className="font-mono font-semibold">
                    {collection.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {collection.num_documents || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <FieldsField record={collection} />
                  </TableCell>
                  <TableCell>
                    <CreatedAtField record={collection} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <RAButton
                        label="Edit"
                        onClick={() => {
                          window.location.href = `#/typesense-collections/${collection.name}`
                        }}
                        size="small"
                      />
                      <RAButton
                        label="Delete"
                        onClick={() => handleDelete(collection.name)}
                        color="error"
                        size="small"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

export const CollectionList = TypesenseCollectionList

import {
  List,
  Datagrid,
  TextField,
  FunctionField,
  SearchInput,
  SelectInput,
  TopToolbar,
  CreateButton,
  ExportButton,
  FilterButton,
  useListContext,
  useNotify,
  Button as RAButton,
  DeleteButton,
  EditButton,
  ShowButton,
} from 'react-admin'
import { useState, useEffect } from 'react'
import { typesenseClient } from '../../providers/typesenseClient'
import { Badge } from '../../components/ui/badge'
import { FileText, Upload, Download } from 'lucide-react'
import type { CollectionResponse } from '../../types/typesense'

const DocumentListActions = () => {
  const { filterValues } = useListContext()
  const selectedCollection = filterValues?.collection

  return (
    <TopToolbar>
      <FilterButton />
      {selectedCollection && (
        <>
          <RAButton
            label="Import JSONL"
            onClick={() => {
              window.location.href = `#/typesense-documents/import?collection=${selectedCollection}`
            }}
          >
            <Upload className="w-4 h-4 mr-1" />
          </RAButton>
          <RAButton
            label="Export JSONL"
            onClick={() => {
              window.location.href = `#/typesense-documents/export?collection=${selectedCollection}`
            }}
          >
            <Download className="w-4 h-4 mr-1" />
          </RAButton>
        </>
      )}
      <CreateButton />
    </TopToolbar>
  )
}

// Custom hook to fetch collections
const useCollections = () => {
  const [collections, setCollections] = useState<CollectionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const notify = useNotify()

  useEffect(() => {
    const fetchCollections = async () => {
      if (!typesenseClient) {
        notify('Typesense client not configured', { type: 'error' })
        setLoading(false)
        return
      }

      try {
        const response = await typesenseClient.collections().retrieve()
        setCollections(response)
      } catch (error: any) {
        notify(`Failed to load collections: ${error.message}`, { type: 'error' })
        console.error('Error loading collections:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCollections()
  }, [])

  return { collections, loading }
}

const DocumentFilters = () => {
  const { collections } = useCollections()

  const collectionChoices = collections.map((collection) => ({
    id: collection.name,
    name: `${collection.name} (${collection.num_documents || 0} docs)`,
  }))

  return [
    <SelectInput
      key="collection"
      source="collection"
      choices={collectionChoices}
      alwaysOn
      label="Collection"
      helperText="Select a collection to browse documents"
    />,
    <SearchInput
      key="q"
      source="q"
      alwaysOn
      placeholder="Search documents..."
      helperText="Search across all indexed fields"
    />,
  ]
}

// Dynamic datagrid that shows fields based on selected collection
const DynamicDocumentDatagrid = () => {
  const { filterValues, data } = useListContext()
  const { collections } = useCollections()
  const [collectionSchema, setCollectionSchema] = useState<CollectionResponse | null>(null)

  useEffect(() => {
    if (filterValues?.collection) {
      const collection = collections.find((c) => c.name === filterValues.collection)
      setCollectionSchema(collection || null)
    }
  }, [filterValues?.collection, collections])

  if (!filterValues?.collection) {
    return (
      <div className="p-8 text-center border rounded-lg">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">Select a Collection</h3>
        <p className="text-gray-600">
          Please select a collection from the filter above to browse documents.
        </p>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center border rounded-lg">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">No Documents Found</h3>
        <p className="text-gray-600 mb-4">
          {filterValues?.q
            ? 'No documents match your search criteria.'
            : 'This collection is empty. Start by creating or importing documents.'}
        </p>
        <CreateButton />
      </div>
    )
  }

  // Get searchable/displayable fields from schema
  const displayFields = collectionSchema?.fields
    ?.filter((field) => {
      // Show fields that are indexed or common types
      return (
        field.index !== false &&
        !field.name.startsWith('_') && // Skip internal fields
        ['string', 'string[]', 'int32', 'int64', 'float', 'bool'].includes(field.type)
      )
    })
    .slice(0, 6) // Limit to 6 fields for readability

  return (
    <Datagrid rowClick="show" bulkActionButtons={<DeleteButton mutationMode="pessimistic" />}>
      <TextField source="id" label="ID" />

      {displayFields?.map((field) => {
        if (field.type === 'bool') {
          return (
            <FunctionField
              key={field.name}
              source={field.name}
              label={field.name}
              render={(record: any) => (
                <Badge variant={record[field.name] ? 'default' : 'secondary'}>
                  {record[field.name] ? 'Yes' : 'No'}
                </Badge>
              )}
            />
          )
        }

        if (field.type.includes('[]')) {
          return (
            <FunctionField
              key={field.name}
              source={field.name}
              label={field.name}
              render={(record: any) => {
                const value = record[field.name]
                if (!value || !Array.isArray(value)) return null
                return (
                  <div className="flex gap-1 flex-wrap max-w-xs">
                    {value.slice(0, 3).map((item, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {String(item)}
                      </Badge>
                    ))}
                    {value.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{value.length - 3} more
                      </Badge>
                    )}
                  </div>
                )
              }}
            />
          )
        }

        return (
          <TextField
            key={field.name}
            source={field.name}
            label={field.name}
            sortable={field.sort !== false}
          />
        )
      })}

      {/* Search score (if available) */}
      <FunctionField
        label="Relevance"
        render={(record: any) => {
          if (record._score !== undefined) {
            return <Badge variant="outline">{record._score.toFixed(2)}</Badge>
          }
          return null
        }}
      />

      <FunctionField
        label="Actions"
        render={(record: any) => (
          <div className="flex gap-2">
            <ShowButton record={record} />
            <EditButton record={record} />
          </div>
        )}
      />
    </Datagrid>
  )
}

export const DocumentList = () => {
  if (!typesenseClient) {
    return (
      <div className="p-8 text-center">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold mb-2">Typesense Not Configured</h2>
        <p className="text-gray-600">
          Please configure Typesense environment variables to use this feature.
        </p>
      </div>
    )
  }

  return (
    <List
      filters={<DocumentFilters />}
      actions={<DocumentListActions />}
      perPage={25}
      sort={{ field: 'id', order: 'ASC' }}
      resource="typesense-documents"
      empty={false}
    >
      <DynamicDocumentDatagrid />
    </List>
  )
}

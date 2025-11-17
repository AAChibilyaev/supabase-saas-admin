import {
  Create,
  SimpleForm,
  TextInput,
  NumberInput,
  BooleanInput,
  SelectInput,
  ArrayInput,
  SimpleFormIterator,
  useNotify,
  useRedirect,
  required,
  SaveButton,
  Toolbar,
} from 'react-admin'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { typesenseClient } from '../../providers/typesenseClient'
import type { CollectionResponse, CollectionFieldSchema } from '../../types/typesense'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Info } from 'lucide-react'

const DocumentCreateToolbar = () => (
  <Toolbar>
    <SaveButton />
  </Toolbar>
)

// Dynamic form field based on collection schema
const DynamicField = ({ field }: { field: CollectionFieldSchema }) => {
  const fieldName = field.name
  const isRequired = !field.optional && field.name !== 'id'

  // Helper text for field
  const helperText = `Type: ${field.type}${field.optional ? ' (optional)' : ' (required)'}`

  // Array fields
  if (field.type.includes('[]')) {
    const baseType = field.type.replace('[]', '')

    return (
      <ArrayInput source={fieldName} label={fieldName} validate={isRequired ? [required()] : []}>
        <SimpleFormIterator inline>
          {baseType === 'string' && <TextInput source="" label={false} helperText={helperText} />}
          {(baseType === 'int32' || baseType === 'int64' || baseType === 'float') && (
            <NumberInput source="" label={false} helperText={helperText} />
          )}
        </SimpleFormIterator>
      </ArrayInput>
    )
  }

  // Boolean field
  if (field.type === 'bool') {
    return (
      <BooleanInput
        source={fieldName}
        label={fieldName}
        helperText={helperText}
        defaultValue={false}
      />
    )
  }

  // Number fields
  if (field.type === 'int32' || field.type === 'int64' || field.type === 'float') {
    return (
      <NumberInput
        source={fieldName}
        label={fieldName}
        helperText={helperText}
        validate={isRequired ? [required()] : []}
        step={field.type === 'float' ? 0.01 : 1}
      />
    )
  }

  // String fields (default)
  return (
    <TextInput
      source={fieldName}
      label={fieldName}
      helperText={helperText}
      validate={isRequired ? [required()] : []}
      multiline={field.type === 'string' && !field.facet}
      fullWidth
    />
  )
}

export const DocumentCreate = () => {
  const [searchParams] = useSearchParams()
  const [collections, setCollections] = useState<CollectionResponse[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string>('')
  const [collectionSchema, setCollectionSchema] = useState<CollectionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const notify = useNotify()
  const redirect = useRedirect()

  // Load collection from URL param if available
  useEffect(() => {
    const collectionParam = searchParams.get('collection')
    if (collectionParam) {
      setSelectedCollection(collectionParam)
    }
  }, [searchParams])

  // Fetch collections
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

  // Load collection schema when selected
  useEffect(() => {
    if (selectedCollection) {
      const collection = collections.find((c) => c.name === selectedCollection)
      setCollectionSchema(collection || null)
    }
  }, [selectedCollection, collections])

  if (!typesenseClient) {
    return (
      <div className="p-8">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Typesense client is not configured. Please set up environment variables.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const collectionChoices = collections.map((c) => ({
    id: c.name,
    name: `${c.name} (${c.num_documents || 0} docs)`,
  }))

  const handleSave = async (data: any) => {
    if (!selectedCollection) {
      notify('Please select a collection', { type: 'error' })
      return
    }

    try {
      // Add collection to the data
      const documentData = {
        ...data,
        collection: selectedCollection,
      }

      // The data provider will handle the actual creation
      return documentData
    } catch (error: any) {
      notify(`Failed to create document: ${error.message}`, { type: 'error' })
      throw error
    }
  }

  return (
    <Create
      resource="typesense-documents"
      redirect={(resource, id, data) => {
        return `/typesense-documents?filter=${JSON.stringify({ collection: selectedCollection })}`
      }}
      transform={handleSave}
    >
      <SimpleForm toolbar={<DocumentCreateToolbar />}>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Create Document</CardTitle>
            <CardDescription>
              Index a new document in a Typesense collection. All required fields must be provided.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Collection Selection */}
            <SelectInput
              source="collection"
              choices={collectionChoices}
              label="Collection"
              helperText="Select the collection to create a document in"
              validate={[required()]}
              onChange={(e) => setSelectedCollection(e.target.value)}
              defaultValue={selectedCollection}
            />

            {/* Show schema-based form when collection is selected */}
            {collectionSchema && (
              <>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Collection: <strong>{collectionSchema.name}</strong> with{' '}
                    {collectionSchema.fields.length} fields
                  </AlertDescription>
                </Alert>

                {/* ID field (optional for auto-generation) */}
                <TextInput
                  source="id"
                  label="Document ID"
                  helperText="Leave empty for auto-generation"
                  fullWidth
                />

                {/* Dynamic fields based on schema */}
                {collectionSchema.fields
                  .filter((field) => field.name !== 'id') // ID handled separately
                  .map((field) => (
                    <DynamicField key={field.name} field={field} />
                  ))}
              </>
            )}

            {!collectionSchema && selectedCollection && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Loading collection schema...
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </SimpleForm>
    </Create>
  )
}

import {
  Edit,
  SimpleForm,
  TextInput,
  NumberInput,
  BooleanInput,
  ArrayInput,
  SimpleFormIterator,
  useRecordContext,
  useNotify,
  required,
  SaveButton,
  Toolbar,
  DeleteButton,
  useGetOne,
} from 'react-admin'
import { useState, useEffect } from 'react'
import { useSearchParams, useParams } from 'react-router-dom'
import { typesenseClient } from '../../providers/typesenseClient'
import type { CollectionResponse, CollectionFieldSchema } from '../../types/typesense'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Info, AlertTriangle } from 'lucide-react'
import { Badge } from '../../components/ui/badge'

const DocumentEditToolbar = () => (
  <Toolbar>
    <SaveButton />
    <DeleteButton mutationMode="pessimistic" />
  </Toolbar>
)

// Dynamic form field based on collection schema
const DynamicEditField = ({ field, record }: { field: CollectionFieldSchema; record: any }) => {
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

const DocumentEditForm = () => {
  const record = useRecordContext()
  const [searchParams] = useSearchParams()
  const [collections, setCollections] = useState<CollectionResponse[]>([])
  const [collectionSchema, setCollectionSchema] = useState<CollectionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const notify = useNotify()

  // Get collection from record or URL params
  const collectionName = record?.collection || searchParams.get('collection')

  // Fetch collections and schema
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

        // Find the collection schema
        if (collectionName) {
          const collection = response.find((c) => c.name === collectionName)
          setCollectionSchema(collection || null)
        }
      } catch (error: any) {
        notify(`Failed to load collections: ${error.message}`, { type: 'error' })
        console.error('Error loading collections:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCollections()
  }, [collectionName])

  if (!record) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>Loading document...</AlertDescription>
      </Alert>
    )
  }

  if (!collectionSchema) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Collection schema not found. Please ensure the collection exists.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <SimpleForm toolbar={<DocumentEditToolbar />}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Edit Document</CardTitle>
          <CardDescription>
            Update document in collection: <Badge variant="outline">{collectionSchema.name}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ID field (read-only) */}
          <TextInput
            source="id"
            label="Document ID"
            helperText="Document ID cannot be changed"
            disabled
            fullWidth
          />

          {/* Show metadata if available */}
          {record._score !== undefined && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Search relevance score: <strong>{record._score.toFixed(2)}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Dynamic fields based on schema */}
          {collectionSchema.fields
            .filter((field) => field.name !== 'id') // ID is read-only
            .map((field) => (
              <DynamicEditField key={field.name} field={field} record={record} />
            ))}

          {/* Hidden field to preserve collection name */}
          <input type="hidden" name="collection" value={collectionName || ''} />
        </CardContent>
      </Card>
    </SimpleForm>
  )
}

export const DocumentEdit = () => {
  const notify = useNotify()

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

  return (
    <Edit
      resource="typesense-documents"
      mutationMode="pessimistic"
    >
      <DocumentEditForm />
    </Edit>
  )
}

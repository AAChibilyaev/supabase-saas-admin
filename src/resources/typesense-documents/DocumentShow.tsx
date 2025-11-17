import {
  Show,
  SimpleShowLayout,
  TextField,
  FunctionField,
  useRecordContext,
  useNotify,
  EditButton,
  DeleteButton,
  TopToolbar,
  ListButton,
} from 'react-admin'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { typesenseClient } from '../../providers/typesenseClient'
import type { CollectionResponse, CollectionFieldSchema } from '../../types/typesense'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Info, FileText } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'

const DocumentShowActions = () => (
  <TopToolbar>
    <ListButton />
    <EditButton />
    <DeleteButton mutationMode="pessimistic" />
  </TopToolbar>
)

// Format field value based on type
const formatFieldValue = (value: any, fieldType: string): React.ReactNode => {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">null</span>
  }

  // Array types
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-gray-400 italic">empty array</span>
    }
    return (
      <div className="flex gap-1 flex-wrap">
        {value.map((item, idx) => (
          <Badge key={idx} variant="outline">
            {String(item)}
          </Badge>
        ))}
      </div>
    )
  }

  // Boolean
  if (typeof value === 'boolean') {
    return <Badge variant={value ? 'default' : 'secondary'}>{value ? 'True' : 'False'}</Badge>
  }

  // Object (JSON)
  if (typeof value === 'object') {
    return (
      <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-w-2xl">
        {JSON.stringify(value, null, 2)}
      </pre>
    )
  }

  // String (with URL detection)
  if (typeof value === 'string') {
    // Check if it's a URL
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {value}
        </a>
      )
    }

    // Long text
    if (value.length > 200) {
      return (
        <div className="max-w-2xl">
          <p className="text-sm whitespace-pre-wrap">{value}</p>
        </div>
      )
    }
  }

  // Default: string representation
  return <span className="font-mono text-sm">{String(value)}</span>
}

const DocumentShowContent = () => {
  const record = useRecordContext()
  const [searchParams] = useSearchParams()
  const [collectionSchema, setCollectionSchema] = useState<CollectionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const notify = useNotify()

  // Get collection from record or URL params
  const collectionName = record?.collection || searchParams.get('collection')

  // Fetch collection schema
  useEffect(() => {
    const fetchSchema = async () => {
      if (!typesenseClient || !collectionName) {
        setLoading(false)
        return
      }

      try {
        const collections = await typesenseClient.collections().retrieve()
        const collection = collections.find((c) => c.name === collectionName)
        setCollectionSchema(collection || null)
      } catch (error: any) {
        notify(`Failed to load collection schema: ${error.message}`, { type: 'error' })
        console.error('Error loading schema:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSchema()
  }, [collectionName])

  if (!record) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>Loading document...</AlertDescription>
      </Alert>
    )
  }

  // Get field schema for better type information
  const getFieldSchema = (fieldName: string): CollectionFieldSchema | undefined => {
    return collectionSchema?.fields.find((f) => f.name === fieldName)
  }

  // Separate document fields from metadata
  const documentFields = Object.keys(record).filter(
    (key) => !key.startsWith('_') && key !== 'collection'
  )
  const metadataFields = Object.keys(record).filter((key) => key.startsWith('_'))

  return (
    <div className="space-y-6">
      {/* Document Information Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Document: {record.id}
              </CardTitle>
              <CardDescription>
                Collection:{' '}
                <Badge variant="outline" className="ml-1">
                  {collectionName}
                </Badge>
              </CardDescription>
            </div>
            {record._score !== undefined && (
              <Badge variant="secondary">
                Relevance: {record._score.toFixed(2)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/4">Field</TableHead>
                <TableHead className="w-1/6">Type</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documentFields.map((fieldName) => {
                const fieldSchema = getFieldSchema(fieldName)
                const fieldType = fieldSchema?.type || 'unknown'
                const value = record[fieldName]

                return (
                  <TableRow key={fieldName}>
                    <TableCell className="font-semibold align-top">
                      <div className="flex items-center gap-2">
                        <span>{fieldName}</span>
                        {fieldSchema?.facet && (
                          <Badge variant="outline" className="text-xs">
                            Facet
                          </Badge>
                        )}
                        {fieldSchema?.optional && (
                          <Badge variant="secondary" className="text-xs">
                            Optional
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge variant="outline">{fieldType}</Badge>
                    </TableCell>
                    <TableCell className="align-top">
                      {formatFieldValue(value, fieldType)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Metadata Card (if any) */}
      {metadataFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
            <CardDescription>
              Internal fields and search-related information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metadataFields.map((fieldName) => (
                  <TableRow key={fieldName}>
                    <TableCell className="font-mono font-semibold">
                      {fieldName}
                    </TableCell>
                    <TableCell>
                      {formatFieldValue(record[fieldName], 'unknown')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Schema Information Card */}
      {collectionSchema && (
        <Card>
          <CardHeader>
            <CardTitle>Collection Schema</CardTitle>
            <CardDescription>
              Schema definition for collection: {collectionSchema.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="font-semibold">Total Documents:</span>{' '}
                {collectionSchema.num_documents || 0}
              </div>
              {collectionSchema.default_sorting_field && (
                <div>
                  <span className="font-semibold">Default Sort:</span>{' '}
                  {collectionSchema.default_sorting_field}
                </div>
              )}
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This collection has {collectionSchema.fields.length} fields defined in its schema.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Raw JSON View */}
      <Card>
        <CardHeader>
          <CardTitle>Raw JSON</CardTitle>
          <CardDescription>Complete document data in JSON format</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-50 p-4 rounded overflow-x-auto">
            {JSON.stringify(record, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

export const DocumentShow = () => {
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
    <Show resource="typesense-documents" actions={<DocumentShowActions />}>
      <DocumentShowContent />
    </Show>
  )
}

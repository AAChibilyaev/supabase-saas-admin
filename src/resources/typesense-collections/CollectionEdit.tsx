import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
import { Badge } from '../../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { Checkbox } from '../../components/ui/checkbox'
import { Plus, Trash2, Save, ArrowLeft, AlertTriangle } from 'lucide-react'
import { typesenseClient } from '../../providers/typesenseClient'
import type { CollectionResponse, CollectionField, FieldType } from '../../types/typesense'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../components/ui/alert'

const FIELD_TYPES: FieldType[] = [
  'string',
  'int32',
  'int64',
  'float',
  'bool',
  'geopoint',
  'string[]',
  'int32[]',
  'int64[]',
  'float[]',
  'bool[]',
  'object',
  'object[]',
  'auto',
  'string*',
  'image',
]

interface FieldFormData extends CollectionField {
  isNew?: boolean
}

export const CollectionEdit = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const notify = useNotify()

  const [collection, setCollection] = useState<CollectionResponse | null>(null)
  const [fields, setFields] = useState<FieldFormData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
      setFields(response.fields || [])
    } catch (error: any) {
      notify(`Failed to load collection: ${error.message}`, { type: 'error' })
      console.error('Error loading collection:', error)
      navigate('/typesense-collections')
    } finally {
      setLoading(false)
    }
  }

  const addField = () => {
    const newField: FieldFormData = {
      name: '',
      type: 'string',
      facet: false,
      optional: true,
      index: true,
      sort: false,
      infix: false,
      isNew: true,
    }
    setFields([...fields, newField])
  }

  const removeField = (index: number) => {
    const field = fields[index]
    if (!field.isNew) {
      notify('Cannot remove existing fields. You can only add new fields.', { type: 'warning' })
      return
    }
    setFields(fields.filter((_, i) => i !== index))
  }

  const updateField = (index: number, updates: Partial<FieldFormData>) => {
    const field = fields[index]

    // Prevent editing existing field names and types
    if (!field.isNew && (updates.name !== undefined || updates.type !== undefined)) {
      notify('Cannot modify name or type of existing fields', { type: 'warning' })
      return
    }

    setFields(
      fields.map((f, i) => (i === index ? { ...f, ...updates } : f))
    )
  }

  const validateSchema = (): string | null => {
    // Validate new fields
    const newFields = fields.filter(f => f.isNew)

    if (newFields.length === 0) {
      return 'No new fields to add'
    }

    for (const field of newFields) {
      if (!field.name.trim()) {
        return 'All new fields must have a name'
      }

      if (!/^[a-zA-Z0-9_]+$/.test(field.name)) {
        return `Field name "${field.name}" can only contain alphanumeric characters and underscores`
      }
    }

    // Check for duplicate field names
    const allFieldNames = fields.map((f) => f.name)
    const duplicates = allFieldNames.filter(
      (name, index) => allFieldNames.indexOf(name) !== index
    )
    if (duplicates.length > 0) {
      return `Duplicate field names found: ${duplicates.join(', ')}`
    }

    return null
  }

  const handleUpdate = async () => {
    const error = validateSchema()
    if (error) {
      notify(error, { type: 'error' })
      return
    }

    if (!typesenseClient || !id) {
      notify('Typesense client not configured', { type: 'error' })
      return
    }

    setSaving(true)

    try {
      // Get only the new fields to add
      const newFields = fields
        .filter(f => f.isNew)
        .map(field => {
          const { isNew, ...fieldData } = field
          return {
            name: fieldData.name,
            type: fieldData.type,
            facet: fieldData.facet || undefined,
            optional: fieldData.optional || undefined,
            index: fieldData.index === false ? false : undefined,
            sort: fieldData.sort || undefined,
            infix: fieldData.infix || undefined,
          }
        })

      // Update the collection schema by adding new fields
      await typesenseClient.collections(id).update({
        fields: newFields,
      })

      notify(`Collection "${id}" updated successfully`, { type: 'success' })
      navigate('/typesense-collections')
    } catch (error: any) {
      notify(`Failed to update collection: ${error.message}`, { type: 'error' })
      console.error('Error updating collection:', error)
    } finally {
      setSaving(false)
    }
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
        <div>
          <h1 className="text-3xl font-bold">Edit Collection: {collection.name}</h1>
          <p className="text-gray-600 mt-1">
            Add new fields to your collection schema
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/typesense-collections')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="space-y-6">
        {/* Collection Info */}
        <Card>
          <CardHeader>
            <CardTitle>Collection Information</CardTitle>
            <CardDescription>
              View basic information about your collection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Collection Name</Label>
                <p className="font-mono font-semibold mt-1">{collection.name}</p>
              </div>
              <div>
                <Label>Number of Documents</Label>
                <p className="font-semibold mt-1">
                  <Badge variant="outline">{collection.num_documents || 0}</Badge>
                </p>
              </div>
              {collection.default_sorting_field && (
                <div>
                  <Label>Default Sorting Field</Label>
                  <p className="font-mono mt-1">{collection.default_sorting_field}</p>
                </div>
              )}
              <div>
                <Label>Created At</Label>
                <p className="mt-1">{new Date(collection.created_at * 1000).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Important Note</AlertTitle>
          <AlertDescription>
            Typesense only supports adding new fields to existing collections. You cannot modify or remove existing fields.
            To make structural changes, you would need to create a new collection and migrate your data.
          </AlertDescription>
        </Alert>

        {/* Schema Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Collection Schema</CardTitle>
            <CardDescription>
              Existing and new fields for this collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Facet</TableHead>
                    <TableHead>Optional</TableHead>
                    <TableHead>Index</TableHead>
                    <TableHead>Sort</TableHead>
                    <TableHead>Infix</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={index} className={field.isNew ? 'bg-green-50' : ''}>
                      <TableCell>
                        {field.isNew ? (
                          <Input
                            placeholder="field_name"
                            value={field.name}
                            onChange={(e) =>
                              updateField(index, { name: e.target.value })
                            }
                          />
                        ) : (
                          <span className="font-mono">{field.name}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {field.isNew ? (
                          <Select
                            value={field.type}
                            onValueChange={(value) =>
                              updateField(index, { type: value as FieldType })
                            }
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FIELD_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline">{field.type}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {field.isNew ? (
                          <Checkbox
                            checked={field.facet}
                            onCheckedChange={(checked) =>
                              updateField(index, { facet: checked === true })
                            }
                          />
                        ) : (
                          <span>{field.facet ? '✓' : '-'}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {field.isNew ? (
                          <Checkbox
                            checked={field.optional}
                            onCheckedChange={(checked) =>
                              updateField(index, { optional: checked === true })
                            }
                          />
                        ) : (
                          <span>{field.optional ? '✓' : '-'}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {field.isNew ? (
                          <Checkbox
                            checked={field.index !== false}
                            onCheckedChange={(checked) =>
                              updateField(index, { index: checked === true })
                            }
                          />
                        ) : (
                          <span>{field.index !== false ? '✓' : '-'}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {field.isNew ? (
                          <Checkbox
                            checked={field.sort}
                            onCheckedChange={(checked) =>
                              updateField(index, { sort: checked === true })
                            }
                          />
                        ) : (
                          <span>{field.sort ? '✓' : '-'}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {field.isNew ? (
                          <Checkbox
                            checked={field.infix}
                            onCheckedChange={(checked) =>
                              updateField(index, { infix: checked === true })
                            }
                          />
                        ) : (
                          <span>{field.infix ? '✓' : '-'}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {field.isNew ? (
                          <Badge variant="default" className="bg-green-600">New</Badge>
                        ) : (
                          <Badge variant="secondary">Existing</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {field.isNew && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeField(index)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Button onClick={addField} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add New Field
              </Button>
            </div>

            {/* Field Options Guide */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
              <p className="font-semibold">Field Options:</p>
              <ul className="space-y-1 text-gray-600">
                <li>
                  <Badge variant="outline" className="mr-2">
                    Facet
                  </Badge>
                  Enable faceting for filtering and analytics
                </li>
                <li>
                  <Badge variant="outline" className="mr-2">
                    Optional
                  </Badge>
                  Field can be omitted when indexing documents
                </li>
                <li>
                  <Badge variant="outline" className="mr-2">
                    Index
                  </Badge>
                  Field will be indexed for searching (default: true)
                </li>
                <li>
                  <Badge variant="outline" className="mr-2">
                    Sort
                  </Badge>
                  Enable sorting on this field
                </li>
                <li>
                  <Badge variant="outline" className="mr-2">
                    Infix
                  </Badge>
                  Enable infix search (search within words)
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/typesense-collections')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={saving || fields.filter(f => f.isNew).length === 0}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}

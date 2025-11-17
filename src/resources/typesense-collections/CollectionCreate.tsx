import { useState } from 'react'
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
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react'
import { typesenseClient } from '../../providers/typesenseClient'
import type { CollectionField, FieldType } from '../../types/typesense'

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

interface FieldFormData {
  name: string
  type: FieldType
  facet: boolean
  optional: boolean
  index: boolean
  sort: boolean
  infix: boolean
}

const defaultField: FieldFormData = {
  name: '',
  type: 'string',
  facet: false,
  optional: false,
  index: true,
  sort: false,
  infix: false,
}

export const CollectionCreate = () => {
  const navigate = useNavigate()
  const notify = useNotify()

  const [collectionName, setCollectionName] = useState('')
  const [fields, setFields] = useState<FieldFormData[]>([{ ...defaultField }])
  const [defaultSortingField, setDefaultSortingField] = useState('')
  const [enableNestedFields, setEnableNestedFields] = useState(false)
  const [loading, setLoading] = useState(false)

  const addField = () => {
    setFields([...fields, { ...defaultField }])
  }

  const removeField = (index: number) => {
    if (fields.length === 1) {
      notify('At least one field is required', { type: 'warning' })
      return
    }
    setFields(fields.filter((_, i) => i !== index))
  }

  const updateField = (index: number, updates: Partial<FieldFormData>) => {
    setFields(
      fields.map((field, i) => (i === index ? { ...field, ...updates } : field))
    )
  }

  const validateSchema = (): string | null => {
    // Validate collection name
    if (!collectionName.trim()) {
      return 'Collection name is required'
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(collectionName)) {
      return 'Collection name can only contain alphanumeric characters, underscores, and hyphens'
    }

    // Validate fields
    if (fields.length === 0) {
      return 'At least one field is required'
    }

    for (const field of fields) {
      if (!field.name.trim()) {
        return 'All fields must have a name'
      }

      if (!/^[a-zA-Z0-9_]+$/.test(field.name)) {
        return `Field name "${field.name}" can only contain alphanumeric characters and underscores`
      }
    }

    // Check for duplicate field names
    const fieldNames = fields.map((f) => f.name)
    const duplicates = fieldNames.filter(
      (name, index) => fieldNames.indexOf(name) !== index
    )
    if (duplicates.length > 0) {
      return `Duplicate field names found: ${duplicates.join(', ')}`
    }

    // Validate default sorting field
    if (defaultSortingField && !fieldNames.includes(defaultSortingField)) {
      return 'Default sorting field must be one of the defined fields'
    }

    // Validate sorting field type
    if (defaultSortingField) {
      const sortField = fields.find((f) => f.name === defaultSortingField)
      if (
        sortField &&
        !['int32', 'int64', 'float'].includes(sortField.type)
      ) {
        return 'Default sorting field must be of type int32, int64, or float'
      }
    }

    return null
  }

  const handleCreate = async () => {
    const error = validateSchema()
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
      const schema = {
        name: collectionName,
        fields: fields.map((field) => ({
          name: field.name,
          type: field.type,
          facet: field.facet || undefined,
          optional: field.optional || undefined,
          index: field.index === false ? false : undefined,
          sort: field.sort || undefined,
          infix: field.infix || undefined,
        })),
        ...(defaultSortingField && { default_sorting_field: defaultSortingField }),
        ...(enableNestedFields && { enable_nested_fields: true }),
      }

      await typesenseClient.collections().create(schema)

      notify(`Collection "${collectionName}" created successfully`, {
        type: 'success',
      })
      navigate('/typesense-collections')
    } catch (error: any) {
      notify(`Failed to create collection: ${error.message}`, { type: 'error' })
      console.error('Error creating collection:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Create Collection</h1>
          <p className="text-gray-600 mt-1">
            Define the schema for your new Typesense collection
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
              Basic information about your collection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Collection Name *</Label>
              <Input
                id="name"
                placeholder="e.g., products, users, posts"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Only alphanumeric characters, underscores, and hyphens are allowed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortField">Default Sorting Field (Optional)</Label>
              <Select value={defaultSortingField} onValueChange={setDefaultSortingField}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a numeric field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {fields
                    .filter((f) =>
                      ['int32', 'int64', 'float'].includes(f.type)
                    )
                    .map((field, idx) => (
                      <SelectItem key={idx} value={field.name}>
                        {field.name} ({field.type})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Must be a numeric field (int32, int64, or float)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="nestedFields"
                checked={enableNestedFields}
                onCheckedChange={(checked) =>
                  setEnableNestedFields(checked === true)
                }
              />
              <Label htmlFor="nestedFields" className="cursor-pointer">
                Enable nested fields
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Schema Builder */}
        <Card>
          <CardHeader>
            <CardTitle>Schema Definition</CardTitle>
            <CardDescription>
              Define the fields for your collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field Name *</TableHead>
                    <TableHead>Type *</TableHead>
                    <TableHead>Facet</TableHead>
                    <TableHead>Optional</TableHead>
                    <TableHead>Index</TableHead>
                    <TableHead>Sort</TableHead>
                    <TableHead>Infix</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          placeholder="field_name"
                          value={field.name}
                          onChange={(e) =>
                            updateField(index, { name: e.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={field.facet}
                          onCheckedChange={(checked) =>
                            updateField(index, { facet: checked === true })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={field.optional}
                          onCheckedChange={(checked) =>
                            updateField(index, { optional: checked === true })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={field.index}
                          onCheckedChange={(checked) =>
                            updateField(index, { index: checked === true })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={field.sort}
                          onCheckedChange={(checked) =>
                            updateField(index, { sort: checked === true })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={field.infix}
                          onCheckedChange={(checked) =>
                            updateField(index, { infix: checked === true })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeField(index)}
                          disabled={fields.length === 1}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Button onClick={addField} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Field
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
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Collection'}
          </Button>
        </div>
      </div>
    </div>
  )
}

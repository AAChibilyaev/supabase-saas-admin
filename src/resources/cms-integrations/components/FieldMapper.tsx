import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Badge } from '../../../components/ui/badge'
import { ArrowRight, Plus, Trash2 } from 'lucide-react'
import type { Field, FieldMapping, CMSConnector } from '../../../types/cms'

interface FieldMapperProps {
  connector: CMSConnector
  config: any
  mappings: FieldMapping[]
  onChange: (mappings: FieldMapping[]) => void
}

const TARGET_FIELDS: Field[] = [
  { name: 'title', type: 'string', label: 'Title', required: true },
  { name: 'content', type: 'string', label: 'Content', required: true },
  { name: 'file_type', type: 'string', label: 'File Type' },
  { name: 'file_size', type: 'number', label: 'File Size' },
  { name: 'metadata', type: 'object', label: 'Metadata' },
  { name: 'tags', type: 'array', label: 'Tags' }
]

const TRANSFORMS = [
  { id: '', name: 'None' },
  { id: 'lowercase', name: 'Lowercase' },
  { id: 'uppercase', name: 'Uppercase' },
  { id: 'strip_html', name: 'Strip HTML' },
  { id: 'trim', name: 'Trim Whitespace' }
]

export const FieldMapper = ({ connector, config, mappings, onChange }: FieldMapperProps) => {
  const [sourceFields, setSourceFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadFields = async () => {
      try {
        setLoading(true)
        setError(null)
        const fields = await connector.getAvailableFields(config)
        setSourceFields(fields)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load fields')
      } finally {
        setLoading(false)
      }
    }

    if (config && connector) {
      loadFields()
    }
  }, [connector, config])

  const addMapping = () => {
    onChange([...mappings, { sourceField: '', targetField: '', transform: '' }])
  }

  const removeMapping = (index: number) => {
    onChange(mappings.filter((_, i) => i !== index))
  }

  const updateMapping = (index: number, updates: Partial<FieldMapping>) => {
    const updated = [...mappings]
    updated[index] = { ...updated[index], ...updates }
    onChange(updated)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading available fields...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Field Mapping</CardTitle>
        <p className="text-sm text-muted-foreground">
          Map fields from your CMS to document fields
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {mappings.map((mapping, index) => (
          <div key={index} className="flex items-start gap-2 p-4 border rounded-lg">
            <div className="flex-1 space-y-2">
              <Label>Source Field</Label>
              <Select
                value={mapping.sourceField}
                onValueChange={(value) => updateMapping(index, { sourceField: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source field" />
                </SelectTrigger>
                <SelectContent>
                  {sourceFields.map((field) => (
                    <SelectItem key={field.name} value={field.name}>
                      {field.label} ({field.type})
                      {field.required && <Badge className="ml-2" variant="secondary">Required</Badge>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center pt-8">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex-1 space-y-2">
              <Label>Target Field</Label>
              <Select
                value={mapping.targetField}
                onValueChange={(value) => updateMapping(index, { targetField: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target field" />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_FIELDS.map((field) => (
                    <SelectItem key={field.name} value={field.name}>
                      {field.label} ({field.type})
                      {field.required && <Badge className="ml-2" variant="secondary">Required</Badge>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-2">
              <Label>Transform</Label>
              <Select
                value={mapping.transform || ''}
                onValueChange={(value) => updateMapping(index, { transform: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No transform" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSFORMS.map((transform) => (
                    <SelectItem key={transform.id} value={transform.id}>
                      {transform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeMapping(index)}
              className="mt-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button onClick={addMapping} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Field Mapping
        </Button>

        {mappings.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No field mappings configured. Click "Add Field Mapping" to get started.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

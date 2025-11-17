import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useToast } from '../hooks/use-toast'
import { supabase } from '../lib/supabase'
import { EmailType } from '../services/email'

interface EmailTemplate {
  id: string
  name: string
  type: EmailType
  subject: string
  html_template: string
  variables: string[]
  is_active: boolean
  version: number
  created_at: string
  updated_at: string
}

export function EmailTemplateEditor() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [editedTemplate, setEditedTemplate] = useState<Partial<EmailTemplate>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('type', { ascending: true })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Failed to load templates:', error)
      toast({
        title: 'Error',
        description: 'Failed to load email templates',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(template)
      setEditedTemplate(template)
      setPreviewHtml(template.html_template)
    }
  }

  const handleSave = async () => {
    if (!selectedTemplate || !editedTemplate) return

    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('email_templates')
        .update({
          subject: editedTemplate.subject,
          html_template: editedTemplate.html_template,
          is_active: editedTemplate.is_active,
          version: (selectedTemplate.version || 0) + 1,
        })
        .eq('id', selectedTemplate.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Email template updated successfully',
      })

      await loadTemplates()
    } catch (error) {
      console.error('Failed to update template:', error)
      toast({
        title: 'Error',
        description: 'Failed to update email template',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = () => {
    if (editedTemplate.html_template) {
      setPreviewHtml(editedTemplate.html_template)
    }
  }

  const insertVariable = (variable: string) => {
    if (!editedTemplate.html_template) return

    const template = editedTemplate.html_template
    const newTemplate = template + `{{${variable}}}`

    setEditedTemplate({
      ...editedTemplate,
      html_template: newTemplate,
    })
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Editor Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Email Template Editor</CardTitle>
          <CardDescription>
            Customize email templates for different scenarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p>Loading templates...</p>
          ) : (
            <>
              {/* Template Selection */}
              <div className="space-y-2">
                <Label>Select Template</Label>
                <Select
                  value={selectedTemplate?.id}
                  onValueChange={handleSelectTemplate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplate && (
                <>
                  {/* Template Info */}
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input value={selectedTemplate.name} disabled />
                  </div>

                  <div className="space-y-2">
                    <Label>Template Type</Label>
                    <Input value={selectedTemplate.type} disabled />
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input
                      value={editedTemplate.subject || ''}
                      onChange={(e) =>
                        setEditedTemplate({
                          ...editedTemplate,
                          subject: e.target.value,
                        })
                      }
                      placeholder="Email subject"
                    />
                  </div>

                  {/* Variables */}
                  <div className="space-y-2">
                    <Label>Available Variables</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.variables?.map((variable) => (
                        <Button
                          key={variable}
                          variant="outline"
                          size="sm"
                          onClick={() => insertVariable(variable)}
                        >
                          {variable}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Click to insert into template
                    </p>
                  </div>

                  {/* HTML Template */}
                  <div className="space-y-2">
                    <Label>HTML Template</Label>
                    <Textarea
                      value={editedTemplate.html_template || ''}
                      onChange={(e) =>
                        setEditedTemplate({
                          ...editedTemplate,
                          html_template: e.target.value,
                        })
                      }
                      placeholder="Enter HTML template"
                      rows={12}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use double curly braces for variables: {`{{variableName}}`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button onClick={handlePreview} variant="outline">
                      Preview
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Template'}
                    </Button>
                  </div>

                  {/* Version Info */}
                  <div className="text-xs text-muted-foreground">
                    Version: {selectedTemplate.version} | Last updated:{' '}
                    {new Date(selectedTemplate.updated_at).toLocaleString()}
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            See how your email template will look
          </CardDescription>
        </CardHeader>
        <CardContent>
          {previewHtml ? (
            <div className="border rounded-lg p-4 bg-gray-50">
              <iframe
                srcDoc={previewHtml}
                title="Email Preview"
                className="w-full h-96 border-0"
                sandbox="allow-same-origin"
              />
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <p>Select a template and click Preview to see the email</p>
            </div>
          )}

          {selectedTemplate && (
            <div className="mt-4 space-y-2">
              <div className="text-sm">
                <strong>Subject:</strong> {editedTemplate.subject}
              </div>
              <div className="text-sm">
                <strong>Type:</strong> {selectedTemplate.type}
              </div>
              <div className="text-sm">
                <strong>Variables:</strong>{' '}
                {selectedTemplate.variables?.join(', ')}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

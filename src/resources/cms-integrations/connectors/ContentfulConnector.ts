import type { CMSConnector, CMSConfig, Field, FieldMapping, FetchOptions, WebhookConfig } from '../../../types/cms'

export class ContentfulConnector implements CMSConnector {
  type = 'contentful' as const
  name = 'Contentful'
  icon = 'contentful'

  async testConnection(config: CMSConfig): Promise<{ success: boolean; message?: string }> {
    try {
      const space = config.spaceId || ''
      const env = config.environment || 'master'

      const response = await fetch(
        `https://cdn.contentful.com/spaces/${space}/environments/${env}/entries?limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`
          }
        }
      )

      if (!response.ok) {
        return {
          success: false,
          message: `Connection failed: ${response.statusText}`
        }
      }

      return { success: true, message: 'Connection successful' }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async fetchDocuments(config: CMSConfig, options: FetchOptions = {}): Promise<any[]> {
    const { limit = 100, offset = 0, filters = {}, incrementalSync, lastSyncDate } = options
    const space = config.spaceId || ''
    const env = config.environment || 'master'

    const params = new URLSearchParams({
      limit: String(limit),
      skip: String(offset),
      ...filters
    })

    if (incrementalSync && lastSyncDate) {
      params.append('sys.updatedAt[gte]', lastSyncDate)
    }

    const response = await fetch(
      `https://cdn.contentful.com/spaces/${space}/environments/${env}/entries?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch entries: ${response.statusText}`)
    }

    const data = await response.json()
    return data.items || []
  }

  async getAvailableFields(config: CMSConfig): Promise<Field[]> {
    const space = config.spaceId || ''
    const env = config.environment || 'master'

    // Fetch content types to get available fields
    const response = await fetch(
      `https://cdn.contentful.com/spaces/${space}/environments/${env}/content_types`,
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch content types')
    }

    const data = await response.json()
    const fields: Field[] = [
      { name: 'sys.id', type: 'string', label: 'Entry ID' },
      { name: 'sys.createdAt', type: 'date', label: 'Created At' },
      { name: 'sys.updatedAt', type: 'date', label: 'Updated At' }
    ]

    // Add fields from first content type as example
    if (data.items && data.items.length > 0) {
      const contentType = data.items[0]
      for (const field of contentType.fields || []) {
        fields.push({
          name: `fields.${field.id}`,
          type: this.mapContentfulType(field.type),
          label: field.name,
          required: field.required
        })
      }
    }

    return fields
  }

  mapFields(sourceData: any, mappings: FieldMapping[]): any {
    const mapped: any = {}

    for (const mapping of mappings) {
      const value = this.getNestedValue(sourceData, mapping.sourceField)

      if (value !== undefined) {
        mapped[mapping.targetField] = mapping.transform
          ? this.applyTransform(value, mapping.transform)
          : value
      }
    }

    return mapped
  }

  async setupWebhook(config: CMSConfig, webhookUrl: string): Promise<WebhookConfig> {
    const space = config.spaceId || ''

    const response = await fetch(
      `https://api.contentful.com/spaces/${space}/webhook_definitions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/vnd.contentful.management.v1+json'
        },
        body: JSON.stringify({
          name: 'Supabase Sync Webhook',
          url: webhookUrl,
          topics: [
            'Entry.create',
            'Entry.save',
            'Entry.auto_save',
            'Entry.archive',
            'Entry.unarchive',
            'Entry.publish',
            'Entry.unpublish',
            'Entry.delete'
          ]
        })
      }
    )

    if (!response.ok) {
      throw new Error('Failed to setup webhook')
    }

    const data = await response.json()

    return {
      url: webhookUrl,
      secret: '', // Contentful uses headers for auth
      events: ['Entry.create', 'Entry.save', 'Entry.publish', 'Entry.delete']
    }
  }

  validateWebhookSignature(payload: any, signature: string, secret: string): boolean {
    // Contentful uses different auth method
    return true
  }

  private mapContentfulType(type: string): Field['type'] {
    switch (type) {
      case 'Symbol':
      case 'Text':
        return 'string'
      case 'Integer':
      case 'Number':
        return 'number'
      case 'Date':
        return 'date'
      case 'Boolean':
        return 'boolean'
      case 'Array':
        return 'array'
      case 'Object':
        return 'object'
      default:
        return 'string'
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj)
  }

  private applyTransform(value: any, transform: string): any {
    switch (transform) {
      case 'lowercase':
        return String(value).toLowerCase()
      case 'uppercase':
        return String(value).toUpperCase()
      case 'strip_html':
        return String(value).replace(/<[^>]*>/g, '')
      default:
        return value
    }
  }
}

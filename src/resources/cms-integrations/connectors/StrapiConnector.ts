import type { CMSConnector, CMSConfig, Field, FieldMapping, FetchOptions, WebhookConfig } from '../../../types/cms'

export class StrapiConnector implements CMSConnector {
  type = 'strapi' as const
  name = 'Strapi'
  icon = 'strapi'

  async testConnection(config: CMSConfig): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${config.url}/api/content-type-builder/content-types`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        }
      })

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
    const collectionType = config.collectionType || 'articles'

    const params = new URLSearchParams({
      'pagination[pageSize]': String(limit),
      'pagination[page]': String(Math.floor(offset / limit) + 1),
      'populate': '*'
    })

    if (incrementalSync && lastSyncDate) {
      params.append('filters[updatedAt][$gte]', lastSyncDate)
    }

    Object.entries(filters).forEach(([key, value]) => {
      params.append(`filters[${key}]`, String(value))
    })

    const response = await fetch(`${config.url}/api/${collectionType}?${params}`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch documents: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || []
  }

  async getAvailableFields(config: CMSConfig): Promise<Field[]> {
    const collectionType = config.collectionType || 'articles'

    const response = await fetch(`${config.url}/api/content-type-builder/content-types`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch content types')
    }

    const data = await response.json()
    const fields: Field[] = [
      { name: 'id', type: 'number', label: 'ID' },
      { name: 'attributes.createdAt', type: 'date', label: 'Created At' },
      { name: 'attributes.updatedAt', type: 'date', label: 'Updated At' }
    ]

    // Find the specific collection type
    const contentType = data.data?.find((ct: any) =>
      ct.apiID === collectionType || ct.uid.includes(collectionType)
    )

    if (contentType?.schema?.attributes) {
      Object.entries(contentType.schema.attributes).forEach(([key, attr]: [string, any]) => {
        fields.push({
          name: `attributes.${key}`,
          type: this.mapStrapiType(attr.type),
          label: key.charAt(0).toUpperCase() + key.slice(1),
          required: attr.required
        })
      })
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
    // Strapi v4 webhooks
    const response = await fetch(`${config.url}/api/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Supabase Sync Webhook',
        url: webhookUrl,
        headers: {},
        events: ['entry.create', 'entry.update', 'entry.delete']
      })
    })

    if (!response.ok) {
      throw new Error('Failed to setup webhook')
    }

    const data = await response.json()

    return {
      url: webhookUrl,
      secret: '', // Strapi doesn't use webhook secrets by default
      events: ['entry.create', 'entry.update', 'entry.delete']
    }
  }

  validateWebhookSignature(_payload: any, _signature: string, _secret: string): boolean {
    // Strapi doesn't have built-in signature validation
    return true
  }

  private mapStrapiType(type: string): Field['type'] {
    switch (type) {
      case 'string':
      case 'text':
      case 'richtext':
      case 'email':
      case 'password':
      case 'enumeration':
      case 'uid':
        return 'string'
      case 'integer':
      case 'biginteger':
      case 'float':
      case 'decimal':
        return 'number'
      case 'date':
      case 'datetime':
      case 'time':
        return 'date'
      case 'boolean':
        return 'boolean'
      case 'json':
        return 'object'
      case 'relation':
      case 'component':
      case 'dynamiczone':
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

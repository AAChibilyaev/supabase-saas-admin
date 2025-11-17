import type { CMSConnector, CMSConfig, Field, FieldMapping, FetchOptions, WebhookConfig } from '../../../types/cms'

export class WordPressConnector implements CMSConnector {
  type = 'wordpress' as const
  name = 'WordPress'
  icon = 'wordpress'

  async testConnection(config: CMSConfig): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${config.url}/wp-json/wp/v2/posts?per_page=1`, {
        headers: config.apiKey ? {
          'Authorization': `Bearer ${config.apiKey}`
        } : {}
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

    const params = new URLSearchParams({
      per_page: String(limit),
      page: String(Math.floor(offset / limit) + 1),
      ...filters
    })

    if (incrementalSync && lastSyncDate) {
      params.append('modified_after', lastSyncDate)
    }

    const response = await fetch(`${config.url}/wp-json/wp/v2/posts?${params}`, {
      headers: config.apiKey ? {
        'Authorization': `Bearer ${config.apiKey}`
      } : {}
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`)
    }

    return await response.json()
  }

  async getAvailableFields(_config: CMSConfig): Promise<Field[]> {
    return [
      { name: 'title.rendered', type: 'string', label: 'Title', required: true },
      { name: 'content.rendered', type: 'string', label: 'Content', required: true },
      { name: 'excerpt.rendered', type: 'string', label: 'Excerpt' },
      { name: 'date', type: 'date', label: 'Published Date' },
      { name: 'modified', type: 'date', label: 'Modified Date' },
      { name: 'author', type: 'number', label: 'Author ID' },
      { name: 'slug', type: 'string', label: 'Slug' },
      { name: 'status', type: 'string', label: 'Status' },
      { name: 'link', type: 'string', label: 'Permalink' },
      { name: 'categories', type: 'array', label: 'Categories' },
      { name: 'tags', type: 'array', label: 'Tags' }
    ]
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
    // WordPress doesn't have built-in webhook support
    // This would require a plugin like WP Webhooks
    const response = await fetch(`${config.url}/wp-json/wp-webhooks/v1/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: webhookUrl,
        events: ['post_created', 'post_updated', 'post_deleted']
      })
    })

    if (!response.ok) {
      throw new Error('Failed to setup webhook')
    }

    const data = await response.json()

    return {
      url: webhookUrl,
      secret: data.secret || '',
      events: ['post_created', 'post_updated', 'post_deleted']
    }
  }

  validateWebhookSignature(payload: any, signature: string, secret: string): boolean {
    // Implement HMAC validation for WordPress webhooks
    // This is plugin-dependent
    return true
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj)
  }

  private applyTransform(value: any, transform: string): any {
    // Simple transform support
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

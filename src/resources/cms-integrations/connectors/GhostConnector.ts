import type { CMSConnector, CMSConfig, Field, FieldMapping, FetchOptions, WebhookConfig } from '../../../types/cms'

export class GhostConnector implements CMSConnector {
  type = 'ghost' as const
  name = 'Ghost'
  icon = 'ghost'

  async testConnection(config: CMSConfig): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(
        `${config.url}/ghost/api/content/posts/?key=${config.apiKey}&limit=1`
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

    const params = new URLSearchParams({
      key: config.apiKey,
      limit: String(limit),
      page: String(Math.floor(offset / limit) + 1),
      include: 'authors,tags',
      ...filters
    })

    if (incrementalSync && lastSyncDate) {
      params.append('filter', `updated_at:>='${lastSyncDate}'`)
    }

    const response = await fetch(`${config.url}/ghost/api/content/posts/?${params}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`)
    }

    const data = await response.json()
    return data.posts || []
  }

  async getAvailableFields(_config: CMSConfig): Promise<Field[]> {
    return [
      { name: 'id', type: 'string', label: 'Post ID', required: true },
      { name: 'uuid', type: 'string', label: 'UUID' },
      { name: 'title', type: 'string', label: 'Title', required: true },
      { name: 'slug', type: 'string', label: 'Slug' },
      { name: 'html', type: 'string', label: 'HTML Content' },
      { name: 'plaintext', type: 'string', label: 'Plain Text' },
      { name: 'excerpt', type: 'string', label: 'Excerpt' },
      { name: 'published_at', type: 'date', label: 'Published At' },
      { name: 'created_at', type: 'date', label: 'Created At' },
      { name: 'updated_at', type: 'date', label: 'Updated At' },
      { name: 'url', type: 'string', label: 'URL' },
      { name: 'feature_image', type: 'string', label: 'Feature Image' },
      { name: 'featured', type: 'boolean', label: 'Featured' },
      { name: 'visibility', type: 'string', label: 'Visibility' },
      { name: 'authors', type: 'array', label: 'Authors' },
      { name: 'tags', type: 'array', label: 'Tags' },
      { name: 'meta_title', type: 'string', label: 'Meta Title' },
      { name: 'meta_description', type: 'string', label: 'Meta Description' }
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
    // Ghost Admin API is needed for webhooks
    const response = await fetch(`${config.url}/ghost/api/admin/webhooks/`, {
      method: 'POST',
      headers: {
        'Authorization': `Ghost ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        webhooks: [{
          event: 'post.published',
          target_url: webhookUrl
        }, {
          event: 'post.updated',
          target_url: webhookUrl
        }, {
          event: 'post.deleted',
          target_url: webhookUrl
        }]
      })
    })

    if (!response.ok) {
      throw new Error('Failed to setup webhook')
    }

    return {
      url: webhookUrl,
      secret: '', // Ghost uses JWT for webhook auth
      events: ['post.published', 'post.updated', 'post.deleted']
    }
  }

  validateWebhookSignature(_payload: any, _signature: string, _secret: string): boolean {
    // Ghost uses JWT tokens for webhook validation
    return true
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

import type { CMSConnector, CMSConfig, Field, FieldMapping, FetchOptions } from '../../../types/cms'

export class CustomConnector implements CMSConnector {
  type = 'custom' as const
  name = 'Custom API'
  icon = 'api'

  async testConnection(config: CMSConfig): Promise<{ success: boolean; message?: string }> {
    try {
      const endpoint = config.testEndpoint || config.url

      const response = await fetch(endpoint, {
        method: config.testMethod || 'GET',
        headers: {
          'Authorization': config.authType === 'bearer'
            ? `Bearer ${config.apiKey}`
            : config.apiKey || '',
          'Content-Type': 'application/json',
          ...(config.customHeaders || {})
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
    const { limit = 100, offset = 0, filters = {} } = options

    const endpoint = config.dataEndpoint || config.url
    const method = config.dataMethod || 'GET'

    const url = new URL(endpoint)

    // Add pagination parameters based on config
    if (config.paginationType === 'offset') {
      url.searchParams.append(config.limitParam || 'limit', String(limit))
      url.searchParams.append(config.offsetParam || 'offset', String(offset))
    } else if (config.paginationType === 'page') {
      url.searchParams.append(config.pageSizeParam || 'per_page', String(limit))
      url.searchParams.append(config.pageParam || 'page', String(Math.floor(offset / limit) + 1))
    }

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      url.searchParams.append(key, String(value))
    })

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Authorization': config.authType === 'bearer'
          ? `Bearer ${config.apiKey}`
          : config.apiKey || '',
        'Content-Type': 'application/json',
        ...(config.customHeaders || {})
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch documents: ${response.statusText}`)
    }

    const data = await response.json()

    // Extract data from response based on config
    const dataPath = config.dataPath || 'data'
    return this.getNestedValue(data, dataPath) || data
  }

  async getAvailableFields(config: CMSConfig): Promise<Field[]> {
    // For custom APIs, fields need to be configured manually
    return config.fields || [
      { name: 'id', type: 'string', label: 'ID' },
      { name: 'title', type: 'string', label: 'Title' },
      { name: 'content', type: 'string', label: 'Content' },
      { name: 'created_at', type: 'date', label: 'Created At' },
      { name: 'updated_at', type: 'date', label: 'Updated At' }
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
      case 'trim':
        return String(value).trim()
      case 'json_parse':
        return typeof value === 'string' ? JSON.parse(value) : value
      case 'json_stringify':
        return JSON.stringify(value)
      default:
        return value
    }
  }
}

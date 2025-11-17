import type { Database } from './database.types'

export type CMSConnection = Database['public']['Tables']['cms_connections']['Row']
export type CMSIntegration = Database['public']['Tables']['cms_integrations']['Row']
export type CMSSyncLog = Database['public']['Tables']['cms_sync_logs']['Row']
export type CMSWebhookEvent = Database['public']['Tables']['cms_webhook_events']['Row']

export type CMSType = 'wordpress' | 'contentful' | 'strapi' | 'ghost' | 'sanity' | 'payload' | 'directus' | 'custom'

export interface CMSConfig {
  url: string
  apiKey: string
  apiSecret?: string
  spaceId?: string // Contentful
  environment?: string // Contentful
  [key: string]: any
}

export interface Field {
  name: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'object' | 'array'
  label: string
  required?: boolean
  description?: string
}

export interface FieldMapping {
  sourceField: string
  targetField: string
  transform?: string
}

export interface FetchOptions {
  limit?: number
  offset?: number
  filters?: Record<string, any>
  incrementalSync?: boolean
  lastSyncDate?: string
}

export interface SyncResult {
  success: boolean
  documentsFetched: number
  documentsSynced: number
  documentsFailed: number
  errors?: Array<{ message: string; details?: any }>
}

export interface WebhookConfig {
  url: string
  secret: string
  events: string[]
}

export interface CMSConnector {
  type: CMSType
  name: string
  icon?: string

  // Connection
  testConnection(config: CMSConfig): Promise<{ success: boolean; message?: string }>

  // Data fetching
  fetchDocuments(
    config: CMSConfig,
    options: FetchOptions
  ): Promise<any[]>

  // Field mapping
  getAvailableFields(config: CMSConfig): Promise<Field[]>
  mapFields(sourceData: any, mappings: FieldMapping[]): any

  // Webhooks (optional)
  setupWebhook?(config: CMSConfig, webhookUrl: string): Promise<WebhookConfig>
  validateWebhookSignature?(payload: any, signature: string, secret: string): boolean
}

export interface SyncSchedule {
  enabled: boolean
  type: 'manual' | 'interval' | 'cron' | 'webhook'
  interval?: number // in minutes
  cronExpression?: string
  timezone?: string
}

export const CMS_TYPES: Array<{ id: CMSType; name: string; description: string }> = [
  { id: 'wordpress', name: 'WordPress', description: 'WordPress REST API v2' },
  { id: 'contentful', name: 'Contentful', description: 'Contentful Content Delivery API' },
  { id: 'strapi', name: 'Strapi', description: 'Strapi Headless CMS' },
  { id: 'ghost', name: 'Ghost', description: 'Ghost Content API' },
  { id: 'sanity', name: 'Sanity', description: 'Sanity.io CMS' },
  { id: 'payload', name: 'Payload', description: 'Payload CMS' },
  { id: 'directus', name: 'Directus', description: 'Directus Headless CMS' },
  { id: 'custom', name: 'Custom API', description: 'Generic REST API connector' }
]

export const SYNC_MODES = [
  { id: 'manual', name: 'Manual' },
  { id: 'scheduled', name: 'Scheduled' },
  { id: 'webhook', name: 'Webhook (Real-time)' },
  { id: 'incremental', name: 'Incremental' }
]

export const SYNC_STATUSES = [
  { id: 'pending', name: 'Pending', color: 'default' },
  { id: 'running', name: 'Running', color: 'blue' },
  { id: 'success', name: 'Success', color: 'green' },
  { id: 'failed', name: 'Failed', color: 'red' },
  { id: 'partial', name: 'Partial Success', color: 'yellow' }
]

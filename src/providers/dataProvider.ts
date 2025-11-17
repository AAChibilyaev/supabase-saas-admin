import { supabaseDataProvider } from 'ra-supabase'
import { supabaseClient } from './supabaseClient'
import { typesenseDataProvider } from './typesenseDataProvider'
import type { DataProvider } from 'react-admin'

const baseDataProvider = supabaseDataProvider({
  instanceUrl: import.meta.env.VITE_SUPABASE_URL,
  apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  supabaseClient,
})

// Resources that use Typesense instead of Supabase
const TYPESENSE_RESOURCES = [
  'typesense-keys',
  'typesense-collections',
  'typesense-documents',
  'typesense-synonyms',
  'typesense-curations',
  'presets',
]

// Resources that should be filtered by tenant_id
const TENANT_FILTERED_RESOURCES = [
  'documents',
  'search_logs',
  'tenant_api_keys',
  'daily_usage_stats',
  'cms_integrations',
  'widgets',
  'cms_connections',
  'cms_webhook_events',
  'tenant_billing',
  'search_analytics',
  'usage_metrics',
  'embedding_analytics',
  'audit_logs',
  'search_queries_log',
  'sync_errors',
  'team_invitations',
]

// Get current tenant context from localStorage
const getCurrentTenantId = (): string | null => {
  const viewAllMode = localStorage.getItem('supabase-admin:view-all-mode') === 'true'
  if (viewAllMode) {
    return null // Don't filter in view all mode
  }
  return localStorage.getItem('supabase-admin:selected-tenant')
}

// Wrap the base data provider with tenant filtering and Typesense routing
export const dataProvider: DataProvider = {
  ...baseDataProvider,

  getList: async (resource, params) => {
    // Route Typesense resources to Typesense data provider
    if (TYPESENSE_RESOURCES.includes(resource)) {
      return typesenseDataProvider.getList(resource, params)
    }

    const tenantId = getCurrentTenantId()

    // Apply tenant filter if resource supports it and we have a tenant selected
    if (tenantId && TENANT_FILTERED_RESOURCES.includes(resource)) {
      const filter = params.filter || {}
      return baseDataProvider.getList(resource, {
        ...params,
        filter: {
          ...filter,
          tenant_id: tenantId,
        },
      })
    }

    return baseDataProvider.getList(resource, params)
  },

  getOne: async (resource, params) => {
    // Route Typesense resources to Typesense data provider
    if (TYPESENSE_RESOURCES.includes(resource)) {
      return typesenseDataProvider.getOne(resource, params)
    }

    // For getOne, we rely on RLS policies to prevent unauthorized access
    // The tenant_id filter is enforced at the database level
    return baseDataProvider.getOne(resource, params)
  },

  getMany: async (resource, params) => {
    // Route Typesense resources to Typesense data provider
    if (TYPESENSE_RESOURCES.includes(resource)) {
      return typesenseDataProvider.getMany(resource, params)
    }

    // For getMany, we rely on RLS policies
    return baseDataProvider.getMany(resource, params)
  },

  getManyReference: async (resource, params) => {
    // Route Typesense resources to Typesense data provider
    if (TYPESENSE_RESOURCES.includes(resource)) {
      return typesenseDataProvider.getManyReference(resource, params)
    }

    const tenantId = getCurrentTenantId()

    // Apply tenant filter if resource supports it and we have a tenant selected
    if (tenantId && TENANT_FILTERED_RESOURCES.includes(resource)) {
      const filter = params.filter || {}
      return baseDataProvider.getManyReference(resource, {
        ...params,
        filter: {
          ...filter,
          tenant_id: tenantId,
        },
      })
    }

    return baseDataProvider.getManyReference(resource, params)
  },

  create: async (resource, params) => {
    // Route Typesense resources to Typesense data provider
    if (TYPESENSE_RESOURCES.includes(resource)) {
      return typesenseDataProvider.create(resource, params)
    }

    const tenantId = getCurrentTenantId()

    // Automatically inject tenant_id for resources that require it
    if (tenantId && TENANT_FILTERED_RESOURCES.includes(resource)) {
      return baseDataProvider.create(resource, {
        ...params,
        data: {
          ...params.data,
          tenant_id: tenantId,
        },
      })
    }

    return baseDataProvider.create(resource, params)
  },

  update: async (resource, params) => {
    // Route Typesense resources to Typesense data provider
    if (TYPESENSE_RESOURCES.includes(resource)) {
      return typesenseDataProvider.update(resource, params)
    }

    // For update, we rely on RLS policies to prevent unauthorized updates
    // Don't modify tenant_id on updates to prevent accidental tenant switching
    return baseDataProvider.update(resource, params)
  },

  updateMany: async (resource, params) => {
    // Route Typesense resources to Typesense data provider
    if (TYPESENSE_RESOURCES.includes(resource)) {
      return typesenseDataProvider.updateMany(resource, params)
    }

    // For updateMany, we rely on RLS policies
    return baseDataProvider.updateMany(resource, params)
  },

  delete: async (resource, params) => {
    // Route Typesense resources to Typesense data provider
    if (TYPESENSE_RESOURCES.includes(resource)) {
      return typesenseDataProvider.delete(resource, params)
    }

    // For delete, we rely on RLS policies
    return baseDataProvider.delete(resource, params)
  },

  deleteMany: async (resource, params) => {
    // Route Typesense resources to Typesense data provider
    if (TYPESENSE_RESOURCES.includes(resource)) {
      return typesenseDataProvider.deleteMany(resource, params)
    }

    // For deleteMany, we rely on RLS policies
    return baseDataProvider.deleteMany(resource, params)
  },
}

// Role hierarchy - from highest to lowest privileges
export type UserRole = 'owner' | 'admin' | 'member' | 'readonly'

// Resource names matching React Admin resources
export type Resource =
  | 'tenants'
  | 'documents'
  | 'search_logs'
  | 'tenant_api_keys'
  | 'user_tenants'
  | 'profiles'
  | 'tenant_usage'
  | 'daily_usage_stats'
  | 'search_analytics'
  | 'billing_plans'
  | 'tenant_billing'
  | 'cms_integrations'
  | 'cms_connections'
  | 'widgets'

// CRUD operations
export type Action = 'list' | 'show' | 'create' | 'edit' | 'delete' | 'export'

// Field-level permissions for specific resources
export type FieldPermission = {
  field: string
  readable: boolean
  writable: boolean
}

// Permission definition for a specific role
export interface RolePermissions {
  role: UserRole
  resources: {
    [key in Resource]?: {
      actions: Action[]
      fields?: FieldPermission[]
    }
  }
}

// Complete permissions object returned by getPermissions
export interface UserPermissions {
  role: UserRole
  tenantId: string
  userId: string
  canAccess: (resource: Resource, action: Action) => boolean
  canAccessField: (resource: Resource, field: string, mode: 'read' | 'write') => boolean
  isOwner: () => boolean
  isAdmin: () => boolean
  isMember: () => boolean
  isReadonly: () => boolean
}

// Role hierarchy for comparison
const roleHierarchy: Record<UserRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  readonly: 1,
}

// Helper to check if a role has equal or higher privileges than required role
export const hasRoleOrHigher = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

// Define permissions for each role
export const rolePermissionsConfig: Record<UserRole, RolePermissions> = {
  owner: {
    role: 'owner',
    resources: {
      tenants: {
        actions: ['list', 'show', 'create', 'edit', 'delete', 'export'],
      },
      documents: {
        actions: ['list', 'show', 'create', 'edit', 'delete', 'export'],
      },
      search_logs: {
        actions: ['list', 'show', 'export'],
      },
      tenant_api_keys: {
        actions: ['list', 'show', 'create', 'edit', 'delete'],
      },
      user_tenants: {
        actions: ['list', 'show', 'create', 'edit', 'delete'],
      },
      profiles: {
        actions: ['list', 'show', 'edit'],
      },
      tenant_usage: {
        actions: ['list', 'show'],
      },
      daily_usage_stats: {
        actions: ['list', 'show', 'export'],
      },
      search_analytics: {
        actions: ['list', 'show', 'export'],
      },
      billing_plans: {
        actions: ['list', 'show'],
      },
      tenant_billing: {
        actions: ['list', 'show', 'edit'],
      },
      cms_integrations: {
        actions: ['list', 'show', 'create', 'edit', 'delete'],
      },
      cms_connections: {
        actions: ['list', 'show', 'create', 'edit', 'delete'],
      },
      widgets: {
        actions: ['list', 'show', 'create', 'edit', 'delete'],
      },
    },
  },
  admin: {
    role: 'admin',
    resources: {
      tenants: {
        actions: ['list', 'show', 'edit'],
      },
      documents: {
        actions: ['list', 'show', 'create', 'edit', 'delete', 'export'],
      },
      search_logs: {
        actions: ['list', 'show', 'export'],
      },
      tenant_api_keys: {
        actions: ['list', 'show', 'create', 'edit'],
      },
      user_tenants: {
        actions: ['list', 'show', 'create', 'edit'],
      },
      profiles: {
        actions: ['list', 'show', 'edit'],
      },
      tenant_usage: {
        actions: ['list', 'show'],
      },
      daily_usage_stats: {
        actions: ['list', 'show', 'export'],
      },
      search_analytics: {
        actions: ['list', 'show', 'export'],
      },
      billing_plans: {
        actions: ['list', 'show'],
      },
      tenant_billing: {
        actions: ['list', 'show'],
      },
      cms_integrations: {
        actions: ['list', 'show', 'create', 'edit', 'delete'],
      },
      cms_connections: {
        actions: ['list', 'show', 'create', 'edit', 'delete'],
      },
      widgets: {
        actions: ['list', 'show', 'create', 'edit', 'delete'],
      },
    },
  },
  member: {
    role: 'member',
    resources: {
      tenants: {
        actions: ['list', 'show'],
      },
      documents: {
        actions: ['list', 'show', 'create', 'edit'],
      },
      search_logs: {
        actions: ['list', 'show'],
      },
      tenant_api_keys: {
        actions: ['list', 'show'],
      },
      user_tenants: {
        actions: ['list', 'show'],
      },
      profiles: {
        actions: ['list', 'show', 'edit'],
      },
      tenant_usage: {
        actions: ['list', 'show'],
      },
      daily_usage_stats: {
        actions: ['list', 'show'],
      },
      search_analytics: {
        actions: ['list', 'show'],
      },
      billing_plans: {
        actions: ['list', 'show'],
      },
      tenant_billing: {
        actions: ['list', 'show'],
      },
      cms_integrations: {
        actions: ['list', 'show'],
      },
      cms_connections: {
        actions: ['list', 'show'],
      },
      widgets: {
        actions: ['list', 'show', 'create'],
      },
    },
  },
  readonly: {
    role: 'readonly',
    resources: {
      tenants: {
        actions: ['list', 'show'],
      },
      documents: {
        actions: ['list', 'show'],
      },
      search_logs: {
        actions: ['list', 'show'],
      },
      tenant_api_keys: {
        actions: ['list', 'show'],
      },
      user_tenants: {
        actions: ['list', 'show'],
      },
      profiles: {
        actions: ['show'],
      },
      tenant_usage: {
        actions: ['list', 'show'],
      },
      daily_usage_stats: {
        actions: ['list', 'show'],
      },
      search_analytics: {
        actions: ['list', 'show'],
      },
      billing_plans: {
        actions: ['list', 'show'],
      },
      tenant_billing: {
        actions: ['list', 'show'],
      },
      cms_integrations: {
        actions: ['list', 'show'],
      },
      cms_connections: {
        actions: ['list', 'show'],
      },
      widgets: {
        actions: ['list', 'show'],
      },
    },
  },
}

// Helper function to create UserPermissions object
export const createUserPermissions = (
  role: UserRole,
  tenantId: string,
  userId: string
): UserPermissions => {
  const roleConfig = rolePermissionsConfig[role]

  return {
    role,
    tenantId,
    userId,
    canAccess: (resource: Resource, action: Action): boolean => {
      const resourcePermissions = roleConfig.resources[resource]
      if (!resourcePermissions) return false
      return resourcePermissions.actions.includes(action)
    },
    canAccessField: (resource: Resource, field: string, mode: 'read' | 'write'): boolean => {
      const resourcePermissions = roleConfig.resources[resource]
      if (!resourcePermissions) return false
      if (!resourcePermissions.fields) return true // No field restrictions means all fields accessible

      const fieldPermission = resourcePermissions.fields.find((f) => f.field === field)
      if (!fieldPermission) return true // Field not in restrictions means it's accessible

      return mode === 'read' ? fieldPermission.readable : fieldPermission.writable
    },
    isOwner: (): boolean => role === 'owner',
    isAdmin: (): boolean => hasRoleOrHigher(role, 'admin'),
    isMember: (): boolean => hasRoleOrHigher(role, 'member'),
    isReadonly: (): boolean => role === 'readonly',
  }
}

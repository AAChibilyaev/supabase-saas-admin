import { usePermissions } from 'react-admin'
import type { UserPermissions, Resource, Action } from '../types/permissions'

/**
 * Custom hook for RBAC permissions
 * Provides easy access to permission checking functions
 */
export const useRBAC = () => {
  const { permissions, isLoading } = usePermissions<UserPermissions>()

  return {
    permissions,
    isLoading,
    canAccess: (resource: Resource, action: Action) => {
      if (!permissions) return false
      return permissions.canAccess(resource, action)
    },
    canAccessField: (resource: Resource, field: string, mode: 'read' | 'write') => {
      if (!permissions) return false
      return permissions.canAccessField(resource, field, mode)
    },
    isOwner: () => {
      if (!permissions) return false
      return permissions.isOwner()
    },
    isAdmin: () => {
      if (!permissions) return false
      return permissions.isAdmin()
    },
    isMember: () => {
      if (!permissions) return false
      return permissions.isMember()
    },
    isReadonly: () => {
      if (!permissions) return false
      return permissions.isReadonly()
    },
    role: permissions?.role,
    tenantId: permissions?.tenantId,
  }
}

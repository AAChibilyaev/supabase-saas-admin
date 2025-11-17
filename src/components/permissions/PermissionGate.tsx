import type { ReactNode } from 'react'
import { usePermissions } from 'react-admin'
import type { UserPermissions, Resource, Action } from '../../types/permissions'

interface PermissionGateProps {
  children: ReactNode
  resource: Resource
  action: Action
  fallback?: ReactNode
}

/**
 * PermissionGate component that conditionally renders children based on user permissions
 *
 * Usage:
 * <PermissionGate resource="tenants" action="create">
 *   <CreateButton />
 * </PermissionGate>
 */
export const PermissionGate = ({
  children,
  resource,
  action,
  fallback = null
}: PermissionGateProps) => {
  const { permissions, isLoading } = usePermissions<UserPermissions>()

  if (isLoading) {
    return null
  }

  if (!permissions) {
    return <>{fallback}</>
  }

  const hasPermission = permissions.canAccess(resource, action)

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface RoleGateProps {
  children: ReactNode
  minRole: 'owner' | 'admin' | 'member' | 'readonly'
  fallback?: ReactNode
}

/**
 * RoleGate component that conditionally renders children based on minimum role requirement
 *
 * Usage:
 * <RoleGate minRole="admin">
 *   <AdminOnlyFeature />
 * </RoleGate>
 */
export const RoleGate = ({
  children,
  minRole,
  fallback = null
}: RoleGateProps) => {
  const { permissions, isLoading } = usePermissions<UserPermissions>()

  if (isLoading) {
    return null
  }

  if (!permissions) {
    return <>{fallback}</>
  }

  const roleHierarchy = {
    owner: 4,
    admin: 3,
    member: 2,
    readonly: 1,
  }

  const hasRequiredRole = roleHierarchy[permissions.role] >= roleHierarchy[minRole]

  if (!hasRequiredRole) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface FieldPermissionGateProps {
  children: ReactNode
  resource: Resource
  field: string
  mode: 'read' | 'write'
  fallback?: ReactNode
}

/**
 * FieldPermissionGate component for field-level permissions
 *
 * Usage:
 * <FieldPermissionGate resource="tenants" field="billing_plan" mode="write">
 *   <BillingPlanInput />
 * </FieldPermissionGate>
 */
export const FieldPermissionGate = ({
  children,
  resource,
  field,
  mode,
  fallback = null
}: FieldPermissionGateProps) => {
  const { permissions, isLoading } = usePermissions<UserPermissions>()

  if (isLoading) {
    return null
  }

  if (!permissions) {
    return <>{fallback}</>
  }

  const hasPermission = permissions.canAccessField(resource, field, mode)

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

# Role-Based Access Control (RBAC) Implementation

This document describes the comprehensive RBAC system implemented for the Supabase Admin panel.

## Overview

The RBAC system provides granular access control with four distinct roles, resource-level permissions, and field-level permissions.

## Role Hierarchy

From highest to lowest privilege:

1. **Owner** - Full access to all resources and operations
2. **Admin** - Can manage most resources, limited billing/plan changes
3. **Member** - Can view and edit documents, limited admin features
4. **Readonly** - View-only access to resources

## Architecture

### Core Files

- `src/types/permissions.ts` - TypeScript type definitions and permission configuration
- `src/providers/authProvider.ts` - Authentication with permission retrieval
- `src/components/permissions/PermissionGate.tsx` - React components for conditional rendering
- `src/hooks/useRBAC.ts` - Custom hook for easy permission checking

### Permission Types

```typescript
export type UserRole = 'owner' | 'admin' | 'member' | 'readonly'
export type Action = 'list' | 'show' | 'create' | 'edit' | 'delete' | 'export'
```

## Role Permissions Matrix

| Resource | Owner | Admin | Member | Readonly |
|----------|-------|-------|--------|----------|
| Tenants | Full | View/Edit | View | View |
| Documents | Full | Full | View/Create/Edit | View |
| Search Logs | View/Export | View/Export | View | View |
| API Keys | Full | View/Create/Edit | View | View |
| User Tenants | Full | View/Create/Edit | View | View |
| Billing | View/Edit | View | View | View |
| CMS Integrations | Full | Full | View | View |
| Widgets | Full | Full | View/Create | View |

## Usage Examples

### 1. Using PermissionGate Component

```tsx
import { PermissionGate } from '../../components/permissions'

// Hide create button for users without permission
<PermissionGate resource="tenants" action="create">
  <CreateButton />
</PermissionGate>
```

### 2. Using RoleGate Component

```tsx
import { RoleGate } from '../../components/permissions'

// Show admin-only features
<RoleGate minRole="admin">
  <AdminSettingsPanel />
</RoleGate>
```

### 3. Using useRBAC Hook

```tsx
import { useRBAC } from '../hooks/useRBAC'

const MyComponent = () => {
  const { canAccess, isOwner, role } = useRBAC()

  if (!canAccess('tenants', 'edit')) {
    return <div>No access</div>
  }

  return (
    <div>
      <h1>Current role: {role}</h1>
      {isOwner() && <OwnerControls />}
    </div>
  )
}
```

### 4. Using usePermissions Hook (React Admin)

```tsx
import { usePermissions } from 'react-admin'
import { UserPermissions } from '../types/permissions'

const MyComponent = () => {
  const { permissions } = usePermissions<UserPermissions>()

  return (
    <div>
      {permissions?.canAccess('documents', 'delete') && <DeleteButton />}
    </div>
  )
}
```

### 5. Conditional Rendering in Lists

```tsx
export const TenantList = () => {
  const { permissions } = usePermissions<UserPermissions>()

  return (
    <List>
      <Datagrid>
        <TextField source="name" />
        {permissions?.canAccess('tenants', 'edit') && <EditButton />}
        {permissions?.canAccess('tenants', 'delete') && <DeleteButton />}
      </Datagrid>
    </List>
  )
}
```

### 6. Field-Level Permissions

```tsx
import { RoleGate } from '../../components/permissions'

<SimpleForm>
  <TextInput source="name" />

  {/* Only admins can change billing plans */}
  <RoleGate minRole="admin">
    <SelectInput source="plan_type" choices={planChoices} />
  </RoleGate>
</SimpleForm>
```

## Database Integration

The RBAC system integrates with the `user_tenants` table:

```sql
CREATE TABLE user_tenants (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  tenant_id UUID REFERENCES tenants(id),
  role TEXT CHECK (role IN ('owner', 'admin', 'member', 'readonly')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Permission Flow

1. User logs in via Supabase Auth
2. `authProvider.getPermissions()` queries `user_tenants` table
3. Returns `UserPermissions` object with role and helper methods
4. Components use permissions to conditionally render UI
5. React Admin enforces permissions at UI level
6. Supabase RLS policies enforce at database level (defense in depth)

## Security Best Practices

### Frontend Permissions (UI Layer)
- Use PermissionGate/RoleGate for conditional rendering
- Check permissions before showing buttons/forms
- Provides better UX by hiding unavailable actions

### Backend Permissions (Database Layer)
- RLS policies on all tables (already implemented)
- Validates tenant_id matches user's tenant
- Checks user role before allowing operations
- This is the REAL security - frontend is just UX

### Defense in Depth
```
User Action → Frontend Permission Check → UI Renders
           → API Call → RLS Policy Check → Database Operation
```

Both layers should be protected!

## Testing Permissions

### Manual Testing Scenarios

1. **Owner Role**
   - Create a test user
   - Add to `user_tenants` with role='owner'
   - Verify can create/edit/delete all resources

2. **Admin Role**
   - Create a test user
   - Add to `user_tenants` with role='admin'
   - Verify can't delete tenants
   - Verify can't change billing plans

3. **Member Role**
   - Create a test user
   - Add to `user_tenants` with role='member'
   - Verify can create/edit documents
   - Verify can't create tenants

4. **Readonly Role**
   - Create a test user
   - Add to `user_tenants` with role='readonly'
   - Verify can only view resources
   - Verify no create/edit/delete buttons visible

### SQL Test Queries

```sql
-- Create test users with different roles
INSERT INTO user_tenants (user_id, tenant_id, role)
VALUES
  ('user1-uuid', 'tenant1-uuid', 'owner'),
  ('user2-uuid', 'tenant1-uuid', 'admin'),
  ('user3-uuid', 'tenant1-uuid', 'member'),
  ('user4-uuid', 'tenant1-uuid', 'readonly');
```

## Extending Permissions

### Adding a New Resource

1. Add resource to `Resource` type in `permissions.ts`
2. Add permissions to each role in `rolePermissionsConfig`
3. Update permission matrix in this document

### Adding a New Action

1. Add action to `Action` type in `permissions.ts`
2. Update role configurations to include new action
3. Implement UI checks using PermissionGate

### Adding Field-Level Permissions

```typescript
resources: {
  tenants: {
    actions: ['list', 'show', 'edit'],
    fields: [
      { field: 'plan_type', readable: true, writable: false },
      { field: 'billing_cycle_end', readable: true, writable: false }
    ]
  }
}
```

## Common Patterns

### Pattern 1: List Actions with Permissions

```tsx
const ListActions = () => (
  <TopToolbar>
    <FilterButton />
    <PermissionGate resource="resource_name" action="create">
      <CreateButton />
    </PermissionGate>
    <PermissionGate resource="resource_name" action="export">
      <ExportButton />
    </PermissionGate>
  </TopToolbar>
)
```

### Pattern 2: Conditional Form Fields

```tsx
<TabbedForm>
  <FormTab label="General">
    <TextInput source="name" />
    <RoleGate minRole="admin">
      <SelectInput source="sensitive_field" />
    </RoleGate>
  </FormTab>
</TabbedForm>
```

### Pattern 3: Role-Based Dashboard

```tsx
export const Dashboard = () => {
  const { role, isAdmin } = useRBAC()

  return (
    <div>
      <h1>Welcome, {role}!</h1>
      <RoleGate minRole="admin">
        <AdminStats />
      </RoleGate>
      <RoleGate minRole="member">
        <UserStats />
      </RoleGate>
    </div>
  )
}
```

## Troubleshooting

### Permissions Not Loading
- Check `authProvider.getPermissions()` implementation
- Verify `user_tenants` table has correct role
- Check browser console for errors

### Buttons Still Showing
- Ensure component is using PermissionGate
- Check permission configuration in `permissions.ts`
- Verify role spelling (lowercase)

### RLS Blocking Operations
- Check Supabase RLS policies
- Verify user_id and tenant_id match
- Check auth token is valid

## Future Enhancements

1. **Multi-tenant Support** - User can switch between tenants
2. **Custom Permissions** - Per-user permission overrides
3. **Audit Logging** - Track permission changes
4. **Permission Groups** - Group permissions into sets
5. **Time-based Permissions** - Temporary elevated access

## Related Documentation

- [React Admin Permissions](https://marmelab.com/react-admin/Authorization.html)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [TypeScript Types](./TYPES.md)

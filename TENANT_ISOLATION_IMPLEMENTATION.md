# Multi-Tenant Isolation and Context Switching Implementation

## Overview

This document describes the implementation of multi-tenant isolation and context switching for the Supabase Admin Panel. The implementation provides secure tenant isolation, easy context switching, and super admin capabilities.

## Files Created/Modified

### New Files

1. **src/contexts/TenantContext.tsx**
   - React Context API provider for global tenant state
   - Manages tenant selection, view all mode, and available tenants
   - Automatic super admin detection
   - LocalStorage persistence

2. **src/components/TenantSwitcher.tsx**
   - Dropdown component using shadcn/ui Select
   - Displays current tenant information
   - Shows "All Tenants" option for super admins
   - Visual indicators for different modes

3. **src/__tests__/tenant-isolation.test.tsx**
   - Comprehensive test suite for tenant isolation
   - Tests for context switching, persistence, and filtering
   - Super admin role detection tests

### Modified Files

1. **src/providers/dataProvider.ts**
   - Enhanced with automatic tenant_id filter injection
   - Applies filters to 18 tenant-scoped resources
   - Respects "View All" mode for super admins
   - Automatic tenant_id injection on create operations

2. **src/components/layout/CustomLayout.tsx**
   - Integrated TenantSwitcher into AppBar
   - Custom AppBar component

3. **src/App.tsx**
   - Wrapped Admin with TenantProvider
   - Added CustomLayout to Admin component

## Architecture

### Context Structure

```typescript
interface TenantContextType {
  selectedTenantId: string | null
  setSelectedTenantId: (id: string | null) => void
  viewAllMode: boolean
  setViewAllMode: (enabled: boolean) => void
  availableTenants: Tenant[]
  isLoading: boolean
  isSuperAdmin: boolean
}
```

### Tenant Interface

```typescript
interface Tenant {
  id: string
  name: string
  slug: string
  plan_type: string
}
```

## Key Features

### 1. Multi-Tenant Isolation

- **Automatic Filtering**: All tenant-scoped resources are automatically filtered by the selected tenant
- **Resource Coverage**: 18 resources filtered including documents, search logs, API keys, CMS integrations, and more
- **Database RLS**: RLS policies provide security enforcement at the database level
- **Client-Side Filtering**: Additional convenience layer for better UX

### 2. Context Switching

- **Easy Switching**: Dropdown selector in the app bar for quick tenant switching
- **Persistent State**: Selected tenant persists across page reloads via localStorage
- **Instant Updates**: All resource lists update immediately when tenant changes
- **Visual Feedback**: Clear indication of current tenant in the UI

### 3. Super Admin Mode

- **Role Detection**: Automatically detects users with 'owner' role
- **View All Mode**: Super admins can enable "View All Tenants" mode
- **No Filtering**: View All mode removes tenant filtering to see all data
- **Platform Administration**: Useful for managing the entire platform

### 4. Security

- **Defense in Depth**: Multiple layers of security
  - Client-side filtering for UX
  - Database RLS policies for security enforcement
  - Automatic tenant_id injection on creates
  - RLS protection on updates and deletes
- **No Cross-Tenant Leakage**: Users can only access tenants they're authorized for
- **Tamper Resistant**: RLS policies prevent bypassing client-side filters

## Technical Implementation

### LocalStorage Keys

- `supabase-admin:selected-tenant` - Stores selected tenant ID
- `supabase-admin:view-all-mode` - Stores view all mode state

### Tenant-Filtered Resources

The following resources are automatically filtered by tenant_id:

1. documents
2. search_logs
3. tenant_api_keys
4. daily_usage_stats
5. cms_integrations
6. widgets
7. cms_connections
8. cms_webhook_events
9. tenant_billing
10. search_analytics
11. usage_metrics
12. embedding_analytics
13. audit_logs
14. search_queries_log
15. sync_errors
16. team_invitations

### Data Provider Methods

The following DataProvider methods inject tenant_id filters:

- **getList**: Adds tenant_id to filter params
- **getManyReference**: Adds tenant_id to filter params
- **create**: Injects tenant_id into data
- **getOne, getMany, update, updateMany, delete, deleteMany**: Rely on RLS policies

### Super Admin Detection

A user is considered a super admin if they have at least one user_tenant relationship with role='owner'.

### Tenant Loading

On initialization, the TenantContext:
1. Gets the current authenticated user
2. Queries user_tenants table for accessible tenants
3. Checks for super admin role
4. Restores saved tenant selection from localStorage
5. Falls back to first available tenant if no saved selection

## User Experience

### For Regular Users

1. User logs in and sees available tenants automatically
2. Default selection is the first available tenant
3. User can switch between their authorized tenants via dropdown
4. All resources automatically filter to show only selected tenant's data
5. Selection persists across sessions

### For Super Admins

1. Same experience as regular users, plus:
2. "All Tenants" option available in dropdown
3. Can enable View All mode to see all data across all tenants
4. Globe icon indicates View All mode is active
5. Can switch back to single tenant at any time

### Visual Indicators

- **Selected Tenant**: Shows tenant name, slug, and plan type
- **View All Mode**: Globe icon next to "All Tenants" text
- **Loading State**: "Loading tenants..." message
- **No Tenants**: "No tenants" message (rare edge case)

## Testing

### Test Coverage

The test suite covers:

1. **Tenant Loading**
   - Loads user's accessible tenants
   - Sets default tenant correctly
   - Detects super admin role

2. **Context Switching**
   - Switches between tenants
   - Updates localStorage
   - Maintains state consistency

3. **View All Mode**
   - Enables/disables for super admins
   - Clears tenant selection when enabled
   - Updates localStorage

4. **Persistence**
   - Restores tenant selection on mount
   - Restores view all mode on mount
   - Validates saved tenant exists

5. **Data Provider**
   - Injects tenant_id filters correctly
   - Respects view all mode
   - Handles no tenant selected

### Running Tests

```bash
npm test src/__tests__/tenant-isolation.test.tsx
```

## Security Considerations

### Multiple Layers of Defense

1. **Client-Side Filtering** (Convenience Layer)
   - Improves UX by filtering at the application level
   - Reduces unnecessary data transfer
   - Provides immediate feedback on tenant switching

2. **Database RLS Policies** (Security Layer)
   - Primary security enforcement
   - Cannot be bypassed by client
   - Protects against API manipulation
   - Works even if client-side filtering fails

3. **Automatic Injection**
   - tenant_id automatically added to create operations
   - Prevents accidental creation in wrong tenant
   - Reduces developer error

### Threat Model

**Mitigated Threats:**
- Cross-tenant data access
- Unauthorized resource viewing
- Accidental tenant mixing
- Client-side filter bypassing (via RLS)

**Trust Assumptions:**
- Database RLS policies are correctly implemented
- User authentication is secure
- user_tenants relationships are accurate

## Future Enhancements

Potential improvements for future iterations:

1. **Tenant Switching Notifications**
   - Toast notifications when tenant changes
   - Confirmation dialog for important switches

2. **Recent Tenants**
   - Remember recently accessed tenants
   - Quick access to frequently used tenants

3. **Tenant Search**
   - Search/filter in dropdown for users with many tenants
   - Fuzzy search by name or slug

4. **Tenant Bookmarks**
   - Pin favorite tenants to top of list
   - Custom ordering

5. **Tenant Metadata**
   - Show additional tenant info in dropdown
   - Display warnings for suspended/inactive tenants

6. **Audit Trail**
   - Log tenant switches to audit_logs
   - Track admin activities across tenants

## Migration Notes

### For Existing Deployments

1. **Database**: No database changes required (uses existing schema)
2. **RLS Policies**: Ensure RLS policies are in place for all tenant-scoped tables
3. **User Roles**: Verify user_tenants relationships are correct
4. **Testing**: Test with real user data before deploying to production

### Rollback Plan

If issues arise:
1. Remove TenantProvider wrapper from App.tsx
2. Revert dataProvider.ts to use base provider
3. Revert CustomLayout.tsx to basic Layout
4. System will work without tenant filtering (all data visible)

## Conclusion

The multi-tenant isolation and context switching implementation provides:

- Secure tenant isolation with defense in depth
- Easy context switching for users with multiple tenants
- Super admin capabilities for platform management
- Comprehensive test coverage
- LocalStorage persistence for better UX
- Clean, maintainable code architecture

The implementation respects existing RLS policies and adds an additional convenience layer that improves the user experience while maintaining security.

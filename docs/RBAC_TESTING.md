# RBAC Testing Guide

This guide provides comprehensive testing instructions for the Role-Based Access Control implementation.

## Setup Test Users

### 1. Create Test Users in Supabase

```sql
-- First, ensure you have users in auth.users (create via Supabase Dashboard or API)
-- Then add them to user_tenants with different roles

-- Get a tenant ID
SELECT id, name FROM tenants LIMIT 1;

-- Add test users with different roles
INSERT INTO user_tenants (user_id, tenant_id, role)
VALUES
  -- Replace these UUIDs with actual user IDs from auth.users
  ('00000000-0000-0000-0000-000000000001', 'YOUR_TENANT_ID', 'owner'),
  ('00000000-0000-0000-0000-000000000002', 'YOUR_TENANT_ID', 'admin'),
  ('00000000-0000-0000-0000-000000000003', 'YOUR_TENANT_ID', 'member'),
  ('00000000-0000-0000-0000-000000000004', 'YOUR_TENANT_ID', 'readonly');
```

## Test Scenarios

### Test 1: Owner Role
**Expected Behavior:** Full access to all features

1. Login as owner user
2. Navigate to Dashboard - should see role badge "OWNER"
3. Navigate to Tenants
   - ✅ See Create button
   - ✅ See Edit button on each row
   - ✅ Can delete tenants
4. Navigate to Documents
   - ✅ See Create button
   - ✅ Can edit documents
   - ✅ Can delete documents
5. Navigate to API Keys
   - ✅ See Create button
   - ✅ Can edit API keys
6. Navigate to Tenant Edit page
   - ✅ Can change plan type
   - ✅ Can edit billing dates

**SQL to Verify:**
```sql
SELECT ut.role, u.email
FROM user_tenants ut
JOIN auth.users u ON ut.user_id = u.id
WHERE ut.role = 'owner';
```

### Test 2: Admin Role
**Expected Behavior:** Can manage most resources, limited billing access

1. Login as admin user
2. Navigate to Dashboard - should see role badge "ADMIN"
3. Navigate to Tenants
   - ✅ No Create button (or disabled)
   - ✅ See Edit button
   - ❌ Cannot delete tenants
4. Navigate to Documents
   - ✅ See Create button
   - ✅ Can edit documents
   - ✅ Can delete documents
5. Navigate to API Keys
   - ✅ See Create button
   - ✅ Can edit API keys
6. Navigate to Tenant Edit page
   - ❌ Cannot see plan type selector
   - ❌ Cannot edit billing dates

**SQL to Verify:**
```sql
SELECT ut.role, u.email
FROM user_tenants ut
JOIN auth.users u ON ut.user_id = u.id
WHERE ut.role = 'admin';
```

### Test 3: Member Role
**Expected Behavior:** Can view and edit documents, limited admin features

1. Login as member user
2. Navigate to Dashboard - should see role badge "MEMBER"
3. Navigate to Tenants
   - ❌ No Create button
   - ❌ No Edit button
   - ✅ Can view tenants
4. Navigate to Documents
   - ✅ See Create button
   - ✅ Can edit documents
   - ❌ Cannot delete documents
5. Navigate to API Keys
   - ❌ No Create button
   - ✅ Can view API keys
6. Navigate to Search Logs
   - ✅ Can view logs
   - ❌ No Export button

**SQL to Verify:**
```sql
SELECT ut.role, u.email
FROM user_tenants ut
JOIN auth.users u ON ut.user_id = u.id
WHERE ut.role = 'member';
```

### Test 4: Readonly Role
**Expected Behavior:** View-only access to all resources

1. Login as readonly user
2. Navigate to Dashboard - should see role badge "READONLY"
3. Navigate to Tenants
   - ❌ No Create button
   - ❌ No Edit button
   - ❌ No Delete button
   - ✅ Can view tenant list
4. Navigate to Documents
   - ❌ No Create button
   - ❌ No Edit button
   - ❌ No Delete button
   - ✅ Can view document list
5. Navigate to API Keys
   - ❌ No Create button
   - ❌ No Edit button
   - ✅ Can view API keys list
6. Navigate to Search Logs
   - ✅ Can view logs
   - ❌ No Export button

**SQL to Verify:**
```sql
SELECT ut.role, u.email
FROM user_tenants ut
JOIN auth.users u ON ut.user_id = u.id
WHERE ut.role = 'readonly';
```

## Automated Testing Checklist

### Component Tests

```typescript
// Test PermissionGate component
describe('PermissionGate', () => {
  it('should render children when permission is granted', () => {
    // Mock permissions with access
    // Render component
    // Assert children are visible
  })

  it('should not render children when permission is denied', () => {
    // Mock permissions without access
    // Render component
    // Assert children are not visible
  })

  it('should render fallback when permission is denied', () => {
    // Mock permissions without access
    // Render component with fallback
    // Assert fallback is visible
  })
})

// Test RoleGate component
describe('RoleGate', () => {
  it('should render for users with sufficient role', () => {
    // Mock admin user
    // Render with minRole="member"
    // Assert children are visible
  })

  it('should not render for users with insufficient role', () => {
    // Mock member user
    // Render with minRole="admin"
    // Assert children are not visible
  })
})
```

### Integration Tests

```typescript
// Test TenantList with permissions
describe('TenantList', () => {
  it('should show create button for owners', () => {
    // Mock owner permissions
    // Render TenantList
    // Assert CreateButton is visible
  })

  it('should not show create button for members', () => {
    // Mock member permissions
    // Render TenantList
    // Assert CreateButton is not visible
  })
})
```

## Database RLS Policy Tests

Verify that RLS policies prevent unauthorized access:

### Test 1: Tenant Isolation
```sql
-- Login as user from tenant A
-- Try to access tenant B's data
SELECT * FROM documents WHERE tenant_id = 'TENANT_B_ID';
-- Should return 0 rows
```

### Test 2: Role-Based Access
```sql
-- Login as readonly user
-- Try to insert a document
INSERT INTO documents (tenant_id, title, content)
VALUES ('YOUR_TENANT_ID', 'Test', 'Content');
-- Should fail with permission denied
```

### Test 3: Owner Privileges
```sql
-- Login as owner
-- Try to delete tenant
DELETE FROM tenants WHERE id = 'YOUR_TENANT_ID';
-- Should succeed (or fail gracefully with foreign key constraints)
```

## Browser Console Tests

Open browser console and test permissions:

```javascript
// Check current user permissions
const permissions = await authProvider.getPermissions()
console.log('Role:', permissions.role)
console.log('Can create tenants:', permissions.canAccess('tenants', 'create'))
console.log('Can delete documents:', permissions.canAccess('documents', 'delete'))
```

## API Tests

Test API endpoints with different roles:

```bash
# Get auth token for user
TOKEN="your-supabase-jwt-token"

# Test as owner - should succeed
curl -H "Authorization: Bearer $TOKEN" \
  -X POST https://your-project.supabase.co/rest/v1/tenants \
  -d '{"name": "Test Tenant", "slug": "test-tenant"}'

# Test as readonly - should fail
curl -H "Authorization: Bearer $TOKEN" \
  -X POST https://your-project.supabase.co/rest/v1/tenants \
  -d '{"name": "Test Tenant", "slug": "test-tenant"}'
```

## Performance Tests

Verify permission checks don't slow down the app:

```typescript
// Test permission check performance
console.time('permission-check')
for (let i = 0; i < 1000; i++) {
  permissions.canAccess('tenants', 'create')
}
console.timeEnd('permission-check')
// Should be < 1ms
```

## Edge Cases

### Test 1: User Without Tenant
1. Create user without entry in user_tenants
2. Login
3. Should default to readonly role
4. Verify no create/edit/delete buttons visible

### Test 2: Multiple Tenants
1. Add user to multiple tenants with different roles
2. Login
3. Should use first tenant's role
4. (Future: implement tenant switching)

### Test 3: Invalid Role
1. Manually set invalid role in database
2. Login
3. Should handle gracefully (default to readonly)

### Test 4: Permission Loading State
1. Slow down network
2. Login
3. Verify buttons don't flash before hiding
4. Should show loading state

## Common Issues and Solutions

### Issue 1: Buttons Still Visible
**Solution:** Check that component is wrapped in PermissionGate or uses usePermissions

### Issue 2: Permission Denied Errors
**Solution:** Verify RLS policies match frontend permissions

### Issue 3: Role Not Loading
**Solution:** Check user_tenants table has entry for user

### Issue 4: Wrong Permissions
**Solution:** Verify role spelling (must be lowercase)

## Regression Testing

After making changes, verify:

1. ✅ All existing tests pass
2. ✅ Owners can still access everything
3. ✅ Readonly users can't create/edit/delete
4. ✅ No console errors on any page
5. ✅ RLS policies still enforced
6. ✅ Performance hasn't degraded

## Sign-Off Checklist

Before deploying RBAC to production:

- [ ] All 4 role types tested manually
- [ ] RLS policies verified with SQL tests
- [ ] Component unit tests passing
- [ ] Integration tests passing
- [ ] Performance tests acceptable
- [ ] Edge cases handled
- [ ] Documentation complete
- [ ] Team training completed
- [ ] Rollback plan in place

## Monitoring

After deployment, monitor:

1. Error logs for permission denied errors
2. Audit logs for role changes
3. User feedback on missing features
4. Performance metrics for permission checks

## Security Audit

Periodically review:

1. Role assignments in user_tenants table
2. RLS policy effectiveness
3. Permission matrix accuracy
4. Audit logs for suspicious activity

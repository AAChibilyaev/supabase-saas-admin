# Database Migrations

This directory contains SQL migrations for the Supabase Admin application.

## Migration Files

### 20250117_fix_security_definer_views.sql

**Status:** CRITICAL Security Fix
**Issue:** #22
**Priority:** Immediate application required

#### Problem

Two views were defined with `SECURITY DEFINER` property, creating a critical security vulnerability:
- `public.embedding_statistics`
- `public.cms_connection_stats`

The `SECURITY DEFINER` option causes views to execute with the permissions of the view creator rather than the querying user, effectively bypassing Row Level Security (RLS) policies.

#### Solution

This migration:
1. Drops the existing views with `SECURITY DEFINER`
2. Recreates them without `SECURITY DEFINER`
3. Enables `security_invoker` mode to ensure RLS policies are enforced

#### Impact

After applying this migration:
- Views will respect Row Level Security policies
- Users will only see data they have permission to access
- Tenant isolation will be properly enforced through RLS

#### How to Apply

##### Local Development
```bash
# Using Supabase CLI
supabase db reset  # Reset local database
# OR apply migration directly
psql -h localhost -U postgres -d postgres -f migrations/20250117_fix_security_definer_views.sql
```

##### Production
```sql
-- In Supabase Dashboard SQL Editor:
-- Copy and paste the contents of migrations/20250117_fix_security_definer_views.sql
-- Execute the SQL
```

#### Verification

After applying the migration, verify the fix:

```sql
-- Check that views exist without SECURITY DEFINER
SELECT
  schemaname,
  viewname,
  viewowner
FROM pg_views
WHERE viewname IN ('embedding_statistics', 'cms_connection_stats')
  AND schemaname = 'public';

-- Verify security_invoker is enabled
SELECT
  c.relname as view_name,
  c.reloptions as options
FROM pg_class c
WHERE c.relname IN ('embedding_statistics', 'cms_connection_stats')
  AND c.relkind = 'v';
```

Expected result: Both views should exist with `security_invoker=on` in their options.

#### Prerequisites

Ensure the following tables exist with proper RLS policies:
- `embedding_analytics` - Must have RLS enabled with tenant isolation
- `cms_connections` - Must have RLS enabled with tenant isolation
- `cms_sync_logs` - Must have RLS enabled with tenant isolation

#### Security Checklist

After applying this migration:

- [ ] Run Supabase Security Advisor to confirm vulnerability is fixed
- [ ] Test view access with different user roles
- [ ] Verify tenant isolation is working correctly
- [ ] Confirm users can only see their own tenant data
- [ ] Check that no cross-tenant data leakage occurs

#### References

- [Supabase Database Linter - Security Definer Views](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)
- [PostgreSQL Security Invoker Views](https://www.postgresql.org/docs/current/sql-createview.html)
- [Row Level Security Documentation](https://supabase.com/docs/guides/auth/row-level-security)

## Migration Best Practices

1. **Always test migrations locally first** using Supabase CLI
2. **Backup production database** before applying critical migrations
3. **Apply during low-traffic periods** when possible
4. **Monitor application logs** after applying migrations
5. **Have rollback plan ready** (though not recommended for security fixes)
6. **Document all changes** with clear comments in SQL files
7. **Run security advisor** after applying security-related migrations

## Emergency Rollback

⚠️ **WARNING:** Rolling back security fixes reintroduces vulnerabilities!

Only rollback if absolutely necessary and consult with your DBA first. The rollback procedure is documented in the migration file but should only be used in emergency situations.

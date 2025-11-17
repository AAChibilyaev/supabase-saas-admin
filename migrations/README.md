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

### 20250117_database_performance_optimization.sql

**Status:** Performance Enhancement
**Issue:** #36
**Priority:** High - Apply during low-traffic period

#### Overview

Comprehensive database performance optimization including:
- 30+ strategically placed indexes
- 3 materialized views for complex aggregations
- Query result caching system
- Performance monitoring functions
- Connection pooling recommendations
- Autovacuum optimization

#### Features

1. **Indexes**: Covering all frequently queried columns
2. **Materialized Views**: Pre-computed aggregations for dashboards
3. **Query Monitoring**: Functions to identify slow queries and unused indexes
4. **Caching System**: Built-in query result caching with TTL
5. **Performance Metrics**: Real-time monitoring view

#### How to Apply

##### Local Development
```bash
# Using Supabase CLI
supabase db reset
# OR apply migration directly
psql -h localhost -U postgres -d postgres -f migrations/20250117_database_performance_optimization.sql
```

##### Production
```bash
# Using Supabase CLI
supabase db push
# OR copy to SQL Editor in Supabase Dashboard
```

#### Post-Migration Tasks

1. **Verify indexes were created**:
```sql
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

2. **Check materialized views**:
```sql
SELECT * FROM tenant_usage_dashboard LIMIT 5;
SELECT * FROM search_analytics_summary LIMIT 5;
SELECT * FROM embedding_performance_metrics LIMIT 5;
```

3. **Test monitoring functions**:
```sql
SELECT * FROM get_slow_queries(1000, 10);
SELECT * FROM get_cache_hit_ratio();
SELECT * FROM performance_metrics;
```

4. **Refresh materialized views**:
```sql
SELECT * FROM refresh_all_materialized_views();
```

#### Monitoring

After applying the migration, monitor:

1. **Query Performance**:
```sql
-- Check for slow queries
SELECT * FROM get_slow_queries(1000, 20);
```

2. **Cache Hit Ratios** (should be > 95%):
```sql
SELECT * FROM get_cache_hit_ratio();
```

3. **Index Usage**:
```sql
SELECT * FROM get_index_usage_stats()
WHERE idx_scan < 100;
```

4. **Table Statistics**:
```sql
SELECT * FROM get_table_stats();
```

#### Maintenance Schedule

Set up these recurring tasks:

**Every 15 minutes**: Refresh materialized views
```sql
SELECT * FROM refresh_all_materialized_views();
```

**Daily**: Run maintenance routine
```sql
SELECT * FROM run_daily_maintenance();
```

**Weekly**: Review performance metrics
```sql
SELECT * FROM performance_metrics;
SELECT * FROM get_slow_queries(500, 20);
```

#### Expected Performance Improvements

- Dashboard queries: 40-50x faster
- Search analytics: 30-50x faster
- Tenant queries: 10-30x faster
- Full-text search: 5-20x faster

#### Documentation

See [DATABASE_PERFORMANCE_OPTIMIZATION.md](../docs/DATABASE_PERFORMANCE_OPTIMIZATION.md) for detailed documentation.

## Emergency Rollback

⚠️ **WARNING:** Rolling back security fixes reintroduces vulnerabilities!

Only rollback if absolutely necessary and consult with your DBA first. The rollback procedure is documented in the migration file but should only be used in emergency situations.

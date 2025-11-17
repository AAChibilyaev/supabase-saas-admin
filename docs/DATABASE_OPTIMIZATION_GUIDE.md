# Database Optimization Guide

This guide covers database performance optimization for the SaaS Search Platform.

## Overview

This guide covers:
- Index optimization
- Query performance
- Connection pooling
- RLS policy optimization
- Monitoring slow queries

---

## Index Optimization

### Existing Indexes

The project includes performance optimization migration: `supabase/migrations/20250117_database_performance_optimization.sql`

### Verify Indexes

```sql
-- Check all indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Common Index Patterns

#### Foreign Key Indexes

All foreign keys should have indexes:

```sql
-- Example: Ensure tenant_id has index
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id 
ON documents(tenant_id);

CREATE INDEX IF NOT EXISTS idx_search_logs_tenant_id 
ON search_logs(tenant_id);
```

#### Composite Indexes

For queries filtering on multiple columns:

```sql
-- Example: Tenant + date range queries
CREATE INDEX IF NOT EXISTS idx_documents_tenant_created 
ON documents(tenant_id, created_at DESC);
```

#### Partial Indexes

For filtered queries:

```sql
-- Example: Only index active records
CREATE INDEX IF NOT EXISTS idx_documents_active 
ON documents(tenant_id, created_at) 
WHERE is_active = true;
```

### Index Maintenance

```sql
-- Analyze tables to update statistics
ANALYZE documents;
ANALYZE search_logs;
ANALYZE tenants;

-- Reindex if needed
REINDEX TABLE documents;
```

---

## Query Performance

### Identify Slow Queries

```sql
-- Enable query logging
ALTER DATABASE postgres SET log_min_duration_statement = 1000; -- Log queries > 1s

-- View slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;
```

### Common Performance Issues

#### N+1 Queries

**Problem**: Multiple queries instead of one

**Solution**: Use joins or batch loading

```sql
-- Bad: Multiple queries
SELECT * FROM documents WHERE tenant_id = '1';
SELECT * FROM documents WHERE tenant_id = '2';

-- Good: Single query
SELECT * FROM documents WHERE tenant_id IN ('1', '2');
```

#### Missing Indexes

**Problem**: Full table scans

**Solution**: Add appropriate indexes

```sql
-- Check for sequential scans
SELECT
  schemaname,
  tablename,
  seq_scan,
  idx_scan
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan * 10
ORDER BY seq_scan DESC;
```

#### Large Result Sets

**Problem**: Fetching too much data

**Solution**: Use pagination and limits

```sql
-- Bad: Fetch all
SELECT * FROM documents;

-- Good: Paginated
SELECT * FROM documents
ORDER BY created_at DESC
LIMIT 25 OFFSET 0;
```

---

## Connection Pooling

### Supabase Connection Pooling

Supabase provides built-in connection pooling via PgBouncer.

**Connection Strings**:

- **Direct**: `postgresql://...` (for migrations, admin)
- **Pooled**: `postgresql://...?pgbouncer=true` (for application)

### Configure Pool Size

```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Recommended pool size: (max_connections * 0.8) / num_workers
-- Example: If max_connections = 100, use pool_size = 20
```

### Best Practices

1. **Use Pooled Connections**: For application queries
2. **Close Connections**: Always close connections after use
3. **Limit Pool Size**: Don't exceed recommended pool size
4. **Monitor Connections**: Watch for connection leaks

---

## RLS Policy Optimization

### Verify RLS Policies

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- List all policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Optimize Policy Performance

#### Use Indexes in Policies

```sql
-- Good: Uses index on tenant_id
CREATE POLICY tenant_isolation ON documents
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Ensure tenant_id is indexed
CREATE INDEX idx_documents_tenant_id ON documents(tenant_id);
```

#### Avoid Complex Policies

```sql
-- Bad: Complex subquery
CREATE POLICY complex_policy ON documents
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants 
      WHERE user_id = auth.uid()
    )
  );

-- Good: Use function or simpler check
CREATE POLICY simple_policy ON documents
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

---

## Materialized Views

### Existing Materialized Views

The project includes materialized views for performance:

- `tenant_usage_dashboard` - Aggregated tenant statistics
- `search_analytics_summary` - Search analytics data

### Refresh Strategy

```sql
-- Manual refresh
REFRESH MATERIALIZED VIEW tenant_usage_dashboard;

-- Concurrent refresh (doesn't block reads)
REFRESH MATERIALIZED VIEW CONCURRENTLY tenant_usage_dashboard;

-- Scheduled refresh (via cron or pg_cron)
SELECT cron.schedule(
  'refresh-tenant-usage',
  '0 * * * *', -- Every hour
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY tenant_usage_dashboard$$
);
```

---

## Monitoring & Analysis

### Enable pg_stat_statements

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View top queries
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time,
  rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;
```

### Table Statistics

```sql
-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Index Usage

```sql
-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC; -- Unused indexes
```

---

## Vacuum & Analyze

### Regular Maintenance

```sql
-- Vacuum and analyze
VACUUM ANALYZE documents;
VACUUM ANALYZE search_logs;
VACUUM ANALYZE tenants;

-- Auto-vacuum is enabled by default, but manual vacuum can help
```

### Vacuum Settings

```sql
-- Check autovacuum settings
SELECT
  schemaname,
  tablename,
  autovacuum_enabled,
  n_dead_tup,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public';
```

---

## Query Optimization Checklist

- [ ] All foreign keys have indexes
- [ ] Composite indexes for multi-column queries
- [ ] Partial indexes for filtered queries
- [ ] RLS policies use indexed columns
- [ ] Queries use LIMIT and pagination
- [ ] N+1 queries eliminated
- [ ] Materialized views refreshed regularly
- [ ] Connection pooling configured
- [ ] Slow queries identified and optimized
- [ ] Statistics updated (ANALYZE)

---

## Performance Testing

### Load Testing

Use tools like:
- `pgbench` - PostgreSQL benchmarking
- `k6` - Load testing
- `Apache Bench` - Simple load testing

### Example pgbench Test

```bash
# Create test database
createdb pgbench_test

# Initialize
pgbench -i -s 10 pgbench_test

# Run test
pgbench -c 10 -j 2 -t 1000 pgbench_test
```

---

## Troubleshooting

### Slow Queries

1. Enable query logging
2. Identify slow queries
3. Analyze query plans: `EXPLAIN ANALYZE`
4. Add missing indexes
5. Optimize query structure

### High Connection Count

1. Check for connection leaks
2. Use connection pooling
3. Reduce pool size if needed
4. Monitor connection usage

### High CPU Usage

1. Check for missing indexes
2. Optimize slow queries
3. Review RLS policies
4. Consider read replicas

---

## Additional Resources

- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)
- [Supabase Performance](https://supabase.com/docs/guides/database/performance)
- [pg_stat_statements](https://www.postgresql.org/docs/current/pgstatstatements.html)

---

**Last Updated:** 2025-01-17
**Status:** Ready for optimization


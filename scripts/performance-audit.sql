-- Performance Audit Script
-- Run this script to identify performance issues

-- ============================================================================
-- 1. CHECK MISSING INDEXES
-- ============================================================================

-- Find tables with high sequential scans and low index scans
SELECT
  schemaname,
  tablename,
  seq_scan,
  idx_scan,
  CASE
    WHEN seq_scan > 0 THEN ROUND(100.0 * idx_scan / (seq_scan + idx_scan), 2)
    ELSE 100
  END as index_usage_percent,
  CASE
    WHEN seq_scan > idx_scan * 10 AND seq_scan > 100 THEN 'NEEDS INDEX'
    ELSE 'OK'
  END as status
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;

-- ============================================================================
-- 2. CHECK SLOW QUERIES
-- ============================================================================

-- Enable query logging first (if not already enabled)
-- ALTER DATABASE postgres SET log_min_duration_statement = 1000;

-- View slow queries from pg_stat_statements
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time,
  ROUND(100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0), 2) as cache_hit_ratio
FROM pg_stat_statements
WHERE mean_time > 100  -- Queries taking more than 100ms on average
ORDER BY mean_time DESC
LIMIT 20;

-- ============================================================================
-- 3. CHECK INDEX USAGE
-- ============================================================================

-- Find unused indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexrelid NOT IN (
    SELECT conindid FROM pg_constraint WHERE contype = 'p'
  )
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- 4. CHECK TABLE SIZES
-- ============================================================================

-- Find largest tables
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- 5. CHECK FOREIGN KEY INDEXES
-- ============================================================================

-- Find foreign keys without indexes
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  CASE
    WHEN idx.indexname IS NULL THEN 'MISSING INDEX'
    ELSE 'HAS INDEX'
  END as index_status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
LEFT JOIN pg_indexes idx
  ON idx.tablename = tc.table_name
  AND idx.indexdef LIKE '%' || kcu.column_name || '%'
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND idx.indexname IS NULL
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 6. CHECK CONNECTION STATS
-- ============================================================================

-- Check active connections
SELECT
  count(*) as total_connections,
  count(*) FILTER (WHERE state = 'active') as active_connections,
  count(*) FILTER (WHERE state = 'idle') as idle_connections,
  count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
FROM pg_stat_activity
WHERE datname = current_database();

-- ============================================================================
-- 7. CHECK CACHE HIT RATIO
-- ============================================================================

-- Database cache hit ratio (should be > 99%)
SELECT
  'index hit rate' as metric,
  ROUND(100.0 * sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit + idx_blks_read), 0), 2) as percentage
FROM pg_statio_user_indexes
WHERE schemaname = 'public'
UNION ALL
SELECT
  'table hit rate',
  ROUND(100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit + heap_blks_read), 0), 2)
FROM pg_statio_user_tables
WHERE schemaname = 'public';

-- ============================================================================
-- 8. CHECK LOCK CONTENTION
-- ============================================================================

-- Find blocking queries
SELECT
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement,
  blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks
  ON blocking_locks.locktype = blocked_locks.locktype
  AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
  AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
  AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
  AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
  AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
  AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
  AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
  AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
  AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
  AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- ============================================================================
-- 9. CHECK VACUUM STATUS
-- ============================================================================

-- Check tables that need vacuuming
SELECT
  schemaname,
  tablename,
  n_dead_tup,
  n_live_tup,
  last_vacuum,
  last_autovacuum,
  CASE
    WHEN n_dead_tup > n_live_tup * 0.2 THEN 'NEEDS VACUUM'
    ELSE 'OK'
  END as status
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- ============================================================================
-- 10. CHECK MATERIALIZED VIEW REFRESH
-- ============================================================================

-- Check materialized view refresh status
SELECT
  schemaname,
  matviewname,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size,
  hasindexes
FROM pg_matviews
WHERE schemaname = 'public';

-- ============================================================================
-- 11. PERFORMANCE SUMMARY
-- ============================================================================

-- Generate performance summary
SELECT
  'Tables Needing Indexes' as metric,
  COUNT(*) as count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND seq_scan > idx_scan * 10
  AND seq_scan > 100
UNION ALL
SELECT
  'Unused Indexes',
  COUNT(*)
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
UNION ALL
SELECT
  'Tables Needing Vacuum',
  COUNT(*)
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_dead_tup > n_live_tup * 0.2
  AND n_dead_tup > 1000
UNION ALL
SELECT
  'Cache Hit Ratio',
  ROUND(100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit + heap_blks_read), 0), 2)
FROM pg_statio_user_tables
WHERE schemaname = 'public';


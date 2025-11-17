-- ============================================================================
-- Database Performance Monitoring Script
-- ============================================================================
-- Usage: Run this script periodically to monitor database performance
-- Execute with: psql -h localhost -U postgres -d postgres -f scripts/db-performance-monitor.sql
-- ============================================================================

\echo '============================================================================'
\echo 'DATABASE PERFORMANCE MONITORING REPORT'
\echo '============================================================================'
\echo ''

-- 1. Overall Performance Metrics
\echo '1. OVERALL PERFORMANCE METRICS'
\echo '--------------------------------'
SELECT * FROM performance_metrics;
\echo ''

-- 2. Cache Hit Ratios (should be > 95%)
\echo '2. CACHE HIT RATIOS'
\echo '-------------------'
SELECT * FROM get_cache_hit_ratio();
\echo ''
\echo 'NOTE: Both ratios should be > 95%. If lower, consider increasing shared_buffers.'
\echo ''

-- 3. Slow Queries (> 1000ms)
\echo '3. SLOW QUERIES (> 1000ms)'
\echo '--------------------------'
SELECT
  LEFT(query, 80) as query_snippet,
  calls,
  ROUND(mean_exec_time::numeric, 2) as avg_ms,
  ROUND(max_exec_time::numeric, 2) as max_ms
FROM get_slow_queries(1000, 10);
\echo ''

-- 4. Index Usage Statistics
\echo '4. INDEX USAGE (Potentially Unused)'
\echo '-----------------------------------'
SELECT
  tablename,
  indexname,
  idx_scan as scans,
  index_size
FROM get_index_usage_stats()
WHERE idx_scan < 100
ORDER BY index_size DESC
LIMIT 10;
\echo ''
\echo 'NOTE: Indexes with low scan counts might be candidates for removal.'
\echo ''

-- 5. Table Statistics
\echo '5. LARGEST TABLES'
\echo '-----------------'
SELECT
  tablename,
  row_estimate,
  total_size,
  seq_scan,
  idx_scan
FROM get_table_stats()
LIMIT 10;
\echo ''

-- 6. Active Connections
\echo '6. ACTIVE CONNECTIONS'
\echo '---------------------'
SELECT
  datname as database,
  usename as username,
  COUNT(*) as connections,
  COUNT(*) FILTER (WHERE state = 'active') as active,
  COUNT(*) FILTER (WHERE state = 'idle') as idle
FROM pg_stat_activity
WHERE datname IS NOT NULL
GROUP BY datname, usename
ORDER BY connections DESC;
\echo ''

-- 7. Materialized View Freshness
\echo '7. MATERIALIZED VIEW STATUS'
\echo '---------------------------'
SELECT
  schemaname,
  matviewname as view_name,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size,
  CASE
    WHEN ispopulated THEN 'Populated'
    ELSE 'Not Populated'
  END as status
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY matviewname;
\echo ''
\echo 'NOTE: Run refresh_all_materialized_views() if views need updating.'
\echo ''

-- 8. Query Cache Statistics
\echo '8. QUERY CACHE STATISTICS'
\echo '-------------------------'
SELECT
  COUNT(*) as total_cached_queries,
  COUNT(*) FILTER (WHERE expires_at > NOW()) as active_caches,
  COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_caches,
  SUM(hit_count) as total_cache_hits,
  AVG(hit_count) as avg_hits_per_cache,
  pg_size_pretty(pg_total_relation_size('query_cache_metadata')) as cache_table_size
FROM query_cache_metadata;
\echo ''

-- 9. Top Cached Queries by Hit Count
\echo '9. MOST USED CACHED QUERIES'
\echo '---------------------------'
SELECT
  LEFT(cache_key, 50) as cache_key,
  hit_count,
  result_count,
  created_at,
  expires_at,
  CASE
    WHEN expires_at > NOW() THEN 'Valid'
    ELSE 'Expired'
  END as status
FROM query_cache_metadata
ORDER BY hit_count DESC
LIMIT 10;
\echo ''

-- 10. Database Size and Growth
\echo '10. DATABASE SIZE'
\echo '-----------------'
SELECT
  pg_size_pretty(pg_database_size(current_database())) as total_size,
  (SELECT COUNT(*) FROM pg_stat_activity) as current_connections,
  (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections;
\echo ''

-- 11. Autovacuum Activity
\echo '11. RECENT VACUUM ACTIVITY'
\echo '--------------------------'
SELECT
  schemaname,
  relname as table_name,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY last_autovacuum DESC NULLS LAST
LIMIT 10;
\echo ''

-- 12. Long Running Queries
\echo '12. LONG RUNNING QUERIES'
\echo '------------------------'
SELECT
  pid,
  usename,
  LEFT(query, 60) as query,
  state,
  NOW() - query_start as duration
FROM pg_stat_activity
WHERE state = 'active'
  AND query NOT LIKE '%pg_stat_activity%'
  AND NOW() - query_start > interval '1 second'
ORDER BY duration DESC;
\echo ''

-- 13. Recommendations
\echo '13. PERFORMANCE RECOMMENDATIONS'
\echo '--------------------------------'

-- Check cache hit ratio
DO $$
DECLARE
  table_ratio NUMERIC;
  index_ratio NUMERIC;
BEGIN
  SELECT ratio INTO table_ratio FROM get_cache_hit_ratio() WHERE cache_type = 'table_cache_hit_ratio';
  SELECT ratio INTO index_ratio FROM get_cache_hit_ratio() WHERE cache_type = 'index_cache_hit_ratio';

  IF table_ratio < 95 THEN
    RAISE NOTICE '⚠ WARNING: Table cache hit ratio is %.2f%% (should be > 95%%)', table_ratio;
    RAISE NOTICE '   → Increase shared_buffers in PostgreSQL configuration';
  ELSE
    RAISE NOTICE '✓ Table cache hit ratio is good: %.2f%%', table_ratio;
  END IF;

  IF index_ratio < 95 THEN
    RAISE NOTICE '⚠ WARNING: Index cache hit ratio is %.2f%% (should be > 95%%)', index_ratio;
    RAISE NOTICE '   → Increase shared_buffers in PostgreSQL configuration';
  ELSE
    RAISE NOTICE '✓ Index cache hit ratio is good: %.2f%%', index_ratio;
  END IF;
END $$;

-- Check for unused indexes
DO $$
DECLARE
  unused_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unused_count
  FROM get_index_usage_stats()
  WHERE idx_scan < 100;

  IF unused_count > 0 THEN
    RAISE NOTICE '⚠ INFO: % potentially unused indexes found', unused_count;
    RAISE NOTICE '   → Review with: SELECT * FROM get_index_usage_stats() WHERE idx_scan < 100;';
  ELSE
    RAISE NOTICE '✓ All indexes are being used';
  END IF;
END $$;

-- Check for slow queries
DO $$
DECLARE
  slow_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO slow_count
  FROM get_slow_queries(1000, 100);

  IF slow_count > 10 THEN
    RAISE NOTICE '⚠ WARNING: % slow queries detected (> 1000ms)', slow_count;
    RAISE NOTICE '   → Review with: SELECT * FROM get_slow_queries(1000, 20);';
  ELSIF slow_count > 0 THEN
    RAISE NOTICE '⚠ INFO: % slow queries detected (> 1000ms)', slow_count;
    RAISE NOTICE '   → Monitor and optimize if needed';
  ELSE
    RAISE NOTICE '✓ No slow queries detected';
  END IF;
END $$;

\echo ''
\echo '============================================================================'
\echo 'END OF PERFORMANCE REPORT'
\echo '============================================================================'
\echo ''
\echo 'RECOMMENDED ACTIONS:'
\echo '1. Review slow queries and optimize with proper indexes'
\echo '2. Consider removing unused indexes (after verifying they are truly unused)'
\echo '3. Refresh materialized views if data is stale'
\echo '4. Clean expired cache entries: SELECT clean_expired_cache();'
\echo '5. Monitor cache hit ratios - should stay above 95%'
\echo ''
\echo 'MAINTENANCE COMMANDS:'
\echo '- Refresh materialized views: SELECT * FROM refresh_all_materialized_views();'
\echo '- Run daily maintenance: SELECT * FROM run_daily_maintenance();'
\echo '- Clean cache: SELECT clean_expired_cache();'
\echo ''

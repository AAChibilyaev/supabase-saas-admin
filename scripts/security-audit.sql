-- Security Audit Script
-- Run this script to verify security configuration

-- ============================================================================
-- 1. CHECK RLS POLICIES
-- ============================================================================

-- Check which tables have RLS enabled
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected: All tables should have rowsecurity = true

-- ============================================================================
-- 2. CHECK SECURITY DEFINER VIEWS
-- ============================================================================

-- Check for views with SECURITY DEFINER (should be NONE)
SELECT
  n.nspname as schema_name,
  c.relname as view_name,
  CASE
    WHEN c.reloptions IS NULL THEN 'No options'
    WHEN 'security_definer=true' = ANY(c.reloptions) THEN 'SECURITY DEFINER FOUND - VULNERABILITY!'
    ELSE 'OK'
  END as security_status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
  AND n.nspname = 'public'
  AND c.relname IN ('embedding_statistics', 'cms_connection_stats');

-- Expected: Both views should show 'OK' (no SECURITY DEFINER)

-- ============================================================================
-- 3. CHECK SECURITY INVOKER ON VIEWS
-- ============================================================================

-- Verify security_invoker is enabled on views
SELECT
  c.relname as view_name,
  CASE
    WHEN 'security_invoker=on' = ANY(c.reloptions) THEN 'security_invoker ENABLED ✓'
    ELSE 'security_invoker NOT ENABLED'
  END as security_invoker_status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
  AND n.nspname = 'public'
  AND c.relname IN ('embedding_statistics', 'cms_connection_stats');

-- Expected: Both views should show 'security_invoker ENABLED ✓'

-- ============================================================================
-- 4. CHECK RLS POLICIES EXIST
-- ============================================================================

-- List all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Expected: All tables should have policies

-- ============================================================================
-- 5. CHECK FOR SECURITY DEFINER FUNCTIONS
-- ============================================================================

-- List functions with SECURITY DEFINER (should be minimal and documented)
SELECT
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.prosecdef = true
  AND n.nspname = 'public'
ORDER BY p.proname;

-- Review each function to ensure SECURITY DEFINER is necessary

-- ============================================================================
-- 6. CHECK EXTENSION SECURITY
-- ============================================================================

-- Check if vector extension is in public schema (should be in extensions schema if possible)
SELECT
  n.nspname as schema_name,
  e.extname as extension_name
FROM pg_extension e
JOIN pg_namespace n ON n.oid = e.extnamespace
WHERE e.extname = 'vector';

-- Expected: Should be in 'extensions' schema if possible

-- ============================================================================
-- 7. CHECK API KEY SECURITY
-- ============================================================================

-- Verify API keys table has RLS
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'tenant_api_keys';

-- Expected: rowsecurity = true

-- ============================================================================
-- 8. CHECK AUDIT LOGGING
-- ============================================================================

-- Verify audit logs table exists and has RLS
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'audit_logs';

-- Expected: rowsecurity = true

-- ============================================================================
-- 9. CHECK TENANT ISOLATION
-- ============================================================================

-- Verify tenant_id is used in RLS policies
SELECT
  tablename,
  policyname,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND qual::text LIKE '%tenant_id%'
ORDER BY tablename;

-- Expected: Most tables should have tenant_id in policies

-- ============================================================================
-- 10. SUMMARY REPORT
-- ============================================================================

-- Generate summary
SELECT
  'RLS Enabled Tables' as check_type,
  COUNT(*) FILTER (WHERE rowsecurity = true) as passed,
  COUNT(*) FILTER (WHERE rowsecurity = false) as failed,
  COUNT(*) as total
FROM pg_tables
WHERE schemaname = 'public'
UNION ALL
SELECT
  'RLS Policies',
  COUNT(DISTINCT tablename) as passed,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') - COUNT(DISTINCT tablename) as failed,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as total
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT
  'Security Definer Views',
  COUNT(*) FILTER (WHERE 'security_definer=true' != ANY(COALESCE(c.reloptions, ARRAY[]::text[]))) as passed,
  COUNT(*) FILTER (WHERE 'security_definer=true' = ANY(COALESCE(c.reloptions, ARRAY[]::text[]))) as failed,
  COUNT(*) as total
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
  AND n.nspname = 'public'
  AND c.relname IN ('embedding_statistics', 'cms_connection_stats');


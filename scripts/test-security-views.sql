-- Test script to verify Security Definer Views fix
-- Run this after applying the migration to verify views are correctly configured

-- ============================================================================
-- TEST 1: Verify views exist without SECURITY DEFINER
-- ============================================================================

SELECT 
  viewname,
  viewowner,
  schemaname,
  CASE 
    WHEN pg_catalog.obj_description(c.oid) LIKE '%SECURITY DEFINER%' THEN 'SECURITY DEFINER FOUND - VULNERABILITY EXISTS!'
    ELSE 'OK - No SECURITY DEFINER'
  END as security_status
FROM pg_views v
JOIN pg_class c ON c.relname = v.viewname
WHERE viewname IN ('embedding_statistics', 'cms_connection_stats')
  AND schemaname = 'public';

-- ============================================================================
-- TEST 2: Verify security_invoker is enabled
-- ============================================================================

SELECT 
  c.relname as view_name,
  CASE 
    WHEN c.reloptions IS NULL THEN 'security_invoker NOT SET'
    WHEN 'security_invoker=on' = ANY(c.reloptions) THEN 'security_invoker ENABLED ✓'
    ELSE 'security_invoker NOT ENABLED'
  END as security_invoker_status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
  AND n.nspname = 'public'
  AND c.relname IN ('embedding_statistics', 'cms_connection_stats');

-- ============================================================================
-- TEST 3: Test access with different user roles (requires test users)
-- ============================================================================
-- Note: This test requires creating test users with different roles
-- Uncomment and modify based on your test user setup

/*
-- Test as owner role
SET ROLE owner;
SELECT COUNT(*) FROM embedding_statistics;
SELECT COUNT(*) FROM cms_connection_stats;
RESET ROLE;

-- Test as member role
SET ROLE member;
SELECT COUNT(*) FROM embedding_statistics;
SELECT COUNT(*) FROM cms_connection_stats;
RESET ROLE;

-- Test as readonly role
SET ROLE readonly;
SELECT COUNT(*) FROM embedding_statistics;
SELECT COUNT(*) FROM cms_connection_stats;
RESET ROLE;
*/

-- ============================================================================
-- TEST 4: Verify RLS policies are enforced
-- ============================================================================
-- This test verifies that views respect RLS policies on underlying tables

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('embedding_analytics', 'cms_connections', 'cms_sync_logs')
ORDER BY tablename, policyname;

-- ============================================================================
-- EXPECTED RESULTS
-- ============================================================================
-- 1. Both views should exist
-- 2. security_status should show "OK - No SECURITY DEFINER"
-- 3. security_invoker_status should show "security_invoker ENABLED ✓"
-- 4. RLS policies should exist on underlying tables
-- 5. Views should only return data based on user's RLS permissions


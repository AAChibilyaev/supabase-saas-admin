-- Migration: Fix Security Definer Views vulnerability
-- Issue: #41 - CRITICAL Security Fix
-- Date: 2025-11-17
-- Description: Remove SECURITY DEFINER from views to enforce proper RLS policies
--              This fixes a critical security vulnerability where views bypassed
--              Row Level Security by using the view creator's permissions instead
--              of the querying user's permissions.
--
-- Affected Views:
--   - public.embedding_statistics
--   - public.cms_connection_stats
--
-- Security Risk:
--   SECURITY DEFINER views execute with the permissions of the view creator,
--   bypassing Row Level Security (RLS) policies. This allows users to access
--   data across tenant boundaries, violating multi-tenant isolation.
--
-- Solution:
--   1. DROP existing views with CASCADE to remove dependencies
--   2. Recreate views WITHOUT SECURITY DEFINER clause
--   3. Enable security_invoker to ensure RLS is enforced

-- ============================================================================
-- STEP 1: Drop existing security definer views
-- ============================================================================

DROP VIEW IF EXISTS public.embedding_statistics CASCADE;
DROP VIEW IF EXISTS public.cms_connection_stats CASCADE;

-- ============================================================================
-- STEP 2: Recreate views WITHOUT SECURITY DEFINER
-- ============================================================================

-- View: embedding_statistics
-- Purpose: Provides aggregated statistics for embeddings per tenant
-- Security: Uses security_invoker to enforce RLS policies
-- Note: Now respects RLS policies on embedding_analytics table
CREATE VIEW public.embedding_statistics AS
SELECT
  tenant_id,
  COUNT(*) as total_embeddings,
  COUNT(*) FILTER (WHERE success = true) as successful_embeddings,
  COUNT(*) FILTER (WHERE success = false) as failed_embeddings,
  AVG(processing_time_ms) as avg_processing_time_ms,
  AVG(token_count) as avg_token_count,
  MIN(created_at) as first_embedding_at,
  MAX(created_at) as last_embedding_at
FROM embedding_analytics
GROUP BY tenant_id;

-- View: cms_connection_stats
-- Purpose: Provides connection statistics with sync log aggregations
-- Security: Uses security_invoker to enforce RLS policies
-- Note: Now respects RLS policies on cms_connections and cms_sync_logs tables
CREATE VIEW public.cms_connection_stats AS
SELECT
  c.id as connection_id,
  c.tenant_id,
  c.name,
  c.type,
  c.is_active,
  c.last_sync_at,
  c.last_sync_status,
  c.last_sync_count,
  COUNT(l.id) as total_syncs,
  COUNT(*) FILTER (WHERE l.status = 'success') as successful_syncs,
  COUNT(*) FILTER (WHERE l.status = 'failed') as failed_syncs,
  SUM(l.documents_synced) as total_documents_synced
FROM cms_connections c
LEFT JOIN cms_sync_logs l ON c.id = l.integration_id
GROUP BY c.id, c.tenant_id, c.name, c.type, c.is_active,
         c.last_sync_at, c.last_sync_status, c.last_sync_count;

-- ============================================================================
-- STEP 3: Enable security_invoker for both views
-- ============================================================================

-- This setting ensures views run with the permissions of the invoking user
-- rather than the view creator, allowing RLS policies to be properly enforced
ALTER VIEW public.embedding_statistics SET (security_invoker = on);
ALTER VIEW public.cms_connection_stats SET (security_invoker = on);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- To verify the fix has been applied correctly, run:
--
-- 1. Check view definitions:
-- SELECT viewname, viewowner, definition
-- FROM pg_views
-- WHERE viewname IN ('embedding_statistics', 'cms_connection_stats')
--   AND schemaname = 'public';
--
-- 2. Check security_invoker setting:
-- SELECT c.relname as view_name,
--        c.reloptions as options
-- FROM pg_class c
-- JOIN pg_namespace n ON n.oid = c.relnamespace
-- WHERE n.nspname = 'public'
--   AND c.relname IN ('embedding_statistics', 'cms_connection_stats')
--   AND c.relkind = 'v';
--
-- Expected result: Both views should exist without SECURITY DEFINER option
-- and should have security_invoker=on in their reloptions.

-- ============================================================================
-- SECURITY VALIDATION
-- ============================================================================

-- After applying this migration:
--
-- 1. Views will now respect Row Level Security (RLS) policies
-- 2. Users can only see data for their own tenant_id
-- 3. Cross-tenant data access is prevented
-- 4. All queries execute with the permissions of the calling user
--
-- Required RLS policies must be in place on underlying tables:
--   - embedding_analytics: Must have tenant_id-based RLS policy
--   - cms_connections: Must have tenant_id-based RLS policy
--   - cms_sync_logs: Must filter based on related cms_connections.tenant_id
--
-- Testing checklist:
--   [ ] Run Supabase Security Advisor to verify fix
--   [ ] Test view access with different user roles
--   [ ] Verify tenant isolation in staging environment
--   [ ] Confirm no cross-tenant data leakage
--   [ ] Monitor performance after deployment

-- ============================================================================
-- ROLLBACK INFORMATION
-- ============================================================================

-- WARNING: Rollback is NOT RECOMMENDED as it reintroduces the security vulnerability!
--
-- If absolutely necessary to rollback (consult security team first):
-- DROP VIEW IF EXISTS public.embedding_statistics CASCADE;
-- DROP VIEW IF EXISTS public.cms_connection_stats CASCADE;
-- (Then manually recreate with SECURITY DEFINER - NOT RECOMMENDED)

-- ============================================================================
-- IMPACT ASSESSMENT
-- ============================================================================

-- Performance Impact: MINIMAL
--   - Views will execute with same query plans
--   - RLS policies add negligible overhead
--   - Indexed tenant_id columns ensure fast filtering
--
-- Security Impact: CRITICAL IMPROVEMENT
--   - Fixes tenant isolation breach
--   - Prevents unauthorized data access
--   - Enforces proper security boundaries
--
-- Application Impact: NONE
--   - View signatures remain unchanged
--   - No application code changes required
--   - Existing queries continue to work
--   - TypeScript types remain valid

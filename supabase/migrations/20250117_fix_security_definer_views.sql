-- Migration: Fix Security Definer Views vulnerability
-- Issue: #22 - CRITICAL Security Fix
-- Date: 2025-01-17
-- Description: Remove SECURITY DEFINER from views to enforce proper RLS policies
--              This fixes a critical security vulnerability where views bypassed
--              Row Level Security by using the view creator's permissions instead
--              of the querying user's permissions.

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
-- VERIFICATION
-- ============================================================================

-- To verify the fix has been applied correctly, run:
-- SELECT viewname, viewowner,
--        pg_catalog.obj_description(c.oid) as comment
-- FROM pg_views v
-- JOIN pg_class c ON c.relname = v.viewname
-- WHERE viewname IN ('embedding_statistics', 'cms_connection_stats')
--   AND schemaname = 'public';

-- Expected result: Both views should exist without SECURITY DEFINER option
-- and should have security_invoker enabled in their options.

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

-- 1. This migration removes the SECURITY DEFINER property from views
-- 2. Views will now respect Row Level Security (RLS) policies
-- 3. Users can only see data they have permission to access via RLS
-- 4. Ensure proper RLS policies are in place on underlying tables:
--    - embedding_analytics
--    - cms_connections
--    - cms_sync_logs
-- 5. Test access with different user roles after applying this migration
-- 6. Run Supabase Security Advisor to verify the fix

-- ============================================================================
-- ROLLBACK (if needed - NOT RECOMMENDED for security fixes)
-- ============================================================================

-- If you absolutely must rollback (not recommended as it reintroduces the vulnerability):
-- DROP VIEW IF EXISTS public.embedding_statistics CASCADE;
-- DROP VIEW IF EXISTS public.cms_connection_stats CASCADE;
-- Then recreate with SECURITY DEFINER (consult your DBA first!)

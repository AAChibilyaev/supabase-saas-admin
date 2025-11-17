-- Migration: Typesense Auto-Sync Integration
-- Description: Add triggers to automatically sync documents to Typesense when data changes
-- Created: 2025-11-17

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS http;

-- Function to sync a record to Typesense
CREATE OR REPLACE FUNCTION sync_to_typesense()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  request_payload JSONB;
  http_response JSONB;
BEGIN
  -- Get the Supabase Function URL from environment or use default
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/sync-to-typesense';

  -- Build the request payload
  IF TG_OP = 'DELETE' THEN
    request_payload := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'record', row_to_json(OLD)
    );
  ELSE
    request_payload := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'record', row_to_json(NEW)
    );
  END IF;

  -- Make async HTTP request to Edge Function
  -- Using pg_net extension for non-blocking requests
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := request_payload
  );

  -- Return the appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to function
COMMENT ON FUNCTION sync_to_typesense() IS 'Automatically syncs table changes to Typesense search index';

-- Example: Create trigger for documents table
-- Uncomment and modify for your specific tables

-- CREATE TRIGGER trigger_sync_documents_to_typesense
--   AFTER INSERT OR UPDATE OR DELETE ON documents
--   FOR EACH ROW
--   EXECUTE FUNCTION sync_to_typesense();

-- Function to manually trigger a batch sync
CREATE OR REPLACE FUNCTION batch_sync_to_typesense(
  p_table_name TEXT,
  p_limit INT DEFAULT 1000,
  p_offset INT DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  function_url TEXT;
  request_payload JSONB;
  http_response RECORD;
BEGIN
  -- Get the Supabase Function URL
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/batch-sync-to-typesense';

  -- Build the request payload
  request_payload := jsonb_build_object(
    'table', p_table_name,
    'limit', p_limit,
    'offset', p_offset
  );

  -- Make synchronous HTTP request
  SELECT * INTO http_response FROM http((
    'POST',
    function_url,
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true))
    ],
    'application/json',
    request_payload::text
  )::http_request);

  -- Return the response
  RETURN http_response.content::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to function
COMMENT ON FUNCTION batch_sync_to_typesense(TEXT, INT, INT) IS 'Manually trigger batch sync of a table to Typesense';

-- Create a table to track sync status (optional)
CREATE TABLE IF NOT EXISTS typesense_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE, BATCH_SYNC
  record_id TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes
  INDEX idx_typesense_sync_log_table_name ON typesense_sync_log(table_name),
  INDEX idx_typesense_sync_log_synced_at ON typesense_sync_log(synced_at DESC),
  INDEX idx_typesense_sync_log_success ON typesense_sync_log(success)
);

-- Add RLS policy for sync log
ALTER TABLE typesense_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sync logs"
  ON typesense_sync_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Add comment to table
COMMENT ON TABLE typesense_sync_log IS 'Logs all sync operations to Typesense for debugging and monitoring';

-- Grant necessary permissions
GRANT SELECT ON typesense_sync_log TO authenticated;

-- Example usage:
--
-- 1. Enable auto-sync for a table:
-- CREATE TRIGGER trigger_sync_my_table_to_typesense
--   AFTER INSERT OR UPDATE OR DELETE ON my_table
--   FOR EACH ROW
--   EXECUTE FUNCTION sync_to_typesense();
--
-- 2. Batch sync existing data:
-- SELECT batch_sync_to_typesense('my_table', 1000, 0);
--
-- 3. Check sync logs:
-- SELECT * FROM typesense_sync_log ORDER BY synced_at DESC LIMIT 100;

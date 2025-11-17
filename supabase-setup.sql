-- Supabase Setup SQL
-- Выполните этот скрипт в SQL Editor вашего проекта Supabase

-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы постов
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Включение Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Удаление старых политик (если они существуют)
DROP POLICY IF EXISTS "Allow authenticated users to read users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to insert users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to update users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to delete users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to read posts" ON posts;
DROP POLICY IF EXISTS "Allow authenticated users to insert posts" ON posts;
DROP POLICY IF EXISTS "Allow authenticated users to update posts" ON posts;
DROP POLICY IF EXISTS "Allow authenticated users to delete posts" ON posts;

-- Политики доступа для таблицы users
CREATE POLICY "Allow authenticated users to read users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update users"
  ON users FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete users"
  ON users FOR DELETE
  TO authenticated
  USING (true);

-- Политики доступа для таблицы posts
CREATE POLICY "Allow authenticated users to read posts"
  ON posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete posts"
  ON posts FOR DELETE
  TO authenticated
  USING (true);

-- Добавление тестовых данных (опционально)
INSERT INTO users (email, full_name) VALUES
  ('john@example.com', 'John Doe'),
  ('jane@example.com', 'Jane Smith'),
  ('bob@example.com', 'Bob Johnson')
ON CONFLICT (email) DO NOTHING;

INSERT INTO posts (title, content, user_id) VALUES
  ('First Post', 'This is my first post content', (SELECT id FROM users WHERE email = 'john@example.com')),
  ('Second Post', 'Another interesting post', (SELECT id FROM users WHERE email = 'jane@example.com')),
  ('Third Post', 'More content here', (SELECT id FROM users WHERE email = 'bob@example.com'))
ON CONFLICT DO NOTHING;

-- Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ===========================================================================
-- SECURE VIEWS (Issue #22 - Security Fix)
-- ===========================================================================
-- Note: These views are created WITHOUT SECURITY DEFINER to ensure
-- Row Level Security policies are properly enforced.
-- Views use security_invoker mode to run with querying user's permissions.

-- Drop existing views if they exist (in case they were created with SECURITY DEFINER)
DROP VIEW IF EXISTS public.embedding_statistics CASCADE;
DROP VIEW IF EXISTS public.cms_connection_stats CASCADE;

-- View: embedding_statistics
-- Purpose: Aggregated statistics for embeddings per tenant
-- Security: Enforces RLS via security_invoker
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
-- Purpose: Connection statistics with sync log aggregations
-- Security: Enforces RLS via security_invoker
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

-- Enable security_invoker to ensure views respect RLS policies
ALTER VIEW public.embedding_statistics SET (security_invoker = on);
ALTER VIEW public.cms_connection_stats SET (security_invoker = on);

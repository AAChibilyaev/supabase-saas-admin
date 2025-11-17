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

-- Supabase Seed Data
-- This file contains initial data for local development
-- Run with: supabase db reset (automatically runs seeds after migrations)

-- NOTE: Core schema is created in migrations.
-- This file only contains seed data for development/testing.

-- Seed test users (for local development only)
-- These will be inserted into the users table if it exists
DO $$
BEGIN
  -- Only insert if users table exists and has the email column
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'users'
  ) THEN
    INSERT INTO users (email, full_name)
    VALUES
      ('john@example.com', 'John Doe'),
      ('jane@example.com', 'Jane Smith'),
      ('bob@example.com', 'Bob Johnson'),
      ('admin@example.com', 'Admin User'),
      ('test@example.com', 'Test User')
    ON CONFLICT (email) DO NOTHING;

    RAISE NOTICE 'Seeded % test users',
      (SELECT COUNT(*) FROM users WHERE email LIKE '%@example.com');
  END IF;
END $$;

-- Seed test posts (for local development only)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'posts'
  ) THEN
    INSERT INTO posts (title, content, user_id)
    VALUES
      (
        'Getting Started with Supabase',
        'Learn how to use Supabase for your next project.',
        (SELECT id FROM users WHERE email = 'john@example.com' LIMIT 1)
      ),
      (
        'React Admin Best Practices',
        'Tips and tricks for building admin panels with React Admin.',
        (SELECT id FROM users WHERE email = 'jane@example.com' LIMIT 1)
      ),
      (
        'Database Migration Strategies',
        'How to manage database migrations effectively.',
        (SELECT id FROM users WHERE email = 'bob@example.com' LIMIT 1)
      ),
      (
        'TypeScript Type Safety',
        'Leveraging TypeScript for type-safe database queries.',
        (SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1)
      ),
      (
        'Local Development Workflow',
        'Setting up a productive local development environment.',
        (SELECT id FROM users WHERE email = 'test@example.com' LIMIT 1)
      )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Seeded % test posts',
      (SELECT COUNT(*) FROM posts);
  END IF;
END $$;

-- Seed additional tables as needed
-- Add more seed data here for other tables in your schema

RAISE NOTICE 'Seed data loaded successfully for local development!';

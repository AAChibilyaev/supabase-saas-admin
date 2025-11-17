# Database Migrations Workflow

This guide explains how to create, manage, and deploy database migrations using Supabase CLI.

## Overview

Database migrations are version-controlled SQL files that describe changes to your database schema. They allow you to:

- Track database schema changes in git
- Apply changes consistently across environments
- Collaborate with team members on schema changes
- Roll back changes if needed
- Deploy with confidence

## Migration File Structure

Migrations are stored in `supabase/migrations/` with the format:

```
20250117_descriptive_name.sql
```

The timestamp (YYYYMMDD) ensures migrations run in order.

## Creating Migrations

### Method 1: CLI Generated Migration (Recommended)

Create an empty migration file:

```bash
npm run db:migration:new add_user_preferences
```

Or use the helper script:

```bash
./scripts/create-migration.sh add_user_preferences
```

This creates: `supabase/migrations/20250117_add_user_preferences.sql`

Edit the file with your SQL:

```sql
-- Migration: Add user preferences table
-- Created: 2025-01-17

BEGIN;

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Add updated_at trigger
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```

### Method 2: Generate from Database Diff

If you made changes via Supabase Studio:

```bash
# Generate migration from differences
npm run db:diff -- -f capture_studio_changes
```

This compares your local database with the migration history and generates a migration with the differences.

### Method 3: Pull from Remote

Pull schema changes from your cloud project:

```bash
npm run db:pull
```

This generates migrations based on differences between your local migrations and the remote database.

## Migration Best Practices

### 1. Use Transactions

Wrap migrations in transactions to ensure atomic changes:

```sql
BEGIN;

-- Your changes here
CREATE TABLE users (...);
ALTER TABLE posts ...;

COMMIT;
```

If any statement fails, all changes are rolled back.

### 2. Make Migrations Idempotent

Use `IF EXISTS` / `IF NOT EXISTS`:

```sql
-- Safe to run multiple times
CREATE TABLE IF NOT EXISTS users (...);
DROP TABLE IF EXISTS old_table;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
```

### 3. Handle Data Migrations Carefully

When adding non-nullable columns to existing tables:

```sql
-- Bad: Will fail if table has data
ALTER TABLE users ADD COLUMN email TEXT NOT NULL;

-- Good: Add as nullable, backfill, then set NOT NULL
ALTER TABLE users ADD COLUMN email TEXT;
UPDATE users SET email = 'unknown@example.com' WHERE email IS NULL;
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
```

### 4. Use Comments

Document your migrations:

```sql
-- Migration: Add user roles and permissions
-- Created: 2025-01-17
-- Author: Team Name
-- Ticket: PROJ-123

BEGIN;

-- Create user roles enum
CREATE TYPE user_role AS ENUM ('admin', 'user', 'viewer');
-- ... rest of migration

COMMIT;
```

### 5. Test Before Committing

Always test migrations on a fresh database:

```bash
# Reset and test
npm run db:reset

# Verify changes in Studio
open http://localhost:54323
```

### 6. One Logical Change Per Migration

Keep migrations focused:

- ✅ Good: `add_user_roles.sql`
- ❌ Bad: `add_user_roles_and_update_posts_and_fix_comments.sql`

### 7. Never Modify Committed Migrations

Once a migration is pushed to production:
- Don't edit it
- Create a new migration to fix issues

## Testing Migrations

### Test Locally

```bash
# Reset database (drops all data, re-runs migrations)
npm run db:reset

# Check the results
npx supabase status
```

### Test on a Branch

If using Supabase Branches:

```bash
# Create a branch
npx supabase branches create feature-branch

# Apply migrations to branch
npm run db:push
```

### Test with Seed Data

Ensure your migration works with data:

```bash
# Reset includes seed data
npm run db:reset

# Verify seed data loaded correctly
psql postgresql://postgres:postgres@localhost:54322/postgres
# SELECT * FROM users;
```

## Applying Migrations

### Local Application

```bash
# Apply new migrations
npm run db:reset

# Or just apply new ones (doesn't drop data)
npm run db:migration:up
```

### Remote Application

Push to cloud project:

```bash
npm run db:push
```

This applies all pending migrations to your linked Supabase project.

## Migration Workflow Examples

### Example 1: Adding a New Table

```bash
# 1. Create migration
./scripts/create-migration.sh add_posts_table

# 2. Edit the migration file
# supabase/migrations/YYYYMMDD_add_posts_table.sql

# 3. Test locally
npm run db:reset

# 4. Generate types
npm run types:generate

# 5. Commit
git add supabase/migrations/
git commit -m "Add posts table"

# 6. Push to remote
npm run db:push
```

### Example 2: Modifying an Existing Table

```bash
# 1. Create migration
./scripts/create-migration.sh add_user_avatar

# 2. Write the migration
cat > supabase/migrations/YYYYMMDD_add_user_avatar.sql << 'EOF'
BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
CREATE INDEX IF NOT EXISTS idx_users_avatar ON users(avatar_url) WHERE avatar_url IS NOT NULL;

COMMIT;
EOF

# 3. Test
npm run db:reset

# 4. Commit and push
git add supabase/migrations/
git commit -m "Add avatar_url to users table"
npm run db:push
```

### Example 3: Capturing Studio Changes

```bash
# 1. Make changes in Supabase Studio
# http://localhost:54323

# 2. Generate migration from diff
npm run db:diff -- -f studio_changes

# 3. Review the generated migration
# supabase/migrations/YYYYMMDD_studio_changes.sql

# 4. Test
npm run db:reset

# 5. Commit and push
git add supabase/migrations/
git commit -m "Capture studio changes"
npm run db:push
```

## Common Migration Patterns

### Adding a Table with RLS

```sql
BEGIN;

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own posts"
  ON posts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_published ON posts(published) WHERE published = true;

COMMIT;
```

### Adding an Enum Type

```sql
BEGIN;

CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');

ALTER TABLE posts ADD COLUMN status post_status DEFAULT 'draft';

COMMIT;
```

### Adding Full-Text Search

```sql
BEGIN;

-- Add search vector column
ALTER TABLE posts ADD COLUMN search_vector tsvector;

-- Create index
CREATE INDEX idx_posts_search ON posts USING gin(search_vector);

-- Update existing rows
UPDATE posts SET search_vector =
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''));

-- Create trigger to auto-update
CREATE FUNCTION posts_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.title, '') || ' ' || coalesce(NEW.content, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_posts_search
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION posts_search_trigger();

COMMIT;
```

### Creating a Function

```sql
BEGIN;

CREATE OR REPLACE FUNCTION get_user_post_count(user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM posts WHERE posts.user_id = $1);
END;
$$;

COMMIT;
```

## Troubleshooting

### Migration Failed

**Error:** Migration fails during `db:reset`

```bash
# View error details
npm run db:reset

# Fix the migration file
# Then try again
```

### Out of Order Migrations

**Error:** New migration has older timestamp than existing ones

```bash
# Rename the file to have a newer timestamp
mv supabase/migrations/20250101_old.sql \
   supabase/migrations/20250117_new.sql
```

### Migration Works Locally but Fails Remotely

Possible causes:
1. Remote database has different data
2. Remote has different extensions installed
3. Permission issues

```bash
# Test against a branch first
npx supabase branches create test
npm run db:push
```

### Need to Rollback

There's no automatic rollback. Options:

1. **Create a new migration** that reverses the changes
2. **Restore from backup** (production only)
3. **Fix forward** - create a new migration that fixes the issue

## Team Collaboration

### Before Creating a Migration

```bash
# Pull latest changes
git pull

# Reset local database
npm run db:reset
```

### Resolving Conflicts

If two people create migrations simultaneously:

1. Rename newer migration to have later timestamp
2. Test with `npm run db:reset`
3. Commit both migrations

### Communication

- Announce major schema changes to the team
- Use pull requests for migration review
- Test migrations on staging before production

## Next Steps

- [Local Development Guide](./LOCAL_DEVELOPMENT.md)
- [TypeScript Types](./TYPESCRIPT_TYPES.md)
- [Deployment Guide](./DEPLOYMENT.md)

## Resources

- [Supabase Migrations Docs](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/current/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

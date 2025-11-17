# Database Migrations

This directory contains all database migrations for the Supabase Admin project.

## Migration Naming Convention

Migrations follow the format: `YYYYMMDD_description.sql`

Example: `20250117_add_user_roles.sql`

## Creating a New Migration

### Option 1: Using Supabase CLI (Recommended)

```bash
# Create a new empty migration
npm run db:migration:new my_migration_name

# Or use the CLI directly
npx supabase migration new my_migration_name
```

This creates a timestamped migration file in `supabase/migrations/`.

### Option 2: Generate from Database Diff

If you made changes via the Supabase Dashboard:

```bash
# Pull changes from remote database
npm run db:pull

# Or use the CLI directly
npx supabase db pull
```

This generates a migration based on the difference between your local schema and remote database.

## Applying Migrations

### Local Development

```bash
# Reset local database and apply all migrations + seeds
npm run db:reset

# Or just apply new migrations
npx supabase db push
```

### Production

Migrations are automatically applied when you push to the linked Supabase project:

```bash
# Push migrations to remote database
npm run db:push
```

## Migration Best Practices

1. **Always test locally first**: Run `npm run db:reset` to test migrations on a fresh database
2. **Make migrations reversible**: Consider writing DOWN migrations for rollbacks
3. **Use transactions**: Wrap migration logic in BEGIN/COMMIT blocks when possible
4. **Version control**: Always commit migrations to git
5. **Team workflow**: Pull latest migrations before creating new ones

## Migration File Structure

```sql
-- Migration: Description of what this migration does
-- Created: YYYY-MM-DD

BEGIN;

-- Your migration SQL here
CREATE TABLE IF NOT EXISTS my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can read own data"
  ON my_table FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

COMMIT;
```

## Existing Migrations

- `20250117_fix_security_definer_views.sql` - Security fix for views with RLS
- `20250117_team_collaboration.sql` - Team collaboration features
- `20250117_stripe_billing_system.sql` - Stripe billing integration
- `20250117_enable_password_protection_and_mfa.sql` - Enhanced authentication

## Troubleshooting

### Migration Failed Locally

```bash
# Reset and try again
npm run db:reset
```

### Migration Failed in Production

1. Check the Supabase Dashboard for error logs
2. Fix the migration file
3. Test locally with `npm run db:reset`
4. Push again with `npm run db:push`

### Conflicts with Remote Database

```bash
# Pull latest state from remote
npm run db:pull

# This may create a new migration with the differences
# Review the generated migration carefully before committing
```

## Related Documentation

- [Supabase Migrations Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Local Development Workflow](../docs/LOCAL_DEVELOPMENT.md)
- [Database Setup](../../docs/DATABASE_SETUP.md)

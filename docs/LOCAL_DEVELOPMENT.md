# Local Development with Supabase CLI

This guide covers how to set up and use Supabase locally for development.

## Prerequisites

Before you begin, ensure you have:

- **Docker Desktop** installed and running
- **Node.js** 18+ installed
- **npm** or **yarn** package manager

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs the Supabase CLI as a dev dependency.

### 2. Start Local Supabase

```bash
npm run supabase:start
```

Or use the helper script:

```bash
./scripts/setup-local-db.sh
```

This command will:
- Download and start all Supabase services (Postgres, Auth, Storage, Realtime, etc.)
- Apply all migrations from `supabase/migrations/`
- Load seed data from `supabase/seed.sql`
- Display connection credentials

**First-time setup may take 2-5 minutes** as Docker downloads the required images.

### 3. Access Local Services

Once started, you can access:

| Service | URL | Credentials |
|---------|-----|-------------|
| Studio (Dashboard) | http://localhost:54323 | - |
| API Gateway | http://localhost:54321 | anon key (see status) |
| Database | postgresql://postgres:postgres@localhost:54322/postgres | postgres / postgres |
| Inbucket (Email) | http://localhost:54324 | - |

### 4. Check Status

```bash
npm run supabase:status
```

This shows all running services, ports, and credentials.

### 5. Stop Supabase

```bash
npm run supabase:stop
```

## Development Workflow

### Making Schema Changes

There are two approaches to making database schema changes:

#### Option 1: Create Migration Files (Recommended)

1. **Create a new migration:**

   ```bash
   npm run db:migration:new add_user_roles
   ```

   Or use the helper script:

   ```bash
   ./scripts/create-migration.sh add_user_roles
   ```

2. **Edit the migration file** in `supabase/migrations/`:

   ```sql
   -- Migration: Add user roles
   -- Created: 2025-01-17

   BEGIN;

   CREATE TYPE user_role AS ENUM ('admin', 'user', 'viewer');

   ALTER TABLE users ADD COLUMN role user_role DEFAULT 'user';

   COMMIT;
   ```

3. **Apply the migration:**

   ```bash
   npm run db:reset
   ```

   Or use the helper script:

   ```bash
   ./scripts/reset-local-db.sh
   ```

#### Option 2: Use Studio and Generate Migration

1. **Make changes in Studio:**
   - Open http://localhost:54323
   - Use the Table Editor, SQL Editor, or Database interface
   - Make your changes

2. **Generate migration from changes:**

   ```bash
   npm run db:diff -- -f add_user_roles
   ```

   This creates a migration file with the differences between your local schema and the migration history.

3. **Review and commit** the generated migration.

### Resetting the Database

To completely reset your local database (useful for testing migrations):

```bash
npm run db:reset
```

This will:
1. Drop all database objects
2. Re-apply all migrations in order
3. Load seed data from `supabase/seed.sql`

### Generating TypeScript Types

To get type-safe database queries, generate TypeScript types from your schema:

```bash
npm run types:generate
```

Or use the helper script:

```bash
./scripts/generate-types.sh
```

This creates `src/types/database.types.ts` which you can use:

```typescript
import { Database } from './types/database.types'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient<Database>(url, key)

// Now you get full type safety!
const { data, error } = await supabase
  .from('users')
  .select('*')
```

## Environment Setup

### Local Development (.env.local)

Create a `.env.local` file for local development:

```bash
cp .env.example .env.local
```

Update with local credentials:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhb... # Get from npm run supabase:status
```

### Switching Between Local and Cloud

You can easily switch between local and cloud Supabase:

**For Local:**
```env
VITE_SUPABASE_URL=http://localhost:54321
```

**For Cloud:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
```

## Common Tasks

### View Database Logs

```bash
npx supabase logs db --tail
```

### View Auth Logs

```bash
npx supabase logs auth --tail
```

### Test Email Functionality

1. Open Inbucket at http://localhost:54324
2. Send test emails through your app
3. View them in Inbucket

### Inspect Database

```bash
# Connect to local database
psql postgresql://postgres:postgres@localhost:54322/postgres
```

Or use the Studio SQL Editor at http://localhost:54323

### Run SQL Scripts

```bash
# Run a SQL file
psql postgresql://postgres:postgres@localhost:54322/postgres < script.sql

# Or use the Supabase CLI
npx supabase db execute --file script.sql
```

## Troubleshooting

### Docker Not Running

**Error:** `Docker is not running`

**Solution:** Start Docker Desktop and wait for it to fully start.

### Port Already in Use

**Error:** `Port 54321 already in use`

**Solution:**
```bash
# Stop Supabase
npm run supabase:stop

# Or find and kill the process using the port
lsof -ti:54321 | xargs kill
```

### Migrations Failing

**Error:** Migration fails during `db:reset`

**Solution:**
1. Check migration syntax in the failing file
2. Test SQL in Studio first
3. Ensure migrations are in correct order
4. Check for dependencies between migrations

### Database Out of Sync

If your local database doesn't match migrations:

```bash
# Complete reset
npm run supabase:stop
npm run supabase:start
```

### Can't Connect to Database

**Error:** `Connection refused` or `timeout`

**Solution:**
1. Verify Supabase is running: `npm run supabase:status`
2. Check Docker is running
3. Restart Supabase: `npm run supabase:restart`

## Best Practices

1. **Always test migrations locally** before pushing to production
2. **Commit migrations to git** - they're your database version history
3. **Use seed data** for consistent test data across the team
4. **Generate types regularly** to keep your TypeScript types in sync
5. **Reset often** during development to ensure migrations work on fresh databases
6. **Use transactions** in migrations to ensure atomic changes
7. **Name migrations descriptively** - use verbs like `add_`, `remove_`, `update_`

## Team Collaboration

When working in a team:

1. **Pull latest changes** before creating new migrations:
   ```bash
   git pull
   npm run db:reset
   ```

2. **Create your migration** based on the latest schema:
   ```bash
   npm run db:migration:new your_feature
   ```

3. **Test thoroughly** and commit:
   ```bash
   npm run db:reset
   git add supabase/migrations/
   git commit -m "Add your_feature migration"
   ```

4. **Communicate** with team about major schema changes

## Advanced Topics

### Custom Postgres Configuration

Edit `supabase/config.toml` to customize Postgres settings:

```toml
[db]
port = 54322
major_version = 17
```

### Custom Seed Data

Edit `supabase/seed.sql` to add development data:

```sql
-- Add your development data
INSERT INTO users (email, role) VALUES
  ('dev@example.com', 'admin');
```

### Edge Functions

Edge Functions are in `supabase/functions/`. Test locally:

```bash
npx supabase functions serve
```

## Next Steps

- [Database Migrations Guide](./DATABASE_MIGRATIONS.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [TypeScript Types Usage](./TYPESCRIPT_TYPES.md)

## Resources

- [Supabase Local Development Docs](https://supabase.com/docs/guides/cli/local-development)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)

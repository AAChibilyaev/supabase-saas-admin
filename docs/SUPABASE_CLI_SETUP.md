# Supabase CLI Setup Guide

This guide covers setting up and using Supabase CLI for local development, migrations, and type generation.

## Prerequisites

- Node.js 18+ installed
- Docker Desktop installed (for local Supabase)
- Supabase account
- Access to your Supabase project

---

## Step 1: Install Supabase CLI

### Option 1: Via npm (Recommended)

```bash
npm install -g supabase
```

### Option 2: Via Homebrew (macOS)

```bash
brew install supabase/tap/supabase
```

### Option 3: Via Scoop (Windows)

```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Verify Installation

```bash
supabase --version
```

---

## Step 2: Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate. After successful login, your access token will be stored locally.

---

## Step 3: Link Your Project

### Get Your Project Reference ID

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **General**
3. Find **Reference ID** (e.g., `kuxbzqpyesjdhxhnauzs`)

### Link the Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with your actual project reference ID.

**Example:**
```bash
supabase link --project-ref kuxbzqpyesjdhxhnauzs
```

---

## Step 4: Verify Configuration

The project already has `supabase/config.toml` configured. Verify it exists:

```bash
cat supabase/config.toml
```

Key settings in the config:
- `project_id`: "supabase-admin"
- `db.major_version`: 17
- `api.port`: 54321
- `db.port`: 54322

---

## Step 5: Pull Existing Migrations

If you have existing migrations in your Supabase project, pull them:

```bash
npm run db:pull
# or
supabase db pull
```

This will create migration files in `supabase/migrations/` based on your remote database schema.

---

## Step 6: Local Development (Optional)

### Start Local Supabase

```bash
npm run supabase:start
# or
supabase start
```

This starts:
- PostgreSQL database (port 54322)
- Supabase API (port 54321)
- Supabase Studio (port 54323)
- Inbucket (email testing, port 54324)

### Check Status

```bash
npm run supabase:status
# or
supabase status
```

### Stop Local Supabase

```bash
npm run supabase:stop
# or
supabase stop
```

### Reset Local Database

```bash
npm run db:reset
# or
supabase db reset
```

This applies all migrations and runs seed files.

---

## Available npm Scripts

The project includes the following scripts in `package.json`:

### Supabase Management

```bash
npm run supabase:start      # Start local Supabase
npm run supabase:stop       # Stop local Supabase
npm run supabase:status     # Check status
npm run supabase:restart    # Restart local Supabase
npm run supabase:link       # Link to remote project
npm run supabase:login      # Login to Supabase
```

### Database Operations

```bash
npm run db:reset            # Reset local DB (applies migrations + seeds)
npm run db:push              # Push migrations to remote
npm run db:pull              # Pull schema from remote
npm run db:migration:new     # Create new migration
npm run db:migration:up      # Apply pending migrations
npm run db:diff              # Show differences between local and remote
```

### Type Generation

```bash
npm run types:generate       # Generate types from local DB
npm run types:generate:remote # Generate types from remote DB
npm run types:check          # Check TypeScript types
```

---

## Working with Migrations

### Create a New Migration

```bash
npm run db:migration:new migration_name
# or
supabase migration new migration_name
```

This creates a timestamped file in `supabase/migrations/`:
- Format: `YYYYMMDDHHMMSS_migration_name.sql`

### Apply Migrations Locally

```bash
npm run db:reset  # Applies all migrations from scratch
# or
supabase migration up  # Applies pending migrations
```

### Push Migrations to Remote

```bash
npm run db:push
# or
supabase db push
```

**Important:** Always test migrations locally before pushing to production!

### Pull Schema Changes

If you made changes via Supabase Dashboard:

```bash
npm run db:pull
# or
supabase db pull
```

This generates a migration based on differences.

---

## Type Generation

### Generate Types from Remote Database

```bash
npm run types:generate:remote
# or
supabase gen types typescript --linked > src/types/database.types.ts
```

### Generate Types from Local Database

```bash
npm run types:generate
# or
supabase gen types typescript --local > src/types/database.types.ts
```

### Using Generated Types

```typescript
import { Database } from './types/database.types'

type Tenant = Database['public']['Tables']['tenants']['Row']
type TenantInsert = Database['public']['Tables']['tenants']['Insert']
type TenantUpdate = Database['public']['Tables']['tenants']['Update']
```

---

## Edge Functions

### Deploy Edge Function

```bash
supabase functions deploy function-name
```

### Test Edge Function Locally

```bash
supabase functions serve function-name
```

### List Edge Functions

```bash
supabase functions list
```

---

## Best Practices

### 1. Always Test Locally First

```bash
# 1. Create migration
npm run db:migration:new my_feature

# 2. Edit migration file
# ... make changes ...

# 3. Test locally
npm run db:reset

# 4. If OK, push to remote
npm run db:push
```

### 2. Version Control Migrations

- Always commit migration files to git
- Never edit existing migrations (create new ones)
- Use descriptive migration names

### 3. Type Generation Workflow

```bash
# After schema changes:
npm run db:push              # Apply migrations
npm run types:generate:remote # Generate types
git add src/types/database.types.ts
git commit -m "chore: update database types"
```

### 4. Migration Naming

Use descriptive names:
- ✅ `20250117_add_user_roles.sql`
- ✅ `20250117_fix_security_definer_views.sql`
- ❌ `migration1.sql`
- ❌ `update.sql`

---

## Troubleshooting

### "Project not linked"

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### "Migration conflicts"

```bash
# Pull latest from remote
npm run db:pull

# Review conflicts and resolve
# Then create new migration if needed
```

### "Types out of sync"

```bash
# Regenerate types
npm run types:generate:remote

# Check for TypeScript errors
npm run types:check
```

### "Local Supabase won't start"

1. Check Docker is running
2. Check ports are available (54321, 54322, 54323, 54324)
3. Try restarting:
   ```bash
   npm run supabase:stop
   npm run supabase:start
   ```

### "Permission denied"

Make sure you're logged in:
```bash
supabase login
```

---

## Project Structure

```
supabase/
├── config.toml              # Supabase configuration
├── migrations/              # Database migrations
│   ├── 20250117_*.sql
│   └── ...
├── functions/               # Edge Functions
│   ├── function-name/
│   │   └── index.ts
│   └── ...
└── seed.sql                # Seed data (optional)
```

---

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Local Development Guide](https://supabase.com/docs/guides/cli/local-development)
- [Migrations Guide](https://supabase.com/docs/guides/cli/managing-migrations)
- [Type Generation](https://supabase.com/docs/guides/api/rest/generating-types)

---

**Last Updated:** 2025-01-17
**Status:** Ready for use

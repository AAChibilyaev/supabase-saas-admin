# Supabase CLI Setup and Usage Guide

Complete guide for setting up and using Supabase CLI for local development and database management.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Initial Setup](#initial-setup)
- [Available Commands](#available-commands)
- [Helper Scripts](#helper-scripts)
- [Common Workflows](#common-workflows)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have:

### Required

- **Node.js** 18 or higher
  ```bash
  node --version  # Should be v18+
  ```

- **Docker Desktop** (for local Supabase)
  - Download from https://www.docker.com/products/docker-desktop
  - Ensure Docker is running before starting Supabase

- **Git** (for version control)
  ```bash
  git --version
  ```

### Recommended

- **psql** (PostgreSQL client) for database inspection
- **VS Code** with recommended extensions:
  - PostgreSQL
  - Supabase
  - Thunder Client (for API testing)

## Installation

The Supabase CLI is already included as a dev dependency. Just run:

```bash
npm install
```

This installs all dependencies including the Supabase CLI.

### Verify Installation

```bash
npx supabase --version
```

You should see the version number (e.g., `2.58.5`).

## Initial Setup

### 1. Start Local Supabase

```bash
npm run supabase:start
```

**First time?** This will:
- Download Docker images (2-5 minutes)
- Start all Supabase services
- Apply migrations from `supabase/migrations/`
- Load seed data from `supabase/seed.sql`

You should see output like:

```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Configure Environment Variables

Create a `.env.local` file for local development:

```bash
cp .env.example .env.local
```

Update with local credentials:

```env
# Local Supabase (from supabase:status output)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Keep other services as configured
VITE_TYPESENSE_URL=http://localhost:8108
VITE_TYPESENSE_API_KEY=your-api-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Start Development Server

```bash
npm run dev
```

Your app now connects to local Supabase!

### 4. Access Supabase Studio

Open http://localhost:54323 to access the Supabase Studio dashboard where you can:
- Browse tables and data
- Run SQL queries
- Manage authentication
- View logs
- Configure storage

## Available Commands

### Supabase Lifecycle

| Command | Description |
|---------|-------------|
| `npm run supabase:start` | Start all Supabase services |
| `npm run supabase:stop` | Stop all Supabase services |
| `npm run supabase:restart` | Restart Supabase services |
| `npm run supabase:status` | Show running services and credentials |

### Database Management

| Command | Description |
|---------|-------------|
| `npm run db:reset` | Drop database, re-run migrations, load seeds |
| `npm run db:push` | Push migrations to remote database |
| `npm run db:pull` | Pull schema from remote database |
| `npm run db:diff -- -f name` | Generate migration from database differences |

### Migration Management

| Command | Description |
|---------|-------------|
| `npm run db:migration:new name` | Create a new empty migration |
| `npm run db:migration:up` | Apply pending migrations |

### Type Generation

| Command | Description |
|---------|-------------|
| `npm run types:generate` | Generate TypeScript types from local database |
| `npm run types:generate:remote` | Generate types from remote database |

### Authentication

| Command | Description |
|---------|-------------|
| `npm run supabase:login` | Login to Supabase account |
| `npm run supabase:link` | Link project to cloud instance |

## Helper Scripts

We've created several helper scripts in the `scripts/` directory:

### setup-local-db.sh

Complete setup for local development:

```bash
./scripts/setup-local-db.sh
```

This script:
- Checks Docker is running
- Verifies Supabase CLI is installed
- Stops any existing instances
- Starts fresh Supabase instance
- Displays connection info

### create-migration.sh

Create a new database migration:

```bash
./scripts/create-migration.sh add_user_preferences
```

Creates a timestamped migration file and provides next steps.

### reset-local-db.sh

Reset database with confirmation:

```bash
./scripts/reset-local-db.sh
```

Prompts for confirmation before resetting (safety feature).

### generate-types.sh

Generate TypeScript types with options:

```bash
# Generate from local database
./scripts/generate-types.sh

# Generate from remote database
./scripts/generate-types.sh remote
```

## Common Workflows

### Daily Development

```bash
# 1. Start of day - pull latest changes
git pull
npm run db:reset

# 2. Start Supabase (if not running)
npm run supabase:start

# 3. Start dev server
npm run dev

# 4. Make changes, test, commit

# 5. End of day - stop Supabase (optional)
npm run supabase:stop
```

### Creating a New Feature with Database Changes

```bash
# 1. Create feature branch
git checkout -b feature/user-profiles

# 2. Create migration
./scripts/create-migration.sh add_user_profiles

# 3. Edit migration file
# supabase/migrations/YYYYMMDD_add_user_profiles.sql

# 4. Test migration
npm run db:reset

# 5. Generate types
npm run types:generate

# 6. Implement feature using types

# 7. Test thoroughly

# 8. Commit
git add supabase/migrations/ src/types/
git commit -m "Add user profiles feature"

# 9. Push to remote
git push origin feature/user-profiles

# 10. Create PR
```

### Deploying to Production

```bash
# 1. Ensure you're on main branch
git checkout main
git pull

# 2. Login to Supabase (if not already)
npm run supabase:login

# 3. Link to project (if not already)
npm run supabase:link

# 4. Push migrations
npm run db:push

# 5. Generate types from production
npm run types:generate:remote

# 6. Deploy application
npm run build
# Deploy build/ to your hosting service
```

### Syncing with Remote Database

```bash
# Pull schema changes from production
npm run db:pull

# This generates migrations based on remote schema
# Review the generated migrations carefully!

# Test locally
npm run db:reset

# Commit if correct
git add supabase/migrations/
git commit -m "Sync with remote database schema"
```

## Troubleshooting

### Docker Not Running

**Symptom:** `Cannot connect to Docker daemon`

**Solution:**
```bash
# Start Docker Desktop
# Wait for it to fully start (icon in system tray)
# Then try again
npm run supabase:start
```

### Port Conflicts

**Symptom:** `Port 54321 already in use`

**Solutions:**

1. Check if Supabase is already running:
   ```bash
   npm run supabase:status
   ```

2. Stop existing instance:
   ```bash
   npm run supabase:stop
   ```

3. Find and kill conflicting process:
   ```bash
   # macOS/Linux
   lsof -ti:54321 | xargs kill

   # Windows
   netstat -ano | findstr :54321
   taskkill /PID <PID> /F
   ```

### Migration Errors

**Symptom:** `Migration failed at ...`

**Solutions:**

1. Check migration syntax:
   - Review the failing migration file
   - Test SQL in Studio first
   - Check for typos

2. Check migration order:
   - Ensure migrations have correct timestamps
   - Check for dependencies

3. Reset and retry:
   ```bash
   npm run db:reset
   ```

### Database Out of Sync

**Symptom:** Local database doesn't match migrations

**Solution:**
```bash
# Complete reset
npm run supabase:stop
npm run supabase:start
```

### Type Generation Fails

**Symptom:** `Error generating types`

**Solutions:**

1. Ensure Supabase is running:
   ```bash
   npm run supabase:status
   ```

2. Check database connection:
   ```bash
   psql postgresql://postgres:postgres@localhost:54322/postgres
   ```

3. Ensure types directory exists:
   ```bash
   mkdir -p src/types
   ```

### Can't Connect to Studio

**Symptom:** `localhost:54323 refused to connect`

**Solutions:**

1. Check Supabase is running:
   ```bash
   npm run supabase:status
   ```

2. Restart Supabase:
   ```bash
   npm run supabase:restart
   ```

3. Check browser console for errors

### Slow First Start

**Symptom:** First `supabase:start` takes forever

**Explanation:** Docker is downloading images (2-5 GB). This only happens once.

**Solution:** Be patient, let it complete. Subsequent starts are much faster.

## Project Structure

After setup, your project structure includes:

```
supabase-admin/
├── supabase/
│   ├── config.toml           # Supabase configuration
│   ├── seed.sql              # Seed data for local development
│   ├── migrations/           # Database migrations
│   │   ├── 20250117_*.sql   # Migration files
│   │   └── README.md        # Migration documentation
│   ├── functions/            # Edge functions
│   └── .temp/               # Temporary files (ignored)
├── scripts/
│   ├── setup-local-db.sh    # Setup helper
│   ├── create-migration.sh  # Migration helper
│   ├── reset-local-db.sh    # Reset helper
│   └── generate-types.sh    # Type generation helper
├── src/
│   └── types/
│       └── database.types.ts # Generated database types
├── docs/
│   ├── SUPABASE_CLI_SETUP.md      # This file
│   ├── LOCAL_DEVELOPMENT.md       # Local dev guide
│   └── DATABASE_MIGRATIONS.md     # Migration guide
├── package.json             # NPM scripts
└── .env.example            # Environment template
```

## Best Practices

1. **Always test migrations locally** before pushing to production
2. **Use transactions** in migration files for atomic changes
3. **Generate types** after schema changes for type safety
4. **Commit migrations** to version control
5. **Document migrations** with comments
6. **Reset database regularly** to ensure migrations work on fresh DBs
7. **Use seed data** for consistent test data
8. **Stop Supabase** when not developing to save resources

## Next Steps

Now that you have Supabase CLI set up:

1. Read the [Local Development Guide](./LOCAL_DEVELOPMENT.md)
2. Learn about [Database Migrations](./DATABASE_MIGRATIONS.md)
3. Explore the [Supabase Studio](http://localhost:54323)
4. Try creating your first migration
5. Generate TypeScript types and use them in your code

## Resources

### Official Documentation
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)

### Project Documentation
- [README.md](../README.md) - Project overview
- [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) - Development workflow
- [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md) - Migration patterns

### Community
- [Supabase Discord](https://discord.supabase.com/)
- [GitHub Discussions](https://github.com/supabase/supabase/discussions)
- [Supabase Twitter](https://twitter.com/supabase)

## Support

Having issues? Try these resources:

1. Check this guide's [Troubleshooting](#troubleshooting) section
2. Review the [Local Development Guide](./LOCAL_DEVELOPMENT.md)
3. Check [Supabase Docs](https://supabase.com/docs)
4. Ask in team chat
5. Search [GitHub Issues](https://github.com/supabase/supabase/issues)
6. Ask in [Supabase Discord](https://discord.supabase.com/)

---

**Happy developing with Supabase CLI!** 🚀

# Helper Scripts

This directory contains helper scripts for common Supabase CLI operations.

## Available Scripts

### setup-local-db.sh

Complete setup and start of local Supabase environment.

**Usage:**
```bash
./scripts/setup-local-db.sh
```

**What it does:**
- Checks if Docker is running
- Verifies Supabase CLI is installed
- Stops any existing Supabase instances
- Starts fresh Supabase instance
- Displays connection information and URLs

**When to use:**
- First time setup
- Starting a new development session
- After system restart

---

### create-migration.sh

Create a new database migration with proper naming and helpful next steps.

**Usage:**
```bash
./scripts/create-migration.sh <migration_name>
```

**Example:**
```bash
./scripts/create-migration.sh add_user_preferences
```

**What it does:**
- Creates timestamped migration file in `supabase/migrations/`
- Displays the file path
- Shows next steps for editing and applying

**When to use:**
- Adding new tables
- Modifying existing schema
- Creating functions or triggers
- Any database schema changes

---

### reset-local-db.sh

Reset local database with safety confirmation.

**Usage:**
```bash
./scripts/reset-local-db.sh
```

**What it does:**
- Prompts for confirmation (safety feature)
- Drops all database objects
- Re-applies all migrations in order
- Loads seed data from `supabase/seed.sql`

**When to use:**
- Testing migrations on fresh database
- Recovering from database issues
- Ensuring migrations work from scratch
- Updating seed data

**Warning:** This drops all local data. Only use in development!

---

### generate-types.sh

Generate TypeScript types from database schema.

**Usage:**
```bash
# Generate from local database
./scripts/generate-types.sh

# Generate from remote database
./scripts/generate-types.sh remote
```

**What it does:**
- Creates/updates `src/types/database.types.ts`
- Generates TypeScript types for all tables, views, and functions
- Enables full type safety in your code

**When to use:**
- After creating/modifying migrations
- After pulling schema changes
- When types are out of sync with database

---

## Script Requirements

All scripts require:
- **Bash** shell (macOS, Linux, WSL, or Git Bash on Windows)
- **Node.js** and npm installed
- **Supabase CLI** installed (`npm install` in project root)
- **Docker** running (for database operations)

## Making Scripts Executable

If you get permission errors:

```bash
chmod +x scripts/*.sh
```

## NPM Script Equivalents

Most scripts have equivalent npm commands:

| Script | NPM Command |
|--------|-------------|
| `setup-local-db.sh` | `npm run supabase:start` |
| `create-migration.sh name` | `npm run db:migration:new name` |
| `reset-local-db.sh` | `npm run db:reset` |
| `generate-types.sh` | `npm run types:generate` |

The helper scripts provide:
- Better error messages
- Safety confirmations
- Colored output
- Next step instructions
- Prerequisite checks

## Customization

Feel free to customize these scripts for your workflow:

1. Copy a script
2. Modify as needed
3. Add to your personal `.gitignore` if project-specific
4. Or commit if useful for the team

## Examples

### Daily Development Workflow

```bash
# Start of day
./scripts/setup-local-db.sh

# Create a new feature
git checkout -b feature/notifications
./scripts/create-migration.sh add_notifications_table

# Edit migration, then test
./scripts/reset-local-db.sh

# Generate types
./scripts/generate-types.sh

# Develop, test, commit
git add .
git commit -m "Add notifications feature"
```

### Testing Migration Flow

```bash
# Reset to test migrations from scratch
./scripts/reset-local-db.sh

# Make changes via Studio
# http://localhost:54323

# Generate migration from changes
npm run db:diff -- -f capture_changes

# Test the generated migration
./scripts/reset-local-db.sh
```

## Troubleshooting

### Script Not Found

```bash
# Make sure you're in project root
cd /path/to/supabase-admin

# Try with ./
./scripts/setup-local-db.sh
```

### Permission Denied

```bash
# Make executable
chmod +x scripts/*.sh

# Then run
./scripts/setup-local-db.sh
```

### Docker Not Running

```bash
# Start Docker Desktop first
# Wait for it to fully start
# Then run the script
./scripts/setup-local-db.sh
```

## Contributing

To add a new helper script:

1. Create the script in this directory
2. Add the shebang: `#!/bin/bash`
3. Add `set -e` for error handling
4. Use colored output for better UX
5. Add comments explaining what it does
6. Make it executable: `chmod +x scripts/your-script.sh`
7. Document it in this README
8. Test thoroughly
9. Commit and create PR

## Related Documentation

- [Supabase CLI Setup Guide](../docs/SUPABASE_CLI_SETUP.md)
- [Local Development Guide](../docs/LOCAL_DEVELOPMENT.md)
- [Database Migrations Guide](../docs/DATABASE_MIGRATIONS.md)

---

**Questions?** Check the [docs](../docs/) or ask the team!

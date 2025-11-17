# CI/CD Pipeline Setup Guide

This guide explains how to set up and configure the CI/CD pipeline using GitHub Actions.

## Overview

The project includes automated CI/CD pipelines for:
- Testing and validation
- Automatic deployment to staging and production
- Code quality checks
- Database migrations

---

## Workflows

### 1. Test and Validate (`test.yml`)

**Purpose:** Run tests and validation on every PR and push

**Triggers:**
- Pull requests to `main` or `develop`
- Push to `main` or `develop`

**Jobs:**
- Lint code with ESLint
- Type check with TypeScript
- Build application
- Run tests
- Security scan with npm audit

**Location:** `.github/workflows/test.yml`

### 2. Deploy (`deploy.yml`)

**Purpose:** Deploy to staging and production

**Triggers:**
- Push to `main` (production)
- Push to `develop` (staging)
- Manual workflow dispatch

**Jobs:**
- Deploy to Staging (on `develop` branch)
- Deploy to Production (on `main` branch)
- Post-deployment health checks

**Location:** `.github/workflows/deploy.yml`

### 3. Code Quality (`quality.yml`)

**Purpose:** Weekly code quality analysis

**Triggers:**
- Pull requests
- Push to main branches
- Weekly schedule (Monday 9 AM UTC)

**Jobs:**
- ESLint analysis
- TypeScript strict check
- Dependency review
- Code coverage
- Bundle size check

**Location:** `.github/workflows/quality.yml`

### 4. Database Migrations (`migrations.yml`)

**Purpose:** Apply database migrations

**Triggers:**
- Push to `main` or `develop` with migration changes
- Manual workflow dispatch

**Jobs:**
- Validate migrations
- Migrate staging
- Migrate production (with backup)

**Location:** `.github/workflows/migrations.yml`

---

## Required GitHub Secrets

Configure these in: **Settings** → **Secrets and variables** → **Actions**

### Vercel Secrets

```bash
VERCEL_TOKEN              # Vercel authentication token
VERCEL_ORG_ID            # Your Vercel organization ID
VERCEL_PROJECT_ID        # Your Vercel project ID
```

**How to get:**
1. Go to Vercel Dashboard → Settings → Tokens
2. Create new token with deployment permissions
3. Get org and project IDs from project settings

### Supabase Secrets (Production)

```bash
VITE_SUPABASE_URL        # Production Supabase URL
VITE_SUPABASE_ANON_KEY   # Production anon key
DATABASE_URL             # Production database URL
SUPABASE_ACCESS_TOKEN    # Supabase CLI token
```

### Supabase Secrets (Staging)

```bash
STAGING_SUPABASE_URL         # Staging Supabase URL
STAGING_SUPABASE_ANON_KEY    # Staging anon key
STAGING_DATABASE_URL         # Staging database URL
```

### Typesense Secrets

```bash
VITE_TYPESENSE_HOST       # Production Typesense host
VITE_TYPESENSE_API_KEY    # Production Typesense API key
STAGING_TYPESENSE_HOST    # Staging Typesense host
STAGING_TYPESENSE_API_KEY # Staging Typesense API key
```

### Stripe Secrets

```bash
VITE_STRIPE_PUBLISHABLE_KEY    # Production Stripe public key
STAGING_STRIPE_PUBLISHABLE_KEY # Staging Stripe public key
```

### Sentry Secrets (Optional)

```bash
VITE_SENTRY_DSN          # Sentry DSN
VITE_SENTRY_ORG          # Sentry organization
VITE_SENTRY_PROJECT      # Sentry project
SENTRY_AUTH_TOKEN        # For source maps upload
```

---

## Setting Up Secrets

### Via GitHub UI

1. Go to your repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add name and value
5. Click **Add secret**

### Via GitHub CLI

```bash
gh secret set VERCEL_TOKEN
gh secret set VITE_SUPABASE_URL
# ... etc
```

---

## Environment-Specific Secrets

Secrets can be scoped to specific environments:

- **Production**: Default secret names
- **Staging**: Prefixed with `STAGING_`

In workflow files, use environment contexts:

```yaml
env:
  name: staging
  url: https://staging.example.com
```

---

## Deployment Process

### Automatic Staging Deployment

1. Merge PR to `develop` branch
2. GitHub Actions automatically:
   - Runs tests
   - Builds with staging env vars
   - Deploys to Vercel staging
   - Runs health checks

### Automatic Production Deployment

1. Merge `develop` to `main` branch
2. GitHub Actions automatically:
   - Runs comprehensive checks
   - Creates database backup
   - Builds with production env vars
   - Deploys to Vercel production
   - Creates deployment tag
   - Runs health checks

### Manual Deployment

1. Go to **Actions** tab in GitHub
2. Select **Deploy** workflow
3. Click **Run workflow**
4. Select environment (staging/production)
5. Click **Run workflow**

---

## Workflow Configuration

### Update Workflow Files

Workflows are in `.github/workflows/`:

- `test.yml` - Testing and validation
- `deploy.yml` - Deployment
- `quality.yml` - Code quality
- `migrations.yml` - Database migrations

### Customize Workflows

Edit workflow files to:
- Change triggers
- Add new jobs
- Modify deployment steps
- Add notifications

---

## Troubleshooting

### Workflow Fails on Secrets

**Problem:** Workflow fails with "secret not found"

**Solution:**
1. Check secret name matches workflow
2. Verify secret is set in repository settings
3. Check secret is available for the environment

### Build Fails

**Problem:** Build fails in CI but works locally

**Solution:**
1. Check environment variables are set
2. Verify Node.js version matches
3. Check for platform-specific issues
4. Review build logs for errors

### Deployment Fails

**Problem:** Deployment to Vercel fails

**Solution:**
1. Verify Vercel secrets are correct
2. Check Vercel project exists
3. Verify Vercel token has correct permissions
4. Check Vercel deployment logs

### Migration Fails

**Problem:** Database migration fails

**Solution:**
1. Check Supabase credentials
2. Verify migration SQL is valid
3. Check for database locks
4. Review migration logs

---

## Best Practices

### 1. Test Locally First

Always test changes locally before pushing:

```bash
npm run lint
npm run types:check
npm run build
```

### 2. Use Branch Protection

Enable branch protection for `main`:
- Require PR reviews
- Require status checks
- Require up-to-date branches

### 3. Monitor Workflows

- Check workflow runs regularly
- Set up notifications for failures
- Review deployment logs

### 4. Keep Secrets Secure

- Never commit secrets to git
- Rotate secrets regularly
- Use environment-specific secrets
- Limit secret access

### 5. Use Deployment Environments

Configure environments in GitHub:
- Staging
- Production

This allows:
- Environment-specific secrets
- Deployment approvals
- Environment protection rules

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel GitHub Integration](https://vercel.com/docs/concepts/git)
- [Supabase CI/CD Guide](https://supabase.com/docs/guides/cli/ci-cd)

---

**Last Updated:** 2025-01-17
**Status:** Ready for use


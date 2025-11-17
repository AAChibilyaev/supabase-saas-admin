# Deployment Guide

## Overview

This document describes the CI/CD pipeline and deployment processes for the Supabase Admin application.

## Table of Contents

- [Architecture](#architecture)
- [Environments](#environments)
- [GitHub Actions Workflows](#github-actions-workflows)
- [Deployment Process](#deployment-process)
- [Secrets Management](#secrets-management)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

## Architecture

The application uses a multi-environment deployment strategy with automated CI/CD pipelines:

```
┌─────────────────┐
│   Developer     │
│   Push Code     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GitHub Actions │
│   CI Pipeline   │
├─────────────────┤
│ - Lint          │
│ - Type Check    │
│ - Build         │
│ - Test          │
│ - Security Scan │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Deployment    │
├─────────────────┤
│ - Staging       │
│ - Production    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Vercel + DB    │
│   Migration     │
└─────────────────┘
```

## Environments

### Staging

- **Branch**: `develop`
- **URL**: `https://staging.supabase-admin.vercel.app`
- **Purpose**: Testing and QA before production
- **Auto-Deploy**: Yes, on push to `develop`
- **Database**: Staging Supabase instance

### Production

- **Branch**: `main`
- **URL**: `https://supabase-admin.vercel.app`
- **Purpose**: Live production environment
- **Auto-Deploy**: Yes, on push to `main`
- **Database**: Production Supabase instance
- **Protection**: Branch protection rules enabled

## GitHub Actions Workflows

### 1. Test and Validate (`test.yml`)

**Triggers:**
- Pull requests to `main` or `develop`
- Push to `main` or `develop`

**Jobs:**
- **Lint**: ESLint code quality checks
- **Type Check**: TypeScript compilation validation
- **Build**: Application build verification
- **Test**: Run test suite
- **Security Scan**: npm audit and vulnerability scanning

**Usage:**
```bash
# Automatically runs on PR creation
# View results in GitHub Actions tab
```

### 2. Deploy (`deploy.yml`)

**Triggers:**
- Push to `main` (production)
- Push to `develop` (staging)
- Manual workflow dispatch

**Jobs:**
- **Deploy Staging**: Deploys to staging environment
- **Deploy Production**: Deploys to production with checks
- **Post-Deployment Checks**: Health and performance validation

**Manual Deployment:**
```bash
# Via GitHub UI:
# 1. Go to Actions > Deploy
# 2. Click "Run workflow"
# 3. Select environment (staging/production)
# 4. Click "Run workflow"
```

### 3. Code Quality (`quality.yml`)

**Triggers:**
- Pull requests
- Push to main branches
- Weekly schedule (Monday 9 AM UTC)

**Jobs:**
- **ESLint Analysis**: Detailed linting with reports
- **TypeScript Strict Check**: Type safety validation
- **Dependency Review**: Security review of dependencies
- **Code Coverage**: Test coverage analysis
- **Bundle Size Check**: Build size monitoring
- **Code Smells Detection**: Anti-pattern detection
- **Accessibility Check**: a11y validation

### 4. Database Migrations (`migrations.yml`)

**Triggers:**
- Push to `main` or `develop` with migration changes
- Manual workflow dispatch

**Jobs:**
- **Validate Migrations**: SQL syntax and safety checks
- **Migrate Staging**: Apply migrations to staging DB
- **Migrate Production**: Apply migrations to production DB with backup
- **Post-Migration Checks**: Verification and health checks

**Manual Migration:**
```bash
# Via GitHub UI:
# 1. Go to Actions > Database Migrations
# 2. Click "Run workflow"
# 3. Select environment
# 4. Toggle dry_run if needed
# 5. Click "Run workflow"
```

## Deployment Process

### Staging Deployment

1. **Merge PR to `develop`**
   ```bash
   git checkout develop
   git pull origin develop
   git merge feature/your-feature
   git push origin develop
   ```

2. **Automatic Process**
   - GitHub Actions triggers
   - Runs all quality checks
   - Builds application with staging env vars
   - Deploys to Vercel staging
   - Runs post-deployment checks

3. **Verification**
   - Check deployment logs in Actions tab
   - Visit staging URL
   - Test functionality
   - Review deployment summary

### Production Deployment

1. **Merge `develop` to `main`**
   ```bash
   git checkout main
   git pull origin main
   git merge develop
   git push origin main
   ```

2. **Automatic Process**
   - GitHub Actions triggers
   - Runs comprehensive checks:
     - Lint
     - Type checking
     - Build validation
   - Creates database backup
   - Applies database migrations
   - Deploys to Vercel production
   - Creates deployment tag
   - Runs health checks

3. **Monitoring**
   - Monitor GitHub Actions logs
   - Check Vercel deployment status
   - Review application health
   - Monitor error tracking (if configured)

### Manual Deployment

For emergency deployments or specific scenarios:

```bash
# 1. Via GitHub Actions UI (recommended)
Actions > Deploy > Run workflow

# 2. Using Vercel CLI (emergency only)
npx vercel --prod
```

## Secrets Management

### Required GitHub Secrets

Configure these in: `Settings > Secrets and variables > Actions`

#### Vercel Secrets

```bash
VERCEL_TOKEN              # Vercel authentication token
VERCEL_ORG_ID            # Your Vercel organization ID
VERCEL_PROJECT_ID        # Your Vercel project ID
```

**How to get:**
1. Go to Vercel Dashboard > Settings > Tokens
2. Create new token with deployment permissions
3. Get org and project IDs from project settings

#### Supabase Secrets (Production)

```bash
VITE_SUPABASE_URL        # Production Supabase URL
VITE_SUPABASE_ANON_KEY   # Production anon key
DATABASE_URL             # Production database URL
SUPABASE_ACCESS_TOKEN    # Supabase CLI token
```

#### Supabase Secrets (Staging)

```bash
STAGING_SUPABASE_URL         # Staging Supabase URL
STAGING_SUPABASE_ANON_KEY    # Staging anon key
STAGING_DATABASE_URL         # Staging database URL
```

#### Stripe Secrets

```bash
VITE_STRIPE_PUBLIC_KEY           # Production Stripe public key
STAGING_STRIPE_PUBLIC_KEY        # Staging Stripe public key
```

#### Typesense Secrets

```bash
VITE_TYPESENSE_HOST       # Production Typesense host
VITE_TYPESENSE_API_KEY    # Production Typesense API key
STAGING_TYPESENSE_HOST    # Staging Typesense host
STAGING_TYPESENSE_API_KEY # Staging Typesense API key
```

#### Optional Secrets

```bash
CODECOV_TOKEN            # For code coverage reporting
```

### Adding Secrets

```bash
# Via GitHub UI:
1. Go to repository Settings
2. Secrets and variables > Actions
3. Click "New repository secret"
4. Add name and value
5. Click "Add secret"

# Via GitHub CLI:
gh secret set VERCEL_TOKEN
gh secret set VITE_SUPABASE_URL
```

### Environment-Specific Secrets

Secrets are organized by environment:
- **Production**: Default secret names
- **Staging**: Prefixed with `STAGING_`

## Rollback Procedures

See [ROLLBACK.md](./ROLLBACK.md) for detailed rollback procedures.

### Quick Rollback Steps

1. **Identify the issue**
   - Check error logs
   - Review deployment summary
   - Check health checks

2. **Rollback via Vercel**
   ```bash
   # Via Vercel Dashboard:
   1. Go to Deployments
   2. Find previous working deployment
   3. Click "Promote to Production"

   # Via Vercel CLI:
   vercel rollback
   ```

3. **Rollback database (if needed)**
   ```bash
   # Restore from backup
   # See ROLLBACK.md for detailed steps
   ```

4. **Verify rollback**
   - Check application health
   - Test critical functionality
   - Monitor error rates

## Troubleshooting

### Build Failures

**Problem**: Build fails in GitHub Actions

**Solutions:**
1. Check build logs in Actions tab
2. Verify environment variables are set
3. Run build locally:
   ```bash
   npm ci
   npm run build
   ```
4. Check for TypeScript errors
5. Verify dependencies are compatible

### Deployment Failures

**Problem**: Vercel deployment fails

**Solutions:**
1. Check Vercel deployment logs
2. Verify Vercel secrets are set correctly
3. Check build configuration in `vite.config.ts`
4. Ensure build size is within limits
5. Review Vercel project settings

### Migration Failures

**Problem**: Database migrations fail

**Solutions:**
1. Review migration SQL syntax
2. Check database connectivity
3. Verify Supabase credentials
4. Run dry-run first:
   ```bash
   Actions > Database Migrations > Run workflow (dry_run: true)
   ```
5. Check for conflicting migrations
6. Review database locks

### Environment Variable Issues

**Problem**: Application doesn't work after deployment

**Solutions:**
1. Verify all required secrets are set
2. Check secret names match code references
3. Review build logs for missing variables
4. Test with `.env.example` values locally
5. Ensure secrets don't have trailing spaces

### Permission Errors

**Problem**: GitHub Actions can't push tags or access resources

**Solutions:**
1. Check repository settings > Actions > General
2. Ensure "Read and write permissions" is enabled
3. Verify branch protection rules
4. Check personal access token permissions

## Best Practices

### Pre-Deployment Checklist

- [ ] All tests pass locally
- [ ] Code is linted and formatted
- [ ] TypeScript compiles without errors
- [ ] Dependencies are up to date
- [ ] Environment variables documented
- [ ] Database migrations tested
- [ ] Breaking changes documented

### Post-Deployment Checklist

- [ ] Deployment completed successfully
- [ ] Health checks passed
- [ ] Critical paths tested
- [ ] Error monitoring checked
- [ ] Performance metrics reviewed
- [ ] Team notified of deployment

### Monitoring

1. **GitHub Actions**: Monitor workflow runs
2. **Vercel Dashboard**: Check deployment status
3. **Supabase Dashboard**: Monitor database health
4. **Application Logs**: Review error logs
5. **Performance Metrics**: Monitor load times

## Support

For deployment issues:

1. Check this documentation
2. Review [ROLLBACK.md](./ROLLBACK.md)
3. Check GitHub Actions logs
4. Contact DevOps team
5. Create incident report if needed

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Rollback Procedures](./ROLLBACK.md)
- [Secrets Management](./SECRETS.md)

# Secrets Management Guide

## Overview

This document provides comprehensive guidelines for managing secrets, API keys, and sensitive configuration in the Supabase Admin application.

## Table of Contents

- [Security Principles](#security-principles)
- [Required Secrets](#required-secrets)
- [Setting Up Secrets](#setting-up-secrets)
- [Secret Rotation](#secret-rotation)
- [Access Control](#access-control)
- [Troubleshooting](#troubleshooting)

## Security Principles

### Best Practices

1. **Never Commit Secrets**
   - Never commit secrets to version control
   - Use `.env` files for local development
   - Always use `.gitignore` for sensitive files

2. **Use Environment-Specific Secrets**
   - Separate staging and production secrets
   - Use different keys for each environment
   - Never reuse production secrets in staging

3. **Limit Secret Exposure**
   - Only expose secrets to processes that need them
   - Use minimal permission scopes
   - Rotate secrets regularly

4. **Monitor Secret Usage**
   - Track secret access
   - Monitor for unauthorized usage
   - Set up alerts for suspicious activity

### Security Checklist

- [ ] All secrets stored in GitHub Secrets
- [ ] `.env` file in `.gitignore`
- [ ] No secrets in code or comments
- [ ] Environment-specific secrets separated
- [ ] Secrets rotated quarterly
- [ ] Access limited to necessary team members
- [ ] Secret usage monitored

## Required Secrets

### GitHub Repository Secrets

All secrets must be added to: `Settings > Secrets and variables > Actions > New repository secret`

### 1. Vercel Deployment Secrets

#### `VERCEL_TOKEN`
- **Description**: Vercel authentication token
- **Required For**: Automated deployments
- **How to Get**:
  1. Go to https://vercel.com/account/tokens
  2. Click "Create Token"
  3. Name it "GitHub Actions Deployment"
  4. Select appropriate scope
  5. Copy token immediately (shown once)

#### `VERCEL_ORG_ID`
- **Description**: Your Vercel organization ID
- **Required For**: Deployment targeting
- **How to Get**:
  1. Go to https://vercel.com/dashboard
  2. Select your team/organization
  3. Go to Settings > General
  4. Copy "Organization ID"

#### `VERCEL_PROJECT_ID`
- **Description**: Your Vercel project ID
- **Required For**: Deployment targeting
- **How to Get**:
  1. Go to your project in Vercel
  2. Go to Settings
  3. Copy "Project ID"

**Example Setup:**
```bash
# Via GitHub CLI
gh secret set VERCEL_TOKEN
# Paste your token when prompted

gh secret set VERCEL_ORG_ID
# Paste your org ID

gh secret set VERCEL_PROJECT_ID
# Paste your project ID
```

### 2. Supabase Secrets (Production)

#### `VITE_SUPABASE_URL`
- **Description**: Production Supabase project URL
- **Required For**: Database connection
- **How to Get**:
  1. Go to https://app.supabase.com
  2. Select your production project
  3. Go to Settings > API
  4. Copy "Project URL"
- **Format**: `https://xxxxxxxxxxxxx.supabase.co`

#### `VITE_SUPABASE_ANON_KEY`
- **Description**: Production Supabase anonymous key
- **Required For**: Client-side authentication
- **How to Get**:
  1. Go to https://app.supabase.com
  2. Select your production project
  3. Go to Settings > API
  4. Copy "anon/public" key
- **Note**: Safe to expose in client-side code

#### `DATABASE_URL`
- **Description**: Production database connection string
- **Required For**: Direct database operations, migrations
- **How to Get**:
  1. Go to https://app.supabase.com
  2. Select your production project
  3. Go to Settings > Database
  4. Copy "Connection string" (URI format)
  5. Replace `[YOUR-PASSWORD]` with actual password
- **Format**: `postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres`
- **Warning**: Keep this secret! Contains database password

#### `SUPABASE_ACCESS_TOKEN`
- **Description**: Supabase CLI access token
- **Required For**: Automated migrations, CLI operations
- **How to Get**:
  1. Install Supabase CLI: `npm install -g supabase`
  2. Login: `supabase login`
  3. Generate token: `supabase projects access-tokens create`
  4. Copy the token
- **Alternative**:
  1. Go to https://app.supabase.com/account/tokens
  2. Create new access token
  3. Copy token

**Example Setup:**
```bash
gh secret set VITE_SUPABASE_URL
gh secret set VITE_SUPABASE_ANON_KEY
gh secret set DATABASE_URL
gh secret set SUPABASE_ACCESS_TOKEN
```

### 3. Supabase Secrets (Staging)

#### `STAGING_SUPABASE_URL`
- **Description**: Staging Supabase project URL
- **Same process as production**, use staging project

#### `STAGING_SUPABASE_ANON_KEY`
- **Description**: Staging Supabase anonymous key
- **Same process as production**, use staging project

#### `STAGING_DATABASE_URL`
- **Description**: Staging database connection string
- **Same process as production**, use staging project

**Example Setup:**
```bash
gh secret set STAGING_SUPABASE_URL
gh secret set STAGING_SUPABASE_ANON_KEY
gh secret set STAGING_DATABASE_URL
```

### 4. Stripe Secrets

#### `VITE_STRIPE_PUBLIC_KEY`
- **Description**: Production Stripe publishable key
- **Required For**: Payment processing
- **How to Get**:
  1. Go to https://dashboard.stripe.com/apikeys
  2. Copy "Publishable key" from Live mode
- **Format**: `pk_live_xxxxxxxxxxxxx`
- **Note**: Safe to expose in client-side code

#### `STAGING_STRIPE_PUBLIC_KEY`
- **Description**: Staging/Test Stripe publishable key
- **Required For**: Payment testing
- **How to Get**:
  1. Go to https://dashboard.stripe.com/test/apikeys
  2. Copy "Publishable key" from Test mode
- **Format**: `pk_test_xxxxxxxxxxxxx`

**Example Setup:**
```bash
gh secret set VITE_STRIPE_PUBLIC_KEY
gh secret set STAGING_STRIPE_PUBLIC_KEY
```

### 5. Typesense Secrets

#### `VITE_TYPESENSE_HOST`
- **Description**: Production Typesense host URL
- **Required For**: Search functionality
- **How to Get**:
  1. From your Typesense Cloud dashboard
  2. Or your self-hosted Typesense server URL
- **Format**: `https://xxx.a1.typesense.net`

#### `VITE_TYPESENSE_API_KEY`
- **Description**: Production Typesense search-only API key
- **Required For**: Search operations
- **How to Get**:
  1. From your Typesense dashboard
  2. Create a search-only key (limited permissions)
- **Note**: Use search-only key, not admin key

#### `STAGING_TYPESENSE_HOST`
- **Description**: Staging Typesense host URL
- **Same process as production**, use staging instance

#### `STAGING_TYPESENSE_API_KEY`
- **Description**: Staging Typesense API key
- **Same process as production**, use staging instance

**Example Setup:**
```bash
gh secret set VITE_TYPESENSE_HOST
gh secret set VITE_TYPESENSE_API_KEY
gh secret set STAGING_TYPESENSE_HOST
gh secret set STAGING_TYPESENSE_API_KEY
```

### 6. Optional Secrets

#### `CODECOV_TOKEN`
- **Description**: Codecov upload token for code coverage
- **Required For**: Code coverage reporting
- **How to Get**:
  1. Go to https://codecov.io
  2. Connect your repository
  3. Copy upload token from Settings

**Example Setup:**
```bash
gh secret set CODECOV_TOKEN
```

## Setting Up Secrets

### Method 1: GitHub Web Interface

1. **Navigate to Repository**
   - Go to your GitHub repository
   - Click "Settings" tab

2. **Access Secrets**
   - Click "Secrets and variables" in left sidebar
   - Click "Actions"

3. **Add Secret**
   - Click "New repository secret"
   - Enter secret name (exactly as shown above)
   - Paste secret value
   - Click "Add secret"

4. **Verify Secret**
   - Secret should appear in list
   - Value is hidden
   - Can be updated or deleted

### Method 2: GitHub CLI

```bash
# Install GitHub CLI
brew install gh
# or
npm install -g gh

# Login
gh auth login

# Set individual secret
gh secret set SECRET_NAME
# Then paste value when prompted

# Set secret from file
gh secret set SECRET_NAME < secret.txt

# Set secret from environment variable
echo $SECRET_VALUE | gh secret set SECRET_NAME

# List all secrets
gh secret list

# Delete secret
gh secret delete SECRET_NAME
```

### Method 3: Bulk Setup Script

Create a script to set multiple secrets:

```bash
#!/bin/bash
# setup-secrets.sh

# Vercel
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID

# Supabase Production
gh secret set VITE_SUPABASE_URL
gh secret set VITE_SUPABASE_ANON_KEY
gh secret set DATABASE_URL
gh secret set SUPABASE_ACCESS_TOKEN

# Supabase Staging
gh secret set STAGING_SUPABASE_URL
gh secret set STAGING_SUPABASE_ANON_KEY
gh secret set STAGING_DATABASE_URL

# Stripe
gh secret set VITE_STRIPE_PUBLIC_KEY
gh secret set STAGING_STRIPE_PUBLIC_KEY

# Typesense
gh secret set VITE_TYPESENSE_HOST
gh secret set VITE_TYPESENSE_API_KEY
gh secret set STAGING_TYPESENSE_HOST
gh secret set STAGING_TYPESENSE_API_KEY

echo "All secrets set successfully!"
```

**Usage:**
```bash
chmod +x setup-secrets.sh
./setup-secrets.sh
```

## Local Development

### .env File Setup

1. **Copy Example File**
   ```bash
   cp .env.example .env
   ```

2. **Fill in Values**
   ```bash
   # .env
   VITE_SUPABASE_URL=your_development_url
   VITE_SUPABASE_ANON_KEY=your_development_key
   VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx
   VITE_TYPESENSE_HOST=your_typesense_host
   VITE_TYPESENSE_API_KEY=your_search_key
   ```

3. **Verify .gitignore**
   ```bash
   # Ensure .env is ignored
   grep -q "^\.env$" .gitignore || echo ".env" >> .gitignore
   ```

### Environment-Specific Files

```bash
# Development
.env.development

# Staging
.env.staging

# Production
.env.production

# Local overrides (never commit)
.env.local
```

## Secret Rotation

### Rotation Schedule

| Secret Type | Rotation Frequency | Priority |
|-------------|-------------------|----------|
| Database passwords | Quarterly | High |
| API keys | Quarterly | High |
| Access tokens | Quarterly | Medium |
| Deployment tokens | Semi-annually | Medium |
| Service account keys | Annually | Low |

### Rotation Process

1. **Generate New Secret**
   - Create new key/token in service dashboard
   - Test new secret in staging environment

2. **Update GitHub Secrets**
   ```bash
   gh secret set SECRET_NAME
   # Enter new value
   ```

3. **Deploy to Staging**
   - Push to develop branch
   - Verify staging works with new secret

4. **Deploy to Production**
   - Push to main branch
   - Monitor deployment
   - Verify production functionality

5. **Revoke Old Secret**
   - Disable old key in service dashboard
   - Keep record of rotation date

### Emergency Rotation

If a secret is compromised:

1. **Immediate Actions** (< 5 min)
   - Revoke compromised secret immediately
   - Generate new secret
   - Update GitHub Secrets

2. **Deploy Updates** (< 15 min)
   - Emergency deploy to all environments
   - Verify functionality

3. **Incident Response** (< 1 hour)
   - Document incident
   - Notify security team
   - Review access logs
   - Assess impact

4. **Post-Incident** (1-7 days)
   - Root cause analysis
   - Update security procedures
   - Team training if needed

## Access Control

### Who Should Have Access

| Role | Access Level | Secrets Access |
|------|--------------|----------------|
| Developer | Code only | `.env.example` only |
| Senior Developer | Limited secrets | Staging secrets |
| DevOps Engineer | All secrets | Full access |
| Tech Lead | All secrets | Full access |
| CTO | All secrets | Full access |

### Granting Access

1. **Repository Settings**
   - Settings > Collaborators
   - Add team member
   - Set appropriate role

2. **Secrets Access**
   - Only repository admins can view/edit secrets
   - Grant admin role carefully
   - Use environment-specific protection rules

### Revoking Access

1. **Remove Repository Access**
   - Settings > Collaborators
   - Remove user

2. **Rotate Affected Secrets**
   - Rotate secrets the user had access to
   - Update documentation

## Troubleshooting

### Secret Not Working

**Problem**: Secret value doesn't work in deployment

**Solutions:**

1. **Check Secret Name**
   - Ensure exact match (case-sensitive)
   - Check for typos
   - Verify in GitHub Secrets list

2. **Check Secret Value**
   ```bash
   # Test locally first
   export SECRET_NAME="value"
   npm run build
   ```

3. **Check for Whitespace**
   - Secrets shouldn't have leading/trailing spaces
   - Re-enter secret value

4. **Verify Secret is Set**
   ```bash
   gh secret list | grep SECRET_NAME
   ```

### Build Fails with Missing Variable

**Problem**: Build fails saying env var is missing

**Solutions:**

1. **Check Workflow File**
   - Verify secret is referenced correctly
   - Format: `${{ secrets.SECRET_NAME }}`

2. **Check Environment**
   - Staging secrets prefixed with `STAGING_`
   - Production secrets without prefix

3. **Add Fallback**
   ```yaml
   env:
     VAR: ${{ secrets.SECRET || 'default-value' }}
   ```

### Can't Access Secret in Actions

**Problem**: GitHub Actions can't access secret

**Solutions:**

1. **Check Workflow Permissions**
   - Settings > Actions > General
   - Enable "Read and write permissions"

2. **Check Branch Protection**
   - Secrets available on protected branches
   - Verify branch settings

3. **Check Fork Settings**
   - Secrets not available on forks
   - Use pull request from same repository

## Secret Validation

### Pre-Deployment Checklist

```bash
# Verify all required secrets are set
gh secret list

# Expected output:
# CODECOV_TOKEN
# DATABASE_URL
# STAGING_DATABASE_URL
# STAGING_STRIPE_PUBLIC_KEY
# STAGING_SUPABASE_ANON_KEY
# STAGING_SUPABASE_URL
# STAGING_TYPESENSE_API_KEY
# STAGING_TYPESENSE_HOST
# SUPABASE_ACCESS_TOKEN
# VERCEL_ORG_ID
# VERCEL_PROJECT_ID
# VERCEL_TOKEN
# VITE_STRIPE_PUBLIC_KEY
# VITE_SUPABASE_ANON_KEY
# VITE_SUPABASE_URL
# VITE_TYPESENSE_API_KEY
# VITE_TYPESENSE_HOST
```

### Test Secrets

1. **Test Build Locally**
   ```bash
   npm run build
   ```

2. **Test in Staging**
   - Deploy to staging
   - Verify all functionality

3. **Monitor Logs**
   - Check for secret-related errors
   - Verify connections work

## Security Incidents

### If a Secret is Exposed

1. **Immediate Response**
   - Revoke secret immediately
   - Generate new secret
   - Update GitHub Secrets

2. **Assess Impact**
   - Check access logs
   - Review recent activity
   - Identify affected systems

3. **Notify Stakeholders**
   - Security team
   - Management
   - Affected users (if needed)

4. **Document Incident**
   - Create incident report
   - Document timeline
   - Note lessons learned

### Reporting Security Issues

- Email: security@yourcompany.com
- Slack: #security-incidents
- On-call: [phone number]

## Additional Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase API Keys](https://supabase.com/docs/guides/api)
- [Stripe API Keys](https://stripe.com/docs/keys)
- [Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)

## Updates

This document should be reviewed:
- When adding new secrets
- After security incidents
- Quarterly as part of security review
- When team members change

Last Updated: 2025-11-17

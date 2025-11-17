# Environment Configuration Guide

This guide explains how to configure environment variables for different deployment environments.

## Overview

The application uses environment variables for configuration. Different environments (local, staging, production) require different values.

---

## Environment Files

### File Structure

```
.env.example          # Template with all variables (committed to git)
.env.local            # Local development (gitignored)
.env.staging          # Staging environment (gitignored)
.env.production       # Production environment (gitignored)
```

### Creating Environment Files

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in the values** for your environment

3. **Never commit** actual `.env` files to git (they're in `.gitignore`)

---

## Required Variables

### Supabase (Required)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**How to get:**
1. Go to Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Copy **Project URL** and **anon/public key**

### Typesense (Required)

```env
VITE_TYPESENSE_HOST=localhost
VITE_TYPESENSE_PORT=8108
VITE_TYPESENSE_PROTOCOL=http
VITE_TYPESENSE_API_KEY=your-api-key
```

**For production:**
```env
VITE_TYPESENSE_HOST=your-typesense-server.com
VITE_TYPESENSE_PORT=443
VITE_TYPESENSE_PROTOCOL=https
VITE_TYPESENSE_API_KEY=your-production-api-key
```

### Stripe (Required for billing)

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**How to get:**
1. Go to Stripe Dashboard
2. Navigate to **Developers** → **API keys**
3. Copy **Publishable key**

---

## Optional Variables

### Sentry (Error Tracking)

```env
VITE_SENTRY_DSN=https://...@sentry.io/...
VITE_SENTRY_ORG=your-org
VITE_SENTRY_PROJECT=your-project
VITE_SENTRY_ENVIRONMENT=development
```

### OpenAI (Embeddings)

```env
VITE_OPENAI_API_KEY=sk-...
```

### Resend (Email)

```env
VITE_RESEND_API_KEY=re_...
```

---

## Environment-Specific Configuration

### Local Development

**File:** `.env.local`

```env
# Use local Supabase (if running supabase start)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key

# Local Typesense
VITE_TYPESENSE_HOST=localhost
VITE_TYPESENSE_PORT=8108
VITE_TYPESENSE_PROTOCOL=http

# Development Stripe keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Development Sentry
VITE_SENTRY_ENVIRONMENT=development
```

**Usage:**
```bash
npm run dev
# Vite automatically loads .env.local
```

### Staging

**File:** `.env.staging`

```env
# Staging Supabase project
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=staging-anon-key

# Staging Typesense
VITE_TYPESENSE_HOST=staging-typesense.example.com
VITE_TYPESENSE_PORT=443
VITE_TYPESENSE_PROTOCOL=https

# Staging Stripe keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Staging Sentry
VITE_SENTRY_ENVIRONMENT=staging
```

**Usage:**
```bash
npm run build:staging
# or
vite build --mode staging
```

### Production

**File:** `.env.production` (or set in deployment platform)

```env
# Production Supabase project
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod-anon-key

# Production Typesense
VITE_TYPESENSE_HOST=typesense.example.com
VITE_TYPESENSE_PORT=443
VITE_TYPESENSE_PROTOCOL=https

# Production Stripe keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Production Sentry
VITE_SENTRY_ENVIRONMENT=production
```

**Usage:**
```bash
npm run build:prod
# or
vite build --mode production
```

---

## Vite Mode Configuration

Vite uses the `--mode` flag to determine which env file to load:

- `npm run dev` → loads `.env.local` (default)
- `vite build --mode staging` → loads `.env.staging`
- `vite build --mode production` → loads `.env.production`

### Adding Build Scripts

Update `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:local": "vite --mode local",
    "build": "vite build",
    "build:staging": "vite build --mode staging",
    "build:prod": "vite build --mode production",
    "preview": "vite preview",
    "preview:staging": "vite preview --mode staging"
  }
}
```

---

## Deployment Platforms

### Vercel

1. Go to **Project Settings** → **Environment Variables**
2. Add each variable for the appropriate environment:
   - **Production**
   - **Preview** (staging)
   - **Development**

3. Variables are automatically available during build

### Netlify

1. Go to **Site Settings** → **Environment Variables**
2. Add variables for:
   - **Production**
   - **Deploy Previews**
   - **Branch Deploys**

### Other Platforms

Set environment variables in your platform's dashboard or CI/CD configuration.

---

## Security Best Practices

### 1. Never Commit Secrets

- ✅ Commit `.env.example`
- ❌ Never commit `.env`, `.env.local`, `.env.production`

### 2. Use Different Keys Per Environment

- Use separate Supabase projects for staging/production
- Use separate Stripe accounts or test/live keys
- Use separate Typesense instances

### 3. Client-Side Variables

All `VITE_*` variables are exposed to the client. Never put:
- ❌ Secret API keys
- ❌ Database passwords
- ❌ Private keys

Use Supabase Edge Functions for server-side secrets.

### 4. Server-Side Secrets

For server-side secrets (Edge Functions), use:
- Supabase Dashboard → **Edge Functions** → **Secrets**
- Or environment variables in your deployment platform

---

## Variable Reference

### Supabase

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key | ✅ |

### Typesense

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_TYPESENSE_HOST` | Typesense server host | ✅ |
| `VITE_TYPESENSE_PORT` | Typesense server port | ✅ |
| `VITE_TYPESENSE_PROTOCOL` | http or https | ✅ |
| `VITE_TYPESENSE_API_KEY` | Typesense API key | ✅ |

### Stripe

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | ✅ (for billing) |

### Sentry

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SENTRY_DSN` | Sentry DSN | ❌ |
| `VITE_SENTRY_ORG` | Sentry organization | ❌ |
| `VITE_SENTRY_PROJECT` | Sentry project | ❌ |
| `VITE_SENTRY_ENVIRONMENT` | Environment name | ❌ |
| `VITE_SENTRY_RELEASE` | Release version | ❌ |
| `SENTRY_AUTH_TOKEN` | For source maps (CI/CD) | ❌ |

### OpenAI

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_OPENAI_API_KEY` | OpenAI API key | ❌ (for embeddings) |

### Resend

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_RESEND_API_KEY` | Resend API key | ❌ (for email) |

---

## Troubleshooting

### Variables Not Loading

1. Check file name matches mode: `.env.local` for `--mode local`
2. Restart dev server after changing `.env` files
3. Check variable names start with `VITE_` for client-side

### Wrong Environment Values

1. Verify you're using the correct mode
2. Check deployment platform environment settings
3. Clear build cache: `rm -rf dist node_modules/.vite`

### Missing Variables Error

1. Check `.env.example` for required variables
2. Verify all required variables are set
3. Check for typos in variable names

---

## Quick Start

1. **Copy example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in values:**
   - Supabase URL and key
   - Typesense configuration
   - Stripe key (if using billing)

3. **Start development:**
   ```bash
   npm run dev
   ```

---

**Last Updated:** 2025-01-17
**Status:** Ready for use


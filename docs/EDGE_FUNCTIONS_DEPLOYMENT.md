# Edge Functions Deployment Guide

This guide covers deploying and managing Supabase Edge Functions for the SaaS Search Platform.

## Overview

The project includes 8 Edge Functions that handle critical operations:
- Embedding generation (OpenAI)
- Typesense synchronization
- CMS webhook processing
- Stripe billing operations

---

## Edge Functions List

### 1. `generate-embedding`
**Purpose**: Generate embeddings for documents using OpenAI

**Secrets Required**:
- `OPENAI_API_KEY` - OpenAI API key

**Usage**: Called when documents need embeddings generated

### 2. `generate-batch-embeddings`
**Purpose**: Batch generate embeddings for multiple documents

**Secrets Required**:
- `OPENAI_API_KEY` - OpenAI API key

**Usage**: Called for bulk embedding generation

### 3. `sync-to-typesense`
**Purpose**: Sync a single document to Typesense

**Secrets Required**:
- `TYPESENSE_API_KEY` - Typesense admin API key
- `TYPESENSE_HOST` - Typesense server host
- `TYPESENSE_PORT` - Typesense server port
- `TYPESENSE_PROTOCOL` - http or https

**Usage**: Called via database triggers on document changes

### 4. `batch-sync-to-typesense`
**Purpose**: Batch sync multiple documents to Typesense

**Secrets Required**:
- `TYPESENSE_API_KEY` - Typesense admin API key
- `TYPESENSE_HOST` - Typesense server host
- `TYPESENSE_PORT` - Typesense server port
- `TYPESENSE_PROTOCOL` - http or https

**Usage**: Called for bulk synchronization operations

### 5. `process-cms-webhook`
**Purpose**: Process webhooks from CMS integrations

**Secrets Required**:
- `TYPESENSE_API_KEY` - Typesense admin API key
- `TYPESENSE_HOST` - Typesense server host
- `TYPESENSE_PORT` - Typesense server port
- `TYPESENSE_PROTOCOL` - http or https

**Usage**: Called when CMS sends webhook events

### 6. `stripe-webhook`
**Purpose**: Handle Stripe webhook events

**Secrets Required**:
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

**Usage**: Called by Stripe when events occur (subscriptions, payments, etc.)

### 7. `create-checkout-session`
**Purpose**: Create Stripe checkout sessions

**Secrets Required**:
- `STRIPE_SECRET_KEY` - Stripe secret key

**Usage**: Called when users want to subscribe/upgrade

### 8. `customer-portal`
**Purpose**: Manage customer portal sessions

**Secrets Required**:
- `STRIPE_SECRET_KEY` - Stripe secret key

**Usage**: Called when users access billing portal

---

## Deployment Process

### Step 1: Set Up Secrets

1. Go to Supabase Dashboard
2. Navigate to **Edge Functions** → **Secrets**
3. Add all required secrets for each function

**Required Secrets**:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Typesense
TYPESENSE_API_KEY=xyz...
TYPESENSE_HOST=your-typesense-server.com
TYPESENSE_PORT=443
TYPESENSE_PROTOCOL=https

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (if used)
RESEND_API_KEY=re_...
```

### Step 2: Test Functions Locally

```bash
# Start local Supabase
supabase start

# Serve a function locally
supabase functions serve function-name

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/function-name' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"key":"value"}'
```

### Step 3: Deploy Functions

#### Deploy Single Function

```bash
supabase functions deploy function-name
```

#### Deploy All Functions

```bash
# Deploy each function individually
supabase functions deploy generate-embedding
supabase functions deploy generate-batch-embeddings
supabase functions deploy sync-to-typesense
supabase functions deploy batch-sync-to-typesense
supabase functions deploy process-cms-webhook
supabase functions deploy stripe-webhook
supabase functions deploy create-checkout-session
supabase functions deploy customer-portal
```

#### Deploy with Environment

```bash
# Deploy to production
supabase functions deploy function-name --project-ref your-project-ref

# Deploy to staging (if separate project)
supabase functions deploy function-name --project-ref staging-project-ref
```

### Step 4: Verify Deployment

1. Check function logs in Supabase Dashboard
2. Test each function endpoint
3. Verify secrets are accessible
4. Check for errors in logs

---

## Function Configuration

### Timeout Settings

Edge Functions have a default timeout of 60 seconds. For batch operations, you may need to increase this:

```typescript
// In function code
Deno.serve({
  timeout: 120, // 2 minutes for batch operations
}, async (req) => {
  // Function logic
})
```

### Memory Limits

Default memory is 256MB. Increase if needed for large batch operations.

### CORS Configuration

Configure CORS in function code:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

---

## Monitoring & Logging

### View Logs

```bash
# Via CLI
supabase functions logs function-name

# Via Dashboard
# Go to Edge Functions → function-name → Logs
```

### Log Levels

Use appropriate log levels:

```typescript
console.log('Info message')
console.error('Error message')
console.warn('Warning message')
```

### Error Tracking

Integrate with Sentry for error tracking:

```typescript
import * as Sentry from '@sentry/deno'

Sentry.init({
  dsn: Deno.env.get('SENTRY_DSN'),
  environment: Deno.env.get('ENVIRONMENT') || 'production',
})
```

---

## Testing Functions

### Unit Testing

Create test files for each function:

```typescript
// supabase/functions/function-name/index_test.ts
import { assertEquals } from 'https://deno.land/std/testing/asserts.ts'
import { handler } from './index.ts'

Deno.test('Function test', async () => {
  const req = new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify({ test: 'data' }),
  })
  
  const res = await handler(req)
  assertEquals(res.status, 200)
})
```

### Integration Testing

Test with real services:

```bash
# Test with local Supabase
supabase functions serve function-name
curl -X POST http://localhost:54321/functions/v1/function-name \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

---

## Troubleshooting

### Function Not Deploying

1. Check Supabase CLI is logged in: `supabase login`
2. Verify project is linked: `supabase link`
3. Check function code for syntax errors
4. Verify secrets are set

### Function Timeout

1. Increase timeout in function configuration
2. Optimize function code
3. Break large operations into smaller batches
4. Use background jobs for long-running tasks

### Secret Not Found

1. Verify secret is set in Supabase Dashboard
2. Check secret name matches exactly (case-sensitive)
3. Ensure secret is available for the function
4. Redeploy function after adding secrets

### CORS Errors

1. Add CORS headers to function response
2. Verify allowed origins
3. Check preflight requests are handled

---

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
try {
  // Function logic
} catch (error) {
  console.error('Error:', error)
  return new Response(
    JSON.stringify({ error: error.message }),
    { status: 500, headers: corsHeaders }
  )
}
```

### 2. Input Validation

Validate all inputs:

```typescript
const body = await req.json()
if (!body.requiredField) {
  return new Response(
    JSON.stringify({ error: 'Missing required field' }),
    { status: 400, headers: corsHeaders }
  )
}
```

### 3. Rate Limiting

Implement rate limiting for public endpoints:

```typescript
// Use Supabase rate limiting or implement custom logic
```

### 4. Security

- Never expose secrets in function code
- Validate authentication tokens
- Sanitize user inputs
- Use HTTPS for all external calls

### 5. Performance

- Cache frequently accessed data
- Use batch operations when possible
- Optimize database queries
- Minimize external API calls

---

## Deployment Checklist

- [ ] All secrets configured in Supabase Dashboard
- [ ] Functions tested locally
- [ ] All functions deployed to production
- [ ] Function endpoints tested
- [ ] Logs monitored for errors
- [ ] Error tracking configured (Sentry)
- [ ] Webhooks configured (Stripe, CMS)
- [ ] Timeout settings appropriate
- [ ] CORS configured correctly
- [ ] Documentation updated

---

## Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Runtime](https://deno.land/manual)
- [Supabase CLI Functions](https://supabase.com/docs/reference/cli/supabase-functions)

---

**Last Updated:** 2025-01-17
**Status:** Ready for deployment


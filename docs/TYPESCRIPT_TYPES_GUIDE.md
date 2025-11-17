# TypeScript Types Generation Guide

This guide explains how to generate and use TypeScript types from your Supabase database schema.

## Overview

The project uses auto-generated TypeScript types from the Supabase database schema. This ensures type safety and autocomplete when working with database tables.

---

## Type Generation

### Generate Types from Remote Database

```bash
npm run types:generate:remote
```

This command:
1. Connects to your linked Supabase project
2. Generates TypeScript types from the current schema
3. Writes them to `src/types/database.types.ts`

### Generate Types from Local Database

```bash
npm run types:generate
```

This generates types from your local Supabase instance (requires `supabase start`).

### When to Regenerate Types

Regenerate types after:
- Creating new tables
- Adding new columns
- Modifying column types
- Creating new views
- Adding new enums
- Any schema changes

**Workflow:**
```bash
# 1. Make schema changes (via migration or Dashboard)
npm run db:push

# 2. Regenerate types
npm run types:generate:remote

# 3. Check for TypeScript errors
npm run types:check

# 4. Commit changes
git add src/types/database.types.ts
git commit -m "chore: update database types"
```

---

## Using Generated Types

### Import Database Type

```typescript
import type { Database } from './types/database.types'
```

### Using Helper Types

The project includes helper types in `src/types/supabase.ts`:

```typescript
import type { 
  Tenant, 
  TenantInsert, 
  TenantUpdate,
  Document,
  DocumentInsert,
  DocumentUpdate
} from './types/supabase'
```

### Type Helpers

#### Tables Helper

Get row type for any table:

```typescript
import type { Tables } from './types/supabase'

type Tenant = Tables<'tenants'>
type Document = Tables<'documents'>
```

#### Inserts Helper

Get insert type for any table:

```typescript
import type { Inserts } from './types/supabase'

type NewTenant = Inserts<'tenants'>
// { name: string, slug: string, ... }
```

#### Updates Helper

Get update type for any table:

```typescript
import type { Updates } from './types/supabase'

type TenantUpdate = Updates<'tenants'>
// { name?: string, slug?: string, ... }
```

#### Enums Helper

Get enum type:

```typescript
import type { Enums } from './types/supabase'

type PaymentMode = Enums<'stripe_payment_mode'>
```

---

## Examples

### Example 1: Typed Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database.types'

const supabase = createClient<Database>(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

// Now all queries are typed!
const { data } = await supabase
  .from('tenants')
  .select('*')
// data is typed as Tenant[] | null
```

### Example 2: Component with Typed Data

```typescript
import type { Tenant, TenantInsert } from '../types/supabase'

interface TenantListProps {
  tenants: Tenant[]
}

const TenantList: React.FC<TenantListProps> = ({ tenants }) => {
  // tenants is fully typed with all columns
  return (
    <ul>
      {tenants.map(tenant => (
        <li key={tenant.id}>
          {tenant.name} - {tenant.slug}
        </li>
      ))}
    </ul>
  )
}
```

### Example 3: Form with Insert Type

```typescript
import type { TenantInsert } from '../types/supabase'
import { useForm } from 'react-hook-form'

const CreateTenantForm = () => {
  const form = useForm<TenantInsert>({
    defaultValues: {
      name: '',
      slug: '',
      plan_type: 'free'
    }
  })

  // form is typed with TenantInsert
  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      {/* form fields */}
    </form>
  )
}
```

### Example 4: Update with Partial Type

```typescript
import type { TenantUpdate } from '../types/supabase'

const updateTenant = async (id: string, updates: TenantUpdate) => {
  const { data, error } = await supabase
    .from('tenants')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

// Usage
await updateTenant('tenant-id', { 
  name: 'New Name',
  plan_type: 'pro'
})
```

### Example 5: Using View Types

```typescript
import type { EmbeddingStatistics } from '../types/supabase'

const getEmbeddingStats = async (): Promise<EmbeddingStatistics[]> => {
  const { data } = await supabase
    .from('embedding_statistics')
    .select('*')

  return data || []
}
```

---

## Pre-defined Types

The project includes pre-defined types for common tables in `src/types/supabase.ts`:

- `Tenant`, `TenantInsert`, `TenantUpdate`
- `Document`, `DocumentInsert`, `DocumentUpdate`
- `SearchLog`, `SearchLogInsert`, `SearchLogUpdate`
- `ApiKey`, `ApiKeyInsert`, `ApiKeyUpdate`
- `BillingPlan`, `BillingPlanInsert`, `BillingPlanUpdate`
- `UserTenant`, `UserTenantInsert`, `UserTenantUpdate`
- `Profile`, `ProfileInsert`, `ProfileUpdate`
- `AuditLog`, `AuditLogInsert`, `AuditLogUpdate`
- `TenantUsage`, `TenantUsageInsert`, `TenantUsageUpdate`
- `TenantBilling`, `TenantBillingInsert`, `TenantBillingUpdate`
- `TeamInvitation`, `TeamInvitationInsert`, `TeamInvitationUpdate`
- `SyncError`, `SyncErrorInsert`, `SyncErrorUpdate`
- `SearchAnalytics`, `SearchAnalyticsInsert`, `SearchAnalyticsUpdate`
- `UsageMetric`, `UsageMetricInsert`, `UsageMetricUpdate`
- `EmbeddingAnalytics`, `EmbeddingAnalyticsInsert`, `EmbeddingAnalyticsUpdate`
- `DailyUsageStats`, `DailyUsageStatsInsert`, `DailyUsageStatsUpdate`
- `CMSIntegration`, `CMSIntegrationInsert`, `CMSIntegrationUpdate`
- `CMSConnection`, `CMSConnectionInsert`, `CMSConnectionUpdate`
- `CMSWebhookEvent`, `CMSWebhookEventInsert`, `CMSWebhookEventUpdate`
- `Widget`, `WidgetInsert`, `WidgetUpdate`
- `UserPreferences`, `UserPreferencesInsert`, `UserPreferencesUpdate`
- `UserSession`, `UserSessionInsert`, `UserSessionUpdate`
- `ContactMessage`, `ContactMessageInsert`, `ContactMessageUpdate`
- `NewsletterSubscription`, `NewsletterSubscriptionInsert`, `NewsletterSubscriptionUpdate`
- `StripeCustomer`, `StripeCustomerInsert`, `StripeCustomerUpdate`
- `UserProduct`, `UserProductInsert`, `UserProductUpdate`
- `CMSSyncLog`, `CMSSyncLogInsert`, `CMSSyncLogUpdate`

### View Types

- `EmbeddingStatistics`
- `TenantUsageDashboard`
- `CMSConnectionStats`

### Enum Types

- `StripePaymentMode`

---

## Type Checking

### Check TypeScript Types

```bash
npm run types:check
```

This runs TypeScript compiler without emitting files, useful for CI/CD.

### In Your IDE

Most IDEs (VS Code, WebStorm) will automatically:
- Show type errors
- Provide autocomplete
- Show type hints on hover

---

## Best Practices

### 1. Always Use Generated Types

❌ **Don't:**
```typescript
const tenant = {
  id: '123',
  name: 'Test',
  // missing fields, wrong types
}
```

✅ **Do:**
```typescript
import type { Tenant } from './types/supabase'

const tenant: Tenant = {
  id: '123',
  name: 'Test',
  slug: 'test',
  // TypeScript will enforce all required fields
}
```

### 2. Use Insert Types for Forms

```typescript
import type { TenantInsert } from './types/supabase'

const formData: TenantInsert = {
  name: 'New Tenant',
  slug: 'new-tenant',
  plan_type: 'free'
}
```

### 3. Use Update Types for Partial Updates

```typescript
import type { TenantUpdate } from './types/supabase'

const updates: TenantUpdate = {
  name: 'Updated Name'
  // Only include fields you want to update
}
```

### 4. Regenerate After Schema Changes

Always regenerate types after:
- Database migrations
- Schema changes in Dashboard
- Adding new tables/columns

### 5. Commit Type Files

Commit `src/types/database.types.ts` to git so all developers have the same types.

---

## Troubleshooting

### Types Are Out of Sync

```bash
# Regenerate from remote
npm run types:generate:remote

# Check for errors
npm run types:check
```

### Type Errors After Migration

1. Apply migration: `npm run db:push`
2. Regenerate types: `npm run types:generate:remote`
3. Check errors: `npm run types:check`

### Missing Types for New Table

1. Ensure table exists in database
2. Regenerate types: `npm run types:generate:remote`
3. Add to `src/types/supabase.ts` if needed

### Type Import Errors

Make sure you're importing from the correct path:
```typescript
// ✅ Correct
import type { Database } from './types/database.types'
import type { Tenant } from './types/supabase'

// ❌ Wrong
import type { Database } from '../types/database.types' // wrong path
```

---

## CI/CD Integration

### Pre-commit Hook (Optional)

You can add a pre-commit hook to ensure types are up to date:

```bash
# .husky/pre-commit
npm run types:generate:remote
git add src/types/database.types.ts
```

### GitHub Actions

Add to your CI workflow:

```yaml
- name: Check types are up to date
  run: |
    npm run types:generate:remote
    git diff --exit-code src/types/database.types.ts || \
      (echo "Types are out of sync! Run: npm run types:generate:remote" && exit 1)
```

---

## Additional Resources

- [Supabase Type Generation Docs](https://supabase.com/docs/guides/api/rest/generating-types)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Supabase TypeScript Guide](https://supabase.com/docs/reference/javascript/typescript-support)

---

**Last Updated:** 2025-01-17
**Status:** Ready for use


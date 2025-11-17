# TypeScript Type Generation from Database Schema

This document explains how to generate and use TypeScript types from the Supabase database schema.

## Overview

TypeScript types are automatically generated from the Supabase database schema to provide:
- Full autocomplete in your IDE
- Compile-time type checking
- Prevention of runtime errors from schema changes
- Better developer experience
- Self-documenting code

## File Structure

```
src/types/
├── database.types.ts   # Auto-generated types from Supabase schema
└── supabase.ts         # Type helper utilities and convenience types
```

## Generating Types

### From Local Development Database

Generate types from your local Supabase instance:

```bash
npm run types:generate
```

This is equivalent to:
```bash
npx supabase gen types typescript --local > src/types/database.types.ts
```

### From Remote Database

Generate types from the linked remote Supabase project:

```bash
npm run types:generate:remote
```

This is equivalent to:
```bash
npx supabase gen types typescript --linked > src/types/database.types.ts
```

### Type Checking

Run TypeScript type checking without emitting files:

```bash
npm run types:check
```

## Usage Examples

### Basic Table Types

```typescript
import type { Tenant, Document, BillingPlan } from '../types/supabase'

// Use the types in your components
const tenant: Tenant = {
  id: '...',
  name: 'My Tenant',
  slug: 'my-tenant',
  // ... TypeScript will autocomplete all fields
}
```

### Insert Types

```typescript
import type { DocumentInsert } from '../types/supabase'

// When creating new records
const newDocument: DocumentInsert = {
  title: 'New Document',
  content: 'Document content',
  tenant_id: '...',
  // Optional fields are not required
}
```

### Update Types

```typescript
import type { TenantUpdate } from '../types/supabase'

// When updating existing records
const updates: TenantUpdate = {
  name: 'Updated Name',
  // Only include fields you want to update
}
```

### Typed Supabase Client

The Supabase client is now fully typed:

```typescript
import { supabaseClient } from '../providers/supabaseClient'

// All queries are now typed automatically
const { data: tenants, error } = await supabaseClient
  .from('tenants')
  .select('*')

// 'tenants' is automatically typed as Tenant[]

const { data: documents, error: docError } = await supabaseClient
  .from('documents')
  .select('title, content, tenant_id')
  .eq('tenant_id', tenantId)

// 'documents' is automatically typed with the selected fields
```

### Using Generic Type Helpers

```typescript
import type { Tables, Inserts, Updates } from '../types/supabase'

// Generic way to get table types
type MyTenant = Tables<'tenants'>
type MyDocumentInsert = Inserts<'documents'>
type MyTenantUpdate = Updates<'tenants'>
```

### Enum Types

```typescript
import type { StripePaymentMode } from '../types/supabase'

const paymentMode: StripePaymentMode = 'subscription' // or 'payment'
```

## Type Helper Reference

The `src/types/supabase.ts` file exports the following helper types:

### Generic Helpers
- `Tables<T>` - Get Row type for any table
- `Inserts<T>` - Get Insert type for any table
- `Updates<T>` - Get Update type for any table
- `Enums<T>` - Get Enum type

### Specific Table Types

All major tables have exported types:
- `Tenant`, `TenantInsert`, `TenantUpdate`
- `Document`, `DocumentInsert`, `DocumentUpdate`
- `SearchLog`, `SearchLogInsert`, `SearchLogUpdate`
- `BillingPlan`, `BillingPlanInsert`, `BillingPlanUpdate`
- `UserTenant`, `UserTenantInsert`, `UserTenantUpdate`
- And many more...

## When to Regenerate Types

You should regenerate types whenever:
1. Database schema changes (new tables, columns, or constraints)
2. After running database migrations
3. After pulling schema changes from remote
4. When switching between branches with different schemas

## Best Practices

1. **Commit Generated Types**: The generated `database.types.ts` file should be committed to version control so all developers have the same types without needing database access.

2. **Type Before Deploy**: Always regenerate types before deploying to ensure they match the production schema.

3. **Use Specific Types**: Import specific types (`Tenant`, `Document`) rather than generic ones for better IDE autocomplete.

4. **Don't Modify Generated Files**: Never manually edit `database.types.ts`. Use the helper file (`supabase.ts`) for custom types.

5. **Type Your Queries**: Always specify types for Supabase queries:
   ```typescript
   const { data } = await supabaseClient
     .from('tenants')
     .select('*')
     .returns<Tenant[]>() // Explicit type if needed
   ```

## Integration with React Admin

The types integrate seamlessly with React Admin:

```typescript
import { List, Datagrid, TextField } from 'react-admin'
import type { Tenant } from '../../types/supabase'

export const TenantList = () => (
  <List>
    <Datagrid<Tenant>>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="slug" />
    </Datagrid>
  </List>
)
```

## Troubleshooting

### Types are out of sync

If you see type errors after schema changes:
```bash
npm run types:generate
npm run types:check
```

### Can't connect to local database

Make sure your local Supabase instance is running:
```bash
npm run supabase:status
npm run supabase:start  # if not running
```

### Can't generate from remote

Ensure you're logged in and linked:
```bash
npm run supabase:login
npm run supabase:link
```

## Additional Resources

- [Supabase TypeScript Support](https://supabase.com/docs/guides/api/generating-types)
- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli/introduction)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

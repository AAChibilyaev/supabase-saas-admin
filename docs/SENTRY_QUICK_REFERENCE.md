# Sentry Quick Reference Guide

Quick reference for common Sentry operations in the Supabase Admin application.

## Import

```typescript
import {
  setSentryUser,
  addBreadcrumb,
  addApiRequestBreadcrumb,
  addUserInteractionBreadcrumb,
  captureException,
  captureMessage,
  setSentryTags,
  setSentryContext,
  showFeedbackDialog,
} from '@/lib/sentry'

import { ErrorBoundary } from '@/components/error'
import { useSentryUser, useSentryNavigation } from '@/hooks/useSentry'
```

## Common Operations

### Set User Context

```typescript
// On login
setSentryUser({
  id: user.id,
  email: user.email,
  tenantId: tenant.id,
  role: user.role
})

// On logout
setSentryUser(null)
```

### Track User Actions

```typescript
// Button click
addUserInteractionBreadcrumb('click', 'SaveButton', { formId: 'user-form' })

// API request
addApiRequestBreadcrumb('POST', '/api/users', 201, { userId: '123' })

// Custom action
addBreadcrumb('User exported data', 'action', 'info', { format: 'csv' })
```

### Capture Errors

```typescript
// Automatic (in try-catch)
try {
  await riskyOperation()
} catch (error) {
  captureException(error, {
    tags: { feature: 'user-management' },
    extra: { userId: '123' }
  })
}

// Manual message
captureMessage('Unusual activity detected', 'warning', {
  tags: { security: 'anomaly' }
})
```

### Error Boundaries

```typescript
// Basic
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary fallback={<CustomError />}>
  <MyComponent />
</ErrorBoundary>

// With feedback dialog
<ErrorBoundary showDialog={true}>
  <MyComponent />
</ErrorBoundary>
```

### React Hooks

```typescript
function App() {
  const user = useCurrentUser()

  // Track user automatically
  useSentryUser(user ? {
    id: user.id,
    email: user.email,
    tenantId: user.tenantId,
    role: user.role
  } : null)

  // Track navigation automatically
  useSentryNavigation()

  return <div>...</div>
}
```

## Environment Variables

```bash
# Required
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Source Maps (Production)
VITE_SENTRY_ORG=your-org
VITE_SENTRY_PROJECT=supabase-admin
SENTRY_AUTH_TOKEN=your-token

# Optional
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_RELEASE=1.0.0
VITE_SENTRY_TRACES_SAMPLE_RATE=1.0
VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1.0
```

## Tags & Context

```typescript
// Set tags (for filtering)
setSentryTags({
  feature: 'user-management',
  tenant: 'acme-corp'
})

// Set context (for debugging)
setSentryContext('api', {
  endpoint: '/api/users',
  method: 'POST'
})
```

## Performance Monitoring

```typescript
import { startTransaction } from '@/lib/sentry'

const transaction = startTransaction('data-fetch', 'http.request')

try {
  await fetchData()
} finally {
  transaction.finish()
}
```

## User Feedback

```typescript
// Show feedback dialog
showFeedbackDialog()

// With specific event
showFeedbackDialog(eventId)
```

## Best Practices

1. Set user context immediately after login
2. Add breadcrumbs for important actions
3. Use error boundaries around major components
4. Filter sensitive data before sending
5. Use appropriate sample rates in production
6. Tag errors for better organization
7. Clear context on logout

## Troubleshooting

- **No events**: Check DSN and network requests
- **No source maps**: Verify auth token and release name
- **Too many events**: Reduce sample rates
- **Privacy concerns**: Enable text masking and media blocking

For detailed documentation, see [SENTRY_SETUP.md](./SENTRY_SETUP.md)

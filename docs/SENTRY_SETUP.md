# Sentry Error Tracking Setup Guide

This guide covers the complete setup and usage of Sentry error tracking in the Supabase Admin application.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Initial Setup](#initial-setup)
- [Configuration](#configuration)
- [Usage](#usage)
- [Error Boundaries](#error-boundaries)
- [Performance Monitoring](#performance-monitoring)
- [Session Replay](#session-replay)
- [User Feedback](#user-feedback)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Sentry provides comprehensive error tracking, performance monitoring, and session replay capabilities for the application. It helps identify, track, and resolve issues in both development and production environments.

## Features

- **Error Tracking**: Automatic capture of JavaScript errors and React component errors
- **Performance Monitoring**: Track application performance and identify bottlenecks
- **Session Replay**: Record user sessions to understand the context of errors
- **User Feedback**: Allow users to provide feedback when errors occur
- **Source Maps**: Upload source maps for better stack traces in production
- **User Context**: Associate errors with specific users and tenants
- **Breadcrumbs**: Track user actions leading up to errors
- **Custom Error Handlers**: Flexible error handling and reporting

## Initial Setup

### 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project and select "React" as the platform
3. Note your **DSN** (Data Source Name) from the project settings

### 2. Configure Environment Variables

Copy the example environment file and add your Sentry credentials:

```bash
cp .env.example .env
```

Update the following variables in `.env`:

```bash
# Required
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id

# For source map uploads (production only)
VITE_SENTRY_ORG=your-org-name
VITE_SENTRY_PROJECT=supabase-admin
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# Optional
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_RELEASE=1.0.0
VITE_SENTRY_TRACES_SAMPLE_RATE=1.0
VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1.0
```

### 3. Create a Sentry Auth Token

To upload source maps, create an auth token:

1. Go to [Sentry Settings > Auth Tokens](https://sentry.io/settings/account/api/auth-tokens/)
2. Click "Create New Token"
3. Set the scopes:
   - `project:releases`
   - `project:write`
4. Copy the token and add it to your `.env` file as `SENTRY_AUTH_TOKEN`

### 4. Install Dependencies

Dependencies are already installed. If needed, run:

```bash
npm install @sentry/react @sentry/vite-plugin
```

## Configuration

### Sentry Initialization

Sentry is initialized in `src/main.tsx` with the following configuration:

- **DSN**: Your project's Data Source Name
- **Browser Tracing**: Automatic performance monitoring
- **Session Replay**: Record user sessions for debugging
- **User Feedback**: Allow users to report issues
- **Environment**: Automatically set based on Vite mode
- **Debug Mode**: Enabled in development
- **Data Filtering**: Removes sensitive headers (Authorization, Cookie)

### Vite Plugin Configuration

The Sentry Vite plugin in `vite.config.ts`:

- Uploads source maps to Sentry during production builds
- Generates release information
- Only active in production builds
- Automatically includes all files in `./dist/**`

## Usage

### Setting User Context

Track which users experience errors:

```typescript
import { setSentryUser } from '@/lib/sentry'

// On login
setSentryUser({
  id: user.id,
  email: user.email,
  username: user.username,
  tenantId: tenant.id,
  tenantName: tenant.name,
  role: user.role
})

// On logout
setSentryUser(null)
```

### Adding Breadcrumbs

Track user actions to understand the sequence of events:

```typescript
import {
  addBreadcrumb,
  addNavigationBreadcrumb,
  addApiRequestBreadcrumb,
  addUserInteractionBreadcrumb
} from '@/lib/sentry'

// Generic breadcrumb
addBreadcrumb('User opened settings', 'ui', 'info', { section: 'profile' })

// Navigation
addNavigationBreadcrumb('/dashboard', '/settings')

// API request
addApiRequestBreadcrumb('GET', '/api/users', 200, { query: 'limit=10' })

// User interaction
addUserInteractionBreadcrumb('click', 'SaveButton', { formId: 'user-form' })
```

### Capturing Exceptions

Manually capture and report errors:

```typescript
import { captureException } from '@/lib/sentry'

try {
  // Some code that might throw
  await riskyOperation()
} catch (error) {
  captureException(error, {
    tags: { feature: 'user-management' },
    extra: { userId: '123', action: 'update' },
    level: 'error'
  })

  // Handle error gracefully
  showErrorToast('Operation failed')
}
```

### Capturing Messages

Send informational messages to Sentry:

```typescript
import { captureMessage } from '@/lib/sentry'

captureMessage('User attempted unauthorized action', 'warning', {
  tags: { feature: 'auth' },
  extra: { userId: '123', resource: 'admin-panel' }
})
```

### Setting Tags and Context

Improve error filtering and grouping:

```typescript
import { setSentryTags, setSentryContext } from '@/lib/sentry'

// Set tags for filtering
setSentryTags({
  feature: 'user-management',
  version: '1.2.3',
  deployment: 'eu-west-1'
})

// Set custom context
setSentryContext('api', {
  endpoint: '/api/users',
  method: 'POST',
  params: { limit: 10 }
})
```

## Error Boundaries

### Basic Error Boundary

Wrap components to catch React errors:

```typescript
import { ErrorBoundary } from '@/components/error'

function MyPage() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  )
}
```

### Error Boundary with Custom Fallback

```typescript
import { ErrorBoundary } from '@/components/error'

function MyPage() {
  return (
    <ErrorBoundary
      fallback={
        <div>
          <h1>Oops! Something went wrong</h1>
          <p>Please try again later</p>
        </div>
      }
    >
      <MyComponent />
    </ErrorBoundary>
  )
}
```

### Error Boundary with User Feedback

```typescript
import { ErrorBoundary } from '@/components/error'

function MyPage() {
  return (
    <ErrorBoundary showDialog={true}>
      <MyComponent />
    </ErrorBoundary>
  )
}
```

### Sentry Error Boundary (Advanced)

Use Sentry's enhanced error boundary:

```typescript
import { SentryErrorBoundary } from '@/components/error'

function MyPage() {
  return (
    <SentryErrorBoundary>
      <MyComponent />
    </SentryErrorBoundary>
  )
}
```

## Performance Monitoring

### Automatic Performance Tracking

Performance monitoring is automatically enabled with:

- **Page Load Times**: Track initial page load performance
- **Navigation**: Monitor client-side route changes
- **API Requests**: Track fetch and XHR requests
- **Component Rendering**: Measure React component performance

### Manual Performance Tracking

Track custom operations:

```typescript
import { startTransaction, startSpan } from '@/lib/sentry'

// Start a transaction
const transaction = startTransaction('data-processing', 'task')

// Add spans for sub-operations
const fetchSpan = startSpan(transaction, 'fetch-data', 'http.request')
const data = await fetchData()
fetchSpan.finish()

const processSpan = startSpan(transaction, 'process-data', 'task')
processData(data)
processSpan.finish()

// Finish the transaction
transaction.finish()
```

### Sample Rates

Control how many transactions are sent to Sentry:

```bash
# Development: Track 100% of transactions
VITE_SENTRY_TRACES_SAMPLE_RATE=1.0

# Production: Track 10% of transactions (recommended)
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
```

## Session Replay

Session Replay records user sessions to help debug issues.

### Configuration

Control replay behavior with environment variables:

```bash
# Record 10% of normal sessions
VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.1

# Record 100% of sessions with errors
VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1.0
```

### Privacy

Session replays automatically:
- Mask all text content
- Block all media (images, video)
- Remove sensitive data

To customize:

```typescript
// In src/main.tsx
Sentry.replayIntegration({
  maskAllText: true,
  blockAllMedia: true,
  maskAllInputs: true,
  // Add specific elements to mask
  mask: ['.sensitive-data'],
  // Block specific elements
  block: ['.private-content']
})
```

## User Feedback

### Show Feedback Dialog

Allow users to provide feedback when errors occur:

```typescript
import { showFeedbackDialog } from '@/lib/sentry'

// Show dialog for the last error
showFeedbackDialog()

// Show dialog for a specific error
showFeedbackDialog(eventId)
```

### Automatic Feedback on Errors

Enable automatic feedback dialog in error boundaries:

```typescript
<ErrorBoundary showDialog={true}>
  <MyComponent />
</ErrorBoundary>
```

## Best Practices

### 1. Set User Context Early

Set user context as soon as the user logs in:

```typescript
useEffect(() => {
  if (user) {
    setSentryUser({
      id: user.id,
      email: user.email,
      tenantId: tenant.id,
      role: user.role
    })
  }
}, [user])
```

### 2. Add Breadcrumbs for Important Actions

Track key user actions:

```typescript
const handleSave = async () => {
  addUserInteractionBreadcrumb('click', 'SaveButton', { formId: 'user-form' })

  try {
    await saveData()
    addBreadcrumb('Data saved successfully', 'action', 'info')
  } catch (error) {
    captureException(error)
  }
}
```

### 3. Use Error Boundaries Strategically

Wrap major sections of your app:

```typescript
<ErrorBoundary>
  <Dashboard />
</ErrorBoundary>

<ErrorBoundary>
  <UserManagement />
</ErrorBoundary>
```

### 4. Filter Sensitive Data

Never send sensitive data to Sentry:

```typescript
// Already configured in main.tsx
beforeSend(event) {
  // Remove sensitive headers
  if (event.request?.headers) {
    delete event.request.headers['Authorization']
    delete event.request.headers['Cookie']
  }

  // Remove sensitive data from extras
  if (event.extra?.password) {
    delete event.extra.password
  }

  return event
}
```

### 5. Use Tags for Organization

Tag errors for better filtering:

```typescript
setSentryTags({
  feature: 'user-management',
  tenant: tenant.name,
  environment: import.meta.env.MODE
})
```

### 6. Adjust Sample Rates for Production

Use lower sample rates in production to reduce costs:

```bash
# Production
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.1
```

### 7. Release Tracking

Use semantic versioning for releases:

```bash
VITE_SENTRY_RELEASE=1.2.3
```

Or use git commit hash:

```bash
VITE_SENTRY_RELEASE=$(git rev-parse --short HEAD)
```

## Troubleshooting

### No Events Appearing in Sentry

1. **Check DSN**: Verify `VITE_SENTRY_DSN` is set correctly
2. **Check Network**: Open browser DevTools > Network and look for requests to Sentry
3. **Check beforeSend**: Ensure the `beforeSend` hook isn't filtering all events
4. **Check Environment**: Sentry won't send events if DSN is not configured

### Source Maps Not Working

1. **Check Auth Token**: Verify `SENTRY_AUTH_TOKEN` has correct scopes
2. **Check Build**: Ensure you're building for production (`NODE_ENV=production`)
3. **Check Release**: Verify release name matches between build and runtime
4. **Check Upload**: Look for Sentry plugin output during build

### Too Many Events

1. **Adjust Sample Rates**: Reduce `VITE_SENTRY_TRACES_SAMPLE_RATE`
2. **Filter Errors**: Add patterns to `ignoreErrors` in Sentry config
3. **Set Quotas**: Configure rate limits in Sentry project settings

### Performance Impact

1. **Reduce Replay Sample Rate**: Lower `VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE`
2. **Reduce Trace Sample Rate**: Lower `VITE_SENTRY_TRACES_SAMPLE_RATE`
3. **Disable in Development**: Set `debug: false` in production

### Privacy Concerns

1. **Mask Sensitive Data**: Use `maskAllText` and `blockAllMedia`
2. **Filter Headers**: Remove sensitive headers in `beforeSend`
3. **Review Events**: Regularly audit events in Sentry dashboard

## Additional Resources

- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Sentry Session Replay](https://docs.sentry.io/product/session-replay/)
- [Sentry Source Maps](https://docs.sentry.io/platforms/javascript/sourcemaps/)
- [Sentry Error Filtering](https://docs.sentry.io/platforms/javascript/configuration/filtering/)

## Support

For questions or issues with Sentry integration:

1. Check this documentation
2. Review Sentry's official documentation
3. Check the Sentry dashboard for configuration issues
4. Contact the development team

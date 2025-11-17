# Sentry Production Setup Guide

This guide covers configuring Sentry for production error tracking and performance monitoring.

## Overview

Sentry provides:
- Error tracking and alerting
- Performance monitoring
- Session replay
- Release tracking
- Source maps

---

## Initial Setup

### 1. Create Sentry Project

1. Go to [Sentry.io](https://sentry.io) and create account
2. Create a new project
3. Select **React** as the platform
4. Copy the DSN

### 2. Configure Environment Variables

Add to your `.env` files:

```bash
# Sentry Configuration
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_SENTRY_ORG=your-org-slug
VITE_SENTRY_PROJECT=your-project-slug
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_RELEASE=1.0.0

# For source maps upload (CI/CD only)
SENTRY_AUTH_TOKEN=your-auth-token
```

### 3. Get Auth Token

1. Go to Sentry → Settings → Account → Auth Tokens
2. Create new token with scopes:
   - `project:releases`
   - `org:read`
3. Copy token to `SENTRY_AUTH_TOKEN`

---

## Configuration

### Current Setup

The project already includes Sentry configuration in:
- `src/lib/sentry/index.ts` - Sentry initialization
- `src/main.tsx` - Sentry integration
- `vite.config.ts` - Source maps upload

### Verify Configuration

Check `src/lib/sentry/index.ts`:

```typescript
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: 1.0, // Adjust for production
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
```

### Production Settings

Update for production:

```typescript
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: 'production',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  // Lower sample rates for production
  tracesSampleRate: 0.1, // 10% of transactions
  replaysSessionSampleRate: 0.01, // 1% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions
  release: import.meta.env.VITE_SENTRY_RELEASE,
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request) {
      delete event.request.cookies
    }
    return event
  },
})
```

---

## Source Maps

### Vite Configuration

The project includes Sentry Vite plugin in `vite.config.ts`:

```typescript
import { sentryVitePlugin } from "@sentry/vite-plugin"

export default defineConfig({
  plugins: [
    sentryVitePlugin({
      org: process.env.VITE_SENTRY_ORG,
      project: process.env.VITE_SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        assets: './dist/**',
        ignore: ['node_modules'],
      },
      disable: process.env.NODE_ENV !== 'production',
      release: {
        name: process.env.VITE_SENTRY_RELEASE,
      },
    }),
  ],
  build: {
    sourcemap: true,
  },
})
```

### Upload Source Maps

Source maps are automatically uploaded during build in CI/CD.

**Manual Upload**:

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Upload source maps
sentry-cli sourcemaps inject ./dist
sentry-cli sourcemaps upload ./dist \
  --org your-org \
  --project your-project \
  --auth-token your-token
```

---

## Error Tracking

### Manual Error Reporting

```typescript
import * as Sentry from "@sentry/react"

try {
  // Your code
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: 'billing',
    },
    extra: {
      userId: user.id,
      tenantId: tenant.id,
    },
  })
}
```

### Breadcrumbs

Add context to errors:

```typescript
Sentry.addBreadcrumb({
  category: 'user',
  message: 'User clicked checkout button',
  level: 'info',
})
```

### User Context

Set user information:

```typescript
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
})
```

---

## Performance Monitoring

### Transaction Monitoring

Sentry automatically tracks:
- Page loads
- Route changes
- API calls (if configured)

### Custom Transactions

```typescript
const transaction = Sentry.startTransaction({
  name: 'Process Payment',
  op: 'payment',
})

try {
  await processPayment()
  transaction.setStatus('ok')
} catch (error) {
  transaction.setStatus('internal_error')
  throw error
} finally {
  transaction.finish()
}
```

### Performance Sampling

Adjust sample rates based on traffic:

```typescript
tracesSampleRate: 0.1, // 10% of transactions
```

---

## Session Replay

### Configuration

Session replay is configured in `src/lib/sentry/index.ts`:

```typescript
Sentry.replayIntegration({
  maskAllText: true, // Mask all text for privacy
  blockAllMedia: true, // Block images/videos
})
```

### Privacy Settings

Adjust for your needs:

```typescript
Sentry.replayIntegration({
  maskAllText: false, // Show text
  maskAllInputs: true, // Mask input fields
  blockAllMedia: false, // Allow media
  block: ['.sensitive'], // Block specific selectors
})
```

---

## Alerts

### Create Alerts

1. Go to Sentry → Alerts
2. Create new alert rule
3. Configure conditions:
   - Error rate threshold
   - Performance degradation
   - New issues

### Alert Destinations

Configure notifications to:
- Email
- Slack
- PagerDuty
- Webhooks

### Example Alert Rules

**High Error Rate**:
- Condition: Error rate > 5% in 5 minutes
- Action: Send email to team

**New Critical Issue**:
- Condition: New issue with level=error
- Action: Send Slack notification

**Performance Degradation**:
- Condition: P95 latency > 2s
- Action: Send alert

---

## Release Tracking

### Set Release

```typescript
Sentry.init({
  release: import.meta.env.VITE_SENTRY_RELEASE || '1.0.0',
})
```

### Associate Commits

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Create release
sentry-cli releases new $VERSION

# Associate commits
sentry-cli releases set-commits $VERSION --auto

# Finalize release
sentry-cli releases finalize $VERSION
```

### In CI/CD

Add to deployment workflow:

```yaml
- name: Create Sentry Release
  run: |
    npx @sentry/cli releases new ${{ github.sha }}
    npx @sentry/cli releases set-commits ${{ github.sha }} --auto
    npx @sentry/cli releases finalize ${{ github.sha }}
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: ${{ secrets.VITE_SENTRY_ORG }}
    SENTRY_PROJECT: ${{ secrets.VITE_SENTRY_PROJECT }}
```

---

## Filtering & Privacy

### Filter Sensitive Data

```typescript
Sentry.init({
  beforeSend(event, hint) {
    // Remove sensitive data
    if (event.request) {
      delete event.request.cookies
      delete event.request.headers?.Authorization
    }
    
    // Filter by error type
    if (event.exception) {
      const error = hint.originalException
      if (error instanceof NetworkError) {
        return null // Don't send
      }
    }
    
    return event
  },
})
```

### Sanitize User Data

```typescript
Sentry.setUser({
  id: user.id,
  // Don't include sensitive data
  // email: user.email, // Only if needed
})
```

---

## Monitoring Dashboard

### Key Metrics to Monitor

1. **Error Rate**: Errors per minute
2. **Issue Count**: Total open issues
3. **Performance**: P50, P75, P95 latencies
4. **Release Health**: Errors by release
5. **User Impact**: Affected users

### Create Dashboards

1. Go to Sentry → Dashboards
2. Create custom dashboard
3. Add widgets for:
   - Error rate over time
   - Top errors
   - Performance metrics
   - Release health

---

## Troubleshooting

### Source Maps Not Working

1. Verify source maps are generated: `ls dist/*.map`
2. Check upload in Sentry → Settings → Source Maps
3. Verify auth token has correct permissions
4. Check release name matches

### Errors Not Appearing

1. Check DSN is correct
2. Verify Sentry.init() is called
3. Check browser console for errors
4. Verify environment is set correctly

### High Event Volume

1. Adjust sample rates
2. Add filters in beforeSend
3. Use rate limiting
4. Review alert thresholds

---

## Best Practices

1. **Set Appropriate Sample Rates**: Balance between insights and cost
2. **Filter Sensitive Data**: Never send passwords, tokens, etc.
3. **Use Environments**: Separate dev/staging/production
4. **Monitor Releases**: Track errors by release version
5. **Set Up Alerts**: Get notified of critical issues
6. **Review Regularly**: Check Sentry dashboard daily
7. **Tag Events**: Add tags for better filtering
8. **Set User Context**: Help identify affected users

---

## Production Checklist

- [ ] Sentry project created
- [ ] DSN configured in environment variables
- [ ] Auth token created for source maps
- [ ] Source maps upload configured
- [ ] Production sample rates set
- [ ] Privacy filters configured
- [ ] Alerts configured
- [ ] Release tracking set up
- [ ] User context configured
- [ ] Performance monitoring enabled
- [ ] Session replay configured (if needed)
- [ ] Dashboard created
- [ ] Team notifications set up

---

## Additional Resources

- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Sentry Session Replay](https://docs.sentry.io/product/session-replay/)

---

**Last Updated:** 2025-01-17
**Status:** Ready for production


# Health Checks & Monitoring Setup Guide

This guide covers setting up health checks and monitoring for the SaaS Search Platform.

## Overview

Health checks provide:
- System status monitoring
- Service availability checks
- Performance metrics
- Alerting capabilities

---

## Health Check Endpoint

### Implementation

The project includes a health check page at `/health`:

- **Component**: `src/pages/HealthCheck.tsx`
- **Utilities**: `src/utils/healthCheck.ts`

### Access Health Check

1. Navigate to `/health` in the application
2. Or use the API endpoint (if configured)

### Health Check Response

```json
{
  "healthy": true,
  "timestamp": "2025-01-17T12:00:00Z",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 45,
      "lastChecked": "2025-01-17T12:00:00Z"
    },
    "typesense": {
      "status": "healthy",
      "responseTime": 120,
      "lastChecked": "2025-01-17T12:00:00Z"
    },
    "supabase": {
      "status": "healthy",
      "responseTime": 30,
      "lastChecked": "2025-01-17T12:00:00Z"
    }
  },
  "version": "1.0.0"
}
```

---

## Service Health Checks

### Database Health

Checks:
- Connection to Supabase database
- Query response time
- Basic query execution

**Status Levels**:
- `healthy`: Response time < 1000ms
- `degraded`: Response time > 1000ms
- `down`: Connection failed or error

### Typesense Health

Checks:
- Typesense server connectivity
- Health endpoint response
- Response time

**Status Levels**:
- `healthy`: Server responds with `ok: true`
- `degraded`: Slow response or warnings
- `down`: Server unreachable

### Supabase API Health

Checks:
- Supabase API connectivity
- Authentication service availability
- Response time

**Status Levels**:
- `healthy`: API responds normally
- `degraded`: Slow response
- `down`: API unreachable

---

## Monitoring Setup

### Uptime Monitoring

Use external services:

1. **UptimeRobot**
   - URL: `https://your-app.vercel.app/health`
   - Interval: 5 minutes
   - Alert: Email/SMS on failure

2. **Pingdom**
   - URL: `https://your-app.vercel.app/health`
   - Interval: 1 minute
   - Alert: Multiple channels

3. **StatusCake**
   - URL: `https://your-app.vercel.app/health`
   - Interval: 5 minutes
   - Alert: Webhook/SMS

### Application Monitoring

Integrate with Sentry for error tracking:

```typescript
import * as Sentry from "@sentry/react"

// Report health check failures
if (!health.healthy) {
  Sentry.captureMessage('Health check failed', {
    level: 'error',
    extra: health,
  })
}
```

---

## Alerts Configuration

### Alert Conditions

Set up alerts for:

1. **Service Down**
   - Condition: Any service status = 'down'
   - Action: Immediate notification

2. **Degraded Performance**
   - Condition: Response time > threshold
   - Action: Warning notification

3. **High Error Rate**
   - Condition: Multiple failures in time window
   - Action: Critical alert

### Alert Destinations

Configure notifications to:
- Email
- Slack
- PagerDuty
- Webhooks
- SMS (via Twilio)

### Example Alert Rules

**Critical Alert** (Service Down):
```yaml
condition: services.database.status == 'down' OR 
           services.typesense.status == 'down'
action: 
  - Send email to on-call
  - Post to Slack #alerts
  - Create PagerDuty incident
```

**Warning Alert** (Degraded):
```yaml
condition: services.database.responseTime > 2000 OR
           services.typesense.responseTime > 3000
action:
  - Send email to team
  - Post to Slack #monitoring
```

---

## Automated Health Checks

### Scheduled Checks

Set up cron jobs or scheduled tasks:

```bash
# Check every 5 minutes
*/5 * * * * curl -f https://your-app.vercel.app/health || alert
```

### CI/CD Integration

Add health check to deployment:

```yaml
# .github/workflows/deploy.yml
- name: Health Check
  run: |
    sleep 30  # Wait for deployment
    curl -f https://your-app.vercel.app/health || exit 1
```

---

## Performance Metrics

### Track Metrics

Monitor:
- Response times per service
- Error rates
- Uptime percentage
- Service availability

### Metrics Dashboard

Create dashboard with:
- Service status over time
- Response time trends
- Error rate graphs
- Uptime percentage

---

## Troubleshooting

### Health Check Fails

1. Check service logs
2. Verify network connectivity
3. Check service configurations
4. Review recent changes
5. Check resource usage (CPU, memory)

### False Positives

1. Adjust thresholds
2. Add retry logic
3. Filter transient errors
4. Review alert conditions

---

## Best Practices

1. **Regular Checks**: Check health every 1-5 minutes
2. **Multiple Endpoints**: Monitor different endpoints
3. **Alert Fatigue**: Don't over-alert
4. **Documentation**: Document alert procedures
5. **Runbooks**: Create runbooks for common issues
6. **Testing**: Test alerting regularly
7. **Escalation**: Set up escalation paths

---

## Production Checklist

- [ ] Health check endpoint accessible
- [ ] All services monitored
- [ ] Uptime monitoring configured
- [ ] Alerts configured
- [ ] Alert destinations set up
- [ ] Performance thresholds defined
- [ ] Dashboard created
- [ ] Runbooks documented
- [ ] Team notified of alerts
- [ ] Regular testing scheduled

---

## Additional Resources

- [UptimeRobot](https://uptimerobot.com)
- [Pingdom](https://www.pingdom.com)
- [StatusCake](https://www.statuscake.com)

---

**Last Updated:** 2025-01-17
**Status:** Ready for setup


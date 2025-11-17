# Production Deployment Guide

This guide covers the complete production deployment process for the SaaS Search Platform.

---

## Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] All tests pass
- [ ] Security audit completed
- [ ] Performance audit completed
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Edge Functions tested
- [ ] Rollback plan prepared

---

## Step 1: Database Backup

### Create Backup

```bash
# Via Supabase Dashboard
# Go to Database → Backups → Create Backup

# Or via CLI
supabase db dump -f backup-$(date +%Y%m%d).sql
```

### Verify Backup

- [ ] Backup file created
- [ ] Backup size reasonable
- [ ] Backup can be restored (test in staging)

---

## Step 2: Apply Database Migrations

### Review Migrations

```bash
# List pending migrations
supabase migration list

# Review migration files
cat supabase/migrations/*.sql
```

### Apply Migrations

```bash
# Link to production project
supabase link --project-ref your-production-project-ref

# Apply migrations
supabase db push

# Or apply specific migration
supabase migration up
```

### Verify Migrations

- [ ] All migrations applied
- [ ] No errors in migration logs
- [ ] Database schema matches expected
- [ ] RLS policies active

---

## Step 3: Deploy Edge Functions

### Deploy All Functions

```bash
# Deploy each function
supabase functions deploy generate-embedding
supabase functions deploy generate-batch-embeddings
supabase functions deploy sync-to-typesense
supabase functions deploy batch-sync-to-typesense
supabase functions deploy process-cms-webhook
supabase functions deploy stripe-webhook
supabase functions deploy create-checkout-session
supabase functions deploy customer-portal
```

### Configure Secrets

In Supabase Dashboard → Edge Functions → Secrets:

- [ ] `OPENAI_API_KEY` set
- [ ] `TYPESENSE_API_KEY` set
- [ ] `TYPESENSE_HOST` set
- [ ] `TYPESENSE_PORT` set
- [ ] `TYPESENSE_PROTOCOL` set
- [ ] `STRIPE_SECRET_KEY` set
- [ ] `STRIPE_WEBHOOK_SECRET` set
- [ ] `RESEND_API_KEY` set (if used)

### Test Functions

- [ ] Each function responds
- [ ] Functions handle errors
- [ ] Logs are accessible
- [ ] Performance acceptable

---

## Step 4: Configure Environment Variables

### Vercel Environment Variables

Go to Vercel Dashboard → Project Settings → Environment Variables:

**Production Variables**:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_TYPESENSE_HOST=your-typesense-server.com
VITE_TYPESENSE_PORT=443
VITE_TYPESENSE_PROTOCOL=https
VITE_TYPESENSE_API_KEY=your-production-api-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_SENTRY_DSN=https://...@sentry.io/...
VITE_SENTRY_ORG=your-org
VITE_SENTRY_PROJECT=your-project
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_RELEASE=1.0.0
SENTRY_AUTH_TOKEN=your-token
```

### Verify Variables

- [ ] All required variables set
- [ ] Production values (not staging)
- [ ] No typos in variable names
- [ ] Secrets properly secured

---

## Step 5: Deploy Frontend

### Via GitHub Actions (Automatic)

1. Merge to `main` branch
2. GitHub Actions automatically:
   - Runs tests
   - Builds application
   - Deploys to Vercel
   - Creates deployment tag

### Via Vercel CLI (Manual)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

### Verify Deployment

- [ ] Application accessible
- [ ] No console errors
- [ ] All features work
- [ ] Performance acceptable

---

## Step 6: Post-Deployment Verification

### Health Checks

```bash
# Check health endpoint
curl https://your-app.vercel.app/health

# Expected response:
{
  "healthy": true,
  "services": {
    "database": { "status": "healthy" },
    "typesense": { "status": "healthy" },
    "supabase": { "status": "healthy" }
  }
}
```

### Functional Tests

- [ ] User can sign up
- [ ] User can log in
- [ ] Documents can be uploaded
- [ ] Search works
- [ ] Billing works
- [ ] Analytics load

### Performance Tests

- [ ] Page load time < 3s
- [ ] API response time < 500ms
- [ ] Search response time < 200ms
- [ ] No memory leaks

### Monitoring

- [ ] Sentry receiving events
- [ ] Health checks passing
- [ ] No critical errors
- [ ] Performance metrics normal

---

## Step 7: Configure Webhooks

### Stripe Webhooks

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Select events to listen to
4. Copy webhook secret to Edge Function secrets

### CMS Webhooks

1. Configure CMS to send webhooks
2. Endpoint: `https://your-project.supabase.co/functions/v1/process-cms-webhook`
3. Test webhook delivery
4. Verify sync works

---

## Step 8: Initial Data Sync

### Sync Existing Documents

If you have existing documents:

```bash
# Use batch sync function
curl -X POST https://your-project.supabase.co/functions/v1/batch-sync-to-typesense \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"documents": [...]}'
```

### Verify Sync

- [ ] Documents indexed in Typesense
- [ ] Search returns results
- [ ] No sync errors
- [ ] Sync logs clean

---

## Step 9: Enable Monitoring

### Uptime Monitoring

Set up external monitoring:

1. **UptimeRobot**
   - URL: `https://your-app.vercel.app/health`
   - Interval: 5 minutes
   - Alert: Email/SMS

2. **Pingdom**
   - URL: `https://your-app.vercel.app/health`
   - Interval: 1 minute
   - Alert: Multiple channels

### Sentry Alerts

Configure Sentry alerts for:
- Error rate > threshold
- Performance degradation
- New critical issues

---

## Step 10: Final Verification

### Complete System Test

- [ ] **Authentication**
  - Sign up works
  - Login works
  - Password reset works
  - MFA works

- [ ] **Core Features**
  - Document upload works
  - Search works
  - Analytics load
  - Dashboard displays

- [ ] **Billing**
  - Checkout works
  - Webhooks received
  - Subscriptions managed
  - Customer portal works

- [ ] **Integrations**
  - CMS sync works
  - Typesense sync works
  - Email sending works

### Performance Verification

- [ ] Response times acceptable
- [ ] No memory leaks
- [ ] No CPU spikes
- [ ] Database queries optimized

### Security Verification

- [ ] RLS policies active
- [ ] No data leakage
- [ ] API keys secured
- [ ] Secrets protected

---

## Rollback Procedure

### If Deployment Fails

1. **Stop Deployment**
   ```bash
   # Cancel in-progress deployment
   vercel rollback
   ```

2. **Restore Database** (if needed)
   ```bash
   # Restore from backup
   supabase db restore backup-YYYYMMDD.sql
   ```

3. **Revert Code**
   ```bash
   # Revert to previous commit
   git revert HEAD
   git push origin main
   ```

4. **Verify Rollback**
   - [ ] Previous version accessible
   - [ ] All features work
   - [ ] No data loss
   - [ ] Monitoring normal

---

## Post-Launch Monitoring

### First 24 Hours

Monitor closely:
- Error rates
- Response times
- User activity
- System resources
- Database performance

### First Week

- Review error logs daily
- Check performance metrics
- Monitor user feedback
- Review Sentry reports
- Optimize as needed

---

## Launch Communication

### Internal Team

- [ ] Notify team of launch
- [ ] Share deployment details
- [ ] Provide support contacts
- [ ] Schedule monitoring shifts

### Users (if applicable)

- [ ] Announcement prepared
- [ ] Release notes ready
- [ ] Support channels ready
- [ ] Documentation updated

---

## Production Deployment Checklist

### Pre-Deployment

- [ ] Security audit completed
- [ ] Performance audit completed
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Backup created

### Deployment

- [ ] Database migrations applied
- [ ] Edge Functions deployed
- [ ] Environment variables set
- [ ] Frontend deployed
- [ ] Webhooks configured

### Post-Deployment

- [ ] Health checks passing
- [ ] Functional tests pass
- [ ] Performance acceptable
- [ ] Monitoring active
- [ ] Alerts configured

### Verification

- [ ] All features work
- [ ] No critical errors
- [ ] Performance metrics normal
- [ ] User feedback positive
- [ ] System stable

---

## Support & Troubleshooting

### Common Issues

**Deployment Fails**:
- Check build logs
- Verify environment variables
- Check for syntax errors

**Health Check Fails**:
- Verify service connectivity
- Check API keys
- Review service logs

**Performance Issues**:
- Check database queries
- Review Typesense performance
- Monitor resource usage

### Emergency Contacts

- **On-Call Engineer**: [Contact]
- **Database Admin**: [Contact]
- **DevOps Team**: [Contact]

---

## Additional Resources

- [Vercel Deployment Docs](https://vercel.com/docs)
- [Supabase Deployment Guide](https://supabase.com/docs/guides/hosting)
- [Typesense Production Guide](https://typesense.org/docs/guide/install-typesense.html#production)

---

**Last Updated:** 2025-01-17
**Status:** Ready for production deployment


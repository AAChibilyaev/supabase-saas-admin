# Deployment Checklist

This checklist ensures all security and configuration settings are properly applied before deploying to production.

## Pre-Deployment Checklist

### Database Security

- [ ] **Run Database Migrations**
  - [ ] Apply `migrations/20251117_fix_security_definer.sql`
  - [ ] Verify all migrations completed successfully
  - [ ] Run `supabase db lint` to check for security issues
  - [ ] Confirm no SECURITY DEFINER views exist (unless explicitly documented)

- [ ] **Row Level Security (RLS)**
  - [ ] All tables have RLS enabled
  - [ ] RLS policies enforce tenant isolation
  - [ ] Test RLS policies with different user roles
  - [ ] Verify cross-tenant access is blocked

- [ ] **Database Indexes**
  - [ ] Foreign keys are indexed
  - [ ] Frequently queried columns are indexed
  - [ ] Run performance optimization migration if needed

### Authentication & Authorization

- [ ] **Supabase Dashboard - Authentication Settings**
  - [ ] Navigate to: Authentication > Policies
  - [ ] Enable **Leaked Password Protection**
  - [ ] Configure password requirements:
    - Minimum length: 12 characters
    - Complexity requirements enabled
  - [ ] Set appropriate session timeout

- [ ] **Supabase Dashboard - MFA Configuration**
  - [ ] Navigate to: Authentication > MFA
  - [ ] Verify TOTP is enabled
  - [ ] Configure additional MFA methods if needed:
    - [ ] SMS (requires Twilio setup)
    - [ ] Phone authentication
  - [ ] Set MFA grace period
  - [ ] Consider making MFA mandatory for admin roles

- [ ] **API Keys & Secrets**
  - [ ] Rotate Supabase anon key if compromised
  - [ ] Verify service role key is not exposed
  - [ ] Set up proper CORS policies
  - [ ] Configure JWT expiration times

### Environment Variables

- [ ] **Required Environment Variables**
  ```bash
  # Supabase
  VITE_SUPABASE_URL=
  VITE_SUPABASE_ANON_KEY=

  # Typesense
  VITE_TYPESENSE_URL=
  VITE_TYPESENSE_API_KEY=

  # Stripe (if billing enabled)
  VITE_STRIPE_PUBLISHABLE_KEY=

  # Sentry (if monitoring enabled)
  VITE_SENTRY_DSN=

  # OpenAI (if embeddings enabled)
  VITE_OPENAI_API_KEY=

  # Resend (if email enabled)
  VITE_RESEND_API_KEY=
  ```

- [ ] **Edge Function Secrets** (Supabase Dashboard > Edge Functions > Secrets)
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] `OPENAI_API_KEY`
  - [ ] `RESEND_API_KEY`
  - [ ] `TYPESENSE_API_KEY`
  - [ ] `TYPESENSE_HOST`
  - [ ] `TYPESENSE_PORT`
  - [ ] `TYPESENSE_PROTOCOL`

### Edge Functions

- [ ] **Deploy Edge Functions**
  - [ ] `generate-embedding`
  - [ ] `generate-batch-embeddings`
  - [ ] `sync-to-typesense`
  - [ ] `batch-sync-to-typesense`
  - [ ] `process-cms-webhook` (new)
  - [ ] `stripe-webhook` (if billing enabled)
  - [ ] `create-checkout-session` (if billing enabled)
  - [ ] `customer-portal` (if billing enabled)

- [ ] **Function Permissions**
  - [ ] Verify functions use appropriate service role or anon key
  - [ ] Test function authentication
  - [ ] Configure function timeouts
  - [ ] Set up function logging

### Typesense Configuration

- [ ] **Typesense Setup**
  - [ ] Typesense server is running and accessible
  - [ ] API keys are configured
  - [ ] Collections are created
  - [ ] Search API key has read-only access
  - [ ] Admin API key is secured

- [ ] **Auto-Sync Configuration**
  - [ ] Database triggers are enabled
  - [ ] Sync functions are deployed
  - [ ] Test auto-sync with sample data
  - [ ] Verify webhook processing works

### CMS Integration

- [ ] **CMS Connections**
  - [ ] Test CMS integrations
  - [ ] Verify webhook endpoints are accessible
  - [ ] Configure webhook secrets
  - [ ] Test manual sync functionality
  - [ ] Verify automatic sync works

- [ ] **Webhook Processing**
  - [ ] Deploy `process-cms-webhook` edge function
  - [ ] Configure webhook URLs in CMS platforms
  - [ ] Test webhook delivery
  - [ ] Verify webhook signature validation

### Email Configuration

- [ ] **Resend Setup** (if using email features)
  - [ ] Verify sending domain in Resend dashboard
  - [ ] Configure DNS records (SPF, DKIM, DMARC)
  - [ ] Test email delivery
  - [ ] Set up webhook for delivery tracking
  - [ ] Use production email addresses

### Monitoring & Logging

- [ ] **Sentry Configuration** (if enabled)
  - [ ] Sentry DSN is configured
  - [ ] Source maps are uploaded
  - [ ] Error tracking is working
  - [ ] Performance monitoring is enabled
  - [ ] Session replay is configured

- [ ] **Application Logging**
  - [ ] Sync error logging is enabled
  - [ ] CMS webhook processing logs errors
  - [ ] API errors are captured
  - [ ] Audit logs are enabled

### Security Review

- [ ] **Security Advisor**
  - [ ] Run `supabase db lint`
  - [ ] Review and fix all CRITICAL issues
  - [ ] Review and fix WARNING issues
  - [ ] Document any accepted risks

- [ ] **Security Testing**
  - [ ] Test RLS policies
  - [ ] Verify tenant isolation
  - [ ] Test authentication flows
  - [ ] Check for SQL injection vulnerabilities
  - [ ] Verify CORS configuration
  - [ ] Test rate limiting

- [ ] **Secrets Management**
  - [ ] No secrets in source code
  - [ ] No secrets in git history
  - [ ] Environment variables are secured
  - [ ] API keys have appropriate permissions
  - [ ] Regular key rotation schedule established

### Performance

- [ ] **Database Performance**
  - [ ] Indexes are optimized
  - [ ] Query performance is acceptable
  - [ ] Connection pooling is configured
  - [ ] Database backups are enabled

- [ ] **Application Performance**
  - [ ] Build is optimized for production
  - [ ] Assets are minified
  - [ ] Code splitting is enabled
  - [ ] CDN is configured (if applicable)

### Compliance & Documentation

- [ ] **Documentation**
  - [ ] README.md is up to date
  - [ ] SECURITY.md is current
  - [ ] DEPLOYMENT_CHECKLIST.md is reviewed
  - [ ] API documentation is complete
  - [ ] Runbook is prepared

- [ ] **Compliance**
  - [ ] Data retention policies are implemented
  - [ ] Privacy policy is updated
  - [ ] Terms of service are current
  - [ ] GDPR compliance is verified (if applicable)
  - [ ] Data export functionality is working

### Testing

- [ ] **Functional Testing**
  - [ ] All features work as expected
  - [ ] User flows are tested
  - [ ] Error handling is verified
  - [ ] Edge cases are covered

- [ ] **Integration Testing**
  - [ ] Database integration works
  - [ ] Typesense integration works
  - [ ] CMS integrations work
  - [ ] Email sending works
  - [ ] Webhooks are processed correctly

- [ ] **Security Testing**
  - [ ] Authentication is working
  - [ ] Authorization is enforced
  - [ ] RLS policies are effective
  - [ ] No unauthorized access is possible

### Post-Deployment

- [ ] **Verification**
  - [ ] Application is accessible
  - [ ] Database is connected
  - [ ] All features are working
  - [ ] Monitoring is active
  - [ ] Logs are being collected

- [ ] **Communication**
  - [ ] Team is notified of deployment
  - [ ] Stakeholders are informed
  - [ ] Support team is briefed
  - [ ] Documentation is shared

- [ ] **Rollback Plan**
  - [ ] Rollback procedure is documented
  - [ ] Database backup is available
  - [ ] Previous version is accessible
  - [ ] Rollback can be executed if needed

## Critical Security Settings (Supabase Dashboard)

These settings MUST be configured manually in the Supabase Dashboard:

### Authentication > Policies
1. ✅ Enable "Leaked Password Protection"
2. ✅ Set minimum password length (12+ characters)
3. ✅ Enable password complexity requirements
4. ✅ Configure session timeout

### Authentication > MFA
1. ✅ Enable TOTP (Time-based One-Time Password)
2. ⚠️ Consider SMS MFA (requires Twilio)
3. ⚠️ Consider Phone MFA
4. ✅ Set MFA grace period
5. ⚠️ Make MFA mandatory for admin roles

### Database > Configuration
1. ✅ Enable connection pooling
2. ✅ Configure statement timeout
3. ✅ Set appropriate max connections

### Storage (if used)
1. ✅ Configure file size limits
2. ✅ Enable virus scanning (if available)
3. ✅ Set up storage policies

## Emergency Contacts

- **Technical Lead:** [Add contact]
- **Database Administrator:** [Add contact]
- **Security Team:** [Add contact]
- **DevOps Team:** [Add contact]

## Deployment Commands

```bash
# Run database migrations
supabase db push

# Check for security issues
supabase db lint

# Deploy edge functions
supabase functions deploy process-cms-webhook
supabase functions deploy sync-to-typesense
supabase functions deploy batch-sync-to-typesense
# ... deploy other functions as needed

# Build frontend
npm run build

# Preview production build
npm run preview
```

## Rollback Procedure

If issues are detected after deployment:

1. **Immediate Actions**
   ```bash
   # Revert to previous version (if using version control)
   git revert HEAD

   # Or restore from backup
   supabase db reset
   ```

2. **Communication**
   - Notify team of rollback
   - Document the issue
   - Create incident report

3. **Investigation**
   - Review logs
   - Identify root cause
   - Create fix plan
   - Test fix in staging

4. **Re-deployment**
   - Apply fix
   - Test thoroughly
   - Follow this checklist again

## Notes

- This checklist should be reviewed before every production deployment
- Update checklist as new features or security requirements are added
- Keep a copy of completed checklists for audit purposes
- Schedule regular security reviews (quarterly recommended)

---

**Last Updated:** 2025-11-17
**Version:** 1.0

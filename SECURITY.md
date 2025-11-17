# Security Documentation

## Overview

This document tracks security considerations, vulnerabilities, and fixes for the Supabase Admin application.

## Fixed Vulnerabilities

### ✅ CRITICAL: Security Definer Views (Issue #22)

**Status:** Fixed
**Date Fixed:** 2025-11-17
**Severity:** Critical
**CVSS Score:** N/A (Internal)

#### Description

Two database views were created with `SECURITY DEFINER` property, which caused them to execute with the view creator's permissions rather than the querying user's permissions. This bypassed Row Level Security (RLS) policies, potentially allowing unauthorized access to tenant data.

**Affected Views:**
- `public.embedding_statistics`
- `public.cms_connection_stats`

#### Root Cause

Views were created with `SECURITY DEFINER` option, which:
- Executes view queries with creator's privileges
- Bypasses Row Level Security policies
- Allows cross-tenant data access
- Violates principle of least privilege

#### Fix Applied

**Migration:** `migrations/20251117_fix_security_definer.sql`

1. Dropped existing views with `SECURITY DEFINER`
2. Recreated views without `SECURITY DEFINER`
3. Enabled `security_invoker` mode on both views
4. Added RLS policies to underlying tables:
   - `embedding_analytics`
   - `cms_connections`
   - `cms_sync_logs`
5. Ensured tenant isolation via `tenant_id` filtering

#### Impact

After fix:
- Views now respect Row Level Security policies
- Users can only access data within their tenant scope
- Proper permission checking is enforced
- Tenant isolation is maintained

#### Verification Steps

```sql
-- Verify security_invoker is enabled
SELECT
  c.relname as view_name,
  c.reloptions as options
FROM pg_class c
WHERE c.relname IN ('embedding_statistics', 'cms_connection_stats')
  AND c.relkind = 'v';

-- Expected output should show: security_invoker=on
```

#### References

- GitHub Issue: #22
- Detection: Supabase Security Advisor (Lint 0010)
- Documentation: [Supabase Security Definer Linter](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)

---

## Supabase Dashboard Configuration

The following security settings should be configured in the Supabase Dashboard:

### Authentication Security

#### Leaked Password Protection
**Status:** Requires Manual Configuration
**Location:** Supabase Dashboard > Authentication > Policies

Enable leaked password protection to prevent users from using compromised passwords:
1. Navigate to Authentication > Policies in Supabase Dashboard
2. Enable "Leaked Password Protection"
3. This checks passwords against known breach databases
4. Users will be required to choose a different password if detected

**Migration:** `migrations/20250117_enable_password_protection_and_mfa.sql` (documentation only)

#### Multi-Factor Authentication (MFA)
**Status:** Requires Manual Configuration
**Location:** Supabase Dashboard > Authentication > MFA

Enable additional MFA options for enhanced security:
1. Navigate to Authentication > MFA in Supabase Dashboard
2. Enable supported MFA methods:
   - **TOTP (Time-based One-Time Password)** - Already enabled
   - **SMS** - Configure if needed (requires Twilio integration)
   - **Phone** - Configure if needed
3. Consider making MFA mandatory for admin roles
4. Set MFA grace period appropriately

**Note:** These settings are configured at the project level in Supabase Dashboard and cannot be fully automated via migrations.

---

## Security Best Practices

### Database Security

1. **Row Level Security (RLS)**
   - Always enable RLS on tables containing sensitive data
   - Create policies that enforce tenant isolation
   - Test policies with different user roles
   - Never use `SECURITY DEFINER` on views unless absolutely necessary

2. **View Security**
   - Use `security_invoker` mode for views
   - Avoid `SECURITY DEFINER` unless specifically required
   - Document why `SECURITY DEFINER` is needed if used
   - Regular audit of view permissions

3. **Function Security**
   - Default to `SECURITY INVOKER` for functions
   - Use `SECURITY DEFINER` only when elevated privileges are required
   - Document all `SECURITY DEFINER` functions
   - Implement input validation in security definer functions

### Application Security

1. **Authentication**
   - Use Supabase Auth for user authentication
   - Implement proper session management
   - Enforce strong password policies
   - Enable MFA for administrative accounts

2. **Authorization**
   - Implement Role-Based Access Control (RBAC)
   - Enforce tenant isolation at application level
   - Validate user permissions before operations
   - Log all access to sensitive operations

3. **API Security**
   - Use environment variables for secrets
   - Never commit credentials to version control
   - Implement rate limiting
   - Validate and sanitize all inputs

### Tenant Isolation

1. **Database Level**
   - Every table should have `tenant_id` column
   - RLS policies must filter by `tenant_id`
   - Foreign keys should respect tenant boundaries
   - Test cross-tenant access attempts

2. **Application Level**
   - Always filter queries by current user's tenant
   - Validate tenant access before operations
   - Log potential cross-tenant access attempts
   - Implement tenant context in all queries

## Security Checklist

### Before Deployment

- [ ] All tables have RLS enabled
- [ ] RLS policies properly enforce tenant isolation
- [ ] No views use `SECURITY DEFINER` without justification
- [ ] All `SECURITY DEFINER` usage is documented
- [ ] Environment variables are properly configured
- [ ] No secrets in source code
- [ ] API keys are rotated regularly
- [ ] Dependencies are up to date
- [ ] Security headers are configured
- [ ] HTTPS is enforced

### Regular Security Audits

- [ ] Run Supabase Security Advisor monthly
- [ ] Review RLS policies quarterly
- [ ] Audit user permissions quarterly
- [ ] Review access logs for anomalies
- [ ] Update dependencies regularly
- [ ] Rotate API keys and secrets
- [ ] Review and update security documentation

## Incident Response

### Security Incident Procedure

1. **Detect** - Monitor logs and alerts
2. **Contain** - Isolate affected systems
3. **Investigate** - Determine scope and impact
4. **Remediate** - Apply fixes
5. **Verify** - Confirm fix effectiveness
6. **Document** - Update security documentation
7. **Review** - Conduct post-mortem

### Emergency Contacts

- Technical Lead: [Add contact]
- Security Team: [Add contact]
- DBA: [Add contact]

## Security Tools

### Supabase Security Advisor

Regular linting of database schema:
```bash
# Run security advisor
supabase db lint

# View specific lint rule
supabase db lint --level warning
```

### Common Lints to Watch

- **0010**: Security Definer Views
- **0011**: Security Definer Functions
- **0012**: RLS Disabled
- **0013**: Unindexed Foreign Keys
- **0014**: Unused Indexes

## Compliance

### Data Protection

- Ensure GDPR compliance for EU users
- Implement data retention policies
- Provide data export capabilities
- Enable data deletion on user request

### Audit Logging

- Log all authentication attempts
- Log administrative actions
- Log data access patterns
- Retain logs according to policy

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** create a public GitHub issue
2. Contact security team directly at [security-email]
3. Provide detailed description and reproduction steps
4. Allow time for investigation and fix before disclosure

## Version History

- **2025-11-17**: Fixed Security Definer Views vulnerability (migration created)
- **2025-11-17**: Added Supabase Dashboard configuration notes
- **2025-11-17**: Documented leaked password protection and MFA requirements
- **2025-01-17**: Initial security documentation created

## Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/security)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

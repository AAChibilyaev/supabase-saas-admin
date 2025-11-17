# Email Service Quick Start

Get started with the Resend email service in 5 minutes.

## 1. Get Your Resend API Key

1. Sign up at [https://resend.com](https://resend.com)
2. Navigate to **API Keys** section
3. Create a new API key
4. Copy the key (starts with `re_`)

## 2. Configure Environment Variables

Create a `.env` file (if not exists) and add:

```bash
VITE_RESEND_API_KEY=re_your_resend_api_key_here
VITE_EMAIL_FROM=noreply@yourdomain.com
```

## 3. Set Edge Function Secrets

```bash
supabase secrets set RESEND_API_KEY=re_your_resend_api_key_here
supabase secrets set EMAIL_FROM=noreply@yourdomain.com
```

## 4. Deploy Edge Function

```bash
npm run functions:deploy:email
```

## 5. Run Database Migration

```bash
npm run db:push
```

## 6. Send Your First Email

```typescript
import { sendEmail, EmailType } from '@/services/email'

// Send a simple email
await sendEmail({
  to: 'user@example.com',
  subject: 'Hello from Resend!',
  html: '<h1>Hello!</h1><p>Your email service is working!</p>',
  type: EmailType.NOTIFICATION,
})
```

## 7. Send a Welcome Email

```typescript
import { sendWelcomeEmail, EmailType } from '@/services/email'

await sendWelcomeEmail({
  email: 'newuser@example.com',
  type: EmailType.WELCOME,
  userName: 'John Doe',
  tenantName: 'Acme Corp',
})
```

## 8. Test the Service

```bash
# Test with your email
npm run test:email -- --to your@email.com

# Test specific email type
npm run test:email -- --to your@email.com --type welcome
```

## Available Email Functions

| Function | Use Case |
|----------|----------|
| `sendEmail()` | Base function for any email |
| `sendWelcomeEmail()` | Welcome new users |
| `sendTeamInvitation()` | Invite users to teams |
| `sendUsageAlert()` | Send quota warnings |
| `sendBillingNotification()` | Billing updates |
| `sendPasswordResetEmail()` | Password resets |
| `sendNotificationEmail()` | General notifications |

## Example: Team Invitation

```typescript
import { sendTeamInvitation, EmailType } from '@/services/email'

await sendTeamInvitation({
  email: 'newmember@example.com',
  type: EmailType.INVITATION,
  token: 'unique_invitation_token',
  inviterName: 'Jane Smith',
  tenantName: 'Acme Corp',
  role: 'Developer',
  message: 'Welcome to our team!',
})
```

## Example: Usage Alert

```typescript
import { sendUsageAlert, EmailType } from '@/services/email'

await sendUsageAlert({
  email: 'admin@example.com',
  type: EmailType.USAGE_ALERT,
  tenantName: 'Acme Corp',
  quotaType: 'API Requests',
  percentage: 85,
  currentUsage: 85000,
  limit: 100000,
})
```

## Check Email Tracking

```typescript
import { supabase } from '@/lib/supabase'

// Get recent emails
const { data } = await supabase
  .from('email_tracking')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10)

console.log('Recent emails:', data)
```

## Production Checklist

Before going to production:

- [ ] Verify domain in Resend dashboard
- [ ] Configure DNS records (SPF, DKIM, DMARC)
- [ ] Update email addresses in `.env`
- [ ] Set production secrets in Supabase
- [ ] Test all email types
- [ ] Monitor delivery rates
- [ ] Set up Resend webhooks (optional)

## Need Help?

- [Full Documentation](./EMAIL_SERVICE_GUIDE.md)
- [Edge Function README](../supabase/functions/send-email/README.md)
- [GitHub Issues](https://github.com/AAChibilyaev/supabase-saas-admin/issues)

## Next Steps

1. Customize email templates in `src/services/email.ts`
2. Set up automated usage alerts
3. Configure billing email notifications
4. Add email preferences UI
5. Monitor email delivery rates

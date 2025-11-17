# Email Service - Quick Start Guide

Get started with the Resend email service integration in 5 minutes.

## 1. Setup Resend Account

1. Visit [resend.com](https://resend.com) and create an account
2. Verify your email address
3. Generate an API key from the dashboard

## 2. Configure Environment

Add to your `.env` file:

```bash
VITE_RESEND_API_KEY=re_your_api_key_here
VITE_EMAIL_FROM=noreply@yourdomain.com
```

## 3. Run Database Migration

```bash
npx supabase db push
```

This creates the necessary tables for email tracking, preferences, and templates.

## 4. Send Your First Email

### Welcome Email

```typescript
import { sendWelcomeEmail, EmailType } from '@/services/email'

await sendWelcomeEmail({
  type: EmailType.WELCOME,
  email: 'user@example.com',
  userName: 'John Doe',
  tenantName: 'Acme Corp',
})
```

### Team Invitation

```typescript
import { sendInvitationEmail, EmailType } from '@/services/email'

await sendInvitationEmail({
  type: EmailType.INVITATION,
  email: 'newuser@example.com',
  token: 'invitation-token-123',
  inviterName: 'Jane Smith',
  tenantName: 'Acme Corp',
  role: 'member',
})
```

### Password Reset

```typescript
import { sendPasswordResetEmail, EmailType } from '@/services/email'

await sendPasswordResetEmail({
  type: EmailType.PASSWORD_RESET,
  email: 'user@example.com',
  token: 'reset-token-123',
  userName: 'John Doe',
})
```

### Usage Alert

```typescript
import { sendUsageAlertEmail, EmailType } from '@/services/email'

await sendUsageAlertEmail({
  type: EmailType.USAGE_ALERT,
  email: 'admin@example.com',
  tenantName: 'Acme Corp',
  quotaType: 'API Requests',
  percentage: 85,
  currentUsage: 85000,
  limit: 100000,
})
```

## 5. Add Email Preferences to Settings

```tsx
import { EmailPreferencesSettings } from '@/components/EmailPreferences'

function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <EmailPreferencesSettings />
    </div>
  )
}
```

## 6. (Optional) Add Template Editor for Admins

```tsx
import { EmailTemplateEditor } from '@/components/EmailTemplateEditor'

function AdminPage() {
  return (
    <div>
      <h1>Email Templates</h1>
      <EmailTemplateEditor />
    </div>
  )
}
```

## Available Email Types

- `WELCOME` - New user welcome emails
- `INVITATION` - Team invitations
- `PASSWORD_RESET` - Password reset requests
- `NOTIFICATION` - General notifications
- `USAGE_ALERT` - Usage quota alerts
- `BILLING` - Billing and payment notifications
- `SYSTEM_ALERT` - Critical system alerts
- `MARKETING` - Marketing and newsletters

## Features

- Automatic retry with exponential backoff
- Email delivery tracking
- User preference management
- Customizable templates
- Bulk email sending
- Comprehensive error handling

## Production Setup

Before going live:

1. Verify your sending domain in Resend
2. Configure DNS records (SPF, DKIM, DMARC)
3. Set up webhooks for delivery tracking
4. Test all email templates
5. Monitor deliverability metrics

## Need Help?

- Full documentation: `/docs/EMAIL_SERVICE.md`
- Resend docs: [resend.com/docs](https://resend.com/docs)
- Create an issue if you encounter problems

## Common Issues

### Emails not sending?
- Check if `VITE_RESEND_API_KEY` is set
- Verify API key in Resend dashboard
- Check console for errors

### Emails going to spam?
- Verify your sending domain
- Configure SPF and DKIM records
- Use proper email structure with unsubscribe links

### Template variables not working?
- Use double curly braces: `{{variableName}}`
- Check that all required variables are passed
- Preview templates before sending

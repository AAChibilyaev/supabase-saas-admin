# Email Service Guide (Resend Integration)

This guide covers the complete implementation of the email service using Resend for transactional email notifications in the Supabase SaaS Admin platform.

## Overview

The email service provides:
- Team invitations
- Usage alerts (quota warnings)
- Billing notifications
- Welcome emails
- Password reset emails
- Custom notifications
- Email tracking and delivery status
- User email preferences management

## Table of Contents

1. [Setup](#setup)
2. [Configuration](#configuration)
3. [Usage Examples](#usage-examples)
4. [Edge Function](#edge-function)
5. [Email Templates](#email-templates)
6. [Database Schema](#database-schema)
7. [Testing](#testing)
8. [Production Deployment](#production-deployment)

## Setup

### 1. Install Dependencies

The `resend` package is already included in package.json:

```bash
npm install resend
```

### 2. Get Resend API Key

1. Sign up at [https://resend.com](https://resend.com)
2. Navigate to API Keys section
3. Create a new API key
4. Copy the key (starts with `re_`)

### 3. Configure Environment Variables

Update your `.env` file:

```bash
# Client-side (for browser usage)
VITE_RESEND_API_KEY=re_your_resend_api_key
VITE_EMAIL_FROM=noreply@yourdomain.com
VITE_EMAIL_FROM_ALERTS=alerts@yourdomain.com
VITE_EMAIL_FROM_NOTIFICATIONS=notifications@yourdomain.com
```

### 4. Configure Edge Function Secrets

Set up secrets for the Edge Function:

```bash
# Set Resend API key
supabase secrets set RESEND_API_KEY=re_your_resend_api_key

# Optional: Set custom email addresses
supabase secrets set EMAIL_FROM=noreply@yourdomain.com
supabase secrets set EMAIL_FROM_ALERTS=alerts@yourdomain.com
supabase secrets set EMAIL_FROM_NOTIFICATIONS=notifications@yourdomain.com
```

### 5. Deploy Edge Function

```bash
# Deploy the send-email Edge Function
supabase functions deploy send-email

# Test the function
supabase functions invoke send-email --method POST --body '{
  "to": "test@example.com",
  "subject": "Test Email",
  "html": "<p>Hello World!</p>",
  "type": "notification"
}'
```

### 6. Run Database Migration

```bash
# Apply the email service migration
supabase db push
```

## Configuration

### Email Domain Setup (Production)

For production use, you need to verify your domain:

1. **Add Domain in Resend Dashboard**
   - Go to Resend Dashboard > Domains
   - Add your domain (e.g., `yourdomain.com`)

2. **Configure DNS Records**
   - Add SPF record: `v=spf1 include:resend.com ~all`
   - Add DKIM records (provided by Resend)
   - Add DMARC record: `v=DMARC1; p=none;`

3. **Verify Domain**
   - Wait for DNS propagation (can take up to 48 hours)
   - Verify in Resend dashboard

## Usage Examples

### 1. Send Welcome Email

```typescript
import { sendWelcomeEmail, EmailType } from '@/services/email'

await sendWelcomeEmail({
  email: 'user@example.com',
  type: EmailType.WELCOME,
  userName: 'John Doe',
  tenantName: 'Acme Corp',
  loginUrl: 'https://app.example.com/login',
})
```

### 2. Send Team Invitation

```typescript
import { sendTeamInvitation, EmailType } from '@/services/email'

await sendTeamInvitation({
  email: 'newmember@example.com',
  type: EmailType.INVITATION,
  token: 'invitation_token_here',
  inviterName: 'Jane Smith',
  tenantName: 'Acme Corp',
  role: 'Developer',
  message: 'Welcome to our team! We are excited to have you.',
})
```

### 3. Send Usage Alert

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

### 4. Send Billing Notification

```typescript
import { sendBillingNotification, EmailType } from '@/services/email'

await sendBillingNotification({
  email: 'billing@example.com',
  type: EmailType.BILLING,
  tenantName: 'Acme Corp',
  action: 'invoice',
  amount: 9900, // $99.00 in cents
  dueDate: '2025-02-01',
  invoiceUrl: 'https://app.example.com/invoices/inv_123',
})
```

### 5. Send Custom Email (Base Function)

```typescript
import { sendEmail, EmailType } from '@/services/email'

await sendEmail({
  to: 'recipient@example.com',
  subject: 'Custom Email Subject',
  html: '<h1>Hello!</h1><p>This is a custom email.</p>',
  type: EmailType.NOTIFICATION,
  from: 'custom@yourdomain.com', // Optional
  metadata: {
    customField: 'value',
  },
})
```

### 6. Send Bulk Emails

```typescript
import { sendBulkEmails, EmailType } from '@/services/email'

const emails = [
  {
    email: 'user1@example.com',
    type: EmailType.WELCOME,
    userName: 'User 1',
    tenantName: 'Acme Corp',
  },
  {
    email: 'user2@example.com',
    type: EmailType.WELCOME,
    userName: 'User 2',
    tenantName: 'Acme Corp',
  },
]

await sendBulkEmails(emails)
```

## Edge Function

The Edge Function (`send-email`) provides a serverless endpoint for sending emails:

### Endpoint

```
POST https://your-project.supabase.co/functions/v1/send-email
```

### Request Format

```json
{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "html": "<p>Email content</p>",
  "type": "notification",
  "from": "optional@yourdomain.com",
  "metadata": {
    "customField": "value"
  }
}
```

### Response Format

```json
{
  "success": true,
  "emailId": "email_id_from_resend"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message"
}
```

### Using from Client

```typescript
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase.functions.invoke('send-email', {
  body: {
    to: 'recipient@example.com',
    subject: 'Test Email',
    html: '<p>Hello World!</p>',
    type: 'notification',
  },
})

if (error) {
  console.error('Failed to send email:', error)
} else {
  console.log('Email sent:', data.emailId)
}
```

## Email Templates

All email templates include:
- Responsive HTML design
- Inline CSS for compatibility
- Professional styling
- Call-to-action buttons
- Footer with preferences link

### Available Templates

1. **Welcome Email** - Onboarding new users
2. **Team Invitation** - Inviting users to join a team
3. **Password Reset** - Password recovery
4. **Usage Alert** - Quota threshold warnings
5. **Billing Notification** - Payment and subscription updates
6. **Custom Notification** - Flexible notification template

### Customizing Templates

Email templates are generated using functions in `src/services/email.ts`. To customize:

1. Locate the template function (e.g., `generateWelcomeEmailHtml`)
2. Modify the HTML structure
3. Update the `getEmailStyles()` function for global styles

Example:

```typescript
function generateWelcomeEmailHtml(data: {
  userName: string
  tenantName?: string
  loginUrl: string
}): string {
  const { userName, tenantName, loginUrl } = data

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${getEmailStyles()}
      </head>
      <body>
        <!-- Your custom HTML here -->
      </body>
    </html>
  `
}
```

## Database Schema

### email_tracking

Tracks all sent emails:

```sql
CREATE TABLE email_tracking (
  id UUID PRIMARY KEY,
  email_id TEXT,              -- Resend email ID
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,       -- pending, sent, delivered, failed, bounced
  metadata JSONB,
  error TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### email_preferences

User email notification preferences:

```sql
CREATE TABLE email_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  notifications BOOLEAN,
  marketing BOOLEAN,
  usage_alerts BOOLEAN,
  billing BOOLEAN,
  system_alerts BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### email_templates

Customizable email templates (optional):

```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE,
  type TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_template TEXT NOT NULL,
  variables JSONB,
  is_active BOOLEAN,
  version INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

## Testing

### 1. Test Email Service Locally

```typescript
// Create a test file: src/__tests__/email.test.ts
import { sendEmail, EmailType } from '@/services/email'

async function testEmailService() {
  try {
    const result = await sendEmail({
      to: 'your-email@example.com',
      subject: 'Test Email',
      html: '<h1>Test</h1><p>This is a test email.</p>',
      type: EmailType.NOTIFICATION,
    })

    console.log('Email sent successfully:', result)
  } catch (error) {
    console.error('Email failed:', error)
  }
}

testEmailService()
```

### 2. Test Edge Function

```bash
# Test using Supabase CLI
supabase functions invoke send-email --method POST --body '{
  "to": "test@example.com",
  "subject": "Test",
  "html": "<p>Test email</p>",
  "type": "notification"
}'

# Test using curl
curl -X POST https://your-project.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test email</p>",
    "type": "notification"
  }'
```

### 3. Check Email Tracking

```typescript
import { supabase } from '@/lib/supabase'

// Get all sent emails
const { data: emails } = await supabase
  .from('email_tracking')
  .select('*')
  .order('created_at', { ascending: false })

console.log('Recent emails:', emails)

// Get email statistics
const { data: stats } = await supabase
  .from('email_statistics')
  .select('*')

console.log('Email statistics:', stats)
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] Verify domain in Resend dashboard
- [ ] Configure DNS records (SPF, DKIM, DMARC)
- [ ] Set production email addresses
- [ ] Set Edge Function secrets
- [ ] Test email delivery
- [ ] Set up Resend webhooks (optional)
- [ ] Monitor email delivery rates
- [ ] Configure rate limits
- [ ] Set up email quota alerts

### Setting Up Webhooks (Optional)

Resend can send webhooks for delivery events:

1. **Create Webhook Endpoint**
   - Create an Edge Function to handle webhooks
   - Verify webhook signatures

2. **Configure in Resend Dashboard**
   - Go to Webhooks section
   - Add your webhook URL
   - Select events: delivered, bounced, complained

3. **Update Email Status**
   ```typescript
   import { updateEmailStatus, EmailStatus } from '@/services/email'

   await updateEmailStatus(
     emailId,
     EmailStatus.DELIVERED,
     { deliveredAt: new Date() }
   )
   ```

### Monitoring

Track email performance:

```typescript
import { supabase } from '@/lib/supabase'

// Get delivery rate
const { data: stats } = await supabase
  .from('email_tracking')
  .select('status')
  .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

const total = stats?.length || 0
const delivered = stats?.filter(s => s.status === 'delivered').length || 0
const rate = (delivered / total) * 100

console.log(`Delivery rate: ${rate.toFixed(2)}%`)
```

### Rate Limits

Resend free tier limits:
- 100 emails/day
- 3,000 emails/month

For production:
- Upgrade to paid plan
- Implement rate limiting in code
- Queue emails for batch sending
- Monitor quota usage

## API Reference

### Core Functions

#### sendEmail(options)
Base function for sending emails with retry logic.

```typescript
sendEmail({
  to: string
  subject: string
  html: string
  from?: string
  type: EmailType
  metadata?: Record<string, unknown>
}): Promise<{ id: string; status: EmailStatus }>
```

#### sendWelcomeEmail(data)
Send welcome email to new users.

```typescript
sendWelcomeEmail({
  email: string
  type: EmailType.WELCOME
  userName: string
  tenantName?: string
  loginUrl?: string
}): Promise<void>
```

#### sendTeamInvitation(data)
Send team invitation email.

```typescript
sendTeamInvitation({
  email: string
  type: EmailType.INVITATION
  token: string
  inviterName: string
  tenantName: string
  role: string
  message?: string
}): Promise<void>
```

#### sendUsageAlert(data)
Send usage quota alert email.

```typescript
sendUsageAlert({
  email: string
  type: EmailType.USAGE_ALERT
  tenantName: string
  quotaType: string
  percentage: number
  currentUsage: number
  limit: number
}): Promise<void>
```

#### sendBillingNotification(data)
Send billing notification email.

```typescript
sendBillingNotification({
  email: string
  type: EmailType.BILLING
  tenantName: string
  action: 'invoice' | 'payment_failed' | 'subscription_cancelled' | 'subscription_renewed'
  amount?: number
  dueDate?: string
  invoiceUrl?: string
}): Promise<void>
```

### Utility Functions

#### getEmailPreferences(userId)
Get user email preferences.

```typescript
getEmailPreferences(userId: string): Promise<EmailPreferences>
```

#### updateEmailPreferences(userId, preferences)
Update user email preferences.

```typescript
updateEmailPreferences(
  userId: string,
  preferences: Partial<EmailPreferences>
): Promise<void>
```

#### updateEmailStatus(emailId, status, metadata)
Update email delivery status (for webhooks).

```typescript
updateEmailStatus(
  emailId: string,
  status: EmailStatus,
  metadata?: Record<string, unknown>
): Promise<void>
```

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Check RESEND_API_KEY is set correctly
   - Verify domain is verified in Resend
   - Check Resend API logs

2. **Emails going to spam**
   - Verify SPF/DKIM/DMARC records
   - Use verified domain
   - Avoid spam trigger words

3. **Rate limit exceeded**
   - Upgrade Resend plan
   - Implement email queuing
   - Use batch sending

4. **Edge Function timeout**
   - Optimize email templates
   - Use async sending
   - Increase function timeout

### Support

- Resend Documentation: [https://resend.com/docs](https://resend.com/docs)
- Resend Support: [support@resend.com](mailto:support@resend.com)
- Issue Tracker: [GitHub Issues](https://github.com/AAChibilyaev/supabase-saas-admin/issues)

## Related Documentation

- [TEAM_COLLABORATION.md](/TEAM_COLLABORATION.md) - Team invitation workflows
- [BILLING_SUMMARY.md](/BILLING_SUMMARY.md) - Billing notification integration
- [SECURITY.md](/SECURITY.md) - Email security best practices

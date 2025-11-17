# Email Service Integration (Resend)

This document provides comprehensive information about the email service integration using Resend.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Configuration](#configuration)
- [Email Types](#email-types)
- [Usage](#usage)
- [Email Tracking](#email-tracking)
- [Email Preferences](#email-preferences)
- [Email Templates](#email-templates)
- [API Reference](#api-reference)
- [Webhooks](#webhooks)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The email service provides a comprehensive solution for sending transactional and marketing emails using Resend. It includes:

- **Retry Logic**: Automatic retry with exponential backoff for failed emails
- **Email Tracking**: Track delivery status, bounces, and complaints
- **User Preferences**: Allow users to manage their email notification preferences
- **Template Management**: Customizable email templates with variables
- **Multiple Email Types**: Support for various email scenarios

## Setup

### 1. Create Resend Account

1. Go to [Resend](https://resend.com) and create an account
2. Verify your domain or use the Resend sandbox domain for testing
3. Generate an API key from the dashboard

### 2. Configure DNS Records

For production use, configure the following DNS records for your sending domain:

#### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all
```

#### DKIM Records
Add the DKIM records provided by Resend in your domain settings.

### 3. Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Resend API Key (required)
VITE_RESEND_API_KEY=re_xxxxxxxxxxxxx

# Email From Addresses (optional, defaults provided)
VITE_EMAIL_FROM=noreply@yourdomain.com
VITE_EMAIL_FROM_ALERTS=alerts@yourdomain.com
VITE_EMAIL_FROM_NOTIFICATIONS=notifications@yourdomain.com
```

### 4. Database Migration

Run the email service migration to create the necessary tables:

```bash
npx supabase db push
```

This will create:
- `email_tracking` - Track all sent emails
- `email_preferences` - User email preferences
- `email_templates` - Customizable email templates

## Configuration

### Email Configuration

The email service is configured in `src/services/email.ts`:

```typescript
const EMAIL_CONFIG = {
  from: import.meta.env.VITE_EMAIL_FROM || 'noreply@yourdomain.com',
  fromAlerts: import.meta.env.VITE_EMAIL_FROM_ALERTS || 'alerts@yourdomain.com',
  fromNotifications: import.meta.env.VITE_EMAIL_FROM_NOTIFICATIONS || 'notifications@yourdomain.com',
  maxRetries: 3,
  retryDelay: 1000, // 1 second
}
```

### Retry Logic

Emails are sent with exponential backoff retry logic:
- Initial delay: 1 second
- Maximum retries: 3
- Backoff multiplier: 2x

Example retry timeline:
- Attempt 1: Immediate
- Attempt 2: After 1 second
- Attempt 3: After 2 seconds
- Attempt 4: After 4 seconds (final)

## Email Types

The service supports the following email types:

### 1. Welcome Email
Sent when a new user signs up.

```typescript
await sendWelcomeEmail({
  type: EmailType.WELCOME,
  email: 'user@example.com',
  userName: 'John Doe',
  tenantName: 'Acme Corp',
  loginUrl: 'https://app.example.com/login',
})
```

### 2. Invitation Email
Sent when a user is invited to join a team.

```typescript
await sendInvitationEmail({
  type: EmailType.INVITATION,
  email: 'user@example.com',
  token: 'invitation-token-123',
  inviterName: 'Jane Smith',
  tenantName: 'Acme Corp',
  role: 'member',
  message: 'Welcome to the team!',
})
```

### 3. Password Reset Email
Sent when a user requests a password reset.

```typescript
await sendPasswordResetEmail({
  type: EmailType.PASSWORD_RESET,
  email: 'user@example.com',
  token: 'reset-token-123',
  userName: 'John Doe',
  expiresIn: '1 hour',
})
```

### 4. Notification Email
Sent for general notifications.

```typescript
await sendNotificationEmail({
  type: EmailType.NOTIFICATION,
  email: 'user@example.com',
  title: 'New Comment on Your Post',
  body: 'Someone commented on your post "Hello World"',
  link: 'https://app.example.com/posts/123',
  priority: 'medium',
})
```

### 5. Usage Alert Email
Sent when usage approaches limits.

```typescript
await sendUsageAlertEmail({
  type: EmailType.USAGE_ALERT,
  email: 'user@example.com',
  tenantName: 'Acme Corp',
  quotaType: 'API Requests',
  percentage: 85,
  currentUsage: 85000,
  limit: 100000,
})
```

### 6. Billing Email
Sent for billing-related events.

```typescript
await sendBillingEmail({
  type: EmailType.BILLING,
  email: 'user@example.com',
  tenantName: 'Acme Corp',
  action: 'invoice',
  amount: 2999, // in cents
  dueDate: '2025-02-01',
  invoiceUrl: 'https://app.example.com/invoices/123',
})
```

## Usage

### Sending a Single Email

```typescript
import { sendWelcomeEmail, EmailType } from '@/services/email'

try {
  await sendWelcomeEmail({
    type: EmailType.WELCOME,
    email: 'user@example.com',
    userName: 'John Doe',
    tenantName: 'Acme Corp',
  })
  console.log('Email sent successfully')
} catch (error) {
  console.error('Failed to send email:', error)
}
```

### Sending Bulk Emails

```typescript
import { sendBulkEmails, EmailType } from '@/services/email'

const emails = [
  {
    type: EmailType.NOTIFICATION,
    email: 'user1@example.com',
    title: 'System Maintenance',
    body: 'Scheduled maintenance tonight at 10 PM',
  },
  {
    type: EmailType.NOTIFICATION,
    email: 'user2@example.com',
    title: 'System Maintenance',
    body: 'Scheduled maintenance tonight at 10 PM',
  },
]

await sendBulkEmails(emails)
```

## Email Tracking

All sent emails are automatically tracked in the `email_tracking` table:

```typescript
// View email tracking data
const { data: tracking } = await supabase
  .from('email_tracking')
  .select('*')
  .eq('recipient', 'user@example.com')
  .order('created_at', { ascending: false })
```

### Tracking Fields

- `email_id`: Resend email ID
- `recipient`: Email address
- `subject`: Email subject
- `type`: Email type (welcome, invitation, etc.)
- `status`: Current status (pending, sent, delivered, failed, bounced, complained)
- `metadata`: Additional metadata (tenant_id, user_id, etc.)
- `error`: Error message if failed
- `sent_at`: When email was sent
- `delivered_at`: When email was delivered
- `bounced_at`: When email bounced
- `created_at`: When record was created
- `updated_at`: When record was last updated

### Email Statistics

View aggregated email statistics:

```typescript
const { data: stats } = await supabase
  .from('email_statistics')
  .select('*')
  .gte('date', '2025-01-01')
```

## Email Preferences

Users can manage their email preferences through the `EmailPreferencesSettings` component.

### Preference Types

- **Notifications**: General notifications and updates
- **Marketing**: Newsletters and promotional content
- **Usage Alerts**: Usage quota notifications
- **Billing**: Invoices and payment alerts
- **System Alerts**: Critical system notifications

### Managing Preferences

```typescript
import { getEmailPreferences, updateEmailPreferences } from '@/services/email'

// Get user preferences
const preferences = await getEmailPreferences(userId)

// Update preferences
await updateEmailPreferences(userId, {
  notifications: true,
  marketing: false,
  usageAlerts: true,
  billing: true,
  systemAlerts: true,
})
```

### Using in Components

```tsx
import { EmailPreferencesSettings } from '@/components/EmailPreferences'

function SettingsPage() {
  return (
    <div>
      <h1>Email Preferences</h1>
      <EmailPreferencesSettings />
    </div>
  )
}
```

## Email Templates

### Default Templates

The system includes default templates for all email types. These can be customized through the `EmailTemplateEditor` component or directly in the database.

### Template Variables

Templates support variable interpolation using double curly braces:

```html
<h1>Welcome {{userName}}!</h1>
<p>You've been invited to join {{tenantName}}.</p>
```

### Using the Template Editor

```tsx
import { EmailTemplateEditor } from '@/components/EmailTemplateEditor'

function AdminPage() {
  return (
    <div>
      <h1>Email Template Editor</h1>
      <EmailTemplateEditor />
    </div>
  )
}
```

### Creating Custom Templates

```typescript
const { error } = await supabase
  .from('email_templates')
  .insert({
    name: 'custom_welcome',
    type: 'welcome',
    subject: 'Welcome to {{tenantName}}!',
    html_template: '<h1>Hello {{userName}}!</h1>',
    variables: ['userName', 'tenantName'],
    is_active: true,
  })
```

## API Reference

### Email Service Functions

#### `sendWelcomeEmail(data: WelcomeEmailData): Promise<void>`
Send a welcome email to a new user.

#### `sendInvitationEmail(data: InvitationEmailData): Promise<void>`
Send a team invitation email.

#### `sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void>`
Send a password reset email.

#### `sendNotificationEmail(data: NotificationEmailData): Promise<void>`
Send a notification email.

#### `sendUsageAlertEmail(data: UsageAlertEmailData): Promise<void>`
Send a usage alert email.

#### `sendBillingEmail(data: BillingEmailData): Promise<void>`
Send a billing-related email.

#### `sendBulkEmails(emails: EmailData[]): Promise<void>`
Send multiple emails in bulk.

#### `getEmailPreferences(userId: string): Promise<EmailPreferences>`
Get email preferences for a user.

#### `updateEmailPreferences(userId: string, preferences: Partial<EmailPreferences>): Promise<void>`
Update email preferences for a user.

#### `updateEmailStatus(emailId: string, status: EmailStatus, metadata?: Record<string, unknown>): Promise<void>`
Update the delivery status of an email (for webhook handlers).

## Webhooks

### Setting Up Webhooks

Configure webhooks in your Resend dashboard to receive delivery status updates:

1. Go to Resend Dashboard > Webhooks
2. Add a new webhook endpoint: `https://yourdomain.com/api/webhooks/resend`
3. Select events: `email.delivered`, `email.bounced`, `email.complained`

### Webhook Handler Example

```typescript
// Edge Function or API endpoint
export async function handleResendWebhook(request: Request) {
  const event = await request.json()

  switch (event.type) {
    case 'email.delivered':
      await updateEmailStatus(
        event.data.email_id,
        EmailStatus.DELIVERED,
        event.data
      )
      break

    case 'email.bounced':
      await updateEmailStatus(
        event.data.email_id,
        EmailStatus.BOUNCED,
        event.data
      )
      break

    case 'email.complained':
      await updateEmailStatus(
        event.data.email_id,
        EmailStatus.COMPLAINED,
        event.data
      )
      break
  }

  return new Response('OK', { status: 200 })
}
```

## Best Practices

### 1. Use Appropriate Email Types
Always use the correct email type to ensure proper tracking and user preference handling.

### 2. Include Metadata
Add metadata to emails for better tracking:

```typescript
await sendNotificationEmail({
  type: EmailType.NOTIFICATION,
  email: 'user@example.com',
  title: 'New Message',
  body: 'You have a new message',
  metadata: {
    tenant_id: 'tenant-123',
    user_id: 'user-456',
    notification_id: 'notif-789',
  },
})
```

### 3. Handle Errors Gracefully
Always wrap email sending in try-catch blocks:

```typescript
try {
  await sendWelcomeEmail(data)
} catch (error) {
  console.error('Email failed:', error)
  // Log to error tracking service
  // Show user-friendly message
}
```

### 4. Test Email Templates
Always preview and test email templates before deploying:
- Use the Email Template Editor to preview changes
- Send test emails to yourself
- Test on multiple email clients

### 5. Monitor Deliverability
Regularly check email statistics:
- Delivery rate
- Bounce rate
- Complaint rate
- Open rate (if tracking is enabled)

### 6. Respect User Preferences
Always check user preferences before sending marketing emails:

```typescript
const preferences = await getEmailPreferences(userId)
if (preferences.marketing) {
  await sendMarketingEmail(data)
}
```

## Troubleshooting

### Emails Not Sending

1. **Check API Key**
   - Verify `VITE_RESEND_API_KEY` is set correctly
   - Check if API key is active in Resend dashboard

2. **Check Domain Verification**
   - Ensure sending domain is verified
   - Check SPF and DKIM records

3. **Check Logs**
   - View email tracking table for error messages
   - Check browser console for errors

### Emails Going to Spam

1. **Domain Authentication**
   - Verify SPF, DKIM, and DMARC records
   - Use a verified sending domain

2. **Email Content**
   - Avoid spam trigger words
   - Include unsubscribe link
   - Use proper HTML structure

3. **Sender Reputation**
   - Monitor bounce and complaint rates
   - Avoid sending to invalid addresses

### Template Variables Not Working

1. **Check Variable Syntax**
   - Use double curly braces: `{{variableName}}`
   - Ensure variable names match exactly

2. **Verify Variables**
   - Check that all required variables are passed
   - Review template in Email Template Editor

### Database Errors

1. **Run Migrations**
   ```bash
   npx supabase db push
   ```

2. **Check RLS Policies**
   - Ensure user has proper permissions
   - Check if service role is configured correctly

## Support

For additional help:
- [Resend Documentation](https://resend.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- Project Issues: Create an issue in the repository

## License

This email service integration is part of the Supabase Admin project.

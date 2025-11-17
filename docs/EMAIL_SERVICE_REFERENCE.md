# Email Service API Reference

Quick reference for all email service functions and types.

## Import Statement

```typescript
import {
  // Functions
  sendEmail,
  sendWelcomeEmail,
  sendTeamInvitation,
  sendUsageAlert,
  sendBillingNotification,
  sendInvitationEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
  sendUsageAlertEmail,
  sendBillingEmail,
  sendBulkEmails,
  getEmailPreferences,
  updateEmailPreferences,
  updateEmailStatus,

  // Types
  EmailType,
  EmailStatus,
  type EmailData,
  type WelcomeEmailData,
  type InvitationEmailData,
  type PasswordResetEmailData,
  type NotificationEmailData,
  type UsageAlertEmailData,
  type BillingEmailData,
  type EmailPreferences,
} from '@/services/email'
```

## Email Types

```typescript
enum EmailType {
  WELCOME = 'welcome',
  INVITATION = 'invitation',
  PASSWORD_RESET = 'password_reset',
  NOTIFICATION = 'notification',
  USAGE_ALERT = 'usage_alert',
  BILLING = 'billing',
  SYSTEM_ALERT = 'system_alert',
  MARKETING = 'marketing',
}

enum EmailStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  COMPLAINED = 'complained',
}
```

## Core Functions

### sendEmail()

Base email sending function.

```typescript
sendEmail(options: {
  to: string
  subject: string
  html: string
  from?: string
  type: EmailType
  metadata?: Record<string, unknown>
}): Promise<{ id: string; status: EmailStatus }>
```

**Example:**
```typescript
const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Hello World</h1>',
  type: EmailType.NOTIFICATION,
  metadata: { userId: '123' }
})
console.log('Email ID:', result.id)
```

---

### sendWelcomeEmail()

Send welcome email to new users.

```typescript
sendWelcomeEmail(data: {
  email: string
  type: EmailType.WELCOME
  userName: string
  tenantName?: string
  loginUrl?: string
  metadata?: Record<string, unknown>
}): Promise<void>
```

**Example:**
```typescript
await sendWelcomeEmail({
  email: 'newuser@example.com',
  type: EmailType.WELCOME,
  userName: 'John Doe',
  tenantName: 'Acme Corp',
  loginUrl: 'https://app.example.com/login'
})
```

---

### sendTeamInvitation()

Send team invitation email.

```typescript
sendTeamInvitation(data: {
  email: string
  type: EmailType.INVITATION
  token: string
  inviterName: string
  tenantName: string
  role: string
  message?: string
  metadata?: Record<string, unknown>
}): Promise<void>
```

**Example:**
```typescript
await sendTeamInvitation({
  email: 'member@example.com',
  type: EmailType.INVITATION,
  token: 'abc123',
  inviterName: 'Jane Smith',
  tenantName: 'Acme Corp',
  role: 'Developer',
  message: 'Welcome to our team!'
})
```

---

### sendUsageAlert()

Send usage quota alert.

```typescript
sendUsageAlert(data: {
  email: string
  type: EmailType.USAGE_ALERT
  tenantName: string
  quotaType: string
  percentage: number
  currentUsage: number
  limit: number
  metadata?: Record<string, unknown>
}): Promise<void>
```

**Example:**
```typescript
await sendUsageAlert({
  email: 'admin@example.com',
  type: EmailType.USAGE_ALERT,
  tenantName: 'Acme Corp',
  quotaType: 'API Requests',
  percentage: 85,
  currentUsage: 85000,
  limit: 100000
})
```

---

### sendBillingNotification()

Send billing notification.

```typescript
sendBillingNotification(data: {
  email: string
  type: EmailType.BILLING
  tenantName: string
  action: 'invoice' | 'payment_failed' | 'subscription_cancelled' | 'subscription_renewed'
  amount?: number
  dueDate?: string
  invoiceUrl?: string
  metadata?: Record<string, unknown>
}): Promise<void>
```

**Example:**
```typescript
await sendBillingNotification({
  email: 'billing@example.com',
  type: EmailType.BILLING,
  tenantName: 'Acme Corp',
  action: 'invoice',
  amount: 9900, // in cents
  dueDate: '2025-02-01',
  invoiceUrl: 'https://app.example.com/invoices/123'
})
```

---

### sendPasswordResetEmail()

Send password reset email.

```typescript
sendPasswordResetEmail(data: {
  email: string
  type: EmailType.PASSWORD_RESET
  token: string
  userName: string
  expiresIn?: string
  metadata?: Record<string, unknown>
}): Promise<void>
```

**Example:**
```typescript
await sendPasswordResetEmail({
  email: 'user@example.com',
  type: EmailType.PASSWORD_RESET,
  token: 'reset_token_123',
  userName: 'John Doe',
  expiresIn: '1 hour'
})
```

---

### sendNotificationEmail()

Send custom notification.

```typescript
sendNotificationEmail(data: {
  email: string
  type: EmailType.NOTIFICATION
  title: string
  body: string
  link?: string
  priority?: 'low' | 'medium' | 'high'
  metadata?: Record<string, unknown>
}): Promise<void>
```

**Example:**
```typescript
await sendNotificationEmail({
  email: 'user@example.com',
  type: EmailType.NOTIFICATION,
  title: 'New Feature Available',
  body: 'Check out our new dashboard!',
  link: 'https://app.example.com/dashboard',
  priority: 'high'
})
```

---

### sendBulkEmails()

Send multiple emails at once.

```typescript
sendBulkEmails(emails: EmailData[]): Promise<void>
```

**Example:**
```typescript
await sendBulkEmails([
  {
    email: 'user1@example.com',
    type: EmailType.WELCOME,
    userName: 'User 1',
    tenantName: 'Acme Corp'
  },
  {
    email: 'user2@example.com',
    type: EmailType.WELCOME,
    userName: 'User 2',
    tenantName: 'Acme Corp'
  }
])
```

---

## Utility Functions

### getEmailPreferences()

Get user email preferences.

```typescript
getEmailPreferences(userId: string): Promise<EmailPreferences>
```

**Example:**
```typescript
const prefs = await getEmailPreferences('user_id_123')
console.log('Notifications enabled:', prefs.notifications)
```

**Returns:**
```typescript
{
  userId: string
  notifications: boolean
  marketing: boolean
  usageAlerts: boolean
  billing: boolean
  systemAlerts: boolean
}
```

---

### updateEmailPreferences()

Update user email preferences.

```typescript
updateEmailPreferences(
  userId: string,
  preferences: Partial<Omit<EmailPreferences, 'userId'>>
): Promise<void>
```

**Example:**
```typescript
await updateEmailPreferences('user_id_123', {
  notifications: true,
  marketing: false,
  usageAlerts: true
})
```

---

### updateEmailStatus()

Update email delivery status (for webhooks).

```typescript
updateEmailStatus(
  emailId: string,
  status: EmailStatus,
  metadata?: Record<string, unknown>
): Promise<void>
```

**Example:**
```typescript
await updateEmailStatus(
  'email_id_123',
  EmailStatus.DELIVERED,
  { deliveredAt: new Date() }
)
```

---

## Edge Function

### Invoke from Client

```typescript
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase.functions.invoke('send-email', {
  body: {
    to: 'user@example.com',
    subject: 'Test Email',
    html: '<p>Hello World</p>',
    type: 'notification',
    metadata: { key: 'value' }
  }
})

if (error) {
  console.error('Error:', error)
} else {
  console.log('Email ID:', data.emailId)
}
```

### Invoke from Server

```javascript
const response = await fetch(
  'https://your-project.supabase.co/functions/v1/send-email',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
      type: 'notification'
    })
  }
)

const data = await response.json()
```

---

## Database Queries

### Get Email Tracking

```typescript
import { supabase } from '@/lib/supabase'

// Get recent emails
const { data } = await supabase
  .from('email_tracking')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10)

// Get emails by type
const { data: alerts } = await supabase
  .from('email_tracking')
  .select('*')
  .eq('type', 'usage_alert')

// Get failed emails
const { data: failed } = await supabase
  .from('email_tracking')
  .select('*')
  .eq('status', 'failed')
```

### Get Email Statistics

```typescript
// Get statistics view
const { data: stats } = await supabase
  .from('email_statistics')
  .select('*')

// Custom statistics
const { data: deliveryRate } = await supabase.rpc('calculate_delivery_rate', {
  days: 7
})
```

---

## Environment Variables

### Client (.env)

```bash
VITE_RESEND_API_KEY=re_your_resend_api_key
VITE_EMAIL_FROM=noreply@yourdomain.com
VITE_EMAIL_FROM_ALERTS=alerts@yourdomain.com
VITE_EMAIL_FROM_NOTIFICATIONS=notifications@yourdomain.com
```

### Edge Function (Supabase Secrets)

```bash
# Set via CLI
supabase secrets set RESEND_API_KEY=re_your_api_key
supabase secrets set EMAIL_FROM=noreply@yourdomain.com
```

---

## Quick Commands

```bash
# Test email service
npm run test:email -- --to your@email.com

# Test specific email type
npm run test:email -- --to your@email.com --type welcome

# Deploy Edge Function
npm run functions:deploy:email

# View Edge Function logs
supabase functions logs send-email --tail

# Set secrets
supabase secrets set RESEND_API_KEY=your_key
```

---

## Common Patterns

### Send Email After User Signup

```typescript
// In signup handler
const { data: user } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})

if (user) {
  await sendWelcomeEmail({
    email: user.email,
    type: EmailType.WELCOME,
    userName: user.user_metadata.name,
    tenantName: 'Your App'
  })
}
```

### Send Invitation After Team Member Added

```typescript
// In team member creation
const token = generateInvitationToken()

await sendTeamInvitation({
  email: memberEmail,
  type: EmailType.INVITATION,
  token,
  inviterName: currentUser.name,
  tenantName: team.name,
  role: memberRole
})
```

### Send Alert When Quota Reached

```typescript
// In quota check
if (usagePercentage >= 80) {
  await sendUsageAlert({
    email: tenantAdmin.email,
    type: EmailType.USAGE_ALERT,
    tenantName: tenant.name,
    quotaType: 'API Requests',
    percentage: usagePercentage,
    currentUsage: usage.count,
    limit: quota.limit
  })
}
```

### Send Billing Notification After Payment

```typescript
// In Stripe webhook handler
if (event.type === 'invoice.paid') {
  await sendBillingNotification({
    email: customer.email,
    type: EmailType.BILLING,
    tenantName: tenant.name,
    action: 'invoice',
    amount: invoice.amount_paid,
    invoiceUrl: invoice.hosted_invoice_url
  })
}
```

---

## Error Handling

```typescript
try {
  await sendEmail({
    to: 'user@example.com',
    subject: 'Test',
    html: '<p>Test</p>',
    type: EmailType.NOTIFICATION
  })
} catch (error) {
  console.error('Failed to send email:', error)
  // Handle error (log to Sentry, show notification, etc.)
}
```

---

## Best Practices

1. **Always specify email type** for proper tracking and sender selection
2. **Include metadata** for debugging and tracking
3. **Handle errors gracefully** - don't block user flow
4. **Check user preferences** before sending non-critical emails
5. **Use appropriate sender addresses** for different email types
6. **Monitor delivery rates** regularly
7. **Test emails** in development before deploying
8. **Keep templates simple** for better email client compatibility
9. **Include unsubscribe links** for marketing emails
10. **Respect rate limits** - use bulk sending for multiple emails

---

## Related Documentation

- [Full Guide](./EMAIL_SERVICE_GUIDE.md)
- [Quick Start](./EMAIL_SERVICE_QUICK_START.md)
- [Edge Function README](../supabase/functions/send-email/README.md)
- [Implementation Summary](../EMAIL_SERVICE_IMPLEMENTATION_SUMMARY.md)

# Send Email Edge Function

A Supabase Edge Function for sending transactional emails using Resend.

## Overview

This Edge Function provides a serverless endpoint for sending emails through the Resend API. It includes:

- Email sending with retry logic
- Email tracking in database
- Support for multiple sender addresses
- CORS support for client-side calls
- Comprehensive error handling

## Configuration

### Required Environment Variables

Set these secrets in your Supabase project:

```bash
# Required
supabase secrets set RESEND_API_KEY=re_your_resend_api_key

# Optional (defaults provided)
supabase secrets set EMAIL_FROM=noreply@yourdomain.com
supabase secrets set EMAIL_FROM_ALERTS=alerts@yourdomain.com
supabase secrets set EMAIL_FROM_NOTIFICATIONS=notifications@yourdomain.com
```

### Automatic Environment Variables

These are automatically set by Supabase:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access

## Deployment

Deploy the function using the Supabase CLI:

```bash
# Deploy to production
supabase functions deploy send-email

# Deploy with custom project reference
supabase functions deploy send-email --project-ref your-project-ref
```

## API Reference

### Endpoint

```
POST https://your-project.supabase.co/functions/v1/send-email
```

### Request Headers

```
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json
```

### Request Body

```typescript
{
  to: string              // Required: Recipient email address
  subject: string         // Required: Email subject
  html: string           // Required: Email HTML content
  from?: string          // Optional: Sender email address
  type: string           // Required: Email type (welcome, invitation, etc.)
  metadata?: object      // Optional: Additional tracking metadata
}
```

### Response (Success)

```typescript
{
  success: true,
  emailId: string      // Resend email ID
}
```

### Response (Error)

```typescript
{
  success: false,
  error: string        // Error message
  details?: string     // Additional error details
}
```

## Usage Examples

### From Client (TypeScript/JavaScript)

```typescript
import { supabase } from './lib/supabase'

async function sendEmail() {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      to: 'user@example.com',
      subject: 'Welcome!',
      html: '<h1>Welcome to our platform!</h1>',
      type: 'welcome',
    },
  })

  if (error) {
    console.error('Failed to send email:', error)
  } else {
    console.log('Email sent:', data.emailId)
  }
}
```

### From Server (Node.js)

```javascript
const response = await fetch(
  'https://your-project.supabase.co/functions/v1/send-email',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: 'user@example.com',
      subject: 'Test Email',
      html: '<p>This is a test.</p>',
      type: 'notification',
    }),
  }
)

const data = await response.json()
console.log(data)
```

### Using curl

```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Test Email",
    "html": "<p>Hello World!</p>",
    "type": "notification"
  }'
```

## Email Types

The function automatically selects the appropriate sender address based on the email type:

| Type | Sender Address | Use Case |
|------|---------------|----------|
| `welcome` | EMAIL_FROM | Welcome emails |
| `invitation` | EMAIL_FROM | Team invitations |
| `password_reset` | EMAIL_FROM | Password resets |
| `notification` | EMAIL_FROM_NOTIFICATIONS | General notifications |
| `usage_alert` | EMAIL_FROM_ALERTS | Quota alerts |
| `system_alert` | EMAIL_FROM_ALERTS | System alerts |
| `billing` | EMAIL_FROM | Billing notifications |
| `marketing` | EMAIL_FROM | Marketing emails |

## Email Tracking

The function automatically tracks all sent emails in the `email_tracking` table:

```sql
SELECT * FROM email_tracking
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

Tracked fields:
- `email_id` - Resend email ID
- `recipient` - Recipient email
- `subject` - Email subject
- `type` - Email type
- `status` - Delivery status
- `metadata` - Custom metadata
- `sent_at` - Timestamp
- `error` - Error message (if failed)

## Error Handling

The function includes comprehensive error handling:

### 405 Method Not Allowed
```json
{
  "success": false,
  "error": "Method not allowed"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing required fields: to, subject, html"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Email service not configured"
}
```

### Resend API Error
```json
{
  "success": false,
  "error": "Failed to send email",
  "details": "API error details"
}
```

## Testing

### Test Locally

```bash
# Start local Supabase
supabase start

# Test the function
supabase functions invoke send-email --method POST --body '{
  "to": "test@example.com",
  "subject": "Test",
  "html": "<p>Test</p>",
  "type": "notification"
}'
```

### Test in Production

```bash
# Deploy function
supabase functions deploy send-email

# Test deployed function
curl -X POST https://your-project.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test</p>",
    "type": "notification"
  }'
```

## Monitoring

### View Function Logs

```bash
# View recent logs
supabase functions logs send-email

# Stream logs in real-time
supabase functions logs send-email --tail
```

### Check Email Statistics

```sql
-- Emails sent today
SELECT COUNT(*) FROM email_tracking
WHERE sent_at::date = CURRENT_DATE;

-- Email success rate
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM email_tracking
GROUP BY status;

-- Recent failures
SELECT * FROM email_tracking
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

## Security

### Authentication

The function can be called:
- With Supabase anon key (from client)
- With service role key (from server)
- From database triggers (automatic authentication)

### Rate Limiting

Consider implementing rate limiting:

```typescript
// Example: Redis-based rate limiting
const userId = req.headers.get('x-user-id')
const key = `email:ratelimit:${userId}`
const limit = 10 // emails per hour

// Check rate limit
const count = await redis.incr(key)
if (count === 1) {
  await redis.expire(key, 3600) // 1 hour
}
if (count > limit) {
  return new Response('Rate limit exceeded', { status: 429 })
}
```

### CORS Configuration

The function includes CORS headers for client-side access:

```typescript
'Access-Control-Allow-Origin': '*',
'Access-Control-Allow-Methods': 'POST, OPTIONS',
'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
```

For production, consider restricting origins:

```typescript
'Access-Control-Allow-Origin': 'https://yourdomain.com',
```

## Troubleshooting

### Function Not Responding

1. Check function is deployed:
   ```bash
   supabase functions list
   ```

2. Check function logs:
   ```bash
   supabase functions logs send-email --tail
   ```

3. Verify environment variables:
   ```bash
   supabase secrets list
   ```

### Email Not Sending

1. Verify Resend API key is valid
2. Check domain verification in Resend dashboard
3. Review Resend API logs
4. Check email_tracking table for errors

### Database Tracking Not Working

1. Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
2. Check email_tracking table exists
3. Verify RLS policies allow service role access
4. Check function logs for database errors

## Performance

### Response Times

Typical response times:
- Email send: 200-500ms
- Database tracking: 50-100ms
- Total: 250-600ms

### Optimization Tips

1. **Minimize template size** - Keep HTML under 100KB
2. **Use async tracking** - Don't wait for database insert
3. **Batch emails** - Send multiple emails in one request
4. **Cache templates** - Store templates in database
5. **Monitor metrics** - Track success rates and latency

## Related Resources

- [Resend API Documentation](https://resend.com/docs/api-reference/emails/send-email)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Email Service Guide](../../../docs/EMAIL_SERVICE_GUIDE.md)

## Support

For issues or questions:
- GitHub Issues: [supabase-saas-admin](https://github.com/AAChibilyaev/supabase-saas-admin/issues)
- Resend Support: [support@resend.com](mailto:support@resend.com)

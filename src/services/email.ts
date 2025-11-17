import { Resend } from 'resend'

// Initialize Resend client
// Note: In production, you'll need to set VITE_RESEND_API_KEY in your .env file
const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY || '')

export interface InvitationEmailData {
  email: string
  token: string
  inviterName: string
  tenantName: string
  role: string
  message?: string
}

export interface NotificationEmailData {
  email: string
  title: string
  body: string
  link?: string
}

/**
 * Send a team invitation email
 */
export async function sendInvitationEmail(data: InvitationEmailData): Promise<void> {
  const { email, token, inviterName, tenantName, role, message } = data
  const inviteUrl = `${window.location.origin}/accept-invite/${token}`

  try {
    await resend.emails.send({
      from: import.meta.env.VITE_EMAIL_FROM || 'noreply@yourdomain.com',
      to: email,
      subject: `You've been invited to join ${tenantName}`,
      html: generateInvitationEmailHtml({
        inviterName,
        tenantName,
        role,
        inviteUrl,
        message,
      }),
    })
  } catch (error) {
    console.error('Failed to send invitation email:', error)
    // In development, log the error but don't fail
    // In production, you may want to throw the error
    if (import.meta.env.PROD) {
      throw error
    }
  }
}

/**
 * Send a notification email
 */
export async function sendNotificationEmail(data: NotificationEmailData): Promise<void> {
  const { email, title, body, link } = data

  try {
    await resend.emails.send({
      from: import.meta.env.VITE_EMAIL_FROM || 'notifications@yourdomain.com',
      to: email,
      subject: title,
      html: generateNotificationEmailHtml({ title, body, link }),
    })
  } catch (error) {
    console.error('Failed to send notification email:', error)
    if (import.meta.env.PROD) {
      throw error
    }
  }
}

/**
 * Generate HTML for invitation email
 */
function generateInvitationEmailHtml(data: {
  inviterName: string
  tenantName: string
  role: string
  inviteUrl: string
  message?: string
}): string {
  const { inviterName, tenantName, role, inviteUrl, message } = data

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
          }
          .button:hover {
            background: #5568d3;
          }
          .info-box {
            background: white;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Team Invitation</h1>
        </div>
        <div class="content">
          <p>Hello!</p>
          <p><strong>${inviterName}</strong> has invited you to join <strong>${tenantName}</strong> as a <strong>${role}</strong>.</p>

          ${message ? `
            <div class="info-box">
              <p><strong>Message from ${inviterName}:</strong></p>
              <p>${message}</p>
            </div>
          ` : ''}

          <p>Click the button below to accept this invitation:</p>

          <p style="text-align: center;">
            <a href="${inviteUrl}" class="button">Accept Invitation</a>
          </p>

          <p>Or copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${inviteUrl}</p>

          <div class="info-box">
            <p><strong>Important:</strong></p>
            <ul>
              <li>This invitation will expire in 7 days</li>
              <li>You'll need to sign in or create an account to accept</li>
              <li>Once accepted, you'll have ${role} access to ${tenantName}</li>
            </ul>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      </body>
    </html>
  `
}

/**
 * Generate HTML for notification email
 */
function generateNotificationEmailHtml(data: {
  title: string
  body: string
  link?: string
}): string {
  const { title, body, link } = data

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${title}</h2>
        </div>
        <div class="content">
          <p>${body}</p>

          ${link ? `
            <p style="text-align: center;">
              <a href="${link}" class="button">View Details</a>
            </p>
          ` : ''}
        </div>
        <div class="footer">
          <p>This is an automated notification from your team.</p>
        </div>
      </body>
    </html>
  `
}

/**
 * Send bulk notification emails
 */
export async function sendBulkNotificationEmails(
  notifications: NotificationEmailData[]
): Promise<void> {
  const promises = notifications.map(notification => sendNotificationEmail(notification))
  await Promise.allSettled(promises)
}

import { Resend } from 'resend'
import { supabase } from '../lib/supabase'

// Initialize Resend client
// Note: In production, you'll need to set VITE_RESEND_API_KEY in your .env file
const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY || '')

// Email configuration
const EMAIL_CONFIG = {
  from: import.meta.env.VITE_EMAIL_FROM || 'noreply@yourdomain.com',
  fromAlerts: import.meta.env.VITE_EMAIL_FROM_ALERTS || 'alerts@yourdomain.com',
  fromNotifications: import.meta.env.VITE_EMAIL_FROM_NOTIFICATIONS || 'notifications@yourdomain.com',
  maxRetries: 3,
  retryDelay: 1000, // 1 second
}

// Email Types
export enum EmailType {
  WELCOME = 'welcome',
  INVITATION = 'invitation',
  PASSWORD_RESET = 'password_reset',
  NOTIFICATION = 'notification',
  USAGE_ALERT = 'usage_alert',
  BILLING = 'billing',
  SYSTEM_ALERT = 'system_alert',
  MARKETING = 'marketing',
}

export enum EmailStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  COMPLAINED = 'complained',
}

// Email Data Interfaces
export interface BaseEmailData {
  email: string
  type: EmailType
  metadata?: Record<string, unknown>
}

export interface WelcomeEmailData extends BaseEmailData {
  type: EmailType.WELCOME
  userName: string
  tenantName?: string
  loginUrl?: string
}

export interface InvitationEmailData extends BaseEmailData {
  type: EmailType.INVITATION
  token: string
  inviterName: string
  tenantName: string
  role: string
  message?: string
}

export interface PasswordResetEmailData extends BaseEmailData {
  type: EmailType.PASSWORD_RESET
  token: string
  userName: string
  expiresIn?: string
}

export interface NotificationEmailData extends BaseEmailData {
  type: EmailType.NOTIFICATION
  title: string
  body: string
  link?: string
  priority?: 'low' | 'medium' | 'high'
}

export interface UsageAlertEmailData extends BaseEmailData {
  type: EmailType.USAGE_ALERT
  tenantName: string
  quotaType: string
  percentage: number
  currentUsage: number
  limit: number
}

export interface BillingEmailData extends BaseEmailData {
  type: EmailType.BILLING
  tenantName: string
  action: 'invoice' | 'payment_failed' | 'subscription_cancelled' | 'subscription_renewed'
  amount?: number
  dueDate?: string
  invoiceUrl?: string
}

export type EmailData =
  | WelcomeEmailData
  | InvitationEmailData
  | PasswordResetEmailData
  | NotificationEmailData
  | UsageAlertEmailData
  | BillingEmailData

// Email Preferences
export interface EmailPreferences {
  userId: string
  notifications: boolean
  marketing: boolean
  usageAlerts: boolean
  billing: boolean
  systemAlerts: boolean
}

/**
 * Send email with retry logic and tracking
 */
async function sendEmailWithRetry(
  to: string,
  subject: string,
  html: string,
  from: string,
  type: EmailType,
  metadata?: Record<string, unknown>
): Promise<{ id: string; status: EmailStatus }> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < EMAIL_CONFIG.maxRetries; attempt++) {
    try {
      const response = await resend.emails.send({
        from,
        to,
        subject,
        html,
      })

      // Track email in database
      const trackingId = await trackEmail({
        emailId: response.id || '',
        to,
        subject,
        type,
        status: EmailStatus.SENT,
        metadata,
      })

      return {
        id: trackingId,
        status: EmailStatus.SENT,
      }
    } catch (error) {
      lastError = error as Error
      console.error(`Email send attempt ${attempt + 1} failed:`, error)

      // Wait before retrying (exponential backoff)
      if (attempt < EMAIL_CONFIG.maxRetries - 1) {
        await new Promise(resolve =>
          setTimeout(resolve, EMAIL_CONFIG.retryDelay * Math.pow(2, attempt))
        )
      }
    }
  }

  // All retries failed
  const trackingId = await trackEmail({
    emailId: '',
    to,
    subject,
    type,
    status: EmailStatus.FAILED,
    metadata,
    error: lastError?.message,
  })

  throw new Error(`Failed to send email after ${EMAIL_CONFIG.maxRetries} attempts: ${lastError?.message}`)
}

/**
 * Track email in database
 */
async function trackEmail(data: {
  emailId: string
  to: string
  subject: string
  type: EmailType
  status: EmailStatus
  metadata?: Record<string, unknown>
  error?: string
}): Promise<string> {
  try {
    const { data: tracking, error } = await supabase
      .from('email_tracking')
      .insert({
        email_id: data.emailId,
        recipient: data.to,
        subject: data.subject,
        type: data.type,
        status: data.status,
        metadata: data.metadata,
        error: data.error,
        sent_at: data.status === EmailStatus.SENT ? new Date().toISOString() : null,
      })
      .select('id')
      .single()

    if (error) throw error
    return tracking.id
  } catch (error) {
    console.error('Failed to track email:', error)
    return ''
  }
}

/**
 * Check if user has email preferences enabled for a type
 */
async function checkEmailPreferences(
  userId: string,
  type: EmailType
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      // Default to enabled if no preferences set
      return true
    }

    switch (type) {
      case EmailType.NOTIFICATION:
        return data.notifications
      case EmailType.MARKETING:
        return data.marketing
      case EmailType.USAGE_ALERT:
        return data.usage_alerts
      case EmailType.BILLING:
        return data.billing
      case EmailType.SYSTEM_ALERT:
        return data.system_alerts
      default:
        return true
    }
  } catch (error) {
    console.error('Failed to check email preferences:', error)
    return true // Default to enabled on error
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  const { email, userName, tenantName, loginUrl } = data

  const html = generateWelcomeEmailHtml({
    userName,
    tenantName,
    loginUrl: loginUrl || `${window.location.origin}/login`,
  })

  await sendEmailWithRetry(
    email,
    `Welcome to ${tenantName || 'our platform'}!`,
    html,
    EMAIL_CONFIG.from,
    EmailType.WELCOME,
    data.metadata
  )
}

/**
 * Send invitation email
 */
export async function sendInvitationEmail(data: InvitationEmailData): Promise<void> {
  const { email, token, inviterName, tenantName, role, message } = data
  const inviteUrl = `${window.location.origin}/accept-invite/${token}`

  const html = generateInvitationEmailHtml({
    inviterName,
    tenantName,
    role,
    inviteUrl,
    message,
  })

  await sendEmailWithRetry(
    email,
    `You've been invited to join ${tenantName}`,
    html,
    EMAIL_CONFIG.from,
    EmailType.INVITATION,
    data.metadata
  )
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
  const { email, token, userName, expiresIn = '1 hour' } = data
  const resetUrl = `${window.location.origin}/reset-password?token=${token}`

  const html = generatePasswordResetEmailHtml({
    userName,
    resetUrl,
    expiresIn,
  })

  await sendEmailWithRetry(
    email,
    'Reset your password',
    html,
    EMAIL_CONFIG.from,
    EmailType.PASSWORD_RESET,
    data.metadata
  )
}

/**
 * Send notification email
 */
export async function sendNotificationEmail(data: NotificationEmailData): Promise<void> {
  const { email, title, body, link, priority = 'medium' } = data

  const html = generateNotificationEmailHtml({ title, body, link, priority })

  await sendEmailWithRetry(
    email,
    title,
    html,
    EMAIL_CONFIG.fromNotifications,
    EmailType.NOTIFICATION,
    data.metadata
  )
}

/**
 * Send usage alert email
 */
export async function sendUsageAlertEmail(data: UsageAlertEmailData): Promise<void> {
  const { email, tenantName, quotaType, percentage, currentUsage, limit } = data

  const html = generateUsageAlertEmailHtml({
    tenantName,
    quotaType,
    percentage,
    currentUsage,
    limit,
  })

  await sendEmailWithRetry(
    email,
    `${tenantName}: ${quotaType} quota at ${percentage}%`,
    html,
    EMAIL_CONFIG.fromAlerts,
    EmailType.USAGE_ALERT,
    data.metadata
  )
}

/**
 * Send billing email
 */
export async function sendBillingEmail(data: BillingEmailData): Promise<void> {
  const { email, tenantName, action, amount, dueDate, invoiceUrl } = data

  const html = generateBillingEmailHtml({
    tenantName,
    action,
    amount,
    dueDate,
    invoiceUrl,
  })

  const subjects = {
    invoice: `New invoice from ${tenantName}`,
    payment_failed: `Payment failed for ${tenantName}`,
    subscription_cancelled: `Subscription cancelled for ${tenantName}`,
    subscription_renewed: `Subscription renewed for ${tenantName}`,
  }

  await sendEmailWithRetry(
    email,
    subjects[action],
    html,
    EMAIL_CONFIG.from,
    EmailType.BILLING,
    data.metadata
  )
}

/**
 * Send bulk emails
 */
export async function sendBulkEmails(emails: EmailData[]): Promise<void> {
  const promises = emails.map(email => {
    switch (email.type) {
      case EmailType.WELCOME:
        return sendWelcomeEmail(email as WelcomeEmailData)
      case EmailType.INVITATION:
        return sendInvitationEmail(email as InvitationEmailData)
      case EmailType.PASSWORD_RESET:
        return sendPasswordResetEmail(email as PasswordResetEmailData)
      case EmailType.NOTIFICATION:
        return sendNotificationEmail(email as NotificationEmailData)
      case EmailType.USAGE_ALERT:
        return sendUsageAlertEmail(email as UsageAlertEmailData)
      case EmailType.BILLING:
        return sendBillingEmail(email as BillingEmailData)
      default:
        return Promise.resolve()
    }
  })

  await Promise.allSettled(promises)
}

/**
 * Get email preferences for a user
 */
export async function getEmailPreferences(userId: string): Promise<EmailPreferences> {
  const { data, error } = await supabase
    .from('email_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    // Return default preferences
    return {
      userId,
      notifications: true,
      marketing: true,
      usageAlerts: true,
      billing: true,
      systemAlerts: true,
    }
  }

  return {
    userId: data.user_id,
    notifications: data.notifications,
    marketing: data.marketing,
    usageAlerts: data.usage_alerts,
    billing: data.billing,
    systemAlerts: data.system_alerts,
  }
}

/**
 * Update email preferences for a user
 */
export async function updateEmailPreferences(
  userId: string,
  preferences: Partial<Omit<EmailPreferences, 'userId'>>
): Promise<void> {
  const { error } = await supabase
    .from('email_preferences')
    .upsert({
      user_id: userId,
      notifications: preferences.notifications,
      marketing: preferences.marketing,
      usage_alerts: preferences.usageAlerts,
      billing: preferences.billing,
      system_alerts: preferences.systemAlerts,
      updated_at: new Date().toISOString(),
    })

  if (error) throw error
}

/**
 * Update email delivery status (webhook handler)
 */
export async function updateEmailStatus(
  emailId: string,
  status: EmailStatus,
  metadata?: Record<string, unknown>
): Promise<void> {
  const updates: Record<string, unknown> = {
    status,
    metadata,
    updated_at: new Date().toISOString(),
  }

  if (status === EmailStatus.DELIVERED) {
    updates.delivered_at = new Date().toISOString()
  } else if (status === EmailStatus.BOUNCED || status === EmailStatus.COMPLAINED) {
    updates.bounced_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('email_tracking')
    .update(updates)
    .eq('email_id', emailId)

  if (error) throw error
}

// HTML Template Generators

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
        <div class="header">
          <h1>Welcome Aboard! 🎉</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Welcome to ${tenantName || 'our platform'}! We're excited to have you on board.</p>

          <div class="info-box">
            <h3>Getting Started</h3>
            <ul>
              <li>Complete your profile</li>
              <li>Explore the dashboard</li>
              <li>Invite your team members</li>
              <li>Set up your first project</li>
            </ul>
          </div>

          <p style="text-align: center;">
            <a href="${loginUrl}" class="button">Get Started</a>
          </p>

          <p>If you have any questions, our support team is here to help!</p>
        </div>
        ${getEmailFooter()}
      </body>
    </html>
  `
}

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
        ${getEmailStyles()}
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
        ${getEmailFooter()}
      </body>
    </html>
  `
}

function generatePasswordResetEmailHtml(data: {
  userName: string
  resetUrl: string
  expiresIn: string
}): string {
  const { userName, resetUrl, expiresIn } = data

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${getEmailStyles()}
      </head>
      <body>
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>

          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>

          <div class="info-box alert">
            <p><strong>Security Notice:</strong></p>
            <ul>
              <li>This link will expire in ${expiresIn}</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Never share this link with anyone</li>
            </ul>
          </div>

          <p>Or copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${resetUrl}</p>
        </div>
        ${getEmailFooter()}
      </body>
    </html>
  `
}

function generateNotificationEmailHtml(data: {
  title: string
  body: string
  link?: string
  priority: 'low' | 'medium' | 'high'
}): string {
  const { title, body, link, priority } = data

  const priorityColors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${getEmailStyles()}
      </head>
      <body>
        <div class="header" style="background: ${priorityColors[priority]};">
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
        ${getEmailFooter()}
      </body>
    </html>
  `
}

function generateUsageAlertEmailHtml(data: {
  tenantName: string
  quotaType: string
  percentage: number
  currentUsage: number
  limit: number
}): string {
  const { tenantName, quotaType, percentage, currentUsage, limit } = data

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${getEmailStyles()}
      </head>
      <body>
        <div class="header" style="background: #f59e0b;">
          <h2>Usage Alert</h2>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <p>Your <strong>${quotaType}</strong> usage for <strong>${tenantName}</strong> is at <strong>${percentage}%</strong> of your plan limit.</p>

          <div class="info-box alert">
            <h3>Current Usage</h3>
            <p><strong>${currentUsage.toLocaleString()}</strong> / ${limit.toLocaleString()}</p>
            <div style="background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden;">
              <div style="background: ${percentage >= 90 ? '#ef4444' : '#f59e0b'}; width: ${percentage}%; height: 100%;"></div>
            </div>
          </div>

          <p>Consider upgrading your plan to avoid service interruptions.</p>

          <p style="text-align: center;">
            <a href="${window.location.origin}/billing" class="button">Upgrade Plan</a>
          </p>
        </div>
        ${getEmailFooter()}
      </body>
    </html>
  `
}

function generateBillingEmailHtml(data: {
  tenantName: string
  action: 'invoice' | 'payment_failed' | 'subscription_cancelled' | 'subscription_renewed'
  amount?: number
  dueDate?: string
  invoiceUrl?: string
}): string {
  const { tenantName, action, amount, dueDate, invoiceUrl } = data

  const actionMessages = {
    invoice: {
      title: 'New Invoice',
      message: `A new invoice has been generated for ${tenantName}.`,
      color: '#667eea',
    },
    payment_failed: {
      title: 'Payment Failed',
      message: 'Your recent payment attempt was unsuccessful.',
      color: '#ef4444',
    },
    subscription_cancelled: {
      title: 'Subscription Cancelled',
      message: `Your subscription for ${tenantName} has been cancelled.`,
      color: '#6b7280',
    },
    subscription_renewed: {
      title: 'Subscription Renewed',
      message: `Your subscription for ${tenantName} has been successfully renewed.`,
      color: '#10b981',
    },
  }

  const { title, message, color } = actionMessages[action]

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${getEmailStyles()}
      </head>
      <body>
        <div class="header" style="background: ${color};">
          <h2>${title}</h2>
        </div>
        <div class="content">
          <p>${message}</p>

          ${amount ? `
            <div class="info-box">
              <p><strong>Amount:</strong> $${(amount / 100).toFixed(2)}</p>
              ${dueDate ? `<p><strong>Due Date:</strong> ${dueDate}</p>` : ''}
            </div>
          ` : ''}

          ${invoiceUrl ? `
            <p style="text-align: center;">
              <a href="${invoiceUrl}" class="button">View Invoice</a>
            </p>
          ` : ''}

          ${action === 'payment_failed' ? `
            <div class="info-box alert">
              <p><strong>Action Required:</strong></p>
              <p>Please update your payment method to continue using our services.</p>
            </div>
          ` : ''}
        </div>
        ${getEmailFooter()}
      </body>
    </html>
  `
}

function getEmailStyles(): string {
  return `
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background: #f3f4f6;
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px;
        border-radius: 8px 8px 0 0;
        text-align: center;
      }
      .header h1, .header h2 {
        margin: 0;
      }
      .content {
        background: white;
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
        background: #f9fafb;
        padding: 15px;
        border-radius: 6px;
        margin: 20px 0;
        border-left: 4px solid #667eea;
      }
      .info-box.alert {
        border-left-color: #f59e0b;
        background: #fffbeb;
      }
      .info-box h3 {
        margin-top: 0;
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
  `
}

function getEmailFooter(): string {
  return `
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
      <p>If you have questions, contact our support team.</p>
      <p><a href="${window.location.origin}/settings/email-preferences">Manage email preferences</a></p>
    </div>
  `
}

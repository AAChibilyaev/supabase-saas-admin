#!/usr/bin/env node
/**
 * Email Service Test Script
 *
 * This script tests the email service functionality including:
 * - Base sendEmail function
 * - Welcome email
 * - Team invitation
 * - Usage alerts
 * - Billing notifications
 * - Edge Function invocation
 *
 * Usage:
 *   npm run test:email -- --to your-email@example.com
 *   npm run test:email -- --to your-email@example.com --type welcome
 */

import { sendEmail, sendWelcomeEmail, sendTeamInvitation, sendUsageAlert, sendBillingNotification, EmailType } from '../src/services/email'
import { supabase } from '../src/lib/supabase'

// Parse command line arguments
const args = process.argv.slice(2)
const getArg = (name: string): string | undefined => {
  const index = args.indexOf(`--${name}`)
  return index !== -1 ? args[index + 1] : undefined
}

const testEmail = getArg('to') || 'test@example.com'
const testType = getArg('type') || 'all'

console.log('🚀 Email Service Test Script')
console.log('================================')
console.log(`Target email: ${testEmail}`)
console.log(`Test type: ${testType}`)
console.log('================================\n')

async function testBaseEmailFunction() {
  console.log('📧 Testing base sendEmail function...')
  try {
    const result = await sendEmail({
      to: testEmail,
      subject: 'Test Email - Base Function',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email sent using the base sendEmail function.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
      type: EmailType.NOTIFICATION,
      metadata: {
        testType: 'base-function',
        timestamp: Date.now(),
      },
    })

    console.log('✅ Base email sent successfully!')
    console.log(`   Email ID: ${result.id}`)
    console.log(`   Status: ${result.status}\n`)
  } catch (error) {
    console.error('❌ Failed to send base email:', error)
  }
}

async function testWelcomeEmail() {
  console.log('📧 Testing welcome email...')
  try {
    await sendWelcomeEmail({
      email: testEmail,
      type: EmailType.WELCOME,
      userName: 'Test User',
      tenantName: 'Acme Corporation',
      loginUrl: 'https://app.example.com/login',
      metadata: {
        testType: 'welcome-email',
        timestamp: Date.now(),
      },
    })

    console.log('✅ Welcome email sent successfully!\n')
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error)
  }
}

async function testTeamInvitationEmail() {
  console.log('📧 Testing team invitation email...')
  try {
    await sendTeamInvitation({
      email: testEmail,
      type: EmailType.INVITATION,
      token: 'test_invitation_token_' + Date.now(),
      inviterName: 'John Smith',
      tenantName: 'Acme Corporation',
      role: 'Developer',
      message: 'We are excited to have you join our team!',
      metadata: {
        testType: 'invitation-email',
        timestamp: Date.now(),
      },
    })

    console.log('✅ Team invitation email sent successfully!\n')
  } catch (error) {
    console.error('❌ Failed to send team invitation email:', error)
  }
}

async function testUsageAlertEmail() {
  console.log('📧 Testing usage alert email...')
  try {
    await sendUsageAlert({
      email: testEmail,
      type: EmailType.USAGE_ALERT,
      tenantName: 'Acme Corporation',
      quotaType: 'API Requests',
      percentage: 85,
      currentUsage: 85000,
      limit: 100000,
      metadata: {
        testType: 'usage-alert-email',
        timestamp: Date.now(),
      },
    })

    console.log('✅ Usage alert email sent successfully!\n')
  } catch (error) {
    console.error('❌ Failed to send usage alert email:', error)
  }
}

async function testBillingNotificationEmail() {
  console.log('📧 Testing billing notification email...')
  try {
    await sendBillingNotification({
      email: testEmail,
      type: EmailType.BILLING,
      tenantName: 'Acme Corporation',
      action: 'invoice',
      amount: 9900, // $99.00
      dueDate: '2025-02-01',
      invoiceUrl: 'https://app.example.com/invoices/inv_123',
      metadata: {
        testType: 'billing-notification-email',
        timestamp: Date.now(),
      },
    })

    console.log('✅ Billing notification email sent successfully!\n')
  } catch (error) {
    console.error('❌ Failed to send billing notification email:', error)
  }
}

async function testEdgeFunction() {
  console.log('📧 Testing Edge Function...')
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: testEmail,
        subject: 'Test Email - Edge Function',
        html: `
          <h1>Edge Function Test</h1>
          <p>This email was sent via the Supabase Edge Function.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        `,
        type: 'notification',
        metadata: {
          testType: 'edge-function',
          timestamp: Date.now(),
        },
      },
    })

    if (error) {
      console.error('❌ Edge Function error:', error)
    } else {
      console.log('✅ Edge Function email sent successfully!')
      console.log(`   Email ID: ${data.emailId}\n`)
    }
  } catch (error) {
    console.error('❌ Failed to invoke Edge Function:', error)
  }
}

async function checkEmailTracking() {
  console.log('📊 Checking email tracking...')
  try {
    const { data, error } = await supabase
      .from('email_tracking')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('❌ Failed to fetch email tracking:', error)
    } else {
      console.log(`✅ Found ${data?.length || 0} recent emails in tracking`)
      if (data && data.length > 0) {
        console.log('\nRecent emails:')
        data.forEach((email, index) => {
          console.log(`   ${index + 1}. ${email.type} to ${email.recipient} - ${email.status}`)
        })
      }
      console.log('')
    }
  } catch (error) {
    console.error('❌ Failed to check email tracking:', error)
  }
}

async function runTests() {
  console.log('Starting email service tests...\n')

  try {
    if (testType === 'all' || testType === 'base') {
      await testBaseEmailFunction()
    }

    if (testType === 'all' || testType === 'welcome') {
      await testWelcomeEmail()
    }

    if (testType === 'all' || testType === 'invitation') {
      await testTeamInvitationEmail()
    }

    if (testType === 'all' || testType === 'usage') {
      await testUsageAlertEmail()
    }

    if (testType === 'all' || testType === 'billing') {
      await testBillingNotificationEmail()
    }

    if (testType === 'all' || testType === 'edge') {
      await testEdgeFunction()
    }

    // Always check tracking
    await checkEmailTracking()

    console.log('================================')
    console.log('✅ All tests completed!')
    console.log('================================')
    console.log('\nNext steps:')
    console.log('1. Check your email inbox at:', testEmail)
    console.log('2. Verify email tracking in database')
    console.log('3. Review Resend dashboard for delivery status')
    console.log('4. Check Edge Function logs: supabase functions logs send-email')
  } catch (error) {
    console.error('❌ Test suite failed:', error)
  }
}

// Run tests
runTests()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

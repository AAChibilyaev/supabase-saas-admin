/**
 * Supabase Edge Function: Stripe Webhook Handler
 * Issue #28: Stripe Billing & Subscription Management
 *
 * Handles Stripe webhook events for payment processing
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  try {
    // Get the raw body for signature verification
    const body = await req.text()

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log(`Processing webhook event: ${event.type}`)

    // Log the event
    await supabase.from('payment_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event.data.object as Record<string, unknown>,
      processed: false,
    })

    // Handle different event types
    switch (event.type) {
      // Subscription events
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      // Invoice events
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'invoice.created':
      case 'invoice.finalized':
      case 'invoice.updated':
        await handleInvoiceUpdate(event.data.object as Stripe.Invoice)
        break

      // Payment method events
      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod)
        break

      case 'payment_method.detached':
        await handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod)
        break

      // Customer events
      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Mark event as processed
    await supabase
      .from('payment_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('stripe_event_id', event.id)

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Log error
    await supabase.from('payment_events').update({
      error: errorMessage,
      retry_count: supabase.rpc('increment', { amount: 1 }),
    })

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// ============================================================================
// Event Handlers
// ============================================================================

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const priceId = subscription.items.data[0]?.price.id

  // Get customer from database
  const { data: customer } = await supabase
    .from('stripe_customers')
    .select('user_id, tenant_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!customer) {
    console.error(`Customer not found: ${customerId}`)
    return
  }

  // Get plan by price ID
  const { data: plan } = await supabase
    .from('billing_plans')
    .select('id')
    .eq('stripe_price_id', priceId)
    .single()

  // Insert subscription
  await supabase.from('user_products').insert({
    user_id: customer.user_id,
    tenant_id: customer.tenant_id,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    plan_id: plan?.id,
    stripe_price_id: priceId,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    trial_start: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    metadata: subscription.metadata as Record<string, unknown>,
  })

  // Create success alert
  if (customer.tenant_id) {
    await supabase.from('billing_alerts').insert({
      tenant_id: customer.tenant_id,
      user_id: customer.user_id,
      alert_type: 'subscription_renewed',
      severity: 'info',
      title: 'Subscription Activated',
      message: 'Your subscription has been successfully activated.',
    })
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const updates: Record<string, unknown> = {
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    default_payment_method: subscription.default_payment_method as string | null,
    metadata: subscription.metadata as Record<string, unknown>,
  }

  // Update subscription
  await supabase
    .from('user_products')
    .update(updates)
    .eq('stripe_subscription_id', subscription.id)

  // Get subscription details for alerts
  const { data: userProduct } = await supabase
    .from('user_products')
    .select('tenant_id, user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  // Create alert if subscription was canceled
  if (subscription.cancel_at_period_end && userProduct?.tenant_id) {
    await supabase.from('billing_alerts').insert({
      tenant_id: userProduct.tenant_id,
      user_id: userProduct.user_id,
      alert_type: 'subscription_canceled',
      severity: 'warning',
      title: 'Subscription Canceled',
      message: `Your subscription will end on ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}.`,
    })
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabase
    .from('user_products')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  // Get customer
  const { data: customer } = await supabase
    .from('stripe_customers')
    .select('id, user_id, tenant_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!customer) return

  // Get subscription
  const { data: subscription } = await supabase
    .from('user_products')
    .select('id')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single()

  // Upsert invoice
  await supabase.from('stripe_invoices').upsert({
    stripe_invoice_id: invoice.id,
    customer_id: customer.id,
    subscription_id: subscription?.id,
    amount_due: invoice.amount_due,
    amount_paid: invoice.amount_paid,
    amount_remaining: invoice.amount_remaining,
    currency: invoice.currency,
    status: invoice.status || 'paid',
    invoice_number: invoice.number,
    invoice_pdf: invoice.invoice_pdf,
    hosted_invoice_url: invoice.hosted_invoice_url,
    paid: invoice.paid,
    payment_intent_id: invoice.payment_intent as string,
    charge_id: invoice.charge as string,
    period_start: invoice.period_start
      ? new Date(invoice.period_start * 1000).toISOString()
      : null,
    period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
    due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
    paid_at: invoice.status_transitions.paid_at
      ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
      : null,
  })

  // Create success alert
  if (customer.tenant_id) {
    await supabase.from('billing_alerts').insert({
      tenant_id: customer.tenant_id,
      user_id: customer.user_id,
      alert_type: 'payment_succeeded',
      severity: 'info',
      title: 'Payment Successful',
      message: `Payment of ${(invoice.amount_paid / 100).toFixed(2)} ${invoice.currency.toUpperCase()} was successful.`,
    })
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  // Get customer
  const { data: customer } = await supabase
    .from('stripe_customers')
    .select('id, user_id, tenant_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!customer) return

  // Update invoice
  await supabase.from('stripe_invoices').upsert({
    stripe_invoice_id: invoice.id,
    customer_id: customer.id,
    status: invoice.status || 'open',
    paid: false,
  })

  // Create failure alert
  if (customer.tenant_id) {
    await supabase.from('billing_alerts').insert({
      tenant_id: customer.tenant_id,
      user_id: customer.user_id,
      alert_type: 'payment_failed',
      severity: 'error',
      title: 'Payment Failed',
      message: 'Your payment could not be processed. Please update your payment method.',
    })
  }
}

async function handleInvoiceUpdate(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  const { data: customer } = await supabase
    .from('stripe_customers')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!customer) return

  const { data: subscription } = await supabase
    .from('user_products')
    .select('id')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .maybeSingle()

  await supabase.from('stripe_invoices').upsert({
    stripe_invoice_id: invoice.id,
    customer_id: customer.id,
    subscription_id: subscription?.id,
    amount_due: invoice.amount_due,
    amount_paid: invoice.amount_paid,
    amount_remaining: invoice.amount_remaining,
    currency: invoice.currency,
    status: invoice.status || 'draft',
    invoice_number: invoice.number,
    invoice_pdf: invoice.invoice_pdf,
    hosted_invoice_url: invoice.hosted_invoice_url,
    paid: invoice.paid,
  })
}

async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  const customerId = paymentMethod.customer as string

  const { data: customer } = await supabase
    .from('stripe_customers')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!customer) return

  await supabase.from('payment_methods').insert({
    stripe_payment_method_id: paymentMethod.id,
    customer_id: customer.id,
    type: paymentMethod.type,
    card_brand: paymentMethod.card?.brand,
    card_last4: paymentMethod.card?.last4,
    card_exp_month: paymentMethod.card?.exp_month,
    card_exp_year: paymentMethod.card?.exp_year,
  })
}

async function handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod) {
  await supabase
    .from('payment_methods')
    .delete()
    .eq('stripe_payment_method_id', paymentMethod.id)
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  await supabase
    .from('stripe_customers')
    .update({
      email: customer.email || '',
      name: customer.name,
      metadata: customer.metadata as Record<string, unknown>,
    })
    .eq('stripe_customer_id', customer.id)
}

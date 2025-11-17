/**
 * Billing Utilities and API Client
 * Issue #28: Stripe Billing & Subscription Management
 */

import { supabase } from '@/lib/supabase'
import type {
  BillingPlan,
  UserSubscription,
  StripeInvoice,
  PaymentMethod,
  BillingAlert,
  TenantUsage,
  CheckoutSessionResponse,
  CustomerPortalResponse,
} from '@/types/billing'

/**
 * Fetch all active billing plans
 */
export const fetchBillingPlans = async (): Promise<BillingPlan[]> => {
  const { data, error } = await supabase
    .from('billing_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Fetch user's current subscription
 */
export const fetchUserSubscription = async (
  userId: string
): Promise<UserSubscription | null> => {
  const { data, error } = await supabase
    .from('user_products')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Fetch subscription with plan details
 */
export const fetchSubscriptionWithPlan = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_products')
    .select(`
      *,
      plan:billing_plans(*)
    `)
    .eq('user_id', userId)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Fetch user's invoices
 */
export const fetchUserInvoices = async (userId: string): Promise<StripeInvoice[]> => {
  // First get customer ID
  const { data: customer } = await supabase
    .from('stripe_customers')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!customer) return []

  const { data, error } = await supabase
    .from('stripe_invoices')
    .select('*')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Fetch user's payment methods
 */
export const fetchPaymentMethods = async (userId: string): Promise<PaymentMethod[]> => {
  // First get customer ID
  const { data: customer } = await supabase
    .from('stripe_customers')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!customer) return []

  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Fetch tenant billing alerts
 */
export const fetchBillingAlerts = async (tenantId: string): Promise<BillingAlert[]> => {
  const { data, error } = await supabase
    .from('billing_alerts')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('acknowledged', false)
    .order('triggered_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Acknowledge billing alert
 */
export const acknowledgeBillingAlert = async (
  alertId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from('billing_alerts')
    .update({
      acknowledged: true,
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: userId,
    })
    .eq('id', alertId)

  if (error) throw error
}

/**
 * Fetch tenant usage
 */
export const fetchTenantUsage = async (tenantId: string): Promise<TenantUsage | null> => {
  const { data, error } = await supabase
    .from('tenant_usage')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Fetch usage history for charts
 */
export const fetchUsageHistory = async (
  tenantId: string,
  months: number = 6
): Promise<TenantUsage[]> => {
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)

  const { data, error } = await supabase
    .from('tenant_usage')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('period_start', startDate.toISOString())
    .order('period_start', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Create checkout session
 */
export const createCheckoutSession = async (
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  trialPeriodDays?: number
): Promise<CheckoutSessionResponse> => {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      priceId,
      successUrl,
      cancelUrl,
      trialPeriodDays,
    },
  })

  if (error) throw error
  return data
}

/**
 * Create customer portal session
 */
export const createCustomerPortalSession = async (
  returnUrl: string
): Promise<CustomerPortalResponse> => {
  const { data, error } = await supabase.functions.invoke('customer-portal', {
    body: {
      returnUrl,
    },
  })

  if (error) throw error
  return data
}

/**
 * Cancel subscription
 */
export const cancelSubscription = async (
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<void> => {
  // This would typically call a Stripe API endpoint
  // For now, we'll use the customer portal
  throw new Error('Please use the customer portal to cancel your subscription')
}

/**
 * Get Stripe customer
 */
export const getStripeCustomer = async (userId: string) => {
  const { data, error } = await supabase
    .from('stripe_customers')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data
}

/**
 * Create or get Stripe customer
 */
export const ensureStripeCustomer = async (userId: string, email: string) => {
  try {
    return await getStripeCustomer(userId)
  } catch {
    // Customer doesn't exist, will be created on first checkout
    return null
  }
}

/**
 * Get billing overview (all billing data in one call)
 */
export const fetchBillingOverview = async (userId: string, tenantId: string) => {
  const [subscription, plans, invoices, paymentMethods, alerts, usage] = await Promise.all([
    fetchSubscriptionWithPlan(userId),
    fetchBillingPlans(),
    fetchUserInvoices(userId),
    fetchPaymentMethods(userId),
    fetchBillingAlerts(tenantId),
    fetchTenantUsage(tenantId),
  ])

  return {
    subscription: subscription || null,
    plan: subscription?.plan || null,
    availablePlans: plans,
    invoices: invoices.slice(0, 5), // Recent 5 invoices
    paymentMethods,
    alerts,
    usage,
  }
}

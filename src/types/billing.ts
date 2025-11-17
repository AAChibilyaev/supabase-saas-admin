/**
 * Billing Types and Interfaces
 * Issue #28: Stripe Billing & Subscription Management
 */

export interface BillingPlan {
  id: string
  stripe_price_id: string
  stripe_product_id: string
  name: string
  description: string | null
  price_amount: number
  currency: string
  interval: 'month' | 'year'
  interval_count: number
  trial_period_days: number

  // Feature limits
  features: Record<string, boolean | string | number>
  max_documents: number | null
  max_storage_gb: number | null
  max_api_calls_per_month: number | null
  max_users: number | null

  // Metadata
  is_active: boolean
  is_featured: boolean
  sort_order: number

  created_at: string
  updated_at: string
}

export interface StripeCustomer {
  id: string
  user_id: string
  tenant_id: string | null
  stripe_customer_id: string
  email: string
  name: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type SubscriptionStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused'

export interface UserSubscription {
  id: string
  user_id: string
  tenant_id: string | null
  stripe_subscription_id: string
  stripe_customer_id: string

  // Plan information
  plan_id: string | null
  stripe_price_id: string

  // Subscription status
  status: SubscriptionStatus

  // Billing cycle
  current_period_start: string
  current_period_end: string
  trial_start: string | null
  trial_end: string | null
  canceled_at: string | null
  cancel_at_period_end: boolean

  // Payment
  latest_invoice_id: string | null
  default_payment_method: string | null

  // Metadata
  metadata: Record<string, unknown>

  created_at: string
  updated_at: string
}

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'

export interface StripeInvoice {
  id: string
  stripe_invoice_id: string
  customer_id: string
  subscription_id: string | null

  // Invoice details
  amount_due: number
  amount_paid: number
  amount_remaining: number
  currency: string

  // Status and dates
  status: InvoiceStatus
  invoice_number: string | null
  invoice_pdf: string | null
  hosted_invoice_url: string | null

  // Payment
  paid: boolean
  payment_intent_id: string | null
  charge_id: string | null

  // Billing period
  period_start: string | null
  period_end: string | null

  // Dates
  due_date: string | null
  paid_at: string | null

  // Metadata
  metadata: Record<string, unknown>

  created_at: string
  updated_at: string
}

export type PaymentMethodType = 'card' | 'bank_account' | 'sepa_debit'

export interface PaymentMethod {
  id: string
  stripe_payment_method_id: string
  customer_id: string

  // Card details
  type: PaymentMethodType
  card_brand: string | null
  card_last4: string | null
  card_exp_month: number | null
  card_exp_year: number | null

  // Status
  is_default: boolean

  // Metadata
  metadata: Record<string, unknown>

  created_at: string
  updated_at: string
}

export type BillingAlertType =
  | 'quota_warning'
  | 'quota_exceeded'
  | 'payment_failed'
  | 'payment_succeeded'
  | 'subscription_canceled'
  | 'subscription_renewed'
  | 'trial_ending'
  | 'usage_80_percent'
  | 'usage_90_percent'
  | 'usage_100_percent'

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface BillingAlert {
  id: string
  tenant_id: string
  user_id: string | null

  // Alert details
  alert_type: BillingAlertType
  severity: AlertSeverity

  // Thresholds
  threshold: number | null
  current_value: number | null

  // Message
  title: string
  message: string | null

  // Status
  acknowledged: boolean
  acknowledged_at: string | null
  acknowledged_by: string | null

  // Metadata
  metadata: Record<string, unknown>

  triggered_at: string
  created_at: string
}

export interface TenantUsage {
  id: string
  tenant_id: string

  // Usage metrics
  documents_count: number
  storage_bytes: number
  api_calls_count: number
  search_count: number
  active_users_count: number

  // Billing period
  period_start: string
  period_end: string

  // Overage tracking
  overage_documents: number
  overage_storage_gb: number
  overage_api_calls: number
  overage_charges_cents: number

  // Metadata
  metadata: Record<string, unknown>

  created_at: string
  updated_at: string
}

export interface PaymentEvent {
  id: string
  stripe_event_id: string
  event_type: string

  // Related entities
  customer_id: string | null
  subscription_id: string | null
  invoice_id: string | null

  // Event data
  payload: Record<string, unknown>
  processed: boolean
  processed_at: string | null

  // Error handling
  error: string | null
  retry_count: number

  created_at: string
}

export interface UsageSummary {
  tenant_id: string
  tenant_name: string
  documents_count: number
  storage_bytes: number
  api_calls_count: number
  max_documents: number | null
  max_storage_gb: number | null
  max_api_calls_per_month: number | null
  documents_usage_percent: number
  api_calls_usage_percent: number
}

export interface CheckoutSessionRequest {
  priceId: string
  customerId?: string
  successUrl: string
  cancelUrl: string
  trialPeriodDays?: number
}

export interface CheckoutSessionResponse {
  sessionId: string
  url: string
}

export interface CustomerPortalRequest {
  customerId: string
  returnUrl: string
}

export interface CustomerPortalResponse {
  url: string
}

export interface CreateSubscriptionRequest {
  priceId: string
  paymentMethodId: string
}

export interface UpdateSubscriptionRequest {
  subscriptionId: string
  newPriceId: string
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice'
}

export interface CancelSubscriptionRequest {
  subscriptionId: string
  cancelAtPeriodEnd: boolean
}

export interface CreatePaymentMethodRequest {
  type: PaymentMethodType
  cardNumber?: string
  cardExpMonth?: number
  cardExpYear?: number
  cardCvc?: string
}

export interface SetDefaultPaymentMethodRequest {
  paymentMethodId: string
}

export interface BillingOverview {
  subscription: UserSubscription | null
  plan: BillingPlan | null
  usage: TenantUsage | null
  alerts: BillingAlert[]
  recentInvoices: StripeInvoice[]
  paymentMethods: PaymentMethod[]
}

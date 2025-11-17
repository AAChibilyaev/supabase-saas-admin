# Billing System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Billing    │  │     Plan     │  │   Invoice    │             │
│  │  Dashboard   │  │   Selector   │  │     List     │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐                               │
│  │ Subscription │  │    Usage     │                               │
│  │   Manager    │  │    Meters    │                               │
│  └──────────────┘  └──────────────┘                               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BILLING API LAYER                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   src/utils/billing.ts                       │  │
│  │  • fetchBillingPlans()    • createCheckoutSession()         │  │
│  │  • fetchSubscription()    • createCustomerPortal()          │  │
│  │  • fetchInvoices()        • fetchUsage()                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTIONS                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │    create-      │  │     stripe-     │  │    customer-    │   │
│  │    checkout-    │  │     webhook     │  │     portal      │   │
│  │    session      │  │                 │  │                 │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
│         │                     ▲                      │             │
│         └────────┬────────────┼──────────────────────┘             │
│                  │            │                                     │
└──────────────────┼────────────┼─────────────────────────────────────┘
                   │            │
                   ▼            │ (webhook events)
┌─────────────────────────────────────────────────────────────────────┐
│                          STRIPE API                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Checkout   │  │   Customer   │  │   Webhooks   │             │
│  │   Sessions   │  │    Portal    │  │    Events    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     SUPABASE DATABASE                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Tables (with RLS)                                           │  │
│  │  • billing_plans        • stripe_invoices                    │  │
│  │  • stripe_customers     • payment_methods                    │  │
│  │  • user_products        • billing_alerts                     │  │
│  │  • tenant_usage         • payment_events                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Views                                                       │  │
│  │  • active_subscriptions                                      │  │
│  │  • monthly_recurring_revenue                                 │  │
│  │  • tenant_usage_summary                                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Triggers                                                    │  │
│  │  • update_updated_at_column()                                │  │
│  │  • check_usage_limits()                                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Flow Diagram

### 1. Subscription Creation Flow

```
User clicks "Select Plan"
         │
         ▼
PlanSelector component
         │
         ▼
createCheckoutSession() API call
         │
         ▼
Edge Function: create-checkout-session
         │
         ├─► Check if customer exists in DB
         │   ├─► Yes: Use existing customer
         │   └─► No: Create new Stripe customer
         │
         ▼
Stripe API: Create Checkout Session
         │
         ▼
Return checkout URL
         │
         ▼
Redirect user to Stripe Checkout
         │
         ▼
User completes payment
         │
         ▼
Stripe sends webhook: customer.subscription.created
         │
         ▼
Edge Function: stripe-webhook
         │
         ├─► Verify webhook signature
         ├─► Insert into user_products table
         ├─► Create billing alert
         └─► Update payment_events log
         │
         ▼
User redirected to /billing/success
         │
         ▼
CheckoutSuccess page displays
         │
         ▼
Auto-redirect to BillingDashboard
```

### 2. Customer Portal Flow

```
User clicks "Manage Subscription"
         │
         ▼
SubscriptionManager component
         │
         ▼
createCustomerPortalSession() API call
         │
         ▼
Edge Function: customer-portal
         │
         ├─► Get Stripe customer ID from DB
         │
         ▼
Stripe API: Create Portal Session
         │
         ▼
Return portal URL
         │
         ▼
Redirect user to Stripe Customer Portal
         │
         ├─► User updates payment method
         ├─► User cancels subscription
         └─► User views invoices
         │
         ▼
Stripe sends webhook events
         │
         ├─► payment_method.attached/detached
         ├─► customer.subscription.updated
         └─► invoice.* events
         │
         ▼
Edge Function: stripe-webhook
         │
         └─► Update database accordingly
         │
         ▼
User returns to app (returnUrl)
```

### 3. Usage Tracking Flow

```
Application activity
(document upload, API call, etc.)
         │
         ▼
Update tenant_usage table
         │
         ▼
Trigger: check_usage_limits()
         │
         ├─► Calculate usage percentage
         │
         ├─► 80% threshold reached?
         │   └─► Insert usage_80_percent alert
         │
         ├─► 90% threshold reached?
         │   └─► Insert usage_90_percent alert
         │
         └─► 100% threshold reached?
             └─► Insert usage_100_percent alert
         │
         ▼
BillingDashboard displays alerts
         │
         ▼
UsageMeters component shows progress
```

## Data Flow Diagram

```
┌──────────────────┐
│   Stripe         │
│   Dashboard      │
│                  │
│  • Create        │
│    Products      │
│  • Create        │
│    Prices        │
│  • Configure     │
│    Webhooks      │
└────────┬─────────┘
         │
         │ (Price IDs)
         ▼
┌──────────────────┐
│  billing_plans   │
│  table           │
│                  │
│  INSERT INTO     │
│  billing_plans   │
│  (stripe_price_  │
│   id, ...)       │
└────────┬─────────┘
         │
         │ (Available plans)
         ▼
┌──────────────────┐
│  PlanSelector    │
│  Component       │
│                  │
│  Display plans   │
│  with pricing    │
└────────┬─────────┘
         │
         │ (User selects plan)
         ▼
┌──────────────────┐
│  Stripe          │
│  Checkout        │
│                  │
│  Payment form    │
└────────┬─────────┘
         │
         │ (Payment success)
         ▼
┌──────────────────┐
│  Webhook Event   │
│                  │
│  subscription    │
│  .created        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  stripe_         │
│  customers       │
│  +               │
│  user_products   │
│  tables          │
└────────┬─────────┘
         │
         │ (Subscription active)
         ▼
┌──────────────────┐
│  Subscription    │
│  Manager         │
│                  │
│  Show current    │
│  plan details    │
└──────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                          │
└─────────────────────────────────────────────────────────────┘

Layer 1: Authentication
┌──────────────────────────────────────────────────────────┐
│  Supabase Auth                                           │
│  • User must be authenticated                            │
│  • JWT token verification                                │
│  • Session management                                    │
└──────────────────────────────────────────────────────────┘
                        │
                        ▼
Layer 2: Authorization
┌──────────────────────────────────────────────────────────┐
│  Row Level Security (RLS)                                │
│  • Users can only access their own records               │
│  • Tenant isolation enforced                             │
│  • Service role for webhooks only                        │
└──────────────────────────────────────────────────────────┘
                        │
                        ▼
Layer 3: Payment Security
┌──────────────────────────────────────────────────────────┐
│  Stripe Security                                         │
│  • PCI DSS compliant                                     │
│  • No card data stored locally                           │
│  • Webhook signature verification                        │
│  • HTTPS required                                        │
└──────────────────────────────────────────────────────────┘
                        │
                        ▼
Layer 4: Data Protection
┌──────────────────────────────────────────────────────────┐
│  Encryption & Privacy                                    │
│  • Data encrypted in transit (TLS)                       │
│  • Data encrypted at rest (Supabase)                     │
│  • Minimal data collection                               │
│  • GDPR compliant                                        │
└──────────────────────────────────────────────────────────┘
```

## Database Schema Relationships

```
┌──────────────────┐
│  auth.users      │
│  (Supabase)      │
└────────┬─────────┘
         │
         │ 1:1
         ▼
┌──────────────────┐      ┌──────────────────┐
│ stripe_customers │      │  billing_plans   │
│                  │      │                  │
│ • user_id    ────┼──┐   │ • stripe_price_id│
│ • tenant_id      │  │   │ • features       │
│ • stripe_cust_id │  │   │ • limits         │
└────────┬─────────┘  │   └────────┬─────────┘
         │            │            │
         │ 1:N        │            │
         ▼            │            │
┌──────────────────┐  │            │
│  user_products   │  │            │
│                  │  │            │
│ • subscription_id│  │            │
│ • plan_id    ────┼──┼────────────┘
│ • status         │  │
│ • period_dates   │  │
└────────┬─────────┘  │
         │            │
         │ 1:N        │
         ▼            │
┌──────────────────┐  │
│ stripe_invoices  │  │
│                  │  │
│ • customer_id────┼──┘
│ • subscription_id│
│ • amount_paid    │
│ • invoice_pdf    │
└──────────────────┘  │
                      │
         ┌────────────┘
         │
         ▼
┌──────────────────┐
│ payment_methods  │
│                  │
│ • customer_id    │
│ • card_brand     │
│ • card_last4     │
│ • is_default     │
└──────────────────┘

┌──────────────────┐
│    tenants       │
│                  │
└────────┬─────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐
│  tenant_usage    │
│                  │
│ • tenant_id      │
│ • documents_count│
│ • storage_bytes  │
│ • api_calls      │
│ • overage_charges│
└────────┬─────────┘
         │
         │ Triggers
         ▼
┌──────────────────┐
│ billing_alerts   │
│                  │
│ • tenant_id      │
│ • alert_type     │
│ • severity       │
│ • acknowledged   │
└──────────────────┘
```

## Event Processing Flow

```
Stripe Event → Webhook Endpoint → Edge Function → Database Update → Alert Creation

Example: Payment Success
┌──────────────────────────────────────────────────────────────────┐
│ Stripe: invoice.payment_succeeded event                         │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│ POST /functions/v1/stripe-webhook                                │
│ Headers: stripe-signature                                        │
│ Body: Event payload                                              │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│ Webhook Handler (Edge Function)                                  │
│ 1. Verify signature                                              │
│ 2. Log to payment_events table                                   │
│ 3. Parse event data                                              │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│ handleInvoicePaymentSucceeded()                                  │
│ 1. Get customer from stripe_customers                            │
│ 2. Get subscription from user_products                           │
│ 3. Upsert invoice to stripe_invoices                             │
│ 4. Create success alert in billing_alerts                        │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│ Mark event as processed                                          │
│ Update payment_events.processed = true                           │
└──────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────┐
│ User Action │
└─────┬───────┘
      │
      ▼
┌─────────────────┐
│ Try-Catch Block │
└─────┬───────────┘
      │
      ├─► Success ──────────► Continue
      │
      └─► Error
          │
          ▼
    ┌─────────────────┐
    │ Error Handler   │
    └─────┬───────────┘
          │
          ├─► Log error to console
          │
          ├─► Show user-friendly message
          │
          ├─► Store in payment_events (for webhooks)
          │
          └─► Retry logic (if applicable)
```

---

This architecture ensures:
- ✅ Secure payment processing
- ✅ Reliable webhook handling
- ✅ Real-time usage tracking
- ✅ Automated alerting
- ✅ Complete audit trail
- ✅ Scalable design

# Stripe Billing Implementation

## Issue #28: Complete Billing & Subscription Management System

### Overview

This implementation provides a comprehensive billing and subscription management system integrated with Stripe. It includes all features required for SaaS monetization with robust error handling and security.

## Features Implemented

### 1. Subscription Management
- ✅ View current subscription plan
- ✅ Upgrade/downgrade between plans
- ✅ Cancel subscription
- ✅ Reactivate canceled subscription
- ✅ Plan comparison table with feature highlights
- ✅ Trial period support

### 2. Payment Processing
- ✅ Secure Stripe Checkout integration
- ✅ Stripe Customer Portal for self-service management
- ✅ Payment method management (add/remove cards)
- ✅ Default payment method selection
- ✅ Payment history tracking

### 3. Invoices & Receipts
- ✅ Invoice list with download links
- ✅ PDF invoice generation (via Stripe)
- ✅ Hosted invoice pages
- ✅ Email receipts (via Stripe)
- ✅ Payment history with status badges

### 4. Usage-Based Billing
- ✅ Quota tracking (documents, storage, API calls, users)
- ✅ Real-time usage metrics
- ✅ Usage alerts (80%, 90%, 100% thresholds)
- ✅ Overage charge calculation
- ✅ Visual progress indicators

### 5. Webhook Handling
- ✅ Subscription lifecycle events
- ✅ Payment success/failure events
- ✅ Invoice events
- ✅ Customer update events
- ✅ Payment method events
- ✅ Event logging and retry logic

### 6. Security Features
- ✅ Row Level Security (RLS) on all tables
- ✅ Webhook signature verification
- ✅ Secure API key management
- ✅ User authentication required
- ✅ Tenant isolation

## Architecture

### Database Schema

```
billing_plans              - Subscription plan definitions
├── stripe_price_id       - Stripe Price ID
├── features              - Feature flags (JSONB)
└── limits                - Usage limits

stripe_customers          - Customer records
├── user_id              - Links to auth.users
├── tenant_id            - Links to tenants
└── stripe_customer_id   - Stripe Customer ID

user_products            - Active subscriptions
├── subscription_id      - Stripe Subscription ID
├── plan_id             - Links to billing_plans
├── status              - Subscription status
└── billing_cycle       - Period dates

stripe_invoices          - Invoice records
├── stripe_invoice_id   - Stripe Invoice ID
├── amount_paid         - Payment amount
└── invoice_pdf         - PDF download URL

payment_methods          - Saved payment methods
├── card_brand          - Visa, Mastercard, etc.
├── card_last4          - Last 4 digits
└── is_default          - Default payment method

billing_alerts           - Usage and payment alerts
├── alert_type          - quota_warning, payment_failed, etc.
├── severity            - info, warning, error, critical
└── acknowledged        - User acknowledgment status

tenant_usage            - Usage tracking
├── documents_count     - Document usage
├── storage_bytes       - Storage usage
├── api_calls_count     - API usage
└── overage_charges     - Additional charges

payment_events          - Webhook event log
├── stripe_event_id     - Stripe Event ID
├── payload             - Full event data
└── processed           - Processing status
```

### Edge Functions

#### create-checkout-session
**Purpose**: Create Stripe Checkout session for subscription purchase

**Endpoint**: `/functions/v1/create-checkout-session`

**Input**:
```typescript
{
  priceId: string
  successUrl: string
  cancelUrl: string
  trialPeriodDays?: number
}
```

**Output**:
```typescript
{
  sessionId: string
  url: string
}
```

#### stripe-webhook
**Purpose**: Handle Stripe webhook events

**Endpoint**: `/functions/v1/stripe-webhook`

**Events Handled**:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `invoice.created`
- `invoice.finalized`
- `payment_method.attached`
- `payment_method.detached`
- `customer.updated`

#### customer-portal
**Purpose**: Create Customer Portal session

**Endpoint**: `/functions/v1/customer-portal`

**Input**:
```typescript
{
  returnUrl: string
}
```

**Output**:
```typescript
{
  url: string
}
```

### Frontend Components

#### PlanSelector
Displays available plans with features and pricing. Handles plan selection and checkout initiation.

**Location**: `src/components/billing/PlanSelector.tsx`

**Features**:
- Plan comparison
- Feature highlights
- Current plan indication
- Checkout integration

#### SubscriptionManager
Shows current subscription details and management options.

**Location**: `src/components/billing/SubscriptionManager.tsx`

**Features**:
- Subscription status
- Billing cycle information
- Plan limits display
- Customer Portal access

#### InvoiceList
Displays billing history with invoice downloads.

**Location**: `src/components/billing/InvoiceList.tsx`

**Features**:
- Invoice table
- PDF downloads
- Status indicators
- Date formatting

#### UsageMeters
Visual usage tracking with quota indicators.

**Location**: `src/components/billing/UsageMeters.tsx`

**Features**:
- Progress bars
- Usage percentages
- Warning indicators
- Overage display

#### BillingDashboard
Main billing page with tabs for overview, plans, invoices, and usage.

**Location**: `src/resources/billing/BillingDashboard.tsx`

**Features**:
- Tabbed interface
- Alert notifications
- Summary cards
- Complete billing overview

### Utilities

#### Stripe Utilities (`src/lib/stripe.ts`)
- Currency formatting
- Date calculations
- Status helpers
- Usage calculations

#### Billing API (`src/utils/billing.ts`)
- Data fetching functions
- Checkout session creation
- Customer Portal access
- Alert management

## Usage Examples

### Creating a Subscription

```typescript
import { createCheckoutSession } from '@/utils/billing'

const handleSubscribe = async (priceId: string) => {
  const { url } = await createCheckoutSession(
    priceId,
    `${window.location.origin}/billing/success`,
    `${window.location.origin}/billing`
  )
  window.location.href = url
}
```

### Opening Customer Portal

```typescript
import { createCustomerPortalSession } from '@/utils/billing'

const handleManageSubscription = async () => {
  const { url } = await createCustomerPortalSession(
    window.location.href
  )
  window.location.href = url
}
```

### Fetching Billing Overview

```typescript
import { fetchBillingOverview } from '@/utils/billing'

const loadBillingData = async (userId: string, tenantId: string) => {
  const data = await fetchBillingOverview(userId, tenantId)
  // data.subscription, data.plan, data.invoices, etc.
}
```

### Tracking Usage

```sql
-- Update tenant usage
INSERT INTO tenant_usage (
  tenant_id,
  documents_count,
  storage_bytes,
  api_calls_count,
  period_start,
  period_end
) VALUES (
  'tenant_uuid',
  150,
  5368709120,  -- 5 GB in bytes
  5000,
  '2025-01-01',
  '2025-02-01'
)
ON CONFLICT (tenant_id, period_start, period_end)
DO UPDATE SET
  documents_count = EXCLUDED.documents_count,
  storage_bytes = EXCLUDED.storage_bytes,
  api_calls_count = EXCLUDED.api_calls_count;
```

## Error Handling

### Webhook Errors
- All events logged to `payment_events` table
- Retry counter for failed events
- Error messages stored for debugging
- Manual retry capability

### Payment Failures
- Automatic alerts created
- User notifications
- Status updated in database
- Retry logic via Stripe

### API Errors
- Try-catch blocks on all API calls
- User-friendly error messages
- Fallback UI states
- Error logging

## Security Considerations

### API Key Security
- Publishable key safe for frontend
- Secret keys only in Edge Functions
- Environment variable storage
- Never committed to git

### Webhook Security
- Signature verification required
- HTTPS endpoint mandatory
- Event ID deduplication
- Payload validation

### Database Security
- RLS enabled on all tables
- User-based access control
- Tenant isolation enforced
- Secure queries only

### Data Privacy
- PCI compliance via Stripe
- No card data stored locally
- Encrypted data transmission
- GDPR-compliant data handling

## Testing

### Test Mode Setup
1. Use test API keys (pk_test_*, sk_test_*)
2. Use test card numbers
3. Test webhook events locally

### Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184
```

### Test Webhooks
```bash
# Forward webhooks to local development
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
```

## Monitoring

### Key Metrics to Monitor
- Active subscriptions count
- Monthly Recurring Revenue (MRR)
- Churn rate
- Failed payment rate
- Average revenue per user (ARPU)
- Usage trends

### Database Views
```sql
-- Active subscriptions
SELECT * FROM active_subscriptions;

-- Monthly recurring revenue
SELECT * FROM monthly_recurring_revenue;

-- Usage summary
SELECT * FROM tenant_usage_summary;
```

### Alerts to Set Up
- Failed payment webhooks
- High churn indicators
- Usage quota violations
- Subscription cancellations
- Revenue anomalies

## Deployment Checklist

- [ ] Stripe account created and verified
- [ ] Products created in Stripe
- [ ] Database migration applied
- [ ] Billing plans inserted
- [ ] Edge Functions deployed
- [ ] Webhook endpoint configured
- [ ] Environment variables set
- [ ] Test subscription flow
- [ ] Test webhook events
- [ ] Test Customer Portal
- [ ] Production keys configured
- [ ] Monitoring set up

## Future Enhancements

### Potential Additions
- Annual billing discounts
- Add-on purchases
- Seat-based pricing
- Metered billing
- Promotional codes
- Referral program
- Multi-currency support
- Tax calculation
- Custom contract terms
- Usage reports/analytics

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Webhook Guide](https://stripe.com/docs/webhooks)
- [Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)

## Support

For implementation questions or issues:
1. Check setup guide: `docs/STRIPE_BILLING_SETUP.md`
2. Review Stripe logs in Dashboard
3. Check Supabase Edge Function logs
4. Review `payment_events` table for webhook errors
5. Create GitHub issue with details

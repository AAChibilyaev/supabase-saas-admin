# Stripe Billing & Subscription Management Setup Guide

## Issue #28: Complete Implementation Guide

This document provides step-by-step instructions for setting up and configuring the Stripe billing system.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Stripe Account Setup](#stripe-account-setup)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [Supabase Edge Functions](#supabase-edge-functions)
7. [Webhook Configuration](#webhook-configuration)
8. [Testing](#testing)
9. [Production Deployment](#production-deployment)

## Overview

The billing system includes:
- Multiple subscription plans with feature limits
- Secure payment processing with Stripe Checkout
- Subscription management via Stripe Customer Portal
- Usage tracking and quota enforcement
- Automatic billing alerts
- Invoice management
- Webhook handling for payment events

## Prerequisites

- Stripe account (sign up at https://stripe.com)
- Supabase project with CLI installed
- Node.js 18+ and npm

## Stripe Account Setup

### 1. Create Stripe Account

1. Sign up at https://dashboard.stripe.com/register
2. Complete account verification
3. Navigate to Dashboard

### 2. Get API Keys

1. Go to **Developers > API keys**
2. Copy your **Publishable key** (starts with `pk_test_` for test mode)
3. Copy your **Secret key** (starts with `sk_test_` for test mode)
4. Keep these secure - never commit to version control

### 3. Create Products and Prices

#### Option A: Via Stripe Dashboard

1. Go to **Products > Add Product**
2. Create each plan (Free, Starter, Professional, Enterprise)
3. For each product:
   - Set name, description
   - Add recurring price
   - Set billing interval (monthly/yearly)
   - Copy the **Price ID** (starts with `price_`)

#### Option B: Via Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your account
stripe login

# Create products
stripe products create \
  --name="Starter" \
  --description="Great for small teams"

# Create price for the product
stripe prices create \
  --product=prod_XXXXXX \
  --unit-amount=2900 \
  --currency=usd \
  --recurring[interval]=month
```

### 4. Update Database Migration

Edit `migrations/20250117_stripe_billing_system.sql` and update the billing plans with your actual Stripe Price IDs:

```sql
INSERT INTO billing_plans (
  stripe_price_id,
  stripe_product_id,
  name,
  -- ... other fields
) VALUES
  ('price_YOUR_ACTUAL_PRICE_ID', 'prod_YOUR_ACTUAL_PRODUCT_ID', 'Starter', ...),
  -- ... other plans
```

## Database Setup

### 1. Run Migration

```bash
# Using Supabase CLI
supabase db push

# Or run the SQL directly in Supabase Dashboard
# Go to SQL Editor and paste the migration file
```

### 2. Verify Tables Created

Check that these tables exist:
- `billing_plans`
- `stripe_customers`
- `user_products`
- `stripe_invoices`
- `payment_methods`
- `billing_alerts`
- `tenant_usage`
- `payment_events`

### 3. Insert Billing Plans

Make sure your billing plans are inserted with correct Stripe Price IDs.

## Environment Configuration

### 1. Frontend Environment (.env)

```bash
# Add to .env (DO NOT commit this file)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key
```

### 2. Supabase Edge Functions Environment

Set these in Supabase Dashboard under **Edge Functions > Secrets**:

```bash
# Set via Supabase CLI
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_secret_key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Or via Dashboard: Settings > Edge Functions > Add Secret
```

## Supabase Edge Functions

### 1. Deploy Edge Functions

```bash
# Deploy create-checkout-session
supabase functions deploy create-checkout-session

# Deploy stripe-webhook
supabase functions deploy stripe-webhook

# Deploy customer-portal
supabase functions deploy customer-portal
```

### 2. Test Edge Functions

```bash
# Test create-checkout-session
supabase functions invoke create-checkout-session \
  --data '{"priceId":"price_xxx","successUrl":"http://localhost:5173/billing/success","cancelUrl":"http://localhost:5173/billing"}'
```

### 3. Get Function URLs

```bash
# List deployed functions
supabase functions list

# URLs will be:
# https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-checkout-session
# https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
# https://YOUR_PROJECT_REF.supabase.co/functions/v1/customer-portal
```

## Webhook Configuration

### 1. Get Webhook Endpoint URL

Your webhook URL will be:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

### 2. Configure in Stripe Dashboard

1. Go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL
4. Select events to listen to:
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

5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add to Supabase secrets:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret
   ```

### 3. Test Webhook

```bash
# Using Stripe CLI
stripe listen --forward-to https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
```

## Testing

### 1. Test Mode

All development should use Stripe test mode:
- Use test API keys (pk_test_*, sk_test_*)
- Use test card numbers (https://stripe.com/docs/testing)

### 2. Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Authentication required: 4000 0027 6000 3184

Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

### 3. Test Subscription Flow

1. Navigate to `/billing` in your app
2. Click on a plan
3. Complete checkout with test card
4. Verify subscription created in Stripe Dashboard
5. Check database for:
   - New row in `stripe_customers`
   - New row in `user_products`
   - Webhook event in `payment_events`

### 4. Test Customer Portal

1. With active subscription, click "Manage Subscription"
2. Verify redirect to Stripe Customer Portal
3. Test actions:
   - Update payment method
   - View invoices
   - Cancel subscription

## Production Deployment

### 1. Switch to Live Mode

1. In Stripe Dashboard, toggle to **Live mode**
2. Get live API keys (pk_live_*, sk_live_*)
3. Update all secrets with live keys
4. Recreate products and prices in live mode
5. Update database with live Price IDs

### 2. Update Environment Variables

```bash
# Production .env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key

# Supabase secrets
supabase secrets set STRIPE_SECRET_KEY=sk_live_your_live_key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
```

### 3. Update Webhook Endpoint

1. Add production webhook endpoint in Stripe Dashboard
2. Use production Supabase URL
3. Select same events as test mode
4. Save signing secret to production secrets

### 4. Enable Billing in Stripe

1. Complete business verification
2. Add bank account for payouts
3. Configure billing settings
4. Set up tax collection (if needed)

### 5. Production Checklist

- [ ] Live API keys configured
- [ ] Webhook endpoint verified
- [ ] Products and prices created in live mode
- [ ] Database updated with live Price IDs
- [ ] Customer Portal configured
- [ ] Tax settings configured (if applicable)
- [ ] Email notifications enabled
- [ ] Receipt emails customized
- [ ] Business verification complete
- [ ] Payout schedule configured

## Usage Tracking

### Updating Usage Metrics

Usage is tracked in the `tenant_usage` table. Update metrics using:

```sql
-- Example: Update document count
INSERT INTO tenant_usage (tenant_id, documents_count, period_start, period_end)
VALUES ('tenant_uuid', 100, NOW(), NOW() + INTERVAL '1 month')
ON CONFLICT (tenant_id, period_start, period_end)
DO UPDATE SET documents_count = EXCLUDED.documents_count;
```

### Automatic Alerts

The database trigger `check_usage_limits()` automatically creates alerts when:
- 80% of quota reached
- 90% of quota reached
- 100% of quota reached

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is correct
2. Verify webhook secret is set correctly
3. Check Edge Function logs: `supabase functions logs stripe-webhook`
4. Test with Stripe CLI: `stripe listen --forward-to URL`

### Checkout Not Working

1. Verify Stripe publishable key is correct
2. Check browser console for errors
3. Verify Edge Function is deployed
4. Check CORS configuration

### Subscription Not Showing

1. Verify webhook received `customer.subscription.created`
2. Check `payment_events` table for errors
3. Verify customer exists in `stripe_customers`
4. Check Edge Function logs

## Security Best Practices

1. **Never expose secret keys** - Use environment variables
2. **Verify webhook signatures** - Always validate Stripe signatures
3. **Use HTTPS** - All webhook endpoints must use HTTPS
4. **Implement RLS** - Database tables have Row Level Security enabled
5. **Validate user input** - Sanitize all user-provided data
6. **Log events** - Keep audit trail of all billing events
7. **Monitor alerts** - Set up alerts for failed payments
8. **Regular backups** - Backup billing data regularly

## Support

For issues or questions:
- Stripe documentation: https://stripe.com/docs
- Supabase documentation: https://supabase.com/docs
- GitHub Issues: Create issue in project repository

## Additional Resources

- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)

# Stripe Billing - Quick Start Guide

## 5-Minute Setup for Development

### Step 1: Get Stripe Test Keys (2 min)

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

### Step 2: Configure Environment (1 min)

Add to your `.env` file:
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

### Step 3: Set Supabase Secrets (1 min)

```bash
# Using Supabase CLI
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_temp_for_now

# Or set in Supabase Dashboard:
# Settings > Edge Functions > Add Secret
```

### Step 4: Run Database Migration (30 sec)

```bash
# Option A: Using Supabase CLI
supabase db push

# Option B: In Supabase Dashboard
# Go to SQL Editor
# Copy/paste contents of migrations/20250117_stripe_billing_system.sql
# Run it
```

### Step 5: Deploy Edge Functions (30 sec)

```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy customer-portal
```

### Done! Now Test It

Visit your app at `/billing` and you should see:
- Available billing plans
- Ability to select a plan
- Checkout flow (use test card: 4242 4242 4242 4242)

---

## Test Cards

```
✅ Success: 4242 4242 4242 4242
❌ Decline: 4000 0000 0000 0002
🔐 3D Secure: 4000 0027 6000 3184

Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

---

## Common Issues

### "Stripe publishable key is not configured"
**Fix**: Add `VITE_STRIPE_PUBLISHABLE_KEY` to your `.env` file

### "Missing authorization header"
**Fix**: Make sure you're logged in to the app

### Webhook not working
**Fix**: For local testing, use Stripe CLI:
```bash
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

### "No customer found"
**Fix**: Complete one checkout first - customer is created automatically

---

## Next Steps

After basic setup works:
1. Create real products in Stripe Dashboard
2. Update `billing_plans` table with real Price IDs
3. Configure webhook endpoint in Stripe Dashboard
4. Test full subscription lifecycle
5. See full documentation in `docs/STRIPE_BILLING_SETUP.md`

---

## Quick Reference

### Available Plans (Default)
- **Free**: $0/month - 100 docs, 1 GB storage
- **Starter**: $29/month - 1K docs, 10 GB storage
- **Professional**: $99/month - 10K docs, 100 GB storage
- **Enterprise**: $299/month - Unlimited

### API Endpoints
```
POST /functions/v1/create-checkout-session
POST /functions/v1/stripe-webhook
POST /functions/v1/customer-portal
```

### Key Tables
- `billing_plans` - Available plans
- `user_products` - Active subscriptions
- `stripe_invoices` - Payment history
- `tenant_usage` - Usage tracking

### Key Components
- `<BillingDashboard />` - Main billing page
- `<PlanSelector />` - Plan selection UI
- `<SubscriptionManager />` - Current plan details
- `<UsageMeters />` - Usage tracking

---

## Support

- Full Setup: `docs/STRIPE_BILLING_SETUP.md`
- Implementation Details: `docs/BILLING_IMPLEMENTATION.md`
- Stripe Docs: https://stripe.com/docs

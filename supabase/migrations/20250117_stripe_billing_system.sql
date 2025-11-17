-- ============================================================================
-- Stripe Billing & Subscription Management System
-- Issue #28: Comprehensive billing implementation
-- ============================================================================

-- ===========================================================================
-- 1. BILLING PLANS TABLE
-- ===========================================================================
CREATE TABLE IF NOT EXISTS billing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_price_id TEXT UNIQUE NOT NULL,
  stripe_product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')), -- Billing interval
  interval_count INTEGER NOT NULL DEFAULT 1,
  trial_period_days INTEGER DEFAULT 0,

  -- Feature limits
  features JSONB DEFAULT '{}'::jsonb,
  max_documents INTEGER,
  max_storage_gb INTEGER,
  max_api_calls_per_month INTEGER,
  max_users INTEGER,

  -- Plan metadata
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_billing_plans_stripe_price_id ON billing_plans(stripe_price_id);
CREATE INDEX IF NOT EXISTS idx_billing_plans_active ON billing_plans(is_active) WHERE is_active = true;

-- ===========================================================================
-- 2. STRIPE CUSTOMERS TABLE
-- ===========================================================================
CREATE TABLE IF NOT EXISTS stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,

  -- Customer metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_tenant_id ON stripe_customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);

-- ===========================================================================
-- 3. USER PRODUCTS / SUBSCRIPTIONS TABLE
-- ===========================================================================
CREATE TABLE IF NOT EXISTS user_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,

  -- Plan information
  plan_id UUID REFERENCES billing_plans(id) ON DELETE SET NULL,
  stripe_price_id TEXT NOT NULL,

  -- Subscription status
  status TEXT NOT NULL CHECK (status IN (
    'incomplete', 'incomplete_expired', 'trialing', 'active',
    'past_due', 'canceled', 'unpaid', 'paused'
  )),

  -- Billing cycle
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,

  -- Payment
  latest_invoice_id TEXT,
  default_payment_method TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_products_user_id ON user_products(user_id);
CREATE INDEX IF NOT EXISTS idx_user_products_tenant_id ON user_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_products_status ON user_products(status);
CREATE INDEX IF NOT EXISTS idx_user_products_stripe_subscription_id ON user_products(stripe_subscription_id);

-- ===========================================================================
-- 4. STRIPE INVOICES TABLE
-- ===========================================================================
CREATE TABLE IF NOT EXISTS stripe_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES stripe_customers(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_products(id) ON DELETE SET NULL,

  -- Invoice details
  amount_due INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL,
  amount_remaining INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',

  -- Status and dates
  status TEXT NOT NULL CHECK (status IN (
    'draft', 'open', 'paid', 'uncollectible', 'void'
  )),
  invoice_number TEXT,
  invoice_pdf TEXT,
  hosted_invoice_url TEXT,

  -- Payment
  paid BOOLEAN DEFAULT false,
  payment_intent_id TEXT,
  charge_id TEXT,

  -- Billing period
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,

  -- Dates
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_customer_id ON stripe_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_subscription_id ON stripe_invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_status ON stripe_invoices(status);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_stripe_id ON stripe_invoices(stripe_invoice_id);

-- ===========================================================================
-- 5. PAYMENT METHODS TABLE
-- ===========================================================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES stripe_customers(id) ON DELETE CASCADE,

  -- Card details
  type TEXT NOT NULL CHECK (type IN ('card', 'bank_account', 'sepa_debit')),
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,

  -- Status
  is_default BOOLEAN DEFAULT false,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_customer_id ON payment_methods(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);

-- ===========================================================================
-- 6. BILLING ALERTS TABLE
-- ===========================================================================
CREATE TABLE IF NOT EXISTS billing_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Alert details
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'quota_warning', 'quota_exceeded', 'payment_failed',
    'payment_succeeded', 'subscription_canceled', 'subscription_renewed',
    'trial_ending', 'usage_80_percent', 'usage_90_percent', 'usage_100_percent'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')) DEFAULT 'info',

  -- Thresholds
  threshold INTEGER,
  current_value INTEGER,

  -- Message
  title TEXT NOT NULL,
  message TEXT,

  -- Status
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_billing_alerts_tenant_id ON billing_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_alerts_user_id ON billing_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_alerts_type ON billing_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_billing_alerts_acknowledged ON billing_alerts(acknowledged) WHERE acknowledged = false;

-- ===========================================================================
-- 7. TENANT USAGE TABLE (Enhanced for billing)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS tenant_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Usage metrics
  documents_count INTEGER DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,
  api_calls_count INTEGER DEFAULT 0,
  search_count INTEGER DEFAULT 0,
  active_users_count INTEGER DEFAULT 0,

  -- Billing period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Overage tracking
  overage_documents INTEGER DEFAULT 0,
  overage_storage_gb NUMERIC(10,2) DEFAULT 0,
  overage_api_calls INTEGER DEFAULT 0,
  overage_charges_cents INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one record per tenant per period
  UNIQUE(tenant_id, period_start, period_end)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenant_usage_tenant_id ON tenant_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_period ON tenant_usage(period_start, period_end);

-- ===========================================================================
-- 8. PAYMENT EVENTS LOG TABLE
-- ===========================================================================
CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,

  -- Related entities
  customer_id UUID REFERENCES stripe_customers(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES user_products(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES stripe_invoices(id) ON DELETE SET NULL,

  -- Event data
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,

  -- Error handling
  error TEXT,
  retry_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_events_stripe_id ON payment_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_type ON payment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_events_processed ON payment_events(processed) WHERE processed = false;

-- ===========================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ===========================================================================

-- Enable RLS on all billing tables
ALTER TABLE billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

-- Billing Plans: Public read for authenticated users
CREATE POLICY "billing_plans_read_all" ON billing_plans
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Stripe Customers: Users can view their own customer record
CREATE POLICY "stripe_customers_read_own" ON stripe_customers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- User Products: Users can view their own subscriptions
CREATE POLICY "user_products_read_own" ON user_products
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Invoices: Users can view their own invoices
CREATE POLICY "stripe_invoices_read_own" ON stripe_invoices
  FOR SELECT TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM stripe_customers WHERE user_id = auth.uid()
    )
  );

-- Payment Methods: Users can manage their own payment methods
CREATE POLICY "payment_methods_read_own" ON payment_methods
  FOR SELECT TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM stripe_customers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "payment_methods_insert_own" ON payment_methods
  FOR INSERT TO authenticated
  WITH CHECK (
    customer_id IN (
      SELECT id FROM stripe_customers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "payment_methods_delete_own" ON payment_methods
  FOR DELETE TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM stripe_customers WHERE user_id = auth.uid()
    )
  );

-- Billing Alerts: Users can view and acknowledge their tenant's alerts
CREATE POLICY "billing_alerts_read_tenant" ON billing_alerts
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "billing_alerts_update_tenant" ON billing_alerts
  FOR UPDATE TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

-- Tenant Usage: Users can view their tenant's usage
CREATE POLICY "tenant_usage_read_tenant" ON tenant_usage
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

-- Payment Events: Service role only (for webhook processing)
-- No public policies - accessed only by Edge Functions with service role

-- ===========================================================================
-- 10. FUNCTIONS AND TRIGGERS
-- ===========================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to all tables
DROP TRIGGER IF EXISTS update_billing_plans_updated_at ON billing_plans;
CREATE TRIGGER update_billing_plans_updated_at
  BEFORE UPDATE ON billing_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stripe_customers_updated_at ON stripe_customers;
CREATE TRIGGER update_stripe_customers_updated_at
  BEFORE UPDATE ON stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_products_updated_at ON user_products;
CREATE TRIGGER update_user_products_updated_at
  BEFORE UPDATE ON user_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stripe_invoices_updated_at ON stripe_invoices;
CREATE TRIGGER update_stripe_invoices_updated_at
  BEFORE UPDATE ON stripe_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check usage limits and create alerts
CREATE OR REPLACE FUNCTION check_usage_limits()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_id UUID;
  v_max_documents INTEGER;
  v_max_api_calls INTEGER;
  v_usage_percent NUMERIC;
BEGIN
  -- Get the tenant's current plan limits
  SELECT up.plan_id INTO v_plan_id
  FROM user_products up
  WHERE up.tenant_id = NEW.tenant_id
    AND up.status = 'active'
  LIMIT 1;

  IF v_plan_id IS NOT NULL THEN
    SELECT max_documents, max_api_calls_per_month
    INTO v_max_documents, v_max_api_calls
    FROM billing_plans
    WHERE id = v_plan_id;

    -- Check document usage
    IF v_max_documents IS NOT NULL AND NEW.documents_count IS NOT NULL THEN
      v_usage_percent := (NEW.documents_count::NUMERIC / v_max_documents::NUMERIC) * 100;

      IF v_usage_percent >= 100 AND NOT EXISTS (
        SELECT 1 FROM billing_alerts
        WHERE tenant_id = NEW.tenant_id
          AND alert_type = 'usage_100_percent'
          AND triggered_at > NOW() - INTERVAL '1 day'
      ) THEN
        INSERT INTO billing_alerts (tenant_id, alert_type, severity, threshold, current_value, title, message)
        VALUES (NEW.tenant_id, 'usage_100_percent', 'critical', v_max_documents, NEW.documents_count,
                'Usage Limit Reached', 'You have reached 100% of your document quota.');
      ELSIF v_usage_percent >= 90 AND NOT EXISTS (
        SELECT 1 FROM billing_alerts
        WHERE tenant_id = NEW.tenant_id
          AND alert_type = 'usage_90_percent'
          AND triggered_at > NOW() - INTERVAL '1 day'
      ) THEN
        INSERT INTO billing_alerts (tenant_id, alert_type, severity, threshold, current_value, title, message)
        VALUES (NEW.tenant_id, 'usage_90_percent', 'warning', v_max_documents, NEW.documents_count,
                'Usage Warning', 'You have reached 90% of your document quota.');
      ELSIF v_usage_percent >= 80 AND NOT EXISTS (
        SELECT 1 FROM billing_alerts
        WHERE tenant_id = NEW.tenant_id
          AND alert_type = 'usage_80_percent'
          AND triggered_at > NOW() - INTERVAL '1 day'
      ) THEN
        INSERT INTO billing_alerts (tenant_id, alert_type, severity, threshold, current_value, title, message)
        VALUES (NEW.tenant_id, 'usage_80_percent', 'info', v_max_documents, NEW.documents_count,
                'Usage Notice', 'You have reached 80% of your document quota.');
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to check usage limits
DROP TRIGGER IF EXISTS check_tenant_usage_limits ON tenant_usage;
CREATE TRIGGER check_tenant_usage_limits
  AFTER INSERT OR UPDATE ON tenant_usage
  FOR EACH ROW
  EXECUTE FUNCTION check_usage_limits();

-- ===========================================================================
-- 11. INITIAL DATA - Sample Billing Plans
-- ===========================================================================

-- Insert sample billing plans (update with your Stripe Price IDs)
INSERT INTO billing_plans (
  stripe_price_id,
  stripe_product_id,
  name,
  description,
  price_amount,
  currency,
  interval,
  max_documents,
  max_storage_gb,
  max_api_calls_per_month,
  max_users,
  features,
  is_active,
  is_featured,
  sort_order
) VALUES
  -- Free Plan
  (
    'price_free',
    'prod_free',
    'Free',
    'Perfect for getting started',
    0,
    'usd',
    'month',
    100,
    1,
    1000,
    1,
    '{"search": true, "basic_analytics": true, "email_support": false}',
    true,
    false,
    1
  ),
  -- Starter Plan
  (
    'price_starter',
    'prod_starter',
    'Starter',
    'Great for small teams',
    2900,
    'usd',
    'month',
    1000,
    10,
    10000,
    5,
    '{"search": true, "basic_analytics": true, "advanced_analytics": false, "email_support": true, "api_access": true}',
    true,
    false,
    2
  ),
  -- Professional Plan
  (
    'price_professional',
    'prod_professional',
    'Professional',
    'For growing businesses',
    9900,
    'usd',
    'month',
    10000,
    100,
    100000,
    20,
    '{"search": true, "basic_analytics": true, "advanced_analytics": true, "email_support": true, "priority_support": true, "api_access": true, "webhooks": true, "custom_integrations": true}',
    true,
    true,
    3
  ),
  -- Enterprise Plan
  (
    'price_enterprise',
    'prod_enterprise',
    'Enterprise',
    'For large organizations',
    29900,
    'usd',
    'month',
    NULL, -- Unlimited
    NULL, -- Unlimited
    NULL, -- Unlimited
    NULL, -- Unlimited
    '{"search": true, "basic_analytics": true, "advanced_analytics": true, "email_support": true, "priority_support": true, "dedicated_support": true, "api_access": true, "webhooks": true, "custom_integrations": true, "sla": true, "custom_contracts": true}',
    true,
    false,
    4
  )
ON CONFLICT (stripe_price_id) DO NOTHING;

-- ===========================================================================
-- 12. VIEWS FOR ANALYTICS
-- ===========================================================================

-- View: Active Subscriptions with Plan Details
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT
  up.id,
  up.tenant_id,
  up.user_id,
  up.stripe_subscription_id,
  up.status,
  up.current_period_start,
  up.current_period_end,
  bp.name as plan_name,
  bp.price_amount,
  bp.currency,
  bp.interval,
  sc.email as customer_email
FROM user_products up
LEFT JOIN billing_plans bp ON up.plan_id = bp.id
LEFT JOIN stripe_customers sc ON up.stripe_customer_id = sc.stripe_customer_id
WHERE up.status IN ('active', 'trialing');

-- View: Monthly Recurring Revenue (MRR)
CREATE OR REPLACE VIEW monthly_recurring_revenue AS
SELECT
  COUNT(*) as active_subscriptions,
  SUM(CASE
    WHEN bp.interval = 'month' THEN bp.price_amount
    WHEN bp.interval = 'year' THEN bp.price_amount / 12
    ELSE 0
  END) as mrr_cents,
  bp.currency
FROM user_products up
JOIN billing_plans bp ON up.plan_id = bp.id
WHERE up.status IN ('active', 'trialing')
GROUP BY bp.currency;

-- View: Usage Summary with Limits
CREATE OR REPLACE VIEW tenant_usage_summary AS
SELECT
  t.id as tenant_id,
  t.name as tenant_name,
  tu.documents_count,
  tu.storage_bytes,
  tu.api_calls_count,
  bp.max_documents,
  bp.max_storage_gb,
  bp.max_api_calls_per_month,
  CASE
    WHEN bp.max_documents IS NOT NULL
    THEN ROUND((tu.documents_count::NUMERIC / bp.max_documents::NUMERIC) * 100, 2)
    ELSE 0
  END as documents_usage_percent,
  CASE
    WHEN bp.max_api_calls_per_month IS NOT NULL
    THEN ROUND((tu.api_calls_count::NUMERIC / bp.max_api_calls_per_month::NUMERIC) * 100, 2)
    ELSE 0
  END as api_calls_usage_percent
FROM tenants t
LEFT JOIN user_products up ON t.id = up.tenant_id AND up.status = 'active'
LEFT JOIN billing_plans bp ON up.plan_id = bp.id
LEFT JOIN tenant_usage tu ON t.id = tu.tenant_id
WHERE tu.period_end = (
  SELECT MAX(period_end)
  FROM tenant_usage
  WHERE tenant_id = t.id
);

-- Set views to use security_invoker mode
ALTER VIEW active_subscriptions SET (security_invoker = on);
ALTER VIEW monthly_recurring_revenue SET (security_invoker = on);
ALTER VIEW tenant_usage_summary SET (security_invoker = on);

-- ===========================================================================
-- END OF MIGRATION
-- ===========================================================================

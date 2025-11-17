-- Email Service Integration Migration
-- This migration adds tables for email tracking, preferences, and templates

-- =====================================================
-- 1. Email Tracking Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.email_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email_id TEXT, -- Resend email ID
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('welcome', 'invitation', 'password_reset', 'notification', 'usage_alert', 'billing', 'system_alert', 'marketing')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced', 'complained')),
  metadata JSONB,
  error TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for email tracking
CREATE INDEX idx_email_tracking_email_id ON public.email_tracking(email_id);
CREATE INDEX idx_email_tracking_recipient ON public.email_tracking(recipient);
CREATE INDEX idx_email_tracking_type ON public.email_tracking(type);
CREATE INDEX idx_email_tracking_status ON public.email_tracking(status);
CREATE INDEX idx_email_tracking_created_at ON public.email_tracking(created_at DESC);

-- Add RLS policies for email tracking
ALTER TABLE public.email_tracking ENABLE ROW LEVEL SECURITY;

-- Only admins can view all email tracking records
CREATE POLICY "Admins can view all email tracking"
  ON public.email_tracking
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Users can view their own email tracking records
CREATE POLICY "Users can view their own email tracking"
  ON public.email_tracking
  FOR SELECT
  USING (recipient = auth.email());

-- Service role can insert and update email tracking
CREATE POLICY "Service role can manage email tracking"
  ON public.email_tracking
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 2. Email Preferences Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.email_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notifications BOOLEAN DEFAULT true,
  marketing BOOLEAN DEFAULT true,
  usage_alerts BOOLEAN DEFAULT true,
  billing BOOLEAN DEFAULT true,
  system_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add indexes for email preferences
CREATE INDEX idx_email_preferences_user_id ON public.email_preferences(user_id);

-- Add RLS policies for email preferences
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view their own email preferences"
  ON public.email_preferences
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "Users can update their own email preferences"
  ON public.email_preferences
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own email preferences"
  ON public.email_preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can view all preferences
CREATE POLICY "Admins can view all email preferences"
  ON public.email_preferences
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================
-- 3. Email Templates Table (Optional - for template editor)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('welcome', 'invitation', 'password_reset', 'notification', 'usage_alert', 'billing', 'system_alert', 'marketing')),
  subject TEXT NOT NULL,
  html_template TEXT NOT NULL,
  variables JSONB, -- JSON array of required variables
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for email templates
CREATE INDEX idx_email_templates_name ON public.email_templates(name);
CREATE INDEX idx_email_templates_type ON public.email_templates(type);
CREATE INDEX idx_email_templates_is_active ON public.email_templates(is_active);

-- Add RLS policies for email templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view active templates
CREATE POLICY "Anyone can view active email templates"
  ON public.email_templates
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage templates
CREATE POLICY "Admins can manage email templates"
  ON public.email_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================
-- 4. Functions and Triggers
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_email_tracking_updated_at
  BEFORE UPDATE ON public.email_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_preferences_updated_at
  BEFORE UPDATE ON public.email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 5. Email Statistics View
-- =====================================================
CREATE OR REPLACE VIEW public.email_statistics AS
SELECT
  type,
  status,
  COUNT(*) as count,
  DATE_TRUNC('day', created_at) as date
FROM public.email_tracking
GROUP BY type, status, DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Grant access to email statistics view
GRANT SELECT ON public.email_statistics TO authenticated;

-- =====================================================
-- 6. Insert Default Email Templates
-- =====================================================
INSERT INTO public.email_templates (name, type, subject, html_template, variables, is_active) VALUES
  (
    'welcome_default',
    'welcome',
    'Welcome to {{tenantName}}!',
    '<!DOCTYPE html><html><body><h1>Welcome {{userName}}!</h1><p>We''re excited to have you on board.</p></body></html>',
    '["userName", "tenantName", "loginUrl"]'::jsonb,
    true
  ),
  (
    'invitation_default',
    'invitation',
    'You''ve been invited to join {{tenantName}}',
    '<!DOCTYPE html><html><body><h1>Team Invitation</h1><p>{{inviterName}} has invited you to join {{tenantName}}.</p></body></html>',
    '["inviterName", "tenantName", "role", "inviteUrl", "message"]'::jsonb,
    true
  ),
  (
    'password_reset_default',
    'password_reset',
    'Reset your password',
    '<!DOCTYPE html><html><body><h1>Reset Your Password</h1><p>Click the link to reset your password: {{resetUrl}}</p></body></html>',
    '["userName", "resetUrl", "expiresIn"]'::jsonb,
    true
  ),
  (
    'usage_alert_default',
    'usage_alert',
    '{{tenantName}}: {{quotaType}} quota at {{percentage}}%',
    '<!DOCTYPE html><html><body><h1>Usage Alert</h1><p>Your {{quotaType}} usage is at {{percentage}}%.</p></body></html>',
    '["tenantName", "quotaType", "percentage", "currentUsage", "limit"]'::jsonb,
    true
  )
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 7. Comments
-- =====================================================
COMMENT ON TABLE public.email_tracking IS 'Tracks all emails sent through the system';
COMMENT ON TABLE public.email_preferences IS 'User email notification preferences';
COMMENT ON TABLE public.email_templates IS 'Customizable email templates';
COMMENT ON COLUMN public.email_tracking.email_id IS 'Resend email ID for tracking delivery status';
COMMENT ON COLUMN public.email_tracking.metadata IS 'Additional metadata for the email (tenant_id, user_id, etc.)';
COMMENT ON COLUMN public.email_templates.variables IS 'JSON array of required template variables';

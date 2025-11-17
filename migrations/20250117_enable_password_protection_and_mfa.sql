-- Migration: Enable Password Protection and MFA
-- Issue: #23
-- Date: 2025-01-17
-- Description: Implements password strength requirements, HaveIBeenPwned integration, and MFA support

-- ============================================================================
-- 1. Password Security Settings
-- ============================================================================

-- Note: Password strength requirements and HaveIBeenPwned integration are
-- configured at the Supabase project level via Dashboard or CLI:
--
-- Via Dashboard:
--   1. Navigate to: Authentication → Policies
--   2. Enable password strength requirements:
--      ✓ Minimum password length: 8
--      ✓ Require special characters
--      ✓ Require numbers
--      ✓ Require uppercase letters
--   3. Enable "Check passwords against HaveIBeenPwned database"
--
-- Via CLI:
--   supabase projects update --project-ref YOUR_PROJECT_REF \
--     --auth-password-required-characters=special,number,uppercase

-- ============================================================================
-- 2. MFA Configuration
-- ============================================================================

-- Note: MFA options are configured at the Supabase project level via Dashboard:
--
-- Via Dashboard:
--   1. Navigate to: Authentication → Providers
--   2. Enable MFA options:
--      ✓ TOTP (Time-based One-Time Password)
--      ✓ Phone/SMS (optional)
--      ✓ WebAuthn/FIDO2 (optional)

-- The actual MFA enrollment is handled by Supabase Auth API:
-- - supabase.auth.mfa.enroll() - Enroll TOTP factor
-- - supabase.auth.mfa.challenge() - Create challenge
-- - supabase.auth.mfa.verify() - Verify code
-- - supabase.auth.mfa.unenroll() - Remove factor

-- ============================================================================
-- 3. Security Audit Log Table (Optional)
-- ============================================================================

-- Create table to track security-related events
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add comment
COMMENT ON TABLE public.security_audit_log IS 'Tracks security-related events like password changes, MFA enrollment, login attempts';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_tenant_id ON public.security_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON public.security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON public.security_audit_log(created_at DESC);

-- Enable RLS on security_audit_log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own audit logs
CREATE POLICY "Users can view their own security audit logs"
  ON public.security_audit_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy: Only service role can insert audit logs
CREATE POLICY "Service role can insert security audit logs"
  ON public.security_audit_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================================
-- 4. Helper Functions
-- ============================================================================

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_tenant_id UUID,
  p_event_type TEXT,
  p_event_details JSONB DEFAULT '{}'::jsonb,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Needs elevated privileges to insert into audit log
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    tenant_id,
    event_type,
    event_details,
    ip_address,
    user_agent,
    success
  )
  VALUES (
    p_user_id,
    p_tenant_id,
    p_event_type,
    p_event_details,
    p_ip_address,
    p_user_agent,
    p_success
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

COMMENT ON FUNCTION public.log_security_event IS 'Logs security-related events to the audit log';

-- ============================================================================
-- 5. Triggers for Automatic Logging
-- ============================================================================

-- Function to log password changes
CREATE OR REPLACE FUNCTION public.log_password_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get tenant_id for the user
  SELECT tenant_id INTO v_tenant_id
  FROM public.user_tenants
  WHERE user_id = NEW.id
  LIMIT 1;

  -- Log the password change event
  PERFORM public.log_security_event(
    NEW.id,
    v_tenant_id,
    'password_changed',
    jsonb_build_object(
      'timestamp', now()
    ),
    NULL,
    NULL,
    true
  );

  RETURN NEW;
END;
$$;

-- Create trigger for password changes
-- Note: This trigger is on auth.users which requires careful consideration
-- Uncomment if you have appropriate permissions and want automatic logging
-- DROP TRIGGER IF EXISTS trg_log_password_change ON auth.users;
-- CREATE TRIGGER trg_log_password_change
--   AFTER UPDATE OF encrypted_password ON auth.users
--   FOR EACH ROW
--   WHEN (OLD.encrypted_password IS DISTINCT FROM NEW.encrypted_password)
--   EXECUTE FUNCTION public.log_password_change();

-- ============================================================================
-- 6. Security Event Types Reference
-- ============================================================================

-- Common security event types:
-- - 'password_changed' - User changed their password
-- - 'mfa_enrolled' - User enrolled in MFA
-- - 'mfa_verified' - MFA factor was verified
-- - 'mfa_unenrolled' - MFA factor was removed
-- - 'recovery_codes_generated' - Recovery codes were generated
-- - 'recovery_code_used' - A recovery code was used
-- - 'login_success' - Successful login
-- - 'login_failed' - Failed login attempt
-- - 'session_created' - New session created
-- - 'session_terminated' - Session ended

-- ============================================================================
-- 7. Views for Security Monitoring
-- ============================================================================

-- View for recent security events
CREATE OR REPLACE VIEW public.recent_security_events AS
SELECT
  sal.id,
  sal.user_id,
  u.email as user_email,
  sal.tenant_id,
  t.name as tenant_name,
  sal.event_type,
  sal.event_details,
  sal.ip_address,
  sal.success,
  sal.created_at
FROM public.security_audit_log sal
LEFT JOIN auth.users u ON u.id = sal.user_id
LEFT JOIN public.tenants t ON t.id = sal.tenant_id
WHERE sal.created_at > now() - interval '30 days'
ORDER BY sal.created_at DESC;

-- Set view to use security invoker (respects RLS)
ALTER VIEW public.recent_security_events SET (security_invoker = on);

COMMENT ON VIEW public.recent_security_events IS 'Shows recent security events (last 30 days)';

-- View for failed security events
CREATE OR REPLACE VIEW public.failed_security_events AS
SELECT
  sal.id,
  sal.user_id,
  u.email as user_email,
  sal.tenant_id,
  sal.event_type,
  sal.event_details,
  sal.ip_address,
  sal.created_at
FROM public.security_audit_log sal
LEFT JOIN auth.users u ON u.id = sal.user_id
WHERE sal.success = false
  AND sal.created_at > now() - interval '7 days'
ORDER BY sal.created_at DESC;

-- Set view to use security invoker (respects RLS)
ALTER VIEW public.failed_security_events SET (security_invoker = on);

COMMENT ON VIEW public.failed_security_events IS 'Shows failed security events (last 7 days)';

-- ============================================================================
-- 8. Grant Permissions
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT ON public.security_audit_log TO authenticated;
GRANT SELECT ON public.recent_security_events TO authenticated;
GRANT SELECT ON public.failed_security_events TO authenticated;

-- Grant full access to service role
GRANT ALL ON public.security_audit_log TO service_role;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verification queries:
--
-- Check audit log table:
-- SELECT * FROM public.security_audit_log LIMIT 10;
--
-- Check recent events:
-- SELECT * FROM public.recent_security_events LIMIT 10;
--
-- Check failed events:
-- SELECT * FROM public.failed_security_events LIMIT 10;

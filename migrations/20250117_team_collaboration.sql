-- Migration: Team Collaboration & Invitation System
-- Issue: #30 - Team Collaboration & Invitation System
-- Date: 2025-01-17
-- Description: Creates tables and functions for team collaboration, invitations,
--              activity tracking, and notifications

-- ============================================================================
-- STEP 1: Create team_invitations table (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin', 'owner')),
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_invitations_tenant_id ON team_invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_expires_at ON team_invitations(expires_at);

-- Enable RLS
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view invitations for their tenants" ON team_invitations;
DROP POLICY IF EXISTS "Users can create invitations for their tenants" ON team_invitations;
DROP POLICY IF EXISTS "Users can update invitations for their tenants" ON team_invitations;
DROP POLICY IF EXISTS "Users can delete invitations for their tenants" ON team_invitations;
DROP POLICY IF EXISTS "Users can view invitations by token" ON team_invitations;

-- RLS Policies for team_invitations
CREATE POLICY "Users can view invitations for their tenants"
  ON team_invitations FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view invitations by token"
  ON team_invitations FOR SELECT
  TO authenticated
  USING (
    status = 'pending' AND expires_at > NOW()
  );

CREATE POLICY "Users can create invitations for their tenants"
  ON team_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Users can update invitations for their tenants"
  ON team_invitations FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Users can delete invitations for their tenants"
  ON team_invitations FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- ============================================================================
-- STEP 2: Create audit_logs table (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view audit logs for their tenants" ON audit_logs;
DROP POLICY IF EXISTS "Service role can insert audit logs" ON audit_logs;

-- RLS Policies for audit_logs
CREATE POLICY "Users can view audit logs for their tenants"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

-- Allow system to insert audit logs
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- STEP 3: Create notifications table
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can create notifications" ON notifications;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- STEP 4: Create notification preferences table
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_invitations BOOLEAN DEFAULT TRUE,
  email_team_changes BOOLEAN DEFAULT TRUE,
  email_activity BOOLEAN DEFAULT FALSE,
  in_app_invitations BOOLEAN DEFAULT TRUE,
  in_app_team_changes BOOLEAN DEFAULT TRUE,
  in_app_activity BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON notification_preferences;

-- RLS Policies
CREATE POLICY "Users can view their own preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- STEP 5: Create triggers for automatic audit logging
-- ============================================================================

-- Function to get current user ID from JWT
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log team changes
CREATE OR REPLACE FUNCTION log_team_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      tenant_id,
      user_id,
      action,
      resource_type,
      resource_id,
      new_values
    ) VALUES (
      NEW.tenant_id,
      current_user_id(),
      'INSERT',
      TG_TABLE_NAME,
      NEW.id,
      row_to_json(NEW)::jsonb
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (
      tenant_id,
      user_id,
      action,
      resource_type,
      resource_id,
      old_values,
      new_values
    ) VALUES (
      NEW.tenant_id,
      current_user_id(),
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      row_to_json(OLD)::jsonb,
      row_to_json(NEW)::jsonb
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      tenant_id,
      user_id,
      action,
      resource_type,
      resource_id,
      old_values
    ) VALUES (
      OLD.tenant_id,
      current_user_id(),
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      row_to_json(OLD)::jsonb
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_user_tenant_change ON user_tenants;
DROP TRIGGER IF EXISTS on_team_invitation_change ON team_invitations;

-- Create triggers for audit logging
CREATE TRIGGER on_user_tenant_change
  AFTER INSERT OR UPDATE OR DELETE ON user_tenants
  FOR EACH ROW EXECUTE FUNCTION log_team_activity();

CREATE TRIGGER on_team_invitation_change
  AFTER INSERT OR UPDATE OR DELETE ON team_invitations
  FOR EACH ROW EXECUTE FUNCTION log_team_activity();

-- ============================================================================
-- STEP 6: Create function to auto-expire invitations
-- ============================================================================

CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE team_invitations
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 7: Create function to accept invitation
-- ============================================================================

CREATE OR REPLACE FUNCTION accept_invitation(
  p_token TEXT,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_invitation team_invitations;
  v_result JSONB;
BEGIN
  -- Get invitation
  SELECT * INTO v_invitation
  FROM team_invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();

  -- Check if invitation exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired invitation'
    );
  END IF;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM user_tenants
    WHERE user_id = p_user_id
      AND tenant_id = v_invitation.tenant_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You are already a member of this team'
    );
  END IF;

  -- Add user to tenant
  INSERT INTO user_tenants (user_id, tenant_id, role)
  VALUES (p_user_id, v_invitation.tenant_id, v_invitation.role);

  -- Update invitation status
  UPDATE team_invitations
  SET status = 'accepted',
      accepted_by = p_user_id,
      accepted_at = NOW(),
      updated_at = NOW()
  WHERE id = v_invitation.id;

  -- Create notification for inviter
  IF v_invitation.invited_by IS NOT NULL THEN
    INSERT INTO notifications (
      tenant_id,
      user_id,
      title,
      body,
      type
    ) VALUES (
      v_invitation.tenant_id,
      v_invitation.invited_by,
      'Invitation Accepted',
      v_invitation.email || ' has accepted your team invitation',
      'success'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', v_invitation.tenant_id,
    'role', v_invitation.role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 8: Create updated_at trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_team_invitations_updated_at ON team_invitations;
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;

-- Create triggers for updated_at
CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON team_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- To verify the implementation, run:
-- SELECT * FROM team_invitations;
-- SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
-- SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;
-- SELECT * FROM notification_preferences;

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. Team invitations expire after 7 days by default
-- 2. Audit logs track all team member and invitation changes
-- 3. Notifications are created for key team events
-- 4. Users can configure their notification preferences
-- 5. The accept_invitation function handles the entire acceptance flow
-- 6. All tables have RLS enabled for security
-- 7. Indexes are created for optimal query performance

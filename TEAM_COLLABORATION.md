# Team Collaboration & Invitation System

## Overview

This document describes the complete team collaboration and invitation system implementation for the Supabase Admin Panel. The system provides secure team member management, email invitations, role-based access control, and comprehensive activity tracking.

## Features Implemented

### 1. Team Member Management
- View team members list with roles
- Change member roles (member, admin, owner)
- Remove team members
- Real-time role updates with visual feedback
- Secure RLS policies for access control

### 2. Email Invitations
- Send invitation emails via Resend
- Custom invitation messages
- Secure token generation
- 7-day expiration (configurable)
- Resend invitations
- Cancel pending invitations
- Copy invitation links to clipboard

### 3. Invitation Acceptance
- Beautiful invitation acceptance page
- Email verification
- Auto-join team on acceptance
- Redirect to login if not authenticated
- Status tracking (pending, accepted, declined, expired, cancelled)

### 4. Activity Feed
- Real-time activity tracking
- Team member join/leave events
- Role changes
- Invitation events
- Audit log viewer with filters
- Visual activity timeline

### 5. Notifications
- Database-backed notification system
- Notification preferences per user
- Email and in-app notification support
- Mark as read/unread functionality

## Database Schema

### Tables Created

#### `team_invitations`
```sql
- id: UUID (primary key)
- tenant_id: UUID (references tenants)
- email: TEXT
- role: TEXT (member, admin, owner)
- token: TEXT (unique, secure)
- status: TEXT (pending, accepted, declined, expired, cancelled)
- invited_by: UUID (references auth.users)
- accepted_by: UUID (references auth.users)
- message: TEXT (optional)
- expires_at: TIMESTAMP
- accepted_at: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `audit_logs`
```sql
- id: UUID (primary key)
- tenant_id: UUID (references tenants)
- user_id: UUID (references auth.users)
- action: TEXT (INSERT, UPDATE, DELETE)
- resource_type: TEXT
- resource_id: UUID
- old_values: JSONB
- new_values: JSONB
- ip_address: INET
- user_agent: TEXT
- created_at: TIMESTAMP
```

#### `notifications`
```sql
- id: UUID (primary key)
- tenant_id: UUID (references tenants)
- user_id: UUID (references auth.users)
- title: TEXT
- body: TEXT
- type: TEXT (info, success, warning, error)
- link: TEXT
- read: BOOLEAN
- created_at: TIMESTAMP
- read_at: TIMESTAMP
```

#### `notification_preferences`
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users, unique)
- email_invitations: BOOLEAN
- email_team_changes: BOOLEAN
- email_activity: BOOLEAN
- in_app_invitations: BOOLEAN
- in_app_team_changes: BOOLEAN
- in_app_activity: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Database Functions

#### `accept_invitation(p_token, p_user_id)`
Handles the complete invitation acceptance flow:
1. Validates invitation token and expiration
2. Checks for duplicate membership
3. Adds user to tenant with specified role
4. Updates invitation status
5. Creates notification for inviter
6. Returns success/error result

#### `log_team_activity()`
Trigger function that automatically logs all team-related changes:
- User tenant additions/removals/updates
- Team invitation events
- Captures old and new values
- Records user and timestamp

#### `expire_old_invitations()`
Utility function to mark expired invitations:
- Finds invitations past expiration date
- Updates status to 'expired'
- Can be run manually or via cron job

### Security (RLS Policies)

All tables have Row Level Security enabled with appropriate policies:

**team_invitations**
- Users can view invitations for their tenants
- Users can view invitations by token (for acceptance)
- Admins/owners can create invitations
- Admins/owners can update/delete invitations

**audit_logs**
- Users can view logs for their tenants
- Service role can insert logs

**notifications**
- Users can view their own notifications
- Users can update their own notifications
- Service role can create notifications

**notification_preferences**
- Users can view/update/insert their own preferences

## File Structure

```
src/
├── resources/
│   ├── team-invitations/
│   │   ├── InvitationList.tsx       # List and manage invitations
│   │   ├── InvitationCreate.tsx     # Create and send invitations
│   │   └── index.ts
│   ├── team-members/
│   │   ├── TeamMemberList.tsx       # View and manage team members
│   │   └── index.ts
│   └── activity-logs/
│       ├── ActivityFeed.tsx         # View team activity
│       └── index.ts
├── pages/
│   └── AcceptInvitation.tsx         # Invitation acceptance page
├── services/
│   └── email.ts                     # Email service with templates
└── utils/
    └── token.ts                     # Secure token generation

migrations/
└── 20250117_team_collaboration.sql  # Database schema and functions
```

## Email Integration

### Configuration

Set the following environment variables in `.env`:

```bash
VITE_RESEND_API_KEY=your_resend_api_key
VITE_EMAIL_FROM=noreply@yourdomain.com
```

### Email Templates

The system includes professionally designed HTML email templates:

1. **Invitation Email**
   - Gradient header design
   - Clear call-to-action button
   - Invitation details (tenant, role, message)
   - Expiration notice
   - Responsive design

2. **Notification Email**
   - Simple, clean design
   - Title and body content
   - Optional action link
   - Consistent branding

### Email Functions

```typescript
// Send invitation email
sendInvitationEmail({
  email: 'user@example.com',
  token: 'secure_token_here',
  inviterName: 'John Doe',
  tenantName: 'Acme Corp',
  role: 'admin',
  message: 'Welcome to the team!'
})

// Send notification email
sendNotificationEmail({
  email: 'user@example.com',
  title: 'Invitation Accepted',
  body: 'John Doe accepted your team invitation',
  link: '/team-members'
})
```

## Usage Guide

### For Admins/Owners

#### Inviting Team Members

1. Navigate to **Team Invitations** in the sidebar
2. Click **Create**
3. Enter the email address
4. Select the role (Member or Admin)
5. Add an optional message
6. Click **Send Invitation**

The system will:
- Generate a secure token
- Create the invitation in the database
- Send an email to the invitee
- Show success notification

#### Managing Invitations

From the Team Invitations list, you can:
- **Copy Link**: Copy invitation URL to clipboard
- **Resend**: Resend the invitation email
- **Cancel**: Cancel a pending invitation

#### Managing Team Members

1. Navigate to **Team Members** in the sidebar
2. View all current team members with their roles
3. **Change Role**: Update member's access level
4. **Remove**: Remove a member from the team

### For Invitees

1. Receive invitation email
2. Click "Accept Invitation" button (or copy link)
3. Sign in to existing account or create new one
4. Email must match invitation email
5. Accept invitation on the acceptance page
6. Redirected to dashboard with new tenant access

### Viewing Activity

1. Navigate to **Activity Feed** in the sidebar
2. View chronological list of team events
3. See who performed each action and when
4. Filter by action type or date range

## Security Considerations

### Token Security
- Tokens are generated using `crypto.getRandomValues()`
- 64-character hexadecimal tokens (256-bit entropy)
- One-time use tokens
- Automatic expiration after 7 days

### Access Control
- All operations protected by RLS policies
- Role-based permissions (member < admin < owner)
- Tenant isolation enforced at database level
- Email verification required for acceptance

### Audit Trail
- All team changes automatically logged
- Immutable audit logs
- Records who, what, when for all actions
- Can be used for compliance and security reviews

## API Reference

### Invitation Management

```typescript
// List invitations
dataProvider.getList('team_invitations', {
  pagination: { page: 1, perPage: 10 },
  sort: { field: 'created_at', order: 'DESC' },
  filter: { status: 'pending' }
})

// Create invitation
dataProvider.create('team_invitations', {
  data: {
    email: 'user@example.com',
    role: 'admin',
    message: 'Welcome!',
    token: generateSecureToken(64)
  }
})

// Update invitation status
dataProvider.update('team_invitations', {
  id: 'invitation_id',
  data: { status: 'cancelled' }
})
```

### Team Member Management

```typescript
// List team members
dataProvider.getList('user_tenants', {
  filter: { tenant_id: 'current_tenant_id' }
})

// Update member role
dataProvider.update('user_tenants', {
  id: 'user_tenant_id',
  data: { role: 'admin' }
})

// Remove member
dataProvider.delete('user_tenants', {
  id: 'user_tenant_id'
})
```

### Activity Logs

```typescript
// List activity logs
dataProvider.getList('audit_logs', {
  pagination: { page: 1, perPage: 50 },
  sort: { field: 'created_at', order: 'DESC' },
  filter: { resource_type: 'user_tenants' }
})
```

## Troubleshooting

### Email Not Sending

1. Check `VITE_RESEND_API_KEY` is set correctly
2. Verify Resend API key is active
3. Check browser console for errors
4. In development, emails are logged but might not send

### Invitation Link Not Working

1. Verify token in URL matches database
2. Check invitation hasn't expired
3. Ensure invitation status is 'pending'
4. Check RLS policies allow access

### Role Changes Not Saving

1. Verify user has admin/owner role
2. Check RLS policies on user_tenants
3. Ensure tenant_id matches current tenant
4. Check browser console for errors

## Future Enhancements

Potential improvements for future versions:

1. **Bulk Invitations**
   - Import CSV of email addresses
   - Send multiple invitations at once
   - Batch status updates

2. **Advanced Permissions**
   - Custom roles beyond member/admin/owner
   - Granular permissions per resource
   - Permission templates

3. **Team Settings**
   - Configurable invitation expiration
   - Custom email templates
   - Team size limits

4. **Enhanced Notifications**
   - Real-time in-app notifications
   - Notification center UI
   - Email digest options

5. **Analytics**
   - Team growth metrics
   - Invitation acceptance rates
   - Member activity dashboards

## Migration Instructions

To apply the team collaboration system to your database:

```bash
# Using Supabase CLI
supabase db push

# Or manually in SQL Editor
# Copy and paste the contents of:
migrations/20250117_team_collaboration.sql
```

## Testing

### Manual Testing Checklist

- [ ] Create invitation as admin
- [ ] Receive invitation email
- [ ] Accept invitation with matching email
- [ ] Verify member appears in team list
- [ ] Change member role
- [ ] Remove member
- [ ] Cancel pending invitation
- [ ] Resend invitation
- [ ] View activity feed
- [ ] Check audit logs capture events
- [ ] Test with expired invitation
- [ ] Test with invalid token
- [ ] Test permission boundaries

### Test Scenarios

1. **Happy Path**: Send invitation → receive email → accept → join team
2. **Email Mismatch**: Try to accept with different email → see error
3. **Expired Invitation**: Try to accept expired invitation → see error
4. **Cancelled Invitation**: Try to accept cancelled invitation → see error
5. **Permission Check**: Try to invite as member → blocked by RLS
6. **Duplicate Member**: Try to accept invitation for existing member → see error

## Support

For issues or questions:
1. Check this documentation
2. Review browser console for errors
3. Check Supabase logs for RLS policy issues
4. Verify email service configuration
5. Review audit logs for debugging

## License

This implementation is part of the Supabase Admin Panel project.

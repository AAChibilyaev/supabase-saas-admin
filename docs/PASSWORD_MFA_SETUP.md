# Password Protection & MFA Setup Guide

This guide provides step-by-step instructions for configuring password protection and multi-factor authentication (MFA) in Supabase Dashboard.

## Overview

Configuring strong password requirements and MFA is critical for securing user accounts and preventing unauthorized access.

## Prerequisites

- Access to Supabase Dashboard
- Admin permissions for the project
- (Optional) Twilio account for SMS MFA

---

## Step 1: Configure Password Protection

### 1.1 Navigate to Authentication Settings

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Policies** (or **Settings** → **Auth**)
3. Find the **Password** section

### 1.2 Enable Leaked Password Protection

1. Find **"Leaked Password Protection"** or **"HaveIBeenPwned Integration"**
2. Toggle it **ON**
3. This will check passwords against the HaveIBeenPwned database

### 1.3 Set Password Requirements

Configure the following settings:

- **Minimum Password Length**: Set to **12 characters** (recommended minimum)
- **Password Complexity**: Enable one or more of:
  - ✅ Require special characters
  - ✅ Require numbers
  - ✅ Require uppercase letters
  - ✅ Require lowercase letters

**Recommended Configuration:**
```
Minimum length: 12
Require: special characters, numbers, uppercase, lowercase
```

### 1.4 Save Changes

Click **Save** or **Update** to apply the password protection settings.

---

## Step 2: Configure Multi-Factor Authentication (MFA)

### 2.1 Navigate to MFA Settings

1. In Supabase Dashboard, go to **Authentication** → **MFA** (or **Providers** → **MFA**)
2. You should see options for different MFA methods

### 2.2 Enable TOTP (Time-based One-Time Password)

**TOTP is the recommended MFA method** as it doesn't require external services.

1. Find **TOTP** or **Authenticator App** option
2. Toggle **Enroll Enabled** to **ON**
3. Toggle **Verify Enabled** to **ON**
4. This allows users to use authenticator apps like:
   - Google Authenticator
   - Authy
   - Microsoft Authenticator
   - 1Password

### 2.3 (Optional) Enable SMS MFA

**Note:** SMS MFA requires Twilio configuration.

1. Find **SMS** or **Phone** MFA option
2. Configure Twilio settings:
   - **Account SID**: Your Twilio Account SID
   - **Auth Token**: Your Twilio Auth Token
   - **Message Service SID**: Your Twilio Messaging Service SID
3. Toggle **Enroll Enabled** to **ON**
4. Toggle **Verify Enabled** to **ON**

**Twilio Setup:**
- Sign up at [Twilio](https://www.twilio.com/)
- Get Account SID and Auth Token from dashboard
- Create a Messaging Service for SMS

### 2.4 (Optional) Enable Phone MFA

Similar to SMS but uses phone calls for verification.

1. Find **Phone** MFA option
2. Configure if needed
3. Toggle **Enroll Enabled** to **ON**
4. Toggle **Verify Enabled** to **ON**

### 2.5 Set MFA Grace Period

1. Find **MFA Grace Period** setting
2. Set appropriate grace period (e.g., 7 days)
3. This allows users to set up MFA after initial login

### 2.6 (Optional) Make MFA Mandatory for Admin Roles

For enhanced security, consider making MFA mandatory for admin/owner roles:

1. This may require custom logic in your application
2. Check user role and enforce MFA enrollment
3. Block access until MFA is set up

---

## Step 3: Verify Configuration

### 3.1 Test Password Requirements

1. Try creating a user with a weak password (e.g., "password123")
2. Verify it's rejected
3. Try with a strong password (e.g., "MyStr0ng!P@ssw0rd")
4. Verify it's accepted

### 3.2 Test MFA Setup

1. Create a test user account
2. Log in and navigate to account settings
3. Try setting up TOTP MFA
4. Verify QR code is displayed
5. Complete setup with authenticator app
6. Test login with MFA

### 3.3 Test MFA Login

1. Log out
2. Log in with username/password
3. Verify MFA prompt appears
4. Enter code from authenticator app
5. Verify successful login

---

## Step 4: Update Application Code (if needed)

### 4.1 Check Auth Provider

Verify your auth provider (`src/providers/authProvider.ts`) handles MFA:

```typescript
// MFA should be handled automatically by Supabase
// But you may want to add UI for MFA setup
```

### 4.2 Add MFA Setup UI (Optional)

Create components for users to:
- Enable MFA
- View MFA status
- Disable MFA (with re-authentication)

### 4.3 Handle MFA Errors

Ensure your error handling covers MFA-related errors:
- Invalid MFA code
- MFA not set up
- MFA required but not provided

---

## Configuration Checklist

- [ ] Leaked Password Protection enabled
- [ ] Minimum password length set to 12
- [ ] Password complexity requirements enabled
- [ ] TOTP MFA enabled (enroll + verify)
- [ ] SMS MFA configured (if using)
- [ ] Phone MFA configured (if using)
- [ ] MFA grace period set
- [ ] Tested password requirements
- [ ] Tested MFA setup flow
- [ ] Tested MFA login flow
- [ ] Application code updated (if needed)

---

## Security Best Practices

1. **Always use TOTP** - More secure than SMS
2. **Enforce strong passwords** - Minimum 12 characters with complexity
3. **Enable leaked password protection** - Prevents use of compromised passwords
4. **Set appropriate grace period** - Balance security and UX
5. **Consider mandatory MFA for admins** - Extra protection for privileged accounts
6. **Regular security audits** - Review MFA enrollment rates
7. **User education** - Guide users on setting up MFA

---

## Troubleshooting

### Password Requirements Not Working

- Check Supabase Dashboard settings are saved
- Verify settings are applied to correct project
- Clear browser cache and try again

### MFA Not Appearing

- Verify MFA is enabled in Dashboard
- Check user has proper permissions
- Verify auth provider supports MFA

### SMS MFA Not Sending

- Verify Twilio credentials are correct
- Check Twilio account has credits
- Verify phone number format is correct
- Check Twilio logs for errors

---

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase MFA Guide](https://supabase.com/docs/guides/auth/auth-mfa)
- [Password Security Best Practices](https://supabase.com/docs/guides/auth/password-security)
- [Twilio SMS Setup](https://www.twilio.com/docs/sms)

---

## Notes

- Password protection and MFA settings are configured per-project in Supabase
- Changes take effect immediately
- Users may need to re-authenticate after password policy changes
- MFA setup is user-initiated (unless enforced programmatically)

---

**Last Updated:** 2025-01-17
**Status:** Ready for implementation


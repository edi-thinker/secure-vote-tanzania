# Testing 2FA Changes

This file provides instructions for testing the updated 2FA implementation for the SecureVote Tanzania system.

## Changes Made

1. **Initial MFA State**: Admin and auditor accounts are now created with `mfaEnabled: false` to allow first login without requiring 2FA
2. **Documentation Updates**: Updated admin-auditor-testing.md and production-2fa-guide.md to reflect the new workflow
3. **Removed Test Code**: Removed test MFA code from the frontend and backend
4. **Added 2FA Settings**: Created new components for admin and auditor users to manage their 2FA settings

## Testing Steps

### 1. Recreate Admin and Auditor Accounts

If you want to test with fresh accounts:

```powershell
# Stop the server if it's running
cd e:\secure-vote\backend
npm run seed-admin-auditor
```

### 2. Test First-Time Login (No 2FA Required)

1. Start the servers:
   ```powershell
   # Terminal 1 - Backend
   cd e:\secure-vote\backend
   npm start
   
   # Terminal 2 - Frontend
   cd e:\secure-vote\frontend
   npm run dev
   ```

2. Log in as an admin:
   - Navigate to http://localhost:3000/auth/login
   - Enter admin credentials:
     - Email: admin@securevote.tz
     - Password: Admin@123
   - You should be redirected directly to the admin dashboard without 2FA verification

3. Log in as an auditor:
   - Navigate to http://localhost:3000/auth/login
   - Enter auditor credentials:
     - Email: auditor@securevote.tz
     - Password: Audit@123
   - You should be redirected directly to the auditor dashboard without 2FA verification

### 3. Test Setting Up 2FA

1. Navigate to Settings:
   - Click on "Settings" in the sidebar
   
2. Set up 2FA:
   - Click "Setup Two-Factor Authentication"
   - Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
   - Enter the verification code from your app
   - Click "Verify & Enable"
   - You should see a success message
   
3. Log out and log back in:
   - Click "Log Out"
   - Log in with your credentials
   - You should now be redirected to the 2FA verification page
   - Enter the code from your authenticator app
   - You should be redirected to the dashboard

### 4. Test Disabling 2FA

1. Navigate to Settings:
   - Click on "Settings" in the sidebar
   
2. Disable 2FA:
   - Click "Disable Two-Factor Authentication"
   - Enter the verification code from your authenticator app
   - Click "Disable 2FA"
   - You should see a success message
   
3. Log out and log back in:
   - Click "Log Out"
   - Log in with your credentials
   - You should now be redirected directly to the dashboard without 2FA verification

## Notes

- The changes maintain security while improving usability by allowing first login without 2FA
- After first login, it's highly recommended to set up 2FA immediately through the settings page
- All test MFA code has been removed from both frontend and backend

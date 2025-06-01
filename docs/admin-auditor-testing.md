# Admin and Auditor Testing Guide

This document provides instructions for setting up and testing admin and auditor accounts in the SecureVote Tanzania system.

## Creating Admin and Auditor Accounts

Admin and auditor accounts are not created through the regular registration process. Instead, they are created manually using a seed script.

### Step 1: Make sure MongoDB is running

Ensure your MongoDB server is running before proceeding:

```powershell
# Check if MongoDB is running (if installed as a service)
Get-Service -Name MongoDB
```

### Step 2: Run the seed script

Navigate to the backend directory and run the seed script:

```powershell
cd e:\secure-vote\backend
npm run seed-admin-auditor
```

This will create the following accounts:

#### Admin Account
- Email: admin@securevote.tz
- Password: Admin@123

#### Auditor Account
- Email: auditor@securevote.tz
- Password: Audit@123

## Testing Admin and Auditor Logins

Newly created admin and auditor accounts do NOT have 2FA enabled initially, allowing first-time login without requiring a verification code. However, setting up 2FA is highly recommended for security.

### First-Time Login

1. Log in with admin or auditor credentials (using the email and password created by the seed script)
2. You'll be redirected directly to the admin or auditor dashboard

### Setting Up 2FA

After logging in for the first time, you should set up 2FA to secure your account:

1. Navigate to Settings by clicking the Settings option in the sidebar
2. Click "Setup Two-Factor Authentication"
3. Scan the displayed QR code with your authenticator app (Google Authenticator, Authy, etc.)
4. Enter the verification code displayed in your authenticator app to complete the setup

### Using 2FA for Login (After Setup)

Once 2FA is set up:

1. Log in with admin or auditor credentials
2. When redirected to the 2FA verification page, open your authenticator app
3. Enter the 6-digit code displayed in your authenticator app
4. Submit the code to complete the login process

## Admin Interface Features

The admin interface allows you to:

1. View election statistics and overview
2. Manage candidates (add, edit, delete)
3. View voter information and verify voters
4. View system logs and activity

## Auditor Interface Features

The auditor interface allows you to:

1. Verify the integrity of the vote chain
2. View anonymized vote counts
3. Download integrity reports
4. Monitor system status
5. View system logs

## Security Considerations

1. 2FA is mandatory for admin and auditor accounts
2. Always change the default passwords before deploying to production
3. Use environment-specific JWT secrets for different environments
4. Store all secrets securely in environment variables

## Troubleshooting

### 2FA Verification Issues

If you encounter issues with 2FA verification:

1. Check that the system time on your server and device are accurate (TOTP tokens are time-sensitive)
2. Ensure that speakeasy is properly installed (`npm install speakeasy`)
3. If a user loses access to their authenticator app, an administrator can manually reset their 2FA in the database

### Account Creation Issues

If the seed script fails:

1. Check MongoDB connection settings in your `.env` file
2. Ensure there are no existing users with the same email addresses
3. Check the backend logs for specific error messages

## Development vs. Production

In production:

1. Only use authenticator apps for 2FA validation
2. Never share 2FA secrets in logs or responses
3. Consider implementing backup codes for recovery scenarios
4. Regularly audit 2FA activity logs

Always follow secure coding practices and avoid hardcoding secrets in your application code.

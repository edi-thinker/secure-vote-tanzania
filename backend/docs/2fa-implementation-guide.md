# Implementing 2FA with Speakeasy

Currently, our authentication system has a mock implementation of two-factor authentication. This guide outlines how to implement proper 2FA using the Speakeasy library.

## Prerequisites

- Speakeasy library (already installed in the project)
- QR code generation library for the frontend

## Implementation Steps

### 1. Update the User Model

The User model already has the necessary fields:
- `mfaEnabled` - boolean flag indicating whether 2FA is enabled
- `mfaSecret` - secret key used for generating and verifying TOTP codes

### 2. Generate Secret for Users

When an admin or auditor account is created or when enabling 2FA, generate a secret:

```javascript
const speakeasy = require('speakeasy');

// Generate a secret
const secret = speakeasy.generateSecret({
  name: 'SecureVote Tanzania', // Name in authenticator app
  length: 20,
});

// Save the secret to the user
user.mfaSecret = secret.base32;
user.mfaEnabled = true;
await user.save();

// The secret.otpauth_url can be used to generate a QR code
const otpauthUrl = secret.otpauth_url;
```

### 3. Generate QR Code in Frontend

Use a library like `qrcode` to generate a QR code from the `otpauthUrl`:

```javascript
const QRCode = require('qrcode');
const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);
// Display this QR code to the user
```

### 4. Verify TOTP Tokens

Replace the mock verification in `auth.routes.js` with actual verification:

```javascript
// In auth.routes.js, replace the mock verification:
const isValidToken = token === '123456'; // Mock validation

// With actual validation:
const isValidToken = speakeasy.totp.verify({
  secret: user.mfaSecret,
  encoding: 'base32',
  token: token,
  window: 1 // Allow 1 step skew (30 seconds)
});
```

### 5. Create 2FA Setup Endpoints

Add new endpoints for setting up 2FA:

#### Generate 2FA Secret

```javascript
router.post('/setup-2fa', protect, authorize('admin', 'auditor'), async (req, res) => {
  try {
    // Generate a secret
    const secret = speakeasy.generateSecret({
      name: `SecureVote Tanzania (${req.user.email})`,
      length: 20,
    });
    
    // Temporarily store secret in user session or return to frontend
    // In a real app, you'd store this temporarily until verified
    
    return res.status(200).json({
      success: true,
      data: {
        secret: secret.base32,
        otpauthUrl: secret.otpauth_url
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error setting up 2FA'
    });
  }
});
```

#### Verify and Enable 2FA

```javascript
router.post('/verify-setup-2fa', protect, authorize('admin', 'auditor'), async (req, res) => {
  try {
    const { token, secret } = req.body;
    
    // Verify the token matches the secret
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 1
    });
    
    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }
    
    // Save the secret to the user
    req.user.mfaSecret = secret;
    req.user.mfaEnabled = true;
    await req.user.save();
    
    await logActivity({
      level: 'INFO',
      message: '2FA setup completed',
      component: 'Authentication',
      action: '2FASetup',
      userId: req.user._id,
      userRole: req.user.role,
      ipAddress: req.ip
    });
    
    return res.status(200).json({
      success: true,
      message: '2FA enabled successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error enabling 2FA'
    });
  }
});
```

#### Disable 2FA

```javascript
router.post('/disable-2fa', protect, authorize('admin', 'auditor'), async (req, res) => {
  try {
    // Require current password for security
    const { password, token } = req.body;
    
    // Verify password
    const user = await User.findById(req.user._id).select('+password +mfaSecret');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Verify token one last time
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: token,
      window: 1
    });
    
    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }
    
    // Disable 2FA
    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    await user.save();
    
    await logActivity({
      level: 'WARNING',
      message: '2FA disabled',
      component: 'Authentication',
      action: '2FADisable',
      userId: user._id,
      userRole: user.role,
      ipAddress: req.ip
    });
    
    return res.status(200).json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error disabling 2FA'
    });
  }
});
```

### 6. Frontend Implementation

In the frontend, you'll need to:

1. Generate a QR code from the otpauth_url
2. Display it to the user during 2FA setup
3. Prompt for verification code
4. Submit the code back to the server

### 7. Handling Authentication Flow

Update the login flow to properly handle 2FA:

1. User provides email/password
2. If credentials are valid and 2FA is enabled, return `{ requireMFA: true, userId }`
3. Frontend redirects to 2FA verification page
4. User provides 2FA code
5. Backend verifies code and returns JWT token if valid

## Security Considerations

- Always store the MFA secret securely and never expose it in API responses after setup
- Implement rate limiting for 2FA verification attempts
- Log failed verification attempts
- Consider implementing backup codes for account recovery
- Use HTTPS for all API communications

## Testing

Test the following scenarios:
- Setting up 2FA with valid and invalid codes
- Logging in with 2FA enabled
- Verifying with correct and incorrect codes
- Disabling 2FA with valid credentials and codes
- Handling token generation window (30 seconds)

## Resources

- [Speakeasy Documentation](https://github.com/speakeasyjs/speakeasy)
- [TOTP RFC](https://datatracker.ietf.org/doc/html/rfc6238)
- [Google Authenticator](https://support.google.com/accounts/answer/1066447)

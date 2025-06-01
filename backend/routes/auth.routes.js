/**
 * Authentication routes
 * Implements UC-V1, UC-V2: Register and login voters
 * Implements UC-A1: Admin login
 * Implements UC-S1: Auditor login
 * Implements FR-002: System shall support login via JWT with hashed passwords
 * Implements FR-004: System shall support MFA for admin and auditors
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const User = require('../models/User');
const Voter = require('../models/Voter');
const { logActivity } = require('../utils/logger');
const { protect, authorize } = require('../middleware/auth');
const { verifyVoterCredentials } = require('../data/mockVoterRegistry');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register voter with NIN and Voter ID
 * @access  Public
 */
router.post('/register', [
  // Validate input fields
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain a number')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter'),
  body('nin')
    .trim()
    .notEmpty()
    .withMessage('NIN is required')
    .matches(/^[A-Za-z0-9]{20}$/)
    .withMessage('Please provide a valid 20-character NIN'),
  body('voterId')
    .trim()
    .notEmpty()
    .withMessage('Voter ID is required')
    .matches(/^[A-Za-z0-9]{10}$/)
    .withMessage('Please provide a valid 10-character Voter ID')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { name, email, password, nin, voterId } = req.body;

  try {
    // First, verify voter credentials against mock registry
    const verification = verifyVoterCredentials(nin, voterId, name);
    
    if (!verification.isValid) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }

    // Check if user email exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Check if NIN or Voter ID already exists
    let existingVoter = await Voter.findOne({ $or: [{ nin }, { voterId }] });
    if (existingVoter) {
      return res.status(400).json({
        success: false,
        message: 'NIN or Voter ID already registered'
      });
    }

    // Create user with voter role
    user = await User.create({
      name: verification.verifiedName, // Use verified name from registry
      email,
      password,
      role: 'voter'
    });

    // Create voter record
    const voter = await Voter.create({
      user: user._id,
      nin,
      voterId,
      // Since credentials are verified against registry, automatically set as verified
      verified: true,
      verifiedAt: new Date()
    });    // Log activity
    await logActivity({
      level: 'INFO',
      message: 'New voter registered and verified against registry',
      component: 'Authentication',
      action: 'Register',
      userId: user._id,
      userRole: 'voter',
      ipAddress: req.ip,
      metadata: {
        voterVerified: true,
        verificationSource: 'mockRegistry'
      }
    });

    // Create JWT token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      message: 'Voter registered and verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: true
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', [
  // Validate input fields
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Log login activity
    await logActivity({
      level: 'INFO',
      message: 'User logged in',
      component: 'Authentication',
      action: 'Login',
      userId: user._id,
      userRole: user.role,
      ipAddress: req.ip
    });

    // Check if user is admin or auditor and has MFA enabled
    if (['admin', 'auditor'].includes(user.role) && user.mfaEnabled) {
      // In a real system, we would send a challenge or request MFA token
      // For this implementation, we'll just inform the client MFA is required
      return res.status(200).json({
        success: true,
        requireMFA: true,
        role: user.role,
        userId: user._id
      });
    }

    // Update last login time
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Send JWT token
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route   POST /api/auth/verify-2fa
 * @desc    Verify 2FA token for admin/auditor login
 * @access  Public
 */
router.post('/verify-2fa', [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('token').notEmpty().withMessage('2FA token is required')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, token } = req.body;

  try {
    // Find user
    const user = await User.findById(userId).select('+mfaSecret');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.mfaEnabled || !user.mfaSecret) {
      return res.status(400).json({
        success: false,
        message: '2FA not enabled for this user'
      });
    }    // Validate the token with speakeasy
    // Only accept valid TOTP tokens
    const isValidToken = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: token,
      window: 1 // Allow a 1-step window to account for time drift
    });

    if (!isValidToken) {
      await logActivity({
        level: 'WARNING',
        message: 'Failed 2FA attempt',
        component: 'Authentication',
        action: '2FAVerify',
        userId: user._id,
        userRole: user.role,
        ipAddress: req.ip
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid 2FA token'
      });
    }

    // Log successful 2FA
    await logActivity({
      level: 'INFO',
      message: '2FA verification successful',
      component: 'Authentication',
      action: '2FAVerify',
      userId: user._id,
      userRole: user.role,
      ipAddress: req.ip
    });

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Send JWT token
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // If user is a voter, get voter details
    let voterDetails = null;
    if (user.role === 'voter') {
      voterDetails = await Voter.findOne({ user: user._id });
    }    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mfaEnabled: user.mfaEnabled || false,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        },
        voter: voterDetails
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Log user out / clear cookie
 * @access  Private
 */
router.post('/logout', protect, async (req, res) => {
  try {
    // In a JWT-based auth system, logout is mostly client-side 
    // But we can log the event server-side
    await logActivity({
      level: 'INFO',
      message: 'User logged out',
      component: 'Authentication',
      action: 'Logout',
      userId: req.user._id,
      userRole: req.user.role,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password (UC-V6)
 * @access  Public
 */
router.post('/reset-password', [
  body('email').isEmail().withMessage('Please include a valid email')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      // Security: Don't reveal if user exists or not
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
    }

    // In a real system, generate a password reset token and send email
    // For this implementation, we'll just log the event
    await logActivity({
      level: 'INFO',
      message: 'Password reset requested',
      component: 'Authentication',
      action: 'PasswordReset',
      userId: user._id,
      userRole: user.role,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route   POST /api/auth/setup-2fa
 * @desc    Generate 2FA secret for user
 * @access  Private (admin, auditor)
 */
router.post('/setup-2fa', protect, authorize('admin', 'auditor'), async (req, res) => {
  try {
    // Generate a new secret
    const speakeasy = require('speakeasy');
    const secret = speakeasy.generateSecret({
      name: `SecureVote Tanzania (${req.user.email})`,
      length: 20,
    });
    
    // Return the secret and otpauth URL (for QR code generation)
    res.status(200).json({
      success: true,
      data: {
        secret: secret.base32,
        otpauthUrl: secret.otpauth_url
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error setting up 2FA'
    });
  }
});

/**
 * @route   POST /api/auth/verify-setup-2fa
 * @desc    Verify and enable 2FA for user
 * @access  Private (admin, auditor)
 */
router.post('/verify-setup-2fa', protect, authorize('admin', 'auditor'), async (req, res) => {
  try {
    const { token, secret } = req.body;
    
    if (!token || !secret) {
      return res.status(400).json({
        success: false,
        message: 'Token and secret are required'
      });
    }
    
    // Verify the token matches the secret
    const speakeasy = require('speakeasy');
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 1 // Allow 1 step variance (30 seconds)
    });
    
    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }
    
    // Save the secret to the user
    const user = await User.findById(req.user._id);
    user.mfaSecret = secret;
    user.mfaEnabled = true;
    await user.save();
    
    // Log the activity
    await logActivity({
      level: 'INFO',
      message: '2FA setup completed',
      component: 'Authentication',
      action: '2FASetup',
      userId: req.user._id,
      userRole: req.user.role,
      ipAddress: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: '2FA enabled successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error enabling 2FA'
    });
  }
});

/**
 * @route   POST /api/auth/disable-2fa
 * @desc    Disable 2FA for user
 * @access  Private (admin, auditor)
 */
router.post('/disable-2fa', protect, authorize('admin', 'auditor'), async (req, res) => {
  try {
    // Require current token for security (no password needed as the user is already authenticated)
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Current 2FA token is required'
      });
    }
    
    // Get user with MFA secret
    const user = await User.findById(req.user._id).select('+mfaSecret');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify token one last time
    const speakeasy = require('speakeasy');
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
    
    // Log the activity
    await logActivity({
      level: 'WARNING',
      message: '2FA disabled',
      component: 'Authentication',
      action: '2FADisable',
      userId: user._id,
      userRole: user.role,
      ipAddress: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error disabling 2FA'
    });
  }
});

/**
 * Helper function to send JWT token response
 */
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  // Use secure cookies in production
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      mfaEnabled: user.mfaEnabled || false
    }
  });
};

module.exports = router;

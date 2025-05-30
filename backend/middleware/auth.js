/**
 * Authentication middleware
 * Verifies JWT tokens and enforces role-based access control (RBAC)
 * Implements FR-003: System shall enforce RBAC for voters, admins, and auditors
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SystemLog = require('../models/SystemLog');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }
  // If no token found, return unauthorized
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from the token
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add user to request
    req.user = user;
    
    // Log access
    await SystemLog.create({
      level: 'INFO',
      message: `User accessed ${req.originalUrl}`,
      component: 'Authentication',
      action: 'Access',
      userId: user._id,
      userRole: user.role,
      ipAddress: req.ip,
      metadata: { 
        method: req.method, 
        url: req.originalUrl 
      }
    });
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if 2FA is required and validated for admin and auditors
exports.require2FA = async (req, res, next) => {
  if (['admin', 'auditor'].includes(req.user.role) && req.user.mfaEnabled) {
    // Get token from headers
    const mfaToken = req.headers['x-mfa-token'];
    
    if (!mfaToken) {
      return res.status(401).json({
        success: false,
        message: '2FA required for this account. Please provide MFA token.'
      });
    }

    try {
      // Verify MFA token using user's secret
      const user = await User.findById(req.user._id).select('+mfaSecret');
      
      // Validate MFA token (implementation using speakeasy would be here)
      const validated = true; // Replace with actual validation logic
      
      if (!validated) {
        return res.status(401).json({
          success: false,
          message: 'Invalid 2FA token'
        });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error validating 2FA token'
      });
    }
  } else {
    // No 2FA required, proceed
    next();
  }
};

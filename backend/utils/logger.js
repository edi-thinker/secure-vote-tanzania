/**
 * Logger utility
 * Provides centralized logging functionality
 * Implements FR-SW002: The system shall log all privileged actions
 */

const SystemLog = require('../models/SystemLog');

/**
 * Logs system events and user actions
 * @param {Object} options - Log options
 * @param {String} options.level - Log level (INFO, WARNING, ERROR, CRITICAL)
 * @param {String} options.message - Log message
 * @param {String} options.component - System component generating the log
 * @param {String} options.action - Action being performed
 * @param {String} options.userId - User ID (if applicable)
 * @param {String} options.userRole - User role
 * @param {String} options.ipAddress - User IP address
 * @param {Object} options.metadata - Additional metadata for the log
 */
const logActivity = async (options) => {
  try {
    const {
      level = 'INFO',
      message,
      component,
      action,
      userId = null,
      userRole = 'system',
      ipAddress = null,
      metadata = {}
    } = options;

    await SystemLog.create({
      level,
      message,
      component,
      action,
      userId,
      userRole,
      ipAddress,
      metadata,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Logging failed:', error);
  }
};

module.exports = { logActivity };

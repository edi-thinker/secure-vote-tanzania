/**
 * SystemLog model for audit logging and system event tracking
 * Implements FR-SW002: The system shall log all privileged actions
 * Supports UC-A7: Admin views activity logs
 * Supports UC-S4: Auditor views system logs
 */

const mongoose = require('mongoose');

const SystemLogSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'],
    default: 'INFO'
  },
  message: {
    type: String,
    required: true
  },
  component: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null  // Some system events may not be associated with a user
  },
  userRole: {
    type: String,
    enum: ['system', 'voter', 'admin', 'auditor'],
    default: 'system'
  },
  ipAddress: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    immutable: true
  }
});

// Index for fast querying by component, action, level and timestamp
SystemLogSchema.index({ component: 1, action: 1, level: 1, timestamp: -1 });

// Make logs immutable - once created, they cannot be modified
SystemLogSchema.set('strict', true);

// Prevent normal update/delete operations on logs
SystemLogSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], function(next) {
  const error = new Error('System logs cannot be modified');
  next(error);
});

SystemLogSchema.pre(['remove', 'deleteOne', 'findOneAndDelete', 'deleteMany'], function(next) {
  const error = new Error('System logs cannot be deleted');
  next(error);
});

module.exports = mongoose.model('SystemLog', SystemLogSchema);

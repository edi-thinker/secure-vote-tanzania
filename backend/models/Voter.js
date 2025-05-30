/**
 * Voter model extends the User model with Tanzania-specific voter information
 * Implements FR-001: System shall require voter registration using valid NIN and Voter ID
 * Implements FR-V001: Voter shall be able to register using NIN, Voter ID, name, email, and password
 */

const mongoose = require('mongoose');

const VoterSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nin: {
    type: String,
    required: [true, 'Please add a National Identification Number'],
    unique: true,
    trim: true,
    // NIN format validation can be added here based on Tanzania's format
    match: [
      /^[A-Za-z0-9]{20}$/,
      'Please provide a valid 20-character NIN'
    ]
  },
  voterId: {
    type: String,
    required: [true, 'Please add a Voter ID'],
    unique: true,
    trim: true,
    // Voter ID format validation can be added here based on Tanzania's format
    match: [
      /^[A-Za-z0-9]{10}$/,
      'Please provide a valid 10-character Voter ID'
    ]
  },
  hasVoted: {
    type: Boolean,
    default: false
  },
  votedAt: {
    type: Date,
    default: null
  },
  voteConfirmationId: {
    type: String,
    default: null
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date,
    default: null
  }
});

// Create compound index to ensure unique combination of nin and voterId
VoterSchema.index({ nin: 1, voterId: 1 }, { unique: true });

module.exports = mongoose.model('Voter', VoterSchema);

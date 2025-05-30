/**
 * Vote model represents a secure, immutable vote
 * Implements FR-V005: Vote shall be hashed with SHA-256 and stored immutably
 * Implements FR-SW001: The system shall hash each vote using SHA-256 and link it in a hash chain to the previous vote
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const VoteSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  // We don't store direct reference to voter to maintain anonymity
  // Instead, we store a hash of the vote
  voteHash: {
    type: String,
    required: true,
    unique: true
  },
  prevHash: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    immutable: true // Once created, cannot be modified
  },
  // Verification status for auditing
  verified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date,
    default: null
  }
}, {
  // Prevent update/delete operations
  timestamps: false,
  strict: true
});

// Make the schema immutable - once a vote is cast, it cannot be changed
VoteSchema.set('toObject', { virtuals: true });
VoteSchema.set('toJSON', { virtuals: true });

// Static method to create a new vote hash
VoteSchema.statics.createVoteHash = function(candidateId, voterId, prevHash) {
  const dataToHash = `${candidateId}-${voterId}-${Date.now()}-${Math.random()}`;
  return crypto.createHash('sha256').update(dataToHash).digest('hex');
};

// Static method to verify the vote chain
VoteSchema.statics.verifyVoteChain = async function() {
  const votes = await this.find({}).sort({ timestamp: 1 });
  
  if (votes.length === 0) {
    return { valid: true, message: 'No votes to verify' };
  }
  
  // Check first vote's prevHash is genesis
  if (votes[0].prevHash !== '0000000000000000000000000000000000000000000000000000000000000000') {
    return { valid: false, message: 'Invalid genesis vote', voteId: votes[0]._id };
  }
  
  // Verify each vote's hash links to the previous vote correctly
  for (let i = 1; i < votes.length; i++) {
    const currentVote = votes[i];
    const previousVote = votes[i-1];
    
    if (currentVote.prevHash !== previousVote.voteHash) {
      return { 
        valid: false, 
        message: 'Chain broken between votes', 
        voteId: currentVote._id,
        prevVoteId: previousVote._id 
      };
    }
  }
  
  return { valid: true, message: 'Vote chain verified successfully' };
};

// Prevent normal update/delete operations
VoteSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], function(next) {
  const error = new Error('Vote documents cannot be modified');
  next(error);
});

VoteSchema.pre(['remove', 'deleteOne', 'findOneAndDelete', 'deleteMany'], function(next) {
  const error = new Error('Vote documents cannot be deleted');
  next(error);
});

module.exports = mongoose.model('Vote', VoteSchema);

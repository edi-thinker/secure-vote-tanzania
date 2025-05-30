/**
 * Vote chain utility
 * Handles the creation and validation of the vote hash chain
 * Implements FR-SW001: The system shall hash each vote using SHA-256 and link it in a hash chain to the previous vote
 */

const crypto = require('crypto');
const Vote = require('../models/Vote');
const { logActivity } = require('./logger');

// Genesis hash for the first vote in the chain
const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Create a vote hash
 * @param {String} candidateId - The ID of the candidate voted for
 * @param {String} voterId - The ID of the voter (for hash generation only, not stored)
 * @param {String} prevHash - The hash of the previous vote in the chain
 * @returns {String} The SHA-256 hash of the vote
 */
const createVoteHash = (candidateId, voterId, prevHash) => {
  const timestamp = Date.now();
  const randomSalt = crypto.randomBytes(16).toString('hex');
  // Combine all data to create a unique hash
  const dataToHash = `${candidateId}-${voterId}-${timestamp}-${randomSalt}-${prevHash}`;
  return crypto.createHash('sha256').update(dataToHash).digest('hex');
};

/**
 * Get the latest vote hash from the chain
 * @returns {String} The hash of the most recent vote, or genesis hash if none exists
 */
const getLatestVoteHash = async () => {
  try {
    // Get the most recent vote
    const latestVote = await Vote.findOne().sort({ timestamp: -1 });
    
    if (!latestVote) {
      return GENESIS_HASH;
    }
    
    return latestVote.voteHash;
  } catch (error) {
    console.error('Error getting latest vote hash:', error);
    throw error;
  }
};

/**
 * Verify the integrity of the entire vote chain
 * @returns {Object} Result of verification with valid flag and message
 */
const verifyVoteChain = async () => {
  try {
    const votes = await Vote.find({}).sort({ timestamp: 1 });
    
    if (votes.length === 0) {
      return { valid: true, message: 'No votes to verify', verified: 0 };
    }
    
    // Check first vote's prevHash is genesis
    if (votes[0].prevHash !== GENESIS_HASH) {
      await logActivity({
        level: 'CRITICAL',
        message: 'Vote chain integrity breach: Invalid genesis vote',
        component: 'VoteChain',
        action: 'IntegrityCheck',
        metadata: { voteId: votes[0]._id }
      });
      
      return { 
        valid: false, 
        message: 'Invalid genesis vote', 
        voteId: votes[0]._id,
        verified: 0
      };
    }
    
    let verifiedCount = 1;
    // Verify each vote's hash links to the previous vote correctly
    for (let i = 1; i < votes.length; i++) {
      const currentVote = votes[i];
      const previousVote = votes[i-1];
      
      if (currentVote.prevHash !== previousVote.voteHash) {
        await logActivity({
          level: 'CRITICAL',
          message: 'Vote chain integrity breach: Chain broken between votes',
          component: 'VoteChain',
          action: 'IntegrityCheck',
          metadata: { 
            voteId: currentVote._id,
            prevVoteId: previousVote._id 
          }
        });
        
        return { 
          valid: false, 
          message: 'Chain broken between votes', 
          voteId: currentVote._id,
          prevVoteId: previousVote._id,
          verified: verifiedCount
        };
      }
      
      verifiedCount++;
    }
    
    await logActivity({
      level: 'INFO',
      message: 'Vote chain integrity verified successfully',
      component: 'VoteChain',
      action: 'IntegrityCheck',
      metadata: { totalVotes: votes.length }
    });
    
    return { 
      valid: true, 
      message: 'Vote chain verified successfully', 
      verified: verifiedCount,
      totalVotes: votes.length
    };
  } catch (error) {
    console.error('Error verifying vote chain:', error);
    throw error;
  }
};

module.exports = {
  createVoteHash,
  getLatestVoteHash,
  verifyVoteChain,
  GENESIS_HASH
};

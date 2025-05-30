/**
 * Vote security middleware
 * Enforces voting security constraints
 * Implements FR-V004: Voter shall be allowed to vote only once
 * Implements FR-SW003: The system shall reject votes that originate from unverified NIN/Voter IDs
 */

const Voter = require('../models/Voter');
const SystemLog = require('../models/SystemLog');

// Check if voter is eligible to vote
exports.checkVotingEligibility = async (req, res, next) => {
  try {
    // Only applies to voter role
    if (req.user.role !== 'voter') {
      return next();
    }

    // Get voter details
    const voter = await Voter.findOne({ user: req.user._id });
    
    if (!voter) {
      return res.status(403).json({
        success: false,
        message: 'Voter record not found'
      });
    }

    // Check if voter is verified
    if (!voter.verified) {
      await SystemLog.create({
        level: 'WARNING',
        message: 'Unverified voter attempted to vote',
        component: 'VoteSecurity',
        action: 'VoteAttempt',
        userId: req.user._id,
        userRole: 'voter',
        ipAddress: req.ip
      });
      
      return res.status(403).json({
        success: false,
        message: 'Your voter credentials have not been verified yet'
      });
    }

    // Check if voter has already voted
    if (voter.hasVoted) {
      await SystemLog.create({
        level: 'WARNING',
        message: 'Voter attempted to vote multiple times',
        component: 'VoteSecurity',
        action: 'DuplicateVoteAttempt',
        userId: req.user._id,
        userRole: 'voter',
        ipAddress: req.ip
      });
      
      return res.status(403).json({
        success: false,
        message: 'You have already cast your vote'
      });
    }

    // Add voter to request for later use
    req.voter = voter;
    next();
  } catch (error) {
    next(error);
  }
};

// Prevent modification of votes after election starts
exports.preventVoteModification = async (req, res, next) => {
  // Check if election is active or completed
  // This would typically check against an Election model or config
  // For now, we'll just use a simple check
  
  const electionActive = true; // This would be dynamically determined
  
  if (electionActive && 
      ['DELETE', 'PUT', 'PATCH'].includes(req.method) && 
      req.path.includes('/api/admin/candidates')) {
    
    await SystemLog.create({
      level: 'WARNING',
      message: 'Attempted to modify candidates during active election',
      component: 'VoteSecurity',
      action: 'UnauthorizedModification',
      userId: req.user._id,
      userRole: req.user.role,
      ipAddress: req.ip
    });
    
    return res.status(403).json({
      success: false,
      message: 'Cannot modify candidates while election is active'
    });
  }
  
  next();
};

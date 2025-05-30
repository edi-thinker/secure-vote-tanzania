/**
 * Voter routes
 * Implements UC-V3: View Candidates
 * Implements UC-V4: Cast Vote
 * Implements UC-V5: View Vote Confirmation
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { protect, authorize } = require('../middleware/auth');
const { checkVotingEligibility } = require('../middleware/voteSecurity');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const Voter = require('../models/Voter');
const { logActivity } = require('../utils/logger');
const { createVoteHash, getLatestVoteHash, GENESIS_HASH } = require('../utils/voteChain');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);
router.use(authorize('voter'));

/**
 * @route   GET /api/voter/candidates
 * @desc    Get all candidates for voting
 * @access  Private (Voter)
 */
router.get('/candidates', async (req, res) => {
  try {
    const candidates = await Candidate.find().select('name party description photo');

    await logActivity({
      level: 'INFO',
      message: 'Voter viewed candidates',
      component: 'Voter',
      action: 'ViewCandidates',
      userId: req.user._id,
      userRole: 'voter',
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
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
 * @route   POST /api/voter/vote
 * @desc    Cast a vote for a candidate
 * @access  Private (Voter)
 */
router.post('/vote', [
  // Validate input
  body('candidateId').isMongoId().withMessage('Valid candidate ID is required')
], checkVotingEligibility, async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { candidateId } = req.body;

  // Start a MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Verify candidate exists
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Get the voter record - it's already verified in middleware
    const voter = req.voter;

    // Get the previous vote hash
    const prevHash = await getLatestVoteHash();

    // Create the vote hash
    const voteHash = createVoteHash(candidateId, voter._id.toString(), prevHash);

    // Create vote record
    const vote = await Vote.create([{
      candidateId,
      voteHash,
      prevHash,
      timestamp: Date.now(),
      verified: false
    }], { session });

    // Update voter record to mark as voted
    voter.hasVoted = true;
    voter.votedAt = Date.now();
    voter.voteConfirmationId = vote[0]._id;
    await voter.save({ session });

    // Log the vote
    await logActivity({
      level: 'INFO',
      message: 'Vote cast successfully',
      component: 'Voter',
      action: 'CastVote',
      userId: req.user._id,
      userRole: 'voter',
      ipAddress: req.ip,
      metadata: {
        voteId: vote[0]._id,
        timestamp: vote[0].timestamp
      }
    });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Vote cast successfully',
      data: {
        confirmationId: vote[0]._id,
        timestamp: vote[0].timestamp
      }
    });
  } catch (error) {
    // Abort the transaction on error
    await session.abortTransaction();
    session.endSession();
    
    console.error('Vote error:', error);
    res.status(500).json({
      success: false,
      message: 'Error casting vote. Please try again.'
    });
  }
});

/**
 * @route   GET /api/voter/confirmation
 * @desc    Get vote confirmation details
 * @access  Private (Voter)
 */
router.get('/confirmation', async (req, res) => {
  try {
    // Get voter record
    const voter = await Voter.findOne({ user: req.user._id });
    
    if (!voter) {
      return res.status(404).json({
        success: false,
        message: 'Voter record not found'
      });
    }

    if (!voter.hasVoted) {
      return res.status(404).json({
        success: false,
        message: 'No vote found'
      });
    }

    await logActivity({
      level: 'INFO',
      message: 'Voter viewed vote confirmation',
      component: 'Voter',
      action: 'ViewConfirmation',
      userId: req.user._id,
      userRole: 'voter',
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        hasVoted: voter.hasVoted,
        votedAt: voter.votedAt,
        confirmationId: voter.voteConfirmationId
        // Note: Not returning vote content for security
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
 * @route   GET /api/voter/profile
 * @desc    Get voter profile details
 * @access  Private (Voter)
 */
router.get('/profile', async (req, res) => {
  try {
    // Get voter record with user details
    const voter = await Voter.findOne({ user: req.user._id });
    
    if (!voter) {
      return res.status(404).json({
        success: false,
        message: 'Voter record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        name: req.user.name,
        email: req.user.email,
        verified: voter.verified,
        hasVoted: voter.hasVoted,
        votedAt: voter.votedAt,
        // Last 4 characters of NIN and Voter ID for reference
        nin: `xxxxxxxxxxxxxx${voter.nin.slice(-6)}`,
        voterId: `xxxxxx${voter.voterId.slice(-4)}`
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

module.exports = router;

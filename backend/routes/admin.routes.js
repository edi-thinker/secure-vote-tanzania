/**
 * Admin routes
 * Implements UC-A2: Add Candidate
 * Implements UC-A3: Edit Candidate
 * Implements UC-A4: Delete Candidate
 * Implements UC-A5: View Candidate List
 * Implements UC-A6: View Voting Statistics
 * Implements UC-A7: View Admin Logs
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, authorize, require2FA } = require('../middleware/auth');
const { preventVoteModification } = require('../middleware/voteSecurity');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const Voter = require('../models/Voter');
const SystemLog = require('../models/SystemLog');
const { logActivity } = require('../utils/logger');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);
router.use(authorize('admin'));
router.use(require2FA);

/**
 * @route   GET /api/admin/candidates
 * @desc    Get all candidates
 * @access  Private (Admin)
 */
router.get('/candidates', async (req, res) => {
  try {
    const candidates = await Candidate.find();

    await logActivity({
      level: 'INFO',
      message: 'Admin viewed candidates list',
      component: 'Admin',
      action: 'ViewCandidates',
      userId: req.user._id,
      userRole: 'admin',
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
 * @route   POST /api/admin/candidates
 * @desc    Add a new candidate
 * @access  Private (Admin)
 */
router.post('/candidates', [
  // Validate input
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('party').trim().notEmpty().withMessage('Party name is required'),
  body('description').trim().notEmpty().withMessage('Description is required')
], preventVoteModification, async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Add admin as creator of the candidate
    req.body.createdBy = req.user._id;

    const candidate = await Candidate.create(req.body);

    await logActivity({
      level: 'INFO',
      message: 'Admin added new candidate',
      component: 'Admin',
      action: 'AddCandidate',
      userId: req.user._id,
      userRole: 'admin',
      ipAddress: req.ip,
      metadata: {
        candidateId: candidate._id,
        candidateName: candidate.name
      }
    });

    res.status(201).json({
      success: true,
      data: candidate
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
 * @route   PUT /api/admin/candidates/:id
 * @desc    Update a candidate
 * @access  Private (Admin)
 */
router.put('/candidates/:id', [
  // Validate input
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('party').trim().notEmpty().withMessage('Party name is required'),
  body('description').trim().notEmpty().withMessage('Description is required')
], preventVoteModification, async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Update candidate with new data
    candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    await logActivity({
      level: 'INFO',
      message: 'Admin updated candidate',
      component: 'Admin',
      action: 'UpdateCandidate',
      userId: req.user._id,
      userRole: 'admin',
      ipAddress: req.ip,
      metadata: {
        candidateId: candidate._id,
        candidateName: candidate.name
      }
    });

    res.status(200).json({
      success: true,
      data: candidate
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
 * @route   DELETE /api/admin/candidates/:id
 * @desc    Delete a candidate
 * @access  Private (Admin)
 */
router.delete('/candidates/:id', preventVoteModification, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Check if any votes exist for this candidate
    const voteCount = await Vote.countDocuments({ candidateId: req.params.id });
    
    if (voteCount > 0) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete candidate with existing votes'
      });
    }

    await Candidate.findByIdAndDelete(req.params.id);

    await logActivity({
      level: 'WARNING',
      message: 'Admin deleted candidate',
      component: 'Admin',
      action: 'DeleteCandidate',
      userId: req.user._id,
      userRole: 'admin',
      ipAddress: req.ip,
      metadata: {
        candidateId: candidate._id,
        candidateName: candidate.name
      }
    });

    res.status(200).json({
      success: true,
      message: 'Candidate deleted'
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
 * @route   GET /api/admin/statistics
 * @desc    Get voting statistics
 * @access  Private (Admin)
 */
router.get('/statistics', async (req, res) => {
  try {
    // Get total registered voters
    const totalVoters = await Voter.countDocuments();
    
    // Get total votes cast
    const totalVotes = await Vote.countDocuments();
    
    // Get votes per candidate (aggregation)
    const votesPerCandidate = await Vote.aggregate([
      {
        $group: {
          _id: '$candidateId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'candidates',
          localField: '_id',
          foreignField: '_id',
          as: 'candidate'
        }
      },
      {
        $unwind: '$candidate'
      },
      {
        $project: {
          _id: 1,
          count: 1,
          name: '$candidate.name',
          party: '$candidate.party'
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    await logActivity({
      level: 'INFO',
      message: 'Admin viewed voting statistics',
      component: 'Admin',
      action: 'ViewStatistics',
      userId: req.user._id,
      userRole: 'admin',
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        totalRegisteredVoters: totalVoters,
        totalVotesCast: totalVotes,
        votingPercentage: totalVoters > 0 ? (totalVotes / totalVoters) * 100 : 0,
        votesPerCandidate
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
 * @route   GET /api/admin/logs
 * @desc    Get system logs (for admin only)
 * @access  Private (Admin)
 */
router.get('/logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    // Optional filters
    const filterOptions = {};
    
    if (req.query.level) {
      filterOptions.level = req.query.level;
    }
    
    if (req.query.component) {
      filterOptions.component = req.query.component;
    }
    
    if (req.query.action) {
      filterOptions.action = req.query.action;
    }

    // Get logs with pagination
    const logs = await SystemLog.find(filterOptions)
      .sort({ timestamp: -1 })
      .skip(startIndex)
      .limit(limit);
    
    const totalLogs = await SystemLog.countDocuments(filterOptions);

    await logActivity({
      level: 'INFO',
      message: 'Admin viewed system logs',
      component: 'Admin',
      action: 'ViewLogs',
      userId: req.user._id,
      userRole: 'admin',
      ipAddress: req.ip,
      metadata: {
        filters: filterOptions,
        page,
        limit
      }
    });

    res.status(200).json({
      success: true,
      count: logs.length,
      pagination: {
        total: totalLogs,
        page,
        limit,
        pages: Math.ceil(totalLogs / limit)
      },
      data: logs
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
 * @route   GET /api/admin/voters
 * @desc    Get voter list (for verification)
 * @access  Private (Admin)
 */
router.get('/voters', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    
    // Get voters with user details but mask sensitive info
    const voters = await Voter.find()
      .populate('user', 'name email createdAt')
      .select('verified verifiedAt hasVoted votedAt')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    // Add masked NIN and Voter ID
    const sanitizedVoters = voters.map(voter => {
      const voterObj = voter.toObject();
      // Show only last few digits of sensitive data
      voterObj.nin = `xxxxxxxxxxxxxx${voter.nin.slice(-6)}`;
      voterObj.voterId = `xxxxxx${voter.voterId.slice(-4)}`;
      return voterObj;
    });
    
    const totalVoters = await Voter.countDocuments();

    await logActivity({
      level: 'INFO',
      message: 'Admin viewed voter list',
      component: 'Admin',
      action: 'ViewVoters',
      userId: req.user._id,
      userRole: 'admin',
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      count: sanitizedVoters.length,
      pagination: {
        total: totalVoters,
        page,
        limit,
        pages: Math.ceil(totalVoters / limit)
      },
      data: sanitizedVoters
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
 * @route   PUT /api/admin/voters/:id/verify
 * @desc    Verify a voter's credentials
 * @access  Private (Admin)
 */
router.put('/voters/:id/verify', async (req, res) => {
  try {
    const voter = await Voter.findById(req.params.id);
    
    if (!voter) {
      return res.status(404).json({
        success: false,
        message: 'Voter not found'
      });
    }

    // Update voter verification status
    voter.verified = true;
    voter.verifiedAt = Date.now();
    await voter.save();

    await logActivity({
      level: 'INFO',
      message: 'Admin verified voter credentials',
      component: 'Admin',
      action: 'VerifyVoter',
      userId: req.user._id,
      userRole: 'admin',
      ipAddress: req.ip,
      metadata: {
        voterId: voter._id
      }
    });

    res.status(200).json({
      success: true,
      message: 'Voter verified successfully',
      data: {
        voterId: voter._id,
        verified: voter.verified,
        verifiedAt: voter.verifiedAt
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

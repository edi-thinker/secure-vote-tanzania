/**
 * Auditor routes
 * Implements UC-S2: View Vote Count
 * Implements UC-S3: Verify Vote Chain
 * Implements UC-S4: View System Logs
 * Implements UC-S5: Download Integrity Report
 * Implements UC-S6: Monitor System Status
 */

const express = require('express');
const { protect, authorize, require2FA } = require('../middleware/auth');
const Vote = require('../models/Vote');
const SystemLog = require('../models/SystemLog');
const { logActivity } = require('../utils/logger');
const { verifyVoteChain } = require('../utils/voteChain');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);
router.use(authorize('auditor'));
router.use(require2FA);

/**
 * @route   GET /api/auditor/vote-count
 * @desc    Get anonymized vote counts per candidate
 * @access  Private (Auditor)
 */
router.get('/vote-count', async (req, res) => {
  try {
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
      message: 'Auditor viewed vote count',
      component: 'Auditor',
      action: 'ViewVoteCount',
      userId: req.user._id,
      userRole: 'auditor',
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      count: votesPerCandidate.length,
      data: votesPerCandidate
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
 * @route   GET /api/auditor/verify-chain
 * @desc    Verify integrity of vote hash chain
 * @access  Private (Auditor)
 */
router.get('/verify-chain', async (req, res) => {
  try {
    // Run chain verification
    const verificationResult = await verifyVoteChain();

    await logActivity({
      level: verificationResult.valid ? 'INFO' : 'CRITICAL',
      message: `Vote chain verification: ${verificationResult.message}`,
      component: 'Auditor',
      action: 'VerifyChain',
      userId: req.user._id,
      userRole: 'auditor',
      ipAddress: req.ip,
      metadata: verificationResult
    });

    res.status(200).json({
      success: true,
      data: verificationResult
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
 * @route   GET /api/auditor/vote-chain
 * @desc    Get the hash chain for votes (anonymized)
 * @access  Private (Auditor)
 */
router.get('/vote-chain', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const startIndex = (page - 1) * limit;

    // Get vote chain - exclude candidateId to maintain anonymity
    const voteChain = await Vote.find()
      .select('voteHash prevHash timestamp verified verifiedAt')
      .sort({ timestamp: 1 })
      .skip(startIndex)
      .limit(limit);
    
    const totalVotes = await Vote.countDocuments();

    await logActivity({
      level: 'INFO',
      message: 'Auditor viewed vote chain',
      component: 'Auditor',
      action: 'ViewVoteChain',
      userId: req.user._id,
      userRole: 'auditor',
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      count: voteChain.length,
      pagination: {
        total: totalVotes,
        page,
        limit,
        pages: Math.ceil(totalVotes / limit)
      },
      data: voteChain
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
 * @route   GET /api/auditor/logs
 * @desc    Get system logs for audit
 * @access  Private (Auditor)
 */
router.get('/logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
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
    
    if (req.query.from || req.query.to) {
      filterOptions.timestamp = {};
      
      if (req.query.from) {
        filterOptions.timestamp.$gte = new Date(req.query.from);
      }
      
      if (req.query.to) {
        filterOptions.timestamp.$lte = new Date(req.query.to);
      }
    }

    // Get logs with pagination
    const logs = await SystemLog.find(filterOptions)
      .sort({ timestamp: -1 })
      .skip(startIndex)
      .limit(limit);
    
    const totalLogs = await SystemLog.countDocuments(filterOptions);

    await logActivity({
      level: 'INFO',
      message: 'Auditor viewed system logs',
      component: 'Auditor',
      action: 'ViewLogs',
      userId: req.user._id,
      userRole: 'auditor',
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
 * @route   GET /api/auditor/system-status
 * @desc    Get system status and integrity metrics
 * @access  Private (Auditor)
 */
router.get('/system-status', async (req, res) => {
  try {
    // Get vote chain status
    const chainStatus = await verifyVoteChain();
    
    // Get error logs in last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentErrors = await SystemLog.countDocuments({
      level: { $in: ['ERROR', 'CRITICAL'] },
      timestamp: { $gte: twentyFourHoursAgo }
    });
    
    // Get total votes
    const totalVotes = await Vote.countDocuments();
    
    // Get vote metrics
    const latestVote = await Vote.findOne().sort({ timestamp: -1 });
    const oldestVote = await Vote.findOne().sort({ timestamp: 1 });
    
    // Calculate votes per hour if votes exist
    let votesPerHour = 0;
    if (latestVote && oldestVote && totalVotes > 1) {
      const timeSpanHours = (latestVote.timestamp - oldestVote.timestamp) / (1000 * 60 * 60);
      if (timeSpanHours > 0) {
        votesPerHour = totalVotes / timeSpanHours;
      }
    }

    await logActivity({
      level: 'INFO',
      message: 'Auditor checked system status',
      component: 'Auditor',
      action: 'CheckSystemStatus',
      userId: req.user._id,
      userRole: 'auditor',
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        voteChain: {
          status: chainStatus.valid ? 'VALID' : 'INVALID',
          message: chainStatus.message,
          totalVotes: totalVotes,
          verifiedVotes: chainStatus.verified
        },
        systemHealth: {
          errorsLast24h: recentErrors,
          status: recentErrors === 0 ? 'HEALTHY' : recentErrors < 5 ? 'WARNING' : 'CRITICAL'
        },
        voteMetrics: {
          totalVotes,
          votesPerHour: parseFloat(votesPerHour.toFixed(2)),
          firstVoteAt: oldestVote ? oldestVote.timestamp : null,
          lastVoteAt: latestVote ? latestVote.timestamp : null
        }
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
 * @route   GET /api/auditor/integrity-report
 * @desc    Generate integrity report for download
 * @access  Private (Auditor)
 */
router.get('/integrity-report', async (req, res) => {
  try {
    // Get vote chain verification status
    const chainStatus = await verifyVoteChain();
    
    // Get vote metrics
    const totalVotes = await Vote.countDocuments();
    
    // Get error logs
    const errorLogs = await SystemLog.find({
      level: { $in: ['ERROR', 'CRITICAL'] }
    }).sort({ timestamp: -1 }).limit(100);
    
    // Get vote distribution
    const voteDistribution = await Vote.aggregate([
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

    // In a real system, we would generate a PDF or CSV here
    // For this implementation, we'll just return JSON
    const report = {
      generatedAt: new Date(),
      generatedBy: req.user._id,
      title: 'Secure Voting System Integrity Report',
      voteChainStatus: chainStatus,
      voteMetrics: {
        totalVotes,
        voteDistribution
      },
      systemErrors: errorLogs.map(log => ({
        level: log.level,
        message: log.message,
        timestamp: log.timestamp,
        component: log.component
      }))
    };

    await logActivity({
      level: 'INFO',
      message: 'Auditor generated integrity report',
      component: 'Auditor',
      action: 'GenerateReport',
      userId: req.user._id,
      userRole: 'auditor',
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: report
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

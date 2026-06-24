const Transaction = require('../models/Transaction');
const Subscription = require('../models/Subscription');
const User = require('../models/User');

// @desc    Retrieve aggregated business analytics data
// @route   GET /api/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
  try {
    // 1. Metric cards sums
    const totalTransactions = await Transaction.countDocuments();
    const successTransactions = await Transaction.countDocuments({ status: 'success' });
    const failedTransactions = await Transaction.countDocuments({ status: 'failed' });
    
    // Revenue aggregates
    const revenueStats = await Transaction.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0.00;

    // Refund aggregates
    const refundStats = await Transaction.aggregate([
      { $group: { _id: null, totalRefund: { $sum: '$refundAmount' } } }
    ]);
    const totalRefund = refundStats.length > 0 ? refundStats[0].totalRefund : 0.00;

    // Active subscription metrics
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });

    // Success Rate calculation
    const successRate = totalTransactions > 0 
      ? parseFloat(((successTransactions / totalTransactions) * 100).toFixed(1)) 
      : 100.0;

    // 2. Gateway Volume split
    const gatewaySplitStats = await Transaction.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: '$gateway', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const gatewaySplit = {
      stripe: 0,
      razorpay: 0,
      paypal: 0
    };
    gatewaySplitStats.forEach(g => {
      if (gatewaySplit[g._id] !== undefined) {
        gatewaySplit[g._id] = parseFloat(g.total.toFixed(2));
      }
    });

    // 3. User growth stats (last 30 days)
    const userGrowthStats = await User.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);

    // 4. Daily Revenue Trend (last 7 days)
    const revenueTrendStats = await Transaction.aggregate([
      { $match: { status: 'success' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          dailyRevenue: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 7 }
    ]);

    // 5. Recent Transaction lists
    const recentTransactions = await Transaction.find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('userId', 'name email');

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          totalRefund: parseFloat(totalRefund.toFixed(2)),
          activeSubscriptions,
          successRate,
          failedPayments: failedTransactions,
          totalPayments: totalTransactions
        },
        gatewaySplit,
        revenueTrend: revenueTrendStats,
        userGrowth: userGrowthStats,
        recentTransactions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAnalytics
};

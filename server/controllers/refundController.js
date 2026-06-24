const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const User = require('../models/User');
const { processGatewayRefund } = require('../services/gatewayService');
const { sendEmail } = require('../services/emailService');

// @desc    Process refund request (full or partial)
// @route   POST /api/refunds
// @access  Private/Admin
const processRefund = async (req, res) => {
  try {
    const { transactionId, amount, reason } = req.body;

    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction record not found' });
    }

    if (transaction.status === 'refunded' && transaction.refundAmount >= transaction.amount) {
      return res.status(400).json({ success: false, message: 'Transaction already fully refunded' });
    }

    const refundValue = parseFloat(amount) || transaction.amount;

    if (refundValue > transaction.amount - transaction.refundAmount) {
      return res.status(400).json({
        success: false,
        message: `Refund amount exceeds remaining transaction balance. Max allowed: $${(transaction.amount - transaction.refundAmount).toFixed(2)}`
      });
    }

    // Call Gateway Service Refund
    const refundResult = await processGatewayRefund(
      transaction.gateway,
      transactionId,
      refundValue,
      transaction.currency
    );

    // Update Transaction Database Entry
    transaction.refundAmount += refundValue;
    transaction.refundId = refundResult.id;
    if (transaction.refundAmount >= transaction.amount) {
      transaction.status = 'refunded';
    }
    await transaction.save();

    // Update Associated Order
    const order = await Order.findById(transaction.orderId);
    if (order) {
      if (transaction.refundAmount >= transaction.amount) {
        order.status = 'refunded';
      }
      await order.save();
    }

    // Notify User
    const user = await User.findById(transaction.userId);
    if (user) {
      const subject = 'SmartPay - Refund Initiated';
      const html = `
        <h3>Refund Processed Successfully</h3>
        <p>Dear ${user.name},</p>
        <p>A refund of <b>$${refundValue.toFixed(2)}</b> has been processed for your transaction (ID: ${transactionId}).</p>
        <p><b>Reason:</b> ${reason || 'Customer request'}</p>
        <p>Depending on your bank, the funds may take 5-10 business days to clear.</p>
        <br/>
        <p>Best Regards,</p>
        <p>SmartPay Team</p>
      `;
      await sendEmail(user.email, subject, html);
    }

    res.status(200).json({
      success: true,
      message: `Refund of $${refundValue.toFixed(2)} processed successfully`,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get refund history/transactions
// @route   GET /api/refunds/history
// @access  Private/Admin
const getRefundHistory = async (req, res) => {
  try {
    const refundedTransactions = await Transaction.find({
      status: 'refunded'
    }).populate('userId', 'name email').populate('orderId');

    res.status(200).json({
      success: true,
      count: refundedTransactions.length,
      data: refundedTransactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  processRefund,
  getRefundHistory
};

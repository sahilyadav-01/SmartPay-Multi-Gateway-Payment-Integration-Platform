const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const WebhookLog = require('../models/WebhookLog');
const crypto = require('crypto');
const { generateInvoice } = require('../services/invoiceService');
const { sendEmail } = require('../services/emailService');

// Business processing logic separated from controller wrapper for direct retry execution
const processRazorpayEvent = async (event, payload) => {
  if (event === 'payment.captured') {
    const paymentEntity = payload.payment.entity;
    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;
    const amount = paymentEntity.amount / 100; // converted from paise

    // Update Order Status
    const order = await Order.findOne({ orderId: orderId, status: 'pending' }).populate('items.productId');
    if (order) {
      order.status = 'captured';
      order.paymentId = paymentId;
      await order.save();

      // Create transaction log
      const user = await User.findById(order.userId);
      const transaction = await Transaction.create({
        userId: order.userId,
        orderId: order._id,
        gateway: 'razorpay',
        transactionId: paymentId,
        amount: order.amount,
        currency: order.currency || paymentEntity.currency || 'INR',
        status: 'success',
        feePct: 2.0,
        customerEmail: user ? user.email : '',
        customerName: user ? user.name : '',
        originalAmount: order.originalAmount || order.amount,
        fxRate: order.fxRate || 1,
        fxMarkupPct: order.fxMarkupPct || 0,
        fxMarkupFee: order.fxMarkupFee || 0
      });

      // Send invoice
      if (user) {
        try {
          const invoicePath = await generateInvoice(order, transaction, user);
          await sendEmail(
            user.email,
            'SmartPay - Payment Capturing Notification',
            `<p>Your payment for order ${order._id} was captured successfully via Webhook.</p>`,
            invoicePath
          );
        } catch (invErr) {
          console.error(`Webhook Invoice failure: ${invErr.message}`);
          throw new Error(`Invoice/Email notification failure: ${invErr.message}`);
        }
      }
    } else {
      // Order might be missing or already captured
      const existingOrder = await Order.findOne({ orderId: orderId });
      if (!existingOrder) {
        throw new Error(`Pending order not found for Razorpay order ID: ${orderId}`);
      }
    }
  } else if (event === 'payment.failed') {
    const paymentEntity = payload.payment.entity;
    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;

    const order = await Order.findOne({ orderId: orderId });
    if (order) {
      order.status = 'failed';
      await order.save();

      const user = await User.findById(order.userId);
      await Transaction.create({
        userId: order.userId,
        orderId: order._id,
        gateway: 'razorpay',
        transactionId: paymentId,
        amount: order.amount,
        currency: order.currency || paymentEntity.currency || 'INR',
        status: 'failed',
        failureReason: paymentEntity.error_description || 'Payment Failed',
        customerEmail: user ? user.email : '',
        customerName: user ? user.name : '',
        originalAmount: order.originalAmount || order.amount,
        fxRate: order.fxRate || 1,
        fxMarkupPct: order.fxMarkupPct || 0,
        fxMarkupFee: order.fxMarkupFee || 0
      });
    } else {
      throw new Error(`Order not found for Razorpay order ID: ${orderId}`);
    }
  } else if (event === 'refund.processed') {
    const refundEntity = payload.refund.entity;
    const paymentId = refundEntity.payment_id;
    const refundId = refundEntity.id;
    const refundAmount = refundEntity.amount / 100;

    // Update Transaction Log to refunded
    const transaction = await Transaction.findOne({ transactionId: paymentId });
    if (transaction) {
      transaction.status = 'refunded';
      transaction.refundId = refundId;
      transaction.refundAmount = refundAmount;
      await transaction.save();

      const order = await Order.findById(transaction.orderId);
      if (order) {
        order.status = 'refunded';
        await order.save();
      }

      const user = await User.findById(transaction.userId);
      if (user) {
        await sendEmail(
          user.email,
          'SmartPay - Refund Processed Notification',
          `<p>Your refund of ${refundAmount.toFixed(2)} ${transaction.currency || 'USD'} has been successfully processed for Transaction ${paymentId}.</p>`
        );
      }
    } else {
      throw new Error(`Successful transaction not found for refund payment reference ID: ${paymentId}`);
    }
  }
};

// @desc    Process Razorpay Webhook Events
// @route   POST /api/webhooks/razorpay
// @access  Public (Signature Checked)
const handleRazorpayWebhook = async (req, res) => {
  let log;
  try {
    const event = req.body.event || 'unknown';

    // 1. Initialise WebhookLog in pending state
    log = await WebhookLog.create({
      gateway: 'razorpay',
      eventType: event,
      payload: req.body,
      status: 'pending'
    });

    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_placeholder';

    // Verify webhook signature (if not placeholder)
    if (webhookSecret && webhookSecret !== 'rzp_webhook_secret_placeholder' && signature) {
      const shasum = crypto.createHmac('sha256', webhookSecret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');

      if (digest !== signature) {
        log.status = 'failed';
        log.errorMessage = 'Invalid webhook signature';
        await log.save();
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      }
    }

    const payload = req.body.payload;

    console.log(`[WEBHOOK] Received Razorpay Event: ${event}`);

    // 2. Process the business logic
    await processRazorpayEvent(event, payload);

    // 3. Mark log as processed
    log.status = 'processed';
    await log.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Webhook handler error: ${error.message}`);
    if (log) {
      log.status = 'failed';
      log.errorMessage = error.message;
      await log.save();
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  handleRazorpayWebhook,
  processRazorpayEvent
};

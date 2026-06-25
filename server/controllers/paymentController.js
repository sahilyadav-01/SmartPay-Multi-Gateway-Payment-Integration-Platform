const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const {
  createRazorpayOrder,
  verifyRazorpaySignature,
  createStripePaymentIntent,
  isRazorpayConfigured
} = require('../services/gatewayService');
const { generateInvoice } = require('../services/invoiceService');
const { sendEmail } = require('../services/emailService');
const routingService = require('../services/routingService');

// @desc    Initiate Razorpay payment order
// @route   POST /api/payments/razorpay/order
// @access  Private
const initiateRazorpayOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ userId: req.user._id, status: 'pending' });
    if (!order || order.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    // Call Razorpay API (or simulated fallback)
    const razorpayOrder = await createRazorpayOrder(order.amount, 'INR');

    // Update pending order with Razorpay order details
    order.orderId = razorpayOrder.id;
    await order.save();

    res.status(200).json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_key_placeholder',
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Razorpay payment signature
// @route   POST /api/payments/razorpay/verify
// @access  Private
const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const isValid = verifyRazorpaySignature(
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Find the corresponding order
    const order = await Order.findOne({ orderId: razorpay_order_id, status: 'pending' }).populate('items.productId');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Associated order not found' });
    }

    // Update order status
    order.status = 'captured';
    order.paymentId = razorpay_payment_id;
    await order.save();

    // Create Transaction Record
    const transaction = await Transaction.create({
      userId: req.user._id,
      orderId: order._id,
      gateway: 'razorpay',
      transactionId: razorpay_payment_id,
      amount: order.amount,
      currency: 'INR',
      status: 'success',
      feePct: 2.0,
      feeFixed: 0.0,
      customerEmail: req.user.email,
      customerName: req.user.name
    });

    // Generate PDF Invoice asynchronously
    try {
      const invoicePath = await generateInvoice(order, transaction, req.user);
      
      // Dispatch email confirmation
      const subject = 'SmartPay - Payment Success & Invoice';
      const html = `
        <h3>Payment Successful!</h3>
        <p>Dear ${req.user.name},</p>
        <p>Thank you for your payment of <b>$${order.amount.toFixed(2)}</b>. Your transaction has been processed successfully.</p>
        <p>Your Invoice is attached to this email.</p>
        <br/>
        <p>Best Regards,</p>
        <p>SmartPay Team</p>
      `;
      await sendEmail(req.user.email, subject, html, invoicePath);
    } catch (invErr) {
      console.error(`Invoice / Email processing error: ${invErr.message}`);
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and transaction processed successfully',
      transactionId: transaction.transactionId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Initiate Stripe Payment Intent
// @route   POST /api/payments/stripe/intent
// @access  Private
const initiateStripeIntent = async (req, res) => {
  try {
    const order = await Order.findOne({ userId: req.user._id, status: 'pending' });
    if (!order || order.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    const intent = await createStripePaymentIntent(order.amount, 'USD', req.user.email);

    // Save Stripe payment intent ID as the order's orderId reference
    order.orderId = intent.id;
    await order.save();

    res.status(200).json({
      success: true,
      clientSecret: intent.client_secret,
      intentId: intent.id,
      amount: order.amount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Confirm Stripe Payment Success (Direct Callback)
// @route   POST /api/payments/stripe/confirm
// @access  Private
const confirmStripePayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    const order = await Order.findOne({ orderId: paymentIntentId, status: 'pending' }).populate('items.productId');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order matching intent ID not found' });
    }

    // Update order status
    order.status = 'captured';
    order.paymentId = paymentIntentId;
    await order.save();

    // Create Transaction Record
    const transaction = await Transaction.create({
      userId: req.user._id,
      orderId: order._id,
      gateway: 'stripe',
      transactionId: paymentIntentId,
      amount: order.amount,
      currency: 'USD',
      status: 'success',
      feePct: 2.9,
      feeFixed: 0.30,
      customerEmail: req.user.email,
      customerName: req.user.name
    });

    // Generate Invoice and Email
    try {
      const invoicePath = await generateInvoice(order, transaction, req.user);
      const subject = 'SmartPay - Payment Success & Invoice';
      const html = `
        <h3>Payment Successful!</h3>
        <p>Dear ${req.user.name},</p>
        <p>Thank you for your payment of <b>$${order.amount.toFixed(2)}</b>. Your transaction has been processed successfully.</p>
        <p>Your Invoice is attached to this email.</p>
        <br/>
        <p>Best Regards,</p>
        <p>SmartPay Team</p>
      `;
      await sendEmail(req.user.email, subject, html, invoicePath);
    } catch (invErr) {
      console.error(`Invoice / Email processing error: ${invErr.message}`);
    }

    res.status(200).json({
      success: true,
      message: 'Stripe payment captured successfully',
      transactionId: transaction.transactionId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unified checkout endpoint that dynamically routes and initiates payment
// @route   POST /api/payments/checkout
// @access  Private
const checkout = async (req, res) => {
  try {
    const { currency } = req.body;
    if (!currency) {
      return res.status(400).json({ success: false, message: 'Please specify currency' });
    }

    const order = await Order.findOne({ userId: req.user._id, status: 'pending' });
    if (!order || order.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    // Evaluate route to choose target gateway
    const selectedGateway = await routingService.evaluateRoute(order.amount, currency);

    let paymentData = {};

    if (selectedGateway === 'stripe') {
      const intent = await createStripePaymentIntent(order.amount, currency, req.user.email);
      order.orderId = intent.id;
      order.gateway = 'stripe';
      await order.save();

      paymentData = {
        gateway: 'stripe',
        clientSecret: intent.client_secret,
        intentId: intent.id,
        amount: order.amount,
        currency
      };
    } else if (selectedGateway === 'razorpay') {
      const razorpayOrder = await createRazorpayOrder(order.amount, currency);
      order.orderId = razorpayOrder.id;
      order.gateway = 'razorpay';
      await order.save();

      paymentData = {
        gateway: 'razorpay',
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_key_placeholder',
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency
      };
    } else {
      return res.status(400).json({ success: false, message: `Unsupported target gateway: ${selectedGateway}` });
    }

    res.status(200).json({
      success: true,
      data: paymentData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged in user transaction history
// @route   GET /api/payments/transactions
// @access  Private
const getUserTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .populate({
        path: 'orderId',
        populate: { path: 'items.productId', model: 'Product' }
      })
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Securely download PDF invoice
// @route   GET /api/payments/invoice/:orderId
// @access  Private
const downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify ownership or admin role
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to download this invoice' });
    }

    const path = require('path');
    const fs = require('fs');
    const invoicePath = path.join(__dirname, '../../invoices', `invoice_${orderId}.pdf`);

    if (!fs.existsSync(invoicePath)) {
      return res.status(404).json({ success: false, message: 'Invoice file does not exist' });
    }

    res.download(invoicePath);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  initiateRazorpayOrder,
  verifyRazorpayPayment,
  initiateStripeIntent,
  confirmStripePayment,
  checkout,
  getUserTransactions,
  downloadInvoice
};

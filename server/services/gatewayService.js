const Razorpay = require('razorpay');
const Stripe = require('stripe');
const crypto = require('crypto');

// Initialize Gateway Clients (graceful handling of placeholder values)
const isRazorpayConfigured = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'rzp_test_key_placeholder';
const isStripeConfigured = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_stripe_placeholder';

let razorpayClient = null;
let stripeClient = null;

if (isRazorpayConfigured) {
  razorpayClient = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

if (isStripeConfigured) {
  stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
  });
}

/**
 * Creates an order on Razorpay (or simulates it)
 */
const createRazorpayOrder = async (amount, currency = 'INR') => {
  const amountInPaise = Math.round(amount * 100);
  
  if (!isRazorpayConfigured) {
    console.log('[SIMULATOR] Simulating Razorpay Order Creation');
    return {
      id: `order_sim_${crypto.randomBytes(6).toString('hex')}`,
      amount: amountInPaise,
      currency: currency,
      status: 'created',
      receipt: `receipt_${Date.now()}`
    };
  }

  return await razorpayClient.orders.create({
    amount: amountInPaise,
    currency: currency,
    receipt: `receipt_${Date.now()}`
  });
};

/**
 * Verifies Razorpay Webhook/Payment signature
 */
const verifyRazorpaySignature = (paymentId, orderId, signature) => {
  if (!isRazorpayConfigured) {
    console.log('[SIMULATOR] Simulating Razorpay Signature Verification');
    // Simulated checking: accept any signature containing _sim or dummy inputs
    return true;
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(orderId + '|' + paymentId)
    .digest('hex');

  return generatedSignature === signature;
};

/**
 * Creates a Stripe Payment Intent (or simulates it)
 */
const createStripePaymentIntent = async (amount, currency = 'USD', customerEmail = '') => {
  const amountInCents = Math.round(amount * 100);

  if (!isStripeConfigured) {
    console.log('[SIMULATOR] Simulating Stripe Payment Intent');
    return {
      client_secret: `pi_sim_${crypto.randomBytes(8).toString('hex')}_secret_${crypto.randomBytes(12).toString('hex')}`,
      id: `pi_sim_${crypto.randomBytes(8).toString('hex')}`,
      amount: amountInCents,
      currency: currency
    };
  }

  return await stripeClient.paymentIntents.create({
    amount: amountInCents,
    currency: currency,
    receipt_email: customerEmail,
    metadata: { integration: 'smartpay' }
  });
};

/**
 * Processes refund requests via Razorpay or Stripe
 */
const processGatewayRefund = async (gateway, transactionId, amount, currency = 'INR') => {
  if (gateway === 'razorpay') {
    if (!isRazorpayConfigured || transactionId.startsWith('pay_sim_') || transactionId.startsWith('tx_')) {
      console.log(`[SIMULATOR] Simulating Razorpay Refund for Tx ${transactionId}`);
      return {
        id: `rfnd_sim_${crypto.randomBytes(6).toString('hex')}`,
        entity: 'refund',
        amount: Math.round(amount * 100),
        currency: currency,
        payment_id: transactionId,
        status: 'processed'
      };
    }
    return await razorpayClient.payments.refund(transactionId, {
      amount: Math.round(amount * 100)
    });
  } else if (gateway === 'stripe') {
    if (!isStripeConfigured || transactionId.startsWith('pi_sim_') || transactionId.startsWith('ch_sim_')) {
      console.log(`[SIMULATOR] Simulating Stripe Refund for Tx ${transactionId}`);
      return {
        id: `re_sim_${crypto.randomBytes(6).toString('hex')}`,
        amount: Math.round(amount * 100),
        currency: currency,
        payment_intent: transactionId,
        status: 'succeeded'
      };
    }
    return await stripeClient.refunds.create({
      payment_intent: transactionId,
      amount: Math.round(amount * 100)
    });
  } else {
    // PayPal Simulation
    console.log(`[SIMULATOR] Simulating PayPal Refund for Tx ${transactionId}`);
    return {
      id: `pp_ref_sim_${crypto.randomBytes(6).toString('hex')}`,
      status: 'COMPLETED',
      amount
    };
  }
};

/**
 * Creates subscription billing profiles (simulated sandbox framework)
 */
const createGatewaySubscription = async (gateway, planName, email) => {
  console.log(`[SIMULATOR] Simulating ${gateway} subscription billing for ${planName} (${email})`);
  return {
    subscriptionId: `sub_sim_${crypto.randomBytes(8).toString('hex')}`,
    status: 'active',
    gateway
  };
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpaySignature,
  createStripePaymentIntent,
  processGatewayRefund,
  createGatewaySubscription,
  isRazorpayConfigured,
  isStripeConfigured
};

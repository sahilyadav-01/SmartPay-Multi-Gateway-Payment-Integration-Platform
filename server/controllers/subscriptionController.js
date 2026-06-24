const Subscription = require('../models/Subscription');
const { createGatewaySubscription } = require('../services/gatewayService');

// Plan Price configuration mapping
const PLAN_PRICING = {
  basic: {
    monthly: 9.99,
    annual: 99.99
  },
  premium: {
    monthly: 19.99,
    annual: 199.99
  }
};

// @desc    Initiate / Create subscription profile
// @route   POST /api/subscriptions/create
// @access  Private
const createSubscription = async (req, res) => {
  try {
    const { planName, billingPeriod, gateway } = req.body;
    
    const plan = planName.toLowerCase();
    const period = billingPeriod.toLowerCase();

    if (!PLAN_PRICING[plan] || !PLAN_PRICING[plan][period]) {
      return res.status(400).json({ success: false, message: 'Invalid plan or billing period' });
    }

    const price = PLAN_PRICING[plan][period];

    // Call simulated gateway billing
    const gatewayResult = await createGatewaySubscription(gateway || 'razorpay', plan, req.user.email);

    // Calculate next billing date
    const nextBilling = new Date();
    if (period === 'monthly') {
      nextBilling.setMonth(nextBilling.getMonth() + 1);
    } else {
      nextBilling.setFullYear(nextBilling.getFullYear() + 1);
    }

    // Check if user already has an active subscription
    let subscription = await Subscription.findOne({ userId: req.user._id, status: 'active' });

    if (subscription) {
      // Modify active plan
      subscription.planName = planName;
      subscription.billingPeriod = period;
      subscription.price = price;
      subscription.nextBillingDate = nextBilling;
      subscription.subscriptionId = gatewayResult.subscriptionId;
      await subscription.save();
    } else {
      // Create new subscription record
      subscription = await Subscription.create({
        userId: req.user._id,
        planName,
        billingPeriod: period,
        price,
        status: 'active',
        nextBillingDate: nextBilling,
        subscriptionId: gatewayResult.subscriptionId
      });
    }

    res.status(201).json({
      success: true,
      message: 'Subscription created and activated successfully',
      data: subscription
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Retrieve active subscription plan details
// @route   GET /api/subscriptions/status
// @access  Private
const getSubscriptionStatus = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user._id });
    
    if (!subscription) {
      return res.status(200).json({
        success: true,
        data: {
          planName: 'Free Tier',
          status: 'inactive',
          price: 0,
          nextBillingDate: null
        }
      });
    }

    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createSubscription,
  getSubscriptionStatus
};

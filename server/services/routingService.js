const RoutingRule = require('../models/RoutingRule');
const GatewayStatus = require('../models/GatewayStatus');

const evaluateRoute = async (amount, currency) => {
  try {
    // 1. Get current online status of gateways
    const stripeStatus = await GatewayStatus.findOne({ name: 'stripe' });
    const razorpayStatus = await GatewayStatus.findOne({ name: 'razorpay' });
    const paypalStatus = await GatewayStatus.findOne({ name: 'paypal' });

    const isOnline = (name) => {
      if (name === 'stripe') return !stripeStatus || stripeStatus.status === 'online';
      if (name === 'razorpay') return !razorpayStatus || razorpayStatus.status === 'online';
      if (name === 'paypal') return !paypalStatus || paypalStatus.status === 'online';
      return true;
    };

    // 2. Retrieve all active rules sorted by priority (ascending)
    const activeRules = await RoutingRule.find({ isActive: true }).sort({ priority: 1 });

    for (const rule of activeRules) {
      const { currency: targetCurrency, minAmount, maxAmount } = rule.conditions;

      // Check currency condition
      const currencyMatch = targetCurrency === 'ANY' || targetCurrency.toUpperCase() === currency.toUpperCase();

      // Check amount condition
      const amountMatch = amount >= minAmount && amount <= maxAmount;

      if (currencyMatch && amountMatch) {
        let chosenGateway = rule.targetGateway;

        // Check if the chosen gateway is online
        if (isOnline(chosenGateway)) {
          console.log(`[ROUTER] Matched rule "${rule.name}" (Priority: ${rule.priority}). Routing transaction of ${amount} ${currency} to ${chosenGateway}.`);
          return chosenGateway;
        } else {
          // AUTO-FAILOVER TRIGGER
          const alternative = chosenGateway === 'stripe' ? 'razorpay' : 'stripe';
          if (isOnline(alternative)) {
            console.log(`[FAILOVER] Rule "${rule.name}" matched ${chosenGateway}, but it is OFFLINE. Auto-failing over transaction of ${amount} ${currency} to healthy alternative: ${alternative}.`);
            return alternative;
          } else {
            console.log(`[FAILOVER] Both ${chosenGateway} and ${alternative} are offline. Attempting PayPal fallback.`);
            if (isOnline('paypal')) return 'paypal';
          }
        }
      }
    }

    // Default Fallback Policy
    let defaultGateway = currency.toUpperCase() === 'INR' ? 'razorpay' : 'stripe';
    if (!isOnline(defaultGateway)) {
      const alt = defaultGateway === 'stripe' ? 'razorpay' : 'stripe';
      if (isOnline(alt)) {
        console.log(`[FAILOVER] Default gateway ${defaultGateway} is OFFLINE. Auto-failing over to alternative ${alt}.`);
        defaultGateway = alt;
      }
    }

    console.log(`[ROUTER] No rules matched (or failovers applied). Applying routing policy for ${currency}. Routing to ${defaultGateway}.`);
    return defaultGateway;
  } catch (err) {
    console.error(`[ROUTER] Error evaluating routing rules: ${err.message}. Falling back to default stripe.`);
    return 'stripe';
  }
};

module.exports = {
  evaluateRoute
};

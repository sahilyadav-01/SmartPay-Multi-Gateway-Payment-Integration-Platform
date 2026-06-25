const RoutingRule = require('../models/RoutingRule');

const evaluateRoute = async (amount, currency) => {
  try {
    // Retrieve all active rules sorted by priority (ascending)
    const activeRules = await RoutingRule.find({ isActive: true }).sort({ priority: 1 });

    for (const rule of activeRules) {
      const { currency: targetCurrency, minAmount, maxAmount } = rule.conditions;

      // Check currency condition
      const currencyMatch = targetCurrency === 'ANY' || targetCurrency.toUpperCase() === currency.toUpperCase();

      // Check amount condition
      const amountMatch = amount >= minAmount && amount <= maxAmount;

      if (currencyMatch && amountMatch) {
        console.log(`[ROUTER] Matched rule "${rule.name}" (Priority: ${rule.priority}). Routing transaction of ${amount} ${currency} to ${rule.targetGateway}.`);
        return rule.targetGateway;
      }
    }

    // Default Fallback Policy
    const defaultGateway = currency.toUpperCase() === 'INR' ? 'razorpay' : 'stripe';
    console.log(`[ROUTER] No rules matched. Applying default fallback routing policy for ${currency}. Routing to ${defaultGateway}.`);
    return defaultGateway;
  } catch (err) {
    console.error(`[ROUTER] Error evaluating routing rules: ${err.message}. Falling back to default stripe.`);
    return 'stripe';
  }
};

module.exports = {
  evaluateRoute
};

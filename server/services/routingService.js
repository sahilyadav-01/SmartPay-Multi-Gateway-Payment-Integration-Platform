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

const simulateRoute = async (amount, currency, statusOverrides = {}) => {
  const trace = [];
  try {
    trace.push(`[SIMULATOR] Starting route evaluation dry-run for ${amount} ${currency}.`);

    const stripeDb = await GatewayStatus.findOne({ name: 'stripe' });
    const razorpayDb = await GatewayStatus.findOne({ name: 'razorpay' });
    const paypalDb = await GatewayStatus.findOne({ name: 'paypal' });

    const isOnline = (name) => {
      if (statusOverrides[name] !== undefined) {
        trace.push(`[SIMULATOR] Gateway "${name}" health status overridden to: ${statusOverrides[name].toUpperCase()}.`);
        return statusOverrides[name] === 'online';
      }
      if (name === 'stripe') return !stripeDb || stripeDb.status === 'online';
      if (name === 'razorpay') return !razorpayDb || razorpayDb.status === 'online';
      if (name === 'paypal') return !paypalDb || paypalDb.status === 'online';
      return true;
    };

    trace.push(`[SIMULATOR] Gateway health status checks: Stripe=${isOnline('stripe') ? 'ONLINE' : 'OFFLINE'}, Razorpay=${isOnline('razorpay') ? 'ONLINE' : 'OFFLINE'}, PayPal=${isOnline('paypal') ? 'ONLINE' : 'OFFLINE'}.`);

    const activeRules = await RoutingRule.find({ isActive: true }).sort({ priority: 1 });
    trace.push(`[SIMULATOR] Fetched ${activeRules.length} active routing rules for evaluation.`);

    for (const rule of activeRules) {
      const { currency: targetCurrency, minAmount, maxAmount } = rule.conditions;

      const currencyMatch = targetCurrency === 'ANY' || targetCurrency.toUpperCase() === currency.toUpperCase();
      const amountMatch = amount >= minAmount && amount <= maxAmount;

      trace.push(`[SIMULATOR] Checking Rule "${rule.name}" (Priority ${rule.priority}). Conditions: Currency=${targetCurrency}, Min=${minAmount}, Max=${maxAmount}.`);

      if (currencyMatch && amountMatch) {
        trace.push(`[SIMULATOR] MATCH FOUND: Rule "${rule.name}" matched. Target Gateway: ${rule.targetGateway.toUpperCase()}.`);
        let chosenGateway = rule.targetGateway;

        if (isOnline(chosenGateway)) {
          trace.push(`[SIMULATOR] Gateway "${chosenGateway}" is ONLINE. Routing decision completed.`);
          return { gateway: chosenGateway, trace };
        } else {
          const alternative = chosenGateway === 'stripe' ? 'razorpay' : 'stripe';
          trace.push(`[SIMULATOR] WARNING: Target gateway "${chosenGateway}" is OFFLINE. Triggering failover check to alternate gateway: ${alternative.toUpperCase()}.`);
          
          if (isOnline(alternative)) {
            trace.push(`[SIMULATOR] Failover SUCCESS: Alternate gateway "${alternative}" is ONLINE. Re-routing checkout to alternate.`);
            return { gateway: alternative, trace };
          } else {
            trace.push(`[SIMULATOR] WARNING: Alternate gateway "${alternative}" is also OFFLINE. Attempting PayPal fallback.`);
            if (isOnline('paypal')) {
              trace.push(`[SIMULATOR] PayPal is ONLINE. Routing checkout to PayPal.`);
              return { gateway: 'paypal', trace };
            } else {
              trace.push(`[SIMULATOR] ERROR: All routes (Stripe, Razorpay, PayPal) are OFFLINE. Routing will fallback to Stripe under degraded state.`);
              return { gateway: 'stripe', trace };
            }
          }
        }
      } else {
        const mismatchReason = [];
        if (!currencyMatch) mismatchReason.push(`Currency mismatch (Expected: ${targetCurrency}, Got: ${currency})`);
        if (!amountMatch) mismatchReason.push(`Amount mismatch (Range: ${minAmount}-${maxAmount}, Got: ${amount})`);
        trace.push(`[SIMULATOR] Rule "${rule.name}" did not match: ${mismatchReason.join(', ')}.`);
      }
    }

    let defaultGateway = currency.toUpperCase() === 'INR' ? 'razorpay' : 'stripe';
    trace.push(`[SIMULATOR] No active rules matched. Applying default currency routing policy for ${currency}. Default gateway: ${defaultGateway.toUpperCase()}.`);

    if (!isOnline(defaultGateway)) {
      const alt = defaultGateway === 'stripe' ? 'razorpay' : 'stripe';
      trace.push(`[SIMULATOR] WARNING: Default gateway "${defaultGateway}" is OFFLINE. Checking alternative default: ${alt.toUpperCase()}.`);
      if (isOnline(alt)) {
        trace.push(`[SIMULATOR] Failover SUCCESS: Shifting default route to healthy alternative: ${alt.toUpperCase()}.`);
        defaultGateway = alt;
      } else {
        trace.push(`[SIMULATOR] WARNING: Alternative default "${alt}" is also OFFLINE. Attempting PayPal default fallback.`);
        if (isOnline('paypal')) {
          trace.push(`[SIMULATOR] PayPal is ONLINE. Routing to PayPal.`);
          defaultGateway = 'paypal';
        } else {
          trace.push(`[SIMULATOR] ERROR: All default routes are OFFLINE. Defaulting to Stripe.`);
          defaultGateway = 'stripe';
        }
      }
    }

    trace.push(`[SIMULATOR] Routing decision completed to: ${defaultGateway.toUpperCase()}.`);
    return { gateway: defaultGateway, trace };
  } catch (err) {
    trace.push(`[SIMULATOR] CRITICAL ERROR during simulation: ${err.message}. Defaulting to Stripe.`);
    return { gateway: 'stripe', trace };
  }
};

module.exports = {
  evaluateRoute,
  simulateRoute
};

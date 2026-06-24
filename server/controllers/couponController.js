const Coupon = require('../models/Coupon');
const Order = require('../models/Order');

// @desc    Create new coupon
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, expiryDate, usageLimit } = req.body;

    const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
    if (couponExists) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      expiryDate,
      usageLimit: usageLimit || 100
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private/Admin
const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({});
    res.status(200).json({ success: true, count: coupons.length, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Validate and apply coupon code to active cart
// @route   POST /api/coupons/apply
// @access  Private
const applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code' });
    }

    // Check expiry
    if (new Date(coupon.expiryDate) < new Date()) {
      coupon.isActive = false;
      await coupon.save();
      return res.status(400).json({ success: false, message: 'Coupon code has expired' });
    }

    // Check usage limit
    if (coupon.usageCount >= coupon.usageLimit) {
      coupon.isActive = false;
      await coupon.save();
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }

    // Find user's active pending order
    const order = await Order.findOne({ userId: req.user._id, status: 'pending' });
    if (!order || order.items.length === 0) {
      return res.status(400).json({ success: false, message: 'No active cart to apply coupon' });
    }

    // Calculate subtotal
    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const gst = subtotal * 0.18;
    const subtotalWithGst = subtotal + gst;

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (coupon.discountValue / 100) * subtotal;
    } else {
      discount = coupon.discountValue;
    }

    // Cap discount to order subtotal
    discount = Math.min(discount, subtotal);

    // Apply to Order
    order.discount = parseFloat(discount.toFixed(2));
    order.couponCode = coupon.code;
    order.amount = parseFloat((subtotalWithGst - discount).toFixed(2));
    await order.save();

    // Increment coupon usage count
    coupon.usageCount += 1;
    await coupon.save();

    res.status(200).json({
      success: true,
      message: `Coupon '${coupon.code}' applied successfully`,
      discount: order.discount,
      amount: order.amount,
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCoupon,
  getCoupons,
  applyCoupon
};

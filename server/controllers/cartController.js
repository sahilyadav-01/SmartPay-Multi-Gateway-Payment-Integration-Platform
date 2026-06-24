const Order = require('../models/Order');
const Product = require('../models/Product');

// Helper to recalculate order total
const recalculateOrderAmount = (order) => {
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Apply GST 18%
  const gst = subtotal * 0.18;
  const total = subtotal + gst - (order.discount || 0);
  order.amount = Math.max(0, parseFloat(total.toFixed(2)));
};

// @desc    Get active user cart (pending order)
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    let order = await Order.findOne({ userId: req.user._id, status: 'pending' }).populate('items.productId');
    
    if (!order) {
      // Return empty structure
      return res.status(200).json({
        success: true,
        data: {
          items: [],
          amount: 0,
          discount: 0,
          couponCode: ''
        }
      });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add item to cart / update quantity
// @route   POST /api/cart/add
// @access  Private
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity) || 1;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let order = await Order.findOne({ userId: req.user._id, status: 'pending' });

    if (!order) {
      // Create new pending order as cart
      order = new Order({
        userId: req.user._id,
        items: [],
        amount: 0
      });
    }

    // Check if item is already in cart
    const itemIndex = order.items.findIndex(item => item.productId.toString() === productId);

    if (itemIndex > -1) {
      // Update quantity
      order.items[itemIndex].quantity += qty;
      if (order.items[itemIndex].quantity <= 0) {
        order.items.splice(itemIndex, 1);
      }
    } else if (qty > 0) {
      // Add new item
      order.items.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: qty
      });
    }

    recalculateOrderAmount(order);
    await order.save();

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove item from cart completely
// @route   DELETE /api/cart/remove
// @access  Private
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;

    let order = await Order.findOne({ userId: req.user._id, status: 'pending' });
    if (!order) {
      return res.status(404).json({ success: false, message: 'No active cart found' });
    }

    order.items = order.items.filter(item => item.productId.toString() !== productId);

    recalculateOrderAmount(order);
    await order.save();

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  removeFromCart
};

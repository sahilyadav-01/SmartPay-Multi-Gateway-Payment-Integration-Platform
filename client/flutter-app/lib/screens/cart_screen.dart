import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'checkout_screen.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  Map<String, dynamic> _cart = {};
  bool _isLoading = true;
  final _couponController = TextEditingController();
  String _message = '';

  @override
  void initState() {
    super.initState();
    _loadCart();
  }

  @override
  void dispose() {
    _couponController.dispose();
    super.dispose();
  }

  Future<void> _loadCart() async {
    setState(() {
      _isLoading = true;
      _message = '';
    });
    try {
      final res = await ApiService.getCart();
      if (res['success'] == true) {
        setState(() {
          _cart = res['data'] ?? {};
        });
      }
    } catch (e) {
      setState(() {
        _message = 'Failed to fetch cart';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _removeItem(String productId) async {
    try {
      final res = await ApiService.removeFromCart(productId);
      if (res['success'] == true) {
        _loadCart();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to remove item')),
      );
    }
  }

  Future<void> _applyCouponCode() async {
    final code = _couponController.text.trim();
    if (code.isEmpty) return;

    try {
      final res = await ApiService.applyCoupon(code);
      if (res['success'] == true) {
        setState(() {
          _message = 'Coupon applied: -\$${res['discount']}';
        });
        _loadCart();
      } else {
        setState(() {
          _message = res['message'] ?? 'Coupon invalid';
        });
      }
    } catch (e) {
      setState(() {
        _message = 'Failed to apply coupon';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final items = _cart['items'] as List<dynamic>? ?? [];
    final amount = _cart['amount'] as num? ?? 0.0;
    final discount = _cart['discount'] as num? ?? 0.0;
    
    return Scaffold(
      backgroundColor: const Color(0xFF070913),
      appBar: AppBar(
        backgroundColor: const Color(0xFF101628),
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text('Shopping Cart', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : items.isEmpty
              ? const Center(child: Text('Your shopping cart is empty.', style: TextStyle(color: Colors.white70)))
              : Column(
                  children: [
                    Expanded(
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: items.length,
                        itemBuilder: (context, index) {
                          final item = items[index];
                          return Card(
                            color: const Color(0xFF101628),
                            margin: const EdgeInsets.bottom(12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                              side: const BorderSide(color: Colors.white10),
                            ),
                            child: ListTile(
                              title: Text(item['name'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                              subtitle: Text(
                                'Qty: ${item['quantity']} • \$${(item['price'] as num).toDouble().toStringAsFixed(2)}',
                                style: const TextStyle(color: Colors.grey),
                              ),
                              trailing: IconButton(
                                icon: const Icon(Icons.delete, color: Colors.redAccent),
                                onPressed: () => _removeItem(item['productId']['_id'] ?? item['productId']),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    
                    // Coupon Code Input
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _couponController,
                              style: const TextStyle(color: Colors.white),
                              decoration: const InputDecoration(
                                hintText: 'Enter Coupon Code',
                                hintStyle: TextStyle(color: Colors.grey),
                                enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          ElevatedButton(
                            onPressed: _applyCouponCode,
                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF8B5CF6)),
                            child: const Text('Apply', style: TextStyle(color: Colors.white)),
                          )
                        ],
                      ),
                    ),

                    if (_message.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 16.0),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            _message,
                            style: TextStyle(
                              color: _message.contains('applied') ? Colors.green : Colors.redAccent,
                              fontSize: 13,
                              fontWeight: FontWeight.bold
                            ),
                          ),
                        ),
                      ),

                    // Order Summary Banner
                    Container(
                      padding: const EdgeInsets.all(20),
                      color: const Color(0xFF101628),
                      child: SafeArea(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            if (discount > 0) ...[
                              Row(
                                mainAxisAlignment: MainAxisAlignment.between,
                                children: [
                                  const Text('Discount:', style: TextStyle(color: Colors.grey, fontSize: 14)),
                                  Text(
                                    '-\$${discount.toDouble().toStringAsFixed(2)}',
                                    style: const TextStyle(color: Colors.redAccent, fontSize: 14, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                            ],
                            Row(
                              mainAxisAlignment: MainAxisAlignment.between,
                              children: [
                                const Text('Total (inc. GST):', style: TextStyle(color: Colors.white70, fontSize: 16, fontWeight: FontWeight.bold)),
                                Text(
                                  '\$${amount.toDouble().toStringAsFixed(2)}',
                                  style: const TextStyle(color: Color(0xFF10B981), fontSize: 20, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF635BFF),
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              onPressed: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (context) => CheckoutScreen(amount: amount.toDouble()),
                                  ),
                                );
                              },
                              child: const Text('Proceed to Checkout', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }
}
//

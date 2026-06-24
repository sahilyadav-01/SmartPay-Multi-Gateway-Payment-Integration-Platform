import 'dart:developer';
import 'package:flutter/material.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../services/api_service.dart';
import 'payment_history_screen.dart';

class CheckoutScreen extends StatefulWidget {
  final double amount;
  const CheckoutScreen({super.key, required this.amount});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  late Razorpay _razorpay;
  bool _isProcessing = false;
  String _statusMessage = 'Select your payment method below';

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  // Handle successful checkout payments from SDK
  Future<void> _handlePaymentSuccess(PaymentSuccessResponse response) async {
    setState(() {
      _statusMessage = 'Verifying payment signature...';
    });

    try {
      final res = await ApiService.verifyRazorpayPayment(
        orderId: response.orderId ?? '',
        paymentId: response.paymentId ?? '',
        signature: response.signature ?? '',
      );

      if (res['success'] == true) {
        _onPaymentFinished(true, res['transactionId'] ?? 'N/A');
      } else {
        _onPaymentFinished(false, 'Signature verification failed');
      }
    } catch (e) {
      _onPaymentFinished(false, 'Verification request failed');
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    _onPaymentFinished(false, 'SDK Error: ${response.message}');
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    _onPaymentFinished(true, 'External Wallet: ${response.walletName}');
  }

  void _onPaymentFinished(bool success, String detail) {
    setState(() {
      _isProcessing = false;
      _statusMessage = success
          ? 'SUCCESS! Transaction ID: $detail\nYour invoice has been emailed.'
          : 'FAILED: $detail';
    });

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payment Complete! Check your email.')),
      );
    }
  }

  // Official Razorpay SDK trigger
  Future<void> _startRazorpayPayment() async {
    setState(() {
      _isProcessing = true;
      _statusMessage = 'Initiating Razorpay Order...';
    });

    try {
      final orderRes = await ApiService.createRazorpayOrder();
      if (orderRes['success'] == false) {
        setState(() {
          _isProcessing = false;
          _statusMessage = 'Order creation failed: ${orderRes['message']}';
        });
        return;
      }

      final options = {
        'key': orderRes['key'],
        'amount': orderRes['amount'], // already in paise
        'name': 'SmartPay Inc',
        'order_id': orderRes['orderId'],
        'description': 'Shopping Cart Checkout',
        'prefill': {'contact': '9876543210', 'email': 'customer@smartpay.io'},
        'external': {
          'wallets': ['paytm']
        }
      };

      _razorpay.open(options);
    } catch (e) {
      log('Checkout Error: $e');
      setState(() {
        _isProcessing = false;
        _statusMessage = 'Razorpay initialization failed.';
      });
    }
  }

  // Developer Simulation Bypass (For ease of testing without native builds)
  Future<void> _simulateLocalSandboxPayment() async {
    setState(() {
      _isProcessing = true;
      _statusMessage = 'Simulating local checkout...';
    });

    try {
      final orderRes = await ApiService.createRazorpayOrder();
      if (orderRes['success'] == false) {
        setState(() {
          _isProcessing = false;
          _statusMessage = 'Simulated order creation failed';
        });
        return;
      }

      final orderId = orderRes['orderId'];
      final mockPaymentId = 'pay_sim_${DateTime.now().millisecondsSinceEpoch.toString().substring(6)}';
      final mockSignature = 'sig_sim_${DateTime.now().millisecondsSinceEpoch}';

      // Call signature verification directly with simulated parameters
      final verifyRes = await ApiService.verifyRazorpayPayment(
        orderId: orderId,
        paymentId: mockPaymentId,
        signature: mockSignature,
      );

      if (verifyRes['success'] == true) {
        _onPaymentFinished(true, verifyRes['transactionId']);
      } else {
        _onPaymentFinished(false, 'Simulated signature verification failed');
      }
    } catch (e) {
      _onPaymentFinished(false, 'Simulated connection error');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF070913),
      appBar: AppBar(
        backgroundColor: const Color(0xFF101628),
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text('Checkout', style: TextStyle(color: Colors.white)),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Total payment card
              Card(
                color: const Color(0xFF101628),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: const BorderSide(color: Colors.white10),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    children: [
                      const Text(
                        'Total Payable Amount',
                        style: TextStyle(color: Colors.grey, fontSize: 14),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '\$${widget.amount.toStringAsFixed(2)}',
                        style: const TextStyle(
                          color: Color(0xFF10B981),
                          fontSize: 36,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 40),
              
              Text(
                _statusMessage,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70, fontSize: 14),
              ),
              
              const SizedBox(height: 40),

              if (_isProcessing)
                const Center(child: CircularProgressIndicator())
              else ...[
                // Official Razorpay Trigger
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF3399CC),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  icon: const Icon(Icons.credit_card),
                  label: const Text('Pay via Razorpay SDK', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  onPressed: _startRazorpayPayment,
                ),
                
                const SizedBox(height: 16),
                
                // Sandbox simulator
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF8B5CF6),
                    side: const BorderSide(color: Color(0xFF8B5CF6)),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  icon: const Icon(Icons.bug_report),
                  label: const Text('Simulate Sandbox Payment (Web/Emulator)', style: TextStyle(fontSize: 14)),
                  onPressed: _simulateLocalSandboxPayment,
                ),

                if (_statusMessage.contains('SUCCESS')) ...[
                  const SizedBox(height: 32),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: Colors.white,
                    ),
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (context) => const PaymentHistoryScreen()),
                      );
                    },
                    child: const Text('View Payment History'),
                  ),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }
}

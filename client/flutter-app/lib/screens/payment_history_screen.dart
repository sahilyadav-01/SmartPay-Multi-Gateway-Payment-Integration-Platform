import 'package:flutter/material.dart';
import '../services/api_service.dart';

class PaymentHistoryScreen extends StatefulWidget {
  const PaymentHistoryScreen({super.key});

  @override
  State<PaymentHistoryScreen> createState() => _PaymentHistoryScreenState();
}

class _PaymentHistoryScreenState extends State<PaymentHistoryScreen> {
  Map<String, dynamic> _subStatus = {};
  bool _isLoading = true;
  String _message = '';

  @override
  void initState() {
    super.initState();
    _loadSubscriptionDetails();
  }

  Future<void> _loadSubscriptionDetails() async {
    setState(() {
      _isLoading = true;
      _message = '';
    });
    try {
      final res = await ApiService.getSubscriptionStatus();
      if (res['success'] == true) {
        setState(() {
          _subStatus = res['data'] ?? {};
        });
      }
    } catch (e) {
      setState(() {
        _message = 'Failed to load details';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _upgradeSubscription(String plan, String period) async {
    setState(() {
      _isLoading = true;
    });
    try {
      final res = await ApiService.createSubscription(plan, period);
      if (res['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Subscribed to $plan successfully!')),
        );
        _loadSubscriptionDetails();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['message'] ?? 'Subscription failed')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Upgrade request failed')),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasActiveSub = _subStatus['status'] == 'active';
    final planName = _subStatus['planName'] ?? 'Free Tier';
    final billing = _subStatus['billingPeriod'] ?? '';
    final price = _subStatus['price'] ?? 0;
    
    return Scaffold(
      backgroundColor: const Color(0xFF070913),
      appBar: AppBar(
        backgroundColor: const Color(0xFF101628),
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text('Account & Billing', style: TextStyle(color: Colors.white)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Billing Profile Status',
                    style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  Card(
                    color: const Color(0xFF101628),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: Colors.white10),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.between,
                            children: [
                              Text(
                                'Current Plan: $planName',
                                style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, y: 4),
                                decoration: BoxDecoration(
                                  color: hasActiveSub ? Colors.green.withOpacity(0.15) : Colors.amber.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  hasActiveSub ? 'Active Pro' : 'Free Account',
                                  style: TextStyle(
                                    color: hasActiveSub ? Colors.green : Colors.amber,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          if (hasActiveSub) ...[
                            Text(
                              'Billing: \$${price.toString()}/$billing',
                              style: const TextStyle(color: Colors.white70),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Next renewal: ${_subStatus['nextBillingDate']?.toString().substring(0, 10) ?? ''}',
                              style: const TextStyle(color: Colors.grey),
                            ),
                          ] else ...[
                            const Text(
                              'Unlock standard processing limits, coupon engine access, and advanced routing capabilities.',
                              style: TextStyle(color: Colors.grey, fontSize: 13),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 32),

                  const Text(
                    'Subscription Plans Upgrade',
                    style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),

                  // Basic Plan Card
                  Card(
                    color: const Color(0xFF101628),
                    child: ListTile(
                      title: const Text('Basic Pro (Monthly)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      subtitle: const Text('\$9.99 / month • Advanced gateway smart routing', style: TextStyle(color: Colors.grey, fontSize: 12)),
                      trailing: ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF8B5CF6)),
                        onPressed: () => _upgradeSubscription('basic', 'monthly'),
                        child: const Text('Subscribe'),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Premium Plan Card
                  Card(
                    color: const Color(0xFF101628),
                    child: ListTile(
                      title: const Text('Premium Pro (Annual)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      subtitle: const Text('\$199.99 / year • VIP priority gateway processing & reports', style: TextStyle(color: Colors.grey, fontSize: 12)),
                      trailing: ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF635BFF)),
                        onPressed: () => _upgradeSubscription('premium', 'annual'),
                        child: const Text('Subscribe'),
                      ),
                    ),
                  ),
                  
                  if (_message.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 16.0),
                      child: Text(_message, style: const TextStyle(color: Colors.redAccent)),
                    ),
                ],
              ),
            ),
    );
  }
}

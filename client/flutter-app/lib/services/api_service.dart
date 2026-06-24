import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Local host configuration for Android Emulator (10.0.2.2) or iOS Simulator (localhost)
  static const String baseUrl = 'http://10.0.2.2:5000/api';

  static Future<Map<String, String>> _headers() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token') ?? '';
    return {
      'Content-Type': 'application/json',
      if (token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  // Auth Operations
  static Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', data['accessToken'] ?? '');
      await prefs.setString('user', jsonEncode(data['user']));
    }
    return data;
  }

  static Future<Map<String, dynamic>> register(String name, String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'name': name,
        'email': email,
        'password': password,
        'role': 'customer'
      }),
    );
    final data = jsonDecode(response.body);
    if (response.statusCode == 201 && data['success'] == true) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', data['accessToken'] ?? '');
      await prefs.setString('user', jsonEncode(data['user']));
    }
    return data;
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('user');
  }

  // Products
  static Future<List<dynamic>> getProducts() async {
    final headers = await _headers();
    final response = await http.get(Uri.parse('$baseUrl/products'), headers: headers);
    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return data['data'];
    }
    return [];
  }

  // Cart Management
  static Future<Map<String, dynamic>> getCart() async {
    final headers = await _headers();
    final response = await http.get(Uri.parse('$baseUrl/cart'), headers: headers);
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> addToCart(String productId, int quantity) async {
    final headers = await _headers();
    final response = await http.post(
      Uri.parse('$baseUrl/cart/add'),
      headers: headers,
      body: jsonEncode({'productId': productId, 'quantity': quantity}),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> removeFromCart(String productId) async {
    final headers = await _headers();
    final response = await http.delete(
      Uri.parse('$baseUrl/cart/remove'),
      headers: headers,
      body: jsonEncode({'productId': productId}),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> applyCoupon(String code) async {
    final headers = await _headers();
    final response = await http.post(
      Uri.parse('$baseUrl/coupons/apply'),
      headers: headers,
      body: jsonEncode({'code': code}),
    );
    return jsonDecode(response.body);
  }

  // Payment Integration
  static Future<Map<String, dynamic>> createRazorpayOrder() async {
    final headers = await _headers();
    final response = await http.post(
      Uri.parse('$baseUrl/payments/razorpay/order'),
      headers: headers,
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> verifyRazorpayPayment({
    required String orderId,
    required String paymentId,
    required String signature,
  }) async {
    final headers = await _headers();
    final response = await http.post(
      Uri.parse('$baseUrl/payments/razorpay/verify'),
      headers: headers,
      body: jsonEncode({
        'razorpay_order_id': orderId,
        'razorpay_payment_id': paymentId,
        'razorpay_signature': signature,
      }),
    );
    return jsonDecode(response.body);
  }

  // Subscriptions
  static Future<Map<String, dynamic>> getSubscriptionStatus() async {
    final headers = await _headers();
    final response = await http.get(Uri.parse('$baseUrl/subscriptions/status'), headers: headers);
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> createSubscription(String planName, String billingPeriod) async {
    final headers = await _headers();
    final response = await http.post(
      Uri.parse('$baseUrl/subscriptions/create'),
      headers: headers,
      body: jsonEncode({
        'planName': planName,
        'billingPeriod': billingPeriod,
        'gateway': 'razorpay'
      }),
    );
    return jsonDecode(response.body);
  }
}
//

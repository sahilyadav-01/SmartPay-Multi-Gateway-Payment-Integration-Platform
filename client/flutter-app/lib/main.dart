import 'package:flutter/material.dart';
import 'screens/auth_screen.dart';

void main() {
  runApp(const SmartPayApp());
}

class SmartPayApp extends StatelessWidget {
  const SmartPayApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SmartPay Platform',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFF635BFF),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF635BFF),
          secondary: Color(0xFF8B5CF6),
          background: Color(0xFF070913),
          surface: Color(0xFF101628),
        ),
        useMaterial3: true,
      ),
      home: const AuthScreen(),
    );
  }
}

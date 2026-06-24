# SmartPay Multi-Gateway REST API Specification

This document outlines the API endpoints, payload requirements, and response structures for the SmartPay payment integration services.

---

## 1. Authentication Endpoints

### 1.1 Register User
- **URL**: `POST /api/auth/register`
- **Access**: Public
- **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "9876543210",
  "password": "password123",
  "role": "customer"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "user": {
    "id": "60d0fe2c0f2b3c2e88a091a1",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "9876543210",
    "role": "customer"
  }
}
```

### 1.2 Login User
- **URL**: `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "jane@example.com",
  "password": "password123"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "user": {
    "id": "60d0fe2c0f2b3c2e88a091a1",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "customer"
  }
}
```

---

## 2. Product Management Endpoints

### 2.1 Get Products
- **URL**: `GET /api/products`
- **Access**: Public
- **Query Params**:
  - `search` (optional)
  - `category` (optional)
- **Response (200 OK)**:
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "60d0fe2c0f2b3c2e88a091a2",
      "name": "Product A",
      "price": 99.99,
      "description": "Standard service offering",
      "category": "General",
      "createdAt": "2026-06-24T22:15:00.000Z"
    }
  ]
}
```

### 2.2 Create Product
- **URL**: `POST /api/products`
- **Access**: Private (Admin Only)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "name": "Product B",
  "price": 149.99,
  "description": "Premium service package",
  "category": "Tech"
}
```

---

## 3. Cart & Discount Endpoints

### 3.1 Get Cart
- **URL**: `GET /api/cart`
- **Access**: Private (Customer)
- **Headers**: `Authorization: Bearer <token>`

### 3.2 Add to Cart
- **URL**: `POST /api/cart/add`
- **Access**: Private (Customer)
- **Request Body**:
```json
{
  "productId": "60d0fe2c0f2b3c2e88a091a2",
  "quantity": 1
}
```

### 3.3 Apply Coupon
- **URL**: `POST /api/coupons/apply`
- **Access**: Private (Customer)
- **Request Body**:
```json
{
  "code": "WELCOME20"
}
```

---

## 4. Payment processing Endpoints

### 4.1 Create Razorpay Order
- **URL**: `POST /api/payments/razorpay/order`
- **Access**: Private (Customer)
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "key": "rzp_test_...",
  "orderId": "order_Hj28DsnH92HsD",
  "amount": 9999,
  "currency": "INR"
}
```

### 4.2 Verify Razorpay Signature
- **URL**: `POST /api/payments/razorpay/verify`
- **Access**: Private (Customer)
- **Request Body**:
```json
{
  "razorpay_order_id": "order_Hj28DsnH92HsD",
  "razorpay_payment_id": "pay_Hj29Hdnw82KsE",
  "razorpay_signature": "2810f82h281hd821dh..."
}
```

---

## 5. Webhook Endpoints

### 5.1 Razorpay Webhook Callback
- **URL**: `POST /api/webhooks/razorpay`
- **Access**: Public (Signature checked)
- **Headers**: `X-Razorpay-Signature: <signature>`
- **Event Actions Supported**:
  - `payment.captured`
  - `payment.failed`
  - `refund.processed`

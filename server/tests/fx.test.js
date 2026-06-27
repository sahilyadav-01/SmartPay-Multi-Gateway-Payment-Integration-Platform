const request = require('supertest');
const app = require('../app');
const FXConfig = require('../models/FXConfig');
const Order = require('../models/Order');
const GatewayStatus = require('../models/GatewayStatus');
const RoutingRule = require('../models/RoutingRule');
const gatewayService = require('../services/gatewayService');

jest.mock('../models/FXConfig');
jest.mock('../models/Order');
jest.mock('../models/GatewayStatus');
jest.mock('../models/RoutingRule');
jest.mock('../services/gatewayService');

// Mock protect/authorize middleware to bypass auth during tests
jest.mock('../middleware/auth', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'mock_admin_123', role: 'admin', email: 'admin@smartpay.io', name: 'System Admin' };
    next();
  }
}));

describe('FX Markup and Currency Converter Engine & APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock default gateway status to be online
    GatewayStatus.findOne.mockImplementation(({ name }) => {
      return Promise.resolve({ name, status: 'online', latencyMs: 100 });
    });
    
    // Mock routing rule find to return no rules (falls back to default gateways)
    RoutingRule.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([])
    });
  });

  describe('FX Config REST API Endpoints', () => {
    it('should retrieve list of FX configs', async () => {
      const mockConfigs = [
        { _id: 'fx1', baseCurrency: 'USD', targetCurrency: 'INR', exchangeRate: 83.5, markupPercentage: 2.5, isActive: true }
      ];
      FXConfig.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockConfigs)
      });

      const response = await request(app).get('/api/fx-rules');
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data[0].targetCurrency).toBe('INR');
    });

    it('should create a new FX config', async () => {
      const newConfig = {
        baseCurrency: 'USD',
        targetCurrency: 'EUR',
        exchangeRate: 0.92,
        markupPercentage: 1.5,
        isActive: true
      };
      
      FXConfig.findOne.mockResolvedValue(null);
      FXConfig.create.mockResolvedValue({ _id: 'fx2', ...newConfig });

      const response = await request(app)
        .post('/api/fx-rules')
        .send(newConfig);

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.targetCurrency).toBe('EUR');
    });

    it('should fail to create a duplicate FX config', async () => {
      const duplicateConfig = {
        baseCurrency: 'USD',
        targetCurrency: 'INR',
        exchangeRate: 83.5,
        markupPercentage: 2.5,
        isActive: true
      };

      FXConfig.findOne.mockResolvedValue({ _id: 'fx1', ...duplicateConfig });

      const response = await request(app)
        .post('/api/fx-rules')
        .send(duplicateConfig);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('Payment Checkout Integration with FX Conversions', () => {
    it('should apply FX conversion and admin markup fee for different currencies', async () => {
      // Mock cart order items in USD: Total = 100 USD (including GST and discounts)
      const mockOrder = {
        _id: 'order_123',
        userId: 'mock_admin_123',
        items: [
          { productId: 'p1', name: 'Premium Plan', price: 100, quantity: 1 }
        ],
        amount: 118, // 100 + 18% GST = 118 USD
        discount: 0,
        save: jest.fn().mockResolvedValue(true)
      };

      Order.findOne.mockResolvedValue(mockOrder);

      // Mock FX rules in database: 1 USD = 80 INR with a 2.5% platform markup
      const mockFxRule = {
        _id: 'fx1',
        baseCurrency: 'USD',
        targetCurrency: 'INR',
        exchangeRate: 80.0,
        markupPercentage: 2.5,
        isActive: true
      };
      FXConfig.findOne.mockResolvedValue(mockFxRule);

      // Mock Razorpay order response
      gatewayService.createRazorpayOrder.mockResolvedValue({
        id: 'order_rzp_sim123',
        amount: 967600, // (118 USD * 80 rate * 1.025 markup) = 9676 INR -> 967600 paise
        currency: 'INR'
      });

      const response = await request(app)
        .post('/api/payments/checkout')
        .send({ currency: 'INR' });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.gateway).toBe('razorpay');
      
      // Expected conversion check:
      // Base: 118 USD
      // Converted: 118 * 80 = 9440 INR
      // Markup: 9440 * 0.025 = 236 INR
      // Final: 9440 + 236 = 9676 INR
      expect(mockOrder.amount).toBe(9676);
      expect(mockOrder.currency).toBe('INR');
      expect(mockOrder.originalAmount).toBe(118);
      expect(mockOrder.fxRate).toBe(80.0);
      expect(mockOrder.fxMarkupPct).toBe(2.5);
      expect(mockOrder.fxMarkupFee).toBe(236);
    });

    it('should reject checkout request if FX conversion target rule is missing/inactive', async () => {
      const mockOrder = {
        _id: 'order_123',
        userId: 'mock_admin_123',
        items: [
          { productId: 'p1', name: 'Premium Plan', price: 100, quantity: 1 }
        ],
        amount: 118,
        discount: 0
      };

      Order.findOne.mockResolvedValue(mockOrder);
      FXConfig.findOne.mockResolvedValue(null); // No rule found for GBP

      const response = await request(app)
        .post('/api/payments/checkout')
        .send({ currency: 'GBP' });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('FX configuration not found or inactive');
    });
  });
});

const request = require('supertest');
const app = require('../app');
const RoutingRule = require('../models/RoutingRule');
const Order = require('../models/Order');
const routingService = require('../services/routingService');
const gatewayService = require('../services/gatewayService');

jest.mock('../models/RoutingRule');
jest.mock('../models/Order');
jest.mock('../models/User'); // Mock User dependencies
jest.mock('../services/gatewayService');

// Mock protect middleware to bypass auth during test
jest.mock('../middleware/auth', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'mock_user_id_123', role: 'admin', email: 'admin@smartpay.io', name: 'System Admin' };
    next();
  }
}));

describe('Smart Routing Engine and APIs', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('routingService.evaluateRoute', () => {
    it('should route to matched gateway based on currency and amount', async () => {
      const mockRules = [
        {
          name: 'USD Rule',
          conditions: { currency: 'USD', minAmount: 0, maxAmount: 1000 },
          targetGateway: 'stripe',
          priority: 10,
          isActive: true
        },
        {
          name: 'INR Rule',
          conditions: { currency: 'INR', minAmount: 0, maxAmount: 10000 },
          targetGateway: 'razorpay',
          priority: 20,
          isActive: true
        }
      ];

      RoutingRule.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockRules)
      });

      const gatewayUSD = await routingService.evaluateRoute(500, 'USD');
      expect(gatewayUSD).toBe('stripe');

      const gatewayINR = await routingService.evaluateRoute(5000, 'INR');
      expect(gatewayINR).toBe('razorpay');
    });

    it('should fall back to default gateway when no rules match', async () => {
      RoutingRule.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });

      const gatewayUSD = await routingService.evaluateRoute(500, 'USD');
      expect(gatewayUSD).toBe('stripe');

      const gatewayINR = await routingService.evaluateRoute(500, 'INR');
      expect(gatewayINR).toBe('razorpay');
    });
  });

  describe('GET /api/routing-rules', () => {
    it('should fetch all routing rules sorted by priority', async () => {
      const mockRules = [
        { name: 'Rule A', priority: 1 },
        { name: 'Rule B', priority: 2 }
      ];

      RoutingRule.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockRules)
      });

      const response = await request(app).get('/api/routing-rules');

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data[0].name).toBe('Rule A');
    });
  });

  describe('POST /api/routing-rules', () => {
    it('should create a new routing rule', async () => {
      const newRule = {
        name: 'New Rule',
        conditions: { currency: 'USD', minAmount: 0, maxAmount: 100 },
        targetGateway: 'stripe',
        priority: 5,
        isActive: true
      };

      RoutingRule.create.mockResolvedValue(newRule);

      const response = await request(app)
        .post('/api/routing-rules')
        .send(newRule);

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Rule');
    });
  });
});

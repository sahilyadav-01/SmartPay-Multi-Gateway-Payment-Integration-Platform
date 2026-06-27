const request = require('supertest');
const app = require('../app');
const RoutingRule = require('../models/RoutingRule');
const GatewayStatus = require('../models/GatewayStatus');

jest.mock('../models/RoutingRule');
jest.mock('../models/GatewayStatus');
jest.mock('../models/User');

// Mock protect/authorize middleware to bypass auth during test
jest.mock('../middleware/auth', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'mock_admin_123', role: 'admin', email: 'admin@smartpay.io', name: 'System Admin' };
    next();
  }
}));

describe('Smart Routing Simulator Endpoints', () => {
  beforeEach(() => {
    // Mock default gateway status
    GatewayStatus.findOne.mockImplementation(({ name }) => {
      return Promise.resolve({ name, status: 'online', latencyMs: 120, errorRate: 0 });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/routing-rules/simulate', () => {
    it('should run a dry-run routing simulation with successful trace logs', async () => {
      const mockRules = [
        {
          name: 'Stripe USD Rule',
          conditions: { currency: 'USD', minAmount: 0, maxAmount: 1000 },
          targetGateway: 'stripe',
          priority: 10,
          isActive: true
        }
      ];

      RoutingRule.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockRules)
      });

      const response = await request(app)
        .post('/api/routing-rules/simulate')
        .send({
          amount: 250,
          currency: 'USD'
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.gateway).toBe('stripe');
      expect(response.body.data.trace.length).toBeGreaterThan(0);
      expect(response.body.data.trace[0]).toContain('[SIMULATOR]');
    });

    it('should respect status overrides during simulated dry-run', async () => {
      const mockRules = [
        {
          name: 'Stripe USD Rule',
          conditions: { currency: 'USD', minAmount: 0, maxAmount: 1000 },
          targetGateway: 'stripe',
          priority: 10,
          isActive: true
        }
      ];

      RoutingRule.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockRules)
      });

      const response = await request(app)
        .post('/api/routing-rules/simulate')
        .send({
          amount: 250,
          currency: 'USD',
          statusOverrides: {
            stripe: 'offline',
            razorpay: 'online'
          }
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      // Stripe offline forces fallback/failover to Razorpay!
      expect(response.body.data.gateway).toBe('razorpay');
      
      const containsWarning = response.body.data.trace.some(line => line.includes('WARNING: Target gateway "stripe" is OFFLINE'));
      expect(containsWarning).toBe(true);
    });

    it('should validate request body and reject invalid amounts', async () => {
      const response = await request(app)
        .post('/api/routing-rules/simulate')
        .send({
          amount: -10,
          currency: 'USD'
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Amount must be a non-negative number');
    });
  });
});

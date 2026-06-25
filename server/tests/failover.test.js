const request = require('supertest');
const app = require('../app');
const GatewayStatus = require('../models/GatewayStatus');
const RoutingRule = require('../models/RoutingRule');
const routingService = require('../services/routingService');

jest.mock('../models/GatewayStatus');
jest.mock('../models/RoutingRule');
jest.mock('../models/User');

// Mock protect/authorize middleware to bypass auth during test
jest.mock('../middleware/auth', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'mock_admin_123', role: 'admin', email: 'admin@smartpay.io', name: 'System Admin' };
    next();
  }
}));

describe('Gateway Health Monitoring & Auto-Failover tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('routingService.evaluateRoute failover logic', () => {
    it('should route normally to Stripe when Stripe is online', async () => {
      const mockRules = [
        {
          name: 'Stripe Rule',
          conditions: { currency: 'USD', minAmount: 0, maxAmount: 1000 },
          targetGateway: 'stripe',
          priority: 10,
          isActive: true
        }
      ];

      RoutingRule.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockRules)
      });

      // Mock gateway status lookup
      GatewayStatus.findOne.mockImplementation(({ name }) => {
        if (name === 'stripe') return Promise.resolve({ name: 'stripe', status: 'online' });
        return Promise.resolve(null);
      });

      const gateway = await routingService.evaluateRoute(100, 'USD');

      expect(gateway).toBe('stripe');
    });

    it('should automatically failover to Razorpay when Stripe is offline', async () => {
      const mockRules = [
        {
          name: 'Stripe Rule',
          conditions: { currency: 'USD', minAmount: 0, maxAmount: 1000 },
          targetGateway: 'stripe',
          priority: 10,
          isActive: true
        }
      ];

      RoutingRule.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockRules)
      });

      // Mock gateway status: stripe is offline, razorpay is online
      GatewayStatus.findOne.mockImplementation(({ name }) => {
        if (name === 'stripe') return Promise.resolve({ name: 'stripe', status: 'offline' });
        if (name === 'razorpay') return Promise.resolve({ name: 'razorpay', status: 'online' });
        return Promise.resolve(null);
      });

      const gateway = await routingService.evaluateRoute(100, 'USD');

      // Failed over from Stripe to Razorpay
      expect(gateway).toBe('razorpay');
    });
  });

  describe('GET /api/gateways/status', () => {
    it('should retrieve all gateway health statuses', async () => {
      const mockHealth = [
        { name: 'stripe', status: 'online' },
        { name: 'razorpay', status: 'offline' }
      ];

      GatewayStatus.find.mockResolvedValue(mockHealth);

      const response = await request(app).get('/api/gateways/status');

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[1].name).toBe('razorpay');
    });
  });

  describe('POST /api/gateways/status/toggle', () => {
    it('should successfully toggle gateway status', async () => {
      const mockStripe = {
        name: 'stripe',
        status: 'online',
        save: jest.fn().mockResolvedValue(true)
      };

      GatewayStatus.findOne.mockResolvedValue(mockStripe);

      const response = await request(app)
        .post('/api/gateways/status/toggle')
        .send({ name: 'stripe', status: 'offline' });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('offline');
      expect(mockStripe.save).toHaveBeenCalled();
    });
  });
});

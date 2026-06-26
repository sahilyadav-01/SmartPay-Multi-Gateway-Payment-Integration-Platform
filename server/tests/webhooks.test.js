const request = require('supertest');
const app = require('../app');
const WebhookLog = require('../models/WebhookLog');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

jest.mock('../models/WebhookLog');
jest.mock('../models/Order');
jest.mock('../models/Transaction');
jest.mock('../models/User');

// Mock protect/authorize middleware to bypass auth during test
jest.mock('../middleware/auth', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'mock_admin_123', role: 'admin', email: 'admin@smartpay.io', name: 'System Admin' };
    next();
  }
}));

describe('Webhook Logging & Retry Dashboard API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/webhooks/razorpay', () => {
    it('should log and process a successful payment.captured event', async () => {
      const mockLogSave = jest.fn().mockResolvedValue(true);
      const mockLogInstance = {
        gateway: 'razorpay',
        eventType: 'payment.captured',
        payload: {},
        status: 'pending',
        save: mockLogSave
      };
      
      WebhookLog.create.mockResolvedValue(mockLogInstance);
      Order.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: 'order_123',
          userId: 'mock_user_456',
          amount: 50,
          status: 'pending',
          items: [
            { name: 'Enterprise Failover Guide', price: 50, quantity: 1 }
          ],
          save: jest.fn().mockResolvedValue(true)
        })
      });
      User.findById.mockResolvedValue({
        _id: 'mock_user_456',
        email: 'customer@test.com',
        name: 'John Customer'
      });
      Transaction.create.mockResolvedValue({
        _id: 'tx_123',
        gateway: 'razorpay',
        transactionId: 'pay_123',
        amount: 50,
        currency: 'INR',
        status: 'success'
      });

      const response = await request(app)
        .post('/api/webhooks/razorpay')
        .send({
          event: 'payment.captured',
          payload: {
            payment: {
              entity: {
                id: 'pay_123',
                amount: 5000,
                currency: 'INR'
              }
            }
          }
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(WebhookLog.create).toHaveBeenCalled();
      expect(mockLogInstance.status).toBe('processed');
      expect(mockLogSave).toHaveBeenCalled();
    });

    it('should record log failure status if event processing throws error', async () => {
      const mockLogSave = jest.fn().mockResolvedValue(true);
      const mockLogInstance = {
        gateway: 'razorpay',
        eventType: 'payment.captured',
        payload: {},
        status: 'pending',
        save: mockLogSave
      };

      WebhookLog.create.mockResolvedValue(mockLogInstance);
      // Simulate Order search throwing error
      Order.findOne.mockImplementation(() => {
        throw new Error('Database Error');
      });

      const response = await request(app)
        .post('/api/webhooks/razorpay')
        .send({
          event: 'payment.captured',
          payload: {
            payment: {
              entity: {
                id: 'pay_123',
                amount: 5000
              }
            }
          }
        });

      expect(response.statusCode).toBe(500);
      expect(response.body.success).toBe(false);
      expect(mockLogInstance.status).toBe('failed');
      expect(mockLogInstance.errorMessage).toBe('Database Error');
      expect(mockLogSave).toHaveBeenCalled();
    });
  });

  describe('GET /api/webhooks/logs', () => {
    it('should retrieve all logged webhooks sorted by timestamp', async () => {
      const mockLogs = [
        { gateway: 'razorpay', eventType: 'payment.captured', status: 'processed' },
        { gateway: 'razorpay', eventType: 'payment.failed', status: 'failed' }
      ];

      WebhookLog.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockLogs)
      });

      const response = await request(app).get('/api/webhooks/logs');

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
    });
  });

  describe('POST /api/webhooks/logs/:id/retry', () => {
    it('should allow retrying a failed webhook and transition status back to processed', async () => {
      const mockLogSave = jest.fn().mockResolvedValue(true);
      const mockLog = {
        _id: 'log_abc',
        gateway: 'razorpay',
        eventType: 'payment.captured',
        payload: {
          payload: {
            payment: {
              entity: {
                id: 'pay_123',
                amount: 5000,
                currency: 'INR',
                order_id: 'order_123'
              }
            }
          }
        },
        status: 'failed',
        retriesCount: 0,
        errorMessage: 'Original Error',
        save: mockLogSave
      };

      WebhookLog.findById.mockResolvedValue(mockLog);
      Order.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: 'order_123',
          userId: 'mock_user_456',
          amount: 50,
          status: 'pending',
          items: [
            { name: 'Enterprise Failover Guide', price: 50, quantity: 1 }
          ],
          save: jest.fn().mockResolvedValue(true)
        })
      });
      User.findById.mockResolvedValue({
        _id: 'mock_user_456',
        email: 'customer@test.com',
        name: 'John Customer'
      });
      Transaction.create.mockResolvedValue({
        _id: 'tx_123',
        gateway: 'razorpay',
        transactionId: 'pay_123',
        amount: 50,
        currency: 'INR',
        status: 'success'
      });

      const response = await request(app)
        .post('/api/webhooks/logs/log_abc/retry');

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockLog.retriesCount).toBe(1);
      expect(mockLog.status).toBe('processed');
      expect(mockLog.errorMessage).toBe('');
      expect(mockLogSave).toHaveBeenCalled();
    });
  });
});

const request = require('supertest');
const app = require('../app');
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');

jest.mock('../models/Transaction');
jest.mock('../models/Order');
jest.mock('../models/User');

// Mock Auth protect middleware
const mockUserId = 'mock_user_123';
jest.mock('../middleware/auth', () => ({
  protect: (req, res, next) => {
    req.user = { _id: mockUserId, role: 'customer', email: 'john@example.com', name: 'John Doe' };
    next();
  }
}));

describe('Customer Portal API Access Guards', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/payments/transactions', () => {
    it('should return transaction history scoped to logged-in user', async () => {
      const mockTransactions = [
        { _id: 'tx1', userId: mockUserId, gateway: 'stripe', amount: 50, currency: 'USD', status: 'success' }
      ];

      // Simulate find query filter scoping to user
      const mockPopulate = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockTransactions)
      });
      Transaction.find.mockReturnValue({
        populate: mockPopulate
      });

      const response = await request(app).get('/api/payments/transactions');

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(Transaction.find).toHaveBeenCalledWith({ userId: mockUserId });
    });
  });

  describe('GET /api/payments/invoice/:orderId', () => {
    it('should prevent user from downloading other users invoices', async () => {
      const otherUserId = 'other_user_456';
      const mockOrder = {
        _id: 'order123',
        userId: otherUserId,
        amount: 50,
        status: 'captured'
      };

      Order.findById.mockResolvedValue(mockOrder);

      const response = await request(app).get('/api/payments/invoice/order123');

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized to download this invoice');
    });

    it('should allow user to download their own invoice if pdf file exists', async () => {
      const mockOrder = {
        _id: 'order123',
        userId: mockUserId,
        amount: 50,
        status: 'captured'
      };

      Order.findById.mockResolvedValue(mockOrder);
      
      // Mock path and fs.existsSync to simulate file not found (yielding 404 instead of 403 authorization block)
      const fs = require('fs');
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      const response = await request(app).get('/api/payments/invoice/order123');

      // Yields 404 since PDF doesn't exist, but passes 403 Auth check successfully!
      expect(response.statusCode).toBe(404);
      expect(response.body.message).toContain('Invoice file does not exist');
      
      fs.existsSync.mockRestore();
    });
  });
});

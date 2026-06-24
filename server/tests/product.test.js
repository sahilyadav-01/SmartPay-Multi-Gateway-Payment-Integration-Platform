const request = require('supertest');
const app = require('../app');
const Product = require('../models/Product');

jest.mock('../models/Product'); // Mock Mongoose Product model methods

describe('Product Catalog API Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should list all products in catalog', async () => {
      const mockProducts = [
        { _id: '1', name: 'Product A', price: 99, category: 'Tech' },
        { _id: '2', name: 'Product B', price: 149, category: 'Apparel' }
      ];

      Product.find.mockResolvedValue(mockProducts);

      const response = await request(app).get('/api/products');

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data[0].name).toBe('Product A');
    });

    it('should query products by category filter', async () => {
      Product.find.mockResolvedValue([]);

      const response = await request(app).get('/api/products?category=Tech');

      expect(response.statusCode).toBe(200);
      expect(Product.find).toHaveBeenCalledWith({ category: 'Tech' });
    });
  });
});

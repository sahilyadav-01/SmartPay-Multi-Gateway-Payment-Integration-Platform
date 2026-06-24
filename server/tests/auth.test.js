const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

jest.mock('../models/User'); // Mock the User model methods

describe('Authentication API Endpoint Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a new user', async () => {
      const mockUserPayload = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '1234567890',
        password: 'password123',
        role: 'customer'
      };

      User.findOne.mockResolvedValue(null); // Simulate user does not exist yet
      User.create.mockResolvedValue({
        _id: 'mock_user_id_123',
        name: mockUserPayload.name,
        email: mockUserPayload.email,
        phone: mockUserPayload.phone,
        role: mockUserPayload.role,
        createdAt: new Date()
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(mockUserPayload);

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user.email).toBe(mockUserPayload.email);
    });

    it('should reject registration if email is already taken', async () => {
      const mockUserPayload = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123'
      };

      User.findOne.mockResolvedValue({ email: 'jane@example.com' }); // User exists

      const response = await request(app)
        .post('/api/auth/register')
        .send(mockUserPayload);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate user and return tokens', async () => {
      const mockLoginPayload = {
        email: 'jane@example.com',
        password: 'password123'
      };

      const mockMatchPassword = jest.fn().mockResolvedValue(true);
      const mockUserInstance = {
        _id: 'mock_user_id_123',
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '1234567890',
        role: 'customer',
        matchPassword: mockMatchPassword
      };

      // Mock chain for findOne to include password select mock
      const mockSelect = jest.fn().mockResolvedValue(mockUserInstance);
      User.findOne.mockReturnValue({ select: mockSelect });

      const response = await request(app)
        .post('/api/auth/login')
        .send(mockLoginPayload);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user.email).toBe(mockLoginPayload.email);
    });

    it('should reject invalid credentials', async () => {
      const mockLoginPayload = {
        email: 'jane@example.com',
        password: 'wrongpassword'
      };

      const mockMatchPassword = jest.fn().mockResolvedValue(false);
      const mockUserInstance = {
        matchPassword: mockMatchPassword
      };

      const mockSelect = jest.fn().mockResolvedValue(mockUserInstance);
      User.findOne.mockReturnValue({ select: mockSelect });

      const response = await request(app)
        .post('/api/auth/login')
        .send(mockLoginPayload);

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});

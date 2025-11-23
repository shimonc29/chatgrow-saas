const authMiddleware = require('./auth');
const User = require('../models/User');
const { generateTestToken, createMockUser, cleanupMocks } = require('../testUtils');

// Mock User model
jest.mock('../models/User');

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      query: {},
      user: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    cleanupMocks();
  });

  describe('authenticateJWT', () => {
    it('should authenticate valid JWT token from header', async () => {
      const mockUser = createMockUser();
      const token = generateTestToken(mockUser._id.toString());

      req.headers.authorization = `Bearer ${token}`;
      User.findById.mockResolvedValue(mockUser);

      await authMiddleware.authenticateJWT(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual(mockUser);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject missing token', async () => {
      await authMiddleware.authenticateJWT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('token'),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await authMiddleware.authenticateJWT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject token for non-existent user', async () => {
      const token = generateTestToken('non-existent-user-id');
      req.headers.authorization = `Bearer ${token}`;
      User.findById.mockResolvedValue(null);

      await authMiddleware.authenticateJWT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authenticateApiKey', () => {
    it('should authenticate valid API key', async () => {
      const mockUser = createMockUser({
        apiKeys: [
          {
            key: 'valid-api-key',
            name: 'Test Key',
            active: true,
            createdAt: new Date(),
          },
        ],
      });

      req.headers['x-api-key'] = 'valid-api-key';
      User.findOne.mockResolvedValue(mockUser);

      await authMiddleware.authenticateApiKey()(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual(mockUser);
    });

    it('should reject missing API key', async () => {
      await authMiddleware.authenticateApiKey()(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid API key', async () => {
      req.headers['x-api-key'] = 'invalid-api-key';
      User.findOne.mockResolvedValue(null);

      await authMiddleware.authenticateApiKey()(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject inactive API key', async () => {
      const mockUser = createMockUser({
        apiKeys: [
          {
            key: 'inactive-api-key',
            name: 'Inactive Key',
            active: false,
            createdAt: new Date(),
          },
        ],
      });

      req.headers['x-api-key'] = 'inactive-api-key';
      User.findOne.mockResolvedValue(mockUser);

      await authMiddleware.authenticateApiKey()(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

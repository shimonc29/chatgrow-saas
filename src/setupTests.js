// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-minimum-32-chars';
process.env.MONGODB_URI = 'mongodb://localhost:27017/chatgrow-test';
process.env.DATABASE_URL = 'postgresql://localhost/chatgrow-test';
process.env.REDIS_URL = 'redis://localhost:6379';

// Suppress console output during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

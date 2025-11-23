const request = require('supertest');
const express = require('express');
const webhooksRouter = require('./webhooks');
const Customer = require('../models/Customer');
const Appointment = require('../models/Appointment');
const Event = require('../models/Event');
const { createMockUser, createMockCustomer, cleanupMocks } = require('../testUtils');

// Mock models
jest.mock('../models/Customer');
jest.mock('../models/Appointment');
jest.mock('../models/Event');

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
  authenticateApiKey: () => (req, res, next) => {
    req.user = createMockUser();
    next();
  },
}));

// Mock logger
jest.mock('../utils/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarning: jest.fn(),
}));

describe('Webhooks API', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/webhooks', webhooksRouter);
  });

  afterEach(() => {
    cleanupMocks();
  });

  describe('POST /webhooks/customers', () => {
    it('should create a new customer successfully', async () => {
      const customerData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '050-1234567',
        notes: 'VIP customer',
      };

      Customer.findOne.mockResolvedValue(null);
      Customer.prototype.save = jest.fn().mockResolvedValue({
        _id: 'new-customer-id',
        ...customerData,
        createdAt: new Date(),
      });

      const response = await request(app)
        .post('/webhooks/customers')
        .set('X-API-Key', 'test-api-key')
        .send(customerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.customer).toHaveProperty('id');
      expect(response.body.customer.name).toBe(customerData.name);
      expect(response.body.customer.email).toBe(customerData.email);
    });

    it('should reject customer without required fields', async () => {
      const response = await request(app)
        .post('/webhooks/customers')
        .set('X-API-Key', 'test-api-key')
        .send({ name: 'John Doe' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });

    it('should reject duplicate customer email', async () => {
      const existingCustomer = createMockCustomer('provider-id');
      Customer.findOne.mockResolvedValue(existingCustomer);

      const response = await request(app)
        .post('/webhooks/customers')
        .set('X-API-Key', 'test-api-key')
        .send({
          name: 'John Doe',
          email: 'existing@example.com',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('DUPLICATE_CUSTOMER');
    });
  });

  describe('GET /webhooks/customers/:email', () => {
    it('should get customer by email', async () => {
      const mockCustomer = createMockCustomer('provider-id');
      Customer.findOne.mockResolvedValue(mockCustomer);

      const response = await request(app)
        .get('/webhooks/customers/test@example.com')
        .set('X-API-Key', 'test-api-key')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.customer).toBeDefined();
    });

    it('should return 404 for non-existent customer', async () => {
      Customer.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/webhooks/customers/nonexistent@example.com')
        .set('X-API-Key', 'test-api-key')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('NOT_FOUND');
    });
  });

  describe('POST /webhooks/appointments', () => {
    it('should create appointment successfully', async () => {
      const mockCustomer = createMockCustomer('provider-id');
      Customer.findOne.mockResolvedValue(mockCustomer);
      Appointment.findOne.mockResolvedValue(null);
      Appointment.prototype.save = jest.fn().mockResolvedValue({
        _id: 'new-appointment-id',
        customer: mockCustomer._id,
        date: new Date('2025-12-25'),
        time: '10:00',
        serviceType: 'consultation',
        status: 'confirmed',
      });

      const response = await request(app)
        .post('/webhooks/appointments')
        .set('X-API-Key', 'test-api-key')
        .send({
          customerEmail: 'customer@example.com',
          date: '2025-12-25',
          time: '10:00',
          serviceType: 'consultation',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.appointment).toBeDefined();
    });

    it('should reject appointment without required fields', async () => {
      const response = await request(app)
        .post('/webhooks/appointments')
        .set('X-API-Key', 'test-api-key')
        .send({ customerEmail: 'test@example.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });

    it('should reject appointment for non-existent customer', async () => {
      Customer.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/webhooks/appointments')
        .set('X-API-Key', 'test-api-key')
        .send({
          customerEmail: 'nonexistent@example.com',
          date: '2025-12-25',
          time: '10:00',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('CUSTOMER_NOT_FOUND');
    });

    it('should reject conflicting appointment time', async () => {
      const mockCustomer = createMockCustomer('provider-id');
      Customer.findOne.mockResolvedValue(mockCustomer);

      const existingAppointment = {
        _id: 'existing-appointment',
        date: new Date('2025-12-25'),
        time: '10:00',
        status: 'confirmed',
      };
      Appointment.findOne.mockResolvedValue(existingAppointment);

      const response = await request(app)
        .post('/webhooks/appointments')
        .set('X-API-Key', 'test-api-key')
        .send({
          customerEmail: 'customer@example.com',
          date: '2025-12-25',
          time: '10:00',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('TIME_CONFLICT');
    });
  });

  describe('POST /webhooks/events', () => {
    it('should create event successfully', async () => {
      Event.prototype.save = jest.fn().mockResolvedValue({
        _id: 'new-event-id',
        title: 'Test Event',
        date: new Date('2025-12-25'),
        status: 'active',
      });

      const response = await request(app)
        .post('/webhooks/events')
        .set('X-API-Key', 'test-api-key')
        .send({
          title: 'Test Event',
          date: '2025-12-25',
          time: '18:00',
          location: 'Test Location',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.event).toBeDefined();
    });

    it('should reject event without required fields', async () => {
      const response = await request(app)
        .post('/webhooks/events')
        .set('X-API-Key', 'test-api-key')
        .send({ title: 'Test Event' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });
  });
});

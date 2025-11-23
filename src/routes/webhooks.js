const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Customer = require('../models/Customer');
const Appointment = require('../models/Appointment');
const Event = require('../models/Event');
const { logInfo, logError, logWarning } = require('../utils/logger');
const { validatePasswordStrength } = require('../utils/encryption');

/**
 * @swagger
 * tags:
 *   - name: Webhooks - Customers
 *     description: API לניהול לקוחות דרך webhook
 *   - name: Webhooks - Appointments
 *     description: API לניהול תורים דרך webhook
 *   - name: Webhooks - Events
 *     description: API לניהול אירועים דרך webhook
 */

// ============================================
// CUSTOMERS WEBHOOKS
// ============================================

/**
 * @swagger
 * /webhooks/customers:
 *   post:
 *     summary: יצירת לקוח חדש
 *     tags: [Webhooks - Customers]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Customer'
 *     responses:
 *       201:
 *         description: לקוח נוצר בהצלחה
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 customer:
 *                   $ref: '#/components/schemas/Customer'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/customers', authMiddleware.authenticateApiKey(), async (req, res) => {
    try {
        const { name, email, phone, notes } = req.body;

        // Validation
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Name and email are required',
                error: 'VALIDATION_ERROR'
            });
        }

        // Check if customer already exists
        const existingCustomer = await Customer.findOne({
            email,
            providerId: req.user._id
        });

        if (existingCustomer) {
            return res.status(409).json({
                success: false,
                message: 'Customer with this email already exists',
                error: 'DUPLICATE_CUSTOMER'
            });
        }

        // Create customer
        const customer = new Customer({
            name,
            email,
            phone: phone || null,
            notes: notes || null,
            providerId: req.user._id,
            source: 'webhook',
            tags: ['webhook-import']
        });

        await customer.save();

        logInfo('Customer created via webhook', {
            customerId: customer._id,
            email,
            providerId: req.user._id
        });

        res.status(201).json({
            success: true,
            customer: {
                id: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                createdAt: customer.createdAt
            }
        });

    } catch (error) {
        logError('Error creating customer via webhook', error, {
            providerId: req.user._id
        });

        res.status(500).json({
            success: false,
            message: 'Failed to create customer',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /webhooks/customers/{email}:
 *   get:
 *     summary: קבלת פרטי לקוח לפי אימייל
 *     tags: [Webhooks - Customers]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: אימייל הלקוח
 *     responses:
 *       200:
 *         description: פרטי הלקוח
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 customer:
 *                   $ref: '#/components/schemas/Customer'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/customers/:email', authMiddleware.authenticateApiKey(), async (req, res) => {
    try {
        const { email } = req.params;

        const customer = await Customer.findOne({
            email,
            providerId: req.user._id
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
                error: 'NOT_FOUND'
            });
        }

        res.json({
            success: true,
            customer: {
                id: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                notes: customer.notes,
                createdAt: customer.createdAt,
                updatedAt: customer.updatedAt
            }
        });

    } catch (error) {
        logError('Error fetching customer via webhook', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer',
            error: error.message
        });
    }
});

// ============================================
// APPOINTMENTS WEBHOOKS
// ============================================

/**
 * @swagger
 * /webhooks/appointments:
 *   post:
 *     summary: יצירת תור חדש
 *     tags: [Webhooks - Appointments]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appointment'
 *     responses:
 *       201:
 *         description: תור נוצר בהצלחה
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 appointment:
 *                   $ref: '#/components/schemas/Appointment'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: לקוח לא נמצא
 */
router.post('/appointments', authMiddleware.authenticateApiKey(), async (req, res) => {
    try {
        const { customerEmail, date, time, serviceType, duration, notes } = req.body;

        // Validation
        if (!customerEmail || !date || !time) {
            return res.status(400).json({
                success: false,
                message: 'Customer email, date, and time are required',
                error: 'VALIDATION_ERROR'
            });
        }

        // Find customer
        const customer = await Customer.findOne({
            email: customerEmail,
            providerId: req.user._id
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found. Please create the customer first.',
                error: 'CUSTOMER_NOT_FOUND'
            });
        }

        // Check for conflicts
        const appointmentDate = new Date(date);
        const existingAppointment = await Appointment.findOne({
            providerId: req.user._id,
            date: appointmentDate,
            time: time,
            status: { $ne: 'cancelled' }
        });

        if (existingAppointment) {
            return res.status(409).json({
                success: false,
                message: 'Time slot is already booked',
                error: 'TIME_CONFLICT'
            });
        }

        // Create appointment
        const appointment = new Appointment({
            customer: customer._id,
            providerId: req.user._id,
            date: appointmentDate,
            time,
            serviceType: serviceType || 'other',
            duration: duration || 60,
            notes: notes || null,
            status: 'confirmed',
            source: 'webhook'
        });

        await appointment.save();

        logInfo('Appointment created via webhook', {
            appointmentId: appointment._id,
            customerEmail,
            date,
            time,
            providerId: req.user._id
        });

        res.status(201).json({
            success: true,
            appointment: {
                id: appointment._id,
                customerId: customer._id,
                customerName: customer.name,
                customerEmail: customer.email,
                date: appointment.date,
                time: appointment.time,
                serviceType: appointment.serviceType,
                duration: appointment.duration,
                status: appointment.status,
                createdAt: appointment.createdAt
            }
        });

    } catch (error) {
        logError('Error creating appointment via webhook', error);

        res.status(500).json({
            success: false,
            message: 'Failed to create appointment',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /webhooks/appointments/{id}:
 *   delete:
 *     summary: ביטול תור
 *     tags: [Webhooks - Appointments]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: מזהה התור
 *     responses:
 *       200:
 *         description: התור בוטל בהצלחה
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/appointments/:id', authMiddleware.authenticateApiKey(), async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await Appointment.findOne({
            _id: id,
            providerId: req.user._id
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found',
                error: 'NOT_FOUND'
            });
        }

        appointment.status = 'cancelled';
        await appointment.save();

        logInfo('Appointment cancelled via webhook', {
            appointmentId: id,
            providerId: req.user._id
        });

        res.json({
            success: true,
            message: 'Appointment cancelled successfully'
        });

    } catch (error) {
        logError('Error cancelling appointment via webhook', error);

        res.status(500).json({
            success: false,
            message: 'Failed to cancel appointment',
            error: error.message
        });
    }
});

// ============================================
// EVENTS WEBHOOKS
// ============================================

/**
 * @swagger
 * /webhooks/events:
 *   post:
 *     summary: יצירת אירוע חדש
 *     tags: [Webhooks - Events]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       201:
 *         description: אירוע נוצר בהצלחה
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/events', authMiddleware.authenticateApiKey(), async (req, res) => {
    try {
        const { title, description, date, time, location, maxParticipants, price } = req.body;

        // Validation
        if (!title || !date) {
            return res.status(400).json({
                success: false,
                message: 'Title and date are required',
                error: 'VALIDATION_ERROR'
            });
        }

        // Create event
        const event = new Event({
            title,
            description: description || null,
            date: new Date(date),
            time: time || null,
            location: location || null,
            maxParticipants: maxParticipants || null,
            price: price || 0,
            providerId: req.user._id,
            status: 'active',
            source: 'webhook'
        });

        await event.save();

        logInfo('Event created via webhook', {
            eventId: event._id,
            title,
            date,
            providerId: req.user._id
        });

        res.status(201).json({
            success: true,
            event: {
                id: event._id,
                title: event.title,
                description: event.description,
                date: event.date,
                time: event.time,
                location: event.location,
                maxParticipants: event.maxParticipants,
                price: event.price,
                status: event.status,
                createdAt: event.createdAt
            }
        });

    } catch (error) {
        logError('Error creating event via webhook', error);

        res.status(500).json({
            success: false,
            message: 'Failed to create event',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /webhooks/events:
 *   get:
 *     summary: קבלת רשימת אירועים
 *     tags: [Webhooks - Events]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, cancelled]
 *         description: סינון לפי סטטוס
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: מספר תוצאות מקסימלי
 *     responses:
 *       200:
 *         description: רשימת אירועים
 */
router.get('/events', authMiddleware.authenticateApiKey(), async (req, res) => {
    try {
        const { status, limit = 50 } = req.query;

        const query = { providerId: req.user._id };
        if (status) {
            query.status = status;
        }

        const events = await Event.find(query)
            .limit(parseInt(limit))
            .sort({ date: -1 });

        res.json({
            success: true,
            count: events.length,
            events: events.map(event => ({
                id: event._id,
                title: event.title,
                description: event.description,
                date: event.date,
                time: event.time,
                location: event.location,
                maxParticipants: event.maxParticipants,
                currentParticipants: event.registrations ? event.registrations.length : 0,
                price: event.price,
                status: event.status
            }))
        });

    } catch (error) {
        logError('Error fetching events via webhook', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch events',
            error: error.message
        });
    }
});

module.exports = router;

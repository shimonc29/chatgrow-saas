
const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const EventService = require('../services/eventService');
const authMiddleware = require('../middleware/auth');
const { logApiRequest } = require('../utils/logger');

const eventService = new EventService();

// Get all events for business
router.get('/', authMiddleware, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { status, category, startDate, limit } = req.query;
        const filters = { status, category, startDate, limit };
        
        const result = await eventService.getBusinessEvents(req.user.id, filters);
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime, {
            businessId: req.user.id,
            eventCount: result.events?.length || 0
        });
        
        res.json(result);
        
    } catch (error) {
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create new event
router.post('/', authMiddleware, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const result = await eventService.createEvent(req.user.id, req.body);
        
        const statusCode = result.success ? 201 : 400;
        logApiRequest(req.method, req.originalUrl, statusCode, Date.now() - startTime, {
            businessId: req.user.id,
            eventName: req.body.name
        });
        
        res.status(statusCode).json(result);
        
    } catch (error) {
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get specific event
router.get('/:eventId', authMiddleware, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const event = await Event.findOne({
            _id: req.params.eventId,
            businessId: req.user.id
        });
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'אירוע לא נמצא'
            });
        }
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime);
        res.json({
            success: true,
            event
        });
        
    } catch (error) {
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update event
router.put('/:eventId', authMiddleware, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const event = await Event.findOneAndUpdate(
            { _id: req.params.eventId, businessId: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'אירוע לא נמצא'
            });
        }
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime);
        res.json({
            success: true,
            event,
            message: 'אירוע עודכן בהצלחה'
        });
        
    } catch (error) {
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Delete event
router.delete('/:eventId', authMiddleware, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const event = await Event.findOne({
            _id: req.params.eventId,
            businessId: req.user.id
        });
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'אירוע לא נמצא'
            });
        }
        
        // Cancel event and notify participants
        event.status = 'cancelled';
        await event.save();
        
        // Send cancellation messages to all confirmed participants
        const registrations = await Registration.find({
            eventId: req.params.eventId,
            status: 'confirmed'
        });
        
        // TODO: Send cancellation messages via WhatsApp
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime);
        res.json({
            success: true,
            message: 'אירוע בוטל בהצלחה',
            notifiedParticipants: registrations.length
        });
        
    } catch (error) {
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get event registrations
router.get('/:eventId/registrations', authMiddleware, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { status } = req.query;
        const result = await eventService.getEventRegistrations(req.params.eventId, status);
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime);
        res.json(result);
        
    } catch (error) {
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Send reminders
router.post('/:eventId/reminders', authMiddleware, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { reminderType } = req.body;
        const result = await eventService.sendReminders(req.params.eventId, reminderType);
        
        const statusCode = result.success ? 200 : 400;
        logApiRequest(req.method, req.originalUrl, statusCode, Date.now() - startTime);
        res.status(statusCode).json(result);
        
    } catch (error) {
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Public registration endpoint (no auth required)
router.post('/:eventId/register', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { participant, customFieldResponses } = req.body;
        const result = await eventService.registerParticipant(
            req.params.eventId,
            participant,
            customFieldResponses
        );
        
        const statusCode = result.success ? 201 : 400;
        logApiRequest(req.method, req.originalUrl, statusCode, Date.now() - startTime, {
            eventId: req.params.eventId,
            participantEmail: participant?.email
        });
        
        res.status(statusCode).json(result);
        
    } catch (error) {
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Cancel registration
router.delete('/registrations/:registrationId', authMiddleware, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { reason } = req.body;
        const result = await eventService.cancelRegistration(req.params.registrationId, reason);
        
        const statusCode = result.success ? 200 : 400;
        logApiRequest(req.method, req.originalUrl, statusCode, Date.now() - startTime);
        res.status(statusCode).json(result);
        
    } catch (error) {
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;

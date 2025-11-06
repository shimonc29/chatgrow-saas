
const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const EventService = require('../services/eventService');
const jwt = require('jsonwebtoken');
const { logApiRequest } = require('../utils/logger');

// Provider authentication middleware
const verifyProviderToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'נדרש טוקן גישה' });
    }
    
    try {
        const decoded = jwt.verify(token, 'your-secret-key');
        req.provider = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'טוקן לא חוקי' });
    }
};

const eventService = new EventService();

// Get all events for business
router.get('/', verifyProviderToken, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { status, category, startDate, limit } = req.query;
        const filters = { status, category, startDate, limit };
        
        const result = await eventService.getBusinessEvents(req.provider.providerId, filters);
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime, {
            businessId: req.provider.providerId,
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
router.post('/', verifyProviderToken, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const result = await eventService.createEvent(req.provider.providerId, req.body);
        
        const statusCode = result.success ? 201 : 400;
        logApiRequest(req.method, req.originalUrl, statusCode, Date.now() - startTime, {
            businessId: req.provider.providerId,
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
router.get('/:eventId', verifyProviderToken, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const event = await Event.findOne({
            _id: req.params.eventId,
            businessId: req.provider.providerId
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
router.put('/:eventId', verifyProviderToken, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const event = await Event.findOneAndUpdate(
            { _id: req.params.eventId, businessId: req.provider.providerId },
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
router.delete('/:eventId', verifyProviderToken, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const event = await Event.findOne({
            _id: req.params.eventId,
            businessId: req.provider.providerId
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
router.get('/:eventId/registrations', verifyProviderToken, async (req, res) => {
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
router.post('/:eventId/reminders', verifyProviderToken, async (req, res) => {
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
router.delete('/registrations/:registrationId', verifyProviderToken, async (req, res) => {
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

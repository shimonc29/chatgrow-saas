const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const authMiddleware = require('../middleware/auth');
const { logApiRequest } = require('../utils/logger');

// Get all appointments for business
router.get('/', authMiddleware.authenticate(), async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { status, date } = req.query;
        const query = { businessId: req.user.id };
        
        if (status) {
            query.status = status;
        }
        
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            query.appointmentDate = { $gte: startDate, $lt: endDate };
        }
        
        const appointments = await Appointment.find(query).sort({ appointmentDate: 1, startTime: 1 });
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime, {
            businessId: req.user.id,
            appointmentCount: appointments.length
        });
        
        res.json({
            success: true,
            appointments
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

// Create new appointment
router.post('/', authMiddleware.authenticate(), async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { customerName, service, date, time, notes } = req.body;
        
        // Split full name into firstName and lastName
        const nameParts = customerName.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || firstName;
        
        // Calculate end time (assume 60 minutes if not specified)
        const duration = 60;
        const [hours, minutes] = time.split(':').map(Number);
        const endHours = hours + Math.floor((minutes + duration) / 60);
        const endMinutes = (minutes + duration) % 60;
        const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
        
        const appointment = new Appointment({
            businessId: req.user.id,
            serviceType: 'consultation',
            serviceName: service,
            customer: {
                firstName,
                lastName,
                phone: '000-0000000', // Default, should be updated
                notes
            },
            appointmentDate: new Date(date),
            startTime: time,
            endTime,
            duration,
            status: 'scheduled'
        });
        
        await appointment.save();
        
        logApiRequest(req.method, req.originalUrl, 201, Date.now() - startTime, {
            businessId: req.user.id,
            serviceName: service
        });
        
        res.status(201).json({
            success: true,
            appointment,
            message: 'תור נקבע בהצלחה'
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

// Get specific appointment
router.get('/:appointmentId', authMiddleware.authenticate(), async (req, res) => {
    const startTime = Date.now();
    
    try {
        const appointment = await Appointment.findOne({
            _id: req.params.appointmentId,
            businessId: req.user.id
        });
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'תור לא נמצא'
            });
        }
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime);
        res.json({
            success: true,
            appointment
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

// Update appointment
router.put('/:appointmentId', authMiddleware.authenticate(), async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { customerName, service, date, time, notes, status } = req.body;
        
        const updateData = {};
        
        if (customerName) {
            const nameParts = customerName.trim().split(' ');
            updateData['customer.firstName'] = nameParts[0];
            updateData['customer.lastName'] = nameParts.slice(1).join(' ') || nameParts[0];
        }
        
        if (service) updateData.serviceName = service;
        if (date) updateData.appointmentDate = new Date(date);
        if (time) updateData.startTime = time;
        if (notes !== undefined) updateData['customer.notes'] = notes;
        if (status) updateData.status = status;
        
        const appointment = await Appointment.findOneAndUpdate(
            { _id: req.params.appointmentId, businessId: req.user.id },
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'תור לא נמצא'
            });
        }
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime);
        res.json({
            success: true,
            appointment,
            message: 'תור עודכן בהצלחה'
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

// Update appointment status
router.patch('/:appointmentId/status', authMiddleware.authenticate(), async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { status } = req.body;
        
        const appointment = await Appointment.findOneAndUpdate(
            { _id: req.params.appointmentId, businessId: req.user.id },
            { status },
            { new: true, runValidators: true }
        );
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'תור לא נמצא'
            });
        }
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime);
        res.json({
            success: true,
            appointment,
            message: 'סטטוס התור עודכן בהצלחה'
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

// Delete appointment
router.delete('/:appointmentId', authMiddleware.authenticate(), async (req, res) => {
    const startTime = Date.now();
    
    try {
        const appointment = await Appointment.findOneAndUpdate(
            { _id: req.params.appointmentId, businessId: req.user.id },
            { status: 'cancelled' },
            { new: true }
        );
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'תור לא נמצא'
            });
        }
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime);
        res.json({
            success: true,
            message: 'תור בוטל בהצלחה'
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

module.exports = router;

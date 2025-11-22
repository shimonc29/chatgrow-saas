const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { logApiRequest } = require('../utils/logger');

// Import the shared verifyProviderToken middleware from auth routes
const authRouter = require('./auth');
const verifyProviderToken = authRouter.verifyProviderToken;

// Get all appointments for business
router.get('/', verifyProviderToken, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { status, date } = req.query;
        const query = { businessId: req.provider.providerId };
        
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
            businessId: req.provider.providerId,
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
router.post('/', verifyProviderToken, async (req, res) => {
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
            businessId: req.provider.providerId,
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
            businessId: req.provider.providerId,
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

// Quick create appointment from calendar
router.post('/quick-create', verifyProviderToken, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { 
            appointmentDate, 
            startTime: appointmentStartTime, 
            endTime: appointmentEndTime, 
            customerId,
            customerName,
            customerPhone,
            serviceName,
            notes 
        } = req.body;

        // Validation
        if (!appointmentDate || !appointmentStartTime || !appointmentEndTime) {
            return res.status(400).json({
                success: false,
                message: 'חסרים שדות חובה: תאריך, שעת התחלה ושעת סיום'
            });
        }

        // Calculate duration in minutes
        const [startHour, startMin] = appointmentStartTime.split(':').map(Number);
        const [endHour, endMin] = appointmentEndTime.split(':').map(Number);
        const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

        // Validate time range
        if (durationMinutes <= 0) {
            return res.status(400).json({
                success: false,
                message: 'שעת הסיום חייבת להיות אחרי שעת ההתחלה'
            });
        }

        // Parse customer name
        let firstName, lastName;
        if (customerName) {
            const nameParts = customerName.trim().split(' ');
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ') || firstName;
        } else {
            firstName = 'לקוח';
            lastName = 'חדש';
        }

        const appointment = new Appointment({
            businessId: req.provider.providerId,
            serviceType: 'consultation',
            serviceName: serviceName || 'פגישה',
            customer: {
                customerId: customerId || null,
                firstName,
                lastName,
                phone: customerPhone || '000-0000000',
                notes: notes || ''
            },
            appointmentDate: new Date(appointmentDate),
            startTime: appointmentStartTime,
            endTime: appointmentEndTime,
            duration: durationMinutes,
            status: 'scheduled',
            price: 0,
            paymentStatus: 'pending'
        });
        
        await appointment.save();
        
        logApiRequest(req.method, req.originalUrl, 201, Date.now() - startTime, {
            businessId: req.provider.providerId,
            appointmentDate
        });
        
        res.status(201).json({
            success: true,
            appointment,
            message: 'פגישה נוצרה בהצלחה'
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
router.get('/:appointmentId', verifyProviderToken, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const appointment = await Appointment.findOne({
            _id: req.params.appointmentId,
            businessId: req.provider.providerId
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
router.put('/:appointmentId', verifyProviderToken, async (req, res) => {
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
            { _id: req.params.appointmentId, businessId: req.provider.providerId },
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
router.patch('/:appointmentId/status', verifyProviderToken, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { status } = req.body;
        
        const appointment = await Appointment.findOneAndUpdate(
            { _id: req.params.appointmentId, businessId: req.provider.providerId },
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
router.delete('/:appointmentId', verifyProviderToken, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const appointment = await Appointment.findOneAndUpdate(
            { _id: req.params.appointmentId, businessId: req.provider.providerId },
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

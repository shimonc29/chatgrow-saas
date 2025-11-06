const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Customer = require('../models/Customer');
const Appointment = require('../models/Appointment');
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

// Get dashboard statistics
router.get('/', verifyProviderToken, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const businessId = req.provider.providerId;
        const now = new Date();
        
        // Calculate date ranges
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Get counts in parallel
        const [
            totalEvents,
            activeEvents,
            upcomingEvents,
            totalCustomers,
            newCustomersWeek,
            newCustomersMonth,
            totalAppointments,
            todayAppointments,
            weekAppointments,
            upcomingEventsList,
            recentCustomers
        ] = await Promise.all([
            // Events stats
            Event.countDocuments({ businessId }),
            Event.countDocuments({ businessId, status: 'published' }),
            Event.countDocuments({ 
                businessId, 
                status: 'published',
                startDateTime: { $gte: new Date() }
            }),
            
            // Customers stats
            Customer.countDocuments({ businessId }),
            Customer.countDocuments({ 
                businessId, 
                createdAt: { $gte: weekStart }
            }),
            Customer.countDocuments({ 
                businessId, 
                createdAt: { $gte: monthStart }
            }),
            
            // Appointments stats
            Appointment.countDocuments({ businessId }),
            Appointment.countDocuments({ 
                businessId,
                appointmentDate: { $gte: todayStart }
            }),
            Appointment.countDocuments({ 
                businessId,
                appointmentDate: { $gte: weekStart }
            }),
            
            // Upcoming events
            Event.find({ 
                businessId,
                status: 'published',
                startDateTime: { $gte: new Date() }
            })
            .sort({ startDateTime: 1 })
            .limit(5)
            .select('name startDateTime endDateTime location maxParticipants currentParticipants'),
            
            // Recent customers
            Customer.find({ businessId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('firstName lastName phone email createdAt')
        ]);
        
        // Calculate revenue (mock for now - will integrate with payment system later)
        const totalRevenue = totalAppointments * 150; // Average ₪150 per appointment
        const monthRevenue = weekAppointments * 150;
        
        const stats = {
            success: true,
            data: {
                overview: {
                    totalEvents,
                    activeEvents,
                    upcomingEvents,
                    totalCustomers,
                    newCustomersWeek,
                    newCustomersMonth,
                    totalAppointments,
                    todayAppointments,
                    weekAppointments,
                    totalRevenue,
                    monthRevenue
                },
                upcomingEvents: upcomingEventsList.map(event => ({
                    _id: event._id,
                    name: event.name,
                    startDateTime: event.startDateTime,
                    endDateTime: event.endDateTime,
                    location: event.location?.address?.street || 'לא צוין',
                    participants: `${event.currentParticipants || 0}/${event.maxParticipants}`
                })),
                recentCustomers: recentCustomers.map(customer => ({
                    _id: customer._id,
                    name: `${customer.firstName} ${customer.lastName}`,
                    phone: customer.phone,
                    email: customer.email,
                    createdAt: customer.createdAt
                }))
            }
        };
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime, {
            businessId
        });
        
        res.json(stats);
        
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

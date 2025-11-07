const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isSuperAdmin = require('../middleware/superAdmin');
const { pool } = require('../db/postgres');
const Event = require('../models/Event');
const Customer = require('../models/Customer');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');

router.get('/stats', auth, isSuperAdmin, async (req, res) => {
  try {
    const subscribersResult = await pool.query(`
      SELECT 
        id,
        email,
        profile,
        subscription,
        created_at,
        updated_at
      FROM subscribers
      ORDER BY created_at DESC
    `);

    const subscribers = subscribersResult.rows;

    const userIds = subscribers.map(s => s.id);

    const [
      totalEvents,
      totalCustomers,
      totalAppointments,
      totalPayments
    ] = await Promise.all([
      Event.countDocuments({ userId: { $in: userIds } }),
      Customer.countDocuments({ userId: { $in: userIds } }),
      Appointment.countDocuments({ userId: { $in: userIds } }),
      Payment.countDocuments({ userId: { $in: userIds } })
    ]);

    const allPayments = await Payment.find({ 
      userId: { $in: userIds },
      status: 'completed'
    });
    
    const totalRevenue = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const subscribersByMonth = subscribers.reduce((acc, sub) => {
      const month = new Date(sub.created_at).toLocaleDateString('he-IL', { 
        month: 'short', 
        year: 'numeric' 
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const subscribersWithDetails = await Promise.all(
      subscribers.map(async (sub) => {
        const [events, customers, appointments, payments] = await Promise.all([
          Event.countDocuments({ userId: sub.id }),
          Customer.countDocuments({ userId: sub.id }),
          Appointment.countDocuments({ userId: sub.id }),
          Payment.countDocuments({ userId: sub.id })
        ]);

        const completedPayments = await Payment.find({ 
          userId: sub.id,
          status: 'completed'
        });
        
        const revenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        return {
          id: sub.id,
          email: sub.email,
          fullName: sub.profile?.fullName || sub.email,
          businessName: sub.profile?.businessName || '',
          plan: sub.subscription?.plan || 'free',
          status: sub.subscription?.status || 'active',
          createdAt: sub.created_at,
          stats: {
            events,
            customers,
            appointments,
            payments,
            revenue
          }
        };
      })
    );

    res.json({
      success: true,
      overview: {
        totalSubscribers: subscribers.length,
        totalEvents,
        totalCustomers,
        totalAppointments,
        totalPayments,
        totalRevenue,
        subscribersByMonth
      },
      subscribers: subscribersWithDetails
    });
  } catch (error) {
    console.error('Super Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בטעינת נתוני Super Admin'
    });
  }
});

router.get('/check', auth, async (req, res) => {
  const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || '').split(',').map(e => e.trim());
  
  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(req.user.email);
  
  res.json({
    success: true,
    isSuperAdmin
  });
});

module.exports = router;

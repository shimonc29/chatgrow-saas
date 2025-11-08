const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { pool } = require('../config/postgres');
const Event = require('../models/Event');
const Customer = require('../models/Customer');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');

const auth = authMiddleware.authenticate();

const checkSuperAdmin = (req, res, next) => {
  const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || '').split(',').map(e => e.trim());
  
  if (!req.user || !req.user.email) {
    return res.status(401).json({
      success: false,
      message: 'אין הרשאה - משתמש לא מחובר'
    });
  }

  if (!SUPER_ADMIN_EMAILS.includes(req.user.email)) {
    return res.status(403).json({
      success: false,
      message: 'אין הרשאת Super Admin'
    });
  }

  next();
};

router.get('/stats', auth, checkSuperAdmin, async (req, res) => {
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

router.get('/platform-fees', auth, checkSuperAdmin, async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const subscribersResult = await pool.query(`
      SELECT 
        id,
        email,
        profile,
        payment_provider_id,
        subscription_status,
        current_customer_count
      FROM subscribers
      WHERE payment_provider_id IS NOT NULL
    `);

    const onboardedBusinesses = subscribersResult.rows.map(sub => ({
      email: sub.email,
      businessName: sub.profile?.businessName || 'לא מוגדר',
      paymentProviderId: sub.payment_provider_id,
      subscriptionStatus: sub.subscription_status,
      customerCount: sub.current_customer_count || 0
    }));

    const userIds = subscribersResult.rows.map(s => s.id);

    const payments = await Payment.find({
      userId: { $in: userIds },
      status: 'completed',
      createdAt: {
        $gte: new Date(currentYear, 0, 1),
        $lte: new Date(currentYear, 11, 31, 23, 59, 59)
      }
    });

    let currentMonthRevenue = 0;
    let yearlyRevenue = 0;
    const feesByBusiness = {};

    payments.forEach(payment => {
      const paymentDate = new Date(payment.createdAt);
      const platformFee = payment.metadata?.platformFee || (payment.amount * 0.05);
      
      yearlyRevenue += platformFee;
      
      if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
        currentMonthRevenue += platformFee;
      }

      const userId = payment.userId.toString();
      if (!feesByBusiness[userId]) {
        const business = subscribersResult.rows.find(s => s.id === userId);
        feesByBusiness[userId] = {
          email: business?.email || '-',
          businessName: business?.profile?.businessName || 'לא מוגדר',
          totalAmount: 0,
          platformFee: 0,
          businessAmount: 0,
          invoiceSent: false
        };
      }

      if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
        feesByBusiness[userId].totalAmount += payment.amount;
        feesByBusiness[userId].platformFee += platformFee;
        feesByBusiness[userId].businessAmount += (payment.amount - platformFee);
      }
    });

    const fees = Object.values(feesByBusiness);
    const onboardedBusinessCount = onboardedBusinesses.length;
    const totalBusinessCount = (await pool.query('SELECT COUNT(*) FROM subscribers')).rows[0].count;
    const averageFeePerBusiness = onboardedBusinessCount > 0 ? currentMonthRevenue / onboardedBusinessCount : 0;

    res.json({
      success: true,
      summary: {
        currentMonthRevenue,
        yearlyRevenue,
        onboardedBusinessCount,
        totalBusinessCount: parseInt(totalBusinessCount),
        averageFeePerBusiness
      },
      fees,
      onboardedBusinesses
    });
  } catch (error) {
    console.error('Platform fees error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בטעינת נתוני עמלות'
    });
  }
});

module.exports = router;

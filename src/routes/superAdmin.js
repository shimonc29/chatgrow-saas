const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { pool } = require('../config/postgres');
const Event = require('../models/Event');
const Customer = require('../models/Customer');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const ServiceProvider = require('../models/ServiceProvider');

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
        subscription_status,
        max_customers,
        current_customer_count,
        is_email_verified,
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
          subscriptionStatus: sub.subscription_status || 'FREE',
          maxCustomers: sub.max_customers || 200,
          currentCustomerCount: sub.current_customer_count || 0,
          isActive: sub.is_email_verified !== false,
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

// ===== Subscription Management =====

// Update subscriber plan
router.put('/subscribers/:id/plan', auth, checkSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { subscriptionStatus, maxCustomers } = req.body;

    const query = `
      UPDATE subscribers 
      SET subscription_status = $1, 
          max_customers = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [subscriptionStatus, maxCustomers, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'בעל העסק לא נמצא'
      });
    }

    res.json({
      success: true,
      message: 'תוכנית המנוי עודכנה בהצלחה',
      subscriber: result.rows[0]
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בעדכון תוכנית המנוי'
    });
  }
});

// Suspend/activate subscriber account
router.put('/subscribers/:id/status', auth, checkSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Update in PostgreSQL
    const pgQuery = `
      UPDATE subscribers 
      SET is_email_verified = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const pgResult = await pool.query(pgQuery, [isActive, id]);

    // Also update ServiceProvider if exists
    const provider = await ServiceProvider.findByEmail(pgResult.rows[0]?.email);
    if (provider) {
      provider.isActive = isActive;
      await provider.save();
    }

    res.json({
      success: true,
      message: isActive ? 'החשבון הופעל מחדש' : 'החשבון הושעה',
      subscriber: pgResult.rows[0]
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בעדכון סטטוס החשבון'
    });
  }
});

// Delete subscriber (cancel subscription)
router.delete('/subscribers/:id', auth, checkSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get subscriber email first
    const subResult = await pool.query('SELECT email FROM subscribers WHERE id = $1', [id]);
    const email = subResult.rows[0]?.email;

    // Delete from PostgreSQL
    await pool.query('DELETE FROM subscribers WHERE id = $1', [id]);

    // Delete ServiceProvider from MongoDB if exists
    if (email) {
      const provider = await ServiceProvider.findByEmail(email);
      if (provider) {
        await ServiceProvider.deleteOne({ email });
      }

      // Delete all related data
      await Customer.deleteMany({ userId: id });
      await Event.deleteMany({ userId: id });
      await Appointment.deleteMany({ userId: id });
      await Payment.deleteMany({ userId: id });
    }

    res.json({
      success: true,
      message: 'בעל העסק והנתונים שלו נמחקו בהצלחה'
    });
  } catch (error) {
    console.error('Delete subscriber error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה במחיקת בעל העסק'
    });
  }
});

// Update customer quota
router.put('/subscribers/:id/quota', auth, checkSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { maxCustomers } = req.body;

    const query = `
      UPDATE subscribers 
      SET max_customers = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [maxCustomers, id]);

    res.json({
      success: true,
      message: 'מכסת הלקוחות עודכנה בהצלחה',
      subscriber: result.rows[0]
    });
  } catch (error) {
    console.error('Update quota error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בעדכון מכסת הלקוחות'
    });
  }
});

// ===== Customer Management =====

// Add customer manually for a specific business
router.post('/customers', auth, checkSuperAdmin, async (req, res) => {
  try {
    const { userId, customerData } = req.body;

    // Check if subscriber exists
    const subResult = await pool.query('SELECT * FROM subscribers WHERE id = $1', [userId]);
    if (subResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'בעל העסק לא נמצא'
      });
    }

    const subscriber = subResult.rows[0];

    // Check quota
    if (subscriber.subscription_status === 'FREE' && 
        subscriber.current_customer_count >= subscriber.max_customers) {
      return res.status(400).json({
        success: false,
        message: 'בעל העסק הגיע למכסת הלקוחות המקסימלית'
      });
    }

    // Create customer
    const newCustomer = new Customer({
      userId,
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      notes: customerData.notes || '',
      tags: customerData.tags || [],
      createdAt: new Date()
    });

    await newCustomer.save();

    // Update customer count
    await pool.query(
      'UPDATE subscribers SET current_customer_count = current_customer_count + 1 WHERE id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: 'הלקוח נוצר בהצלחה',
      customer: newCustomer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה ביצירת הלקוח'
    });
  }
});

// Delete customer from any business
router.delete('/customers/:customerId', auth, checkSuperAdmin, async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'הלקוח לא נמצא'
      });
    }

    const userId = customer.userId;

    // Delete customer
    await Customer.findByIdAndDelete(customerId);

    // Update customer count
    await pool.query(
      'UPDATE subscribers SET current_customer_count = GREATEST(current_customer_count - 1, 0) WHERE id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: 'הלקוח נמחק בהצלחה'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה במחיקת הלקוח'
    });
  }
});

// Transfer customer from one business to another
router.put('/customers/:customerId/transfer', auth, checkSuperAdmin, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { targetUserId } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'הלקוח לא נמצא'
      });
    }

    // Check target subscriber exists
    const targetResult = await pool.query('SELECT * FROM subscribers WHERE id = $1', [targetUserId]);
    if (targetResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'בעל העסק היעד לא נמצא'
      });
    }

    const targetSub = targetResult.rows[0];

    // Check quota
    if (targetSub.subscription_status === 'FREE' && 
        targetSub.current_customer_count >= targetSub.max_customers) {
      return res.status(400).json({
        success: false,
        message: 'בעל העסק היעד הגיע למכסת הלקוחות המקסימלית'
      });
    }

    const oldUserId = customer.userId;

    // Transfer customer
    customer.userId = targetUserId;
    await customer.save();

    // Update counts
    await pool.query(
      'UPDATE subscribers SET current_customer_count = GREATEST(current_customer_count - 1, 0) WHERE id = $1',
      [oldUserId]
    );
    await pool.query(
      'UPDATE subscribers SET current_customer_count = current_customer_count + 1 WHERE id = $1',
      [targetUserId]
    );

    res.json({
      success: true,
      message: 'הלקוח הועבר בהצלחה',
      customer
    });
  } catch (error) {
    console.error('Transfer customer error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בהעברת הלקוח'
    });
  }
});

// Get all customers across all businesses
router.get('/all-customers', auth, checkSuperAdmin, async (req, res) => {
  try {
    const customers = await Customer.find({}).sort({ createdAt: -1 }).limit(100);
    
    res.json({
      success: true,
      customers
    });
  } catch (error) {
    console.error('Get all customers error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בטעינת הלקוחות'
    });
  }
});

module.exports = router;

const Event = require('../models/Event');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Appointment = require('../models/Appointment');
const { getSubscriber } = require('../models/Subscriber');
const { logInfo, logError } = require('../utils/logger');

/**
 * Data Broker Service - איסוף וסיכום נתונים עבור דוחות AI
 * Multi-Tenant Safe: כל פונקציה מסננת לפי businessId
 */
class DataBrokerService {
  /**
   * מושך רשימת כל הדיירים (Businesses) הפעילים עם מנוי Premium
   */
  async getPremiumBusinesses() {
    try {
      // שליפה מ-PostgreSQL - רק מנויים פעילים (TRIAL או ACTIVE)
      const premiumSubscribers = await getSubscriber({
        subscription_status: ['TRIAL', 'ACTIVE']
      });

      logInfo('Fetched premium businesses for strategic reports', {
        count: premiumSubscribers?.length || 0
      });

      return premiumSubscribers || [];
    } catch (error) {
      logError('Failed to fetch premium businesses', error);
      return [];
    }
  }

  /**
   * אוספת נתונים מרוכזים לעסק ספציפי
   * @param {String} businessId - MongoDB ObjectId של העסק
   * @param {Date} startDate - תאריך התחלה
   * @param {Date} endDate - תאריך סיום
   */
  async collectBusinessData(businessId, startDate, endDate) {
    try {
      logInfo('Collecting business data for strategic report', {
        businessId,
        startDate,
        endDate
      });

      // ביצוע כל השאילתות במקביל (Performance Optimization)
      const [events, payments, customers, appointments] = await Promise.all([
        this.getEventsSummary(businessId, startDate, endDate),
        this.getPaymentsSummary(businessId, startDate, endDate),
        this.getCustomersSummary(businessId, startDate, endDate),
        this.getAppointmentsSummary(businessId, startDate, endDate)
      ]);

      return {
        businessId,
        period: { startDate, endDate },
        events,
        payments,
        customers,
        appointments,
        collectedAt: new Date()
      };
    } catch (error) {
      logError('Failed to collect business data', error, { businessId });
      throw error;
    }
  }

  /**
   * סיכום אירועים - דחוס לטבלה קצרה
   */
  async getEventsSummary(businessId, startDate, endDate) {
    try {
      const events = await Event.find({
        businessId,
        date: { $gte: startDate, $lte: endDate }
      }).lean();

      if (events.length === 0) {
        return {
          totalEvents: 0,
          averageAttendance: 0,
          averagePrice: 0,
          categoryBreakdown: []
        };
      }

      // חישוב מטריקות מרוכזות
      const totalRevenue = events.reduce((sum, e) => sum + (e.price || 0) * (e.currentParticipants || 0), 0);
      const totalAttendance = events.reduce((sum, e) => sum + (e.currentParticipants || 0), 0);
      const totalCapacity = events.reduce((sum, e) => sum + (e.maxParticipants || 0), 0);

      // Breakdown לפי קטגוריה
      const categoryMap = {};
      events.forEach(event => {
        const cat = event.category || 'אחר';
        if (!categoryMap[cat]) {
          categoryMap[cat] = {
            category: cat,
            count: 0,
            totalRevenue: 0,
            averageAttendance: 0
          };
        }
        categoryMap[cat].count++;
        categoryMap[cat].totalRevenue += (event.price || 0) * (event.currentParticipants || 0);
        categoryMap[cat].averageAttendance += (event.currentParticipants || 0);
      });

      const categoryBreakdown = Object.values(categoryMap).map(cat => ({
        ...cat,
        averageAttendance: cat.count > 0 ? Math.round(cat.averageAttendance / cat.count) : 0
      }));

      return {
        totalEvents: events.length,
        averageAttendance: events.length > 0 ? Math.round(totalAttendance / events.length) : 0,
        averagePrice: events.length > 0 ? Math.round(totalRevenue / totalAttendance) : 0,
        totalRevenue,
        occupancyRate: totalCapacity > 0 ? ((totalAttendance / totalCapacity) * 100).toFixed(1) : 0,
        categoryBreakdown
      };
    } catch (error) {
      logError('Failed to get events summary', error, { businessId });
      return {
        totalEvents: 0,
        averageAttendance: 0,
        averagePrice: 0,
        categoryBreakdown: []
      };
    }
  }

  /**
   * סיכום תשלומים
   */
  async getPaymentsSummary(businessId, startDate, endDate) {
    try {
      const payments = await Payment.find({
        businessId,
        paymentDate: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }).lean();

      const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const averageTransactionValue = payments.length > 0 ? totalRevenue / payments.length : 0;

      return {
        totalPayments: payments.length,
        totalRevenue: Math.round(totalRevenue),
        averageTransactionValue: Math.round(averageTransactionValue),
        currency: payments[0]?.currency || 'ILS'
      };
    } catch (error) {
      logError('Failed to get payments summary', error, { businessId });
      return {
        totalPayments: 0,
        totalRevenue: 0,
        averageTransactionValue: 0
      };
    }
  }

  /**
   * סיכום לקוחות
   */
  async getCustomersSummary(businessId, startDate, endDate) {
    try {
      const totalCustomers = await Customer.countDocuments({ businessId });
      const newCustomers = await Customer.countDocuments({
        businessId,
        createdAt: { $gte: startDate, $lte: endDate }
      });

      // לקוחות חוזרים (יותר מ-1 תשלום)
      const repeatCustomers = await Payment.aggregate([
        {
          $match: {
            businessId: businessId.toString(),
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$customerId',
            paymentCount: { $sum: 1 }
          }
        },
        {
          $match: { paymentCount: { $gt: 1 } }
        },
        {
          $count: 'repeatCustomers'
        }
      ]);

      const repeatCount = repeatCustomers[0]?.repeatCustomers || 0;
      const retentionRate = totalCustomers > 0 ? ((repeatCount / totalCustomers) * 100).toFixed(1) : 0;

      return {
        totalCustomers,
        newCustomers,
        repeatCustomers: repeatCount,
        retentionRate: parseFloat(retentionRate)
      };
    } catch (error) {
      logError('Failed to get customers summary', error, { businessId });
      return {
        totalCustomers: 0,
        newCustomers: 0,
        repeatCustomers: 0,
        retentionRate: 0
      };
    }
  }

  /**
   * סיכום תורים
   */
  async getAppointmentsSummary(businessId, startDate, endDate) {
    try {
      const appointments = await Appointment.find({
        businessId,
        appointmentDate: { $gte: startDate, $lte: endDate }
      }).lean();

      const completedAppointments = appointments.filter(a => a.status === 'completed').length;
      const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;

      return {
        totalAppointments: appointments.length,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        completionRate: appointments.length > 0 ? ((completedAppointments / appointments.length) * 100).toFixed(1) : 0
      };
    } catch (error) {
      logError('Failed to get appointments summary', error, { businessId });
      return {
        totalAppointments: 0,
        completed: 0,
        cancelled: 0,
        completionRate: 0
      };
    }
  }
}

module.exports = new DataBrokerService();

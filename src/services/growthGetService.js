const AcquisitionSourceStats = require('../models/AcquisitionSourceStats');
const LandingPage = require('../models/LandingPage');
const Event = require('../models/Event');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const { logInfo, logError } = require('../utils/logger');

class GrowthGetService {
  async aggregateDailyStats(businessId, date = new Date()) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      logInfo('Starting daily acquisition aggregation', { businessId, date: startOfDay });

      await this.aggregateLandingPageStats(businessId, startOfDay, endOfDay);
      await this.aggregateEventStats(businessId, startOfDay, endOfDay);
      await this.aggregateAppointmentStats(businessId, startOfDay, endOfDay);

      logInfo('Daily acquisition aggregation completed', { businessId });
      
      return { success: true };
    } catch (error) {
      logError('Error aggregating daily stats', { error: error.message, businessId });
      throw error;
    }
  }

  async aggregateLandingPageStats(businessId, periodStart, periodEnd) {
    const landingPages = await LandingPage.find({ businessId });

    for (const page of landingPages) {
      const sourceKey = `landing-page:${page.slug}`;
      
      const viewsInPeriod = page.analytics?.uniqueVisitors?.filter(v => 
        new Date(v) >= periodStart && new Date(v) <= periodEnd
      ).length || 0;
      
      const conversionsInPeriod = page.analytics?.conversions || 0;
      
      const paymentsInPeriod = await Payment.countDocuments({
        businessId,
        'metadata.source': sourceKey,
        createdAt: { $gte: periodStart, $lte: periodEnd }
      });
      
      const revenueInPeriod = await Payment.aggregate([
        {
          $match: {
            businessId,
            'metadata.source': sourceKey,
            createdAt: { $gte: periodStart, $lte: periodEnd },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const revenue = revenueInPeriod.length > 0 ? revenueInPeriod[0].total : 0;

      const stats = await AcquisitionSourceStats.findOneAndUpdate(
        {
          businessId,
          sourceKey,
          period: 'day',
          periodStart
        },
        {
          $set: {
            sourceType: 'landing_page',
            periodEnd,
            metrics: {
              views: viewsInPeriod,
              leads: conversionsInPeriod,
              appointments: 0,
              registrations: 0,
              payments: paymentsInPeriod,
              revenue
            }
          }
        },
        { upsert: true, new: true }
      );

      stats.calculateConversionRates();
      await stats.save();
    }
  }

  async aggregateEventStats(businessId, periodStart, periodEnd) {
    const events = await Event.find({ businessId });

    for (const event of events) {
      const sourceKey = `event:${event._id}`;
      
      const registrationsInPeriod = event.participants?.filter(p => 
        new Date(p.registeredAt) >= periodStart && new Date(p.registeredAt) <= periodEnd
      ).length || 0;
      
      const paymentsInPeriod = await Payment.countDocuments({
        businessId,
        'metadata.eventId': event._id.toString(),
        createdAt: { $gte: periodStart, $lte: periodEnd },
        status: 'completed'
      });
      
      const revenueInPeriod = await Payment.aggregate([
        {
          $match: {
            businessId,
            'metadata.eventId': event._id.toString(),
            createdAt: { $gte: periodStart, $lte: periodEnd },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const revenue = revenueInPeriod.length > 0 ? revenueInPeriod[0].total : 0;

      const stats = await AcquisitionSourceStats.findOneAndUpdate(
        {
          businessId,
          sourceKey,
          period: 'day',
          periodStart
        },
        {
          $set: {
            sourceType: 'event',
            periodEnd,
            metrics: {
              views: 0,
              leads: registrationsInPeriod,
              appointments: 0,
              registrations: registrationsInPeriod,
              payments: paymentsInPeriod,
              revenue
            }
          }
        },
        { upsert: true, new: true }
      );

      stats.calculateConversionRates();
      await stats.save();
    }
  }

  async aggregateAppointmentStats(businessId, periodStart, periodEnd) {
    const appointmentsInPeriod = await Appointment.find({
      businessId,
      createdAt: { $gte: periodStart, $lte: periodEnd }
    });

    if (appointmentsInPeriod.length === 0) return;

    const sourceKey = 'appointments:general';
    
    const paymentsInPeriod = await Payment.countDocuments({
      businessId,
      'metadata.type': 'appointment',
      createdAt: { $gte: periodStart, $lte: periodEnd },
      status: 'completed'
    });
    
    const revenueInPeriod = await Payment.aggregate([
      {
        $match: {
          businessId,
          'metadata.type': 'appointment',
          createdAt: { $gte: periodStart, $lte: periodEnd },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const revenue = revenueInPeriod.length > 0 ? revenueInPeriod[0].total : 0;

    const stats = await AcquisitionSourceStats.findOneAndUpdate(
      {
        businessId,
        sourceKey,
        period: 'day',
        periodStart
      },
      {
        $set: {
          sourceType: 'appointment',
          periodEnd,
          metrics: {
            views: 0,
            leads: appointmentsInPeriod.length,
            appointments: appointmentsInPeriod.length,
            registrations: 0,
            payments: paymentsInPeriod,
            revenue
          }
        }
      },
      { upsert: true, new: true }
    );

    stats.calculateConversionRates();
    await stats.save();
  }

  async getSummary(businessId, periodDays = 30) {
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);
    periodStart.setHours(0, 0, 0, 0);

    const stats = await AcquisitionSourceStats.aggregate([
      {
        $match: {
          businessId: businessId,
          periodStart: { $gte: periodStart }
        }
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$metrics.views' },
          totalLeads: { $sum: '$metrics.leads' },
          totalAppointments: { $sum: '$metrics.appointments' },
          totalRegistrations: { $sum: '$metrics.registrations' },
          totalPayments: { $sum: '$metrics.payments' },
          totalRevenue: { $sum: '$metrics.revenue' }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        totalViews: 0,
        totalLeads: 0,
        totalBookings: 0,
        totalPayments: 0,
        totalRevenue: 0,
        conversionRate: 0
      };
    }

    const summary = stats[0];
    const totalBookings = summary.totalAppointments + summary.totalRegistrations;
    const conversionRate = summary.totalLeads > 0 
      ? ((summary.totalPayments / summary.totalLeads) * 100).toFixed(2)
      : 0;

    return {
      totalViews: summary.totalViews,
      totalLeads: summary.totalLeads,
      totalBookings,
      totalPayments: summary.totalPayments,
      totalRevenue: summary.totalRevenue,
      conversionRate: parseFloat(conversionRate)
    };
  }

  async getSourceBreakdown(businessId, periodDays = 30) {
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);
    periodStart.setHours(0, 0, 0, 0);

    const sources = await AcquisitionSourceStats.aggregate([
      {
        $match: {
          businessId: businessId,
          periodStart: { $gte: periodStart }
        }
      },
      {
        $group: {
          _id: {
            sourceKey: '$sourceKey',
            sourceType: '$sourceType'
          },
          views: { $sum: '$metrics.views' },
          leads: { $sum: '$metrics.leads' },
          appointments: { $sum: '$metrics.appointments' },
          registrations: { $sum: '$metrics.registrations' },
          payments: { $sum: '$metrics.payments' },
          revenue: { $sum: '$metrics.revenue' }
        }
      },
      {
        $project: {
          sourceKey: '$_id.sourceKey',
          sourceType: '$_id.sourceType',
          views: 1,
          leads: 1,
          bookings: { $add: ['$appointments', '$registrations'] },
          payments: 1,
          revenue: 1,
          conversionRate: {
            $cond: {
              if: { $gt: ['$leads', 0] },
              then: { $multiply: [{ $divide: ['$payments', '$leads'] }, 100] },
              else: 0
            }
          }
        }
      },
      {
        $sort: { revenue: -1 }
      }
    ]);

    return sources.map(s => ({
      sourceKey: s.sourceKey,
      sourceType: s.sourceType,
      views: s.views,
      leads: s.leads,
      bookings: s.bookings,
      payments: s.payments,
      revenue: s.revenue,
      conversionRate: parseFloat(s.conversionRate.toFixed(2))
    }));
  }

  async getTimeline(businessId, periodDays = 30) {
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);
    periodStart.setHours(0, 0, 0, 0);

    const timeline = await AcquisitionSourceStats.aggregate([
      {
        $match: {
          businessId: businessId,
          periodStart: { $gte: periodStart },
          period: 'day'
        }
      },
      {
        $group: {
          _id: '$periodStart',
          leads: { $sum: '$metrics.leads' },
          bookings: { $sum: { $add: ['$metrics.appointments', '$metrics.registrations'] } },
          payments: { $sum: '$metrics.payments' },
          revenue: { $sum: '$metrics.revenue' }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: '$_id',
          leads: 1,
          bookings: 1,
          payments: 1,
          revenue: 1
        }
      }
    ]);

    return timeline.map(t => ({
      date: t.date,
      leads: t.leads,
      bookings: t.bookings,
      payments: t.payments,
      revenue: t.revenue
    }));
  }
}

module.exports = new GrowthGetService();

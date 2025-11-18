const Event = require('../models/Event');
const { logInfo, logError } = require('../utils/logger');

/**
 * שליפת נתונים היסטוריים לניתוח AI
 * מושך את 10 האירועים האחרונים של העסק + ממוצעי פלטפורמה
 */
class EventDataService {
  /**
   * שליפת נתונים היסטוריים של משתמש + ממוצעי פלטפורמה
   */
  async getHistoricalData(businessId) {
    try {
      // 1. שלוף את 10 האירועים האחרונים של המשתמש
      const userEvents = await Event.find({ businessId })
        .sort({ startDateTime: -1 })
        .limit(10)
        .select('name pricing currentParticipants maxParticipants startDateTime stats category')
        .lean();

      // חשב מטריקות עבור כל אירוע
      const eventsWithMetrics = userEvents.map(event => {
        const price = event.pricing?.amount || 0;
        const registrations = event.stats?.totalRegistrations || event.currentParticipants || 0;
        const capacity = event.maxParticipants || 1;
        const revenue = event.stats?.totalRevenue || (price * registrations);
        const occupancyRate = ((registrations / capacity) * 100).toFixed(1);

        return {
          name: event.name,
          price,
          date: event.startDateTime,
          registrations,
          capacity,
          occupancyRate: parseFloat(occupancyRate),
          revenue,
          category: event.category
        };
      });

      // 2. חשב ממוצעי פלטפורמה (אנונימיים)
      const platformStats = await this.calculatePlatformAverages();

      logInfo('Historical data retrieved successfully', {
        businessId,
        userEventsCount: userEvents.length
      });

      return {
        userEvents: eventsWithMetrics,
        platformAverages: platformStats,
        totalUserEvents: eventsWithMetrics.length
      };

    } catch (error) {
      logError('Failed to retrieve historical data', error, { businessId });
      // במקרה של שגיאה, החזר נתונים ריקים
      return {
        userEvents: [],
        platformAverages: this.getDefaultPlatformAverages(),
        totalUserEvents: 0
      };
    }
  }

  /**
   * חישוב ממוצעי פלטפורמה מכל האירועים במערכת
   */
  async calculatePlatformAverages() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // שלוף אירועים מ-30 הימים האחרונים
      const recentEvents = await Event.find({
        startDateTime: { $gte: thirtyDaysAgo },
        status: 'published'
      }).select('pricing currentParticipants maxParticipants stats startDateTime').lean();

      if (recentEvents.length === 0) {
        return this.getDefaultPlatformAverages();
      }

      // חישוב ממוצעים
      let totalOccupancy = 0;
      let totalPrice = 0;
      let eventCount = 0;
      const dayDistribution = {};
      const hourDistribution = {};

      recentEvents.forEach(event => {
        const registrations = event.currentParticipants || 0;
        const capacity = event.maxParticipants || 1;
        const occupancy = (registrations / capacity) * 100;
        
        totalOccupancy += occupancy;
        totalPrice += event.pricing?.amount || 0;
        eventCount++;

        // חישוב התפלגות ימים ושעות
        const eventDate = new Date(event.startDateTime);
        const dayName = eventDate.toLocaleDateString('he-IL', { weekday: 'long' });
        const hour = eventDate.getHours();

        dayDistribution[dayName] = (dayDistribution[dayName] || 0) + 1;
        hourDistribution[hour] = (hourDistribution[hour] || 0) + 1;
      });

      // מצא יום ושעה פופולריים
      const popularDay = Object.keys(dayDistribution).reduce((a, b) => 
        dayDistribution[a] > dayDistribution[b] ? a : b, 'רביעי'
      );
      const popularHour = Object.keys(hourDistribution).reduce((a, b) => 
        hourDistribution[a] > hourDistribution[b] ? a : b, '19'
      );

      return {
        avgOccupancyRate: (totalOccupancy / eventCount).toFixed(1),
        avgPrice: Math.round(totalPrice / eventCount),
        avgPeakDay: popularDay,
        avgPeakTime: `${popularHour}:00`,
        totalEventsAnalyzed: eventCount,
        conversionRateEstimate: 3.5 // אומדן של 3.5% המרה (צפיות לרכישות)
      };

    } catch (error) {
      logError('Failed to calculate platform averages', error);
      return this.getDefaultPlatformAverages();
    }
  }

  /**
   * ערכי ברירת מחדל לממוצעי פלטפורמה
   */
  getDefaultPlatformAverages() {
    return {
      avgOccupancyRate: 65,
      avgPrice: 150,
      avgPeakDay: 'רביעי',
      avgPeakTime: '19:00',
      totalEventsAnalyzed: 0,
      conversionRateEstimate: 3.5
    };
  }

  /**
   * שליפת אירוע בודד עם כל הנתונים הדרושים ל-AI
   */
  async getEventForAI(eventId, businessId) {
    try {
      const event = await Event.findOne({ 
        _id: eventId, 
        businessId 
      }).lean();

      if (!event) {
        return null;
      }

      return {
        id: event._id,
        name: event.name,
        description: event.description,
        price: event.pricing?.amount || 0,
        currency: event.pricing?.currency || 'ILS',
        date: event.startDateTime,
        category: event.category,
        currentParticipants: event.currentParticipants || 0,
        maxParticipants: event.maxParticipants || 0,
        totalRegistrations: event.stats?.totalRegistrations || 0,
        totalRevenue: event.stats?.totalRevenue || 0,
        location: event.location,
        status: event.status
      };

    } catch (error) {
      logError('Failed to get event for AI', error, { eventId, businessId });
      return null;
    }
  }
}

module.exports = new EventDataService();

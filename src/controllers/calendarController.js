const calendarService = require('../services/calendarService');
const { logError } = require('../utils/logger');

const getProviderId = (user) => {
  const id = user.id || user._id || user.userId;
  return id ? String(id) : null;
};

const getCalendarView = async (req, res, next) => {
  try {
    const businessId = getProviderId(req.user);

    if (!businessId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - provider ID missing'
      });
    }

    const { from, to, view = 'week' } = req.query;

    let fromDate, toDate;

    if (from && to) {
      fromDate = new Date(from);
      toDate = new Date(to);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use ISO date strings.'
        });
      }
    } else {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const sunday = new Date(now);
      sunday.setDate(now.getDate() - dayOfWeek);
      sunday.setHours(0, 0, 0, 0);

      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);
      saturday.setHours(23, 59, 59, 999);

      fromDate = sunday;
      toDate = saturday;
    }

    const result = await calendarService.getCalendarView({
      businessId,
      from: fromDate,
      to: toDate,
      view
    });

    res.json({
      success: true,
      view,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      items: result.items
    });
  } catch (error) {
    logError('CalendarController: Failed to get calendar view', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to load calendar',
      message: error.message
    });
  }
};

module.exports = {
  getCalendarView
};

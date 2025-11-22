const Appointment = require('../models/Appointment');
const Event = require('../models/Event');
const Availability = require('../models/Availability');
const googleCalendarService = require('./googleCalendarService');
const { logInfo, logError } = require('../utils/logger');

class CalendarService {
  async getCalendarView({ businessId, from, to, view = 'week' }) {
    try {
      const fromDate = new Date(from);
      const toDate = new Date(to);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        throw new Error('Invalid date range');
      }

      if (fromDate > toDate) {
        throw new Error('Start date must be before end date');
      }

      logInfo('CalendarService: Fetching calendar view', {
        businessId,
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        view
      });

      const [appointments, events, availability, googleEvents] = await Promise.all([
        this.fetchAppointments(businessId, fromDate, toDate),
        this.fetchEvents(businessId, fromDate, toDate),
        this.fetchAvailabilityBlocks(businessId, fromDate, toDate),
        this.fetchGoogleCalendarEvents(businessId, fromDate, toDate)
      ]);

      const items = [
        ...this.normalizeAppointments(appointments),
        ...this.normalizeEvents(events),
        ...this.normalizeAvailabilityBlocks(availability),
        ...this.normalizeGoogleEvents(googleEvents)
      ];

      items.sort((a, b) => new Date(a.start) - new Date(b.start));

      logInfo('CalendarService: Calendar view generated', {
        businessId,
        totalItems: items.length,
        appointments: appointments.length,
        events: events.length,
        blocks: availability.length,
        googleEvents: googleEvents.length
      });

      return { items };
    } catch (error) {
      logError('CalendarService: Failed to get calendar view', {
        error: error.message,
        businessId,
        from,
        to
      });
      throw error;
    }
  }

  async fetchAppointments(businessId, fromDate, toDate) {
    try {
      const appointments = await Appointment.find({
        businessId,
        appointmentDate: {
          $gte: fromDate,
          $lte: toDate
        },
        status: { $nin: ['cancelled'] }
      }).lean();

      return appointments;
    } catch (error) {
      logError('CalendarService: Failed to fetch appointments', {
        error: error.message,
        businessId
      });
      return [];
    }
  }

  async fetchEvents(businessId, fromDate, toDate) {
    try {
      const events = await Event.find({
        businessId,
        startDateTime: {
          $gte: fromDate,
          $lte: toDate
        },
        status: { $ne: 'cancelled' }
      }).lean();

      return events;
    } catch (error) {
      logError('CalendarService: Failed to fetch events', {
        error: error.message,
        businessId
      });
      return [];
    }
  }

  async fetchAvailabilityBlocks(businessId, fromDate, toDate) {
    try {
      const availability = await Availability.findOne({
        providerId: businessId
      }).lean();

      if (!availability || !availability.blockedDates) {
        return [];
      }

      const blockedInRange = availability.blockedDates.filter(block => {
        const blockDate = new Date(block.date);
        return blockDate >= fromDate && blockDate < toDate;
      });

      return blockedInRange;
    } catch (error) {
      logError('CalendarService: Failed to fetch availability blocks', {
        error: error.message,
        businessId
      });
      return [];
    }
  }

  async fetchGoogleCalendarEvents(businessId, fromDate, toDate) {
    try {
      const googleEvents = await googleCalendarService.getEventsForRange(
        businessId,
        fromDate,
        toDate
      );
      return googleEvents;
    } catch (error) {
      logError('CalendarService: Failed to fetch Google Calendar events', {
        error: error.message,
        businessId
      });
      return [];
    }
  }

  normalizeAppointments(appointments) {
    return appointments.filter(appt => {
      return appt.appointmentDate && appt.startTime && appt.endTime;
    }).map(appt => {
      try {
        const appointmentDate = new Date(appt.appointmentDate);
        const [startHour, startMinute] = (appt.startTime || '00:00').split(':');
        const [endHour, endMinute] = (appt.endTime || '00:00').split(':');

        const startDateTime = new Date(appointmentDate);
        startDateTime.setHours(parseInt(startHour) || 0, parseInt(startMinute) || 0, 0, 0);

        const endDateTime = new Date(appointmentDate);
        endDateTime.setHours(parseInt(endHour) || 0, parseInt(endMinute) || 0, 0, 0);

        const customerName = appt.customer 
          ? `${appt.customer.firstName} ${appt.customer.lastName}`
          : 'לקוח';

        let location = null;
        if (appt.location) {
          if (typeof appt.location === 'string') {
            location = appt.location;
          } else if (appt.location.address) {
            location = appt.location.address;
          } else if (appt.location.meetingUrl) {
            location = appt.location.meetingUrl;
          }
        }

        return {
          type: 'appointment',
          id: appt._id.toString(),
          title: appt.serviceName || `פגישה עם ${customerName}`,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          status: appt.status || 'scheduled',
          location: location,
          meta: {
            customerId: appt.customer?.customerId,
            customerName: customerName,
            phone: appt.customer?.phone,
            notes: appt.notes || null,
            price: appt.price,
            paymentStatus: appt.paymentStatus
          }
        };
      } catch (error) {
        logError('CalendarService: Failed to normalize appointment', {
          error: error.message,
          appointmentId: appt._id
        });
        return null;
      }
    }).filter(item => item !== null);
  }

  normalizeEvents(events) {
    return events.map(ev => {
      let location = null;
      if (ev.location) {
        if (typeof ev.location === 'string') {
          location = ev.location;
        } else if (ev.location.address) {
          if (typeof ev.location.address === 'string') {
            location = ev.location.address;
          } else if (ev.location.address.street) {
            location = `${ev.location.address.street}, ${ev.location.address.city || ''}`;
          }
        } else if (ev.location.onlineLink) {
          location = ev.location.onlineLink;
        }
      }

      return {
        type: 'event',
        id: ev._id.toString(),
        title: ev.name || 'אירוע',
        start: ev.startDateTime.toISOString(),
        end: (ev.endDateTime || ev.startDateTime).toISOString(),
        status: ev.status || 'scheduled',
        location: location,
        meta: {
          category: ev.category,
          maxParticipants: ev.maxParticipants,
          currentParticipants: ev.currentParticipants || 0,
          pricing: ev.pricing
        }
      };
    });
  }

  normalizeAvailabilityBlocks(blocks) {
    return blocks.map(block => {
      try {
        const blockDate = new Date(block.date);
        
        if (isNaN(blockDate.getTime())) {
          logError('CalendarService: Invalid blocked date', { date: block.date });
          return null;
        }

        const startOfDay = new Date(blockDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(blockDate);
        endOfDay.setHours(23, 59, 59, 999);

        return {
          type: 'blocked',
          id: `block_${blockDate.getTime()}`,
          title: block.reason || 'חסום',
          start: startOfDay.toISOString(),
          end: endOfDay.toISOString(),
          status: 'blocked',
          location: null,
          meta: {
            reason: block.reason || null
          }
        };
      } catch (error) {
        logError('CalendarService: Failed to normalize blocked date', {
          error: error.message,
          block: block
        });
        return null;
      }
    }).filter(item => item !== null);
  }

  normalizeGoogleEvents(googleEvents) {
    return googleEvents.map(ge => ({
      type: 'google',
      id: `google_${ge.id}`,
      title: ge.summary || 'Google Event',
      start: ge.start,
      end: ge.end,
      status: 'busy',
      location: ge.location || null,
      meta: {
        calendarId: ge.calendarId,
        htmlLink: ge.htmlLink
      }
    }));
  }
}

module.exports = new CalendarService();

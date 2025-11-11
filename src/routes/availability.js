const express = require('express');
const router = express.Router();
const Availability = require('../models/Availability');
const auth = require('../middleware/auth');
const Joi = require('joi');

const authenticateToken = auth.authenticate();

const timeSlotSchema = Joi.object({
  startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required()
});

const dayAvailabilitySchema = Joi.object({
  dayOfWeek: Joi.number().min(0).max(6).required(),
  isAvailable: Joi.boolean().default(false),
  timeSlots: Joi.array().items(timeSlotSchema).default([])
});

const serviceSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('').default(''),
  duration: Joi.number().min(5).required(),
  price: Joi.number().min(0).required(),
  currency: Joi.string().valid('ILS', 'USD', 'EUR').default('ILS'),
  isActive: Joi.boolean().default(true)
});

const availabilityCreateSchema = Joi.object({
  weeklySchedule: Joi.array().items(dayAvailabilitySchema).min(7).max(7),
  services: Joi.array().items(serviceSchema),
  bufferTime: Joi.number().min(0).default(0),
  maxAdvanceBookingDays: Joi.number().min(1).max(365).default(30),
  minAdvanceBookingHours: Joi.number().min(0).default(2),
  blockedDates: Joi.array().items(Joi.object({
    date: Joi.date().required(),
    reason: Joi.string().allow('')
  })).default([])
});

router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const providerId = req.user.userId;
    
    let availability = await Availability.findOne({ providerId });
    
    if (!availability) {
      availability = new Availability({
        providerId,
        weeklySchedule: [
          { dayOfWeek: 0, isAvailable: false, timeSlots: [] },
          { dayOfWeek: 1, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
          { dayOfWeek: 2, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
          { dayOfWeek: 3, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
          { dayOfWeek: 4, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
          { dayOfWeek: 5, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
          { dayOfWeek: 6, isAvailable: false, timeSlots: [] }
        ],
        services: [],
        bufferTime: 0,
        maxAdvanceBookingDays: 30,
        minAdvanceBookingHours: 2,
        blockedDates: []
      });
      await availability.save();
    }
    
    res.json(availability);
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ error: 'Failed to fetch availability settings' });
  }
});

router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const { error } = availabilityCreateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const providerId = req.user.userId;
    
    const availability = await Availability.findOneAndUpdate(
      { providerId },
      {
        ...req.body,
        providerId,
        updatedAt: Date.now()
      },
      { new: true, upsert: true }
    );
    
    res.json({ 
      message: 'Availability settings updated successfully',
      availability 
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ error: 'Failed to update availability settings' });
  }
});

router.get('/services', authenticateToken, async (req, res) => {
  try {
    const providerId = req.user.userId;
    
    const availability = await Availability.findOne({ providerId });
    
    if (!availability) {
      return res.json({ services: [] });
    }
    
    res.json({ services: availability.services.filter(s => s.isActive) });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

router.post('/services', authenticateToken, async (req, res) => {
  try {
    const { error } = serviceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const providerId = req.user.userId;
    
    let availability = await Availability.findOne({ providerId });
    
    if (!availability) {
      availability = new Availability({
        providerId,
        weeklySchedule: [
          { dayOfWeek: 0, isAvailable: false, timeSlots: [] },
          { dayOfWeek: 1, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
          { dayOfWeek: 2, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
          { dayOfWeek: 3, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
          { dayOfWeek: 4, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
          { dayOfWeek: 5, isAvailable: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
          { dayOfWeek: 6, isAvailable: false, timeSlots: [] }
        ],
        services: []
      });
    }
    
    availability.services.push(req.body);
    await availability.save();
    
    res.json({ 
      message: 'Service added successfully',
      service: availability.services[availability.services.length - 1]
    });
  } catch (error) {
    console.error('Add service error:', error);
    res.status(500).json({ error: 'Failed to add service' });
  }
});

router.put('/services/:serviceId', authenticateToken, async (req, res) => {
  try {
    const { error } = serviceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const providerId = req.user.userId;
    const { serviceId } = req.params;
    
    const availability = await Availability.findOne({ providerId });
    
    if (!availability) {
      return res.status(404).json({ error: 'Availability settings not found' });
    }
    
    const service = availability.services.id(serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    Object.assign(service, req.body);
    await availability.save();
    
    res.json({ 
      message: 'Service updated successfully',
      service 
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

router.delete('/services/:serviceId', authenticateToken, async (req, res) => {
  try {
    const providerId = req.user.userId;
    const { serviceId } = req.params;
    
    const availability = await Availability.findOne({ providerId });
    
    if (!availability) {
      return res.status(404).json({ error: 'Availability settings not found' });
    }
    
    const service = availability.services.id(serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    service.isActive = false;
    await availability.save();
    
    res.json({ message: 'Service deactivated successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

router.get('/available-slots/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { serviceId, providerId } = req.query;
    
    if (!providerId) {
      return res.status(400).json({ error: 'Provider ID is required' });
    }
    
    const availability = await Availability.findOne({ providerId });
    
    if (!availability) {
      return res.json({ slots: [] });
    }
    
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay();
    
    const isBlocked = availability.blockedDates.some(blocked => {
      const blockedDate = new Date(blocked.date);
      return blockedDate.toDateString() === requestedDate.toDateString();
    });
    
    if (isBlocked) {
      return res.json({ slots: [], reason: 'Date is blocked' });
    }
    
    const daySchedule = availability.weeklySchedule.find(d => d.dayOfWeek === dayOfWeek);
    
    if (!daySchedule || !daySchedule.isAvailable) {
      return res.json({ slots: [], reason: 'Provider not available on this day' });
    }
    
    let serviceDuration = 30;
    if (serviceId) {
      const service = availability.services.id(serviceId);
      if (service) {
        serviceDuration = service.duration;
      }
    }
    
    const slots = [];
    
    for (const timeSlot of daySchedule.timeSlots) {
      const [startHour, startMinute] = timeSlot.startTime.split(':').map(Number);
      const [endHour, endMinute] = timeSlot.endTime.split(':').map(Number);
      
      let currentMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
      while (currentMinutes + serviceDuration <= endMinutes) {
        const slotHour = Math.floor(currentMinutes / 60);
        const slotMinute = currentMinutes % 60;
        const slotTime = `${String(slotHour).padStart(2, '0')}:${String(slotMinute).padStart(2, '0')}`;
        
        slots.push({
          time: slotTime,
          available: true
        });
        
        currentMinutes += serviceDuration + availability.bufferTime;
      }
    }
    
    res.json({ slots });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

module.exports = router;

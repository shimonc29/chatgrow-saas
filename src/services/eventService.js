
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const QueueService = require('./queueService');
const { logInfo, logError } = require('../utils/logger');

class EventService {
    constructor() {
        this.queueService = new QueueService();
    }

    /**
     * Create a new event
     */
    async createEvent(businessId, eventData) {
        try {
            const event = new Event({
                businessId,
                ...eventData
            });

            await event.save();

            logInfo('Event created successfully', {
                businessId,
                eventId: event._id,
                eventName: event.name
            });

            return {
                success: true,
                event,
                message: 'אירוע נוצר בהצלחה'
            };

        } catch (error) {
            logError('Failed to create event', error, { businessId });
            return {
                success: false,
                error: error.message,
                message: 'שגיאה ביצירת האירוע'
            };
        }
    }

    /**
     * Register participant for event
     */
    async registerParticipant(eventId, participantData, customFieldResponses = []) {
        try {
            const event = await Event.findById(eventId);
            if (!event) {
                return {
                    success: false,
                    message: 'האירוע לא נמצא'
                };
            }

            // Check if registration is allowed
            const canRegister = event.canRegister();
            if (!canRegister.canRegister) {
                return {
                    success: false,
                    message: canRegister.reason
                };
            }

            // Check for existing registration
            const existingRegistration = await Registration.findOne({
                eventId,
                'participant.email': participantData.email
            });

            if (existingRegistration) {
                return {
                    success: false,
                    message: 'משתתף זה כבר רשום לאירוע'
                };
            }

            // Create registration
            const registration = new Registration({
                eventId,
                businessId: event.businessId,
                participant: participantData,
                customFieldResponses,
                status: event.isFull ? 'waitlisted' : (event.registrationSettings.requireApproval ? 'pending' : 'confirmed')
            });

            if (registration.status === 'waitlisted') {
                const waitlistCount = await Registration.countDocuments({
                    eventId,
                    status: 'waitlisted'
                });
                registration.waitlistPosition = waitlistCount + 1;
                registration.waitlistDate = new Date();
            }

            await registration.save();

            // Update event participant count
            if (registration.status === 'confirmed') {
                await event.incrementParticipants();
            }

            // Send confirmation message
            await this.sendConfirmationMessage(registration, event);

            logInfo('Participant registered successfully', {
                eventId,
                registrationId: registration._id,
                participantEmail: participantData.email,
                status: registration.status
            });

            return {
                success: true,
                registration,
                message: registration.status === 'waitlisted' ? 
                    `נרשמת לרשימת המתנה במקום ${registration.waitlistPosition}` :
                    'נרשמת בהצלחה לאירוע!'
            };

        } catch (error) {
            logError('Failed to register participant', error, { eventId });
            return {
                success: false,
                error: error.message,
                message: 'שגיאה ברישום לאירוע'
            };
        }
    }

    /**
     * Send confirmation message via WhatsApp
     */
    async sendConfirmationMessage(registration, event) {
        try {
            if (!event.notifications.sendConfirmation) return;

            const message = event.notifications.customMessages.confirmation || 
                `שלום ${registration.participant.firstName}! 
                
✅ נרשמת בהצלחה לאירוע: ${event.name}

📅 תאריך: ${event.startDateTime.toLocaleDateString('he-IL')}
🕐 שעה: ${event.startDateTime.toLocaleTimeString('he-IL')}
📍 מקום: ${event.location.address?.street || event.location.onlineLink || 'יפורסם בהמשך'}

מספר הרשמה: ${registration.registrationNumber}

נתראה באירוע! 🎉`;

            // Add to WhatsApp queue
            const result = await this.queueService.addMessage(
                'default', // connection ID - should be business specific
                message,
                registration.participant.phone,
                'normal'
            );

            if (result.success) {
                await registration.addCommunication(
                    'confirmation',
                    'whatsapp',
                    message,
                    result.jobId
                );

                logInfo('Confirmation message queued', {
                    registrationId: registration._id,
                    jobId: result.jobId
                });
            }

        } catch (error) {
            logError('Failed to send confirmation message', error, {
                registrationId: registration._id
            });
        }
    }

    /**
     * Send reminder messages
     */
    async sendReminders(eventId, reminderType = '24h') {
        try {
            const event = await Event.findById(eventId).populate('businessId');
            if (!event || !event.notifications.sendReminders) return;

            const registrations = await Registration.find({
                eventId,
                status: 'confirmed'
            });

            const reminderMessage = event.notifications.customMessages.reminder ||
                `היי ${registration.participant.firstName}! 
                
🔔 תזכורת לאירוע: ${event.name}
📅 מחר ב-${event.startDateTime.toLocaleTimeString('he-IL')}
📍 ${event.location.address?.street || event.location.onlineLink}

מספר הרשמה: ${registration.registrationNumber}
מחכים לך! 😊`;

            const promises = registrations.map(async (registration) => {
                const personalizedMessage = reminderMessage.replace(/\$\{registration\.participant\.firstName\}/g, registration.participant.firstName);
                
                const result = await this.queueService.addMessage(
                    'default',
                    personalizedMessage,
                    registration.participant.phone,
                    'normal'
                );

                if (result.success) {
                    await registration.addCommunication(
                        'reminder',
                        'whatsapp',
                        personalizedMessage,
                        result.jobId
                    );
                }
            });

            await Promise.all(promises);

            logInfo('Reminder messages sent', {
                eventId,
                recipientCount: registrations.length,
                reminderType
            });

            return {
                success: true,
                sentCount: registrations.length,
                message: `נשלחו ${registrations.length} תזכורות`
            };

        } catch (error) {
            logError('Failed to send reminders', error, { eventId });
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get business events
     */
    async getBusinessEvents(businessId, filters = {}) {
        try {
            const query = { businessId };
            
            if (filters.status) query.status = filters.status;
            if (filters.category) query.category = filters.category;
            if (filters.startDate) query.startDateTime = { $gte: new Date(filters.startDate) };

            const events = await Event.find(query)
                .sort({ startDateTime: 1 })
                .limit(filters.limit || 50);

            return {
                success: true,
                events,
                count: events.length
            };

        } catch (error) {
            logError('Failed to get business events', error, { businessId });
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get event registrations
     */
    async getEventRegistrations(eventId, status = null) {
        try {
            const registrations = await Registration.findByEvent(eventId, status);
            const event = await Event.findById(eventId);

            return {
                success: true,
                registrations,
                event,
                stats: {
                    total: registrations.length,
                    confirmed: registrations.filter(r => r.status === 'confirmed').length,
                    waitlisted: registrations.filter(r => r.status === 'waitlisted').length,
                    cancelled: registrations.filter(r => r.status === 'cancelled').length
                }
            };

        } catch (error) {
            logError('Failed to get event registrations', error, { eventId });
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Cancel registration
     */
    async cancelRegistration(registrationId, reason = '') {
        try {
            const registration = await Registration.findById(registrationId);
            if (!registration) {
                return {
                    success: false,
                    message: 'הרשמה לא נמצאה'
                };
            }

            await registration.cancel(reason);

            // Update event participant count
            const event = await Event.findById(registration.eventId);
            if (registration.status === 'confirmed') {
                await event.decrementParticipants();
            }

            // Send cancellation message
            const message = `היי ${registration.participant.firstName},

ביטלת את ההרשמה לאירוע: ${event.name}
מספר הרשמה: ${registration.registrationNumber}

תוכל להירשם שוב דרך הקישור המקורי.`;

            await this.queueService.addMessage(
                'default',
                message,
                registration.participant.phone,
                'normal'
            );

            return {
                success: true,
                message: 'ההרשמה בוטלה בהצלחה'
            };

        } catch (error) {
            logError('Failed to cancel registration', error, { registrationId });
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = EventService;

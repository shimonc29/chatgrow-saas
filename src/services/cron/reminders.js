const cron = require('node-cron');
const { logInfo, logError } = require('../../utils/logger');
const Event = require('../../models/Event');
const Appointment = require('../../models/Appointment');
const notificationService = require('../notificationService');

/**
 * Reminder Cron Jobs Module
 * Handles event and appointment reminder scheduling
 */
class ReminderCronJobs {
    constructor() {
        this.jobs = new Map();
    }

    /**
     * Schedule event reminders (daily at 9 AM)
     * Sends reminders to participants 24 hours before events
     */
    scheduleEventReminders() {
        const jobName = 'eventReminders';

        // Run every day at 9:00 AM
        const job = cron.schedule('0 9 * * *', async () => {
            try {
                logInfo('Running event reminders job');

                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);

                const dayAfter = new Date(tomorrow);
                dayAfter.setDate(dayAfter.getDate() + 1);

                // Find events happening tomorrow
                const upcomingEvents = await Event.find({
                    date: { $gte: tomorrow, $lt: dayAfter },
                    status: 'active'
                });

                for (const event of upcomingEvents) {
                    await this.sendEventReminders(event);
                }

                logInfo('Event reminders sent', { count: upcomingEvents.length });
            } catch (error) {
                logError('Error sending event reminders', error);
            }
        });

        this.jobs.set(jobName, job);
        logInfo(`Scheduled ${jobName} job`);
    }

    /**
     * Schedule appointment reminders (daily at 9 AM)
     * Sends reminders to customers 24 hours before appointments
     */
    scheduleAppointmentReminders() {
        const jobName = 'appointmentReminders';

        // Run every day at 9:00 AM
        const job = cron.schedule('0 9 * * *', async () => {
            try {
                logInfo('Running appointment reminders job');

                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);

                const dayAfter = new Date(tomorrow);
                dayAfter.setDate(dayAfter.getDate() + 1);

                // Find appointments scheduled for tomorrow
                const upcomingAppointments = await Appointment.find({
                    date: { $gte: tomorrow, $lt: dayAfter },
                    status: 'confirmed'
                }).populate('customer');

                for (const appointment of upcomingAppointments) {
                    await this.sendAppointmentReminder(appointment);
                }

                logInfo('Appointment reminders sent', { count: upcomingAppointments.length });
            } catch (error) {
                logError('Error sending appointment reminders', error);
            }
        });

        this.jobs.set(jobName, job);
        logInfo(`Scheduled ${jobName} job`);
    }

    /**
     * Send reminders to all event participants
     */
    async sendEventReminders(event) {
        try {
            if (!event.registrations || event.registrations.length === 0) {
                return;
            }

            const eventDate = new Date(event.date).toLocaleDateString('he-IL');
            const eventTime = event.time || 'לא צוין';

            for (const registration of event.registrations) {
                if (registration.status === 'confirmed' && registration.email) {
                    await notificationService.sendEmail({
                        to: registration.email,
                        subject: `תזכורת: ${event.title} מחר`,
                        html: `
                            <div dir="rtl" style="font-family: Arial, sans-serif;">
                                <h2>שלום ${registration.name},</h2>
                                <p>זוהי תזכורת שהאירוע <strong>${event.title}</strong> יתקיים מחר.</p>
                                <p><strong>תאריך:</strong> ${eventDate}</p>
                                <p><strong>שעה:</strong> ${eventTime}</p>
                                ${event.location ? `<p><strong>מיקום:</strong> ${event.location}</p>` : ''}
                                <p>נשמח לראותך!</p>
                            </div>
                        `
                    });
                }
            }

            logInfo('Event reminders sent', {
                eventId: event._id,
                eventTitle: event.title,
                recipientsCount: event.registrations.length
            });
        } catch (error) {
            logError('Error sending event reminders', error, { eventId: event._id });
        }
    }

    /**
     * Send reminder to appointment customer
     */
    async sendAppointmentReminder(appointment) {
        try {
            if (!appointment.customer || !appointment.customer.email) {
                return;
            }

            const appointmentDate = new Date(appointment.date).toLocaleDateString('he-IL');
            const appointmentTime = appointment.time || 'לא צוין';

            await notificationService.sendEmail({
                to: appointment.customer.email,
                subject: `תזכורת: תור מחר ב-${appointmentTime}`,
                html: `
                    <div dir="rtl" style="font-family: Arial, sans-serif;">
                        <h2>שלום ${appointment.customer.name},</h2>
                        <p>זוהי תזכורת לתור שלך מחר.</p>
                        <p><strong>תאריך:</strong> ${appointmentDate}</p>
                        <p><strong>שעה:</strong> ${appointmentTime}</p>
                        ${appointment.serviceType ? `<p><strong>סוג שירות:</strong> ${appointment.serviceType}</p>` : ''}
                        ${appointment.notes ? `<p><strong>הערות:</strong> ${appointment.notes}</p>` : ''}
                        <p>מצפים לראותך!</p>
                    </div>
                `
            });

            logInfo('Appointment reminder sent', {
                appointmentId: appointment._id,
                customerEmail: appointment.customer.email
            });
        } catch (error) {
            logError('Error sending appointment reminder', error, {
                appointmentId: appointment._id
            });
        }
    }

    /**
     * Stop all reminder jobs
     */
    stopAll() {
        this.jobs.forEach((job, name) => {
            job.stop();
            logInfo(`Stopped ${name} job`);
        });
        this.jobs.clear();
    }

    /**
     * Get job status
     */
    getStatus() {
        return {
            jobsCount: this.jobs.size,
            jobs: Array.from(this.jobs.keys())
        };
    }
}

module.exports = new ReminderCronJobs();

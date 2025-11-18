const cron = require('node-cron');
const { logInfo, logError, logWarning } = require('../utils/logger');
const Event = require('../models/Event');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const notificationService = require('./notificationService');
const paymentService = require('./paymentService');
const invoiceService = require('./invoiceService');
const strategicReportService = require('./strategicReportService');
const dataBrokerService = require('./dataBrokerService');

class CronService {
    constructor() {
        this.jobs = new Map();
        this.isInitialized = false;
    }

    initialize() {
        if (this.isInitialized) {
            logWarning('CronService already initialized');
            return;
        }

        try {
            // Schedule all CRON jobs
            this.scheduleEventReminders();
            this.scheduleAppointmentReminders();
            this.scheduleAutomaticPayments();
            this.scheduleWeeklyReports();
            this.scheduleMonthlyReports();
            this.scheduleMonthlyPlatformFeeInvoices();
            this.scheduleDataCleanup();
            this.scheduleWeeklyStrategicReports();

            this.isInitialized = true;
            logInfo('CronService initialized successfully', {
                jobsCount: this.jobs.size
            });
        } catch (error) {
            logError('Failed to initialize CronService', error);
            throw error;
        }
    }

    /**
     * Schedule event reminders (24 hours and 1 hour before)
     * Runs every hour
     */
    scheduleEventReminders() {
        const job = cron.schedule('0 * * * *', async () => {
            try {
                logInfo('Running event reminders job');
                await this.sendEventReminders();
            } catch (error) {
                logError('Event reminders job failed', error);
            }
        });

        this.jobs.set('eventReminders', job);
        logInfo('Scheduled event reminders job (every hour)');
    }

    /**
     * Schedule appointment reminders (24 hours and 1 hour before)
     * Runs every hour
     */
    scheduleAppointmentReminders() {
        const job = cron.schedule('0 * * * *', async () => {
            try {
                logInfo('Running appointment reminders job');
                await this.sendAppointmentReminders();
            } catch (error) {
                logError('Appointment reminders job failed', error);
            }
        });

        this.jobs.set('appointmentReminders', job);
        logInfo('Scheduled appointment reminders job (every hour)');
    }

    /**
     * Schedule automatic payments for unpaid events
     * Runs daily at 10:00 AM
     */
    scheduleAutomaticPayments() {
        const job = cron.schedule('0 10 * * *', async () => {
            try {
                logInfo('Running automatic payments job');
                await this.processAutomaticPayments();
            } catch (error) {
                logError('Automatic payments job failed', error);
            }
        });

        this.jobs.set('automaticPayments', job);
        logInfo('Scheduled automatic payments job (daily at 10:00)');
    }

    /**
     * Schedule weekly reports
     * Runs every Sunday at 20:00
     */
    scheduleWeeklyReports() {
        const job = cron.schedule('0 20 * * 0', async () => {
            try {
                logInfo('Running weekly reports job');
                await this.generateWeeklyReports();
            } catch (error) {
                logError('Weekly reports job failed', error);
            }
        });

        this.jobs.set('weeklyReports', job);
        logInfo('Scheduled weekly reports job (Sunday 20:00)');
    }

    /**
     * Schedule monthly reports
     * Runs on the 1st of every month at 08:00
     */
    scheduleMonthlyReports() {
        const job = cron.schedule('0 8 1 * *', async () => {
            try {
                logInfo('Running monthly reports job');
                await this.generateMonthlyReports();
            } catch (error) {
                logError('Monthly reports job failed', error);
            }
        });

        this.jobs.set('monthlyReports', job);
        logInfo('Scheduled monthly reports job (1st of month, 08:00)');
    }

    /**
     * Schedule monthly platform fee invoices
     * Runs on the 1st of every month at 09:00
     */
    scheduleMonthlyPlatformFeeInvoices() {
        const job = cron.schedule('0 9 1 * *', async () => {
            try {
                logInfo('Running monthly platform fee invoices job');
                await this.generatePlatformFeeInvoices();
            } catch (error) {
                logError('Monthly platform fee invoices job failed', error);
            }
        });

        this.jobs.set('monthlyPlatformFeeInvoices', job);
        logInfo('Scheduled monthly platform fee invoices job (1st of month, 09:00)');
    }

    /**
     * Schedule data cleanup (old logs, expired sessions, etc.)
     * Runs daily at 02:00 AM
     */
    scheduleDataCleanup() {
        const job = cron.schedule('0 2 * * *', async () => {
            try {
                logInfo('Running data cleanup job');
                await this.cleanupOldData();
            } catch (error) {
                logError('Data cleanup job failed', error);
            }
        });

        this.jobs.set('dataCleanup', job);
        logInfo('Scheduled data cleanup job (daily at 02:00)');
    }

    /**
     * Send event reminders (24h and 1h before)
     */
    async sendEventReminders() {
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);

        try {
            // Find events happening in 24 hours
            const events24h = await Event.find({
                startDate: {
                    $gte: in24Hours,
                    $lte: new Date(in24Hours.getTime() + 60 * 60 * 1000) // 1 hour window
                },
                status: { $in: ['published', 'confirmed'] },
                'reminders.24h': { $ne: true }
            }).populate('businessId', 'email profile');

            // Find events happening in 1 hour
            const events1h = await Event.find({
                startDate: {
                    $gte: in1Hour,
                    $lte: new Date(in1Hour.getTime() + 15 * 60 * 1000) // 15 min window
                },
                status: { $in: ['published', 'confirmed'] },
                'reminders.1h': { $ne: true }
            }).populate('businessId', 'email profile');

            // Send 24-hour reminders
            for (const event of events24h) {
                await notificationService.sendEventReminder(event, '24h');
                event.reminders = event.reminders || {};
                event.reminders['24h'] = true;
                await event.save();
                
                logInfo('Sent 24h reminder for event', {
                    eventId: event._id,
                    eventName: event.title
                });
            }

            // Send 1-hour reminders
            for (const event of events1h) {
                await notificationService.sendEventReminder(event, '1h');
                event.reminders = event.reminders || {};
                event.reminders['1h'] = true;
                await event.save();
                
                logInfo('Sent 1h reminder for event', {
                    eventId: event._id,
                    eventName: event.title
                });
            }

            logInfo('Event reminders sent', {
                reminders24h: events24h.length,
                reminders1h: events1h.length
            });

        } catch (error) {
            logError('Failed to send event reminders', error);
            throw error;
        }
    }

    /**
     * Send appointment reminders
     */
    async sendAppointmentReminders() {
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);

        try {
            // Find appointments happening in 24 hours
            const appointments24h = await Appointment.find({
                appointmentDate: {
                    $gte: in24Hours,
                    $lte: new Date(in24Hours.getTime() + 60 * 60 * 1000)
                },
                status: 'confirmed',
                'reminders.24h': { $ne: true }
            }).populate('customerId', 'firstName lastName email phone');

            // Find appointments happening in 1 hour
            const appointments1h = await Appointment.find({
                appointmentDate: {
                    $gte: in1Hour,
                    $lte: new Date(in1Hour.getTime() + 15 * 60 * 1000)
                },
                status: 'confirmed',
                'reminders.1h': { $ne: true }
            }).populate('customerId', 'firstName lastName email phone');

            // Send 24-hour reminders
            for (const appointment of appointments24h) {
                await notificationService.sendAppointmentReminder(appointment, '24h');
                appointment.reminders = appointment.reminders || {};
                appointment.reminders['24h'] = true;
                await appointment.save();
                
                logInfo('Sent 24h reminder for appointment', {
                    appointmentId: appointment._id
                });
            }

            // Send 1-hour reminders
            for (const appointment of appointments1h) {
                await notificationService.sendAppointmentReminder(appointment, '1h');
                appointment.reminders = appointment.reminders || {};
                appointment.reminders['1h'] = true;
                await appointment.save();
                
                logInfo('Sent 1h reminder for appointment', {
                    appointmentId: appointment._id
                });
            }

            logInfo('Appointment reminders sent', {
                reminders24h: appointments24h.length,
                reminders1h: appointments1h.length
            });

        } catch (error) {
            logError('Failed to send appointment reminders', error);
            throw error;
        }
    }

    /**
     * Process automatic payments for unpaid events
     */
    async processAutomaticPayments() {
        try {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Find events happening tomorrow that haven't been paid
            const upcomingEvents = await Event.find({
                startDate: {
                    $gte: tomorrow,
                    $lte: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
                },
                status: 'confirmed',
                price: { $gt: 0 },
                autoCharge: true,
                'payment.status': { $ne: 'paid' }
            }).populate('businessId customerId');

            let charged = 0;
            let failed = 0;

            for (const event of upcomingEvents) {
                try {
                    // Check if payment already exists
                    const existingPayment = await Payment.findOne({
                        'relatedTo.ref': event._id,
                        'relatedTo.model': 'Event'
                    });

                    if (existingPayment && existingPayment.status === 'completed') {
                        continue;
                    }

                    // Create payment
                    const paymentData = {
                        amount: event.price,
                        currency: event.currency || 'ILS',
                        paymentMethod: 'credit_card',
                        customer: {
                            name: `${event.customerId.firstName} ${event.customerId.lastName}`,
                            email: event.customerId.email,
                            phone: event.customerId.phone
                        },
                        relatedTo: {
                            model: 'Event',
                            ref: event._id
                        },
                        notes: `תשלום אוטומטי עבור אירוע: ${event.title}`,
                        autoCharge: true
                    };

                    const result = await paymentService.createPayment(
                        event.businessId._id,
                        event.customerId._id,
                        paymentData
                    );

                    if (result.success) {
                        // Generate invoice
                        await invoiceService.createInvoiceFromPayment(result.payment._id);
                        
                        charged++;
                        logInfo('Auto-charged event', {
                            eventId: event._id,
                            paymentId: result.payment._id,
                            amount: event.price
                        });
                    } else {
                        failed++;
                    }

                } catch (error) {
                    failed++;
                    logError('Failed to auto-charge event', error, {
                        eventId: event._id
                    });
                }
            }

            logInfo('Automatic payments processed', {
                total: upcomingEvents.length,
                charged,
                failed
            });

        } catch (error) {
            logError('Failed to process automatic payments', error);
            throw error;
        }
    }

    /**
     * Generate and send weekly reports
     */
    async generateWeeklyReports() {
        try {
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            // Get all active businesses
            const User = require('../models/User');
            const businesses = await User.find({ role: 'provider' });

            for (const business of businesses) {
                try {
                    // Get week statistics
                    const stats = await this.getWeeklyStats(business._id, weekAgo, now);

                    // Send email report
                    await notificationService.sendEmail({
                        to: business.email,
                        subject: 'דוח שבועי - ChatGrow',
                        html: this.generateWeeklyReportHTML(business, stats)
                    });

                    logInfo('Sent weekly report', {
                        businessId: business._id,
                        email: business.email
                    });

                } catch (error) {
                    logError('Failed to send weekly report', error, {
                        businessId: business._id
                    });
                }
            }

        } catch (error) {
            logError('Failed to generate weekly reports', error);
            throw error;
        }
    }

    /**
     * Generate and send monthly reports
     */
    async generateMonthlyReports() {
        try {
            const now = new Date();
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

            // Get all active businesses
            const User = require('../models/User');
            const businesses = await User.find({ role: 'provider' });

            for (const business of businesses) {
                try {
                    // Get month statistics
                    const stats = await this.getMonthlyStats(business._id, monthAgo, monthEnd);

                    // Send email report
                    await notificationService.sendEmail({
                        to: business.email,
                        subject: 'דוח חודשי - ChatGrow',
                        html: this.generateMonthlyReportHTML(business, stats)
                    });

                    logInfo('Sent monthly report', {
                        businessId: business._id,
                        email: business.email
                    });

                } catch (error) {
                    logError('Failed to send monthly report', error, {
                        businessId: business._id
                    });
                }
            }

        } catch (error) {
            logError('Failed to generate monthly reports', error);
            throw error;
        }
    }

    /**
     * Generate monthly platform fee invoices
     */
    async generatePlatformFeeInvoices() {
        try {
            const platformFeeService = require('./platformFeeService');
            
            logInfo('Starting monthly platform fee invoice generation');
            
            const result = await platformFeeService.generateMonthlyInvoicesForFees();
            
            logInfo('Completed monthly platform fee invoice generation', {
                totalBusinesses: result.totalBusinesses,
                successfulInvoices: result.successfulInvoices,
                failedInvoices: result.failedInvoices
            });

            return result;

        } catch (error) {
            logError('Failed to generate platform fee invoices', error);
            throw error;
        }
    }

    /**
     * Cleanup old data
     */
    async cleanupOldData() {
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

            // Clean up old completed payments (keep for 90 days)
            const paymentsDeleted = await Payment.deleteMany({
                status: 'completed',
                createdAt: { $lt: ninetyDaysAgo }
            });

            // Clean up cancelled events (keep for 30 days)
            const eventsDeleted = await Event.deleteMany({
                status: 'cancelled',
                updatedAt: { $lt: thirtyDaysAgo }
            });

            // Clean up cancelled appointments (keep for 30 days)
            const appointmentsDeleted = await Appointment.deleteMany({
                status: 'cancelled',
                updatedAt: { $lt: thirtyDaysAgo }
            });

            logInfo('Data cleanup completed', {
                paymentsDeleted: paymentsDeleted.deletedCount,
                eventsDeleted: eventsDeleted.deletedCount,
                appointmentsDeleted: appointmentsDeleted.deletedCount
            });

        } catch (error) {
            logError('Failed to cleanup old data', error);
            throw error;
        }
    }

    /**
     * Get weekly statistics for a business
     */
    async getWeeklyStats(businessId, startDate, endDate) {
        const [events, appointments, payments] = await Promise.all([
            Event.countDocuments({
                businessId,
                createdAt: { $gte: startDate, $lte: endDate }
            }),
            Appointment.countDocuments({
                businessId,
                createdAt: { $gte: startDate, $lte: endDate }
            }),
            Payment.aggregate([
                {
                    $match: {
                        businessId,
                        status: 'completed',
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        return {
            events,
            appointments,
            revenue: payments[0]?.total || 0,
            transactions: payments[0]?.count || 0
        };
    }

    /**
     * Get monthly statistics for a business
     */
    async getMonthlyStats(businessId, startDate, endDate) {
        return await this.getWeeklyStats(businessId, startDate, endDate);
    }

    /**
     * Generate weekly report HTML
     */
    generateWeeklyReportHTML(business, stats) {
        return `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>דוח שבועי - ChatGrow</h2>
                <p>שלום ${business.profile?.businessName || 'ספק'},</p>
                <p>להלן סיכום הפעילות שלך בשבוע האחרון:</p>
                
                <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3>📊 סטטיסטיקות</h3>
                    <p><strong>אירועים חדשים:</strong> ${stats.events}</p>
                    <p><strong>תורים חדשים:</strong> ${stats.appointments}</p>
                    <p><strong>הכנסות:</strong> ₪${stats.revenue.toLocaleString()}</p>
                    <p><strong>עסקאות:</strong> ${stats.transactions}</p>
                </div>
                
                <p>המשך שבוע מוצלח!</p>
                <p>צוות ChatGrow</p>
            </div>
        `;
    }

    /**
     * Generate monthly report HTML
     */
    generateMonthlyReportHTML(business, stats) {
        return `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>דוח חודשי - ChatGrow</h2>
                <p>שלום ${business.profile?.businessName || 'ספק'},</p>
                <p>להלן סיכום הפעילות שלך בחודש האחרון:</p>
                
                <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3>📊 סטטיסטיקות חודשיות</h3>
                    <p><strong>אירועים חדשים:</strong> ${stats.events}</p>
                    <p><strong>תורים חדשים:</strong> ${stats.appointments}</p>
                    <p><strong>הכנסות חודשיות:</strong> ₪${stats.revenue.toLocaleString()}</p>
                    <p><strong>עסקאות:</strong> ${stats.transactions}</p>
                    <p><strong>ממוצע לעסקה:</strong> ₪${stats.transactions > 0 ? (stats.revenue / stats.transactions).toFixed(2) : 0}</p>
                </div>
                
                <p>תודה על השימוש ב-ChatGrow!</p>
                <p>צוות ChatGrow</p>
            </div>
        `;
    }

    /**
     * Schedule weekly strategic AI reports for Premium businesses
     * Runs every Monday at 02:00 AM
     */
    scheduleWeeklyStrategicReports() {
        const job = cron.schedule('0 2 * * 1', async () => {
            try {
                logInfo('Running weekly strategic reports job');
                await this.generateWeeklyStrategicReports();
            } catch (error) {
                logError('Weekly strategic reports job failed', error);
            }
        });

        this.jobs.set('weeklyStrategicReports', job);
        logInfo('Scheduled weekly strategic reports job (Monday 02:00)');
    }

    /**
     * Generate strategic AI reports for all Premium businesses
     * Multi-Tenant: Each business processed independently
     */
    async generateWeeklyStrategicReports() {
        try {
            logInfo('Starting weekly strategic reports generation for all Premium businesses');

            // Step 1: Get all Premium businesses
            const premiumBusinesses = await dataBrokerService.getPremiumBusinesses();

            if (premiumBusinesses.length === 0) {
                logInfo('No premium businesses found - skipping strategic reports');
                return;
            }

            logInfo(`Found ${premiumBusinesses.length} premium businesses for strategic reports`);

            // Step 2: Calculate date range (last 7 days)
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);

            // Step 3: Process each business in parallel (with concurrency limit)
            const results = await this.processBatchReports(
                premiumBusinesses,
                startDate,
                endDate,
                5 // Max 5 concurrent reports
            );

            const successful = results.filter(r => r.status === 'success').length;
            const failed = results.filter(r => r.status === 'failed').length;

            logInfo('Weekly strategic reports completed', {
                total: premiumBusinesses.length,
                successful,
                failed
            });

        } catch (error) {
            logError('Failed to generate weekly strategic reports', error);
        }
    }

    /**
     * Process reports in batches to avoid overwhelming the system
     * @param {Array} businesses - List of premium businesses
     * @param {Date} startDate - Report start date
     * @param {Date} endDate - Report end date
     * @param {Number} concurrency - Max concurrent reports
     */
    async processBatchReports(businesses, startDate, endDate, concurrency = 5) {
        const results = [];
        const queue = [...businesses];

        // Process in batches of 'concurrency'
        while (queue.length > 0) {
            const batch = queue.splice(0, concurrency);

            const batchResults = await Promise.allSettled(
                batch.map(business => this.generateBusinessReport(business, startDate, endDate))
            );

            // Collect results
            batchResults.forEach((result, index) => {
                const business = batch[index];
                if (result.status === 'fulfilled') {
                    results.push({
                        businessId: business.id,
                        status: 'success',
                        reportId: result.value._id
                    });
                } else {
                    results.push({
                        businessId: business.id,
                        status: 'failed',
                        error: result.reason?.message || 'Unknown error'
                    });
                }
            });

            // Small delay between batches to prevent API rate limits
            if (queue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return results;
    }

    /**
     * Generate strategic report for a single business
     * @param {Object} business - Business subscriber object
     * @param {Date} startDate - Report start date
     * @param {Date} endDate - Report end date
     */
    async generateBusinessReport(business, startDate, endDate) {
        try {
            logInfo('Generating strategic report for business', {
                businessId: business.id,
                businessEmail: business.email
            });

            // Call Strategic Report Service
            const report = await strategicReportService.generateReport(
                business.id,
                startDate,
                endDate
            );

            logInfo('Strategic report generated successfully', {
                businessId: business.id,
                reportId: report._id
            });

            // Optional: Send notification to business owner
            // await notificationService.sendStrategicReportNotification(business, report);

            return report;

        } catch (error) {
            logError('Failed to generate strategic report for business', error, {
                businessId: business.id
            });
            throw error;
        }
    }

    /**
     * Stop a specific CRON job
     */
    stopJob(jobName) {
        const job = this.jobs.get(jobName);
        if (job) {
            job.stop();
            this.jobs.delete(jobName);
            logInfo('CRON job stopped', { jobName });
            return true;
        }
        return false;
    }

    /**
     * Stop all CRON jobs
     */
    stopAll() {
        for (const [name, job] of this.jobs) {
            job.stop();
            logInfo('CRON job stopped', { jobName: name });
        }
        this.jobs.clear();
        this.isInitialized = false;
        logInfo('All CRON jobs stopped');
    }

    /**
     * Get status of all CRON jobs
     */
    getStatus() {
        const status = {};
        for (const [name] of this.jobs) {
            status[name] = 'running';
        }
        return {
            initialized: this.isInitialized,
            jobsCount: this.jobs.size,
            jobs: status
        };
    }
}

module.exports = new CronService();

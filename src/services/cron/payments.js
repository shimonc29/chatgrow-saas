const cron = require('node-cron');
const { logInfo, logError } = require('../../utils/logger');
const Payment = require('../../models/Payment');
const paymentService = require('../paymentService');
const invoiceService = require('../invoiceService');
const platformFeeService = require('../platformFeeService');

/**
 * Payment Cron Jobs Module
 * Handles automatic payments, invoices, and platform fees
 */
class PaymentCronJobs {
    constructor() {
        this.jobs = new Map();
    }

    /**
     * Schedule automatic payments (daily at 10 AM)
     * Process scheduled payments and send payment reminders
     */
    scheduleAutomaticPayments() {
        const jobName = 'automaticPayments';

        // Run every day at 10:00 AM
        const job = cron.schedule('0 10 * * *', async () => {
            try {
                logInfo('Running automatic payments job');

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                // Find scheduled payments for today
                const scheduledPayments = await Payment.find({
                    status: 'scheduled',
                    scheduledDate: { $gte: today, $lt: tomorrow }
                });

                let successCount = 0;
                let failureCount = 0;

                for (const payment of scheduledPayments) {
                    try {
                        await paymentService.processScheduledPayment(payment._id);
                        successCount++;
                    } catch (error) {
                        logError('Failed to process scheduled payment', error, {
                            paymentId: payment._id
                        });
                        failureCount++;
                    }
                }

                logInfo('Automatic payments processed', {
                    total: scheduledPayments.length,
                    success: successCount,
                    failure: failureCount
                });
            } catch (error) {
                logError('Error in automatic payments job', error);
            }
        });

        this.jobs.set(jobName, job);
        logInfo(`Scheduled ${jobName} job`);
    }

    /**
     * Schedule monthly platform fee invoices (1st day of month at 8 AM)
     * Generate and send platform fee invoices to all providers
     */
    scheduleMonthlyPlatformFeeInvoices() {
        const jobName = 'monthlyPlatformFeeInvoices';

        // Run on the 1st day of every month at 8:00 AM
        const job = cron.schedule('0 8 1 * *', async () => {
            try {
                logInfo('Running monthly platform fee invoices job');

                const lastMonth = new Date();
                lastMonth.setMonth(lastMonth.getMonth() - 1);
                const month = lastMonth.getMonth() + 1;
                const year = lastMonth.getFullYear();

                // Generate platform fee invoices for all providers
                const result = await platformFeeService.generateMonthlyInvoices(month, year);

                logInfo('Platform fee invoices generated', {
                    month,
                    year,
                    ...result
                });
            } catch (error) {
                logError('Error generating platform fee invoices', error);
            }
        });

        this.jobs.set(jobName, job);
        logInfo(`Scheduled ${jobName} job`);
    }

    /**
     * Schedule payment reminders (daily at 11 AM)
     * Send reminders for overdue payments
     */
    schedulePaymentReminders() {
        const jobName = 'paymentReminders';

        // Run every day at 11:00 AM
        const job = cron.schedule('0 11 * * *', async () => {
            try {
                logInfo('Running payment reminders job');

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Find overdue payments
                const overduePayments = await Payment.find({
                    status: { $in: ['pending', 'scheduled'] },
                    dueDate: { $lt: today }
                }).populate('customer');

                let remindersSent = 0;

                for (const payment of overduePayments) {
                    try {
                        await paymentService.sendPaymentReminder(payment._id);
                        remindersSent++;
                    } catch (error) {
                        logError('Failed to send payment reminder', error, {
                            paymentId: payment._id
                        });
                    }
                }

                logInfo('Payment reminders sent', {
                    overdueCount: overduePayments.length,
                    remindersSent
                });
            } catch (error) {
                logError('Error in payment reminders job', error);
            }
        });

        this.jobs.set(jobName, job);
        logInfo(`Scheduled ${jobName} job`);
    }

    /**
     * Schedule failed payment retry (daily at 3 PM)
     * Retry failed payments automatically
     */
    scheduleFailedPaymentRetry() {
        const jobName = 'failedPaymentRetry';

        // Run every day at 3:00 PM
        const job = cron.schedule('0 15 * * *', async () => {
            try {
                logInfo('Running failed payment retry job');

                // Find failed payments from the last 7 days
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                const failedPayments = await Payment.find({
                    status: 'failed',
                    updatedAt: { $gte: sevenDaysAgo },
                    retryCount: { $lt: 3 } // Max 3 retries
                });

                let successCount = 0;
                let stillFailingCount = 0;

                for (const payment of failedPayments) {
                    try {
                        await paymentService.retryPayment(payment._id);
                        successCount++;
                    } catch (error) {
                        logError('Payment retry failed', error, {
                            paymentId: payment._id
                        });
                        stillFailingCount++;
                    }
                }

                logInfo('Failed payments retry completed', {
                    total: failedPayments.length,
                    success: successCount,
                    stillFailing: stillFailingCount
                });
            } catch (error) {
                logError('Error in failed payment retry job', error);
            }
        });

        this.jobs.set(jobName, job);
        logInfo(`Scheduled ${jobName} job`);
    }

    /**
     * Stop all payment jobs
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

module.exports = new PaymentCronJobs();

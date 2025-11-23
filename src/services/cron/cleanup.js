const cron = require('node-cron');
const { logInfo, logError } = require('../../utils/logger');
const MessageLog = require('../../models/MessageLog');
const RateLimit = require('../../models/RateLimit');
const Appointment = require('../../models/Appointment');
const Event = require('../../models/Event');

/**
 * Cleanup Cron Jobs Module
 * Handles data cleanup, archival, and maintenance tasks
 */
class CleanupCronJobs {
    constructor() {
        this.jobs = new Map();
    }

    /**
     * Schedule data cleanup (daily at 1 AM)
     * Clean up old logs, expired sessions, and temporary data
     */
    scheduleDataCleanup() {
        const jobName = 'dataCleanup';

        // Run every day at 1:00 AM
        const job = cron.schedule('0 1 * * *', async () => {
            try {
                logInfo('Running data cleanup job');

                const results = {
                    messageLogs: 0,
                    rateLimits: 0,
                    expiredAppointments: 0,
                    expiredEvents: 0
                };

                // Clean up old message logs (older than 90 days)
                const ninetyDaysAgo = new Date();
                ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

                const messageLogResult = await MessageLog.deleteMany({
                    createdAt: { $lt: ninetyDaysAgo }
                });
                results.messageLogs = messageLogResult.deletedCount || 0;

                // Clean up old rate limit records (older than 30 days)
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const rateLimitResult = await RateLimit.deleteMany({
                    createdAt: { $lt: thirtyDaysAgo }
                });
                results.rateLimits = rateLimitResult.deletedCount || 0;

                // Archive old completed appointments (older than 1 year)
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

                const appointmentResult = await Appointment.updateMany(
                    {
                        date: { $lt: oneYearAgo },
                        status: { $in: ['completed', 'cancelled'] },
                        archived: { $ne: true }
                    },
                    {
                        $set: { archived: true }
                    }
                );
                results.expiredAppointments = appointmentResult.modifiedCount || 0;

                // Archive old completed events (older than 1 year)
                const eventResult = await Event.updateMany(
                    {
                        date: { $lt: oneYearAgo },
                        status: { $in: ['completed', 'cancelled'] },
                        archived: { $ne: true }
                    },
                    {
                        $set: { archived: true }
                    }
                );
                results.expiredEvents = eventResult.modifiedCount || 0;

                logInfo('Data cleanup completed', results);
            } catch (error) {
                logError('Error in data cleanup job', error);
            }
        });

        this.jobs.set(jobName, job);
        logInfo(`Scheduled ${jobName} job`);
    }

    /**
     * Schedule session cleanup (every hour)
     * Remove expired sessions and tokens
     */
    scheduleSessionCleanup() {
        const jobName = 'sessionCleanup';

        // Run every hour at minute 0
        const job = cron.schedule('0 * * * *', async () => {
            try {
                logInfo('Running session cleanup job');

                const User = require('../../models/User');

                const now = new Date();

                // Remove expired sessions from all users
                const result = await User.updateMany(
                    {
                        'activeSessions.expiresAt': { $lt: now }
                    },
                    {
                        $pull: {
                            activeSessions: {
                                expiresAt: { $lt: now }
                            }
                        }
                    }
                );

                logInfo('Session cleanup completed', {
                    usersUpdated: result.modifiedCount || 0
                });
            } catch (error) {
                logError('Error in session cleanup job', error);
            }
        });

        this.jobs.set(jobName, job);
        logInfo(`Scheduled ${jobName} job`);
    }

    /**
     * Schedule temporary file cleanup (daily at midnight)
     * Remove temporary uploaded files older than 24 hours
     */
    scheduleTempFileCleanup() {
        const jobName = 'tempFileCleanup';
        const fs = require('fs').promises;
        const path = require('path');

        // Run every day at midnight
        const job = cron.schedule('0 0 * * *', async () => {
            try {
                logInfo('Running temp file cleanup job');

                const tempDir = path.join(__dirname, '../../../temp');
                const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

                let deletedCount = 0;

                try {
                    const files = await fs.readdir(tempDir);

                    for (const file of files) {
                        const filePath = path.join(tempDir, file);
                        const stats = await fs.stat(filePath);

                        if (stats.mtimeMs < oneDayAgo) {
                            await fs.unlink(filePath);
                            deletedCount++;
                        }
                    }
                } catch (error) {
                    // Directory might not exist, that's okay
                    if (error.code !== 'ENOENT') {
                        throw error;
                    }
                }

                logInfo('Temp file cleanup completed', { deletedCount });
            } catch (error) {
                logError('Error in temp file cleanup job', error);
            }
        });

        this.jobs.set(jobName, job);
        logInfo(`Scheduled ${jobName} job`);
    }

    /**
     * Schedule database optimization (weekly on Sunday at 2 AM)
     * Optimize database indexes and vacuum
     */
    scheduleWeeklyDatabaseOptimization() {
        const jobName = 'weeklyDatabaseOptimization';

        // Run every Sunday at 2:00 AM
        const job = cron.schedule('0 2 * * 0', async () => {
            try {
                logInfo('Running weekly database optimization job');

                // MongoDB doesn't need manual optimization, but we can rebuild indexes
                const mongoose = require('mongoose');
                const models = Object.values(mongoose.models);

                for (const Model of models) {
                    try {
                        await Model.syncIndexes();
                        logInfo(`Indexes synced for ${Model.modelName}`);
                    } catch (error) {
                        logError(`Failed to sync indexes for ${Model.modelName}`, error);
                    }
                }

                logInfo('Database optimization completed');
            } catch (error) {
                logError('Error in database optimization job', error);
            }
        });

        this.jobs.set(jobName, job);
        logInfo(`Scheduled ${jobName} job`);
    }

    /**
     * Stop all cleanup jobs
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

module.exports = new CleanupCronJobs();

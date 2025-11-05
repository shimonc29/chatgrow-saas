const express = require('express');
const router = express.Router();
const cronService = require('../services/cronService');
const { logInfo, logError } = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');

/**
 * Get CRON service status
 * GET /api/cron/status
 */
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const status = cronService.getStatus();
        
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        logError('Failed to get CRON status', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get CRON status',
            message: error.message
        });
    }
});

/**
 * Manually trigger a CRON job (for testing)
 * POST /api/cron/trigger/:jobName
 */
router.post('/trigger/:jobName', authenticateToken, async (req, res) => {
    try {
        const { jobName } = req.params;
        
        // Validate job name
        const validJobs = [
            'eventReminders',
            'appointmentReminders',
            'automaticPayments',
            'weeklyReports',
            'monthlyReports',
            'dataCleanup'
        ];

        if (!validJobs.includes(jobName)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid job name',
                validJobs
            });
        }

        logInfo('Manually triggering CRON job', { jobName, userId: req.user.id });

        // Trigger the job manually
        let result;
        switch (jobName) {
            case 'eventReminders':
                await cronService.sendEventReminders();
                result = { message: 'Event reminders sent' };
                break;
            case 'appointmentReminders':
                await cronService.sendAppointmentReminders();
                result = { message: 'Appointment reminders sent' };
                break;
            case 'automaticPayments':
                await cronService.processAutomaticPayments();
                result = { message: 'Automatic payments processed' };
                break;
            case 'weeklyReports':
                await cronService.generateWeeklyReports();
                result = { message: 'Weekly reports generated' };
                break;
            case 'monthlyReports':
                await cronService.generateMonthlyReports();
                result = { message: 'Monthly reports generated' };
                break;
            case 'dataCleanup':
                await cronService.cleanupOldData();
                result = { message: 'Data cleanup completed' };
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Job not implemented'
                });
        }

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        logError('Failed to trigger CRON job', error, {
            jobName: req.params.jobName
        });
        res.status(500).json({
            success: false,
            error: 'Failed to trigger CRON job',
            message: error.message
        });
    }
});

/**
 * Get CRON job schedule information
 * GET /api/cron/schedule
 */
router.get('/schedule', authenticateToken, async (req, res) => {
    try {
        const schedule = {
            eventReminders: {
                name: 'Event Reminders',
                schedule: 'Every hour',
                cron: '0 * * * *',
                description: 'Send reminders 24h and 1h before events'
            },
            appointmentReminders: {
                name: 'Appointment Reminders',
                schedule: 'Every hour',
                cron: '0 * * * *',
                description: 'Send reminders 24h and 1h before appointments'
            },
            automaticPayments: {
                name: 'Automatic Payments',
                schedule: 'Daily at 10:00',
                cron: '0 10 * * *',
                description: 'Process automatic payments for upcoming events'
            },
            weeklyReports: {
                name: 'Weekly Reports',
                schedule: 'Sunday 20:00',
                cron: '0 20 * * 0',
                description: 'Generate and send weekly analytics reports'
            },
            monthlyReports: {
                name: 'Monthly Reports',
                schedule: '1st of month, 08:00',
                cron: '0 8 1 * *',
                description: 'Generate and send monthly analytics reports'
            },
            dataCleanup: {
                name: 'Data Cleanup',
                schedule: 'Daily at 02:00',
                cron: '0 2 * * *',
                description: 'Clean up old payments, cancelled events, and logs'
            }
        };

        res.json({
            success: true,
            data: schedule
        });

    } catch (error) {
        logError('Failed to get CRON schedule', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get CRON schedule',
            message: error.message
        });
    }
});

module.exports = router;

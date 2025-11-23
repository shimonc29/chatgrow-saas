const { logInfo, logError, logWarning } = require('../../utils/logger');
const reminderJobs = require('./reminders');
const paymentJobs = require('./payments');
const reportJobs = require('./reports');
const growthJobs = require('./growth');
const cleanupJobs = require('./cleanup');

/**
 * Main Cron Service
 * Orchestrates all cron job modules
 *
 * Modules:
 * - reminders: Event and appointment reminders
 * - payments: Automatic payments, invoices, and platform fees
 * - reports: Weekly, monthly, and strategic reports
 * - growth: Growth aggregation, customer health, and opportunities
 * - cleanup: Data cleanup, archival, and maintenance
 */
class CronService {
    constructor() {
        this.modules = {
            reminders: reminderJobs,
            payments: paymentJobs,
            reports: reportJobs,
            growth: growthJobs,
            cleanup: cleanupJobs
        };
        this.isInitialized = false;
    }

    /**
     * Initialize all cron jobs
     */
    initialize() {
        if (this.isInitialized) {
            logWarning('CronService already initialized');
            return;
        }

        try {
            logInfo('Initializing CronService...');

            // Initialize reminder jobs
            reminderJobs.scheduleEventReminders();
            reminderJobs.scheduleAppointmentReminders();

            // Initialize payment jobs
            paymentJobs.scheduleAutomaticPayments();
            paymentJobs.scheduleMonthlyPlatformFeeInvoices();
            paymentJobs.schedulePaymentReminders();
            paymentJobs.scheduleFailedPaymentRetry();

            // Initialize report jobs
            reportJobs.scheduleWeeklyReports();
            reportJobs.scheduleMonthlyReports();
            reportJobs.scheduleWeeklyStrategicReports();
            reportJobs.scheduleQuarterlyReports();

            // Initialize growth jobs
            growthJobs.scheduleDailyGrowthAggregation();
            growthJobs.scheduleDailyCustomerHealthCalculation();
            growthJobs.scheduleDailyGrowthOpportunityIdentification();
            growthJobs.scheduleWeeklyCustomerSegmentation();
            growthJobs.scheduleMonthlyRetentionAnalysis();

            // Initialize cleanup jobs
            cleanupJobs.scheduleDataCleanup();
            cleanupJobs.scheduleSessionCleanup();
            cleanupJobs.scheduleTempFileCleanup();
            cleanupJobs.scheduleWeeklyDatabaseOptimization();

            this.isInitialized = true;

            const status = this.getStatus();
            logInfo('CronService initialized successfully', status);
        } catch (error) {
            logError('Failed to initialize CronService', error);
            throw error;
        }
    }

    /**
     * Stop all cron jobs
     */
    stopAll() {
        try {
            logInfo('Stopping all cron jobs...');

            Object.values(this.modules).forEach(module => {
                module.stopAll();
            });

            this.isInitialized = false;
            logInfo('All cron jobs stopped');
        } catch (error) {
            logError('Error stopping cron jobs', error);
            throw error;
        }
    }

    /**
     * Get status of all cron modules
     */
    getStatus() {
        const status = {
            isInitialized: this.isInitialized,
            totalJobs: 0,
            modules: {}
        };

        Object.entries(this.modules).forEach(([name, module]) => {
            const moduleStatus = module.getStatus();
            status.modules[name] = moduleStatus;
            status.totalJobs += moduleStatus.jobsCount;
        });

        return status;
    }

    /**
     * Get status of a specific module
     */
    getModuleStatus(moduleName) {
        if (!this.modules[moduleName]) {
            throw new Error(`Module '${moduleName}' not found`);
        }

        return this.modules[moduleName].getStatus();
    }

    /**
     * Stop a specific module
     */
    stopModule(moduleName) {
        if (!this.modules[moduleName]) {
            throw new Error(`Module '${moduleName}' not found`);
        }

        this.modules[moduleName].stopAll();
        logInfo(`Stopped module: ${moduleName}`);
    }
}

// Export singleton instance
const cronService = new CronService();
module.exports = cronService;

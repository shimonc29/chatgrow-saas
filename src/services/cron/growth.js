const cron = require('node-cron');
const { logInfo, logError } = require('../../utils/logger');
const dataBrokerService = require('../dataBrokerService');
const growthGetService = require('../growthGetService');
const growthKeepService = require('../growthKeepService');

/**
 * Growth Cron Jobs Module
 * Handles growth aggregation, customer health, and opportunity identification
 */
class GrowthCronJobs {
    constructor() {
        this.jobs = new Map();
    }

    /**
     * Schedule daily growth aggregation (every day at 2 AM)
     * Aggregate growth metrics and update statistics
     */
    scheduleDailyGrowthAggregation() {
        const jobName = 'dailyGrowthAggregation';

        // Run every day at 2:00 AM
        const job = cron.schedule('0 2 * * *', async () => {
            try {
                logInfo('Running daily growth aggregation job');

                // Aggregate acquisition source stats
                const result = await dataBrokerService.aggregateDailyStats();

                logInfo('Daily growth aggregation completed', result);
            } catch (error) {
                logError('Error in daily growth aggregation', error);
            }
        });

        this.jobs.set(jobName, job);
        logInfo(`Scheduled ${jobName} job`);
    }

    /**
     * Schedule daily customer health calculation (every day at 3 AM)
     * Calculate and update customer health scores
     */
    scheduleDailyCustomerHealthCalculation() {
        const jobName = 'dailyCustomerHealthCalculation';

        // Run every day at 3:00 AM
        const job = cron.schedule('0 3 * * *', async () => {
            try {
                logInfo('Running daily customer health calculation job');

                // Calculate customer health scores
                const result = await growthKeepService.calculateAllCustomerHealth();

                logInfo('Customer health calculation completed', result);
            } catch (error) {
                logError('Error calculating customer health', error);
            }
        });

        this.jobs.set(jobName, job);
        logInfo(`Scheduled ${jobName} job`);
    }

    /**
     * Schedule daily growth opportunity identification (every day at 4 AM)
     * Identify and create growth opportunities for providers
     */
    scheduleDailyGrowthOpportunityIdentification() {
        const jobName = 'dailyGrowthOpportunityIdentification';

        // Run every day at 4:00 AM
        const job = cron.schedule('0 4 * * *', async () => {
            try {
                logInfo('Running daily growth opportunity identification job');

                // Identify growth opportunities
                const result = await growthGetService.identifyOpportunities();

                logInfo('Growth opportunities identified', result);
            } catch (error) {
                logError('Error identifying growth opportunities', error);
            }
        });

        this.jobs.set(jobName, job);
        logInfo(`Scheduled ${jobName} job`);
    }

    /**
     * Schedule weekly customer segmentation (every Monday at 1 AM)
     * Segment customers based on behavior and value
     */
    scheduleWeeklyCustomerSegmentation() {
        const jobName = 'weeklyCustomerSegmentation';

        // Run every Monday at 1:00 AM
        const job = cron.schedule('0 1 * * 1', async () => {
            try {
                logInfo('Running weekly customer segmentation job');

                // Segment customers
                const result = await growthKeepService.segmentAllCustomers();

                logInfo('Customer segmentation completed', result);
            } catch (error) {
                logError('Error in customer segmentation', error);
            }
        });

        this.jobs.set(jobName, job);
        logInfo(`Scheduled ${jobName} job`);
    }

    /**
     * Schedule monthly retention analysis (1st of month at 5 AM)
     * Analyze customer retention and churn patterns
     */
    scheduleMonthlyRetentionAnalysis() {
        const jobName = 'monthlyRetentionAnalysis';

        // Run on the 1st day of every month at 5:00 AM
        const job = cron.schedule('0 5 1 * *', async () => {
            try {
                logInfo('Running monthly retention analysis job');

                const lastMonth = new Date();
                lastMonth.setMonth(lastMonth.getMonth() - 1);

                // Analyze retention
                const result = await growthKeepService.analyzeMonthlyRetention(
                    lastMonth.getMonth() + 1,
                    lastMonth.getFullYear()
                );

                logInfo('Monthly retention analysis completed', result);
            } catch (error) {
                logError('Error in monthly retention analysis', error);
            }
        });

        this.jobs.set(jobName, job);
        logInfo(`Scheduled ${jobName} job`);
    }

    /**
     * Stop all growth jobs
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

module.exports = new GrowthCronJobs();

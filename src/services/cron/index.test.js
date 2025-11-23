const CronService = require('./index');

// Mock all cron modules
jest.mock('./reminders');
jest.mock('./payments');
jest.mock('./reports');
jest.mock('./growth');
jest.mock('./cleanup');

// Mock logger
jest.mock('../../utils/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarning: jest.fn(),
}));

describe('CronService', () => {
  let cronService;
  const reminderJobs = require('./reminders');
  const paymentJobs = require('./payments');
  const reportJobs = require('./reports');
  const growthJobs = require('./growth');
  const cleanupJobs = require('./cleanup');

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock module methods
    [reminderJobs, paymentJobs, reportJobs, growthJobs, cleanupJobs].forEach(module => {
      module.scheduleEventReminders = jest.fn();
      module.scheduleAppointmentReminders = jest.fn();
      module.scheduleAutomaticPayments = jest.fn();
      module.scheduleMonthlyPlatformFeeInvoices = jest.fn();
      module.schedulePaymentReminders = jest.fn();
      module.scheduleFailedPaymentRetry = jest.fn();
      module.scheduleWeeklyReports = jest.fn();
      module.scheduleMonthlyReports = jest.fn();
      module.scheduleWeeklyStrategicReports = jest.fn();
      module.scheduleQuarterlyReports = jest.fn();
      module.scheduleDailyGrowthAggregation = jest.fn();
      module.scheduleDailyCustomerHealthCalculation = jest.fn();
      module.scheduleDailyGrowthOpportunityIdentification = jest.fn();
      module.scheduleWeeklyCustomerSegmentation = jest.fn();
      module.scheduleMonthlyRetentionAnalysis = jest.fn();
      module.scheduleDataCleanup = jest.fn();
      module.scheduleSessionCleanup = jest.fn();
      module.scheduleTempFileCleanup = jest.fn();
      module.scheduleWeeklyDatabaseOptimization = jest.fn();
      module.stopAll = jest.fn();
      module.getStatus = jest.fn().mockReturnValue({
        jobsCount: 2,
        jobs: ['test-job-1', 'test-job-2'],
      });
    });

    cronService = new CronService();
  });

  describe('initialize', () => {
    it('should initialize all cron modules', () => {
      cronService.initialize();

      expect(reminderJobs.scheduleEventReminders).toHaveBeenCalled();
      expect(reminderJobs.scheduleAppointmentReminders).toHaveBeenCalled();
      expect(paymentJobs.scheduleAutomaticPayments).toHaveBeenCalled();
      expect(reportJobs.scheduleWeeklyReports).toHaveBeenCalled();
      expect(growthJobs.scheduleDailyGrowthAggregation).toHaveBeenCalled();
      expect(cleanupJobs.scheduleDataCleanup).toHaveBeenCalled();
    });

    it('should mark service as initialized', () => {
      expect(cronService.isInitialized).toBe(false);
      cronService.initialize();
      expect(cronService.isInitialized).toBe(true);
    });

    it('should not initialize twice', () => {
      cronService.initialize();
      cronService.initialize();

      // Each schedule function should only be called once
      expect(reminderJobs.scheduleEventReminders).toHaveBeenCalledTimes(1);
    });
  });

  describe('stopAll', () => {
    it('should stop all cron modules', () => {
      cronService.stopAll();

      expect(reminderJobs.stopAll).toHaveBeenCalled();
      expect(paymentJobs.stopAll).toHaveBeenCalled();
      expect(reportJobs.stopAll).toHaveBeenCalled();
      expect(growthJobs.stopAll).toHaveBeenCalled();
      expect(cleanupJobs.stopAll).toHaveBeenCalled();
    });
  });

  describe('stopModule', () => {
    it('should stop specific module', () => {
      cronService.stopModule('reminderJobs');
      expect(reminderJobs.stopAll).toHaveBeenCalled();
      expect(paymentJobs.stopAll).not.toHaveBeenCalled();
    });

    it('should handle invalid module name', () => {
      expect(() => cronService.stopModule('invalidModule')).not.toThrow();
    });
  });

  describe('getStatus', () => {
    it('should return status of all modules', () => {
      const status = cronService.getStatus();

      expect(status).toHaveProperty('isInitialized');
      expect(status).toHaveProperty('totalJobs');
      expect(status).toHaveProperty('modules');
      expect(status.modules).toHaveProperty('reminderJobs');
      expect(status.modules).toHaveProperty('paymentJobs');
    });

    it('should calculate total jobs correctly', () => {
      const status = cronService.getStatus();
      // Each module mocked to return 2 jobs, 5 modules total
      expect(status.totalJobs).toBe(10);
    });
  });

  describe('getModuleStatus', () => {
    it('should return status of specific module', () => {
      const status = cronService.getModuleStatus('reminderJobs');

      expect(status).toHaveProperty('jobsCount');
      expect(status.jobsCount).toBe(2);
    });

    it('should return null for invalid module', () => {
      const status = cronService.getModuleStatus('invalidModule');
      expect(status).toBeNull();
    });
  });
});

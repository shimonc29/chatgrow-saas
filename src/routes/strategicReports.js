const express = require('express');
const router = express.Router();
const strategicReportService = require('../services/strategicReportService');
const redisManager = require('../services/redisClient');
const auth = require('../middleware/auth');
const { isPremium } = require('../middleware/isPremium');
const { logInfo, logError } = require('../utils/logger');

const authenticateToken = auth.authenticate();

/**
 * Strategic Reports Routes - דוחות אסטרטגיים AI שבועיים
 * 
 * Security:
 * - requireAuth: JWT validation + tenantId extraction
 * - isPremium: Only TRIAL/ACTIVE subscriptions
 * - Redis Caching: tenant-scoped with TTL
 */

/**
 * GET /api/strategic-reports/latest
 * קבלת הדוח האחרון של העסק
 */
router.get('/latest', authenticateToken, isPremium, async (req, res) => {
  try {
    const businessId = req.user.userId || req.provider?.providerId;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID not found in request'
      });
    }

    logInfo('Fetching latest strategic report', { businessId });

    // Try cache first
    const redis = redisManager.getTenantClient(businessId);
    const cacheKey = 'strategic_report:latest';
    
    let cachedReport = await redis.get(cacheKey);
    if (cachedReport) {
      logInfo('Strategic report served from cache', { businessId });
      return res.json({
        success: true,
        report: cachedReport,
        fromCache: true
      });
    }

    // Fetch from DB
    const report = await strategicReportService.getLatestReport(businessId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'לא נמצא דוח זמין. הדוח הבא יופק בקרוב.'
      });
    }

    // Cache for 6 days (report refreshes weekly)
    await redis.set(cacheKey, report, 518400); // 6 days in seconds

    logInfo('Strategic report fetched successfully', {
      businessId,
      reportId: report._id
    });

    res.json({
      success: true,
      report,
      fromCache: false
    });

  } catch (error) {
    logError('Failed to fetch latest strategic report', error, {
      businessId: req.user?.userId
    });

    res.status(500).json({
      success: false,
      message: 'שגיאה בטעינת הדוח האסטרטגי',
      error: error.message
    });
  }
});

/**
 * GET /api/strategic-reports/:reportId
 * קבלת דוח ספציפי לפי ID (עם אימות tenantId)
 */
router.get('/:reportId', authenticateToken, isPremium, async (req, res) => {
  try {
    const businessId = req.user.userId || req.provider?.providerId;
    const { reportId } = req.params;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID not found in request'
      });
    }

    logInfo('Fetching specific strategic report', { businessId, reportId });

    // Try cache first
    const redis = redisManager.getTenantClient(businessId);
    const cacheKey = `strategic_report:${reportId}`;
    
    let cachedReport = await redis.get(cacheKey);
    if (cachedReport) {
      logInfo('Strategic report served from cache', { businessId, reportId });
      return res.json({
        success: true,
        report: cachedReport,
        fromCache: true
      });
    }

    // Fetch from DB with tenantId validation
    const report = await strategicReportService.getReportById(reportId, businessId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'דוח לא נמצא'
      });
    }

    // Cache for 6 days
    await redis.set(cacheKey, report, 518400);

    logInfo('Strategic report fetched successfully', {
      businessId,
      reportId
    });

    res.json({
      success: true,
      report,
      fromCache: false
    });

  } catch (error) {
    // Handle tenant mismatch security error
    if (error.message.includes('Unauthorized')) {
      logError('Unauthorized access attempt to strategic report', error, {
        businessId: req.user?.userId,
        reportId: req.params.reportId
      });

      return res.status(403).json({
        success: false,
        message: 'אין לך הרשאה לצפות בדוח זה'
      });
    }

    logError('Failed to fetch strategic report', error, {
      businessId: req.user?.userId,
      reportId: req.params.reportId
    });

    res.status(500).json({
      success: false,
      message: 'שגיאה בטעינת הדוח',
      error: error.message
    });
  }
});

/**
 * POST /api/strategic-reports/generate
 * יצירת דוח מיידי (למטרות בדיקה או לפי דרישה)
 * 
 * Access Policy: Available to all Premium users for testing/on-demand generation
 * Note: For production use, consider restricting to admins via additional middleware
 * to prevent excessive OpenAI API usage
 */
router.post('/generate', authenticateToken, isPremium, async (req, res) => {
  try {
    const businessId = req.user.userId || req.provider?.providerId;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID not found in request'
      });
    }

    logInfo('Manual strategic report generation requested', { businessId });

    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    // Generate report
    const report = await strategicReportService.generateReport(
      businessId,
      startDate,
      endDate
    );

    // Invalidate cache
    const redis = redisManager.getTenantClient(businessId);
    await redis.del('strategic_report:latest');

    logInfo('Strategic report generated manually', {
      businessId,
      reportId: report._id
    });

    res.json({
      success: true,
      message: 'הדוח נוצר בהצלחה',
      report
    });

  } catch (error) {
    logError('Failed to generate strategic report manually', error, {
      businessId: req.user?.userId
    });

    res.status(500).json({
      success: false,
      message: 'שגיאה ביצירת הדוח',
      error: error.message
    });
  }
});

/**
 * DELETE /api/strategic-reports/cache
 * מחיקת Cache של דוחות (למטרות ניקוי)
 */
router.delete('/cache', authenticateToken, isPremium, async (req, res) => {
  try {
    const businessId = req.user.userId || req.provider?.providerId;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID not found in request'
      });
    }

    const redis = redisManager.getTenantClient(businessId);
    await redis.del('strategic_report:latest');

    logInfo('Strategic reports cache cleared', { businessId });

    res.json({
      success: true,
      message: 'המטמון נוקה בהצלחה'
    });

  } catch (error) {
    logError('Failed to clear cache', error, {
      businessId: req.user?.userId
    });

    res.status(500).json({
      success: false,
      message: 'שגיאה בניקוי המטמון',
      error: error.message
    });
  }
});

module.exports = router;

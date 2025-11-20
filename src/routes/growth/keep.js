const express = require('express');
const router = express.Router();
const growthKeepService = require('../../services/growthKeepService');
const auth = require('../../middleware/auth');
const { isPremium } = require('../../middleware/subscription');
const { logInfo, logError } = require('../../utils/logger');

router.get('/summary', auth.authenticate(), isPremium, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { days = 30 } = req.query;
    
    logInfo('Fetching retention summary', { businessId, days });
    
    const summary = await growthKeepService.getRetentionSummary(
      businessId,
      parseInt(days)
    );
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logError('Error fetching retention summary', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'שגיאה בטעינת סיכום שימור לקוחות',
      error: error.message
    });
  }
});

router.get('/segments', auth.authenticate(), isPremium, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { segment, churnRisk } = req.query;
    
    logInfo('Fetching customers by segment', { businessId, segment, churnRisk });
    
    const customers = await growthKeepService.getCustomersBySegment(
      businessId,
      segment,
      churnRisk
    );
    
    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    logError('Error fetching customers by segment', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'שגיאה בטעינת לקוחות לפי סגמנט',
      error: error.message
    });
  }
});

router.post('/calculate', auth.authenticate(), isPremium, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { customerId } = req.body;
    
    logInfo('Calculating customer health', { businessId, customerId });
    
    const results = await growthKeepService.calculateCustomerHealth(
      businessId,
      customerId
    );
    
    res.json({
      success: true,
      message: 'חישוב בריאות לקוחות הושלם בהצלחה',
      data: results
    });
  } catch (error) {
    logError('Error calculating customer health', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'שגיאה בחישוב בריאות לקוחות',
      error: error.message
    });
  }
});

router.get('/win-back-opportunities', auth.authenticate(), isPremium, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    
    logInfo('Identifying win-back opportunities', { businessId });
    
    const opportunities = await growthKeepService.identifyWinBackOpportunities(businessId);
    
    res.json({
      success: true,
      data: opportunities
    });
  } catch (error) {
    logError('Error identifying win-back opportunities', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'שגיאה בזיהוי הזדמנויות win-back',
      error: error.message
    });
  }
});

router.post('/ai-insights', auth.authenticate(), isPremium, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { segment, customersData } = req.body;
    
    logInfo('Generating AI retention insights', { businessId, segment });
    
    const openaiIntegration = req.app.get('openaiIntegration');
    if (!openaiIntegration) {
      return res.status(503).json({
        success: false,
        message: 'שירות AI אינו זמין כרגע'
      });
    }
    
    const summary = await growthKeepService.getRetentionSummary(businessId, 30);
    
    const prompt = `אתה יועץ עסקי מומחה בשימור לקוחות. נתח את הנתונים הבאים וספק המלצות מעשיות לשיפור שימור הלקוחות:

נתונים:
- סה"כ לקוחות: ${summary.totalCustomers}
- ציון בריאות ממוצע: ${summary.averageHealthScore}/100
- לקוחות נאמנים: ${summary.loyalCustomers}
- לקוחות בסיכון: ${summary.atRiskCustomers}
- אחוז שימור: ${summary.retentionRate}%

פילוח לפי סגמנטים:
${JSON.stringify(summary.segmentCounts, null, 2)}

פילוח לפי רמת סיכון:
${JSON.stringify(summary.churnRiskCounts, null, 2)}

${segment ? `התמקד בסגמנט: ${segment}` : ''}

ספק:
1. ניתוח מצב (2-3 משפטים)
2. 3 המלצות ספציפיות ומעשיות לשיפור שימור
3. אסטרטגיית win-back ללקוחות בסיכון
4. דוגמאות למסרים/הצעות שכדאי לשלוח

כתוב בעברית, תמציתי ומעשי.`;

    const aiResponse = await openaiIntegration.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'אתה יועץ עסקי מומחה בשימור לקוחות ואסטרטגיות retention. אתה נותן המלצות מעשיות ומבוססות נתונים.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const insights = aiResponse.choices[0].message.content;

    res.json({
      success: true,
      data: {
        insights,
        summary,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    logError('Error generating AI retention insights', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'שגיאה ביצירת תובנות AI',
      error: error.message
    });
  }
});

module.exports = router;

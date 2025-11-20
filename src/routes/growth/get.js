const express = require('express');
const router = express.Router();
const Joi = require('joi');
const growthGetService = require('../../services/growthGetService');
const auth = require('../../middleware/auth');
const { logInfo, logError } = require('../../utils/logger');
const aiService = require('../../services/aiService');

const authenticateToken = auth.authenticate();

router.use(authenticateToken);

const periodSchema = Joi.object({
  period: Joi.string().valid('7d', '30d', '90d').default('30d')
});

router.get('/summary', async (req, res) => {
  try {
    const { error, value } = periodSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const businessId = req.user.businessId;
    const periodDays = parseInt(value.period.replace('d', ''));

    const summary = await growthGetService.getSummary(businessId, periodDays);

    logInfo('Growth GET summary retrieved', { businessId, periodDays });

    res.json({
      success: true,
      data: summary,
      period: value.period
    });
  } catch (error) {
    logError('Error getting acquisition summary', { error: error.message, businessId: req.user.businessId });
    res.status(500).json({
      success: false,
      error: 'שגיאה בטעינת נתוני רכישה'
    });
  }
});

router.get('/sources', async (req, res) => {
  try {
    const { error, value } = periodSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const businessId = req.user.businessId;
    const periodDays = parseInt(value.period.replace('d', ''));

    const sources = await growthGetService.getSourceBreakdown(businessId, periodDays);

    logInfo('Growth GET sources retrieved', { businessId, periodDays, sourcesCount: sources.length });

    res.json({
      success: true,
      data: sources,
      period: value.period
    });
  } catch (error) {
    logError('Error getting acquisition sources', { error: error.message, businessId: req.user.businessId });
    res.status(500).json({
      success: false,
      error: 'שגיאה בטעינת מקורות רכישה'
    });
  }
});

router.get('/timeline', async (req, res) => {
  try {
    const { error, value } = periodSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const businessId = req.user.businessId;
    const periodDays = parseInt(value.period.replace('d', ''));

    const timeline = await growthGetService.getTimeline(businessId, periodDays);

    logInfo('Growth GET timeline retrieved', { businessId, periodDays, dataPoints: timeline.length });

    res.json({
      success: true,
      data: timeline,
      period: value.period
    });
  } catch (error) {
    logError('Error getting acquisition timeline', { error: error.message, businessId: req.user.businessId });
    res.status(500).json({
      success: false,
      error: 'שגיאה בטעינת ציר הזמן'
    });
  }
});

router.get('/ai-insights', async (req, res) => {
  try {
    const { error, value } = periodSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const businessId = req.user.businessId;
    const periodDays = parseInt(value.period.replace('d', ''));

    const summary = await growthGetService.getSummary(businessId, periodDays);
    const sources = await growthGetService.getSourceBreakdown(businessId, periodDays);

    const prompt = `
אתה מומחה לשיווק דיגיטלי ורכישת לקוחות. נתח את הנתונים הבאים וספק תובנות והמלצות פעולה בעברית.

**נתוני רכישה כלליים (${periodDays} ימים אחרונים):**
- סה"כ לידים: ${summary.totalLeads}
- סה"כ הזמנות: ${summary.totalBookings}
- סה"כ משלמים: ${summary.totalPayments}
- סה"כ הכנסות: ₪${summary.totalRevenue}
- אחוז המרה כללי: ${summary.conversionRate}%

**פילוח לפי מקורות:**
${sources.map(s => `
- ${s.sourceKey} (${s.sourceType}):
  לידים: ${s.leads}, הזמנות: ${s.bookings}, משלמים: ${s.payments}
  הכנסות: ₪${s.revenue}, אחוז המרה: ${s.conversionRate}%
`).join('\n')}

**ספק:**
1. **מקורות מובילים** - אילו מקורות מביאים את הלקוחות הטובים ביותר (ROI גבוה)?
2. **מקורות חלשים** - אילו מקורות לא מבצעים טוב ומה כדאי לעשות איתם?
3. **המלצות פעולה** - 3 צעדים קונקרטיים לשיפור הרכישה.

השב בפורמט JSON:
{
  "topSources": ["מקור 1", "מקור 2"],
  "weakSources": ["מקור חלש 1"],
  "recommendations": [
    "המלצה 1 - ספציפית ופרקטית",
    "המלצה 2 - ספציפית ופרקטית",
    "המלצה 3 - ספציפית ופרקטית"
  ],
  "summary": "סיכום קצר של המצב הכללי"
}
`;

    const aiResponse = await aiService.generateChatCompletion([
      {
        role: 'system',
        content: 'אתה מומחה לשיווק דיגיטלי ורכישת לקוחות. תמיד עונה בעברית בפורמט JSON תקין.'
      },
      {
        role: 'user',
        content: prompt
      }
    ], {
      temperature: 0.7,
      max_tokens: 1000
    });

    let insights;
    try {
      const content = aiResponse.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      logError('Failed to parse AI insights', { error: parseError.message });
      insights = {
        topSources: [],
        weakSources: [],
        recommendations: ['אין מספיק נתונים להמלצות AI כרגע'],
        summary: 'המערכת אוספת נתונים...'
      };
    }

    logInfo('AI acquisition insights generated', { businessId });

    res.json({
      success: true,
      data: insights,
      period: value.period
    });
  } catch (error) {
    logError('Error generating AI insights', { error: error.message, businessId: req.user.businessId });
    res.status(500).json({
      success: false,
      error: 'שגיאה ביצירת תובנות AI'
    });
  }
});

module.exports = router;

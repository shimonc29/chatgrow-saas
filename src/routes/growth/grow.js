const express = require('express');
const router = express.Router();
const growthGrowService = require('../../services/growthGrowService');
const auth = require('../../middleware/auth');
const { isPremium } = require('../../middleware/isPremium');
const { logInfo, logError } = require('../../utils/logger');

router.get('/summary', auth.authenticate(), isPremium, async (req, res) => {
  try {
    const businessId = req.user.businessId;

    logInfo('Fetching GROW summary', { businessId });

    const summary = await growthGrowService.getGrowthSummary(businessId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logError('Error fetching GROW summary', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'שגיאה בטעינת סיכום הזדמנויות הצמיחה',
      error: error.message
    });
  }
});

router.get('/opportunities', auth.authenticate(), isPremium, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { type, status = 'PENDING' } = req.query;

    logInfo('Fetching GROW opportunities', { businessId, type, status });

    let opportunities;
    if (type) {
      opportunities = await growthGrowService.getOpportunitiesByType(businessId, type, status);
    } else {
      const GrowthOpportunity = require('../../models/GrowthOpportunity');
      opportunities = await GrowthOpportunity.find({
        businessId,
        status
      })
        .populate('customerId', 'name email phone')
        .sort({ potentialValue: -1 })
        .lean();
    }

    res.json({
      success: true,
      data: opportunities
    });
  } catch (error) {
    logError('Error fetching opportunities', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'שגיאה בטעינת הזדמנויות',
      error: error.message
    });
  }
});

router.get('/revenue-expansion', auth.authenticate(), isPremium, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { days = 30 } = req.query;

    logInfo('Fetching revenue expansion metrics', { businessId, days });

    const metrics = await growthGrowService.getRevenueExpansionMetrics(
      businessId,
      parseInt(days)
    );

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logError('Error fetching revenue expansion metrics', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'שגיאה בטעינת מטריקות הרחבת הכנסות',
      error: error.message
    });
  }
});

router.post('/identify', auth.authenticate(), isPremium, async (req, res) => {
  try {
    const businessId = req.user.businessId;

    logInfo('Identifying growth opportunities', { businessId });

    const count = await growthGrowService.identifyGrowthOpportunities(businessId);

    res.json({
      success: true,
      message: `זוהו ${count} הזדמנויות צמיחה חדשות`,
      data: { count }
    });
  } catch (error) {
    logError('Error identifying opportunities', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'שגיאה בזיהוי הזדמנויות',
      error: error.message
    });
  }
});

router.put('/:opportunityId/status', auth.authenticate(), isPremium, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { opportunityId } = req.params;
    const { status, actualValue, notes } = req.body;

    logInfo('Updating opportunity status', { businessId, opportunityId, status });

    const opportunity = await growthGrowService.updateOpportunityStatus(
      opportunityId,
      businessId,
      status,
      actualValue,
      notes
    );

    res.json({
      success: true,
      message: 'סטטוס ההזדמנות עודכן בהצלחה',
      data: opportunity
    });
  } catch (error) {
    logError('Error updating opportunity status', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'שגיאה בעדכון סטטוס ההזדמנות',
      error: error.message
    });
  }
});

router.get('/ai-insights', auth.authenticate(), isPremium, async (req, res) => {
  try {
    const businessId = req.user.businessId;

    logInfo('Generating AI growth insights', { businessId });

    const summary = await growthGrowService.getGrowthSummary(businessId);

    let insights = {
      summary: 'תובנות מבוססות AI להגדלת הכנסות',
      recommendations: [
        {
          category: 'UPSELL',
          title: 'הזדמנויות Upselling',
          insight: 'זוהו לקוחות עם פוטנציאל לשדרוג שירותים',
          actionItems: [
            'התמקד בלקוחות עם ממוצע תשלום גבוה',
            'הצע חבילות premium מותאמות אישית',
            'צור תוכנית loyalty לעידוד שדרוגים'
          ]
        },
        {
          category: 'CROSS_SELL',
          title: 'הזדמנויות Cross-Selling',
          insight: 'לקוחות משתמשים בשירות אחד בלבד',
          actionItems: [
            'הצע שירותים משלימים',
            'צור חבילות combo אטרקטיביות',
            'שלח המלצות מותאמות אישית'
          ]
        },
        {
          category: 'FREQUENCY',
          title: 'הגדלת תדירות רכישה',
          insight: 'לקוחות בעלי ערך עם תדירות רכישה נמוכה',
          actionItems: [
            'הפעל תוכנית נאמנות',
            'שלח תזכורות אוטומטיות',
            'הצע הטבות לרכישות חוזרות'
          ]
        }
      ],
      keyMetrics: {
        totalPotential: summary.summary.totalPotentialValue,
        conversionRate: summary.summary.conversionRate,
        avgDealSize: summary.summary.avgOpportunityValue
      }
    };

    try {
      const { openaiIntegration } = require('../../config/openai');

      const prompt = `
אתה יועץ עסקי מומחה. נתח את הנתונים הבאים וספק המלצות ממוקדות להגדלת הכנסות:

**נתוני הזדמנויות:**
- סה"כ הזדמנויות פעילות: ${summary.summary.totalOpportunities}
- פוטנציאל הכנסות: ₪${summary.summary.totalPotentialValue}
- שיעור המרה: ${summary.summary.conversionRate}%
- ערך ממוצע להזדמנות: ₪${summary.summary.avgOpportunityValue}

**פילוח לפי סוג:**
${summary.breakdown.byType.map(t => `- ${t.type}: ${t.count} הזדמנויות (₪${t.totalValue})`).join('\n')}

**הזדמנויות מובילות:**
${summary.topOpportunities.slice(0, 3).map(o => `- ${o.title}: ₪${o.potentialValue} (${o.confidence} confidence)`).join('\n')}

ספק:
1. 3 המלצות אסטרטגיות ספציפיות להגדלת ההכנסות
2. פעולות מיידיות לביצוע
3. תחזית השפעה צפויה

השב בעברית בפורמט JSON עם המבנה הבא:
{
  "strategicRecommendations": [{"title": "...", "description": "...", "expectedImpact": "..."}],
  "immediateActions": ["..."],
  "forecast": "..."
}
`;

      const aiResponse = await openaiIntegration.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'אתה יועץ עסקי מומחה המתמחה באסטרטגיות צמיחה והגדלת הכנסות. תמיד מספק תשובות ממוקדות ומעשיות בעברית.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const aiContent = aiResponse.choices[0]?.message?.content;
      if (aiContent) {
        try {
          const aiInsights = JSON.parse(aiContent);
          insights = {
            ...insights,
            aiGenerated: true,
            strategicRecommendations: aiInsights.strategicRecommendations || [],
            immediateActions: aiInsights.immediateActions || [],
            forecast: aiInsights.forecast || ''
          };
        } catch (parseError) {
          logError('Error parsing AI response', { error: parseError.message });
        }
      }
    } catch (aiError) {
      logError('AI integration unavailable, using fallback insights', { error: aiError.message });
    }

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    logError('Error generating AI insights', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'שגיאה בייצור תובנות AI',
      error: error.message
    });
  }
});

module.exports = router;

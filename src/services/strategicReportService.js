const OpenAI = require('openai');
const { z } = require('zod');
const StrategicReport = require('../models/StrategicReport');
const dataBrokerService = require('./dataBrokerService');
const { logInfo, logError } = require('../utils/logger');

// OpenAI Client (Replit AI Integrations)
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

/**
 * Zod Schema - אכיפת JSON מובנה מדויק מ-OpenAI
 */
const PricingRecommendationSchema = z.object({
  eventCategory: z.string().describe('קטגוריית האירוע'),
  currentPrice: z.number().describe('מחיר כרטיס נוכחי ממוצע בש"ח'),
  recommendedPrice: z.number().describe('מחיר מומלץ בש"ח'),
  expectedImpact: z.string().describe('השפעה צפויה (לדוגמה: +15% הכנסות)'),
  reasoning: z.string().describe('הסבר קצר להמלצה')
});

const WeeklyTrendSchema = z.object({
  dayOfWeek: z.string().describe('יום בשבוע (ראשון, שני וכו)'),
  expectedAttendance: z.number().describe('מספר משתתפים צפוי'),
  confidence: z.enum(['גבוה', 'בינוני', 'נמוך']).describe('רמת ביטחון בחיזוי')
});

const KeyRiskSchema = z.object({
  category: z.string().describe('קטגוריית הסיכון (תפעול, כספי, תחרות)'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).describe('חומרת הסיכון'),
  description: z.string().describe('תיאור הסיכון'),
  mitigation: z.string().describe('המלצה לטיפול בסיכון')
});

const StrategicReportSchema = z.object({
  pricingRecommendations: z.object({
    currentPricingAnalysis: z.object({
      averageTicketPrice: z.number(),
      revenuePerEvent: z.number(),
      profitMargin: z.number()
    }),
    recommendations: z.array(PricingRecommendationSchema).max(5)
  }),
  demandForecast: z.object({
    weeklyTrends: z.array(WeeklyTrendSchema),
    seasonalPatterns: z.string().describe('תובנות עונתיות'),
    upcomingOpportunities: z.array(z.string()).max(3)
  }),
  keyRisks: z.array(KeyRiskSchema).max(5)
});

/**
 * Strategic Report Service - יצירת דוחות AI אסטרטגיים שבועיים
 */
class StrategicReportService {
  /**
   * יוצר דוח אסטרטגי לעסק ספציפי
   * @param {String} businessId - MongoDB ObjectId
   * @param {Date} startDate - תאריך התחלה
   * @param {Date} endDate - תאריך סיום
   */
  async generateReport(businessId, startDate, endDate) {
    const startTime = Date.now();

    try {
      logInfo('Starting strategic report generation', {
        businessId,
        startDate,
        endDate
      });

      // צור רשומה ראשונית
      const report = new StrategicReport({
        businessId,
        reportPeriod: { startDate, endDate },
        status: 'GENERATING'
      });
      await report.save();

      // שלב 1: איסוף נתונים
      const businessData = await dataBrokerService.collectBusinessData(
        businessId,
        startDate,
        endDate
      );

      // שלב 2: הפעלת AI עם Zod Validation
      const aiInsights = await this.generateAIInsights(businessData);

      // שלב 3: עדכון הדוח בתוצאות
      report.status = 'COMPLETED';
      report.pricingRecommendations = aiInsights.pricingRecommendations;
      report.demandForecast = aiInsights.demandForecast;
      report.keyRisks = aiInsights.keyRisks;
      report.performanceMetrics = {
        totalRevenue: businessData.payments.totalRevenue,
        totalEvents: businessData.events.totalEvents,
        averageAttendance: businessData.events.averageAttendance,
        conversionRate: parseFloat(businessData.events.occupancyRate),
        customerRetention: businessData.customers.retentionRate
      };
      report.aiMetadata = {
        model: 'gpt-4o-mini',
        tokensUsed: aiInsights.tokensUsed || 0,
        processingTime: Date.now() - startTime
      };

      await report.save();

      logInfo('Strategic report generated successfully', {
        businessId,
        reportId: report._id,
        processingTime: report.aiMetadata.processingTime
      });

      return report;
    } catch (error) {
      logError('Failed to generate strategic report', error, { businessId });

      // עדכן כ-FAILED
      await StrategicReport.findOneAndUpdate(
        { businessId, status: 'GENERATING' },
        {
          status: 'FAILED',
          errorLog: {
            message: error.message,
            timestamp: new Date()
          }
        }
      );

      throw error;
    }
  }

  /**
   * קריאה ל-OpenAI עם Zod Structured Outputs
   */
  async generateAIInsights(businessData) {
    try {
      const prompt = this.buildPrompt(businessData);

      logInfo('Calling OpenAI for strategic insights', {
        businessId: businessData.businessId,
        model: 'gpt-4o-mini'
      });

      // שימוש ב-Zod Schema Validation עם OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `אתה יועץ אסטרטגי בכיר המתמחה באופטימיזציית תמחור וחיזוי ביקוש לעסקים קטנים-בינוניים בישראל.
המטרה: ספק המלצות **מעשיות, מבוססות-נתונים ומוכוונות-רווח** בעברית פשוטה.
חשוב: השב **רק ב-JSON** בפורמט המדויק שנדרש.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        response_format: { type: 'json_object' } // Force JSON output
      });

      const content = response.choices[0].message.content;
      const parsedData = JSON.parse(content);

      // Zod Validation - וידוא שה-JSON תקין
      const validated = StrategicReportSchema.parse(parsedData);

      logInfo('AI insights validated successfully', {
        businessId: businessData.businessId,
        tokensUsed: response.usage?.total_tokens
      });

      return {
        ...validated,
        tokensUsed: response.usage?.total_tokens || 0
      };
    } catch (error) {
      logError('AI insights generation failed - using fallback insights', error, {
        businessId: businessData.businessId,
        errorType: error.constructor.name,
        alertOps: true // Alert operations team about AI degradation
      });

      // Fallback - דוח מינימלי במקרה של כשל
      return this.getFallbackInsights(businessData);
    }
  }

  /**
   * בונה Prompt מפורט ל-AI
   */
  buildPrompt(businessData) {
    const { events, payments, customers, appointments } = businessData;

    return `
🔍 **ניתוח נתונים עסקיים - דוח אסטרטגי שבועי**

📊 **ביצועים כלליים:**
- סה"כ אירועים: ${events.totalEvents}
- סה"כ הכנסות: ${payments.totalRevenue} ₪
- ממוצע משתתפים באירוע: ${events.averageAttendance}
- אחוז תפוסה: ${events.occupancyRate}%
- שימור לקוחות: ${customers.retentionRate}%
- לקוחות חדשים: ${customers.newCustomers}

📈 **פילוח לפי קטגוריות:**
${events.categoryBreakdown.map(cat => 
  `- ${cat.category}: ${cat.count} אירועים, הכנסה: ${cat.totalRevenue} ₪, ממוצע משתתפים: ${cat.averageAttendance}`
).join('\n')}

💼 **תורים:**
- סה"כ תורים: ${appointments.totalAppointments}
- שיעור השלמה: ${appointments.completionRate}%

---

📝 **משימה:**
על בסיס הנתונים לעיל, ספק דוח JSON מובנה עם:

1. **pricingRecommendations** - ניתוח תמחור והמלצות לשיפור
2. **demandForecast** - חיזוי ביקוש שבועי ותובנות עונתיות
3. **keyRisks** - זיהוי סיכונים והמלצות לטיפול

⚠️ **חשוב:** 
- כל המחירים בש"ח
- כל ההמלצות חייבות להיות **פרקטיות ומעשיות**
- השב **רק ב-JSON** בפורמט הבא:

{
  "pricingRecommendations": {
    "currentPricingAnalysis": {
      "averageTicketPrice": ${events.averagePrice || 0},
      "revenuePerEvent": ${events.totalEvents > 0 ? Math.round(payments.totalRevenue / events.totalEvents) : 0},
      "profitMargin": 25
    },
    "recommendations": [
      {
        "eventCategory": "שם קטגוריה",
        "currentPrice": 100,
        "recommendedPrice": 120,
        "expectedImpact": "+20% הכנסות",
        "reasoning": "הסבר קצר"
      }
    ]
  },
  "demandForecast": {
    "weeklyTrends": [
      {
        "dayOfWeek": "ראשון",
        "expectedAttendance": 50,
        "confidence": "גבוה"
      }
    ],
    "seasonalPatterns": "תובנות עונתיות",
    "upcomingOpportunities": ["הזדמנות 1", "הזדמנות 2"]
  },
  "keyRisks": [
    {
      "category": "כספי",
      "severity": "MEDIUM",
      "description": "תיאור הסיכון",
      "mitigation": "המלצה לטיפול"
    }
  ]
}
`;
  }

  /**
   * Fallback Insights - במקרה של כשל AI
   */
  getFallbackInsights(businessData) {
    return {
      pricingRecommendations: {
        currentPricingAnalysis: {
          averageTicketPrice: businessData.events.averagePrice || 0,
          revenuePerEvent: businessData.events.totalEvents > 0
            ? Math.round(businessData.payments.totalRevenue / businessData.events.totalEvents)
            : 0,
          profitMargin: 20
        },
        recommendations: []
      },
      demandForecast: {
        weeklyTrends: [],
        seasonalPatterns: 'לא זמין - נדרש מידע נוסף',
        upcomingOpportunities: []
      },
      keyRisks: [
        {
          category: 'מערכת',
          severity: 'LOW',
          description: 'לא ניתן היה לייצר דוח AI מלא',
          mitigation: 'הדוח יתעדכן בריצה הבאה'
        }
      ],
      tokensUsed: 0
    };
  }

  /**
   * שליפת הדוח האחרון לעסק
   */
  async getLatestReport(businessId) {
    return StrategicReport.getLatestReport(businessId);
  }

  /**
   * שליפת דוח לפי ID (עם אימות tenantId)
   */
  async getReportById(reportId, businessId) {
    const report = await StrategicReport.findById(reportId).lean();

    if (!report) {
      throw new Error('Report not found');
    }

    // אבטחה: ודא ש-businessId תואם
    if (report.businessId.toString() !== businessId.toString()) {
      throw new Error('Unauthorized: Tenant mismatch');
    }

    return report;
  }
}

module.exports = new StrategicReportService();

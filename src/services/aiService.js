const OpenAI = require('openai');
const eventDataService = require('./eventDataService');
const { logInfo, logError } = require('../utils/logger');

// השתמש ב-Replit AI Integrations (לא צריך API Key משלך!)
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

/**
 * שירות AI לניתוח ביצועים והמלצות חכמות לאירועים
 * משתמש ב-OpenAI GPT-4o-mini דרך Replit AI Integrations
 */
class AIService {
  /**
   * קבלת המלצות AI לאירוע
   */
  async getPerformanceInsights(eventId, eventData, businessId) {
    try {
      // שלוף נתונים היסטוריים
      const historicalData = await eventDataService.getHistoricalData(businessId);

      // בנה את ה-Prompt המפורט
      const prompt = this.buildInsightsPrompt(eventData, historicalData);

      logInfo('Requesting AI insights', {
        eventId,
        businessId,
        model: 'gpt-4o-mini'
      });

      // קריאה ל-OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // מודל חסכוני ומהיר
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.7
      });

      const insights = response.choices[0]?.message?.content || 'לא ניתן להפיק המלצות כרגע';

      logInfo('AI insights generated successfully', {
        eventId,
        businessId,
        tokensUsed: response.usage?.total_tokens
      });

      return {
        success: true,
        insights,
        metadata: {
          model: 'gpt-4o-mini',
          tokensUsed: response.usage?.total_tokens || 0,
          generatedAt: new Date()
        }
      };

    } catch (error) {
      logError('Failed to generate AI insights', error, { eventId, businessId });
      
      return {
        success: false,
        insights: this.getFallbackInsights(eventData),
        error: error.message
      };
    }
  }

  /**
   * בניית Prompt מפורט לניתוח AI
   */
  buildInsightsPrompt(eventData, historicalData) {
    const price = eventData.price || 0;
    const date = new Date(eventData.date).toLocaleDateString('he-IL', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const category = eventData.category || 'אירוע';
    const occupancyRate = eventData.maxParticipants > 0 
      ? ((eventData.currentParticipants / eventData.maxParticipants) * 100).toFixed(1)
      : 0;

    // עלות משתנה משוערת (ניתן להתאים לפי קטגוריה)
    const estimatedCOGS = this.estimateCOGS(category, price);
    const grossProfit = Math.max(0, price - estimatedCOGS);

    return `
אתה יועץ ביצועים עסקי (AI Performance Coach) המתמחה בניהול אירועים והשקות.
המטרה שלך: לספק המלצות **פרקטיות ומוכוונות רווח** לבעל עסק ישראלי.

--- נתונים לניתוח ---

**האירוע הנוכחי:**
- שם: ${eventData.name}
- קטגוריה: ${category}
- מחיר כרטיס: ${price} ₪
- מועד: ${date}
- תפוסה נוכחית: ${eventData.currentParticipants}/${eventData.maxParticipants} (${occupancyRate}%)
- רווח גולמי משוער לכרטיס: ${grossProfit} ₪
- סטטוס: ${eventData.status === 'published' ? 'פורסם' : 'טיוטה'}

**ביצועים היסטוריים של העסק:**
${historicalData.totalUserEvents > 0 ? `
- סה"כ אירועים קודמים שנותחו: ${historicalData.totalUserEvents}
- ממוצע תפוסה: ${this.calculateAvgOccupancy(historicalData.userEvents)}%
- ממוצע מחיר: ${this.calculateAvgPrice(historicalData.userEvents)} ₪
- האירוע הכי מוצלח: ${this.getBestEvent(historicalData.userEvents)}
` : 'אין היסטוריה קודמת - זה האירוע הראשון'}

**ממוצעי פלטפורמה (אנונימיים):**
- תפוסה ממוצעת: ${historicalData.platformAverages.avgOccupancyRate}%
- מחיר ממוצע: ${historicalData.platformAverages.avgPrice} ₪
- יום/שעה פופולריים: ${historicalData.platformAverages.avgPeakDay} ${historicalData.platformAverages.avgPeakTime}
- אחוז המרה משוער: ${historicalData.platformAverages.conversionRateEstimate}%

--- משימה: ניתוח והמלצות (השב בפורמט Markdown בעברית) ---

**הנחיות:**
1. השב ישירות ללא הקדמות מיותרות
2. התמקד במספרים ספציפיים (לא "שקול להעלות", אלא "העלה ל-180 ₪")
3. הסבר בקצרה את ההיגיון מאחורי כל המלצה
4. אם הנתונים טובים - אמר זאת! לא הכל צריך שינוי

**סעיפי הניתוח:**

### 💰 תמחור אופטימלי (Pricing Optimizer)
נתח את המחיר ${price} ₪ ביחס לנתונים ההיסטוריים ולממוצעי הפלטפורמה. 
- האם המחיר הזה ממקסם מכירות?
- המלץ על מחיר מדויק או אשר את המחיר הנוכחי
- הסבר את ההיגיון (ביקוש, תחרות, רגישות למחיר)

### 📅 זמן ומיקום מיטביים (Timing Optimizer)
השווה את המועד ${date} למגמות העבר.
- האם יש יום/שעה אחרים שמביאים תפוסה גבוהה יותר?
- המלץ על שינוי ספציפי או אשר את המועד
- הסבר למה (זמינות קהל, הרגלי צריכה)

### 🎯 אופטימיזציה של דף ההרשמה (Conversion Rate)
המלץ על **שינוי אחד ספציפי** בדף ההרשמה שיכול להעלות המרות:
- תמונה? וידאו? טקסט? חוות דעת?
- למה דווקא השינוי הזה?
- מה התוצאה הצפויה? (למשל: "עלייה של 10% בהמרות")

**פורמט התשובה:** Markdown בעברית, ישיר וממוקד פעולה.
    `.trim();
  }

  /**
   * אומדן עלות משתנה לפי קטגוריה
   */
  estimateCOGS(category, price) {
    const cogsRatios = {
      'workshop': 0.3,      // 30% מהמחיר
      'class': 0.25,        // 25%
      'seminar': 0.2,       // 20%
      'consultation': 0.15, // 15%
      'performance': 0.4,   // 40%
      'meeting': 0.1,       // 10%
      'other': 0.25         // 25%
    };

    const ratio = cogsRatios[category] || 0.25;
    return Math.round(price * ratio);
  }

  /**
   * חישוב ממוצע תפוסה
   */
  calculateAvgOccupancy(events) {
    if (!events || events.length === 0) return 0;
    const total = events.reduce((sum, e) => sum + parseFloat(e.occupancyRate || 0), 0);
    return (total / events.length).toFixed(1);
  }

  /**
   * חישוב ממוצע מחיר
   */
  calculateAvgPrice(events) {
    if (!events || events.length === 0) return 0;
    const total = events.reduce((sum, e) => sum + (e.price || 0), 0);
    return Math.round(total / events.length);
  }

  /**
   * מציאת האירוע הכי מוצלח
   */
  getBestEvent(events) {
    if (!events || events.length === 0) return 'אין נתונים';
    
    const sorted = [...events].sort((a, b) => {
      const scoreA = parseFloat(a.occupancyRate || 0) * (a.revenue || 0);
      const scoreB = parseFloat(b.occupancyRate || 0) * (b.revenue || 0);
      return scoreB - scoreA;
    });

    const best = sorted[0];
    return `${best.name} (תפוסה: ${best.occupancyRate}%, הכנסה: ${best.revenue} ₪)`;
  }

  /**
   * המלצות fallback במקרה של שגיאה
   */
  getFallbackInsights(eventData) {
    return `
### 💰 תמחור אופטימלי
המחיר הנוכחי: ${eventData.price} ₪. 
המערכת ממליצה לבצע ניתוח שוק ולבדוק את התחרות באזור.

### 📅 זמן ומיקום מיטביים
אירועים ביום רביעי בשעה 19:00 נוטים להצליח יותר בפלטפורמה.

### 🎯 אופטימיזציה של דף ההרשמה
שקול להוסיף תמונות איכותיות וחוות דעת של משתתפים קודמים.

*הערה: המלצות אלו הן כלליות. לניתוח מעמיק יותר, נסה שוב מאוחר יותר.*
    `.trim();
  }
}

module.exports = new AIService();

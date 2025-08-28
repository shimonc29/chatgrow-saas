# ChatGrow Logging System 📊

מערכת לוגים מקיפה לניהול מעקב אחר הודעות WhatsApp עם יכולות מתקדמות לניתוח, דוחות ותחזוקה.

## 🎯 מטרות המערכת

- **מעקב מלא אחר הודעות**: מעקב אחר כל שלב בחיי ההודעה (יצירה, שליחה, מסירה, קריאה, כישלון)
- **ניתוח ביצועים**: מדידת זמני עיבוד ומסירה, זיהוי צווארי בקבוק
- **דוחות מתקדמים**: דוחות מפורטים עם המלצות לשיפור
- **ניהול שגיאות**: מעקב אחר שגיאות וניתוח דפוסים
- **תחזוקה אוטומטית**: ניקוי לוגים ישנים ושמירה על ביצועים

## 🏗️ ארכיטקטורה

```
src/
├── utils/
│   └── logger.js              # מערכת Winston עם רוטציה יומית
├── models/
│   └── MessageLog.js          # מודל MongoDB להודעות
├── services/
│   └── logService.js          # שירות לניהול הלוגים
├── routes/
│   └── logs.js                # API endpoints
└── logging-example.js         # דוגמאות שימוש
```

## 📦 התקנה

### 1. התקנת תלויות נוספות

```bash
npm install winston winston-daily-rotate-file
```

### 2. הגדרת משתני סביבה

הוסף לקובץ `.env`:

```env
# Logging Configuration
LOG_LEVEL=info                    # error, warn, info, debug
NODE_ENV=development              # development, production, test
```

### 3. יצירת תיקיית לוגים

```bash
mkdir logs
```

## 🚀 שימוש בסיסי

### 1. ייבוא המערכת

```javascript
const { 
    logInfo, 
    logError, 
    logWarning, 
    logDebug,
    logWhatsAppMessage,
    logWhatsAppError 
} = require('./src/utils/logger');

const LogService = require('./src/services/logService');
```

### 2. לוגים בסיסיים

```javascript
// לוגים רגילים
logInfo('Application started', { version: '1.0.0' });
logWarning('Rate limit approaching', { connectionId: 'conn_123' });
logError('Database error', new Error('Connection failed'));

// לוגים ספציפיים ל-WhatsApp
logWhatsAppMessage('conn_123', 'msg_456', '+972501234567', 'sent');
logWhatsAppError('conn_123', 'msg_789', '+972501234567', new Error('Invalid number'));
```

### 3. שימוש בשירות הלוגים

```javascript
const logService = new LogService();

// לוג הודעה חדשה
const messageLog = await logService.logMessage({
    messageId: 'msg_123',
    connectionId: 'conn_123',
    recipient: '+972501234567',
    messageContent: 'Hello World!',
    userId: 'user_123'
});

// עדכון סטטוס
await logService.updateMessageStatus('msg_123', 'sent', {
    processingTime: 150,
    whatsappMessageId: 'wa_msg_456'
});
```

## 📊 API Endpoints

### 1. היסטוריית הודעות

```http
GET /api/logs/messages?connectionId=conn_123&limit=100&skip=0
```

**פרמטרים:**
- `connectionId` - מזהה החיבור
- `recipient` - מספר טלפון
- `status` - סטטוס ההודעה
- `startDate` - תאריך התחלה
- `endDate` - תאריך סיום
- `limit` - מספר תוצאות (מקסימום 1000)
- `skip` - דילוג על תוצאות
- `sortBy` - שדה למיון
- `sortOrder` - סדר מיון (asc/desc)

### 2. סטטיסטיקות מסירה

```http
GET /api/logs/stats?connectionId=conn_123&startDate=2024-01-01&endDate=2024-01-31
```

**תגובה:**
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "totalMessages": 1500,
    "successfulMessages": 1425,
    "successRate": "95.00",
    "stats": {
      "sent": {
        "count": 1500,
        "percentage": "100.00",
        "avgProcessingTime": 150,
        "avgDeliveryTime": 2000
      },
      "delivered": {
        "count": 1425,
        "percentage": "95.00",
        "avgProcessingTime": 150,
        "avgDeliveryTime": 2000
      },
      "failed": {
        "count": 75,
        "percentage": "5.00",
        "avgProcessingTime": 100,
        "avgDeliveryTime": 0
      }
    }
  }
}
```

### 3. סטטיסטיקות חיבור

```http
GET /api/logs/connection/conn_123?startDate=2024-01-01&endDate=2024-01-31
```

### 4. דוח מקיף

```http
GET /api/logs/report?connectionId=conn_123&includeDailyStats=true&includeFailedMessages=true
```

### 5. הודעות שנכשלו

```http
GET /api/logs/failed?limit=50&skip=0
```

### 6. הודעות לפי מקבל

```http
GET /api/logs/recipient/+972501234567?limit=100&skip=0
```

### 7. סטטוס הודעה ספציפית

```http
GET /api/logs/status/msg_123
```

### 8. ניקוי לוגים ישנים

```http
POST /api/logs/clean
Content-Type: application/json

{
  "daysToKeep": 90
}
```

### 9. בדיקת בריאות המערכת

```http
GET /api/logs/health
```

## 📈 דוגמאות מתקדמות

### 1. מעקב אחר מחזור חיים של הודעה

```javascript
const logService = new LogService();

// 1. יצירת הודעה
const messageLog = await logService.logMessage({
    messageId: `msg_${Date.now()}`,
    connectionId: 'conn_123',
    recipient: '+972501234567',
    messageContent: 'Hello from ChatGrow!',
    userId: 'user_123'
});

// 2. עדכון לסטטוס "נשלח"
await logService.updateMessageStatus(messageLog.messageId, 'sent', {
    processingTime: 150,
    whatsappMessageId: 'wa_msg_456'
});

// 3. עדכון לסטטוס "נמסר"
await logService.updateMessageStatus(messageLog.messageId, 'delivered', {
    deliveryTime: 2000
});

// 4. עדכון לסטטוס "נקרא"
await logService.updateMessageStatus(messageLog.messageId, 'read');
```

### 2. ניתוח ביצועים

```javascript
// קבלת סטטיסטיקות מסירה
const stats = await logService.getDeliveryStats({
    connectionId: 'conn_123',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // שבוע אחרון
    endDate: new Date()
});

console.log(`Success Rate: ${stats.successRate}%`);
console.log(`Average Processing Time: ${stats.stats.sent?.avgProcessingTime}ms`);
console.log(`Average Delivery Time: ${stats.stats.delivered?.avgDeliveryTime}ms`);
```

### 3. יצירת דוח מקיף

```javascript
const report = await logService.generateReport({
    connectionId: 'conn_123',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // חודש אחרון
    endDate: new Date(),
    includeDailyStats: true,
    includeFailedMessages: true
});

console.log('Report Summary:', report.summary);
console.log('Recommendations:', report.recommendations);
```

### 4. ניתוח שגיאות

```javascript
// קבלת הודעות שנכשלו
const failedMessages = await logService.getMessageHistory({
    status: 'failed',
    limit: 100,
    sortBy: 'failedAt',
    sortOrder: 'desc'
});

// ניתוח דפוסי שגיאות
const errorPatterns = failedMessages.messages.reduce((patterns, msg) => {
    const errorCode = msg.error?.code || 'UNKNOWN';
    patterns[errorCode] = (patterns[errorCode] || 0) + 1;
    return patterns;
}, {});

console.log('Error Patterns:', errorPatterns);
```

## 🔧 הגדרות מתקדמות

### 1. הגדרת רמות לוג

```javascript
// בקובץ .env
LOG_LEVEL=debug  # error, warn, info, debug
```

### 2. הגדרת רוטציה

```javascript
// בקובץ src/utils/logger.js
const createDailyRotateTransport = (level, filename) => {
    return new DailyRotateFile({
        filename: path.join(logsDir, `${filename}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',        // גודל מקסימלי לקובץ
        maxFiles: '14d',       // שמירה ל-14 ימים
        level: level,
        format: jsonFormat
    });
};
```

### 3. הגדרת TTL בבסיס הנתונים

```javascript
// בקובץ src/models/MessageLog.js
messageLogSchema.index({ createdAt: 1 }, { 
    expireAfterSeconds: 7776000  // 90 ימים
});
```

## 📊 קבצי לוג

המערכת יוצרת קבצי לוג נפרדים לפי רמה:

```
logs/
├── error-2024-01-15.log.gz
├── warn-2024-01-15.log.gz
├── info-2024-01-15.log.gz
├── debug-2024-01-15.log.gz
├── exceptions-2024-01-15.log.gz
└── rejections-2024-01-15.log.gz
```

### פורמט JSON

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "WhatsApp Message",
  "connectionId": "conn_123",
  "messageId": "msg_456",
  "recipient": "+972501234567",
  "status": "sent",
  "service": "chatgrow",
  "version": "1.0.0"
}
```

## 🔍 ניטור ובדיקות

### 1. בדיקת בריאות

```bash
curl http://localhost:3000/api/logs/health
```

### 2. בדיקת ביצועים

```javascript
// מדידת זמני תגובה
const startTime = Date.now();
const result = await logService.getMessageHistory(filters);
const responseTime = Date.now() - startTime;

console.log(`Response time: ${responseTime}ms`);
```

### 3. ניטור שגיאות

```javascript
// מעקב אחר שגיאות נפוצות
const failedMessages = await logService.getMessageHistory({
    status: 'failed',
    limit: 1000
});

const errorSummary = failedMessages.messages.reduce((summary, msg) => {
    const errorCode = msg.error?.code || 'UNKNOWN';
    summary[errorCode] = (summary[errorCode] || 0) + 1;
    return summary;
}, {});

console.log('Error Summary:', errorSummary);
```

## 🛠️ תחזוקה

### 1. ניקוי אוטומטי

```javascript
// ניקוי לוגים ישנים מ-90 ימים
const cleanupResult = await logService.cleanOldLogs(90);
console.log(`Cleaned ${cleanupResult.deletedCount} old entries`);
```

### 2. גיבוי לוגים

```bash
# גיבוי קבצי לוג
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/

# גיבוי מבסיס הנתונים
mongodump --db chatgrow --collection message_logs --out backup/
```

### 3. שחזור

```bash
# שחזור מבסיס הנתונים
mongorestore --db chatgrow --collection message_logs backup/chatgrow/message_logs.bson
```

## 🚀 פריסה לייצור

### 1. הגדרות ייצור

```env
NODE_ENV=production
LOG_LEVEL=warn
```

### 2. ניטור בייצור

```javascript
// הוספת ניטור חיצוני
const winston = require('winston');

// הוספת transport לניטור חיצוני
logger.add(new winston.transports.Http({
    host: 'your-monitoring-service.com',
    port: 80,
    path: '/logs'
}));
```

### 3. התראות

```javascript
// התראה על שיעור הצלחה נמוך
const stats = await logService.getDeliveryStats({
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
});

if (parseFloat(stats.successRate) < 80) {
    // שליחת התראה
    await sendAlert(`Low success rate: ${stats.successRate}%`);
}
```

## 📚 דוגמאות נוספות

ראה קובץ `src/logging-example.js` לדוגמאות מקיפות של:

- לוגים בסיסיים
- מעקב אחר מחזור חיים של הודעה
- קבלת היסטוריה וסטטיסטיקות
- טיפול בשגיאות
- תחזוקת לוגים

## 🤝 תרומה

1. Fork את הפרויקט
2. צור branch חדש (`git checkout -b feature/amazing-feature`)
3. Commit את השינויים (`git commit -m 'Add amazing feature'`)
4. Push ל-branch (`git push origin feature/amazing-feature`)
5. פתח Pull Request

## 📄 רישיון

פרויקט זה מוגן תחת רישיון MIT. ראה קובץ `LICENSE` לפרטים.

---

**🎯 מטרה**: מערכת לוגים מקיפה ומתקדמת לניהול מעקב אחר הודעות WhatsApp עם יכולות ניתוח ותחזוקה מתקדמות.

**🚀 מוכן לייצור**: המערכת מוכנה לשימוש בייצור עם כל התכונות הנדרשות לניהול לוגים מקצועי. 
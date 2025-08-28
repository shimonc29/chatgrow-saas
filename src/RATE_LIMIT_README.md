# Advanced Rate Limiting System for WhatsApp

מערכת Rate Limiting מתקדמת למניעת חסימות WhatsApp עם ניטור חכם, התראות, ולוגים מפורטים.

## 🎯 מטרה

**אפס חסימות WhatsApp!** המערכת מונעת חסימות על ידי:
- Rate limiting חכם לכל connection
- Jitter אקראי למניעת זיהוי
- התראות כשמתקרבים למגבלות
- ניטור מתקדם וסטטיסטיקות
- לוגים מפורטים לכל פעולה

## 🏗️ ארכיטקטורה

```
src/
├── models/
│   └── RateLimit.js           # MongoDB model עם סטטיסטיקות מתקדמות
├── utils/
│   └── rateLimitUtils.js      # פונקציות עזר לחישובים וניהול מטמון
├── middleware/
│   └── rateLimiter.js         # Express middleware עם endpoints
└── rate-limit-example.js      # דוגמאות שימוש
```

## 🚀 תכונות מתקדמות

### ✅ **Rate Limiting חכם**
- **30-45 שניות** בין הודעות לכל connection
- **Jitter אקראי** של ±10 שניות
- **מעקב נפרד** לכל connection ID
- **מגבלה יומית** של 1000 הודעות (ניתן לשינוי)

### ✅ **מערכת התראות**
- **Warning** ב-80% מהמגבלה היומית
- **Blocking** אוטומטי כשעוברים את המגבלה
- **Pause/Resume** ידני לכל connection
- **Reset** אוטומטי כל יום

### ✅ **ניטור ומעקב**
- **סטטיסטיקות בזמן אמת** לכל connection
- **לוגים מפורטים** עם Winston
- **מטמון ביצועים** עם TTL של 5 דקות
- **ניקוי אוטומטי** של רשומות ישנות

### ✅ **Express Integration**
- **Middleware** מוכן לשימוש
- **REST API** לניהול rate limits
- **Headers** סטנדרטיים (X-RateLimit-*)
- **Error handling** מקיף

## 📦 התקנה

### 1. התקנת תלויות
```bash
npm install mongoose winston
```

### 2. הגדרת MongoDB
```javascript
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
```

### 3. יצירת Rate Limiter
```javascript
const RateLimiterMiddleware = require('./middleware/rateLimiter');

const rateLimiter = new RateLimiterMiddleware({
  baseInterval: 30000,    // 30 שניות
  jitterRange: 10000,     // ±10 שניות
  enableWarnings: true,
  enableLogging: true
});
```

## 📖 שימוש

### שימוש בסיסי

```javascript
const { getRateLimitStatus, updateRateLimitAfterMessage } = require('./utils/rateLimitUtils');

// בדיקת סטטוס
const status = await getRateLimitStatus('connection-123');
console.log(status.canSend); // true/false

// שליחת הודעה
if (status.canSend) {
  // שלח הודעה...
  await updateRateLimitAfterMessage('connection-123');
}
```

### שימוש עם Express

```javascript
const { rateLimit, updateRateLimit, router } = rateLimiter.createMiddleware();

// החלת rate limiting על routes
app.post('/api/send-message', 
  rateLimit,           // בדיקת rate limit לפני שליחה
  sendMessageHandler,  // לוגיקת שליחת ההודעה
  updateRateLimit      // עדכון rate limit אחרי שליחה
);

// הוספת endpoints לניהול
app.use('/api/rate-limit', router);
```

### API Endpoints

```bash
# בדיקת סטטוס
GET /api/rate-limit/status/:connectionId

# השהיית connection
POST /api/rate-limit/pause/:connectionId

# חידוש connection
POST /api/rate-limit/resume/:connectionId

# איפוס connection
POST /api/rate-limit/reset/:connectionId
```

## 📊 סטטיסטיקות ותגובות

### Rate Limit Status Response
```javascript
{
  "connectionId": "connection-123",
  "canSend": true,
  "status": "active",
  "delay": 0,
  "reason": "Ready to send",
  "stats": {
    "messageCount": 150,
    "dailyMessageCount": 45,
    "dailyLimit": 1000,
    "warningThreshold": 800,
    "lastMessageTime": "2024-01-01T12:00:00.000Z",
    "nextAllowedTime": "2024-01-01T12:00:30.000Z",
    "currentInterval": 35000,
    "warningCount": 0,
    "blockCount": 0
  }
}
```

### Error Response (Rate Limit Exceeded)
```javascript
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Message sending blocked: Connection is blocked",
  "details": {
    "connectionId": "connection-123",
    "status": "blocked",
    "delay": 0,
    "retryAfter": 0,
    "nextAllowedTime": "2024-01-02T00:00:00.000Z",
    "dailyMessageCount": 1000,
    "dailyLimit": 1000
  }
}
```

### HTTP Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 955
X-RateLimit-Reset: 2024-01-01T12:00:30.000Z
Retry-After: 30
X-RateLimit-Status: active
```

## 🔧 הגדרות מתקדמות

### הגדרת Rate Limiter
```javascript
const rateLimiter = new RateLimiterMiddleware({
  baseInterval: 30000,        // זמן בסיס בין הודעות (מילישניות)
  jitterRange: 10000,         // טווח jitter אקראי (מילישניות)
  enableWarnings: true,       // הפעלת התראות
  enableLogging: true,        // הפעלת לוגים
  strictMode: false           // מצב קפדני
});
```

### הגדרת MongoDB Model
```javascript
// ב-RateLimit.js
rateLimitConfig: {
  baseInterval: 30000,        // 30 שניות
  maxInterval: 45000,         // 45 שניות
  jitterRange: 10000,         // 10 שניות
  dailyLimit: 1000,           // 1000 הודעות ליום
  warningThreshold: 800       // התראה ב-80%
}
```

## 📝 לוגים

### קבצי לוג
- `logs/rate-limit-error.log` - שגיאות בלבד
- `logs/rate-limit-combined.log` - כל הלוגים

### דוגמאות לוגים
```javascript
// לוג הצלחה
{
  "level": "info",
  "message": "Rate limit check passed",
  "connectionId": "connection-123",
  "status": "active",
  "dailyMessageCount": 45,
  "dailyLimit": 1000,
  "remainingMessages": 955
}

// לוג אזהרה
{
  "level": "warn",
  "message": "Connection approaching daily limit",
  "connectionId": "connection-123",
  "dailyMessageCount": 850,
  "dailyLimit": 1000,
  "percentageUsed": "85.00%"
}

// לוג חסימה
{
  "level": "error",
  "message": "Connection blocked due to daily limit",
  "connectionId": "connection-123",
  "dailyMessageCount": 1000,
  "dailyLimit": 1000
}
```

## 🚨 ניהול שגיאות

### שגיאות נפוצות
1. **Connection Blocked**: `Connection is blocked`
2. **Rate Limit Active**: `Rate limit active`
3. **Connection Paused**: `Connection is paused`
4. **Daily Limit Exceeded**: `Daily limit exceeded`

### טיפול בשגיאות
```javascript
try {
  const status = await getRateLimitStatus(connectionId);
  if (!status.canSend) {
    console.log(`Cannot send: ${status.reason}`);
    console.log(`Wait time: ${status.delay}ms`);
  }
} catch (error) {
  console.error('Rate limit error:', error.message);
}
```

## ⚡ ביצועים

### מטמון
- **In-memory cache** עם TTL של 5 דקות
- **ניקוי אוטומטי** כל 10 דקות
- **ביצועים מהירים** לבדיקות תכופות

### Database
- **Indexes** מותאמים לביצועים
- **ניקוי אוטומטי** של רשומות ישנות
- **Aggregation** לסטטיסטיקות

## 🧪 בדיקות

### הרצת דוגמאות
```bash
node src/rate-limit-example.js
```

### בדיקות ידניות
```javascript
// בדיקת סטטוס
const status = await getRateLimitStatus('test-connection');

// סימולציית שליחת הודעות
for (let i = 0; i < 10; i++) {
  const canSend = await canSendMessage('test-connection');
  if (canSend.canSend) {
    await updateRateLimitAfterMessage('test-connection');
  }
}
```

## 🔄 אינטגרציה עם WhatsApp

### שילוב עם Queue System
```javascript
// ב-messageWorker.js
const { canSendMessage, updateRateLimitAfterMessage } = require('./utils/rateLimitUtils');

async function processMessage(job) {
  const { connectionId } = job.data;
  
  // בדיקת rate limit לפני שליחה
  const rateLimitCheck = await canSendMessage(connectionId);
  if (!rateLimitCheck.canSend) {
    throw new Error(`Rate limit exceeded: ${rateLimitCheck.reason}`);
  }
  
  // שליחת ההודעה...
  
  // עדכון rate limit אחרי שליחה
  await updateRateLimitAfterMessage(connectionId);
}
```

## 📈 ניטור וסטטיסטיקות

### סטטיסטיקות יומיות
```javascript
const dailyStats = await RateLimit.getDailyStats();
console.log(dailyStats);
// {
//   totalConnections: 10,
//   totalMessages: 5000,
//   activeConnections: 8,
//   warningConnections: 1,
//   blockedConnections: 1
// }
```

### חיבורים עם אזהרות
```javascript
const warningConnections = await RateLimit.getWarningConnections();
console.log(`Connections with warnings: ${warningConnections.length}`);
```

## 🚀 פריסה לייצור

### הגדרות סביבה
```env
NODE_ENV=production
MONGODB_URI=mongodb://your-mongodb-server:27017/chatgrow
```

### ניטור
```bash
# מעקב לוגים
tail -f logs/rate-limit-combined.log

# בדיקת סטטיסטיקות
curl http://localhost:3000/api/rate-limit/status/connection-123
```

### Health Checks
```javascript
// בדיקת בריאות המערכת
const stats = await RateLimit.getDailyStats();
if (stats.blockedConnections > 5) {
  // התראה: יותר מדי חיבורים חסומים
}
```

## 🤝 תרומה

1. Fork את הפרויקט
2. צור feature branch
3. בצע את השינויים
4. הוסף בדיקות
5. שלח pull request

## 📄 רישיון

MIT License

---

**🎯 המטרה: אפס חסימות WhatsApp!** 🎯 
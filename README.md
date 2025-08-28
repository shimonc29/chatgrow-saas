# ChatGrow Backend System 🚀

מערכת backend מקיפה לניהול הודעות WhatsApp עם יכולות מתקדמות של תורים, הגבלת קצב ולוגים.

## 🎯 תכונות עיקריות

- **📨 מערכת תורים מתקדמת** - Bull Queue עם Redis לניהול הודעות WhatsApp
- **🛡️ הגבלת קצב חכמה** - מערכת מתקדמת למניעת חסימות WhatsApp
- **📊 מערכת לוגים מקיפה** - מעקב מלא אחר הודעות עם דוחות וניתוח
- **🔐 מערכת אימות מתקדמת** - JWT עם תמיכה במספר תוכניות
- **🛡️ אבטחה מתקדמת** - IP filtering, input validation, ו-threat detection
- **📱 ניהול סשנים** - מעקב אחר מכשירים מרובים
- **🔑 ניהול מפתחות API** - גישה מאובטחת לאינטגרציות
- **📱 אינטגרציה עם WhatsApp** - חיבורים מרובים, QR authentication, שליחת הודעות
- **🏥 ניטור בריאות מתקדם** - מעקב אחר מצב המערכת עם התראות אוטומטיות
- **🧪 מערכת בדיקת עומס** - בדיקת 500+ הודעות עם דוחות מפורטים
- **⚡ API REST מלא** - endpoints לניהול כל המערכות
- **📈 ניטור ביצועים** - מדידות וסטטיסטיקות בזמן אמת

## 🏗️ ארכיטקטורה

```
chatgrow/
├── src/
│   ├── index.js                    # קובץ ראשי - שרת Express
                              │   ├── utils/
                │   │   ├── logger.js               # מערכת Winston עם רוטציה יומית
                │   │   ├── encryption.js           # כלי הצפנה ואימות
                │   │   ├── alerts.js               # מערכת התראות מתקדמת
                │   │   └── testUtils.js            # כלי עזר לבדיקות
              │   ├── models/
              │   │   ├── User.js                 # מודל MongoDB למשתמשים
              │   │   ├── MessageLog.js           # מודל MongoDB להודעות
              │   │   ├── RateLimit.js            # מודל MongoDB להגבלת קצב
              │   │   └── WhatsAppConnection.js   # מודל MongoDB לחיבורי WhatsApp
              │   ├── services/
              │   │   ├── queueService.js         # שירות לניהול תורים
              │   │   ├── logService.js           # שירות לניהול לוגים
              │   │   ├── whatsappService.js      # שירות לניהול WhatsApp
              │   │   └── healthService.js        # שירות ניטור בריאות
              │   ├── middleware/
              │   │   ├── auth.js                 # middleware לאימות
              │   │   ├── security.js             # middleware לאבטחה
              │   │   └── rateLimiter.js          # middleware להגבלת קצב
              │   ├── controllers/
              │   │   └── whatsappController.js   # controller לניהול WhatsApp
                              │   ├── routes/
                │   │   ├── auth.js                 # API endpoints לאימות
                │   │   ├── logs.js                 # API endpoints ללוגים
                │   │   ├── whatsapp.js             # API endpoints ל-WhatsApp
                │   │   └── health.js               # API endpoints לניטור בריאות
                │   ├── tests/
                │   │   ├── loadTest.js             # מערכת בדיקת עומס ראשית
                │   │   ├── loadTestRunner.js       # הרצה מפקודת שורה
                │   │   └── rateLimitTest.js        # בדיקות Rate Limiting
│   ├── queues/
│   │   └── messageQueue.js         # הגדרת Bull Queue
│   ├── workers/
│   │   └── messageWorker.js        # עיבוד הודעות
│   ├── utils/
│   │   └── rateLimitUtils.js       # כלים להגבלת קצב
│   ├── auth-example.js             # דוגמאות לשימוש במערכת אימות
│   ├── example-usage.js            # דוגמאות לשימוש במערכת תורים
│   ├── rate-limit-example.js       # דוגמאות לשימוש בהגבלת קצב
│   └── logging-example.js          # דוגמאות לשימוש במערכת לוגים
├── logs/                           # קבצי לוג (נוצרים אוטומטית)
├── package.json                    # תלויות וסקריפטים
├── .env                            # משתני סביבה
├── .gitignore                      # קבצים להתעלמות
├── README.md                       # תיעוד ראשי
├── QUEUE_README.md                 # תיעוד מערכת תורים
├── RATE_LIMIT_README.md            # תיעוד הגבלת קצב
├── LOGGING_README.md               # תיעוד מערכת לוגים
└── AUTH_README.md                  # תיעוד מערכת אימות
```

## 📦 התקנה

### 1. דרישות מקדימות

- Node.js >= 14.0.0
- MongoDB
- Redis

### 2. התקנת תלויות

```bash
npm install
```

### 3. הגדרת משתני סביבה

צור קובץ `.env`:

```env
# Server Configuration
PORT=3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/chatgrow

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d
SESSION_SECRET=your-session-secret-key

# Security
ENCRYPTION_KEY=your-encryption-key-for-sensitive-data
IP_WHITELIST=127.0.0.1,192.168.1.100
IP_BLACKLIST=malicious-ip-1,malicious-ip-2
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Environment
NODE_ENV=development

# Logging Configuration
LOG_LEVEL=info
```

### 4. הפעלת השרת

```bash
# Development
npm run dev

# Production
npm start
```

## 🚀 API Endpoints

### Health Check
```http
GET /health
```

### Authentication
```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
PUT /api/auth/profile
POST /api/auth/change-password
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/refresh
GET /api/auth/sessions
DELETE /api/auth/sessions/:sessionId
```

### מערכת תורים
```http
POST /api/queue/message
GET /api/queue/status/:connectionId
POST /api/queue/pause/:connectionId
POST /api/queue/resume/:connectionId
```

### הגבלת קצב
```http
GET /api/rate-limit/status/:connectionId
POST /api/rate-limit/pause/:connectionId
POST /api/rate-limit/resume/:connectionId
POST /api/rate-limit/reset/:connectionId
```

### מערכת לוגים
```http
GET /api/logs/messages
GET /api/logs/stats
GET /api/logs/connection/:id
GET /api/logs/report
GET /api/logs/failed
GET /api/logs/recipient/:phone
GET /api/logs/status/:messageId
POST /api/logs/clean
GET /api/logs/health
```

### ניטור בריאות
```http
GET /api/health
GET /api/health/detailed
GET /api/health/dashboard
GET /api/health/connections
GET /api/health/mongodb
GET /api/health/redis
GET /api/health/queue
GET /api/health/system
GET /api/health/performance
GET /api/health/history
GET /api/health/config
POST /api/health/trigger
```

### בדיקת עומס
```bash
# הרצת בדיקת 500 הודעות
npm run test:load

# בדיקת Rate Limiting
npm run test:rate-limit

# בדיקה מותאמת
npm run test:load --count 1000 --delay 500 --concurrent 10
```

## 📚 דוגמאות שימוש

### 1. הרשמת משתמש

```javascript
const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        email: 'user@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        plan: 'premium'
    })
});

const result = await response.json();
console.log('User registered:', result.data.user.id);
```

### 2. התחברות משתמש

```javascript
const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        email: 'user@example.com',
        password: 'SecurePass123!'
    })
});

const result = await response.json();
const accessToken = result.data.tokens.accessToken;
console.log('Login successful:', result.data.user.email);
```

### 3. שליחת הודעה

```javascript
const response = await fetch('http://localhost:3000/api/queue/message', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        connectionId: 'conn_123',
        message: 'Hello from ChatGrow!',
        recipients: ['+972501234567'],
        priority: 'high'
    })
});

const result = await response.json();
console.log('Message queued:', result.data.messageId);
```

### 4. בדיקת סטטוס תור

```javascript
const response = await fetch('http://localhost:3000/api/queue/status/conn_123', {
    headers: {
        'Authorization': `Bearer ${accessToken}`
    }
});
const status = await response.json();
console.log('Queue status:', status.data);
```

### 5. קבלת סטטיסטיקות

```javascript
const response = await fetch('http://localhost:3000/api/logs/stats?connectionId=conn_123', {
    headers: {
        'Authorization': `Bearer ${accessToken}`
    }
});
const stats = await response.json();
console.log('Success rate:', stats.data.successRate + '%');
```

### 6. יצירת דוח

```javascript
const response = await fetch('http://localhost:3000/api/logs/report?connectionId=conn_123', {
    headers: {
        'Authorization': `Bearer ${accessToken}`
    }
});
const report = await response.json();
console.log('Recommendations:', report.data.recommendations);
```

### 7. בדיקת בריאות המערכת

```javascript
// בדיקת בריאות בסיסית
const healthResponse = await fetch('http://localhost:3000/api/health');
const health = await healthResponse.json();
console.log('System health:', health.status);

// בדיקת בריאות מפורטת
const detailedResponse = await fetch('http://localhost:3000/api/health/detailed', {
    headers: {
        'Authorization': `Bearer ${accessToken}`
    }
});
const detailedHealth = await detailedResponse.json();
console.log('MongoDB status:', detailedHealth.data.checks.mongodb.status);

// נתוני dashboard
const dashboardResponse = await fetch('http://localhost:3000/api/health/dashboard', {
    headers: {
        'Authorization': `Bearer ${accessToken}`
    }
});
const dashboard = await dashboardResponse.json();
console.log('Active connections:', dashboard.data.connections.active);
```

### 8. בדיקת עומס המערכת

```javascript
// הרצת בדיקת עומס בסיסית
const { runLoadTest } = require('./src/tests/loadTestRunner');
await runLoadTest();

// בדיקת עומס מותאמת
const config = {
    messageCount: 500,
    connectionId: 'test-connection',
    delayBetweenMessages: 1000,
    maxConcurrentMessages: 5
};
const results = await loadTestSystem.runLoadTest(config);
console.log('Delivery Rate:', results.deliveryRate.toFixed(2) + '%');
console.log('Ban Rate:', results.banRate.toFixed(2) + '%');

// ניטור בזמן אמת
const status = await loadTestSystem.getTestStatus();
console.log('Progress:', status.progress.percentage.toFixed(1) + '%');
```

## 🔧 הגדרות מתקדמות

### 1. הגדרת Redis

```bash
# התקנת Redis (Ubuntu/Debian)
sudo apt-get install redis-server

# התקנת Redis (macOS)
brew install redis

# הפעלת Redis
redis-server
```

### 2. הגדרת MongoDB

```bash
# התקנת MongoDB (Ubuntu/Debian)
sudo apt-get install mongodb

# התקנת MongoDB (macOS)
brew install mongodb-community

# הפעלת MongoDB
mongod
```

### 3. הגדרות ייצור

```env
NODE_ENV=production
LOG_LEVEL=warn
MONGODB_URI=mongodb://your-production-mongodb
REDIS_URL=redis://your-production-redis
JWT_SECRET=your-production-secret
```

## 📊 ניטור ובדיקות

### 1. בדיקת בריאות המערכת

```bash
curl http://localhost:3000/health
```

### 2. בדיקת מערכת לוגים

```bash
curl http://localhost:3000/api/logs/health
```

### 3. הרצת דוגמאות

```bash
# דוגמאות מערכת תורים
node src/example-usage.js

# דוגמאות הגבלת קצב
node src/rate-limit-example.js

# דוגמאות מערכת לוגים
node src/logging-example.js
```

## 🛠️ תחזוקה

### 1. ניקוי לוגים ישנים

```bash
curl -X POST http://localhost:3000/api/logs/clean \
  -H "Content-Type: application/json" \
  -d '{"daysToKeep": 90}'
```

### 2. גיבוי בסיס נתונים

```bash
# גיבוי MongoDB
mongodump --db chatgrow --out backup/

# גיבוי Redis
redis-cli BGSAVE
```

### 3. ניטור ביצועים

```bash
# בדיקת זיכרון Redis
redis-cli info memory

# בדיקת MongoDB
mongo --eval "db.stats()"
```

## 🔒 אבטחה

### 1. משתני סביבה

- שמור על `JWT_SECRET` בטוח ומורכב
- אל תחשוף משתני סביבה בייצור
- השתמש ב-HTTPs בייצור

### 2. הגבלת קצב

- המערכת כוללת הגבלת קצב אוטומטית
- מניעת חסימות WhatsApp
- ניטור וניתוח דפוסים

### 3. לוגים

- כל הפעולות מתועדות
- ניתוח שגיאות אוטומטי
- התראות על בעיות

## 📈 ביצועים

### 1. אופטימיזציה

- שימוש ב-Redis לביצועים מהירים
- אינדקסים בבסיס הנתונים
- רוטציה אוטומטית של לוגים

### 2. מדידות

- זמני עיבוד הודעות
- שיעורי הצלחה
- זמני תגובה API

### 3. התראות

- התראות על שיעור הצלחה נמוך
- התראות על שגיאות
- התראות על בעיות ביצועים

## 🤝 תרומה

1. Fork את הפרויקט
2. צור branch חדש (`git checkout -b feature/amazing-feature`)
3. Commit את השינויים (`git commit -m 'Add amazing feature'`)
4. Push ל-branch (`git push origin feature/amazing-feature`)
5. פתח Pull Request

## 📄 רישיון

פרויקט זה מוגן תחת רישיון MIT. ראה קובץ `LICENSE` לפרטים.

## 📚 תיעוד נוסף

- [תיעוד מערכת תורים](QUEUE_README.md)
- [תיעוד הגבלת קצב](RATE_LIMIT_README.md)
- [תיעוד מערכת לוגים](LOGGING_README.md)

---

**🎯 מטרה**: מערכת backend מקיפה ומתקדמת לניהול הודעות WhatsApp עם יכולות מתקדמות של תורים, הגבלת קצב ולוגים.

**🚀 מוכן לייצור**: המערכת מוכנה לשימוש בייצור עם כל התכונות הנדרשות לניהול מקצועי של הודעות WhatsApp. 
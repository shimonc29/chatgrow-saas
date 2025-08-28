# 🏥 ChatGrow Health Monitoring System

מערכת ניטור בריאות מתקדמת לניהול וניטור מצב המערכת בזמן אמת עם התראות אוטומטיות.

## 🎯 מטרות המערכת

- **ניטור בריאות בזמן אמת** - מעקב מתמיד אחר מצב כל השירותים
- **התראות חכמות** - התראות אוטומטיות על בעיות עם cooldown למניעת ספאם
- **מדידת ביצועים** - מעקב אחר response times ו-throughput
- **Dashboard מקיף** - תצוגה מרכזית של כל המדדים החשובים
- **תמיכה במרובה ערוצים** - Email, Slack, Discord, Webhooks

## 🏗️ ארכיטקטורה

```
src/
├── services/
│   └── healthService.js          # שירות ניטור הבריאות הראשי
├── routes/
│   └── health.js                 # API endpoints לניטור בריאות
├── utils/
│   └── alerts.js                 # מערכת התראות מתקדמת
└── health-example.js             # דוגמאות שימוש מקיפות
```

## ✨ תכונות עיקריות

### 🔍 ניטור בריאות מקיף
- **MongoDB** - בדיקת חיבור וזמני תגובה
- **Redis** - בדיקת זמינות וזמני ping
- **Bull Queue** - ניטור תורים ומדידת latency
- **WhatsApp Connections** - מעקב אחר חיבורים פעילים
- **System Resources** - ניטור זיכרון ו-CPU

### 📊 מדדי ביצועים
- Response times ממוצעים
- שיעורי הצלחה
- Throughput של תורים
- זמני עיבוד ממוצעים
- ניצול משאבי מערכת

### 🚨 מערכת התראות מתקדמת
- **Email Notifications** - עם תבניות HTML מותאמות
- **Slack Integration** - הודעות מעוצבות עם attachments
- **Discord Webhooks** - תמיכה מלאה
- **Custom Webhooks** - גמישות מקסימלית
- **Alert Cooldowns** - מניעת ספאם
- **Template System** - תבניות מותאמות לכל סוג התראה

### 📈 Dashboard נתונים
- מספר הודעות בתור
- קצב שליחה נוכחי
- שיעור הצלחה
- connections פעילים
- מדדי בריאות כללית

## 🚀 התקנה והגדרה

### 1. התקנת תלויות

```bash
npm install nodemailer axios ioredis
```

### 2. הגדרת משתני סביבה

הוסף לקובץ `.env`:

```env
# Health Monitoring Configuration
HEALTH_CHECK_INTERVAL=30000          # 30 seconds
HEALTH_DETAILED_INTERVAL=300000      # 5 minutes
HEALTH_METRICS_INTERVAL=10000        # 10 seconds

# Alert System Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=alerts@yourdomain.com
ALERT_EMAIL_TO=admin@yourdomain.com

# Slack Integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CHANNEL=#alerts
SLACK_USERNAME=ChatGrow Alerts

# Discord Integration
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/WEBHOOK/URL

# Custom Webhook
WEBHOOK_URL=https://your-webhook-endpoint.com
WEBHOOK_METHOD=POST
WEBHOOK_HEADERS={"Content-Type": "application/json"}

# Health Thresholds
MONGO_RESPONSE_THRESHOLD=1000        # 1 second
REDIS_RESPONSE_THRESHOLD=500         # 500ms
QUEUE_LATENCY_THRESHOLD=5000         # 5 seconds
MEMORY_USAGE_THRESHOLD=0.9           # 90%
```

### 3. הפעלת המערכת

```javascript
// ב-index.js
const healthRoutes = require('./routes/health');
app.use('/api/health', healthRoutes);
```

## 📋 API Endpoints

### Basic Health Check
```http
GET /api/health
```
בדיקת בריאות בסיסית (ללא אימות)

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "responseTime": 150,
  "uptime": 3600,
  "version": "1.0.0"
}
```

### Detailed Health Check
```http
GET /api/health/detailed
Authorization: Bearer YOUR_JWT_TOKEN
```
בדיקת בריאות מפורטת עם מדדים

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "responseTime": 250,
    "checks": {
      "mongodb": {
        "status": "healthy",
        "responseTime": 50,
        "isConnected": true,
        "queryTime": 45
      },
      "redis": {
        "status": "healthy",
        "responseTime": 30,
        "pingTime": 25
      },
      "queue": {
        "status": "healthy",
        "responseTime": 40,
        "jobCount": 5,
        "avgLatency": 1000
      },
      "whatsapp": {
        "status": "healthy",
        "responseTime": 60,
        "healthScore": 0.95
      },
      "system": {
        "status": "healthy",
        "responseTime": 10,
        "details": {
          "memory": {
            "usagePercent": 0.65
          }
        }
      }
    },
    "detailed": {
      "performance": {
        "avgResponseTime": 200,
        "successRate": 0.98,
        "uptime": 3600000,
        "totalChecks": 120,
        "failedChecks": 2
      }
    }
  }
}
```

### Dashboard Data
```http
GET /api/health/dashboard
Authorization: Bearer YOUR_JWT_TOKEN
```
נתוני dashboard לניטור UI

**Response:**
```json
{
  "success": true,
  "data": {
    "health": "healthy",
    "connections": {
      "total": 10,
      "active": 8,
      "error": 1
    },
    "queue": {
      "waiting": 15,
      "throughput": 120,
      "errorRate": 0.02
    },
    "system": {
      "memory": {
        "usagePercent": 0.65
      }
    },
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

### WhatsApp Connections Health
```http
GET /api/health/connections
Authorization: Bearer YOUR_JWT_TOKEN
```
סטטוס חיבורי WhatsApp

### Individual Service Checks
```http
GET /api/health/mongodb
GET /api/health/redis
GET /api/health/queue
GET /api/health/system
Authorization: Bearer YOUR_JWT_TOKEN
```

### Performance Metrics
```http
GET /api/health/performance
Authorization: Bearer YOUR_JWT_TOKEN
```

### Health History
```http
GET /api/health/history?limit=10
Authorization: Bearer YOUR_JWT_TOKEN
```

### Manual Health Check Trigger
```http
POST /api/health/trigger
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "type": "detailed"
}
```

## 🔧 שימוש מתקדם

### 1. שימוש ישיר בשירות

```javascript
const healthService = require('./services/healthService');

// בדיקת בריאות בסיסית
const health = await healthService.runFullHealthCheck();
console.log('Overall Health:', health.overall);

// בדיקת בריאות מפורטת
const detailedHealth = await healthService.runDetailedHealthCheck();
console.log('Performance:', detailedHealth.detailed.performance);

// נתוני dashboard
const dashboard = await healthService.getDashboardData();
console.log('Dashboard:', dashboard);
```

### 2. שימוש במערכת ההתראות

```javascript
const { sendAlert, alertService } = require('./utils/alerts');

// שליחת התראה מותאמת
await sendAlert({
  type: 'custom_alert',
  severity: 'warning',
  title: 'Custom Alert',
  message: 'This is a custom alert',
  details: {
    customField: 'customValue'
  },
  channels: ['email', 'slack']
});

// התראה על בעיית בריאות
await sendAlert({
  type: 'health_issue',
  severity: 'error',
  title: 'Database Connection Issue',
  message: 'MongoDB connection is slow',
  details: {
    service: 'mongodb',
    responseTime: 2000,
    error: 'Connection timeout'
  }
});

// בדיקת סטטיסטיקות התראות
const stats = alertService.getAlertStats();
console.log('Alert Stats:', stats);
```

### 3. הגדרת תבניות התראה מותאמות

```javascript
// הוספת תבנית מותאמת
alertService.alertTemplates.set('custom_alert', {
  email: {
    subject: '🔔 {{title}}',
    body: `
      <h2>{{title}}</h2>
      <p>{{message}}</p>
      <p><strong>Severity:</strong> {{severity}}</p>
      <p><strong>Timestamp:</strong> {{timestamp}}</p>
    `
  },
  slack: {
    color: '{{severityColor}}',
    title: '🔔 {{title}}',
    text: '{{message}}',
    fields: [
      { title: 'Severity', value: '{{severity}}', short: true },
      { title: 'Timestamp', value: '{{timestamp}}', short: true }
    ]
  }
});
```

### 4. ניטור מותאם אישית

```javascript
// הוספת בדיקת בריאות מותאמת
healthService.customChecks = {
  async checkCustomService() {
    const startTime = Date.now();
    try {
      // בדיקה מותאמת
      const result = await customService.ping();
      const responseTime = Date.now() - startTime;
      
      return {
        status: result.success ? 'healthy' : 'unhealthy',
        responseTime,
        details: result
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }
};

// הוספת הבדיקה לבדיקות הרגילות
healthService.runFullHealthCheck = async function() {
  const results = await super.runFullHealthCheck();
  results.checks.customService = await this.customChecks.checkCustomService();
  return results;
};
```

## 📊 ניטור ו-Dashboard

### מדדים עיקריים

1. **בריאות כללית** - סטטוס המערכת הכולל
2. **זמני תגובה** - ממוצע זמני תגובה לכל שירות
3. **שיעורי הצלחה** - אחוז בדיקות בריאות מוצלחות
4. **ניצול משאבים** - זיכרון, CPU, חיבורים
5. **תפוקת תורים** - הודעות לדקה, זמני עיבוד

### התראות אוטומטיות

- **Health Issues** - בעיות בריאות שירותים
- **Rate Limit Warnings** - אזהרות הגבלת קצב
- **WhatsApp Connection Issues** - בעיות חיבורי WhatsApp
- **Queue Issues** - בעיות עיבוד תורים
- **System Resource Alerts** - אזהרות משאבי מערכת

## 🔒 אבטחה

### אימות והרשאות

- **Basic Health Check** - ללא אימות (לבדיקות load balancer)
- **Detailed Checks** - דורש JWT token
- **Admin Endpoints** - דורש הרשאות enterprise
- **Manual Triggers** - מוגבל למנהלים

### הגבלות

- Rate limiting על API endpoints
- Cooldown על התראות למניעת ספאם
- Logging של כל הפעולות
- Validation של כל הקלט

## 🧪 בדיקות

### הרצת דוגמאות

```bash
# הרצת הדגמה מלאה
node src/health-example.js

# בדיקת API endpoints
curl http://localhost:3000/api/health
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/health/detailed
```

### בדיקות אוטומטיות

```javascript
// בדיקת שירות הבריאות
const health = await healthService.runFullHealthCheck();
expect(health.overall).toBe('healthy');

// בדיקת מערכת ההתראות
const alertResult = await sendAlert({
  type: 'test',
  severity: 'info',
  title: 'Test Alert',
  message: 'Test message'
});
expect(alertResult).toBeDefined();
```

## 📈 ביצועים

### אופטימיזציות

- **Caching** - שמירת תוצאות בדיקות
- **Async Processing** - בדיקות מקבילות
- **Connection Pooling** - ניהול חיבורים יעיל
- **Memory Management** - ניקוי אוטומטי של היסטוריה

### מדדי ביצועים

- **Health Check Time** - < 500ms
- **Alert Delivery** - < 2s
- **Memory Usage** - < 50MB
- **CPU Usage** - < 5%

## 🚀 פריסה ל-Production

### הגדרות מומלצות

```env
# Production Health Settings
HEALTH_CHECK_INTERVAL=60000          # 1 minute
HEALTH_DETAILED_INTERVAL=300000      # 5 minutes
HEALTH_METRICS_INTERVAL=30000        # 30 seconds

# Alert Settings
ALERT_COOLDOWN_MULTIPLIER=2          # Longer cooldowns in production
ALERT_RETRY_ATTEMPTS=3               # Retry failed alerts
ALERT_TIMEOUT=10000                  # 10 second timeout

# Monitoring
HEALTH_HISTORY_RETENTION=7           # Keep 7 days of history
HEALTH_METRICS_RETENTION=24          # Keep 24 hours of metrics
```

### Load Balancer Integration

```nginx
# Nginx health check configuration
location /health {
    proxy_pass http://localhost:3000/api/health;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    
    # Health check settings
    proxy_connect_timeout 5s;
    proxy_send_timeout 10s;
    proxy_read_timeout 10s;
}
```

### Docker Integration

```dockerfile
# Health check in Dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

## 🤝 תרומה

### הוספת בדיקות בריאות חדשות

1. הוסף את הבדיקה ל-`healthService.js`
2. הוסף תבנית התראה מתאימה ל-`alerts.js`
3. הוסף endpoint חדש ל-`health.js`
4. כתוב בדיקות
5. עדכן את התיעוד

### הוספת ערוץ התראות חדש

1. הוסף את הערוץ ל-`alerts.js`
2. הוסף תמיכה בתבניות
3. הוסף הגדרות סביבה
4. בדוק את הפונקציונליות

## 📝 רישיון

MIT License - ראה קובץ LICENSE לפרטים.

## 🆘 תמיכה

לשאלות ותמיכה:
- פתח Issue ב-GitHub
- צור קשר עם הצוות
- בדוק את התיעוד המלא

---

**🏥 מערכת ניטור הבריאות של ChatGrow - שמירה על המערכת בריאה ופעילה!** 
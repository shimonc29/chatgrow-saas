# ChatGrow - מערכת SaaS לניהול עסקים קטנים-בינוניים

## 📋 סקירה כללית

ChatGrow היא מערכת backend מקיפה לניהול עסקים עם יכולות תקשורת מתקדמות. המערכת מאפשרת ניהול לקוחות, אירועים, תורים, תשלומים, חשבוניות, ומערכת הודעות אוטומטיות דרך Email ו-SMS.

## 🏗️ ארכיטקטורת המערכת

### מסדי נתונים
- **PostgreSQL (Neon)** - נתוני Subscribers ומשתמשים
- **MongoDB Atlas** - נתוני Events, Customers, Appointments, Analytics
- **Redis (Optional)** - Caching & background jobs (לא חובה)

### טכנולוגיות עיקריות
- **Backend**: Node.js + Express.js
- **Authentication**: JWT
- **Notifications**: NotificationService (Email: Nodemailer/SendGrid, SMS: Twilio)
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting
- **Database**: Mongoose (MongoDB), pg (PostgreSQL)

## 📁 מבנה הפרויקט

```
src/
├── config/              # קבצי קונפיגורציה
│   ├── database.js      # MongoDB connection
│   └── redis.js         # Redis connection
├── models/             # Data models
│   ├── User.js
│   ├── Event.js
│   ├── Customer.js
│   ├── Subscriber.js
│   ├── Appointment.js
│   └── MessageLog.js
├── routes/             # API routes
│   ├── auth.js
│   ├── provider.js
│   ├── subscribers.js
│   ├── customers.js
│   ├── events.js
│   ├── appointments.js
│   ├── notifications.js
│   ├── health.js
│   ├── logs.js
│   └── dashboard.js
├── services/           # Business logic
│   ├── notificationService.js
│   ├── eventService.js
│   ├── logService.js
│   └── healthService.js
├── providers/          # Notification providers
│   ├── EmailProvider.js
│   ├── SMSProvider.js
│   ├── email/
│   │   ├── NodemailerProvider.js
│   │   └── SendGridProvider.js
│   └── sms/
│       └── TwilioProvider.js
├── middleware/         # Express middleware
│   ├── auth.js
│   ├── security.js
│   └── rateLimiter.js
├── utils/             # Utilities
│   └── logger.js
└── index.js           # Main server file
```

## 🚀 התחלה מהירה

### סודות נדרשים (Secrets)
הוסף ב-Replit Secrets:
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret key ל-JWT authentication
- `SENDGRID_API_KEY` - SendGrid API key (אופציונלי)
- `TWILIO_ACCOUNT_SID` - Twilio Account SID (אופציונלי)
- `TWILIO_AUTH_TOKEN` - Twilio Auth Token (אופציונלי)
- `TWILIO_PHONE_NUMBER` - Twilio Phone Number (אופציונלי)
- `REDIS_URL` - Upstash Redis URL (אופציונלי)

### הרצת השרת
המערכת מתחילה אוטומטית דרך workflow:
```bash
npm run dev
```

השרת רץ על: `http://0.0.0.0:5000`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - הרשמת משתמש חדש
- `POST /api/auth/login` - התחברות
- `POST /api/auth/refresh` - רענון token

### Provider Dashboard
- `GET /provider/dashboard` - דאשבורד נותן שירות
- `GET /provider/customers` - ניהול לקוחות
- `GET /provider/stats` - סטטיסטיקות

### Subscribers
- `GET /api/subscribers` - רשימת מנויים
- `POST /api/subscribers` - יצירת מנוי חדש
- `GET /api/subscribers/:id` - פרטי מנוי

### Notifications
- `POST /api/notifications/send` - שליחת הודעה (Email/SMS)
- `GET /api/notifications/providers` - רשימת providers זמינים
- `GET /api/notifications/history` - היסטוריית הודעות

### Health & Monitoring
- `GET /health` - Health check
- `GET /api/logs` - System logs
- `GET /dashboard` - Main dashboard

## 🔧 תצורה

### משתני סביבה (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Databases
DATABASE_URL=postgresql://...
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Notifications
EMAIL_PROVIDER=nodemailer # nodemailer or sendgrid
SMS_PROVIDER=mock # twilio or mock
EMAIL_FROM=noreply@chatgrow.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Logging
LOG_LEVEL=info
LOG_FILE_MAX_SIZE=10m
LOG_FILE_MAX_FILES=5

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔐 אבטחה

המערכת כוללת:
- ✅ JWT Authentication
- ✅ Password hashing (bcrypt)
- ✅ Rate limiting
- ✅ Helmet security headers
- ✅ CORS protection
- ✅ Input validation (Joi)
- ✅ Secure session management

## 📊 סטטוס מסדי הנתונים

### PostgreSQL (Neon)
- **סטטוס**: ✅ מחובר ועובד
- **שימוש**: Subscribers, Users
- **טבלאות**: subscribers

### MongoDB Atlas
- **סטטוס**: ✅ מחובר ועובד
- **שימוש**: WhatsApp connections, Events, Customers, Analytics
- **Collections**: whatsapp_connections, events, customers, registrations

### Redis
- **סטטוס**: ⚠️ לא מחובר (In-Memory Queue)
- **שימוש**: Message queue, Caching
- **אלטרנטיבה**: המערכת משתמשת ב-In-Memory Queue

## 📱 WhatsApp Integration

### תכונות
- ✅ Multiple connections per user
- ✅ QR code authentication
- ✅ Session persistence (MongoDB)
- ✅ Auto-reconnection
- ✅ Message queueing
- ✅ Retry logic with backoff
- ✅ Rate limiting per connection
- ✅ Health monitoring

### דוגמה לשימוש
```javascript
// Create WhatsApp connection
POST /api/whatsapp/connections
{
  "connectionId": "business_main",
  "name": "Main Business Line",
  "phoneNumber": "+972501234567"
}

// Get QR code
GET /api/whatsapp/connections/business_main/qr

// Send message
POST /api/whatsapp/send
{
  "connectionId": "business_main",
  "to": "+972501234567",
  "message": "Hello from ChatGrow!"
}
```

## 🧪 בדיקות

```bash
# Run all tests
npm test

# Health check
curl http://localhost:5000/health

# API check
curl http://localhost:5000/api
```

## 📝 Logging

המערכת משתמשת ב-Winston עם:
- ✅ Console logging (development)
- ✅ File logging (production)
- ✅ Daily rotation
- ✅ Log levels: error, warn, info, debug
- ✅ Structured logging (JSON)

Logs location: `logs/`

## 🔄 Queue System

### מצב נוכחי
- **Type**: In-Memory Queue (Redis not available)
- **Persistence**: ⚠️ Messages lost on restart
- **Features**: Basic queueing, retry logic

### להתקנת Redis (Recommended)
1. צור חשבון ב-Upstash: https://console.upstash.com/
2. צור Redis database חינמי
3. העתק את ה-Redis URL
4. הוסף ל-Replit Secrets: `REDIS_URL`
5. אתחל את השרת

## 🚨 בעיות נפוצות

### MongoDB connection error
- ודא ש-IP whitelist מוגדר ל-`0.0.0.0/0` ב-MongoDB Atlas
- בדוק שה-MONGODB_URI תקין ב-Secrets
- המתן 1-2 דקות אחרי שינוי ה-whitelist

### Redis connection refused
- זה תקין! המערכת תעבוד עם In-Memory Queue
- אופציונלי: הוסף REDIS_URL ל-Secrets

### Server not responding
- בדוק ש-workflow רץ: `npm run dev`
- בדוק logs ב-Replit Console
- בדוק health endpoint: `/health`

## 📚 תיעוד נוסף

- `WHATSAPP_README.md` - תיעוד מלא של WhatsApp Integration
- `README.md` - תיעוד כללי של הפרויקט

## 🛠️ פיתוח

### הוספת feature חדש
1. צור route חדש ב-`src/routes/`
2. צור service logic ב-`src/services/`
3. הוסף model ב-`src/models/` (אם נדרש)
4. עדכן את `src/index.js`
5. הוסף tests
6. עדכן documentation

### Debugging
```bash
# View logs
tail -f logs/app.log

# Check database connection
node -e "require('./src/config/database').connectMongoDB()"

# Test API endpoint
curl -X GET http://localhost:5000/health -H "Content-Type: application/json"
```

## 📈 סטטוס פיתוח

### ✅ הושלם
- [x] Backend infrastructure (Express, middleware, logging)
- [x] Authentication system (JWT) - תוקן לעבוד עם כל ה-routes
- [x] PostgreSQL integration (Subscribers)
- [x] MongoDB integration (WhatsApp, Events, Customers)
- [x] Security middleware (Helmet, CORS, Rate Limiting) - מופעל ועובד
- [x] WhatsApp Integration - routes נטענו ועובדים תקין
- [x] Provider dashboard (HTML UI)
- [x] Health monitoring
- [x] Logging system
- [x] API endpoints (Auth, Subscribers, Provider, Health, WhatsApp, Events)
- [x] Database configuration files
- [x] CORS configuration - מוגדר ל-credentialed requests

### 🚧 בפיתוח
- [ ] Redis Queue System (using In-Memory for now)
- [ ] Email verification
- [ ] Payment integration
- [ ] Advanced analytics

### 🔮 מתוכנן
- [ ] React/Vue frontend
- [ ] Mobile app
- [ ] Advanced reporting
- [ ] Multi-language support
- [ ] Webhook support

## 👥 תרומה

תרומות מתקבלות בברכה! אנא:
1. Fork הפרויקט
2. צור branch חדש למימוש
3. Commit השינויים שלך
4. Push ל-branch
5. פתח Pull Request

## 📞 תמיכה

לשאלות ובעיות:
- בדוק את התיעוד ב-`WHATSAPP_README.md`
- בדוק את ה-logs ב-`logs/`
- בדוק את health endpoint: `/health`

---

## 🔄 שינויים אחרונים (נובמבר 5, 2025)

### שלב 0 הושלם: פירוק WhatsApp והחלפה ב-NotificationService ✅
#### מה בוצע:
1. **הוסר לחלוטין WhatsApp Integration**:
   - הושבתו כל WhatsApp routes, services, controllers
   - הושבת queueService (whatsapp-web.js, puppeteer)
   - הוסרו endpoints של `/api/whatsapp` ו-`/api/queue`
   - קבצים הושבתו: `whatsappService.js.disabled`, `queueService.js.disabled`, `whatsapp.js.disabled`

2. **נוצר NotificationService חדש**:
   - ממשק גנרי לשליחת הודעות דרך Email ו-SMS
   - Provider pattern עם תמיכה ב:
     - **Email**: Nodemailer (SMTP), SendGrid (API)
     - **SMS**: Twilio (API), Mock (לבדיקות)
   - פונקציות מובנות: `sendEventConfirmation()`, `sendEventReminder()`, `sendAppointmentConfirmation()`

3. **עדכונים ב-EventService**:
   - שימוש ב-`NotificationService` במקום `queueService`
   - כל אירועים ותזכורות משתמשים במערכת החדשה

4. **עדכון index.js**:
   - הוסרו כל ה-routes הקשורים ל-WhatsApp/Queue
   - נוספו routes חדשים: `/api/notifications`
   - נשארו רק: Auth, Subscribers, Provider, Events, Customers, Appointments, Health, Logs, Dashboard

#### סטטוס נוכחי:
- ✅ PostgreSQL: מחובר ועובד
- ✅ MongoDB Atlas: מחובר ועובד
- ✅ NotificationService: מאותחל ופעיל
- ✅ Security: Helmet + Rate Limiting + CORS
- ✅ All Routes: נטענו בהצלחה ללא שגיאות
- ⚠️ Redis: לא מחובר (In-Memory fallback - מקובל)

#### הבא: שלב 1 - תשלומים + חשבוניות
- אינטגרציית ספקי תשלומים ישראליים: Cardcom, Grow-Meshulam, Tranzila
- מודול חשבוניות PDF
- מודל Payment ו-Invoice

---

**Last Updated**: November 5, 2025
**Version**: 2.0.0 (Post WhatsApp Removal)
**Status**: ✅ שלב 0 הושלם בהצלחה - מוכן לשלב 1

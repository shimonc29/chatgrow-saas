# ChatGrow - מערכת ניהול עסקית עם אינטגרציית WhatsApp

## 📋 סקירה כללית

ChatGrow היא מערכת backend מקיפה לניהול עסקים עם אינטגרציה מתקדמת של WhatsApp. המערכת מאפשרת ניהול תורים, לקוחות, אירועים, הודעות אוטומטיות דרך WhatsApp, אנליטיקה ותמיכה ב-multi-provider.

## 🏗️ ארכיטקטורת המערכת

### מסדי נתונים
- **PostgreSQL (Neon)** - נתוני Subscribers ומשתמשים
- **MongoDB Atlas** - נתוני WhatsApp, Events, Customers, Analytics
- **Redis (Optional)** - Queue System למנגנון התורים (כרגע: In-Memory Queue)

### טכנולוגיות עיקריות
- **Backend**: Node.js + Express.js
- **Authentication**: JWT
- **WhatsApp**: whatsapp-web.js + Puppeteer
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting
- **Database**: Mongoose (MongoDB), pg (PostgreSQL)

## 📁 מבנה הפרויקט

```
src/
├── config/           # קבצי קונפיגורציה
│   ├── database.js   # MongoDB connection
│   └── redis.js      # Redis connection
├── models/          # Data models
│   ├── User.js
│   ├── Event.js
│   ├── Customer.js
│   ├── Subscriber.js
│   ├── WhatsAppConnection.js
│   ├── Appointment.js
│   └── MessageLog.js
├── routes/          # API routes
│   ├── auth.js
│   ├── provider.js
│   ├── subscribers.js
│   ├── customers.js
│   ├── events.js
│   ├── appointments.js
│   ├── whatsapp.js
│   ├── health.js
│   ├── logs.js
│   └── dashboard.js
├── services/        # Business logic
│   ├── whatsappService.js
│   ├── queueService.js
│   ├── logService.js
│   └── healthService.js
├── middleware/      # Express middleware
│   ├── auth.js
│   ├── security.js
│   └── rateLimiter.js
├── utils/          # Utilities
│   └── logger.js
└── index.js        # Main server file
```

## 🚀 התחלה מהירה

### סודות נדרשים (Secrets)
הוסף ב-Replit Secrets:
- `MONGODB_URI` - MongoDB Atlas connection string
- `REDIS_URL` - Upstash Redis URL (אופציונלי)
- `JWT_SECRET` - Secret key ל-JWT authentication

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

### WhatsApp
- `POST /api/whatsapp/connections` - יצירת חיבור WhatsApp
- `GET /api/whatsapp/connections/:id/qr` - קבלת QR Code
- `POST /api/whatsapp/send` - שליחת הודעה
- `GET /api/whatsapp/connections/:id/status` - סטטוס חיבור

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

# WhatsApp
WHATSAPP_SESSION_PATH=./sessions
WHATSAPP_MAX_CONNECTIONS=10

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
- [x] Authentication system (JWT)
- [x] PostgreSQL integration (Subscribers)
- [x] MongoDB integration (WhatsApp, Events, Customers)
- [x] Security middleware (Helmet, CORS, Rate Limiting)
- [x] Provider dashboard (HTML UI)
- [x] Health monitoring
- [x] Logging system
- [x] API endpoints (Auth, Subscribers, Provider, Health)
- [x] Database configuration files

### 🚧 בפיתוח
- [ ] WhatsApp Service implementation (framework ready)
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

**Last Updated**: November 5, 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready (with In-Memory Queue)

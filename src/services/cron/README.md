# Cron Service - Modular Architecture

מערכת ניהול משימות מתוזמנות (Cron Jobs) מודולרית ומאורגנת.

## 📁 מבנה תיקיות

```
cron/
├── index.js          # נקודת כניסה ראשית - מאחד את כל המודולים
├── reminders.js      # משימות תזכורות (אירועים ותורים)
├── payments.js       # משימות תשלומים וחשבוניות
├── reports.js        # משימות דוחות (שבועיים, חודשיים, רבעוניים)
├── growth.js         # משימות גידול ואנליטיקס
├── cleanup.js        # משימות ניקוי ותחזוקה
└── README.md         # תיעוד (קובץ זה)
```

## 🔧 מודולים

### 1. **reminders.js** - משימות תזכורות
משימות המטפלות בשליחת תזכורות ללקוחות.

**משימות:**
- `scheduleEventReminders()` - תזכורות לאירועים (יומי ב-9:00)
- `scheduleAppointmentReminders()` - תזכורות לתורים (יומי ב-9:00)

**לוח זמנים:**
- כל יום בשעה 9:00 בבוקר

### 2. **payments.js** - משימות תשלומים
משימות המטפלות בתשלומים אוטומטיים, חשבוניות ותזכורות.

**משימות:**
- `scheduleAutomaticPayments()` - עיבוד תשלומים מתוזמנים (יומי ב-10:00)
- `scheduleMonthlyPlatformFeeInvoices()` - חשבוניות דמי פלטפורמה (1 בחודש ב-8:00)
- `schedulePaymentReminders()` - תזכורות לתשלומים באיחור (יומי ב-11:00)
- `scheduleFailedPaymentRetry()` - ניסיון חוזר לתשלומים כושלים (יומי ב-15:00)

**לוח זמנים:**
- יומי: 10:00, 11:00, 15:00
- חודשי: 1 בחודש ב-8:00

### 3. **reports.js** - משימות דוחות
משימות ליצירת דוחות עסקיים וניתוחים.

**משימות:**
- `scheduleWeeklyReports()` - דוחות שבועיים (כל יום שני ב-8:00)
- `scheduleMonthlyReports()` - דוחות חודשיים (1 בחודש ב-9:00)
- `scheduleWeeklyStrategicReports()` - דוחות אסטרטגיים (כל יום ראשון ב-22:00)
- `scheduleQuarterlyReports()` - דוחות רבעוניים (1 בינואר/אפריל/יולי/אוקטובר ב-8:00)

**לוח זמנים:**
- שבועי: כל יום ב' ב-8:00, כל יום א' ב-22:00
- חודשי: 1 בחודש ב-9:00
- רבעוני: 1/1, 1/4, 1/7, 1/10 ב-8:00

### 4. **growth.js** - משימות גידול
משימות לניתוח גידול, בריאות לקוחות והזדמנויות.

**משימות:**
- `scheduleDailyGrowthAggregation()` - צבירת נתוני גידול (יומי ב-2:00)
- `scheduleDailyCustomerHealthCalculation()` - חישוב בריאות לקוחות (יומי ב-3:00)
- `scheduleDailyGrowthOpportunityIdentification()` - זיהוי הזדמנויות גידול (יומי ב-4:00)
- `scheduleWeeklyCustomerSegmentation()` - סגמנטציה של לקוחות (כל יום ב' ב-1:00)
- `scheduleMonthlyRetentionAnalysis()` - ניתוח retention חודשי (1 בחודש ב-5:00)

**לוח זמנים:**
- יומי: 2:00, 3:00, 4:00 (בלילה - פחות עומס)
- שבועי: כל יום ב' ב-1:00
- חודשי: 1 בחודש ב-5:00

### 5. **cleanup.js** - משימות ניקוי
משימות תחזוקה, ניקוי ואופטימיזציה.

**משימות:**
- `scheduleDataCleanup()` - ניקוי נתונים ישנים (יומי ב-1:00)
- `scheduleSessionCleanup()` - ניקוי sessions שפגו (כל שעה)
- `scheduleTempFileCleanup()` - ניקוי קבצים זמניים (יומי ב-00:00)
- `scheduleWeeklyDatabaseOptimization()` - אופטימיזציה של DB (כל יום א' ב-2:00)

**לוח זמנים:**
- שעתי: כל שעה (session cleanup)
- יומי: 00:00, 1:00
- שבועי: כל יום א' ב-2:00

## 🚀 שימוש

### אתחול המערכת
```javascript
const cronService = require('./services/cron');

// אתחול כל המשימות
cronService.initialize();
```

### קבלת סטטוס
```javascript
// סטטוס כללי
const status = cronService.getStatus();
console.log(status);
// {
//   isInitialized: true,
//   totalJobs: 20,
//   modules: {
//     reminders: { jobsCount: 2, jobs: [...] },
//     payments: { jobsCount: 4, jobs: [...] },
//     ...
//   }
// }

// סטטוס מודול ספציפי
const reminderStatus = cronService.getModuleStatus('reminders');
```

### עצירת משימות
```javascript
// עצירת כל המשימות
cronService.stopAll();

// עצירת מודול ספציפי
cronService.stopModule('reminders');
```

## 🎯 יתרונות המבנה המודולרי

### לפני (קובץ אחד גדול)
```
cronService.js - 1017 שורות
❌ קשה לתחזוקה
❌ קשה למצוא פונקציות ספציפיות
❌ קשה לבדוק (testing)
❌ coupling גבוה בין משימות
```

### אחרי (מבנה מודולרי)
```
cron/
├── index.js      - 120 שורות (orchestration)
├── reminders.js  - 200 שורות
├── payments.js   - 250 שורות
├── reports.js    - 180 שורות
├── growth.js     - 180 שורות
└── cleanup.js    - 250 שורות

✅ קל לתחזוקה
✅ קל למצוא ולערוך
✅ קל לבדוק (unit tests למודול)
✅ separation of concerns
✅ קל להוסיף משימות חדשות
```

## 📝 הוספת משימה חדשה

### שלב 1: בחר מודול מתאים
זהה לאיזה מודול המשימה משתייכת (reminders/payments/reports/growth/cleanup).

### שלב 2: הוסף את הפונקציה
```javascript
// בתוך המודול המתאים (למשל reminders.js)
scheduleSmsReminders() {
    const jobName = 'smsReminders';

    // Define cron schedule (every day at 10 AM)
    const job = cron.schedule('0 10 * * *', async () => {
        try {
            logInfo('Running SMS reminders job');

            // Your logic here

            logInfo('SMS reminders sent');
        } catch (error) {
            logError('Error sending SMS reminders', error);
        }
    });

    this.jobs.set(jobName, job);
    logInfo(`Scheduled ${jobName} job`);
}
```

### שלב 3: רשום במאתחל
```javascript
// בתוך index.js
reminderJobs.scheduleEventReminders();
reminderJobs.scheduleAppointmentReminders();
reminderJobs.scheduleSmsReminders();  // ← הוסף כאן
```

## 🕐 Cron Expressions

פורמט: `* * * * *` (minute hour day month weekday)

### דוגמאות נפוצות:
```javascript
'0 9 * * *'     // כל יום בשעה 9:00
'0 */2 * * *'   // כל שעתיים
'0 0 * * 0'     // כל יום ראשון בחצות
'0 8 1 * *'     // היום הראשון בחודש בשעה 8:00
'0 8 1 1,4,7,10 *' // 1 בינואר, אפריל, יולי, אוקטובר
```

### כלי עזר:
- [crontab.guru](https://crontab.guru/) - Generator & validator
- [crontab-generator.org](https://crontab-generator.org/) - Visual generator

## 🧪 Testing

### בדיקת מודול בודד
```javascript
const reminderJobs = require('./services/cron/reminders');

// הפעל רק את משימות התזכורות
reminderJobs.scheduleEventReminders();
reminderJobs.scheduleAppointmentReminders();

// בדוק סטטוס
console.log(reminderJobs.getStatus());

// עצור
reminderJobs.stopAll();
```

## 📊 Monitoring

מומלץ להוסיף monitoring למשימות:
- לוג כל הרצה (start/end/errors)
- מעקב אחר משך זמן הרצה
- התראות על כישלונות
- Dashboard למעקב

## 🔒 Security Notes

- כל המשימות רצות בהקשר של השרת (server-side)
- אין חשיפת מידע רגיש בלוגים
- Validation על כל הנתונים שנשלפים מהDB
- Error handling נכון למניעת קריסות

## 📚 Resources

- [node-cron documentation](https://github.com/node-cron/node-cron)
- [Best practices for cron jobs](https://blog.logrocket.com/task-scheduling-or-cron-jobs-in-node-using-node-cron/)
- [Monitoring cron jobs](https://betterstack.com/community/guides/logging/how-to-monitor-cron-jobs/)

---

**Created:** 2025-11-23
**Version:** 1.0.0
**Maintainer:** ChatGrow Team

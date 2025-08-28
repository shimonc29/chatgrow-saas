# ChatGrow Load Test System

## 🎯 מטרה

מערכת בדיקת עומס מתקדמת לבדיקת ביצועי ChatGrow עם 500 הודעות ומעלה, כולל דוחות מפורטים, זיהוי חסימות, והמלצות לשיפור.

## ✨ תכונות עיקריות

- **🧪 בדיקת עומס מקיפה** - תמיכה ב-500+ הודעות עם הגדרות מותאמות אישית
- **📊 דוחות מפורטים** - סטטיסטיקות ביצועים, אחוזי הצלחה, וניתוח שגיאות
- **🛡️ בדיקת Rate Limiting** - וידוא שמערכת החסימה עובדת כראוי
- **⚡ מדידות ביצועים** - זמני תגובה, throughput, ו-percentiles
- **🎯 תנאי מעבר** - Delivery Rate ≥ 98%, Ban Rate ≤ 0.5%, ללא קריסות
- **📈 ניטור בזמן אמת** - מעקב אחר התקדמות הבדיקה
- **💾 שמירת תוצאות** - שמירה אוטומטית של דוחות ב-JSON
- **🔧 תצורות מותאמות** - תמיכה במצבים שונים (stress, spike, gradual)

## 🏗️ ארכיטקטורה

```
src/tests/
├── loadTest.js              # מערכת הבדיקה הראשית
├── loadTestRunner.js        # הרצה מפקודת שורה
└── rateLimitTest.js         # בדיקות Rate Limiting

src/utils/
└── testUtils.js             # כלי עזר לבדיקות

test-results/                # תיקיית תוצאות
└── *.json                   # דוחות בדיקה
```

## 🚀 התקנה ושימוש

### הרצה בסיסית

```bash
# בדיקת 500 הודעות עם הגדרות ברירת מחדל
npm run test:load

# בדיקת Rate Limiting
npm run test:rate-limit
```

### אפשרויות מתקדמות

```bash
# בדיקת 1000 הודעות עם הגדרות מותאמות
npm run test:load --count 1000 --delay 500 --concurrent 10

# בדיקה ללא Rate Limiting
npm run test:load --no-rate-limit --verbose

# שמירת תוצאות ב-JSON
npm run test:load --json --save

# בדיקה שקטה (מינימום פלט)
npm run test:load --quiet
```

### אפשרויות זמינות

| אפשרות | תיאור | ברירת מחדל |
|--------|-------|-------------|
| `--count, -c` | מספר הודעות לבדיקה | 500 |
| `--connection, -conn` | מזהה חיבור | test-connection |
| `--delay, -d` | השהייה בין הודעות (ms) | 1000 |
| `--concurrent, -cc` | הודעות במקביל | 5 |
| `--template, -t` | תבנית הודעה | "Test message #{number}..." |
| `--duration, -dur` | משך בדיקה מקסימלי (ms) | 300000 |
| `--no-rate-limit` | כיבוי Rate Limiting | false |
| `--no-logging` | כיבוי לוגים | false |
| `--no-health` | כיבוי בדיקות בריאות | false |
| `--save` | שמירת תוצאות | true |
| `--json` | פלט JSON | false |
| `--quiet, -q` | מצב שקט | false |
| `--verbose, -v` | מצב מפורט | false |

## 📊 קריטריוני מעבר

הבדיקה נחשבת מוצלחת אם:

- ✅ **Delivery Rate ≥ 98%** - לפחות 98% מההודעות נשלחו בהצלחה
- ✅ **Ban Rate ≤ 0.5%** - לא יותר מ-0.5% חסימות WhatsApp
- ✅ **No Crashes** - המערכת לא קרסה במהלך הבדיקה

## 🔧 שימוש מתקדם

### הגדרת בדיקה מותאמת

```javascript
const loadTestSystem = require('./src/tests/loadTest');

const config = {
    messageCount: 500,
    connectionId: 'my-connection',
    messageTemplate: 'Custom message #{number}',
    delayBetweenMessages: 1000,
    maxConcurrentMessages: 5,
    enableRateLimiting: true,
    enableHealthChecks: true
};

await loadTestSystem.init();
const results = await loadTestSystem.runLoadTest(config);
console.log(`Delivery Rate: ${results.deliveryRate.toFixed(2)}%`);
```

### ניטור בזמן אמת

```javascript
// התחלת בדיקה
const testPromise = loadTestSystem.runLoadTest(config);

// ניטור התקדמות
const monitorInterval = setInterval(async () => {
    const status = await loadTestSystem.getTestStatus();
    if (status.status === 'running') {
        console.log(`Progress: ${status.progress.percentage.toFixed(1)}%`);
        console.log(`Queue: ${status.queue.waiting} waiting, ${status.queue.active} active`);
    }
}, 3000);

const results = await testPromise;
clearInterval(monitorInterval);
```

### שימוש בכלי עזר

```javascript
const { createTestContacts, measureTime, calculateStatistics } = require('./src/utils/testUtils');

// יצירת אנשי קשר לבדיקה
const contacts = await createTestContacts(100);

// מדידת זמן ביצוע
const result = await measureTime(async () => {
    // פעולה למדידה
    return await someAsyncOperation();
});

// חישוב סטטיסטיקות
const stats = calculateStatistics([100, 200, 300, 150, 250]);
console.log(`Average: ${stats.mean}, Median: ${stats.median}`);
```

## 📈 דוגמאות תוצאות

### דוח בסיסי

```
╔══════════════════════════════════════════════════════════════╗
║                    CHATGROW LOAD TEST REPORT                 ║
╚══════════════════════════════════════════════════════════════╝

📊 SUMMARY
   Test ID: load-test-1703123456789
   Status: PASSED
   Duration: 8m 23s
   Total Messages: 500
   Successful: 495
   Failed: 3
   Blocked: 2

📈 METRICS
   Delivery Rate: 99.00%
   Ban Rate: 0.40%
   Error Rate: 0.60%
   Avg Time/Message: 1,007ms
   Throughput: 0.99 msg/s

⚡ PERFORMANCE
   Min Time: 150ms
   Max Time: 2,500ms
   Median (P50): 950ms
   95th Percentile: 1,800ms
   99th Percentile: 2,200ms

⚠️  ISSUES
   Errors: 3
   Warnings: 1
   Critical Recommendations: 0
   High Priority Recommendations: 1

💡 RECOMMENDATIONS
   ⚠️ Consider optimizing queue processing for better throughput
```

### דוח JSON

```json
{
  "summary": {
    "testId": "load-test-1703123456789",
    "status": "PASSED",
    "startTime": "2023-12-21T10:30:45.123Z",
    "endTime": "2023-12-21T10:39:08.456Z",
    "duration": "8m 23s",
    "totalMessages": 500,
    "successfulMessages": 495,
    "failedMessages": 3,
    "blockedMessages": 2
  },
  "metrics": {
    "deliveryRate": "99.00%",
    "banRate": "0.40%",
    "errorRate": "0.60%",
    "averageTimePerMessage": "1,007ms",
    "throughput": "0.99 msg/s"
  },
  "performance": {
    "statistics": {
      "count": 495,
      "min": 150,
      "max": 2500,
      "mean": 1007.5,
      "median": 950,
      "p95": 1800,
      "p99": 2200
    }
  },
  "recommendations": [
    {
      "priority": "MEDIUM",
      "type": "PERFORMANCE",
      "message": "Consider optimizing queue processing for better throughput"
    }
  ]
}
```

## 🧪 סוגי בדיקות

### 1. בדיקה בסיסית
```bash
npm run test:load --count 500
```
- בדיקת 500 הודעות עם הגדרות ברירת מחדל
- מתאים לבדיקת פונקציונליות בסיסית

### 2. בדיקת עומס (Stress Test)
```bash
npm run test:load --count 200 --delay 100 --concurrent 20
```
- בדיקה עם עומס גבוה ומקבילות מרובות
- בודק את גבולות המערכת

### 3. בדיקת Rate Limiting
```bash
npm run test:load --count 100 --delay 50 --concurrent 10
```
- בדיקה אגרסיבית לזיהוי חסימות
- וידוא שמערכת החסימה עובדת

### 4. בדיקת ביצועים
```bash
npm run test:load --count 1000 --delay 500 --concurrent 8
```
- בדיקה מאוזנת למדידת ביצועים
- מתמקדת ב-throughput ו-latency

## 🔍 פתרון בעיות

### בעיות נפוצות

**הבדיקה נכשלת עם שגיאת חיבור**
```bash
# בדוק שהמערכת רצה
npm start

# בדוק הגדרות חיבור
echo $MONGODB_URI
echo $REDIS_URL
```

**Rate Limiting לא עובד**
```bash
# בדוק את מערכת Rate Limiting
npm run test:rate-limit

# בדוק הגדרות Redis
redis-cli ping
```

**ביצועים איטיים**
```bash
# בדוק משאבי מערכת
npm run test:load --count 100 --verbose

# בדוק לוגים
tail -f logs/error.log
```

### דיבוג מתקדם

```javascript
// הפעלת בדיקה עם לוגים מפורטים
const config = {
    messageCount: 50,
    enableLogging: true,
    verbose: true
};

// בדיקת סטטוס בזמן אמת
const status = await loadTestSystem.getTestStatus();
console.log('Current status:', status);

// עצירת בדיקה ידנית
await loadTestSystem.stopTest();
```

## 📁 מבנה קבצים

```
test-results/
├── load-test-results-20231221-103045.json
├── stress-test-results-20231221-104530.json
├── rate-limit-test-results-20231221-105215.json
└── performance-test-results-20231221-110000.json
```

## 🔧 הגדרות מתקדמות

### הגדרות סביבה

```bash
# הגדרות בדיקה
LOAD_TEST_DEFAULT_COUNT=500
LOAD_TEST_DEFAULT_DELAY=1000
LOAD_TEST_MAX_CONCURRENT=10
LOAD_TEST_TIMEOUT=300000

# הגדרות Redis לבדיקות
REDIS_URL=redis://localhost:6379
REDIS_TEST_DB=1

# הגדרות MongoDB לבדיקות
MONGODB_URI=mongodb://localhost:27017/chatgrow-test
```

### הגדרות מותאמות

```javascript
// הגדרת תבניות הודעה מותאמות
const messageTemplates = {
    welcome: 'ברוכים הבאים! חשבון #{number} פעיל כעת.',
    notification: 'התראה: יש לך הודעה חדשה #{number}',
    marketing: 'מבצע מיוחד! #{number}% הנחה על כל המוצרים'
};

// הגדרת סנריוים שונים
const scenarios = {
    normal: { delay: 1000, concurrent: 5 },
    stress: { delay: 100, concurrent: 20 },
    conservative: { delay: 2000, concurrent: 3 }
};
```

## 📊 מדדי ביצועים

### מדדים עיקריים

- **Delivery Rate** - אחוז ההודעות שנשלחו בהצלחה
- **Ban Rate** - אחוז ההודעות שנחסמו על ידי WhatsApp
- **Throughput** - מספר הודעות לשנייה
- **Latency** - זמן עיבוד ממוצע להודעה
- **P95/P99** - זמני תגובה ב-95% ו-99% מהמקרים

### מדדי איכות

- **Error Rate** - אחוז השגיאות
- **Retry Rate** - אחוז ניסיונות חוזרים
- **Queue Depth** - עומק התור
- **Memory Usage** - שימוש בזיכרון
- **CPU Usage** - שימוש במעבד

## 🚀 פריסה לייצור

### הכנה לבדיקות ייצור

```bash
# התקנת תלויות
npm install

# הגדרת משתני סביבה
cp env.example .env
# עריכת .env עם הגדרות ייצור

# בדיקת חיבורים
npm run test:load --count 10 --quiet
```

### בדיקות אוטומטיות

```bash
# הוספה ל-CI/CD pipeline
npm run test:load --count 100 --quiet --json
npm run test:rate-limit --quiet --json

# בדיקת תוצאות
if [ $? -eq 0 ]; then
    echo "Load tests passed"
else
    echo "Load tests failed"
    exit 1
fi
```

## 🤝 תרומה

### הוספת בדיקות חדשות

```javascript
// הוספת בדיקה מותאמת
class CustomTestScenario {
    async runCustomTest() {
        // לוגיקת הבדיקה המותאמת
    }
}

// הוספה למערכת הבדיקה
loadTestSystem.addCustomScenario('custom', CustomTestScenario);
```

### שיפור דוחות

```javascript
// הוספת מדדים חדשים
const customMetrics = {
    customMetric1: calculateCustomMetric1(),
    customMetric2: calculateCustomMetric2()
};

// הוספה לתוצאות
results.customMetrics = customMetrics;
```

## 📝 רישיון

MIT License - ראה קובץ LICENSE לפרטים.

## 🆘 תמיכה

לשאלות ותמיכה:
- פתח Issue ב-GitHub
- בדוק את הלוגים ב-`logs/`
- הרץ בדיקות דיבוג עם `--verbose`

---

**🎯 מטרה: אפס חסימות WhatsApp עם ביצועים מיטביים!** 
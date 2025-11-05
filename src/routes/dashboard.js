const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');

// Dashboard route
router.get('/', async (req, res) => {
    try {
        // Get dynamic stats
        const stats = {
            notifications: { email: 0, sms: 0, successRate: 95 },
            messages: { today: 0, successRate: 95 },
            payments: { today: 0, total: 0 },
            system: { status: 'healthy', uptime: Math.floor(process.uptime()) }
        };

        // Try to get real stats if services are available
        try {
            // Get notification stats if available
            // stats.notifications can be populated from NotificationService
        } catch (error) {
            // Use fallback stats
        }

        // Get sample data for demo
        const today = new Date();
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));

        res.send(`
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BusinessFlow - ניהול תורים לעסקים</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            direction: rtl;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            padding: 30px 40px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }

        .main-content {
            padding: 40px;
        }

        .stats-overview {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }

        .stat-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border: 3px solid transparent;
            transition: all 0.3s ease;
        }

        .stat-card:hover {
            transform: translateY(-5px);
            border-color: #667eea;
            box-shadow: 0 15px 40px rgba(102, 126, 234, 0.2);
        }

        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }

        .stat-label {
            color: #666;
            font-size: 1.1em;
        }

        .stat-icon {
            font-size: 2em;
            margin-bottom: 15px;
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
        }

        .feature-card {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
        }

        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.15);
        }

        .feature-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        }

        .feature-icon {
            font-size: 2.5em;
            margin-left: 15px;
        }

        .feature-title {
            font-size: 1.5em;
            color: #333;
            font-weight: bold;
        }

        .feature-description {
            color: #666;
            line-height: 1.6;
            margin-bottom: 20px;
        }

        .btn {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            font-size: 1em;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            margin: 5px;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }

        .btn-secondary {
            background: linear-gradient(45deg, #95a5a6, #7f8c8d);
        }

        .btn-success {
            background: linear-gradient(45deg, #27ae60, #2ecc71);
        }

        .btn-warning {
            background: linear-gradient(45deg, #f39c12, #e67e22);
        }

        .quick-actions {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 30px;
            margin-top: 30px;
        }

        .quick-actions h2 {
            color: #333;
            margin-bottom: 20px;
            text-align: center;
        }

        .actions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }

        .status-badge {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
        }

        .status-active {
            background: #27ae60;
            color: white;
        }

        .status-pending {
            background: #f39c12;
            color: white;
        }

        .status-demo {
            background: #3498db;
            color: white;
        }

        .demo-notice {
            background: #e8f4f8;
            border: 2px solid #3498db;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: center;
        }

        .demo-notice h3 {
            color: #2980b9;
            margin-bottom: 10px;
        }

        .demo-notice p {
            color: #34495e;
        }

        .section {
            background: #ffffff;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
        }

        .section:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.12);
        }

        .section h2 {
            color: #333;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
        }

        .section h2 .feature-icon {
            margin-left: 10px;
            font-size: 1.8em;
        }

        .section p {
            color: #666;
            line-height: 1.7;
            margin-bottom: 25px;
        }

        .action-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🗓️ BusinessFlow</h1>
            <p>מערכת ניהול תורים ולקוחות מתקדמת לעסקים</p>
        </div>

        <div class="main-content">
            <div class="demo-notice">
                <h3>🎯 ברוכים הבאים למערכת החדשה!</h3>
                <p>BusinessFlow - פתרון מקיף לניהול תורים, לקוחות ותשלומים עבור עסקים קטנים ובינוניים</p>
                <span class="status-badge status-demo">מצב הדגמה</span>
            </div>

            <div class="stats-overview">
                <div class="stat-card">
                    <div class="stat-icon">📅</div>
                    <div class="stat-number">0</div>
                    <div class="stat-label">תורים השבוע</div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-number">0</div>
                    <div class="stat-label">לקוחות פעילים</div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-number">₪0</div>
                    <div class="stat-label">הכנסות החודש</div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-number">4.8</div>
                    <div class="stat-label">דירוג ממוצע</div>
                </div>

                <div class="stat-card">
                        <div class="stat-icon">📧</div>
                        <div class="stat-number">${stats.notifications.email || 0}</div>
                        <div>הודעות Email</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">💬</div>
                        <div class="stat-number">${stats.notifications.sms || 0}</div>
                        <div>הודעות SMS</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">💳</div>
                        <div class="stat-number">₪${stats.payments.today || 0}</div>
                        <div>תשלומים היום</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-number">${stats.notifications.successRate || 0}%</div>
                        <div>שיעור הצלחה</div>
                    </div>
            </div>

            <div class="features-grid">
                <!-- Calendar Management -->
                <div class="feature-card">
                    <div class="feature-header">
                        <div class="feature-icon">🗓️</div>
                        <div class="feature-title">יומן וזמינות</div>
                    </div>
                    <div class="feature-description">
                        הגדרת זמינות שבועית, חסימת תאריכים ונהול לוח השנה העסקי שלך בצורה פשוטה ויעילה.
                    </div>
                    <a href="/api/calendar" class="btn">נהל יומן</a>
                    <button class="btn btn-secondary" onclick="alert('בהמתנה לפיתוח')">הגדרות זמינות</button>
                </div>

                <!-- Appointment Management -->
                <div class="feature-card">
                    <div class="feature-header">
                        <div class="feature-icon">⏰</div>
                        <div class="feature-title">ניהול תורים</div>
                    </div>
                    <div class="feature-description">
                        קביעת תורים, עריכה וביטול. ממשק נוח ללקוחות עם אפשרות הזמנה עצמית 24/7.
                    </div>
                    <a href="/api/appointments" class="btn">נהל תורים</a>
                    <button class="btn btn-success" onclick="alert('בהמתנה לפיתוח')">תור חדש</button>
                </div>

                <!-- Customer Management -->
                <a href="/api/customers" class="feature-card">
                            <div class="feature-icon">👨‍💼</div>
                            <div class="feature-title">ניהול לקוחות</div>
                            <div class="feature-description">
                                מאגר לקוחות מלא עם היסטוריית פגישות, העדפות אישיות ומעקב אחר סטטוס התשלומים.
                            </div>
                            <a href="/api/customers" class="btn">רשימת לקוחות</a>
                            <button class="btn btn-success" onclick="alert('בהמתנה לפיתוח')">לקוח חדש</button>
                        </a>

                        <a href="/api/payments" class="feature-card">
                            <div class="feature-icon">💰</div>
                            <div class="feature-title">ניהול תשלומים</div>
                            <div class="feature-description">
                                מעקב אחר תשלומים, חשבוניות אוטומטיות, תזכורות תשלום ודיווחים פיננסיים מפורטים.
                            </div>
                            <a href="/api/payments" class="btn">נהל תשלומים</a>
                            <button class="btn btn-warning" onclick="alert('בהמתנה לפיתוח')">חשבונית חדשה</button>
                        </a>

                        <a href="/api/analytics" class="feature-card">
                            <div class="feature-icon">📊</div>
                            <div class="feature-title">דוחות ואנליטיקה</div>
                            <div class="feature-description">
                                דוחות מפורטים על הכנסות, נוכחות לקוחות, שעות עבודה ומדדי ביצועים עסקיים.
                            </div>
                            <a href="/api/reports" class="btn">צפה בדוחות</a>
                            <button class="btn btn-secondary" onclick="alert('בהמתנה לפיתוח')">יצא דוח</button>
                        </a>

                <!-- Notifications -->
                <div class="feature-card">
                    <div class="feature-header">
                        <div class="feature-icon">📧</div>
                        <div class="feature-title">תזכורות ושליחת הודעות</div>
                    </div>
                    <div class="feature-description">
                        שליחת תזכורות אוטומטיות ללקוחות דרך Email ו-SMS עם הודעות מותאמות אישית.
                    </div>
                    <a href="/api/notifications" class="btn">הגדרות הודעות</a>
                    <button class="btn btn-secondary" onclick="alert('בהמתנה לפיתוח')">בדוק תזכורות</button>
                </div>

                <!-- Invoices -->
                <div class="feature-card">
                    <div class="feature-header">
                        <div class="feature-icon">📄</div>
                        <div class="feature-title">חשבוניות</div>
                    </div>
                    <div class="feature-description">
                        יצירת חשבוניות מס בעברית, שליחה אוטומטית באימייל וניהול מלא של כל החשבוניות.
                    </div>
                    <a href="/api/invoices" class="btn">נהל חשבוניות</a>
                    <button class="btn btn-success" onclick="alert('בהמתנה לפיתוח')">חשבונית חדשה</button>
                </div>

                <!-- Automated Tasks (CRON) -->
                <div class="feature-card">
                    <div class="feature-header">
                        <div class="feature-icon">🤖</div>
                        <div class="feature-title">משימות אוטומטיות</div>
                    </div>
                    <div class="feature-description">
                        תזכורות אוטומטיות לאירועים ותורים, חיובים מתוזמנים, דוחות שבועיים/חודשיים וניקוי אוטומטי.
                    </div>
                    <button class="btn" onclick="viewCronJobs()">צפה במשימות</button>
                    <button class="btn btn-info" onclick="viewCronSchedule()">לוח זמנים</button>
                </div>
            </div>

            <script>
                async function viewCronJobs() {
                    try {
                        const response = await fetch('/api/cron/status');
                        const data = await response.json();
                        if (data.success) {
                            let statusText = 'סטטוס משימות אוטומטיות:' + String.fromCharCode(10) + String.fromCharCode(10);
                            statusText += 'מערכת אותחלה: ' + (data.data.initialized ? 'כן' : 'לא') + String.fromCharCode(10);
                            statusText += 'מספר משימות פעילות: ' + data.data.jobsCount + String.fromCharCode(10) + String.fromCharCode(10);
                            statusText += 'משימות:' + String.fromCharCode(10);
                            statusText += JSON.stringify(data.data.jobs, null, 2);
                            alert(statusText);
                        } else {
                            alert('שגיאה בטעינת סטטוס CRON');
                        }
                    } catch (error) {
                        alert('שגיאה: ' + error.message + String.fromCharCode(10) + String.fromCharCode(10) + 'אנא התחבר תחילה');
                    }
                }

                async function viewCronSchedule() {
                    try {
                        const response = await fetch('/api/cron/schedule');
                        const data = await response.json();
                        if (data.success) {
                            let scheduleText = 'לוח זמנים של משימות אוטומטיות:' + String.fromCharCode(10) + String.fromCharCode(10);
                            for (const key in data.data) {
                                const job = data.data[key];
                                scheduleText += job.name + ':' + String.fromCharCode(10);
                                scheduleText += '  זמן: ' + job.schedule + String.fromCharCode(10);
                                scheduleText += '  תיאור: ' + job.description + String.fromCharCode(10) + String.fromCharCode(10);
                            }
                            alert(scheduleText);
                        } else {
                            alert('שגיאה בטעינת לוח זמנים');
                        }
                    } catch (error) {
                        alert('שגיאה: ' + error.message + String.fromCharCode(10) + String.fromCharCode(10) + 'אנא התחבר תחילה');
                    }
                }
            </script>

            <div class="section">
                        <h2>🏪 ניהול ספקי שירות</h2>
                        <p>כאן תוכל לנהל את כל ספקי השירות ברשת שלך</p>
                        <div class="action-buttons">
                            <a href="/auth/register" class="btn">הוספת ספק חדש</a>
                            <a href="/provider/dashboard" class="btn">דאשבורד ספקים</a>
                        </div>
                    </div>

                    <div class="section">
                        <h2>🎯 ניהול מנויים</h2>
                        <p>ניהול מנויים, תוכניות מנוי ואנליטיקות</p>
                        <div class="action-buttons">
                            <a href="/subscribers/register" class="btn">הרשמת מנוי חדש</a>
                            <a href="/subscribers/login" class="btn">כניסת מנויים</a>
                            <a href="/subscribers/dashboard" class="btn">דאשבורד מנויים</a>
                            <a href="/subscribers/stats" class="btn" onclick="loadSubscriberStats()">סטטיסטיקות מנויים</a>
                        </div>
                    </div>

            <div class="quick-actions">
                <h2>🚀 פעולות מהירות</h2>
                <div class="actions-grid">
                    <button class="btn btn-success" onclick="alert('בהמתנה לפיתוח - תור חדש')">➕ הוסף תור חדש</button>
                    <button class="btn btn-warning" onclick="alert('בהמתנה לפיתוח - רשימת היום')">📋 רשימת תורי היום</button>
                    <button class="btn" onclick="alert('בהמתנה לפיתוח - לקוח חדש')">👤 הוסף לקוח חדש</button>
                    <button class="btn btn-secondary" onclick="alert('בהמתנה לפיתוח - הגדרות')">⚙️ הגדרות מערכת</button>
                    <button class="btn" onclick="alert('בהמתנה לפיתוח - גיבוי')">💾 גבה נתונים</button>
                    <button class="btn btn-warning" onclick="alert('בהמתנה לפיתוח - סטטיסטיקות')">📈 סטטיסטיקות שבועיות</button>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
        `);
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).send(`
            <h1>שגיאה בטעינת הדאשבורד</h1>
            <p>אנא נסה שוב מאוחר יותר</p>
            <pre>${error.message}</pre>
        `);
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { logApiRequest } = require('../utils/logger');

// Dashboard home page
router.get('/', (req, res) => {
    const startTime = Date.now();
    
    const html = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ChatGrow - ממשק ניהול</title>
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
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 40px;
        }
        
        .header h1 {
            font-size: 3rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .status-bar {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 30px;
            color: white;
        }
        
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            text-align: center;
        }
        
        .status-item {
            padding: 15px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
        }
        
        .status-item h3 {
            font-size: 0.9rem;
            margin-bottom: 5px;
            opacity: 0.8;
        }
        
        .status-item .value {
            font-size: 1.5rem;
            font-weight: bold;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.15);
        }
        
        .card h2 {
            color: #4a5568;
            margin-bottom: 20px;
            font-size: 1.5rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .icon {
            font-size: 1.8rem;
        }
        
        .btn {
            display: inline-block;
            padding: 12px 20px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            margin: 5px;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            font-size: 0.9rem;
        }
        
        .btn:hover {
            background: #5a6fd8;
            transform: translateY(-2px);
        }
        
        .btn-success { background: #48bb78; }
        .btn-success:hover { background: #38a169; }
        
        .btn-warning { background: #ed8936; }
        .btn-warning:hover { background: #dd7724; }
        
        .btn-danger { background: #f56565; }
        .btn-danger:hover { background: #e53e3e; }
        
        .btn-info { background: #4299e1; }
        .btn-info:hover { background: #3182ce; }
        
        .btn-small {
            padding: 8px 16px;
            font-size: 0.8rem;
        }
        
        .feature-list {
            list-style: none;
            padding: 0;
        }
        
        .feature-list li {
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .feature-list li:last-child {
            border-bottom: none;
        }
        
        .status-online {
            color: #48bb78;
            font-weight: bold;
        }
        
        .status-offline {
            color: #f56565;
            font-weight: bold;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 15px;
        }
        
        .stat-item {
            text-align: center;
            padding: 10px;
            background: #f7fafc;
            border-radius: 8px;
        }
        
        .stat-number {
            font-size: 1.5rem;
            font-weight: bold;
            color: #667eea;
        }
        
        .stat-label {
            font-size: 0.8rem;
            color: #718096;
            margin-top: 5px;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            color: rgba(255,255,255,0.8);
            font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 2rem;
            }
            
            .grid {
                grid-template-columns: 1fr;
            }
            
            .status-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 ChatGrow</h1>
            <p>מערכת ניהול הודעות WhatsApp מתקדמת</p>
        </div>
        
        <div class="status-bar">
            <div class="status-grid">
                <div class="status-item">
                    <h3>סטטוס שרת</h3>
                    <div class="value status-online">🟢 פעיל</div>
                </div>
                <div class="status-item">
                    <h3>MongoDB</h3>
                    <div class="value status-offline">🔴 לא זמין</div>
                </div>
                <div class="status-item">
                    <h3>Redis</h3>
                    <div class="value status-offline">🔴 לא זמין</div>
                </div>
                <div class="status-item">
                    <h3>WhatsApp</h3>
                    <div class="value status-offline">🔴 לא מחובר</div>
                </div>
            </div>
        </div>
        
        <div class="grid">
            <!-- Authentication System -->
            <div class="card">
                <h2><span class="icon">🔐</span>מערכת אימות</h2>
                <ul class="feature-list">
                    <li>JWT Authentication <span class="status-online">✓</span></li>
                    <li>תוכניות מנוי <span class="status-online">✓</span></li>
                    <li>ניהול סשנים <span class="status-online">✓</span></li>
                    <li>API Keys <span class="status-online">✓</span></li>
                </ul>
                <div style="margin-top: 15px;">
                    <a href="/api/auth/register" class="btn btn-success btn-small">הרשמה</a>
                    <a href="/api/auth/login" class="btn btn-info btn-small">התחברות</a>
                    <a href="/api/auth/me" class="btn btn-small">פרופיל</a>
                </div>
            </div>
            
            <!-- WhatsApp Management -->
            <div class="card">
                <h2><span class="icon">📱</span>ניהול WhatsApp</h2>
                <ul class="feature-list">
                    <li>חיבורים מרובים <span class="status-offline">✗</span></li>
                    <li>QR Code Auth <span class="status-offline">✗</span></li>
                    <li>שליחת הודעות <span class="status-offline">✗</span></li>
                    <li>מדיה וקבצים <span class="status-offline">✗</span></li>
                </ul>
                <div style="margin-top: 15px;">
                    <a href="/api/whatsapp/connections" class="btn btn-info btn-small">חיבורים</a>
                    <a href="/api/whatsapp/status" class="btn btn-small">סטטוס</a>
                </div>
            </div>
            
            <!-- Message Queue System -->
            <div class="card">
                <h2><span class="icon">⚡</span>מערכת תורים</h2>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-number">0</div>
                        <div class="stat-label">הודעות בתור</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">0</div>
                        <div class="stat-label">הודעות עובדות</div>
                    </div>
                </div>
                <div style="margin-top: 15px;">
                    <a href="/api/queue/status" class="btn btn-info btn-small">סטטוס תור</a>
                    <a href="/api/queue/stats" class="btn btn-small">סטטיסטיקות</a>
                </div>
            </div>
            
            <!-- Rate Limiting -->
            <div class="card">
                <h2><span class="icon">🛡️</span>הגבלת קצב</h2>
                <ul class="feature-list">
                    <li>חסימה אוטומטית <span class="status-online">✓</span></li>
                    <li>Exponential Backoff <span class="status-online">✓</span></li>
                    <li>ניטור פר חיבור <span class="status-online">✓</span></li>
                </ul>
                <div style="margin-top: 15px;">
                    <a href="/api/rate-limit/status" class="btn btn-info btn-small">סטטוס</a>
                    <a href="/api/rate-limit/config" class="btn btn-small">הגדרות</a>
                </div>
            </div>
            
            <!-- Logging System -->
            <div class="card">
                <h2><span class="icon">📊</span>מערכת לוגים</h2>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-number">0</div>
                        <div class="stat-label">הודעות שנשלחו</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">100%</div>
                        <div class="stat-label">שיעור הצלחה</div>
                    </div>
                </div>
                <div style="margin-top: 15px;">
                    <a href="/api/logs/messages" class="btn btn-info btn-small">הודעות</a>
                    <a href="/api/logs/stats" class="btn btn-small">סטטיסטיקות</a>
                    <a href="/api/logs/report" class="btn btn-warning btn-small">דוחות</a>
                </div>
            </div>
            
            <!-- Health Monitoring -->
            <div class="card">
                <h2><span class="icon">🏥</span>ניטור בריאות</h2>
                <ul class="feature-list">
                    <li>בדיקות אוטומטיות <span class="status-online">✓</span></li>
                    <li>התראות <span class="status-online">✓</span></li>
                    <li>דשבורד ביצועים <span class="status-online">✓</span></li>
                </ul>
                <div style="margin-top: 15px;">
                    <a href="/api/health" class="btn btn-success btn-small">בריאות כללית</a>
                    <a href="/api/health/detailed" class="btn btn-info btn-small">דוח מפורט</a>
                    <a href="/api/health/dashboard" class="btn btn-small">דשבורד</a>
                </div>
            </div>
            
            <!-- Load Testing -->
            <div class="card">
                <h2><span class="icon">🧪</span>בדיקת עומס</h2>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-number">500+</div>
                        <div class="stat-label">הודעות לבדיקה</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">98%</div>
                        <div class="stat-label">יעד הצלחה</div>
                    </div>
                </div>
                <div style="margin-top: 15px;">
                    <button onclick="runLoadTest()" class="btn btn-warning btn-small">הרץ בדיקת עומס</button>
                    <button onclick="runRateLimitTest()" class="btn btn-info btn-small">בדיקת Rate Limit</button>
                </div>
            </div>
            
            <!-- API Documentation -->
            <div class="card">
                <h2><span class="icon">📚</span>תיעוד API</h2>
                <ul class="feature-list">
                    <li><a href="/api/auth" style="text-decoration: none;">🔐 Authentication API</a></li>
                    <li><a href="/api/whatsapp" style="text-decoration: none;">📱 WhatsApp API</a></li>
                    <li><a href="/api/queue" style="text-decoration: none;">⚡ Queue API</a></li>
                    <li><a href="/api/logs" style="text-decoration: none;">📊 Logs API</a></li>
                    <li><a href="/api/health" style="text-decoration: none;">🏥 Health API</a></li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <p>ChatGrow v1.0.0 - מערכת ניהול הודעות WhatsApp מתקדמת</p>
            <p>רץ על פורט 5000 | MongoDB: לא זמין | Redis: לא זמין</p>
        </div>
    </div>
    
    <script>
        // Load test functions
        async function runLoadTest() {
            if(confirm('האם אתה בטוח שאתה רוצה להריץ בדיקת עומס של 500 הודעות?')) {
                alert('מתחיל בדיקת עומס... בדוק את הקונסול לעדכונים');
                try {
                    const response = await fetch('/api/test/load', { method: 'POST' });
                    const result = await response.json();
                    alert('בדיקת עומס הסתיימה! בדוק את התוצאות בלוגים');
                } catch (error) {
                    alert('שגיאה בהרצת בדיקת עומס: ' + error.message);
                }
            }
        }
        
        async function runRateLimitTest() {
            if(confirm('האם אתה רוצה להריץ בדיקת הגבלת קצב?')) {
                alert('מתחיל בדיקת Rate Limiting...');
                try {
                    const response = await fetch('/api/test/rate-limit', { method: 'POST' });
                    const result = await response.json();
                    alert('בדיקת Rate Limiting הסתיימה!');
                } catch (error) {
                    alert('שגיאה בבדיקת Rate Limiting: ' + error.message);
                }
            }
        }
        
        // Auto refresh status every 30 seconds
        setInterval(async () => {
            try {
                const response = await fetch('/api/health');
                const health = await response.json();
                // Update status indicators based on health check
                console.log('Health status updated:', health);
            } catch (error) {
                console.log('Failed to update health status:', error);
            }
        }, 30000);
        
        // Welcome message
        console.log('🚀 ChatGrow Dashboard loaded successfully!');
        console.log('📊 Health check available at: /api/health');
        console.log('🔐 Authentication API: /api/auth');
        console.log('📱 WhatsApp API: /api/whatsapp');
    </script>
</body>
</html>`;

    logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime, {
        action: 'dashboard_home'
    });

    res.send(html);
});

module.exports = router;

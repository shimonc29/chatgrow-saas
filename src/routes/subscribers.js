
const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Subscriber registration page
router.get('/register', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>הצטרפות למנויים - ChatGrow</title>
        <style>
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            
            .header h1 {
                color: #4a5568;
                font-size: 2.5rem;
                margin-bottom: 10px;
            }
            
            .header p {
                color: #718096;
                font-size: 1.1rem;
            }
            
            .form-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-group.full-width {
                grid-column: 1 / -1;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 8px;
                color: #2d3748;
                font-weight: 600;
            }
            
            .form-group input,
            .form-group select {
                width: 100%;
                padding: 15px;
                border: 2px solid #e2e8f0;
                border-radius: 10px;
                font-size: 16px;
                transition: border-color 0.3s;
            }
            
            .form-group input:focus,
            .form-group select:focus {
                outline: none;
                border-color: #667eea;
            }
            
            .plans {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }
            
            .plan {
                border: 2px solid #e2e8f0;
                border-radius: 10px;
                padding: 20px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s;
                position: relative;
            }
            
            .plan:hover {
                border-color: #667eea;
                transform: translateY(-2px);
            }
            
            .plan.selected {
                border-color: #667eea;
                background: #f7fafc;
            }
            
            .plan h3 {
                color: #4a5568;
                margin-bottom: 10px;
            }
            
            .plan .price {
                font-size: 1.5rem;
                font-weight: bold;
                color: #667eea;
                margin-bottom: 10px;
            }
            
            .plan .features {
                font-size: 0.9rem;
                color: #718096;
                text-align: right;
            }
            
            .plan .features li {
                margin-bottom: 5px;
                list-style: none;
            }
            
            .plan .features li:before {
                content: "✓ ";
                color: #48bb78;
                font-weight: bold;
            }
            
            .btn {
                width: 100%;
                padding: 15px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 18px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.3s;
            }
            
            .btn:hover {
                transform: translateY(-2px);
            }
            
            .login-link {
                text-align: center;
                margin-top: 20px;
            }
            
            .login-link a {
                color: #667eea;
                text-decoration: none;
                font-weight: 600;
            }
            
            .interests {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 10px;
                margin-top: 10px;
            }
            
            .interest {
                padding: 8px 12px;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 14px;
            }
            
            .interest:hover {
                border-color: #667eea;
            }
            
            .interest.selected {
                border-color: #667eea;
                background: #667eea;
                color: white;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚀 ChatGrow</h1>
                <p>הצטרפו לקהילת המנויים שלנו ותיהנו מאירועים מדהימים</p>
            </div>
            
            <form id="registerForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label>שם פרטי</label>
                        <input type="text" name="firstName" required>
                    </div>
                    
                    <div class="form-group">
                        <label>שם משפחה</label>
                        <input type="text" name="lastName" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>אימייל</label>
                    <input type="email" name="email" required>
                </div>
                
                <div class="form-group">
                    <label>סיסמה</label>
                    <input type="password" name="password" required minlength="8">
                </div>
                
                <div class="form-group">
                    <label>טלפון</label>
                    <input type="tel" name="phone" required>
                </div>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label>תאריך לידה</label>
                        <input type="date" name="dateOfBirth">
                    </div>
                    
                    <div class="form-group">
                        <label>עיר</label>
                        <input type="text" name="city">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>תחומי עניין</label>
                    <div class="interests">
                        <div class="interest" data-value="photography">צילום</div>
                        <div class="interest" data-value="workshops">סדנאות</div>
                        <div class="interest" data-value="beauty">יופי</div>
                        <div class="interest" data-value="fitness">כושר</div>
                        <div class="interest" data-value="cooking">בישול</div>
                        <div class="interest" data-value="music">מוסיקה</div>
                        <div class="interest" data-value="art">אמנות</div>
                        <div class="interest" data-value="business">עסקים</div>
                    </div>
                    <input type="hidden" name="interests">
                </div>
                
                <div class="form-group">
                    <label>בחירת תוכנית מנוי</label>
                    <div class="plans">
                        <div class="plan" data-value="free">
                            <h3>חינמי</h3>
                            <div class="price">₪0</div>
                            <ul class="features">
                                <li>3 אירועים בחודש</li>
                                <li>תמיכה בסיסית</li>
                                <li>התראות אימייל</li>
                            </ul>
                        </div>
                        
                        <div class="plan" data-value="basic">
                            <h3>בסיסי</h3>
                            <div class="price">₪29</div>
                            <ul class="features">
                                <li>10 אירועים בחודש</li>
                                <li>אנליטיקות מתקדמות</li>
                                <li>תמיכה מהירה</li>
                                <li>התראות WhatsApp</li>
                            </ul>
                        </div>
                        
                        <div class="plan" data-value="premium">
                            <h3>פרימיום</h3>
                            <div class="price">₪59</div>
                            <ul class="features">
                                <li>50 אירועים בחודש</li>
                                <li>תמיכה עדיפה</li>
                                <li>מיתוג מותאם</li>
                                <li>API גישה</li>
                                <li>דוחות מתקדמים</li>
                            </ul>
                        </div>
                        
                        <div class="plan" data-value="vip">
                            <h3>VIP</h3>
                            <div class="price">₪99</div>
                            <ul class="features">
                                <li>אירועים ללא הגבלה</li>
                                <li>תמיכה 24/7</li>
                                <li>מנהל חשבון ייעודי</li>
                                <li>כל התכונות</li>
                                <li>גישה מוקדמת</li>
                            </ul>
                        </div>
                    </div>
                    <input type="hidden" name="plan" required>
                </div>
                
                <div class="form-group">
                    <label>קוד הפניה (אופציונלי)</label>
                    <input type="text" name="referralCode" placeholder="הזן קוד הפניה לקבלת הטבה">
                </div>
                
                <button type="submit" class="btn">הירשם עכשיו</button>
                
                <div class="login-link">
                    <p>יש לך כבר חשבון? <a href="/subscribers/login">התחבר כאן</a></p>
                </div>
            </form>
        </div>

        <script>
            // Plan selection
            document.querySelectorAll('.plan').forEach(plan => {
                plan.addEventListener('click', function() {
                    document.querySelectorAll('.plan').forEach(p => p.classList.remove('selected'));
                    this.classList.add('selected');
                    document.querySelector('input[name="plan"]').value = this.dataset.value;
                });
            });

            // Interest selection
            document.querySelectorAll('.interest').forEach(interest => {
                interest.addEventListener('click', function() {
                    this.classList.toggle('selected');
                    updateInterests();
                });
            });

            function updateInterests() {
                const selected = Array.from(document.querySelectorAll('.interest.selected'))
                    .map(el => el.dataset.value);
                document.querySelector('input[name="interests"]').value = selected.join(',');
            }

            // Form submission
            document.getElementById('registerForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const formData = new FormData(this);
                const data = Object.fromEntries(formData.entries());
                
                if (!data.plan) {
                    alert('אנא בחר תוכנית מנוי');
                    return;
                }
                
                // Convert interests string to array
                if (data.interests) {
                    data.interests = data.interests.split(',');
                } else {
                    data.interests = [];
                }
                
                try {
                    const response = await fetch('/subscribers/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        alert('נרשמת בהצלחה! נשלח אליך אימייל אימות.');
                        window.location.href = '/subscribers/dashboard';
                    } else {
                        alert('שגיאה: ' + result.message);
                    }
                } catch (error) {
                    alert('שגיאה בהרשמה: ' + error.message);
                }
            });
        </script>
    </body>
    </html>
    `);
});

// Register API
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone, dateOfBirth, city, interests, plan, referralCode } = req.body;
        
        // Check if subscriber exists
        const existingSubscriber = await Subscriber.findByEmail(email);
        if (existingSubscriber) {
            return res.json({ success: false, message: 'מנוי עם אימייל זה כבר קיים' });
        }
        
        // Check referral code if provided
        let referredBy = null;
        if (referralCode) {
            referredBy = await Subscriber.findByReferralCode(referralCode);
            if (!referredBy) {
                return res.json({ success: false, message: 'קוד הפניה לא תקין' });
            }
        }
        
        // Create subscriber
        const subscriber = new Subscriber({
            email,
            password,
            profile: {
                firstName,
                lastName,
                phone,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                city,
                interests: interests || []
            },
            subscription: {
                plan: plan || 'free'
            },
            referral: {
                referredBy: referredBy ? referredBy._id : undefined
            }
        });
        
        // Generate email verification token
        subscriber.emailVerificationToken = crypto.randomBytes(32).toString('hex');
        
        await subscriber.save();
        
        // Add referral bonus
        if (referredBy) {
            referredBy.referral.referrals.push({
                subscriberId: subscriber._id,
                bonus: 10 // 10 shekels bonus
            });
            await referredBy.save();
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { subscriberId: subscriber._id, email }, 
            'your-secret-key', 
            { expiresIn: '30d' }
        );
        
        res.json({ 
            success: true, 
            message: 'נרשמת בהצלחה!',
            token,
            subscriber: {
                id: subscriber._id,
                fullName: subscriber.fullName,
                email: subscriber.email,
                plan: subscriber.subscription.plan
            }
        });
        
    } catch (error) {
        res.json({ success: false, message: 'שגיאה בהרשמה: ' + error.message });
    }
});

// Login page
router.get('/login', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>כניסת מנויים - ChatGrow</title>
        <style>
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .container {
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                width: 100%;
                max-width: 400px;
            }
            
            .logo {
                text-align: center;
                margin-bottom: 30px;
            }
            
            .logo h1 {
                color: #4a5568;
                font-size: 2.5rem;
                margin-bottom: 10px;
            }
            
            .logo p {
                color: #718096;
                font-size: 1.1rem;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 8px;
                color: #2d3748;
                font-weight: 600;
            }
            
            .form-group input {
                width: 100%;
                padding: 15px;
                border: 2px solid #e2e8f0;
                border-radius: 10px;
                font-size: 16px;
                transition: border-color 0.3s;
            }
            
            .form-group input:focus {
                outline: none;
                border-color: #667eea;
            }
            
            .btn {
                width: 100%;
                padding: 15px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 18px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.3s;
            }
            
            .btn:hover {
                transform: translateY(-2px);
            }
            
            .register-link {
                text-align: center;
                margin-top: 20px;
            }
            
            .register-link a {
                color: #667eea;
                text-decoration: none;
                font-weight: 600;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <h1>🚀 ChatGrow</h1>
                <p>כניסה למנויים</p>
            </div>
            
            <form id="loginForm">
                <div class="form-group">
                    <label>אימייל</label>
                    <input type="email" name="email" required>
                </div>
                
                <div class="form-group">
                    <label>סיסמה</label>
                    <input type="password" name="password" required>
                </div>
                
                <button type="submit" class="btn">התחבר</button>
                
                <div class="register-link">
                    <p>עדיין אין לך חשבון? <a href="/subscribers/register">הירשם כאן</a></p>
                </div>
            </form>
        </div>

        <script>
            document.getElementById('loginForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const formData = new FormData(this);
                const data = Object.fromEntries(formData.entries());
                
                try {
                    const response = await fetch('/subscribers/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        localStorage.setItem('subscriberToken', result.token);
                        window.location.href = '/subscribers/dashboard';
                    } else {
                        alert('שגיאה: ' + result.message);
                    }
                } catch (error) {
                    alert('שגיאה בהתחברות: ' + error.message);
                }
            });
        </script>
    </body>
    </html>
    `);
});

// Login API
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const subscriber = await Subscriber.findByEmail(email);
        if (!subscriber) {
            return res.json({ success: false, message: 'אימייל או סיסמה שגויים' });
        }
        
        const isValidPassword = await subscriber.comparePassword(password);
        if (!isValidPassword) {
            return res.json({ success: false, message: 'אימייל או סיסמה שגויים' });
        }
        
        // Update last login
        subscriber.analytics.lastLogin = new Date();
        await subscriber.save();
        
        const token = jwt.sign(
            { subscriberId: subscriber._id, email }, 
            'your-secret-key', 
            { expiresIn: '30d' }
        );
        
        res.json({ 
            success: true, 
            message: 'התחברת בהצלחה!',
            token,
            subscriber: {
                id: subscriber._id,
                fullName: subscriber.fullName,
                email: subscriber.email,
                plan: subscriber.subscription.plan
            }
        });
        
    } catch (error) {
        res.json({ success: false, message: 'שגיאה בהתחברות: ' + error.message });
    }
});

// Dashboard
router.get('/dashboard', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>דאשבורד מנוי - ChatGrow</title>
        <style>
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: #f7fafc;
                color: #2d3748;
            }
            
            .navbar {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 1rem 2rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .navbar h1 {
                font-size: 1.5rem;
            }
            
            .navbar .user-info {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .btn {
                padding: 8px 16px;
                background: rgba(255,255,255,0.2);
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                text-decoration: none;
                transition: all 0.3s;
            }
            
            .btn:hover {
                background: rgba(255,255,255,0.3);
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .stat-card {
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
            }
            
            .stat-card h3 {
                color: #667eea;
                margin-bottom: 10px;
            }
            
            .stat-card .value {
                font-size: 2rem;
                font-weight: bold;
                color: #4a5568;
            }
            
            .section {
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                margin-bottom: 20px;
            }
            
            .section h2 {
                color: #4a5568;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 2px solid #e2e8f0;
            }
            
            .event-card {
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 10px;
                transition: all 0.3s;
            }
            
            .event-card:hover {
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            
            .plan-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                color: white;
                font-size: 0.8rem;
                font-weight: bold;
            }
            
            .plan-free { background: #68d391; }
            .plan-basic { background: #4299e1; }
            .plan-premium { background: #9f7aea; }
            .plan-vip { background: #f6ad55; }
        </style>
    </head>
    <body>
        <div class="navbar">
            <h1>🚀 ChatGrow - דאשבורד מנוי</h1>
            <div class="user-info">
                <span id="userName"></span>
                <span id="userPlan" class="plan-badge"></span>
                <button class="btn" onclick="logout()">התנתק</button>
            </div>
        </div>
        
        <div class="container">
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>אירועים השבוע</h3>
                    <div class="value" id="eventsThisWeek">0</div>
                </div>
                
                <div class="stat-card">
                    <h3>סה"כ אירועים</h3>
                    <div class="value" id="totalEvents">0</div>
                </div>
                
                <div class="stat-card">
                    <h3>ספקים מחוברים</h3>
                    <div class="value" id="connectedProviders">0</div>
                </div>
                
                <div class="stat-card">
                    <h3>הפניות שלי</h3>
                    <div class="value" id="myReferrals">0</div>
                </div>
            </div>
            
            <div class="section">
                <h2>📅 האירועים הקרובים שלי</h2>
                <div id="upcomingEvents">
                    <p>טוען אירועים...</p>
                </div>
            </div>
            
            <div class="section">
                <h2>🏪 ספקי השירות המחוברים</h2>
                <div id="connectedProvidersList">
                    <p>טוען ספקים...</p>
                </div>
            </div>
        </div>

        <script>
            async function loadSubscriberData() {
                const token = localStorage.getItem('subscriberToken');
                if (!token) {
                    window.location.href = '/subscribers/login';
                    return;
                }
                
                try {
                    const response = await fetch('/subscribers/me', {
                        headers: {
                            'Authorization': 'Bearer ' + token
                        }
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        const subscriber = result.subscriber;
                        
                        // Update UI
                        document.getElementById('userName').textContent = subscriber.fullName;
                        const planBadge = document.getElementById('userPlan');
                        planBadge.textContent = subscriber.subscription.plan.toUpperCase();
                        planBadge.className = 'plan-badge plan-' + subscriber.subscription.plan;
                        
                        // Update stats
                        document.getElementById('totalEvents').textContent = subscriber.registrations.length;
                        document.getElementById('connectedProviders').textContent = subscriber.connectedProviders.length;
                        document.getElementById('myReferrals').textContent = subscriber.referral.referrals.length;
                        
                        // Load upcoming events
                        loadUpcomingEvents(subscriber.registrations);
                        
                        // Load connected providers
                        loadConnectedProviders(subscriber.connectedProviders);
                        
                    } else {
                        alert('שגיאה: ' + result.message);
                        logout();
                    }
                } catch (error) {
                    console.error('Error loading subscriber data:', error);
                    logout();
                }
            }
            
            function loadUpcomingEvents(registrations) {
                const container = document.getElementById('upcomingEvents');
                
                if (registrations.length === 0) {
                    container.innerHTML = '<p>אין אירועים קרובים. <a href="/events">עיין באירועים זמינים</a></p>';
                    return;
                }
                
                // Mock upcoming events display
                container.innerHTML = registrations.map(reg => \`
                    <div class="event-card">
                        <h4>אירוע מספר \${reg.eventId.slice(-6)}</h4>
                        <p>תאריך הרשמה: \${new Date(reg.registrationDate).toLocaleDateString('he-IL')}</p>
                        <p>סטטוס: \${reg.status === 'registered' ? 'רשום' : reg.status}</p>
                        <p>תשלום: \${reg.paymentStatus === 'paid' ? 'שולם' : 'ממתין לתשלום'}</p>
                    </div>
                \`).join('');
            }
            
            function loadConnectedProviders(providers) {
                const container = document.getElementById('connectedProvidersList');
                
                if (providers.length === 0) {
                    container.innerHTML = '<p>אין ספקים מחוברים. <a href="/providers">חפש ספקי שירות</a></p>';
                    return;
                }
                
                // Mock providers display
                container.innerHTML = providers.map(provider => \`
                    <div class="event-card">
                        <h4>ספק מספר \${provider.providerId.slice(-6)}</h4>
                        <p>תאריך חיבור: \${new Date(provider.connectionDate).toLocaleDateString('he-IL')}</p>
                        <p>סטטוס: \${provider.status === 'active' ? 'פעיל' : provider.status}</p>
                    </div>
                \`).join('');
            }
            
            function logout() {
                localStorage.removeItem('subscriberToken');
                window.location.href = '/subscribers/login';
            }
            
            // Load data on page load
            loadSubscriberData();
        </script>
    </body>
    </html>
    `);
});

// Get subscriber data API
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'נדרש טוקן גישה' });
        }
        
        const decoded = jwt.verify(token, 'your-secret-key');
        const subscriber = await Subscriber.findById(decoded.subscriberId);
        
        if (!subscriber) {
            return res.json({ success: false, message: 'מנוי לא נמצא' });
        }
        
        res.json({
            success: true,
            subscriber: {
                id: subscriber._id,
                fullName: subscriber.fullName,
                email: subscriber.email,
                subscription: subscriber.subscription,
                registrations: subscriber.registrations,
                connectedProviders: subscriber.connectedProviders,
                referral: subscriber.referral,
                analytics: subscriber.analytics
            }
        });
        
    } catch (error) {
        res.status(401).json({ success: false, message: 'טוקן לא חוקי' });
    }
});

// Subscription stats API
router.get('/stats', async (req, res) => {
    try {
        const stats = await Subscriber.getSubscriptionStats();
        
        res.json({
            success: true,
            stats
        });
        
    } catch (error) {
        res.json({ success: false, message: 'שגיאה בטעינת סטטיסטיקות: ' + error.message });
    }
});

module.exports = router;

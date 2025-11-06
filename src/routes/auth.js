
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ServiceProvider = require('../models/ServiceProvider');

// Registration page for service providers
router.get('/register', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>הרשמת ספק שירות - ChatGrow</title>
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
                max-width: 500px;
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
            
            .service-types {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
                margin-top: 10px;
            }
            
            .service-type {
                padding: 10px;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .service-type:hover {
                border-color: #667eea;
                background: #f7fafc;
            }
            
            .service-type.selected {
                border-color: #667eea;
                background: #667eea;
                color: white;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <h1>🚀 ChatGrow</h1>
                <p>הצטרפו לרשת ספקי השירות המובילה</p>
            </div>
            
            <form id="registerForm">
                <div class="form-group">
                    <label>שם מלא</label>
                    <input type="text" name="fullName" required>
                </div>
                
                <div class="form-group">
                    <label>שם העסק</label>
                    <input type="text" name="businessName" required>
                </div>
                
                <div class="form-group">
                    <label>אימייל</label>
                    <input type="email" name="email" required>
                </div>
                
                <div class="form-group">
                    <label>סיסמה</label>
                    <input type="password" name="password" required>
                </div>
                
                <div class="form-group">
                    <label>טלפון</label>
                    <input type="tel" name="phone" required>
                </div>
                
                <div class="form-group">
                    <label>סוג השירות</label>
                    <div class="service-types">
                        <div class="service-type" data-value="photographer">📸 צלם</div>
                        <div class="service-type" data-value="workshop">🎓 סדנאות</div>
                        <div class="service-type" data-value="beauty">💄 יופי</div>
                        <div class="service-type" data-value="dj">🎵 דיג'י</div>
                        <div class="service-type" data-value="catering">🍽️ קייטרינג</div>
                        <div class="service-type" data-value="planning">📋 תכנון אירועים</div>
                        <div class="service-type" data-value="fitness">💪 כושר</div>
                        <div class="service-type" data-value="other">🔧 אחר</div>
                    </div>
                    <input type="hidden" name="serviceType" required>
                </div>
                
                <button type="submit" class="btn">הירשם עכשיו</button>
                
                <div class="login-link">
                    <p>יש לך כבר חשבון? <a href="/auth/login">התחבר כאן</a></p>
                </div>
            </form>
        </div>

        <script>
            // Service type selection
            document.querySelectorAll('.service-type').forEach(type => {
                type.addEventListener('click', function() {
                    document.querySelectorAll('.service-type').forEach(t => t.classList.remove('selected'));
                    this.classList.add('selected');
                    document.querySelector('input[name="serviceType"]').value = this.dataset.value;
                });
            });

            // Form submission
            document.getElementById('registerForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const formData = new FormData(this);
                const data = Object.fromEntries(formData.entries());
                
                if (!data.serviceType) {
                    alert('אנא בחר סוג שירות');
                    return;
                }
                
                try {
                    const response = await fetch('/auth/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        alert('נרשמת בהצלחה! מעביר אותך לדאשבורד...');
                        window.location.href = '/provider/dashboard';
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

// Login page for service providers
router.get('/login', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>כניסת ספק שירות - ChatGrow</title>
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
                <p>כניסה לחשבון ספק שירות</p>
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
                    <p>עדיין אין לך חשבון? <a href="/auth/register">הירשם כאן</a></p>
                </div>
            </form>
        </div>

        <script>
            document.getElementById('loginForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const formData = new FormData(this);
                const data = Object.fromEntries(formData.entries());
                
                try {
                    const response = await fetch('/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        localStorage.setItem('providerToken', result.token);
                        window.location.href = '/provider/dashboard';
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

// Register service provider API
router.post('/register', async (req, res) => {
    try {
        const { fullName, businessName, email, password, phone, serviceType } = req.body;
        
        const existingProvider = await ServiceProvider.findByEmail(email);
        if (existingProvider) {
            return res.json({ success: false, message: 'ספק שירות עם אימייל זה כבר קיים' });
        }
        
        const newProvider = new ServiceProvider({
            fullName,
            businessName,
            email,
            password,
            phone,
            serviceType,
            analytics: {
                totalCustomers: 0,
                totalAppointments: 0,
                revenue: 0
            }
        });
        
        const savedProvider = await newProvider.save();
        
        const token = jwt.sign(
            { providerId: savedProvider.id, email: savedProvider.email, businessName: savedProvider.businessName }, 
            'your-secret-key', 
            { expiresIn: '24h' }
        );
        
        res.json({ 
            success: true, 
            message: 'נרשמת בהצלחה!',
            token,
            provider: savedProvider.toJSON()
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.json({ success: false, message: 'שגיאה בהרשמה: ' + error.message });
    }
});

// Login service provider API
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const provider = await ServiceProvider.findByEmail(email);
        if (!provider) {
            return res.json({ success: false, message: 'אימייל או סיסמה שגויים' });
        }
        
        const isValidPassword = await provider.comparePassword(password);
        if (!isValidPassword) {
            return res.json({ success: false, message: 'אימייל או סיסמה שגויים' });
        }
        
        const token = jwt.sign(
            { providerId: provider.id, email: provider.email, businessName: provider.businessName }, 
            'your-secret-key', 
            { expiresIn: '24h' }
        );
        
        res.json({ 
            success: true, 
            message: 'התחברת בהצלחה!',
            token,
            provider: provider.toJSON()
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.json({ success: false, message: 'שגיאה בהתחברות: ' + error.message });
    }
});

// Middleware to verify provider token
const verifyProviderToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'נדרש טוקן גישה' });
    }
    
    try {
        const decoded = jwt.verify(token, 'your-secret-key');
        req.provider = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'טוקן לא חוקי' });
    }
};

// Get provider data
router.get('/me', verifyProviderToken, async (req, res) => {
    try {
        const provider = await ServiceProvider.findByEmail(req.provider.email);
        if (!provider) {
            return res.json({ success: false, message: 'ספק שירות לא נמצא' });
        }
        
        res.json({
            success: true,
            provider: provider.toJSON()
        });
    } catch (error) {
        console.error('Get provider error:', error);
        res.status(500).json({ success: false, message: 'שגיאה בטעינת נתונים' });
    }
});

// Export providers data for other routes
router.getProviders = () => serviceProviders;
router.verifyProviderToken = verifyProviderToken;

module.exports = router;

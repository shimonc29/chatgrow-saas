
const express = require('express');
const router = express.Router();
const authRouter = require('./auth');

// Get providers data and auth middleware
const getProviders = () => authRouter.getProviders();
const verifyProviderToken = authRouter.verifyProviderToken;

// Provider dashboard
router.get('/dashboard', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>דאשבורד ספק שירות - ChatGrow</title>
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
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            
            .navbar h1 {
                font-size: 1.5rem;
            }
            
            .user-info {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .logout-btn {
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                padding: 8px 16px;
                border-radius: 8px;
                cursor: pointer;
                transition: background 0.3s;
            }
            
            .logout-btn:hover {
                background: rgba(255,255,255,0.3);
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 2rem;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .stat-card {
                background: white;
                padding: 25px;
                border-radius: 15px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.08);
                text-align: center;
            }
            
            .stat-card .icon {
                font-size: 3rem;
                margin-bottom: 10px;
            }
            
            .stat-card .number {
                font-size: 2rem;
                font-weight: bold;
                color: #4a5568;
                margin-bottom: 5px;
            }
            
            .stat-card .label {
                color: #718096;
                font-size: 0.9rem;
            }
            
            .quick-actions {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .action-btn {
                background: white;
                border: 2px solid #e2e8f0;
                padding: 20px;
                border-radius: 15px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s;
                text-decoration: none;
                color: #4a5568;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
            }
            
            .action-btn:hover {
                border-color: #667eea;
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            
            .action-btn .icon {
                font-size: 2rem;
            }
            
            .recent-activity {
                background: white;
                border-radius: 15px;
                padding: 25px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            }
            
            .recent-activity h3 {
                margin-bottom: 20px;
                color: #4a5568;
            }
            
            .activity-item {
                padding: 15px 0;
                border-bottom: 1px solid #e2e8f0;
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .activity-item:last-child {
                border-bottom: none;
            }
            
            .activity-icon {
                font-size: 1.5rem;
            }
            
            .activity-content {
                flex: 1;
            }
            
            .activity-time {
                color: #718096;
                font-size: 0.8rem;
            }
            
            .welcome-message {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 15px;
                margin-bottom: 30px;
                text-align: center;
            }
            
            .loading {
                text-align: center;
                padding: 50px;
                color: #718096;
            }
        </style>
    </head>
    <body>
        <div class="navbar">
            <h1>🚀 ChatGrow - דאשבורד ספק שירות</h1>
            <div class="user-info">
                <span id="businessName">טוען...</span>
                <button class="logout-btn" onclick="logout()">התנתק</button>
            </div>
        </div>
        
        <div class="container">
            <div class="welcome-message">
                <h2>ברוכים הבאים לדאשבורד שלכם!</h2>
                <p>כאן תוכלו לנהל את הלקוחות, התורים והאנליטיקות שלכם</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="icon">👥</div>
                    <div class="number" id="totalCustomers">0</div>
                    <div class="label">לקוחות רשומים</div>
                </div>
                
                <div class="stat-card">
                    <div class="icon">📅</div>
                    <div class="number" id="totalAppointments">0</div>
                    <div class="label">תורים חודש זה</div>
                </div>
                
                <div class="stat-card">
                    <div class="icon">💰</div>
                    <div class="number" id="revenue">₪0</div>
                    <div class="label">הכנסות חודש זה</div>
                </div>
                
                <div class="stat-card">
                    <div class="icon">⭐</div>
                    <div class="number" id="rating">5.0</div>
                    <div class="label">דירוג ממוצע</div>
                </div>
            </div>
            
            <div class="quick-actions">
                <a href="/provider/customers" class="action-btn">
                    <div class="icon">👥</div>
                    <div>ניהול לקוחות</div>
                </a>
                
                <a href="/provider/appointments" class="action-btn">
                    <div class="icon">📅</div>
                    <div>ניהול תורים</div>
                </a>
                
                <a href="/provider/analytics" class="action-btn">
                    <div class="icon">📊</div>
                    <div>אנליטיקות</div>
                </a>
                
                <a href="/provider/messages" class="action-btn">
                    <div class="icon">💬</div>
                    <div>הודעות WhatsApp</div>
                </a>
                
                <a href="/provider/settings" class="action-btn">
                    <div class="icon">⚙️</div>
                    <div>הגדרות</div>
                </a>
                
                <a href="/provider/help" class="action-btn">
                    <div class="icon">❓</div>
                    <div>עזרה ותמיכה</div>
                </a>
            </div>
            
            <div class="recent-activity">
                <h3>פעילות אחרונה</h3>
                <div id="activityList">
                    <div class="loading">טוען נתונים...</div>
                </div>
            </div>
        </div>

        <script>
            // Check authentication
            const token = localStorage.getItem('providerToken');
            if (!token) {
                window.location.href = '/auth/login';
            }
            
            // Load provider data
            async function loadProviderData() {
                try {
                    const response = await fetch('/auth/me', {
                        headers: {
                            'Authorization': 'Bearer ' + token
                        }
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        const provider = result.provider;
                        document.getElementById('businessName').textContent = provider.businessName;
                        document.getElementById('totalCustomers').textContent = provider.analytics.totalCustomers;
                        document.getElementById('totalAppointments').textContent = provider.analytics.totalAppointments;
                        document.getElementById('revenue').textContent = '₪' + provider.analytics.revenue.toLocaleString();
                        
                        // Load recent activity
                        loadRecentActivity();
                    } else {
                        throw new Error(result.message);
                    }
                } catch (error) {
                    alert('שגיאה בטעינת נתונים: ' + error.message);
                    logout();
                }
            }
            
            function loadRecentActivity() {
                const activityList = document.getElementById('activityList');
                const activities = [
                    { icon: '👤', text: 'לקוח חדש נרשם', time: 'לפני שעתיים' },
                    { icon: '📅', text: 'תור נקבע ליום רביעי', time: 'לפני 3 שעות' },
                    { icon: '💬', text: 'הודעת תזכורת נשלחה', time: 'אתמול' },
                    { icon: '⭐', text: 'קיבלתם ביקורת 5 כוכבים', time: 'לפני יומיים' }
                ];
                
                activityList.innerHTML = activities.map(activity => `
                    <div class="activity-item">
                        <div class="activity-icon">${activity.icon}</div>
                        <div class="activity-content">
                            <div>${activity.text}</div>
                            <div class="activity-time">${activity.time}</div>
                        </div>
                    </div>
                `).join('');
            }
            
            function logout() {
                localStorage.removeItem('providerToken');
                window.location.href = '/auth/login';
            }
            
            // Load data on page load
            loadProviderData();
        </script>
    </body>
    </html>
    `);
});

// Provider customers management
router.get('/customers', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ניהול לקוחות - ChatGrow</title>
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
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            
            .navbar h1 {
                font-size: 1.5rem;
            }
            
            .nav-links {
                display: flex;
                gap: 20px;
            }
            
            .nav-links a {
                color: white;
                text-decoration: none;
                padding: 8px 16px;
                border-radius: 8px;
                transition: background 0.3s;
            }
            
            .nav-links a:hover {
                background: rgba(255,255,255,0.2);
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 2rem;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
            }
            
            .add-customer-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 10px;
                font-size: 16px;
                cursor: pointer;
                transition: transform 0.3s;
            }
            
            .add-customer-btn:hover {
                transform: translateY(-2px);
            }
            
            .search-bar {
                background: white;
                padding: 20px;
                border-radius: 15px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.08);
                margin-bottom: 20px;
                display: flex;
                gap: 15px;
                align-items: center;
            }
            
            .search-bar input {
                flex: 1;
                padding: 12px;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                font-size: 16px;
            }
            
            .customers-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 20px;
            }
            
            .customer-card {
                background: white;
                padding: 20px;
                border-radius: 15px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.08);
                transition: transform 0.3s;
            }
            
            .customer-card:hover {
                transform: translateY(-5px);
            }
            
            .customer-header {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-bottom: 15px;
            }
            
            .customer-avatar {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 1.2rem;
                font-weight: bold;
            }
            
            .customer-info h3 {
                color: #4a5568;
                margin-bottom: 5px;
            }
            
            .customer-info p {
                color: #718096;
                font-size: 0.9rem;
            }
            
            .customer-details {
                margin-bottom: 15px;
            }
            
            .customer-details div {
                margin-bottom: 8px;
                color: #4a5568;
            }
            
            .customer-actions {
                display: flex;
                gap: 10px;
            }
            
            .action-btn {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                background: white;
                cursor: pointer;
                transition: background 0.3s;
                font-size: 0.9rem;
            }
            
            .action-btn:hover {
                background: #f7fafc;
            }
            
            .action-btn.primary {
                background: #667eea;
                color: white;
                border-color: #667eea;
            }
            
            .action-btn.primary:hover {
                background: #5a67d8;
            }
            
            .modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 1000;
            }
            
            .modal-content {
                background: white;
                margin: 5% auto;
                padding: 30px;
                border-radius: 15px;
                width: 90%;
                max-width: 500px;
                position: relative;
            }
            
            .close {
                position: absolute;
                left: 15px;
                top: 15px;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
                color: #999;
            }
            
            .close:hover {
                color: #333;
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
                padding: 12px;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                font-size: 16px;
            }
            
            .empty-state {
                text-align: center;
                padding: 50px;
                color: #718096;
            }
            
            .empty-state .icon {
                font-size: 4rem;
                margin-bottom: 20px;
            }
        </style>
    </head>
    <body>
        <div class="navbar">
            <h1>👥 ניהול לקוחות</h1>
            <div class="nav-links">
                <a href="/provider/dashboard">דאשבורד</a>
                <a href="/provider/appointments">תורים</a>
                <a href="/auth/login" onclick="logout()">התנתק</a>
            </div>
        </div>
        
        <div class="container">
            <div class="header">
                <h2>רשימת הלקוחות שלי</h2>
                <button class="add-customer-btn" onclick="openAddCustomerModal()">➕ הוסף לקוח חדש</button>
            </div>
            
            <div class="search-bar">
                <input type="text" placeholder="חפש לקוח..." id="searchInput" oninput="filterCustomers()">
                <button class="action-btn">🔍 חפש</button>
            </div>
            
            <div class="customers-grid" id="customersGrid">
                <div class="empty-state">
                    <div class="icon">👥</div>
                    <h3>עדיין אין לקוחות</h3>
                    <p>התחילו להוסיף לקוחות כדי לנהל אותם ולקבוע תורים</p>
                </div>
            </div>
        </div>
        
        <!-- Add Customer Modal -->
        <div id="addCustomerModal" class="modal">
            <div class="modal-content">
                <span class="close" onclick="closeAddCustomerModal()">&times;</span>
                <h3>הוסף לקוח חדש</h3>
                <form id="addCustomerForm">
                    <div class="form-group">
                        <label>שם מלא</label>
                        <input type="text" name="fullName" required>
                    </div>
                    
                    <div class="form-group">
                        <label>טלפון</label>
                        <input type="tel" name="phone" required>
                    </div>
                    
                    <div class="form-group">
                        <label>אימייל</label>
                        <input type="email" name="email">
                    </div>
                    
                    <div class="form-group">
                        <label>הערות</label>
                        <input type="text" name="notes" placeholder="העדפות, מגבלות וכו'">
                    </div>
                    
                    <button type="submit" class="add-customer-btn">הוסף לקוח</button>
                </form>
            </div>
        </div>

        <script>
            let customers = [
                {
                    id: 1,
                    fullName: 'שרה כהן',
                    phone: '050-1234567',
                    email: 'sara@email.com',
                    notes: 'אוהבת צילומים טבעיים',
                    joinDate: '2024-01-15',
                    totalAppointments: 3
                },
                {
                    id: 2,
                    fullName: 'דוד לוי',
                    phone: '052-9876543',
                    email: 'david@email.com',
                    notes: 'חתונה ביוני',
                    joinDate: '2024-02-20',
                    totalAppointments: 1
                }
            ];
            
            function renderCustomers(customersToRender = customers) {
                const grid = document.getElementById('customersGrid');
                
                if (customersToRender.length === 0) {
                    grid.innerHTML = \`
                        <div class="empty-state">
                            <div class="icon">👥</div>
                            <h3>אין לקוחות להצגה</h3>
                            <p>נסה לחפש במילים אחרות או הוסף לקוח חדש</p>
                        </div>
                    \`;
                    return;
                }
                
                grid.innerHTML = customersToRender.map(customer => \`
                    <div class="customer-card">
                        <div class="customer-header">
                            <div class="customer-avatar">\${customer.fullName.charAt(0)}</div>
                            <div class="customer-info">
                                <h3>\${customer.fullName}</h3>
                                <p>לקוח מאז \${new Date(customer.joinDate).toLocaleDateString('he-IL')}</p>
                            </div>
                        </div>
                        
                        <div class="customer-details">
                            <div>📱 \${customer.phone}</div>
                            <div>📧 \${customer.email || 'לא נמצא'}</div>
                            <div>📅 \${customer.totalAppointments} תורים</div>
                            <div>📝 \${customer.notes || 'אין הערות'}</div>
                        </div>
                        
                        <div class="customer-actions">
                            <button class="action-btn primary" onclick="bookAppointment(\${customer.id})">קבע תור</button>
                            <button class="action-btn" onclick="sendMessage(\${customer.id})">שלח הודעה</button>
                            <button class="action-btn" onclick="editCustomer(\${customer.id})">עריכה</button>
                        </div>
                    </div>
                \`).join('');
            }
            
            function openAddCustomerModal() {
                document.getElementById('addCustomerModal').style.display = 'block';
            }
            
            function closeAddCustomerModal() {
                document.getElementById('addCustomerModal').style.display = 'none';
                document.getElementById('addCustomerForm').reset();
            }
            
            function filterCustomers() {
                const searchTerm = document.getElementById('searchInput').value.toLowerCase();
                const filtered = customers.filter(customer => 
                    customer.fullName.toLowerCase().includes(searchTerm) ||
                    customer.phone.includes(searchTerm) ||
                    (customer.email && customer.email.toLowerCase().includes(searchTerm))
                );
                renderCustomers(filtered);
            }
            
            function bookAppointment(customerId) {
                alert('פונקציה לקביעת תור ללקוח ' + customerId + ' תמומש בקרוב');
            }
            
            function sendMessage(customerId) {
                alert('פונקציה לשליחת הודעה ללקוח ' + customerId + ' תמומש בקרוב');
            }
            
            function editCustomer(customerId) {
                alert('פונקציה לעריכת לקוח ' + customerId + ' תמומש בקרוב');
            }
            
            function logout() {
                localStorage.removeItem('providerToken');
                window.location.href = '/auth/login';
            }
            
            // Add customer form submission
            document.getElementById('addCustomerForm').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const formData = new FormData(this);
                const newCustomer = {
                    id: customers.length + 1,
                    fullName: formData.get('fullName'),
                    phone: formData.get('phone'),
                    email: formData.get('email'),
                    notes: formData.get('notes'),
                    joinDate: new Date().toISOString().split('T')[0],
                    totalAppointments: 0
                };
                
                customers.push(newCustomer);
                renderCustomers();
                closeAddCustomerModal();
                
                alert('לקוח נוסף בהצלחה!');
            });
            
            // Initial render
            renderCustomers();
            
            // Close modal when clicking outside
            window.onclick = function(event) {
                const modal = document.getElementById('addCustomerModal');
                if (event.target === modal) {
                    closeAddCustomerModal();
                }
            }
        </script>
    </body>
    </html>
    `);
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { logInfo, logError } = require('../utils/logger');

// Get all providers
router.get('/', async (req, res) => {
    try {
        const providers = [
            {
                id: 'whatsapp-web',
                name: 'WhatsApp Web',
                type: 'messaging',
                status: 'active',
                features: ['text', 'media', 'groups'],
                description: 'WhatsApp Web integration for messaging'
            },
            {
                id: 'telegram-bot',
                name: 'Telegram Bot',
                type: 'messaging', 
                status: 'planned',
                features: ['text', 'media', 'channels'],
                description: 'Telegram Bot API integration'
            }
        ];

        res.json({
            success: true,
            data: { providers },
            message: 'Providers retrieved successfully'
        });

        logInfo('Providers list requested', { count: providers.length });

    } catch (error) {
        logError('Failed to get providers', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve providers',
            message: error.message
        });
    }
});

// Get specific provider
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Mock provider data - in real implementation would fetch from database
        const provider = {
            id,
            name: id === 'whatsapp-web' ? 'WhatsApp Web' : 'Unknown Provider',
            type: 'messaging',
            status: id === 'whatsapp-web' ? 'active' : 'inactive',
            config: {
                maxConnections: 10,
                rateLimit: '50/minute',
                features: ['text', 'media']
            }
        };

        res.json({
            success: true,
            data: { provider },
            message: 'Provider details retrieved successfully'
        });

    } catch (error) {
        logError('Failed to get provider details', error, { providerId: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve provider details',
            message: error.message
        });
    }
});

// Update provider configuration
router.put('/:id/config', async (req, res) => {
    try {
        const { id } = req.params;
        const config = req.body;

        // In real implementation, would update database
        logInfo('Provider config updated', { providerId: id, config });

        res.json({
            success: true,
            data: { providerId: id, config },
            message: 'Provider configuration updated successfully'
        });

    } catch (error) {
        logError('Failed to update provider config', error, { providerId: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to update provider configuration',
            message: error.message
        });
    }
});

module.exports = router;

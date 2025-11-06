
const express = require('express');
const router = express.Router();

// Utility function for server-side rendering
const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL');
};

// Mock data for development
const customers = [
    {
        id: 1,
        name: 'יוסי כהן',
        email: 'yossi@email.com',
        phone: '050-1234567',
        dateJoined: '2024-01-15',
        totalAppointments: 8,
        totalSpent: 2000,
        lastVisit: '2024-08-25',
        status: 'active',
        notes: 'לקוח מצוין, תמיד בזמן',
        preferences: 'מעדיף בוקר, רגיש לרעש',
        tags: ['VIP', 'חוזר']
    },
    {
        id: 2,
        name: 'רחל לוי',
        email: 'rachel@email.com',
        phone: '052-9876543',
        dateJoined: '2024-03-20',
        totalAppointments: 12,
        totalSpent: 4800,
        lastVisit: '2024-08-28',
        status: 'active',
        notes: 'מעוניינת בעבודות מתקדמות',
        preferences: 'אחר הצהריים, מביאה חברה',
        tags: ['VIP', 'מתקדמת']
    },
    {
        id: 3,
        name: 'דוד אברהם',
        email: 'david@email.com',
        phone: '054-5555555',
        dateJoined: '2024-02-10',
        totalAppointments: 3,
        totalSpent: 1200,
        lastVisit: '2024-07-15',
        status: 'inactive',
        notes: 'חתן, צריך מעקב',
        preferences: 'בוקר מוקדם, מהיר',
        tags: ['חתן', 'פרוייקט']
    }
];

router.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="he" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ניהול לקוחות - BusinessFlow</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: #f5f7fa;
                    direction: rtl;
                    line-height: 1.6;
                }
                
                .container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 20px;
                }
                
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 15px;
                    margin-bottom: 30px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }
                
                .header h1 {
                    font-size: 2.5em;
                    margin-bottom: 10px;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
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
                
                .btn-success { background: linear-gradient(45deg, #27ae60, #2ecc71); }
                .btn-warning { background: linear-gradient(45deg, #f39c12, #e67e22); }
                .btn-danger { background: linear-gradient(45deg, #e74c3c, #c0392b); }
                .btn-info { background: linear-gradient(45deg, #3498db, #2980b9); }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                .stat-card {
                    background: white;
                    padding: 25px;
                    border-radius: 15px;
                    text-align: center;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                    transition: transform 0.3s ease;
                }
                
                .stat-card:hover {
                    transform: translateY(-5px);
                }
                
                .stat-number {
                    font-size: 2.5em;
                    font-weight: bold;
                    color: #667eea;
                    margin-bottom: 10px;
                }
                
                .customers-section {
                    background: white;
                    border-radius: 15px;
                    padding: 30px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                }
                
                .search-filters {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 10px;
                }
                
                .search-filters input,
                .search-filters select {
                    padding: 10px;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                    font-size: 1em;
                }
                
                .customers-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 25px;
                    margin-top: 20px;
                }
                
                .customer-card {
                    border: 2px solid #e9ecef;
                    border-radius: 15px;
                    padding: 25px;
                    transition: all 0.3s ease;
                    position: relative;
                    background: white;
                }
                
                .customer-card:hover {
                    border-color: #667eea;
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
                }
                
                .status-active { border-right: 5px solid #27ae60; }
                .status-inactive { border-right: 5px solid #e74c3c; }
                .status-potential { border-right: 5px solid #f39c12; }
                
                .customer-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                
                .customer-name {
                    font-size: 1.4em;
                    font-weight: bold;
                    color: #2c3e50;
                }
                
                .customer-tags {
                    display: flex;
                    gap: 5px;
                    flex-wrap: wrap;
                }
                
                .tag {
                    background: #667eea;
                    color: white;
                    padding: 3px 8px;
                    border-radius: 12px;
                    font-size: 0.8em;
                }
                
                .tag.vip { background: #f39c12; }
                .tag.returning { background: #27ae60; }
                
                .customer-info {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }
                
                .info-item {
                    display: flex;
                    flex-direction: column;
                }
                
                .info-label {
                    font-size: 0.9em;
                    color: #7f8c8d;
                    margin-bottom: 5px;
                }
                
                .info-value {
                    font-weight: bold;
                    color: #2c3e50;
                }
                
                .customer-notes {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    border-right: 3px solid #667eea;
                }
                
                .customer-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                
                .new-customer-form {
                    background: #f8f9fa;
                    border-radius: 15px;
                    padding: 25px;
                    margin-bottom: 30px;
                    border: 2px dashed #dee2e6;
                }
                
                .form-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 20px;
                }
                
                .form-group {
                    display: flex;
                    flex-direction: column;
                }
                
                .form-group label {
                    margin-bottom: 8px;
                    font-weight: bold;
                    color: #2c3e50;
                }
                
                .form-group input,
                .form-group select,
                .form-group textarea {
                    padding: 12px;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                    font-size: 1em;
                    transition: border-color 0.3s ease;
                }
                
                .form-group input:focus,
                .form-group select:focus,
                .form-group textarea:focus {
                    border-color: #667eea;
                    outline: none;
                }
                
                @media (max-width: 768px) {
                    .container { padding: 10px; }
                    .header { padding: 20px; }
                    .customers-grid { grid-template-columns: 1fr; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>👥 ניהול לקוחות</h1>
                    <p>מאגר הלקוחות המלא שלך עם כל המידע הרלוונטי</p>
                    <a href="/dashboard" class="btn">🏠 חזרה לדאשבורד</a>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${customers.length}</div>
                        <div>סה״כ לקוחות</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${customers.filter(c => c.status === 'active').length}</div>
                        <div>לקוחות פעילים</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">₪${customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}</div>
                        <div>סה״כ הכנסות</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">₪${Math.round(customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length)}</div>
                        <div>הכנסה ממוצעת</div>
                    </div>
                </div>
                
                <div class="customers-section">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2>📋 רשימת לקוחות</h2>
                        <button class="btn btn-success" onclick="toggleNewCustomerForm()">➕ לקוח חדש</button>
                    </div>
                    
                    <div class="new-customer-form" id="newCustomerForm" style="display: none;">
                        <h3>👤 הוספת לקוח חדש</h3>
                        <form onsubmit="addCustomer(event)">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>שם מלא *</label>
                                    <input type="text" name="name" required placeholder="הכנס שם מלא">
                                </div>
                                <div class="form-group">
                                    <label>טלפון *</label>
                                    <input type="tel" name="phone" required placeholder="050-1234567">
                                </div>
                                <div class="form-group">
                                    <label>אימייל</label>
                                    <input type="email" name="email" placeholder="email@example.com">
                                </div>
                                <div class="form-group">
                                    <label>סטטוס</label>
                                    <select name="status">
                                        <option value="active">פעיל</option>
                                        <option value="potential">פוטנציאלי</option>
                                        <option value="inactive">לא פעיל</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>הערות</label>
                                <textarea name="notes" rows="3" placeholder="הערות על הלקוח, העדפות, וכו׳"></textarea>
                            </div>
                            <div class="form-group">
                                <label>העדפות</label>
                                <input type="text" name="preferences" placeholder="שעות מועדפות, דרישות מיוחדות">
                            </div>
                            <div style="margin-top: 20px;">
                                <button type="submit" class="btn btn-success">💾 שמור לקוח</button>
                                <button type="button" class="btn" onclick="toggleNewCustomerForm()">❌ ביטול</button>
                            </div>
                        </form>
                    </div>
                    
                    <div class="search-filters">
                        <input type="text" id="searchCustomers" placeholder="🔍 חפש לקוח..." oninput="filterCustomers()">
                        <select id="statusFilter" onchange="filterCustomers()">
                            <option value="">כל הסטטוסים</option>
                            <option value="active">פעילים</option>
                            <option value="inactive">לא פעילים</option>
                            <option value="potential">פוטנציאליים</option>
                        </select>
                        <select id="sortBy" onchange="sortCustomers()">
                            <option value="name">מיון לפי שם</option>
                            <option value="lastVisit">מיון לפי ביקור אחרון</option>
                            <option value="totalSpent">מיון לפי סכום</option>
                            <option value="dateJoined">מיון לפי תאריך הצטרפות</option>
                        </select>
                    </div>
                    
                    <div class="customers-grid" id="customersGrid">
                        ${customers.map(customer => `
                            <div class="customer-card status-${customer.status}" data-customer='${JSON.stringify(customer)}'>
                                <div class="customer-header">
                                    <div class="customer-name">${customer.name}</div>
                                    <div class="customer-tags">
                                        ${customer.tags.map(tag => `<span class="tag ${tag.toLowerCase()}">${tag}</span>`).join('')}
                                    </div>
                                </div>
                                
                                <div class="customer-info">
                                    <div class="info-item">
                                        <div class="info-label">📱 טלפון</div>
                                        <div class="info-value">${customer.phone}</div>
                                    </div>
                                    <div class="info-item">
                                        <div class="info-label">📧 אימייל</div>
                                        <div class="info-value">${customer.email}</div>
                                    </div>
                                    <div class="info-item">
                                        <div class="info-label">📅 הצטרף</div>
                                        <div class="info-value">${formatDate(customer.dateJoined)}</div>
                                    </div>
                                    <div class="info-item">
                                        <div class="info-label">🗓️ ביקור אחרון</div>
                                        <div class="info-value">${formatDate(customer.lastVisit)}</div>
                                    </div>
                                    <div class="info-item">
                                        <div class="info-label">🎯 תורים</div>
                                        <div class="info-value">${customer.totalAppointments}</div>
                                    </div>
                                    <div class="info-item">
                                        <div class="info-label">💰 סה״כ הוצאה</div>
                                        <div class="info-value">₪${customer.totalSpent}</div>
                                    </div>
                                </div>
                                
                                ${customer.notes ? `
                                <div class="customer-notes">
                                    <strong>📝 הערות:</strong> ${customer.notes}
                                </div>
                                ` : ''}
                                
                                ${customer.preferences ? `
                                <div class="customer-notes" style="border-right-color: #27ae60;">
                                    <strong>⚙️ העדפות:</strong> ${customer.preferences}
                                </div>
                                ` : ''}
                                
                                <div class="customer-actions">
                                    <button class="btn" onclick="viewCustomerHistory(${customer.id})">📋 היסטוריה</button>
                                    <button class="btn btn-info" onclick="editCustomer(${customer.id})">✏️ עריכה</button>
                                    <button class="btn btn-success" onclick="newAppointment(${customer.id})">📅 תור חדש</button>
                                    <button class="btn btn-warning" onclick="sendMessage(${customer.id})">📱 הודעה</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <script>
                function formatDate(dateStr) {
                    const date = new Date(dateStr);
                    return date.toLocaleDateString('he-IL');
                }
                
                function toggleNewCustomerForm() {
                    const form = document.getElementById('newCustomerForm');
                    form.style.display = form.style.display === 'none' ? 'block' : 'none';
                }
                
                function addCustomer(event) {
                    event.preventDefault();
                    alert('בהמתנה לחיבור בסיס נתונים - הלקוח ייקלט בהצלחה!');
                    toggleNewCustomerForm();
                    event.target.reset();
                }
                
                function filterCustomers() {
                    const search = document.getElementById('searchCustomers').value.toLowerCase();
                    const statusFilter = document.getElementById('statusFilter').value;
                    const cards = document.querySelectorAll('.customer-card');
                    
                    cards.forEach(card => {
                        const customer = JSON.parse(card.dataset.customer);
                        const matchesSearch = customer.name.toLowerCase().includes(search) || 
                                             customer.phone.includes(search) || 
                                             customer.email.toLowerCase().includes(search);
                        const matchesStatus = !statusFilter || customer.status === statusFilter;
                        
                        card.style.display = matchesSearch && matchesStatus ? 'block' : 'none';
                    });
                }
                
                function sortCustomers() {
                    const sortBy = document.getElementById('sortBy').value;
                    const grid = document.getElementById('customersGrid');
                    const cards = Array.from(grid.querySelectorAll('.customer-card'));
                    
                    cards.sort((a, b) => {
                        const customerA = JSON.parse(a.dataset.customer);
                        const customerB = JSON.parse(b.dataset.customer);
                        
                        switch(sortBy) {
                            case 'name':
                                return customerA.name.localeCompare(customerB.name);
                            case 'lastVisit':
                                return new Date(customerB.lastVisit) - new Date(customerA.lastVisit);
                            case 'totalSpent':
                                return customerB.totalSpent - customerA.totalSpent;
                            case 'dateJoined':
                                return new Date(customerB.dateJoined) - new Date(customerA.dateJoined);
                            default:
                                return 0;
                        }
                    });
                    
                    cards.forEach(card => grid.appendChild(card));
                }
                
                function viewCustomerHistory(customerId) {
                    alert('היסטוריית לקוח #' + customerId + ' - בהמתנה לפיתוח');
                }
                
                function editCustomer(customerId) {
                    alert('עריכת לקוח #' + customerId + ' - בהמתנה לפיתוח');
                }
                
                function newAppointment(customerId) {
                    if (confirm('לפתוח טופס תור חדש עבור הלקוח?')) {
                        window.open('/api/appointments', '_blank');
                    }
                }
                
                function sendMessage(customerId) {
                    alert('שליחת הודעה ללקוח #' + customerId + ' - בהמתנה לפיתוח');
                }
            </script>
        </body>
        </html>
    `);
});

module.exports = router;

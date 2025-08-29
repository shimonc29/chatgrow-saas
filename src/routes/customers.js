
const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Appointment = require('../models/Appointment');
const authMiddleware = require('../middleware/auth');
const { logApiRequest } = require('../utils/logger');

// Get customers dashboard
router.get('/', authMiddleware, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { search, status, type } = req.query;
        
        // Build query filters
        let filters = { businessId: req.user.id };
        if (status) filters.status = status;
        if (type) filters.customerType = type;
        
        let customers;
        if (search) {
            customers = await Customer.searchCustomers(req.user.id, search);
        } else {
            customers = await Customer.find(filters)
                .sort({ 'visitHistory.lastVisit': -1 })
                .limit(100);
        }
        
        const customerStats = await Customer.getCustomerStats(req.user.id);
        const vipCustomers = await Customer.getVIPCustomers(req.user.id);
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime);
        
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
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #f8f9fa;
            direction: rtl;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .stats-bar {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        
        .search-controls {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .search-row {
            display: flex;
            gap: 15px;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .search-input {
            flex: 1;
            min-width: 300px;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
        }
        
        .btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            text-decoration: none;
            font-size: 14px;
        }
        
        .btn:hover {
            background: #5a6fd8;
        }
        
        .btn-success { background: #27ae60; }
        .btn-warning { background: #f39c12; }
        .btn-danger { background: #e74c3c; }
        
        .customers-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
        }
        
        .customer-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border-right: 5px solid #667eea;
            transition: transform 0.2s;
        }
        
        .customer-card:hover {
            transform: translateY(-2px);
        }
        
        .customer-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .customer-name {
            font-size: 1.3em;
            font-weight: bold;
            color: #333;
        }
        
        .customer-type {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .type-regular { background: #3498db; color: white; }
        .type-vip { background: #e74c3c; color: white; }
        .type-corporate { background: #9b59b6; color: white; }
        .type-student { background: #27ae60; color: white; }
        
        .customer-contact {
            margin-bottom: 15px;
            color: #666;
        }
        
        .customer-contact div {
            margin-bottom: 5px;
        }
        
        .customer-stats {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 15px;
        }
        
        .stats-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            font-size: 0.9em;
        }
        
        .customer-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        .btn-small {
            padding: 6px 12px;
            font-size: 12px;
        }
        
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }
        
        .empty-state h3 {
            margin-bottom: 15px;
            color: #333;
        }
        
        .vip-indicator {
            display: inline-block;
            margin-right: 5px;
            font-size: 0.8em;
        }
        
        .status-badge {
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
        }
        
        .status-active { background: #27ae60; color: white; }
        .status-inactive { background: #95a5a6; color: white; }
        .status-blocked { background: #e74c3c; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>👥 ניהול לקוחות</h1>
            <p>מאגר הלקוחות המלא שלך עם כל המידע הרלוונטי</p>
        </div>
        
        <div class="stats-bar">
            <div class="stat-card">
                <div class="stat-number">${customers.length}</div>
                <div>סך הלקוחות</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${customers.filter(c => c.status === 'active').length}</div>
                <div>לקוחות פעילים</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${vipCustomers.length}</div>
                <div>לקוחות VIP</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">₪${customers.reduce((sum, c) => sum + c.financialInfo.totalSpent, 0).toLocaleString()}</div>
                <div>סך הכנסות</div>
            </div>
        </div>
        
        <div class="search-controls">
            <div class="search-row">
                <input 
                    type="text" 
                    class="search-input" 
                    placeholder="חפש לקוח (שם, טלפון, אימייל...)"
                    value="${search || ''}"
                    id="searchInput"
                />
                <select id="statusFilter">
                    <option value="">כל הסטטוסים</option>
                    <option value="active" ${status === 'active' ? 'selected' : ''}>פעיל</option>
                    <option value="inactive" ${status === 'inactive' ? 'selected' : ''}>לא פעיל</option>
                    <option value="vip" ${status === 'vip' ? 'selected' : ''}>VIP</option>
                </select>
                <button class="btn" onclick="searchCustomers()">🔍 חפש</button>
                <button class="btn btn-success" onclick="alert('בהמתנה לפיתוח')">➕ לקוח חדש</button>
            </div>
        </div>
        
        ${customers.length > 0 ? `
        <div class="customers-grid">
            ${customers.map(customer => `
                <div class="customer-card">
                    <div class="customer-header">
                        <div class="customer-name">
                            ${customer.isLoyal ? '<span class="vip-indicator">⭐</span>' : ''}
                            ${customer.fullName}
                        </div>
                        <div>
                            <span class="customer-type type-${customer.customerType}">${getCustomerTypeText(customer.customerType)}</span>
                            <span class="status-badge status-${customer.status}">${getStatusText(customer.status)}</span>
                        </div>
                    </div>
                    
                    <div class="customer-contact">
                        <div>📱 ${customer.phone}</div>
                        ${customer.email ? `<div>📧 ${customer.email}</div>` : ''}
                        ${customer.preferredContactMethod ? `<div>💬 העדפת קשר: ${getContactMethodText(customer.preferredContactMethod)}</div>` : ''}
                    </div>
                    
                    <div class="customer-stats">
                        <div class="stats-row">
                            <div><strong>סך ביקורים:</strong> ${customer.visitHistory.totalVisits}</div>
                            <div><strong>סך הוציא:</strong> ₪${customer.financialInfo.totalSpent}</div>
                            <div><strong>ביקור אחרון:</strong> ${customer.visitHistory.lastVisit ? new Date(customer.visitHistory.lastVisit).toLocaleDateString('he-IL') : 'אף פעם'}</div>
                            <div><strong>רמת סיכון:</strong> ${getRiskLevelText(customer.riskLevel)}</div>
                        </div>
                    </div>
                    
                    <div class="customer-actions">
                        <button class="btn btn-success btn-small" onclick="bookAppointment('${customer._id}')">📅 קבע תור</button>
                        <button class="btn btn-small" onclick="viewHistory('${customer._id}')">📋 היסטוריה</button>
                        <button class="btn btn-warning btn-small" onclick="sendMessage('${customer._id}')">💬 שלח הודעה</button>
                        <button class="btn btn-small" onclick="editCustomer('${customer._id}')">✏️ ערוך</button>
                    </div>
                </div>
            `).join('')}
        </div>
        ` : `
        <div class="empty-state">
            <h3>אין לקוחות להצגה</h3>
            <p>לא נמצאו לקוחות בהתאם לחיפוש שביצעת</p>
            <button class="btn btn-success" onclick="alert('בהמתנה לפיתוח')" style="margin-top: 20px;">➕ הוסף לקוח חדש</button>
        </div>
        `}
    </div>
    
    <script>
        function getCustomerTypeText(type) {
            const typeMap = {
                'regular': 'רגיל',
                'vip': 'VIP',
                'corporate': 'תאגיד',
                'student': 'סטודנט'
            };
            return typeMap[type] || type;
        }
        
        function getStatusText(status) {
            const statusMap = {
                'active': 'פעיל',
                'inactive': 'לא פעיל',
                'blocked': 'חסום',
                'vip': 'VIP'
            };
            return statusMap[status] || status;
        }
        
        function getContactMethodText(method) {
            const methodMap = {
                'phone': 'טלפון',
                'whatsapp': 'WhatsApp',
                'email': 'אימייל',
                'sms': 'SMS'
            };
            return methodMap[method] || method;
        }
        
        function getRiskLevelText(level) {
            const levelMap = {
                'low': '🟢 נמוך',
                'medium': '🟡 בינוני', 
                'high': '🔴 גבוה'
            };
            return levelMap[level] || level;
        }
        
        function searchCustomers() {
            const search = document.getElementById('searchInput').value;
            const status = document.getElementById('statusFilter').value;
            
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (status) params.append('status', status);
            
            window.location.href = '/api/customers?' + params.toString();
        }
        
        // Handle Enter key in search input
        document.getElementById('searchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchCustomers();
            }
        });
        
        function bookAppointment(customerId) {
            alert('בהמתנה לפיתוח - קביעת תור ללקוח: ' + customerId);
        }
        
        function viewHistory(customerId) {
            alert('בהמתנה לפיתוח - צפייה בהיסטוריית לקוח: ' + customerId);
        }
        
        function sendMessage(customerId) {
            alert('בהמתנה לפיתוח - שליחת הודעה ללקוח: ' + customerId);
        }
        
        function editCustomer(customerId) {
            alert('בהמתנה לפיתוח - עריכת לקוח: ' + customerId);
        }
    </script>
</body>
</html>
        `);
        
    } catch (error) {
        console.error('Customers dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בטעינת הלקוחות',
            error: error.message
        });
    }
});

module.exports = router;

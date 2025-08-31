
const express = require('express');
const router = express.Router();

// Utility functions for server-side rendering
const getPaymentMethod = (method) => {
    const methods = {
        'cash': 'מזומן',
        'credit_card': 'כרטיס אשראי',
        'bank_transfer': 'העברה בנקאית',
        'bit': 'ביט',
        'paypal': 'PayPal'
    };
    return methods[method] || method;
};

const getPaymentStatus = (status) => {
    const statuses = {
        'paid': 'שולם',
        'pending': 'ממתין',
        'overdue': 'באיחור'
    };
    return statuses[status] || status;
};

// Mock payments data
const payments = [
    {
        id: 1,
        customerName: 'יוסי כהן',
        amount: 250,
        service: 'קרמיקה למתחילים',
        date: '2024-08-29',
        status: 'paid',
        method: 'credit_card',
        appointmentId: 1
    },
    {
        id: 2,
        customerName: 'רחל לוי',
        amount: 400,
        service: 'סדנת קדרות',
        date: '2024-08-25',
        status: 'pending',
        method: 'bank_transfer',
        appointmentId: 2
    },
    {
        id: 3,
        customerName: 'דוד אברהם',
        amount: 800,
        service: 'צילומי זוג',
        date: '2024-08-20',
        status: 'overdue',
        method: 'cash',
        appointmentId: 3
    }
];

router.get('/', (req, res) => {
    const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
    const overdueAmount = payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);
    
    res.send(`
        <!DOCTYPE html>
        <html lang="he" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ניהול תשלומים - BusinessFlow</title>
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
                    font-size: 2.2em;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                
                .stat-number.positive { color: #27ae60; }
                .stat-number.warning { color: #f39c12; }
                .stat-number.danger { color: #e74c3c; }
                
                .payments-section {
                    background: white;
                    border-radius: 15px;
                    padding: 30px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                }
                
                .payments-grid {
                    display: grid;
                    gap: 20px;
                    margin-top: 20px;
                }
                
                .payment-card {
                    border: 2px solid #e9ecef;
                    border-radius: 15px;
                    padding: 25px;
                    transition: all 0.3s ease;
                    position: relative;
                }
                
                .payment-card:hover {
                    border-color: #667eea;
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
                }
                
                .status-paid { border-right: 5px solid #27ae60; }
                .status-pending { border-right: 5px solid #f39c12; }
                .status-overdue { border-right: 5px solid #e74c3c; }
                
                .payment-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }
                
                .customer-name {
                    font-size: 1.3em;
                    font-weight: bold;
                    color: #2c3e50;
                }
                
                .payment-amount {
                    font-size: 1.5em;
                    font-weight: bold;
                    color: #667eea;
                }
                
                .payment-details {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }
                
                .detail-item {
                    display: flex;
                    flex-direction: column;
                }
                
                .detail-label {
                    font-size: 0.9em;
                    color: #7f8c8d;
                    margin-bottom: 5px;
                }
                
                .detail-value {
                    font-weight: bold;
                    color: #2c3e50;
                }
                
                .status-badge {
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-size: 0.9em;
                    font-weight: bold;
                    color: white;
                }
                
                .status-paid .status-badge { background: #27ae60; }
                .status-pending .status-badge { background: #f39c12; }
                .status-overdue .status-badge { background: #e74c3c; }
                
                .payment-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    margin-top: 15px;
                }
                
                .invoice-section {
                    background: #f8f9fa;
                    border-radius: 15px;
                    padding: 25px;
                    margin-top: 30px;
                    border: 2px dashed #dee2e6;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>💰 ניהול תשלומים</h1>
                    <p>מעקב אחר כל התשלומים והחשבוניות שלך</p>
                    <a href="/dashboard" class="btn">🏠 חזרה לדאשבורד</a>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number positive">₪${totalRevenue.toLocaleString()}</div>
                        <div>הכנסות שהתקבלו</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number warning">₪${pendingAmount.toLocaleString()}</div>
                        <div>תשלומים ממתינים</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number danger">₪${overdueAmount.toLocaleString()}</div>
                        <div>חובות באיחור</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">₪${(totalRevenue + pendingAmount + overdueAmount).toLocaleString()}</div>
                        <div>סה״כ מחזור</div>
                    </div>
                </div>
                
                <div class="payments-section">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2>📋 רשימת תשלומים</h2>
                        <div>
                            <button class="btn btn-success" onclick="generateInvoice()">📄 חשבונית חדשה</button>
                            <button class="btn" onclick="exportPayments()">📊 ייצא נתונים</button>
                        </div>
                    </div>
                    
                    <div class="payments-grid">
                        ${payments.map(payment => `
                            <div class="payment-card status-${payment.status}">
                                <div class="payment-header">
                                    <div class="customer-name">${payment.customerName}</div>
                                    <div class="payment-amount">₪${payment.amount}</div>
                                </div>
                                
                                <div class="payment-details">
                                    <div class="detail-item">
                                        <div class="detail-label">🎯 שירות</div>
                                        <div class="detail-value">${payment.service}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">📅 תאריך</div>
                                        <div class="detail-value">${new Date(payment.date).toLocaleDateString('he-IL')}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">💳 אמצעי תשלום</div>
                                        <div class="detail-value">${getPaymentMethod(payment.method)}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">📊 סטטוס</div>
                                        <div class="status-badge">${getPaymentStatus(payment.status)}</div>
                                    </div>
                                </div>
                                
                                <div class="payment-actions">
                                    ${payment.status === 'pending' ? `
                                        <button class="btn btn-success" onclick="markAsPaid(${payment.id})">✅ סמן כשולם</button>
                                        <button class="btn btn-warning" onclick="sendReminder(${payment.id})">📱 תזכורת</button>
                                    ` : ''}
                                    ${payment.status === 'overdue' ? `
                                        <button class="btn btn-success" onclick="markAsPaid(${payment.id})">✅ סמן כשולם</button>
                                        <button class="btn btn-danger" onclick="sendUrgentReminder(${payment.id})">🚨 תזכורת דחופה</button>
                                    ` : ''}
                                    <button class="btn" onclick="generateInvoice(${payment.id})">📄 חשבונית</button>
                                    <button class="btn" onclick="viewDetails(${payment.id})">👁️ פרטים</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="invoice-section">
                    <h3>📄 יצירת חשבונית מהירה</h3>
                    <form onsubmit="createQuickInvoice(event)">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0;">
                            <input type="text" name="customerName" placeholder="שם הלקוח" required>
                            <input type="number" name="amount" placeholder="סכום" required>
                            <input type="text" name="service" placeholder="תיאור השירות" required>
                            <select name="paymentMethod" required>
                                <option value="">בחר אמצעי תשלום</option>
                                <option value="cash">מזומן</option>
                                <option value="credit_card">כרטיס אשראי</option>
                                <option value="bank_transfer">העברה בנקאית</option>
                                <option value="bit">ביט</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-success">📄 צור חשבונית</button>
                    </form>
                </div>
            </div>
            
            <script>
                function formatDate(dateStr) {
                    const date = new Date(dateStr);
                    return date.toLocaleDateString('he-IL');
                }
                
                function getPaymentMethod(method) {
                    const methods = {
                        'cash': 'מזומן',
                        'credit_card': 'כרטיס אשראי',
                        'bank_transfer': 'העברה בנקאית',
                        'bit': 'ביט',
                        'paypal': 'PayPal'
                    };
                    return methods[method] || method;
                }
                
                function getPaymentStatus(status) {
                    const statuses = {
                        'paid': 'שולם',
                        'pending': 'ממתין',
                        'overdue': 'באיחור'
                    };
                    return statuses[status] || status;
                }
                
                function markAsPaid(paymentId) {
                    if (confirm('לסמן תשלום כשולם?')) {
                        alert('התשלום סומן כשולם בהצלחה!');
                        location.reload();
                    }
                }
                
                function sendReminder(paymentId) {
                    alert('תזכורת נשלחה ללקוח בהצלחה!');
                }
                
                function sendUrgentReminder(paymentId) {
                    alert('תזכורת דחופה נשלחה ללקוח!');
                }
                
                function generateInvoice(paymentId) {
                    alert('חשבונית נוצרה ונשלחה ללקוח!');
                }
                
                function viewDetails(paymentId) {
                    alert('פרטי תשלום #' + paymentId + ' - בפיתוח');
                }
                
                function exportPayments() {
                    alert('נתוני התשלומים יוצאו לקובץ Excel!');
                }
                
                function createQuickInvoice(event) {
                    event.preventDefault();
                    alert('חשבונית נוצרה בהצלחה!');
                    event.target.reset();
                }
            </script>
        </body>
        </html>
    `);
});

module.exports = router;

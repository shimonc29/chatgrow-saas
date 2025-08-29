
const express = require('express');
const router = express.Router();

// Mock data for development
const appointments = [
    {
        id: 1,
        customerName: 'יוסי כהן',
        customerPhone: '050-1234567',
        service: 'קרמיקה למתחילים',
        date: '2024-08-30',
        time: '14:00',
        duration: 120,
        price: 250,
        status: 'confirmed',
        notes: 'לקוח חדש, רגיש לרעש'
    },
    {
        id: 2,
        customerName: 'רחל לוי',
        customerPhone: '052-9876543',
        service: 'סדנת קדרות',
        date: '2024-08-31',
        time: '16:30',
        duration: 180,
        price: 400,
        status: 'pending',
        notes: 'לקוח חוזר, מעוניינת בעבודות מתקדמות'
    },
    {
        id: 3,
        customerName: 'דוד אברהם',
        customerPhone: '054-5555555',
        service: 'צילומי זוג',
        date: '2024-09-01',
        time: '10:00',
        duration: 240,
        price: 800,
        status: 'completed',
        notes: 'חתונה בספטמבר, צריך גם אלבום'
    }
];

router.get('/', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    
    res.send(`
        <!DOCTYPE html>
        <html lang="he" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ניהול תורים - BusinessFlow</title>
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
                    font-size: 2.5em;
                    font-weight: bold;
                    color: #667eea;
                    margin-bottom: 10px;
                }
                
                .appointments-section {
                    background: white;
                    border-radius: 15px;
                    padding: 30px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                    margin-bottom: 30px;
                }
                
                .appointments-grid {
                    display: grid;
                    gap: 20px;
                    margin-top: 20px;
                }
                
                .appointment-card {
                    border: 2px solid #e9ecef;
                    border-radius: 15px;
                    padding: 25px;
                    transition: all 0.3s ease;
                    position: relative;
                }
                
                .appointment-card:hover {
                    border-color: #667eea;
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
                }
                
                .status-confirmed { border-right: 5px solid #27ae60; }
                .status-pending { border-right: 5px solid #f39c12; }
                .status-completed { border-right: 5px solid #95a5a6; }
                .status-cancelled { border-right: 5px solid #e74c3c; }
                
                .appointment-header {
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
                
                .status-badge {
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-size: 0.9em;
                    font-weight: bold;
                    color: white;
                }
                
                .status-confirmed .status-badge { background: #27ae60; }
                .status-pending .status-badge { background: #f39c12; }
                .status-completed .status-badge { background: #95a5a6; }
                .status-cancelled .status-badge { background: #e74c3c; }
                
                .appointment-details {
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
                
                .appointment-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                
                .new-appointment-form {
                    background: #f8f9fa;
                    border-radius: 15px;
                    padding: 25px;
                    margin-top: 20px;
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
                    .header h1 { font-size: 1.8em; }
                    .appointments-section { padding: 20px; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📅 ניהול תורים</h1>
                    <p>ניהול וארגון כל התורים שלך במקום אחד</p>
                    <a href="/dashboard" class="btn">🏠 חזרה לדאשבורד</a>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">3</div>
                        <div>תורים השבוע</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">1</div>
                        <div>תורים היום</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">₪1,450</div>
                        <div>הכנסות השבוע</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">95%</div>
                        <div>אחוז הגעה</div>
                    </div>
                </div>
                
                <div class="appointments-section">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2>📋 תורים קרובים</h2>
                        <button class="btn btn-success" onclick="toggleNewAppointmentForm()">➕ תור חדש</button>
                    </div>
                    
                    <div class="new-appointment-form" id="newAppointmentForm" style="display: none;">
                        <h3>📝 קביעת תור חדש</h3>
                        <form onsubmit="addAppointment(event)">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>שם הלקוח *</label>
                                    <input type="text" name="customerName" required placeholder="הכנס שם מלא">
                                </div>
                                <div class="form-group">
                                    <label>טלפון *</label>
                                    <input type="tel" name="customerPhone" required placeholder="050-1234567">
                                </div>
                                <div class="form-group">
                                    <label>סוג השירות *</label>
                                    <select name="service" required>
                                        <option value="">בחר שירות</option>
                                        <option value="קרמיקה למתחילים">קרמיקה למתחילים</option>
                                        <option value="סדנת קדרות">סדנת קדרות</option>
                                        <option value="צילומי זוג">צילומי זוג</option>
                                        <option value="צילומי משפחה">צילומי משפחה</option>
                                        <option value="אירוע פרטי">אירוע פרטי</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>תאריך *</label>
                                    <input type="date" name="date" required min="${today}">
                                </div>
                                <div class="form-group">
                                    <label>שעה *</label>
                                    <input type="time" name="time" required>
                                </div>
                                <div class="form-group">
                                    <label>מחיר (₪)</label>
                                    <input type="number" name="price" min="0" step="10" placeholder="250">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>הערות</label>
                                <textarea name="notes" rows="3" placeholder="הערות נוספות על הלקוח או הפגישה"></textarea>
                            </div>
                            <div style="margin-top: 20px;">
                                <button type="submit" class="btn btn-success">💾 שמור תור</button>
                                <button type="button" class="btn" onclick="toggleNewAppointmentForm()">❌ ביטול</button>
                            </div>
                        </form>
                    </div>
                    
                    <div class="appointments-grid">
                        ${appointments.map(appointment => `
                            <div class="appointment-card status-${appointment.status}">
                                <div class="appointment-header">
                                    <div class="customer-name">${appointment.customerName}</div>
                                    <div class="status-badge">${getStatusText(appointment.status)}</div>
                                </div>
                                
                                <div class="appointment-details">
                                    <div class="detail-item">
                                        <div class="detail-label">📱 טלפון</div>
                                        <div class="detail-value">${appointment.customerPhone}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">🎯 שירות</div>
                                        <div class="detail-value">${appointment.service}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">📅 תאריך</div>
                                        <div class="detail-value">${formatDate(appointment.date)}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">⏰ שעה</div>
                                        <div class="detail-value">${appointment.time}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">⏱️ משך</div>
                                        <div class="detail-value">${appointment.duration} דקות</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">💰 מחיר</div>
                                        <div class="detail-value">₪${appointment.price}</div>
                                    </div>
                                </div>
                                
                                ${appointment.notes ? `
                                <div style="margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 8px; border-right: 3px solid #667eea;">
                                    <strong>📝 הערות:</strong> ${appointment.notes}
                                </div>
                                ` : ''}
                                
                                <div class="appointment-actions">
                                    <button class="btn" onclick="editAppointment(${appointment.id})">✏️ עריכה</button>
                                    <button class="btn btn-success" onclick="confirmAppointment(${appointment.id})">✅ אישור</button>
                                    <button class="btn btn-warning" onclick="sendReminder(${appointment.id})">📱 תזכורת</button>
                                    <button class="btn btn-danger" onclick="cancelAppointment(${appointment.id})">❌ ביטול</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <script>
                function getStatusText(status) {
                    const statusMap = {
                        'confirmed': 'מאושר',
                        'pending': 'ממתין',
                        'completed': 'הושלם',
                        'cancelled': 'בוטל'
                    };
                    return statusMap[status] || status;
                }
                
                function formatDate(dateStr) {
                    const date = new Date(dateStr);
                    return date.toLocaleDateString('he-IL');
                }
                
                function toggleNewAppointmentForm() {
                    const form = document.getElementById('newAppointmentForm');
                    form.style.display = form.style.display === 'none' ? 'block' : 'none';
                }
                
                function addAppointment(event) {
                    event.preventDefault();
                    alert('בהמתנה לחיבור בסיס נתונים - התור ייקלט בהצלחה!');
                    toggleNewAppointmentForm();
                    event.target.reset();
                }
                
                function editAppointment(id) {
                    alert('עריכת תור #' + id + ' - בהמתנה לפיתוח');
                }
                
                function confirmAppointment(id) {
                    if (confirm('לאשר את התור?')) {
                        alert('התור אושר בהצלחה! תזכורת נשלחה ללקוח.');
                    }
                }
                
                function sendReminder(id) {
                    alert('תזכורת נשלחה ללקוח בהצלחה!');
                }
                
                function cancelAppointment(id) {
                    if (confirm('האם אתה בטוח שברצונך לבטל את התור?')) {
                        alert('התור בוטל. הודעה נשלחה ללקוח.');
                    }
                }
            </script>
        </body>
        </html>
    `);
});

module.exports = router;

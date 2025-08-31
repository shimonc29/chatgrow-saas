const express = require('express');
const router = express.Router();

// Utility functions for server-side rendering
const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL');
};

const formatTime = (timeStr) => {
    return timeStr.slice(0, 5); // Return HH:MM format
};

const getStatusText = (status) => {
    const statuses = {
        'confirmed': 'אושר',
        'pending': 'ממתין',
        'cancelled': 'בוטל',
        'completed': 'הושלם',
        'no_show': 'לא הגיע'
    };
    return statuses[status] || status;
};

// Mock appointments data with more comprehensive information
const appointments = [
    {
        id: 1,
        customerName: 'יוסי כהן',
        customerId: 1,
        phone: '050-1234567',
        service: 'קרמיקה למתחילים',
        date: '2024-09-02',
        time: '10:00',
        duration: 120,
        price: 250,
        status: 'confirmed',
        notes: 'לקוח חדש, צריך הסבר מפורט',
        reminderSent: false,
        createdAt: '2024-08-25',
        updatedAt: '2024-08-25'
    },
    {
        id: 2,
        customerName: 'רחל לוי',
        customerId: 2,
        phone: '052-9876543',
        service: 'סדנת קדרות מתקדמת',
        date: '2024-09-03',
        time: '14:00',
        duration: 180,
        price: 400,
        status: 'pending',
        notes: 'מביאה חברה, צריך שני מקומות עבודה',
        reminderSent: false,
        createdAt: '2024-08-26',
        updatedAt: '2024-08-26'
    },
    {
        id: 3,
        customerName: 'דוד אברהם',
        customerId: 3,
        phone: '054-5555555',
        service: 'צילומי זוג',
        date: '2024-09-01',
        time: '16:30',
        duration: 90,
        price: 800,
        status: 'confirmed',
        notes: 'חתן, צילומים לחתונה',
        reminderSent: true,
        createdAt: '2024-08-20',
        updatedAt: '2024-08-29'
    },
    {
        id: 4,
        customerName: 'מיכל דהן',
        customerId: 4,
        phone: '053-1111111',
        service: 'איפור לאירוע',
        date: '2024-08-30',
        time: '09:00',
        duration: 60,
        price: 300,
        status: 'completed',
        notes: 'לקוחה VIP',
        reminderSent: true,
        createdAt: '2024-08-15',
        updatedAt: '2024-08-30'
    }
];

// Available services for the dropdown
const services = [
    { name: 'קרמיקה למתחילים', duration: 120, price: 250 },
    { name: 'סדנת קדרות', duration: 180, price: 400 },
    { name: 'צילומי זוג', duration: 90, price: 800 },
    { name: 'איפור לאירוע', duration: 60, price: 300 },
    { name: 'עיצוב שיער', duration: 45, price: 200 },
    { name: 'טיפול פנים', duration: 75, price: 350 }
];

// Add new appointment form route
router.post('/add', (req, res) => {
    try {
        const { customerName, phone, service, date, time, notes } = req.body;

        // In a real app, this would save to database
        const newAppointment = {
            id: Date.now().toString(),
            customerName,
            phone,
            service,
            date,
            time,
            notes,
            status: 'pending',
            createdAt: new Date()
        };

        res.json({ success: true, message: 'תור נוסף בהצלחה!', appointment: newAppointment });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update appointment status
router.post('/update-status', (req, res) => {
    try {
        const { appointmentId, status } = req.body;

        // In a real app, this would update the database
        res.json({ success: true, message: `סטטוס התור עודכן ל${getStatusText(status)}` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/', (req, res) => {
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

                .btn-success { background: linear-gradient(45deg, #28a745, #20c997); }
                .btn-danger { background: linear-gradient(45deg, #dc3545, #e91e63); }
                .btn-warning { background: linear-gradient(45deg, #ffc107, #ff9800); }

                .main-content {
                    display: grid;
                    grid-template-columns: 1fr 350px;
                    gap: 30px;
                }

                .appointments-section {
                    background: white;
                    border-radius: 15px;
                    padding: 30px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                }

                .sidebar {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .add-appointment-form {
                    background: white;
                    border-radius: 15px;
                    padding: 25px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: bold;
                    color: #2c3e50;
                }

                .form-group input,
                .form-group select,
                .form-group textarea {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                    font-size: 1em;
                    transition: border-color 0.3s ease;
                }

                .form-group input:focus,
                .form-group select:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: #667eea;
                }

                .appointment-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border: 1px solid #e9ecef;
                    border-radius: 10px;
                    margin-bottom: 15px;
                    transition: all 0.3s ease;
                }

                .appointment-item:hover {
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                    transform: translateY(-2px);
                }

                .appointment-info {
                    flex: 1;
                }

                .appointment-time {
                    font-weight: bold;
                    color: #667eea;
                    font-size: 1.1em;
                }

                .appointment-client {
                    font-size: 1.2em;
                    margin: 5px 0;
                }

                .appointment-service {
                    color: #6c757d;
                }

                .appointment-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .status-badge {
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-size: 0.85em;
                    font-weight: bold;
                    margin-left: 10px;
                }

                .status-confirmed {
                    background: #d4edda;
                    color: #155724;
                }

                .status-pending {
                    background: #fff3cd;
                    color: #856404;
                }

                .status-cancelled {
                    background: #f8d7da;
                    color: #721c24;
                }

                .status-completed {
                    background: #d1ecf1;
                    color: #0c5460;
                }

                .quick-stats {
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
                    color: #667eea;
                    margin-bottom: 10px;
                }

                .filters {
                    background: white;
                    border-radius: 15px;
                    padding: 25px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                }

                .filter-row {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 15px;
                    align-items: center;
                }

                .filter-row select,
                .filter-row input {
                    flex: 1;
                    padding: 10px;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                }

                @media (max-width: 768px) {
                    .main-content {
                        grid-template-columns: 1fr;
                    }

                    .appointment-actions {
                        flex-direction: column;
                    }
                }

                .modal {
                    display: none;
                    position: fixed;
                    z-index: 1000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.5);
                }

                .modal-content {
                    background-color: white;
                    margin: 5% auto;
                    padding: 30px;
                    border-radius: 15px;
                    width: 90%;
                    max-width: 600px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                }

                .close {
                    color: #aaa;
                    float: left;
                    font-size: 28px;
                    font-weight: bold;
                    cursor: pointer;
                }

                .close:hover {
                    color: #000;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📅 ניהול תורים</h1>
                    <p>נהל את כל התורים שלך במקום אחד - מערכת מתקדמת לניהול עסק</p>
                    <a href="/dashboard" class="btn">🏠 חזרה לדאשבורד</a>
                    <button class="btn" onclick="showAddAppointmentModal()">➕ תור חדש</button>
                    <button class="btn" onclick="exportAppointments()">📊 ייצוא נתונים</button>
                </div>

                <div class="quick-stats">
                    <div class="stat-card">
                        <div class="stat-number">12</div>
                        <div>תורים היום</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">47</div>
                        <div>תורים השבוע</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">3</div>
                        <div>ממתינים לאישור</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">₪1,200</div>
                        <div>הכנסות צפויות</div>
                    </div>
                </div>

                <div class="main-content">
                    <div class="appointments-section">
                        <h2>📋 תורים קרובים</h2>

                        <div class="filter-row">
                            <input type="date" id="filterDate" onchange="filterAppointments()">
                            <select id="filterStatus" onchange="filterAppointments()">
                                <option value="">כל הסטטוסים</option>
                                <option value="pending">ממתין</option>
                                <option value="confirmed">מאושר</option>
                                <option value="completed">הושלם</option>
                                <option value="cancelled">בוטל</option>
                            </select>
                            <input type="text" id="searchCustomer" placeholder="חיפוש לקוח..." onkeyup="filterAppointments()">
                        </div>

                        <div id="appointmentsList">
                            ${appointments.map(appointment => `
                                <div class="appointment-item" data-status="${appointment.status}" data-appointment-id="${appointment.id}">
                                    <div class="appointment-info">
                                        <div class="appointment-time">📅 ${appointment.date} • ⏰ ${appointment.time}</div>
                                        <div class="appointment-client">👤 ${appointment.customerName}</div>
                                        <div class="appointment-service">🎯 ${appointment.service}</div>
                                        <div class="appointment-service">📞 ${appointment.phone}</div>
                                        ${appointment.notes ? `<div class="appointment-service">📝 ${appointment.notes}</div>` : ''}
                                    </div>
                                    <div class="appointment-actions">
                                        <span class="status-badge status-${appointment.status}">${getStatusText(appointment.status)}</span>
                                        <button class="btn" onclick="openEditModal('${appointment.id}')">✏️ עריכה</button>
                                        ${appointment.status === 'pending' ? `<button class="btn btn-success" onclick="confirmAppointment('${appointment.id}')">✅ אשר</button>` : ''}
                                        ${appointment.status === 'confirmed' ? `<button class="btn btn-warning" onclick="completeAppointment('${appointment.id}')">✅ סיים</button>` : ''}
                                        <button class="btn btn-danger" onclick="cancelAppointment('${appointment.id}')">❌ בטל</button>
                                        <button class="btn" onclick="sendReminder('${appointment.id}')">📱 תזכורת</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="sidebar">
                        <div class="add-appointment-form">
                            <h3>➕ תור חדש</h3>
                            <form id="appointmentForm" onsubmit="addAppointment(event)">
                                <div class="form-group">
                                    <label>שם הלקוח</label>
                                    <input type="text" name="customerName" required>
                                </div>

                                <div class="form-group">
                                    <label>טלפון</label>
                                    <input type="tel" name="phone" required>
                                </div>

                                <div class="form-group">
                                    <label>סוג שירות</label>
                                    <select name="service" required>
                                        <option value="">בחר שירות</option>
                                        ${services.map(service => `<option value="${service.name}">${service.name}</option>`).join('')}
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label>תאריך</label>
                                    <input type="date" name="date" required>
                                </div>

                                <div class="form-group">
                                    <label>שעה</label>
                                    <input type="time" name="time" required>
                                </div>

                                <div class="form-group">
                                    <label>הערות</label>
                                    <textarea name="notes" rows="3" placeholder="הערות נוספות..."></textarea>
                                </div>

                                <button type="submit" class="btn" style="width: 100%;">💾 שמור תור</button>
                            </form>
                        </div>

                        <div class="filters">
                            <h3>🎯 סינון מהיר</h3>
                            <button class="btn" onclick="showTodayAppointments()" style="width: 100%; margin-bottom: 10px;">📅 תורים היום</button>
                            <button class="btn" onclick="showPendingAppointments()" style="width: 100%; margin-bottom: 10px;">⏰ ממתינים לאישור</button>
                            <button class="btn" onclick="showUpcomingAppointments()" style="width: 100%; margin-bottom: 10px;">📆 תורים קרובים</button>
                            <button class="btn" onclick="showCompletedAppointments()" style="width: 100%;">✅ תורים שהושלמו</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal for editing appointments -->
            <div id="editModal" class="modal">
                <div class="modal-content">
                    <span class="close" onclick="closeEditModal()">&times;</span>
                    <h2>✏️ עריכת תור</h2>
                    <form id="editAppointmentForm">
                        <input type="hidden" id="editId">
                        <div class="form-group">
                            <label>שם הלקוח</label>
                            <input type="text" id="editCustomerName" required>
                        </div>
                        <div class="form-group">
                            <label>טלפון</label>
                            <input type="tel" id="editPhone" required>
                        </div>
                        <div class="form-group">
                            <label>שירות</label>
                            <select id="editService" required>
                                <option value="">בחר שירות</option>
                                ${services.map(service => `<option value="${service.name}">${service.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>תאריך</label>
                            <input type="date" id="editDate" required>
                        </div>
                        <div class="form-group">
                            <label>שעה</label>
                            <input type="time" id="editTime" required>
                        </div>
                        <div class="form-group">
                            <label>הערות</label>
                            <textarea id="editNotes" rows="3"></textarea>
                        </div>
                        <button type="submit" class="btn" style="width: 100%;">💾 שמור שינויים</button>
                    </form>
                </div>
            </div>

            <script>
                const appointmentsData = ${JSON.stringify(appointments)}; // Make appointments data available in JS

                function addAppointment(event) {
                    event.preventDefault();
                    const formData = new FormData(event.target);
                    const appointmentData = Object.fromEntries(formData);

                    fetch('/api/appointments/add', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(appointmentData)
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('✅ ' + data.message);
                            event.target.reset();
                            location.reload();
                        } else {
                            alert('❌ שגיאה: ' + data.error);
                        }
                    })
                    .catch(error => {
                        alert('❌ שגיאה בשמירת התור');
                        console.error(error);
                    });
                }

                function openEditModal(id) {
                    const modal = document.getElementById('editModal');
                    modal.style.display = 'block';

                    const appointment = appointmentsData.find(app => app.id.toString() === id.toString());

                    document.getElementById('editId').value = appointment.id;
                    document.getElementById('editCustomerName').value = appointment.customerName;
                    document.getElementById('editPhone').value = appointment.phone;
                    document.getElementById('editService').value = appointment.service;
                    document.getElementById('editDate').value = appointment.date;
                    document.getElementById('editTime').value = appointment.time;
                    document.getElementById('editNotes').value = appointment.notes;
                }

                function closeEditModal() {
                    document.getElementById('editModal').style.display = 'none';
                }

                function confirmAppointment(id) {
                    updateAppointmentStatus(id, 'confirmed', 'התור אושר בהצלחה!');
                }

                function completeAppointment(id) {
                    updateAppointmentStatus(id, 'completed', 'התור הושלם בהצלחה!');
                }

                function cancelAppointment(id) {
                    if (confirm('האם אתה בטוח שברצונך לבטל את התור?')) {
                        updateAppointmentStatus(id, 'cancelled', 'התור בוטל בהצלחה!');
                    }
                }

                function updateAppointmentStatus(id, status, message) {
                    fetch('/api/appointments/update-status', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ appointmentId: id, status: status })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('✅ ' + message);
                            location.reload();
                        } else {
                            alert('❌ שגיאה: ' + data.error);
                        }
                    })
                    .catch(error => {
                        alert('❌ שגיאה בעדכון הסטטוס');
                        console.error(error);
                    });
                }

                function sendReminder(id) {
                    alert('📱 תזכורת נשלחה ללקוח בהצלחה!');
                }

                function filterAppointments() {
                    const date = document.getElementById('filterDate').value;
                    const status = document.getElementById('filterStatus').value;
                    const search = document.getElementById('searchCustomer').value.toLowerCase();

                    const appointments = document.querySelectorAll('.appointment-item');

                    appointments.forEach(appointment => {
                        let show = true;
                        const appointmentStatus = appointment.dataset.status;
                        const appointmentText = appointment.textContent.toLowerCase();

                        if (date && !appointment.querySelector('.appointment-time').textContent.includes(date)) {
                            show = false;
                        }

                        if (status && appointmentStatus !== status) {
                            show = false;
                        }

                        if (search && !appointmentText.includes(search)) {
                            show = false;
                        }

                        appointment.style.display = show ? 'flex' : 'none';
                    });
                }

                function showTodayAppointments() {
                    const today = new Date().toISOString().split('T')[0];
                    document.getElementById('filterDate').value = today;
                    filterAppointments();
                }

                function showPendingAppointments() {
                    document.getElementById('filterStatus').value = 'pending';
                    filterAppointments();
                }

                function showUpcomingAppointments() {
                    document.getElementById('filterDate').value = ''; // Clear date filter
                    document.getElementById('filterStatus').value = 'confirmed'; // Show confirmed appointments
                    filterAppointments();
                }

                function showCompletedAppointments() {
                    document.getElementById('filterStatus').value = 'completed';
                    filterAppointments();
                }

                function exportAppointments() {
                    alert('📊 ייצוא נתונים יתבצע בקרוב!');
                }

                function showAddAppointmentModal() {
                    alert('📝 טופס הוספת תור נמצא בסרגל הצדדי');
                }

                // Set minimum date to today for new appointment form
                document.addEventListener('DOMContentLoaded', function() {
                    const today = new Date().toISOString().split('T')[0];
                    document.querySelector('input[name="date"]').min = today;
                    // For edit modal, set min date when modal is opened or dynamically
                    // document.getElementById('editDate').min = today; // This would be better inside openEditModal
                });
            </script>
        </body>
        </html>
    `);
});

module.exports = router;
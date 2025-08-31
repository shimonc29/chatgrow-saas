
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

router.get('/', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(app => app.date === today);
    const upcomingAppointments = appointments.filter(app => app.date > today);
    const totalRevenue = appointments.filter(app => app.status === 'completed').reduce((sum, app) => sum + app.price, 0);
    
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
                    max-width: 1600px;
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
                    font-size: 2.2em;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                
                .stat-number.positive { color: #27ae60; }
                .stat-number.warning { color: #f39c12; }
                .stat-number.primary { color: #667eea; }
                
                .quick-actions {
                    background: white;
                    border-radius: 15px;
                    padding: 25px;
                    margin-bottom: 30px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                }
                
                .new-appointment-form {
                    background: #f8f9fa;
                    border-radius: 15px;
                    padding: 25px;
                    margin-bottom: 30px;
                    border: 2px dashed #dee2e6;
                    display: none;
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
                
                .appointments-section {
                    background: white;
                    border-radius: 15px;
                    padding: 30px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                }
                
                .filters-toolbar {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 10px;
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
                    background: white;
                }
                
                .appointment-card:hover {
                    border-color: #667eea;
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
                }
                
                .status-confirmed { border-right: 5px solid #27ae60; }
                .status-pending { border-right: 5px solid #f39c12; }
                .status-cancelled { border-right: 5px solid #e74c3c; }
                .status-completed { border-right: 5px solid #3498db; }
                .status-no_show { border-right: 5px solid #95a5a6; }
                
                .appointment-header {
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
                
                .appointment-time {
                    background: #667eea;
                    color: white;
                    padding: 8px 15px;
                    border-radius: 20px;
                    font-weight: bold;
                }
                
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
                
                .status-badge {
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 0.9em;
                    font-weight: bold;
                    color: white;
                    display: inline-block;
                }
                
                .status-confirmed .status-badge { background: #27ae60; }
                .status-pending .status-badge { background: #f39c12; }
                .status-cancelled .status-badge { background: #e74c3c; }
                .status-completed .status-badge { background: #3498db; }
                .status-no_show .status-badge { background: #95a5a6; }
                
                .appointment-notes {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    border-right: 3px solid #667eea;
                }
                
                .appointment-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    margin-top: 15px;
                }
                
                .calendar-view {
                    background: white;
                    border-radius: 15px;
                    padding: 30px;
                    margin-bottom: 30px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                }
                
                .calendar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                
                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 2px;
                    background: #e9ecef;
                    border-radius: 10px;
                    padding: 10px;
                }
                
                .calendar-day {
                    background: white;
                    padding: 10px;
                    text-align: center;
                    min-height: 80px;
                    border-radius: 5px;
                    position: relative;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .calendar-day:hover {
                    background: #f8f9fa;
                }
                
                .calendar-day.has-appointments {
                    background: #e3f2fd;
                    border: 2px solid #2196f3;
                }
                
                .calendar-day.today {
                    background: #667eea;
                    color: white;
                }
                
                .appointment-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    position: absolute;
                    bottom: 5px;
                    right: 5px;
                }
                
                .dot-confirmed { background: #27ae60; }
                .dot-pending { background: #f39c12; }
                .dot-cancelled { background: #e74c3c; }
                
                @media (max-width: 768px) {
                    .container { padding: 10px; }
                    .header { padding: 20px; }
                    .appointments-grid { grid-template-columns: 1fr; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📅 ניהול תורים</h1>
                    <p>מערכת ניהול תורים מתקדמת עם לוח שנה ותזכורות אוטומטיות</p>
                    <a href="/dashboard" class="btn">🏠 חזרה לדאשבורד</a>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number primary">${todayAppointments.length}</div>
                        <div>תורים היום</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number warning">${upcomingAppointments.length}</div>
                        <div>תורים קרובים</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number positive">₪${totalRevenue.toLocaleString()}</div>
                        <div>הכנסות השבוע</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number primary">${appointments.filter(a => a.status === 'confirmed').length}</div>
                        <div>תורים מאושרים</div>
                    </div>
                </div>
                
                <div class="quick-actions">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2>⚡ פעולות מהירות</h2>
                    </div>
                    <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                        <button class="btn btn-success" onclick="toggleNewAppointmentForm()">📅 תור חדש</button>
                        <button class="btn btn-info" onclick="showTodaySchedule()">📋 יומן היום</button>
                        <button class="btn btn-warning" onclick="sendReminders()">📱 שלח תזכורות</button>
                        <button class="btn" onclick="exportSchedule()">📊 ייצא לוח זמנים</button>
                        <button class="btn" onclick="toggleCalendarView()">📅 תצוגת לוח שנה</button>
                    </div>
                </div>
                
                <div class="new-appointment-form" id="newAppointmentForm">
                    <h3>📅 קביעת תור חדש</h3>
                    <form onsubmit="addAppointment(event)">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>שם הלקוח *</label>
                                <input type="text" name="customerName" required placeholder="הכנס שם לקוח">
                            </div>
                            <div class="form-group">
                                <label>טלפון *</label>
                                <input type="tel" name="phone" required placeholder="050-1234567">
                            </div>
                            <div class="form-group">
                                <label>שירות *</label>
                                <select name="service" required onchange="updateServiceDetails(this)">
                                    <option value="">בחר שירות</option>
                                    ${services.map(service => `
                                        <option value="${service.name}" data-duration="${service.duration}" data-price="${service.price}">
                                            ${service.name} - ₪${service.price} (${service.duration} דקות)
                                        </option>
                                    `).join('')}
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
                                <label>משך זמן (דקות)</label>
                                <input type="number" name="duration" min="15" max="480" placeholder="120" readonly>
                            </div>
                            <div class="form-group">
                                <label>מחיר</label>
                                <input type="number" name="price" min="0" placeholder="250" readonly>
                            </div>
                            <div class="form-group">
                                <label>סטטוס</label>
                                <select name="status">
                                    <option value="pending">ממתין לאישור</option>
                                    <option value="confirmed">מאושר</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>הערות</label>
                            <textarea name="notes" rows="3" placeholder="הערות נוספות על התור..."></textarea>
                        </div>
                        <div style="margin-top: 20px;">
                            <button type="submit" class="btn btn-success">💾 שמור תור</button>
                            <button type="button" class="btn" onclick="toggleNewAppointmentForm()">❌ ביטול</button>
                        </div>
                    </form>
                </div>
                
                <div class="calendar-view" id="calendarView" style="display: none;">
                    <div class="calendar-header">
                        <h3>📅 לוח שנה - ${new Date().toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}</h3>
                        <div>
                            <button class="btn" onclick="previousMonth()">◀ חודש קודם</button>
                            <button class="btn" onclick="nextMonth()">חודש הבא ▶</button>
                        </div>
                    </div>
                    <div class="calendar-grid" id="calendarGrid">
                        <!-- Calendar will be generated by JavaScript -->
                    </div>
                </div>
                
                <div class="appointments-section">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2>📋 רשימת תורים</h2>
                        <div>
                            <button class="btn btn-info" onclick="refreshAppointments()">🔄 רענן</button>
                        </div>
                    </div>
                    
                    <div class="filters-toolbar">
                        <input type="text" id="searchAppointments" placeholder="🔍 חפש לקוח או שירות..." oninput="filterAppointments()">
                        <input type="date" id="dateFilter" onchange="filterAppointments()" placeholder="סנן לפי תאריך">
                        <select id="statusFilter" onchange="filterAppointments()">
                            <option value="">כל הסטטוסים</option>
                            <option value="confirmed">מאושרים</option>
                            <option value="pending">ממתינים</option>
                            <option value="completed">הושלמו</option>
                            <option value="cancelled">בוטלו</option>
                        </select>
                        <select id="sortBy" onchange="sortAppointments()">
                            <option value="date">מיון לפי תאריך</option>
                            <option value="time">מיון לפי שעה</option>
                            <option value="customer">מיון לפי לקוח</option>
                            <option value="service">מיון לפי שירות</option>
                        </select>
                    </div>
                    
                    <div class="appointments-grid" id="appointmentsGrid">
                        ${appointments.map(appointment => `
                            <div class="appointment-card status-${appointment.status}" data-appointment='${JSON.stringify(appointment)}'>
                                <div class="appointment-header">
                                    <div class="customer-name">${appointment.customerName}</div>
                                    <div class="appointment-time">${formatDate(appointment.date)} ${formatTime(appointment.time)}</div>
                                </div>
                                
                                <div class="appointment-details">
                                    <div class="detail-item">
                                        <div class="detail-label">🎯 שירות</div>
                                        <div class="detail-value">${appointment.service}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">⏱️ משך זמן</div>
                                        <div class="detail-value">${appointment.duration} דקות</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">💰 מחיר</div>
                                        <div class="detail-value">₪${appointment.price}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">📱 טלפון</div>
                                        <div class="detail-value">${appointment.phone}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">📊 סטטוס</div>
                                        <div class="status-badge">${getStatusText(appointment.status)}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">📱 תזכורת</div>
                                        <div class="detail-value">${appointment.reminderSent ? '✅ נשלחה' : '⏳ לא נשלחה'}</div>
                                    </div>
                                </div>
                                
                                ${appointment.notes ? `
                                <div class="appointment-notes">
                                    <strong>📝 הערות:</strong> ${appointment.notes}
                                </div>
                                ` : ''}
                                
                                <div class="appointment-actions">
                                    ${appointment.status === 'pending' ? `
                                        <button class="btn btn-success" onclick="confirmAppointment(${appointment.id})">✅ אשר תור</button>
                                        <button class="btn btn-danger" onclick="cancelAppointment(${appointment.id})">❌ בטל תור</button>
                                    ` : ''}
                                    ${appointment.status === 'confirmed' ? `
                                        <button class="btn btn-info" onclick="markCompleted(${appointment.id})">✅ סמן כהושלם</button>
                                        <button class="btn btn-warning" onclick="markNoShow(${appointment.id})">🚫 לא הגיע</button>
                                        <button class="btn btn-danger" onclick="cancelAppointment(${appointment.id})">❌ בטל</button>
                                    ` : ''}
                                    <button class="btn" onclick="editAppointment(${appointment.id})">✏️ ערוך</button>
                                    <button class="btn btn-info" onclick="sendReminder(${appointment.id})">📱 תזכורת</button>
                                    <button class="btn" onclick="viewCustomer(${appointment.customerId})">👤 פרטי לקוח</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <script>
                let currentDate = new Date();
                let calendarVisible = false;
                
                function formatDate(dateStr) {
                    const date = new Date(dateStr);
                    return date.toLocaleDateString('he-IL');
                }
                
                function formatTime(timeStr) {
                    return timeStr.slice(0, 5);
                }
                
                function toggleNewAppointmentForm() {
                    const form = document.getElementById('newAppointmentForm');
                    form.style.display = form.style.display === 'none' ? 'block' : 'none';
                }
                
                function updateServiceDetails(select) {
                    const option = select.options[select.selectedIndex];
                    if (option.value) {
                        document.querySelector('input[name="duration"]').value = option.dataset.duration;
                        document.querySelector('input[name="price"]').value = option.dataset.price;
                    }
                }
                
                function addAppointment(event) {
                    event.preventDefault();
                    const formData = new FormData(event.target);
                    const appointmentData = Object.fromEntries(formData);
                    
                    // Validate appointment time availability
                    if (isTimeSlotAvailable(appointmentData.date, appointmentData.time)) {
                        alert('התור נקבע בהצלחה! תזכורת תישלח אוטומטית 24 שעות לפני.');
                        toggleNewAppointmentForm();
                        event.target.reset();
                        // Here we would send data to server
                    } else {
                        alert('השעה תפוסה! אנא בחר שעה אחרת.');
                    }
                }
                
                function isTimeSlotAvailable(date, time) {
                    const existingAppointments = ${JSON.stringify(appointments)};
                    return !existingAppointments.some(app => 
                        app.date === date && 
                        app.time === time && 
                        app.status !== 'cancelled'
                    );
                }
                
                function confirmAppointment(id) {
                    if (confirm('לאשר את התור?')) {
                        alert('התור אושר בהצלחה! הודעת אישור תישלח ללקוח.');
                        location.reload();
                    }
                }
                
                function cancelAppointment(id) {
                    const reason = prompt('סיבת ביטול התור:');
                    if (reason !== null) {
                        alert('התור בוטל בהצלחה! הודעת ביטול תישלח ללקוח.');
                        location.reload();
                    }
                }
                
                function markCompleted(id) {
                    if (confirm('לסמן תור כהושלם?')) {
                        alert('התור סומן כהושלם! חשבונית נוצרה אוטומטית.');
                        location.reload();
                    }
                }
                
                function markNoShow(id) {
                    if (confirm('לסמן כ"לא הגיע"? זה ישלח הודעה ללקוח ויגבה דמי ביטול.')) {
                        alert('התור סומן כ"לא הגיע". הודעה נשלחה ללקוח.');
                        location.reload();
                    }
                }
                
                function editAppointment(id) {
                    alert('עריכת תור #' + id + ' - בפיתוח מתקדם');
                }
                
                function sendReminder(id) {
                    alert('תזכורת נשלחה ללקוח בהצלחה!');
                }
                
                function viewCustomer(customerId) {
                    window.open('/api/customers', '_blank');
                }
                
                function showTodaySchedule() {
                    const today = new Date().toISOString().split('T')[0];
                    document.getElementById('dateFilter').value = today;
                    filterAppointments();
                    alert('מוצגים תורי היום בלבד');
                }
                
                function sendReminders() {
                    alert('תזכורות נשלחו לכל הלקוחות עם תורים מחר!');
                }
                
                function exportSchedule() {
                    alert('לוח הזמנים יוצא לקובץ Excel בהצלחה!');
                }
                
                function refreshAppointments() {
                    location.reload();
                }
                
                function filterAppointments() {
                    const search = document.getElementById('searchAppointments').value.toLowerCase();
                    const dateFilter = document.getElementById('dateFilter').value;
                    const statusFilter = document.getElementById('statusFilter').value;
                    const cards = document.querySelectorAll('.appointment-card');
                    
                    cards.forEach(card => {
                        const appointment = JSON.parse(card.dataset.appointment);
                        const matchesSearch = appointment.customerName.toLowerCase().includes(search) || 
                                             appointment.service.toLowerCase().includes(search) ||
                                             appointment.phone.includes(search);
                        const matchesDate = !dateFilter || appointment.date === dateFilter;
                        const matchesStatus = !statusFilter || appointment.status === statusFilter;
                        
                        card.style.display = matchesSearch && matchesDate && matchesStatus ? 'block' : 'none';
                    });
                }
                
                function sortAppointments() {
                    const sortBy = document.getElementById('sortBy').value;
                    const grid = document.getElementById('appointmentsGrid');
                    const cards = Array.from(grid.querySelectorAll('.appointment-card'));
                    
                    cards.sort((a, b) => {
                        const appointmentA = JSON.parse(a.dataset.appointment);
                        const appointmentB = JSON.parse(b.dataset.appointment);
                        
                        switch(sortBy) {
                            case 'date':
                                return new Date(appointmentA.date + ' ' + appointmentA.time) - 
                                       new Date(appointmentB.date + ' ' + appointmentB.time);
                            case 'time':
                                return appointmentA.time.localeCompare(appointmentB.time);
                            case 'customer':
                                return appointmentA.customerName.localeCompare(appointmentB.customerName);
                            case 'service':
                                return appointmentA.service.localeCompare(appointmentB.service);
                            default:
                                return 0;
                        }
                    });
                    
                    cards.forEach(card => grid.appendChild(card));
                }
                
                function toggleCalendarView() {
                    const calendar = document.getElementById('calendarView');
                    calendarVisible = !calendarVisible;
                    calendar.style.display = calendarVisible ? 'block' : 'none';
                    
                    if (calendarVisible) {
                        generateCalendar();
                    }
                }
                
                function generateCalendar() {
                    const grid = document.getElementById('calendarGrid');
                    const year = currentDate.getFullYear();
                    const month = currentDate.getMonth();
                    
                    // Days of week headers
                    const daysOfWeek = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
                    
                    let calendarHTML = '';
                    daysOfWeek.forEach(day => {
                        calendarHTML += '<div style="font-weight: bold; text-align: center; padding: 10px;">' + day + '</div>';
                    });
                    
                    const firstDay = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const today = new Date().toISOString().split('T')[0];
                    
                    // Empty cells for days before month starts
                    for (let i = 0; i < firstDay; i++) {
                        calendarHTML += '<div class="calendar-day"></div>';
                    }
                    
                    // Days of the month
                    for (let day = 1; day <= daysInMonth; day++) {
                        const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
                        const dayAppointments = ${JSON.stringify(appointments)}.filter(app => app.date === dateStr);
                        const isToday = dateStr === today;
                        
                        let classes = 'calendar-day';
                        if (dayAppointments.length > 0) classes += ' has-appointments';
                        if (isToday) classes += ' today';
                        
                        calendarHTML += '<div class="' + classes + '" onclick="selectDate(\'' + dateStr + '\')">';
                        calendarHTML += '<div>' + day + '</div>';
                        
                        dayAppointments.forEach(app => {
                            calendarHTML += '<div class="appointment-dot dot-' + app.status + '"></div>';
                        });
                        
                        calendarHTML += '</div>';
                    }
                    
                    grid.innerHTML = calendarHTML;
                }
                
                function selectDate(dateStr) {
                    document.getElementById('dateFilter').value = dateStr;
                    filterAppointments();
                    alert('מוצגים תורים לתאריך ' + formatDate(dateStr));
                }
                
                function previousMonth() {
                    currentDate.setMonth(currentDate.getMonth() - 1);
                    generateCalendar();
                }
                
                function nextMonth() {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    generateCalendar();
                }
            </script>
        </body>
        </html>
    `);
});

module.exports = router;

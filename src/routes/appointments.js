
const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');
const authMiddleware = require('../middleware/auth');
const { logApiRequest } = require('../utils/logger');

// Get appointments dashboard
router.get('/', authMiddleware, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { date, status, customer } = req.query;
        
        // Build query filters
        const filters = { businessId: req.user.id };
        if (status) filters.status = status;
        if (customer) filters['customer.phone'] = customer;
        if (date) {
            const selectedDate = new Date(date);
            const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));
            filters.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
        }
        
        const appointments = await Appointment.find(filters)
            .sort({ appointmentDate: 1, startTime: 1 })
            .limit(100);
            
        const todayAppointments = await Appointment.getTodayAppointments(req.user.id);
        const upcomingAppointments = await Appointment.getUpcomingAppointments(req.user.id);
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime);
        
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
        
        .controls {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            flex-wrap: wrap;
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
        
        .appointments-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
        }
        
        .appointment-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border-right: 5px solid #667eea;
            transition: transform 0.2s;
        }
        
        .appointment-card:hover {
            transform: translateY(-2px);
        }
        
        .appointment-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .appointment-time {
            font-size: 1.2em;
            font-weight: bold;
            color: #667eea;
        }
        
        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .status-scheduled { background: #3498db; color: white; }
        .status-confirmed { background: #27ae60; color: white; }
        .status-completed { background: #95a5a6; color: white; }
        .status-cancelled { background: #e74c3c; color: white; }
        
        .customer-info {
            margin-bottom: 15px;
        }
        
        .customer-name {
            font-size: 1.1em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .customer-phone {
            color: #666;
            font-size: 0.9em;
        }
        
        .service-info {
            margin-bottom: 15px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .appointment-actions {
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
        
        .filters {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .filter-row {
            display: flex;
            gap: 15px;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .filter-row input,
        .filter-row select {
            padding: 8px 12px;
            border: 2px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
        }
        
        .filter-row label {
            font-weight: bold;
            margin-left: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📅 ניהול תורים</h1>
            <p>ניהול יעיל של כל התורים והפגישות שלך</p>
        </div>
        
        <div class="stats-bar">
            <div class="stat-card">
                <div class="stat-number">${todayAppointments.length}</div>
                <div>תורים היום</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${upcomingAppointments.length}</div>
                <div>תורים קרובים</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${appointments.filter(a => a.status === 'confirmed').length}</div>
                <div>תורים מאושרים</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">₪${appointments.reduce((sum, a) => sum + (a.paymentStatus === 'paid' ? a.price : 0), 0)}</div>
                <div>הכנסות</div>
            </div>
        </div>
        
        <div class="filters">
            <div class="filter-row">
                <label>תאריך:</label>
                <input type="date" id="dateFilter" value="${date || ''}" />
                
                <label>סטטוס:</label>
                <select id="statusFilter">
                    <option value="">כל הסטטוסים</option>
                    <option value="scheduled" ${status === 'scheduled' ? 'selected' : ''}>מתוזמן</option>
                    <option value="confirmed" ${status === 'confirmed' ? 'selected' : ''}>מאושר</option>
                    <option value="completed" ${status === 'completed' ? 'selected' : ''}>הושלם</option>
                    <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>בוטל</option>
                </select>
                
                <button class="btn" onclick="applyFilters()">סנן</button>
                <button class="btn btn-success" onclick="alert('בהמתנה לפיתוח')">➕ תור חדש</button>
            </div>
        </div>
        
        ${appointments.length > 0 ? `
        <div class="appointments-grid">
            ${appointments.map(appointment => `
                <div class="appointment-card">
                    <div class="appointment-header">
                        <div class="appointment-time">${appointment.startTime} - ${appointment.endTime}</div>
                        <span class="status-badge status-${appointment.status}">${getStatusText(appointment.status)}</span>
                    </div>
                    
                    <div class="customer-info">
                        <div class="customer-name">${appointment.customer.firstName} ${appointment.customer.lastName}</div>
                        <div class="customer-phone">📱 ${appointment.customer.phone}</div>
                    </div>
                    
                    <div class="service-info">
                        <strong>${appointment.serviceName}</strong>
                        <div style="font-size: 0.9em; color: #666;">משך: ${appointment.duration} דקות</div>
                        ${appointment.price > 0 ? `<div style="font-size: 0.9em; color: #27ae60;">מחיר: ₪${appointment.price}</div>` : ''}
                    </div>
                    
                    <div class="appointment-actions">
                        ${appointment.status === 'scheduled' ? '<button class="btn btn-success btn-small" onclick="confirmAppointment()">אשר</button>' : ''}
                        <button class="btn btn-warning btn-small" onclick="editAppointment()">ערוך</button>
                        <button class="btn btn-small" onclick="sendReminder()">שלח תזכורת</button>
                        ${appointment.status !== 'cancelled' ? '<button class="btn btn-danger btn-small" onclick="cancelAppointment()">בטל</button>' : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        ` : `
        <div class="empty-state">
            <h3>אין תורים להצגה</h3>
            <p>לא נמצאו תורים בהתאם לסינון שנבחר</p>
            <button class="btn btn-success" onclick="alert('בהמתנה לפיתוח')" style="margin-top: 20px;">➕ הוסף תור חדש</button>
        </div>
        `}
    </div>
    
    <script>
        function getStatusText(status) {
            const statusMap = {
                'scheduled': 'מתוזמן',
                'confirmed': 'מאושר', 
                'completed': 'הושלם',
                'cancelled': 'בוטל',
                'no_show': 'לא הגיע',
                'rescheduled': 'נדחה'
            };
            return statusMap[status] || status;
        }
        
        function applyFilters() {
            const date = document.getElementById('dateFilter').value;
            const status = document.getElementById('statusFilter').value;
            
            const params = new URLSearchParams();
            if (date) params.append('date', date);
            if (status) params.append('status', status);
            
            window.location.href = '/api/appointments?' + params.toString();
        }
        
        function confirmAppointment() {
            alert('בהמתנה לפיתוח - אישור תור');
        }
        
        function editAppointment() {
            alert('בהמתנה לפיתוח - עריכת תור');
        }
        
        function sendReminder() {
            alert('בהמתנה לפיתוח - שליחת תזכורת');
        }
        
        function cancelAppointment() {
            if (confirm('האם אתה בטוח שברצונך לבטל את התור?')) {
                alert('בהמתנה לפיתוח - ביטול תור');
            }
        }
    </script>
</body>
</html>
        `);
        
    } catch (error) {
        console.error('Appointments dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בטעינת התורים',
            error: error.message
        });
    }
});

// Create new appointment
router.post('/new', authMiddleware, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const appointmentData = {
            businessId: req.user.id,
            ...req.body
        };
        
        const appointment = new Appointment(appointmentData);
        await appointment.save();
        
        logApiRequest(req.method, req.originalUrl, 201, Date.now() - startTime);
        
        res.status(201).json({
            success: true,
            appointment,
            message: 'תור נוצר בהצלחה'
        });
        
    } catch (error) {
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        
        res.status(500).json({
            success: false,
            message: 'שגיאה ביצירת התור',
            error: error.message
        });
    }
});

// Update appointment
router.put('/:appointmentId', authMiddleware, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const appointment = await Appointment.findOneAndUpdate(
            { _id: req.params.appointmentId, businessId: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'תור לא נמצא'
            });
        }
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime);
        
        res.json({
            success: true,
            appointment,
            message: 'תור עודכן בהצלחה'
        });
        
    } catch (error) {
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        
        res.status(500).json({
            success: false,
            message: 'שגיאה בעדכון התור',
            error: error.message
        });
    }
});

module.exports = router;

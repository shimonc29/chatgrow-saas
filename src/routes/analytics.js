
const express = require('express');
const router = express.Router();

// Mock analytics data
const analyticsData = {
    monthlyStats: {
        revenue: [12000, 15000, 18000, 22000, 19000, 25000],
        appointments: [45, 58, 62, 71, 65, 78],
        customers: [12, 15, 8, 19, 14, 22],
        months: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני']
    },
    topServices: [
        { name: 'צילומי חתונה', count: 15, revenue: 45000 },
        { name: 'סדנת קרמיקה', count: 32, revenue: 16000 },
        { name: 'צילומי משפחה', count: 28, revenue: 22400 },
        { name: 'אירועים פרטיים', count: 12, revenue: 18000 }
    ],
    customerInsights: {
        returning: 68,
        new: 32,
        avgSpending: 856,
        satisfaction: 4.7
    }
};

router.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="he" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>דוחות ואנליטיקה - BusinessFlow</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
                
                .analytics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 30px;
                    margin-bottom: 30px;
                }
                
                .chart-card {
                    background: white;
                    border-radius: 15px;
                    padding: 25px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                }
                
                .chart-card h3 {
                    margin-bottom: 20px;
                    color: #2c3e50;
                    text-align: center;
                }
                
                .stats-overview {
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
                
                .services-table {
                    background: white;
                    border-radius: 15px;
                    padding: 25px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                    margin-bottom: 30px;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                
                th, td {
                    padding: 15px;
                    text-align: right;
                    border-bottom: 1px solid #e9ecef;
                }
                
                th {
                    background: #f8f9fa;
                    font-weight: bold;
                    color: #2c3e50;
                }
                
                .progress-bar {
                    background: #e9ecef;
                    border-radius: 10px;
                    height: 8px;
                    overflow: hidden;
                    margin-top: 5px;
                }
                
                .progress-fill {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    height: 100%;
                    border-radius: 10px;
                    transition: width 0.3s ease;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📊 דוחות ואנליטיקה</h1>
                    <p>ניתוח מפורט של הביצועים והמכירות שלך</p>
                    <a href="/dashboard" class="btn">🏠 חזרה לדאשבורד</a>
                </div>
                
                <div class="stats-overview">
                    <div class="stat-card">
                        <div class="stat-number">₪${analyticsData.monthlyStats.revenue[5].toLocaleString()}</div>
                        <div>הכנסות החודש</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${analyticsData.monthlyStats.appointments[5]}</div>
                        <div>תורים החודש</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${analyticsData.monthlyStats.customers[5]}</div>
                        <div>לקוחות חדשים</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${analyticsData.customerInsights.satisfaction}</div>
                        <div>דירוג שביעות רצון</div>
                    </div>
                </div>
                
                <div class="analytics-grid">
                    <div class="chart-card">
                        <h3>📈 מגמת הכנסות</h3>
                        <canvas id="revenueChart" width="400" height="200"></canvas>
                    </div>
                    
                    <div class="chart-card">
                        <h3>📅 כמות תורים</h3>
                        <canvas id="appointmentsChart" width="400" height="200"></canvas>
                    </div>
                    
                    <div class="chart-card">
                        <h3>👥 לקוחות חדשים vs חוזרים</h3>
                        <canvas id="customersChart" width="400" height="200"></canvas>
                    </div>
                    
                    <div class="chart-card">
                        <h3>🎯 התפלגות שירותים</h3>
                        <canvas id="servicesChart" width="400" height="200"></canvas>
                    </div>
                </div>
                
                <div class="services-table">
                    <h3>🏆 השירותים המובילים</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>שירות</th>
                                <th>כמות תורים</th>
                                <th>הכנסות</th>
                                <th>ממוצע לתור</th>
                                <th>פופולריות</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${analyticsData.topServices.map(service => `
                                <tr>
                                    <td><strong>${service.name}</strong></td>
                                    <td>${service.count}</td>
                                    <td>₪${service.revenue.toLocaleString()}</td>
                                    <td>₪${Math.round(service.revenue / service.count)}</td>
                                    <td>
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${(service.count / 35) * 100}%"></div>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <script>
                // Revenue Chart
                const revenueCtx = document.getElementById('revenueChart').getContext('2d');
                new Chart(revenueCtx, {
                    type: 'line',
                    data: {
                        labels: ${JSON.stringify(analyticsData.monthlyStats.months)},
                        datasets: [{
                            label: 'הכנסות (₪)',
                            data: ${JSON.stringify(analyticsData.monthlyStats.revenue)},
                            borderColor: '#667eea',
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
                
                // Appointments Chart
                const appointmentsCtx = document.getElementById('appointmentsChart').getContext('2d');
                new Chart(appointmentsCtx, {
                    type: 'bar',
                    data: {
                        labels: ${JSON.stringify(analyticsData.monthlyStats.months)},
                        datasets: [{
                            label: 'תורים',
                            data: ${JSON.stringify(analyticsData.monthlyStats.appointments)},
                            backgroundColor: 'rgba(102, 126, 234, 0.8)'
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
                
                // Customers Chart
                const customersCtx = document.getElementById('customersChart').getContext('2d');
                new Chart(customersCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['לקוחות חוזרים', 'לקוחות חדשים'],
                        datasets: [{
                            data: [${analyticsData.customerInsights.returning}, ${analyticsData.customerInsights.new}],
                            backgroundColor: ['#667eea', '#764ba2']
                        }]
                    },
                    options: {
                        responsive: true
                    }
                });
                
                // Services Chart
                const servicesCtx = document.getElementById('servicesChart').getContext('2d');
                new Chart(servicesCtx, {
                    type: 'pie',
                    data: {
                        labels: ${JSON.stringify(analyticsData.topServices.map(s => s.name))},
                        datasets: [{
                            data: ${JSON.stringify(analyticsData.topServices.map(s => s.count))},
                            backgroundColor: ['#667eea', '#764ba2', '#27ae60', '#f39c12']
                        }]
                    },
                    options: {
                        responsive: true
                    }
                });
            </script>
        </body>
        </html>
    `);
});

module.exports = router;

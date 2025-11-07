import { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import axios from 'axios';

const SiteAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalEvents: 0,
    totalAppointments: 0,
    totalPayments: 0,
    totalRevenue: 0,
    revenueByMonth: {},
    customersByMonth: {},
    activeEvents: 0,
    completedAppointments: 0
  });
  const [customers, setCustomers] = useState([]);
  const [events, setEvents] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [customersRes, eventsRes, appointmentsRes, paymentsRes] = await Promise.all([
        axios.get('/api/customers', { headers }),
        axios.get('/api/events', { headers }),
        axios.get('/api/appointments', { headers }),
        axios.get('/api/payments', { headers })
      ]);

      const customersData = Array.isArray(customersRes.data) ? customersRes.data : [];
      const eventsData = Array.isArray(eventsRes.data) ? eventsRes.data : [];
      const appointmentsData = Array.isArray(appointmentsRes.data) ? appointmentsRes.data : [];
      const paymentsData = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];

      setCustomers(customersData);
      setEvents(eventsData);
      setAppointments(appointmentsData);
      setPayments(paymentsData);

      const totalRevenue = paymentsData
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const activeEvents = eventsData.filter(e => 
        new Date(e.endDate) >= new Date()
      ).length;

      const completedAppointments = appointmentsData.filter(a => 
        a.status === 'completed'
      ).length;

      const customersByMonth = customersData.reduce((acc, c) => {
        const month = new Date(c.createdAt).toLocaleDateString('he-IL', { month: 'short', year: 'numeric' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      const revenueByMonth = paymentsData
        .filter(p => p.status === 'completed')
        .reduce((acc, p) => {
          const month = new Date(p.createdAt).toLocaleDateString('he-IL', { month: 'short', year: 'numeric' });
          acc[month] = (acc[month] || 0) + (p.amount || 0);
          return acc;
        }, {});

      setStats({
        totalCustomers: customersData.length,
        totalEvents: eventsData.length,
        totalAppointments: appointmentsData.length,
        totalPayments: paymentsData.length,
        totalRevenue,
        customersByMonth,
        revenueByMonth,
        activeEvents,
        completedAppointments
      });
    } catch (err) {
      console.error('Error fetching site data:', err);
      alert('שגיאה בטעינת נתוני האתר');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    filterQuery === '' ||
    c.name?.toLowerCase().includes(filterQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(filterQuery.toLowerCase()) ||
    c.phone?.includes(filterQuery)
  );

  const filteredEvents = events.filter(e =>
    filterQuery === '' ||
    e.title?.toLowerCase().includes(filterQuery.toLowerCase()) ||
    e.description?.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const filteredAppointments = appointments.filter(a =>
    filterQuery === '' ||
    a.customerName?.toLowerCase().includes(filterQuery.toLowerCase()) ||
    a.serviceType?.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const filteredPayments = payments.filter(p =>
    filterQuery === '' ||
    p.customerName?.toLowerCase().includes(filterQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(filterQuery.toLowerCase())
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen bg-bg-light">
          <div className="text-xl text-text-primary">טוען נתוני אתר...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 bg-bg-light min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-accent-teal mb-2">👑 פאנל ניהול אתר</h1>
          <p className="text-text-secondary">ניהול מקיף של כל נתוני המערכת והלקוחות</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-bg-card border border-accent-teal/30 rounded-xl shadow-lg p-6 hover:border-accent-teal/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">סה"כ לקוחות</p>
                <p className="text-3xl font-bold text-accent-teal mt-1">{stats.totalCustomers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-bg-card border border-accent-teal/30 rounded-xl shadow-lg p-6 hover:border-accent-teal/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">סה"כ אירועים</p>
                <p className="text-3xl font-bold text-accent-teal mt-1">{stats.totalEvents}</p>
                <p className="text-xs text-text-secondary mt-1">{stats.activeEvents} פעילים</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            </div>
          </div>

          <div className="bg-bg-card border border-accent-teal/30 rounded-xl shadow-lg p-6 hover:border-accent-teal/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">סה"כ תורים</p>
                <p className="text-3xl font-bold text-accent-teal mt-1">{stats.totalAppointments}</p>
                <p className="text-xs text-text-secondary mt-1">{stats.completedAppointments} הושלמו</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🗓️</span>
              </div>
            </div>
          </div>

          <div className="bg-bg-card border border-accent-teal/30 rounded-xl shadow-lg p-6 hover:border-accent-teal/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">סה"כ הכנסות</p>
                <p className="text-3xl font-bold text-accent-teal mt-1">
                  ₪{stats.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-text-secondary mt-1">{stats.totalPayments} תשלומים</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-bg-card rounded-xl shadow-lg border border-accent-teal/30 overflow-hidden mb-8">
          <div className="flex border-b border-accent-teal/30">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-accent-teal text-white'
                  : 'text-text-primary hover:bg-accent-teal/10'
              }`}
            >
              סקירה כללית
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
                activeTab === 'customers'
                  ? 'bg-accent-teal text-white'
                  : 'text-text-primary hover:bg-accent-teal/10'
              }`}
            >
              לקוחות ({customers.length})
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
                activeTab === 'events'
                  ? 'bg-accent-teal text-white'
                  : 'text-text-primary hover:bg-accent-teal/10'
              }`}
            >
              אירועים ({events.length})
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
                activeTab === 'appointments'
                  ? 'bg-accent-teal text-white'
                  : 'text-text-primary hover:bg-accent-teal/10'
              }`}
            >
              תורים ({appointments.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
                activeTab === 'payments'
                  ? 'bg-accent-teal text-white'
                  : 'text-text-primary hover:bg-accent-teal/10'
              }`}
            >
              תשלומים ({payments.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab !== 'overview' && (
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="חפש..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-accent-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-teal bg-white text-text-primary"
                />
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-accent-teal mb-4">לקוחות חדשים לפי חודש</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.customersByMonth).slice(-6).map(([month, count]) => (
                      <div key={month} className="flex items-center justify-between p-3 bg-bg-light rounded-lg">
                        <span className="text-text-primary">{month}</span>
                        <span className="font-bold text-accent-teal">{count} לקוחות</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-accent-teal mb-4">הכנסות לפי חודש</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.revenueByMonth).slice(-6).map(([month, revenue]) => (
                      <div key={month} className="flex items-center justify-between p-3 bg-bg-light rounded-lg">
                        <span className="text-text-primary">{month}</span>
                        <span className="font-bold text-accent-teal">₪{revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'customers' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-accent-teal/30">
                      <th className="text-right p-3 text-text-primary font-semibold">שם</th>
                      <th className="text-right p-3 text-text-primary font-semibold">אימייל</th>
                      <th className="text-right p-3 text-text-primary font-semibold">טלפון</th>
                      <th className="text-right p-3 text-text-primary font-semibold">תאריך הצטרפות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map(customer => (
                      <tr key={customer._id} className="border-b border-accent-teal/10 hover:bg-bg-light transition-colors">
                        <td className="p-3 text-text-primary">{customer.name}</td>
                        <td className="p-3 text-text-secondary">{customer.email}</td>
                        <td className="p-3 text-text-secondary">{customer.phone}</td>
                        <td className="p-3 text-text-secondary">
                          {new Date(customer.createdAt).toLocaleDateString('he-IL')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-accent-teal/30">
                      <th className="text-right p-3 text-text-primary font-semibold">כותרת</th>
                      <th className="text-right p-3 text-text-primary font-semibold">תאריך</th>
                      <th className="text-right p-3 text-text-primary font-semibold">משתתפים</th>
                      <th className="text-right p-3 text-text-primary font-semibold">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map(event => (
                      <tr key={event._id} className="border-b border-accent-teal/10 hover:bg-bg-light transition-colors">
                        <td className="p-3 text-text-primary font-medium">{event.title}</td>
                        <td className="p-3 text-text-secondary">
                          {new Date(event.startDate).toLocaleDateString('he-IL')}
                        </td>
                        <td className="p-3 text-text-secondary">{event.participants?.length || 0}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            new Date(event.endDate) >= new Date()
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {new Date(event.endDate) >= new Date() ? 'פעיל' : 'הסתיים'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-accent-teal/30">
                      <th className="text-right p-3 text-text-primary font-semibold">לקוח</th>
                      <th className="text-right p-3 text-text-primary font-semibold">שירות</th>
                      <th className="text-right p-3 text-text-primary font-semibold">תאריך ושעה</th>
                      <th className="text-right p-3 text-text-primary font-semibold">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map(apt => (
                      <tr key={apt._id} className="border-b border-accent-teal/10 hover:bg-bg-light transition-colors">
                        <td className="p-3 text-text-primary">{apt.customerName}</td>
                        <td className="p-3 text-text-secondary">{apt.serviceType}</td>
                        <td className="p-3 text-text-secondary">
                          {new Date(apt.appointmentDate).toLocaleString('he-IL')}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                            apt.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {apt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-accent-teal/30">
                      <th className="text-right p-3 text-text-primary font-semibold">לקוח</th>
                      <th className="text-right p-3 text-text-primary font-semibold">סכום</th>
                      <th className="text-right p-3 text-text-primary font-semibold">תאריך</th>
                      <th className="text-right p-3 text-text-primary font-semibold">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map(payment => (
                      <tr key={payment._id} className="border-b border-accent-teal/10 hover:bg-bg-light transition-colors">
                        <td className="p-3 text-text-primary">{payment.customerName}</td>
                        <td className="p-3 text-accent-teal font-bold">₪{payment.amount.toLocaleString()}</td>
                        <td className="p-3 text-text-secondary">
                          {new Date(payment.createdAt).toLocaleDateString('he-IL')}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SiteAdmin;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/Layout/MainLayout';
import axios from 'axios';

const SuperAdmin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [overview, setOverview] = useState({
    totalSubscribers: 0,
    totalEvents: 0,
    totalCustomers: 0,
    totalAppointments: 0,
    totalPayments: 0,
    totalRevenue: 0,
    subscribersByMonth: {}
  });
  const [subscribers, setSubscribers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const checkRes = await axios.get('/api/super-admin/check', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!checkRes.data.isSuperAdmin) {
        alert('❌ אין לך הרשאת Super Admin');
        navigate('/dashboard');
        return;
      }

      setAuthorized(true);
      fetchData();
    } catch (err) {
      console.error('Authorization check failed:', err);
      alert('שגיאה בבדיקת הרשאות');
      navigate('/dashboard');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/super-admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setOverview(response.data.overview);
      setSubscribers(response.data.subscribers);
    } catch (err) {
      console.error('Error fetching super admin data:', err);
      alert('שגיאה בטעינת נתוני Super Admin');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscribers = subscribers.filter(s =>
    filterQuery === '' ||
    s.email?.toLowerCase().includes(filterQuery.toLowerCase()) ||
    s.fullName?.toLowerCase().includes(filterQuery.toLowerCase()) ||
    s.businessName?.toLowerCase().includes(filterQuery.toLowerCase())
  );

  if (!authorized || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen bg-bg-light">
          <div className="text-xl text-text-primary">
            {loading ? 'בודק הרשאות...' : 'מאמת גישה...'}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 bg-bg-light min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-accent-teal mb-2">
            👑 Super Admin Panel
          </h1>
          <p className="text-text-secondary">
            ניהול מלא של כל בעלי העסקים והמערכת
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-bg-card border border-accent-teal/30 rounded-xl shadow-lg p-6 hover:border-accent-teal/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">בעלי עסקים רשומים</p>
                <p className="text-3xl font-bold text-accent-teal mt-1">
                  {overview.totalSubscribers}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-bg-card border border-accent-teal/30 rounded-xl shadow-lg p-6 hover:border-accent-teal/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">סה"כ אירועים במערכת</p>
                <p className="text-3xl font-bold text-accent-teal mt-1">
                  {overview.totalEvents}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            </div>
          </div>

          <div className="bg-bg-card border border-accent-teal/30 rounded-xl shadow-lg p-6 hover:border-accent-teal/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">סה"כ לקוחות במערכת</p>
                <p className="text-3xl font-bold text-accent-teal mt-1">
                  {overview.totalCustomers}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </div>

          <div className="bg-bg-card border border-accent-teal/30 rounded-xl shadow-lg p-6 hover:border-accent-teal/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">הכנסות כוללות</p>
                <p className="text-3xl font-bold text-accent-teal mt-1">
                  ₪{overview.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-bg-card rounded-xl shadow-lg border border-accent-teal/30 overflow-hidden">
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
              onClick={() => setActiveTab('subscribers')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
                activeTab === 'subscribers'
                  ? 'bg-accent-teal text-white'
                  : 'text-text-primary hover:bg-accent-teal/10'
              }`}
            >
              בעלי עסקים ({subscribers.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'subscribers' && (
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="חפש בעל עסק..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-accent-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-teal bg-white text-text-primary"
                />
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-accent-teal mb-4">
                    הרשמות חדשות לפי חודש
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(overview.subscribersByMonth)
                      .slice(-6)
                      .map(([month, count]) => (
                        <div
                          key={month}
                          className="flex items-center justify-between p-3 bg-bg-light rounded-lg"
                        >
                          <span className="text-text-primary">{month}</span>
                          <span className="font-bold text-accent-teal">
                            {count} בעלי עסקים
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-600 mb-1">תורים במערכת</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {overview.totalAppointments}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-600 mb-1">תשלומים במערכת</p>
                    <p className="text-2xl font-bold text-green-700">
                      {overview.totalPayments}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-600 mb-1">ממוצע הכנסה לעסק</p>
                    <p className="text-2xl font-bold text-purple-700">
                      ₪
                      {overview.totalSubscribers > 0
                        ? Math.round(overview.totalRevenue / overview.totalSubscribers).toLocaleString()
                        : 0}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'subscribers' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-accent-teal/30">
                      <th className="text-right p-3 text-text-primary font-semibold">
                        שם/אימייל
                      </th>
                      <th className="text-right p-3 text-text-primary font-semibold">
                        שם עסק
                      </th>
                      <th className="text-right p-3 text-text-primary font-semibold">
                        תוכנית
                      </th>
                      <th className="text-right p-3 text-text-primary font-semibold">
                        אירועים
                      </th>
                      <th className="text-right p-3 text-text-primary font-semibold">
                        לקוחות
                      </th>
                      <th className="text-right p-3 text-text-primary font-semibold">
                        תורים
                      </th>
                      <th className="text-right p-3 text-text-primary font-semibold">
                        הכנסות
                      </th>
                      <th className="text-right p-3 text-text-primary font-semibold">
                        תאריך הצטרפות
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscribers.map((sub) => (
                      <tr
                        key={sub.id}
                        className="border-b border-accent-teal/10 hover:bg-bg-light transition-colors"
                      >
                        <td className="p-3 text-text-primary">
                          <div>
                            <div className="font-medium">{sub.fullName}</div>
                            <div className="text-xs text-text-secondary">
                              {sub.email}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-text-secondary">
                          {sub.businessName || '-'}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              sub.plan === 'pro'
                                ? 'bg-purple-100 text-purple-800'
                                : sub.plan === 'premium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {sub.plan}
                          </span>
                        </td>
                        <td className="p-3 text-center text-text-primary">
                          {sub.stats.events}
                        </td>
                        <td className="p-3 text-center text-text-primary">
                          {sub.stats.customers}
                        </td>
                        <td className="p-3 text-center text-text-primary">
                          {sub.stats.appointments}
                        </td>
                        <td className="p-3 text-accent-teal font-bold">
                          ₪{sub.stats.revenue.toLocaleString()}
                        </td>
                        <td className="p-3 text-text-secondary">
                          {new Date(sub.createdAt).toLocaleDateString('he-IL')}
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

export default SuperAdmin;

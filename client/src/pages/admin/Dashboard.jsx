import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../components/Layout/MainLayout';
import { statsAPI } from '../../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await statsAPI.getDashboard();
      setStats(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('שגיאה בטעינת סטטיסטיקות');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  };

  const getLocation = (location) => {
    if (!location) return 'לא צוין';
    if (typeof location === 'string') return location;
    if (location.address?.street) return location.address.street;
    if (location.address) return 'כתובת זמינה';
    return 'לא צוין';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8 flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-400">טוען נתונים...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8">
        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-500 rounded-2xl shadow-2xl shadow-yellow-500/30 p-8 mb-8 text-black">
          <h2 className="text-3xl font-bold mb-2">ברוך הבא לדאשבורד! 👑</h2>
          <p className="opacity-90">מערכת ניהול אירועים ועסקים - ChatGrow</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stat Card 1 */}
          <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-600/30 rounded-xl shadow-lg shadow-yellow-500/10 p-6 hover:border-yellow-500/50 hover:shadow-xl hover:shadow-yellow-500/20 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">אירועים פעילים</span>
              <span className="text-2xl">📅</span>
            </div>
            <div className="text-3xl font-bold text-yellow-400">{stats?.overview?.activeEvents || 0}</div>
            <p className="text-xs text-gray-500 mt-1">סה"כ {stats?.overview?.totalEvents || 0} אירועים</p>
          </div>

          {/* Stat Card 2 */}
          <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-600/30 rounded-xl shadow-lg shadow-yellow-500/10 p-6 hover:border-yellow-500/50 hover:shadow-xl hover:shadow-yellow-500/20 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">לקוחות</span>
              <span className="text-2xl">👥</span>
            </div>
            <div className="text-3xl font-bold text-yellow-400">{stats?.overview?.totalCustomers || 0}</div>
            <p className="text-xs text-gray-500 mt-1">+{stats?.overview?.newCustomersWeek || 0} השבוע</p>
          </div>

          {/* Stat Card 3 */}
          <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-600/30 rounded-xl shadow-lg shadow-yellow-500/10 p-6 hover:border-yellow-500/50 hover:shadow-xl hover:shadow-yellow-500/20 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">תורים</span>
              <span className="text-2xl">📋</span>
            </div>
            <div className="text-3xl font-bold text-yellow-400">{stats?.overview?.totalAppointments || 0}</div>
            <p className="text-xs text-gray-500 mt-1">{stats?.overview?.weekAppointments || 0} השבוע</p>
          </div>

          {/* Stat Card 4 */}
          <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-600/30 rounded-xl shadow-lg shadow-yellow-500/10 p-6 hover:border-yellow-500/50 hover:shadow-xl hover:shadow-yellow-500/20 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">הכנסות משוערות</span>
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-3xl font-bold text-yellow-400">₪{stats?.overview?.totalRevenue?.toLocaleString() || 0}</div>
            <p className="text-xs text-gray-500 mt-1">החודש ₪{stats?.overview?.monthRevenue?.toLocaleString() || 0}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-600/30 rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">פעולות מהירות</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button 
              onClick={() => navigate('/events')}
              className="p-4 border-2 border-yellow-600/30 bg-black rounded-lg hover:border-yellow-500/60 hover:bg-gray-900 transition-all text-right"
            >
              <div className="text-2xl mb-2">➕</div>
              <div className="font-semibold text-yellow-400">אירוע חדש</div>
              <div className="text-xs text-gray-400 mt-1">צור אירוע חדש</div>
            </button>

            <button 
              onClick={() => navigate('/customers')}
              className="p-4 border-2 border-yellow-600/30 bg-black rounded-lg hover:border-yellow-500/60 hover:bg-gray-900 transition-all text-right"
            >
              <div className="text-2xl mb-2">👤</div>
              <div className="font-semibold text-yellow-400">לקוח חדש</div>
              <div className="text-xs text-gray-400 mt-1">הוסף לקוח</div>
            </button>

            <button 
              onClick={() => navigate('/appointments')}
              className="p-4 border-2 border-yellow-600/30 bg-black rounded-lg hover:border-yellow-500/60 hover:bg-gray-900 transition-all text-right"
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="font-semibold text-yellow-400">ניהול תורים</div>
              <div className="text-xs text-gray-400 mt-1">קבע תורים</div>
            </button>
          </div>
        </div>

        {/* Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-600/30 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">אירועים קרובים</h3>
            {stats?.upcomingEvents && stats.upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingEvents.map((event) => (
                  <div key={event._id} className="flex items-start space-x-reverse space-x-3 p-3 bg-black border border-yellow-600/20 rounded-lg hover:border-yellow-500/40 transition-all">
                    <div className="text-2xl">📅</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-400">{event.name}</h4>
                      <div className="flex items-center space-x-reverse space-x-2 mt-1 text-sm text-gray-400">
                        <span>{formatDate(event.startDateTime)}</span>
                        <span>•</span>
                        <span>{formatTime(event.startDateTime)}</span>
                      </div>
                      <div className="flex items-center space-x-reverse space-x-2 mt-1 text-xs text-gray-500">
                        <span>📍 {getLocation(event.location)}</span>
                        <span>•</span>
                        <span>👥 {event.participants}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-3">📅</div>
                <p>אין אירועים קרובים</p>
                <p className="text-sm mt-2">צור אירוע חדש כדי להתחיל</p>
              </div>
            )}
          </div>

          {/* Recent Customers */}
          <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-600/30 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">לקוחות אחרונים</h3>
            {stats?.recentCustomers && stats.recentCustomers.length > 0 ? (
              <div className="space-y-3">
                {stats.recentCustomers.map((customer) => (
                  <div key={customer._id} className="flex items-start space-x-reverse space-x-3 p-3 bg-black border border-yellow-600/20 rounded-lg hover:border-yellow-500/40 transition-all">
                    <div className="text-2xl">👤</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-400">{customer.name}</h4>
                      <div className="flex items-center space-x-reverse space-x-2 mt-1 text-sm text-gray-400">
                        <span>📱 {customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="mt-1 text-xs text-gray-500">
                          📧 {customer.email}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-gray-500">
                        הצטרף: {formatDate(customer.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-3">👥</div>
                <p>אין לקוחות עדיין</p>
                <p className="text-sm mt-2">הוסף את הלקוח הראשון שלך</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;

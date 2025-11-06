import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../components/Layout/MainLayout';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="p-8">
        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-brand-500 to-purple-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <h2 className="text-3xl font-bold mb-2">ברוך הבא לדאשבורד! 🎉</h2>
          <p className="text-purple-100">מערכת ניהול אירועים ועסקים - ChatGrow</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stat Card 1 */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">אירועים פעילים</span>
              <span className="text-2xl">📅</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">12</div>
            <p className="text-xs text-gray-500 mt-1">החודש</p>
          </div>

          {/* Stat Card 2 */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">נרשמים</span>
              <span className="text-2xl">👥</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">248</div>
            <p className="text-xs text-gray-500 mt-1">סה"כ</p>
          </div>

          {/* Stat Card 3 */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">הכנסות</span>
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">₪24,500</div>
            <p className="text-xs text-gray-500 mt-1">החודש</p>
          </div>

          {/* Stat Card 4 */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">ממוצע לאירוע</span>
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">20.7</div>
            <p className="text-xs text-gray-500 mt-1">משתתפים</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">פעולות מהירות</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button 
              onClick={() => navigate('/events')}
              className="p-4 border-2 border-brand-200 rounded-lg hover:bg-brand-50 transition-colors text-right"
            >
              <div className="text-2xl mb-2">➕</div>
              <div className="font-semibold text-gray-800">אירוע חדש</div>
              <div className="text-xs text-gray-500 mt-1">צור אירוע חדש</div>
            </button>

            <button 
              onClick={() => navigate('/customers')}
              className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-right"
            >
              <div className="text-2xl mb-2">👤</div>
              <div className="font-semibold text-gray-800">לקוח חדש</div>
              <div className="text-xs text-gray-500 mt-1">הוסף לקוח</div>
            </button>

            <button 
              onClick={() => navigate('/appointments')}
              className="p-4 border-2 border-pink-200 rounded-lg hover:bg-pink-50 transition-colors text-right"
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="font-semibold text-gray-800">ניהול תורים</div>
              <div className="text-xs text-gray-500 mt-1">קבע תורים</div>
            </button>
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">האירועים הקרובים</h3>
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">📅</div>
            <p>בקרוב - רשימת אירועים קרובים</p>
            <p className="text-sm mt-2">כאן תוצג רשימת האירועים הקרובים שלך</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;

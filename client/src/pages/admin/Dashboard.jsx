import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-reverse space-x-4">
              <h1 className="text-2xl font-bold text-brand-600">
                🎉 ChatGrow
              </h1>
              <span className="text-sm text-gray-500">דאשבורד ניהולי</span>
            </div>
            <div className="flex items-center space-x-reverse space-x-4">
              <span className="text-sm text-gray-700">
                שלום, <span className="font-semibold">{user?.email || 'משתמש'}</span>
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                התנתק
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 border-2 border-brand-200 rounded-lg hover:bg-brand-50 transition-colors text-right">
              <div className="text-2xl mb-2">➕</div>
              <div className="font-semibold text-gray-800">אירוע חדש</div>
              <div className="text-xs text-gray-500 mt-1">צור אירוע חדש</div>
            </button>

            <button className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-right">
              <div className="text-2xl mb-2">👤</div>
              <div className="font-semibold text-gray-800">לקוח חדש</div>
              <div className="text-xs text-gray-500 mt-1">הוסף לקוח</div>
            </button>

            <button className="p-4 border-2 border-pink-200 rounded-lg hover:bg-pink-50 transition-colors text-right">
              <div className="text-2xl mb-2">📋</div>
              <div className="font-semibold text-gray-800">ניהול תורים</div>
              <div className="text-xs text-gray-500 mt-1">קבע תורים</div>
            </button>

            <button className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors text-right">
              <div className="text-2xl mb-2">💳</div>
              <div className="font-semibold text-gray-800">תשלומים</div>
              <div className="text-xs text-gray-500 mt-1">ניהול חשבוניות</div>
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
      </main>
    </div>
  );
};

export default Dashboard;

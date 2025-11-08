import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../components/Layout/MainLayout';
import axios from 'axios';

const CheckSuperAdmin = () => {
  const { user } = useAuth();
  const [checkResult, setCheckResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setCheckResult({ error: 'אין token - לא מחובר' });
        setLoading(false);
        return;
      }

      const response = await axios.get('/api/super-admin/check', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCheckResult({
        isSuperAdmin: response.data.isSuperAdmin,
        currentEmail: user?.email,
        success: true
      });
    } catch (err) {
      setCheckResult({
        error: err.response?.data?.message || err.message,
        currentEmail: user?.email
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-8 bg-bg-light min-h-screen">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-accent-teal mb-6">
            🔍 בדיקת Super Admin
          </h1>

          {loading ? (
            <div className="bg-bg-card p-6 rounded-xl border border-accent-teal/30">
              <p className="text-text-primary">בודק...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-bg-card p-6 rounded-xl border border-accent-teal/30">
                <h3 className="font-bold text-accent-teal mb-4">מידע משתמש:</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">מחובר:</span>
                    <span className="font-bold text-text-primary">
                      {user ? '✅ כן' : '❌ לא'}
                    </span>
                  </div>
                  {user && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">אימייל נוכחי:</span>
                        <span className="font-bold text-accent-teal">
                          {user.email}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">שם:</span>
                        <span className="font-bold text-text-primary">
                          {user.fullName || '-'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {checkResult && (
                <div className={`p-6 rounded-xl border ${
                  checkResult.isSuperAdmin
                    ? 'bg-green-50 border-green-500'
                    : checkResult.error
                    ? 'bg-red-50 border-red-500'
                    : 'bg-yellow-50 border-yellow-500'
                }`}>
                  <h3 className="font-bold mb-4">
                    {checkResult.isSuperAdmin
                      ? '✅ סטטוס Super Admin'
                      : checkResult.error
                      ? '❌ שגיאה'
                      : '⚠️ אין הרשאה'}
                  </h3>
                  
                  {checkResult.error ? (
                    <p className="text-red-700">{checkResult.error}</p>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>האם Super Admin:</span>
                        <span className="font-bold">
                          {checkResult.isSuperAdmin ? '✅ כן' : '❌ לא'}
                        </span>
                      </div>
                      {!checkResult.isSuperAdmin && (
                        <div className="mt-4 p-4 bg-white rounded-lg">
                          <p className="text-sm text-text-secondary mb-2">
                            <strong>הסבר:</strong> האימייל שלך ({checkResult.currentEmail}) לא נמצא ברשימת Super Admin.
                          </p>
                          <p className="text-sm text-text-secondary">
                            <strong>פתרון:</strong> ודא ש-SUPER_ADMIN_EMAILS מוגדר ל: shimonc29@gmail.com
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-500 p-6 rounded-xl">
                <h3 className="font-bold text-blue-700 mb-2">💡 הוראות:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-900">
                  <li>ודא שהגדרת ב-Replit Secrets: <code className="bg-white px-2 py-1 rounded">SUPER_ADMIN_EMAILS=shimonc29@gmail.com</code></li>
                  <li>התחבר עם האימייל: <strong>shimonc29@gmail.com</strong></li>
                  <li>לחץ על כפתור הרענון למטה</li>
                </ol>
              </div>

              <button
                onClick={checkStatus}
                className="w-full bg-gradient-to-r from-accent-teal to-accent-hover text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                🔄 בדוק שוב
              </button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default CheckSuperAdmin;

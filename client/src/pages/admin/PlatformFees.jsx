import { useState, useEffect } from 'react';
import axios from 'axios';

const PlatformFees = () => {
  const [loading, setLoading] = useState(true);
  const [feeData, setFeeData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  useEffect(() => {
    checkSuperAdmin();
  }, []);

  const checkSuperAdmin = async () => {
    try {
      const token = localStorage.getItem('token');
      const checkResponse = await axios.get('/api/super-admin/check', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!checkResponse.data.isSuperAdmin) {
        window.location.href = '/admin/dashboard';
        return;
      }
      
      await fetchPlatformFees();
    } catch (error) {
      console.error('Failed to check super admin:', error);
      window.location.href = '/admin/dashboard';
    }
  };

  const fetchPlatformFees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/super-admin/platform-fees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeeData(response.data);
    } catch (error) {
      console.error('Failed to fetch platform fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-teal mx-auto"></div>
          <p className="mt-4 text-text-secondary">טוען נתוני עמלות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">עמלות פלטפורמה 💰</h1>
          <p className="text-text-secondary">ניהול ומעקב אחר עמלות חודשיות מעסקים מחוברים</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-text-secondary">הכנסות החודש</h3>
              <span className="text-2xl">📈</span>
            </div>
            <div className="text-2xl font-bold text-accent-teal">
              {formatCurrency(feeData?.summary?.currentMonthRevenue || 0)}
            </div>
            <div className="text-xs text-text-secondary mt-2">
              מ-{feeData?.summary?.onboardedBusinessCount || 0} עסקים מחוברים
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-text-secondary">הכנסות שנתיות</h3>
              <span className="text-2xl">💎</span>
            </div>
            <div className="text-2xl font-bold text-accent-teal">
              {formatCurrency(feeData?.summary?.yearlyRevenue || 0)}
            </div>
            <div className="text-xs text-text-secondary mt-2">
              {new Date().getFullYear()}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-text-secondary">עסקים פעילים</h3>
              <span className="text-2xl">🏢</span>
            </div>
            <div className="text-2xl font-bold text-accent-teal">
              {feeData?.summary?.onboardedBusinessCount || 0}
            </div>
            <div className="text-xs text-text-secondary mt-2">
              מתוך {feeData?.summary?.totalBusinessCount || 0} סה"כ
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-text-secondary">ממוצע לעסק</h3>
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-2xl font-bold text-accent-teal">
              {formatCurrency(feeData?.summary?.averageFeePerBusiness || 0)}
            </div>
            <div className="text-xs text-text-secondary mt-2">
              לחודש
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary">עמלות לפי תקופה</h2>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent"
            >
              <option value="current">החודש הנוכחי</option>
              <option value="last">החודש שעבר</option>
              <option value="year">השנה הנוכחית</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 font-semibold text-text-primary">שם העסק</th>
                  <th className="text-right py-3 px-4 font-semibold text-text-primary">אימייל</th>
                  <th className="text-right py-3 px-4 font-semibold text-text-primary">סה"כ תשלומים</th>
                  <th className="text-right py-3 px-4 font-semibold text-text-primary">עמלת 5%</th>
                  <th className="text-right py-3 px-4 font-semibold text-text-primary">העברה לעסק</th>
                  <th className="text-right py-3 px-4 font-semibold text-text-primary">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {feeData?.fees && feeData.fees.length > 0 ? (
                  feeData.fees.map((fee, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-text-primary font-medium">
                        {fee.businessName || 'לא מוגדר'}
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {fee.email || '-'}
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        {formatCurrency(fee.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-accent-teal font-bold">
                        {formatCurrency(fee.platformFee)}
                      </td>
                      <td className="py-3 px-4 text-green-600">
                        {formatCurrency(fee.businessAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          fee.invoiceSent 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {fee.invoiceSent ? '✅ חשבונית נשלחה' : '⏳ ממתין'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-text-secondary">
                      אין עמלות להצגה עבור תקופה זו
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">עסקים מחוברים</h2>
          <div className="space-y-3">
            {feeData?.onboardedBusinesses && feeData.onboardedBusinesses.length > 0 ? (
              feeData.onboardedBusinesses.map((business, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-accent-teal text-white rounded-full flex items-center justify-center font-bold mr-3">
                      {business.businessName ? business.businessName.charAt(0) : '?'}
                    </div>
                    <div>
                      <div className="font-semibold text-text-primary">
                        {business.businessName || 'לא מוגדר'}
                      </div>
                      <div className="text-sm text-text-secondary">{business.email}</div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-text-secondary">Provider ID</div>
                    <div className="font-mono text-xs text-accent-teal">
                      {business.paymentProviderId}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-text-secondary">
                אין עסקים מחוברים כרגע
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-r from-accent-teal to-accent-hover text-white rounded-lg p-6 mt-8">
          <h3 className="text-lg font-bold mb-2">💡 מידע חשוב</h3>
          <ul className="space-y-2 text-sm opacity-90">
            <li>✓ עמלה של 5% מנוכה אוטומטית מכל תשלום</li>
            <li>✓ חשבונית אוטומטית נשלחת ב-1 לכל חודש דרך Green Invoice/iCount</li>
            <li>✓ העסקים מקבלים 95% ישירות לחשבון הבנק שלהם</li>
            <li>✓ מערכת ה-CRON מטפלת בהכל אוטומטית</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PlatformFees;

import { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import axios from 'axios';

const TranzilaSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [formData, setFormData] = useState({
    businessName: '',
    businessId: '',
    contactEmail: '',
    contactPhone: '',
    fullName: ''
  });

  useEffect(() => {
    checkOnboardingStatus();
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/subscribers/subscription', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubscription(response.data);
    } catch (err) {
      console.error('Error fetching subscription:', err);
    }
  };

  const isPremium = () => {
    return subscription && ['TRIAL', 'ACTIVE'].includes(subscription.subscriptionStatus);
  };

  const checkOnboardingStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/payment-onboarding/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOnboardingStatus(response.data);
    } catch (error) {
      console.error('Failed to check status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isPremium()) {
      alert('❌ תכונה זו זמינה רק למשתמשי פרימיום. שדרג את המנוי שלך כדי להפעיל תשלומים אוטומטיים דרך Tranzila.');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      await axios.post('/api/payment-onboarding/tranzila-request', {
        ...formData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('✅ הבקשה נשלחה בהצלחה! נציג מטעמנו יצור איתך קשר בקרוב לסיום ההרשמה ל-Tranzila.');
      
      setFormData({
        businessName: '',
        businessId: '',
        contactEmail: '',
        contactPhone: '',
        fullName: ''
      });

      await checkOnboardingStatus();
    } catch (error) {
      console.error('Failed to submit request:', error);
      alert(`❌ שגיאה בשליחת הבקשה: ${error.response?.data?.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8 flex justify-center items-center min-h-screen bg-bg-light">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-text-secondary">טוען...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // אם כבר רשום ל-Tranzila
  if (onboardingStatus?.isOnboarded && onboardingStatus.tranzilaTerminal) {
    return (
      <MainLayout>
        <div className="p-8 bg-bg-light min-h-screen">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-accent-teal mb-2">⚡ הגדרות Tranzila</h1>
            <p className="text-text-primary mb-8">ניהול תשלומים אוטומטיים</p>

            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">החשבון מחובר ל-Tranzila! 🎉</h2>
                <p className="text-text-secondary mb-6">
                  תשלומים אוטומטיים פעילים
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold mb-2">מודל התשלומים שלך</h3>
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2">100%</div>
                  <div className="text-sm opacity-90">כל התשלומים הולכים ישירות לחשבון שלך!</div>
                  <div className="text-xs opacity-75 mt-2">ללא עמלת פלטפורמה - סליקה ישירה דרך הטרמינל שלך</div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">🔷 Tranzila - תשלומים ישירים</h4>
                <ul className="text-green-800 text-sm space-y-2">
                  <li>✅ כל תשלום עובר ישירות לחשבון שלך דרך הטרמינל של Tranzila</li>
                  <li>✅ 100% מהסכום - ללא ניכוי עמלת פלטפורמה</li>
                  <li>✅ הסליקה מתבצעת דרך הטרמינל האישי שלך</li>
                  <li>✅ ניהול מלא של התשלומים במערכת Tranzila שלך</li>
                  <li>✅ חשבוניות וקבלות אוטומטיות</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-green-300">
                  <p className="text-sm text-green-900">
                    <strong>מספר טרמינל:</strong> {onboardingStatus.tranzilaTerminal}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // טופס הרשמה
  return (
    <MainLayout>
      <div className="p-8 bg-bg-light min-h-screen">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-accent-teal mb-2">⚡ הגדרות Tranzila</h1>
          <p className="text-text-primary mb-8">
            {isPremium() 
              ? 'הפעל תשלומים אוטומטיים דרך Tranzila - 100% לחשבונך!'
              : 'תשלומים אוטומטיים זמינים רק למשתמשי פרימיום'}
          </p>

          {!isPremium() && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <div className="flex items-start">
                <span className="text-3xl ml-4">🔒</span>
                <div>
                  <h3 className="font-bold text-yellow-900 mb-2">פיצ'ר פרימיום</h3>
                  <p className="text-yellow-800 text-sm mb-4">
                    תשלומים אוטומטיים דרך Tranzila זמינים רק למשתמשי פרימיום.
                    שדרג את המנוי שלך כדי להפעיל תכונה זו!
                  </p>
                  <a 
                    href="/admin/subscription"
                    className="inline-block bg-accent-teal text-white px-6 py-2 rounded-lg font-semibold hover:bg-accent-hover transition-all"
                  >
                    🚀 שדרג לפרימיום
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-text-primary mb-2">הרשמה ל-Tranzila 💳</h2>
              <p className="text-text-secondary">
                קבל 100% מהתשלומים ישירות לחשבונך - ללא עמלת פלטפורמה!
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6 mb-8">
              <h3 className="text-xl font-bold mb-4">למה Tranzila?</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-4xl mb-2">💯</div>
                  <div className="text-sm font-semibold mb-1">100% שלך</div>
                  <div className="text-xs opacity-90">כל התשלומים ישירות לחשבונך</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-2">🚫</div>
                  <div className="text-sm font-semibold mb-1">ללא עמלות</div>
                  <div className="text-xs opacity-90">אין עמלת פלטפורמה - רק עמלת Tranzila</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-2">🔒</div>
                  <div className="text-sm font-semibold mb-1">מאובטח</div>
                  <div className="text-xs opacity-90">סליקה ישירה דרך הטרמינל שלך</div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-2">📝 טופס בקשה להרשמה ל-Tranzila</h4>
              <p className="text-sm text-blue-800">
                מלא את הפרטים ונציג מטעמנו יצור איתך קשר לסיום תהליך ההרשמה והפעלת החשבון
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  שם מלא <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="שם מלא של איש הקשר"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent"
                  disabled={!isPremium()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  שם העסק <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="שם העסק שלך"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent"
                  disabled={!isPremium()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  ח.פ / ע.מ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.businessId}
                  onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
                  placeholder="מספר עוסק מורשה או חברה"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent"
                  disabled={!isPremium()}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    אימייל ליצירת קשר <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent"
                    disabled={!isPremium()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    טלפון ליצירת קשר <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="050-1234567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent"
                    disabled={!isPremium()}
                  />
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">✅ יתרונות Tranzila:</h4>
                <ul className="text-green-800 text-sm space-y-1">
                  <li>• עמלת סליקה נמוכה</li>
                  <li>• חשבוניות וקבלות אוטומטיות</li>
                  <li>• תשלומים ישירים לחשבון הבנק שלך</li>
                  <li>• תמיכה טכנית מלאה</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={saving || !isPremium()}
                className="w-full bg-gradient-to-r from-accent-teal to-accent-hover text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '🔄 שולח...' : '📤 שלח בקשה להרשמה'}
              </button>

              <p className="text-xs text-text-secondary text-center">
                * לאחר שליחת הבקשה, נציג מטעמנו יצור איתך קשר תוך 1-2 ימי עסקים
              </p>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default TranzilaSettings;

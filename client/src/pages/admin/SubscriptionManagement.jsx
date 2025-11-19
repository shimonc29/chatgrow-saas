import { useState, useEffect } from 'react';
import axios from 'axios';

const SubscriptionManagement = () => {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/subscribers/subscription', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubscription(response.data);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeToPremium = async () => {
    try {
      setUpgrading(true);
      
      // כאן יתווסף API call לטרנזילה שייצור עמוד תשלום חוזר (₪99/חודש)
      // לאחר הרשמה מוצלחת לתשלום חוזר, המשתמש יעודכן לסטטוס ACTIVE
      
      alert('🚧 אינטגרציה עם טרנזילה בבנייה\n\nבקרוב תוכל לשדרג למנוי פרימיום בתשלום חוזר של ₪99/חודש כולל מע״מ דרך טרנזילה.\n\nאחרי אישור התשלום, המנוי שלך ישודרג אוטומטית לפרימיום! 🚀');
    } catch (error) {
      console.error('Upgrade failed:', error);
      alert('❌ שגיאה בתהליך השדרוג. נסה שוב מאוחר יותר.');
    } finally {
      setUpgrading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      FREE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'חינם' },
      TRIAL: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'נסיון' },
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'פעיל' },
      SUSPENDED: { bg: 'bg-red-100', text: 'text-red-800', label: 'מושעה' }
    };
    const badge = badges[status] || badges.FREE;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const calculateProgress = () => {
    if (!subscription) return 0;
    const { currentCustomerCount = 0, maxCustomers = 200 } = subscription;
    return Math.min((currentCustomerCount / maxCustomers) * 100, 100);
  };

  const isPremium = () => {
    return subscription && ['TRIAL', 'ACTIVE'].includes(subscription.subscriptionStatus);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-teal mx-auto"></div>
          <p className="mt-4 text-text-secondary">טוען...</p>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();
  const premiumStatus = isPremium();

  return (
    <div className="min-h-screen bg-bg-light p-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">המנוי שלי 📋</h1>
          <p className="text-text-secondary">נהל את המנוי ואת מגבלות השימוש שלך</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">סטטוס מנוי</h3>
              <span className="text-2xl">👑</span>
            </div>
            {getStatusBadge(subscription?.subscriptionStatus || 'FREE')}
            <div className="mt-4 text-sm text-text-secondary">
              {premiumStatus ? 'מנוי פרימיום פעיל' : 'מנוי חינמי'}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">מספר לקוחות</h3>
              <span className="text-2xl">👥</span>
            </div>
            <div className="text-3xl font-bold text-accent-teal">
              {subscription?.currentCustomerCount || 0}
              <span className="text-lg text-text-secondary">
                /{subscription?.maxCustomers || 200}
              </span>
            </div>
            <div className="mt-2 text-sm text-text-secondary">
              לקוחות פעילים
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">אחוז שימוש</h3>
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-3xl font-bold text-accent-teal">
              {Math.round(progress)}%
            </div>
            <div className="mt-2 text-sm text-text-secondary">
              מהמכסה החודשית
            </div>
          </div>
        </div>

        {!premiumStatus && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-text-primary">
                  מגבלת לקוחות ({subscription?.currentCustomerCount || 0}/{subscription?.maxCustomers || 200})
                </span>
                <span className="text-sm text-text-secondary">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    progress >= 90 ? 'bg-red-500' : progress >= 70 ? 'bg-yellow-500' : 'bg-accent-teal'
                  }`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            {progress >= 90 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm font-medium">
                  ⚠️ התקרבת למגבלת הלקוחות! שדרג לפרימיום כדי להמשיך לצמוח.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center">
              <span className="text-2xl mr-2">🆓</span>
              מנוי חינמי
            </h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-text-secondary">עד 200 לקוחות</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-text-secondary">ניהול אירועים ופגישות</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-text-secondary">תשלומים וחשבוניות</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-text-secondary">דוחות בסיסיים</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-text-secondary">יומן פנימי בתוכנה</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                <span className="text-text-secondary line-through">חיבור ליומן Google Calendar</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                <span className="text-text-secondary line-through">תזכורות SMS</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                <span className="text-text-secondary line-through">דוחות מלאים</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                <span className="text-text-secondary line-through">תשלומים אוטומטיים מטרנזילה</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                <span className="text-text-secondary line-through">מאמן ביצועים AI</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                <span className="text-text-secondary line-through">המלצות AI לתמחור ותזמון</span>
              </li>
            </ul>
            {!premiumStatus && (
              <div className="text-center text-2xl font-bold text-accent-teal">
                ₪0/חודש
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-accent-teal to-accent-hover rounded-lg shadow-lg p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <span className="text-2xl mr-2">⭐</span>
                מנוי פרימיום
              </h3>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span className="font-medium">לקוחות בלתי מוגבלים</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>כל התכונות של התוכנית החינמית</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>תשלומים אוטומטיים דרך Tranzila</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>חשבוניות וקבלות אוטומטיות</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>חיבור ליומן Google Calendar</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>תזכורות SMS ללקוחות</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>דוחות מלאים והיסטוריה מורחבת</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>תמיכה טכנית מהירה</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🤖</span>
                  <span className="font-medium">מאמן ביצועים AI</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🤖</span>
                  <span>המלצות AI לתמחור ותזמון אירועים</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🤖</span>
                  <span>אופטימיזציה של שיעורי המרה</span>
                </li>
              </ul>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">₪99/חודש</div>
                <p className="text-white text-sm mb-3 opacity-90">כולל מע"מ • תשלום חוזר דרך Tranzila</p>
                {!premiumStatus ? (
                  <button 
                    onClick={handleUpgradeToPremium}
                    disabled={upgrading}
                    className="w-full bg-white text-accent-teal py-3 px-6 rounded-lg font-semibold hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {upgrading ? '⏳ מעבד...' : '🚀 שדרג עכשיו'}
                  </button>
                ) : (
                  <div className="bg-white bg-opacity-20 py-3 px-6 rounded-lg font-semibold">
                    ✅ המנוי שלך פעיל
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {premiumStatus && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6">
            <div className="flex items-start">
              <span className="text-3xl ml-4">🎉</span>
              <div>
                <h4 className="font-bold text-green-900 mb-2">אתה נהנה ממנוי פרימיום!</h4>
                <p className="text-green-800 text-sm mb-2">
                  יש לך גישה מלאה לכל התכונות המתקדמות של ChatGrow.
                </p>
                <ul className="text-green-700 text-sm space-y-1">
                  <li>✓ לקוחות בלתי מוגבלים</li>
                  <li>✓ תשלומים אוטומטיים דרך Tranzila</li>
                  <li>✓ חשבוניות וקבלות אוטומטיות</li>
                  <li>✓ חיבור ליומן Google Calendar</li>
                  <li>✓ תזכורות SMS</li>
                  <li>✓ תמיכה טכנית מהירה</li>
                  <li>🤖 מאמן ביצועים AI עם המלצות חכמות</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManagement;

import { useState, useEffect } from 'react';
import axios from 'axios';

const PaymentOnboarding = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('cardcom');
  const [formData, setFormData] = useState({
    partnerAccountId: '',
    businessName: '',
    businessId: '',
    contactEmail: '',
    contactPhone: '',
    tranzilaTerminal: ''
  });

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

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
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.post('/api/payment-onboarding/register', {
        provider: selectedProvider,
        ...formData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const successMessage = selectedProvider === 'tranzila' 
        ? '✅ ההרשמה ל-Tranzila הושלמה בהצלחה! עכשיו תוכל לקבל 100% מהתשלומים ישירות לחשבון שלך ללא עמלת פלטפורמה!'
        : '✅ ההרשמה הושלמה בהצלחה! עכשיו תוכל לקבל 95% מהתשלומים ישירות לחשבון שלך.';
      alert(successMessage);
      await checkOnboardingStatus();
    } catch (error) {
      console.error('Failed to register:', error);
      alert(`❌ שגיאה בהרשמה: ${error.response?.data?.message || error.message}`);
    } finally {
      setSaving(false);
    }
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

  if (onboardingStatus?.isOnboarded) {
    const isTranzila = onboardingStatus.provider === 'tranzila' || !!onboardingStatus.tranzilaTerminal;
    const providerName = onboardingStatus.provider === 'cardcom' ? 'Cardcom' : 
                        onboardingStatus.provider === 'grow' ? 'GROW' : 'Tranzila';

    return (
      <div className="min-h-screen bg-bg-light p-8" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">ההרשמה הושלמה בהצלחה! 🎉</h2>
              <p className="text-text-secondary mb-6">
                החשבון שלך מחובר ל-{providerName}
              </p>
              
              {isTranzila ? (
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-bold mb-2">מודל התשלומים שלך - Tranzila</h3>
                  <div className="text-center">
                    <div className="text-5xl font-bold mb-2">100%</div>
                    <div className="text-sm opacity-90">כל התשלומים הולכים ישירות לחשבון שלך!</div>
                    <div className="text-xs opacity-75 mt-2">ללא עמלת פלטפורמה - סליקה ישירה דרך הטרמינל שלך</div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-accent-teal to-accent-hover text-white rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-bold mb-2">מודל התשלומים שלך</h3>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-4xl font-bold">95%</div>
                      <div className="text-sm opacity-90">הולך לחשבון שלך</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold">5%</div>
                      <div className="text-sm opacity-90">עמלת פלטפורמה</div>
                    </div>
                  </div>
                </div>
              )}

              {isTranzila ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-right">
                  <h4 className="font-semibold text-green-900 mb-2">🔷 Tranzila - תשלומים ישירים</h4>
                  <ul className="text-green-800 text-sm space-y-2">
                    <li>✅ כל תשלום עובר ישירות לחשבון שלך דרך הטרמינל של Tranzila</li>
                    <li>✅ 100% מהסכום - ללא ניכוי עמלת פלטפורמה</li>
                    <li>✅ הסליקה מתבצעת דרך הטרמינל האישי שלך</li>
                    <li>✅ ניהול מלא של התשלומים במערכת Tranzila שלך</li>
                  </ul>
                  <div className="mt-4 pt-4 border-t border-green-300">
                    <p className="text-sm text-green-900">
                      <strong>מספר טרמינל:</strong> {onboardingStatus.tranzilaTerminal}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-right">
                  <h4 className="font-semibold text-blue-900 mb-2">📋 מידע חשוב:</h4>
                  <ul className="text-blue-800 text-sm space-y-2">
                    <li>✅ כל תשלום יעבור דרך {providerName}</li>
                    <li>✅ 95% מהסכום יועבר ישירות לחשבון הבנק שלך</li>
                    <li>✅ 5% עמלת פלטפורמה תנוכה אוטומטית</li>
                    <li>✅ תקבל חשבונית חודשית על העמלות ב-1 לכל חודש</li>
                  </ul>
                  <div className="mt-4 pt-4 border-t border-blue-300">
                    <p className="text-sm text-blue-900">
                      <strong>מזהה חשבון:</strong> {onboardingStatus.paymentProviderId}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">הרשמה למערכת תשלומים 💳</h1>
            <p className="text-text-secondary">
              בחר את ספק התשלומים המועדף עליך - קבל 95% (Cardcom/GROW) או 100% (Tranzila) מהתשלומים
            </p>
          </div>

          <div className="bg-gradient-to-r from-accent-teal to-accent-hover text-white rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">איך זה עובד?</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-4xl mb-2">1️⃣</div>
                <div className="text-sm font-semibold mb-1">הרשמה</div>
                <div className="text-xs opacity-90">מלא את הפרטים ותפתח חשבון partner</div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">2️⃣</div>
                <div className="text-sm font-semibold mb-1">קבלת תשלומים</div>
                <div className="text-xs opacity-90">הלקוחות משלמים דרך הפלטפורמה</div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">3️⃣</div>
                <div className="text-sm font-semibold mb-1">העברה אוטומטית</div>
                <div className="text-xs opacity-90">95% מועבר ישירות לחשבונך</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                בחר ספק תשלומים
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedProvider('cardcom')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedProvider === 'cardcom'
                      ? 'border-accent-teal bg-accent-teal bg-opacity-10'
                      : 'border-gray-300 hover:border-accent-teal'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">💳</div>
                    <div className="font-semibold">Cardcom</div>
                    <div className="text-xs text-text-secondary mt-1">ספק תשלומים מוביל</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProvider('grow')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedProvider === 'grow'
                      ? 'border-accent-teal bg-accent-teal bg-opacity-10'
                      : 'border-gray-300 hover:border-accent-teal'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🌱</div>
                    <div className="font-semibold">GROW (Meshulam)</div>
                    <div className="text-xs text-text-secondary mt-1">פתרון תשלומים מתקדם</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProvider('tranzila')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedProvider === 'tranzila'
                      ? 'border-accent-teal bg-accent-teal bg-opacity-10'
                      : 'border-gray-300 hover:border-accent-teal'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🔷</div>
                    <div className="font-semibold">Tranzila</div>
                    <div className="text-xs text-text-secondary mt-1">ללא עמלת פלטפורמה</div>
                  </div>
                </button>
              </div>
            </div>

            {selectedProvider === 'tranzila' ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">🔗 הרשמה ל-Tranzila Affiliate</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    עליך להירשם דרך קישור האפיליאייט של ChatGrow כדי לקבל טרמינל משלך:
                  </p>
                  <a
                    href="https://www.tranzila.com/affiliate/chatgrow"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                  >
                    🚀 לחץ כאן להרשמה ב-Tranzila
                  </a>
                  <p className="text-xs text-blue-700 mt-2">
                    לאחר ההרשמה תקבל מספר טרמינל - הזן אותו למטה
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    מספר טרמינל Tranzila <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tranzilaTerminal}
                    onChange={(e) => setFormData({ ...formData, tranzilaTerminal: e.target.value })}
                    placeholder="הזן את מספר הטרמינל שקיבלת מ-Tranzila"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent"
                  />
                  <p className="text-xs text-text-secondary mt-1">
                    מספר הטרמינל נמצא במייל האישור שקיבלת מ-Tranzila
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  מזהה חשבון Partner <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.partnerAccountId}
                  onChange={(e) => setFormData({ ...formData, partnerAccountId: e.target.value })}
                  placeholder="הזן את מזהה ה-Partner Account שקיבלת מהספק"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent"
                />
                <p className="text-xs text-text-secondary mt-1">
                  צריך להירשם קודם ב-{selectedProvider === 'cardcom' ? 'Cardcom' : 'GROW'} ולקבל Partner Account ID
                </p>
              </div>
            )}

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
                />
              </div>
            </div>

            {selectedProvider === 'tranzila' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">✅ יתרונות Tranzila:</h4>
                <ul className="text-green-800 text-sm space-y-1">
                  <li>• <strong>ללא עמלת פלטפורמה</strong> - 100% מהתשלומים אליך</li>
                  <li>• כל הכסף עובר ישירות לחשבון הבנק שלך</li>
                  <li>• אין פיצול תשלומים - סליקה ישירה דרך הטרמינל שלך</li>
                  <li>• התשלומים מנוהלים במערכת Tranzila שלך</li>
                </ul>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">⚠️ לתשומת ליבך:</h4>
                <ul className="text-yellow-800 text-sm space-y-1">
                  <li>• יש להירשם קודם ב-{selectedProvider === 'cardcom' ? 'Cardcom' : 'GROW'} כ-Partner</li>
                  <li>• עמלת הפלטפורמה היא 5% מכל תשלום</li>
                  <li>• תקבל חשבונית חודשית אוטומטית</li>
                  <li>• ההרשמה כפופה לאישור ספק התשלומים</li>
                </ul>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-accent-teal to-accent-hover text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'שומר...' : selectedProvider === 'tranzila' ? '✅ השלם הרשמה וקבל 100% מהתשלומים' : '✅ השלם הרשמה וקבל 95% מהתשלומים'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentOnboarding;

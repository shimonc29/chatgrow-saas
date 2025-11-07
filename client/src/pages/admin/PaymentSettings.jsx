import { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import axios from 'axios';

const PaymentSettings = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [settings, setSettings] = useState({
    meshulam: {
      enabled: false,
      pageCode: '',
      apiKey: '',
      apiPassword: ''
    },
    cardcom: {
      enabled: false,
      terminalNumber: '',
      apiUsername: '',
      apiPassword: ''
    },
    tranzila: {
      enabled: false,
      terminalName: '',
      apiKey: ''
    }
  });

  const handleProviderChange = (provider, field, value) => {
    setSettings(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
    setSuccess('');
    setError('');
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // לעת עתה, נשמור בלוקל סטורג' (אפשר להעביר ל-API מאוחר יותר)
      localStorage.setItem('paymentProviderSettings', JSON.stringify(settings));
      setSuccess('✅ ההגדרות נשמרו בהצלחה!');
      
      // אפשרות לעתיד: שמירה בשרת
      // await axios.post('/api/settings/payment-providers', settings);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('❌ שגיאה בשמירת ההגדרות');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // טעינת הגדרות קיימות
    const saved = localStorage.getItem('paymentProviderSettings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }, []);

  return (
    <MainLayout>
      <div className="p-8 bg-bg-light min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-accent-teal">הגדרות שירותי תשלום</h1>
          <p className="text-text-primary mt-2">הגדר את חיבורי שערי התשלום שלך</p>
        </div>

        {success && (
          <div className="bg-bg-light border border-accent-teal/50 text-accent-teal px-4 py-3 rounded-lg mb-6 shadow-lg shadow-accent-teal/20">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-bg-light border border-red-600/50 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Meshulam (GROW) */}
          <div className="bg-bg-light border border-accent-teal/30 rounded-xl shadow-lg p-6 hover:border-accent-teal/50 hover:shadow-accent-teal/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-reverse space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-accent-teal to-accent-hover rounded-lg flex items-center justify-center">
                  <span className="text-black text-2xl">🌱</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-accent-teal">GROW by Meshulam</h3>
                  <p className="text-sm text-text-secondary">שער תשלום ישראלי מוביל</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.meshulam.enabled}
                  onChange={(e) => handleProviderChange('meshulam', 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-teal/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
              </label>
            </div>

            {settings.meshulam.enabled && (
              <div className="space-y-4 mt-6">
                <div>
                  <label className="block text-accent-teal font-medium mb-2">
                    Page Code (מזהה עסק)
                  </label>
                  <input
                    type="text"
                    value={settings.meshulam.pageCode}
                    onChange={(e) => handleProviderChange('meshulam', 'pageCode', e.target.value)}
                    placeholder="הזן את ה-Page Code מחשבון Meshulam"
                    className="w-full px-4 py-2 bg-bg-light border border-accent-teal/30 text-white rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-accent-teal font-medium mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={settings.meshulam.apiKey}
                    onChange={(e) => handleProviderChange('meshulam', 'apiKey', e.target.value)}
                    placeholder="הזן את מפתח ה-API"
                    className="w-full px-4 py-2 bg-bg-light border border-accent-teal/30 text-white rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-accent-teal font-medium mb-2">
                    API Password (סיסמה)
                  </label>
                  <input
                    type="password"
                    value={settings.meshulam.apiPassword}
                    onChange={(e) => handleProviderChange('meshulam', 'apiPassword', e.target.value)}
                    placeholder="הזן את סיסמת ה-API"
                    className="w-full px-4 py-2 bg-bg-light border border-accent-teal/30 text-white rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent placeholder-gray-500"
                  />
                </div>
                <div className="bg-black/50 border border-accent-teal/30 text-text-primary px-4 py-3 rounded-lg text-sm">
                  💡 <strong className="text-accent-teal">איפה למצוא?</strong> היכנס לחשבון Meshulam שלך → הגדרות → API Credentials
                  <br />
                  📚 <a href="https://grow-il.readme.io/" target="_blank" rel="noopener noreferrer" className="text-accent-teal underline font-semibold hover:text-accent-teal/80">מדריך אינטגרציה מלא</a>
                </div>
              </div>
            )}
          </div>

          {/* Cardcom */}
          <div className="bg-bg-light border border-accent-teal/30 rounded-xl shadow-lg p-6 hover:border-accent-teal/50 hover:shadow-accent-teal/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-reverse space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-accent-teal to-accent-hover rounded-lg flex items-center justify-center">
                  <span className="text-black text-2xl">💳</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-accent-teal">Cardcom</h3>
                  <p className="text-sm text-text-secondary">שער תשלום לכרטיסי אשראי</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.cardcom.enabled}
                  onChange={(e) => handleProviderChange('cardcom', 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-teal/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
              </label>
            </div>

            {settings.cardcom.enabled && (
              <div className="space-y-4 mt-6">
                <div>
                  <label className="block text-accent-teal font-medium mb-2">
                    Terminal Number
                  </label>
                  <input
                    type="text"
                    value={settings.cardcom.terminalNumber}
                    onChange={(e) => handleProviderChange('cardcom', 'terminalNumber', e.target.value)}
                    placeholder="מספר טרמינל"
                    className="w-full px-4 py-2 bg-bg-light border border-accent-teal/30 text-white rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-accent-teal font-medium mb-2">
                    API Username
                  </label>
                  <input
                    type="text"
                    value={settings.cardcom.apiUsername}
                    onChange={(e) => handleProviderChange('cardcom', 'apiUsername', e.target.value)}
                    placeholder="שם משתמש API"
                    className="w-full px-4 py-2 bg-bg-light border border-accent-teal/30 text-white rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-accent-teal font-medium mb-2">
                    API Password
                  </label>
                  <input
                    type="password"
                    value={settings.cardcom.apiPassword}
                    onChange={(e) => handleProviderChange('cardcom', 'apiPassword', e.target.value)}
                    placeholder="סיסמת API"
                    className="w-full px-4 py-2 bg-bg-light border border-accent-teal/30 text-white rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent placeholder-gray-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tranzila */}
          <div className="bg-bg-light border border-accent-teal/30 rounded-xl shadow-lg p-6 hover:border-accent-teal/50 hover:shadow-accent-teal/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-reverse space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-accent-teal to-accent-hover rounded-lg flex items-center justify-center">
                  <span className="text-black text-2xl">⚡</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-accent-teal">Tranzila</h3>
                  <p className="text-sm text-text-secondary">פתרון תשלומים מהיר</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.tranzila.enabled}
                  onChange={(e) => handleProviderChange('tranzila', 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-teal/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
              </label>
            </div>

            {settings.tranzila.enabled && (
              <div className="space-y-4 mt-6">
                <div>
                  <label className="block text-accent-teal font-medium mb-2">
                    Terminal Name
                  </label>
                  <input
                    type="text"
                    value={settings.tranzila.terminalName}
                    onChange={(e) => handleProviderChange('tranzila', 'terminalName', e.target.value)}
                    placeholder="שם טרמינל"
                    className="w-full px-4 py-2 bg-bg-light border border-accent-teal/30 text-white rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-accent-teal font-medium mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={settings.tranzila.apiKey}
                    onChange={(e) => handleProviderChange('tranzila', 'apiKey', e.target.value)}
                    placeholder="מפתח API"
                    className="w-full px-4 py-2 bg-bg-light border border-accent-teal/30 text-white rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent placeholder-gray-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-gradient-to-r from-accent-teal to-accent-hover text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent-teal/50 hover:shadow-accent-teal/70"
          >
            {loading ? '⏳ שומר...' : '💾 שמור הגדרות'}
          </button>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-bg-light border border-accent-teal/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-accent-teal mb-4">📖 איך להשיג פרטי API?</h3>
          <div className="space-y-3 text-sm text-text-primary">
            <div className="flex items-start space-x-reverse space-x-2">
              <span className="font-bold text-accent-teal">🌱 GROW (Meshulam):</span>
              <span>פנה למחלקת התמיכה של Meshulam או היכנס לפאנל הניהול שלך → הגדרות → API</span>
            </div>
            <div className="flex items-start space-x-reverse space-x-2">
              <span className="font-bold text-accent-teal">💳 Cardcom:</span>
              <span>צור קשר עם נציג Cardcom לקבלת פרטי API או גש לאזור האישי</span>
            </div>
            <div className="flex items-start space-x-reverse space-x-2">
              <span className="font-bold text-accent-teal">⚡ Tranzila:</span>
              <span>פנה לתמיכה של Tranzila או היכנס לממשק הניהול שלך</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PaymentSettings;

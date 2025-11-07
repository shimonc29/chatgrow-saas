import { useState, useEffect } from 'react';
import axios from 'axios';

const ProviderSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('email');
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/provider-settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.put('/api/provider-settings', settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ ההגדרות נשמרו בהצלחה!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('❌ שגיאה בשמירת ההגדרות');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      alert('נא להזין כתובת אימייל');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/provider-settings/test-email', 
        { testEmail },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      alert(`✅ ${response.data.message}`);
    } catch (error) {
      alert(`❌ שגיאה: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleTestSMS = async () => {
    if (!testPhone) {
      alert('נא להזין מספר טלפון');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/provider-settings/test-sms', 
        { testPhone },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      alert(`✅ ${response.data.message}`);
    } catch (error) {
      alert(`❌ שגיאה: ${error.response?.data?.error || error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-app-navy via-card-navy to-app-navy flex items-center justify-center">
        <div className="text-accent-copper text-2xl">⏳ טוען הגדרות...</div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-app-navy via-card-navy to-app-navy p-8 rtl">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-accent-copper mb-2">
            ⚙️ הגדרות ספקים
          </h1>
          <p className="text-text-subtle">
            הגדר את ספקי האימייל, SMS ותשלום שלך
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-accent-copper/30">
          {[
            { id: 'email', label: '📧 אימייל', icon: '📧' },
            { id: 'sms', label: '📱 SMS', icon: '📱' },
            { id: 'payment', label: '💳 תשלום', icon: '💳' },
            { id: 'invoice', label: '🧾 חשבוניות', icon: '🧾' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === tab.id
                  ? 'text-accent-copper border-b-2 border-accent-copper'
                  : 'text-text-subtle hover:text-accent-copper'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Email Settings */}
        {activeTab === 'email' && (
          <div className="bg-card-navy border border-accent-copper/30 rounded-lg p-6 shadow-lg shadow-accent-copper/10">
            <h2 className="text-2xl font-bold text-accent-copper mb-4">📧 הגדרות אימייל</h2>
            
            <div className="mb-6">
              <label className="block text-text-light mb-2">סוג ספק</label>
              <select
                value={settings.emailProvider.type}
                onChange={(e) => setSettings({
                  ...settings,
                  emailProvider: { ...settings.emailProvider, type: e.target.value }
                })}
                className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
              >
                <option value="none">ללא</option>
                <option value="sendgrid">SendGrid</option>
                <option value="smtp">SMTP</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-2 text-text-light">
                <input
                  type="checkbox"
                  checked={settings.emailProvider.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    emailProvider: { ...settings.emailProvider, enabled: e.target.checked }
                  })}
                  className="w-5 h-5"
                />
                <span>הפעל שליחת אימייל</span>
              </label>
            </div>

            {settings.emailProvider.type === 'sendgrid' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-text-light mb-2">SendGrid API Key</label>
                  <input
                    type="password"
                    value={settings.emailProvider.sendgrid.apiKey || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      emailProvider: {
                        ...settings.emailProvider,
                        sendgrid: { ...settings.emailProvider.sendgrid, apiKey: e.target.value }
                      }
                    })}
                    className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                    placeholder="SG.xxxxxxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-text-light mb-2">כתובת אימייל שולח</label>
                  <input
                    type="email"
                    value={settings.emailProvider.sendgrid.fromEmail || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      emailProvider: {
                        ...settings.emailProvider,
                        sendgrid: { ...settings.emailProvider.sendgrid, fromEmail: e.target.value }
                      }
                    })}
                    className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                    placeholder="noreply@yourdomain.com"
                  />
                </div>
                <div>
                  <label className="block text-text-light mb-2">שם שולח</label>
                  <input
                    type="text"
                    value={settings.emailProvider.sendgrid.fromName || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      emailProvider: {
                        ...settings.emailProvider,
                        sendgrid: { ...settings.emailProvider.sendgrid, fromName: e.target.value }
                      }
                    })}
                    className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                    placeholder="העסק שלי"
                  />
                </div>
              </div>
            )}

            {settings.emailProvider.type === 'smtp' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-text-light mb-2">SMTP Host</label>
                  <input
                    type="text"
                    value={settings.emailProvider.smtp.host || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      emailProvider: {
                        ...settings.emailProvider,
                        smtp: { ...settings.emailProvider.smtp, host: e.target.value }
                      }
                    })}
                    className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-text-light mb-2">SMTP Port</label>
                  <input
                    type="number"
                    value={settings.emailProvider.smtp.port || 587}
                    onChange={(e) => setSettings({
                      ...settings,
                      emailProvider: {
                        ...settings.emailProvider,
                        smtp: { ...settings.emailProvider.smtp, port: Number(e.target.value) }
                      }
                    })}
                    className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                  />
                </div>
                <div>
                  <label className="block text-text-light mb-2">Username</label>
                  <input
                    type="text"
                    value={settings.emailProvider.smtp.username || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      emailProvider: {
                        ...settings.emailProvider,
                        smtp: { ...settings.emailProvider.smtp, username: e.target.value }
                      }
                    })}
                    className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                  />
                </div>
                <div>
                  <label className="block text-text-light mb-2">Password</label>
                  <input
                    type="password"
                    value={settings.emailProvider.smtp.password || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      emailProvider: {
                        ...settings.emailProvider,
                        smtp: { ...settings.emailProvider.smtp, password: e.target.value }
                      }
                    })}
                    className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                  />
                </div>
              </div>
            )}

            {/* Test Email */}
            <div className="mt-6 pt-6 border-t border-accent-copper/30">
              <h3 className="text-lg font-semibold text-accent-copper mb-3">בדיקת תצורה</h3>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  className="flex-1 bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                />
                <button
                  onClick={handleTestEmail}
                  className="bg-gradient-to-r from-action-blue to-accent-copper text-white px-6 py-3 rounded font-semibold hover:shadow-lg hover:shadow-action-blue/50 transition-all"
                >
                  שלח בדיקה
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SMS Settings */}
        {activeTab === 'sms' && (
          <div className="bg-card-navy border border-accent-copper/30 rounded-lg p-6 shadow-lg shadow-accent-copper/10">
            <h2 className="text-2xl font-bold text-accent-copper mb-4">📱 הגדרות SMS</h2>
            
            <div className="mb-6">
              <label className="block text-text-light mb-2">סוג ספק</label>
              <select
                value={settings.smsProvider.type}
                onChange={(e) => setSettings({
                  ...settings,
                  smsProvider: { ...settings.smsProvider, type: e.target.value }
                })}
                className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
              >
                <option value="none">ללא</option>
                <option value="twilio">Twilio</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-2 text-text-light">
                <input
                  type="checkbox"
                  checked={settings.smsProvider.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    smsProvider: { ...settings.smsProvider, enabled: e.target.checked }
                  })}
                  className="w-5 h-5"
                />
                <span>הפעל שליחת SMS</span>
              </label>
            </div>

            {settings.smsProvider.type === 'twilio' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-text-light mb-2">Account SID</label>
                  <input
                    type="password"
                    value={settings.smsProvider.twilio.accountSid || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      smsProvider: {
                        ...settings.smsProvider,
                        twilio: { ...settings.smsProvider.twilio, accountSid: e.target.value }
                      }
                    })}
                    className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                    placeholder="ACxxxxxxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-text-light mb-2">Auth Token</label>
                  <input
                    type="password"
                    value={settings.smsProvider.twilio.authToken || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      smsProvider: {
                        ...settings.smsProvider,
                        twilio: { ...settings.smsProvider.twilio, authToken: e.target.value }
                      }
                    })}
                    className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                  />
                </div>
                <div>
                  <label className="block text-text-light mb-2">מספר טלפון Twilio</label>
                  <input
                    type="tel"
                    value={settings.smsProvider.twilio.phoneNumber || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      smsProvider: {
                        ...settings.smsProvider,
                        twilio: { ...settings.smsProvider.twilio, phoneNumber: e.target.value }
                      }
                    })}
                    className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                    placeholder="+1234567890"
                  />
                </div>
              </div>
            )}

            {/* Test SMS */}
            <div className="mt-6 pt-6 border-t border-accent-copper/30">
              <h3 className="text-lg font-semibold text-accent-copper mb-3">בדיקת תצורה</h3>
              <div className="flex gap-3">
                <input
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+972501234567"
                  className="flex-1 bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                />
                <button
                  onClick={handleTestSMS}
                  className="bg-gradient-to-r from-action-blue to-accent-copper text-white px-6 py-3 rounded font-semibold hover:shadow-lg hover:shadow-action-blue/50 transition-all"
                >
                  שלח בדיקה
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Gateway Settings */}
        {activeTab === 'payment' && (
          <div className="bg-card-navy border border-accent-copper/30 rounded-lg p-6 shadow-lg shadow-accent-copper/10 space-y-6">
            <h2 className="text-2xl font-bold text-accent-copper mb-4">💳 הגדרות תשלום</h2>
            
            {/* Cardcom */}
            <div className="border border-accent-copper/20 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <label className="flex items-center gap-2 text-text-light font-semibold text-lg">
                  <input
                    type="checkbox"
                    checked={settings.paymentGateways.cardcom.enabled}
                    onChange={(e) => setSettings({
                      ...settings,
                      paymentGateways: {
                        ...settings.paymentGateways,
                        cardcom: { ...settings.paymentGateways.cardcom, enabled: e.target.checked }
                      }
                    })}
                    className="w-5 h-5"
                  />
                  <span>Cardcom</span>
                </label>
              </div>

              {settings.paymentGateways.cardcom.enabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-text-light mb-2">Terminal Number</label>
                    <input
                      type="text"
                      value={settings.paymentGateways.cardcom.terminalNumber || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        paymentGateways: {
                          ...settings.paymentGateways,
                          cardcom: { ...settings.paymentGateways.cardcom, terminalNumber: e.target.value }
                        }
                      })}
                      className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-text-light mb-2">API Username</label>
                    <input
                      type="text"
                      value={settings.paymentGateways.cardcom.apiUsername || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        paymentGateways: {
                          ...settings.paymentGateways,
                          cardcom: { ...settings.paymentGateways.cardcom, apiUsername: e.target.value }
                        }
                      })}
                      className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-text-light mb-2">API Password</label>
                    <input
                      type="password"
                      value={settings.paymentGateways.cardcom.apiPassword || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        paymentGateways: {
                          ...settings.paymentGateways,
                          cardcom: { ...settings.paymentGateways.cardcom, apiPassword: e.target.value }
                        }
                      })}
                      className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-text-light">
                      <input
                        type="checkbox"
                        checked={settings.paymentGateways.cardcom.testMode}
                        onChange={(e) => setSettings({
                          ...settings,
                          paymentGateways: {
                            ...settings.paymentGateways,
                            cardcom: { ...settings.paymentGateways.cardcom, testMode: e.target.checked }
                          }
                        })}
                        className="w-5 h-5"
                      />
                      <span>מצב בדיקה (Sandbox)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* GROW */}
            <div className="border border-accent-copper/20 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <label className="flex items-center gap-2 text-text-light font-semibold text-lg">
                  <input
                    type="checkbox"
                    checked={settings.paymentGateways.grow.enabled}
                    onChange={(e) => setSettings({
                      ...settings,
                      paymentGateways: {
                        ...settings.paymentGateways,
                        grow: { ...settings.paymentGateways.grow, enabled: e.target.checked }
                      }
                    })}
                    className="w-5 h-5"
                  />
                  <span>GROW (Meshulam)</span>
                </label>
              </div>

              {settings.paymentGateways.grow.enabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-text-light mb-2">API Key</label>
                    <input
                      type="password"
                      value={settings.paymentGateways.grow.apiKey || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        paymentGateways: {
                          ...settings.paymentGateways,
                          grow: { ...settings.paymentGateways.grow, apiKey: e.target.value }
                        }
                      })}
                      className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-text-light mb-2">User ID</label>
                    <input
                      type="text"
                      value={settings.paymentGateways.grow.userId || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        paymentGateways: {
                          ...settings.paymentGateways,
                          grow: { ...settings.paymentGateways.grow, userId: e.target.value }
                        }
                      })}
                      className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-text-light mb-2">Page Code</label>
                    <input
                      type="text"
                      value={settings.paymentGateways.grow.pageCode || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        paymentGateways: {
                          ...settings.paymentGateways,
                          grow: { ...settings.paymentGateways.grow, pageCode: e.target.value }
                        }
                      })}
                      className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-text-light">
                      <input
                        type="checkbox"
                        checked={settings.paymentGateways.grow.testMode}
                        onChange={(e) => setSettings({
                          ...settings,
                          paymentGateways: {
                            ...settings.paymentGateways,
                            grow: { ...settings.paymentGateways.grow, testMode: e.target.checked }
                          }
                        })}
                        className="w-5 h-5"
                      />
                      <span>מצב בדיקה (Sandbox)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invoice Settings */}
        {activeTab === 'invoice' && (
          <div className="bg-card-navy border border-accent-copper/30 rounded-lg p-6 shadow-lg shadow-accent-copper/10">
            <h2 className="text-2xl font-bold text-accent-copper mb-4">🧾 הגדרות חשבוניות</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-text-light mb-2">שם החברה</label>
                <input
                  type="text"
                  value={settings.invoiceSettings.companyName || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    invoiceSettings: { ...settings.invoiceSettings, companyName: e.target.value }
                  })}
                  className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                />
              </div>
              <div>
                <label className="block text-text-light mb-2">ח.פ / ע.מ</label>
                <input
                  type="text"
                  value={settings.invoiceSettings.companyNumber || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    invoiceSettings: { ...settings.invoiceSettings, companyNumber: e.target.value }
                  })}
                  className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                />
              </div>
              <div>
                <label className="block text-text-light mb-2">מספר עוסק מורשה</label>
                <input
                  type="text"
                  value={settings.invoiceSettings.vatNumber || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    invoiceSettings: { ...settings.invoiceSettings, vatNumber: e.target.value }
                  })}
                  className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                />
              </div>
              <div>
                <label className="block text-text-light mb-2">רחוב</label>
                <input
                  type="text"
                  value={settings.invoiceSettings.address?.street || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    invoiceSettings: {
                      ...settings.invoiceSettings,
                      address: { ...settings.invoiceSettings.address, street: e.target.value }
                    }
                  })}
                  className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                />
              </div>
              <div>
                <label className="block text-text-light mb-2">עיר</label>
                <input
                  type="text"
                  value={settings.invoiceSettings.address?.city || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    invoiceSettings: {
                      ...settings.invoiceSettings,
                      address: { ...settings.invoiceSettings.address, city: e.target.value }
                    }
                  })}
                  className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                />
              </div>
              <div>
                <label className="block text-text-light mb-2">טלפון</label>
                <input
                  type="tel"
                  value={settings.invoiceSettings.phone || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    invoiceSettings: { ...settings.invoiceSettings, phone: e.target.value }
                  })}
                  className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                />
              </div>
              <div>
                <label className="block text-text-light mb-2">אימייל</label>
                <input
                  type="email"
                  value={settings.invoiceSettings.email || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    invoiceSettings: { ...settings.invoiceSettings, email: e.target.value }
                  })}
                  className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                />
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-action-blue to-accent-copper text-white px-8 py-4 rounded-lg font-bold text-lg hover:shadow-xl hover:shadow-action-blue/50 transition-all disabled:opacity-50"
          >
            {saving ? '⏳ שומר...' : '💾 שמור הגדרות'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderSettings;

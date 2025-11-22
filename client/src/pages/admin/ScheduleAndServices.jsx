import { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import axios from 'axios';

const ScheduleAndServices = () => {
  const [activePanel, setActivePanel] = useState('schedule');
  const [availability, setAvailability] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    fetchAvailability();
    fetchServices();
  }, []);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/availability/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailability(response.data);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError('שגיאה בטעינת הגדרות זמינות');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/availability/services`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServices(response.data.services || []);
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg text-gray-600">טוען...</div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg text-red-600">{error}</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6" dir="rtl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">יומן, זמינות ושירותים</h1>
          <p className="mt-2 text-gray-600">ניהול מרוכז של הלוח זמנים, שעות העבודה והשירותים שלך</p>
        </div>

        <div className="flex gap-6">
          <div className="w-1/3 bg-white rounded-lg shadow-lg p-6">
            <div className="space-y-2 mb-6">
              <button
                onClick={() => setActivePanel('schedule')}
                className={`w-full text-right px-4 py-3 rounded-lg transition-colors ${
                  activePanel === 'schedule'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                זמינות שבועית
              </button>
              <button
                onClick={() => setActivePanel('services')}
                className={`w-full text-right px-4 py-3 rounded-lg transition-colors ${
                  activePanel === 'services'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                שירותים
              </button>
              <button
                onClick={() => setActivePanel('settings')}
                className={`w-full text-right px-4 py-3 rounded-lg transition-colors ${
                  activePanel === 'settings'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                הגדרות תורים
              </button>
            </div>

            <div className="border-t pt-6">
              {activePanel === 'schedule' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">זמינות שבועית</h3>
                  <p className="text-sm text-gray-600">הגדר את שעות העבודה שלך לכל יום בשבוע</p>
                  {/* TODO: Add weekly schedule editor */}
                </div>
              )}
              
              {activePanel === 'services' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">קטלוג שירותים</h3>
                  <div className="space-y-3">
                    {services.length === 0 && (
                      <p className="text-sm text-gray-500">אין שירותים זמינים</p>
                    )}
                    {services.map(service => (
                      <div key={service._id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium">{service.name}</div>
                          {service.color && (
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: service.color }}
                            />
                          )}
                        </div>
                        <div className="text-sm text-gray-600">{service.duration} דקות • ₪{service.price}</div>
                        {service.description && (
                          <div className="text-xs text-gray-500 mt-1">{service.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* TODO: Add service management UI */}
                </div>
              )}
              
              {activePanel === 'settings' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">הגדרות תורים</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        זמן ריווח בין תורים (דקות)
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={availability?.bufferTime || 0}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ניתן לקבוע תור עד (ימים)
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={availability?.maxAdvanceBookingDays || 30}
                        readOnly
                      />
                    </div>
                    {/* TODO: Add settings editor */}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">היומן שלי</h2>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                  הוסף פגישה
                </button>
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                  חסום זמן
                </button>
              </div>
            </div>
            
            <div className="border rounded-lg p-8 text-center text-gray-500">
              <p>תצוגת היומן תתווסף בקרוב</p>
              <p className="text-sm mt-2">כאן יוצג לוח השנה השבועי עם כל הפגישות, האירועים והחסימות</p>
            </div>
            {/* TODO: Integrate Calendar component */}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ScheduleAndServices;

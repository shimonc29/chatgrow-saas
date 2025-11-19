import { useState, useEffect } from 'react';
import axios from 'axios';

const Availability = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [availability, setAvailability] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [googleCalendarStatus, setGoogleCalendarStatus] = useState(null);
  const [googleCalendarLoading, setGoogleCalendarLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [events, setEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  const [newService, setNewService] = useState({
    name: '',
    description: '',
    duration: 30,
    price: 0,
    currency: 'ILS',
    isActive: true
  });

  const daysOfWeek = [
    { value: 0, label: 'ראשון' },
    { value: 1, label: 'שני' },
    { value: 2, label: 'שלישי' },
    { value: 3, label: 'רביעי' },
    { value: 4, label: 'חמישי' },
    { value: 5, label: 'שישי' },
    { value: 6, label: 'שבת' }
  ];

  useEffect(() => {
    fetchAvailability();
    fetchSubscription();
    fetchGoogleCalendarStatus();
    fetchAppointmentsAndEvents();
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

  const fetchGoogleCalendarStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('/api/google-calendar/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setGoogleCalendarStatus(response.data);
      }
    } catch (err) {
      console.error('Error fetching Google Calendar status:', err);
    }
  };

  const handleConnectGoogleCalendar = async () => {
    if (!isPremium()) {
      alert('חיבור ל-Google Calendar זמין רק במנוי פרימיום. אנא שדרג את המנוי שלך.');
      return;
    }

    try {
      setGoogleCalendarLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/google-calendar/auth', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (err) {
      console.error('Error connecting Google Calendar:', err);
      alert('❌ שגיאה בחיבור ל-Google Calendar: ' + (err.response?.data?.message || 'שגיאה לא ידועה'));
    } finally {
      setGoogleCalendarLoading(false);
    }
  };

  const handleDisconnectGoogleCalendar = async () => {
    if (!confirm('האם אתה בטוח שברצונך לנתק את יומן Google? תורים לא יסונכרנו יותר.')) {
      return;
    }

    try {
      setGoogleCalendarLoading(true);
      const token = localStorage.getItem('token');
      await axios.post('/api/google-calendar/disconnect', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('✅ יומן Google נותק בהצלחה');
      setGoogleCalendarStatus({ connected: false });
      await fetchGoogleCalendarStatus();
    } catch (err) {
      console.error('Error disconnecting Google Calendar:', err);
      alert('❌ שגיאה בניתוק יומן Google');
    } finally {
      setGoogleCalendarLoading(false);
    }
  };

  const fetchAppointmentsAndEvents = async () => {
    setCalendarLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };
      const [appointmentsRes, eventsRes] = await Promise.all([
        axios.get('/api/appointments', { headers }),
        axios.get('/api/events', { headers })
      ]);

      const appointmentsData = Array.isArray(appointmentsRes.data) 
        ? appointmentsRes.data 
        : (appointmentsRes.data?.data || appointmentsRes.data?.appointments || []);
      
      const eventsData = Array.isArray(eventsRes.data) 
        ? eventsRes.data 
        : (eventsRes.data?.data || eventsRes.data?.events || []);

      setAppointments(appointmentsData);
      setEvents(eventsData);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setAppointments([]);
      setEvents([]);
    } finally {
      setCalendarLoading(false);
    }
  };

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found');
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get('/api/availability/settings', { headers });
      
      setAvailability(res.data);
      setServices(res.data.services || []);
    } catch (error) {
      console.error('Failed to fetch availability:', error);
      alert('❌ שגיאה בטעינת הגדרות זמינות');
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (dayIndex) => {
    const updatedSchedule = [...availability.weeklySchedule];
    updatedSchedule[dayIndex].isAvailable = !updatedSchedule[dayIndex].isAvailable;
    setAvailability({ ...availability, weeklySchedule: updatedSchedule });
  };

  const handleTimeSlotChange = (dayIndex, slotIndex, field, value) => {
    const updatedSchedule = [...availability.weeklySchedule];
    updatedSchedule[dayIndex].timeSlots[slotIndex][field] = value;
    setAvailability({ ...availability, weeklySchedule: updatedSchedule });
  };

  const addTimeSlot = (dayIndex) => {
    const updatedSchedule = [...availability.weeklySchedule];
    updatedSchedule[dayIndex].timeSlots.push({ startTime: '09:00', endTime: '17:00' });
    setAvailability({ ...availability, weeklySchedule: updatedSchedule });
  };

  const removeTimeSlot = (dayIndex, slotIndex) => {
    const updatedSchedule = [...availability.weeklySchedule];
    updatedSchedule[dayIndex].timeSlots.splice(slotIndex, 1);
    setAvailability({ ...availability, weeklySchedule: updatedSchedule });
  };

  const saveSchedule = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/availability/settings', availability, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ הזמינות עודכנה בהצלחה!');
      fetchAvailability();
    } catch (error) {
      console.error('Failed to save schedule:', error);
      alert('❌ שגיאה בשמירת הזמינות');
    }
  };

  const handleCreateService = async () => {
    try {
      const token = localStorage.getItem('token');
      if (editingService) {
        await axios.put(`/api/availability/services/${editingService._id}`, newService, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('✅ השירות עודכן בהצלחה!');
      } else {
        await axios.post('/api/availability/services', newService, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('✅ השירות נוסף בהצלחה!');
      }
      setShowServiceModal(false);
      setNewService({ name: '', description: '', duration: 30, price: 0, currency: 'ILS', isActive: true });
      setEditingService(null);
      fetchAvailability();
    } catch (error) {
      console.error('Failed to save service:', error);
      alert('❌ שגיאה בשמירת השירות');
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setNewService({
      name: service.name,
      description: service.description || '',
      duration: service.duration,
      price: service.price,
      currency: service.currency,
      isActive: service.isActive
    });
    setShowServiceModal(true);
  };

  const handleDeleteService = async (serviceId) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק שירות זה?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/availability/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ השירות הוסר בהצלחה!');
      fetchAvailability();
    } catch (error) {
      console.error('Failed to delete service:', error);
      alert('❌ שגיאה במחיקת השירות');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-light">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-xl text-primary">טוען נתונים...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-accent-teal mb-2">📅 ניהול זמינות ושירותים</h1>
          <p className="text-text-secondary">
            {isPremium() 
              ? 'הגדר זמינות ושירותים - מסונכרן עם Google Calendar'
              : 'הגדר זמינות ושירותים - יומן פנימי בתוכנה'}
          </p>
        </div>

        {/* Google Calendar Integration Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <span className="text-4xl ml-3">📅</span>
              <div>
                <h3 className="font-bold text-accent-teal text-xl mb-2">חיבור ליומן Google</h3>
                
                {!isPremium() && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                    <p className="text-yellow-800 text-sm mb-2">
                      <strong>יומן פנימי בתוכנה</strong> - בתוכנית החינמית, הזמינות והתורים שלך מנוהלים רק בתוך המערכת.
                    </p>
                    <p className="text-yellow-800 text-sm">
                      💎 <strong>שדרג לפרימיום</strong> וקבל סנכרון אוטומטי עם Google Calendar!
                    </p>
                  </div>
                )}

                {isPremium() && googleCalendarStatus?.connected && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                    <p className="text-green-800 text-sm flex items-center gap-2">
                      <span className="text-xl">✅</span>
                      <span>מחובר ליומן Google - התורים והאירועים שלך מסונכרנים אוטומטית!</span>
                    </p>
                    {googleCalendarStatus.lastSync && (
                      <p className="text-green-700 text-xs mt-1 mr-7">
                        סנכרון אחרון: {new Date(googleCalendarStatus.lastSync).toLocaleString('he-IL')}
                      </p>
                    )}
                  </div>
                )}

                {isPremium() && !googleCalendarStatus?.connected && (
                  <p className="text-text-secondary text-sm mb-3">
                    חבר את יומן Google שלך כדי לנהל את הזמינות שלך ישירות מהיומן.
                    כל תור שתקבע בתוכנה יתווסף אוטומטית ליומן Google שלך! 🚀
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {isPremium() && !googleCalendarStatus?.connected && (
                <button
                  onClick={handleConnectGoogleCalendar}
                  disabled={googleCalendarLoading}
                  className="px-6 py-2 bg-accent-teal text-white rounded-lg hover:bg-accent-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {googleCalendarLoading ? 'מתחבר...' : '🔗 חבר יומן Google'}
                </button>
              )}

              {isPremium() && googleCalendarStatus?.connected && (
                <button
                  onClick={handleDisconnectGoogleCalendar}
                  disabled={googleCalendarLoading}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {googleCalendarLoading ? 'מנתק...' : '🔌 נתק יומן Google'}
                </button>
              )}

              {!isPremium() && (
                <button
                  onClick={() => window.location.href = '/admin/subscription'}
                  className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-colors font-bold whitespace-nowrap"
                >
                  💎 שדרג לפרימיום
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-bg-card rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 px-6 py-4 font-medium transition-all ${
                activeTab === 'calendar'
                  ? 'text-accent-teal border-b-2 border-accent-teal bg-white'
                  : 'text-text-secondary hover:text-accent-teal hover:bg-gray-50'
              }`}
            >
              📆 לוח שנה
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`flex-1 px-6 py-4 font-medium transition-all ${
                activeTab === 'services'
                  ? 'text-accent-teal border-b-2 border-accent-teal bg-white'
                  : 'text-text-secondary hover:text-accent-teal hover:bg-gray-50'
              }`}
            >
              💼 שירותים ומחירים
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'calendar' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-accent-teal mb-4">📆 לוח השנה שלך</h3>
                  <p className="text-text-secondary mb-4">
                    כאן תוכל לראות את כל התורים והאירועים הקרובים שלך במקום אחד
                  </p>
                  <button
                    onClick={fetchAppointmentsAndEvents}
                    disabled={calendarLoading}
                    className="px-4 py-2 bg-accent-teal text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
                  >
                    {calendarLoading ? '🔄 טוען...' : '🔄 רענן לוח שנה'}
                  </button>
                </div>

                {calendarLoading ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">⏳</div>
                    <p className="text-text-secondary">טוען נתונים...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xl font-semibold text-accent-teal flex items-center gap-2">
                          <span>📋</span>
                          <span>תורים קרובים</span>
                          <span className="text-sm font-normal text-text-secondary">({appointments.length})</span>
                        </h4>
                      </div>
                      {appointments.length === 0 ? (
                        <div className="bg-gray-50 rounded-lg p-8 text-center">
                          <div className="text-4xl mb-3">📋</div>
                          <p className="text-text-secondary">אין תורים קרובים</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {appointments
                            .sort((a, b) => new Date(a.date) - new Date(b.date))
                            .slice(0, 9)
                            .map((appointment) => (
                            <div key={appointment._id} className="bg-white border border-accent-teal/30 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-semibold text-primary">{appointment.customerName}</h5>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">תור</span>
                              </div>
                              <p className="text-sm text-text-secondary mb-2">{appointment.service}</p>
                              <div className="flex items-center gap-2 text-sm text-accent-teal">
                                <span>📅</span>
                                <span>{new Date(appointment.date).toLocaleDateString('he-IL')}</span>
                                <span>🕐</span>
                                <span>{appointment.time}</span>
                              </div>
                              {appointment.notes && (
                                <p className="text-xs text-text-secondary mt-2 line-clamp-2">{appointment.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xl font-semibold text-accent-teal flex items-center gap-2">
                          <span>🎉</span>
                          <span>אירועים קרובים</span>
                          <span className="text-sm font-normal text-text-secondary">({events.length})</span>
                        </h4>
                      </div>
                      {events.length === 0 ? (
                        <div className="bg-gray-50 rounded-lg p-8 text-center">
                          <div className="text-4xl mb-3">🎉</div>
                          <p className="text-text-secondary">אין אירועים קרובים</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {events
                            .sort((a, b) => new Date(a.date) - new Date(b.date))
                            .slice(0, 9)
                            .map((event) => (
                            <div key={event._id} className="bg-white border border-accent-teal/30 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-semibold text-primary line-clamp-1">{event.name}</h5>
                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">אירוע</span>
                              </div>
                              <p className="text-sm text-text-secondary mb-2 line-clamp-2">{event.description}</p>
                              <div className="flex items-center gap-2 text-sm text-accent-teal mb-2">
                                <span>📅</span>
                                <span>{new Date(event.date).toLocaleDateString('he-IL')}</span>
                                <span>🕐</span>
                                <span>{event.time}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs text-text-secondary">
                                <span>📍 {event.location}</span>
                                <span>👥 {event.participants?.length || 0}/{event.maxParticipants}</span>
                              </div>
                              {event.price && (
                                <div className="text-sm font-semibold text-accent-teal mt-2">
                                  💰 ₪{event.price}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'services' && (
              <div>
                <div className="mb-6 flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-primary">השירותים שלך</h3>
                  <button
                    onClick={() => {
                      setEditingService(null);
                      setNewService({ name: '', description: '', duration: 30, price: 0, currency: 'ILS', isActive: true });
                      setShowServiceModal(true);
                    }}
                    className="px-4 py-2 bg-accent-teal text-white rounded-lg hover:bg-accent-hover transition-colors"
                  >
                    ➕ הוסף שירות
                  </button>
                </div>

                {services.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-4xl mb-4">📦</div>
                    <p className="text-text-secondary">עדיין לא הוספת שירותים</p>
                    <p className="text-sm text-text-secondary mt-2">לחץ על "הוסף שירות" כדי להתחיל</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map((service) => (
                      <div key={service._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-lg font-semibold text-primary">{service.name}</h4>
                          <span className={`px-2 py-1 rounded text-xs ${service.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {service.isActive ? '✓ פעיל' : '✕ לא פעיל'}
                          </span>
                        </div>
                        {service.description && (
                          <p className="text-sm text-text-secondary mb-3">{service.description}</p>
                        )}
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">משך:</span>
                            <span className="font-medium text-primary">{service.duration} דקות</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">מחיר:</span>
                            <span className="font-medium text-accent-teal">{service.price} {service.currency}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditService(service)}
                            className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                          >
                            ✏️ ערוך
                          </button>
                          <button
                            onClick={() => handleDeleteService(service._id)}
                            className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                          >
                            🗑️ מחק
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-primary mb-4">
              {editingService ? '✏️ עריכת שירות' : '➕ הוסף שירות חדש'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">שם השירות *</label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-accent-teal"
                  placeholder="למשל: תספורת גברים"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">תיאור</label>
                <textarea
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-accent-teal"
                  rows="3"
                  placeholder="תיאור קצר של השירות"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">משך (דקות) *</label>
                <input
                  type="number"
                  min="5"
                  value={newService.duration}
                  onChange={(e) => setNewService({ ...newService, duration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-accent-teal"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">מחיר *</label>
                  <input
                    type="number"
                    min="0"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-accent-teal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">מטבע</label>
                  <select
                    value={newService.currency}
                    onChange={(e) => setNewService({ ...newService, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-accent-teal"
                  >
                    <option value="ILS">₪ ILS</option>
                    <option value="USD">$ USD</option>
                    <option value="EUR">€ EUR</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowServiceModal(false);
                  setEditingService(null);
                  setNewService({ name: '', description: '', duration: 30, price: 0, currency: 'ILS', isActive: true });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-text-secondary rounded-lg hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleCreateService}
                disabled={!newService.name || newService.duration < 5}
                className="flex-1 px-4 py-2 bg-accent-teal text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingService ? 'עדכן' : 'הוסף'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Availability;

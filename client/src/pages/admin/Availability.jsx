import { useState, useEffect } from 'react';
import axios from 'axios';

const Availability = () => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [availability, setAvailability] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

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
  }, []);

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
          <p className="text-text-secondary">הגדר מתי אתה זמין ומה אפשר להזמין</p>
        </div>

        <div className="bg-bg-card rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex-1 px-6 py-4 font-medium transition-all ${
                activeTab === 'schedule'
                  ? 'text-accent-teal border-b-2 border-accent-teal bg-white'
                  : 'text-text-secondary hover:text-accent-teal hover:bg-gray-50'
              }`}
            >
              🗓️ יומן זמינות
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
            {activeTab === 'schedule' && availability && (
              <div>
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-primary mb-2">💡 הגדרות כלליות</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-text-secondary mb-1">זמן מרווח בין תורים (דקות)</label>
                      <input
                        type="number"
                        min="0"
                        value={availability.bufferTime}
                        onChange={(e) => setAvailability({ ...availability, bufferTime: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-accent-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-text-secondary mb-1">ניתן להזמין עד (ימים מראש)</label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={availability.maxAdvanceBookingDays}
                        onChange={(e) => setAvailability({ ...availability, maxAdvanceBookingDays: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-accent-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-text-secondary mb-1">הזמנה מינימום (שעות מראש)</label>
                      <input
                        type="number"
                        min="0"
                        value={availability.minAdvanceBookingHours}
                        onChange={(e) => setAvailability({ ...availability, minAdvanceBookingHours: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-accent-teal"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {daysOfWeek.map((day, dayIndex) => {
                    const daySchedule = availability.weeklySchedule.find(d => d.dayOfWeek === day.value);
                    if (!daySchedule) return null;

                    return (
                      <div key={day.value} className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={daySchedule.isAvailable}
                                onChange={() => handleDayToggle(dayIndex)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-teal/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-teal"></div>
                            </label>
                            <span className="text-lg font-semibold text-primary">{day.label}</span>
                          </div>
                          {daySchedule.isAvailable && (
                            <button
                              onClick={() => addTimeSlot(dayIndex)}
                              className="px-3 py-1 bg-accent-teal text-white rounded-lg hover:bg-accent-hover transition-colors text-sm"
                            >
                              + הוסף טווח שעות
                            </button>
                          )}
                        </div>

                        {daySchedule.isAvailable && (
                          <div className="space-y-2">
                            {daySchedule.timeSlots.map((slot, slotIndex) => (
                              <div key={slotIndex} className="flex items-center gap-3 bg-gray-50 p-3 rounded">
                                <label className="text-sm text-text-secondary min-w-[60px]">משעה:</label>
                                <input
                                  type="time"
                                  value={slot.startTime}
                                  onChange={(e) => handleTimeSlotChange(dayIndex, slotIndex, 'startTime', e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-accent-teal"
                                />
                                <label className="text-sm text-text-secondary">עד שעה:</label>
                                <input
                                  type="time"
                                  value={slot.endTime}
                                  onChange={(e) => handleTimeSlotChange(dayIndex, slotIndex, 'endTime', e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-accent-teal"
                                />
                                <button
                                  onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                >
                                  🗑️
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={saveSchedule}
                    className="px-6 py-3 bg-gradient-to-l from-accent-teal to-accent-hover text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                  >
                    💾 שמור זמינות
                  </button>
                </div>
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

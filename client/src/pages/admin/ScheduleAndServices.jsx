import { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import axios from 'axios';
import { appointmentsAPI, eventsAPI } from '../../services/api';
import AIInsightsCard from '../../components/AIInsightsCard';

const ScheduleAndServices = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  
  // Availability & Services state
  const [availability, setAvailability] = useState(null);
  const [services, setServices] = useState([]);
  
  // Appointments state
  const [appointments, setAppointments] = useState([]);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [editAppointmentMode, setEditAppointmentMode] = useState(false);
  const [editAppointmentId, setEditAppointmentId] = useState(null);
  const [appointmentFormData, setAppointmentFormData] = useState({
    customerName: '',
    service: '',
    date: '',
    time: '',
    notes: '',
  });
  
  // Events state
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editEventMode, setEditEventMode] = useState(false);
  const [editEventId, setEditEventId] = useState(null);
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    maxParticipants: '',
    price: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    fetchAvailability();
    fetchServices();
    fetchAppointments();
    fetchEvents();
  }, []);

  // Availability functions
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

  // Appointments functions
  const fetchAppointments = async () => {
    try {
      const response = await appointmentsAPI.getAll();
      setAppointments(response.data.appointments || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editAppointmentMode && editAppointmentId) {
        const response = await appointmentsAPI.update(editAppointmentId, appointmentFormData);
        setAppointments(appointments.map(apt => apt._id === editAppointmentId ? response.data.appointment : apt));
        alert('תור עודכן בהצלחה!');
      } else {
        const response = await appointmentsAPI.create(appointmentFormData);
        setAppointments([response.data.appointment, ...appointments]);
      }
      
      setAppointmentFormData({ customerName: '', service: '', date: '', time: '', notes: '' });
      setShowAppointmentModal(false);
      setEditAppointmentMode(false);
      setEditAppointmentId(null);
    } catch (err) {
      console.error('Error saving appointment:', err);
      alert('שגיאה בשמירת תור: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditAppointment = (appointment) => {
    const dateObj = new Date(appointment.appointmentDate || appointment.dateTime);
    
    setAppointmentFormData({
      customerName: `${appointment.customer.firstName} ${appointment.customer.lastName}`,
      service: appointment.serviceName || appointment.serviceType,
      date: dateObj.toISOString().split('T')[0],
      time: appointment.startTime || '09:00',
      notes: appointment.customer.notes || appointment.notes || '',
    });
    setEditAppointmentId(appointment._id);
    setEditAppointmentMode(true);
    setShowAppointmentModal(true);
  };

  const handleOpenAppointmentModal = () => {
    setAppointmentFormData({ customerName: '', service: '', date: '', time: '', notes: '' });
    setEditAppointmentMode(false);
    setEditAppointmentId(null);
    setShowAppointmentModal(true);
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm('האם אתה בטוח שברצונך לבטל תור זה?')) return;
    
    try {
      await appointmentsAPI.delete(appointmentId);
      setAppointments(appointments.filter(apt => apt._id !== appointmentId));
    } catch (err) {
      console.error('Error deleting appointment:', err);
      alert('שגיאה בביטול תור');
    }
  };

  const copyBookingLink = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const businessId = user.providerId || 'demo';
    const link = `${window.location.origin}/appointments/book?businessId=${businessId}`;
    navigator.clipboard.writeText(link).then(() => {
      alert('קישור הזמנת התור הועתק ללוח! 📋');
    }).catch(err => {
      console.error('Error copying link:', err);
      alert('שגיאה בהעתקת הקישור');
    });
  };

  // Events functions
  const fetchEvents = async () => {
    try {
      const response = await eventsAPI.getAll();
      setEvents(response.data.events || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    try {
      const eventData = {
        name: eventFormData.title,
        description: eventFormData.description,
        date: eventFormData.date,
        startTime: eventFormData.time,
        location: eventFormData.location,
        maxParticipants: parseInt(eventFormData.maxParticipants),
        price: parseFloat(eventFormData.price),
        status: 'published',
      };

      if (editEventMode && editEventId) {
        const response = await eventsAPI.update(editEventId, eventData);
        setEvents(events.map(e => e._id === editEventId ? response.data.event : e));
        alert('אירוע עודכן בהצלחה!');
      } else {
        const response = await eventsAPI.create(eventData);
        setEvents([response.data.event, ...events]);
      }
      
      setEventFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        maxParticipants: '',
        price: '',
      });
      setShowEventModal(false);
      setEditEventMode(false);
      setEditEventId(null);
    } catch (err) {
      console.error('Error saving event:', err);
      alert('שגיאה בשמירת אירוע: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditEvent = (event) => {
    const eventDate = event.startDateTime || event.date;
    const dateObj = new Date(eventDate);
    
    setEventFormData({
      title: event.name,
      description: event.description,
      date: dateObj.toISOString().split('T')[0],
      time: formatTime(event.startDateTime) || event.startTime || '09:00',
      location: getLocation(event.location),
      maxParticipants: event.maxParticipants.toString(),
      price: getPrice(event.pricing || event.price).toString(),
    });
    setEditEventId(event._id);
    setEditEventMode(true);
    setShowEventModal(true);
  };

  const handleOpenEventModal = () => {
    setEventFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      maxParticipants: '',
      price: '',
    });
    setEditEventMode(false);
    setEditEventId(null);
    setShowEventModal(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('האם אתה בטוח שברצונך לבטל אירוע זה?')) return;
    
    try {
      await eventsAPI.delete(eventId);
      setEvents(events.filter(e => e._id !== eventId));
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('שגיאה בביטול אירוע');
    }
  };

  const copyRegistrationLink = (eventId) => {
    const link = `${window.location.origin}/events/${eventId}/register`;
    navigator.clipboard.writeText(link).then(() => {
      alert('קישור ההרשמה הועתק ללוח! 📋');
    }).catch(err => {
      console.error('Error copying link:', err);
      alert('שגיאה בהעתקת הקישור');
    });
  };

  const handleShowParticipants = (event) => {
    setSelectedEvent(event);
    setShowParticipantsModal(true);
  };

  // Utility functions
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  };

  const getLocation = (location) => {
    if (!location) return 'לא צוין';
    if (typeof location === 'string') return location;
    if (location.address?.street) return location.address.street;
    return 'לא צוין';
  };

  const getPrice = (pricing) => {
    if (!pricing) return 0;
    if (typeof pricing === 'number') return pricing;
    return pricing.amount || 0;
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled': return 'מתוכנן';
      case 'confirmed': return 'מאושר';
      case 'completed': return 'הושלם';
      case 'cancelled': return 'בוטל';
      default: return status;
    }
  };

  // Tab styling helper
  const tabClass = (key) =>
    `px-6 py-3 text-sm font-semibold transition-all relative ${
      activeTab === key
        ? 'text-accent-teal border-b-2 border-accent-teal'
        : 'text-text-secondary hover:text-accent-teal'
    }`;

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg text-gray-600">טוען...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6" dir="rtl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">📆 ניהול יומן ותורים</h1>
          <p className="mt-2 text-gray-600">מרכז ניהול מאוחד ליומן, תורים, אירועים, זמינות ושירותים</p>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-t-lg shadow-lg border-b border-gray-200">
          <div className="flex gap-1 px-6" dir="rtl">
            <button onClick={() => setActiveTab('calendar')} className={tabClass('calendar')}>
              📆 יומן
            </button>
            <button onClick={() => setActiveTab('appointments')} className={tabClass('appointments')}>
              📋 תורים
            </button>
            <button onClick={() => setActiveTab('events')} className={tabClass('events')}>
              🎫 אירועים
            </button>
            <button onClick={() => setActiveTab('availability')} className={tabClass('availability')}>
              🕐 זמינות
            </button>
            <button onClick={() => setActiveTab('services')} className={tabClass('services')}>
              🛠️ שירותים
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-lg shadow-lg p-6">
          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="space-y-4" dir="rtl">
              <div className="flex justify-between items-center">
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
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="space-y-4" dir="rtl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">ניהול תורים</h2>
                <div className="flex space-x-reverse space-x-3">
                  <button
                    onClick={copyBookingLink}
                    className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg font-semibold flex items-center space-x-reverse space-x-2 hover:bg-gray-50"
                  >
                    <span>🔗</span>
                    <span>קישור הזמנה</span>
                  </button>
                  <button
                    onClick={handleOpenAppointmentModal}
                    className="bg-gradient-to-r from-accent-teal to-accent-hover text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-reverse space-x-2"
                  >
                    <span>➕</span>
                    <span>תור חדש</span>
                  </button>
                </div>
              </div>

              {appointments.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {appointments.map((appointment) => {
                    const customerName = `${appointment.customer.firstName} ${appointment.customer.lastName}`;
                    return (
                      <div key={appointment._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{customerName}</h3>
                            <p className="text-sm text-gray-600">{appointment.serviceName}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getStatusText(appointment.status)}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <span>📅</span>
                            <span>{formatDate(appointment.appointmentDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>🕐</span>
                            <span>{appointment.startTime}</span>
                          </div>
                          {appointment.customer.phone && (
                            <div className="flex items-center gap-2">
                              <span>📞</span>
                              <span>{appointment.customer.phone}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditAppointment(appointment)}
                            className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded text-sm hover:bg-blue-100"
                          >
                            ערוך
                          </button>
                          <button
                            onClick={() => handleDeleteAppointment(appointment._id)}
                            className="flex-1 bg-red-50 text-red-700 px-3 py-2 rounded text-sm hover:bg-red-100"
                          >
                            בטל
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">📅</div>
                  <p>אין תורים פעילים</p>
                  <p className="text-sm mt-2">לחץ על "תור חדש" להוספת תור ראשון</p>
                </div>
              )}
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-4" dir="rtl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">ניהול אירועים</h2>
                <button
                  onClick={handleOpenEventModal}
                  className="bg-gradient-to-r from-accent-teal to-accent-hover text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-reverse space-x-2"
                >
                  <span>➕</span>
                  <span>אירוע חדש</span>
                </button>
              </div>

              {events.length > 0 && (
                <div className="mb-6">
                  <AIInsightsCard 
                    eventId={events[0]._id} 
                    eventName={events[0].name}
                  />
                </div>
              )}

              {events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.map((event) => (
                    <div key={event._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          event.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {event.status === 'published' ? 'פעיל' : event.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                      <div className="space-y-1 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <span>📅</span>
                          <span>{formatDate(event.startDateTime || event.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>🕐</span>
                          <span>{formatTime(event.startDateTime) || event.startTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>📍</span>
                          <span>{getLocation(event.location)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>👥</span>
                          <span>{event.participants?.length || 0} / {event.maxParticipants}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyRegistrationLink(event._id)}
                          className="flex-1 bg-teal-50 text-teal-700 px-3 py-2 rounded text-sm hover:bg-teal-100"
                        >
                          🔗 קישור
                        </button>
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded text-sm hover:bg-blue-100"
                        >
                          ערוך
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event._id)}
                          className="flex-1 bg-red-50 text-red-700 px-3 py-2 rounded text-sm hover:bg-red-100"
                        >
                          בטל
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">🎫</div>
                  <p>אין אירועים פעילים</p>
                  <p className="text-sm mt-2">לחץ על "אירוע חדש" ליצירת אירוע ראשון</p>
                </div>
              )}
            </div>
          )}

          {/* Availability Tab */}
          {activeTab === 'availability' && (
            <div className="space-y-4" dir="rtl">
              <h2 className="text-2xl font-semibold mb-4">הגדרות זמינות</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">זמינות שבועית</h3>
                  <p className="text-sm text-gray-600 mb-4">הגדר את שעות העבודה שלך לכל יום בשבוע</p>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="text-sm text-gray-500">עורך זמינות שבועית יתווסף בקרוב</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      זמן ריווח בין תורים (דקות)
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      value={availability?.bufferTime || 0}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ניתן לקבוע תור עד (ימים מראש)
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      value={availability?.maxAdvanceBookingDays || 30}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="space-y-4" dir="rtl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">קטלוג שירותים</h2>
                <button className="bg-gradient-to-r from-accent-teal to-accent-hover text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-reverse space-x-2">
                  <span>➕</span>
                  <span>שירות חדש</span>
                </button>
              </div>

              {services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.map(service => (
                    <div key={service._id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-semibold text-gray-900">{service.name}</div>
                        {service.color && (
                          <div
                            className="w-6 h-6 rounded-full border border-gray-300"
                            style={{ backgroundColor: service.color }}
                          />
                        )}
                      </div>
                      {service.description && (
                        <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                      )}
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>⏱️ {service.duration} דקות</div>
                        <div>💰 ₪{service.price}</div>
                        <div className={service.isActive ? 'text-green-600' : 'text-red-600'}>
                          {service.isActive ? '✅ פעיל' : '❌ לא פעיל'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">🛠️</div>
                  <p>אין שירותים מוגדרים</p>
                  <p className="text-sm mt-2">לחץ על "שירות חדש" להוספת שירות ראשון</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Appointment Modal */}
        {showAppointmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editAppointmentMode ? 'ערוך תור' : 'תור חדש'}
                </h2>
              </div>
              <form onSubmit={handleAppointmentSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">שם הלקוח</label>
                    <input
                      type="text"
                      value={appointmentFormData.customerName}
                      onChange={(e) => setAppointmentFormData({ ...appointmentFormData, customerName: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="שם מלא"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">סוג השירות</label>
                    <input
                      type="text"
                      value={appointmentFormData.service}
                      onChange={(e) => setAppointmentFormData({ ...appointmentFormData, service: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="למשל: ייעוץ, טיפול, פגישה"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">תאריך</label>
                      <input
                        type="date"
                        value={appointmentFormData.date}
                        onChange={(e) => setAppointmentFormData({ ...appointmentFormData, date: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">שעה</label>
                      <input
                        type="time"
                        value={appointmentFormData.time}
                        onChange={(e) => setAppointmentFormData({ ...appointmentFormData, time: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">הערות</label>
                    <textarea
                      value={appointmentFormData.notes}
                      onChange={(e) => setAppointmentFormData({ ...appointmentFormData, notes: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="הערות נוספות..."
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700"
                  >
                    {editAppointmentMode ? 'עדכן' : 'צור תור'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAppointmentModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Event Modal */}
        {showEventModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editEventMode ? 'ערוך אירוע' : 'אירוע חדש'}
                </h2>
              </div>
              <form onSubmit={handleEventSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">שם האירוע</label>
                    <input
                      type="text"
                      value={eventFormData.title}
                      onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="למשל: סדנת בישול איטלקי"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">תיאור</label>
                    <textarea
                      value={eventFormData.description}
                      onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                      required
                      rows="3"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="תיאור קצר של האירוע..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">תאריך</label>
                    <input
                      type="date"
                      value={eventFormData.date}
                      onChange={(e) => setEventFormData({ ...eventFormData, date: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">שעה</label>
                    <input
                      type="time"
                      value={eventFormData.time}
                      onChange={(e) => setEventFormData({ ...eventFormData, time: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">מיקום</label>
                    <input
                      type="text"
                      value={eventFormData.location}
                      onChange={(e) => setEventFormData({ ...eventFormData, location: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="כתובת או מקום"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">מספר משתתפים מקסימלי</label>
                    <input
                      type="number"
                      value={eventFormData.maxParticipants}
                      onChange={(e) => setEventFormData({ ...eventFormData, maxParticipants: e.target.value })}
                      required
                      min="1"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">מחיר (₪)</label>
                    <input
                      type="number"
                      value={eventFormData.price}
                      onChange={(e) => setEventFormData({ ...eventFormData, price: e.target.value })}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700"
                  >
                    {editEventMode ? 'עדכן' : 'צור אירוע'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEventModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ScheduleAndServices;

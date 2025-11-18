import { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { eventsAPI } from '../../services/api';
import AIInsightsCard from '../../components/AIInsightsCard';

const Events = () => {
  const [showModal, setShowModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editEventId, setEditEventId] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    maxParticipants: '',
    price: '',
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getAll();
      setEvents(response.data.events || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('שגיאה בטעינת אירועים');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const eventData = {
        name: formData.title,
        description: formData.description,
        date: formData.date,
        startTime: formData.time,
        location: formData.location,
        maxParticipants: parseInt(formData.maxParticipants),
        price: parseFloat(formData.price),
        status: 'published',
      };

      if (editMode && editEventId) {
        const response = await eventsAPI.update(editEventId, eventData);
        setEvents(events.map(e => e._id === editEventId ? response.data.event : e));
        alert('אירוע עודכן בהצלחה!');
      } else {
        const response = await eventsAPI.create(eventData);
        setEvents([response.data.event, ...events]);
      }
      
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        maxParticipants: '',
        price: '',
      });
      setShowModal(false);
      setEditMode(false);
      setEditEventId(null);
    } catch (err) {
      console.error('Error saving event:', err);
      alert('שגיאה בשמירת אירוע: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (event) => {
    const eventDate = event.startDateTime || event.date;
    const dateObj = new Date(eventDate);
    
    setFormData({
      title: event.name,
      description: event.description,
      date: dateObj.toISOString().split('T')[0],
      time: formatTime(event.startDateTime) || event.startTime || '09:00',
      location: getLocation(event.location),
      maxParticipants: event.maxParticipants.toString(),
      price: getPrice(event.pricing || event.price).toString(),
    });
    setEditEventId(event._id);
    setEditMode(true);
    setShowModal(true);
  };

  const handleOpenModal = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      maxParticipants: '',
      price: '',
    });
    setEditMode(false);
    setEditEventId(null);
    setShowModal(true);
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

  const handleDelete = async (eventId) => {
    if (!window.confirm('האם אתה בטוח שברצונך לבטל אירוע זה?')) return;
    
    try {
      await eventsAPI.delete(eventId);
      setEvents(events.filter(e => e._id !== eventId));
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('שגיאה בביטול אירוע');
    }
  };

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

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8 flex justify-center items-center min-h-screen bg-bg-light">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-text-secondary">טוען אירועים...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 bg-bg-light min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-accent-teal">ניהול אירועים</h1>
            <p className="text-text-primary mt-2">צור ונהל את האירועים שלך</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="bg-gradient-to-r from-accent-teal to-accent-hover text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-reverse space-x-2 transition-all shadow-lg shadow-accent-teal/50 hover:shadow-accent-teal/70"
          >
            <span>➕</span>
            <span>אירוע חדש</span>
          </button>
        </div>

        {error && (
          <div className="bg-bg-card border border-red-600/30 text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* AI Insights - מוצג רק אם יש אירועים */}
        {events.length > 0 && (
          <div className="mb-8">
            <AIInsightsCard 
              eventId={events[0]._id} 
              eventName={events[0].name}
            />
          </div>
        )}

        {/* Events Grid */}
        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event._id} className="bg-bg-card border border-accent-teal/30 rounded-xl p-6 hover:border-accent-teal/50 hover:shadow-accent-teal/20 transition-all shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-accent-teal">{event.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    event.status === 'published' || event.status === 'active' ? 'bg-green-900/50 text-green-400 border border-green-600/30' : 'bg-gray-800 text-text-secondary border border-gray-600/30'
                  }`}>
                    {event.status === 'published' || event.status === 'active' ? 'פעיל' : event.status === 'cancelled' ? 'בוטל' : event.status}
                  </span>
                </div>
                <p className="text-text-primary text-sm mb-4">{event.description}</p>
                <div className="space-y-2 text-sm text-text-secondary">
                  <div className="flex items-center space-x-reverse space-x-2">
                    <span>📅</span>
                    <span>{formatDate(event.startDateTime || event.date)} בשעה {formatTime(event.startDateTime) || event.startTime}</span>
                  </div>
                  <div className="flex items-center space-x-reverse space-x-2">
                    <span>📍</span>
                    <span>{getLocation(event.location)}</span>
                  </div>
                  <div className="flex items-center space-x-reverse space-x-2">
                    <span>👥</span>
                    <span>{event.currentParticipants || event.registeredCount || 0}/{event.maxParticipants} משתתפים</span>
                  </div>
                  <div className="flex items-center space-x-reverse space-x-2">
                    <span>💰</span>
                    <span>₪{getPrice(event.pricing || event.price)}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-col space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => handleEdit(event)}
                      className="bg-bg-light text-text-primary border border-accent-teal/20 py-2 rounded-lg hover:border-accent-teal/50 transition-all font-medium text-sm"
                    >
                      ✏️ ערוך
                    </button>
                    <button 
                      onClick={() => copyRegistrationLink(event._id)}
                      className="bg-bg-light text-text-primary border border-accent-teal/20 py-2 rounded-lg hover:border-accent-teal/50 transition-all font-medium text-sm"
                    >
                      🔗 שתף
                    </button>
                    <button 
                      onClick={() => handleShowParticipants(event)}
                      className="bg-bg-light text-text-primary border border-accent-teal/20 py-2 rounded-lg hover:border-accent-teal/50 transition-all font-medium text-sm"
                    >
                      👥 נרשמים
                    </button>
                  </div>
                  <button 
                    onClick={() => handleDelete(event._id)}
                    className="w-full bg-bg-light text-red-400 border border-red-600/20 py-2 rounded-lg hover:border-red-500/50 transition-all"
                  >
                    🗑️ ביטול
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-bg-card border border-accent-teal/30 rounded-xl p-12 text-center shadow-lg">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-accent-teal mb-2">אין אירועים עדיין</h3>
            <p className="text-text-primary mb-6">צור את האירוע הראשון שלך!</p>
            <button
              onClick={handleOpenModal}
              className="bg-gradient-to-r from-accent-teal to-accent-hover text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg shadow-accent-teal/50 hover:shadow-accent-teal/70"
            >
              ➕ צור אירוע חדש
            </button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-bg-card border border-accent-teal/30 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-accent-teal/30">
                <h2 className="text-2xl font-bold text-accent-teal">
                  {editMode ? 'ערוך אירוע' : 'אירוע חדש'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-accent-teal mb-2">שם האירוע</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-bg-light border border-accent-teal/30 text-white rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none"
                      placeholder="למשל: סדנת בישול איטלקי"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-accent-teal mb-2">תיאור</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      rows="3"
                      className="w-full px-4 py-3 bg-bg-light border border-accent-teal/30 text-white rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none"
                      placeholder="תיאור קצר של האירוע..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-accent-teal mb-2">תאריך</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-bg-light border border-accent-teal/30 text-white rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-accent-teal mb-2">שעה</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-bg-light border border-accent-teal/30 text-white rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-accent-teal mb-2">מיקום</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-bg-light border border-accent-teal/30 text-white rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none"
                      placeholder="כתובת מלאה"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-accent-teal mb-2">מקסימום משתתפים</label>
                    <input
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                      required
                      min="1"
                      className="w-full px-4 py-3 bg-bg-light border border-accent-teal/30 text-white rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-accent-teal mb-2">מחיר (₪)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 bg-bg-light border border-accent-teal/30 text-white rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <div className="flex space-x-reverse space-x-4 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-accent-teal to-accent-hover text-white py-3 rounded-lg font-semibold transition-all shadow-lg shadow-accent-teal/50 hover:shadow-accent-teal/70"
                  >
                    {editMode ? 'שמור שינויים' : 'צור אירוע'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-bg-light text-text-primary border border-accent-teal/20 py-3 rounded-lg font-semibold transition-all hover:border-accent-teal/50"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Participants Modal */}
        {showParticipantsModal && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" dir="rtl">
            <div className="bg-bg-card border border-accent-teal/30 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-accent-teal/30">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-accent-teal">נרשמים לאירוע: {selectedEvent.name}</h2>
                    <p className="text-text-primary mt-1">
                      {selectedEvent.participants?.length || 0} נרשמים מתוך {selectedEvent.maxParticipants} מקומות
                    </p>
                  </div>
                  <button
                    onClick={() => setShowParticipantsModal(false)}
                    className="text-accent-teal hover:text-accent-teal/80 transition-colors"
                  >
                    <span className="text-2xl">✕</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                {selectedEvent.participants && selectedEvent.participants.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-bg-light border-b border-accent-teal/20">
                          <th className="text-right px-4 py-3 text-sm font-semibold text-accent-teal">#</th>
                          <th className="text-right px-4 py-3 text-sm font-semibold text-accent-teal">שם</th>
                          <th className="text-right px-4 py-3 text-sm font-semibold text-accent-teal">אימייל</th>
                          <th className="text-right px-4 py-3 text-sm font-semibold text-accent-teal">טלפון</th>
                          <th className="text-right px-4 py-3 text-sm font-semibold text-accent-teal">תאריך הרשמה</th>
                          <th className="text-right px-4 py-3 text-sm font-semibold text-accent-teal">סטטוס תשלום</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEvent.participants.map((participant, index) => (
                          <tr key={index} className="border-b border-accent-teal/10 hover:bg-bg-light">
                            <td className="px-4 py-3 text-sm text-text-primary">{index + 1}</td>
                            <td className="px-4 py-3 text-sm font-medium text-text-primary">{participant.name}</td>
                            <td className="px-4 py-3 text-sm text-text-secondary">{participant.email}</td>
                            <td className="px-4 py-3 text-sm text-text-secondary">{participant.phone}</td>
                            <td className="px-4 py-3 text-sm text-text-secondary">
                              {participant.registeredAt ? new Date(participant.registeredAt).toLocaleDateString('he-IL') : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                participant.paymentStatus === 'paid' ? 'bg-green-900/50 text-green-400 border border-green-600/30' :
                                participant.paymentStatus === 'free' ? 'bg-blue-900/50 text-blue-400 border border-blue-600/30' :
                                participant.paymentStatus === 'pending' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-600/30' :
                                'bg-gray-800 text-text-secondary border border-gray-600/30'
                              }`}>
                                {participant.paymentStatus === 'paid' ? 'שולם' :
                                 participant.paymentStatus === 'free' ? 'חינם' :
                                 participant.paymentStatus === 'pending' ? 'ממתין' :
                                 participant.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-xl font-semibold text-accent-teal mb-2">אין נרשמים עדיין</h3>
                    <p className="text-text-primary">כאשר אנשים ירשמו לאירוע, הם יופיעו כאן</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Events;

import { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { eventsAPI, appointmentsAPI } from '../../services/api';

const RegistrationPages = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

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

  const copyLink = (id, type) => {
    const link = type === 'event' 
      ? `${window.location.origin}/events/${id}/register`
      : `${window.location.origin}/appointments/book?businessId=${getUserBusinessId()}`;
    
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(err => {
      console.error('Error copying link:', err);
      alert('שגיאה בהעתקת הקישור');
    });
  };

  const getUserBusinessId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.providerId || 'demo';
  };

  const openLink = (id, type) => {
    const link = type === 'event'
      ? `${window.location.origin}/events/${id}/register`
      : `${window.location.origin}/appointments/book?businessId=${getUserBusinessId()}`;
    window.open(link, '_blank');
  };

  const getPrice = (pricing) => {
    if (!pricing) return 0;
    if (typeof pricing === 'number') return pricing;
    return pricing.amount || 0;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8 flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 to-black">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-300">טוען דפי הרשמה...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 bg-gradient-to-br from-gray-900 to-black min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-yellow-400">דפי הרשמה</h1>
          <p className="text-gray-300 mt-2">כל קישורי ההרשמה לאירועים ותורים במקום אחד</p>
        </div>

        {error && (
          <div className="bg-gradient-to-br from-gray-900 to-black border border-red-600/50 text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Appointment Booking Link */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-yellow-400 mb-4">🗓️ דף הזמנת תורים</h2>
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-lg p-6 border border-yellow-600/30 hover:border-yellow-500/50 hover:shadow-yellow-500/20 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-400 mb-2">דף הזמנת תורים כללי</h3>
                <p className="text-sm text-gray-300 mb-4">
                  לקוחות יכולים לבחור שירות, תאריך ושעה, ולהזמין תור באופן עצמאי
                </p>
                <div className="bg-black rounded-lg p-3 border border-yellow-600/30 font-mono text-sm text-gray-300 break-all">
                  {`${window.location.origin}/appointments/book?businessId=${getUserBusinessId()}`}
                </div>
              </div>
            </div>
            <div className="flex space-x-reverse space-x-3 mt-4">
              <button
                onClick={() => copyLink('appointments', 'appointments')}
                className="flex-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black py-3 rounded-lg font-semibold transition-all shadow-lg shadow-yellow-500/50 hover:shadow-yellow-500/70 flex items-center justify-center space-x-reverse space-x-2"
              >
                <span>{copiedId === 'appointments' ? '✓ הועתק!' : '📋 העתק קישור'}</span>
              </button>
              <button
                onClick={() => openLink('appointments', 'appointments')}
                className="flex-1 bg-gray-800 text-gray-300 border border-yellow-600/20 py-3 rounded-lg font-semibold transition-all hover:border-yellow-500/50 flex items-center justify-center space-x-reverse space-x-2"
              >
                <span>🔗 פתח דף</span>
              </button>
            </div>
          </div>
        </div>

        {/* Events Registration Links */}
        <div>
          <h2 className="text-xl font-semibold text-yellow-400 mb-4">🎉 דפי הרשמה לאירועים</h2>
          
          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div 
                  key={event._id} 
                  className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-lg p-6 border border-yellow-600/30 hover:border-yellow-500/50 hover:shadow-yellow-500/20 transition-all"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-yellow-400 mb-1">{event.name}</h3>
                    <p className="text-sm text-gray-300 line-clamp-2">{event.description}</p>
                  </div>

                  <div className="space-y-2 text-sm text-gray-300 mb-4">
                    <div className="flex items-center space-x-reverse space-x-2">
                      <span>📅</span>
                      <span>{formatDate(event.startDateTime || event.date)}</span>
                    </div>
                    <div className="flex items-center space-x-reverse space-x-2">
                      <span>👥</span>
                      <span>{event.currentParticipants || 0}/{event.maxParticipants} משתתפים</span>
                    </div>
                    <div className="flex items-center space-x-reverse space-x-2">
                      <span>💰</span>
                      <span>₪{getPrice(event.pricing || event.price)}</span>
                    </div>
                  </div>

                  <div className="bg-black rounded-lg p-3 border border-yellow-600/30 font-mono text-xs text-gray-300 break-all mb-4">
                    {`${window.location.origin}/events/${event._id}/register`}
                  </div>

                  <div className="flex space-x-reverse space-x-2">
                    <button
                      onClick={() => copyLink(event._id, 'event')}
                      className="flex-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black py-2 rounded-lg font-medium transition-all shadow-lg shadow-yellow-500/50 hover:shadow-yellow-500/70 text-sm"
                    >
                      {copiedId === event._id ? '✓ הועתק!' : '📋 העתק'}
                    </button>
                    <button
                      onClick={() => openLink(event._id, 'event')}
                      className="flex-1 bg-gray-800 text-gray-300 border border-yellow-600/20 py-2 rounded-lg font-medium transition-all hover:border-yellow-500/50 text-sm"
                    >
                      🔗 פתח
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-600/30 rounded-xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-yellow-400 mb-2">אין אירועים פעילים</h3>
              <p className="text-gray-300 mb-6">צור אירוע חדש כדי לקבל דף הרשמה</p>
              <button
                onClick={() => window.location.href = '/admin/events'}
                className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black px-8 py-3 rounded-lg font-semibold transition-all shadow-lg shadow-yellow-500/50 hover:shadow-yellow-500/70"
              >
                ➕ צור אירוע חדש
              </button>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-gradient-to-br from-gray-900 to-black border border-yellow-600/30 rounded-xl p-6">
          <div className="flex items-start space-x-reverse space-x-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="font-bold text-yellow-400 mb-2">איך להשתמש בדפי ההרשמה?</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• העתק את הקישור ושתף אותו עם הלקוחות שלך</li>
                <li>• פרסם את הקישור ברשתות חברתיות, אתר או דיוור</li>
                <li>• לקוחות יכולים להירשם ולשלם ישירות דרך הדף</li>
                <li>• תקבל התראה אוטומטית על כל הרשמה חדשה</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default RegistrationPages;

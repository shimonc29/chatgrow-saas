import { useState } from 'react';
import MainLayout from '../../components/Layout/MainLayout';

const Events = () => {
  const [showModal, setShowModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    maxParticipants: '',
    price: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newEvent = {
      id: Date.now(),
      ...formData,
      participants: 0,
      status: 'active',
    };
    setEvents([...events, newEvent]);
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
  };

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">ניהול אירועים</h1>
            <p className="text-gray-600 mt-2">צור ונהל את האירועים שלך</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-reverse space-x-2 transition-colors"
          >
            <span>➕</span>
            <span>אירוע חדש</span>
          </button>
        </div>

        {/* Events Grid */}
        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-800">{event.title}</h3>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    פעיל
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{event.description}</p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center space-x-reverse space-x-2">
                    <span>📅</span>
                    <span>{event.date} בשעה {event.time}</span>
                  </div>
                  <div className="flex items-center space-x-reverse space-x-2">
                    <span>📍</span>
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center space-x-reverse space-x-2">
                    <span>👥</span>
                    <span>{event.participants}/{event.maxParticipants} משתתפים</span>
                  </div>
                  <div className="flex items-center space-x-reverse space-x-2">
                    <span>💰</span>
                    <span>₪{event.price}</span>
                  </div>
                </div>
                <div className="mt-4 flex space-x-reverse space-x-2">
                  <button className="flex-1 bg-brand-50 text-brand-600 py-2 rounded-lg hover:bg-brand-100 transition-colors">
                    עריכה
                  </button>
                  <button className="flex-1 bg-gray-50 text-gray-600 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                    צפייה
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">אין אירועים עדיין</h3>
            <p className="text-gray-600 mb-6">צור את האירוע הראשון שלך!</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              ➕ צור אירוע חדש
            </button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">אירוע חדש</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">שם האירוע</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                      placeholder="למשל: סדנת בישול איטלקי"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">תיאור</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                      placeholder="תיאור קצר של האירוע..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">תאריך</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">שעה</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">מיקום</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                      placeholder="כתובת מלאה"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">מקסימום משתתפים</label>
                    <input
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                      required
                      min="1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">מחיר (₪)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <div className="flex space-x-reverse space-x-4 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    צור אירוע
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
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

export default Events;

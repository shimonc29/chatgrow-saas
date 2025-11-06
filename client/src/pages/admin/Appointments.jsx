import { useState } from 'react';
import MainLayout from '../../components/Layout/MainLayout';

const Appointments = () => {
  const [showModal, setShowModal] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [formData, setFormData] = useState({
    customerName: '',
    service: '',
    date: '',
    time: '',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newAppointment = {
      id: Date.now(),
      ...formData,
      status: 'scheduled',
    };
    setAppointments([...appointments, newAppointment]);
    setFormData({ customerName: '', service: '', date: '', time: '', notes: '' });
    setShowModal(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled':
        return 'מתוכנן';
      case 'completed':
        return 'הושלם';
      case 'cancelled':
        return 'בוטל';
      default:
        return status;
    }
  };

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">ניהול תורים</h1>
            <p className="text-gray-600 mt-2">קבע ונהל תורים עם לקוחות</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-reverse space-x-2 transition-colors"
          >
            <span>➕</span>
            <span>תור חדש</span>
          </button>
        </div>

        {/* Appointments List */}
        {appointments.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{appointment.customerName}</h3>
                    <p className="text-sm text-gray-600">{appointment.service}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusColor(appointment.status)}`}>
                    {getStatusText(appointment.status)}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-reverse space-x-2">
                    <span>📅</span>
                    <span>{appointment.date}</span>
                  </div>
                  <div className="flex items-center space-x-reverse space-x-2">
                    <span>🕐</span>
                    <span>{appointment.time}</span>
                  </div>
                  {appointment.notes && (
                    <div className="flex items-start space-x-reverse space-x-2 mt-3">
                      <span>📝</span>
                      <span className="flex-1">{appointment.notes}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex space-x-reverse space-x-2">
                  <button className="flex-1 bg-green-50 text-green-600 py-2 rounded-lg hover:bg-green-100 transition-colors text-sm">
                    סיים
                  </button>
                  <button className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm">
                    בטל
                  </button>
                  <button className="flex-1 bg-brand-50 text-brand-600 py-2 rounded-lg hover:bg-brand-100 transition-colors text-sm">
                    ערוך
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">אין תורים עדיין</h3>
            <p className="text-gray-600 mb-6">קבע את התור הראשון שלך!</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              ➕ קבע תור חדש
            </button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">תור חדש</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">שם הלקוח</label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                      placeholder="שם מלא"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">סוג השירות</label>
                    <input
                      type="text"
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                      placeholder="למשל: ייעוץ, טיפול, פגישה"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">הערות (אופציונלי)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                      placeholder="הערות על התור..."
                    />
                  </div>
                </div>
                <div className="flex space-x-reverse space-x-4 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    קבע תור
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

export default Appointments;

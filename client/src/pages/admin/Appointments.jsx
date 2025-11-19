import { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { appointmentsAPI } from '../../services/api';

const Appointments = () => {
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editAppointmentId, setEditAppointmentId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    service: '',
    date: '',
    time: '',
    notes: '',
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentsAPI.getAll();
      setAppointments(response.data.appointments || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('שגיאה בטעינת תורים');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode && editAppointmentId) {
        const response = await appointmentsAPI.update(editAppointmentId, formData);
        setAppointments(appointments.map(apt => apt._id === editAppointmentId ? response.data.appointment : apt));
        alert('תור עודכן בהצלחה!');
      } else {
        const response = await appointmentsAPI.create(formData);
        setAppointments([response.data.appointment, ...appointments]);
      }
      
      setFormData({ customerName: '', service: '', date: '', time: '', notes: '' });
      setShowModal(false);
      setEditMode(false);
      setEditAppointmentId(null);
    } catch (err) {
      console.error('Error saving appointment:', err);
      alert('שגיאה בשמירת תור: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (appointment) => {
    const dateObj = new Date(appointment.appointmentDate || appointment.dateTime);
    
    setFormData({
      customerName: `${appointment.customer.firstName} ${appointment.customer.lastName}`,
      service: appointment.serviceName || appointment.serviceType,
      date: dateObj.toISOString().split('T')[0],
      time: appointment.startTime || '09:00',
      notes: appointment.customer.notes || appointment.notes || '',
    });
    setEditAppointmentId(appointment._id);
    setEditMode(true);
    setShowModal(true);
  };

  const handleOpenModal = () => {
    setFormData({ customerName: '', service: '', date: '', time: '', notes: '' });
    setEditMode(false);
    setEditAppointmentId(null);
    setShowModal(true);
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

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await appointmentsAPI.updateStatus(appointmentId, newStatus);
      setAppointments(appointments.map(apt => 
        apt._id === appointmentId ? { ...apt, status: newStatus } : apt
      ));
    } catch (err) {
      console.error('Error updating status:', err);
      alert('שגיאה בעדכון סטטוס');
    }
  };

  const handleDelete = async (appointmentId) => {
    if (!window.confirm('האם אתה בטוח שברצונך לבטל תור זה?')) return;
    
    try {
      await appointmentsAPI.delete(appointmentId);
      setAppointments(appointments.filter(apt => apt._id !== appointmentId));
    } catch (err) {
      console.error('Error deleting appointment:', err);
      alert('שגיאה בביטול תור');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
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
      case 'confirmed':
        return 'מאושר';
      case 'completed':
        return 'הושלם';
      case 'cancelled':
        return 'בוטל';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8 flex justify-center items-center min-h-screen bg-bg-light">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-text-secondary">טוען תורים...</p>
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
            <h1 className="text-3xl font-bold text-accent-teal">ניהול תורים</h1>
            <p className="text-text-primary mt-2">קבע ונהל תורים עם לקוחות</p>
          </div>
          <div className="flex space-x-reverse space-x-3">
            <button
              onClick={copyBookingLink}
              className="bg-bg-light text-text-primary border border-accent-teal/20 px-6 py-3 rounded-lg font-semibold flex items-center space-x-reverse space-x-2 transition-all hover:border-accent-teal/50"
            >
              <span>🔗</span>
              <span>קישור הזמנה</span>
            </button>
            <button
              onClick={handleOpenModal}
              className="bg-gradient-to-r from-accent-teal to-accent-hover text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-reverse space-x-2 transition-all shadow-lg shadow-accent-teal/50 hover:shadow-accent-teal/70"
            >
              <span>➕</span>
              <span>תור חדש</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-bg-light border border-red-600/30 text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Appointments List */}
        {appointments.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {appointments.map((appointment) => {
              const customerName = `${appointment.customer.firstName} ${appointment.customer.lastName}`;
              return (
                <div key={appointment._id} className="bg-bg-light border border-accent-teal/30 rounded-xl p-6 hover:border-accent-teal/50 hover:shadow-accent-teal/20 transition-all shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-accent-teal">{customerName}</h3>
                      <p className="text-sm text-text-primary">{appointment.serviceName}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      appointment.status === 'scheduled' ? 'bg-blue-900/50 text-blue-400 border border-blue-600/30' :
                      appointment.status === 'confirmed' ? 'bg-green-900/50 text-green-400 border border-green-600/30' :
                      appointment.status === 'completed' ? 'bg-bg-light text-text-secondary border border-gray-600/30' :
                      appointment.status === 'cancelled' ? 'bg-red-900/50 text-red-400 border border-red-600/30' :
                      'bg-bg-light text-text-secondary border border-gray-600/30'
                    }`}>
                      {getStatusText(appointment.status)}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-text-secondary">
                    <div className="flex items-center space-x-reverse space-x-2">
                      <span>📅</span>
                      <span>{formatDate(appointment.appointmentDate)}</span>
                    </div>
                    <div className="flex items-center space-x-reverse space-x-2">
                      <span>🕐</span>
                      <span>{appointment.startTime}</span>
                    </div>
                    <div className="flex items-center space-x-reverse space-x-2">
                      <span>📞</span>
                      <span>{appointment.customer.phone}</span>
                    </div>
                    {appointment.customer.notes && (
                      <div className="flex items-start space-x-reverse space-x-2 mt-3">
                        <span>📝</span>
                        <span className="flex-1">{appointment.customer.notes}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex flex-col space-y-2">
                    <div className="flex space-x-reverse space-x-2">
                      {appointment.status === 'scheduled' && (
                        <button 
                          onClick={() => handleStatusChange(appointment._id, 'confirmed')}
                          className="flex-1 bg-bg-light text-green-400 border border-green-600/20 py-2 rounded-lg hover:border-green-500/50 transition-all text-sm font-medium"
                        >
                          ✓ אשר
                        </button>
                      )}
                      {appointment.status === 'confirmed' && (
                        <button 
                          onClick={() => handleStatusChange(appointment._id, 'completed')}
                          className="flex-1 bg-bg-light text-blue-400 border border-blue-600/20 py-2 rounded-lg hover:border-blue-500/50 transition-all text-sm font-medium"
                        >
                          ✓ סיים
                        </button>
                      )}
                      <button 
                        onClick={() => handleEdit(appointment)}
                        className="flex-1 bg-bg-light text-text-primary border border-accent-teal/20 py-2 rounded-lg hover:border-accent-teal/50 transition-all text-sm font-medium"
                      >
                        ✏️ ערוך
                      </button>
                    </div>
                    <button 
                      onClick={() => handleDelete(appointment._id)}
                      className="w-full bg-bg-light text-red-400 border border-red-600/20 py-2 rounded-lg hover:border-red-500/50 transition-all text-sm"
                    >
                      🗑️ בטל
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-bg-light border border-accent-teal/30 rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-accent-teal mb-2">אין תורים עדיין</h3>
            <p className="text-text-primary mb-6">קבע את התור הראשון שלך!</p>
            <button
              onClick={handleOpenModal}
              className="bg-gradient-to-r from-accent-teal to-accent-hover text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg shadow-accent-teal/50 hover:shadow-accent-teal/70"
            >
              ➕ קבע תור חדש
            </button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-bg-light border border-accent-teal/30 rounded-2xl shadow-2xl max-w-lg w-full">
              <div className="p-6 border-b border-accent-teal/30">
                <h2 className="text-2xl font-bold text-accent-teal">
                  {editMode ? 'ערוך תור' : 'תור חדש'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-accent-teal mb-2">שם הלקוח</label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white border border-accent-teal/30 text-gray-900 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none"
                      placeholder="שם מלא"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-accent-teal mb-2">סוג השירות</label>
                    <input
                      type="text"
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white border border-accent-teal/30 text-gray-900 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none"
                      placeholder="למשל: ייעוץ, טיפול, פגישה"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-accent-teal mb-2">תאריך</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-white border border-accent-teal/30 text-gray-900 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-accent-teal mb-2">שעה</label>
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-white border border-accent-teal/30 text-gray-900 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-accent-teal mb-2">הערות (אופציונלי)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-3 bg-white border border-accent-teal/30 text-gray-900 rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none"
                      placeholder="הערות על התור..."
                    />
                  </div>
                </div>
                <div className="flex space-x-reverse space-x-4 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-accent-teal to-accent-hover text-black py-3 rounded-lg font-semibold transition-all shadow-lg shadow-accent-teal/50 hover:shadow-accent-teal/70"
                  >
                    {editMode ? 'שמור שינויים' : 'קבע תור'}
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
      </div>
    </MainLayout>
  );
};

export default Appointments;

import { useState, useEffect } from 'react';
import axios from 'axios';

const AppointmentModal = ({ isOpen, onClose, selectedSlot, onSuccess }) => {
  const [formData, setFormData] = useState({
    appointmentDate: '',
    startTime: '',
    endTime: '',
    duration: 60,
    customerName: '',
    customerPhone: '',
    serviceName: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedSlot && isOpen) {
      const date = new Date(selectedSlot);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      const startTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      
      const endDate = new Date(date);
      endDate.setMinutes(endDate.getMinutes() + 60);
      const endHours = endDate.getHours();
      const endMinutes = endDate.getMinutes();
      const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
      
      const dateStr = date.toISOString().split('T')[0];

      setFormData({
        appointmentDate: dateStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
        duration: 60,
        customerName: '',
        customerPhone: '',
        serviceName: '',
        notes: ''
      });
      setError('');
    }
  }, [selectedSlot, isOpen]);

  const handleDurationChange = (newDuration) => {
    if (!formData.startTime) return;

    const [hours, minutes] = formData.startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes + parseInt(newDuration), 0, 0);
    
    const endHours = date.getHours();
    const endMinutes = date.getMinutes();
    const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

    setFormData({
      ...formData,
      duration: parseInt(newDuration),
      endTime: endTimeStr
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/appointments/quick-create',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'שגיאה ביצירת הפגישה');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">📅 קביעת פגישה חדשה</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* תאריך */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
            <input
              type="date"
              value={formData.appointmentDate}
              onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            />
          </div>

          {/* שעות */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שעת התחלה</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => {
                  const newStartTime = e.target.value;
                  const [hours, minutes] = newStartTime.split(':').map(Number);
                  const date = new Date();
                  date.setHours(hours, minutes + formData.duration, 0, 0);
                  const endHours = date.getHours();
                  const endMinutes = date.getMinutes();
                  const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
                  setFormData({ ...formData, startTime: newStartTime, endTime: endTimeStr });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">משך (דקות)</label>
              <select
                value={formData.duration}
                onChange={(e) => handleDurationChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="15">15 דקות</option>
                <option value="30">30 דקות</option>
                <option value="45">45 דקות</option>
                <option value="60">60 דקות</option>
                <option value="90">90 דקות</option>
                <option value="120">120 דקות</option>
              </select>
            </div>
          </div>

          {/* שם לקוח */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם לקוח</label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="שם מלא"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            />
          </div>

          {/* טלפון */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
            <input
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              placeholder="050-1234567"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* שם השירות */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם השירות</label>
            <input
              type="text"
              value={formData.serviceName}
              onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
              placeholder="ייעוץ, טיפול, וכו'"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* הערות */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="הערות נוספות..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* כפתורים */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'שומר...' : 'שמור פגישה'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal;

import { useState } from 'react';
import axios from 'axios';

const TYPE_LABELS = {
  appointment: 'פגישה',
  event: 'אירוע',
  blocked: 'חסום',
  google: 'אירוע גוגל',
  availability: 'זמינות'
};

const TYPE_ICONS = {
  appointment: '📅',
  event: '🎯',
  blocked: '🚫',
  google: '📧',
  availability: '✅'
};

const ItemDetailsModal = ({ isOpen, onClose, item, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  };

  const handleCancelAppointment = async () => {
    if (!confirm('האם אתה בטוח שברצונך לבטל פגישה זו?')) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `/api/appointments/${item.id}`,
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
      setError(err.response?.data?.error || 'שגיאה בביטול הפגישה');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBlock = async () => {
    if (!confirm('האם אתה בטוח שברצונך להסיר חסימה זו?')) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      const blockId = item.id.startsWith('block_') 
        ? new Date(item.start).toISOString()
        : item.id;

      const response = await axios.delete(
        `/api/availability/block/${blockId}`,
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
      setError(err.response?.data?.error || 'שגיאה בהסרת החסימה');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  const icon = TYPE_ICONS[item.type] || '📌';
  const label = TYPE_LABELS[item.type] || 'פריט';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{icon} פרטי {label}</h2>
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

        <div className="space-y-4">
          {/* כותרת */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">כותרת</label>
            <div className="text-lg font-semibold text-gray-800">{item.title}</div>
          </div>

          {/* סוג */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">סוג</label>
            <div className="text-gray-800">{label}</div>
          </div>

          {/* זמן */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">זמן</label>
            <div className="text-gray-800">
              {formatTime(item.start)} - {formatTime(item.end)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {formatDateTime(item.start)}
            </div>
          </div>

          {/* מיקום */}
          {item.location && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">מיקום</label>
              <div className="text-gray-800">📍 {item.location}</div>
            </div>
          )}

          {/* סטטוס */}
          {item.status && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">סטטוס</label>
              <div className="text-gray-800">{item.status}</div>
            </div>
          )}

          {/* פרטי לקוח (לפגישות) */}
          {item.type === 'appointment' && item.meta && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">לקוח</label>
              <div className="text-gray-800">
                {item.meta.customerName && <div>👤 {item.meta.customerName}</div>}
                {item.meta.phone && <div>📞 {item.meta.phone}</div>}
                {item.meta.notes && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    {item.meta.notes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* סיבת חסימה */}
          {item.type === 'blocked' && item.meta?.reason && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">סיבה</label>
              <div className="text-gray-800">{item.meta.reason}</div>
            </div>
          )}

          {/* אירוע - קיבולת */}
          {item.type === 'event' && item.meta && (
            <div>
              {item.meta.capacity && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">קיבולת</label>
                  <div className="text-gray-800">
                    {item.meta.registrations || 0} / {item.meta.capacity}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* כפתורי פעולה */}
          <div className="flex gap-3 pt-4 border-t">
            {item.type === 'appointment' && (
              <button
                onClick={handleCancelAppointment}
                disabled={loading}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'מבטל...' : '🗑️ בטל פגישה'}
              </button>
            )}

            {item.type === 'blocked' && (
              <button
                onClick={handleRemoveBlock}
                disabled={loading}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'מסיר...' : '🗑️ הסר חסימה'}
              </button>
            )}

            {item.type === 'event' && (
              <button
                onClick={() => {
                  window.location.href = '/admin/events';
                }}
                className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
              >
                📋 פתח פרטי אירוע
              </button>
            )}

            {item.type === 'google' && (
              <div className="flex-1 text-center text-sm text-gray-600 py-2">
                אירוע מגוגל קלנדר (לצפייה בלבד)
              </div>
            )}

            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              סגור
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailsModal;

const SuccessMessage = ({ appointment, onClose }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };
  
  const addToGoogleCalendar = () => {
    const startDate = new Date(`${appointment.date}T${appointment.time}`);
    const endDate = new Date(startDate.getTime() + appointment.duration * 60000);
    
    const formatGoogleDate = (date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };
    
    const googleCalUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(appointment.serviceName)}&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}&details=${encodeURIComponent(`תור ל${appointment.serviceName}`)}&sf=true&output=xml`;
    
    window.open(googleCalUrl, '_blank');
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8" dir="rtl">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">התור נקבע בהצלחה!</h2>
          <p className="text-gray-600">פרטי התור שלך:</p>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-6 mb-6 space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🛠️</span>
            <div>
              <div className="text-sm text-gray-500">שירות</div>
              <div className="font-semibold text-gray-900">{appointment.serviceName}</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <div className="text-sm text-gray-500">תאריך</div>
              <div className="font-semibold text-gray-900">{formatDate(appointment.date)}</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-2xl">🕐</span>
            <div>
              <div className="text-sm text-gray-500">שעה</div>
              <div className="font-semibold text-gray-900">{appointment.time}</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-2xl">⏱️</span>
            <div>
              <div className="text-sm text-gray-500">משך</div>
              <div className="font-semibold text-gray-900">{appointment.duration} דקות</div>
            </div>
          </div>
          
          {appointment.price > 0 && (
            <div className="flex items-start gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <div className="text-sm text-gray-500">מחיר</div>
                <div className="font-semibold text-gray-900">₪{appointment.price}</div>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          <button
            onClick={addToGoogleCalendar}
            className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:border-sky-400 hover:bg-sky-50 transition-all flex items-center justify-center gap-2"
          >
            <span>📅</span>
            <span>הוסף ליומן Google</span>
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="w-full bg-sky-600 text-white py-3 rounded-lg font-semibold hover:bg-sky-700 transition-all"
            >
              סגור
            </button>
          )}
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>קיבלת הודעת אישור ב-SMS/Email</p>
        </div>
      </div>
    </div>
  );
};

export default SuccessMessage;

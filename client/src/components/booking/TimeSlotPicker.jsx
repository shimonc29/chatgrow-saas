const TimeSlotPicker = ({ slots, selectedTime, onSelectTime, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center" dir="rtl">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-gray-600">טוען שעות זמינות...</p>
      </div>
    );
  }
  
  if (!slots || slots.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center" dir="rtl">
        <div className="text-4xl mb-4">📅</div>
        <p className="text-gray-700 font-medium mb-2">אין שעות זמינות ביום זה</p>
        <p className="text-sm text-gray-500">נא לבחור תאריך אחר</p>
      </div>
    );
  }
  
  const formatTimeSlot = (isoString) => {
    const date = new Date(isoString);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6" dir="rtl">
      <h3 className="text-lg font-bold text-gray-900 mb-4">בחר שעה זמינה</h3>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {slots.map((slot) => {
          const timeStr = formatTimeSlot(slot);
          const isSelected = selectedTime === timeStr;
          
          return (
            <button
              key={slot}
              type="button"
              onClick={() => onSelectTime(timeStr)}
              className={`
                py-3 px-4 rounded-lg font-medium transition-all border-2
                ${isSelected 
                  ? 'bg-sky-600 text-white border-sky-600 shadow-lg' 
                  : 'bg-white text-gray-900 border-gray-200 hover:border-sky-400 hover:bg-sky-50'
                }
              `}
            >
              {timeStr}
            </button>
          );
        })}
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        {slots.length} שעות זמינות
      </div>
    </div>
  );
};

export default TimeSlotPicker;

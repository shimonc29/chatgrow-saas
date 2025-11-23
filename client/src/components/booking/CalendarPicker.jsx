import { useState } from 'react';

const CalendarPicker = ({ onSelectDate, minDate, maxDaysAhead = 30, disabledDates = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  
  const daysInMonth = lastDayOfMonth.getDate();
  const firstDayOfWeek = firstDayOfMonth.getDay();
  
  const monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];
  
  const dayNames = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
  
  const isDateDisabled = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    if (date < today) return true;
    
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + maxDaysAhead);
    if (date > maxDate) return true;
    
    if (disabledDates.includes(dateStr)) return true;
    
    return false;
  };
  
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };
  
  const handleDateClick = (day) => {
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (!isDateDisabled(selected)) {
      const dateStr = selected.toISOString().split('T')[0];
      onSelectDate(dateStr);
    }
  };
  
  const renderDays = () => {
    const days = [];
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const disabled = isDateDisabled(date);
      
      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(day)}
          disabled={disabled}
          className={`
            h-10 rounded-lg font-medium transition-all
            ${disabled 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-900 hover:bg-sky-100 hover:text-sky-700 cursor-pointer border border-gray-200'
            }
          `}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ←
        </button>
        <h3 className="text-lg font-bold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          →
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map(name => (
          <div key={name} className="text-center text-sm font-semibold text-gray-600">
            {name}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {renderDays()}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        ניתן לקבוע תור עד {maxDaysAhead} ימים מראש
      </div>
    </div>
  );
};

export default CalendarPicker;

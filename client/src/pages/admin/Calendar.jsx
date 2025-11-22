import { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const DAYS_HEBREW = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);

const TYPE_COLORS = {
  appointment: 'bg-blue-100 border-blue-500 text-blue-900',
  event: 'bg-green-100 border-green-500 text-green-900',
  blocked: 'bg-red-100 border-red-500 text-red-900',
  availability: 'bg-emerald-50 border-emerald-400 text-emerald-900',
  google: 'bg-purple-100 border-purple-500 text-purple-900',
  default: 'bg-gray-100 border-gray-500 text-gray-900'
};

const TYPE_LABELS = {
  appointment: 'פגישה',
  event: 'אירוע',
  blocked: 'חסום',
  availability: 'זמינות',
  google: 'Google Calendar'
};

const Calendar = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week');

  useEffect(() => {
    loadCalendar();
  }, [currentDate, view]);

  const getWeekRange = (date) => {
    const d = new Date(date);
    const dayOfWeek = d.getDay();
    
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - dayOfWeek);
    sunday.setHours(0, 0, 0, 0);

    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    saturday.setHours(23, 59, 59, 999);

    return { from: sunday, to: saturday };
  };

  const loadCalendar = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { from, to } = getWeekRange(currentDate);
      
      const response = await axios.get(`${API_BASE}/calendar`, {
        params: {
          from: from.toISOString(),
          to: to.toISOString(),
          view: view
        },
        withCredentials: true
      });

      if (response.data.success) {
        setItems(response.data.items || []);
      } else {
        throw new Error(response.data.error || 'Failed to load calendar');
      }
    } catch (err) {
      console.error('Error loading calendar:', err);
      setError(err.response?.data?.message || err.message || 'שגיאה בטעינת היומן');
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const getWeekDays = () => {
    const { from } = getWeekRange(currentDate);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(from);
      day.setDate(from.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const groupItemsByDate = () => {
    const weekDays = getWeekDays();
    const grouped = {};

    weekDays.forEach(day => {
      const key = day.toISOString().split('T')[0];
      grouped[key] = [];
    });

    items.forEach(item => {
      const itemDate = new Date(item.start);
      const key = itemDate.toISOString().split('T')[0];
      
      if (grouped[key]) {
        grouped[key].push(item);
      }
    });

    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => new Date(a.start) - new Date(b.start));
    });

    return grouped;
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  };

  const isAllDayEvent = (item) => {
    if (!item.start || !item.end) return false;
    const start = new Date(item.start);
    const end = new Date(item.end);
    return start.getHours() === 0 && start.getMinutes() === 0 && 
           end.getHours() === 0 && end.getMinutes() === 0;
  };

  const formatDateHeader = (date) => {
    return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8 flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-text-secondary">טוען יומן...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const weekDays = getWeekDays();
  const groupedItems = groupItemsByDate();
  const { from, to } = getWeekRange(currentDate);

  return (
    <MainLayout>
      <div dir="rtl" className="p-6">
        <div className="bg-gradient-to-r from-accent-teal to-accent-hover rounded-2xl shadow-2xl shadow-accent-teal/30 p-6 mb-6 text-white">
          <h1 className="text-3xl font-bold mb-2">📅 יומן וניהול פגישות</h1>
          <p className="opacity-90">תצוגה מרוכזת של כל התורים, האירועים והזמינות שלך</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="bg-bg-card border border-accent-teal/30 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={goToPreviousWeek}
                className="px-4 py-2 bg-bg-light border border-accent-teal/30 hover:border-accent-teal hover:bg-accent-teal/10 rounded-lg transition-all"
              >
                ← שבוע קודם
              </button>
              
              <button
                onClick={goToToday}
                className="px-6 py-2 bg-accent-teal hover:bg-accent-hover text-white rounded-lg font-medium transition-all"
              >
                היום
              </button>
              
              <button
                onClick={goToNextWeek}
                className="px-4 py-2 bg-bg-light border border-accent-teal/30 hover:border-accent-teal hover:bg-accent-teal/10 rounded-lg transition-all"
              >
                שבוע הבא →
              </button>
            </div>

            <div className="text-lg font-semibold text-text-primary">
              {formatDateHeader(from)} - {formatDateHeader(to)}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            {Object.entries(TYPE_LABELS).map(([type, label]) => (
              <div key={type} className="flex items-center gap-2">
                <div className={`w-4 h-4 border-2 rounded ${TYPE_COLORS[type]}`}></div>
                <span className="text-sm text-text-secondary">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg-card border border-accent-teal/30 rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-7 gap-px bg-accent-teal/20">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className={`bg-bg-card p-4 text-center border-b-2 ${
                  isToday(day) 
                    ? 'border-accent-teal bg-accent-teal/10' 
                    : 'border-accent-teal/30'
                }`}
              >
                <div className="font-bold text-text-primary">{DAYS_HEBREW[day.getDay()]}</div>
                <div className={`text-sm mt-1 ${isToday(day) ? 'text-accent-teal font-bold' : 'text-text-secondary'}`}>
                  {formatDateHeader(day)}
                </div>
              </div>
            ))}

            {weekDays.map((day, index) => {
              const dateKey = day.toISOString().split('T')[0];
              const dayItems = groupedItems[dateKey] || [];

              return (
                <div
                  key={index}
                  className={`bg-bg-light min-h-[400px] p-3 ${
                    isToday(day) ? 'bg-accent-teal/5' : ''
                  }`}
                >
                  {dayItems.length === 0 ? (
                    <div className="text-center text-text-secondary/50 text-sm mt-8">
                      אין פעילות
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dayItems.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className={`border-r-4 rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer ${TYPE_COLORS[item.type] || TYPE_COLORS.default}`}
                        >
                          <div className="font-semibold text-sm mb-1 line-clamp-2">
                            {item.title}
                          </div>
                          <div className="text-xs opacity-80 mb-1">
                            {isAllDayEvent(item) ? (
                              <span className="font-medium">כל היום</span>
                            ) : (
                              `${formatTime(item.start)} - ${formatTime(item.end)}`
                            )}
                          </div>
                          {item.location && (
                            <div className="text-xs opacity-70 line-clamp-1">
                              📍 {item.location}
                            </div>
                          )}
                          <div className="text-xs font-medium opacity-60 mt-1">
                            {TYPE_LABELS[item.type]}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 bg-bg-card border border-accent-teal/30 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-accent-teal mb-3">סה"כ השבוע</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(TYPE_LABELS).map(([type, label]) => {
              const count = items.filter(item => item.type === type).length;
              return (
                <div key={type} className="text-center">
                  <div className="text-2xl font-bold text-accent-teal">{count}</div>
                  <div className="text-sm text-text-secondary">{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Calendar;

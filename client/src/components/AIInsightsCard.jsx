import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * כרטיס AI Performance Coach - המלצות חכמות לאירועים
 * כולל Gating לפרימיום - משתמשי FREE רואים הודעת שדרוג
 */
const AIInsightsCard = ({ eventId, eventName }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showInsights, setShowInsights] = useState(false);

  // בדיקת סטטוס פרימיום
  const isPremium = user?.subscriptionStatus === 'TRIAL' || user?.subscriptionStatus === 'ACTIVE';

  // פונקציה לשליפת insights מה-API
  const fetchInsights = async () => {
    if (!isPremium) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/events/${eventId}/ai-insights`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setInsights(response.data.insights);
      } else {
        setError(response.data.message || 'שגיאה בהפקת המלצות');
      }
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      
      if (err.response?.status === 403) {
        setError('פיצ\'ר זה זמין רק למנויי פרימיום');
      } else {
        setError('שגיאה בטעינת המלצות AI. נסה שוב מאוחר יותר.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // טען insights כאשר פותחים את הכרטיס
  useEffect(() => {
    if (showInsights && isPremium && !insights && !isLoading) {
      fetchInsights();
    }
  }, [showInsights, isPremium]);

  // *** תצוגת GATING למשתמשי FREE ***
  if (!isPremium) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-lg shadow-xl border-2 border-accent-teal/30 rtl">
        <div className="flex items-start gap-4">
          <div className="text-5xl">🤖</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-accent-teal mb-2 flex items-center gap-2">
              AI Performance Coach 👑
            </h3>
            <p className="text-text-secondary mb-4 leading-relaxed">
              קבל המלצות חכמות מבוססות דאטה:
            </p>
            <ul className="text-text-secondary text-sm space-y-2 mb-4 mr-4">
              <li className="flex items-start gap-2">
                <span className="text-accent-teal font-bold">💰</span>
                <span>תמחור אופטימלי - מה המחיר שממקסם מכירות?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-teal font-bold">📅</span>
                <span>זמן מיטבי - באיזה יום ושעה הקהל הכי פעיל?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-teal font-bold">🎯</span>
                <span>אופטימיזציה של המרות - איך להעלות הרשמות?</span>
              </li>
            </ul>
            <button 
              className="bg-gradient-to-r from-accent-teal to-accent-hover text-white py-2 px-6 rounded-lg hover:shadow-lg transition-all duration-200 font-semibold"
              onClick={() => navigate('/subscription-management')}
            >
              🚀 שדרג ל-Premium וקבל AI Coach
            </button>
          </div>
        </div>
      </div>
    );
  }

  // *** תצוגה למשתמשי PREMIUM ***
  return (
    <div className="bg-white p-6 rounded-lg shadow-xl border-t-4 border-accent-teal rtl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-accent-teal flex items-center gap-2">
          <span className="text-3xl">🤖</span> 
          AI Performance Coach
        </h3>
        {!showInsights && (
          <button
            onClick={() => setShowInsights(true)}
            className="bg-gradient-to-r from-accent-teal to-accent-hover text-white py-2 px-4 rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-semibold"
          >
            📊 קבל המלצות חכמות
          </button>
        )}
      </div>

      {showInsights && (
        <>
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-6xl mb-4 animate-pulse">🧠</div>
              <p className="text-text-secondary text-lg mb-2">מנתח נתונים היסטוריים...</p>
              <p className="text-text-secondary text-sm">זה עשוי לקחת מספר שניות</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              <p className="font-semibold mb-1">❌ שגיאה</p>
              <p className="text-sm">{error}</p>
              <button
                onClick={fetchInsights}
                className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
              >
                נסה שוב
              </button>
            </div>
          )}

          {insights && !isLoading && !error && (
            <div className="space-y-4">
              {/* הצגת ה-Insights בפורמט Markdown */}
              <div 
                className="prose prose-lg max-w-none text-text-primary leading-relaxed"
                style={{ 
                  direction: 'rtl',
                  textAlign: 'right'
                }}
              >
                {/* Render Markdown as HTML - simple approach */}
                {insights.split('\n').map((line, index) => {
                  // כותרות
                  if (line.startsWith('### ')) {
                    return (
                      <h3 key={index} className="text-xl font-bold text-accent-teal mt-6 mb-3 flex items-center gap-2">
                        {line.replace('### ', '')}
                      </h3>
                    );
                  }
                  if (line.startsWith('## ')) {
                    return (
                      <h2 key={index} className="text-2xl font-bold text-accent-teal mt-6 mb-3">
                        {line.replace('## ', '')}
                      </h2>
                    );
                  }
                  // רשימות
                  if (line.startsWith('- ')) {
                    return (
                      <li key={index} className="mr-6 mb-2 text-text-primary">
                        {line.replace('- ', '')}
                      </li>
                    );
                  }
                  // טקסט רגיל
                  if (line.trim()) {
                    return (
                      <p key={index} className="mb-3 text-text-primary leading-relaxed">
                        {line}
                      </p>
                    );
                  }
                  return null;
                })}
              </div>

              {/* כפתור רענון */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={fetchInsights}
                  className="text-sm text-accent-teal hover:text-accent-hover flex items-center gap-2 transition-colors"
                  disabled={isLoading}
                >
                  🔄 רענן המלצות
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AIInsightsCard;

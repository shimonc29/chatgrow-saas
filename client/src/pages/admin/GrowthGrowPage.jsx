import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = {
  UPSELL: '#00798C',
  CROSS_SELL: '#10a37f',
  FREQUENCY_BOOST: '#f59e0b',
  PREMIUM_SERVICE: '#8b5cf6',
  PACKAGE_UPGRADE: '#ec4899'
};

const PRIORITY_COLORS = {
  CRITICAL: '#dc2626',
  HIGH: '#f59e0b',
  MEDIUM: '#10a37f',
  LOW: '#6b7280'
};

export default function GrowthGrowPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [period, setPeriod] = useState(30);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes] = await Promise.all([
        api.get('/growth/grow/summary')
      ]);

      setSummary(summaryRes.data.data);
    } catch (err) {
      console.error('Error loading GROW data:', err);
      if (err.response?.status === 403) {
        setError('פיצ\'ר זה זמין רק למנויי פרימיום. שדרג את המנוי שלך כדי לגשת לתובנות צמיחה.');
      } else {
        setError('שגיאה בטעינת נתוני צמיחה');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAIInsights = async () => {
    try {
      setAiLoading(true);
      const response = await api.get('/growth/grow/ai-insights');
      setAiInsights(response.data.data);
    } catch (err) {
      console.error('Error loading AI insights:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleUpdateOpportunityStatus = async (opportunityId, status, actualValue = null) => {
    try {
      await api.put(`/growth/grow/${opportunityId}/status`, {
        status,
        actualValue
      });
      loadData();
    } catch (err) {
      console.error('Error updating opportunity status:', err);
      alert('שגיאה בעדכון סטטוס ההזדמנות');
    }
  };

  const handleIdentifyOpportunities = async () => {
    try {
      setLoading(true);
      await api.post('/growth/grow/identify');
      await loadData();
      alert('זיהוי הזדמנויות הושלם בהצלחה!');
    } catch (err) {
      console.error('Error identifying opportunities:', err);
      alert('שגיאה בזיהוי הזדמנויות');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">טוען נתונים...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          {error.includes('פרימיום') && (
            <a
              href="/subscription"
              className="inline-block px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              שדרג למנוי פרימיום
            </a>
          )}
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-600">אין נתונים להצגה</div>
      </div>
    );
  }

  const typeLabels = {
    UPSELL: 'Upsell - שדרוג שירותים',
    CROSS_SELL: 'Cross-Sell - שירותים נוספים',
    FREQUENCY_BOOST: 'הגדלת תדירות',
    PREMIUM_SERVICE: 'שירות VIP',
    PACKAGE_UPGRADE: 'שדרוג חבילה'
  };

  const priorityLabels = {
    CRITICAL: 'קריטי',
    HIGH: 'גבוה',
    MEDIUM: 'בינוני',
    LOW: 'נמוך'
  };

  return (
    <div className="p-8 space-y-8" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">GROW - הגדלת הכנסות</h1>
          <p className="text-gray-600 mt-2">זיהוי הזדמנויות לצמיחה ו-upselling</p>
        </div>
        <button
          onClick={handleIdentifyOpportunities}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          🔍 זהה הזדמנויות חדשות
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">סה"כ הזדמנויות פעילות</div>
          <div className="text-3xl font-bold text-teal-600">
            {summary.summary.totalOpportunities}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">פוטנציאל הכנסות</div>
          <div className="text-3xl font-bold text-green-600">
            ₪{summary.summary.totalPotentialValue.toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">שיעור המרה</div>
          <div className="text-3xl font-bold text-blue-600">
            {summary.summary.conversionRate}%
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">ערך ממוצע להזדמנות</div>
          <div className="text-3xl font-bold text-purple-600">
            ₪{summary.summary.avgOpportunityValue.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">פילוח לפי סוג</h2>
          {summary.breakdown.byType.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={summary.breakdown.byType}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${typeLabels[entry.type] || entry.type} (${entry.count})`}
                >
                  {summary.breakdown.byType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.type] || '#6b7280'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value} הזדמנויות (₪${props.payload.totalValue.toLocaleString()})`,
                    typeLabels[name] || name
                  ]}
                />
                <Legend
                  formatter={(value) => typeLabels[value] || value}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 py-12">אין נתונים להצגה</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">פילוח לפי עדיפות</h2>
          {summary.breakdown.byPriority.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={summary.breakdown.byPriority}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="priority"
                  tickFormatter={(value) => priorityLabels[value] || value}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => priorityLabels[value] || value}
                  formatter={(value) => [`${value} הזדמנויות`, 'כמות']}
                />
                <Bar dataKey="count" fill="#00798C">
                  {summary.breakdown.byPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.priority] || '#6b7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 py-12">אין נתונים להצגה</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">הזדמנויות מובילות (Top 10)</h2>
        {summary.topOpportunities && summary.topOpportunities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">לקוח</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">סוג</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">תיאור</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">פוטנציאל</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">ביטחון</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">עדיפות</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {summary.topOpportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{opp.customer?.name}</div>
                      <div className="text-gray-500 text-xs">{opp.customer?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: COLORS[opp.type] || '#6b7280' }}
                      >
                        {typeLabels[opp.type] || opp.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                      <div className="truncate">{opp.description}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-green-600">
                      ₪{opp.potentialValue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          opp.confidence === 'HIGH'
                            ? 'bg-green-100 text-green-800'
                            : opp.confidence === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {opp.confidence === 'HIGH' ? 'גבוה' : opp.confidence === 'MEDIUM' ? 'בינוני' : 'נמוך'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: PRIORITY_COLORS[opp.priority] || '#6b7280' }}
                      >
                        {priorityLabels[opp.priority] || opp.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const actualValue = prompt('הזן את הערך בפועל (₪):');
                            if (actualValue) {
                              handleUpdateOpportunityStatus(opp.id, 'ACCEPTED', parseFloat(actualValue));
                            }
                          }}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                          title="סמן כהתקבלה"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => handleUpdateOpportunityStatus(opp.id, 'REJECTED')}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                          title="סמן כנדחתה"
                        >
                          ✗
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            לא נמצאו הזדמנויות. לחץ על "זהה הזדמנויות חדשות" כדי להתחיל.
          </div>
        )}
      </div>

      {summary.topOpportunities && summary.topOpportunities.length > 0 && summary.topOpportunities[0]?.recommendations && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">המלצות להזדמנות המובילה</h2>
          <div className="space-y-3">
            {summary.topOpportunities[0].recommendations.map((rec, idx) => (
              <div key={idx} className="border-r-4 border-teal-500 bg-teal-50 p-4 rounded">
                <div className="font-semibold text-gray-800 mb-1">✓ {rec.action}</div>
                <div className="text-sm text-gray-600 mb-1">{rec.reasoning}</div>
                <div className="text-sm text-teal-700 font-medium">{rec.expectedImpact}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">🤖 AI Growth Coach</h2>
          <button
            onClick={loadAIInsights}
            disabled={aiLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {aiLoading ? 'מייצר תובנות...' : 'קבל תובנות AI'}
          </button>
        </div>

        {aiInsights ? (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-3">📊 מטריקות מפתח</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">פוטנציאל כולל:</span>
                  <span className="font-bold text-teal-600 mr-2">
                    ₪{aiInsights.keyMetrics?.totalPotential?.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">שיעור המרה:</span>
                  <span className="font-bold text-blue-600 mr-2">
                    {aiInsights.keyMetrics?.conversionRate}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">ערך ממוצע:</span>
                  <span className="font-bold text-purple-600 mr-2">
                    ₪{aiInsights.keyMetrics?.avgDealSize?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {aiInsights.strategicRecommendations && aiInsights.strategicRecommendations.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-bold text-gray-800 mb-3">🎯 המלצות אסטרטגיות</h3>
                <div className="space-y-3">
                  {aiInsights.strategicRecommendations.map((rec, idx) => (
                    <div key={idx} className="border-r-4 border-purple-500 bg-purple-50 p-3 rounded">
                      <div className="font-semibold text-gray-800 mb-1">{rec.title}</div>
                      <div className="text-sm text-gray-700 mb-1">{rec.description}</div>
                      <div className="text-sm text-purple-700 font-medium">
                        צפי השפעה: {rec.expectedImpact}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiInsights.immediateActions && aiInsights.immediateActions.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-bold text-gray-800 mb-3">⚡ פעולות מיידיות</h3>
                <ul className="space-y-2">
                  {aiInsights.immediateActions.map((action, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-teal-600 ml-2">▶</span>
                      <span className="text-gray-700">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiInsights.forecast && (
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-bold text-gray-800 mb-3">🔮 תחזית</h3>
                <p className="text-gray-700">{aiInsights.forecast}</p>
              </div>
            )}

            {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-bold text-gray-800 mb-3">💡 המלצות כלליות</h3>
                <div className="space-y-3">
                  {aiInsights.recommendations.map((category, idx) => (
                    <div key={idx} className="border-r-4 border-blue-500 bg-blue-50 p-3 rounded">
                      <div className="font-semibold text-gray-800 mb-1">{category.title}</div>
                      <div className="text-sm text-gray-600 mb-2">{category.insight}</div>
                      <ul className="text-sm space-y-1">
                        {category.actionItems.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start">
                            <span className="text-blue-600 ml-2">•</span>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            לחץ על "קבל תובנות AI" כדי לקבל המלצות מותאמות אישית מה-AI Coach
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  LineChart, Line, BarChart, Bar, FunnelChart, Funnel,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const GrowthGetPage = () => {
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [sources, setSources] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [summaryRes, sourcesRes, timelineRes, aiRes] = await Promise.all([
        api.get(`/growth/get/summary?period=${period}`),
        api.get(`/growth/get/sources?period=${period}`),
        api.get(`/growth/get/timeline?period=${period}`),
        api.get(`/growth/get/ai-insights?period=${period}`)
      ]);

      setSummary(summaryRes.data.data);
      setSources(sourcesRes.data.data);
      setTimeline(timelineRes.data.data);
      setAiInsights(aiRes.data.data);
    } catch (err) {
      console.error('Error fetching growth data:', err);
      setError(err.response?.data?.error || 'שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
    }
  };

  const getSourceTypeName = (type) => {
    const types = {
      'landing_page': 'דף נחיתה',
      'event': 'אירוע',
      'appointment': 'פגישה',
      'manual': 'ידני',
      'referral': 'הפניה',
      'other': 'אחר'
    };
    return types[type] || type;
  };

  const funnelData = summary ? [
    { name: 'לידים', value: summary.totalLeads, fill: '#00798C' },
    { name: 'הזמנות', value: summary.totalBookings, fill: '#035368' },
    { name: 'משלמים', value: summary.totalPayments, fill: '#6C757D' }
  ] : [];

  const COLORS = ['#00798C', '#035368', '#6C757D', '#F8F9FA'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-teal"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-accent-teal mb-2">📈 GET - רכישת לקוחות</h1>
            <p className="text-text-secondary">מעקב אחר מקורות הרכישה ואפקטיביות הפאנל</p>
          </div>
          
          {/* Period Selector */}
          <div className="flex gap-2 bg-bg-card rounded-lg p-1 border border-accent-teal/20">
            {['7d', '30d', '90d'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-md transition-all ${
                  period === p
                    ? 'bg-accent-teal text-white font-bold'
                    : 'text-text-secondary hover:bg-bg-light'
                }`}
              >
                {p === '7d' ? '7 ימים' : p === '30d' ? '30 ימים' : '90 ימים'}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-bg-card border border-accent-teal/30 rounded-xl p-6 hover:shadow-lg transition-all">
            <div className="text-text-secondary text-sm mb-2">סה"כ לידים</div>
            <div className="text-3xl font-bold text-accent-teal">{summary?.totalLeads || 0}</div>
          </div>

          <div className="bg-bg-card border border-accent-teal/30 rounded-xl p-6 hover:shadow-lg transition-all">
            <div className="text-text-secondary text-sm mb-2">סה"כ הזמנות</div>
            <div className="text-3xl font-bold text-accent-teal">{summary?.totalBookings || 0}</div>
          </div>

          <div className="bg-bg-card border border-accent-teal/30 rounded-xl p-6 hover:shadow-lg transition-all">
            <div className="text-text-secondary text-sm mb-2">סה"כ משלמים</div>
            <div className="text-3xl font-bold text-accent-teal">{summary?.totalPayments || 0}</div>
          </div>

          <div className="bg-bg-card border border-accent-teal/30 rounded-xl p-6 hover:shadow-lg transition-all">
            <div className="text-text-secondary text-sm mb-2">סה"כ הכנסות</div>
            <div className="text-3xl font-bold text-accent-teal">₪{summary?.totalRevenue?.toLocaleString() || 0}</div>
          </div>

          <div className="bg-bg-card border border-accent-teal/30 rounded-xl p-6 hover:shadow-lg transition-all">
            <div className="text-text-secondary text-sm mb-2">אחוז המרה</div>
            <div className="text-3xl font-bold text-accent-teal">{summary?.conversionRate || 0}%</div>
          </div>
        </div>

        {/* Funnel Chart */}
        <div className="bg-bg-card border border-accent-teal/30 rounded-xl p-6">
          <h2 className="text-xl font-bold text-accent-teal mb-4">🎯 פאנל המרה</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" />
              <Tooltip />
              <Bar dataKey="value" fill="#00798C">
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Timeline Chart */}
        <div className="bg-bg-card border border-accent-teal/30 rounded-xl p-6">
          <h2 className="text-xl font-bold text-accent-teal mb-4">📊 ציר זמן</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => new Date(date).toLocaleDateString('he-IL')}
              />
              <Legend />
              <Line type="monotone" dataKey="leads" name="לידים" stroke="#00798C" strokeWidth={2} />
              <Line type="monotone" dataKey="bookings" name="הזמנות" stroke="#035368" strokeWidth={2} />
              <Line type="monotone" dataKey="payments" name="משלמים" stroke="#6C757D" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sources Table */}
        <div className="bg-bg-card border border-accent-teal/30 rounded-xl p-6">
          <h2 className="text-xl font-bold text-accent-teal mb-4">🔍 פילוח לפי מקורות</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-light">
                <tr>
                  <th className="px-4 py-3 text-right text-accent-teal font-bold">מקור</th>
                  <th className="px-4 py-3 text-right text-accent-teal font-bold">סוג</th>
                  <th className="px-4 py-3 text-right text-accent-teal font-bold">לידים</th>
                  <th className="px-4 py-3 text-right text-accent-teal font-bold">הזמנות</th>
                  <th className="px-4 py-3 text-right text-accent-teal font-bold">משלמים</th>
                  <th className="px-4 py-3 text-right text-accent-teal font-bold">הכנסות</th>
                  <th className="px-4 py-3 text-right text-accent-teal font-bold">אחוז המרה</th>
                </tr>
              </thead>
              <tbody>
                {sources.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-text-secondary">
                      אין נתונים זמינים. המערכת אוספת נתונים...
                    </td>
                  </tr>
                ) : (
                  sources.map((source, idx) => (
                    <tr key={idx} className="border-t border-accent-teal/10 hover:bg-bg-light transition-all">
                      <td className="px-4 py-3 text-text-primary">{source.sourceKey}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-1 bg-accent-teal/20 text-accent-teal rounded text-sm">
                          {getSourceTypeName(source.sourceType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-primary font-medium">{source.leads}</td>
                      <td className="px-4 py-3 text-text-primary font-medium">{source.bookings}</td>
                      <td className="px-4 py-3 text-text-primary font-medium">{source.payments}</td>
                      <td className="px-4 py-3 text-accent-teal font-bold">₪{source.revenue.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${source.conversionRate > 10 ? 'text-green-500' : 'text-text-secondary'}`}>
                          {source.conversionRate}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Insights Panel */}
        {aiInsights && (
          <div className="bg-gradient-to-br from-accent-teal/10 to-accent-teal/5 border border-accent-teal/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🤖</span>
              <h2 className="text-xl font-bold text-accent-teal">AI Acquisition Coach</h2>
            </div>

            <div className="space-y-4">
              {aiInsights.summary && (
                <div className="bg-white/50 rounded-lg p-4">
                  <p className="text-text-primary leading-relaxed">{aiInsights.summary}</p>
                </div>
              )}

              {aiInsights.topSources && aiInsights.topSources.length > 0 && (
                <div>
                  <h3 className="font-bold text-accent-teal mb-2">✅ מקורות מובילים:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {aiInsights.topSources.map((source, idx) => (
                      <li key={idx} className="text-text-primary">{source}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiInsights.weakSources && aiInsights.weakSources.length > 0 && (
                <div>
                  <h3 className="font-bold text-accent-teal mb-2">⚠️ מקורות חלשים:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {aiInsights.weakSources.map((source, idx) => (
                      <li key={idx} className="text-text-primary">{source}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                <div>
                  <h3 className="font-bold text-accent-teal mb-2">💡 המלצות פעולה:</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    {aiInsights.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-text-primary leading-relaxed">{rec}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default GrowthGetPage;

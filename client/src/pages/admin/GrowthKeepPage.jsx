import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer 
} from 'recharts';

const GrowthKeepPage = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [winBackOpportunities, setWinBackOpportunities] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const COLORS = {
    Champions: '#00798C',
    'Loyal Customers': '#0EA5C1',
    'Potential Loyalists': '#7DD5E8',
    'Recent Customers': '#C8E9F0',
    'Need Attention': '#FFB951',
    'At Risk': '#FF8C42',
    'Cannot Lose Them': '#E74C3C',
    'Hibernating': '#95A5A6',
    'Lost': '#7F8C8D',
    'About To Sleep': '#F39C12',
    'Promising': '#3498DB'
  };

  const RISK_COLORS = {
    low: '#00798C',
    medium: '#FFB951',
    high: '#FF8C42',
    critical: '#E74C3C'
  };

  useEffect(() => {
    fetchRetentionData();
  }, [selectedPeriod]);

  useEffect(() => {
    if (selectedSegment || selectedRisk) {
      fetchCustomersByFilter();
    }
  }, [selectedSegment, selectedRisk]);

  const fetchRetentionData = async () => {
    try {
      setLoading(true);
      
      const [summaryRes, opportunitiesRes] = await Promise.all([
        api.get(`/growth/keep/summary?days=${selectedPeriod}`),
        api.get('/growth/keep/win-back-opportunities')
      ]);

      setSummary(summaryRes.data.data);
      setWinBackOpportunities(opportunitiesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching retention data:', error);
      if (error.response?.status === 403) {
        alert('תכונה זו זמינה רק למנויי PREMIUM');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersByFilter = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSegment) params.append('segment', selectedSegment);
      if (selectedRisk) params.append('churnRisk', selectedRisk);

      const response = await api.get(`/growth/keep/segments?${params.toString()}`);

      setCustomers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchAIInsights = async () => {
    try {
      setAiLoading(true);

      const response = await api.post('/growth/keep/ai-insights', 
        { 
          segment: selectedSegment,
          customersData: customers.slice(0, 10)
        }
      );

      setAiInsights(response.data.data.insights);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      alert('שגיאה בטעינת תובנות AI');
    } finally {
      setAiLoading(false);
    }
  };

  const formatSegmentData = () => {
    if (!summary?.segmentCounts) return [];
    
    return Object.entries(summary.segmentCounts).map(([segment, count]) => ({
      name: segment,
      value: count
    }));
  };

  const formatRiskData = () => {
    if (!summary?.churnRiskCounts) return [];
    
    return Object.entries(summary.churnRiskCounts).map(([risk, count]) => ({
      name: risk,
      count
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#00798C] mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען נתוני שימור לקוחות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">שימור לקוחות (KEEP)</h1>
        <p className="text-gray-600 mt-2">ניתוח בריאות לקוחות, RFM scoring וחיזוי נטישה</p>
      </div>

      {/* Period Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">תקופת ניתוח</label>
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setSelectedPeriod(days)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === days
                  ? 'bg-[#00798C] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {days} ימים אחרונים
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-r-4 border-[#00798C]">
            <div className="text-sm text-gray-600 mb-1">סה"כ לקוחות</div>
            <div className="text-3xl font-bold text-gray-900">{summary.totalCustomers}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-r-4 border-[#0EA5C1]">
            <div className="text-sm text-gray-600 mb-1">ציון בריאות ממוצע</div>
            <div className="text-3xl font-bold text-gray-900">{summary.averageHealthScore}/100</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-r-4 border-[#FF8C42]">
            <div className="text-sm text-gray-600 mb-1">לקוחות בסיכון</div>
            <div className="text-3xl font-bold text-[#E74C3C]">{summary.atRiskCustomers}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-r-4 border-[#00798C]">
            <div className="text-sm text-gray-600 mb-1">אחוז שימור</div>
            <div className="text-3xl font-bold text-[#00798C]">{summary.retentionRate}%</div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Segment Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">פילוח לפי סגמנטים</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={formatSegmentData()}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {formatSegmentData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#95A5A6'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">פילוח לפי רמת סיכון</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formatRiskData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#00798C">
                {formatRiskData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name] || '#95A5A6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Win-Back Opportunities */}
      {winBackOpportunities.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">הזדמנויות Win-Back</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">שם לקוח</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סגמנט</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">רמת סיכון</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">LTV</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ימים מאז</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">המלצה</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {winBackOpportunities.slice(0, 10).map((opportunity, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {opportunity.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {opportunity.segment}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        opportunity.churnRisk === 'critical' ? 'bg-red-100 text-red-800' :
                        opportunity.churnRisk === 'high' ? 'bg-orange-100 text-orange-800' :
                        opportunity.churnRisk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {opportunity.churnRisk}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₪{opportunity.lifetimeValue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {opportunity.daysSinceLastInteraction} ימים
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {opportunity.recommendation?.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Retention Coach */}
      <div className="bg-gradient-to-br from-[#00798C] to-[#035368] rounded-lg shadow-lg p-6 text-white mb-8">
        <h2 className="text-2xl font-bold mb-4">🤖 יועץ שימור AI</h2>
        <p className="mb-4 opacity-90">
          קבל המלצות מותאמות אישית לשיפור שימור הלקוחות שלך
        </p>

        {aiInsights ? (
          <div className="bg-white/10 rounded-lg p-4 whitespace-pre-wrap">
            {aiInsights}
          </div>
        ) : (
          <button
            onClick={fetchAIInsights}
            disabled={aiLoading}
            className="bg-white text-[#00798C] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {aiLoading ? 'מייצר תובנות...' : 'צור המלצות AI'}
          </button>
        )}
      </div>
    </div>
  );
};

export default GrowthKeepPage;

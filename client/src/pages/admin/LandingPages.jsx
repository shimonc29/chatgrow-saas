import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/Layout/MainLayout';
import axios from 'axios';

const LandingPages = () => {
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/landing-pages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPages(response.data);
    } catch (err) {
      setError('שגיאה בטעינת הדפים');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק דף זה?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/landing-pages/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPages(pages.filter(p => p._id !== id));
    } catch (err) {
      console.error('Error deleting page:', err);
      alert('שגיאה במחיקת הדף');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/landing-pages/${id}/duplicate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPages([response.data, ...pages]);
    } catch (err) {
      console.error('Error duplicating page:', err);
      alert('שגיאה בשכפול הדף');
    }
  };

  const copyLink = (slug) => {
    const link = `${window.location.origin}/landing/${slug}`;
    navigator.clipboard.writeText(link);
    alert('✓ הקישור הועתק!');
  };

  const getStatusBadge = (status) => {
    const badges = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    const labels = {
      published: 'פורסם',
      draft: 'טיוטה',
      archived: 'בארכיון'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getConversionRate = (views, conversions) => {
    if (views === 0) return '0%';
    return ((conversions / views) * 100).toFixed(1) + '%';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-gray-600">טוען...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">🎨 דפי נחיתה</h1>
            <p className="text-gray-600 mt-2">בנה דפים מרשימים לשיווק האירועים והתורים שלך</p>
          </div>
          <button
            onClick={() => navigate('/landing-pages/new')}
            className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-reverse space-x-2"
          >
            <span>➕</span>
            <span>צור דף נחיתה חדש</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Stats Overview */}
        {pages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">סה"כ דפים</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{pages.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📄</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">דפים פורסמו</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {pages.filter(p => p.status === 'published').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">סה"כ צפיות</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">
                    {pages.reduce((sum, p) => sum + (p.analytics?.views || 0), 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👁️</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">סה"כ המרות</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">
                    {pages.reduce((sum, p) => sum + (p.analytics?.conversions || 0), 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pages List */}
        {pages.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">אין עדיין דפי נחיתה</h3>
            <p className="text-gray-600 mb-6">צור את דף הנחיתה הראשון שלך ותתחיל לשווק!</p>
            <button
              onClick={() => navigate('/landing-pages/new')}
              className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              ➕ צור דף נחיתה
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page) => (
              <div key={page._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Thumbnail Preview */}
                <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-500 relative">
                  {page.content?.hero?.image ? (
                    <img src={page.content.hero.image} alt={page.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-6xl">🎨</span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    {getStatusBadge(page.status)}
                  </div>
                </div>

                {/* Page Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{page.name}</h3>
                  
                  <div className="flex items-center space-x-reverse space-x-2 text-sm text-gray-500 mb-4">
                    <span className="px-2 py-1 bg-gray-100 rounded">
                      {page.template}
                    </span>
                    {page.linkedTo?.type !== 'none' && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {page.linkedTo.type === 'event' ? '📅 אירוע' : '📋 תור'}
                      </span>
                    )}
                  </div>

                  {/* Analytics */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-xs text-gray-500">צפיות</div>
                      <div className="text-lg font-bold text-gray-800">{page.analytics?.views || 0}</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-xs text-gray-500">המרות</div>
                      <div className="text-lg font-bold text-green-600">{page.analytics?.conversions || 0}</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-xs text-gray-500">שיעור</div>
                      <div className="text-lg font-bold text-blue-600">
                        {getConversionRate(page.analytics?.views || 0, page.analytics?.conversions || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate(`/landing-pages/edit/${page._id}`)}
                      className="flex-1 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      ✏️ ערוך
                    </button>
                    <button
                      onClick={() => copyLink(page.slug)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                      title="העתק קישור"
                    >
                      🔗
                    </button>
                    <button
                      onClick={() => window.open(`/landing/${page.slug}`, '_blank')}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                      title="צפייה"
                      disabled={page.status !== 'published'}
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => handleDuplicate(page._id)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                      title="שכפל"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => handleDelete(page._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                      title="מחק"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default LandingPages;

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
      // Ensure response.data is an array
      setPages(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('שגיאה בטעינת הדפים');
      console.error('Error fetching pages:', err);
      setPages([]); // Set empty array on error
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
        <div className="flex items-center justify-center h-64 bg-app-navy min-h-screen">
          <div className="text-xl text-text-light">טוען...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 md:p-8 bg-app-navy min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-accent-copper">🎨 דפי נחיתה</h1>
            <p className="text-sm sm:text-base text-text-light mt-2">בנה דפים מרשימים לשיווק האירועים והתורים שלך</p>
          </div>
          <button
            onClick={() => navigate('/landing-pages/new')}
            className="w-full sm:w-auto bg-gradient-to-r from-action-blue to-accent-copper text-white px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all shadow-lg shadow-action-blue/50 hover:shadow-action-blue/70 flex items-center justify-center space-x-reverse space-x-2"
          >
            <span>➕</span>
            <span className="whitespace-nowrap">צור דף נחיתה חדש</span>
          </button>
        </div>

        {error && (
          <div className="bg-app-navy border border-red-600/50 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Stats Overview */}
        {pages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-app-navy border border-accent-copper/30 rounded-xl shadow-lg p-4 sm:p-6 hover:border-accent-copper/50 hover:shadow-accent-copper/20 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-subtle text-xs sm:text-sm">סה"כ דפים</p>
                  <p className="text-2xl sm:text-3xl font-bold text-accent-copper mt-1">{pages.length}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl sm:text-2xl">📄</span>
                </div>
              </div>
            </div>

            <div className="bg-app-navy border border-accent-copper/30 rounded-xl shadow-lg p-4 sm:p-6 hover:border-accent-copper/50 hover:shadow-accent-copper/20 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-subtle text-xs sm:text-sm">דפים פורסמו</p>
                  <p className="text-2xl sm:text-3xl font-bold text-accent-copper mt-1">
                    {pages.filter(p => p.status === 'published').length}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl sm:text-2xl">✓</span>
                </div>
              </div>
            </div>

            <div className="bg-app-navy border border-accent-copper/30 rounded-xl shadow-lg p-4 sm:p-6 hover:border-accent-copper/50 hover:shadow-accent-copper/20 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-subtle text-xs sm:text-sm">סה"כ צפיות</p>
                  <p className="text-2xl sm:text-3xl font-bold text-accent-copper mt-1">
                    {pages.reduce((sum, p) => sum + (p.analytics?.views || 0), 0)}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl sm:text-2xl">👁️</span>
                </div>
              </div>
            </div>

            <div className="bg-app-navy border border-accent-copper/30 rounded-xl shadow-lg p-4 sm:p-6 hover:border-accent-copper/50 hover:shadow-accent-copper/20 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-subtle text-xs sm:text-sm">סה"כ המרות</p>
                  <p className="text-2xl sm:text-3xl font-bold text-accent-copper mt-1">
                    {pages.reduce((sum, p) => sum + (p.analytics?.conversions || 0), 0)}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl sm:text-2xl">🎯</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pages List */}
        {pages.length === 0 ? (
          <div className="bg-app-navy border border-accent-copper/30 rounded-xl shadow-lg p-8 sm:p-12 text-center">
            <div className="text-4xl sm:text-6xl mb-4">🎨</div>
            <h3 className="text-lg sm:text-xl font-bold text-accent-copper mb-2">אין עדיין דפי נחיתה</h3>
            <p className="text-sm sm:text-base text-text-light mb-6">צור את דף הנחיתה הראשון שלך ותתחיל לשווק!</p>
            <button
              onClick={() => navigate('/landing-pages/new')}
              className="bg-gradient-to-r from-action-blue to-accent-copper text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg shadow-action-blue/50 hover:shadow-action-blue/70"
            >
              ➕ צור דף נחיתה
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {pages.map((page) => (
              <div key={page._id} className="bg-app-navy border border-accent-copper/30 rounded-xl shadow-lg overflow-hidden hover:border-accent-copper/50 hover:shadow-accent-copper/20 transition-all">
                {/* Thumbnail Preview */}
                <div className="h-48 bg-gradient-to-br from-action-blue/20 to-accent-copper/20 relative">
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
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-accent-copper mb-2 truncate">{page.name}</h3>
                  
                  <div className="flex items-center flex-wrap space-x-reverse space-x-2 text-xs sm:text-sm text-text-subtle mb-4 gap-2">
                    <span className="px-2 py-1 bg-app-navy border border-accent-copper/20 rounded">
                      {page.template}
                    </span>
                    {page.linkedTo?.type !== 'none' && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-accent-copper border border-accent-copper/30 rounded">
                        {page.linkedTo.type === 'event' ? '📅 אירוע' : '📋 תור'}
                      </span>
                    )}
                  </div>

                  {/* Analytics */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-black/50 border border-accent-copper/20 rounded">
                      <div className="text-xs text-text-subtle">צפיות</div>
                      <div className="text-base sm:text-lg font-bold text-text-light">{page.analytics?.views || 0}</div>
                    </div>
                    <div className="text-center p-2 bg-black/50 border border-accent-copper/20 rounded">
                      <div className="text-xs text-text-subtle">המרות</div>
                      <div className="text-base sm:text-lg font-bold text-accent-copper">{page.analytics?.conversions || 0}</div>
                    </div>
                    <div className="text-center p-2 bg-black/50 border border-accent-copper/20 rounded">
                      <div className="text-xs text-text-subtle">שיעור</div>
                      <div className="text-base sm:text-lg font-bold text-accent-copper">
                        {getConversionRate(page.analytics?.views || 0, page.analytics?.conversions || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                    <button
                      onClick={() => navigate(`/landing-pages/edit/${page._id}`)}
                      className="flex-1 sm:flex-none bg-gradient-to-r from-action-blue to-accent-copper text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-action-blue/50 hover:shadow-action-blue/70"
                    >
                      ✏️ ערוך
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyLink(page.slug)}
                        className="flex-1 bg-app-navy text-text-light border border-accent-copper/20 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all hover:border-accent-copper/50"
                        title="העתק קישור"
                      >
                        🔗
                      </button>
                      <button
                        onClick={() => window.open(`/landing/${page.slug}`, '_blank')}
                        className="flex-1 bg-app-navy text-text-light border border-accent-copper/20 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all hover:border-accent-copper/50 disabled:opacity-50"
                        title="צפייה"
                        disabled={page.status !== 'published'}
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleDuplicate(page._id)}
                        className="flex-1 bg-app-navy text-text-light border border-accent-copper/20 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all hover:border-accent-copper/50"
                        title="שכפל"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => handleDelete(page._id)}
                        className="flex-1 bg-red-900/50 text-red-400 border border-red-600/30 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all hover:border-red-500/50"
                        title="מחק"
                      >
                        🗑️
                      </button>
                    </div>
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

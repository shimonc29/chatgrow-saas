import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../components/Layout/MainLayout';
import axios from 'axios';

const TEMPLATES = {
  modern: {
    name: 'מודרני',
    preview: '🎨',
    colors: { primary: '#8B5CF6', secondary: '#EC4899', bg: '#FFFFFF' }
  },
  classic: {
    name: 'קלאסי',
    preview: '📜',
    colors: { primary: '#2563EB', secondary: '#1E40AF', bg: '#F9FAFB' }
  },
  colorful: {
    name: 'צבעוני',
    preview: '🌈',
    colors: { primary: '#F59E0B', secondary: '#EF4444', bg: '#FEF3C7' }
  },
  minimal: {
    name: 'מינימליסטי',
    preview: '⚪',
    colors: { primary: '#000000', secondary: '#6B7280', bg: '#FFFFFF' }
  },
  elegant: {
    name: 'אלגנטי',
    preview: '✨',
    colors: { primary: '#9333EA', secondary: '#C026D3', bg: '#FAF5FF' }
  }
};

const LandingPageEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    template: 'modern',
    content: {
      hero: {
        headline: 'ברוכים הבאים!',
        subheadline: 'הצטרפו אלינו לחוויה בלתי נשכחת',
        image: '',
        ctaText: 'הירשם עכשיו',
        ctaColor: '#8B5CF6'
      },
      about: {
        title: 'אודות',
        description: '',
        image: ''
      },
      features: [
        { icon: '✨', title: '', description: '' }
      ],
      testimonials: [],
      footer: {
        text: '© 2025 כל הזכויות שמורות',
        links: []
      }
    },
    styling: {
      primaryColor: '#8B5CF6',
      secondaryColor: '#EC4899',
      backgroundColor: '#FFFFFF',
      fontFamily: 'Heebo'
    },
    linkedTo: {
      type: 'none',
      id: null
    },
    seo: {
      title: '',
      description: '',
      keywords: [],
      ogImage: ''
    },
    status: 'draft'
  });

  useEffect(() => {
    if (id && id !== 'new') {
      fetchPage();
    }
    fetchEvents();
  }, [id]);

  const fetchPage = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/landing-pages/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData(response.data);
    } catch (err) {
      console.error(err);
      alert('שגיאה בטעינת הדף');
      navigate('/landing-pages');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/events', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
      setEvents([]);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('נא להזין שם לדף');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      if (id && id !== 'new') {
        await axios.put(`/api/landing-pages/${id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/landing-pages/create', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      alert('✓ הדף נשמר בהצלחה!');
      navigate('/landing-pages');
    } catch (err) {
      console.error(err);
      alert('שגיאה בשמירת הדף');
    } finally {
      setSaving(false);
    }
  };

  const updateContent = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [section]: {
          ...prev.content[section],
          [field]: value
        }
      }
    }));
  };

  const updateStyling = (field, value) => {
    setFormData(prev => ({
      ...prev,
      styling: {
        ...prev.styling,
        [field]: value
      }
    }));
  };

  const selectTemplate = (templateKey) => {
    const template = TEMPLATES[templateKey];
    setFormData(prev => ({
      ...prev,
      template: templateKey,
      styling: {
        ...prev.styling,
        primaryColor: template.colors.primary,
        secondaryColor: template.colors.secondary,
        backgroundColor: template.colors.bg
      },
      content: {
        ...prev.content,
        hero: {
          ...prev.content.hero,
          ctaColor: template.colors.primary
        }
      }
    }));
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        features: [
          ...prev.content.features,
          { icon: '✨', title: '', description: '' }
        ]
      }
    }));
  };

  const updateFeature = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        features: prev.content.features.map((f, i) => 
          i === index ? { ...f, [field]: value } : f
        )
      }
    }));
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        features: prev.content.features.filter((_, i) => i !== index)
      }
    }));
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
            <h1 className="text-2xl sm:text-3xl font-bold text-accent-copper">
              {id && id !== 'new' ? '✏️ ערוך דף נחיתה' : '➕ צור דף נחיתה חדש'}
            </h1>
            <p className="text-sm sm:text-base text-text-light mt-2">עצב דף נחיתה מושך לשיווק האירועים והתורים שלך</p>
          </div>
          <div className="flex w-full sm:w-auto space-x-reverse space-x-3">
            <button
              onClick={() => navigate('/landing-pages')}
              className="flex-1 sm:flex-none bg-app-navy text-text-light border border-accent-copper/20 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all hover:border-accent-copper/50 text-sm sm:text-base"
            >
              ביטול
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-none bg-gradient-to-r from-action-blue to-accent-copper text-white px-4 sm:px-6 py-3 rounded-lg font-semibold disabled:opacity-50 transition-all shadow-lg shadow-action-blue/50 hover:shadow-action-blue/70 text-sm sm:text-base"
            >
              {saving ? '⏳ שומר...' : '💾 שמור'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Editor Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-app-navy border border-accent-copper/30 rounded-xl shadow-lg p-4 sm:p-6 hover:border-accent-copper/50 hover:shadow-accent-copper/20 transition-all">
              <h3 className="text-lg sm:text-xl font-bold text-accent-copper mb-4">📝 פרטים בסיסיים</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm sm:text-base text-accent-copper font-medium mb-2">שם הדף</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="שם הדף (לניהול פנימי)"
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-app-navy border border-accent-copper/30 text-white rounded-lg focus:ring-2 focus:ring-accent-copper focus:border-transparent placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-base text-accent-copper font-medium mb-2">סטטוס</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-app-navy border border-accent-copper/30 text-white rounded-lg focus:ring-2 focus:ring-accent-copper focus:border-transparent"
                  >
                    <option value="draft">טיוטה</option>
                    <option value="published">פורסם</option>
                    <option value="archived">בארכיון</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm sm:text-base text-accent-copper font-medium mb-2">חבר לאירוע/תור</label>
                  <select
                    value={formData.linkedTo.type}
                    onChange={(e) => setFormData({
                      ...formData,
                      linkedTo: { type: e.target.value, id: null }
                    })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-app-navy border border-accent-copper/30 text-white rounded-lg focus:ring-2 focus:ring-accent-copper focus:border-transparent mb-2"
                  >
                    <option value="none">ללא חיבור</option>
                    <option value="event">אירוע</option>
                    <option value="appointment">תור</option>
                  </select>

                  {formData.linkedTo.type === 'event' && (
                    <select
                      value={formData.linkedTo.id || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        linkedTo: { ...formData.linkedTo, id: e.target.value }
                      })}
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-app-navy border border-accent-copper/30 text-white rounded-lg focus:ring-2 focus:ring-accent-copper focus:border-transparent"
                    >
                      <option value="">בחר אירוע</option>
                      {events.map(event => (
                        <option key={event._id} value={event._id}>{event.title}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Template Selection */}
            <div className="bg-app-navy border border-accent-copper/30 rounded-xl shadow-lg p-4 sm:p-6 hover:border-accent-copper/50 hover:shadow-accent-copper/20 transition-all">
              <h3 className="text-lg sm:text-xl font-bold text-accent-copper mb-4">🎨 בחר תבנית</h3>
              
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
                {Object.entries(TEMPLATES).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => selectTemplate(key)}
                    className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                      formData.template === key
                        ? 'border-accent-copper bg-accent-copper/20'
                        : 'border-accent-copper/30 hover:border-accent-copper/50 bg-app-navy'
                    }`}
                  >
                    <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">{template.preview}</div>
                    <div className="text-xs sm:text-sm font-medium text-text-light">{template.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Hero Section */}
            <div className="bg-app-navy border border-accent-copper/30 rounded-xl shadow-lg p-4 sm:p-6 hover:border-accent-copper/50 hover:shadow-accent-copper/20 transition-all">
              <h3 className="text-lg sm:text-xl font-bold text-accent-copper mb-4">🎯 קטע גיבור (Hero)</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm sm:text-base text-accent-copper font-medium mb-2">כותרת ראשית</label>
                  <input
                    type="text"
                    value={formData.content.hero.headline}
                    onChange={(e) => updateContent('hero', 'headline', e.target.value)}
                    placeholder="כותרת מושכת"
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-app-navy border border-accent-copper/30 text-white rounded-lg focus:ring-2 focus:ring-accent-copper focus:border-transparent placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-base text-accent-copper font-medium mb-2">כותרת משנה</label>
                  <textarea
                    value={formData.content.hero.subheadline}
                    onChange={(e) => updateContent('hero', 'subheadline', e.target.value)}
                    placeholder="תיאור קצר"
                    rows="3"
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-app-navy border border-accent-copper/30 text-white rounded-lg focus:ring-2 focus:ring-accent-copper focus:border-transparent placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-base text-accent-copper font-medium mb-2">תמונת רקע (URL)</label>
                  <input
                    type="url"
                    value={formData.content.hero.image}
                    onChange={(e) => updateContent('hero', 'image', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-app-navy border border-accent-copper/30 text-white rounded-lg focus:ring-2 focus:ring-accent-copper focus:border-transparent placeholder-gray-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm sm:text-base text-accent-copper font-medium mb-2">טקסט כפתור</label>
                    <input
                      type="text"
                      value={formData.content.hero.ctaText}
                      onChange={(e) => updateContent('hero', 'ctaText', e.target.value)}
                      placeholder="הירשם עכשיו"
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-app-navy border border-accent-copper/30 text-white rounded-lg focus:ring-2 focus:ring-accent-copper focus:border-transparent placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-base text-accent-copper font-medium mb-2">צבע כפתור</label>
                    <input
                      type="color"
                      value={formData.content.hero.ctaColor}
                      onChange={(e) => updateContent('hero', 'ctaColor', e.target.value)}
                      className="w-full h-10 bg-app-navy border border-accent-copper/30 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="bg-app-navy border border-accent-copper/30 rounded-xl shadow-lg p-4 sm:p-6 hover:border-accent-copper/50 hover:shadow-accent-copper/20 transition-all">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-accent-copper">⭐ תכונות / יתרונות</h3>
                <button
                  onClick={addFeature}
                  className="bg-gradient-to-r from-action-blue to-accent-copper text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-action-blue/50 hover:shadow-action-blue/70"
                >
                  ➕ הוסף
                </button>
              </div>

              <div className="space-y-4">
                {formData.content.features.map((feature, index) => (
                  <div key={index} className="border border-accent-copper/30 bg-black/50 rounded-lg p-3 sm:p-4">
                    <div className="flex justify-between items-start mb-3">
                      <input
                        type="text"
                        value={feature.icon}
                        onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                        placeholder="אייקון"
                        className="w-16 sm:w-20 px-2 py-1 bg-app-navy border border-accent-copper/30 text-white rounded text-xl sm:text-2xl text-center"
                      />
                      <button
                        onClick={() => removeFeature(index)}
                        className="text-red-400 hover:text-red-300 text-sm sm:text-base"
                      >
                        🗑️
                      </button>
                    </div>
                    <input
                      type="text"
                      value={feature.title}
                      onChange={(e) => updateFeature(index, 'title', e.target.value)}
                      placeholder="כותרת התכונה"
                      className="w-full px-3 py-2 text-sm sm:text-base bg-app-navy border border-accent-copper/30 text-white rounded-lg mb-2 focus:ring-2 focus:ring-accent-copper placeholder-gray-500"
                    />
                    <textarea
                      value={feature.description}
                      onChange={(e) => updateFeature(index, 'description', e.target.value)}
                      placeholder="תיאור התכונה"
                      rows="2"
                      className="w-full px-3 py-2 text-sm sm:text-base bg-app-navy border border-accent-copper/30 text-white rounded-lg focus:ring-2 focus:ring-accent-copper placeholder-gray-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Styling */}
            <div className="bg-app-navy border border-accent-copper/30 rounded-xl shadow-lg p-4 sm:p-6 hover:border-accent-copper/50 hover:shadow-accent-copper/20 transition-all">
              <h3 className="text-lg sm:text-xl font-bold text-accent-copper mb-4">🎨 עיצוב וצבעים</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm sm:text-base text-accent-copper font-medium mb-2">צבע ראשי</label>
                  <input
                    type="color"
                    value={formData.styling.primaryColor}
                    onChange={(e) => updateStyling('primaryColor', e.target.value)}
                    className="w-full h-10 bg-app-navy border border-accent-copper/30 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base text-accent-copper font-medium mb-2">צבע משני</label>
                  <input
                    type="color"
                    value={formData.styling.secondaryColor}
                    onChange={(e) => updateStyling('secondaryColor', e.target.value)}
                    className="w-full h-10 bg-app-navy border border-accent-copper/30 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base text-accent-copper font-medium mb-2">צבע רקע</label>
                  <input
                    type="color"
                    value={formData.styling.backgroundColor}
                    onChange={(e) => updateStyling('backgroundColor', e.target.value)}
                    className="w-full h-10 bg-app-navy border border-accent-copper/30 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel - Hidden on mobile, visible on desktop */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-app-navy border border-accent-copper/30 rounded-xl shadow-lg p-4 sm:p-6 sticky top-8">
              <h3 className="text-base sm:text-lg font-bold text-accent-copper mb-4">👁️ תצוגה מקדימה</h3>
              
              <div 
                className="border-2 border-gray-200 rounded-lg overflow-hidden"
                style={{ backgroundColor: formData.styling.backgroundColor }}
              >
                {/* Hero Preview */}
                <div 
                  className="p-6 sm:p-8 text-center"
                  style={{ 
                    backgroundColor: formData.styling.primaryColor + '20',
                    backgroundImage: formData.content.hero.image ? `url(${formData.content.hero.image})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <h1 
                    className="text-xl sm:text-2xl font-bold mb-2"
                    style={{ color: formData.styling.primaryColor }}
                  >
                    {formData.content.hero.headline}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-700 mb-4">
                    {formData.content.hero.subheadline}
                  </p>
                  <button
                    style={{ backgroundColor: formData.content.hero.ctaColor }}
                    className="text-white px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold"
                  >
                    {formData.content.hero.ctaText}
                  </button>
                </div>

                {/* Features Preview */}
                {formData.content.features.length > 0 && (
                  <div className="p-4">
                    <div className="space-y-2">
                      {formData.content.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-start space-x-reverse space-x-2 text-right">
                          <span className="text-lg sm:text-xl">{feature.icon}</span>
                          <div>
                            <div className="text-xs font-bold text-gray-800">{feature.title || 'כותרת'}</div>
                            <div className="text-xs text-gray-600">{feature.description?.substring(0, 30) || 'תיאור'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 text-xs text-text-subtle text-center">
                תצוגה מקדימה - הגרסה המלאה תהיה זמינה בדף הציבורי
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default LandingPageEditor;

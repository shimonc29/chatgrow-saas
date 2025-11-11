import { useState, useEffect } from 'react';
import axios from 'axios';

export default function MediaLibrary() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/media', {
        headers: { Authorization: `Bearer ${token}` },
        params: searchTerm ? { search: searchTerm } : {}
      });
      setMedia(response.data);
    } catch (error) {
      console.error('Error fetching media:', error);
      alert('שגיאה בטעינת המדיה');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('גודל הקובץ חייב להיות עד 10MB');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/media', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMedia([response.data, ...media]);
      alert('התמונה הועלתה בהצלחה');
    } catch (error) {
      console.error('Error uploading:', error);
      alert('שגיאה בהעלאת התמונה');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק תמונה זו?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/media/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMedia(media.filter(m => m._id !== id));
      setSelectedMedia(null);
      alert('התמונה נמחקה בהצלחה');
    } catch (error) {
      console.error('Error deleting:', error);
      alert('שגיאה במחיקת התמונה');
    }
  };

  const handleUpdateTags = async (id, tags) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/media/${id}`, 
        { tags },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMedia(media.map(m => m._id === id ? response.data : m));
      setSelectedMedia(response.data);
    } catch (error) {
      console.error('Error updating tags:', error);
      alert('שגיאה בעדכון התגיות');
    }
  };

  const filteredMedia = media.filter(m => 
    searchTerm === '' || 
    m.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">📚 ספריית מדיה</h1>
            <label className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors">
              {uploading ? '📤 מעלה...' : '📤 העלה תמונה'}
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 חפש תמונות..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchMedia()}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); fetchMedia(); }}
                className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="mt-3 text-sm text-gray-600">
            סה"כ {filteredMedia.length} תמונות
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="text-gray-400 text-xl">⏳ טוען...</div>
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-20 text-center">
            <div className="text-gray-400 text-6xl mb-4">🖼️</div>
            <h3 className="text-xl text-gray-600 mb-2">אין תמונות</h3>
            <p className="text-gray-500">העלה תמונות כדי להתחיל</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredMedia.map((item) => (
              <div
                key={item._id}
                onClick={() => setSelectedMedia(item)}
                className={`bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                  selectedMedia?._id === item._id ? 'ring-4 ring-teal-500' : ''
                }`}
              >
                <div className="aspect-square bg-gray-100 relative">
                  <img
                    src={item.url}
                    alt={item.originalName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {selectedMedia?._id === item._id && (
                    <div className="absolute top-2 right-2 bg-teal-500 text-white rounded-full p-1">
                      ✓
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.originalName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatFileSize(item.size)}
                  </p>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.slice(0, 2).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{item.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Details Sidebar */}
        {selectedMedia && (
          <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Close Button */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">פרטי תמונה</h2>
                <button
                  onClick={() => setSelectedMedia(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                {/* Image Preview */}
                <div className="bg-gray-100 rounded-lg mb-6">
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.originalName}
                    className="w-full h-auto max-h-96 object-contain rounded-lg"
                  />
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      שם קובץ
                    </label>
                    <p className="text-gray-900 break-all">{selectedMedia.originalName}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={selectedMedia.url}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedMedia.url);
                          alert('הקישור הועתק!');
                        }}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
                      >
                        📋 העתק
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        גודל
                      </label>
                      <p className="text-gray-900">{formatFileSize(selectedMedia.size)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        סוג
                      </label>
                      <p className="text-gray-900">{selectedMedia.mimeType}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      תאריך העלאה
                    </label>
                    <p className="text-gray-900">
                      {new Date(selectedMedia.createdAt).toLocaleDateString('he-IL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      תגיות
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedMedia.tags?.map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="הוסף תגיות (מופרדות בפסיקים)"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                          handleUpdateTags(selectedMedia._id, tags);
                          e.target.value = '';
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      לחץ Enter להוספת תגיות
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={() => window.open(selectedMedia.url, '_blank')}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg"
                  >
                    🔗 פתח בטאב חדש
                  </button>
                  <button
                    onClick={() => handleDelete(selectedMedia._id)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                  >
                    🗑️ מחק
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

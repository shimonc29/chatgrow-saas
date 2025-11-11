import { useState, useEffect } from 'react';
import axios from 'axios';

export default function MediaPicker({ onSelect, onClose, selectedUrl = null }) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState(selectedUrl);

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
      setSelected(response.data.url);
    } catch (error) {
      console.error('Error uploading:', error);
      alert('שגיאה בהעלאת התמונה');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSelect = () => {
    if (selected) {
      onSelect(selected);
      onClose();
    } else {
      alert('נא לבחור תמונה');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">📚 בחר תמונה מהספרייה</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
            >
              ✕
            </button>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 חפש תמונות..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchMedia()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <label className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors whitespace-nowrap">
              {uploading ? '📤 מעלה...' : '📤 העלה חדשה'}
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          <div className="mt-3 text-sm text-gray-600">
            {selected ? (
              <span className="text-teal-600 font-medium">✓ תמונה נבחרה</span>
            ) : (
              <span>בחר תמונה מהרשימה או העלה חדשה</span>
            )}
          </div>
        </div>

        {/* Gallery */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-20">
              <div className="text-gray-400 text-xl">⏳ טוען...</div>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-400 text-6xl mb-4">🖼️</div>
              <h3 className="text-xl text-gray-600 mb-2">אין תמונות</h3>
              <p className="text-gray-500">העלה תמונות כדי להתחיל</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredMedia.map((item) => (
                <div
                  key={item._id}
                  onClick={() => setSelected(item.url)}
                  className={`bg-white rounded-lg border-2 overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                    selected === item.url 
                      ? 'border-teal-500 ring-2 ring-teal-200' 
                      : 'border-gray-200 hover:border-teal-300'
                  }`}
                >
                  <div className="aspect-square bg-gray-100 relative">
                    <img
                      src={item.url}
                      alt={item.originalName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {selected === item.url && (
                      <div className="absolute top-2 right-2 bg-teal-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                        ✓
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {item.originalName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(item.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex gap-3 flex-shrink-0">
          <button
            onClick={handleSelect}
            disabled={!selected}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              selected
                ? 'bg-teal-600 hover:bg-teal-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            ✓ בחר תמונה זו
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}

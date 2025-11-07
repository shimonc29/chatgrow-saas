import { useState } from 'react';
import axios from 'axios';

const ImageUploader = ({ currentImage, onImageChange, label }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('גודל הקובץ חורג מ-10MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('יש להעלות קובץ תמונה בלבד');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const token = localStorage.getItem('token');
      
      const fileExtension = '.' + file.name.split('.').pop();
      const uploadUrlResponse = await axios.post(
        '/api/uploads/get-upload-url',
        { fileExtension },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { uploadURL, objectPath } = uploadUrlResponse.data;

      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      onImageChange(objectPath);

      alert('✓ התמונה הועלתה בהצלחה!');
    } catch (err) {
      console.error('Upload error:', err);
      setError('שגיאה בהעלאת התמונה');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    if (confirm('האם למחוק את התמונה?')) {
      onImageChange('');
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}

      <div className="space-y-2">
        {currentImage && (
          <div className="relative inline-block">
            <img
              src={currentImage.startsWith('http') ? currentImage : `/api/uploads${currentImage}`}
              alt="Preview"
              className="h-32 w-auto rounded-lg border border-accent-teal/30 object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <label className="cursor-pointer bg-gradient-to-r from-accent-teal to-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {uploading ? 'מעלה...' : currentImage ? 'החלף תמונה' : 'בחר תמונה'}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
          </label>

          {currentImage && !uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              הסר
            </button>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        {uploading && (
          <p className="text-accent-teal text-sm">מעלה תמונה...</p>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;

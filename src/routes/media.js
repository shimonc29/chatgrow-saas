const express = require('express');
const router = express.Router();
const multer = require('multer');
const Media = require('../models/Media');
const auth = require('../middleware/auth');
const objectStorageService = require('../services/objectStorageService');

const authenticateToken = auth.authenticate();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('רק קבצי תמונה מותרים'));
    }
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, tag, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    const query = { uploadedBy: req.user.id };
    
    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (tag) {
      query.tags = tag;
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    
    const media = await Media.find(query)
      .sort(sortOptions)
      .lean();
    
    res.json(media);
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ message: 'שגיאה בטעינת המדיה' });
  }
});

router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'לא נבחר קובץ' });
    }

    const uploadResult = await objectStorageService.uploadFile(req.file);
    
    const { tags, description } = req.body;
    
    const media = new Media({
      fileName: uploadResult.fileName,
      originalName: req.file.originalname,
      url: uploadResult.url,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user.id,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      description: description || ''
    });
    
    await media.save();
    
    res.status(201).json(media);
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ message: 'שגיאה בהעלאת הקובץ' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { tags, description } = req.body;
    
    const media = await Media.findOne({
      _id: req.params.id,
      uploadedBy: req.user.id
    });
    
    if (!media) {
      return res.status(404).json({ message: 'קובץ לא נמצא' });
    }
    
    if (tags !== undefined) {
      media.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    }
    
    if (description !== undefined) {
      media.description = description;
    }
    
    await media.save();
    
    res.json(media);
  } catch (error) {
    console.error('Error updating media:', error);
    res.status(500).json({ message: 'שגיאה בעדכון הקובץ' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const media = await Media.findOne({
      _id: req.params.id,
      uploadedBy: req.user.id
    });
    
    if (!media) {
      return res.status(404).json({ message: 'קובץ לא נמצא' });
    }
    
    try {
      await objectStorageService.deleteFile(media.fileName);
    } catch (storageError) {
      console.error('Error deleting from storage:', storageError);
    }
    
    await Media.deleteOne({ _id: req.params.id });
    
    res.json({ message: 'הקובץ נמחק בהצלחה' });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ message: 'שגיאה במחיקת הקובץ' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const objectStorageService = require('../services/objectStorageService');

const authenticateToken = auth.authenticate();

router.post('/get-upload-url', authenticateToken, async (req, res) => {
  try {
    const { fileExtension } = req.body;
    const ext = fileExtension || '.jpg';

    const result = await objectStorageService.getUploadURL(ext);

    res.json({
      success: true,
      uploadURL: result.uploadURL,
      objectPath: result.objectPath
    });
  } catch (error) {
    console.error('Get upload URL error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה ביצירת URL להעלאה: ' + error.message
    });
  }
});

router.get('/objects/:objectPath(*)', async (req, res) => {
  try {
    const objectPath = '/' + req.params.objectPath;
    const file = await objectStorageService.getObjectFile('/objects/' + req.params.objectPath);
    
    await objectStorageService.downloadObject(file, res);
  } catch (error) {
    console.error('Download error:', error);
    if (error.message === 'Object not found') {
      return res.status(404).json({
        success: false,
        message: 'התמונה לא נמצאה'
      });
    }
    res.status(500).json({
      success: false,
      message: 'שגיאה בהורדת התמונה'
    });
  }
});

module.exports = router;

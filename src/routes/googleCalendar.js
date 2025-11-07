const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const googleCalendarService = require('../services/googleCalendarService');

router.get('/auth', auth, (req, res) => {
  try {
    const userId = req.user.userId;
    const authUrl = googleCalendarService.generateAuthUrl(userId);
    
    res.json({
      success: true,
      authUrl
    });
  } catch (error) {
    console.error('Google Calendar auth error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה ביצירת קישור אימות Google Calendar'
    });
  }
});

router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const userId = state;
    
    if (!code || !userId) {
      return res.redirect('/provider-settings?error=missing_params');
    }
    
    await googleCalendarService.handleCallback(code, userId);
    
    res.redirect('/provider-settings?google_calendar=connected');
  } catch (error) {
    console.error('Google Calendar callback error:', error);
    res.redirect('/provider-settings?error=google_calendar_failed');
  }
});

router.get('/status', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const status = await googleCalendarService.getConnectionStatus(userId);
    
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('Google Calendar status error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בטעינת סטטוס Google Calendar'
    });
  }
});

router.post('/disconnect', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    await googleCalendarService.disconnect(userId);
    
    res.json({
      success: true,
      message: 'יומן Google נותק בהצלחה'
    });
  } catch (error) {
    console.error('Google Calendar disconnect error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בניתוק יומן Google'
    });
  }
});

router.post('/test-event', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const now = new Date();
    const endTime = new Date(now.getTime() + 60 * 60 * 1000);
    
    const result = await googleCalendarService.createEvent(userId, {
      summary: 'אירוע בדיקה - ChatGrow',
      description: 'זהו אירוע בדיקה שנוצר דרך ChatGrow',
      startTime: now.toISOString(),
      endTime: endTime.toISOString(),
      attendees: []
    });
    
    res.json({
      success: true,
      message: 'אירוע בדיקה נוצר בהצלחה!',
      ...result
    });
  } catch (error) {
    console.error('Google Calendar test event error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה ביצירת אירוע בדיקה: ' + error.message
    });
  }
});

module.exports = router;

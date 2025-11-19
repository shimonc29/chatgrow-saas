const express = require('express');
const router = express.Router();
const ProviderSettings = require('../models/ProviderSettings');
const NotificationService = require('../services/NotificationService');
const auth = require('../middleware/auth');
const { isPremium } = require('../middleware/isPremium');
const { logInfo, logError } = require('../utils/logger');

const authenticateToken = auth.authenticate();

// Helper: Validate external payment URL
function isValidExternalPaymentUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const parsedUrl = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    
    // Must have a valid hostname
    if (!parsedUrl.hostname || parsedUrl.hostname.length === 0) {
      return false;
    }
    
    return true;
  } catch (err) {
    return false;
  }
}

// Get current user's provider settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    let settings = await ProviderSettings.findOne({ userId: req.user.id });
    
    // Create default settings if not exists
    if (!settings) {
      settings = new ProviderSettings({
        userId: req.user.id,
        isActive: true
      });
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    logError('Failed to get provider settings', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

// Update provider settings
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { emailProvider, smsProvider, paymentGateways, invoiceSettings } = req.body;

    if (smsProvider) {
      const Subscriber = require('../models/Subscriber');
      const user = await Subscriber.findById(req.user.id);
      
      const premiumStatuses = ['TRIAL', 'ACTIVE'];
      if (!premiumStatuses.includes(user?.subscriptionStatus)) {
        return res.status(403).json({
          success: false,
          message: 'תזכורות SMS זמינות רק במנוי פרימיום',
          code: 'SMS_PREMIUM_REQUIRED'
        });
      }
    }

    // Validate external payment URL if provided
    if (paymentGateways?.externalPayment?.enabled && paymentGateways?.externalPayment?.paymentUrl) {
      if (!isValidExternalPaymentUrl(paymentGateways.externalPayment.paymentUrl)) {
        return res.status(400).json({
          success: false,
          message: 'קישור תשלום חיצוני לא תקין - חייב להיות URL מלא עם http או https',
          code: 'INVALID_PAYMENT_URL'
        });
      }
    }

    let settings = await ProviderSettings.findOne({ userId: req.user.id });
    
    if (!settings) {
      settings = new ProviderSettings({ userId: req.user.id });
    }

    // Update fields if provided
    if (emailProvider) settings.emailProvider = emailProvider;
    if (smsProvider) settings.smsProvider = smsProvider;
    if (paymentGateways) settings.paymentGateways = paymentGateways;
    if (invoiceSettings) settings.invoiceSettings = invoiceSettings;

    await settings.save();

    logInfo('Provider settings updated', { userId: req.user.id });
    res.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    logError('Failed to update provider settings', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Test email configuration
router.post('/test-email', authenticateToken, async (req, res) => {
  try {
    const { testEmail } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ error: 'Test email address required' });
    }

    const result = await NotificationService.sendEmail(req.user.id, {
      to: testEmail,
      subject: 'Test Email from ChatGrow 👑',
      text: 'If you receive this email, your email configuration is working correctly!',
      html: '<div style="text-align:center;padding:20px;background:#000;color:#FFD700;"><h1>👑 ChatGrow</h1><p>If you receive this email, your email configuration is working correctly!</p></div>'
    });

    res.json({ 
      success: true, 
      message: 'Test email sent successfully',
      result 
    });
  } catch (error) {
    logError('Test email failed', { error: error.message, userId: req.user.id });
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Test SMS configuration
router.post('/test-sms', authenticateToken, isPremium, async (req, res) => {
  try {
    const { testPhone } = req.body;
    
    if (!testPhone) {
      return res.status(400).json({ error: 'Test phone number required' });
    }

    const result = await NotificationService.sendSMS(req.user.id, {
      to: testPhone,
      body: 'Test SMS from ChatGrow 👑. Your SMS configuration is working!'
    });

    res.json({ 
      success: true, 
      message: 'Test SMS sent successfully',
      result 
    });
  } catch (error) {
    logError('Test SMS failed', { error: error.message, userId: req.user.id });
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;

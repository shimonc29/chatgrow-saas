const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Subscriber = require('../models/Subscriber');
const { logInfo, logError } = require('../utils/logger');

router.post('/register', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { provider, partnerAccountId, businessName, businessId, contactEmail, contactPhone } = req.body;

    if (!partnerAccountId || !businessName || !businessId || !contactEmail || !contactPhone) {
      return res.status(400).json({
        success: false,
        message: 'נא למלא את כל השדות הנדרשים'
      });
    }

    const user = await Subscriber.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'משתמש לא נמצא'
      });
    }

    if (user.paymentProviderId) {
      return res.status(400).json({
        success: false,
        message: 'חשבון סליקה כבר קיים למשתמש זה',
        paymentProviderId: user.paymentProviderId
      });
    }

    user.paymentProviderId = partnerAccountId;
    user.profile = user.profile || {};
    user.profile.paymentProvider = provider;
    user.profile.businessName = businessName;
    user.profile.businessId = businessId;
    user.profile.contactEmail = contactEmail;
    user.profile.contactPhone = contactPhone;
    await user.save();

    logInfo('Payment provider onboarding completed', {
      userId,
      provider,
      paymentProviderId: partnerAccountId,
      businessName
    });

    res.json({
      success: true,
      message: 'ההרשמה הושלמה בהצלחה',
      paymentProviderId: partnerAccountId,
      provider
    });

  } catch (error) {
    logError('Payment onboarding failed', {
      userId: req.user.id,
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'שגיאה ביצירת חשבון סליקה',
      error: error.message
    });
  }
});

router.get('/status', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const user = await Subscriber.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'משתמש לא נמצא'
      });
    }

    res.json({
      success: true,
      isOnboarded: !!user.paymentProviderId,
      paymentProviderId: user.paymentProviderId || null,
      provider: user.profile?.paymentProvider || null,
      businessName: user.profile?.businessName || null
    });

  } catch (error) {
    logError('Failed to get onboarding status', {
      userId: req.user.userId || req.user.id,
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'שגיאה בבדיקת סטטוס onboarding'
    });
  }
});

async function createPartnerAccount(businessDetails) {
  const provider = process.env.PAYMENT_PROVIDER || 'meshulam';
  
  if (provider === 'meshulam') {
    return await createMeshulamPartnerAccount(businessDetails);
  } else if (provider === 'grow') {
    return await createGrowPartnerAccount(businessDetails);
  } else {
    return {
      accountId: `MOCK_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      provider: 'mock',
      status: 'active'
    };
  }
}

async function createMeshulamPartnerAccount(businessDetails) {
  const apiKey = process.env.MESHULAM_PARTNER_API_KEY;
  const apiUrl = process.env.MESHULAM_PARTNER_API_URL || 'https://secure.meshulam.co.il/api';

  if (!apiKey) {
    console.warn('Meshulam Partner API key not configured, using mock');
    return {
      accountId: `MESHULAM_MOCK_${Date.now()}`,
      provider: 'meshulam',
      status: 'pending'
    };
  }

  const response = await fetch(`${apiUrl}/partner/create-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      businessName: businessDetails.businessName,
      businessId: businessDetails.businessId,
      email: businessDetails.email,
      phone: businessDetails.phone,
      address: businessDetails.address
    })
  });

  if (!response.ok) {
    throw new Error(`Meshulam API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    accountId: data.subAccountId || data.accountId,
    provider: 'meshulam',
    status: 'active',
    apiDetails: data
  };
}

async function createGrowPartnerAccount(businessDetails) {
  const apiKey = process.env.GROW_PARTNER_API_KEY;
  const apiUrl = process.env.GROW_PARTNER_API_URL || 'https://api.meshulampay.co.il';

  if (!apiKey) {
    console.warn('GROW Partner API key not configured, using mock');
    return {
      accountId: `GROW_MOCK_${Date.now()}`,
      provider: 'grow',
      status: 'pending'
    };
  }

  const response = await fetch(`${apiUrl}/v1/partners/accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    },
    body: JSON.stringify({
      business_name: businessDetails.businessName,
      business_number: businessDetails.businessId,
      contact_email: businessDetails.email,
      contact_phone: businessDetails.phone
    })
  });

  if (!response.ok) {
    throw new Error(`GROW API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    accountId: data.account_id,
    provider: 'grow',
    status: 'active',
    apiDetails: data
  };
}

module.exports = router;

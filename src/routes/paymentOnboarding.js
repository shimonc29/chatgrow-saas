const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Subscriber = require('../models/Subscriber');
const { logInfo, logError } = require('../utils/logger');

router.post('/onboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { businessDetails } = req.body;

    if (!businessDetails || !businessDetails.businessName || !businessDetails.businessId) {
      return res.status(400).json({
        success: false,
        message: 'נא למלא את כל פרטי העסק הנדרשים'
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
        providerId: user.paymentProviderId
      });
    }

    const providerResponse = await createPartnerAccount(businessDetails);

    if (!providerResponse || !providerResponse.accountId) {
      throw new Error('Failed to create partner account with payment provider');
    }

    user.paymentProviderId = providerResponse.accountId;
    await user.save();

    logInfo('Payment provider onboarding completed', {
      userId,
      providerId: providerResponse.accountId,
      businessName: businessDetails.businessName
    });

    res.json({
      success: true,
      message: 'חשבון הסליקה נוצר בהצלחה',
      providerId: providerResponse.accountId,
      details: providerResponse
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
    const user = await Subscriber.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'משתמש לא נמצא'
      });
    }

    res.json({
      success: true,
      isOnboarded: !!user.paymentProviderId,
      providerId: user.paymentProviderId || null
    });

  } catch (error) {
    logError('Failed to get onboarding status', {
      userId: req.user.id,
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

const Subscriber = require('../models/Subscriber');

const isPremium = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    
    if (!req.user || !userId) {
      return res.status(401).json({
        success: false,
        message: 'נדרשת התחברות למערכת'
      });
    }

    const user = await Subscriber.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'משתמש לא נמצא'
      });
    }

    const premiumStatuses = ['TRIAL', 'ACTIVE'];
    
    if (!premiumStatuses.includes(user.subscriptionStatus)) {
      return res.status(403).json({
        success: false,
        message: 'פיצ\'ר זה זמין רק במנוי פרימיום',
        code: 'PREMIUM_FEATURE_REQUIRED',
        currentPlan: user.subscriptionStatus,
        upgradeRequired: true,
        featuresList: {
          premium: [
            'AI Performance Coach - המלצות חכמות לאירועים',
            'דוחות מלאים והיסטוריה מורחבת',
            'אינטגרציה עם Google Calendar',
            'תזכורות SMS ללקוחות',
            'תמיכה בWhitelabel',
            'תמיכה טכנית מהירה',
            'מגבלת לקוחות בלתי מוגבלת'
          ]
        }
      });
    }

    req.userSubscription = {
      subscriptionStatus: user.subscriptionStatus,
      isWhitelabel: user.isWhitelabel,
      maxCustomers: user.maxCustomers,
      currentCustomerCount: user.currentCustomerCount
    };

    next();
  } catch (error) {
    console.error('Error in isPremium middleware:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בבדיקת סטטוס מנוי'
    });
  }
};

const isWhitelabel = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    
    if (!req.user || !userId) {
      return res.status(401).json({
        success: false,
        message: 'נדרשת התחברות למערכת'
      });
    }

    const user = await Subscriber.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'משתמש לא נמצא'
      });
    }

    if (!user.isWhitelabel) {
      return res.status(403).json({
        success: false,
        message: 'פיצ\'ר Whitelabel זמין רק במנויים מתקדמים',
        code: 'WHITELABEL_REQUIRED'
      });
    }

    next();
  } catch (error) {
    console.error('Error in isWhitelabel middleware:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בבדיקת הרשאת Whitelabel'
    });
  }
};

module.exports = {
  isPremium,
  isWhitelabel
};

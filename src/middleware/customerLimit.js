const Subscriber = require('../models/Subscriber');
const Customer = require('../models/Customer');

const checkCustomerLimit = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : (req.businessId || req.body.businessId);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'חסר מזהה משתמש'
      });
    }

    const user = await Subscriber.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'משתמש לא נמצא'
      });
    }

    if (user.subscriptionStatus === 'FREE' && user.currentCustomerCount >= user.maxCustomers) {
      return res.status(403).json({
        success: false,
        message: 'LIMIT_REACHED: הגעת למכסת הלקוחות המקסימלית של התוכנית החינמית (200 לקוחות). שדרג את התוכנית שלך להמשך שימוש.',
        code: 'CUSTOMER_LIMIT_REACHED',
        currentCount: user.currentCustomerCount,
        maxAllowed: user.maxCustomers
      });
    }

    req.userSubscription = {
      subscriptionStatus: user.subscriptionStatus,
      currentCustomerCount: user.currentCustomerCount,
      maxCustomers: user.maxCustomers
    };

    next();
  } catch (error) {
    console.error('Error in checkCustomerLimit middleware:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בבדיקת מכסת לקוחות'
    });
  }
};

const incrementCustomerCount = async (userId) => {
  try {
    const user = await Subscriber.findById(userId);
    
    if (!user) {
      console.error('User not found for incrementCustomerCount:', userId);
      return false;
    }

    user.currentCustomerCount = (user.currentCustomerCount || 0) + 1;
    await user.save();
    
    console.log(`✅ Customer count incremented for user ${userId}: ${user.currentCustomerCount}/${user.maxCustomers}`);
    return true;
  } catch (error) {
    console.error('Error incrementing customer count:', error);
    return false;
  }
};

const decrementCustomerCount = async (userId) => {
  try {
    const user = await Subscriber.findById(userId);
    
    if (!user) {
      console.error('User not found for decrementCustomerCount:', userId);
      return false;
    }

    user.currentCustomerCount = Math.max(0, (user.currentCustomerCount || 0) - 1);
    await user.save();
    
    console.log(`✅ Customer count decremented for user ${userId}: ${user.currentCustomerCount}/${user.maxCustomers}`);
    return true;
  } catch (error) {
    console.error('Error decrementing customer count:', error);
    return false;
  }
};

const syncCustomerCount = async (userId) => {
  try {
    const actualCount = await Customer.countDocuments({ userId });
    const user = await Subscriber.findById(userId);
    
    if (!user) {
      console.error('User not found for syncCustomerCount:', userId);
      return false;
    }

    user.currentCustomerCount = actualCount;
    await user.save();
    
    console.log(`✅ Customer count synced for user ${userId}: ${actualCount}`);
    return true;
  } catch (error) {
    console.error('Error syncing customer count:', error);
    return false;
  }
};

module.exports = {
  checkCustomerLimit,
  incrementCustomerCount,
  decrementCustomerCount,
  syncCustomerCount
};

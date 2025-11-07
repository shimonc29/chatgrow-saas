const isSuperAdmin = (req, res, next) => {
  const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || '').split(',').map(e => e.trim());
  
  if (!req.user || !req.user.email) {
    return res.status(401).json({
      success: false,
      message: 'אין הרשאה - משתמש לא מחובר'
    });
  }

  if (!SUPER_ADMIN_EMAILS.includes(req.user.email)) {
    return res.status(403).json({
      success: false,
      message: 'אין הרשאת Super Admin'
    });
  }

  next();
};

module.exports = isSuperAdmin;

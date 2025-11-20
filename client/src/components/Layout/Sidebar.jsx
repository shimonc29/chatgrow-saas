import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    checkSuperAdmin();
  }, [user]);

  const checkSuperAdmin = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('/api/super-admin/check', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsSuperAdmin(response.data.isSuperAdmin);
    } catch (err) {
      setIsSuperAdmin(false);
    }
  };

  const menuItems = [
    { path: '/dashboard', icon: '🏠', label: 'דאשבורד' },
    { path: '/events', icon: '📅', label: 'אירועים' },
    { path: '/customers', icon: '👥', label: 'לקוחות' },
    { path: '/appointments', icon: '📋', label: 'תורים' },
    { path: '/availability', icon: '🕐', label: 'זמינות ושירותים' },
    { path: '/payments', icon: '💳', label: 'תשלומים' },
    { path: '/financial', icon: '💰', label: 'ניהול פיננסי' },
    { path: '/landing-pages', icon: '🎨', label: 'דפי נחיתה' },
    { path: '/media', icon: '📚', label: 'ספריית מדיה' },
    { path: '/registration-pages', icon: '🔗', label: 'דפי הרשמה' },
    { path: '/subscription', icon: '📋', label: 'מנוי ומכסות' },
    { path: '/tranzila-settings', icon: '⚡', label: 'הגדרות Tranzila' },
    { path: '/provider-settings', icon: '🔧', label: 'הגדרות ספקים' },
  ];

  const growthMenuItems = [
    { path: '/growth/get', icon: '📈', label: 'GET - רכישת לקוחות' },
    { path: '/growth/keep', icon: '🤝', label: 'KEEP - שימור לקוחות' },
    { path: '/growth/grow', icon: '📊', label: 'GROW - הגדלת הכנסות' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`
        w-64 bg-gradient-to-b from-bg-light via-bg-card to-bg-light border-l border-accent-teal/30 min-h-screen flex flex-col
        fixed md:static right-0 top-0 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
      {/* Logo/Brand with Close Button (Mobile) */}
      <div className="p-6 border-b border-accent-teal/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              <span className="text-2xl">👑</span>{' '}
              <span className="bg-gradient-to-r from-accent-teal to-accent-hover bg-clip-text text-transparent">ChatGrow</span>
            </h1>
            <p className="text-sm text-text-secondary mt-1">מערכת ניהול</p>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-lg hover:bg-bg-card transition-colors"
            aria-label="סגור תפריט"
          >
            <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-accent-teal/30">
        <div className="flex items-center space-x-reverse space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-teal to-accent-hover rounded-full flex items-center justify-center shadow-lg shadow-accent-teal/30">
            <span className="text-white font-bold">
              {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-accent-teal truncate">
              {user?.fullName || 'משתמש'}
            </p>
            <p className="text-xs text-text-secondary truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {isSuperAdmin && (
            <li>
              <Link
                to="/super-admin"
                onClick={handleLinkClick}
                className={`flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-lg transition-all ${
                  isActive('/super-admin')
                    ? 'bg-gradient-to-r from-accent-teal to-accent-hover text-white font-semibold shadow-lg shadow-accent-teal/30'
                    : 'text-text-primary hover:bg-bg-card hover:text-accent-teal'
                }`}
              >
                <span className="text-xl">👑</span>
                <span>Super Admin</span>
              </Link>
            </li>
          )}
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={handleLinkClick}
                className={`flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-accent-teal to-accent-hover text-white font-semibold shadow-lg shadow-accent-teal/30'
                    : 'text-text-primary hover:bg-bg-card hover:text-accent-teal'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
          
          {/* Growth Section */}
          <li className="pt-4 mt-4 border-t border-accent-teal/20">
            <div className="px-4 py-2 text-xs font-bold text-text-secondary uppercase tracking-wider">
              צמיחה (Growth)
            </div>
          </li>
          {growthMenuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={handleLinkClick}
                className={`flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-accent-teal to-accent-hover text-white font-semibold shadow-lg shadow-accent-teal/30'
                    : 'text-text-primary hover:bg-bg-card hover:text-accent-teal'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-accent-teal/30">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-reverse space-x-2 px-4 py-3 bg-bg-card hover:bg-bg-light border border-accent-teal/20 rounded-lg transition-all hover:border-accent-teal/40"
        >
          <span className="text-xl">🚪</span>
          <span className="font-medium text-text-primary">התנתק</span>
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;

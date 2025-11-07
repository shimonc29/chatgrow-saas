import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/dashboard', icon: '🏠', label: 'דאשבורד' },
    { path: '/events', icon: '📅', label: 'אירועים' },
    { path: '/customers', icon: '👥', label: 'לקוחות' },
    { path: '/appointments', icon: '📋', label: 'תורים' },
    { path: '/payments', icon: '💳', label: 'תשלומים' },
    { path: '/landing-pages', icon: '🎨', label: 'דפי נחיתה' },
    { path: '/registration-pages', icon: '🔗', label: 'דפי הרשמה' },
    { path: '/payment-settings', icon: '⚙️', label: 'הגדרות תשלום' },
    { path: '/provider-settings', icon: '🔧', label: 'הגדרות ספקים' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 bg-gradient-to-b from-app-navy via-card-navy to-app-navy border-l border-accent-copper/30 min-h-screen flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-accent-copper/30">
        <h1 className="text-2xl font-bold">
          <span className="text-2xl">👑</span>{' '}
          <span className="bg-gradient-to-r from-accent-copper to-action-blue bg-clip-text text-transparent">ChatGrow</span>
        </h1>
        <p className="text-sm text-text-subtle mt-1">מערכת ניהול</p>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-accent-copper/30">
        <div className="flex items-center space-x-reverse space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-copper to-action-blue rounded-full flex items-center justify-center shadow-lg shadow-accent-copper/30">
            <span className="text-white font-bold">
              {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-accent-copper truncate">
              {user?.fullName || 'משתמש'}
            </p>
            <p className="text-xs text-text-subtle truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-action-blue to-accent-copper text-white font-semibold shadow-lg shadow-action-blue/30'
                    : 'text-text-light hover:bg-card-navy hover:text-accent-copper'
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
      <div className="p-4 border-t border-accent-copper/30">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-reverse space-x-2 px-4 py-3 bg-card-navy hover:bg-app-navy border border-accent-copper/20 rounded-lg transition-all hover:border-accent-copper/40"
        >
          <span className="text-xl">🚪</span>
          <span className="font-medium text-text-light">התנתק</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

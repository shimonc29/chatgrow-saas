import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    if (formData.password.length < 6) {
      setError('הסיסמה חייבת להיות לפחות 6 תווים');
      return;
    }

    setLoading(true);

    const result = await register({
      email: formData.email,
      password: formData.password,
      profile: { name: formData.name },
    });

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'שגיאה ברישום');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-app-navy via-card-navy to-app-navy flex items-center justify-center p-4">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent-copper/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-action-blue/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-3xl">👑</span>{' '}
            <span className="bg-gradient-to-r from-accent-copper to-action-blue bg-clip-text text-transparent">ChatGrow</span>
          </h1>
          <p className="text-text-subtle">מערכת ניהול אירועים ועסקים</p>
        </div>

        {/* Register Card */}
        <div className="bg-gradient-to-br from-card-navy to-app-navy border border-accent-copper/30 rounded-2xl shadow-2xl shadow-accent-copper/10 p-8">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold text-accent-copper mb-2">הרשמה</h2>
            <p className="text-text-subtle">הצטרף אלינו עכשיו!</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-light mb-2">
                שם מלא
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-app-navy border border-accent-copper/30 text-text-light rounded-lg focus:ring-2 focus:ring-action-blue focus:border-action-blue transition-all outline-none"
                placeholder="שם מלא"
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-light mb-2">
                אימייל
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-app-navy border border-accent-copper/30 text-text-light rounded-lg focus:ring-2 focus:ring-action-blue focus:border-action-blue transition-all outline-none"
                placeholder="example@mail.com"
                dir="ltr"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-light mb-2">
                סיסמה
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-app-navy border border-accent-copper/30 text-text-light rounded-lg focus:ring-2 focus:ring-action-blue focus:border-action-blue transition-all outline-none"
                placeholder="••••••••"
                dir="ltr"
              />
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-light mb-2">
                אימות סיסמה
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-app-navy border border-accent-copper/30 text-text-light rounded-lg focus:ring-2 focus:ring-action-blue focus:border-action-blue transition-all outline-none"
                placeholder="••••••••"
                dir="ltr"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-action-blue via-accent-copper to-action-blue hover:from-accent-copper hover:to-action-blue text-white py-3 rounded-lg font-semibold shadow-lg shadow-action-blue/50 hover:shadow-xl hover:shadow-accent-copper/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? 'נרשם...' : 'הירשם'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-text-subtle">
              כבר יש לך חשבון?{' '}
              <Link to="/login" className="text-accent-copper font-semibold hover:text-action-blue transition-colors">
                התחבר
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-text-subtle text-sm">
          <p>© 2025 ChatGrow. כל הזכויות שמורות.</p>
        </div>
      </div>
    </div>
  );
};

export default Register;

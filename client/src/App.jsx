import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/Layout/PrivateRoute';
import PageLoader from './components/Loading/PageLoader';

// Auth pages - loaded immediately (users see these first)
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import MarketingHome from './pages/public/MarketingHome';

// Admin pages - lazy loaded (behind authentication)
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Customers = lazy(() => import('./pages/admin/Customers'));
const Payments = lazy(() => import('./pages/admin/Payments'));
const Financial = lazy(() => import('./pages/admin/Financial'));
const ScheduleAndServices = lazy(() => import('./pages/admin/ScheduleAndServices'));
const RegistrationPages = lazy(() => import('./pages/admin/RegistrationPages'));
const TranzilaSettings = lazy(() => import('./pages/admin/TranzilaSettings'));
const ProviderSettings = lazy(() => import('./pages/admin/ProviderSettings'));
const LandingPages = lazy(() => import('./pages/admin/LandingPages'));
const LandingPageEditor = lazy(() => import('./pages/admin/LandingPageEditor'));
const MediaLibrary = lazy(() => import('./pages/admin/MediaLibrary'));
const SuperAdmin = lazy(() => import('./pages/admin/SuperAdmin'));
const CheckSuperAdmin = lazy(() => import('./pages/admin/CheckSuperAdmin'));
const SubscriptionManagement = lazy(() => import('./pages/admin/SubscriptionManagement'));
const GrowthGetPage = lazy(() => import('./pages/admin/GrowthGetPage'));
const GrowthKeepPage = lazy(() => import('./pages/admin/GrowthKeepPage'));
const GrowthGrowPage = lazy(() => import('./pages/admin/GrowthGrowPage'));

// Public pages - lazy loaded (less critical for initial load)
const EventRegistration = lazy(() => import('./pages/public/EventRegistration'));
const AppointmentBooking = lazy(() => import('./pages/public/AppointmentBooking'));
const PaymentSuccess = lazy(() => import('./pages/public/PaymentSuccess'));
const PaymentError = lazy(() => import('./pages/public/PaymentError'));
const LandingPageViewer = lazy(() => import('./pages/public/LandingPageViewer'));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<MarketingHome />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            <Route
              path="/customers"
              element={
                <PrivateRoute>
                  <Customers />
                </PrivateRoute>
              }
            />

            <Route path="/events" element={<Navigate to="/schedule" replace />} />

            <Route path="/appointments" element={<Navigate to="/schedule" replace />} />

            <Route
              path="/payments"
              element={
                <PrivateRoute>
                  <Payments />
                </PrivateRoute>
              }
            />

            <Route
              path="/financial"
              element={
                <PrivateRoute>
                  <Financial />
                </PrivateRoute>
              }
            />

            <Route path="/availability" element={<Navigate to="/schedule" replace />} />

            <Route path="/calendar" element={<Navigate to="/schedule" replace />} />

            <Route
              path="/schedule"
              element={
                <PrivateRoute>
                  <ScheduleAndServices />
                </PrivateRoute>
              }
            />

            <Route
              path="/registration-pages"
              element={
                <PrivateRoute>
                  <RegistrationPages />
                </PrivateRoute>
              }
            />

            <Route
              path="/tranzila-settings"
              element={
                <PrivateRoute>
                  <TranzilaSettings />
                </PrivateRoute>
              }
            />

            <Route
              path="/provider-settings"
              element={
                <PrivateRoute>
                  <ProviderSettings />
                </PrivateRoute>
              }
            />

            <Route
              path="/landing-pages"
              element={
                <PrivateRoute>
                  <LandingPages />
                </PrivateRoute>
              }
            />

            <Route
              path="/landing-pages/:id"
              element={
                <PrivateRoute>
                  <LandingPageEditor />
                </PrivateRoute>
              }
            />

            <Route
              path="/media"
              element={
                <PrivateRoute>
                  <MediaLibrary />
                </PrivateRoute>
              }
            />

            <Route
              path="/super-admin"
              element={
                <PrivateRoute>
                  <SuperAdmin />
                </PrivateRoute>
              }
            />

            <Route
              path="/check-super-admin"
              element={
                <PrivateRoute>
                  <CheckSuperAdmin />
                </PrivateRoute>
              }
            />

            <Route
              path="/subscription"
              element={
                <PrivateRoute>
                  <SubscriptionManagement />
                </PrivateRoute>
              }
            />

            <Route
              path="/growth/get"
              element={
                <PrivateRoute>
                  <GrowthGetPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/growth/keep"
              element={
                <PrivateRoute>
                  <GrowthKeepPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/growth/grow"
              element={
                <PrivateRoute>
                  <GrowthGrowPage />
                </PrivateRoute>
              }
            />

            <Route path="/events/:id/register" element={<EventRegistration />} />
            <Route path="/landing/:slug" element={<LandingPageViewer />} />
            <Route path="/appointments/book" element={<AppointmentBooking />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/error" element={<PaymentError />} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

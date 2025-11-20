import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/Layout/PrivateRoute';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/admin/Dashboard';
import Events from './pages/admin/Events';
import Customers from './pages/admin/Customers';
import Appointments from './pages/admin/Appointments';
import Payments from './pages/admin/Payments';
import Financial from './pages/admin/Financial';
import Availability from './pages/admin/Availability';
import RegistrationPages from './pages/admin/RegistrationPages';
import TranzilaSettings from './pages/admin/TranzilaSettings';
import ProviderSettings from './pages/admin/ProviderSettings';
import LandingPages from './pages/admin/LandingPages';
import LandingPageEditor from './pages/admin/LandingPageEditor';
import MediaLibrary from './pages/admin/MediaLibrary';
import SuperAdmin from './pages/admin/SuperAdmin';
import CheckSuperAdmin from './pages/admin/CheckSuperAdmin';
import SubscriptionManagement from './pages/admin/SubscriptionManagement';
import GrowthGetPage from './pages/admin/GrowthGetPage';
import GrowthKeepPage from './pages/admin/GrowthKeepPage';
import GrowthGrowPage from './pages/admin/GrowthGrowPage';

import EventRegistration from './pages/public/EventRegistration';
import AppointmentBooking from './pages/public/AppointmentBooking';
import PaymentSuccess from './pages/public/PaymentSuccess';
import PaymentError from './pages/public/PaymentError';
import LandingPageViewer from './pages/public/LandingPageViewer';
import MarketingHome from './pages/public/MarketingHome';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
            path="/events" 
            element={
              <PrivateRoute>
                <Events />
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
          
          <Route 
            path="/appointments" 
            element={
              <PrivateRoute>
                <Appointments />
              </PrivateRoute>
            } 
          />
          
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

          <Route 
            path="/availability" 
            element={
              <PrivateRoute>
                <Availability />
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
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

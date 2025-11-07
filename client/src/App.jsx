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
import Invoices from './pages/admin/Invoices';
import Receipts from './pages/admin/Receipts';
import RegistrationPages from './pages/admin/RegistrationPages';
import PaymentSettings from './pages/admin/PaymentSettings';
import ProviderSettings from './pages/admin/ProviderSettings';
import LandingPages from './pages/admin/LandingPages';
import LandingPageEditor from './pages/admin/LandingPageEditor';

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
            path="/invoices" 
            element={
              <PrivateRoute>
                <Invoices />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/receipts" 
            element={
              <PrivateRoute>
                <Receipts />
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
            path="/payment-settings" 
            element={
              <PrivateRoute>
                <PaymentSettings />
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

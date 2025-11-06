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

import EventRegistration from './pages/public/EventRegistration';
import AppointmentBooking from './pages/public/AppointmentBooking';
import PaymentSuccess from './pages/public/PaymentSuccess';
import PaymentError from './pages/public/PaymentError';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
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
          
          <Route path="/events/:id/register" element={<EventRegistration />} />
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

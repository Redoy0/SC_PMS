import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { ProtectedRoute, GuestRoute, AdminRoute, DeliveryAgentRoute, CustomerRoute } from './routes/ProtectedRoute.jsx';
import Landing from './pages/Landing.jsx';
import LoginPage from './pages/Login.jsx';
import RegisterPage from './pages/Register.jsx';
import VerifyEmailPage from './pages/VerifyEmail.jsx';
import ForgotPasswordPage from './pages/ForgotPassword.jsx';
import ResetPasswordPage from './pages/ResetPassword.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import CustomerDashboard from './pages/CustomerDashboard.jsx';
import AgentDashboard from './pages/AgentDashboard.jsx';
import PublicTrack from './pages/PublicTrack.jsx';
import ParcelRoute from './pages/ParcelRoute.jsx';
import ParcelDetailView from './pages/ParcelDetailView.jsx';
import CustomerParcelDetail from './pages/CustomerParcelDetail.jsx';
import AdminAgentTracking from './pages/AdminAgentTracking.jsx';
import AgentParcelDetails from './pages/AgentParcelDetails.jsx';
import AgentParcelPickUpConfirmation from './pages/AgentParcelPickUpConfirmation.jsx';
import AgentPickupConfirmPage from './pages/AgentPickupConfirmPage.jsx';
import TrackPublicParcel from './pages/TrackPublicParcel.jsx';
import CustomerQrScanner from './pages/CustomerQrScanner.jsx';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>
            {/* Not guest-only: an invite link may be opened in a browser where an admin is signed in */}
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/track/:trackingCode" element={<PublicTrack />} />
            <Route path="/parcel/:id/route" element={<ParcelRoute />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/tracking" element={<AdminAgentTracking />} />
                <Route path="/admin/parcel/:id" element={<AgentParcelDetails />} />
              </Route>
              <Route element={<DeliveryAgentRoute />}>
                <Route path="/agent" element={<AgentDashboard />} />
                <Route path="/parcel/:id" element={<ParcelDetailView />} />
                <Route path="/agent/pickup-scan" element={<AgentParcelPickUpConfirmation />} />
                <Route path="/agent/parcel/:id/pickup-confirm" element={<AgentPickupConfirmPage />} />
              </Route>
              <Route element={<CustomerRoute />}>
                <Route path="/app" element={<CustomerDashboard />} />
                <Route path="/customer/parcel/:id" element={<CustomerParcelDetail />} />
                <Route path="/customer/parcel/qr/:id" element={<CustomerQrScanner />} />
              </Route>
            </Route>

            <Route path="/" element={<Landing />} />
            <Route path="/track-parcel" element={<TrackPublicParcel />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

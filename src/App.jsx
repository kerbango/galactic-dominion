import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import TopNav from '@/components/TopNav';
import ProtectedRoute from '@/components/ProtectedRoute';
import GameLayout from '@/components/GameLayout';
import Splash from '@/pages/Splash';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import EmpireSetup from '@/pages/EmpireSetup';
import Profile from '@/pages/Profile';
import GalacticMap from '@/pages/GalacticMap';
import Console from '@/pages/Console';
import AdminLogin from '@/pages/AdminLogin';
import Admin from '@/pages/Admin';
import SectionPlaceholder from '@/pages/SectionPlaceholder';
import GalacticMarket from '@/pages/GalacticMarket';
import GalacticResourceMarket from '@/pages/GalacticResourceMarket';
import Comms from '@/pages/Comms';
import Support from '@/pages/Support';
import { Sword, FlaskConical, Wrench, Handshake, Radio } from 'lucide-react';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  // Handle authentication errors for protected areas
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  // Render the main app — public routes render immediately, without
  // waiting for the auth/public-settings checks to finish (those only gate
  // the protected game area below).
  return (
    <Routes>
      {/* Public splash landing */}
      <Route path="/" element={<Splash />} />

      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin-login" element={<AdminLogin />} />

      {/* Authenticated game area (shared background layout) */}
      <Route element={
        isLoadingPublicSettings || isLoadingAuth ? (
          <div className="fixed inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
          </div>
        ) : authError?.type === 'auth_required' ? (
          <Navigate to="/login" replace />
        ) : (
          <ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />
        )
      }>
        <Route element={<GameLayout />}>
          <Route path="/setup" element={<EmpireSetup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/map" element={<GalacticMap />} />
          <Route path="/console" element={<Console />} />
          <Route path="/military" element={<SectionPlaceholder title="Military" Icon={Sword} />} />
          <Route path="/research" element={<SectionPlaceholder title="Research" Icon={FlaskConical} />} />
          <Route path="/upgrades" element={<SectionPlaceholder title="Upgrades" Icon={Wrench} />} />
          <Route path="/market" element={<GalacticMarket />} />
          <Route path="/market/resources" element={<GalacticResourceMarket />} />
          <Route path="/alliance" element={<SectionPlaceholder title="Alliance" Icon={Handshake} />} />
          <Route path="/comms" element={<Comms />} />
          <Route path="/support" element={<Support />} />
        </Route>
        {/* Admin section — own background, outside the game layout */}
        <Route path="/admin" element={<Admin />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <TopNav />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
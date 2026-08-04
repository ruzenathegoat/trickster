import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import SmoothScroller from './components/SmoothScroller';
import AppLayout from './layouts/AppLayout';
import AdminLayout from './layouts/AdminLayout';
import AuthLayout from './layouts/AuthLayout';

// Route components are lazy-loaded so heavy libs (Highcharts, GSAP, Framer
// Motion, dnd-kit) only download on the pages that actually use them, instead
// of shipping in one monolithic bundle.
const Dashboard = lazy(() => import('./pages/users/Dashboard'));
const Leaderboard = lazy(() => import('./pages/users/Leaderboard'));
const PlayerExplorer = lazy(() => import('./pages/users/PlayerExplorer'));
const TeamExplorer = lazy(() => import('./pages/users/TeamExplorer'));
const TeamProfile = lazy(() => import('./pages/users/TeamProfile'));
const MetaExplorer = lazy(() => import('./pages/users/MetaExplorer'));
const RecommendFlow = lazy(() => import('./pages/users/RecommendFlow'));
const Simulation = lazy(() => import('./pages/users/Simulation'));
const Landing = lazy(() => import('./pages/users/Landing'));
const Login = lazy(() => import('./pages/users/Login'));
const Register = lazy(() => import('./pages/users/Register'));
const ForgotPassword = lazy(() => import('./pages/users/ForgotPassword'));
const ScraperDashboard = lazy(() => import('./pages/admin/ScraperDashboard'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const PlayerProfile = lazy(() => import('./pages/users/PlayerProfile'));
const UserProfile = lazy(() => import('./pages/users/UserProfile'));
const PatchRatings = lazy(() => import('./pages/admin/PatchRatings'));
const MapRatings = lazy(() => import('./pages/admin/MapRatings'));
const StageMappings = lazy(() => import('./pages/admin/StageMappings'));
const Users = lazy(() => import('./pages/admin/Users'));
const AdminPlayers = lazy(() => import('./pages/admin/AdminPlayers'));

import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './components/ThemeProvider';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <SmoothScroller>
          <Suspense fallback={<div className="min-h-screen w-full bg-black" />}>
            <Routes>
          {/* Public / Marketing Routes (Layer 1) */}
          <Route path="/" element={<Landing />} />

          {/* Authentication Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Authenticated App Routes (Layer 2) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<AppLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="players" element={<PlayerExplorer />} />
              <Route path="players/:playerId" element={<PlayerProfile />} />
              <Route path="teams" element={<TeamExplorer />} />
              <Route path="teams/:teamId" element={<TeamProfile />} />
              <Route path="recommend/*" element={<RecommendFlow />} />
              <Route path="simulation" element={<Simulation />} />
              <Route path="meta" element={<MetaExplorer />} />
              <Route path="profile" element={<UserProfile />} />
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="scraper" element={<ScraperDashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="players" element={<AdminPlayers />} />
            <Route path="patch-ratings" element={<PatchRatings />} />
            <Route path="map-ratings" element={<MapRatings />} />
            <Route path="stage-mappings" element={<StageMappings />} />
          </Route>
        </Routes>
        </Suspense>
        <Toaster position="top-right" richColors theme="light" />
      </SmoothScroller>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

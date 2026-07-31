import { Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import SmoothScroller from './components/SmoothScroller';
import AppLayout from './layouts/AppLayout';
import AdminLayout from './layouts/AdminLayout';
import AuthLayout from './layouts/AuthLayout';
import Dashboard from './pages/users/Dashboard';
import Leaderboard from './pages/users/Leaderboard';
import PlayerExplorer from './pages/users/PlayerExplorer';
import TeamExplorer from './pages/users/TeamExplorer';
import TeamProfile from './pages/users/TeamProfile';
import MetaExplorer from './pages/users/MetaExplorer';
import RecommendFlow from './pages/users/RecommendFlow';
import Landing from './pages/users/Landing';
import Login from './pages/users/Login';
import Register from './pages/users/Register';
import ForgotPassword from './pages/users/ForgotPassword';
import ScraperDashboard from './pages/admin/ScraperDashboard';
import AdminLogin from './pages/admin/AdminLogin';

import PlayerProfile from './pages/users/PlayerProfile';
import UserProfile from './pages/users/UserProfile';

import PatchRatings from './pages/admin/PatchRatings';
import MapRatings from './pages/admin/MapRatings';
import StageMappings from './pages/admin/StageMappings';
import Users from './pages/admin/Users';

import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <SmoothScroller>
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
            <Route path="simulation" element={<div className="p-8">Simulation Coming Soon</div>} />
            <Route path="meta" element={<MetaExplorer />} />
            <Route path="profile" element={<UserProfile />} />
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="scraper" element={<ScraperDashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="patch-ratings" element={<PatchRatings />} />
          <Route path="map-ratings" element={<MapRatings />} />
          <Route path="stage-mappings" element={<StageMappings />} />
        </Route>
      </Routes>
        <Toaster position="top-right" richColors theme="light" />
      </SmoothScroller>
    </AuthProvider>
  );
}

export default App;

import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  SquaresFour, 
  Trophy, 
  Users, 
  Shield, 
  Sparkle, 
  Sword, 
  TrendUp, 
  UserCircle,
  MagnifyingGlass,
  List,
  CaretLeft,
  Bell,
  Globe,
  SignOut
} from '@phosphor-icons/react';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', icon: SquaresFour, path: '/app/dashboard' },
    { label: 'Leaderboard', icon: Trophy, path: '/app/leaderboard' },
    { label: 'Players', icon: Users, path: '/app/players' },
    { label: 'Teams', icon: Shield, path: '/app/teams' },
    { label: 'Recommend', icon: Sparkle, path: '/app/recommend' },
    { label: 'Simulation', icon: Sword, path: '/app/simulation' },
    { label: 'Meta', icon: TrendUp, path: '/app/meta' },
    { label: 'My Profiles', icon: UserCircle, path: '/app/profiles' },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] flex font-['Inter'] text-[var(--color-secondary)]">
      {/* Sidebar */}
      <aside 
        className={clsx(
          "bg-[var(--color-surface)] border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col z-20 sticky top-0 h-screen shrink-0",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        {/* Logo Area */}
        <div className="h-[72px] flex items-center justify-between px-4 border-b border-gray-200 shrink-0">
          {!collapsed && (
            <Link to="/app/dashboard" className="flex items-center gap-3 font-['Archivo_Black'] text-xl uppercase tracking-widest font-black truncate">
              <div className="w-8 h-8 bg-black cut-corner flex items-center justify-center shrink-0">
                <span className="text-[var(--color-primary)] font-black text-lg leading-none">T</span>
              </div>
              Trickster
            </Link>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors mx-auto active:scale-95"
          >
            {collapsed ? <List weight="regular" size={20} /> : <CaretLeft weight="regular" size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 relative group",
                  isActive 
                    ? "bg-gray-100 text-gray-900 font-medium shadow-sm" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                )}
                title={collapsed ? item.label : undefined}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[50%] bg-black rounded-r-md" />
                )}
                <item.icon weight="regular" size={18} className={clsx(isActive ? "text-black" : "text-gray-400 group-hover:text-gray-600")} />
                {!collapsed && <span className="text-[14px]">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Account Area */}
        <div className="p-4 border-t border-gray-200 shrink-0">
          <Link 
            to="/"
            className="flex items-center gap-3 hover:bg-gray-100 p-2 mb-2 rounded-md transition-colors text-gray-600"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <Globe weight="regular" className="text-[18px]" />
            </div>
            {!collapsed && (
              <p className="text-[13px] font-semibold">Back to Website</p>
            )}
          </Link>

          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 hover:bg-red-50 p-2 mb-2 rounded-md transition-colors text-red-600"
          >
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <SignOut weight="regular" className="text-[18px]" />
            </div>
            {!collapsed && (
              <p className="text-[13px] font-semibold">Logout</p>
            )}
          </button>

          <Link 
            to="/app/account"
            className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded-md transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
              <UserCircle weight="regular" size={20} className="text-gray-500" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-[13px] font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
                <p className="text-[11px] text-gray-500 truncate">{user?.email || 'user@example.com'}</p>
              </div>
            )}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-[72px] sticky top-0 bg-[var(--color-surface)] border-b border-gray-200 flex items-center justify-between px-8 shrink-0 z-10">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <MagnifyingGlass weight="regular" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search players or teams..." 
                className="w-full bg-white border border-gray-200 rounded-md pl-10 pr-4 py-2 text-[14px] focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6 ml-4">
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[12px] font-semibold font-['JetBrains_Mono']">Patch 9.08</span>
            </div>
            <button className="text-gray-500 hover:text-gray-900 transition-colors">
              <Bell weight="regular" size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

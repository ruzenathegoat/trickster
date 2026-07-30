import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import axios from '../lib/axios';
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
  const [activePatch, setActivePatch] = useState<string>('...');

  useEffect(() => {
    axios.get('/api/v1/active-patch')
      .then(res => setActivePatch(res.data.version))
      .catch(() => setActivePatch('N/A'));
  }, []);

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
    <div className="min-h-screen bg-white flex text-black">
      {/* Sidebar */}
      <aside 
        className={clsx(
          "bg-white border-r-4 border-black transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col z-20 sticky top-0 h-screen shrink-0",
          collapsed ? "w-[80px]" : "w-[280px]"
        )}
      >
        {/* Logo Area */}
        <div className="h-[80px] flex items-center justify-between px-5 border-b-4 border-black shrink-0 bg-[var(--color-primary)]">
          {!collapsed && (
            <Link to="/app/dashboard" className="flex items-center gap-3 font-display text-2xl uppercase tracking-tighter text-black truncate">
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <img src="/logo.png" alt="Trickster" className="w-full h-full object-contain filter invert" />
              </div>
              TRICKSTER
            </Link>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className={clsx(
              "p-2 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors active:scale-95",
              collapsed && "mx-auto"
            )}
          >
            {collapsed ? <List weight="bold" size={20} /> : <CaretLeft weight="bold" size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav data-lenis-prevent="true" className="flex-1 overflow-y-auto py-6 px-4 space-y-2 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.02)_10px,rgba(0,0,0,0.02)_20px)]">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-4 px-4 py-3 border-2 transition-all duration-200 group font-label uppercase tracking-widest text-[13px] font-bold",
                  isActive 
                    ? "bg-black text-[var(--color-primary)] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] translate-x-1" 
                    : "border-transparent text-gray-500 hover:border-black hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:translate-x-0.5"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon weight={isActive ? "fill" : "bold"} size={20} className={clsx("shrink-0", isActive ? "text-[var(--color-primary)]" : "text-black opacity-50 group-hover:opacity-100")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Account Area */}
        <div className="p-4 border-t-4 border-black shrink-0 bg-white">
          <Link 
            to="/"
            className={clsx(
              "flex items-center gap-3 p-3 mb-2 border-2 border-transparent hover:border-black hover:bg-black hover:text-white transition-colors text-black font-label text-[11px] font-bold uppercase tracking-widest group",
              collapsed && "justify-center"
            )}
            title={collapsed ? "Back to Website" : undefined}
          >
            <Globe weight="bold" size={20} className="shrink-0 group-hover:text-white" />
            {!collapsed && <span className="truncate">Back to Website</span>}
          </Link>

          <button 
            onClick={logout}
            className={clsx(
              "w-full flex items-center gap-3 p-3 mb-4 border-2 border-transparent hover:border-black hover:bg-[#ff3333] hover:text-white transition-colors text-[#ff3333] font-label text-[11px] font-bold uppercase tracking-widest group",
              collapsed && "justify-center"
            )}
            title={collapsed ? "Logout" : undefined}
          >
            <SignOut weight="bold" size={20} className="shrink-0 group-hover:text-white" />
            {!collapsed && <span className="truncate">Logout</span>}
          </button>

          <Link 
            to="/app/account"
            className={clsx(
              "flex items-center gap-3 p-3 border-2 border-black bg-[var(--color-primary)] hover:bg-black hover:text-[var(--color-primary)] transition-colors group",
              collapsed && "justify-center"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-black text-[var(--color-primary)] border-2 border-black flex items-center justify-center shrink-0 group-hover:bg-[var(--color-primary)] group-hover:text-black transition-colors">
              <UserCircle weight="fill" size={24} />
            </div>
            {!collapsed && (
              <div className="overflow-hidden flex-1">
                <p className="font-label text-[12px] font-bold uppercase tracking-widest truncate">{user?.name || 'User'}</p>
                <p className="font-label text-[9px] font-bold uppercase tracking-widest opacity-60 truncate">{user?.email || 'user@example.com'}</p>
              </div>
            )}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-[80px] sticky top-0 bg-white border-b-4 border-black flex items-center justify-between px-8 shrink-0 z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]">
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <MagnifyingGlass weight="bold" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-black transition-transform group-focus-within:scale-110" />
              <input 
                type="text" 
                placeholder="Search players or teams..." 
                className="w-full bg-white border-4 border-black pl-12 pr-4 py-3 text-[13px] font-label font-bold uppercase tracking-widest text-black placeholder-gray-400 focus:outline-none focus:shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-all focus:-translate-y-1"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6 ml-4">
            <div className="flex items-center gap-3 bg-black text-[var(--color-primary)] px-4 py-2 border-2 border-black">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
              <span className="text-[12px] font-bold font-label uppercase tracking-widest">Patch {activePatch}</span>
            </div>
            <button className="p-2.5 border-4 border-black bg-white hover:bg-[var(--color-primary)] hover:scale-110 transition-transform active:scale-95 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              <Bell weight="bold" size={20} className="text-black" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 lg:p-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

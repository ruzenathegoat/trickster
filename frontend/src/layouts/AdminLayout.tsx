import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { Terminal, ChartLineUp, MapTrifold, ListNumbers, SignOut, Users, CheckCircle, List } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function AdminLayout() {
  const location = useLocation();
  const { user, isLoading, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navLinks = [
    { name: 'Scraper Logs', path: '/admin/scraper', icon: Terminal },
    { name: 'Manage Users', path: '/admin/users', icon: Users },
    { name: 'Manage Players', path: '/admin/players', icon: Users },
    { name: 'Patch Ratings', path: '/admin/patch-ratings', icon: ChartLineUp },
    { name: 'Map Ratings', path: '/admin/map-ratings', icon: MapTrifold },
    { name: 'Stage Mappings', path: '/admin/stage-mappings', icon: ListNumbers },
  ];

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      toast.error('Unauthorized', {
        description: 'You must be logged in as an administrator to access this area.',
      });
    }
  }, [isLoading, user]);

  useEffect(() => {
    const handleToggle = (e: any) => {
      if (e.detail && typeof e.detail.isOpen === 'boolean') {
        setIsSidebarOpen(e.detail.isOpen);
      }
    };
    window.addEventListener('toggleSidebar', handleToggle);
    return () => window.removeEventListener('toggleSidebar', handleToggle);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4]">
        <div className="w-12 h-12 border-4 border-theme-border border-t-[var(--color-primary)] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (isLoggingOut) {
    return (
      <div className="min-h-screen bg-[#f4f4f4] flex flex-col font-body">
        <header className="w-full bg-theme-bg border-b-4 border-theme-border p-4 flex justify-between">
          <div className="w-48 h-8 bg-gray-200 animate-pulse border-2 border-theme-border"></div>
          <div className="w-32 h-8 bg-gray-200 animate-pulse border-2 border-theme-border"></div>
        </header>
        <div className="flex flex-1">
          <aside className="w-64 border-r-4 border-theme-border bg-theme-bg p-4 space-y-4">
            <div className="w-full h-10 bg-gray-200 animate-pulse border-2 border-theme-border"></div>
            <div className="w-full h-10 bg-gray-200 animate-pulse border-2 border-theme-border"></div>
            <div className="w-full h-10 bg-gray-200 animate-pulse border-2 border-theme-border"></div>
            <div className="w-full h-10 bg-gray-200 animate-pulse border-2 border-theme-border"></div>
          </aside>
          <main className="flex-1 p-8 space-y-8">
            <div className="w-1/3 h-12 bg-gray-200 animate-pulse border-2 border-theme-border"></div>
            <div className="w-full h-64 bg-gray-200 animate-pulse border-2 border-theme-border"></div>
            <div className="flex gap-4">
              <div className="flex-1 h-32 bg-gray-200 animate-pulse border-2 border-theme-border"></div>
              <div className="flex-1 h-32 bg-gray-200 animate-pulse border-2 border-theme-border"></div>
              <div className="flex-1 h-32 bg-gray-200 animate-pulse border-2 border-theme-border"></div>
            </div>
            <div className="flex justify-center mt-8">
               <span className="font-display font-black text-2xl uppercase tracking-widest animate-pulse">TERMINATING SESSION...</span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-black flex flex-col font-body selection:bg-[var(--color-primary)] selection:text-black">
      
      {/* 1. Headbar (Top Navbar) */}
      <header className="w-full bg-theme-bg border-b-4 border-theme-border sticky top-0 z-50 flex flex-col md:flex-row">
        
        {/* Brand Area */}
        <div className="flex items-center justify-between md:w-64 shrink-0 border-b-4 md:border-b-0 md:border-r-4 border-theme-border p-4 bg-[var(--color-primary)] text-black transition-all duration-300">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-1 border-2 border-transparent hover:border-theme-border hover:bg-black hover:text-white transition-colors"
              aria-label="Toggle Sidebar"
            >
              <List weight="bold" size={24} />
            </button>
            <h1 className="text-xl font-display font-black uppercase tracking-tighter leading-none mt-1">
              SYS.ADMIN
            </h1>
          </div>
        </div>

        {/* Marquee Area */}
        <div className="flex-1 flex items-center border-b-4 md:border-b-0 md:border-r-4 border-theme-border overflow-hidden bg-black text-white relative">
          <div className="flex w-[200%] animate-marquee py-3">
            <div className="flex items-center justify-around w-1/2 gap-8 font-label text-xs font-bold uppercase tracking-widest px-4">
              <span className="text-[var(--color-primary)]">/// SYSTEM STATUS: ONLINE ///</span>
              <span>LATEST SCRAPE: SUCCESS (VCT 2026 CHINA KICKOFF)</span>
              <span>ACTIVE WORKERS: 12</span>
              <span>MEMORY USAGE: 42%</span>
              <span className="text-red-500">WARNING: 3 FAILED JOBS DETECTED</span>
              <span className="text-[var(--color-primary)]">/// END OF LINE ///</span>
            </div>
            <div className="flex items-center justify-around w-1/2 gap-8 font-label text-xs font-bold uppercase tracking-widest px-4">
              <span className="text-[var(--color-primary)]">/// SYSTEM STATUS: ONLINE ///</span>
              <span>LATEST SCRAPE: SUCCESS (VCT 2026 CHINA KICKOFF)</span>
              <span>ACTIVE WORKERS: 12</span>
              <span>MEMORY USAGE: 42%</span>
              <span className="text-red-500">WARNING: 3 FAILED JOBS DETECTED</span>
              <span className="text-[var(--color-primary)]">/// END OF LINE ///</span>
            </div>
          </div>
        </div>

        {/* User Actions */}
        <div className="shrink-0 flex items-stretch">
          <div className="hidden md:flex items-center justify-center px-6 font-label text-xs font-bold uppercase tracking-widest bg-theme-bg text-theme-text border-r-4 border-theme-border">
            OP: {user.name}
          </div>
          <button 
            onClick={handleLogout} 
            disabled={isLoggingOut}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 md:py-0 font-display text-sm font-black uppercase tracking-widest transition-all ${
              isLoggingOut 
                ? "bg-gray-300 text-gray-500 animate-pulse cursor-not-allowed" 
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {isLoggingOut ? (
              <div className="w-5 h-5 rounded-full border-2 border-gray-500 border-t-transparent animate-spin" />
            ) : (
              <SignOut weight="bold" className="text-xl" />
            )}
            <span className="hidden md:inline">{isLoggingOut ? "TERMINATING..." : "Terminate"}</span>
          </button>
        </div>

      </header>

      {/* Main Layout (Sidebar + Content) */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row relative">
        
        {/* 2. Sidebar */}
        <aside className={`${isSidebarOpen ? 'w-full md:w-64 md:border-r-4 opacity-100' : 'w-0 border-r-0 opacity-0 pointer-events-none'} bg-theme-bg border-b-4 md:border-b-0 border-theme-border shrink-0 flex flex-col z-40 relative transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]`}>
          <div className="min-w-[16rem] h-full flex flex-col">
            <div className="p-4 border-b-4 border-theme-border bg-[#f4f4f4]">
              <h2 className="font-label text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                Navigation Protocol
              </h2>
            </div>

            <nav className="flex flex-col flex-grow p-4 gap-3 overflow-y-auto">
              {navLinks.map((link) => {
                const isActive = location.pathname.startsWith(link.path);
                const Icon = link.icon;
                return (
                  <Link key={link.path} to={link.path} onClick={() => { if (window.innerWidth < 768) setIsSidebarOpen(false); }}>
                    <motion.div
                      whileHover={isActive ? {} : { x: 4, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-3 px-4 py-3 font-label text-xs font-bold uppercase tracking-widest transition-all duration-200 border-2 border-theme-border ${
                        isActive 
                          ? 'bg-black text-white shadow-[4px_4px_0px_var(--color-primary)] translate-x-1 -translate-y-1' 
                          : 'bg-theme-bg text-theme-text hover:shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]'
                      }`}
                    >
                      <Icon weight={isActive ? "fill" : "bold"} className="text-lg shrink-0" />
                      <span className="truncate">{link.name}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t-4 border-theme-border mt-auto bg-[#f4f4f4]">
              <Link to="/">
                <motion.div
                  whileHover={{ x: 4, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-theme-bg border-2 border-theme-border text-theme-text hover:shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] font-label text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Return to Public
                </motion.div>
              </Link>
            </div>
          </div>
        </aside>

        {/* 3. Main Content Area */}
        <main className="flex-1 overflow-y-auto relative flex flex-col">
          
          {/* Blueprint/Grid Background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" 
             style={{ backgroundImage: 'radial-gradient(black 2px, transparent 2px)', backgroundSize: '24px 24px' }} />
          
          {/* Outlet Wrapper */}
          <div className="flex-1 p-4 md:p-8 relative z-10 w-full max-w-7xl mx-auto">
            <Outlet />
          </div>

          {/* 4. Footer */}
          <footer className="border-t-4 border-theme-border bg-theme-bg p-6 relative z-10 w-full mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              
              <div className="flex flex-col">
                <span className="font-display font-black text-xl uppercase tracking-tighter">Trickster</span>
                <span className="font-label text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Administrative Command Center
                </span>
              </div>

              <div className="flex gap-8">
                <div className="flex flex-col">
                  <span className="font-label text-[10px] font-bold text-gray-500 uppercase tracking-widest">System Build</span>
                  <span className="font-label text-xs font-bold text-theme-text">v2.1.0-RC4</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label text-[10px] font-bold text-gray-500 uppercase tracking-widest">Core Status</span>
                  <div className="flex items-center gap-1">
                    <CheckCircle weight="fill" className="text-green-500" />
                    <span className="font-label text-xs font-bold text-theme-text uppercase">Optimal</span>
                  </div>
                </div>
              </div>

              {/* Fake Barcode */}
              <div className="hidden lg:flex items-center h-8 gap-[2px]">
                {Array(20).fill(0).map((_, i) => (
                  <div key={i} className="bg-black h-full" style={{ width: `${Math.random() * 4 + 1}px` }} />
                ))}
              </div>

            </div>
          </footer>

        </main>
      </div>
    </div>
  );
}

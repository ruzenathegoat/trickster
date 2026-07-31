import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { Terminal, ChartLineUp, MapTrifold, ListNumbers, SignOut, Users, WarningCircle, CheckCircle } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Marquee from 'react-fast-marquee';

export default function AdminLayout() {
  const location = useLocation();
  const { user, isLoading, logout } = useAuth();

  const navLinks = [
    { name: 'Scraper Logs', path: '/admin/scraper', icon: Terminal },
    { name: 'Manage Users', path: '/admin/users', icon: Users },
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4]">
        <div className="w-12 h-12 border-4 border-black border-t-[var(--color-primary)] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-black flex flex-col font-body selection:bg-[var(--color-primary)] selection:text-black">
      
      {/* 1. Headbar (Top Navbar) */}
      <header className="w-full bg-white border-b-4 border-black sticky top-0 z-50 flex flex-col md:flex-row">
        
        {/* Brand Area */}
        <div className="flex items-center justify-between md:w-64 shrink-0 border-b-4 md:border-b-0 md:border-r-4 border-black p-4 bg-[var(--color-primary)] text-black">
          <div className="flex items-center gap-2">
            <WarningCircle weight="bold" className="text-2xl" />
            <h1 className="text-xl font-display font-black uppercase tracking-tighter leading-none mt-1">
              SYS.ADMIN
            </h1>
          </div>
        </div>

        {/* Marquee Area */}
        <div className="flex-1 flex items-center border-b-4 md:border-b-0 md:border-r-4 border-black overflow-hidden bg-black text-white relative">
          <Marquee speed={40} gradient={false} className="py-3">
            <div className="flex items-center gap-8 font-label text-xs font-bold uppercase tracking-widest px-4">
              <span className="text-[var(--color-primary)]">/// SYSTEM STATUS: ONLINE ///</span>
              <span>LATEST SCRAPE: SUCCESS (VCT 2026 CHINA KICKOFF)</span>
              <span>ACTIVE WORKERS: 12</span>
              <span>MEMORY USAGE: 42%</span>
              <span className="text-red-500">WARNING: 3 FAILED JOBS DETECTED</span>
              <span className="text-[var(--color-primary)]">/// END OF LINE ///</span>
            </div>
          </Marquee>
        </div>

        {/* User Actions */}
        <div className="shrink-0 flex items-stretch">
          <div className="hidden md:flex items-center justify-center px-6 font-label text-xs font-bold uppercase tracking-widest bg-white text-black border-r-4 border-black">
            OP: {user.name}
          </div>
          <button 
            onClick={logout} 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 md:py-0 bg-red-600 hover:bg-red-700 text-white font-display text-sm font-black uppercase tracking-widest transition-colors"
          >
            <SignOut weight="bold" className="text-xl" />
            <span className="hidden md:inline">Terminate</span>
          </button>
        </div>

      </header>

      {/* Main Layout (Sidebar + Content) */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        
        {/* 2. Sidebar */}
        <aside className="w-full md:w-64 bg-white border-b-4 md:border-b-0 md:border-r-4 border-black shrink-0 overflow-y-auto flex flex-col z-40 relative">
          
          <div className="p-4 border-b-4 border-black bg-[#f4f4f4]">
            <h2 className="font-label text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
              Navigation Protocol
            </h2>
          </div>

          <nav className="flex flex-col flex-grow p-4 gap-3">
            {navLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.path);
              const Icon = link.icon;
              return (
                <Link key={link.path} to={link.path}>
                  <motion.div
                    whileHover={isActive ? {} : { x: 4, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-3 px-4 py-3 font-label text-xs font-bold uppercase tracking-widest transition-all duration-200 border-2 border-black ${
                      isActive 
                        ? 'bg-black text-white shadow-[4px_4px_0px_var(--color-primary)] translate-x-1 -translate-y-1' 
                        : 'bg-white text-black hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    <Icon weight={isActive ? "fill" : "bold"} className="text-lg shrink-0" />
                    <span className="truncate">{link.name}</span>
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t-4 border-black mt-auto bg-[#f4f4f4]">
            <Link to="/">
              <motion.div
                whileHover={{ x: 4, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-black text-black hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] font-label text-xs font-bold uppercase tracking-widest transition-all"
              >
                Return to Public
              </motion.div>
            </Link>
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
          <footer className="border-t-4 border-black bg-white p-6 relative z-10 w-full mt-auto">
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
                  <span className="font-label text-xs font-bold text-black">v2.1.0-RC4</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label text-[10px] font-bold text-gray-500 uppercase tracking-widest">Core Status</span>
                  <div className="flex items-center gap-1">
                    <CheckCircle weight="fill" className="text-green-500" />
                    <span className="font-label text-xs font-bold text-black uppercase">Optimal</span>
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

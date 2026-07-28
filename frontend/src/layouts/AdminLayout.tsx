import { Outlet, Link, useLocation } from 'react-router-dom';

import { Terminal, ChartLineUp, MapTrifold, ListNumbers, SignOut } from '@phosphor-icons/react';

export default function AdminLayout() {
  const location = useLocation();

  const navLinks = [
    { name: 'Scraper Logs', path: '/admin/scraper', icon: Terminal },
    { name: 'Patch Ratings', path: '/admin/patch-ratings', icon: ChartLineUp },
    { name: 'Map Ratings', path: '/admin/map-ratings', icon: MapTrifold },
    { name: 'Stage Mappings', path: '/admin/stage-mappings', icon: ListNumbers },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-black flex flex-col md:flex-row font-['Inter']">
      
      {/* Sidebar: Functional Brutalism */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-black p-5 flex flex-col z-20 shrink-0 md:sticky md:top-0 md:h-screen">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <img src="/logo.png" alt="Trickster Logo" className="w-6 h-6 object-contain" />
            <h1 className="text-xl font-['Archivo_Black'] uppercase tracking-tight text-black">
              Trickster
            </h1>
          </div>
          <div className="font-['JetBrains_Mono'] text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-2 py-1 inline-block border border-gray-300">
            SYS.ADMIN // L3
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-grow overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            const Icon = link.icon;
            return (
              <Link 
                key={link.path}
                to={link.path} 
                className={`flex items-center gap-3 px-3 py-2 text-[13px] font-bold uppercase tracking-wider transition-all duration-75 border ${
                  isActive 
                    ? 'bg-black text-white border-black' 
                    : 'bg-transparent text-gray-600 border-transparent hover:border-black hover:text-black'
                }`}
              >
                <Icon weight="regular" size={16} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 pt-5 border-t border-black shrink-0">
          <Link to="/" className="text-[12px] font-bold font-['JetBrains_Mono'] text-gray-500 hover:text-black uppercase tracking-wider transition-colors flex items-center gap-2">
            [ EXIT TO PUBLIC ]
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-[var(--color-background)] p-6 md:p-10">
        <div className="max-w-7xl w-full mx-auto relative">
          <Outlet />
        </div>
      </main>

    </div>
  );
}

import { Outlet, Link, useLocation } from 'react-router-dom';

export default function AdminLayout() {
  const location = useLocation();

  const navLinks = [
    { name: 'Scraper Logs', path: '/admin/scraper' },
    { name: 'Patch Ratings', path: '/admin/patch-ratings' },
    { name: 'Map Ratings', path: '/admin/map-ratings' },
    { name: 'Stage Mappings', path: '/admin/stage-mappings' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-black flex flex-col md:flex-row font-['Inter']">
      
      {/* Sidebar: Functional Brutalism */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-black p-5 flex flex-col z-10 shrink-0">
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

        <nav className="flex flex-col gap-2 flex-grow">
          {navLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link 
                key={link.path}
                to={link.path} 
                className={`flex items-center px-3 py-2 text-[13px] font-bold uppercase tracking-wider transition-all duration-75 border ${
                  isActive 
                    ? 'bg-black text-white border-black' 
                    : 'bg-transparent text-gray-600 border-transparent hover:border-black hover:text-black'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-12 pt-5 border-t border-black">
          <Link to="/" className="text-[12px] font-bold font-['JetBrains_Mono'] text-gray-500 hover:text-black uppercase tracking-wider transition-colors flex items-center gap-2">
            [ EXIT TO PUBLIC ]
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-[var(--color-background)] min-h-screen p-6 md:p-10 overflow-y-auto">
        <div className="max-w-7xl w-full mx-auto relative">
          <Outlet />
        </div>
      </main>

    </div>
  );
}

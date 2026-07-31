import { Outlet, Link } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="bg-[var(--color-background)] text-[var(--color-on-background)] min-h-screen flex flex-col md:flex-row overflow-hidden font-['Inter']">
      
      {/* Left Panel: Branding (Hidden on Mobile) */}
      <div className="hidden md:flex flex-col justify-between w-[40%] bg-[var(--color-background)] p-[var(--spacing-margin-desktop)] relative overflow-hidden border-r-2 border-[var(--color-on-background)]">
        
        {/* Brand Logo Area */}
        <div className="z-10">
          <Link to="/" className="flex items-center gap-2 font-['Archivo_Black'] text-[var(--font-h2-size,2rem)] font-extrabold uppercase tracking-tighter hover:text-[var(--color-primary)] transition-colors">
            <img src="/logo.png" alt="Trickster Logo" className="w-8 h-8 object-contain" />
            Trickster*
          </Link>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute inset-0 noise-bg opacity-40 pointer-events-none" />
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        
        {/* Large Headline */}
        <div className="z-10 mt-auto mb-32">
          <h1 className="font-['Archivo_Black'] text-[4rem] xl:text-[5rem] uppercase font-black leading-none max-w-sm tracking-tighter">
            ENTER<br />THE<br />META.
          </h1>
        </div>
        

      </div>
      
      {/* Right Panel: Form Area */}
      <div className="flex-1 flex flex-col justify-center items-center p-[var(--spacing-margin-mobile)] md:p-[var(--spacing-margin-desktop)] bg-[var(--color-surface-variant)] min-h-screen md:min-h-0 relative">
        <div className="absolute inset-0 noise-bg opacity-30 pointer-events-none" />
        
        {/* Mobile Logo (Visible only on small screens) */}
        <div className="md:hidden w-full max-w-md mb-8 flex justify-center z-10">
          <Link to="/" className="flex items-center gap-2 font-['Archivo_Black'] text-[2.25rem] font-extrabold uppercase tracking-tighter">
            <img src="/logo.png" alt="Trickster Logo" className="w-8 h-8 object-contain" />
            Trickster*
          </Link>
        </div>
        
        <Outlet />
        
        <div className="mt-8 md:hidden text-center z-10">
          <p className="font-['JetBrains_Mono'] text-xs font-bold uppercase text-[var(--color-secondary)]">© 2024 TRICKSTER MEDIA GROUP.</p>
        </div>
      </div>
    </div>
  );
}

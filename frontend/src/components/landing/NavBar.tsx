import { Link } from 'react-router-dom';
import { List, ArrowRight } from '@phosphor-icons/react';
import { useState } from 'react';

export default function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="w-full px-4 md:px-8 pt-6 fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <header className="max-w-7xl mx-auto pointer-events-auto relative">
        
        {/* Main Navbar Container */}
        {/* Layer 1 signature: cut-corner-top-right, surface-inverse */}
        <div 
          className="bg-[#111111] h-20 rounded-l-2xl rounded-br-2xl rounded-tr-none flex items-center justify-between px-6 md:px-10 border-4 border-[#111111]"
          style={{
            clipPath: 'polygon(0 0, calc(100% - 32px) 0, 100% 32px, 100% 100%, 0 100%)',
            boxShadow: '8px 8px 0px 0px rgba(0,0,0,0.2)' // Soft shadow since the bar itself is black
          }}
        >
          {/* Left: Logo */}
          <div className="flex-1 flex justify-start">
            <Link to="/" className="text-white font-display text-2xl md:text-3xl tracking-tighter flex items-center gap-3 hover:text-[var(--color-primary)] transition-colors">
              <img src="/logo.png" alt="Trickster Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain invert" />
              <span className="mt-1">TRICKSTER</span>
            </Link>
          </div>

          {/* Center: Nav Links */}
          <nav className="hidden md:flex items-center gap-10">
            <a href="#scout" className="text-white font-label text-[12px] font-bold uppercase tracking-widest hover:text-[var(--color-primary)] transition-colors">Scout</a>
            <a href="#talent" className="text-white font-label text-[12px] font-bold uppercase tracking-widest hover:text-[var(--color-primary)] transition-colors">Talent</a>
            <a href="#leaderboard" className="text-white font-label text-[12px] font-bold uppercase tracking-widest hover:text-[var(--color-primary)] transition-colors">Leaderboard</a>
          </nav>

          {/* Right: Mobile Menu Toggle */}
          <div className="flex-1 flex justify-end md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[var(--color-primary)] p-2 active:scale-95 transition-transform"
            >
              <List weight="bold" size={28} />
            </button>
          </div>
        </div>

        {/* Floating Overlap CTA (Layer 1 signature) */}
        {/* Sits half-in/half-out of navbar's bottom edge */}
        <div className="hidden md:flex absolute -bottom-6 right-10 z-20 pointer-events-auto">
          <Link 
            to="/app/dashboard" 
            className="flex items-center gap-3 bg-[var(--color-primary)] border-4 border-black px-8 py-3 rounded-full font-display text-lg uppercase tracking-widest text-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all active:scale-[0.97]"
          >
            Dashboard
            <ArrowRight weight="bold" size={20} />
          </Link>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-24 right-0 w-64 bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-6 md:hidden z-30 pointer-events-auto">
            <a href="#scout" onClick={() => setMobileMenuOpen(false)} className="font-display text-xl uppercase tracking-tighter hover:text-[var(--color-primary)] transition-colors">Scout</a>
            <a href="#talent" onClick={() => setMobileMenuOpen(false)} className="font-display text-xl uppercase tracking-tighter hover:text-[var(--color-primary)] transition-colors">Talent</a>
            <a href="#leaderboard" onClick={() => setMobileMenuOpen(false)} className="font-display text-xl uppercase tracking-tighter hover:text-[var(--color-primary)] transition-colors">Leaderboard</a>
            <Link 
              to="/app/dashboard"
              className="mt-4 flex justify-between items-center bg-[var(--color-primary)] border-4 border-black px-6 py-3 font-display text-lg uppercase tracking-tight text-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:scale-[0.97]"
            >
              Dashboard <ArrowRight weight="bold" />
            </Link>
          </div>
        )}

      </header>
    </div>
  );
}

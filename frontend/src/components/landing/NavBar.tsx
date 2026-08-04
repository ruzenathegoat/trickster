import { Link } from 'react-router-dom';
import { List, ArrowRight } from '@phosphor-icons/react';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="w-full px-4 md:px-8 pt-6 fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <header className="max-w-7xl mx-auto pointer-events-auto relative">
        
        {/* Main Navbar Container (Command Bar) */}
        <div className="bg-[#111111] h-20 flex items-center justify-between px-6 md:px-8 border-4 border-theme-border shadow-[8px_8px_0px_0px_var(--color-primary)]">
          
          {/* Left: Logo */}
          <div className="flex-1 flex justify-start">
            <Link to="/" className="text-white font-['Archivo_Black'] text-2xl md:text-3xl uppercase tracking-tighter flex items-center gap-3 hover:text-[var(--color-primary)] transition-colors">
              <img src="/logo.png" alt="Trickster Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain invert" />
              <span className="mt-1">TRICKSTER</span>
            </Link>
          </div>

          {/* Center: Nav Links (Terminal Style) */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#leaderboard" className="text-gray-400 font-['JetBrains_Mono'] text-[13px] font-bold uppercase tracking-widest hover:text-white transition-colors">
              <span className="text-[var(--color-primary)] mr-1">//</span> METRICS
            </a>
            <a href="#scout" className="text-gray-400 font-['JetBrains_Mono'] text-[13px] font-bold uppercase tracking-widest hover:text-white transition-colors">
              <span className="text-[var(--color-primary)] mr-1">//</span> TELEMETRY
            </a>
            <a href="#talent" className="text-gray-400 font-['JetBrains_Mono'] text-[13px] font-bold uppercase tracking-widest hover:text-white transition-colors">
              <span className="text-[var(--color-primary)] mr-1">//</span> ARCHITECTURE
            </a>
          </nav>

          {/* Right: Desktop CTA & Mobile Toggle */}
          <div className="flex-1 flex justify-end items-center gap-4">
            {/* Desktop CTA */}
            <Link to="/app/dashboard" className="hidden md:block">
              <motion.div 
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="bg-[var(--color-primary)] border-2 border-[var(--color-primary)] px-6 py-2 flex items-center gap-2 cursor-pointer hover:bg-white hover:border-white transition-colors duration-200"
              >
                <span className="font-['Archivo_Black'] text-black text-sm uppercase tracking-widest mt-1">
                  ENTER_APP
                </span>
                <ArrowRight weight="bold" size={16} className="text-black" />
              </motion.div>
            </Link>

            {/* Mobile Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-[var(--color-primary)] p-2 active:scale-95 transition-transform"
            >
              <List weight="bold" size={28} />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown (Brutalist) */}
        {mobileMenuOpen && (
          <div className="absolute top-24 right-4 w-64 bg-[#111111] border-4 border-theme-border shadow-[8px_8px_0px_var(--color-primary)] p-6 flex flex-col gap-6 md:hidden z-30 pointer-events-auto">
            <a href="#leaderboard" onClick={() => setMobileMenuOpen(false)} className="text-white font-['JetBrains_Mono'] text-sm font-bold uppercase tracking-widest hover:text-[var(--color-primary)] transition-colors">
              <span className="text-[var(--color-primary)] mr-2">//</span> METRICS
            </a>
            <a href="#scout" onClick={() => setMobileMenuOpen(false)} className="text-white font-['JetBrains_Mono'] text-sm font-bold uppercase tracking-widest hover:text-[var(--color-primary)] transition-colors">
              <span className="text-[var(--color-primary)] mr-2">//</span> TELEMETRY
            </a>
            <a href="#talent" onClick={() => setMobileMenuOpen(false)} className="text-white font-['JetBrains_Mono'] text-sm font-bold uppercase tracking-widest hover:text-[var(--color-primary)] transition-colors">
              <span className="text-[var(--color-primary)] mr-2">//</span> ARCHITECTURE
            </a>
            <Link 
              to="/app/dashboard"
              className="mt-4 flex justify-between items-center bg-[var(--color-primary)] px-4 py-3 font-['Archivo_Black'] text-sm uppercase tracking-widest text-black active:scale-[0.97] hover:bg-white transition-colors"
            >
              ENTER_APP <ArrowRight weight="bold" />
            </Link>
          </div>
        )}

      </header>
    </div>
  );
}

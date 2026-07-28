import { Link } from 'react-router-dom';
import { List } from '@phosphor-icons/react';

export default function NavBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none px-4 md:px-8 py-6">
      <div className="w-full max-w-[var(--spacing-max-width)] mx-auto flex items-center justify-between pointer-events-auto">

        {/* Left: Logo */}
        <div className="flex-1 flex justify-start">
          <Link to="/" className="text-[var(--color-on-background)] font-['Archivo_Black'] text-xl md:text-2xl tracking-tighter flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors drop-shadow-sm">
            <img src="/logo.png" alt="Trickster Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
            Trickster
          </Link>
        </div>

        {/* Center: Floating Pill Navbar */}
        <nav className="hidden md:flex items-center gap-8 bg-[var(--color-on-background)] px-10 py-3.5 rounded-full brutal-shadow border-2 border-[var(--color-on-background)]">
          <a href="#scout" className="text-[var(--color-surface)] text-sm font-['Inter'] font-semibold hover:text-[var(--color-primary)] transition-colors">Scout</a>
          <a href="#talent" className="text-[var(--color-surface)] text-sm font-['Inter'] font-semibold hover:text-[var(--color-primary)] transition-colors">Talent</a>
          <a href="#leaderboard" className="text-[var(--color-surface)] text-sm font-['Inter'] font-semibold hover:text-[var(--color-primary)] transition-colors">Leaderboard</a>
          <a href="#compare" className="text-[var(--color-surface)] text-sm font-['Inter'] font-semibold hover:text-[var(--color-primary)] transition-colors">Compare</a>
        </nav>

        {/* Right: CTA */}
        <div className="flex-1 flex justify-end">
          <Link to="/app/dashboard" className="hidden md:block px-8 py-3.5 border-2 border-[var(--color-on-background)] rounded-full text-sm font-bold bg-[var(--color-primary)] text-[var(--color-on-background)] hover:bg-[var(--color-on-background)] hover:text-[var(--color-surface)] transition-colors brutal-shadow interactive-scale">
            Dashboard
          </Link>
          <button className="md:hidden text-[var(--color-on-background)] bg-[var(--color-surface)] border-2 border-[var(--color-on-background)] p-2 rounded-md brutal-shadow-sm">
            <List weight="bold" size={24} />
          </button>
        </div>

      </div>
    </header>
  );
}

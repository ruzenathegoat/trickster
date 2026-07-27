import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NavBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)] py-4">
      <nav className="bg-[var(--color-surface)] pointer-events-auto border-2 border-[var(--color-on-background)] cut-corner brutal-shadow-sm flex justify-between items-center max-w-[var(--spacing-max-width)] mx-auto px-6 py-4 transition-all duration-300 hover:shadow-none hover:translate-y-1 hover:translate-x-1">
        <Link to="/" className="flex items-center gap-2 font-['Archivo_Narrow'] text-[var(--font-h2-size,2rem)] font-extrabold uppercase tracking-tighter text-[var(--color-on-background)] hover:text-[var(--color-primary)] transition-colors duration-200">
          <img src="/logo.png" alt="Trickster Logo" className="w-10 h-10 object-contain" />
          Trickster*
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <ul className="flex gap-6">
            <li>
              <a href="#scout" className="font-['JetBrains_Mono'] text-xs font-bold uppercase text-[var(--color-on-background)] hover:text-[var(--color-primary)] transition-colors duration-200">
                Scout
              </a>
            </li>
            <li>
              <a href="#talent" className="font-['JetBrains_Mono'] text-xs uppercase text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors duration-200 font-semibold">
                Talent
              </a>
            </li>
            <li>
              <a href="#leaderboard" className="font-['JetBrains_Mono'] text-xs uppercase text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors duration-200 font-semibold">
                Leaderboard
              </a>
            </li>
            <li>
              <a href="#compare" className="font-['JetBrains_Mono'] text-xs uppercase text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors duration-200 font-semibold">
                Compare
              </a>
            </li>
          </ul>
          
          <div className="flex items-center gap-4 border-l-2 border-[var(--color-secondary)] pl-8">
            <Link to="/login" className="font-['JetBrains_Mono'] text-xs font-bold uppercase text-[var(--color-on-background)] hover:text-[var(--color-primary)] transition-colors">
              Sign In
            </Link>
            <Link to="/app/dashboard" className="bg-[var(--color-primary-container)] text-[var(--color-on-background)] font-['JetBrains_Mono'] text-xs font-bold uppercase px-4 py-2 border-2 border-[var(--color-on-background)] brutal-shadow-sm brutal-hover transition-all">
              Dashboard
            </Link>
          </div>
        </div>
        <button className="md:hidden text-[var(--color-on-background)]">
          <Menu size={24} />
        </button>
      </nav>
    </header>
  );
}

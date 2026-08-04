export default function Footer() {
  return (
    <footer className="bg-[#111111] border-t-8 border-theme-border w-full py-16 px-6 md:px-12 mt-24 relative overflow-hidden">
      
      {/* Decorative Background Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
        <h1 className="font-display text-[15vw] leading-none text-white whitespace-nowrap">
          TRICKSTER
        </h1>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-12 relative z-10">
        
        {/* Left: Brand */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 text-white hover:text-[var(--color-primary)] transition-colors cursor-pointer">
            <img src="/logo.png" alt="Trickster Logo" className="w-12 h-12 object-contain invert" />
            <span className="font-display text-4xl uppercase tracking-tighter mt-1">TRICKSTER</span>
          </div>
          <p className="font-label text-[11px] text-gray-400 uppercase tracking-widest max-w-xs leading-relaxed">
            Valorant talent decision-support platform.
            Stop guessing, start scouting.
          </p>
        </div>

        {/* Center: Links */}
        <ul className="flex flex-col md:flex-row gap-6 md:gap-10">
          <li>
            <a href="#terms" className="font-label text-[12px] font-bold text-gray-400 hover:text-[var(--color-primary)] uppercase tracking-widest transition-colors">
              Terms of Service
            </a>
          </li>
          <li>
            <a href="#privacy" className="font-label text-[12px] font-bold text-gray-400 hover:text-[var(--color-primary)] uppercase tracking-widest transition-colors">
              Privacy Policy
            </a>
          </li>
          <li>
            <a href="#twitter" className="font-label text-[12px] font-bold text-gray-400 hover:text-[var(--color-primary)] uppercase tracking-widest transition-colors flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Twitter
            </a>
          </li>
          <li>
            <a href="#discord" className="font-label text-[12px] font-bold text-gray-400 hover:text-[var(--color-primary)] uppercase tracking-widest transition-colors">
              Discord
            </a>
          </li>
        </ul>

        {/* Right: Copyright */}
        <div className="flex flex-col items-start md:items-end gap-2">
          <div className="bg-white text-black font-numeric text-sm font-bold px-3 py-1 border-2 border-theme-border">
            2026
          </div>
          <div className="font-label text-[10px] text-gray-500 uppercase tracking-widest text-left md:text-right">
            © Trickster Protocol.<br/>All rights reserved.
          </div>
        </div>

      </div>
    </footer>
  );
}

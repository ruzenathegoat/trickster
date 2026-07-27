export default function Footer() {
  return (
    <footer className="bg-[var(--color-surface)] border-t-2 border-[var(--color-on-background)] w-full py-12 px-[var(--spacing-margin-desktop)] mt-24">
      <div className="flex flex-col md:flex-row justify-between items-center max-w-[var(--spacing-max-width)] mx-auto gap-[var(--spacing-gutter)]">
        <div className="flex items-center gap-3 font-['Archivo_Narrow'] text-[1.5rem] font-bold text-[var(--color-on-background)] uppercase tracking-tighter">
          <img src="/logo.png" alt="Trickster Logo" className="w-8 h-8 object-contain" />
          TRICKSTER*
        </div>
        <ul className="flex flex-wrap gap-6 justify-center">
          <li>
            <a href="#terms" className="font-['Inter'] text-[1rem] text-[var(--color-secondary)] hover:underline decoration-2 decoration-[var(--color-primary)] opacity-80 hover:opacity-100 transition-all">
              Terms
            </a>
          </li>
          <li>
            <a href="#privacy" className="font-['Inter'] text-[1rem] text-[var(--color-secondary)] hover:underline decoration-2 decoration-[var(--color-primary)] opacity-80 hover:opacity-100 transition-all">
              Privacy
            </a>
          </li>
          <li>
            <a href="#twitter" className="font-['Inter'] text-[1rem] text-[var(--color-secondary)] hover:underline decoration-2 decoration-[var(--color-primary)] opacity-80 hover:opacity-100 transition-all">
              Twitter
            </a>
          </li>
          <li>
            <a href="#discord" className="font-['Inter'] text-[1rem] text-[var(--color-secondary)] hover:underline decoration-2 decoration-[var(--color-primary)] opacity-80 hover:opacity-100 transition-all">
              Discord
            </a>
          </li>
        </ul>
        <div className="font-['Inter'] text-sm text-[var(--color-secondary)] text-center md:text-right">
          © 2024 Trickster Protocol. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

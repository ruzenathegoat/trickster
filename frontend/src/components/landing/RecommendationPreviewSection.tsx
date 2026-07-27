export default function RecommendationPreviewSection() {
  return (
    <section id="leaderboard" className="w-full bg-[var(--color-inverse-surface)] py-24 md:py-32 relative z-10 border-b-2 border-[var(--color-on-background)] overflow-hidden text-[var(--color-inverse-on-surface)]">
      
      {/* Dark Texture */}
      <div className="absolute inset-0 noise-bg opacity-10 pointer-events-none" />
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

      <div className="max-w-[var(--spacing-max-width)] mx-auto px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)]">
        
        <div className="flex flex-col md:flex-row items-center gap-16 md:gap-24">
          
          {/* Left: Copy */}
          <div className="flex-1 text-center md:text-left z-10">
            <div className="inline-block border-2 border-[var(--color-primary)] px-3 py-1 mb-6 cut-corner bg-[var(--color-inverse-surface)]">
               <span className="font-['JetBrains_Mono'] text-[0.75rem] font-bold uppercase tracking-widest text-[var(--color-primary)]">
                 AI Decision Support
               </span>
            </div>
            <h2 className="font-['Archivo_Narrow'] text-[3rem] md:text-[4rem] font-black uppercase leading-none tracking-tighter mb-6 text-white">
              Smarter<br />
              <span className="text-[var(--color-primary)]">Recommendations.</span>
            </h2>
            <p className="font-['Inter'] text-[1.125rem] text-gray-400 leading-relaxed max-w-md mx-auto md:mx-0">
              Trickster doesn't just hand you a spreadsheet. Our AI analyzes roster gaps and generates decision-support cards with confidence levels and a breakdown of exactly <strong>why</strong> a player fits.
            </p>
          </div>

          {/* Right: The UI Mockup */}
          <div className="flex-1 w-full relative z-10 perspective-1000">
            {/* The Floating Card Mockup */}
            <div className="bg-[var(--color-surface)] text-[var(--color-on-background)] border-4 border-[var(--color-on-background)] brutal-shadow p-6 md:p-8 cut-corner-lg transform rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-500 ease-out">
              
              {/* Header */}
              <div className="flex justify-between items-start mb-6 border-b-2 border-[var(--color-on-background)] pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-black text-white font-['JetBrains_Mono'] font-bold text-xs px-2 py-0.5">RANK #1</span>
                    <span className="font-['Inter'] text-xs font-bold text-[var(--color-secondary)] uppercase">Match: 94%</span>
                  </div>
                  <h3 className="font-['Archivo_Narrow'] text-[2.5rem] font-black uppercase leading-none">
                    Tyson "TenZ" Ngo
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-[var(--color-on-background)] overflow-hidden shrink-0">
                  <img src="https://ui-avatars.com/api/?name=TenZ&background=F5D90A&color=111111&bold=true" alt="TenZ" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* AI Why Checklist */}
              <div className="mb-8">
                <h4 className="font-['JetBrains_Mono'] text-[0.875rem] font-bold uppercase mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[1.25rem] text-[var(--color-primary)]">psychology</span>
                  Why this fit works
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 w-4 h-4 bg-[var(--color-success)] border border-[var(--color-on-background)] rounded-full shrink-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[10px] text-white">check</span>
                    </div>
                    <span className="font-['Inter'] text-[0.875rem] font-medium leading-snug">
                      Exceptional First-Blood Success Rate (+14% above Tier 1 average).
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 w-4 h-4 bg-[var(--color-success)] border border-[var(--color-on-background)] rounded-full shrink-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[10px] text-white">check</span>
                    </div>
                    <span className="font-['Inter'] text-[0.875rem] font-medium leading-snug">
                      Agent pool (Jett/Yoru) perfectly covers your current roster gaps.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 w-4 h-4 bg-[var(--color-warning)] border border-[var(--color-on-background)] rounded-full shrink-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[10px] text-black">exclamation</span>
                    </div>
                    <span className="font-['Inter'] text-[0.875rem] font-medium leading-snug">
                      High buyout variance; contract ends in 4 months.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Action */}
              <button className="w-full bg-[var(--color-primary)] text-black border-2 border-black py-3 font-['JetBrains_Mono'] font-bold text-[0.875rem] uppercase brutal-shadow-sm brutal-hover flex items-center justify-center gap-2">
                Run Simulation
                <span className="material-symbols-outlined text-[1.25rem]">play_circle</span>
              </button>

            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[var(--color-primary)] rounded-full border-4 border-black blur-xl opacity-20 -z-10 animate-pulse" />
          </div>
        </div>

      </div>
    </section>
  );
}

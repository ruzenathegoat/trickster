export default function FeaturesSection() {
  return (
    <section className="w-full bg-[var(--color-background)] py-24 md:py-32 relative z-10 border-b-2 border-[var(--color-on-background)] overflow-hidden">
      <div className="absolute inset-0 noise-bg opacity-30 pointer-events-none" />
      
      <div className="max-w-[var(--spacing-max-width)] mx-auto px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)] relative z-10">
        
        <div className="mb-16 md:mb-24 text-center">
          <h2 className="font-['Archivo_Narrow'] text-[3rem] md:text-[4rem] font-black uppercase tracking-tighter text-[var(--color-on-background)] leading-none">
            UNFAIR ADVANTAGE.
          </h2>
          <p className="mt-4 font-['Inter'] text-[1.125rem] text-[var(--color-secondary)] max-w-xl mx-auto">
            Everything you need to scout, analyze, and build a world-class roster in one unified platform.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          
          {/* Feature 1 (Spans 2 columns on desktop) */}
          <div className="md:col-span-2 bg-[var(--color-surface)] border-2 border-[var(--color-on-background)] brutal-shadow cut-corner overflow-hidden group">
            <div className="h-48 md:h-64 bg-[var(--color-surface-variant)] border-b-2 border-[var(--color-on-background)] flex items-center justify-center p-8 relative overflow-hidden group-hover:bg-[var(--color-primary-container)] transition-colors duration-300">
               <span className="material-symbols-outlined text-[4rem] md:text-[6rem] text-[var(--color-on-background)] opacity-20 absolute -right-4 -bottom-4 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                search_insights
               </span>
            </div>
            <div className="p-8">
              <h3 className="font-['Archivo_Narrow'] text-[1.5rem] font-bold uppercase mb-2">Deep Scouting</h3>
              <p className="font-['Inter'] text-[1rem] text-[var(--color-secondary)]">
                Filter thousands of players by ACS, KAST, Agent pool, and region. Find hidden gems in Tier 2 before the competition does.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="md:col-span-1 bg-[var(--color-primary)] border-2 border-[var(--color-on-background)] brutal-shadow cut-corner overflow-hidden group">
            <div className="h-48 md:h-64 border-b-2 border-[var(--color-on-background)] flex items-center justify-center p-8 relative overflow-hidden">
               <span className="material-symbols-outlined text-[4rem] md:text-[6rem] text-[var(--color-on-background)] opacity-20 absolute right-4 bottom-4 group-hover:opacity-100 group-hover:-translate-y-4 transition-all duration-300">
                query_stats
               </span>
            </div>
            <div className="p-8">
              <h3 className="font-['Archivo_Narrow'] text-[1.5rem] font-bold uppercase mb-2">Contextual Analytics</h3>
              <p className="font-['Inter'] text-[1rem] text-[var(--color-on-background)]">
                Stop looking at raw numbers. We adjust stats based on opponent strength and map win rates.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="md:col-span-1 bg-[var(--color-surface)] border-2 border-[var(--color-on-background)] brutal-shadow cut-corner overflow-hidden group">
            <div className="h-48 md:h-64 bg-[var(--color-surface-variant)] border-b-2 border-[var(--color-on-background)] flex items-center justify-center p-8 relative overflow-hidden group-hover:bg-[var(--color-primary-container)] transition-colors duration-300">
               <span className="material-symbols-outlined text-[4rem] md:text-[6rem] text-[var(--color-on-background)] opacity-20 absolute left-4 bottom-4 group-hover:opacity-100 group-hover:rotate-12 transition-all duration-300">
                swords
               </span>
            </div>
            <div className="p-8">
              <h3 className="font-['Archivo_Narrow'] text-[1.5rem] font-bold uppercase mb-2">Head-to-Head</h3>
              <p className="font-['Inter'] text-[1rem] text-[var(--color-secondary)]">
                Compare players side-by-side. See overlapping agent pools and statistical deltas instantly.
              </p>
            </div>
          </div>

          {/* Feature 4 (Spans 2 columns on desktop) */}
          <div className="md:col-span-2 bg-[var(--color-surface)] border-2 border-[var(--color-on-background)] brutal-shadow cut-corner overflow-hidden group">
            <div className="h-48 md:h-64 bg-[var(--color-surface-variant)] border-b-2 border-[var(--color-on-background)] flex items-center justify-center p-8 relative overflow-hidden group-hover:bg-[var(--color-primary-container)] transition-colors duration-300">
               <span className="material-symbols-outlined text-[4rem] md:text-[6rem] text-[var(--color-on-background)] opacity-20 absolute -right-4 -bottom-4 group-hover:opacity-100 group-hover:translate-x-4 transition-all duration-300">
                group_add
               </span>
            </div>
            <div className="p-8">
              <h3 className="font-['Archivo_Narrow'] text-[1.5rem] font-bold uppercase mb-2">Roster Simulation</h3>
              <p className="font-['Inter'] text-[1rem] text-[var(--color-secondary)]">
                Drag and drop players into a simulated roster. Our AI identifies role clashes, firepower gaps, and predicts overall team synergy.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

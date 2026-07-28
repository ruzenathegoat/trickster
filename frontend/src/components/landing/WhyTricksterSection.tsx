export default function WhyTricksterSection() {
  return (
    <section className="w-full bg-[var(--color-surface)] py-24 md:py-32 relative z-10 border-b-2 border-[var(--color-on-background)] overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      
      <div className="max-w-[var(--spacing-max-width)] mx-auto px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)]">
        <div className="flex flex-col md:flex-row gap-12 md:gap-24 items-start">
          
          {/* Left: Huge Question */}
          <div className="flex-1 md:sticky top-32">
            <h2 className="font-['Archivo_Black'] text-[3rem] md:text-[5rem] font-black uppercase leading-none tracking-tighter text-[var(--color-on-background)]">
              DATA IS <br />
              <span className="text-[var(--color-primary)] stroke-black" style={{ WebkitTextStroke: '2px black' }}>SCATTERED.</span>
            </h2>
            <p className="mt-8 font-['Inter'] text-[1.125rem] md:text-[1.25rem] text-[var(--color-secondary)] max-w-md font-medium leading-relaxed">
              Scouts are digging through VLR, RIB.gg, and spreadsheets just to build a cohesive view of one player. The process is broken.
            </p>
          </div>

          {/* Right: The Solution */}
          <div className="flex-1 flex flex-col gap-12">
            
            {/* Box 1 */}
            <div className="bg-[var(--color-background)] border-2 border-[var(--color-on-background)] brutal-shadow p-8 md:p-12 cut-corner relative">
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-[var(--color-primary)] border-2 border-[var(--color-on-background)] rounded-full flex items-center justify-center font-['JetBrains_Mono'] font-bold text-xl">
                1
              </div>
              <h3 className="font-['Archivo_Black'] text-[2rem] font-bold uppercase mb-4">Unified Intel</h3>
              <p className="font-['Inter'] text-[1rem] text-[var(--color-secondary)] leading-relaxed">
                We ingest data from every major Valorant source. Match histories, economy stats, micro-interactions, and agent metrics—all normalized into a single, queryable database.
              </p>
            </div>

            {/* Box 2 */}
            <div className="bg-[var(--color-surface)] border-2 border-[var(--color-on-background)] brutal-shadow p-8 md:p-12 cut-corner relative translate-x-0 md:translate-x-8">
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-[var(--color-primary)] border-2 border-[var(--color-on-background)] rounded-full flex items-center justify-center font-['JetBrains_Mono'] font-bold text-xl">
                2
              </div>
              <h3 className="font-['Archivo_Black'] text-[2rem] font-bold uppercase mb-4">SMART Scoring</h3>
              <p className="font-['Inter'] text-[1rem] text-[var(--color-secondary)] leading-relaxed">
                Raw stats lie. Our proprietary SMART (Specific Meta-Adjusted Rating Toolkit) normalizes player performance against map biases, patch changes, and team economy.
              </p>
            </div>

            {/* Box 3 */}
            <div className="bg-[var(--color-primary-container)] border-2 border-[var(--color-on-background)] brutal-shadow p-8 md:p-12 cut-corner relative">
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-[var(--color-primary)] border-2 border-[var(--color-on-background)] rounded-full flex items-center justify-center font-['JetBrains_Mono'] font-bold text-xl">
                3
              </div>
              <h3 className="font-['Archivo_Black'] text-[2rem] font-bold uppercase mb-4">AI Decision Support</h3>
              <p className="font-['Inter'] text-[1rem] text-[var(--color-secondary)] leading-relaxed">
                We don't just show charts. Trickster's engine simulates roster changes and predicts chemistry shifts based on historical role overlaps and pacing metrics.
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

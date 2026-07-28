import { Check } from '@phosphor-icons/react';

export default function PlayerProfilePreviewSection() {
  return (
    <section id="talent" className="w-full bg-[var(--color-surface)] py-24 md:py-32 relative z-10 border-b-2 border-[var(--color-on-background)] overflow-hidden">
      <div className="absolute inset-0 noise-bg opacity-30 pointer-events-none" />
      
      <div className="max-w-[var(--spacing-max-width)] mx-auto px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)]">
        
        <div className="flex flex-col md:flex-row items-center gap-16 md:gap-24 flex-col-reverse">
          
          {/* Left: The UI Mockup (Magazine Style) */}
          <div className="flex-1 w-full relative z-10 perspective-1000">
            {/* The Magazine Layout Mockup */}
            <div className="bg-[var(--color-background)] border-4 border-[var(--color-on-background)] brutal-shadow overflow-hidden transform rotate-y-[5deg] rotate-x-[2deg] hover:rotate-0 transition-transform duration-500 ease-out">
              
              {/* Header Image Area */}
              <div className="h-48 bg-gray-200 relative border-b-4 border-[var(--color-on-background)] overflow-hidden flex items-center justify-center">
                {/* Simulated photo / pattern */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #111 0, #111 2px, transparent 2px, transparent 8px)' }} />
                <h3 className="font-['Archivo_Black'] text-[6rem] font-black text-white mix-blend-difference z-10 leading-none">
                  f0rsakeN
                </h3>
                
                {/* Verified Seal */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[var(--color-primary)] border-4 border-[var(--color-on-background)] rounded-full flex items-center justify-center animate-spin-slow z-20">
                   <svg className="w-full h-full fill-[var(--color-on-background)]" viewBox="0 0 100 100">
                    <path d="M 50,50 m -35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" fill="transparent" id="verified-curve"></path>
                    <text className="font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-widest">
                      <textPath href="#verified-curve" startOffset="0%">* VERIFIED * TIER 1 </textPath>
                    </text>
                  </svg>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="bg-black text-white font-['JetBrains_Mono'] font-bold text-[0.7rem] px-2 py-1 uppercase tracking-widest">Flex</span>
                  <span className="bg-[var(--color-surface)] border-2 border-black text-black font-['JetBrains_Mono'] font-bold text-[0.7rem] px-2 py-1 uppercase tracking-widest">Paper Rex</span>
                </div>

                <div className="grid grid-cols-3 gap-4 border-t-2 border-b-2 border-[var(--color-on-background)] py-4 mb-6">
                  <div>
                    <p className="font-['JetBrains_Mono'] text-[0.65rem] font-bold text-[var(--color-secondary)] uppercase">SMART Score</p>
                    <p className="font-['JetBrains_Mono'] text-[1.5rem] font-black text-[var(--color-on-background)]">92.4</p>
                  </div>
                  <div className="border-l-2 border-[var(--color-on-background)] pl-4">
                    <p className="font-['JetBrains_Mono'] text-[0.65rem] font-bold text-[var(--color-secondary)] uppercase">ACS (Avg)</p>
                    <p className="font-['JetBrains_Mono'] text-[1.5rem] font-black text-[var(--color-on-background)]">245</p>
                  </div>
                  <div className="border-l-2 border-[var(--color-on-background)] pl-4">
                    <p className="font-['JetBrains_Mono'] text-[0.65rem] font-bold text-[var(--color-secondary)] uppercase">KAST</p>
                    <p className="font-['JetBrains_Mono'] text-[1.5rem] font-black text-[var(--color-on-background)]">78%</p>
                  </div>
                </div>

                {/* Simulated Radar Chart */}
                <div className="h-32 bg-[var(--color-surface)] border-2 border-[var(--color-on-background)] flex items-center justify-center relative overflow-hidden">
                  <div className="w-24 h-24 rounded-full border border-gray-300 relative">
                    <div className="absolute inset-0 border border-gray-300 rounded-full scale-50" />
                    <div className="absolute inset-0 border border-gray-300 rounded-full scale-75" />
                    {/* Data Polygon */}
                    <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 z-10 fill-[var(--color-primary)] opacity-80 mix-blend-multiply">
                      <polygon points="50,10 90,40 75,90 25,90 10,40" />
                    </svg>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Right: Copy */}
          <div className="flex-1 text-center md:text-left z-10">
            <h2 className="font-['Archivo_Black'] text-[3rem] md:text-[4rem] font-black uppercase leading-none tracking-tighter mb-6 text-[var(--color-on-background)]">
              PROFILES THAT<br />
              <span className="text-[var(--color-primary)] stroke-black" style={{ WebkitTextStroke: '2px black' }}>READ LIKE A MAGAZINE.</span>
            </h2>
            <p className="font-['Inter'] text-[1.125rem] text-[var(--color-secondary)] leading-relaxed max-w-md mx-auto md:mx-0 font-medium">
              Data shouldn't be boring. We display player metrics with the aesthetic of a premium sports editorial. It's highly dense, incredibly fast, and visually undeniable.
            </p>
            <div className="mt-8 flex gap-4 justify-center md:justify-start">
              <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[0.875rem] font-bold text-[var(--color-on-background)]">
                <Check weight="bold" className="text-[1.25rem] text-[var(--color-primary)]" /> Tabular Data
              </div>
              <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[0.875rem] font-bold text-[var(--color-on-background)]">
                <Check weight="bold" className="text-[1.25rem] text-[var(--color-primary)]" /> Radar Charts
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

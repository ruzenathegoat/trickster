export default function TechMethodologySection() {
  return (
    <section id="compare" className="w-full bg-[var(--color-inverse-surface)] py-24 md:py-32 relative z-10 border-b-2 border-[var(--color-on-background)] overflow-hidden text-[var(--color-inverse-on-surface)]">
      <div className="absolute inset-0 noise-bg opacity-10 pointer-events-none" />
      
      <div className="max-w-[var(--spacing-max-width)] mx-auto px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)] relative z-10">
        
        <div className="text-center mb-16 md:mb-24">
          <h2 className="font-['Archivo_Black'] text-[3rem] md:text-[4rem] font-black uppercase tracking-tighter text-white leading-none">
            BUILT FOR <span className="text-[var(--color-primary)]">ANALYSTS.</span>
          </h2>
          <p className="mt-4 font-['Inter'] text-[1.125rem] text-gray-400 max-w-2xl mx-auto">
            Trickster isn't a generic stats aggregator. It's an enterprise-grade scouting engine built on our proprietary SMART methodology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          
          {/* Left: Code/Math Mockup */}
          <div className="bg-[var(--color-inverse-surface)] border-2 border-gray-700 p-6 font-['JetBrains_Mono'] text-sm md:text-base leading-relaxed overflow-x-auto brutal-shadow cut-corner">
            <div className="flex gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-[var(--color-error)]" />
              <div className="w-3 h-3 rounded-full bg-[var(--color-warning)]" />
              <div className="w-3 h-3 rounded-full bg-[var(--color-success)]" />
            </div>
            <pre className="text-gray-300">
<span className="text-purple-400">const</span> <span className="text-blue-400">calculateSMART</span> = (player, meta) =&gt; {'{'}
<br/>  <span className="text-gray-500">/* Specific Meta-Adjusted Rating Toolkit */</span>
<br/>  <span className="text-purple-400">let</span> baseScore = player.acs * 0.4 + player.kast * 0.6;
<br/>  
<br/>  <span className="text-gray-500">// Adjust for Opponent Strength (VLR Ranking)</span>
<br/>  <span className="text-purple-400">const</span> opponentMultiplier = <span className="text-blue-400">getOpponentTier</span>(player.matches);
<br/>  baseScore *= opponentMultiplier;
<br/>
<br/>  <span className="text-gray-500">// Adjust for Economy Impact (Thrifty / Eco Frags)</span>
<br/>  baseScore += <span className="text-blue-400">calcEcoImpactDelta</span>(player.econStats);
<br/>
<br/>  <span className="text-purple-400">return</span> <span className="text-blue-400">Math</span>.<span className="text-yellow-200">round</span>(baseScore);
<br/>{'}'};
            </pre>
          </div>

          {/* Right: Explanation */}
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="font-['Archivo_Black'] text-[1.5rem] font-bold uppercase mb-2 text-white">
                Context is Everything
              </h3>
              <p className="font-['Inter'] text-[1rem] text-gray-400 leading-relaxed">
                A 300 ACS against Tier 3 mix teams is not the same as a 220 ACS against FNATIC. Our pipeline weights every single kill based on opponent ELO, economy state, and round impact.
              </p>
            </div>
            <div>
              <h3 className="font-['Archivo_Black'] text-[1.5rem] font-bold uppercase mb-2 text-white">
                Live Data Ingestion
              </h3>
              <p className="font-['Inter'] text-[1rem] text-gray-400 leading-relaxed">
                Trickster's headless scrapers constantly index VLR and RIB.gg. When a match ends, our database updates within minutes, running millions of recalculations in the background.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

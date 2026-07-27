export default function TeamSimulationPreviewSection() {
  const roster = [
    { name: "Boaster", role: "Controller", acs: 185, delta: null },
    { name: "Derke", role: "Duelist", acs: 265, delta: null },
    { name: "Alfajer", role: "Sentinel", acs: 240, delta: null },
    { name: "Chronicle", role: "Initiator", acs: 230, delta: null },
    // The "Simulated Swap" slot
    { name: "Leo", role: "Initiator", acs: 215, delta: { acs: "+12", kast: "+4%", winrate: "+1.2%" }, isSwap: true },
  ];

  return (
    <section className="w-full bg-[var(--color-surface-variant)] py-24 md:py-32 relative z-10 border-b-2 border-[var(--color-on-background)] overflow-hidden">
      
      {/* Structural Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(90deg, var(--color-on-background) 1px, transparent 0), linear-gradient(180deg, var(--color-on-background) 1px, transparent 0)', backgroundSize: '64px 64px' }} />

      <div className="max-w-[var(--spacing-max-width)] mx-auto px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)]">
        
        <div className="flex flex-col md:flex-row items-center gap-16 md:gap-24">
          
          {/* Left: Copy */}
          <div className="flex-1 text-center md:text-left z-10">
            <h2 className="font-['Archivo_Narrow'] text-[3rem] md:text-[4rem] font-black uppercase leading-none tracking-tighter mb-6 text-[var(--color-on-background)]">
              SIMULATE <br />
              <span className="text-[var(--color-primary)] stroke-black" style={{ WebkitTextStroke: '2px black' }}>CHEMISTRY.</span>
            </h2>
            <p className="font-['Inter'] text-[1.125rem] text-[var(--color-secondary)] leading-relaxed max-w-md mx-auto md:mx-0 font-medium mb-8">
              Don't guess how a roster change will play out. Drag a scouted player into your team and let our AI calculate the predicted synergy, pacing overlaps, and statistical deltas.
            </p>
            <div className="inline-flex items-center gap-4 bg-[var(--color-surface)] border-2 border-[var(--color-on-background)] brutal-shadow-sm px-6 py-4 cut-corner">
               <span className="material-symbols-outlined text-[2rem] text-[var(--color-primary)]">drag_indicator</span>
               <span className="font-['JetBrains_Mono'] font-bold uppercase text-[0.875rem]">Drag & Drop Interface</span>
            </div>
          </div>

          {/* Right: The UI Mockup (Simulation Delta) */}
          <div className="flex-1 w-full relative z-10">
            <div className="bg-[var(--color-background)] border-4 border-[var(--color-on-background)] brutal-shadow p-6 relative">
              
              <div className="flex justify-between items-end mb-6 border-b-2 border-[var(--color-on-background)] pb-2">
                <h3 className="font-['JetBrains_Mono'] font-bold uppercase tracking-widest text-[var(--color-secondary)]">Predicted Roster Output</h3>
                <span className="bg-[var(--color-primary)] text-black font-['JetBrains_Mono'] font-bold px-2 py-1 text-xs">AI SIMULATION</span>
              </div>

              <div className="flex flex-col gap-3">
                {roster.map((player, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between p-3 border-2 ${player.isSwap ? 'border-[var(--color-primary)] bg-[var(--color-primary-container)] brutal-shadow-sm transform -translate-y-1' : 'border-[var(--color-on-background)] bg-[var(--color-surface)]'}`}
                  >
                    <div className="flex items-center gap-4">
                       {/* Role Icon Placeholder */}
                       <div className="w-8 h-8 bg-gray-200 border border-black flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm">{player.role === 'Controller' ? 'visibility_off' : player.role === 'Duelist' ? 'local_fire_department' : player.role === 'Sentinel' ? 'shield' : 'radar'}</span>
                       </div>
                       <div>
                         <p className="font-['Archivo_Narrow'] font-bold text-lg leading-none uppercase">{player.name}</p>
                         <p className="font-['JetBrains_Mono'] text-[0.6rem] text-[var(--color-secondary)] uppercase">{player.role}</p>
                       </div>
                    </div>

                    <div className="text-right flex items-center gap-4">
                      {player.isSwap && player.delta && (
                        <div className="flex gap-2 mr-2">
                           <span className="bg-[var(--color-success)] text-white font-['JetBrains_Mono'] font-bold text-[0.6rem] px-1 py-0.5 animate-pulse">ACS {player.delta.acs}</span>
                           <span className="bg-[var(--color-success)] text-white font-['JetBrains_Mono'] font-bold text-[0.6rem] px-1 py-0.5 animate-pulse">WR {player.delta.winrate}</span>
                        </div>
                      )}
                      <div>
                        <p className="font-['JetBrains_Mono'] text-[1.25rem] font-black">{player.acs}</p>
                        <p className="font-['JetBrains_Mono'] text-[0.6rem] text-[var(--color-secondary)] uppercase">Est. ACS</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

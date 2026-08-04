import { useState, useEffect } from 'react';
import { DotsSixVertical, EyeClosed, Fire, Shield, Crosshair, Target, CursorClick } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

// Custom easings per emil-design-eng
const easeOut = [0.23, 1, 0.32, 1] as const;

export default function TeamSimulationPreviewSection() {
  const [isSimulating, setIsSimulating] = useState(false);

  // Auto loop the simulation state to make it feel alive without requiring interaction
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSimulating(prev => !prev);
    }, 4500); // 4.5 seconds loop
    return () => clearInterval(interval);
  }, []);

  const roster = [
    { name: "Boaster", role: "Controller", acs: 185 },
    { name: "Derke", role: "Duelist", acs: 265 },
    { name: "Alfajer", role: "Sentinel", acs: 240 },
    { name: "Chronicle", role: "Initiator", acs: 230 },
  ];

  const incomingPlayer = { 
    name: "Leo", 
    role: "Initiator", 
    acs: 215, 
    delta: { acs: "+12", kast: "+4%", winrate: "+1.2%" } 
  };

  return (
    <section className="w-full bg-[var(--theme-bg)] py-24 md:py-32 relative z-10 border-b-4 border-theme-border overflow-hidden flex flex-col items-center">
      
      {/* Structural Pattern - Brutalist grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(90deg, var(--theme-border) 2px, transparent 0), linear-gradient(180deg, var(--theme-border) 2px, transparent 0)', backgroundSize: '128px 128px' }} />

      {/* Massive Background Typography - Breaks out of container */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden select-none">
        <h2 className="font-['Archivo_Black'] text-[20vw] leading-none whitespace-nowrap text-theme-text">
          CHEMISTRY
        </h2>
      </div>

      <div className="max-w-[1200px] w-full px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)] relative z-10 flex flex-col items-center">
        
        {/* Header content centered - Departs from AI generic 2-col */}
        <div className="text-center mb-16 relative w-full max-w-3xl">
           <motion.div 
             initial={{ y: 20, opacity: 0 }}
             whileInView={{ y: 0, opacity: 1 }}
             viewport={{ once: true, margin: "-50px" }}
             transition={{ duration: 0.5, ease: easeOut }}
             className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-black border-2 border-theme-border px-4 py-2 mb-8 shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] font-['JetBrains_Mono'] font-bold text-sm uppercase"
           >
             <CursorClick weight="bold" className="text-lg" />
             Interactive Prediction
           </motion.div>

           <motion.h2 
             initial={{ y: 20, opacity: 0 }}
             whileInView={{ y: 0, opacity: 1 }}
             viewport={{ once: true, margin: "-50px" }}
             transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
             className="font-['Archivo_Black'] text-5xl md:text-7xl font-black uppercase leading-[0.95] tracking-tighter text-theme-text mb-6"
           >
             SIMULATE <br />
             <span className="text-transparent" style={{ WebkitTextStroke: '2px var(--theme-text)' }}>THE IMPACT.</span>
           </motion.h2>

           <motion.p 
             initial={{ y: 20, opacity: 0 }}
             whileInView={{ y: 0, opacity: 1 }}
             viewport={{ once: true, margin: "-50px" }}
             transition={{ duration: 0.5, delay: 0.2, ease: easeOut }}
             className="font-['Inter'] text-lg md:text-xl text-gray-500 mx-auto font-medium"
           >
             Don't guess how a roster change will play out. Drag a scouted player into your team and let our AI calculate the predicted synergy, pacing overlaps, and statistical deltas in real-time.
           </motion.p>
        </div>

        {/* The Interactive Terminal */}
        <motion.div 
          initial={{ y: 40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.3, ease: easeOut }}
          className="w-full max-w-4xl bg-[var(--theme-bg)] border-4 border-theme-border shadow-[8px_8px_0px_0px_var(--color-theme-shadow)] relative"
        >
          {/* Terminal Header */}
          <div className="flex justify-between items-center bg-[var(--theme-bg)] border-b-4 border-theme-border px-4 py-3">
             <div className="flex gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-theme-border" />
                <div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-theme-border" />
                <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-theme-border" />
             </div>
             <span className="font-['JetBrains_Mono'] font-bold text-xs md:text-sm uppercase tracking-widest text-theme-text opacity-70">
                AI_ROSTER_ENGINE.EXE
             </span>
          </div>

          <div className="p-4 md:p-8 flex flex-col gap-4 relative overflow-hidden">
             {/* Base Roster */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roster.map((player, i) => (
                   <motion.div 
                     key={player.name}
                     initial={{ opacity: 0, x: -20 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     viewport={{ once: true }}
                     transition={{ duration: 0.4, delay: 0.4 + (i * 0.05), ease: easeOut }} // Stagger entrance
                     className="flex items-center justify-between p-4 bg-[var(--theme-bg)] border-2 border-theme-border"
                   >
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[var(--theme-bg)] border-2 border-theme-border flex items-center justify-center text-theme-text">
                          {player.role === 'Controller' ? <EyeClosed weight="bold" size={20} /> : player.role === 'Duelist' ? <Fire weight="bold" size={20} /> : player.role === 'Sentinel' ? <Shield weight="bold" size={20} /> : <Crosshair weight="bold" size={20} />}
                        </div>
                        <div>
                          <p className="font-['Archivo_Black'] font-bold text-lg md:text-xl leading-none uppercase text-theme-text">{player.name}</p>
                          <p className="font-['JetBrains_Mono'] text-[0.7rem] text-gray-500 uppercase mt-1">{player.role}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="font-['JetBrains_Mono'] text-lg md:text-xl font-black text-theme-text">{player.acs}</p>
                        <p className="font-['JetBrains_Mono'] text-[0.6rem] text-gray-500 uppercase">ACS</p>
                     </div>
                   </motion.div>
                ))}
             </div>

             {/* The Empty Slot / Target Area */}
             <div className="mt-2 md:mt-4 relative h-[88px] border-4 border-dashed border-theme-border bg-[var(--theme-bg)] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {!isSimulating ? (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="text-gray-500 font-['JetBrains_Mono'] text-sm md:text-base font-bold uppercase tracking-widest flex items-center gap-2"
                    >
                      <Target className="text-xl" /> Drop Player Here
                    </motion.div>
                  ) : (
                    <motion.div
                      key="filled"
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                      className="absolute inset-[-4px] bg-[var(--color-primary)] border-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] flex items-center justify-between p-4 z-10"
                    >
                       <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-10 h-10 bg-theme-bg text-theme-text border-2 border-theme-border flex items-center justify-center shrink-0 shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]">
                            <Crosshair weight="bold" size={20} />
                          </div>
                          <div>
                            <p className="font-['Archivo_Black'] font-bold text-lg md:text-xl leading-none uppercase text-black">{incomingPlayer.name}</p>
                            <p className="font-['JetBrains_Mono'] text-[0.7rem] text-black/70 uppercase mt-1">{incomingPlayer.role}</p>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-2 md:gap-4">
                          <div className="flex flex-col md:flex-row gap-1 md:gap-2 mr-2 md:mr-4">
                             <motion.span 
                               initial={{ opacity: 0, x: -10 }}
                               animate={{ opacity: 1, x: 0 }}
                               transition={{ delay: 0.2, ease: easeOut, duration: 0.4 }}
                               className="bg-black text-[var(--color-primary)] font-['JetBrains_Mono'] font-bold text-[0.6rem] md:text-[0.7rem] px-2 py-1"
                             >
                               ACS {incomingPlayer.delta.acs}
                             </motion.span>
                             <motion.span 
                               initial={{ opacity: 0, x: -10 }}
                               animate={{ opacity: 1, x: 0 }}
                               transition={{ delay: 0.3, ease: easeOut, duration: 0.4 }}
                               className="bg-black text-[var(--color-primary)] font-['JetBrains_Mono'] font-bold text-[0.6rem] md:text-[0.7rem] px-2 py-1"
                             >
                               WR {incomingPlayer.delta.winrate}
                             </motion.span>
                          </div>
                          <div className="text-right text-black shrink-0">
                            <p className="font-['JetBrains_Mono'] text-lg md:text-xl font-black">{incomingPlayer.acs}</p>
                            <p className="font-['JetBrains_Mono'] text-[0.6rem] text-black/70 uppercase">Est. ACS</p>
                          </div>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

             {/* The Floating Incoming Player simulating a drag */}
             <AnimatePresence>
                {!isSimulating && (
                   <motion.div
                     initial={{ y: 30, opacity: 0 }}
                     animate={{ 
                       y: [30, 15, 30], 
                       opacity: 1,
                       rotate: [-2, 1, -2]
                     }}
                     exit={{ 
                        y: -50, 
                        x: -50,
                        scale: 0.8, 
                        opacity: 0,
                        rotate: 0,
                        filter: "blur(4px)",
                        transition: { duration: 0.3, ease: easeOut }
                     }}
                     transition={{ 
                       y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
                       rotate: { repeat: Infinity, duration: 5, ease: "easeInOut" }
                     }}
                     className="absolute bottom-[-10px] right-2 md:right-10 z-20 shadow-[8px_8px_0px_0px_var(--color-theme-shadow)] cursor-grab active:cursor-grabbing border-4 border-theme-border bg-[var(--theme-bg)] p-3 flex items-center gap-3 w-56 md:w-64 rotate-[-3deg]"
                   >
                     <DotsSixVertical className="text-2xl text-gray-500" />
                     <div>
                       <p className="font-['Archivo_Black'] font-bold text-lg uppercase text-theme-text">{incomingPlayer.name}</p>
                       <p className="font-['JetBrains_Mono'] text-[0.6rem] text-gray-500 uppercase">Drag to simulate</p>
                     </div>
                   </motion.div>
                )}
             </AnimatePresence>

          </div>
        </motion.div>

      </div>
    </section>
  );
}

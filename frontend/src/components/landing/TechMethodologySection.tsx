import { motion } from 'framer-motion';
import { TerminalWindow, Crosshair, Database } from '@phosphor-icons/react';

const easeOut = [0.23, 1, 0.32, 1] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.7, ease: easeOut }
  }
};

export default function TechMethodologySection() {
  return (
    <section id="compare" className="w-full bg-black py-24 md:py-32 relative z-10 border-b-4 border-theme-border overflow-hidden">
      
      {/* Dark Halftone Background */}
      <div className="absolute inset-0 opacity-[0.1]" 
           style={{ backgroundImage: 'radial-gradient(white 2px, transparent 2px)', backgroundSize: '24px 24px' }} />
      
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24 relative z-10">
        
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8"
        >
          <motion.div variants={itemVariants} className="relative inline-block">
            <h2 className="font-display text-[4rem] md:text-[6rem] font-black uppercase tracking-tighter text-white leading-[0.85] relative z-10">
              BUILT FOR<br/>
              <span className="text-[var(--color-primary)]">ANALYSTS.</span>
            </h2>
            <div className="absolute bottom-2 left-0 w-full h-4 bg-theme-bg z-0 translate-y-4" />
          </motion.div>
          
          <motion.div variants={itemVariants} className="max-w-md border-l-8 border-[var(--color-primary)] pl-6">
            <p className="font-body text-xl text-gray-400 font-medium">
              Trickster isn't a generic stats aggregator. It's an enterprise-grade scouting engine built on our proprietary SMART methodology.
            </p>
          </motion.div>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-stretch"
        >
          
          {/* Left: Interactive Code Terminal */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="lg:col-span-7 bg-[#0a0a0a] border-4 border-white shadow-[12px_12px_0px_var(--color-primary)] flex flex-col overflow-hidden"
          >
            {/* Brutalist Terminal Header */}
            <div className="bg-theme-bg text-theme-text px-6 py-4 border-b-4 border-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <TerminalWindow weight="bold" className="text-2xl" />
                <span className="font-label text-sm font-bold uppercase tracking-widest">TRICKSTER // ENGINE</span>
              </div>
              <div className="bg-black text-[var(--color-primary)] font-mono text-xs px-2 py-1 font-bold">
                v2.4.1_STABLE
              </div>
            </div>
            
            {/* Code Body */}
            <div className="p-8 font-mono text-sm md:text-base leading-relaxed overflow-x-auto text-gray-300">
              <pre>
<span className="text-[#ff7b72]">const</span> <span className="text-[#d2a8ff]">calculateSMART</span> = (player, meta) =&gt; {'{'}
<br/>  <span className="text-[#8b949e]">/* Specific Meta-Adjusted Rating Toolkit */</span>
<br/>  <span className="text-[#ff7b72]">let</span> baseScore = player.acs * <span className="text-[#79c0ff]">0.4</span> + player.kast * <span className="text-[#79c0ff]">0.6</span>;
<br/>  
<br/>  <span className="text-[#8b949e]">/* 1. Opponent ELO Normalization */</span>
<br/>  <span className="text-[#ff7b72]">const</span> oppMod = <span className="text-[#d2a8ff]">getOpponentTier</span>(player.matches);
<br/>  baseScore *= oppMod;
<br/>
<br/>  <span className="text-[#8b949e]">/* 2. Economy Impact (Eco vs Full Buy) */</span>
<br/>  baseScore += <span className="text-[#d2a8ff]">calcEcoImpactDelta</span>(player.econStats);
<br/>
<br/>  <span className="text-[#8b949e]">/* 3. Role Bias Correction */</span>
<br/>  <span className="text-[#ff7b72]">if</span> (meta.role === <span className="text-[#a5d6ff]">'CONTROLLER'</span>) {'{'}
<br/>    baseScore += <span className="text-[#d2a8ff]">calcUtilityImpact</span>(player.utilityStats);
<br/>  {'}'}
<br/>
<br/>  <span className="text-[#ff7b72]">return</span> <span className="text-[#79c0ff]">Math</span>.<span className="text-[#d2a8ff]">round</span>(baseScore);
<br/>{'}'};
              </pre>
            </div>
          </motion.div>

          {/* Right: Explanation Cards */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            
            <motion.div 
              variants={itemVariants}
              whileHover={{ x: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-theme-bg text-theme-text border-4 border-white p-8 shadow-[8px_8px_0px_rgba(255,255,255,0.2)] hover:shadow-[12px_12px_0px_var(--color-primary)] flex-1 relative overflow-hidden group"
            >

              <div className="relative z-10">
                <h3 className="font-display text-3xl font-black uppercase mb-4 leading-tight">
                  Context is<br/>Everything
                </h3>
                <div className="w-12 h-2 bg-[var(--color-primary)] border-2 border-theme-border mb-4" />
                <p className="font-body text-[var(--color-secondary)] font-medium leading-relaxed">
                  A 300 ACS against Tier 3 mix teams is not the same as a 220 ACS against FNATIC. Our pipeline weights every single kill based on opponent ELO, economy state, and round impact.
                </p>
              </div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              whileHover={{ x: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-[#111] text-white border-4 border-[var(--color-primary)] p-8 shadow-[8px_8px_0px_var(--color-primary)] flex-1 relative overflow-hidden group"
            >

              <div className="relative z-10">
                <h3 className="font-display text-3xl font-black uppercase mb-4 leading-tight text-[var(--color-primary)]">
                  Live Data<br/>Ingestion
                </h3>
                <div className="w-12 h-2 bg-theme-bg mb-4" />
                <p className="font-body text-gray-400 font-medium leading-relaxed">
                  Trickster's headless scrapers constantly index major endpoints. When a match ends, our database updates within minutes, running millions of recalculations in the background.
                </p>
              </div>
            </motion.div>

          </div>

        </motion.div>

      </div>
    </section>
  );
}

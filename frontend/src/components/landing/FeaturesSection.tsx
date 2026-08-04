import { motion } from 'framer-motion';
import { MagnifyingGlass, ChartBar, Sword, UsersThree } from '@phosphor-icons/react';

const easeOut = [0.23, 1, 0.32, 1] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
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

export default function FeaturesSection() {
  return (
    <section className="w-full bg-theme-bg py-24 md:py-32 relative z-10 border-b-4 border-theme-border overflow-hidden">
      {/* Brutalist Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(black 2px, transparent 2px)', backgroundSize: '32px 32px' }} />
      
      <div className="max-w-[var(--spacing-max-width)] mx-auto px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)] relative z-10">
        
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="mb-16 md:mb-24 text-center flex flex-col items-center"
        >
          <motion.h2 variants={itemVariants} className="font-display text-[3.5rem] md:text-[5rem] font-black uppercase tracking-tighter text-theme-text leading-none">
            UNFAIR ADVANTAGE.
          </motion.h2>
          <motion.div variants={itemVariants} className="mt-6 border-b-4 border-theme-border pb-2 px-4 inline-block">
            <p className="font-label text-sm md:text-base font-bold uppercase tracking-widest text-[var(--color-secondary)]">
              Everything you need to scout and build a world-class roster in one platform.
            </p>
          </motion.div>
        </motion.div>

        {/* Bento Grid */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
        >
          
          {/* Feature 1 (Spans 2 columns on desktop) */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="md:col-span-2 bg-theme-bg border-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] hover:shadow-[12px_12px_0px_var(--color-primary)] overflow-hidden group cursor-default transition-shadow"
          >
            <div className="h-48 md:h-64 bg-[var(--color-surface-variant)] border-b-4 border-theme-border flex items-center justify-center p-8 relative overflow-hidden group-hover:bg-black transition-colors duration-300">
              {/* Bespoke Data Visual: Filter Code Snippet */}
              <div className="w-full max-w-sm bg-theme-bg border-4 border-theme-border p-4 shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] group-hover:-translate-y-2 group-hover:shadow-[8px_8px_0px_var(--color-primary)] transition-all duration-500">
                <div className="font-numeric text-xs font-bold text-gray-500 mb-2">QUERY_BUILDER</div>
                <div className="font-display text-lg lg:text-xl uppercase leading-tight text-theme-text group-hover:text-[var(--color-primary)] transition-colors">
                  SELECT * FROM players<br/>
                  WHERE KAST {'>'} 75%<br/>
                  AND ROLE = 'FLEX'
                </div>
              </div>
            </div>
            <div className="p-8 bg-theme-bg">
              <h3 className="font-display text-[1.5rem] md:text-[2rem] font-bold uppercase mb-2 leading-none">Deep Scouting</h3>
              <p className="font-body text-lg text-[var(--color-secondary)] font-medium">
                Filter thousands of players by ACS, KAST, Agent pool, and region. Find hidden gems in Tier 2 before the competition does.
              </p>
            </div>
          </motion.div>

          {/* Feature 2 */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="md:col-span-1 bg-[#111111] text-white border-4 border-theme-border shadow-[8px_8px_0px_var(--color-primary)] hover:shadow-[12px_12px_0px_var(--color-primary)] overflow-hidden group cursor-default transition-shadow"
          >
            <div className="h-48 md:h-64 border-b-4 border-theme-border flex items-end justify-center gap-2 p-8 relative overflow-hidden group-hover:bg-[var(--color-primary)] transition-colors duration-300">
              {/* Bespoke Data Visual: CSS Bar Chart */}
              <div className="w-8 bg-[#333333] h-[30%] border-t-4 border-x-4 border-theme-border group-hover:h-[40%] transition-all duration-500 delay-75" />
              <div className="w-8 bg-[#555555] h-[50%] border-t-4 border-x-4 border-theme-border group-hover:h-[60%] transition-all duration-500 delay-100" />
              <div className="w-8 bg-theme-bg h-[80%] border-t-4 border-x-4 border-theme-border group-hover:h-[100%] group-hover:bg-black transition-all duration-500 delay-150" />
            </div>
            <div className="p-8">
              <h3 className="font-display text-[1.5rem] font-bold uppercase mb-2 leading-none">Contextual Analytics</h3>
              <p className="font-body text-gray-300 group-hover:text-white font-medium transition-colors">
                Stop looking at raw numbers. We adjust stats based on opponent strength and map win rates.
              </p>
            </div>
          </motion.div>

          {/* Feature 3 */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="md:col-span-1 bg-[var(--color-primary)] border-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] hover:shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] overflow-hidden group cursor-default transition-shadow"
          >
            <div className="h-48 md:h-64 border-b-4 border-theme-border flex items-center justify-center p-8 relative overflow-hidden group-hover:bg-theme-bg transition-colors duration-300">
              {/* Bespoke Data Visual: VS Lockup */}
              <div className="flex items-center gap-4 group-hover:scale-110 transition-transform duration-500">
                <div className="w-16 h-16 bg-black border-4 border-theme-border flex items-center justify-center group-hover:bg-[var(--color-primary)] transition-colors">
                  <div className="w-6 h-6 bg-theme-bg rounded-full" />
                </div>
                <div className="font-display text-4xl font-black italic text-theme-text opacity-20 group-hover:opacity-100 transition-opacity">VS</div>
                <div className="w-16 h-16 bg-theme-bg border-4 border-theme-border flex items-center justify-center group-hover:bg-black transition-colors">
                  <div className="w-6 h-6 bg-black group-hover:bg-theme-bg rounded-full transition-colors" />
                </div>
              </div>
            </div>
            <div className="p-8">
              <h3 className="font-display text-[1.5rem] font-bold uppercase mb-2 leading-none">Head-to-Head</h3>
              <p className="font-body text-black font-medium">
                Compare players side-by-side. See overlapping agent pools and statistical deltas instantly.
              </p>
            </div>
          </motion.div>

          {/* Feature 4 (Spans 2 columns on desktop) */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="md:col-span-2 bg-theme-bg border-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] hover:shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] overflow-hidden group cursor-default transition-shadow"
          >
            <div className="h-48 md:h-64 bg-[var(--color-surface-variant)] border-b-4 border-theme-border flex items-center justify-center p-8 relative overflow-hidden group-hover:bg-[var(--color-primary)] transition-colors duration-300">
              {/* Bespoke Data Visual: Roster Slots */}
              <div className="flex gap-2 lg:gap-4 group-hover:scale-110 transition-transform duration-500">
                {[1, 2, 3, 4, 5].map((slot) => (
                  <div key={slot} className={`w-10 h-16 md:w-14 md:h-20 border-4 border-theme-border flex items-end p-1 ${slot === 3 ? 'bg-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)] group-hover:shadow-[4px_4px_0px_white]' : 'bg-theme-bg'}`}>
                    <div className={`w-full h-1/3 border-2 border-theme-border ${slot === 3 ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface-variant)] group-hover:bg-theme-bg'}`} />
                  </div>
                ))}
              </div>
            </div>
            <div className="p-8 bg-theme-bg">
              <h3 className="font-display text-[1.5rem] md:text-[2rem] font-bold uppercase mb-2 leading-none">Roster Architect</h3>
              <p className="font-body text-lg text-[var(--color-secondary)] font-medium">
                Drag and drop players into a simulated roster. Our engine calculates role overlaps, identifies firepower gaps, and maps out tactical synergy based purely on historical agent data.
              </p>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}

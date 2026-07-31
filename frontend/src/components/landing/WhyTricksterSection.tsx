import { motion } from 'framer-motion';

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

export default function WhyTricksterSection() {
  return (
    <section className="w-full bg-[var(--color-surface)] py-24 md:py-32 relative z-10 border-b-4 border-black overflow-hidden">
      {/* Brutalist Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(black 2px, transparent 2px)', backgroundSize: '32px 32px' }} />
      
      <div className="max-w-[var(--spacing-max-width)] mx-auto px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)]">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">
          
          {/* Left: Huge Question */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="flex-1 lg:sticky top-32"
          >
            <motion.h2 
              variants={itemVariants}
              className="font-display text-[4rem] lg:text-[6rem] font-black uppercase leading-[0.85] tracking-tighter text-black"
            >
              DATA IS <br />
              <span className="text-white bg-black px-4 pt-2 pb-1 inline-block mt-2 border-4 border-black">SCATTERED.</span>
            </motion.h2>
            <motion.div variants={itemVariants} className="mt-8 border-l-8 border-black pl-6">
              <p className="font-label text-sm md:text-base font-bold uppercase tracking-widest text-gray-600 max-w-md leading-relaxed">
                Scouts are digging through VLR, RIB.gg, and messy spreadsheets just to build a cohesive view of one player. The manual process is completely broken.
              </p>
            </motion.div>
          </motion.div>

          {/* Right: The Solution (Staggered Cards) */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="flex-1 flex flex-col gap-12"
          >
            
            {/* Box 1 */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.02, rotate: -1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] p-8 md:p-12 relative cursor-default"
            >
              <div className="absolute -top-6 -left-6 w-14 h-14 bg-[var(--color-primary)] border-4 border-black flex items-center justify-center font-display text-2xl rotate-[-10deg] shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                1
              </div>
              <h3 className="font-display text-[2rem] uppercase mb-4 leading-none tracking-tight">Unified Intel</h3>
              <p className="font-body text-lg text-gray-700 leading-relaxed font-medium">
                We ingest data from every major Valorant source. Match histories, economy stats, micro-interactions, and agent metrics—all normalized into a single, queryable database.
              </p>
            </motion.div>

            {/* Box 2 */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.02, rotate: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-[#111111] text-white border-4 border-black shadow-[8px_8px_0px_var(--color-primary)] hover:shadow-[12px_12px_0px_var(--color-primary)] p-8 md:p-12 relative lg:translate-x-8 cursor-default"
            >
              <div className="absolute -top-6 -left-6 w-14 h-14 bg-white text-black border-4 border-black flex items-center justify-center font-display text-2xl rotate-[5deg] shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                2
              </div>
              <h3 className="font-display text-[2rem] uppercase mb-4 leading-none tracking-tight">SMART Scoring</h3>
              <p className="font-body text-lg text-gray-300 leading-relaxed font-medium">
                Raw stats lie. Our proprietary SMART (Specific Meta-Adjusted Rating Toolkit) normalizes player performance against map biases, patch changes, and team economy.
              </p>
            </motion.div>

            {/* Box 3 */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.02, rotate: -1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-[var(--color-primary)] border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] p-8 md:p-12 relative cursor-default"
            >
              <div className="absolute -top-6 -left-6 w-14 h-14 bg-white border-4 border-black flex items-center justify-center font-display text-2xl rotate-[-5deg] shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                3
              </div>
              <h3 className="font-display text-[2rem] uppercase mb-4 leading-none tracking-tight">Objective Discovery</h3>
              <p className="font-body text-lg text-black leading-relaxed font-medium">
                Remove gut feeling from the equation. Trickster filters and ranks players automatically using multi-criteria thresholds, helping you find hidden gems that traditional scouting misses.
              </p>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}

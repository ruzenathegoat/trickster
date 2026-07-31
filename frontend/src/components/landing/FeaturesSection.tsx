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
    <section className="w-full bg-white py-24 md:py-32 relative z-10 border-b-4 border-black overflow-hidden">
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
          <motion.h2 variants={itemVariants} className="font-display text-[3.5rem] md:text-[5rem] font-black uppercase tracking-tighter text-black leading-none">
            UNFAIR ADVANTAGE.
          </motion.h2>
          <motion.div variants={itemVariants} className="mt-6 border-b-4 border-black pb-2 px-4 inline-block">
            <p className="font-label text-sm md:text-base font-bold uppercase tracking-widest text-gray-600">
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
            className="md:col-span-2 bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_var(--color-primary)] overflow-hidden group cursor-default transition-shadow"
          >
            <div className="h-48 md:h-64 bg-[#f4f4f4] border-b-4 border-black flex items-center justify-center p-8 relative overflow-hidden group-hover:bg-[var(--color-primary)] transition-colors duration-300">
               <MagnifyingGlass weight="bold" className="text-[6rem] md:text-[8rem] text-black opacity-10 absolute -right-4 -bottom-4 group-hover:opacity-100 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500" />
            </div>
            <div className="p-8 bg-white">
              <h3 className="font-display text-[1.5rem] md:text-[2rem] font-bold uppercase mb-2 leading-none">Deep Scouting</h3>
              <p className="font-body text-lg text-gray-700 font-medium">
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
            className="md:col-span-1 bg-[#111111] text-white border-4 border-black shadow-[8px_8px_0px_var(--color-primary)] hover:shadow-[12px_12px_0px_var(--color-primary)] overflow-hidden group cursor-default transition-shadow"
          >
            <div className="h-48 md:h-64 border-b-4 border-black flex items-center justify-center p-8 relative overflow-hidden group-hover:bg-[var(--color-primary)] group-hover:text-black transition-colors duration-300">
               <ChartBar weight="bold" className="text-[6rem] md:text-[8rem] opacity-20 absolute right-4 bottom-4 group-hover:opacity-100 group-hover:-translate-y-4 group-hover:scale-110 transition-all duration-500" />
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
            className="md:col-span-1 bg-[var(--color-primary)] border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] overflow-hidden group cursor-default transition-shadow"
          >
            <div className="h-48 md:h-64 border-b-4 border-black flex items-center justify-center p-8 relative overflow-hidden group-hover:bg-white transition-colors duration-300">
               <Sword weight="bold" className="text-[6rem] md:text-[8rem] text-black opacity-20 absolute left-4 bottom-4 group-hover:opacity-100 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500" />
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
            className="md:col-span-2 bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] overflow-hidden group cursor-default transition-shadow"
          >
            <div className="h-48 md:h-64 bg-[#f4f4f4] border-b-4 border-black flex items-center justify-center p-8 relative overflow-hidden group-hover:bg-black group-hover:text-white transition-colors duration-300">
               <UsersThree weight="bold" className="text-[6rem] md:text-[8rem] text-black group-hover:text-white opacity-10 absolute -right-4 -bottom-4 group-hover:opacity-100 group-hover:-translate-x-4 group-hover:scale-110 transition-all duration-500" />
            </div>
            <div className="p-8 bg-white">
              <h3 className="font-display text-[1.5rem] md:text-[2rem] font-bold uppercase mb-2 leading-none">Roster Architect</h3>
              <p className="font-body text-lg text-gray-700 font-medium">
                Drag and drop players into a simulated roster. Our engine calculates role overlaps, identifies firepower gaps, and maps out tactical synergy based purely on historical agent data.
              </p>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}

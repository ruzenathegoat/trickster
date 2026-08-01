import { motion } from 'framer-motion';
import { TrendUp, Terminal, PlayCircle, Lightning } from '@phosphor-icons/react';

const EMIL_EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    }
  }
};

const nodeVariants = {
  hidden: { clipPath: 'inset(100% 0 0 0)', opacity: 0, y: 20 },
  visible: { 
    clipPath: 'inset(0% 0 0 0)', 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: EMIL_EASE_OUT }
  }
};

export default function DashboardPreviewSection() {
  return (
    <section className="w-full bg-[#f4f1e1] py-24 md:py-32 relative z-10 overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 flex flex-col gap-16">
        
        {/* Header - Editorial Style */}
        <div className="w-full text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-4 border-black pb-8">
          <div>
            <div className="inline-block bg-black text-white px-4 py-1.5 mb-6 font-['JetBrains_Mono'] font-bold text-sm tracking-widest uppercase border-2 border-black">
              LAYER_02 // UTILITY
            </div>
            <h2 className="font-['Archivo_Black'] text-5xl md:text-[5.5rem] lg:text-[7.5rem] font-black uppercase leading-[0.85] tracking-tighter text-black break-words">
              CLEAN.<br/>
              DENSE.<br/>
              <span className="text-[var(--color-primary)] bg-black px-2 inline-block -ml-2">FAST.</span>
            </h2>
          </div>
          
          <div className="max-w-sm text-center md:text-left pb-2">
            <p className="font-['Inter'] text-lg text-black font-bold leading-relaxed">
              No marketing fluff. Just raw telemetry, lightning-fast navigation, and actionable insights wrapped in a high-contrast terminal UI.
            </p>
          </div>
        </div>

        {/* The Command Center Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="w-full grid grid-cols-1 md:grid-cols-12 gap-0 border-4 border-black shadow-[12px_12px_0px_#111111] bg-black"
        >
          {/* Main Terminal Window */}
          <motion.div variants={nodeVariants} className="md:col-span-8 bg-white border-b-4 md:border-b-0 md:border-r-4 border-black p-8 md:p-12 flex flex-col">
            <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
              <h3 className="font-['Archivo_Black'] text-3xl uppercase tracking-tighter text-black">Live Telemetry</h3>
              <div className="flex items-center gap-2 font-['JetBrains_Mono'] font-bold text-xs bg-black text-[var(--color-primary)] px-3 py-1">
                <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse"></span>
                SYSTEM_NOMINAL
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 flex-1">
              {/* Telemetry Node A */}
              <div className="group cursor-default">
                <div className="font-['JetBrains_Mono'] text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <PlayCircle size={16} /> Tracked Entities
                </div>
                <div className="font-['Archivo_Black'] text-6xl text-black tracking-tighter transition-transform duration-150 group-hover:-translate-y-1">
                  12,402
                </div>
                <div className="font-['JetBrains_Mono'] text-sm text-[var(--color-success)] font-bold mt-2 flex items-center gap-1">
                  <TrendUp weight="bold" /> +342 delta (7d)
                </div>
              </div>

              {/* Telemetry Node B */}
              <div className="group cursor-default">
                <div className="font-['JetBrains_Mono'] text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Lightning size={16} /> API Latency
                </div>
                <div className="font-['Archivo_Black'] text-6xl text-black tracking-tighter transition-transform duration-150 group-hover:-translate-y-1">
                  18<span className="text-3xl text-gray-400">ms</span>
                </div>
                <div className="font-['JetBrains_Mono'] text-sm text-black font-bold mt-2">
                  P99 24ms // Global Edge
                </div>
              </div>
            </div>

            {/* Simulated Terminal Log */}
            <div className="mt-12 bg-[#111111] p-6 text-left relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-primary)] scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></div>
              <div className="font-['JetBrains_Mono'] text-xs text-gray-400 mb-2 flex items-center gap-2">
                <Terminal size={16} className="text-[var(--color-primary)]" /> stdout // recent_activity.log
              </div>
              <ul className="font-['JetBrains_Mono'] text-[11px] sm:text-xs text-gray-300 space-y-1">
                <li><span className="text-gray-600">[14:02:44]</span> <span className="text-[var(--color-primary)]">INFO</span> Syncing tier_1_matches (142 rows)</li>
                <li><span className="text-gray-600">[14:02:45]</span> <span className="text-[var(--color-primary)]">INFO</span> Updating player indices... OK</li>
                <li><span className="text-gray-600">[14:02:47]</span> <span className="text-[var(--color-primary)]">INFO</span> Generating smart_fit for user_id=992</li>
                <li><span className="text-gray-600">[14:02:48]</span> <span className="text-[var(--color-success)]">SUCCESS</span> Simulation completed in 1432ms</li>
              </ul>
            </div>
          </motion.div>

          {/* Sidebar / Action Nodes */}
          <motion.div variants={nodeVariants} className="md:col-span-4 bg-[var(--color-primary)] flex flex-col">
            <div className="p-8 md:p-12 flex-1 flex flex-col justify-center border-b-4 border-black">
              <div className="font-['JetBrains_Mono'] text-sm text-black font-bold uppercase tracking-widest mb-4">
                Active Shortlists
              </div>
              <div className="font-['Archivo_Black'] text-[6rem] leading-none text-black tracking-tighter mb-4">
                04
              </div>
              <div className="font-['Inter'] text-sm font-bold text-black bg-white inline-block self-start px-3 py-1 border-2 border-black">
                UPDATED 2H AGO
              </div>
            </div>
            
            <motion.div 
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="bg-black text-white p-8 md:p-12 flex items-center justify-between cursor-pointer hover:bg-white hover:text-black transition-colors duration-200"
            >
              <span className="font-['Archivo_Black'] uppercase text-2xl tracking-tighter">
                Enter App
              </span>
              <PlayCircle weight="bold" size={32} />
            </motion.div>
          </motion.div>

        </motion.div>

      </div>
    </section>
  );
}

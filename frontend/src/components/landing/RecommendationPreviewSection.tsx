import { motion } from 'framer-motion';
import { Target, TrendUp, Crosshair, Users, PlayCircle } from '@phosphor-icons/react';

// Emil-style easing (strong ease-out)
const EMIL_EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

export default function RecommendationPreviewSection() {
  return (
    <section id="leaderboard" className="w-full bg-[var(--color-inverse-surface)] py-24 md:py-32 relative overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 flex flex-col gap-12 md:gap-16">
        
        {/* Header - Editorial Style */}
        <div className="w-full text-left flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-4 border-white pb-8">
          <div>
            <div className="inline-block bg-[var(--color-primary)] text-black px-4 py-1.5 mb-6 font-['JetBrains_Mono'] font-bold text-sm tracking-widest uppercase border-2 border-white">
              SMART METRICS ENGINE
            </div>
            <h2 className="font-['Archivo_Black'] text-5xl md:text-[5.5rem] lg:text-[7.5rem] font-black uppercase leading-[0.85] tracking-tighter text-white break-words">
              DATA<br/>
              DRIVEN<br/>
              <span className="text-[var(--color-primary)]">SCOUTING.</span>
            </h2>
          </div>
          
          <div className="max-w-sm text-left pb-2">
            <p className="font-['Inter'] text-lg text-gray-300 font-medium leading-relaxed">
              We do not rely on subjective opinions. The system analyzes raw telemetry, role efficiency, and historic gap data to output exact statistical fits.
            </p>
          </div>
        </div>

        {/* The Scouting Dossier */}
        <motion.div 
          initial={{ clipPath: 'inset(100% 0 0 0)', opacity: 0, y: 40 }}
          whileInView={{ clipPath: 'inset(0% 0 0 0)', opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: EMIL_EASE_OUT }}
          className="w-full bg-white border-4 border-white shadow-[8px_8px_0px_var(--color-primary)] grid grid-cols-1 lg:grid-cols-12"
        >
          {/* Left Column: Player Identity */}
          <div className="lg:col-span-5 bg-black p-8 md:p-12 border-b-4 lg:border-b-0 lg:border-r-4 border-white flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-16">
                <span className="font-['JetBrains_Mono'] text-[var(--color-primary)] font-bold text-lg tracking-widest border border-[var(--color-primary)] px-3 py-1">
                  TARGET_ACQ
                </span>
                <Crosshair size={32} className="text-white" />
              </div>
              
              <h3 className="font-['Archivo_Black'] text-5xl sm:text-7xl uppercase text-white leading-none tracking-tighter mb-2 break-words">
                f0rsakeN
              </h3>
              <p className="font-['JetBrains_Mono'] text-xl sm:text-2xl text-gray-400 uppercase tracking-tight">
                FLEX / DUELIST
              </p>
            </div>
            
            <div className="mt-16">
              <div className="font-['JetBrains_Mono'] text-sm text-gray-500 mb-2 uppercase tracking-widest">
                Overall Smart Fit
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-['Archivo_Black'] text-6xl sm:text-7xl text-[var(--color-primary)] tracking-tighter">
                  98.4
                </span>
                <span className="font-['JetBrains_Mono'] text-xl text-white font-bold">%</span>
              </div>
            </div>
          </div>

          {/* Right Column: Data Breakdown */}
          <div className="lg:col-span-7 bg-[#111111] flex flex-col">
            <div className="p-8 md:p-12 flex-1">
              <h4 className="font-['Archivo_Black'] text-2xl text-white uppercase tracking-tight mb-8">
                Statistical Breakdown
              </h4>
              
              <div className="flex flex-col gap-8">
                
                {/* Metric 1 */}
                <div className="group flex items-start sm:items-center justify-between border-b-2 border-gray-800 pb-6 transition-colors duration-200 hover:border-white">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <div className="w-12 h-12 shrink-0 bg-white flex items-center justify-center text-black">
                      <Target weight="bold" size={24} />
                    </div>
                    <div>
                      <div className="font-['JetBrains_Mono'] text-white font-bold text-lg uppercase tracking-tight mb-1">
                        Role Efficiency
                      </div>
                      <div className="font-['Inter'] text-sm text-gray-400">
                        Historical impact on Flex agents (KAY/O, Breach)
                      </div>
                    </div>
                  </div>
                  <div className="font-['Archivo_Black'] text-3xl sm:text-4xl text-[var(--color-primary)] mt-4 sm:mt-0">
                    99%
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="group flex items-start sm:items-center justify-between border-b-2 border-gray-800 pb-6 transition-colors duration-200 hover:border-white">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <div className="w-12 h-12 shrink-0 bg-white flex items-center justify-center text-black">
                      <Users weight="bold" size={24} />
                    </div>
                    <div>
                      <div className="font-['JetBrains_Mono'] text-white font-bold text-lg uppercase tracking-tight mb-1">
                        Roster Synergy
                      </div>
                      <div className="font-['Inter'] text-sm text-gray-400">
                        Playstyle overlap mitigation with something / Jinggg
                      </div>
                    </div>
                  </div>
                  <div className="font-['Archivo_Black'] text-3xl sm:text-4xl text-[var(--color-primary)] mt-4 sm:mt-0">
                    96%
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="group flex items-start sm:items-center justify-between border-b-2 border-gray-800 pb-6 transition-colors duration-200 hover:border-white">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <div className="w-12 h-12 shrink-0 bg-white flex items-center justify-center text-black">
                      <TrendUp weight="bold" size={24} />
                    </div>
                    <div>
                      <div className="font-['JetBrains_Mono'] text-white font-bold text-lg uppercase tracking-tight mb-1">
                        Impact Delta
                      </div>
                      <div className="font-['Inter'] text-sm text-gray-400">
                        Projected team performance increase
                      </div>
                    </div>
                  </div>
                  <div className="font-['Archivo_Black'] text-3xl sm:text-4xl text-[var(--color-primary)] mt-4 sm:mt-0">
                    +14%
                  </div>
                </div>

              </div>
            </div>
            
            {/* Action Bar (Emil button scaling trick) */}
            <motion.div 
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="bg-[var(--color-primary)] p-6 md:px-12 flex justify-between items-center border-t-4 border-white cursor-pointer hover:bg-white transition-colors duration-200"
            >
              <span className="font-['JetBrains_Mono'] font-bold text-black text-lg md:text-xl uppercase tracking-widest">
                EXECUTE_TRANSFER_SIMULATION
              </span>
              <PlayCircle weight="bold" size={28} className="text-black" />
            </motion.div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}

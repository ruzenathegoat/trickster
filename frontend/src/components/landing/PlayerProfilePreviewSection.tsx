import { motion } from 'framer-motion';
import { Check } from '@phosphor-icons/react';

export default function PlayerProfilePreviewSection() {
  return (
    <section id="talent" className="w-full bg-[#f4f4f4] py-24 md:py-32 relative z-10 border-b-4 border-black overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(black 2px, transparent 2px)', backgroundSize: '24px 24px' }} />
      
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24">
        
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          {/* Left: The UI Mockup (Dashboard Style) */}
          <div className="flex-[1.2] w-full relative z-10 perspective-1000">
            {/* The Dashboard Layout Mockup */}
            <motion.div 
              whileHover={{ rotateY: 0, rotateX: 0, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="bg-white border-4 border-black p-4 md:p-6 shadow-[16px_16px_0px_rgba(0,0,0,1)] flex gap-4 md:gap-6 transform lg:rotate-y-[5deg] lg:rotate-x-[2deg] cursor-crosshair"
              style={{ transformStyle: 'preserve-3d' }}
            >
              
              {/* Mockup: Identity Poster (Left Col) */}
              <div className="w-[40%] bg-[var(--color-primary)] border-4 border-black flex flex-col relative overflow-hidden shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                {/* Role Badge */}
                <div className="absolute top-2 -right-4 bg-black text-[var(--color-primary)] text-[10px] md:text-xs font-black px-4 py-1 border-2 border-[var(--color-primary)] rotate-6 z-20 uppercase tracking-widest">
                  FLEX
                </div>
                
                {/* Photo area */}
                <div className="h-32 md:h-48 bg-white border-b-4 border-black relative overflow-hidden flex items-center justify-center">
                  <img 
                    src="https://owcdn.net/img/69735f135cf21.png" 
                    alt="f0rsakeN" 
                    className="absolute inset-0 w-full h-full object-cover object-top filter grayscale contrast-125"
                  />
                  <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 8px)' }} />
                </div>
                
                <div className="p-3 md:p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 md:w-6 md:h-6 bg-white border-2 border-black rounded-full" />
                    <span className="font-label text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-black">
                      Paper Rex
                    </span>
                  </div>

                  <h4 className="font-display text-2xl md:text-4xl uppercase font-black leading-none text-black break-words">
                    f0rsakeN
                  </h4>
                  <p className="font-label text-[8px] md:text-[10px] font-bold text-black/60 uppercase mt-1 tracking-widest mb-4">
                    Jason Susanto
                  </p>
                  
                  {/* Stats */}
                  <div className="space-y-2 mt-auto">
                    <div className="flex justify-between items-end border-b-2 border-black/20 pb-1">
                      <span className="text-[8px] md:text-[10px] font-black uppercase text-black/50">SMART Rank</span>
                      <span className="font-display text-sm md:text-xl text-black leading-none">#1</span>
                    </div>
                    <div className="flex justify-between items-end border-b-2 border-black/20 pb-1">
                      <span className="text-[8px] md:text-[10px] font-black uppercase text-black/50">Win Rate</span>
                      <span className="font-numeric text-sm md:text-base font-black text-black">68%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mockup: Stats & Radar (Right Col) */}
              <div className="w-[60%] flex flex-col gap-4 md:gap-6">
                
                {/* Perf Metrics */}
                <div>
                  <h5 className="font-display text-xs md:text-sm uppercase border-b-4 border-black pb-1 mb-3">Metrics</h5>
                  <div className="grid grid-cols-2 gap-2 md:gap-4">
                    <div className="border-l-4 border-black pl-2 md:pl-3">
                      <div className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase">Rating</div>
                      <div className="font-display text-xl md:text-3xl text-black leading-none mt-1">1.18</div>
                    </div>
                    <div className="border-l-4 border-black pl-2 md:pl-3">
                      <div className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase">ACS</div>
                      <div className="font-display text-xl md:text-3xl text-black leading-none mt-1">245</div>
                    </div>
                    <div className="border-l-4 border-black pl-2 md:pl-3">
                      <div className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase">K/D Ratio</div>
                      <div className="font-display text-xl md:text-3xl text-black leading-none mt-1">1.24</div>
                    </div>
                    <div className="border-l-4 border-black pl-2 md:pl-3">
                      <div className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase">ADR</div>
                      <div className="font-display text-xl md:text-3xl text-black leading-none mt-1">162</div>
                    </div>
                  </div>
                </div>
                
                {/* Radar Container */}
                <div className="flex-1 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.02)_10px,rgba(0,0,0,0.02)_20px)] border-4 border-black p-4 relative flex items-center justify-center min-h-[120px]">
                  {/* SVG Radar */}
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border border-black relative">
                    <div className="absolute inset-0 border border-black rounded-full scale-50" />
                    <div className="absolute inset-0 border border-black rounded-full scale-[0.75]" />
                    <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 z-10 fill-[var(--color-primary)] opacity-80 mix-blend-multiply">
                      <polygon points="50,15 85,30 70,70 50,85 15,60 25,30" stroke="black" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
                
                {/* Agent Pool */}
                <div className="flex gap-2 md:gap-3">
                  <div className="flex-1 border-2 border-black bg-white p-1 md:p-2 flex items-center gap-2 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-[var(--color-primary)] border-2 border-black rounded-full flex shrink-0 overflow-hidden items-center justify-center">
                      <img src="https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5c89/displayicon.png" alt="Yoru" className="w-[120%] h-[120%] object-cover object-top scale-110 filter grayscale" />
                    </div>
                    <div>
                      <div className="font-display text-[8px] md:text-xs uppercase leading-none">YORU</div>
                      <div className="font-numeric text-[8px] md:text-xs font-black text-gray-600">45%</div>
                    </div>
                  </div>
                  <div className="flex-1 border-2 border-black bg-black text-white p-1 md:p-2 flex items-center gap-2 shadow-[2px_2px_0px_var(--color-primary)]">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-white border-2 border-[var(--color-primary)] rounded-full flex shrink-0 overflow-hidden items-center justify-center">
                      <img src="https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d751/displayicon.png" alt="Neon" className="w-[120%] h-[120%] object-cover object-top scale-110 filter grayscale" />
                    </div>
                    <div>
                      <div className="font-display text-[8px] md:text-xs uppercase leading-none text-[var(--color-primary)]">NEON</div>
                      <div className="font-numeric text-[8px] md:text-xs font-black text-gray-400">30%</div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>

          {/* Right: Copy */}
          <div className="flex-[0.8] text-center lg:text-left z-10 mt-12 lg:mt-0">
            <h2 className="font-display text-5xl md:text-[5rem] lg:text-[6.5rem] font-black uppercase leading-[0.85] tracking-tighter text-black break-words">
              PROFILES THAT<br />
              <span className="text-transparent" style={{ WebkitTextStroke: '2px black' }}>READ LIKE A DOSSIER.</span>
            </h2>
            <div className="w-16 h-2 bg-[var(--color-primary)] border-2 border-black mb-6 mx-auto lg:mx-0" />
            <p className="font-body text-lg text-gray-700 leading-relaxed font-medium">
              Data shouldn't be a boring spreadsheet. We display player metrics with the aesthetic of a tactical scouting report. Highly dense, incredibly fast, and visually undeniable.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <div className="bg-white border-2 border-black px-4 py-2 flex items-center gap-3 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <Check weight="bold" className="text-xl text-[var(--color-primary)]" /> 
                <span className="font-label text-sm font-bold uppercase tracking-widest text-black">Identity Posters</span>
              </div>
              <div className="bg-white border-2 border-black px-4 py-2 flex items-center gap-3 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <Check weight="bold" className="text-xl text-[var(--color-primary)]" /> 
                <span className="font-label text-sm font-bold uppercase tracking-widest text-black">SMART Radars</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

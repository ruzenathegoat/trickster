import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowRight, PlayCircle, TrendUp, Target, CheckCircle, Cpu, DiceSix } from '@phosphor-icons/react';

export default function HeroSection() {
  const sealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sealRef.current) {
      gsap.to(sealRef.current, {
        rotation: 360,
        duration: 30,
        ease: "none",
        repeat: -1,
      });
    }
  }, []);

  return (
    <main className="pt-[var(--spacing-topbar-height)] md:pt-32 pb-24 px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)] max-w-[var(--spacing-max-width)] mx-auto relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-primary-container)] opacity-20 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--color-warning)] opacity-10 rounded-full blur-[80px] -z-10" />

      {/* Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[var(--spacing-gutter)] items-center min-h-[716px]">

        {/* Left Content */}
        <div className="lg:col-span-6 z-10 space-y-8 relative">
          <h1 className="font-['Archivo_Black'] text-[2.25rem] md:text-[3rem] font-black uppercase leading-none tracking-tighter text-[var(--color-on-background)] drop-shadow-[2px_2px_0px_#F59E0B]">
            VALORANT TALENT<br />
            <span className="bg-[var(--color-primary-container)] px-2 border-2 border-[var(--color-on-background)] inline-block mt-2 -rotate-1">DECISION SUPPORT.</span>
          </h1>
          <p className="font-['Inter'] text-[1.125rem] font-medium text-[var(--color-secondary)] max-w-xl border-l-4 border-[var(--color-primary)] pl-4 leading-relaxed">
            Stop guessing. Start scouting with data. Trickster combines automated VLR.gg data with multi-criteria SMART scoring to help coaches build winning rosters.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <a href="#scout" className="bg-[var(--color-primary)] text-[var(--color-on-background)] font-['JetBrains_Mono'] text-xs font-bold uppercase px-8 py-4 border-2 border-[var(--color-on-background)] rounded-full brutal-shadow brutal-hover transition-all interactive-scale flex items-center gap-2 group">
              START EVALUATING
              <ArrowRight weight="bold" size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#demo" className="bg-[var(--color-surface)] text-[var(--color-on-background)] font-['JetBrains_Mono'] text-xs font-bold uppercase px-8 py-4 border-2 border-[var(--color-on-background)] rounded-full brutal-shadow-sm brutal-hover transition-all interactive-scale flex items-center gap-2">
              <PlayCircle weight="bold" size={18} />
              WATCH DEMO
            </a>
          </div>

          {/* Trust Badges */}
          <div className="pt-8 flex items-center gap-4 text-sm font-['JetBrains_Mono'] font-bold text-[var(--color-secondary)]">
            <span className="flex items-center gap-1">
              <CheckCircle weight="fill" className="text-[var(--color-success)]" size={20} />
              VCT Data Included
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle weight="fill" className="text-[var(--color-success)]" size={20} />
              Live API Sync
            </span>
          </div>
        </div>

        {/* Right Visuals (Bento / Overlapping) */}
        <div className="lg:col-span-6 relative mt-16 lg:mt-0 h-[600px] flex items-center justify-center">

          {/* GSAP Animated Seal Badge */}
          <div className="absolute z-30 -top-12 -right-4 md:-right-12 w-36 h-36 md:w-40 md:h-40 drop-shadow-xl">
            <div ref={sealRef} className="w-full h-full bg-[var(--color-inverse-surface)] rounded-full border-2 border-[var(--color-on-background)] flex items-center justify-center relative">
              <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full text-[var(--color-inverse-on-surface)]">
                <defs>
                  <path id="circlePath" d="M 100, 100 m -75, 0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0" />
                </defs>
                <text className="font-['JetBrains_Mono'] text-[12px] font-bold tracking-[0.1em] uppercase" fill="currentColor">
                  <textPath href="#circlePath" startOffset="0%">
                    ★ START EVALUATING ★ START EVALUATING
                  </textPath>
                </text>
              </svg>
              <div className="text-[var(--color-primary)] font-['Archivo_Black'] text-xl font-black uppercase text-center leading-none z-10">
                START<br />GENERATE
              </div>
            </div>
          </div>

          {/* Main Graphic Card with Decoration Strip */}
          <div className="absolute w-[90%] md:w-[80%] h-[400px] bg-[var(--color-surface)] border-2 border-[var(--color-on-background)] cut-corner-lg brutal-shadow z-10 flex overflow-hidden group">
            {/* Decoration Strip */}
            <div className="w-12 h-full bg-[var(--color-primary)] border-r-2 border-[var(--color-on-background)] flex flex-col items-center py-4 justify-between shrink-0">
              <span className="text-[var(--color-on-background)] font-black text-lg">★</span>
              <div className="w-[2px] h-full bg-[var(--color-on-background)] mx-auto opacity-30 my-2"></div>
              <ArrowRight weight="bold" className="text-[var(--color-on-background)] rotate-90" size={20} />
            </div>
            {/* Image Area */}
            <div className="flex-1 relative overflow-hidden">
              <div className="absolute inset-0 noise-bg z-10 pointer-events-none opacity-20" />
              <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')" }}>
              </div>
              {/* Inner Overlay Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20">
                <h3 className="font-['Archivo_Black'] text-[1.5rem] font-black text-[var(--color-surface)] uppercase">TenZ_Analysis</h3>
                <p className="font-['JetBrains_Mono'] text-xs font-bold text-[var(--color-primary-container)]">Duelist / Flex</p>
              </div>
            </div>
          </div>

          {/* Floating Data Card 1 */}
          <div className="absolute z-20 top-20 -left-4 md:-left-12 bg-[var(--color-surface)] border-2 border-[var(--color-on-background)] p-4 rounded-lg brutal-shadow-sm w-48 rotate-[-5deg] md:hover:rotate-0 transition-transform">
            <div className="flex justify-between items-center mb-2">
              <span className="font-['JetBrains_Mono'] text-xs font-bold text-[var(--color-secondary)] uppercase">SMART Score</span>
              <TrendUp weight="bold" className="text-[var(--color-primary)]" size={16} />
            </div>
            <div className="font-['JetBrains_Mono'] text-3xl font-bold text-[var(--color-on-background)]">94.2</div>
            <div className="w-full bg-[var(--color-surface-variant)] h-2 mt-2 rounded-full overflow-hidden">
              <div className="bg-[var(--color-primary)] h-full w-[94%]" />
            </div>
          </div>

          {/* Floating Data Card 2 */}
          <div className="absolute z-20 bottom-24 -right-4 md:-right-8 bg-[var(--color-primary-container)] border-2 border-[var(--color-on-background)] p-4 rounded-lg brutal-shadow-sm w-40 rotate-[3deg] md:hover:rotate-0 transition-transform">
            <div className="flex items-center gap-2 mb-2">
              <Target weight="bold" size={16} />
              <span className="font-['JetBrains_Mono'] text-xs font-bold uppercase">Role Match</span>
            </div>
            <div className="font-['Archivo_Black'] text-[1.5rem] font-black text-[var(--color-on-background)] leading-tight uppercase">Initiator</div>
            <div className="text-xs font-['JetBrains_Mono'] font-bold mt-1 opacity-80">98% Synergy</div>
          </div>

          {/* Decorative Grid Lines */}
          <svg className="absolute inset-0 w-full h-full z-0 opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--color-on-background)]" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Bottom Right Info Box (Fixed, but we will place it absolutely within main or just fixed globally) */}
      <div className="fixed bottom-6 right-6 z-40 hidden md:block">
        <div className="bg-[var(--color-inverse-surface)] text-[var(--color-inverse-on-surface)] border-2 border-[var(--color-on-background)] p-4 rounded-lg brutal-shadow-sm w-64">
          <div className="flex items-start gap-3">
            <Cpu weight="fill" className="text-[var(--color-primary-container)]" size={24} />
            <div>
              <h4 className="font-['JetBrains_Mono'] text-[10px] font-bold uppercase mb-1 text-[var(--color-primary-container)] tracking-wider">Powered By</h4>
              <p className="font-['Inter'] text-sm font-medium">SMART Algorithm v2.4</p>
              <p className="font-['JetBrains_Mono'] text-[10px] font-bold text-[var(--color-text-muted)] mt-2">Processing 10k+ matches/day</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

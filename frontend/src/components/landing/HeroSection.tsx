import { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { ArrowRight, Crosshair, TerminalWindow, TrendUp } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

const easeOut: [number, number, number, number] = [0.23, 1, 0.32, 1]; // Strong custom ease-out per Emil's principles

// Staggered animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.6, ease: easeOut }
  }
};

export default function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  
  // Parallax on scroll for the background grid
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  const gridY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  // Mouse tracking spring physics for the Data Terminal
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth, heavy spring (emulating mass and momentum)
  const springConfig = { damping: 25, stiffness: 150, mass: 1 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Map mouse movement to rotation (subtle 3D tilt)
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-10, 10]);
  // Map mouse movement to translation (parallax layers)
  const translateX = useTransform(smoothX, [-0.5, 0.5], [-30, 30]);
  const translateY = useTransform(smoothY, [-0.5, 0.5], [-30, 30]);

  // Handle mouse move to update raw motion values (normalized between -0.5 and 0.5)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <main 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="pt-[120px] md:pt-40 pb-32 px-6 md:px-12 max-w-[var(--spacing-max-width)] mx-auto relative overflow-hidden bg-[var(--color-surface)]"
      style={{ perspective: 1200 }}
    >
      {/* Background Architectural Grid (Parallax) */}
      <motion.div 
        style={{ y: gridY }}
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
      >
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="black" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center min-h-[70vh] relative z-10">

        {/* Left Column: Typography & CTAs */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-6 space-y-8"
        >
          <motion.h1 
            variants={itemVariants}
            className="font-display text-[3.5rem] md:text-[5.5rem] font-black uppercase leading-[0.9] tracking-tighter text-black"
          >
            VALORANT<br/>
            TALENT<br/>
            <span className="text-white bg-black px-4 pt-2 pb-1 inline-block mt-2 border-4 border-black">
              DECISIONS.
            </span>
          </motion.h1>

          <motion.div variants={itemVariants} className="pl-6 border-l-8 border-black">
            <p className="font-label text-sm md:text-base font-bold uppercase tracking-widest text-gray-600 max-w-lg leading-relaxed">
              Stop guessing. Start scouting with data. Trickster combines automated VLR.gg data with multi-criteria SMART scoring to help coaches build winning rosters.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="pt-6">
            {/* Compound Button */}
            <div className="relative group inline-block">
              <Link to="/app/dashboard" className="flex items-stretch hover:-translate-y-1 transition-transform active:scale-[0.97]">
                {/* Label Segment */}
                <div className="bg-[#111111] text-white px-8 md:px-10 py-5 rounded-l-full font-display text-xl md:text-2xl uppercase tracking-tighter shadow-[8px_8px_0px_rgba(0,0,0,0.2)] flex items-center justify-center border-y-4 border-l-4 border-black">
                  START EVALUATING
                </div>
                {/* Icon Segment (Fused) */}
                <div className="bg-[var(--color-primary)] text-black w-16 md:w-20 flex items-center justify-center rounded-r-full border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] group-hover:bg-white transition-colors">
                  <ArrowRight weight="bold" size={28} />
                </div>
              </Link>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column: Interactive Data Terminal */}
        <motion.div 
          className="lg:col-span-6 relative h-[500px] md:h-[600px] flex items-center justify-center w-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <motion.div 
            style={{ 
              rotateX, 
              rotateY,
              x: translateX,
              y: translateY
            }}
            className="relative w-full max-w-lg aspect-square"
          >
            {/* Layer 1: Background Terminal Window */}
            <div className="absolute inset-0 bg-white border-4 border-black shadow-[16px_16px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden flex flex-col">
              {/* Terminal Header */}
              <div className="bg-black text-white px-4 py-3 border-b-4 border-black flex justify-between items-center shrink-0">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-white border-2 border-black" />
                  <div className="w-3 h-3 rounded-full bg-white border-2 border-black" />
                  <div className="w-3 h-3 rounded-full bg-white border-2 border-black" />
                </div>
                <div className="font-numeric text-[10px] font-bold uppercase tracking-widest">
                  TRICKSTER_SMART_V2.4
                </div>
              </div>
              
              {/* Terminal Body (Data Viz Mockup) */}
              <div className="flex-1 p-6 relative overflow-hidden bg-[#FAFAFA]">
                {/* Radar Chart SVG Graphic */}
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-80" style={{ filter: 'drop-shadow(4px 4px 0px rgba(0,0,0,0.1))' }}>
                  {/* Grid Web */}
                  <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="none" stroke="black" strokeWidth="0.5" opacity="0.3"/>
                  <polygon points="50,20 80,35 80,65 50,80 20,65 20,35" fill="none" stroke="black" strokeWidth="0.5" opacity="0.3"/>
                  <polygon points="50,35 65,45 65,55 50,65 35,55 35,45" fill="none" stroke="black" strokeWidth="0.5" opacity="0.3"/>
                  {/* Axes */}
                  <line x1="50" y1="50" x2="50" y2="5" stroke="black" strokeWidth="0.5" opacity="0.3"/>
                  <line x1="50" y1="50" x2="95" y2="25" stroke="black" strokeWidth="0.5" opacity="0.3"/>
                  <line x1="50" y1="50" x2="95" y2="75" stroke="black" strokeWidth="0.5" opacity="0.3"/>
                  <line x1="50" y1="50" x2="50" y2="95" stroke="black" strokeWidth="0.5" opacity="0.3"/>
                  <line x1="50" y1="50" x2="5" y2="75" stroke="black" strokeWidth="0.5" opacity="0.3"/>
                  <line x1="50" y1="50" x2="5" y2="25" stroke="black" strokeWidth="0.5" opacity="0.3"/>
                  {/* Data Shape */}
                  <motion.polygon 
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.5, ease: easeOut }}
                    style={{ transformOrigin: '50% 50%' }}
                    points="50,15 85,30 70,70 50,85 15,60 25,30" 
                    fill="var(--color-primary)" 
                    stroke="black" 
                    strokeWidth="2" 
                  />
                  {/* Highlight Dots */}
                  <circle cx="50" cy="15" r="2" fill="white" stroke="black" strokeWidth="1" />
                  <circle cx="85" cy="30" r="2" fill="white" stroke="black" strokeWidth="1" />
                  <circle cx="70" cy="70" r="2" fill="white" stroke="black" strokeWidth="1" />
                  <circle cx="50" cy="85" r="2" fill="white" stroke="black" strokeWidth="1" />
                  <circle cx="15" cy="60" r="2" fill="white" stroke="black" strokeWidth="1" />
                  <circle cx="25" cy="30" r="2" fill="white" stroke="black" strokeWidth="1" />
                </svg>

                {/* Overlaid Terminal Text */}
                <div className="absolute top-6 left-6 font-numeric text-xs font-bold leading-relaxed">
                  <div className="text-black uppercase">Analyzing: <span className="bg-black text-white px-1">TenZ</span></div>
                  <div className="text-gray-500 mt-2">Roles: DUELIST, FLEX</div>
                  <div className="text-gray-500">Tier: S-TIER</div>
                  <div className="text-gray-500 mt-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-[var(--color-primary)] border border-black inline-block animate-pulse" />
                    SYNCING VCT DATA...
                  </div>
                </div>
              </div>
            </div>

            {/* Layer 2: Floating SMART Score Badge (Counter-Parallax) */}
            <motion.div 
              style={{ x: useTransform(smoothX, [-0.5, 0.5], [20, -20]), y: useTransform(smoothY, [-0.5, 0.5], [20, -20]) }}
              className="absolute -top-6 -right-6 md:-top-10 md:-right-10 bg-white border-4 border-black p-6 w-48 md:w-56 shadow-[8px_8px_0px_rgba(0,0,0,1)] z-20"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-label text-xs font-bold text-gray-500 uppercase tracking-widest">SMART Score</span>
                <TrendUp weight="bold" className="text-black" size={24} />
              </div>
              <div className="font-numeric text-5xl md:text-6xl font-black text-black">
                94<span className="text-3xl text-gray-400">.2</span>
              </div>
              <div className="w-full bg-gray-200 h-3 mt-4 border-2 border-black overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "94%" }}
                  transition={{ duration: 1.5, delay: 1, ease: easeOut }}
                  className="bg-[var(--color-primary)] h-full border-r-2 border-black" 
                />
              </div>
            </motion.div>

            {/* Layer 3: Sticker Badge */}
            <motion.div 
              style={{ x: useTransform(smoothX, [-0.5, 0.5], [40, -40]), y: useTransform(smoothY, [-0.5, 0.5], [40, -40]) }}
              className="absolute -bottom-8 -left-8 w-28 h-28 bg-[var(--color-primary)] rounded-full border-4 border-black flex flex-col items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)] z-30 -rotate-12 cursor-default"
            >
              <Crosshair weight="bold" size={32} className="text-black mb-1" />
              <span className="font-label text-[9px] font-bold uppercase text-center leading-tight tracking-widest text-black">
                MATCH<br/>SYNCED
              </span>
            </motion.div>
          </motion.div>
        </motion.div>

      </div>
    </main>
  );
}

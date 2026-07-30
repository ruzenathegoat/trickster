import { Link } from 'react-router-dom';
import { ArrowRight, Crosshair } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

export default function CTASection() {
  return (
    <section className="w-full bg-white py-32 md:py-48 relative z-10 border-b-4 border-black overflow-hidden flex flex-col items-center">
      
      {/* Background Graphic Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(black 2px, transparent 2px)', backgroundSize: '32px 32px' }} />

      {/* Signature Seal Badge (Rotating) */}
      <div className="absolute top-10 left-10 md:top-20 md:left-32 w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#111111] flex items-center justify-center shadow-[8px_8px_0px_rgba(0,0,0,1)] border-4 border-black z-0 pointer-events-none hidden lg:flex">
        {/* Inner Label */}
        <div className="absolute text-[var(--color-primary)] font-display text-2xl font-bold uppercase z-10">
          GO
        </div>
        {/* Rotating Ring Text SVG */}
        <motion.svg 
          animate={{ rotate: 360 }}
          transition={{ duration: 25, ease: "linear", repeat: Infinity }}
          viewBox="0 0 100 100" 
          className="absolute inset-0 w-full h-full text-white"
        >
          <path id="circlePath" d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" fill="none" />
          <text className="font-label text-[8px] font-bold uppercase tracking-widest fill-current">
            <textPath href="#circlePath" startOffset="0%">
              • START SCOUTING • START SCOUTING • START SCOUTING 
            </textPath>
          </text>
        </motion.svg>
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">
        
        {/* Sticker Badge Overlapping the Title */}
        <div className="relative mb-6">
          <div className="absolute -top-8 -right-12 w-24 h-24 bg-[var(--color-primary)] rounded-full border-4 border-black flex flex-col items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:scale-105 hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all z-20 -rotate-12 cursor-default">
            <Crosshair weight="bold" size={24} className="text-black mb-1" />
            <span className="font-label text-[8px] font-bold uppercase text-center leading-tight">
              AI<br/>ASSISTED
            </span>
          </div>
          
          <h2 className="font-display text-5xl md:text-7xl lg:text-[8rem] uppercase leading-[0.9] tracking-tighter text-black max-w-4xl relative z-10">
            Stop Guessing.<br/>
            Start Scouting.
          </h2>
        </div>
        
        <p className="font-label text-[12px] md:text-sm text-gray-500 font-bold uppercase tracking-widest max-w-2xl mb-16 mt-6 leading-relaxed">
          Join the elite organizations that use Trickster to find talent, validate decisions, and build championship rosters.
        </p>

        {/* Compound Button Variant */}
        <div className="relative group">
          <Link to="/register" className="flex items-stretch hover:-translate-y-1 transition-transform active:scale-[0.97]">
            {/* Label Segment */}
            <div className="bg-[#111111] text-white px-10 py-5 rounded-l-full font-display text-2xl uppercase tracking-tighter shadow-[8px_8px_0px_rgba(0,0,0,0.2)] flex items-center justify-center border-y-4 border-l-4 border-black">
              Create Account
            </div>
            {/* Icon Segment (Fused) */}
            <div className="bg-[var(--color-primary)] text-black w-20 flex items-center justify-center rounded-r-full border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] group-hover:bg-white transition-colors">
              <ArrowRight weight="bold" size={32} />
            </div>
          </Link>
        </div>
        
        <p className="font-numeric text-[10px] text-gray-400 font-bold mt-8 uppercase tracking-widest">
          No credit card required. Free tier available.
        </p>

      </div>
    </section>
  );
}

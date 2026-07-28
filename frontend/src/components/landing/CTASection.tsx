import { Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';

export default function CTASection() {
  return (
    <section className="w-full bg-[var(--color-primary)] py-32 md:py-48 relative z-10 border-b-2 border-[var(--color-on-background)] overflow-hidden">
      
      {/* Background Graphic */}
      <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none overflow-hidden">
        <h2 className="font-['Archivo_Black'] text-[20rem] font-black text-black leading-none text-center whitespace-nowrap rotate-[-5deg] scale-150 mix-blend-overlay">
          SCOUT SCOUT SCOUT
        </h2>
      </div>

      <div className="max-w-[var(--spacing-max-width)] mx-auto px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)] relative z-10 text-center flex flex-col items-center">
        
        <h2 className="font-['Archivo_Black'] text-[4rem] md:text-[6rem] lg:text-[8rem] font-black uppercase leading-[0.9] tracking-tighter text-black mb-8 max-w-4xl">
          STOP GUESSING.<br/>
          START SCOUTING.
        </h2>
        
        <p className="font-['Inter'] text-[1.25rem] text-black font-semibold max-w-xl mb-12">
          Join the elite organizations that use Trickster to find talent, validate decisions, and build championship rosters.
        </p>

        <Link 
          to="/register" 
          className="inline-flex items-center gap-3 bg-black text-white font-['JetBrains_Mono'] font-bold text-[1.25rem] uppercase px-12 py-6 border-4 border-black brutal-shadow brutal-hover cut-corner-lg transition-transform active:scale-[0.97]"
        >
          Create Account
          <ArrowRight weight="bold" className="text-[1.5rem]" />
        </Link>
        
        <p className="font-['JetBrains_Mono'] text-[0.875rem] text-black font-bold mt-6 uppercase tracking-widest opacity-70">
          No credit card required.
        </p>

      </div>
    </section>
  );
}

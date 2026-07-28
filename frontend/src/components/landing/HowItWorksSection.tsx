import { SlidersHorizontal, Cpu, Flask } from '@phosphor-icons/react';
import React from 'react';

export default function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Define Needs",
      desc: "Set your filters. Looking for a high KAST smoker in EMEA Tier 2? Need a flexible Duelist? Just set the parameters.",
      icon: <SlidersHorizontal weight="bold" className="text-[3rem] text-[var(--color-on-background)]" />
    },
    {
      number: "02",
      title: "AI Analysis",
      desc: "Our engine scans thousands of matches, applies SMART normalizations, and ranks candidates based on pure impact.",
      icon: <Cpu weight="bold" className="text-[3rem] text-[var(--color-on-background)]" />
    },
    {
      number: "03",
      title: "Simulate & Scout",
      desc: "Drag top candidates into your roster. Predict role clashes and synergy before ever making an offer.",
      icon: <Flask weight="bold" className="text-[3rem] text-[var(--color-on-background)]" />
    }
  ];

  return (
    <section id="scout" className="w-full bg-[var(--color-surface)] py-24 relative z-10 border-b-2 border-[var(--color-on-background)] overflow-hidden">
      <div className="absolute inset-0 noise-bg opacity-20 pointer-events-none" />
      
      <div className="max-w-[var(--spacing-max-width)] mx-auto px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)]">
        
        <div className="text-center mb-20 relative z-10">
          <h2 className="font-['Archivo_Black'] text-[3rem] md:text-[4rem] font-black uppercase tracking-tighter text-[var(--color-on-background)] leading-none inline-block relative">
            THE WORKFLOW
            <div className="absolute -bottom-4 left-0 w-full h-2 bg-[var(--color-primary)] z-[-1]" />
          </h2>
        </div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] bg-[var(--color-on-background)] border-dashed border-t-2 border-[var(--color-on-background)] z-0 -translate-y-1/2 opacity-30" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative z-10">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center group">
                
                {/* Node */}
                <div className="w-24 h-24 bg-[var(--color-background)] border-2 border-[var(--color-on-background)] brutal-shadow cut-corner flex items-center justify-center relative mb-8 group-hover:bg-[var(--color-primary)] transition-colors duration-300">
                  <span className="font-['JetBrains_Mono'] text-[1.5rem] font-bold absolute -top-4 -left-4 bg-[var(--color-surface)] border-2 border-[var(--color-on-background)] px-2 py-1 z-10 group-hover:-translate-y-1 group-hover:-translate-x-1 transition-transform">
                    {step.number}
                  </span>
                  {step.icon}
                </div>

                {/* Content */}
                <div className="bg-[var(--color-surface)] border-2 border-[var(--color-on-background)] p-6 brutal-shadow-sm w-full relative">
                  <h3 className="font-['Archivo_Black'] text-[1.5rem] font-bold uppercase mb-3">
                    {step.title}
                  </h3>
                  <p className="font-['Inter'] text-[1rem] text-[var(--color-secondary)] leading-relaxed">
                    {step.desc}
                  </p>
                </div>

              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

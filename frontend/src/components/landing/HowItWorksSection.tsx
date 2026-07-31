import React from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Cpu, Flask } from '@phosphor-icons/react';

const easeOut = [0.23, 1, 0.32, 1] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 }
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

export default function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Define Needs",
      desc: "Set your filters. Looking for a high KAST smoker in EMEA Tier 2? Need a flexible Duelist? Just set the parameters.",
      icon: <SlidersHorizontal weight="bold" className="text-[3rem] text-black group-hover:text-white transition-colors duration-300" />
    },
    {
      number: "02",
      title: "Data Engine",
      desc: "Our engine scans thousands of matches, applies SMART normalizations, and ranks candidates based on pure statistical impact.",
      icon: <Cpu weight="bold" className="text-[3rem] text-black group-hover:text-[var(--color-primary)] transition-colors duration-300" />
    },
    {
      number: "03",
      title: "Simulate & Scout",
      desc: "Drag top candidates into your roster. Predict role clashes and synergy before ever making an offer.",
      icon: <Flask weight="bold" className="text-[3rem] text-black group-hover:text-white transition-colors duration-300" />
    }
  ];

  return (
    <section id="scout" className="w-full bg-[#f4f4f4] py-24 md:py-32 relative z-10 border-b-4 border-black overflow-hidden">
      {/* Brutalist Grid Background */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(black 2px, transparent 2px)', backgroundSize: '24px 24px' }} />
      
      <div className="max-w-[var(--spacing-max-width)] mx-auto px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)]">
        
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="text-center mb-20 md:mb-32 relative z-10 flex flex-col items-center"
        >
          <motion.div variants={itemVariants} className="relative inline-block">
            <h2 className="font-display text-[3.5rem] md:text-[5rem] font-black uppercase tracking-tighter text-black leading-none relative z-10 px-4">
              THE WORKFLOW
            </h2>
            <div className="absolute bottom-2 left-0 w-full h-4 bg-[var(--color-primary)] z-0 border-y-4 border-black translate-y-1" />
          </motion.div>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="relative"
        >
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-[48px] left-0 w-full h-0 border-t-4 border-dashed border-black z-0" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div 
                key={index} 
                variants={itemVariants}
                className="flex flex-col items-center text-center group cursor-default"
              >
                
                {/* Node */}
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: index % 2 === 0 ? 5 : -5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`w-24 h-24 border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] flex items-center justify-center relative mb-8 transition-colors duration-300 z-10 ${
                    index === 1 ? 'bg-black hover:bg-black group-hover:shadow-[6px_6px_0px_var(--color-primary)]' : 'bg-white hover:bg-black'
                  }`}
                >
                  {/* Badge */}
                  <div className="font-display text-[1.25rem] font-black absolute -top-4 -left-4 bg-[var(--color-primary)] border-4 border-black px-2 py-1 shadow-[4px_4px_0px_rgba(0,0,0,1)] group-hover:-translate-y-2 group-hover:-translate-x-2 transition-transform duration-300">
                    {step.number}
                  </div>
                  
                  {/* Override icon color for middle step */}
                  {index === 1 ? 
                    <Cpu weight="bold" className="text-[3rem] text-white group-hover:text-[var(--color-primary)] transition-colors duration-300" /> : 
                    step.icon}
                </motion.div>

                {/* Content */}
                <motion.div 
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_var(--color-primary)] w-full relative transition-all duration-300"
                >
                  <h3 className="font-display text-[1.5rem] md:text-[2rem] font-black uppercase mb-4 leading-tight">
                    {step.title}
                  </h3>
                  <p className="font-body text-lg text-gray-700 leading-relaxed font-medium">
                    {step.desc}
                  </p>
                </motion.div>

              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

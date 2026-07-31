import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Target, Brain, Export, Plus, Minus } from '@phosphor-icons/react';

const easeOut = [0.23, 1, 0.32, 1] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
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

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full bg-[#f4f1e1] py-24 md:py-32 relative z-10 border-b-4 border-black overflow-hidden">
      
      {/* Halftone background */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(black 2px, transparent 2px)', backgroundSize: '24px 24px' }} />
      
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24 relative z-10">
        
        {/* Header */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8"
        >
          <motion.div variants={itemVariants} className="relative inline-block">
            <h2 className="font-display text-[4rem] md:text-[6rem] font-black uppercase tracking-tighter text-black leading-[0.85] relative z-10">
              NO<br/>SECRETS.
            </h2>
            <div className="absolute bottom-2 left-0 w-full h-6 bg-[var(--color-primary)] z-0 border-y-4 border-black translate-y-2" />
          </motion.div>
          
          <motion.div variants={itemVariants} className="max-w-md border-l-8 border-black pl-6">
            <p className="font-body text-xl text-gray-700 font-bold uppercase tracking-wide">
              Skip the generic dropdowns.<br/>
              Here's exactly how our data engine operates.
            </p>
          </motion.div>
        </motion.div>

        {/* Bento Grid Accordion */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-12 gap-8"
        >
          {/* Card 1: Data Freshness (Wide, White) */}
          <motion.div 
            variants={itemVariants}
            className="md:col-span-7 bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_var(--color-primary)] transition-shadow duration-300"
          >
            <button 
              onClick={() => toggleOpen(1)}
              className="w-full text-left p-8 md:p-12 flex justify-between items-start focus:outline-none group"
            >
              <div>
                <div className="w-16 h-16 bg-[#f4f4f4] border-4 border-black flex items-center justify-center mb-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                  <Database weight="bold" className="text-3xl text-black" />
                </div>
                <h3 className="font-display text-3xl md:text-4xl font-black uppercase leading-tight text-black">
                  How fresh is<br/>the data?
                </h3>
              </div>
              <div className={`shrink-0 w-12 h-12 border-4 border-black flex items-center justify-center transition-colors ${openIndex === 1 ? 'bg-[var(--color-primary)] text-black' : 'bg-black text-white group-hover:bg-[var(--color-primary)] group-hover:text-black'}`}>
                {openIndex === 1 ? <Minus weight="bold" className="text-xl" /> : <Plus weight="bold" className="text-xl" />}
              </div>
            </button>
            <AnimatePresence>
              {openIndex === 1 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: easeOut }}
                  className="overflow-hidden"
                >
                  <div className="px-8 md:px-12 pb-8 md:pb-12 pt-4">
                    <div className="border-t-4 border-black pt-6">
                      <p className="font-body text-lg text-gray-700 font-medium leading-relaxed">
                        Our scrapers index major databases multiple times a day. As soon as a tournament match concludes, the data is ingested, normalized, and available in Trickster within minutes. Zero manual delay.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Card 2: Tier 2/3 (Tall, Yellow) */}
          <motion.div 
            variants={itemVariants}
            className="md:col-span-5 bg-[var(--color-primary)] border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] transition-shadow duration-300"
          >
            <button 
              onClick={() => toggleOpen(2)}
              className="w-full text-left p-8 md:p-12 flex justify-between items-start focus:outline-none group"
            >
              <div>
                <div className="w-16 h-16 bg-black border-4 border-black flex items-center justify-center mb-6 shadow-[4px_4px_0px_rgba(255,255,255,1)]">
                  <Target weight="bold" className="text-3xl text-[var(--color-primary)]" />
                </div>
                <h3 className="font-display text-3xl md:text-4xl font-black uppercase leading-tight text-black">
                  Do you track<br/>Tier 2 & 3?
                </h3>
              </div>
              <div className={`shrink-0 w-12 h-12 border-4 border-black flex items-center justify-center transition-colors ${openIndex === 2 ? 'bg-white text-black' : 'bg-black text-white group-hover:bg-white group-hover:text-black'}`}>
                {openIndex === 2 ? <Minus weight="bold" className="text-xl" /> : <Plus weight="bold" className="text-xl" />}
              </div>
            </button>
            <AnimatePresence>
              {openIndex === 2 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: easeOut }}
                  className="overflow-hidden"
                >
                  <div className="px-8 md:px-12 pb-8 md:pb-12 pt-4">
                    <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] mt-2">
                      <p className="font-body text-lg text-black font-bold leading-relaxed">NO.</p>
                      <p className="font-body text-base text-gray-800 font-medium mt-2 leading-relaxed">
                        Trickster strictly focuses on Tier 1 (VCT Americas, EMEA, Pacific, CN) and select high-level Ascension data. We skip lower circuits to ensure our predictive models remain highly calibrated and noise-free.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Card 3: SMART vs ACS (Tall, Black) */}
          <motion.div 
            variants={itemVariants}
            className="md:col-span-5 bg-black border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.3)] hover:shadow-[12px_12px_0px_var(--color-primary)] transition-shadow duration-300"
          >
            <button 
              onClick={() => toggleOpen(3)}
              className="w-full text-left p-8 md:p-12 flex justify-between items-start focus:outline-none group"
            >
              <div>
                <div className="w-16 h-16 bg-white border-4 border-[var(--color-primary)] flex items-center justify-center mb-6 shadow-[4px_4px_0px_var(--color-primary)]">
                  <Brain weight="bold" className="text-3xl text-black" />
                </div>
                <h3 className="font-display text-3xl md:text-4xl font-black uppercase leading-tight text-white">
                  SMART score<br/>vs Raw ACS?
                </h3>
              </div>
              <div className={`shrink-0 w-12 h-12 border-4 border-[var(--color-primary)] flex items-center justify-center transition-colors ${openIndex === 3 ? 'bg-[var(--color-primary)] text-black' : 'bg-transparent text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-black'}`}>
                {openIndex === 3 ? <Minus weight="bold" className="text-xl" /> : <Plus weight="bold" className="text-xl" />}
              </div>
            </button>
            <AnimatePresence>
              {openIndex === 3 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: easeOut }}
                  className="overflow-hidden"
                >
                  <div className="px-8 md:px-12 pb-8 md:pb-12 pt-4">
                    <div className="border-t-4 border-[var(--color-primary)] pt-6">
                      <p className="font-body text-lg text-gray-300 font-medium leading-relaxed">
                        Raw ACS doesn't account for who you're playing against. A 250 ACS against a weak team is inflated. <span className="text-[var(--color-primary)] font-bold">SMART</span> (Specific Meta-Adjusted Rating Toolkit) normalizes scores based on opponent ELO, map win rates, and economic impact.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Card 4: Export (Wide, White with Halftone) */}
          <motion.div 
            variants={itemVariants}
            className="md:col-span-7 bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] relative overflow-hidden transition-shadow duration-300"
          >
            {/* Inner Halftone */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(black 2px, transparent 2px)', backgroundSize: '16px 16px' }} />
            
            <button 
              onClick={() => toggleOpen(4)}
              className="relative z-10 w-full text-left p-8 md:p-12 flex justify-between items-start focus:outline-none group"
            >
              <div>
                <div className="w-16 h-16 bg-[#f4f4f4] border-4 border-black flex items-center justify-center mb-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                  <Export weight="bold" className="text-3xl text-black" />
                </div>
                <h3 className="font-display text-3xl md:text-4xl font-black uppercase leading-tight text-black">
                  Can I export<br/>the data?
                </h3>
              </div>
              <div className={`shrink-0 w-12 h-12 border-4 border-black flex items-center justify-center transition-colors ${openIndex === 4 ? 'bg-black text-white' : 'bg-[#f4f4f4] text-black group-hover:bg-black group-hover:text-white'}`}>
                {openIndex === 4 ? <Minus weight="bold" className="text-xl" /> : <Plus weight="bold" className="text-xl" />}
              </div>
            </button>
            <AnimatePresence>
              {openIndex === 4 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: easeOut }}
                  className="overflow-hidden relative z-10"
                >
                  <div className="px-8 md:px-12 pb-8 md:pb-12 pt-4">
                    <div className="border-l-4 border-[var(--color-primary)] pl-6 py-2">
                      <p className="font-body text-lg text-gray-700 font-medium leading-relaxed">
                        Absolutely. Pro users can export shortlists and team simulations via CSV or access our GraphQL API directly to integrate with internal scouting tools.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </motion.div>

      </div>
    </section>
  );
}

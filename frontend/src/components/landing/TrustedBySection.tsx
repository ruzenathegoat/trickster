import { useRef } from 'react';
import { motion, useAnimationFrame, useMotionValue, useTransform } from 'framer-motion';

export default function TrustedBySection() {
  const partners = [
    { name: "SENTINELS", logo: "https://owcdn.net/img/62875027c8e06.png" },
    { name: "PAPER REX", logo: "https://owcdn.net/img/62bbeba74d5cb.png" },
    { name: "LOUD", logo: "https://owcdn.net/img/62bbec8dc1b9f.png" },
    { name: "FNATIC", logo: "https://owcdn.net/img/605d8f619bf6a.png" },
    { name: "NAVI", logo: "https://owcdn.net/img/62a4109ddbd7f.png" },
    { name: "GEN.G", logo: "https://owcdn.net/img/64102ce2ad8c1.png" },
    { name: "DRX", logo: "https://owcdn.net/img/61d2d3bcbc69f.png" },
    { name: "T1", logo: "https://owcdn.net/img/62fe0b8f6b084.png" }
  ];

  // We duplicate the array to allow for seamless infinite scrolling
  const scrollItems = [...partners, ...partners];

  // Using Framer Motion for a perfectly smooth, hardware-accelerated ticker
  return (
    <section className="w-full bg-white border-y-4 border-black overflow-hidden py-12 relative z-10">
      {/* Brutalist Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(black 2px, transparent 2px)', backgroundSize: '32px 32px' }} />
      
      <div className="max-w-[var(--spacing-max-width)] mx-auto px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)]">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
          
          <div className="shrink-0 text-center md:text-left z-20 bg-white pr-4">
            <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-black border-2 border-black px-4 py-2 brutal-shadow-sm">
              Trusted by<br/>Elite Organizations
            </h3>
          </div>
          
          <div className="flex-1 w-full overflow-hidden relative flex items-center group">
            
            {/* Gradient Masks for fading edges */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
            
            {/* Scrolling Marquee Container */}
            <motion.div 
              animate={{ x: ["0%", "-50%"] }}
              transition={{ ease: "linear", duration: 30, repeat: Infinity }}
              className="flex w-max gap-8 items-center"
            >
              {scrollItems.map((partner, index) => (
                <motion.div 
                  key={`${partner.name}-${index}`}
                  whileHover={{ scale: 1.05, rotate: Math.random() > 0.5 ? 2 : -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex items-center gap-4 px-6 py-3 bg-[#111111] border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:bg-white hover:text-black hover:border-black cursor-default transition-colors shrink-0 group/card"
                >
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1 border-2 border-black overflow-hidden shrink-0">
                    <img 
                      src={partner.logo} 
                      alt={`${partner.name} logo`}
                      className="w-full h-full object-contain filter grayscale group-hover/card:grayscale-0 transition-all duration-300"
                      onError={(e) => {
                        // Fallback to text if logo fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = `<span class="font-display text-[10px] text-black">${partner.name.substring(0, 2)}</span>`;
                      }}
                    />
                  </div>
                  <span className="font-display text-xl uppercase text-white group-hover/card:text-black transition-colors whitespace-nowrap mt-1">
                    {partner.name}
                  </span>
                </motion.div>
              ))}
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}

export default function TrustedBySection() {
  const partners = [
    "SENTINELS", "PRX", "LOUD", "FNATIC", "NAVI", "GEN.G", "DRX", "T1"
  ];

  return (
    <section className="w-full bg-[var(--color-background)] border-b-2 border-[var(--color-on-background)] overflow-hidden py-12 relative z-10">
      <div className="absolute inset-0 noise-bg opacity-30 pointer-events-none" />
      
      <div className="max-w-[var(--spacing-max-width)] mx-auto px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)]">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
          <div className="shrink-0 text-center md:text-left z-10">
            <h3 className="font-['JetBrains_Mono'] text-[0.75rem] font-bold uppercase tracking-widest text-[var(--color-secondary)]">
              Trusted by<br/>Elite Organizations
            </h3>
          </div>
          
          <div className="flex-1 w-full overflow-hidden relative flex items-center">
            {/* Gradient Mask for fading edges */}
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[var(--color-background)] to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--color-background)] to-transparent z-10" />
            
            {/* Scrolling Marquee Container */}
            <div className="flex w-max animate-marquee gap-8">
              {/* Double the list to create a seamless infinite scroll loop */}
              {[...partners, ...partners, ...partners].map((partner, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-center px-6 py-3 bg-[var(--color-surface)] border-2 border-[var(--color-on-background)] brutal-shadow-sm brutal-hover transition-transform shrink-0"
                >
                  <span className="font-['Archivo_Narrow'] text-[1.25rem] font-black uppercase text-[var(--color-on-background)]">
                    {partner}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';

export default function FAQSection() {
  const faqs = [
    {
      question: "How fresh is the data?",
      answer: "Our scrapers index major databases (like VLR) multiple times a day. As soon as a tournament match concludes, the data is ingested, normalized, and available in Trickster within minutes."
    },
    {
      question: "Do you track Tier 2 and Tier 3 players?",
      answer: "Yes. Trickster is built for uncovering hidden talent. We track Challengers, Ascension, and various regional Tier 2/3 circuits, allowing you to find the next superstar before they hit Tier 1."
    },
    {
      question: "What makes the SMART score different from raw ACS?",
      answer: "Raw ACS doesn't account for who you're playing against. A 250 ACS against a Tier 3 team is inflated. SMART (Specific Meta-Adjusted Rating Toolkit) normalizes scores based on opponent ELO, map win rates, and economic impact."
    },
    {
      question: "Can I export data for my own spreadsheets?",
      answer: "Absolutely. Pro users can export shortlists and team simulations via CSV or access our GraphQL API directly."
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="w-full bg-[var(--color-surface)] py-24 md:py-32 relative z-10 border-b-2 border-[var(--color-on-background)] overflow-hidden">
      <div className="absolute inset-0 noise-bg opacity-30 pointer-events-none" />
      
      <div className="max-w-[var(--spacing-max-width)] mx-auto px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)]">
        
        <div className="flex flex-col md:flex-row gap-16 md:gap-24 items-start">
          
          {/* Left: Heading */}
          <div className="flex-1 md:sticky top-32">
            <h2 className="font-['Archivo_Black'] text-[3rem] md:text-[5rem] font-black uppercase leading-none tracking-tighter text-[var(--color-on-background)]">
              NO <br />
              <span className="text-[var(--color-primary)] stroke-black" style={{ WebkitTextStroke: '2px black' }}>SECRETS.</span>
            </h2>
            <p className="mt-6 font-['Inter'] text-[1.125rem] text-[var(--color-secondary)] max-w-sm font-medium">
              Everything you need to know about how Trickster operates, scales, and delivers data.
            </p>
          </div>

          {/* Right: Accordion */}
          <div className="flex-1 w-full flex flex-col gap-4 relative z-10">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div 
                  key={index} 
                  className={`bg-[var(--color-background)] border-2 border-[var(--color-on-background)] transition-all duration-200 ease-out ${isOpen ? 'brutal-shadow translate-y-[-4px]' : 'hover:bg-[var(--color-surface-variant)]'}`}
                >
                  <button 
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full text-left p-6 flex justify-between items-center outline-none"
                  >
                    <span className="font-['Archivo_Black'] text-[1.25rem] md:text-[1.5rem] font-bold uppercase pr-8">
                      {faq.question}
                    </span>
                    <CaretDown weight="bold" className={`text-2xl transition-transform duration-200 ease-out ${isOpen ? 'rotate-180 text-[var(--color-primary)]' : ''}`} />
                  </button>
                  
                  <div 
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? 'grid-rows-[1fr] border-t-2 border-[var(--color-on-background)]' : 'grid-rows-[0fr]'}`}
                  >
                    <div className="overflow-hidden">
                      <p className="p-6 font-['Inter'] text-[1rem] text-[var(--color-secondary)] leading-relaxed bg-[var(--color-surface)]">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}

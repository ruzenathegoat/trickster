export default function DashboardPreviewSection() {
  return (
    <section className="w-full bg-[var(--color-background)] py-24 md:py-32 relative z-10 border-b-2 border-[var(--color-on-background)] overflow-hidden">
      
      <div className="max-w-[var(--spacing-max-width)] mx-auto px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)] text-center mb-16 relative z-10">
        <h2 className="font-['Archivo_Narrow'] text-[3rem] md:text-[5rem] font-black uppercase tracking-tighter text-[var(--color-on-background)] leading-none mb-4">
          CLEAN. DENSE. FAST.
        </h2>
        <p className="font-['Inter'] text-[1.125rem] text-[var(--color-secondary)] max-w-2xl mx-auto font-medium">
          Layer 2 of Trickster is pure utility. No marketing fluff—just dense data, lightning-fast navigation, and actionable insights wrapped in a minimalist Vercel-inspired UI.
        </p>
      </div>

      <div className="max-w-[var(--spacing-max-width)] mx-auto px-[var(--spacing-margin-mobile)] md:px-8 relative z-10">
        
        {/* The Dashboard Mockup (Browser Window) */}
        <div className="bg-[var(--color-surface)] border-2 border-[var(--color-on-background)] brutal-shadow-sm rounded-t-xl overflow-hidden max-w-6xl mx-auto">
          
          {/* Browser Chrome */}
          <div className="h-10 bg-[var(--color-surface-variant)] border-b-2 border-[var(--color-on-background)] flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-[var(--color-error)] border border-black" />
            <div className="w-3 h-3 rounded-full bg-[var(--color-warning)] border border-black" />
            <div className="w-3 h-3 rounded-full bg-[var(--color-success)] border border-black" />
            <div className="ml-4 flex-1 h-6 bg-white border border-gray-300 rounded mx-4 flex items-center justify-center font-['JetBrains_Mono'] text-[0.65rem] text-gray-500">
              trickster.gg/app/dashboard
            </div>
          </div>

          {/* App Layout Mockup */}
          <div className="flex h-[500px]">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-200 p-6 hidden md:block">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-8 h-8 bg-black cut-corner flex items-center justify-center">
                  <span className="text-[var(--color-primary)] font-black text-lg leading-none">T</span>
                </div>
                <span className="font-['Archivo_Narrow'] font-black uppercase tracking-widest text-lg">Trickster</span>
              </div>
              
              <nav className="space-y-4">
                <div className="font-['Inter'] text-sm font-semibold text-black flex items-center gap-3 bg-gray-100 p-2 rounded">
                  <span className="material-symbols-outlined text-[1.2rem]">dashboard</span> Overview
                </div>
                <div className="font-['Inter'] text-sm font-medium text-gray-500 flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                  <span className="material-symbols-outlined text-[1.2rem]">group</span> Scouting
                </div>
                <div className="font-['Inter'] text-sm font-medium text-gray-500 flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                  <span className="material-symbols-outlined text-[1.2rem]">science</span> Simulations
                </div>
              </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-6 md:p-10 bg-[#fafafa] overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-['Inter'] text-2xl font-bold text-black tracking-tight">Overview</h3>
                <button className="bg-black text-white px-4 py-2 text-sm font-semibold rounded hover:bg-gray-800 transition-colors">
                  New Simulation
                </button>
              </div>

              {/* Grid Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Metric Widget */}
                <div className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm">
                  <p className="font-['Inter'] text-xs font-semibold text-gray-500 mb-2 uppercase">Tracked Players</p>
                  <p className="font-['JetBrains_Mono'] text-3xl font-bold text-black">12,402</p>
                  <p className="font-['Inter'] text-xs text-green-600 mt-2 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span> +342 this week
                  </p>
                </div>

                {/* Metric Widget */}
                <div className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm">
                  <p className="font-['Inter'] text-xs font-semibold text-gray-500 mb-2 uppercase">Active Shortlists</p>
                  <p className="font-['JetBrains_Mono'] text-3xl font-bold text-black">4</p>
                  <p className="font-['Inter'] text-xs text-gray-500 mt-2 font-medium">Updated 2h ago</p>
                </div>

                {/* Metric Widget */}
                <div className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm">
                  <p className="font-['Inter'] text-xs font-semibold text-gray-500 mb-2 uppercase">API Status</p>
                  <p className="font-['Inter'] text-xl font-bold text-black flex items-center gap-2 mt-1">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span> Healthy
                  </p>
                  <p className="font-['JetBrains_Mono'] text-xs text-gray-500 mt-3 font-medium">99.9% Uptime</p>
                </div>

              </div>

              {/* Chart Placeholder */}
              <div className="mt-6 bg-white border border-gray-200 rounded-lg shadow-sm p-5 h-48 relative overflow-hidden">
                <p className="font-['Inter'] text-sm font-semibold text-gray-800 mb-4">Meta Trends (Tier 1)</p>
                {/* Fake Chart Lines */}
                <svg className="w-full h-24 stroke-blue-500 fill-none" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <path d="M0,35 Q10,20 20,25 T40,15 T60,20 T80,5 T100,10" strokeWidth="2" />
                </svg>
                <div className="absolute bottom-5 left-5 right-5 flex justify-between text-[10px] font-['JetBrains_Mono'] text-gray-400">
                  <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

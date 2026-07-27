import { useState } from 'react';
import { ArrowUpRight, TrendingUp, Activity, User, Crosshair } from 'lucide-react';

export default function Dashboard() {
  const [loading] = useState(false);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-['Archivo_Black'] uppercase tracking-tight mb-1">Dashboard</h1>
        <p className="text-gray-500 text-[14px]">Overview of current meta shifts and your top recommendations.</p>
      </div>

      {/* Level 1: Hero KPI */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Top Match (Duelist)</p>
          <div className="flex items-end gap-4">
            <h2 className="text-4xl font-['Archivo_Black'] uppercase tracking-tight">Derke</h2>
            <div className="bg-[var(--color-primary)] px-3 py-1 rounded-full border border-black mb-1">
              <span className="font-['JetBrains_Mono'] font-bold text-sm tabular-nums">94.5 SMART</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 font-medium">Based on your "Aggressive Entry" weight profile.</p>
        </div>
        <div className="hidden md:block">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
            <User size={40} className="text-gray-400" />
          </div>
        </div>
      </div>

      {/* Level 2: Charts (Placeholders for now) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-semibold text-[15px]">Meta Shift (Patch 9.08)</h3>
              <p className="text-[12px] text-gray-500">Highest pick rate increases</p>
            </div>
            <TrendingUp size={18} className="text-gray-400" />
          </div>
          <div className="h-48 flex items-end gap-4 px-2">
            {/* Fake chart bars */}
            <div className="w-1/4 bg-gray-100 rounded-t-sm h-[40%] hover:bg-gray-200 transition-colors relative group">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-['JetBrains_Mono'] opacity-0 group-hover:opacity-100 transition-opacity">+4%</div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[12px] font-medium text-gray-600">Jett</div>
            </div>
            <div className="w-1/4 bg-[var(--color-primary)] rounded-t-sm border-t border-x border-black h-[85%] relative group">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-['JetBrains_Mono'] font-bold">+12%</div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[12px] font-medium text-black font-bold">Omen</div>
            </div>
            <div className="w-1/4 bg-gray-100 rounded-t-sm h-[60%] hover:bg-gray-200 transition-colors relative group">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-['JetBrains_Mono'] opacity-0 group-hover:opacity-100 transition-opacity">+7%</div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[12px] font-medium text-gray-600">Sova</div>
            </div>
            <div className="w-1/4 bg-gray-100 rounded-t-sm h-[30%] hover:bg-gray-200 transition-colors relative group">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-['JetBrains_Mono'] opacity-0 group-hover:opacity-100 transition-opacity">+2%</div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[12px] font-medium text-gray-600">KAY/O</div>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-gray-100 text-center">
             <button className="text-[13px] font-medium text-gray-600 hover:text-black flex items-center gap-1 mx-auto">
               View Meta Explorer <ArrowUpRight size={14} />
             </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-semibold text-[15px]">Followed Player Consistency</h3>
              <p className="text-[12px] text-gray-500">Last 10 matches performance</p>
            </div>
            <Activity size={18} className="text-gray-400" />
          </div>
          <div className="h-48 flex items-center justify-center">
             <div className="text-center">
                <Crosshair size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No player followed yet.</p>
                <button className="mt-3 text-[13px] bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors font-medium">Search Players</button>
             </div>
          </div>
        </div>
      </div>

      {/* Level 3: Table (Compact Recent matches) */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
           <h3 className="font-semibold text-[15px]">Recent Match Results</h3>
           <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-['JetBrains_Mono']">Live</span>
        </div>
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200">
              <th className="px-4 py-2 font-medium text-gray-500 w-[120px]">Date</th>
              <th className="px-4 py-2 font-medium text-gray-500">Event</th>
              <th className="px-4 py-2 font-medium text-gray-500">Matchup</th>
              <th className="px-4 py-2 font-medium text-gray-500 w-[100px]">Score</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group cursor-pointer">
                <td className="px-4 py-3 text-gray-600 font-['JetBrains_Mono'] text-[12px] tabular-nums">2026-07-27</td>
                <td className="px-4 py-3">Champions Tour 2026: EMEA</td>
                <td className="px-4 py-3 font-medium">FNATIC <span className="text-gray-400 font-normal mx-2">vs</span> NAVI</td>
                <td className="px-4 py-3 font-['JetBrains_Mono'] font-bold tabular-nums">2 - 1</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

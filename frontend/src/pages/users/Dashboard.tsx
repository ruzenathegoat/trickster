import { useState, useEffect } from 'react';
import { ArrowUpRight, Crosshair, User, WarningCircle } from '@phosphor-icons/react';
import axios from '../../lib/axios';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

interface TopAgent {
  name: string;
  rating: string | number;
  height: string;
  shift: string;
}

interface RecentMatch {
  date: string;
  event: string;
  team_a: string;
  team_b: string;
  team_a_logo?: string | null;
  team_b_logo?: string | null;
  team_a_id: string;
  team_b_id: string;
  winner_id: string;
}

interface HeroKpi {
  name: string;
  score: string | number;
  profile_name: string;
  role: string;
  photo_url?: string | null;
}

interface DashboardData {
  hero_kpi: HeroKpi | null;
  meta_shift: {
    patch: string;
    top_agents: TopAgent[];
  };
  recent_matches: RecentMatch[];
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/api/v1/dashboard');
        setData(response.data);
      } catch (err: any) {
        console.error(err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-16 max-w-7xl">
        <div>
          <Skeleton className="h-12 w-80 mb-4 bg-gray-200" />
          <Skeleton className="h-5 w-96 bg-gray-100" />
        </div>
        <Skeleton className="h-[28rem] w-full bg-gray-100 border-2 border-black" />
        <div className="flex flex-col md:flex-row gap-16">
          <Skeleton className="h-64 flex-1 bg-gray-100" />
          <Skeleton className="h-48 w-full md:w-[35%] bg-gray-50" />
        </div>
        <Skeleton className="h-64 w-full bg-gray-100 border-t-2 border-black" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-24 bg-white border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        <WarningCircle weight="bold" size={48} className="mb-6 text-red-500" />
        <p className="font-['JetBrains_Mono'] font-bold text-lg">{error || "No data available."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-16 max-w-7xl pb-24">
      <div>
        <h1 className="text-4xl font-['Archivo_Black'] uppercase tracking-tight mb-2 text-black">Dashboard</h1>
        <p className="text-gray-600 font-['JetBrains_Mono'] font-bold text-[15px]">Overview of current meta shifts and your top recommendations.</p>
      </div>

      {/* Level 1: Hero KPI (Asymmetric, Editorial) */}
      <motion.div 
        initial={{ clipPath: 'inset(100% 0 0 0)' }}
        animate={{ clipPath: 'inset(0% 0 0 0)' }}
        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        className="w-full bg-[var(--color-primary)] border-4 border-black p-8 md:p-16 relative overflow-hidden group shadow-[12px_12px_0px_rgba(0,0,0,1)] hover:shadow-[16px_16px_0px_rgba(0,0,0,1)] transition-shadow duration-300"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-20 translate-x-1/3 -translate-y-1/3 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-12">
          <div className="flex-1">
            <p className="text-black font-['JetBrains_Mono'] font-bold text-[14px] uppercase tracking-widest mb-6 flex items-center gap-3">
              <span className="w-2 h-2 bg-black inline-block" /> Top Match
            </p>
            {data.hero_kpi ? (
              <>
                <h2 className="text-5xl md:text-7xl lg:text-[5.5rem] font-['Archivo_Black'] uppercase tracking-tighter text-black leading-[0.9] max-w-3xl mb-8">
                  {data.hero_kpi.name}
                </h2>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="font-['JetBrains_Mono'] text-4xl font-black text-black tabular-nums">
                    {Number(data.hero_kpi.score).toFixed(1)} <span className="text-lg text-black/60 tracking-widest">SMART</span>
                  </div>
                  <div className="h-10 w-0.5 bg-black/20" />
                  <p className="text-[15px] text-black/80 font-bold font-['JetBrains_Mono'] uppercase tracking-wide">
                    {data.hero_kpi.role} <span className="mx-2 opacity-50">&times;</span> {data.hero_kpi.profile_name}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-black font-['JetBrains_Mono'] font-bold text-2xl max-w-lg leading-snug">
                Run a SMART calculation to reveal your optimal roster addition here.
              </p>
            )}
          </div>
          
          {data.hero_kpi?.photo_url ? (
            <div className="w-56 h-56 md:w-80 md:h-80 shrink-0 relative pointer-events-none">
              <img 
                src={data.hero_kpi.photo_url} 
                alt={data.hero_kpi.name} 
                className="absolute inset-0 w-full h-full object-contain object-bottom drop-shadow-2xl grayscale contrast-[1.1] mix-blend-multiply"
              />
            </div>
          ) : (
            <div className="w-40 h-40 shrink-0 flex items-center justify-center opacity-10">
              <User weight="fill" size={160} />
            </div>
          )}
        </div>
      </motion.div>

      {/* Level 2: Split Section (No Cards) */}
      <div className="flex flex-col md:flex-row gap-20 md:gap-16 pt-4">
        
        {/* Left: Meta Shift (Data Viz) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="flex-1 flex flex-col"
        >
          <div className="flex justify-between items-baseline mb-8 border-b-4 border-black pb-3">
            <h3 className="font-['Archivo_Black'] uppercase text-3xl tracking-tight text-black">Meta Shift</h3>
            <span className="font-['JetBrains_Mono'] font-bold text-[13px] bg-black text-white px-3 py-1 tracking-widest">v{data.meta_shift.patch}</span>
          </div>
          
          {data.meta_shift.top_agents.length > 0 ? (
            <div className="flex items-end h-72 gap-2 mt-auto">
              {data.meta_shift.top_agents.map((agent, index) => (
                <div key={index} className="flex-1 flex flex-col items-center justify-end h-full group">
                  <div className="text-[13px] font-['JetBrains_Mono'] font-bold text-gray-400 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {agent.shift}
                  </div>
                  <motion.div 
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 + index * 0.05, ease: [0.23, 1, 0.32, 1] }}
                    className={`w-full border-2 border-black origin-bottom ${
                      index === 1 ? 'bg-[var(--color-primary)] relative z-10 shadow-[4px_4px_0px_rgba(0,0,0,1)] scale-[1.02]' : 'bg-gray-100 group-hover:bg-gray-200 transition-colors'
                    }`}
                    style={{ height: agent.height }}
                  />
                  <div className={`mt-4 text-[14px] font-['Archivo_Black'] uppercase tracking-wider ${index === 1 ? 'text-black' : 'text-gray-400'}`}>
                    {agent.name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 font-['JetBrains_Mono'] font-bold py-16 text-lg">No patch data available.</p>
          )}
          
          {/* Primary Action Button (The only one on the viewport) */}
          <button className="mt-12 border-2 border-black bg-white hover:bg-black hover:text-[var(--color-primary)] active:scale-95 px-8 py-4 font-black font-['Archivo_Black'] text-[15px] uppercase tracking-widest flex justify-between items-center gap-4 transition-all duration-150 ease-out shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none w-full md:w-auto">
            Explore Full Meta <ArrowUpRight weight="bold" size={20} />
          </button>
        </motion.div>

        {/* Right: Consistency (Horizontal/Textual) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="w-full md:w-[35%] flex flex-col"
        >
          <h3 className="font-['Archivo_Black'] uppercase text-3xl tracking-tight mb-8 border-b-4 border-black pb-3 text-black">Consistency Tracker</h3>
          <div className="flex-1 flex flex-col pt-4">
             <Crosshair weight="bold" size={40} className="text-black mb-6" />
             <p className="font-['Archivo_Black'] text-2xl uppercase text-black mb-4 leading-tight tracking-tight">You are not following any players.</p>
             <p className="font-['JetBrains_Mono'] text-[15px] text-gray-500 mb-12 leading-relaxed">
               Track up to 5 players to monitor their consistency across their last 10 official matches. Real-time form evaluation.
             </p>
             {/* Secondary Ghost Link */}
             <button className="text-black border-b-2 border-black pb-1 font-['Archivo_Black'] uppercase text-[13px] tracking-widest w-fit hover:text-gray-500 hover:border-gray-500 transition-colors duration-200">
               Find Players to Track
             </button>
          </div>
        </motion.div>
      </div>

      {/* Level 3: Recent Matches (Full bleed table without heavy card wrapper) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="pt-12"
      >
        <div className="flex justify-between items-end mb-8 border-b-4 border-black pb-3">
           <h3 className="font-['Archivo_Black'] uppercase text-3xl tracking-tight text-black">Recent Matches</h3>
           <span className="text-[12px] font-bold bg-black text-[var(--color-primary)] px-3 py-1 font-['JetBrains_Mono'] uppercase tracking-widest flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full animate-pulse" />
             Live Sync
           </span>
        </div>
        
        {data.recent_matches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[15px]">
              <thead className="sr-only">
                <tr>
                  <th>Date</th>
                  <th>Event</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_matches.map((match, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                    key={i} 
                    className="border-b-2 border-gray-100 hover:border-black group cursor-pointer transition-colors duration-200"
                  >
                    <td className="py-6 pr-8 font-['JetBrains_Mono'] font-bold text-[14px] tabular-nums text-gray-400 transition-colors group-hover:text-black w-[140px]">
                      {match.date ? new Date(match.date).toISOString().split('T')[0] : 'N/A'}
                    </td>
                    <td className="py-6 px-8 font-bold font-['Inter'] text-black max-w-[250px] truncate">
                      {match.event}
                    </td>
                    <td className="py-6 pl-8 font-['JetBrains_Mono']">
                      <div className="flex items-center gap-6">
                        <span className={`flex items-center gap-3 w-[180px] justify-end ${match.winner_id === match.team_a_id ? "font-black text-black" : "text-gray-400 font-bold"}`}>
                          <span className="truncate">{match.team_a}</span>
                          {match.team_a_logo && (
                             <img src={match.team_a_logo} alt={match.team_a} className="w-6 h-6 object-contain shrink-0" />
                          )}
                        </span>
                        <span className="text-gray-300 font-black text-[11px] uppercase tracking-widest">VS</span>
                        <span className={`flex items-center gap-3 w-[180px] ${match.winner_id === match.team_b_id ? "font-black text-black" : "text-gray-400 font-bold"}`}>
                          {match.team_b_logo && (
                             <img src={match.team_b_logo} alt={match.team_b} className="w-6 h-6 object-contain shrink-0" />
                          )}
                          <span className="truncate">{match.team_b}</span>
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 font-['JetBrains_Mono'] font-bold py-12 text-lg">No recent matches available.</p>
        )}
      </motion.div>

    </div>
  );
}

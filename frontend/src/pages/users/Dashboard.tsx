import { useState, useEffect } from 'react';
import { ArrowUpRight, TrendUp, Heartbeat, User, Crosshair, WarningCircle } from '@phosphor-icons/react';
import axios from '../../lib/axios';
import { Skeleton } from '@/components/ui/skeleton';

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
      <div className="space-y-8 max-w-6xl">
        <div>
          <Skeleton className="h-10 w-64 mb-2 bg-gray-200 border-2 border-black" />
          <Skeleton className="h-5 w-96 bg-gray-100" />
        </div>
        <Skeleton className="h-40 w-full bg-gray-100 border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-72 w-full bg-gray-100 border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]" />
          <Skeleton className="h-72 w-full bg-gray-100 border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]" />
        </div>
        <Skeleton className="h-64 w-full bg-gray-100 border-2 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        <WarningCircle weight="bold" size={48} className="mb-4 text-red-500" />
        <p className="font-['JetBrains_Mono'] font-bold">{error || "No data available."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-['Archivo_Black'] uppercase tracking-tight mb-2 text-black">Dashboard</h1>
        <p className="text-gray-600 font-['JetBrains_Mono'] font-bold text-[14px]">Overview of current meta shifts and your top recommendations.</p>
      </div>

      {/* Level 1: Hero KPI */}
      <div className="bg-[var(--color-primary)] border-2 border-black rounded-md p-6 md:p-8 flex items-center justify-between shadow-[8px_8px_0px_rgba(0,0,0,1)] relative overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:shadow-[10px_10px_0px_rgba(0,0,0,1)]">
        <div className="relative z-10 w-full">
          <p className="text-[12px] md:text-[14px] font-bold text-black uppercase tracking-widest mb-3 font-['JetBrains_Mono']">
            Your Top Match {data.hero_kpi ? `(${data.hero_kpi.role})` : ''}
          </p>
          {data.hero_kpi ? (
            <>
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 mb-3">
                <h2 className="text-4xl md:text-5xl font-['Archivo_Black'] uppercase tracking-tight text-black truncate max-w-2xl">
                  {data.hero_kpi.name}
                </h2>
                <div className="bg-black text-[var(--color-primary)] px-4 py-1.5 rounded-sm border-2 border-black shrink-0 inline-flex items-center justify-center">
                  <span className="font-['JetBrains_Mono'] font-black text-lg md:text-xl tabular-nums">
                    {Number(data.hero_kpi.score).toFixed(1)} <span className="text-sm">SMART</span>
                  </span>
                </div>
              </div>
              <p className="text-sm md:text-base text-black/80 font-bold font-['JetBrains_Mono']">
                Based on your "{data.hero_kpi.profile_name}" profile.
              </p>
            </>
          ) : (
            <div className="py-2">
              <p className="text-black font-['JetBrains_Mono'] font-bold">Run a SMART calculation to see your top match here.</p>
            </div>
          )}
        </div>
        
        {/* Right side image/icon */}
        <div className="hidden md:block absolute right-0 bottom-0 top-0 w-1/3 pointer-events-none">
          {data.hero_kpi?.photo_url ? (
            <img 
              src={data.hero_kpi.photo_url} 
              alt={data.hero_kpi.name} 
              className="absolute right-8 bottom-0 h-[120%] object-contain object-bottom drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] grayscale contrast-125 mix-blend-multiply opacity-90"
            />
          ) : (
            <User weight="fill" size={280} className="absolute -right-8 -bottom-16 opacity-10" />
          )}
        </div>
      </div>

      {/* Level 2: Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border-2 border-black rounded-md p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col transition-transform duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] group">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="font-['Archivo_Black'] uppercase text-xl">
                Meta Shift
                <span className="bg-black text-white px-2 py-0.5 text-xs ml-3 font-['JetBrains_Mono'] align-middle rounded-sm">v{data.meta_shift.patch}</span>
              </h3>
              <p className="text-[13px] font-['JetBrains_Mono'] font-bold mt-2 text-gray-500">Highest rated agents in current patch</p>
            </div>
            <TrendUp weight="bold" size={28} className="text-black group-hover:scale-110 transition-transform duration-200" />
          </div>
          
          {data.meta_shift.top_agents.length > 0 ? (
            <div className="h-48 flex items-end gap-3 px-1 mt-auto">
              {data.meta_shift.top_agents.map((agent, index) => (
                <div 
                  key={index} 
                  className={`relative flex-1 border-2 border-black group/bar transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] origin-bottom ${
                    index === 1 
                    ? 'bg-[var(--color-primary)] shadow-[2px_2px_0px_rgba(0,0,0,1)] -translate-y-1' 
                    : 'bg-white hover:bg-gray-50 hover:-translate-y-1 hover:shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                  }`}
                  style={{ height: agent.height }}
                >
                  <div className={`absolute -top-7 left-1/2 -translate-x-1/2 text-[12px] font-['JetBrains_Mono'] transition-opacity duration-150 ${
                    index === 1 ? 'font-black opacity-100' : 'font-bold opacity-0 group-hover/bar:opacity-100 text-gray-500'
                  }`}>
                    {agent.shift}
                  </div>
                  <div className={`absolute -bottom-7 left-1/2 -translate-x-1/2 text-[13px] font-['Archivo_Black'] uppercase tracking-wide ${
                    index === 1 ? 'text-black' : 'text-gray-400 group-hover/bar:text-gray-800'
                  }`}>
                    {agent.name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50">
                <p className="text-gray-500 text-sm font-['JetBrains_Mono'] font-bold">No patch data available.</p>
             </div>
          )}
          
          <button className="mt-10 w-full border-2 border-black bg-white hover:bg-[var(--color-primary)] active:bg-[var(--color-primary)] active:scale-[0.98] p-3 font-bold font-['Archivo_Black'] text-[14px] uppercase tracking-wide flex justify-center items-center gap-2 transition-all duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            Explore Meta <ArrowUpRight weight="bold" size={18} />
          </button>
        </div>

        <div className="bg-white border-2 border-black rounded-md p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col transition-transform duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-['Archivo_Black'] uppercase text-xl">Consistency</h3>
              <p className="text-[13px] font-['JetBrains_Mono'] font-bold mt-2 text-gray-500">Followed player's last 10 matches</p>
            </div>
            <Heartbeat weight="bold" size={28} className="text-black" />
          </div>
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50 mt-2">
             <div className="text-center p-6">
                <Crosshair weight="bold" size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="font-['JetBrains_Mono'] font-bold text-sm text-gray-500 mb-5">No player followed yet.</p>
                <button className="bg-black text-white px-5 py-2.5 border-2 border-black hover:bg-[var(--color-primary)] hover:text-black hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] font-['Archivo_Black'] uppercase text-sm tracking-wide">
                  Find Players
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Level 3: Table (Compact Recent matches) */}
      <div className="bg-white border-2 border-black rounded-md shadow-[6px_6px_0px_rgba(0,0,0,1)] overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        <div className="p-4 md:p-5 border-b-2 border-black bg-[var(--color-primary)] flex justify-between items-center">
           <h3 className="font-['Archivo_Black'] uppercase text-lg">Recent Match Results</h3>
           <span className="text-[12px] font-bold bg-black text-white px-2.5 py-1 rounded-sm font-['JetBrains_Mono'] uppercase tracking-widest flex items-center gap-2">
             <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
             Live
           </span>
        </div>
        
        {data.recent_matches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="bg-white border-b-2 border-black">
                  <th className="px-6 py-4 font-['Archivo_Black'] text-gray-800 w-[140px] uppercase text-sm tracking-wide">Date</th>
                  <th className="px-6 py-4 font-['Archivo_Black'] text-gray-800 uppercase text-sm tracking-wide">Event</th>
                  <th className="px-6 py-4 font-['Archivo_Black'] text-gray-800 uppercase text-sm tracking-wide">Result</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_matches.map((match, i) => (
                  <tr 
                    key={i} 
                    className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 group cursor-pointer transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:bg-gray-100"
                  >
                    <td className="px-6 py-5 font-['JetBrains_Mono'] font-bold text-[13px] tabular-nums text-gray-600 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-active:scale-[0.98] origin-left">
                      {match.date ? new Date(match.date).toISOString().split('T')[0] : 'N/A'}
                    </td>
                    <td className="px-6 py-5 font-bold font-['Inter'] transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-active:scale-[0.98] origin-left">
                      {match.event}
                    </td>
                    <td className="px-6 py-5 font-['JetBrains_Mono'] transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-active:scale-[0.98] origin-left">
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center gap-2 ${match.winner_id === match.team_a_id ? "font-black text-black" : "text-gray-400 font-bold"}`}>
                          {match.team_a_logo && (
                             <img src={match.team_a_logo} alt={match.team_a} className="w-5 h-5 object-contain" />
                          )}
                          {match.team_a}
                          {match.winner_id === match.team_a_id && (
                            <span className="inline-block bg-[var(--color-primary)] text-black border-2 border-black px-1.5 py-0.5 ml-1 font-black text-[10px] uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)] -translate-y-0.5">WIN</span>
                          )}
                        </span>
                        <span className="text-gray-300 font-black mx-1 italic">VS</span>
                        <span className={`flex items-center gap-2 ${match.winner_id === match.team_b_id ? "font-black text-black" : "text-gray-400 font-bold"}`}>
                          {match.team_b_logo && (
                             <img src={match.team_b_logo} alt={match.team_b} className="w-5 h-5 object-contain" />
                          )}
                          {match.team_b}
                          {match.winner_id === match.team_b_id && (
                            <span className="inline-block bg-[var(--color-primary)] text-black border-2 border-black px-1.5 py-0.5 ml-1 font-black text-[10px] uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)] -translate-y-0.5">WIN</span>
                          )}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500 text-sm font-['JetBrains_Mono'] font-bold bg-gray-50">
            No recent matches available in the database.
          </div>
        )}
      </div>

    </div>
  );
}

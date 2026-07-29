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
  team_a_id: string;
  team_b_id: string;
  winner_id: string;
}

interface HeroKpi {
  name: string;
  score: string | number;
  profile_name: string;
  role: string;
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
      <div className="space-y-6 max-w-6xl">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        <WarningCircle size={48} className="mb-4 text-red-500" />
        <p className="font-['JetBrains_Mono']">{error || "No data available."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-['Archivo_Black'] uppercase tracking-tight mb-1">Dashboard</h1>
        <p className="text-gray-500 text-[14px]">Overview of current meta shifts and your top recommendations.</p>
      </div>

      {/* Level 1: Hero KPI */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Your Top Match {data.hero_kpi ? `(${data.hero_kpi.role})` : ''}
          </p>
          {data.hero_kpi ? (
            <>
              <div className="flex items-end gap-4">
                <h2 className="text-4xl font-['Archivo_Black'] uppercase tracking-tight truncate max-w-xs">{data.hero_kpi.name}</h2>
                <div className="bg-[var(--color-primary)] px-3 py-1 rounded-full border border-black mb-1 shrink-0">
                  <span className="font-['JetBrains_Mono'] font-bold text-sm tabular-nums">
                    {Number(data.hero_kpi.score).toFixed(1)} SMART
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 font-medium">Based on your "{data.hero_kpi.profile_name}" weight profile.</p>
            </>
          ) : (
            <div className="py-2">
              <p className="text-gray-500 font-['JetBrains_Mono'] text-sm">Run a SMART calculation to see your top match here.</p>
            </div>
          )}
        </div>
        <div className="hidden md:block">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
            <User weight="regular" size={40} className="text-gray-400" />
          </div>
        </div>
      </div>

      {/* Level 2: Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-semibold text-[15px]">Meta Shift (Patch {data.meta_shift.patch})</h3>
              <p className="text-[12px] text-gray-500">Highest rated agents in current patch</p>
            </div>
            <TrendUp weight="regular" size={18} className="text-gray-400" />
          </div>
          
          {data.meta_shift.top_agents.length > 0 ? (
            <div className="h-48 flex items-end gap-4 px-2">
              {data.meta_shift.top_agents.map((agent, index) => (
                <div 
                  key={index} 
                  className={`w-1/4 rounded-t-sm relative group transition-colors flex-1 ${
                    index === 1 // Just highlighting one of them like the dummy data did for visual flair
                    ? 'bg-[var(--color-primary)] border-t border-x border-black' 
                    : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  style={{ height: agent.height }}
                >
                  <div className={`absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-['JetBrains_Mono'] transition-opacity ${
                    index === 1 ? 'font-bold opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    {agent.shift}
                  </div>
                  <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[12px] font-medium ${
                    index === 1 ? 'text-black font-bold' : 'text-gray-600'
                  }`}>
                    {agent.name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="h-48 flex items-center justify-center">
                <p className="text-gray-500 text-sm">No patch data available.</p>
             </div>
          )}
          
          <div className="mt-8 pt-4 border-t border-gray-100 text-center">
             <button className="text-[13px] font-medium text-gray-600 hover:text-black flex items-center gap-1 mx-auto">
               View Meta Explorer <ArrowUpRight weight="regular" size={14} />
             </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-semibold text-[15px]">Followed Player Consistency</h3>
              <p className="text-[12px] text-gray-500">Last 10 matches performance</p>
            </div>
            <Heartbeat weight="regular" size={18} className="text-gray-400" />
          </div>
          <div className="h-48 flex items-center justify-center">
             <div className="text-center">
                <Crosshair weight="regular" size={32} className="text-gray-300 mx-auto mb-2" />
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
        
        {data.recent_matches.length > 0 ? (
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200">
                <th className="px-4 py-2 font-medium text-gray-500 w-[120px]">Date</th>
                <th className="px-4 py-2 font-medium text-gray-500">Event</th>
                <th className="px-4 py-2 font-medium text-gray-500">Matchup Result</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_matches.map((match, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group cursor-pointer">
                  <td className="px-4 py-3 text-gray-600 font-['JetBrains_Mono'] text-[12px] tabular-nums">
                    {match.date ? new Date(match.date).toISOString().split('T')[0] : 'N/A'}
                  </td>
                  <td className="px-4 py-3">{match.event}</td>
                  <td className="px-4 py-3 font-medium flex items-center gap-2">
                    <span className={match.winner_id === match.team_a_id ? "font-bold text-black" : "text-gray-500"}>
                      {match.team_a} {match.winner_id === match.team_a_id && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded ml-1 font-bold">WIN</span>}
                    </span>
                    <span className="text-gray-300 font-normal mx-1">vs</span>
                    <span className={match.winner_id === match.team_b_id ? "font-bold text-black" : "text-gray-500"}>
                      {match.team_b} {match.winner_id === match.team_b_id && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded ml-1 font-bold">WIN</span>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500 text-sm">
            No recent matches available in the database.
          </div>
        )}
      </div>

    </div>
  );
}

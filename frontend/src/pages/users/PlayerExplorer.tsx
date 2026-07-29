import { useState, useEffect } from 'react';
import { MagnifyingGlass, Funnel, User } from '@phosphor-icons/react';
import { Skeleton } from '@/components/ui/skeleton';
import clsx from 'clsx';
import axios from 'axios';

interface ExplorerPlayer {
  id: string;
  name: string;
  team: string;
  role: string;
  region: string;
  headlineStat: string; // e.g., "268 ACS"
  photoUrl?: string;
}

export default function PlayerExplorer() {
  const [players, setPlayers] = useState<ExplorerPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeRole, setActiveRole] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const roles = ['All', 'Duelist', 'Initiator', 'Controller', 'Sentinel'];

  useEffect(() => {
    setLoading(true);
    let url = 'http://trickster.test/backend/public/api/v1/players?';
    if (searchQuery) url += `q=${encodeURIComponent(searchQuery)}&`;
    if (activeRole !== 'All') url += `role=${encodeURIComponent(activeRole.toLowerCase())}&`;

    axios.get(url)
      .then(res => {
        const fetchedPlayers = res.data.data.map((p: any) => {
          // find global smart result for headline stat if any, otherwise default
          const globalResult = p.smartResults?.find((r: any) => r.mode === 'global');
          const stat = globalResult ? `${globalResult.score} Score` : 'N/A';
          
          return {
            id: p.id,
            name: p.ign || 'Unknown',
            team: p.team?.name || 'F/A',
            role: p.current_role || 'Flex',
            region: p.team?.region || 'Global',
            headlineStat: stat,
            photoUrl: p.photo_url
          };
        });
        setPlayers(fetchedPlayers);
      })
      .catch(err => {
        console.error('Failed to fetch players:', err);
        setPlayers([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchQuery, activeRole]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-['Archivo_Black'] uppercase tracking-tight mb-1">Player Explorer</h1>
        <p className="text-gray-500 text-[14px]">Search and browse players across all global leagues.</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass weight="regular" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by player name or team..." 
            className="w-full pl-9 pr-4 py-2 text-[14px] border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <Funnel weight="regular" size={16} className="text-gray-400" />
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            {roles.map(r => (
              <button 
                key={r}
                onClick={() => setActiveRole(r)}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap border",
                  activeRole === r 
                    ? "bg-black text-white border-black" 
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col h-[140px]">
              <div className="flex items-center gap-3 mb-auto">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-24 mb-1.5" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <Skeleton className="h-4 w-32 mt-4" />
            </div>
          ))
        ) : (
          players.map(player => (
            <div 
              key={player.id} 
              onClick={() => window.location.href = `/app/players/${player.id}`}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group flex flex-col h-[140px]"
            >
              <div className="flex items-center justify-between mb-auto">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 overflow-hidden group-hover:bg-[var(--color-primary-subtle)] transition-colors">
                    {player.photoUrl ? (
                      <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                      <User weight="regular" size={24} className="text-gray-400 group-hover:text-[var(--color-secondary)] transition-colors" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-[16px] leading-tight group-hover:text-[var(--color-primary-hover)] transition-colors">{player.name}</h3>
                    <p className="text-[12px] text-gray-500 font-medium">{player.team} • {player.region}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded">
                  {player.role}
                </span>
                <span className="font-['JetBrains_Mono'] font-bold text-[13px] text-gray-700">
                  {player.headlineStat}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

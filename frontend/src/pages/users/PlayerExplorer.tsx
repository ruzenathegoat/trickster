import { useState, useEffect } from 'react';
import { MagnifyingGlass, Funnel, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import axios from '../../lib/axios';

interface ExplorerPlayer {
  id: string;
  name: string;
  ign: string;
  team: string;
  role: string;
  region: string;
  headlineStat: string;
}

export default function PlayerExplorer() {
  const [players, setPlayers] = useState<ExplorerPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeRole, setActiveRole] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const roles = ['All', 'Duelist', 'Initiator', 'Controller', 'Sentinel', 'Flex'];
  const navigate = useNavigate();

  useEffect(() => {
    // Reset to page 1 when search or role changes
    setPage(1);
  }, [searchQuery, activeRole]);

  useEffect(() => {
    setLoading(true);
    let url = `/api/v1/players?page=${page}`;
    if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;
    if (activeRole !== 'All') url += `&role=${encodeURIComponent(activeRole)}`;

    axios.get(url)
      .then(res => {
        const fetchedPlayers = res.data.data.map((p: any) => {
          const globalResult = p.smart_results?.find((r: any) => r.mode === 'career');
          const stat = globalResult ? `${globalResult.final_score}` : 'N/A';
          
          return {
            id: p.id,
            ign: p.ign || 'Unknown',
            name: p.name || '',
            team: p.team?.name || 'Free Agent',
            role: p.current_role || 'Flex',
            region: p.team?.region || 'Global',
            headlineStat: stat
          };
        });
        setPlayers(fetchedPlayers);
        setTotalPages(res.data.last_page || 1);
      })
      .catch(err => {
        console.error('Failed to fetch players:', err);
        setPlayers([]);
        setTotalPages(1);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchQuery, activeRole, page]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-black pb-4 mb-6">
        <div>
          <h1 className="text-4xl font-['Archivo_Black'] uppercase tracking-tight mb-2">Player Explorer</h1>
          <p className="text-gray-600 font-['JetBrains_Mono'] text-sm">Directory of all global players (A-Z)</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-2 border-black p-4 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ boxShadow: '4px 4px 0px rgba(0,0,0,1)' }}>
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass weight="bold" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by player name..." 
            className="w-full pl-10 pr-4 py-2 border-2 border-black font-['JetBrains_Mono'] text-sm focus:outline-none focus:ring-0 focus:border-black transition-shadow hover:shadow-[2px_2px_0px_black] focus:shadow-[2px_2px_0px_black]"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <Funnel weight="bold" size={20} className="text-black" />
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            {roles.map(r => (
              <button 
                key={r}
                onClick={() => setActiveRole(r)}
                className={`px-3 py-1 border-2 border-black text-sm font-bold uppercase transition-all whitespace-nowrap ${
                  activeRole === r 
                    ? 'bg-black text-[var(--color-primary)] shadow-[2px_2px_0px_var(--color-primary)]' 
                    : 'bg-white text-black hover:bg-gray-100 hover:shadow-[2px_2px_0px_black]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border-2 border-black p-6 md:p-8" style={{ boxShadow: '8px 8px 0px rgba(0,0,0,1)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-black text-xs font-bold text-gray-500 uppercase tracking-wider font-['JetBrains_Mono']">
                <th className="py-3 px-4">IGN</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Region</th>
                <th className="py-3 px-4 text-right">SMART Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="py-4 px-4 text-right"><Skeleton className="h-5 w-12 ml-auto" /></td>
                  </tr>
                ))
              ) : (
                players.map(player => (
                  <tr 
                    key={player.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/app/players/${player.id}`)}
                  >
                    <td className="py-4 px-4 font-['Archivo_Black'] uppercase text-base group-hover:text-[var(--color-primary)] transition-colors">
                      {player.ign}
                    </td>
                    <td className="py-4 px-4 font-['JetBrains_Mono'] text-gray-500 text-xs">
                      {player.name}
                    </td>
                    <td className="py-4 px-4 font-bold text-gray-600 uppercase text-xs tracking-wider">
                      {player.team}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-block px-2 py-1 bg-gray-100 border border-gray-300 text-xs font-bold uppercase rounded">
                        {player.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-600 text-xs uppercase font-bold tracking-widest">
                      {player.region}
                    </td>
                    <td className="py-4 px-4 text-right font-['JetBrains_Mono'] font-bold text-[var(--color-primary)] text-lg bg-gray-900 group-hover:bg-black transition-colors">
                      {player.headlineStat}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {!loading && players.length === 0 && (
            <div className="py-12 text-center text-gray-500 font-['JetBrains_Mono']">
              No players found matching the current search or filters.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="mt-6 pt-4 border-t-2 border-gray-200 flex justify-between items-center">
          <span className="text-sm font-['JetBrains_Mono'] text-gray-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 border-2 border-black hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors"
            >
              <CaretLeft size={20} weight="bold" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="p-2 border-2 border-black hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors"
            >
              <CaretRight size={20} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

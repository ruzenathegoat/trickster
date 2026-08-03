import { useState, useEffect } from 'react';
import { MagnifyingGlass, CaretLeft, CaretRight, ArrowUp, ArrowDown } from '@phosphor-icons/react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../../lib/axios';

interface ExplorerPlayer {
  id: string;
  name: string;
  ign: string;
  team: string;
  role: string;
  region: string;
  headlineStat: string;
  photo_url: string | null;
}

export default function PlayerExplorer() {
  const [players, setPlayers] = useState<ExplorerPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeRole, setActiveRole] = useState('All');
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('smart');
  const [sortDir, setSortDir] = useState('desc');
  
  const roles = ['All', 'Duelist', 'Initiator', 'Controller', 'Sentinel', 'Flex'];
  const navigate = useNavigate();

  useEffect(() => {
    const query = searchParams.get('search');
    if (query !== null && query !== searchQuery) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeRole, sortBy, sortDir]);

  useEffect(() => {
    setLoading(true);
    let url = `/api/v1/players?page=${page}`;
    if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;
    if (activeRole !== 'All') url += `&role=${encodeURIComponent(activeRole)}`;
    url += `&sort_by=${sortBy}&sort_dir=${sortDir}`;

    axios.get(url)
      .then(res => {
        const fetchedPlayers = res.data.data.map((p: any) => {
          let statValue = 'N/A';
          if (sortBy === 'acs') statValue = p.avg_acs ?? 'N/A';
          else if (sortBy === 'kd') statValue = p.avg_kd ?? 'N/A';
          else if (sortBy === 'adr') statValue = p.avg_adr ?? 'N/A';
          else if (sortBy === 'fkfd') {
             if (p.avg_fk != null && p.avg_fd != null) {
                const diff = (parseFloat(p.avg_fk) - parseFloat(p.avg_fd));
                statValue = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
             }
          }
          else {
            const globalResult = p.smart_results?.find((r: any) => r.mode === 'career');
            statValue = globalResult ? `${globalResult.final_score}` : 'N/A';
          }
          
          return {
            id: p.id,
            ign: p.ign || 'Unknown',
            name: p.name || '',
            team: p.team?.name || 'Free Agent',
            role: p.current_role || 'Flex',
            region: p.team?.region || 'Global',
            headlineStat: statValue,
            photo_url: p.photo_url || null
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
  }, [searchQuery, activeRole, page, sortBy, sortDir]);

  const displayNames: Record<string, string> = { smart: 'SMART', acs: 'ACS', kd: 'K/D', adr: 'ADR', fkfd: 'FK/FD' };

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-10">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      >
        <h1 className="text-5xl lg:text-6xl font-display uppercase tracking-tighter leading-none mb-3">
          Player Explorer
        </h1>
        <p className="font-label text-sm text-gray-500 uppercase tracking-widest">
          Global directory, Season 2026
        </p>
      </motion.div>

      {/* Search + Role Filters — single structural bar */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        className="border-4 border-black flex flex-col lg:flex-row"
      >
        {/* Search */}
        <div className="relative flex-1 border-b-4 lg:border-b-0 lg:border-r-4 border-black">
          <MagnifyingGlass weight="bold" size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-black" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value) {
                searchParams.set('search', e.target.value);
                setSearchParams(searchParams, { replace: true });
              } else {
                searchParams.delete('search');
                setSearchParams(searchParams, { replace: true });
              }
            }}
            placeholder="Search by player name..." 
            className="w-full pl-14 pr-6 py-5 font-label text-[13px] font-bold uppercase tracking-widest text-black placeholder-gray-400 bg-white focus:outline-none focus:bg-[var(--color-primary)] transition-colors"
          />
        </div>
        
        {/* Role Tabs — joined, no gaps */}
        <div className="flex overflow-x-auto shrink-0">
          {roles.map((r, i) => (
            <button 
              key={r}
              onClick={() => setActiveRole(r)}
              className={`px-5 py-5 font-label text-[12px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
                i > 0 ? 'border-l-2 border-black' : ''
              } ${
                activeRole === r 
                  ? 'bg-black text-[var(--color-primary)]' 
                  : 'bg-white text-gray-500 hover:bg-black hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Sort Row */}
      <div className="flex gap-2 items-center flex-wrap">
        <span className="font-label text-[11px] font-bold text-gray-400 uppercase tracking-widest mr-2">Sort</span>
        {['smart', 'acs', 'kd', 'adr', 'fkfd'].map(stat => {
          const isActive = sortBy === stat;
          return (
            <button
              key={stat}
              onClick={() => {
                if (isActive) {
                  if (sortDir === 'desc') setSortDir('asc');
                  else { setSortBy('smart'); setSortDir('desc'); }
                } else {
                  setSortBy(stat);
                  setSortDir('desc');
                }
              }}
              className={`flex items-center gap-1.5 px-4 py-2 border-2 border-black font-label text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 ${
                isActive 
                  ? 'bg-black text-white shadow-[4px_4px_0px_var(--color-primary)]' 
                  : 'bg-white text-black hover:bg-black hover:text-white'
              }`}
            >
              {displayNames[stat]}
              {isActive && (
                sortDir === 'desc' ? <ArrowDown size={14} weight="bold" /> : <ArrowUp size={14} weight="bold" />
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
      >
        <div className="overflow-x-auto border-4 border-black">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b-4 border-black bg-black text-white font-label text-[11px] font-bold uppercase tracking-widest">
                <th className="py-4 px-3 md:px-5">IGN</th>
                <th className="py-4 px-3 md:px-5">Name</th>
                <th className="py-4 px-3 md:px-5">Team</th>
                <th className="py-4 px-3 md:px-5">Role</th>
                <th className="py-4 px-3 md:px-5">Region</th>
                <th className="py-4 px-5 text-right">
                  {sortBy === 'smart' ? 'SMART' : displayNames[sortBy]}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b-2 border-gray-200">
                    <td className="py-4 px-3 md:px-5"><Skeleton className="h-5 w-16 md:w-24" /></td>
                    <td className="py-4 px-3 md:px-5"><Skeleton className="h-5 w-20 md:w-32" /></td>
                    <td className="py-4 px-3 md:px-5"><Skeleton className="h-5 w-20 md:w-32" /></td>
                    <td className="py-4 px-3 md:px-5"><Skeleton className="h-5 w-12 md:w-20" /></td>
                    <td className="py-4 px-3 md:px-5"><Skeleton className="h-5 w-10 md:w-16" /></td>
                    <td className="py-4 px-3 md:px-5 text-right"><Skeleton className="h-5 w-8 md:w-12 ml-auto" /></td>
                  </tr>
                ))
              ) : (
                players.map((player, idx) => (
                  <tr 
                    key={player.id} 
                    className="border-b-2 border-gray-200 hover:bg-[var(--color-primary)] transition-colors cursor-pointer group"
                    onClick={() => navigate(`/app/players/${player.id}`)}
                  >
                    <td className="py-4 px-3 md:px-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 border-2 border-black overflow-hidden shrink-0 flex items-center justify-center">
                          {player.photo_url ? (
                            <img src={player.photo_url} alt={player.ign} loading="lazy" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-display text-xs text-gray-400">?</span>
                          )}
                        </div>
                        <span className="font-display uppercase text-sm md:text-base group-hover:text-black transition-colors">{player.ign}</span>
                      </div>
                    </td>
                    <td className="py-4 px-3 md:px-5 font-label text-gray-500 text-[10px] md:text-xs uppercase tracking-wider whitespace-nowrap">
                      {player.name}
                    </td>
                    <td className="py-4 px-3 md:px-5 font-label font-bold text-black text-[10px] md:text-xs uppercase tracking-wider whitespace-nowrap">
                      {player.team}
                    </td>
                    <td className="py-4 px-3 md:px-5 whitespace-nowrap">
                      <span className="inline-block px-2 py-1 md:px-3 md:py-1 bg-white border-2 border-black text-[9px] md:text-[11px] font-label font-bold uppercase tracking-wider">
                        {player.role}
                      </span>
                    </td>
                    <td className="py-4 px-3 md:px-5 font-label text-gray-500 text-[9px] md:text-[11px] uppercase tracking-widest whitespace-nowrap">
                      {player.region}
                    </td>
                    <td className="py-4 px-3 md:px-5 text-right font-numeric font-bold text-base md:text-lg tabular-nums bg-black text-[var(--color-primary)] group-hover:bg-gray-900 transition-colors whitespace-nowrap">
                      {player.headlineStat}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {!loading && players.length === 0 && (
            <div className="py-16 text-center font-label text-sm text-gray-400 uppercase tracking-widest">
              No players found matching the current filters.
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-6 flex justify-between items-center">
          <span className="font-label text-[12px] font-bold text-gray-400 uppercase tracking-widest tabular-nums">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-3 border-4 border-black bg-white hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-colors active:scale-95"
            >
              <CaretLeft size={20} weight="bold" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="p-3 border-4 border-black bg-white hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-colors active:scale-95"
            >
              <CaretRight size={20} weight="bold" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

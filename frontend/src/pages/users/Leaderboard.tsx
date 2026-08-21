import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from '../../lib/axios';
import { Skeleton } from '@/components/ui/skeleton';
import { CaretLeft, CaretRight, User } from '@phosphor-icons/react';

interface PlayerRank {
  id: string;
  rank: number;
  ign: string;
  team_name: string;
  photo_url: string | null;
  rating: number;
  role: string;
  acs: number;
  kd: number;
}

export default function Leaderboard() {
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [topPlayers, setTopPlayers] = useState<PlayerRank[]>([]);
  const [tablePlayers, setTablePlayers] = useState<PlayerRank[]>([]);
  
  // Table filters & pagination
  const [roleFilter, setRoleFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();
  const ROLES = ['All', 'Duelist', 'Initiator', 'Controller', 'Sentinel', 'Flex'];

  useEffect(() => {
    const fetchTopPlayers = async () => {
      try {
        const response = await axios.get('/api/v1/leaderboard/top');
        setTopPlayers(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTop(false);
      }
    };
    fetchTopPlayers();
  }, []);

  useEffect(() => {
    const fetchTablePlayers = async () => {
      setLoadingTable(true);
      try {
        const response = await axios.get(`/api/v1/leaderboard/players?page=${page}&role=${roleFilter}`);
        setTablePlayers(response.data.data);
        setTotalPages(response.data.last_page);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTable(false);
      }
    };
    fetchTablePlayers();
  }, [page, roleFilter]);

  if (loadingTop) {
    return (
      <div className="space-y-16 max-w-7xl pb-24">
        <div>
          <Skeleton className="h-12 w-3/4 md:w-80 mb-4 border-2 border-theme-border" />
          <Skeleton className="h-5 w-full md:w-96 border-2 border-theme-border" />
        </div>
        <div className="flex flex-col lg:flex-row gap-12 mt-12">
          <Skeleton className="flex-1 min-h-[500px] border-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]" />
          <div className="flex-[2] flex flex-col gap-12">
            <Skeleton className="flex-1 h-64 border-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]" />
            <Skeleton className="flex-1 h-64 border-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]" />
          </div>
        </div>
        <Skeleton className="h-96 w-full mt-16 border-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]" />
      </div>
    );
  }

  return (
    <div className="space-y-16 max-w-7xl pb-24">
      {/* Header */}
      <section>
        <div className="flex flex-col border-b-4 border-theme-border pb-4">
          <h1 className="text-4xl md:text-5xl font-['Archivo_Black'] uppercase tracking-tight mb-2 text-theme-text">
            Leaderboard
          </h1>
          <p className="text-gray-600 font-['JetBrains_Mono'] font-bold text-[15px] uppercase tracking-widest">
            Season 2026 &mdash; Highest SMART Ratings
          </p>
        </div>

        {/* Asymmetric Top 3 Podium */}
        {topPlayers.length > 0 ? (
          <div className="flex flex-col gap-6 md:gap-8 pt-8">
            {/* RANK 1 - Horizontal Layout */}
            {topPlayers[0] && (
              <motion.div 
                initial={{ clipPath: 'inset(100% 0 0 0)' }}
                animate={{ clipPath: 'inset(0% 0 0 0)' }}
                transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                onClick={() => navigate(`/app/players/${topPlayers[0].id}`)}
                className="w-full bg-[#9b72cf] border-4 border-theme-border relative overflow-hidden group cursor-pointer shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] hover:shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] transition-shadow duration-300"
              >
                <div className="flex flex-col md:flex-row h-full min-h-[300px]">
                  {/* Rank Section */}
                  <div className="w-full md:w-[200px] bg-black p-8 flex flex-col items-center justify-center border-b-4 md:border-b-0 md:border-r-4 border-theme-border shrink-0">
                    <span className="text-white/60 font-['JetBrains_Mono'] text-sm tracking-widest uppercase mb-2">Rank</span>
                    <span className="text-[#9b72cf] font-['Archivo_Black'] text-7xl md:text-8xl">#1</span>
                  </div>

                  {/* Photo Section */}
                  <div className="w-full md:w-[300px] bg-[#111] relative overflow-hidden flex items-end justify-center border-b-4 md:border-b-0 md:border-r-4 border-theme-border shrink-0">
                     {topPlayers[0].photo_url ? (
                        <img 
                          src={topPlayers[0].photo_url} 
                          alt={topPlayers[0].ign}
                          className="h-[250px] w-auto object-cover object-bottom filter contrast-125 transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center min-h-[250px]">
                          <span className="font-['JetBrains_Mono'] text-sm font-bold uppercase tracking-widest text-white/40">No Photo</span>
                        </div>
                      )}
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 p-8 md:p-10 z-20 relative flex flex-col justify-center bg-[#9b72cf]">
                     <p className="text-black/80 font-['JetBrains_Mono'] font-bold text-[14px] uppercase tracking-widest mb-2 flex items-center gap-3">
                       <span className="w-2 h-2 bg-black inline-block" /> {topPlayers[0].team_name}
                     </p>
                     <h2 className="text-6xl md:text-8xl font-['Archivo_Black'] uppercase tracking-tighter text-black leading-none mb-4 group-hover:translate-x-2 transition-transform duration-300">
                       {topPlayers[0].ign}
                     </h2>
                     <p className="text-black/70 font-['JetBrains_Mono'] text-[13px] font-bold tracking-widest uppercase mb-8">
                       {topPlayers[0].role}
                     </p>
                     <div className="flex flex-wrap items-end gap-8">
                       <div>
                         <p className="text-[11px] text-black/60 font-black mb-1 tracking-widest uppercase">SMART Rating</p>
                         <p className="text-5xl font-['JetBrains_Mono'] font-black tabular-nums text-black">{topPlayers[0].rating}</p>
                       </div>
                       <div>
                         <p className="text-[11px] text-black/60 font-bold mb-1 tracking-widest uppercase">ACS</p>
                         <p className="text-2xl font-['JetBrains_Mono'] font-bold tabular-nums text-black">{topPlayers[0].acs}</p>
                       </div>
                       <div>
                         <p className="text-[11px] text-black/60 font-bold mb-1 tracking-widest uppercase">K/D</p>
                         <p className="text-2xl font-['JetBrains_Mono'] font-bold tabular-nums text-black">{topPlayers[0].kd}</p>
                       </div>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* RANK 2 & 3 - Side by Side Horizontal Modules */}
            <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
              {[1, 2].map(index => {
                const player = topPlayers[index];
                if (!player) return null;
                return (
                  <motion.div
                    key={player.id}
                    initial={{ clipPath: 'inset(0 100% 0 0)' }}
                    animate={{ clipPath: 'inset(0 0% 0 0)' }}
                    transition={{ duration: 0.6, delay: 0.2 + index * 0.1, ease: [0.23, 1, 0.32, 1] }}
                    onClick={() => navigate(`/app/players/${player.id}`)}
                    className="flex-1 bg-[var(--color-primary)] border-4 border-theme-border relative overflow-hidden group cursor-pointer shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] hover:shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] transition-shadow duration-300"
                  >
                    <div className="flex flex-col sm:flex-row h-full">
                      <div className="w-full sm:w-[180px] bg-[#111] relative overflow-hidden flex items-end justify-center border-b-4 sm:border-b-0 sm:border-r-4 border-theme-border shrink-0 min-h-[200px]">
                         <div className="absolute top-2 left-2 w-10 h-10 bg-[var(--color-primary)] text-black border-2 border-theme-border rounded-full flex items-center justify-center font-['Archivo_Black'] text-xl z-20">
                           #{player.rank}
                         </div>
                         {player.photo_url ? (
                            <img 
                              src={player.photo_url} 
                              alt={player.ign}
                              className="h-[200px] w-auto object-cover object-bottom filter contrast-125 transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="font-['JetBrains_Mono'] text-[10px] font-bold uppercase tracking-widest text-white/40">No Photo</span>
                            </div>
                          )}
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-center bg-theme-bg">
                         <p className="text-gray-500 font-['JetBrains_Mono'] font-bold text-[11px] uppercase tracking-widest mb-2">
                           {player.team_name} &bull; {player.role}
                         </p>
                         <h2 className="text-4xl md:text-5xl font-['Archivo_Black'] uppercase tracking-tighter text-theme-text leading-none mb-6 group-hover:text-[var(--color-primary)] transition-colors">
                           {player.ign}
                         </h2>
                         <div className="flex flex-wrap items-end gap-6 border-t-2 border-theme-border pt-4 mt-auto">
                           <div>
                             <p className="text-[10px] text-gray-500 font-black mb-1 tracking-widest uppercase">SMART</p>
                             <p className="text-3xl font-['JetBrains_Mono'] font-black tabular-nums">{player.rating}</p>
                           </div>
                           <div>
                             <p className="text-[10px] text-gray-400 font-bold mb-1 tracking-widest uppercase">ACS</p>
                             <p className="text-xl font-['JetBrains_Mono'] font-bold tabular-nums">{player.acs}</p>
                           </div>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : !loadingTop && (
          <div className="py-24 text-center border-4 border-theme-border bg-gray-50">
            <p className="text-theme-text font-['JetBrains_Mono'] font-bold text-lg">Not enough player data available.</p>
          </div>
        )}
      </section>

      {/* Full Leaderboard Table Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="pt-8" 
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6 border-b-4 border-theme-border pb-4">
          <h2 className="text-3xl font-['Archivo_Black'] uppercase tracking-tight text-theme-text">Full Leaderboard</h2>
          
          <div className="flex items-center gap-0 w-full md:w-auto overflow-x-auto border-2 border-theme-border">
            {ROLES.map((role, idx) => (
              <button
                key={role}
                onClick={() => { setRoleFilter(role); setPage(1); }}
                className={`px-6 py-3 text-[13px] font-black uppercase transition-all whitespace-nowrap ${
                  idx !== ROLES.length - 1 ? 'border-r-2 border-theme-border' : ''
                } ${
                  roleFilter === role 
                    ? 'bg-black text-[var(--color-primary)]' 
                    : 'bg-theme-bg text-theme-text hover:bg-gray-100'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[15px] border-collapse">
            <thead>
              <tr className="border-b-4 border-theme-border text-[10px] md:text-[12px] font-black text-theme-text uppercase tracking-widest font-['JetBrains_Mono']">
                <th className="py-4 px-3 md:px-6 w-16 md:w-24">Rank</th>
                <th className="py-4 px-3 md:px-6">Player</th>
                <th className="py-4 px-3 md:px-6">Team</th>
                <th className="py-4 px-3 md:px-6">Role</th>
                <th className="py-4 px-3 md:px-6 text-right">SMART</th>
                <th className="py-4 px-3 md:px-6 text-right">ACS</th>
                <th className="py-4 px-3 md:px-6 text-right">K/D</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-gray-100">
              {loadingTable ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i}>
                    <td className="py-4 px-3 md:py-6 md:px-6"><Skeleton className="h-6 w-8 md:w-12 bg-gray-200" /></td>
                    <td className="py-4 px-3 md:py-6 md:px-6"><Skeleton className="h-6 w-32 md:w-48 bg-gray-200" /></td>
                    <td className="py-4 px-3 md:py-6 md:px-6"><Skeleton className="h-6 w-20 md:w-32 bg-gray-200" /></td>
                    <td className="py-4 px-3 md:py-6 md:px-6"><Skeleton className="h-6 w-16 md:w-20 bg-gray-200" /></td>
                    <td className="py-4 px-3 md:py-6 md:px-6 text-right"><Skeleton className="h-8 w-12 md:w-16 ml-auto bg-gray-200" /></td>
                    <td className="py-4 px-3 md:py-6 md:px-6 text-right"><Skeleton className="h-6 w-10 md:w-12 ml-auto bg-gray-200" /></td>
                    <td className="py-4 px-3 md:py-6 md:px-6 text-right"><Skeleton className="h-6 w-10 md:w-12 ml-auto bg-gray-200" /></td>
                  </tr>
                ))
              ) : (
                tablePlayers.map((player, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 + index * 0.05, ease: [0.23, 1, 0.32, 1] }}
                    key={player.id} 
                    className="hover:bg-[var(--color-primary)] transition-colors cursor-pointer group"
                    onClick={() => navigate(`/app/players/${player.id}`)}
                  >
                    <td className="py-4 px-3 md:py-6 md:px-6 font-['JetBrains_Mono'] font-black text-theme-text tabular-nums whitespace-nowrap">
                      #{((page - 1) * 10) + index + 1}
                    </td>
                    <td className="py-4 px-3 md:py-6 md:px-6 font-['Archivo_Black'] uppercase text-lg md:text-xl text-theme-text whitespace-nowrap">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-theme-bg border-2 border-theme-border overflow-hidden shrink-0 flex items-center justify-center">
                          {player.photo_url ? (
                            <img src={player.photo_url} alt={player.ign} className="w-full h-full object-cover contrast-125" />
                          ) : (
                            <User weight="fill" size={20} className="text-gray-300 md:text-[24px]" />
                          )}
                        </div>
                        {player.ign}
                      </div>
                    </td>
                    <td className="py-4 px-3 md:py-6 md:px-6 font-bold text-gray-500 group-hover:text-theme-text uppercase text-[11px] md:text-[13px] tracking-widest transition-colors whitespace-nowrap">
                      {player.team_name}
                    </td>
                    <td className="py-4 px-3 md:py-6 md:px-6 whitespace-nowrap">
                      <span className="inline-block px-2 py-1 md:px-3 md:py-1.5 bg-theme-bg border-2 border-theme-border text-[10px] md:text-[11px] font-black uppercase tracking-widest">
                        {player.role}
                      </span>
                    </td>
                    <td className="py-4 px-3 md:py-6 md:px-6 text-right font-['JetBrains_Mono'] font-black text-theme-text text-xl md:text-2xl tabular-nums whitespace-nowrap">
                      {player.rating}
                    </td>
                    <td className="py-4 px-3 md:py-6 md:px-6 text-right font-['JetBrains_Mono'] font-bold text-gray-600 group-hover:text-theme-text tabular-nums transition-colors whitespace-nowrap">
                      {player.acs}
                    </td>
                    <td className="py-4 px-3 md:py-6 md:px-6 text-right font-['JetBrains_Mono'] font-bold text-gray-600 group-hover:text-theme-text tabular-nums transition-colors whitespace-nowrap">
                      {player.kd}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
          
          {!loadingTable && tablePlayers.length === 0 && (
            <div className="py-16 text-center text-gray-500 font-['JetBrains_Mono'] font-bold text-lg">
              No players found matching the current filters.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="mt-8 pt-6 flex justify-between items-center">
          <span className="text-[13px] font-bold font-['JetBrains_Mono'] uppercase tracking-widest text-theme-text">
            Page {page} / {totalPages}
          </span>
          <div className="flex gap-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loadingTable}
              className="px-6 py-3 bg-theme-bg border-2 border-theme-border hover:bg-black hover:text-white disabled:opacity-50 disabled:hover:bg-theme-bg disabled:hover:text-theme-text transition-colors active:scale-95 shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] disabled:shadow-none flex items-center justify-center"
            >
              <CaretLeft size={20} weight="bold" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loadingTable}
              className="px-6 py-3 bg-theme-bg border-2 border-theme-border hover:bg-black hover:text-white disabled:opacity-50 disabled:hover:bg-theme-bg disabled:hover:text-theme-text transition-colors active:scale-95 shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] disabled:shadow-none flex items-center justify-center"
            >
              <CaretRight size={20} weight="bold" />
            </button>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

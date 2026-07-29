import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from '../../lib/axios';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Trophy, ArrowUpRight, Funnel, CaretLeft, CaretRight, MagnifyingGlass, UsersThree } from '@phosphor-icons/react';

interface TeamData {
  id: string;
  rank?: number;
  name: string;
  region: string;
  logo_url: string | null;
  win_rate: number | null;
  total_matches: number;
  wins: number;
  losses: number;
  player_count: number | null;
}

export default function TeamExplorer() {
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [topTeams, setTopTeams] = useState<TeamData[]>([]);
  const [tableTeams, setTableTeams] = useState<TeamData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/v1/teams/top')
      .then(res => setTopTeams(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoadingTop(false));
  }, []);

  useEffect(() => {
    setLoadingTable(true);
    let url = `/api/v1/teams?page=${page}`;
    if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;

    axios.get(url)
      .then(res => {
        setTableTeams(res.data.data);
        setTotalPages(res.data.last_page || 1);
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingTable(false));
  }, [page, searchQuery]);

  useEffect(() => { setPage(1); }, [searchQuery]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const cardVariants = {
    hidden: { y: 40, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  const medalColors = ['bg-[var(--color-primary)]', 'bg-gray-200', 'bg-orange-200'];

  if (loadingTop) {
    return (
      <div className="space-y-8 max-w-6xl">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 w-full rounded-none" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 max-w-6xl pb-12">
      {/* Top 3 Section */}
      <section>
        <div className="flex items-end justify-between border-b-2 border-black pb-4">
          <div>
            <h1 className="text-4xl font-['Archivo_Black'] uppercase tracking-tight mb-2 flex items-center gap-3">
              <Shield weight="fill" className="text-[var(--color-primary)]" />
              Top 3 Teams
            </h1>
            <p className="text-gray-600 font-['JetBrains_Mono'] text-sm">Season 2026 \ Highest Win Rate</p>
          </div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 pt-6"
        >
          {topTeams.map((team, idx) => (
            <motion.div
              key={team.id}
              onClick={() => navigate(`/app/teams/${team.id}`)}
              variants={cardVariants}
              className="group relative bg-white border-2 border-black cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:-translate-x-1 overflow-hidden"
              style={{ boxShadow: '6px 6px 0px rgba(0,0,0,1)' }}
              whileHover={{ boxShadow: '12px 12px 0px rgba(0,0,0,1)' }}
            >
              {/* Rank Badge */}
              <div className={`absolute -top-4 -right-4 w-12 h-12 border-2 border-black rounded-full flex items-center justify-center font-['Archivo_Black'] text-xl z-10 ${medalColors[idx] || 'bg-white'}`}>
                #{idx + 1}
              </div>

              {/* Logo Section */}
              <div className="h-48 flex items-center justify-center p-8 bg-gray-50 border-b-2 border-black relative overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#f9fafb_10px,#f9fafb_20px)] opacity-50" />
                {team.logo_url ? (
                  <motion.img
                    src={team.logo_url}
                    alt={team.name}
                    className="h-28 w-28 object-contain relative z-10 drop-shadow-lg"
                    whileHover={{ scale: 1.1, rotate: [0, -3, 3, 0] }}
                    transition={{ duration: 0.5 }}
                  />
                ) : (
                  <Shield size={64} weight="fill" className="text-gray-300 relative z-10" />
                )}

                {/* Hover overlay */}
                <div className="absolute bottom-0 left-0 w-full bg-black text-white px-3 py-2 flex justify-between items-center translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-20">
                  <span className="text-xs font-bold uppercase tracking-wider">View Team</span>
                  <ArrowUpRight size={16} weight="bold" />
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <h2 className="text-2xl font-['Archivo_Black'] uppercase tracking-tighter group-hover:text-[var(--color-primary)] transition-colors truncate">
                  {team.name}
                </h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-4">{team.region}</p>

                {/* Win Rate Ring */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-16 h-16">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                      <motion.circle
                        cx="18" cy="18" r="15.5" fill="none"
                        stroke="var(--color-primary)"
                        strokeWidth="3"
                        strokeDasharray={`${(team.win_rate || 0) * 0.974} 97.4`}
                        strokeLinecap="round"
                        initial={{ strokeDasharray: '0 97.4' }}
                        animate={{ strokeDasharray: `${(team.win_rate || 0) * 0.974} 97.4` }}
                        transition={{ duration: 1.5, delay: 0.3 + idx * 0.2, ease: 'easeOut' }}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center font-['JetBrains_Mono'] text-xs font-bold">
                      {team.win_rate ?? 0}%
                    </span>
                  </div>
                  <div className="flex-1 font-['JetBrains_Mono'] text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">W</span>
                      <span className="font-bold text-green-600">{team.wins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">L</span>
                      <span className="font-bold text-red-500">{team.losses}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-1">
                      <span className="text-gray-500">Total</span>
                      <span className="font-bold">{team.total_matches}</span>
                    </div>
                  </div>
                </div>

                {/* Trophy indicator */}
                {team.win_rate && team.win_rate >= 60 && (
                  <div className="flex items-center gap-2 bg-[var(--color-primary)] border-2 border-black px-3 py-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    <Trophy size={16} weight="fill" />
                    <span className="text-xs font-bold uppercase tracking-wider">Title Contender</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {topTeams.length === 0 && !loadingTop && (
          <div className="py-20 text-center border-2 border-dashed border-gray-300">
            <p className="text-gray-500 font-['JetBrains_Mono']">Not enough team data available.</p>
          </div>
        )}
      </section>

      {/* Full Table Section */}
      <section className="bg-white border-2 border-black p-6 md:p-8" style={{ boxShadow: '8px 8px 0px rgba(0,0,0,1)' }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 border-b-2 border-black pb-4">
          <h2 className="text-2xl font-['Archivo_Black'] uppercase tracking-tight">All Teams</h2>
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlass weight="bold" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teams..."
              className="w-full pl-10 pr-4 py-2 border-2 border-black font-['JetBrains_Mono'] text-sm focus:outline-none focus:shadow-[2px_2px_0px_black]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-black text-xs font-bold text-gray-500 uppercase tracking-wider font-['JetBrains_Mono']">
                <th className="py-3 px-4 w-[60px]">#</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4">Region</th>
                <th className="py-3 px-4 text-center">W / L</th>
                <th className="py-3 px-4 text-right">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loadingTable ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-8" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-40" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-16 mx-auto" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : (
                tableTeams.map((team, index) => (
                  <tr
                    key={team.id}
                    onClick={() => navigate(`/app/teams/${team.id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-4 font-['JetBrains_Mono'] font-bold text-gray-400">
                      {((page - 1) * 15) + index + 1}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {team.logo_url ? (
                          <img src={team.logo_url} alt={team.name} className="w-8 h-8 object-contain" />
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                            <Shield size={16} className="text-gray-400" />
                          </div>
                        )}
                        <span className="font-['Archivo_Black'] uppercase text-base group-hover:text-[var(--color-primary)] transition-colors truncate">
                          {team.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600 text-xs uppercase font-bold tracking-wider">
                      {team.region}
                    </td>
                    <td className="py-4 px-4 text-center font-['JetBrains_Mono'] text-sm">
                      <span className="text-green-600 font-bold">{team.wins}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-red-500 font-bold">{team.losses}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {team.win_rate != null ? (
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-[var(--color-primary)] rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${team.win_rate}%` }}
                              transition={{ duration: 0.8, delay: index * 0.05 }}
                            />
                          </div>
                          <span className="font-['JetBrains_Mono'] font-bold text-sm w-14 text-right">
                            {team.win_rate}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 font-['JetBrains_Mono'] text-xs">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!loadingTable && tableTeams.length === 0 && (
            <div className="py-12 text-center text-gray-500 font-['JetBrains_Mono']">
              No teams found.
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-6 pt-4 border-t-2 border-gray-200 flex justify-between items-center">
          <span className="text-sm font-['JetBrains_Mono'] text-gray-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loadingTable}
              className="p-2 border-2 border-black hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              <CaretLeft size={20} weight="bold" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loadingTable}
              className="p-2 border-2 border-black hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              <CaretRight size={20} weight="bold" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

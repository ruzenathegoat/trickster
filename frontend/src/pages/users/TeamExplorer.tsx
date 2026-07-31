import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from '../../lib/axios';
import { Skeleton } from '@/components/ui/skeleton';
import { CaretLeft, CaretRight, MagnifyingGlass } from '@phosphor-icons/react';

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

  if (loadingTop) {
    return (
      <div className="space-y-8 max-w-7xl">
        <div>
          <Skeleton className="h-12 w-64 border-2 border-black mb-4" />
          <Skeleton className="h-6 w-96 border-2 border-black" />
        </div>
        <div className="flex flex-col lg:flex-row gap-12 mt-12">
          <Skeleton className="flex-[2] h-[500px] border-4 border-black shadow-[8px_8px_0px_0px_#111111]" />
          <div className="flex-1 flex flex-col gap-12">
            <Skeleton className="h-60 border-4 border-black shadow-[8px_8px_0px_0px_#111111]" />
            <Skeleton className="h-60 border-4 border-black shadow-[8px_8px_0px_0px_#111111]" />
          </div>
        </div>
      </div>
    );
  }

  const rank1 = topTeams[0];
  const rank2 = topTeams[1];
  const rank3 = topTeams[2];

  return (
    <div className="max-w-7xl pb-16 space-y-16">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      >
        <h1 className="text-5xl lg:text-6xl font-display uppercase tracking-tighter leading-none mb-3">
          Team Explorer
        </h1>
        <p className="font-label text-sm text-gray-500 uppercase tracking-widest">
          Top teams by win rate, Season 2026
        </p>
      </motion.div>

      {/* Top 3 — Asymmetric Layout: Rank 1 poster left, Rank 2/3 stacked right */}
      {topTeams.length >= 3 && (
        <section className="flex flex-col lg:flex-row gap-6">
          {/* Rank 1 — Full-bleed poster */}
          <motion.div
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            animate={{ clipPath: 'inset(0 0% 0 0)' }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            onClick={() => navigate(`/app/teams/${rank1.id}`)}
            className="flex-[2] bg-[var(--color-primary)] border-4 border-black shadow-[12px_12px_0px_rgba(0,0,0,1)] cursor-pointer group relative overflow-hidden min-h-[500px] flex flex-col justify-end"
          >
            {/* Rank tag */}
            <div className="absolute top-6 left-6 bg-black text-[var(--color-primary)] font-display text-4xl px-5 py-2 border-4 border-[var(--color-primary)] z-10">
              #1
            </div>
            {/* Logo center */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity">
              {rank1.logo_url && (
                <img src={rank1.logo_url} alt={rank1.name} className="w-64 h-64 object-contain filter grayscale" />
              )}
            </div>
            {/* Content bottom */}
            <div className="relative z-10 p-8 lg:p-10">
              <h2 className="text-5xl lg:text-7xl font-display uppercase tracking-tighter leading-none text-black mb-4 group-hover:translate-x-2 transition-transform">
                {rank1.name}
              </h2>
              <div className="flex items-end gap-8">
                <div>
                  <span className="font-label text-[11px] font-bold text-black/50 uppercase tracking-widest block mb-1">Region</span>
                  <span className="font-label text-lg font-bold text-black uppercase">{rank1.region}</span>
                </div>
                <div>
                  <span className="font-label text-[11px] font-bold text-black/50 uppercase tracking-widest block mb-1">Win Rate</span>
                  <span className="font-display text-4xl text-black">{rank1.win_rate ?? 0}%</span>
                </div>
                <div>
                  <span className="font-label text-[11px] font-bold text-black/50 uppercase tracking-widest block mb-1">Record</span>
                  <span className="font-numeric text-lg font-bold text-black tabular-nums">{rank1.wins}W - {rank1.losses}L</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Rank 2/3 stacked */}
          <div className="flex-1 flex flex-col gap-6">
            {[rank2, rank3].map((team, i) => (
              <motion.div
                key={team.id}
                initial={{ clipPath: 'inset(0 0 100% 0)' }}
                animate={{ clipPath: 'inset(0 0 0% 0)' }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.15, ease: [0.23, 1, 0.32, 1] }}
                onClick={() => navigate(`/app/teams/${team.id}`)}
                className="flex-1 bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] cursor-pointer group flex items-center gap-6 p-6 hover:bg-black hover:text-white transition-colors relative overflow-hidden"
              >
                {/* Rank */}
                <span className="font-display text-5xl text-gray-200 group-hover:text-white/20 transition-colors shrink-0">
                  #{i + 2}
                </span>
                {/* Logo */}
                <div className="w-16 h-16 border-2 border-black bg-gray-50 group-hover:bg-white/10 flex items-center justify-center shrink-0 overflow-hidden transition-colors">
                  {team.logo_url ? (
                    <img src={team.logo_url} alt={team.name} className="w-12 h-12 object-contain" />
                  ) : (
                    <span className="font-display text-2xl text-gray-300">?</span>
                  )}
                </div>
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-2xl uppercase tracking-tighter truncate group-hover:text-[var(--color-primary)] transition-colors">
                    {team.name}
                  </h3>
                  <div className="flex gap-6 mt-1">
                    <span className="font-label text-[11px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-white/60">{team.region}</span>
                    <span className="font-numeric text-[13px] font-bold tabular-nums text-black group-hover:text-white">{team.win_rate ?? 0}%</span>
                    <span className="font-label text-[11px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-white/40">{team.wins}W-{team.losses}L</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {topTeams.length === 0 && !loadingTop && (
        <div className="py-20 text-center border-4 border-dashed border-black">
          <p className="font-label text-sm text-gray-400 uppercase tracking-widest">Not enough team data available.</p>
        </div>
      )}

      {/* Full Table Section */}
      <section>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-black pb-6 mb-8">
          <h2 className="text-3xl font-display uppercase tracking-tight">All Teams</h2>
          <div className="relative w-full md:w-auto md:min-w-[320px]">
            <MagnifyingGlass weight="bold" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-black" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teams..."
              className="w-full pl-12 pr-4 py-4 border-4 border-black font-label text-[13px] font-bold uppercase tracking-widest bg-white focus:outline-none focus:bg-[var(--color-primary)] transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto border-4 border-black">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b-4 border-black bg-black text-white font-label text-[11px] font-bold uppercase tracking-widest">
                <th className="py-4 px-5 w-[60px]">#</th>
                <th className="py-4 px-5">Team</th>
                <th className="py-4 px-5">Region</th>
                <th className="py-4 px-5 text-center">Record</th>
                <th className="py-4 px-5 text-right">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {loadingTable ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b-2 border-gray-200">
                    <td className="py-4 px-5"><Skeleton className="h-5 w-8" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-5 w-40" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-5 w-20" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-5 w-16 mx-auto" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-5 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : (
                tableTeams.map((team, index) => (
                  <tr
                    key={team.id}
                    onClick={() => navigate(`/app/teams/${team.id}`)}
                    className="border-b-2 border-gray-200 hover:bg-[var(--color-primary)] transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-5 font-numeric font-bold text-gray-300 group-hover:text-black transition-colors">
                      {((page - 1) * 15) + index + 1}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        {team.logo_url ? (
                          <img src={team.logo_url} alt={team.name} className="w-8 h-8 object-contain shrink-0" />
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 border-2 border-black flex items-center justify-center shrink-0">
                            <span className="font-display text-xs text-gray-300">?</span>
                          </div>
                        )}
                        <span className="font-display uppercase text-base group-hover:text-black transition-colors truncate">
                          {team.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-label text-gray-500 text-[11px] uppercase tracking-widest">
                      {team.region}
                    </td>
                    <td className="py-4 px-5 text-center font-numeric text-sm tabular-nums">
                      <span className="font-bold">{team.wins}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="font-bold">{team.losses}</span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      {team.win_rate != null ? (
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-20 h-2 bg-gray-200 overflow-hidden">
                            <motion.div
                              className="h-full bg-black group-hover:bg-black"
                              initial={{ width: 0 }}
                              animate={{ width: `${team.win_rate}%` }}
                              transition={{ duration: 0.6, delay: index * 0.03, ease: [0.23, 1, 0.32, 1] }}
                            />
                          </div>
                          <span className="font-numeric font-bold text-sm tabular-nums w-14 text-right">
                            {team.win_rate}%
                          </span>
                        </div>
                      ) : (
                        <span className="font-label text-gray-400 text-xs">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!loadingTable && tableTeams.length === 0 && (
            <div className="py-16 text-center font-label text-sm text-gray-400 uppercase tracking-widest">
              No teams found.
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
              disabled={page === 1 || loadingTable}
              className="p-3 border-4 border-black bg-white hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-colors active:scale-95"
            >
              <CaretLeft size={20} weight="bold" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loadingTable}
              className="p-3 border-4 border-black bg-white hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-colors active:scale-95"
            >
              <CaretRight size={20} weight="bold" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

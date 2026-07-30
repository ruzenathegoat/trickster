import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from '../../lib/axios';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, ArrowUpRight, Funnel, CaretLeft, CaretRight } from '@phosphor-icons/react';

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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const cardVariants = {
    hidden: { y: 40, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  if (loadingTop) {
    return (
      <div className="space-y-8 max-w-6xl">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-96 w-full rounded-none" />)}
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
              <Trophy weight="fill" className="text-[var(--color-primary)]" />
              Top 3 Players
            </h1>
            <p className="text-gray-600 font-['JetBrains_Mono'] text-sm">Season 2026 \ Highest SMART Ratings</p>
          </div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 pt-6"
        >
          {topPlayers.map((player) => (
            <motion.div
              key={player.id}
              variants={cardVariants}
              onClick={() => navigate(`/app/players/${player.id}`)}
              className="group relative bg-white border-2 border-black p-5 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:-translate-x-1"
              style={{ boxShadow: '6px 6px 0px rgba(0,0,0,1)' }}
              whileHover={{ boxShadow: '12px 12px 0px rgba(0,0,0,1)' }}
            >
              {/* Rank Badge */}
              <div className={`absolute -top-4 -right-4 w-12 h-12 border-2 border-black rounded-full flex items-center justify-center font-['Archivo_Black'] text-xl z-10 ${player.rank === 1 ? 'bg-[var(--color-primary)] text-black' : 'bg-white text-black'}`}>
                #{player.rank}
              </div>

              {/* Photo Container */}
              <div className="aspect-[4/5] w-full border-2 border-black bg-gray-100 overflow-hidden mb-4 relative">
                {player.photo_url ? (
                  <img 
                    src={player.photo_url} 
                    alt={player.ign}
                    className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 group-hover:text-gray-600 transition-colors bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#f3f4f6_10px,#f3f4f6_20px)]">
                    <span className="font-['JetBrains_Mono'] text-xs font-bold uppercase tracking-widest rotate-90">No Photo</span>
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 w-full bg-black text-white px-3 py-2 flex justify-between items-center translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                  <span className="text-xs font-bold uppercase tracking-wider">View Profile</span>
                  <ArrowUpRight size={16} weight="bold" />
                </div>
              </div>

              {/* Info */}
              <div className="space-y-1 text-center border-b-2 border-gray-100 pb-4 mb-4">
                <h2 className="text-3xl font-['Archivo_Black'] uppercase tracking-tighter group-hover:text-[var(--color-primary)] transition-colors">{player.ign}</h2>
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">{player.team_name}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center font-['JetBrains_Mono']">
                <div>
                  <p className="text-[10px] text-[var(--color-primary)] font-black mb-1 tracking-widest">SMART</p>
                  <p className="text-lg font-bold">{player.rating}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 mb-1">ACS</p>
                  <p className="text-lg font-bold">{player.acs}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 mb-1">K/D</p>
                  <p className="text-lg font-bold">{player.kd}</p>
                </div>
              </div>
              
            </motion.div>
          ))}
        </motion.div>
        
        {topPlayers.length === 0 && !loadingTop && (
          <div className="py-20 text-center border-2 border-dashed border-gray-300">
            <p className="text-gray-500 font-['JetBrains_Mono']">Not enough player data available.</p>
          </div>
        )}
      </section>

      {/* Full Leaderboard Table Section */}
      <section className="bg-white border-2 border-black p-6 md:p-8" style={{ boxShadow: '8px 8px 0px rgba(0,0,0,1)' }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 border-b-2 border-black pb-4">
          <h2 className="text-2xl font-['Archivo_Black'] uppercase tracking-tight">Full Leaderboard</h2>
          
          <div className="flex items-center gap-3">
            <Funnel size={20} className="text-gray-400" />
            <div className="flex flex-wrap gap-2">
              {ROLES.map(role => (
                <button
                  key={role}
                  onClick={() => { setRoleFilter(role); setPage(1); }}
                  className={`px-3 py-1 border-2 border-black text-sm font-bold uppercase transition-all ${
                    roleFilter === role 
                      ? 'bg-black text-[var(--color-primary)] shadow-[2px_2px_0px_var(--color-primary)]' 
                      : 'bg-white text-black hover:bg-gray-100 hover:shadow-[2px_2px_0px_black]'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-black text-xs font-bold text-gray-500 uppercase tracking-wider font-['JetBrains_Mono']">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-right">SMART Rating</th>
                <th className="py-3 px-4 text-right">ACS</th>
                <th className="py-3 px-4 text-right">K/D</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loadingTable ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i}>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-8" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="py-4 px-4 text-right"><Skeleton className="h-5 w-12 ml-auto" /></td>
                    <td className="py-4 px-4 text-right"><Skeleton className="h-5 w-12 ml-auto" /></td>
                    <td className="py-4 px-4 text-right"><Skeleton className="h-5 w-12 ml-auto" /></td>
                  </tr>
                ))
              ) : (
                tablePlayers.map((player, index) => (
                  <tr 
                    key={player.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/app/players/${player.id}`)}
                  >
                    <td className="py-4 px-4 font-['JetBrains_Mono'] font-bold text-gray-500">
                      #{((page - 1) * 10) + index + 1}
                    </td>
                    <td className="py-4 px-4 font-['Archivo_Black'] uppercase text-base group-hover:text-[var(--color-primary)] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 border-2 border-black rounded-full overflow-hidden shrink-0 flex items-center justify-center">
                          {player.photo_url ? (
                            <img src={player.photo_url} alt={player.ign} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-400 font-bold text-xs">?</span>
                          )}
                        </div>
                        {player.ign}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-bold text-gray-600 uppercase text-xs tracking-wider">
                      {player.team_name}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-block px-2 py-1 bg-gray-100 border border-gray-300 text-xs font-bold uppercase rounded">
                        {player.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-['JetBrains_Mono'] font-bold text-[var(--color-primary)] text-lg bg-gray-900">
                      {player.rating}
                    </td>
                    <td className="py-4 px-4 text-right font-['JetBrains_Mono'] font-bold text-gray-600">
                      {player.acs}
                    </td>
                    <td className="py-4 px-4 text-right font-['JetBrains_Mono'] font-bold text-gray-600">
                      {player.kd}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {!loadingTable && tablePlayers.length === 0 && (
            <div className="py-12 text-center text-gray-500 font-['JetBrains_Mono']">
              No players found matching the current filters.
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
              disabled={page === 1 || loadingTable}
              className="p-2 border-2 border-black hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors"
            >
              <CaretLeft size={20} weight="bold" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loadingTable}
              className="p-2 border-2 border-black hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white transition-colors"
            >
              <CaretRight size={20} weight="bold" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

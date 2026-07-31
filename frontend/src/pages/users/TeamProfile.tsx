import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../lib/axios';
import { motion } from 'framer-motion';
import Highcharts from 'highcharts';
import { HighchartsReact } from 'highcharts-react-official';
import { ArrowLeft, Star } from '@phosphor-icons/react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '../../contexts/AuthContext';

export default function TeamProfile() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAllMaps, setShowAllMaps] = useState(false);
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        if (user) {
          // Fetch concurrently if user is logged in
          const [teamRes, profRes] = await Promise.all([
            axios.get(`/api/v1/teams/${teamId}`),
            axios.get('/api/v1/user/profile').catch(() => null)
          ]);
          
          setTeam(teamRes.data);
          if (profRes && profRes.data) {
            const favs = profRes.data.user.favorite_teams || [];
            setIsFavorite(favs.some((t: any) => t.id === teamId));
          }
        } else {
          const teamRes = await axios.get(`/api/v1/teams/${teamId}`);
          setTeam(teamRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch team data:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (teamId) fetchData();
  }, [teamId, user]);

  const toggleFavorite = async () => {
    try {
      if (!user) {
        // toast or handle
        return;
      }
      await axios.post(`/api/v1/user/favorites/teams/${teamId}`);
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-32 border-2 border-black" />
        <Skeleton className="h-[400px] w-full border-4 border-black shadow-[8px_8px_0px_0px_#111111]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 border-4 border-black shadow-[8px_8px_0px_0px_#111111]" />
          <Skeleton className="h-96 border-4 border-black shadow-[8px_8px_0px_0px_#111111]" />
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center border-4 border-dashed border-black">
        <h2 className="text-3xl font-display mb-6">Team Not Found</h2>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-black text-white font-label text-sm font-bold uppercase tracking-widest hover:bg-[var(--color-primary)] hover:text-black transition-colors border-4 border-black"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { stats } = team;

  const chartOptions = {
    chart: {
      type: 'column',
      style: { fontFamily: 'JetBrains Mono, monospace' },
      backgroundColor: 'transparent',
    },
    title: { text: null },
    xAxis: {
      categories: stats.tournaments.map((t: any) => t.name),
      lineColor: '#000',
      tickColor: '#000',
      labels: {
        style: { color: '#000', fontWeight: 'bold' }
      }
    },
    yAxis: {
      min: 0,
      title: { text: 'Matches', style: { color: '#000', fontWeight: 'bold' } },
      gridLineDashStyle: 'Dash',
      gridLineColor: '#e5e7eb'
    },
    legend: {
      itemStyle: { fontWeight: 'bold', color: '#000' }
    },
    tooltip: {
      shared: true,
      backgroundColor: '#000',
      style: { color: '#fff' },
      borderColor: '#000',
      borderRadius: 0,
    },
    plotOptions: {
      column: {
        stacking: 'normal',
        borderWidth: 2,
        borderColor: '#000',
      }
    },
    series: [
      {
        name: 'Wins',
        data: stats.tournaments.map((t: any) => t.wins),
        color: 'var(--color-primary)'
      },
      {
        name: 'Losses',
        data: stats.tournaments.map((t: any) => t.losses),
        color: '#ef4444' // red-500
      }
    ],
    credits: { enabled: false }
  };

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-12">
      {/* Back */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate('/app/teams')}
          className="flex items-center gap-2 font-label text-[12px] font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
        >
          <ArrowLeft size={16} weight="bold" />
          Back to Teams
        </button>

        {user && (
          <button 
            onClick={toggleFavorite}
            className={`flex items-center gap-2 font-label text-[11px] font-bold uppercase tracking-widest px-4 py-2 border-2 transition-all ${isFavorite ? 'bg-[var(--color-primary)] border-black shadow-[4px_4px_0px_0px_#111111] text-black hover:translate-y-1 hover:shadow-none' : 'bg-white border-gray-300 text-gray-500 hover:border-black hover:text-black'}`}
          >
            <Star size={16} weight={isFavorite ? 'fill' : 'regular'} />
            {isFavorite ? 'Favorited' : 'Add to Favorites'}
          </button>
        )}
      </div>

      {/* Hero Header — Full-bleed poster style */}
      <motion.section
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: 'inset(0 0% 0 0)' }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="border-4 border-black shadow-[12px_12px_0px_rgba(0,0,0,1)] flex flex-col lg:flex-row overflow-hidden"
      >
        {/* Logo Section */}
        <div className="lg:w-[35%] bg-black flex items-center justify-center p-10 lg:p-12 relative border-b-4 lg:border-b-0 lg:border-r-4 border-black min-h-[280px]">
          {team.logo_url ? (
            <img src={team.logo_url} alt={team.name} className="w-40 h-40 object-contain relative z-10 drop-shadow-2xl" />
          ) : (
            <span className="font-display text-8xl text-white/10">{team.name.charAt(0)}</span>
          )}
        </div>

        {/* Identity + Stats */}
        <div className="lg:w-[65%] bg-[var(--color-primary)] flex flex-col justify-between">
          {/* Name + Region */}
          <div className="p-8 lg:p-10">
            <h1 className="text-5xl lg:text-7xl font-display uppercase tracking-tighter leading-none text-black mb-2">
              {team.name}
            </h1>
            <p className="font-label text-sm text-black/50 uppercase tracking-widest">{team.region}</p>
          </div>

          {/* Stat row — joined cells */}
          <div className="flex border-t-4 border-black">
            <div className="flex-1 p-5 lg:p-6 border-r-4 border-black">
              <span className="font-label text-[10px] text-black/50 uppercase tracking-widest block mb-1">Win Rate</span>
              <span className="font-display text-3xl lg:text-4xl text-black">{team.win_rate ? `${team.win_rate}%` : 'N/A'}</span>
            </div>
            <div className="flex-1 p-5 lg:p-6 border-r-4 border-black">
              <span className="font-label text-[10px] text-black/50 uppercase tracking-widest block mb-1">Matches</span>
              <span className="font-numeric text-3xl lg:text-4xl font-bold text-black tabular-nums">{stats.total_matches}</span>
            </div>
            <div className="flex-1 p-5 lg:p-6 border-r-4 border-black">
              <span className="font-label text-[10px] text-black/50 uppercase tracking-widest block mb-1">Wins</span>
              <span className="font-numeric text-3xl lg:text-4xl font-bold text-black tabular-nums">{stats.total_wins}</span>
            </div>
            <div className="flex-1 p-5 lg:p-6">
              <span className="font-label text-[10px] text-black/50 uppercase tracking-widest block mb-1">Losses</span>
              <span className="font-numeric text-3xl lg:text-4xl font-bold text-black tabular-nums">{stats.total_losses}</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Content Grid — Asymmetric: Chart left (2/3), Roster right (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Tournament Chart + Map Pool */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tournament Performance */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="border-4 border-black bg-white"
          >
            <div className="border-b-4 border-black px-6 py-4">
              <h2 className="text-2xl font-display uppercase tracking-tight">Tournament Performance</h2>
            </div>
            <div className="p-6">
              {stats.tournaments.length > 0 ? (
                <div className="h-96">
                  <HighchartsReact highcharts={Highcharts} options={chartOptions} />
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center font-label text-sm text-gray-400 uppercase tracking-widest border-4 border-dashed border-gray-300">
                  No tournament data available.
                </div>
              )}
            </div>
          </motion.div>

          {/* Map Pool — Horizontal table rows, not identical cards */}
          {team.most_picked_maps && team.most_picked_maps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
              className="border-4 border-black bg-white"
            >
              <div className="border-b-4 border-black px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-display uppercase tracking-tight">Map Pool (2026)</h2>
                {team.most_picked_maps.length > 4 && (
                  <button 
                    onClick={() => setShowAllMaps(!showAllMaps)}
                    className="font-label text-[11px] font-bold uppercase tracking-widest bg-black text-white px-4 py-2 hover:bg-[var(--color-primary)] hover:text-black transition-colors"
                  >
                    {showAllMaps ? 'Show Less' : 'View All'}
                  </button>
                )}
              </div>

              <div className="divide-y-2 divide-gray-200">
                {team.most_picked_maps.slice(0, showAllMaps ? undefined : 4).map((map: any, idx: number) => (
                  <div key={map.name} className="flex items-center gap-4 p-4 hover:bg-[var(--color-primary)] transition-colors group">
                    {/* Map thumbnail */}
                    <div className="w-20 h-14 border-2 border-black bg-black shrink-0 overflow-hidden relative">
                      {map.icon_url ? (
                        <img src={map.icon_url} alt={map.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                      ) : (
                        <span className="flex items-center justify-center w-full h-full font-display text-xs text-white/30">{map.name.charAt(0)}</span>
                      )}
                    </div>
                    {/* Map name */}
                    <div className="flex-1 min-w-0">
                      <span className="font-display text-lg uppercase tracking-tight truncate block">{map.name}</span>
                      <span className="font-label text-[10px] text-gray-400 group-hover:text-black/50 uppercase tracking-widest">{map.count} picks</span>
                    </div>
                    {/* Win rate bar */}
                    <div className="w-32 hidden md:block">
                      <div className="h-2 bg-gray-200 overflow-hidden">
                        <motion.div
                          className="h-full bg-black group-hover:bg-black"
                          initial={{ width: 0 }}
                          animate={{ width: map.percentage }}
                          transition={{ duration: 0.6, delay: idx * 0.05, ease: [0.23, 1, 0.32, 1] }}
                        />
                      </div>
                    </div>
                    {/* Stats */}
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="font-numeric font-bold text-sm tabular-nums">{map.percentage}</span>
                      <span className="font-numeric font-bold text-sm tabular-nums bg-black text-[var(--color-primary)] px-2 py-1 border-2 border-black">WR {map.win_rate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: Roster */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="border-4 border-black bg-white sticky top-24"
          >
            <div className="border-b-4 border-black px-6 py-4 flex justify-between items-center bg-black text-white">
              <h2 className="text-xl font-display uppercase tracking-tight text-[var(--color-primary)]">Active Roster</h2>
              <span className="font-numeric font-bold text-sm tabular-nums bg-[var(--color-primary)] text-black px-2 py-1">
                {team.players?.length || 0}
              </span>
            </div>

            <div className="divide-y-2 divide-gray-200">
              {team.players && team.players.length > 0 ? (
                team.players.map((player: any) => (
                  <div
                    key={player.id}
                    onClick={() => navigate(`/app/players/${player.id}`)}
                    className="flex items-center justify-between p-4 hover:bg-[var(--color-primary)] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 border-2 border-black bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                        {player.photo_url ? (
                          <img src={player.photo_url} alt={player.ign} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-display text-sm text-gray-300">{player.ign?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-display uppercase text-base truncate">{player.ign}</p>
                        <p className="font-label text-[10px] text-gray-400 group-hover:text-black/50 uppercase tracking-widest truncate">{player.name}</p>
                      </div>
                    </div>
                    {player.current_role && (
                      <span className="font-label text-[10px] font-bold uppercase tracking-widest border-2 border-black px-2 py-1 bg-white shrink-0 ml-2">
                        {player.current_role}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="font-label text-sm text-gray-400 text-center py-8 uppercase tracking-widest">No active players found.</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

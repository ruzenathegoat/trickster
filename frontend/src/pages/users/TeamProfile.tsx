import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../lib/axios';
import { motion } from 'framer-motion';
import Highcharts from 'highcharts';
import { HighchartsReact } from 'highcharts-react-official';
import { ArrowLeft, Shield, Trophy, UsersThree, TrendUp, User } from '@phosphor-icons/react';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeamProfile() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAllMaps, setShowAllMaps] = useState(false);

  useEffect(() => {
    if (!teamId) return;
    setLoading(true);
    axios.get(`/api/v1/teams/${teamId}`)
      .then(res => {
        setTeam(res.data);
      })
      .catch(err => {
        console.error('Failed to fetch team data:', err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [teamId]);

  if (loading) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-48 w-full border-2 border-black" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center border-2 border-dashed border-gray-300">
        <h2 className="text-2xl font-['Archivo_Black'] mb-4">Team Not Found</h2>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-black text-white font-['JetBrains_Mono'] font-bold hover:bg-gray-800 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { stats } = team;

  // Chart configuration for Wins/Losses per Tournament
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
    <div className="space-y-12 max-w-6xl mx-auto pb-16">
      {/* Back button */}
      <button
        onClick={() => navigate('/app/teams')}
        className="flex items-center gap-2 text-sm font-['JetBrains_Mono'] font-bold hover:text-[var(--color-primary)] transition-colors"
      >
        <ArrowLeft size={16} weight="bold" />
        Back to Teams
      </button>

      {/* Header Section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border-2 border-black flex flex-col md:flex-row relative"
        style={{ boxShadow: '8px 8px 0px rgba(0,0,0,1)' }}
      >
        {/* Logo area */}
        <div className="md:w-1/3 bg-gray-50 border-b-2 md:border-b-0 md:border-r-2 border-black p-8 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#f9fafb_10px,#f9fafb_20px)] opacity-50" />
          {team.logo_url ? (
            <img src={team.logo_url} alt={team.name} className="w-40 h-40 object-contain relative z-10 drop-shadow-xl" />
          ) : (
            <Shield size={96} weight="fill" className="text-gray-300 relative z-10" />
          )}
        </div>

        {/* Info area */}
        <div className="md:w-2/3 p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-4xl md:text-6xl font-['Archivo_Black'] uppercase tracking-tight">{team.name}</h1>
              {team.win_rate && team.win_rate >= 60 && (
                <div className="hidden md:flex items-center gap-2 bg-[var(--color-primary)] border-2 border-black px-3 py-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  <Trophy size={16} weight="fill" />
                  <span className="text-xs font-bold uppercase tracking-wider">Title Contender</span>
                </div>
              )}
            </div>
            <p className="text-lg text-gray-500 font-bold uppercase tracking-wider">{team.region}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 border-t-2 border-black pt-6">
            <div>
              <p className="text-gray-500 font-['JetBrains_Mono'] text-xs mb-1">Win Rate</p>
              <p className="text-3xl font-['Archivo_Black'] text-[var(--color-primary)]">
                {team.win_rate ? `${team.win_rate}%` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 font-['JetBrains_Mono'] text-xs mb-1">Total Matches</p>
              <p className="text-3xl font-['Archivo_Black']">{stats.total_matches}</p>
            </div>
            <div>
              <p className="text-gray-500 font-['JetBrains_Mono'] text-xs mb-1 text-green-600">Wins</p>
              <p className="text-3xl font-['Archivo_Black']">{stats.total_wins}</p>
            </div>
            <div>
              <p className="text-gray-500 font-['JetBrains_Mono'] text-xs mb-1 text-red-500">Losses</p>
              <p className="text-3xl font-['Archivo_Black']">{stats.total_losses}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Charts */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white border-2 border-black p-6"
            style={{ boxShadow: '6px 6px 0px rgba(0,0,0,1)' }}
          >
            <div className="flex items-center gap-3 border-b-2 border-black pb-4 mb-6">
              <TrendUp size={24} weight="bold" />
              <h2 className="text-2xl font-['Archivo_Black'] uppercase tracking-tight">Tournament Performance</h2>
            </div>

            {stats.tournaments.length > 0 ? (
              <div className="h-80">
                <HighchartsReact highcharts={Highcharts} options={chartOptions} />
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-500 font-['JetBrains_Mono'] border-2 border-dashed border-gray-300">
                No tournament data available.
              </div>
            )}
          </motion.div>

          {/* Map Pool Card */}
          {team.most_picked_maps && team.most_picked_maps.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="bg-white border-2 border-black p-6"
              style={{ boxShadow: '6px 6px 0px rgba(0,0,0,1)' }}
            >
              <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
                <div className="flex items-center gap-3">
                  <Trophy size={24} weight="bold" />
                  <h2 className="text-2xl font-['Archivo_Black'] uppercase tracking-tight">Map Pool (2026)</h2>
                </div>
                {team.most_picked_maps.length > 4 && (
                  <button 
                    onClick={() => setShowAllMaps(!showAllMaps)}
                    className="text-xs font-bold uppercase tracking-wider bg-black text-white px-3 py-1 hover:bg-[var(--color-primary)] hover:text-black transition-colors border-2 border-black"
                  >
                    {showAllMaps ? 'Show Less' : 'View All'}
                  </button>
                )}
              </div>
              <motion.div layout className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                {team.most_picked_maps.slice(0, showAllMaps ? undefined : 4).map((map: any) => (
                  <motion.div layout key={map.name} className="flex flex-col items-center bg-gray-50 border-2 border-black p-3 hover:-translate-y-1 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all relative overflow-hidden group">
                    <div className="w-full h-24 mb-3 relative bg-[var(--color-primary-subtle)] border-2 border-black overflow-hidden flex items-center justify-center">
                      {map.icon_url ? (
                        <img src={map.icon_url} alt={map.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      ) : (
                        <span className="font-['Archivo_Black'] text-xs text-gray-400">NO MAP IMAGE</span>
                      )}

                      {/* Overlay Win Rate */}
                      <div className="absolute top-1 right-1 bg-black text-white px-2 py-0.5 border-2 border-black">
                        <span className="font-['JetBrains_Mono'] font-bold text-[10px] uppercase">WR {map.win_rate}%</span>
                      </div>
                    </div>
                    <span className="font-['Archivo_Black'] text-sm uppercase text-center w-full truncate mb-1" title={map.name}>{map.name}</span>
                    <div className="flex flex-col items-center gap-0.5 w-full">
                      <div className="w-full h-1.5 bg-gray-200 mt-1 mb-1">
                        <div className="h-full bg-[var(--color-primary)]" style={{ width: map.percentage }} />
                      </div>
                      <div className="flex justify-between w-full">
                        <span className="font-['JetBrains_Mono'] font-bold text-gray-800 text-[10px] leading-none">{map.percentage}</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase leading-none">{map.count} picks</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Right Column: Roster */}
        <div className="space-y-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white border-2 border-black p-6"
            style={{ boxShadow: '6px 6px 0px rgba(0,0,0,1)' }}
          >
            <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
              <div className="flex items-center gap-3">
                <UsersThree size={24} weight="bold" />
                <h2 className="text-xl font-['Archivo_Black'] uppercase tracking-tight">Active Roster</h2>
              </div>
              <span className="font-['JetBrains_Mono'] font-bold text-sm bg-gray-100 px-2 py-1 border border-black">
                {team.players?.length || 0}
              </span>
            </div>

            <div className="space-y-3">
              {team.players && team.players.length > 0 ? (
                team.players.map((player: any) => (
                  <div
                    key={player.id}
                    onClick={() => navigate(`/app/players/${player.id}`)}
                    className="flex items-center justify-between p-3 border-2 border-black hover:bg-[var(--color-primary)] hover:text-black transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      {player.photo_url ? (
                        <img src={player.photo_url} alt={player.ign} className="w-10 h-10 object-cover border border-black bg-gray-100" />
                      ) : (
                        <div className="w-10 h-10 border border-black bg-gray-100 flex items-center justify-center">
                          <User size={20} className="text-gray-400 group-hover:text-black/50 transition-colors" />
                        </div>
                      )}
                      <div>
                        <p className="font-['Archivo_Black'] uppercase text-lg group-hover:text-black">{player.ign}</p>
                        <p className="font-['JetBrains_Mono'] text-xs text-gray-500 group-hover:text-black/70">{player.name}</p>
                      </div>
                    </div>
                    {player.current_role && (
                      <span className="text-[10px] font-bold uppercase tracking-wider border border-black px-2 py-1 bg-white">
                        {player.current_role}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm font-['JetBrains_Mono'] text-gray-500 text-center py-4">No active players found.</p>
              )}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

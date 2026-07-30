import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../lib/axios';
import { motion } from 'framer-motion';
import Highcharts from 'highcharts';
import { HighchartsReact } from 'highcharts-react-official';
import 'highcharts/highcharts-more';
import { ArrowLeft, TrendUp, Crosshair, ShieldStar, X } from '@phosphor-icons/react';
import { Skeleton } from '@/components/ui/skeleton';

interface PlayerDetails {
  id: string;
  ign: string;
  name: string;
  country: string | null;
  team_name: string;
  team_logo: string | null;
  photo_url: string | null;
  role: string;
  smart_score: number | null;
  smart_rank: number | null;
  raw_stats: {
    matches: number;
    win_rate: string;
    rating: number;
    acs: number;
    kd: number;
    kast: string;
    adr: number;
  };
  radar_stats: {
    'ACS': number;
    'K/D': number;
    'KAST': number;
    'ADR': number;
    'Adaptability': number;
    'Flexibility': number;
  };
  most_picked_agents: {
    name: string;
    count: number;
    percentage: string;
    icon_url: string;
  }[];
}

export default function PlayerProfile() {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<PlayerDetails | null>(null);
  const [showAllAgents, setShowAllAgents] = useState(false);

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const response = await axios.get(`/api/v1/players/${playerId}`);
        setPlayer(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (playerId) fetchPlayer();
  }, [playerId]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl animate-pulse">
        <div className="h-8 w-24 bg-gray-200" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 h-[600px] bg-gray-200 border-2 border-black" />
          <div className="lg:col-span-8 h-[600px] bg-gray-200 border-2 border-black" />
        </div>
      </div>
    );
  }

  if (!player) {
    return <div className="p-12 text-center border-2 border-dashed border-gray-300">Player not found.</div>;
  }

  const radarOptions: Highcharts.Options = {
    chart: {
      polar: true,
      type: 'area',
      backgroundColor: 'transparent',
      style: {
        fontFamily: "'JetBrains Mono', monospace"
      },
      animation: {
        duration: 1500,
        easing: 'easeOutBounce'
      }
    },
    title: {
      text: undefined
    },
    pane: {
      size: '80%'
    },
    xAxis: {
      categories: Object.keys(player.radar_stats),
      tickmarkPlacement: 'on',
      lineWidth: 0,
      labels: {
        style: {
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#000'
        }
      }
    },
    yAxis: {
      gridLineInterpolation: 'polygon',
      lineWidth: 0,
      min: 0,
      max: 100,
      tickInterval: 20,
      labels: {
        enabled: false
      }
    },
    tooltip: {
      shared: true,
      pointFormat: '<span style="color:{series.color}"><b>{point.y:,.0f}</b> (Normalized Score)<br/>',
      backgroundColor: '#000',
      style: {
        color: '#fff'
      },
      borderWidth: 0,
      borderRadius: 0,
      shadow: false
    },
    legend: {
      enabled: false
    },
    series: [{
      type: 'area',
      name: 'Stats',
      data: Object.values(player.radar_stats),
      pointPlacement: 'on',
      color: 'var(--color-primary)', // Using CSS variable from layout
      fillOpacity: 0.6,
      lineWidth: 3,
      marker: {
        enabled: true,
        fillColor: '#000',
        lineWidth: 2,
        lineColor: '#fff'
      }
    }],
    credits: {
      enabled: false
    },
    plotOptions: {
        series: {
            animation: {
                duration: 2000
            }
        }
    }
  };

  return (
    <div className="max-w-7xl pb-16">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 mb-8 font-['JetBrains_Mono'] text-sm font-bold text-gray-500 hover:text-black transition-colors"
      >
        <ArrowLeft size={16} weight="bold" />
        BACK TO LEADERBOARD
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Identity Card */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="lg:col-span-4"
        >
          <div className="bg-white border-2 border-black overflow-hidden relative group" style={{ boxShadow: '8px 8px 0px rgba(0,0,0,1)' }}>
            <div className="aspect-[3/4] w-full relative bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#f3f4f6_10px,#f3f4f6_20px)] overflow-hidden">
              {player.photo_url ? (
                <img src={player.photo_url} alt={player.ign} className="w-full h-full object-cover filter transition-transform duration-700 hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-['Archivo_Black'] text-3xl text-gray-300 -rotate-90">NO PHOTO</span>
                </div>
              )}
              {player.team_logo && (
                <div className="absolute top-4 right-4 w-16 h-16 bg-white border-2 border-black p-2 rounded-full shadow-[4px_4px_0px_rgba(0,0,0,1)] z-10">
                  <img src={player.team_logo} alt="Team" className="w-full h-full object-contain" />
                </div>
              )}
              {/* Role badge */}
              <div className="absolute bottom-4 left-4 bg-[var(--color-primary)] text-black font-bold px-3 py-1 border-2 border-black text-sm uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                {player.role}
              </div>
            </div>
            
            <div className="p-6 border-t-2 border-black">
              <h1 className="text-4xl font-['Archivo_Black'] uppercase tracking-tighter leading-none mb-1">
                {player.ign}
              </h1>
              <p className="text-gray-500 font-['JetBrains_Mono'] text-sm mb-6">{player.name}</p>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b-2 border-gray-100 pb-2">
                  <span className="text-xs font-bold text-gray-500">COUNTRY</span>
                  <span className="font-['Archivo_Black'] text-lg uppercase">{player.country || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-end border-b-2 border-gray-100 pb-2">
                  <span className="text-xs font-bold text-gray-500">TEAM</span>
                  <span className="font-['Archivo_Black'] text-lg uppercase">{player.team_name}</span>
                </div>
                <div className="flex justify-between items-end border-b-2 border-gray-100 pb-2">
                  <span className="text-xs font-bold text-gray-500">SMART RANK</span>
                  <span className="font-['Archivo_Black'] text-[var(--color-primary)] text-2xl leading-none">
                    {player.smart_rank ? `#${player.smart_rank}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-end border-b-2 border-gray-100 pb-2">
                  <span className="text-xs font-bold text-gray-500">WIN RATE</span>
                  <span className="font-['JetBrains_Mono'] font-bold">{player.raw_stats.win_rate}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-gray-500">MATCHES (2026)</span>
                  <span className="font-['JetBrains_Mono'] font-bold">{player.raw_stats.matches}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Stats & Radar */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', damping: 20, delay: 0.1 }}
          className="lg:col-span-8 flex flex-col gap-8"
        >
          {/* Radar Chart Container */}
          <div className="bg-white border-2 border-black p-6 h-[400px] flex flex-col relative" style={{ boxShadow: '8px 8px 0px rgba(0,0,0,1)' }}>
            <h2 className="text-xl font-['Archivo_Black'] uppercase mb-2 border-b-2 border-black pb-2 inline-block self-start">
              Performance Profile (2026)
            </h2>
            <div className="flex-1 w-full relative">
                <div className="absolute inset-0 pt-4">
                    <HighchartsReact highcharts={Highcharts} options={radarOptions} containerProps={{ style: { height: '100%' } }} />
                </div>
            </div>
          </div>

          {/* Raw Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Rating" value={player.raw_stats.rating} icon={<ShieldStar size={24} />} delay={0.2} />
            <StatCard label="ACS" value={player.raw_stats.acs} icon={<Crosshair size={24} />} delay={0.3} />
            <StatCard label="K/D" value={player.raw_stats.kd} icon={<TrendUp size={24} />} delay={0.4} />
            <StatCard label="ADR" value={player.raw_stats.adr} delay={0.5} />
          </div>

          {/* Agent Pool Card */}
          {player.most_picked_agents && player.most_picked_agents.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white border-2 border-black p-6"
              style={{ boxShadow: '8px 8px 0px rgba(0,0,0,1)' }}
            >
              <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
                <h2 className="text-xl font-['Archivo_Black'] uppercase">
                  Agent Pool (2026)
                </h2>
                {player.most_picked_agents.length > 3 && (
                  <button 
                    onClick={() => setShowAllAgents(!showAllAgents)}
                    className="text-xs font-bold uppercase tracking-wider bg-black text-white px-3 py-1 hover:bg-[var(--color-primary)] hover:text-black transition-colors border-2 border-black"
                  >
                    {showAllAgents ? 'Show Less' : 'View All'}
                  </button>
                )}
              </div>
              <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-2">
                {player.most_picked_agents.slice(0, showAllAgents ? undefined : 3).map((agent) => (
                  <motion.div layout key={agent.name} className="flex flex-col items-center bg-gray-50 border-2 border-black p-3 hover:-translate-y-1 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all">
                    <div className="w-16 h-16 mb-3 relative bg-[var(--color-primary-subtle)] rounded-full border-2 border-black overflow-hidden flex items-center justify-center">
                      {agent.icon_url ? (
                        <img src={agent.icon_url} alt={agent.name} className="w-full h-full object-cover scale-110" />
                      ) : (
                        <span className="font-['Archivo_Black'] text-xs text-gray-400">?</span>
                      )}
                    </div>
                    <span className="font-['Archivo_Black'] text-sm uppercase text-center w-full truncate mb-1" title={agent.name}>{agent.name}</span>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-['JetBrains_Mono'] font-bold text-[var(--color-primary)] text-sm leading-none">{agent.percentage}</span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase leading-none">{agent.count} picks</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, delay }: { label: string, value: string | number, icon?: React.ReactNode, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white border-2 border-black p-4 flex flex-col justify-between"
      style={{ boxShadow: '4px 4px 0px rgba(0,0,0,1)' }}
      whileHover={{ y: -4, boxShadow: '8px 8px 0px rgba(0,0,0,1)', transition: { duration: 0.2 } }}
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <span className="text-3xl font-['Archivo_Black']">{value}</span>
    </motion.div>
  );
}

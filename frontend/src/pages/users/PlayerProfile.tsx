import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../lib/axios';
import { motion } from 'framer-motion';
import Highcharts from 'highcharts';
import { HighchartsReact } from 'highcharts-react-official';
import 'highcharts/highcharts-more';
import { ArrowLeft } from '@phosphor-icons/react';
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
      <div className="space-y-8 max-w-7xl pb-24">
        <Skeleton className="h-6 w-48 bg-gray-200" />
        <div className="flex flex-col lg:flex-row gap-12">
          <Skeleton className="w-full lg:w-[400px] h-[800px] border-4 border-black bg-gray-100 shrink-0" />
          <div className="flex-1 space-y-12">
            <Skeleton className="h-96 w-full border-4 border-black bg-gray-50" />
            <Skeleton className="h-48 w-full border-t-4 border-black bg-gray-50" />
            <Skeleton className="h-48 w-full border-t-4 border-black bg-gray-50" />
          </div>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="py-32 flex justify-center border-4 border-black bg-white">
        <p className="font-label font-bold text-xl uppercase tracking-widest text-black">Player not found.</p>
      </div>
    );
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
        duration: 1000,
        easing: 'easeOutExpo'
      }
    },
    title: {
      text: undefined
    },
    pane: {
      size: '85%'
    },
    xAxis: {
      categories: Object.keys(player.radar_stats),
      tickmarkPlacement: 'on',
      lineWidth: 0,
      labels: {
        style: {
          fontSize: '12px',
          fontWeight: '900',
          color: '#000',
          textTransform: 'uppercase'
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
      pointFormat: '<span style="color:#000"><b>{point.y:,.0f}</b><br/>',
      backgroundColor: '#fff',
      borderColor: '#000',
      borderWidth: 2,
      style: {
        color: '#000',
        fontWeight: 'bold'
      },
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
      color: 'var(--color-primary)', 
      fillOpacity: 1,
      lineWidth: 4,
      lineColor: '#000',
      marker: {
        enabled: true,
        fillColor: 'var(--color-primary)',
        lineWidth: 3,
        lineColor: '#000',
        radius: 5
      }
    }],
    credits: {
      enabled: false
    },
    plotOptions: {
        series: {
            animation: {
                duration: 1200
            }
        }
    }
  };

  return (
    <div className="max-w-7xl pb-24">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-3 mb-12 font-label text-[13px] font-black uppercase tracking-widest text-black/50 hover:text-black transition-colors"
      >
        <ArrowLeft size={20} weight="bold" />
        Back to Leaderboard
      </button>

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        
        {/* Left Column: Identity Poster */}
        <motion.div 
          initial={{ clipPath: 'inset(100% 0 0 0)' }}
          animate={{ clipPath: 'inset(0% 0 0 0)' }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="w-full lg:w-[420px] shrink-0"
        >
          <div className="bg-[var(--color-primary)] border-4 border-black overflow-hidden relative shadow-[12px_12px_0px_rgba(0,0,0,1)] flex flex-col min-h-[700px]">
            {/* Massive Role Badge absolute */}
            <div className="absolute top-6 -right-6 bg-black text-[var(--color-primary)] font-black px-6 py-2 border-4 border-[var(--color-primary)] text-lg uppercase tracking-widest rotate-6 z-20">
              {player.role}
            </div>

            {/* Photo section */}
            <div className="relative flex-1 bg-white border-b-4 border-black overflow-hidden min-h-[400px]">
              {player.photo_url ? (
                <img 
                  src={player.photo_url} 
                  alt={player.ign} 
                  className="absolute inset-0 w-full h-full object-cover object-top filter grayscale contrast-125 hover:grayscale-0 transition-all duration-700 hover:scale-105" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#f3f4f6_10px,#f3f4f6_20px)]">
                  <span className="font-display text-4xl text-gray-300 -rotate-90">NO PHOTO</span>
                </div>
              )}
            </div>
            
            {/* Text block */}
            <div className="p-8 md:p-10 z-10 bg-[var(--color-primary)] relative">
              <div className="flex items-center gap-4 mb-4">
                {player.team_logo ? (
                  <div className="w-10 h-10 bg-white border-2 border-black rounded-full p-1.5 flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    <img src={player.team_logo} alt="Team" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-3 h-3 bg-black rounded-full" />
                )}
                <span className="font-label text-sm font-bold uppercase tracking-widest text-black">
                  {player.team_name}
                </span>
              </div>

              <h1 className="text-6xl lg:text-7xl font-display uppercase tracking-tighter leading-none mb-2 text-black break-words">
                {player.ign}
              </h1>
              <p className="text-black/60 font-label text-[15px] font-bold uppercase tracking-widest mb-10">
                {player.name}
              </p>
              
              <div className="space-y-6">
                <div className="flex justify-between items-end border-b-2 border-black/20 pb-2">
                  <span className="text-[11px] font-black text-black/50 uppercase tracking-widest">Country</span>
                  <span className="font-label font-bold text-[15px] text-black uppercase">{player.country || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-end border-b-2 border-black/20 pb-2">
                  <span className="text-[11px] font-black text-black/50 uppercase tracking-widest">Matches (2026)</span>
                  <span className="font-numeric font-black text-[15px] text-black tabular-nums">{player.raw_stats.matches}</span>
                </div>
                <div className="flex justify-between items-end border-b-2 border-black/20 pb-2">
                  <span className="text-[11px] font-black text-black/50 uppercase tracking-widest">Win Rate</span>
                  <span className="font-numeric font-black text-[15px] text-black tabular-nums">{player.raw_stats.win_rate}</span>
                </div>
                <div className="flex justify-between items-end pt-2">
                  <span className="text-[11px] font-black text-black uppercase tracking-widest">SMART Rank</span>
                  <span className="font-display text-black text-4xl leading-none">
                    {player.smart_rank ? `#${player.smart_rank}` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Stats & Radar */}
        <div className="flex-1 flex flex-col gap-16 pt-4">
          
          {/* Typographic Raw Stats Block (No Cards) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <h2 className="text-3xl font-display uppercase tracking-tight text-black border-b-4 border-black pb-4 mb-6">
              Performance Metrics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-6 lg:gap-8">
              <div className="flex flex-col border-l-4 border-black pl-4">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Rating</span>
                <span className="text-3xl lg:text-4xl font-display text-black tabular-nums tracking-tighter">{player.raw_stats.rating}</span>
              </div>
              <div className="flex flex-col border-l-4 border-black pl-4">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">ACS</span>
                <span className="text-3xl lg:text-4xl font-display text-black tabular-nums tracking-tighter">{player.raw_stats.acs}</span>
              </div>
              <div className="flex flex-col border-l-4 border-black pl-4">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">K/D Ratio</span>
                <span className="text-3xl lg:text-4xl font-display text-black tabular-nums tracking-tighter">{player.raw_stats.kd}</span>
              </div>
              <div className="flex flex-col border-l-4 border-black pl-4">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">ADR</span>
                <span className="text-3xl lg:text-4xl font-display text-black tabular-nums tracking-tighter">{player.raw_stats.adr}</span>
              </div>
            </div>
          </motion.div>

          {/* Radar Chart Container */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col"
          >
            <h2 className="text-3xl font-display uppercase tracking-tight text-black border-b-4 border-black pb-4 mb-8">
              SMART Radar (2026)
            </h2>
            <div className="w-full h-[500px] relative bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.02)_10px,rgba(0,0,0,0.02)_20px)] border-4 border-black">
                <div className="absolute inset-0 p-4">
                    <HighchartsReact highcharts={Highcharts} options={radarOptions} containerProps={{ style: { height: '100%' } }} />
                </div>
            </div>
          </motion.div>

          {/* Agent Pool */}
          {player.most_picked_agents && player.most_picked_agents.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col"
            >
              <div className="flex justify-between items-end border-b-4 border-black pb-4 mb-6">
                <h2 className="text-3xl font-display uppercase tracking-tight text-black">
                  Agent Pool
                </h2>
                {player.most_picked_agents.length > 4 && (
                  <button 
                    onClick={() => setShowAllAgents(!showAllAgents)}
                    className="text-[12px] font-black uppercase tracking-widest bg-black text-white px-4 py-2 hover:bg-[var(--color-primary)] hover:text-black transition-colors active:scale-95"
                  >
                    {showAllAgents ? 'Show Less' : 'View All'}
                  </button>
                )}
              </div>
              <motion.div layout className="flex flex-wrap gap-4 mt-4">
                {player.most_picked_agents.slice(0, showAllAgents ? undefined : 4).map((agent, index) => (
                  <motion.div 
                    layout 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.5 + index * 0.05, ease: [0.23, 1, 0.32, 1] }}
                    key={agent.name} 
                    className="flex items-center gap-4 border-2 border-black p-3 pr-6 bg-white hover:bg-black hover:text-white group transition-colors duration-200 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-0 hover:translate-y-1 hover:translate-x-1"
                  >
                    <div className="w-16 h-16 bg-[var(--color-primary)] border-2 border-black rounded-full overflow-hidden flex items-center justify-center shrink-0">
                      {agent.icon_url ? (
                        <img src={agent.icon_url} alt={agent.name} className="w-full h-full object-cover scale-110 filter grayscale group-hover:grayscale-0 transition-all duration-300" />
                      ) : (
                        <span className="font-display text-xl text-black">?</span>
                      )}
                    </div>
                    <div className="flex flex-col justify-center min-w-[80px]">
                      <span className="font-display text-lg uppercase tracking-wide leading-tight group-hover:text-[var(--color-primary)] transition-colors">
                        {agent.name}
                      </span>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="font-numeric font-black text-black group-hover:text-white transition-colors text-sm tabular-nums">
                          {agent.percentage}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-gray-600" />
                        <span className="font-label font-bold text-gray-500 text-[11px] uppercase tracking-widest">
                          {agent.count} picks
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

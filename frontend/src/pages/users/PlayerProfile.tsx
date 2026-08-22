import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../lib/axios';
import { motion } from 'framer-motion';
import Highcharts from 'highcharts';
import { HighchartsReact } from 'highcharts-react-official';
import 'highcharts/highcharts-more';
import { ArrowLeft, Star } from '@phosphor-icons/react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

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
  smart_status: 'verified' | 'provisional' | null;
  smart_confidence: number | null;
  smart_rank_history?: { date: string; rank: number }[];
  rank_shift?: string;
  raw_stats: {
    matches: number;
    win_rate: string;
    rating: number;
    acs: number;
    kd: number;
    kast: string;
    adr: number;
  };
  consistency: {
    value: number | null;
    provisional_value: number | null;
    eligible: boolean;
    sample_size: number;
    minimum_sample_size: number;
    event_count: number;
    minimum_event_count: number;
    method: string | null;
    calculated_at: string | null;
  };
  radar_stats: {
    'ACS': number;
    'K/D': number;
    'KAST': number;
    'ADR': number;
    'Consistency'?: number;
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
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('30d');

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        // Caching Layer 1: Check Session Storage first
        const cacheKey = `trickster_player_profile_smart_provisional_v1_${playerId}`;
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            if (parsed && parsed.radar_stats) {
              setPlayer(parsed);
              setLoading(false);
              // Still fetch profile in background if user is logged in to check favorites
              if (user) {
                axios.get('/api/v1/user/profile').then(profRes => {
                  const favs = profRes.data.user.favorite_players || [];
                  setIsFavorite(favs.some((p: any) => p.id === playerId));
                }).catch(() => null);
              }
              return;
            }
          } catch (e) {
            // ignore invalid cache
          }
        }

        if (user) {
          // Fetch concurrently if user is logged in to avoid waterfall
          const [playerRes, profRes] = await Promise.all([
            axios.get(`/api/v1/players/${playerId}`),
            axios.get('/api/v1/user/profile').catch(() => null)
          ]);
          
          setPlayer(playerRes.data);
          sessionStorage.setItem(cacheKey, JSON.stringify(playerRes.data));

          if (profRes && profRes.data) {
            const favs = profRes.data.user.favorite_players || [];
            setIsFavorite(favs.some((p: any) => p.id === playerId));
          }
        } else {
          const response = await axios.get(`/api/v1/players/${playerId}`);
          setPlayer(response.data);
          sessionStorage.setItem(cacheKey, JSON.stringify(response.data));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (playerId) fetchPlayer();
  }, [playerId, user]);

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('You must be logged in to favorite players');
      return;
    }
    try {
      await axios.post(`/api/v1/user/favorites/players/${playerId}`);
      setIsFavorite(!isFavorite);
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      toast.error('Failed to update favorite status');
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 max-w-7xl pb-24">
        <Skeleton className="h-6 w-48 border-2 border-theme-border" />
        <div className="flex flex-col lg:flex-row gap-12">
          <Skeleton className="w-full lg:w-[400px] h-[500px] md:h-[800px] border-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] shrink-0" />
          <div className="flex-1 space-y-12">
            <Skeleton className="h-96 w-full border-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]" />
            <Skeleton className="h-48 w-full border-t-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]" />
            <Skeleton className="h-48 w-full border-t-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]" />
          </div>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="py-32 flex justify-center border-4 border-theme-border bg-theme-bg">
        <p className="font-label font-bold text-xl uppercase tracking-widest text-theme-text">Player not found.</p>
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

  const getFilteredRankHistory = () => {
    const raw = player?.smart_rank_history || [];
    if (raw.length === 0) return [];
    if (timeframe === '24h') return raw.slice(-2);
    if (timeframe === '7d') return raw.slice(-7);
    return raw.slice(-30);
  };

  const displayedHistory = getFilteredRankHistory();
  const startRank = displayedHistory[0]?.rank;
  const endRank = displayedHistory[displayedHistory.length - 1]?.rank;
  const rankDelta = (startRank !== undefined && endRank !== undefined && displayedHistory.length > 1) ? (startRank - endRank) : 0;

  const ranks = displayedHistory.map(h => h.rank);
  const minRank = ranks.length > 0 ? Math.min(...ranks) : 1;
  const maxRank = ranks.length > 0 ? Math.max(...ranks) : 100;
  const rankRange = maxRank - minRank;
  const rankPadding = Math.max(3, Math.ceil(rankRange * 0.12));
  const yAxisMin = Math.max(1, minRank - rankPadding);
  const yAxisMax = maxRank + rankPadding;

  const growthOptions: Highcharts.Options | undefined = displayedHistory && displayedHistory.length > 0 ? {
    chart: {
      type: 'spline',
      backgroundColor: 'transparent',
      style: { fontFamily: "'JetBrains Mono', monospace" },
      spacingTop: 15,
      spacingBottom: 15,
      spacingLeft: 10,
      spacingRight: 15
    },
    title: { text: undefined },
    xAxis: {
      categories: displayedHistory.map(h => {
          const parts = h.date.split('-');
          if (parts.length === 3) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]}`;
          }
          return h.date;
      }),
      labels: { style: { fontSize: '11px', fontWeight: 'bold' } },
      tickInterval: timeframe === '24h' ? 1 : Math.max(1, Math.ceil(displayedHistory.length / 7)),
      offset: 5
    },
    yAxis: {
      reversed: true,
      min: yAxisMin,
      max: yAxisMax,
      startOnTick: false,
      endOnTick: false,
      title: { text: 'Rank', style: { fontWeight: 'bold', textTransform: 'uppercase' } },
      allowDecimals: false,
      gridLineDashStyle: 'Dash',
      gridLineColor: '#eaeaea',
      labels: { style: { fontWeight: 'bold', fontSize: '12px' } }
    },
    tooltip: {
      formatter: function() {
          const pointIndex = (this as any).point?.index ?? 0;
          const rawItem = displayedHistory[pointIndex];
          const fullDate = rawItem?.date || this.x;
          return `<div style="padding: 4px;">
            <span style="font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:1px;font-weight:bold;">Snapshot: ${fullDate}</span><br/>
            <span style="font-size:15px;font-weight:900;color:var(--color-primary, #FFEB00)">Rank #${this.y}</span>
          </div>`;
      },
      useHTML: true,
      backgroundColor: '#111',
      style: { color: '#fff', fontWeight: 'bold' },
      borderWidth: 0,
      borderRadius: 0,
      shadow: false
    },
    legend: { enabled: false },
    credits: { enabled: false },
    plotOptions: {
      spline: {
        clip: false,
        lineWidth: 4,
        marker: { 
          enabled: true, 
          radius: displayedHistory.length > 15 ? 3 : 5, 
          fillColor: 'var(--color-primary)', 
          lineWidth: 2, 
          lineColor: '#000',
          states: { hover: { enabled: true, radius: 7 } } 
        },
        color: 'var(--color-primary)'
      }
    },
    series: [{
      type: 'spline',
      name: 'Rank',
      data: displayedHistory.map(h => h.rank)
    }]
  } : undefined;

  return (
    <div className="max-w-7xl pb-24">
      <div className="flex justify-between items-center mb-12">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-3 font-label text-[13px] font-black uppercase tracking-widest text-theme-text/50 hover:text-theme-text transition-colors"
        >
          <ArrowLeft size={20} weight="bold" />
          Back to Leaderboard
        </button>

        {user && (
          <button 
            onClick={toggleFavorite}
            className={`flex items-center gap-2 font-label text-[13px] font-black uppercase tracking-widest px-4 py-2 border-2 transition-all ${isFavorite ? 'bg-[var(--color-primary)] border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] text-black hover:translate-y-1 hover:shadow-none' : 'bg-theme-bg border-gray-300 text-gray-500 hover:border-theme-border hover:text-black'}`}
          >
            <Star size={20} weight={isFavorite ? 'fill' : 'regular'} />
            {isFavorite ? 'Favorited' : 'Add to Favorites'}
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        
        {/* Left Column: Identity Poster */}
        <motion.div 
          initial={{ clipPath: 'inset(100% 0 0 0)' }}
          animate={{ clipPath: 'inset(0% 0 0 0)' }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="w-full lg:w-[420px] shrink-0"
        >
          <div className="bg-[var(--color-primary)] border-4 border-theme-border overflow-hidden relative shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] md:shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] flex flex-col min-h-[500px] md:min-h-[700px]">
            {/* Massive Role Badge absolute */}
            <div className="absolute top-6 right-6 bg-black text-[var(--color-primary)] font-black px-6 py-2 border-4 border-[var(--color-primary)] text-lg uppercase tracking-widest z-20">
              {player.role}
            </div>

            {/* Photo section */}
            <div className="relative flex-1 bg-white border-b-4 border-theme-border overflow-hidden min-h-[300px] md:min-h-[350px] flex items-end justify-center pt-8">
              {player.photo_url ? (
                <img 
                  src={player.photo_url} 
                  alt={player.ign} 
                  className="w-auto h-[250px] md:h-[300px] object-cover object-bottom transition-transform duration-700 hover:scale-105 filter contrast-125" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center min-h-[250px]">
                  <span className="font-display text-4xl text-white/20 -rotate-90">NO PHOTO</span>
                </div>
              )}
            </div>
            
            {/* Text block */}
            <div className="p-8 md:p-10 z-10 bg-[var(--color-primary)] relative">
              <div className="flex items-center gap-4 mb-4">
                {player.team_logo ? (
                  <div className="w-10 h-10 bg-theme-bg border-2 border-theme-border rounded-full p-1.5 flex items-center justify-center shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]">
                    <img src={player.team_logo} alt="Team" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-3 h-3 bg-black rounded-full" />
                )}
                <span className="font-label text-sm font-bold uppercase tracking-widest text-theme-text">
                  {player.team_name}
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display uppercase tracking-tighter leading-none mb-2 text-theme-text break-words">
                {player.ign}
              </h1>
              <p className="text-theme-text/60 font-label text-[15px] font-bold uppercase tracking-widest mb-10">
                {player.name}
              </p>
              
              <div className="space-y-6">
                <div className="flex justify-between items-end border-b-2 border-theme-border/20 pb-2">
                  <span className="text-[11px] font-black text-theme-text/50 uppercase tracking-widest">Country</span>
                  {player.country ? (
                    <img 
                      src={`https://flagcdn.com/w40/${player.country.toLowerCase()}.png`}
                      alt={player.country}
                      className="h-[18px] object-cover border border-theme-border/20 shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]"
                      title={player.country.toUpperCase()}
                    />
                  ) : (
                    <span className="font-label font-bold text-[15px] text-theme-text uppercase">Unknown</span>
                  )}
                </div>
                <div className="flex justify-between items-end border-b-2 border-theme-border/20 pb-2">
                  <span className="text-[11px] font-black text-theme-text/50 uppercase tracking-widest">Matches (2026)</span>
                  <span className="font-numeric font-black text-[15px] text-theme-text tabular-nums">{player.raw_stats.matches}</span>
                </div>
                <div className="flex justify-between items-end border-b-2 border-theme-border/20 pb-2">
                  <span className="text-[11px] font-black text-theme-text/50 uppercase tracking-widest">Win Rate</span>
                  <span className="font-numeric font-black text-[15px] text-theme-text tabular-nums">{player.raw_stats.win_rate}</span>
                </div>
                <div className="flex justify-between items-end border-b-2 border-theme-border/20 pb-2">
                  <span className="text-[11px] font-black text-theme-text/50 uppercase tracking-widest">Consistency</span>
                  <span className="font-numeric font-black text-[15px] text-theme-text tabular-nums">
                    {player.consistency?.eligible && player.consistency.value !== null
                      ? player.consistency.value.toFixed(2)
                      : (player.consistency?.sample_size ?? 0) < (player.consistency?.minimum_sample_size ?? 20)
                        ? `Provisional ${player.consistency?.sample_size ?? 0}/${player.consistency?.minimum_sample_size ?? 20} matches`
                        : `Provisional ${player.consistency?.event_count ?? 0}/${player.consistency?.minimum_event_count ?? 2} events`}
                  </span>
                </div>
                <div className="flex justify-between items-end pt-2">
                  <span className="text-[11px] font-black text-theme-text uppercase tracking-widest">
                    {player.smart_status === 'provisional' ? 'SMART Score' : 'SMART Rank'}
                  </span>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-theme-text text-4xl leading-none">
                        {player.smart_status === 'provisional'
                          ? (player.smart_score?.toFixed(1) ?? 'N/A')
                          : (player.smart_rank ? `#${player.smart_rank}` : 'N/A')}
                      </span>
                      {player.smart_status !== 'provisional' && player.rank_shift && player.rank_shift !== '0' && (
                        <span className={`font-numeric font-bold text-[16px] ${player.rank_shift.startsWith('+') ? 'text-[#00E676]' : 'text-[#FF3366]'}`}>
                          {player.rank_shift}
                        </span>
                      )}
                    </div>
                    {player.smart_status === 'provisional' && (
                      <span className="font-label text-[9px] font-bold uppercase tracking-widest text-theme-text/50">
                        Provisional · {Math.round((player.smart_confidence ?? 0) * 100)}% confidence
                      </span>
                    )}
                  </div>
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
            <h2 className="text-2xl md:text-3xl font-display uppercase tracking-tight text-theme-text border-b-4 border-theme-border pb-4 mb-6">
              Performance Metrics
            </h2>
            <div className="flex flex-wrap gap-6 md:gap-8 lg:gap-12">
              <div className="flex-1 min-w-[110px] flex flex-col justify-between">
                <span className="text-[10px] md:text-[11px] font-black text-theme-text/60 uppercase tracking-widest mb-2 whitespace-nowrap">Rating</span>
                <span className="text-3xl sm:text-4xl lg:text-5xl font-display text-theme-text tracking-tight leading-none">{player.raw_stats.rating}</span>
              </div>
              <div className="flex-1 min-w-[110px] flex flex-col justify-between">
                <span className="text-[10px] md:text-[11px] font-black text-theme-text/60 uppercase tracking-widest mb-2 whitespace-nowrap">ACS</span>
                <span className="text-3xl sm:text-4xl lg:text-5xl font-display text-theme-text tracking-tight leading-none">{player.raw_stats.acs}</span>
              </div>
              <div className="flex-1 min-w-[110px] flex flex-col justify-between">
                <span className="text-[10px] md:text-[11px] font-black text-theme-text/60 uppercase tracking-widest mb-2 whitespace-nowrap">K/D Ratio</span>
                <span className="text-3xl sm:text-4xl lg:text-5xl font-display text-theme-text tracking-tight leading-none">{player.raw_stats.kd}</span>
              </div>
              <div className="flex-1 min-w-[110px] flex flex-col justify-between">
                <span className="text-[10px] md:text-[11px] font-black text-theme-text/60 uppercase tracking-widest mb-2 whitespace-nowrap">ADR</span>
                <span className="text-3xl sm:text-4xl lg:text-5xl font-display text-theme-text tracking-tight leading-none">{player.raw_stats.adr}</span>
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
            <h2 className="text-2xl md:text-3xl font-display uppercase tracking-tight text-theme-text border-b-4 border-theme-border pb-4 mb-8">
              SMART Radar (2026)
            </h2>
            <div className="w-full h-[350px] md:h-[500px] relative bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.02)_10px,rgba(0,0,0,0.02)_20px)] border-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] md:shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]">
                <div className="absolute inset-0 p-4">
                    <HighchartsReact highcharts={Highcharts} options={radarOptions} containerProps={{ style: { height: '100%' } }} />
                </div>
            </div>
          </motion.div>

          {/* Growth Chart Container */}
          {player.smart_rank_history && player.smart_rank_history.length > 0 && growthOptions && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-4 border-theme-border pb-4 mb-8 gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-display uppercase tracking-tight text-theme-text mb-2">
                    SMART Rank Snapshot History
                  </h2>
                  <div className="flex items-center flex-wrap gap-2 text-xs font-label">
                    <span className="font-bold text-gray-500 uppercase tracking-wider">
                      {timeframe === '24h' ? '24h' : timeframe === '7d' ? '7d' : '30d'}, changes :
                    </span>
                    <span className={`font-numeric font-black px-2 py-0.5 border-2 border-theme-border text-xs ${
                      rankDelta > 0 
                        ? 'bg-[#00E676] text-black shadow-[2px_2px_0px_0px_var(--color-theme-shadow)]' 
                        : rankDelta < 0 
                        ? 'bg-[#FF3366] text-white shadow-[2px_2px_0px_0px_var(--color-theme-shadow)]' 
                        : 'bg-gray-200 text-black'
                    }`}>
                      {rankDelta > 0 ? `+${rankDelta}` : rankDelta < 0 ? `${rankDelta}` : '0'}
                    </span>
                    {displayedHistory.length > 1 && (
                      <span className="text-gray-400 font-numeric font-bold">
                        (#{startRank} &rarr; #{endRank})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex border-2 border-theme-border bg-theme-bg p-0.5 shadow-[2px_2px_0px_0px_var(--color-theme-shadow)]">
                    {(['24h', '7d', '30d'] as const).map(tf => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-3 py-1 font-label text-xs font-black uppercase tracking-wider transition-all ${
                          timeframe === tf 
                            ? 'bg-black text-[var(--color-primary)] shadow-[2px_2px_0px_0px_var(--color-theme-shadow)]' 
                            : 'text-gray-500 hover:text-black hover:bg-gray-100'
                        }`}
                      >
                        {tf === '24h' ? '24 Hour' : tf.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <span className="font-label font-bold text-xs uppercase tracking-widest bg-black text-[var(--color-primary)] px-3 py-1.5 border-2 border-theme-border hidden lg:inline-block">
                    {displayedHistory[0]?.date} &rarr; {displayedHistory[displayedHistory.length - 1]?.date}
                  </span>
                </div>
              </div>
              <div className="w-full h-[250px] md:h-[350px] relative bg-theme-bg border-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] md:shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]">
                  <div className="absolute inset-0 p-4">
                      <HighchartsReact highcharts={Highcharts} options={growthOptions} containerProps={{ style: { height: '100%' } }} />
                  </div>
              </div>
            </motion.div>
          )}

          {/* Agent Pool */}
          {player.most_picked_agents && player.most_picked_agents.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col"
            >
              <div className="flex justify-between items-end border-b-4 border-theme-border pb-4 mb-6">
                <h2 className="text-2xl md:text-3xl font-display uppercase tracking-tight text-theme-text">
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
                    className="flex items-center gap-4 border-2 border-theme-border p-3 pr-6 bg-theme-bg hover:bg-black hover:text-white group transition-colors duration-200 shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] hover:shadow-none translate-y-0 hover:translate-y-1 hover:translate-x-1"
                  >
                    <div className="w-16 h-16 bg-[var(--color-primary)] border-2 border-theme-border rounded-full overflow-hidden flex items-center justify-center shrink-0">
                      {agent.icon_url ? (
                        <img src={agent.icon_url} alt={agent.name} className="w-full h-full object-cover scale-110 filter grayscale group-hover:grayscale-0 transition-all duration-300" />
                      ) : (
                        <span className="font-display text-xl text-theme-text">?</span>
                      )}
                    </div>
                    <div className="flex flex-col justify-center min-w-[80px]">
                      <span className="font-display text-lg uppercase tracking-wide leading-tight group-hover:text-[var(--color-primary)] transition-colors">
                        {agent.name}
                      </span>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="font-numeric font-black text-theme-text group-hover:text-white transition-colors text-sm tabular-nums">
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

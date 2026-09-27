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

/**
 * Raw match performance summary extracted from canonical All Maps observations.
 */
export interface PlayerRawStats {
  matches: number;
  win_rate: string;
  rating: number;
  acs: number;
  kd: number;
  kast: string;
  adr: number;
}

/**
 * Historical consistency metrics and sample verification gates.
 */
export interface PlayerConsistency {
  value: number | null;
  provisional_value: number | null;
  eligible: boolean;
  sample_size: number;
  minimum_sample_size: number;
  event_count: number;
  minimum_event_count: number;
  method: string | null;
  calculated_at: string | null;
}

/**
 * Stage exposure breakdown within Competition Quality Index (CQI).
 */
export interface PlayerStageExposure {
  matches: number;
  high_pressure_matches: number;
  raw_evidence: number;
  evidence: number;
}

/**
 * Competition Quality Index (CQI) v2 telemetry and stage validation metrics.
 */
export interface PlayerCompetitionQuality {
  season: number;
  exposure_percentile: number;
  raw_match_quality: number;
  weighted_performance: number;
  base_proven_consistency: number;
  proven_consistency: number;
  stage_evidence: number;
  stage_confidence: number;
  high_pressure_matches: number;
  stage_exposure_breakdown: Record<string, PlayerStageExposure>;
  international_matches: number;
  international_events: number;
  validation_status: string;
  confidence: number;
  method: string;
}

/**
 * Role distribution record across played maps.
 */
export interface PlayerRoleDistributionItem {
  role: string;
  map_count: number;
  share: number;
  agent_count: number;
  performance_score: number;
  qualified: boolean;
  repeatable: boolean;
}

/**
 * Player role breadth, flexibility, and archetype classification.
 */
export interface PlayerRoleProfile {
  method?: string;
  window?: {
    months: number;
    started_at: string | null;
    ended_at: string | null;
  };
  primary_role: string;
  archetype: string;
  flex_score: number;
  confidence: 'low' | 'medium' | 'high';
  components: {
    role_breadth?: number;
    agent_breadth?: number;
    usage_balance?: number;
    cross_role_performance?: number;
    repeatability?: number;
  };
  evidence: {
    map_count?: number;
    observed_map_count?: number;
    data_coverage?: number;
    event_count?: number;
    patch_count?: number;
    qualified_role_count?: number;
    repeatable_role_count?: number;
    qualified_agent_count?: number;
    agent_diverse_role_count?: number;
    effective_roles?: number;
    effective_qualified_roles?: number;
    effective_agents?: number;
    median_cross_role_performance?: number;
    performance_gate_passed?: boolean;
  };
  role_distribution: PlayerRoleDistributionItem[];
  qualified_agents?: Array<{
    name: string;
    role: string;
    map_count: number;
  }>;
  thresholds?: Record<string, number>;
}

/**
 * Bayesian conjugate shrinkage credibility coefficients (λ ∈ [0, 1]).
 */
export interface PlayerBayesianCredibility {
  alignment_lambda?: number;
  retention_lambda?: number;
  response_lambda?: number;
}

/**
 * Patch observation record for meta alignment and tier coverage.
 */
export interface PlayerPatchObservation {
  patch: string;
  map_count: number;
  meta_alignment: number | null;
  tier_coverage: number;
}

/**
 * Patch transition telemetry record for disruption response tracking.
 */
export interface PlayerPatchTransition {
  from_patch: string;
  to_patch: string;
  meta_shift: number;
  adaptation_opportunity: boolean;
  performance_retention: number | null;
  response_score: number | null;
  agent_pool_change: number;
}

/**
 * Meta Adaptability Index (MAI) profile and patch transition history.
 */
export interface PlayerAdaptability {
  method?: string;
  score: number;
  confidence: 'low' | 'medium' | 'high';
  window?: {
    months: number;
    started_at: string | null;
    ended_at: string | null;
  };
  components: {
    meta_alignment?: number;
    performance_retention?: number;
    meta_response?: number;
    role_flexibility?: number;
  };
  evidence: {
    map_count?: number;
    active_patch_count?: number;
    transition_count?: number;
    adaptation_opportunity_count?: number;
    tier_coverage?: number;
    performance_coverage?: number;
    bayesian_credibility?: PlayerBayesianCredibility;
  };
  patches?: PlayerPatchObservation[];
  transitions?: PlayerPatchTransition[];
}

/**
 * Multi-dimensional player attribute scale mapped for radar chart visualization.
 */
export interface PlayerRadarStats {
  ACS: number;
  'K/D': number;
  KAST: number;
  ADR: number;
  Consistency?: number;
  Adaptability: number;
  Flexibility: number;
}

/**
 * Most picked agent summary with pick share and portrait image URL.
 */
export interface PlayerAgentPick {
  name: string;
  count: number;
  percentage: string;
  icon_url: string | null;
}

/**
 * Daily SMART ranking snapshot record.
 */
export interface PlayerRankHistoryItem {
  date: string;
  rank: number;
  score?: number;
}

/**
 * Comprehensive player profile data structure returned by PlayerController::show($id).
 */
export interface PlayerDetails {
  id: string;
  ign: string;
  name: string;
  country: string | null;
  team_name: string;
  team_logo: string | null;
  photo_url: string | null;
  role: string | null;
  primary_role: string | null;
  role_archetype: string;
  smart_score: number | null;
  smart_rank: number | null;
  smart_status: 'verified' | 'provisional' | null;
  smart_confidence: number | null;
  smart_rank_history?: PlayerRankHistoryItem[];
  rank_shift?: string;
  raw_stats: PlayerRawStats;
  consistency: PlayerConsistency;
  competition_quality: PlayerCompetitionQuality | null;
  role_profile: PlayerRoleProfile;
  adaptability: PlayerAdaptability;
  radar_stats: PlayerRadarStats;
  /** Net Z-score deviation against Tier-1 pro role empirical prior (ΔZ = Σ w_k * (y_k - μ_role) / σ_role) */
  role_delta?: number;
  /** Role empirical prior mean vector mapped to radar polygon domain */
  role_baseline_radar?: Record<string, number>;
  most_picked_agents: PlayerAgentPick[];
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
        const cacheKey = `trickster_player_profile_cqi_v3_${playerId}`;
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
      enabled: Boolean(player.role_baseline_radar),
      itemStyle: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        fontWeight: 'bold',
        textTransform: 'uppercase'
      }
    },
    series: [
      {
        type: 'area',
        name: `${player.ign} Stats`,
        data: Object.values(player.radar_stats),
        pointPlacement: 'on',
        color: 'var(--color-primary)', 
        fillOpacity: 0.6,
        lineWidth: 3,
        lineColor: '#000',
        marker: {
          enabled: true,
          fillColor: 'var(--color-primary)',
          lineWidth: 2,
          lineColor: '#000',
          radius: 4
        }
      },
      ...(player.role_baseline_radar ? [{
        type: 'line' as const,
        name: `${player.role || 'Role'} Prior Baseline`,
        data: Object.keys(player.radar_stats).map(k => player.role_baseline_radar?.[k] ?? 50),
        pointPlacement: 'on' as const,
        color: '#71717a',
        dashStyle: 'Dash' as const,
        lineWidth: 2,
        marker: {
          enabled: false
        }
      }] : [])
    ],
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
            {/* Primary role remains separate from the player's Flex archetype. */}
            <div className="absolute top-6 right-6 bg-black text-[var(--color-primary)] font-black px-5 py-3 border-4 border-[var(--color-primary)] z-20">
              <span className="block font-label text-[9px] uppercase tracking-widest opacity-70 mb-1">Primary role</span>
              <span className="block text-base uppercase tracking-widest leading-none">{player.primary_role || player.role}</span>
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
                  <span className="text-[11px] font-black text-theme-text/50 uppercase tracking-widest">Consistency Percentile</span>
                  <span className="font-numeric font-black text-[15px] text-theme-text tabular-nums">
                    {player.consistency?.eligible && player.consistency.value !== null
                      ? player.consistency.value.toFixed(2)
                      : (player.consistency?.sample_size ?? 0) < (player.consistency?.minimum_sample_size ?? 20)
                        ? `Provisional ${player.consistency?.sample_size ?? 0}/${player.consistency?.minimum_sample_size ?? 20} matches`
                        : `Provisional ${player.consistency?.event_count ?? 0}/${player.consistency?.minimum_event_count ?? 2} events`}
                  </span>
                </div>
                {player.competition_quality && (
                  <>
                    <div className="flex justify-between items-end border-b-2 border-theme-border/20 pb-2">
                      <span className="text-[11px] font-black text-theme-text/50 uppercase tracking-widest">CQI Exposure</span>
                      <span className="font-numeric font-black text-[15px] text-theme-text tabular-nums">
                        {player.competition_quality.exposure_percentile.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-end border-b-2 border-theme-border/20 pb-2">
                      <span className="text-[11px] font-black text-theme-text/50 uppercase tracking-widest">Proven Consistency</span>
                      <span
                        className="font-numeric font-black text-[15px] text-theme-text tabular-nums"
                        title={`${player.competition_quality.validation_status} · ${player.competition_quality.high_pressure_matches} high-pressure matches · ${(player.competition_quality.stage_confidence * 100).toFixed(1)}% stage confidence`}
                      >
                        {player.competition_quality.proven_consistency.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
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

                {player.role_delta != null && (
                  <div className="flex justify-between items-center pt-3 mt-1 border-t border-theme-border/20">
                    <span className="text-[10px] font-bold text-theme-text/60 uppercase tracking-widest">
                      Role Delta (Z-Score)
                    </span>
                    <span className={`font-['JetBrains_Mono'] text-xs font-black tabular-nums ${player.role_delta >= 0 ? 'text-[#00E676]' : 'text-red-500'}`}>
                      {player.role_delta >= 0 ? '+' : ''}{player.role_delta.toFixed(2)}σ vs {player.role || 'Role'} Prior
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Stats & Radar */}
        <div className="flex-1 flex flex-col gap-16 pt-4">

          {/* Role and adaptability evidence, intentionally presented without nested cards. */}
          <section className="border-b-4 border-theme-border pb-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-display uppercase tracking-tight text-theme-text">
                  Role Profile
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-theme-text/55">
                  Flex labels require meaningful volume, repeatability, agent breadth, and retained performance.
                </p>
              </div>
              <span className="font-label text-[11px] font-bold uppercase tracking-widest text-theme-text/50">
                {player.role_profile?.confidence || 'low'} confidence
              </span>
            </div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(180px,0.75fr)_minmax(0,1.4fr)] md:gap-14">
              <div className="flex flex-col justify-between">
                <div>
                  <p className="font-label text-xs font-bold text-theme-text/50">Archetype</p>
                  <p className="mt-2 font-display text-4xl uppercase leading-none text-theme-text md:text-5xl">
                    {player.role_profile?.archetype || player.role_archetype || 'Specialist'}
                  </p>
                </div>
                <div className="mt-10">
                  <div className="flex items-end gap-2">
                    <span className="font-numeric text-5xl font-black tabular-nums text-theme-text">
                      {Number(player.role_profile?.flex_score ?? 0).toFixed(1)}
                    </span>
                    <span className="pb-1 font-label text-xs font-bold text-theme-text/40">/ 100</span>
                  </div>
                  <p className="mt-2 font-label text-xs font-bold text-theme-text/50">Flex score</p>
                </div>
              </div>

              <div>
                {(player.role_profile?.role_distribution || []).length > 0 ? (
                  <div className="space-y-1">
                    {player.role_profile.role_distribution.map((role) => (
                      <div
                        key={role.role}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6 py-3"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span className="font-display text-lg uppercase text-theme-text">{role.role}</span>
                            {role.qualified && (
                              <span className="font-label text-[10px] font-bold uppercase tracking-wider text-theme-text/40">
                                Qualified
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-theme-text/45">
                            {role.agent_count} agents, performance {Number(role.performance_score).toFixed(1)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-numeric text-lg font-black tabular-nums text-theme-text">{role.share.toFixed(1)}%</p>
                          <p className="text-xs text-theme-text/45">{role.map_count} maps</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-sm leading-6 text-theme-text/50">
                    Not enough mapped agent data is available to establish a role distribution yet.
                  </p>
                )}

                <dl className="mt-7 grid grid-cols-2 gap-x-8 gap-y-5 border-t-2 border-theme-border/20 pt-6 sm:grid-cols-4">
                  {[
                    ['Qualified roles', player.role_profile?.evidence?.qualified_role_count ?? 0],
                    ['Qualified agents', player.role_profile?.evidence?.qualified_agent_count ?? 0],
                    ['Events', player.role_profile?.evidence?.event_count ?? 0],
                    ['Patches', player.role_profile?.evidence?.patch_count ?? 0],
                  ].map(([label, value]) => (
                    <div key={String(label)}>
                      <dt className="text-xs leading-5 text-theme-text/45">{label}</dt>
                      <dd className="mt-1 font-numeric text-xl font-black tabular-nums text-theme-text">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 border-t-2 border-theme-border pt-8 sm:grid-cols-[minmax(150px,0.55fr)_minmax(0,1.45fr)] sm:gap-10">
              <div>
                <p className="font-label text-xs font-bold text-theme-text/50">Meta adaptability</p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="font-numeric text-4xl font-black tabular-nums text-theme-text">
                    {Number(player.adaptability?.score ?? 0).toFixed(1)}
                  </span>
                  <span className="pb-1 font-label text-[10px] font-bold uppercase tracking-wider text-theme-text/40">
                    {player.adaptability?.confidence || 'low'} confidence
                  </span>
                </div>
              </div>
              <div className="sm:pt-1">
                <p className="max-w-2xl text-sm leading-6 text-theme-text/55">
                  Agent changes are scored only when the previous pool was disrupted by the meta. Staying can still score well when performance holds.
                </p>
                <p className="mt-3 font-label text-xs font-bold text-theme-text/45">
                  {player.adaptability?.evidence?.active_patch_count ?? 0} active patches,{' '}
                  {player.adaptability?.evidence?.adaptation_opportunity_count ?? 0} measured adaptation opportunities
                </p>
              </div>
            </div>

            {/* Bayesian Conjugate Shrinkage Credibility (Sample Inertia Lambda) */}
            {player.adaptability?.evidence?.bayesian_credibility && (
              <div className="mt-8 border-t-2 border-theme-border/20 pt-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-3 gap-1">
                  <p className="font-label text-xs font-bold uppercase tracking-widest text-theme-text/50">
                    Bayesian Conjugate Credibility (Sample Inertia &lambda;)
                  </p>
                  <span className="font-['JetBrains_Mono'] text-[10px] text-theme-text/45 uppercase tracking-wider">
                    Evidence Weight vs Pro Prior Baseline
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="border-2 border-theme-border p-3.5 bg-theme-bg">
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="font-label text-[10px] font-bold uppercase tracking-wider text-theme-text/60">Meta Alignment</span>
                      <span className="font-['JetBrains_Mono'] text-sm font-black tabular-nums text-theme-text">
                        {Math.round((player.adaptability.evidence.bayesian_credibility.alignment_lambda ?? 0) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 overflow-hidden">
                      <div 
                        className="bg-[var(--color-primary)] h-full transition-all duration-500" 
                        style={{ width: `${Math.round((player.adaptability.evidence.bayesian_credibility.alignment_lambda ?? 0) * 100)}%` }} 
                      />
                    </div>
                    <p className="mt-2 font-['JetBrains_Mono'] text-[9px] text-theme-text/45">
                      Weight: {player.adaptability.evidence.bayesian_credibility.alignment_lambda ?? 0} data / {(1 - (player.adaptability.evidence.bayesian_credibility.alignment_lambda ?? 0)).toFixed(2)} prior
                    </p>
                  </div>

                  <div className="border-2 border-theme-border p-3.5 bg-theme-bg">
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="font-label text-[10px] font-bold uppercase tracking-wider text-theme-text/60">Retention</span>
                      <span className="font-['JetBrains_Mono'] text-sm font-black tabular-nums text-theme-text">
                        {Math.round((player.adaptability.evidence.bayesian_credibility.retention_lambda ?? 0) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 overflow-hidden">
                      <div 
                        className="bg-[var(--color-primary)] h-full transition-all duration-500" 
                        style={{ width: `${Math.round((player.adaptability.evidence.bayesian_credibility.retention_lambda ?? 0) * 100)}%` }} 
                      />
                    </div>
                    <p className="mt-2 font-['JetBrains_Mono'] text-[9px] text-theme-text/45">
                      Weight: {player.adaptability.evidence.bayesian_credibility.retention_lambda ?? 0} data / {(1 - (player.adaptability.evidence.bayesian_credibility.retention_lambda ?? 0)).toFixed(2)} prior
                    </p>
                  </div>

                  <div className="border-2 border-theme-border p-3.5 bg-theme-bg">
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="font-label text-[10px] font-bold uppercase tracking-wider text-theme-text/60">Meta Response</span>
                      <span className="font-['JetBrains_Mono'] text-sm font-black tabular-nums text-theme-text">
                        {Math.round((player.adaptability.evidence.bayesian_credibility.response_lambda ?? 0) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 overflow-hidden">
                      <div 
                        className="bg-[var(--color-primary)] h-full transition-all duration-500" 
                        style={{ width: `${Math.round((player.adaptability.evidence.bayesian_credibility.response_lambda ?? 0) * 100)}%` }} 
                      />
                    </div>
                    <p className="mt-2 font-['JetBrains_Mono'] text-[9px] text-theme-text/45">
                      Weight: {player.adaptability.evidence.bayesian_credibility.response_lambda ?? 0} data / {(1 - (player.adaptability.evidence.bayesian_credibility.response_lambda ?? 0)).toFixed(2)} prior
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Patch Transition Telemetry History Table */}
            {(player.adaptability?.transitions || []).length > 0 && (
              <div className="mt-8 border-t-2 border-theme-border/20 pt-6">
                <div className="flex justify-between items-baseline mb-3">
                  <p className="font-label text-xs font-bold uppercase tracking-widest text-theme-text/50">
                    Patch Transition Telemetry History
                  </p>
                  <span className="font-['JetBrains_Mono'] text-[10px] text-theme-text/45 uppercase tracking-wider">
                    {player.adaptability?.transitions?.length ?? 0} Observed Transitions
                  </span>
                </div>
                <div className="overflow-x-auto border-2 border-theme-border">
                  <table className="w-full text-left text-xs font-['JetBrains_Mono'] border-collapse">
                    <thead>
                      <tr className="border-b-2 border-theme-border bg-theme-text text-theme-bg text-[10px] uppercase font-bold tracking-widest">
                        <th className="py-2.5 px-3">Transition</th>
                        <th className="py-2.5 px-3 text-right">Meta Shift</th>
                        <th className="py-2.5 px-3 text-right">Pool Shift</th>
                        <th className="py-2.5 px-3 text-right">Retention</th>
                        <th className="py-2.5 px-3 text-right">Response</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border/20 bg-theme-bg">
                      {player.adaptability?.transitions?.map((t, idx) => (
                        <tr key={idx} className="hover:bg-black/5 transition-colors">
                          <td className="py-2.5 px-3 font-black whitespace-nowrap">
                            Patch {t.from_patch} &rarr; {t.to_patch}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums whitespace-nowrap text-theme-text/70">
                            {t.meta_shift}%
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums whitespace-nowrap text-theme-text/70">
                            {t.agent_pool_change}%
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums whitespace-nowrap font-bold">
                            {t.performance_retention != null ? `${t.performance_retention}%` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums whitespace-nowrap font-black">
                            {t.response_score != null ? t.response_score : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                              t.adaptation_opportunity 
                                ? 'border-black bg-black text-[var(--color-primary)]' 
                                : 'border-theme-border/30 text-theme-text/45'
                            }`}>
                              {t.adaptation_opportunity ? 'Meta Opportunity' : 'Stable'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
          
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

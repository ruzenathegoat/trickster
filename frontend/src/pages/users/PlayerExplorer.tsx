import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import axios from '../../lib/axios';

type ExplorerView = 'momentum' | 'regions' | 'snapshot';
type MomentumCategory =
  | 'breakout'
  | 'steady_climber'
  | 'improving'
  | 'declining'
  | 'volatile'
  | 'stable'
  | 'limited_evidence'
  | 'no_baseline'
  | 'context_changed';

interface ExplorerPlayer {
  id: string;
  name: string;
  ign: string;
  team: string;
  role: string;
  region: string;
  headlineStat: string;
  photo_url: string | null;
  smartStatus: 'verified' | 'provisional' | null;
  smartConfidence: number | null;
}

interface MomentumEvent {
  id: string;
  name: string;
  region: string;
  tier: string;
  last_match_date: string;
  player_count?: number;
  patch?: string | null;
  valid_matches?: number;
}

interface MomentumMetric {
  raw: number;
  percentile: number;
}

interface MomentumTrajectory {
  event_id: string;
  event_name: string;
  date: string;
  score: number;
  valid_matches: number;
}

interface MomentumPlayer {
  player_id: string;
  ign: string;
  name: string;
  photo_url: string | null;
  team_name: string;
  role: string;
  region: string;
  current_event: MomentumEvent;
  comparator_event: MomentumEvent | null;
  current_performance: number;
  previous_performance: number | null;
  raw_delta: number;
  adjusted_delta: number;
  confidence: number;
  confidence_level: 'high' | 'medium' | 'low';
  eligible: boolean;
  category: MomentumCategory;
  regional_rank: number | null;
  global_rank: number | null;
  current_metrics: Record<'acs' | 'adr' | 'kast' | 'kd', MomentumMetric>;
  previous_metrics: Record<'acs' | 'adr' | 'kast' | 'kd', MomentumMetric> | null;
  metric_delta_contributions: Record<'acs' | 'adr' | 'kast' | 'kd', number>;
  trajectory: MomentumTrajectory[];
  trend_slope: number;
  context_flags: string[];
}

interface RegionSummary {
  region: string;
  players: number;
  eligible_players: number;
  median_momentum: number;
  improving: number;
  declining: number;
  top_mover: {
    player_id: string;
    ign: string;
    photo_url: string | null;
    adjusted_delta: number;
  } | null;
  leaders: Array<{
    player_id: string;
    ign: string;
    photo_url: string | null;
    adjusted_delta: number;
    category: MomentumCategory;
    role: string;
  }>;
}

interface MomentumResponse {
  meta: {
    season: number;
    scope: 'event' | 'latest_regional';
    selected_event_ids: string[];
    minimum_matches: number;
    global_rank_available: boolean;
    positive_threshold: number;
    negative_threshold: number;
    benchmark: string;
    weights: Record<string, number>;
    summary: {
      players: number;
      eligible_players: number;
      rising: number;
      declining: number;
      median_momentum: number;
    };
  };
  events: MomentumEvent[];
  regions: RegionSummary[];
  overview: MomentumPlayer[];
  data: MomentumPlayer[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

const ROLES = ['All', 'Duelist', 'Initiator', 'Controller', 'Sentinel', 'Flex'];
const REGIONS = ['All', 'Americas', 'EMEA', 'Pacific', 'China'];
const SORT_STATS = ['smart', 'acs', 'kd', 'adr', 'fkfd'];
const DISPLAY_NAMES: Record<string, string> = {
  smart: 'SMART',
  acs: 'ACS',
  kd: 'K/D',
  adr: 'ADR',
  fkfd: 'FK/FD',
};
const CATEGORY_LABELS: Record<MomentumCategory, string> = {
  breakout: 'Breakout',
  steady_climber: 'Steady climber',
  improving: 'Improving',
  declining: 'Cooling off',
  volatile: 'Volatile',
  stable: 'Stable',
  limited_evidence: 'Limited evidence',
  no_baseline: 'No baseline',
  context_changed: 'Context changed',
};
const RISING_CATEGORIES: MomentumCategory[] = ['breakout', 'steady_climber', 'improving'];

function formatDelta(value: number) {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}`;
}

function categoryTone(category: MomentumCategory) {
  if (RISING_CATEGORIES.includes(category)) return 'bg-[var(--color-primary)] text-black border-black';
  if (category === 'declining') return 'bg-red-600 text-white border-red-700';
  if (category === 'volatile') return 'bg-theme-text text-theme-bg border-theme-border';
  return 'bg-theme-muted text-theme-text border-theme-divider';
}

function PlayerAvatar({ player, size = 'md' }: { player: Pick<MomentumPlayer, 'ign' | 'photo_url'>; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-16 w-16' : size === 'sm' ? 'h-8 w-8' : 'h-11 w-11';

  return (
    <div className={`${sizeClass} shrink-0 overflow-hidden border-2 border-theme-border bg-theme-muted flex items-center justify-center`}>
      {player.photo_url ? (
        <img src={player.photo_url} alt="" loading="lazy" className="h-full w-full object-cover object-top" />
      ) : (
        <span className="font-display text-xs text-gray-400">{player.ign.slice(0, 1)}</span>
      )}
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-3xl">
      <p className="mb-2 font-label text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">{eyebrow}</p>
      <h2 className="font-display text-2xl uppercase tracking-tight md:text-3xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">{description}</p>
    </div>
  );
}

function MomentumLoading() {
  return (
    <div className="space-y-8" aria-label="Loading player momentum">
      <div className="grid grid-cols-2 border-4 border-theme-border lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="border-theme-divider p-5 even:border-l lg:border-l">
            <Skeleton className="mb-3 h-3 w-24" />
            <Skeleton className="h-9 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="h-[480px] w-full" />
        <Skeleton className="h-[480px] w-full" />
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  );
}

function MomentumQuadrant({
  players,
  selectedId,
  onSelect,
}: {
  players: MomentumPlayer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const eligible = players.filter((player) => player.eligible);
  const plotted = [...eligible]
    .sort((a, b) => Math.abs(b.adjusted_delta) - Math.abs(a.adjusted_delta))
    .slice(0, 32);
  const maxDelta = Math.max(8, ...plotted.map((player) => Math.abs(player.adjusted_delta)));

  if (plotted.length === 0) {
    return (
      <div className="flex h-[440px] items-center justify-center border-4 border-theme-border bg-theme-muted p-8 text-center">
        <p className="max-w-sm font-label text-xs uppercase tracking-widest text-gray-500">
          No eligible comparisons match these filters. Try another role, region, or event.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-[440px] overflow-hidden border-4 border-theme-border bg-theme-bg md:h-[500px]">
      <div className="absolute left-1/2 top-0 h-full border-l-2 border-theme-divider" />
      <div className="absolute left-1/4 top-0 h-full border-l border-dashed border-theme-divider" />
      <div className="absolute left-3/4 top-0 h-full border-l border-dashed border-theme-divider" />
      <div className="absolute left-0 top-1/2 w-full border-t-2 border-theme-border" />
      <div className="absolute left-0 top-1/4 w-full border-t border-dashed border-theme-divider" />
      <div className="absolute left-0 top-3/4 w-full border-t border-dashed border-theme-divider" />

      <div className="absolute left-4 top-4 font-label text-[9px] font-bold uppercase tracking-widest text-gray-400">Rising</div>
      <div className="absolute bottom-4 left-4 font-label text-[9px] font-bold uppercase tracking-widest text-gray-400">Cooling</div>
      <div className="absolute bottom-4 right-4 font-label text-[9px] font-bold uppercase tracking-widest text-gray-400">Higher current level</div>
      <div className="absolute left-4 top-[calc(50%+12px)] font-label text-[9px] font-bold uppercase tracking-widest text-gray-400">Lower current level</div>

      {plotted.map((player) => {
        const left = Math.max(5, Math.min(95, player.current_performance));
        const top = Math.max(6, Math.min(94, 50 - (player.adjusted_delta / maxDelta) * 43));
        const selected = selectedId === player.player_id;

        return (
          <button
            key={player.player_id}
            type="button"
            onClick={() => onSelect(player.player_id)}
            className={`absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 overflow-hidden border-2 bg-theme-muted transition-[transform,border-color] hover:z-20 hover:scale-125 focus:z-20 focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)] ${
              selected ? 'z-10 scale-125 border-[var(--color-primary)]' : 'border-theme-border'
            }`}
            style={{ left: `${left}%`, top: `${top}%` }}
            aria-label={`${player.ign}, performance ${player.current_performance.toFixed(1)}, momentum ${formatDelta(player.adjusted_delta)}`}
            title={`${player.ign} | ${formatDelta(player.adjusted_delta)}`}
          >
            {player.photo_url ? (
              <img src={player.photo_url} alt="" loading="lazy" className="h-full w-full object-cover object-top" />
            ) : (
              <span className="font-display text-[9px]">{player.ign.slice(0, 2)}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function PlayerInspection({ player, onOpen }: { player: MomentumPlayer | null; onOpen: () => void }) {
  if (!player) {
    return (
      <aside className="flex min-h-[440px] items-center border-4 border-theme-border bg-theme-muted p-8">
        <p className="font-label text-xs uppercase tracking-widest text-gray-500">Select a player to inspect the comparison.</p>
      </aside>
    );
  }

  const contributions = Object.entries(player.metric_delta_contributions)
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a));
  const comparisonNote = player.comparator_event === null
    ? 'No earlier event with the same region and tier was found.'
    : player.context_flags.includes('role_changed')
      ? 'The detected role changed, so this comparison is visible but unranked.'
      : !player.eligible
        ? 'One or both events have fewer than three valid matches.'
        : null;

  return (
    <aside className="border-4 border-theme-border bg-theme-bg">
      <div className="flex items-start gap-4 border-b-4 border-theme-border p-5">
        <PlayerAvatar player={player} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl uppercase">{player.ign}</p>
          <p className="mt-1 truncate font-label text-[10px] uppercase tracking-wider text-gray-500">{player.team_name} | {player.role}</p>
          <span className={`mt-3 inline-block border-2 px-2 py-1 font-label text-[9px] font-bold uppercase tracking-wider ${categoryTone(player.category)}`}>
            {CATEGORY_LABELS[player.category]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 border-b-2 border-theme-divider">
        <div className="border-r-2 border-theme-divider p-4">
          <p className="font-label text-[9px] uppercase tracking-widest text-gray-500">Current level</p>
          <p className="mt-1 font-numeric text-3xl font-bold tabular-nums">{player.current_performance.toFixed(1)}</p>
        </div>
        <div className="bg-theme-text p-4 text-theme-bg">
          <p className="font-label text-[9px] uppercase tracking-widest opacity-60">Adjusted momentum</p>
          <p className="mt-1 font-numeric text-3xl font-bold tabular-nums text-[var(--color-primary)]">{player.eligible ? formatDelta(player.adjusted_delta) : 'N/A'}</p>
        </div>
      </div>

      <div className="space-y-4 border-b-2 border-theme-divider p-5">
        <div>
          <p className="font-label text-[9px] uppercase tracking-widest text-gray-500">Compared events</p>
          <p className="mt-1 text-sm font-semibold leading-5">{player.current_event.name}</p>
          <p className="mt-1 font-label text-[10px] leading-4 text-gray-500">
            vs. {player.comparator_event?.name ?? 'No valid baseline'}
          </p>
          {comparisonNote && <p className="mt-3 border-l-2 border-[var(--color-primary)] pl-3 text-xs leading-5 text-gray-500">{comparisonNote}</p>}
        </div>
        <div className="flex items-end justify-between border-t border-theme-divider pt-4">
          <div>
            <p className="font-label text-[9px] uppercase tracking-widest text-gray-500">Evidence confidence</p>
            <p className="mt-1 font-numeric text-lg font-bold tabular-nums">{player.confidence.toFixed(0)}%</p>
          </div>
          <p className="font-label text-[9px] font-bold uppercase tracking-wider text-gray-500">
            {player.current_event.valid_matches ?? 0} + {player.comparator_event?.valid_matches ?? 0} matches
          </p>
        </div>
      </div>

      <div className="p-5">
        <p className="mb-3 font-label text-[9px] uppercase tracking-widest text-gray-500">Metric contribution</p>
        <div className="divide-y divide-theme-divider border-y border-theme-divider">
          {contributions.map(([metric, value]) => (
            <div key={metric} className="flex items-center justify-between py-2.5">
              <span className="font-label text-[10px] font-bold uppercase tracking-wider">{metric}</span>
              <span className={`font-numeric text-xs font-bold tabular-nums ${value < 0 ? 'text-red-600' : ''}`}>{formatDelta(value)}</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="mt-5 flex w-full items-center justify-between border-2 border-theme-border bg-theme-bg px-4 py-3 font-label text-[10px] font-bold uppercase tracking-wider transition-colors hover:bg-theme-text hover:text-theme-bg focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]"
        >
          Open player profile
          <ArrowRight size={16} weight="bold" />
        </button>
      </div>
    </aside>
  );
}

function MomentumTable({
  players,
  selectedId,
  onSelect,
}: {
  players: MomentumPlayer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto border-4 border-theme-border">
      <table className="w-full min-w-[940px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b-4 border-theme-border bg-theme-text font-label text-[10px] font-bold uppercase tracking-widest text-theme-bg">
            <th className="px-5 py-4">Player</th>
            <th className="px-5 py-4">Comparison</th>
            <th className="px-5 py-4">Trajectory</th>
            <th className="px-5 py-4 text-right">Level</th>
            <th className="px-5 py-4 text-right">Momentum</th>
            <th className="px-5 py-4 text-right">Confidence</th>
            <th className="px-5 py-4">Signal</th>
            <th className="px-5 py-4 text-right">Rank</th>
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-theme-divider">
          {players.map((player) => (
            <tr
              key={player.player_id}
              onClick={() => onSelect(player.player_id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') onSelect(player.player_id);
              }}
              tabIndex={0}
              aria-selected={selectedId === player.player_id}
              className={`cursor-pointer transition-colors hover:bg-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-inset focus:ring-[var(--color-primary)] ${
                selectedId === player.player_id ? 'bg-theme-muted' : 'bg-theme-bg'
              }`}
            >
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <PlayerAvatar player={player} size="sm" />
                  <div>
                    <p className="font-display text-sm uppercase">{player.ign}</p>
                    <p className="mt-0.5 font-label text-[9px] uppercase tracking-wider text-gray-500">{player.region} | {player.role}</p>
                  </div>
                </div>
              </td>
              <td className="max-w-[250px] px-5 py-3.5">
                <p className="truncate text-xs font-semibold">{player.current_event.name}</p>
                <p className="mt-1 truncate font-label text-[9px] text-gray-500">vs. {player.comparator_event?.name ?? 'No baseline'}</p>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-1 font-numeric text-[10px] tabular-nums text-gray-500" aria-label="Event performance trajectory">
                  {player.trajectory.map((point, index) => (
                    <span key={point.event_id} className="flex items-center gap-1">
                      {index > 0 && <span aria-hidden="true">›</span>}
                      <span className={index === player.trajectory.length - 1 ? 'font-bold text-theme-text' : ''}>{point.score.toFixed(0)}</span>
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-5 py-3.5 text-right font-numeric font-bold tabular-nums">{player.current_performance.toFixed(1)}</td>
              <td className={`px-5 py-3.5 text-right font-numeric text-base font-bold tabular-nums ${player.adjusted_delta < 0 ? 'text-red-600' : ''}`}>
                {player.eligible ? formatDelta(player.adjusted_delta) : 'N/A'}
              </td>
              <td className="px-5 py-3.5 text-right font-numeric text-xs font-bold tabular-nums">{player.confidence.toFixed(0)}%</td>
              <td className="px-5 py-3.5">
                <span className={`inline-block border px-2 py-1 font-label text-[8px] font-bold uppercase tracking-wider ${categoryTone(player.category)}`}>
                  {CATEGORY_LABELS[player.category]}
                </span>
              </td>
              <td className="px-5 py-3.5 text-right font-numeric text-xs font-bold tabular-nums">
                {player.global_rank || player.regional_rank ? (
                  <span className="flex flex-col items-end gap-0.5">
                    <span className="text-sm">#{player.global_rank ?? player.regional_rank}</span>
                    <span className="font-label text-[8px] uppercase tracking-wider text-gray-500">{player.global_rank ? 'Global' : 'Regional'}</span>
                  </span>
                ) : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {players.length === 0 && (
        <div className="px-6 py-16 text-center font-label text-xs uppercase tracking-widest text-gray-500">
          No players match the current filters.
        </div>
      )}
    </div>
  );
}

function RegionPulse({
  response,
  onInspect,
}: {
  response: MomentumResponse;
  onInspect: (id: string) => void;
}) {
  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Cross region pulse"
        title="Read direction without forcing a global rank"
        description="Each region uses its own event and benchmark. Median momentum shows regional direction, while player ranks stay inside their region."
      />
      <div className="border-y-4 border-theme-border">
        {response.regions.map((summary) => {
          return (
            <section key={summary.region} className="grid border-b-2 border-theme-divider last:border-b-0 lg:grid-cols-[220px_1fr]">
              <div className="flex flex-col justify-between border-b-2 border-theme-divider bg-theme-muted p-6 lg:border-b-0 lg:border-r-2">
                <div>
                  <h3 className="font-display text-2xl uppercase">{summary.region}</h3>
                  <p className="mt-2 font-label text-[9px] uppercase tracking-widest text-gray-500">{summary.eligible_players} verified comparisons</p>
                </div>
                <div className="mt-7">
                  <p className="font-label text-[9px] uppercase tracking-widest text-gray-500">Median momentum</p>
                  <p className={`mt-1 font-numeric text-4xl font-bold tabular-nums ${summary.median_momentum < 0 ? 'text-red-600' : ''}`}>
                    {formatDelta(summary.median_momentum)}
                  </p>
                  <p className="mt-3 font-label text-[9px] uppercase tracking-wider text-gray-500">{summary.improving} rising | {summary.declining} cooling</p>
                </div>
              </div>
              <div className="divide-y divide-theme-divider">
                {summary.leaders.map((player, index) => (
                  <button
                    key={player.player_id}
                    type="button"
                    onClick={() => onInspect(player.player_id)}
                    className="grid w-full grid-cols-[38px_1fr_auto] items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-inset focus:ring-[var(--color-primary)]"
                  >
                    <span className="font-numeric text-xs font-bold tabular-nums text-gray-400">#{index + 1}</span>
                    <div className="flex min-w-0 items-center gap-3">
                      <PlayerAvatar player={player} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-display text-sm uppercase">{player.ign}</p>
                        <p className="truncate font-label text-[9px] uppercase tracking-wider text-gray-500">{CATEGORY_LABELS[player.category]} | {player.role}</p>
                      </div>
                    </div>
                    <span className="font-numeric text-base font-bold tabular-nums">{formatDelta(player.adjusted_delta)}</span>
                  </button>
                ))}
                {summary.leaders.length === 0 && (
                  <p className="p-8 font-label text-xs uppercase tracking-widest text-gray-500">No eligible players in this region.</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default function PlayerExplorer() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchFromUrl = searchParams.get('search') ?? '';

  const [view, setView] = useState<ExplorerView>('momentum');
  const [activeRole, setActiveRole] = useState('All');
  const [activeRegion, setActiveRegion] = useState('All');
  const [activeCategory, setActiveCategory] = useState<'All' | MomentumCategory>('All');
  const [searchQuery, setSearchQuery] = useState(searchFromUrl);
  const [debouncedSearch, setDebouncedSearch] = useState(searchFromUrl);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [momentumPage, setMomentumPage] = useState(1);
  const [momentumPerPage, setMomentumPerPage] = useState(25);

  const [momentum, setMomentum] = useState<MomentumResponse | null>(null);
  const [momentumLoading, setMomentumLoading] = useState(true);
  const [momentumError, setMomentumError] = useState('');
  const [momentumReload, setMomentumReload] = useState(0);

  const [players, setPlayers] = useState<ExplorerPlayer[]>([]);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotError, setSnapshotError] = useState('');
  const [snapshotReload, setSnapshotReload] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('smart');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    setSearchQuery(searchFromUrl);
  }, [searchFromUrl]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery), 350);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const momentumEnabled = view !== 'snapshot';

  useEffect(() => {
    if (!momentumEnabled) return;

    let cancelled = false;
    setMomentumLoading(true);
    setMomentumError('');
    const params = new URLSearchParams({
      season: '2026',
      page: String(momentumPage),
      per_page: String(momentumPerPage),
    });
    if (selectedEventId) params.set('event_id', selectedEventId);
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (activeRole !== 'All') params.set('role', activeRole);
    if (activeRegion !== 'All') params.set('region', activeRegion);
    if (activeCategory !== 'All') params.set('category', activeCategory);

    axios.get(`/api/v1/players/momentum?${params.toString()}`)
      .then((response) => {
        if (!cancelled) setMomentum(response.data);
      })
      .catch((error) => {
        console.error('Failed to fetch player momentum:', error);
        if (!cancelled) {
          setMomentumError('Momentum data could not be loaded. Please retry.');
        }
      })
      .finally(() => {
        if (!cancelled) setMomentumLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [momentumEnabled, selectedEventId, momentumPage, momentumPerPage, debouncedSearch, activeRole, activeRegion, activeCategory, momentumReload]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeRole, sortBy, sortDir]);

  useEffect(() => {
    if (view !== 'snapshot') return;

    let cancelled = false;
    setSnapshotLoading(true);
    setSnapshotError('');
    let url = `/api/v1/players?page=${page}`;
    if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;
    if (activeRole !== 'All') url += `&role=${encodeURIComponent(activeRole)}`;
    url += `&sort_by=${sortBy}&sort_dir=${sortDir}`;

    axios.get(url)
      .then((response) => {
        if (cancelled) return;
        const fetchedPlayers = response.data.data.map((player: Record<string, any>) => {
          let statValue = 'N/A';
          const globalResult = player.smart_results?.find((result: Record<string, any>) => result.mode === 'career');

          if (sortBy === 'acs') statValue = player.avg_acs ?? 'N/A';
          else if (sortBy === 'kd') statValue = player.avg_kd ?? 'N/A';
          else if (sortBy === 'adr') statValue = player.avg_adr ?? 'N/A';
          else if (sortBy === 'fkfd' && player.avg_fk != null && player.avg_fd != null) {
            const difference = parseFloat(player.avg_fk) - parseFloat(player.avg_fd);
            statValue = difference > 0 ? `+${difference.toFixed(2)}` : difference.toFixed(2);
          } else if (sortBy === 'smart') {
            statValue = globalResult?.final_score != null ? Number(globalResult.final_score).toFixed(1) : 'N/A';
          }

          return {
            id: player.id,
            ign: player.ign || 'Unknown',
            name: player.name || '',
            team: player.team?.name || 'Free Agent',
            role: player.current_role || 'Flex',
            region: player.team?.region || 'Global',
            headlineStat: String(statValue),
            photo_url: player.photo_url || null,
            smartStatus: globalResult ? (globalResult.is_provisional ? 'provisional' : 'verified') : null,
            smartConfidence: globalResult?.confidence != null ? Math.round(Number(globalResult.confidence) * 100) : null,
          } satisfies ExplorerPlayer;
        });
        setPlayers(fetchedPlayers);
        setTotalPages(response.data.last_page || 1);
      })
      .catch((error) => {
        console.error('Failed to fetch players:', error);
        if (!cancelled) {
          setPlayers([]);
          setTotalPages(1);
          setSnapshotError('Player snapshot could not be loaded. Please retry.');
        }
      })
      .finally(() => {
        if (!cancelled) setSnapshotLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [view, searchQuery, activeRole, page, sortBy, sortDir, snapshotReload]);

  const paginatedMomentum = momentum?.data ?? [];
  const availableMomentum = useMemo(() => {
    const byId = new Map<string, MomentumPlayer>();
    momentum?.overview.forEach((player) => byId.set(player.player_id, player));
    momentum?.data.forEach((player) => byId.set(player.player_id, player));

    return Array.from(byId.values());
  }, [momentum]);

  useEffect(() => {
    if (availableMomentum.length === 0) {
      setSelectedPlayerId(null);
      return;
    }
    if (!availableMomentum.some((player) => player.player_id === selectedPlayerId)) {
      const firstEligible = availableMomentum.find((player) => player.eligible);
      setSelectedPlayerId((firstEligible ?? availableMomentum[0]).player_id);
    }
  }, [availableMomentum, selectedPlayerId]);

  const selectedPlayer = availableMomentum.find((player) => player.player_id === selectedPlayerId) ?? null;
  const momentumSummary = momentum?.meta.summary;
  const selectedScopeName = selectedEventId
    ? momentum?.events.find((event) => event.id === selectedEventId)?.name ?? 'Selected event'
    : 'Latest regional events';

  const updateSearch = (value: string) => {
    setSearchQuery(value);
    setMomentumPage(1);
    const next = new URLSearchParams(searchParams);
    if (value) next.set('search', value);
    else next.delete('search');
    setSearchParams(next, { replace: true });
  };

  const openPlayer = (id: string) => navigate(`/app/players/${id}`);

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-16">
      <motion.header
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.45, ease: [0.23, 1, 0.32, 1] }}
        className="grid gap-8 border-b-4 border-theme-border pb-8 lg:grid-cols-[1fr_auto] lg:items-end"
      >
        <div>
          <p className="mb-3 font-label text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500">Season 2026 scouting workspace</p>
          <h1 className="font-display text-5xl uppercase leading-none tracking-tighter lg:text-7xl">Player Explorer</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-500">
            Compare current level, event momentum, and evidence quality. Momentum is an event signal and remains separate from SMART.
          </p>
        </div>
        <div className="flex overflow-x-auto border-2 border-theme-border" aria-label="Explorer view">
          {([
            ['momentum', 'Momentum'],
            ['regions', 'Regional pulse'],
            ['snapshot', 'SMART snapshot'],
          ] as const).map(([value, label], index) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setView(value);
                if (value !== 'momentum') setActiveCategory('All');
              }}
              aria-pressed={view === value}
              className={`whitespace-nowrap px-4 py-3 font-label text-[10px] font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-4 focus:ring-inset focus:ring-[var(--color-primary)] ${
                index > 0 ? 'border-l-2 border-theme-border' : ''
              } ${view === value ? 'bg-theme-text text-[var(--color-primary)]' : 'bg-theme-bg hover:bg-theme-muted'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </motion.header>

      <div className="border-4 border-theme-border">
        <div className="flex flex-col lg:flex-row">
          <label className="relative flex-1 border-b-4 border-theme-border lg:border-b-0 lg:border-r-4">
            <span className="sr-only">Search players</span>
            <MagnifyingGlass weight="bold" size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-theme-text" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Search player, team, or name"
              className="w-full bg-theme-bg py-5 pl-14 pr-6 font-label text-[12px] font-bold uppercase tracking-widest text-theme-text placeholder:text-gray-400 focus:bg-[var(--color-primary)] focus:text-black focus:outline-none"
            />
          </label>
          <div className="flex shrink-0 overflow-x-auto" aria-label="Role filter">
            {ROLES.map((role, index) => (
              <button
                key={role}
                type="button"
                onClick={() => {
                  setActiveRole(role);
                  setMomentumPage(1);
                }}
                aria-pressed={activeRole === role}
                className={`whitespace-nowrap px-4 py-5 font-label text-[10px] font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-4 focus:ring-inset focus:ring-[var(--color-primary)] ${
                  index > 0 ? 'border-l-2 border-theme-border' : ''
                } ${activeRole === role ? 'bg-theme-text text-[var(--color-primary)]' : 'bg-theme-bg text-gray-500 hover:bg-theme-muted hover:text-theme-text'}`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
        {view !== 'snapshot' && (
          <div className="flex flex-col border-t-4 border-theme-border xl:flex-row">
            <label className="flex min-w-0 items-center gap-3 border-b-2 border-theme-border px-5 py-3 xl:w-[390px] xl:border-b-0 xl:border-r-2">
              <span className="shrink-0 font-label text-[9px] font-bold uppercase tracking-widest text-gray-500">Event scope</span>
              <select
                value={selectedEventId}
                onChange={(event) => {
                  setSelectedEventId(event.target.value);
                  setActiveCategory('All');
                  setMomentumPage(1);
                }}
                className="min-w-0 flex-1 bg-theme-bg font-label text-[10px] font-bold uppercase text-theme-text focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="">Latest regional events</option>
                {momentum?.events.map((event) => (
                  <option key={event.id} value={event.id}>{event.name} | {event.region}</option>
                ))}
              </select>
            </label>
            <div className="flex min-w-0 flex-1 overflow-x-auto" aria-label="Region filter">
              {REGIONS.map((region, index) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => {
                    setActiveRegion(region);
                    setMomentumPage(1);
                  }}
                  aria-pressed={activeRegion === region}
                  className={`whitespace-nowrap px-5 py-3 font-label text-[9px] font-bold uppercase tracking-widest transition-colors ${
                    index > 0 ? 'border-l border-theme-divider' : ''
                  } ${activeRegion === region ? 'bg-[var(--color-primary)] text-black' : 'bg-theme-bg text-gray-500 hover:bg-theme-muted hover:text-theme-text'}`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {view !== 'snapshot' && momentumLoading && !momentum && <MomentumLoading />}

      {view !== 'snapshot' && momentumError && (
        <div role="alert" className="flex flex-col items-start justify-between gap-5 border-4 border-red-600 bg-theme-bg p-6 md:flex-row md:items-center">
          <div>
            <p className="font-display text-xl uppercase">Momentum unavailable</p>
            <p className="mt-1 text-sm text-gray-500">{momentumError}</p>
          </div>
          <button type="button" onClick={() => setMomentumReload((value) => value + 1)} className="border-2 border-theme-border px-4 py-2 font-label text-[10px] font-bold uppercase tracking-wider hover:bg-theme-text hover:text-theme-bg">
            Retry request
          </button>
        </div>
      )}

      {view !== 'snapshot' && momentum && (
        <motion.div
          key={view}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
          aria-busy={momentumLoading}
          className={`space-y-12 transition-opacity ${momentumLoading ? 'pointer-events-none opacity-60' : ''}`}
        >
          {view === 'momentum' ? (
            <>
              <div className="grid grid-cols-2 border-4 border-theme-border lg:grid-cols-4">
                <div className="p-5">
                  <p className="font-label text-[9px] uppercase tracking-widest text-gray-500">Verified comparisons</p>
                  <p className="mt-2 font-numeric text-3xl font-bold tabular-nums">{momentumSummary?.eligible_players ?? 0}</p>
                </div>
                <div className="border-l-2 border-theme-divider p-5">
                  <p className="font-label text-[9px] uppercase tracking-widest text-gray-500">Rising signals</p>
                  <p className="mt-2 font-numeric text-3xl font-bold tabular-nums">{momentumSummary?.rising ?? 0}</p>
                </div>
                <div className="border-l-0 border-t-2 border-theme-divider p-5 sm:border-l-2 sm:border-t-0">
                  <p className="font-label text-[9px] uppercase tracking-widest text-gray-500">Cooling signals</p>
                  <p className="mt-2 font-numeric text-3xl font-bold tabular-nums text-red-600">{momentumSummary?.declining ?? 0}</p>
                </div>
                <div className="border-l-2 border-t-2 border-theme-divider p-5 sm:border-t-0">
                  <p className="font-label text-[9px] uppercase tracking-widest text-gray-500">Median momentum</p>
                  <p className={`mt-2 font-numeric text-3xl font-bold tabular-nums ${(momentumSummary?.median_momentum ?? 0) < 0 ? 'text-red-600' : ''}`}>{formatDelta(momentumSummary?.median_momentum ?? 0)}</p>
                </div>
              </div>

              <section className="space-y-6">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                  <SectionHeading
                    eyebrow={selectedScopeName}
                    title="Performance and momentum map"
                    description="Horizontal position is current event performance. Vertical position is change from the previous comparable event after sample reliability is applied."
                  />
                  <p className="max-w-xs font-label text-[9px] uppercase leading-4 tracking-wider text-gray-500">
                    {momentum.meta.global_rank_available ? 'International event: direct global rank enabled' : 'Regional events: global rank intentionally disabled'}
                  </p>
                </div>
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <MomentumQuadrant players={momentum.overview} selectedId={selectedPlayerId} onSelect={setSelectedPlayerId} />
                  <PlayerInspection player={selectedPlayer} onOpen={() => selectedPlayer && openPlayer(selectedPlayer.player_id)} />
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                  <SectionHeading
                    eyebrow="Discovery board"
                    title="Find the signal behind the rank"
                    description="Filter by trajectory type, then inspect the event pair, confidence, and metric contributions before opening a player profile."
                  />
                  <div className="flex max-w-full overflow-x-auto border-2 border-theme-border" aria-label="Signal filter">
                    {(['All', 'breakout', 'steady_climber', 'improving', 'declining', 'volatile', 'stable', 'limited_evidence', 'no_baseline', 'context_changed'] as const).map((category, index) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => {
                          setActiveCategory(category);
                          setMomentumPage(1);
                        }}
                        aria-pressed={activeCategory === category}
                        className={`whitespace-nowrap px-3 py-2.5 font-label text-[8px] font-bold uppercase tracking-wider transition-colors ${
                          index > 0 ? 'border-l border-theme-border' : ''
                        } ${activeCategory === category ? 'bg-theme-text text-[var(--color-primary)]' : 'bg-theme-bg hover:bg-theme-muted'}`}
                      >
                        {category === 'All' ? 'All signals' : CATEGORY_LABELS[category]}
                      </button>
                    ))}
                  </div>
                </div>
                <MomentumTable players={paginatedMomentum} selectedId={selectedPlayerId} onSelect={setSelectedPlayerId} />
                <div className="flex flex-col gap-4 border-x-4 border-b-4 border-theme-border bg-theme-bg p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-label text-[9px] font-bold uppercase tracking-widest text-gray-500">
                    Showing {momentum.pagination.from}-{momentum.pagination.to} of {momentum.pagination.total} players
                  </p>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 font-label text-[9px] font-bold uppercase tracking-wider text-gray-500">
                      Rows
                      <select
                        value={momentumPerPage}
                        onChange={(event) => {
                          setMomentumPerPage(Number(event.target.value));
                          setMomentumPage(1);
                        }}
                        className="border-2 border-theme-border bg-theme-bg px-2 py-2 font-numeric text-xs font-bold text-theme-text focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                    </label>
                    <span className="font-label text-[9px] font-bold uppercase tracking-wider text-gray-500">
                      Page {momentum.pagination.current_page} of {momentum.pagination.last_page}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        aria-label="Previous momentum page"
                        onClick={() => setMomentumPage(Math.max(1, momentum.pagination.current_page - 1))}
                        disabled={momentum.pagination.current_page === 1 || momentumLoading}
                        className="border-2 border-theme-border bg-theme-bg p-2 transition-colors hover:bg-theme-text hover:text-theme-bg disabled:opacity-30"
                      >
                        <CaretLeft size={16} weight="bold" />
                      </button>
                      <button
                        type="button"
                        aria-label="Next momentum page"
                        onClick={() => setMomentumPage(Math.min(momentum.pagination.last_page, momentum.pagination.current_page + 1))}
                        disabled={momentum.pagination.current_page === momentum.pagination.last_page || momentumLoading}
                        className="border-2 border-theme-border bg-theme-bg p-2 transition-colors hover:bg-theme-text hover:text-theme-bg disabled:opacity-30"
                      >
                        <CaretRight size={16} weight="bold" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <div className="grid border-2 border-theme-divider bg-theme-muted md:grid-cols-[1fr_auto] md:items-center">
                <p className="p-4 font-label text-[9px] uppercase leading-5 tracking-wider text-gray-500">
                  Event Performance uses ACS 33%, KAST 28%, ADR 22%, and K/D 17%. Values are role and tier percentiles winsorized at P5 and P95. Minimum {momentum.meta.minimum_matches} valid matches in both events.
                </p>
                <button type="button" onClick={() => navigate('/docs')} className="border-t-2 border-theme-divider px-5 py-4 font-label text-[9px] font-bold uppercase tracking-wider hover:bg-theme-text hover:text-theme-bg md:border-l-2 md:border-t-0">
                  Verify methodology
                </button>
              </div>
            </>
          ) : (
            <RegionPulse
              response={momentum}
              onInspect={(id) => {
                setSelectedPlayerId(id);
                setView('momentum');
              }}
            />
          )}
        </motion.div>
      )}

      {view === 'snapshot' && (
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
          className="space-y-6"
        >
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <SectionHeading
              eyebrow="Current career snapshot"
              title="SMART player directory"
              description="SMART estimates overall player quality. Provisional scores remain visible with confidence while consistency evidence is still accumulating."
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 font-label text-[9px] font-bold uppercase tracking-widest text-gray-400">Sort</span>
              {SORT_STATS.map((stat) => {
                const active = sortBy === stat;
                return (
                  <button
                    key={stat}
                    type="button"
                    onClick={() => {
                      if (active) {
                        if (sortDir === 'desc') setSortDir('asc');
                        else {
                          setSortBy('smart');
                          setSortDir('desc');
                        }
                      } else {
                        setSortBy(stat);
                        setSortDir('desc');
                      }
                    }}
                    className={`flex items-center gap-1.5 border-2 border-theme-border px-3 py-2 font-label text-[9px] font-bold uppercase tracking-wider transition-colors ${
                      active ? 'bg-theme-text text-theme-bg shadow-[3px_3px_0_var(--color-primary)]' : 'bg-theme-bg hover:bg-theme-muted'
                    }`}
                  >
                    {DISPLAY_NAMES[stat]}
                    {active && (sortDir === 'desc' ? <ArrowDown size={12} weight="bold" /> : <ArrowUp size={12} weight="bold" />)}
                  </button>
                );
              })}
            </div>
          </div>

          {snapshotError && !snapshotLoading && (
            <div role="alert" className="flex items-center justify-between gap-4 border-4 border-red-600 p-5">
              <p className="text-sm text-gray-500">{snapshotError}</p>
              <button type="button" onClick={() => setSnapshotReload((value) => value + 1)} className="border-2 border-theme-border px-4 py-2 font-label text-[9px] font-bold uppercase tracking-wider hover:bg-theme-text hover:text-theme-bg">Retry</button>
            </div>
          )}

          <div className="overflow-x-auto border-4 border-theme-border">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-4 border-theme-border bg-theme-text font-label text-[10px] font-bold uppercase tracking-widest text-theme-bg">
                  <th className="px-5 py-4">IGN</th>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Team</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Region</th>
                  <th className="px-5 py-4 text-right">{DISPLAY_NAMES[sortBy]}</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-theme-divider">
                {snapshotLoading ? (
                  Array.from({ length: 10 }).map((_, index) => (
                    <tr key={index}>
                      {Array.from({ length: 6 }).map((__, cell) => (
                        <td key={cell} className="px-5 py-4"><Skeleton className={`h-5 ${cell === 5 ? 'ml-auto w-12' : 'w-24'}`} /></td>
                      ))}
                    </tr>
                  ))
                ) : players.map((player) => (
                  <tr
                    key={player.id}
                    onClick={() => openPlayer(player.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') openPlayer(player.id);
                    }}
                    tabIndex={0}
                    className="group cursor-pointer bg-theme-bg transition-colors hover:bg-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-inset focus:ring-[var(--color-primary)]"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden border-2 border-theme-border bg-theme-muted">
                          {player.photo_url ? <img src={player.photo_url} alt="" loading="lazy" className="h-full w-full object-cover object-top" /> : <span className="font-display text-xs text-gray-400">?</span>}
                        </div>
                        <span className="font-display text-sm uppercase">{player.ign}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-label text-[10px] uppercase tracking-wider text-gray-500">{player.name}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-label text-[10px] font-bold uppercase tracking-wider">{player.team}</td>
                    <td className="whitespace-nowrap px-5 py-3.5"><span className="border border-theme-divider bg-theme-bg px-2 py-1 font-label text-[9px] font-bold uppercase tracking-wider">{player.role}</span></td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-label text-[9px] uppercase tracking-widest text-gray-500">{player.region}</td>
                    <td className="whitespace-nowrap bg-theme-text px-5 py-3.5 text-right text-[var(--color-primary)]">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-numeric text-base font-bold tabular-nums">{player.headlineStat}</span>
                        {sortBy === 'smart' && player.smartStatus === 'provisional' && (
                          <span className="font-label text-[8px] font-bold uppercase tracking-wider text-theme-bg/60" title="SMART estimate based on limited consistency evidence">
                            Provisional | {player.smartConfidence ?? 0}% conf.
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!snapshotLoading && players.length === 0 && !snapshotError && (
              <div className="px-6 py-16 text-center font-label text-xs uppercase tracking-widest text-gray-500">No players match the current filters.</div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-gray-400">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button type="button" aria-label="Previous page" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1 || snapshotLoading} className="border-4 border-theme-border bg-theme-bg p-3 transition-colors hover:bg-theme-text hover:text-theme-bg disabled:opacity-30"><CaretLeft size={18} weight="bold" /></button>
              <button type="button" aria-label="Next page" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages || snapshotLoading} className="border-4 border-theme-border bg-theme-bg p-3 transition-colors hover:bg-theme-text hover:text-theme-bg disabled:opacity-30"><CaretRight size={18} weight="bold" /></button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

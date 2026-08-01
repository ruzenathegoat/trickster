import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import RosterSlot from '@/components/simulation/RosterSlot';
import DraggablePlayerCard from '@/components/simulation/DraggablePlayerCard';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import {
  ChartBar,
  CheckCircle,
  Crosshair,
  MagnifyingGlass,
  UsersThree,
  WarningCircle,
} from '@phosphor-icons/react';

interface Player {
  id: string;
  ign: string;
  name: string;
  photo_url: string;
  current_role: string;
  is_igl: boolean;
  avg_rating: number;
}

interface Recommendation {
  player: Player;
  synergy_score: number;
  reason: string;
}

// Typical Valorant rating ceiling used only to scale the progress track
// under the Average Rating KPI — adjust if your rating model uses a
// different range.
const RATING_SCALE_MAX = 2;

export default function Simulation() {
  const [roster, setRoster] = useState<(Player | null)[]>([null, null, null, null, null]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'recommended' | 'all'>('recommended');
  const [search, setSearch] = useState('');
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetchRecommendations();
    fetchAllPlayers();
  }, []);

  const fetchRecommendations = async (currentRosterIds: string[] = []) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/v1/simulation/recommendations', { roster: currentRosterIds });
      setRecommendations(res.data);
    } catch (e) {
      toast.error('Failed to get recommendations');
    }
    setLoading(false);
  };

  const fetchAllPlayers = async () => {
    try {
      const res = await axios.get('/api/v1/players', { params: { limit: 500 } });
      setAllPlayers(res.data.data || res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const addToRoster = (player: Player) => {
    if (roster.find((p) => p?.id === player.id)) {
      toast.error('Player already in roster');
      return;
    }

    const emptyIndex = roster.findIndex((p) => p === null);
    if (emptyIndex === -1) {
      toast.error('Roster is full');
      return;
    }

    const newRoster = [...roster];
    newRoster[emptyIndex] = player;
    setRoster(newRoster);

    const currentIds = newRoster.filter((p) => p !== null).map((p) => p!.id);
    fetchRecommendations(currentIds);
  };

  const removeFromRoster = (index: number) => {
    const newRoster = [...roster];
    newRoster[index] = null;
    setRoster(newRoster);

    const currentIds = newRoster.filter((p) => p !== null).map((p) => p!.id);
    fetchRecommendations(currentIds);
  };

  const filteredAllPlayers = allPlayers.filter(
    (p) =>
      !roster.find((r) => r?.id === p.id) &&
      ((p.ign || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.name || '').toLowerCase().includes(search.toLowerCase())),
  );

  const filledSlots = roster.filter((p) => p !== null).length;
  const avgRatingValue =
    filledSlots > 0
      ? roster.filter((p) => p).reduce((acc, p) => acc + (Number(p?.avg_rating) || 0), 0) / filledSlots
      : 0;
  const ratingProgress = Math.min((avgRatingValue / RATING_SCALE_MAX) * 100, 100);
  const hasIgl = roster.some((p) => p?.is_igl);
  const isReady = filledSlots === 5 && hasIgl;

  const runSimulation = async () => {
    if (!isReady || simulating) return;
    setSimulating(true);
    try {
      // TODO: wire this up to your real endpoint, e.g.
      // await axios.post('/api/v1/simulation/run', { roster: roster.map((p) => p!.id) });
      await new Promise((resolve) => setTimeout(resolve, 900));
      toast.success('Simulation started');
    } catch (e) {
      toast.error('Failed to start simulation');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full space-y-6 pb-12 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b-2 border-black pb-6 sm:gap-5">
        <div className="inline-flex w-fit items-center gap-2 bg-black px-3 py-1.5 text-[var(--color-primary)]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-[var(--color-primary)] opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
          </span>
          <span className="font-label text-[11px] font-bold uppercase tracking-widest">
            Engine.Synergy // Active
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-4xl font-black uppercase leading-none tracking-tight text-black sm:text-5xl md:text-6xl">
            Roster Simulator
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-[var(--color-text-secondary)]">
            Build your dream 5-man roster. The engine analyzes playstyles, roles, and IGL balance
            in real time.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
        {/* Left: Roster area */}
        <div className="relative z-10 h-fit rounded-lg border border-black bg-white p-5 shadow-[4px_4px_0px_0px_#111111] sm:p-6 lg:col-span-7 lg:sticky lg:top-8 lg:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-black/10 pb-4">
            <h2 className="flex items-center gap-2 font-display text-xl font-black uppercase tracking-tight text-black sm:text-2xl">
              <Crosshair weight="regular" size={22} className="text-[var(--color-primary)]" />
              Active Roster
            </h2>
            <div className="flex items-baseline gap-1 font-mono text-lg font-semibold tabular-nums">
              <span className="text-black">{filledSlots}</span>
              <span className="text-[var(--color-text-muted)]">/ 5</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {roster.map((player, idx) => (
              <RosterSlot key={`slot-${idx}`} player={player} index={idx} onRemove={() => removeFromRoster(idx)} />
            ))}
          </div>

          {/* Composition Analysis */}
          <div className="mt-8 pt-6">
            <h3 className="mb-4 flex items-center gap-2 font-label text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">
              <ChartBar weight="regular" size={16} />
              Composition Analysis
            </h3>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {/* Hero KPI — the one place yellow is allowed to fill a surface */}
              <div className="col-span-2 flex flex-col justify-between rounded-md border border-black bg-[var(--color-primary)] p-4">
                <div className="mb-3 font-label text-[10px] font-bold uppercase tracking-widest text-black/70">
                  Average Rating
                </div>
                <AnimatedCounter
                  value={avgRatingValue}
                  decimals={2}
                  className="font-mono text-3xl font-bold leading-none text-black sm:text-4xl"
                />
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/15">
                  <motion.div
                    className="h-full rounded-full bg-black"
                    initial={false}
                    animate={{ width: `${ratingProgress}%` }}
                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  />
                </div>
              </div>

              {/* IGL status — soft semantic background, not a solid color fill */}
              <div
                className={`flex flex-col justify-between rounded-md border p-4 ${
                  hasIgl
                    ? 'border-[#10B981] bg-[#ECFDF5]'
                    : 'border-[#EF4444] bg-[#FEF2F2]'
                }`}
              >
                <div className="mb-3 font-label text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">
                  IGL Status
                </div>
                <div
                  className={`flex items-center gap-1.5 font-display text-lg font-black uppercase leading-none sm:text-xl ${
                    hasIgl ? 'text-[#047857]' : 'text-[#B91C1C]'
                  }`}
                >
                  {hasIgl ? <CheckCircle weight="regular" size={18} /> : <WarningCircle weight="regular" size={18} />}
                  {hasIgl ? 'Filled' : 'Missing'}
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-md border border-black/10 bg-[var(--color-background)] p-4">
                <div className="mb-3 font-label text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">
                  Readiness
                </div>
                <div
                  className={`flex items-center gap-1.5 text-sm font-bold uppercase leading-tight ${
                    isReady ? 'text-[#047857]' : 'text-[var(--color-text-muted)]'
                  }`}
                >
                  {isReady ? <CheckCircle weight="regular" size={16} /> : <WarningCircle weight="regular" size={16} />}
                  {isReady ? 'Ready' : 'Incomplete'}
                </div>
              </div>
            </div>
          </div>

          {/* Primary CTA — one yellow button per view */}
          <button
            type="button"
            onClick={runSimulation}
            disabled={!isReady || simulating}
            className="mt-6 w-full rounded-md border border-black bg-[var(--color-primary)] py-3 font-display text-sm font-black uppercase tracking-wide text-black shadow-[4px_4px_0px_0px_#111111] transition-all duration-150 ease-out hover:shadow-[2px_2px_0px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0"
          >
            {simulating ? 'Running Simulation…' : isReady ? 'Run Simulation' : 'Fill Roster To Simulate'}
          </button>
        </div>

        {/* Right: Player pool */}
        <div className="relative z-20 flex flex-col rounded-lg border border-black bg-white p-5 shadow-[4px_4px_0px_0px_#111111] sm:p-6 lg:col-span-5 lg:p-8">
          <div className="relative mb-5 flex border-b border-black/10" role="tablist">
            {(['recommended', 'all'] as const).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`relative flex-1 pb-3 text-center font-label text-xs font-bold uppercase tracking-widest transition-colors duration-150 ${
                  tab === key ? 'text-black' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                {key === 'recommended' ? 'Recommended' : 'All Players'}
                {tab === key && (
                  <motion.span
                    layoutId="simulation-tab-underline"
                    className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-[var(--color-primary)]"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
              </button>
            ))}
          </div>

          {tab === 'all' && (
            <div className="relative mb-4">
              <MagnifyingGlass
                size={16}
                weight="regular"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
              />
              <input
                type="text"
                placeholder="Search players…"
                className="w-full rounded-md border border-black/15 bg-white py-2.5 pl-9 pr-3 text-sm text-black placeholder:text-[var(--color-text-muted)] focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(245,217,10,0.5)]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          <div className="-mr-2 flex-1 space-y-2.5 pr-2">
            {loading ? (
              <div className="space-y-2.5" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex animate-pulse items-start gap-3 rounded-md border border-black/10 p-3">
                    <div className="h-11 w-11 shrink-0 rounded-full bg-black/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 rounded bg-black/10" />
                      <div className="h-2.5 w-1/2 rounded bg-black/5" />
                      <div className="h-2 w-full rounded bg-black/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AnimatePresence mode="popLayout" initial={false}>
                {tab === 'recommended'
                  ? recommendations.map((rec) => (
                      <DraggablePlayerCard
                        key={rec.player.id}
                        player={rec.player}
                        reason={rec.reason}
                        synergyScore={rec.synergy_score}
                        onAdd={(player) => addToRoster(player)}
                        onDoubleClick={() => addToRoster(rec.player)}
                        onDragStart={() => {}}
                        onDragEnd={(player) => addToRoster(player)}
                      />
                    ))
                  : filteredAllPlayers.slice(0, 50).map((player) => (
                      <DraggablePlayerCard
                        key={player.id}
                        player={player}
                        onAdd={(player) => addToRoster(player)}
                        onDoubleClick={() => addToRoster(player)}
                        onDragStart={() => {}}
                        onDragEnd={(p) => addToRoster(p)}
                      />
                    ))}
              </AnimatePresence>
            )}

            {!loading && tab === 'recommended' && recommendations.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-16 text-center">
                <UsersThree weight="regular" size={28} className="text-[var(--color-text-muted)]" />
                <span className="font-label text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                  No recommendations yet
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-black/10 pt-3 text-center">
            <span className="font-label text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
              Drag, double-click, or tap + to add a player
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

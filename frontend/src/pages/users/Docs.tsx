import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Calculator,
  ChartBar,
  Check,
  CheckCircle,
  ClipboardText,
  Copy,
  Database,
  FileHtml,
  Fingerprint,
  FlowArrow,
  Gauge,
  GlobeHemisphereWest,
  Info,
  MagnifyingGlass,
  ShieldCheck,
  SlidersHorizontal,
  Stack,
  TrendUp,
  UsersThree,
  Warning,
} from '@phosphor-icons/react';
import Footer from '../../components/landing/Footer';

type Criterion = {
  key: string;
  short: string;
  name: string;
  weight: number;
  type: 'benefit' | 'cost' | 'direct';
  initial: number;
};

type PatchOption = { version: string; label: string };
type MetaAgent = { name: string; icon: string | null; tier: 'S' | 'A'; shift: string | null };
type MetaComposition = {
  agents: Array<{ name: string; icon: string | null }>;
  total_matches: number;
  win_rate: number;
};
type MetaMap = {
  id: string;
  name: string;
  image: string | null;
  agents: MetaAgent[];
  compositions: MetaComposition[];
};

const criteria: Criterion[] = [
  { key: 'ci', short: 'C-PCT', name: 'Consistency Percentile', weight: 0.15, type: 'direct', initial: 72 },
  { key: 'kd', short: 'KD', name: 'Kill / Death Ratio', weight: 0.14, type: 'benefit', initial: 71 },
  { key: 'kast', short: 'KAST', name: 'KAST %', weight: 0.1292, type: 'benefit', initial: 68 },
  { key: 'fd', short: 'FD', name: 'First Death Rate', weight: 0.1185, type: 'cost', initial: 58 },
  { key: 'acs', short: 'ACS', name: 'Average Combat Score', weight: 0.1077, type: 'benefit', initial: 75 },
  { key: 'adr', short: 'ADR', name: 'Average Damage / Round', weight: 0.1077, type: 'benefit', initial: 70 },
  { key: 'mai', short: 'MAI', name: 'Meta Adaptability Index', weight: 0.0969, type: 'benefit', initial: 60 },
  { key: 'proven', short: 'PROVEN', name: 'Proven Consistency', weight: 0.08, type: 'direct', initial: 66 },
  { key: 'cqi', short: 'CQI', name: 'CQI / Competition Exposure', weight: 0.07, type: 'direct', initial: 65 },
];

const sections = [
  ['overview', '01 / Prinsip'],
  ['pipeline', '02 / Jalur data'],
  ['statistics', '03 / Statistik'],
  ['smart', '04 / SMART'],
  ['momentum', '05 / Momentum'],
  ['confidence', '06 / Provisional'],
  ['meta', '07 / Patch dan meta'],
  ['queries', '08 / Query'],
  ['verify', '09 / Verifikasi'],
] as const;

const stats = [
  ['KD', 'Kill / Death Ratio', 'Σ kills / Σ deaths', 'Jika total death nol, nilai mengikuti total kills.'],
  ['AVG', 'ACS, KAST, ADR, FK, FD', 'Σ nilai match / n match', 'Rata-rata dari observasi canonical yang lolos gate.'],
  ['WR', 'Win Rate', 'wins / matches × 100', 'Win dibandingkan dengan current_team_id player.'],
  ['R', 'VLR Rating', 'Σ rating positif / n rating positif', 'Rating nol atau negatif tidak masuk rata-rata.'],
  ['CQI', 'Competition Exposure', 'percentile(avg match quality)', 'Match quality = event base × stage factor × pre-match opponent factor. Region hanya menjadi prior awal Elo.'],
  ['ROLE', 'Detected Role', 'mode(role picks)', 'Flex jika lebih dari dua role berbeda dipakai dalam satu event.'],
];

const codeTabs = [
  {
    id: 'observations',
    label: 'Valid observations',
    language: 'SQL',
    code: `SELECT pms.*, matches.event_id
FROM player_map_stats AS pms
JOIN maps ON maps.id = pms.map_id
JOIN matches ON matches.id = pms.match_id
WHERE pms.player_id = :player_id
  AND maps.map_name = 'All Maps'
  AND matches.winner_team_id IS NOT NULL
  AND pms.acs IS NOT NULL
  AND pms.acs > 0
ORDER BY pms.id DESC;

-- Aplikasi menyisakan satu baris terbaru per match_id.`,
  },
  {
    id: 'smart',
    label: 'SMART pipeline',
    language: 'PSEUDO',
    code: `P = role_and_level_percentile(ACS, KAST, ADR, KD)
performance = .33*P.acs + .28*P.kast + .22*P.adr + .17*P.kd

Q = event_base * stage_factor * pre_match_opponent_factor
weighted_performance = sum(Q * performance) / sum(Q)
consistency = 100 - percentile(stddev(performance))
cqi = percentile(reliability_shrunk_average(Q))
proven = cbrt(consistency * cqi * weighted_performance)

for criterion in criteria:
  if criterion in [consistency, cqi, proven]:
    utility = criterion.value
  else if criterion.type == benefit:
    utility = 100 * (raw - min) / (max - min)
  else:
    utility = 100 * (max - raw) / (max - min)

SMART = sum(utility * weight)
rank = RANK() over players with >=20 matches and >=2 events`,
  },
  {
    id: 'momentum',
    label: 'Event momentum',
    language: 'PSEUDO',
    code: `metrics = percentile_by(season, role, event_tier)
EPS = 0.33 * ACS + 0.28 * KAST + 0.22 * ADR + 0.17 * KD

previous = latest_event(
  same_player,
  same_region,
  same_event_tier,
  before_current_event
)

current_reliability = current_matches / (current_matches + 5)
previous_reliability = previous_matches / (previous_matches + 5)
pair_reliability = sqrt(current_reliability * previous_reliability)

raw_delta = current_EPS - previous_EPS
adjusted_delta = raw_delta * pair_reliability

eligible = current_matches >= 3
  and previous_matches >= 3
  and role_did_not_change`,
  },
  {
    id: 'compositions',
    label: 'Team compositions',
    language: 'SQL',
    code: `WITH team_agents AS (
  SELECT pma.match_id, players.team_id,
    maps.valorant_map_name,
    STRING_AGG(pma.agent_name, ',' ORDER BY pma.agent_name) AS composition
  FROM player_match_agents AS pma
  JOIN players ON players.id = pma.player_id
  JOIN maps ON maps.id = pma.map_id
  GROUP BY pma.match_id, players.team_id, maps.valorant_map_name
  HAVING COUNT(pma.agent_name) = 5
)
SELECT map_name, composition, COUNT(*) AS picks
FROM team_agents
GROUP BY map_name, composition
ORDER BY map_name, picks DESC;`,
  },
];

function Heading({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <div className="grid gap-5 border-b-4 border-theme-border pb-7 lg:grid-cols-[minmax(0,0.72fr)_minmax(280px,0.28fr)] lg:items-end">
      <div>
        <p className="mb-3 font-label text-[11px] font-bold uppercase tracking-[0.24em] text-theme-text/50">
          <span className="mr-2 text-[var(--color-primary)]">//</span>{eyebrow}
        </p>
        <h2 className="max-w-4xl font-display text-4xl uppercase leading-[0.92] tracking-tighter sm:text-5xl lg:text-6xl">{title}</h2>
      </div>
      <p className="max-w-xl text-sm leading-6 text-theme-text/65 lg:justify-self-end">{children}</p>
    </div>
  );
}

function Tag({ children, tone = 'dark' }: { children: ReactNode; tone?: 'dark' | 'yellow' | 'green' }) {
  const colors = tone === 'yellow'
    ? 'bg-[var(--color-primary)] text-black'
    : tone === 'green' ? 'bg-emerald-500 text-black' : 'bg-theme-text text-theme-bg';
  return <span className={`${colors} inline-flex min-h-7 items-center px-2.5 font-label text-[9px] font-bold uppercase tracking-[0.18em]`}>{children}</span>;
}

function Slider({ label, value, min, max, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block border-b-2 border-theme-divider pb-4 last:border-b-0 last:pb-0">
      <span className="mb-3 flex items-center justify-between gap-4">
        <span className="font-label text-[10px] font-bold uppercase tracking-[0.16em] text-theme-text/60">{label}</span>
        <span className="min-w-14 bg-theme-text px-2 py-1 text-right font-numeric text-xs font-bold text-theme-bg">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none bg-theme-divider accent-[var(--color-primary)]"
      />
    </label>
  );
}

function CodeWorkbench() {
  const [activeId, setActiveId] = useState(codeTabs[0].id);
  const [copied, setCopied] = useState(false);
  const active = codeTabs.find((tab) => tab.id === activeId) ?? codeTabs[0];

  async function copy() {
    try {
      await navigator.clipboard.writeText(active.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="overflow-hidden border-4 border-theme-border bg-[#0d0d0d] shadow-[8px_8px_0px_0px_var(--color-primary)]">
      <div className="flex flex-col border-b-2 border-white/20 sm:flex-row sm:justify-between">
        <div className="flex overflow-x-auto" data-lenis-prevent="true">
          {codeTabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveId(tab.id)} className={`min-h-12 shrink-0 border-r border-white/20 px-4 font-label text-[10px] font-bold uppercase tracking-widest ${active.id === tab.id ? 'bg-[var(--color-primary)] text-black' : 'text-white/55 hover:text-white'}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={copy} className="flex min-h-12 items-center justify-center gap-2 px-4 font-label text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-[var(--color-primary)]">
          {copied ? <Check size={16} weight="bold" /> : <Copy size={16} weight="bold" />}{copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="flex justify-between border-b border-white/10 px-5 py-3 font-label text-[9px] font-bold tracking-[0.2em]">
        <span className="text-[var(--color-primary)]">{active.language}</span>
        <span className="uppercase text-white/30">Equivalent implementation logic</span>
      </div>
      <pre className="max-h-[500px] overflow-auto p-5 text-[12px] leading-6 text-white/75 sm:p-7" data-lenis-prevent="true"><code>{active.code}</code></pre>
    </div>
  );
}

function LiveEvidence({ patch, map, status }: { patch: PatchOption | null; map: MetaMap | null; status: 'loading' | 'ready' | 'error' }) {
  if (status === 'loading') {
    return <div className="min-h-[340px] animate-pulse border-4 border-theme-border bg-theme-muted shadow-[8px_8px_0px_0px_var(--color-primary)] motion-reduce:animate-none" />;
  }
  if (status === 'error' || !map) {
    return (
      <div className="flex min-h-[340px] flex-col justify-between border-4 border-theme-border bg-[#111] p-7 text-white shadow-[8px_8px_0px_0px_var(--color-primary)]">
        <p className="font-label text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">Endpoint offline</p>
        <div><p className="font-display text-4xl uppercase leading-none">Metode tetap tersedia</p><p className="mt-4 text-sm leading-6 text-white/55">Live evidence gagal dimuat. Formula dan query tetap dapat diaudit.</p></div>
      </div>
    );
  }
  return (
    <div className="group relative min-h-[340px] overflow-hidden border-4 border-theme-border bg-[#111] shadow-[8px_8px_0px_0px_var(--color-primary)]">
      {map.image ? <img src={map.image} alt={`Map ${map.name}`} className="absolute inset-0 h-full w-full object-cover opacity-55 grayscale transition-all duration-700 group-hover:scale-[1.02] group-hover:grayscale-0 motion-reduce:transition-none" /> : null}
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative flex min-h-[340px] flex-col justify-between p-6 text-white">
        <div className="flex items-start justify-between gap-4"><Tag tone="yellow">Live API</Tag><span className="max-w-52 text-right font-label text-[9px] font-bold uppercase leading-4 tracking-widest text-white/60">{patch?.label}</span></div>
        <div>
          <p className="font-label text-[9px] font-bold uppercase tracking-widest text-[var(--color-primary)]">/api/v1/meta/map-pool</p>
          <h2 className="mt-2 font-display text-5xl uppercase leading-none tracking-tighter sm:text-6xl">{map.name}</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {map.agents.slice(0, 6).map((agent) => (
              <div key={agent.name} className="flex items-center gap-2 border-2 border-white/50 bg-black/70 p-1.5 pr-2">
                {agent.icon ? <img src={agent.icon} alt="" className="h-7 w-7 object-cover" /> : null}
                <span className="font-label text-[9px] font-bold uppercase">{agent.tier} / {agent.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Docs() {
  const reduceMotion = useReducedMotion();
  const [activeSection, setActiveSection] = useState('overview');
  const [utilities, setUtilities] = useState<Record<string, number>>(Object.fromEntries(criteria.map((item) => [item.key, item.initial])));
  const [sampleSize, setSampleSize] = useState(8);
  const [eventCount, setEventCount] = useState(1);
  const [observedCi, setObservedCi] = useState(65);
  const [liveStatus, setLiveStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [livePatch, setLivePatch] = useState<PatchOption | null>(null);
  const [liveMap, setLiveMap] = useState<MetaMap | null>(null);

  const smartScore = useMemo(() => criteria.reduce((sum, item) => sum + utilities[item.key] * item.weight, 0), [utilities]);
  const sampleConfidence = Math.min(sampleSize / 20, 1);
  const eventConfidence = Math.min(eventCount / 2, 1);
  const confidence = sampleConfidence * eventConfidence;
  const eligible = sampleSize >= 20 && eventCount >= 2;
  const neutralPrior = 50;
  const estimatorObservedCi = sampleSize < 2 ? neutralPrior : observedCi;
  const effectiveCi = eligible ? observedCi : confidence * estimatorObservedCi + (1 - confidence) * neutralPrior;

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Docs | Trickster Methodology';
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target.id) setActiveSection(visible.target.id);
    }, { rootMargin: '-18% 0px -62% 0px', threshold: [0.05, 0.2, 0.5] });
    sections.forEach(([id]) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadEvidence() {
      try {
        const patches = await axios.get<PatchOption[]>('/api/v1/meta/patches', { signal: controller.signal });
        for (const patch of patches.data.slice(0, 8)) {
          const maps = await axios.get<MetaMap[]>(`/api/v1/meta/map-pool/${encodeURIComponent(patch.version)}`, { signal: controller.signal });
          const map = maps.data.find((item) => item.image) ?? maps.data[0];
          if (map) {
            setLivePatch(patch);
            setLiveMap(map);
            setLiveStatus('ready');
            return;
          }
        }
        throw new Error('No map');
      } catch (error) {
        if (!axios.isCancel(error)) setLiveStatus('error');
      }
    }
    loadEvidence();
    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen overflow-x-clip bg-theme-bg text-theme-text">
      <header className="sticky top-0 z-50 border-b-4 border-theme-border bg-[#111] text-white">
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-h-11 items-center gap-3 hover:text-[var(--color-primary)]">
            <img src="/logo.png" alt="Trickster" className="h-8 w-8 object-contain invert" />
            <span className="font-display text-xl uppercase tracking-tighter sm:text-2xl">Trickster</span>
            <span className="hidden border-l border-white/25 pl-3 font-label text-[10px] font-bold uppercase tracking-[0.2em] text-white/45 sm:inline">Methodology docs</span>
          </Link>
          <Link to="/app/dashboard" className="flex min-h-11 items-center gap-2 bg-[var(--color-primary)] px-4 font-display text-[11px] uppercase tracking-widest text-black hover:bg-white">Open app <ArrowRight size={16} weight="bold" /></Link>
        </div>
      </header>

      <main>
        <section className="border-b-4 border-theme-border px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <motion.div initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }} className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(380px,0.88fr)] lg:items-center">
            <div>
              <div className="mb-7 flex flex-wrap gap-2"><Tag tone="yellow">Public methodology</Tag><Tag>Implementation aligned</Tag></div>
              <p className="mb-5 font-label text-[11px] font-bold uppercase tracking-[0.25em] text-theme-text/50">Docs / Verification protocol</p>
              <h1 className="max-w-4xl font-display text-[clamp(3.4rem,8vw,8rem)] uppercase leading-[0.82] tracking-[-0.07em]">Setiap angka<br />punya jejak.</h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-theme-text/65 sm:text-lg">Dokumentasi metodologi, formula, query, dan batasan data yang dipakai Trickster.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a href="#pipeline" className="flex min-h-12 items-center justify-center gap-2 border-4 border-theme-border bg-[var(--color-primary)] px-5 font-display text-xs uppercase tracking-widest text-black shadow-[5px_5px_0px_0px_var(--color-theme-shadow)]">Trace the data <ArrowDown size={17} weight="bold" /></a>
                <a href="#smart" className="flex min-h-12 items-center justify-center gap-2 border-4 border-theme-border px-5 font-display text-xs uppercase tracking-widest hover:bg-theme-text hover:text-theme-bg">Test formula <Calculator size={17} weight="bold" /></a>
              </div>
            </div>
            <LiveEvidence patch={livePatch} map={liveMap} status={liveStatus} />
          </motion.div>
        </section>

        <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="hidden border-r-2 border-theme-divider px-6 py-12 lg:block">
            <div className="sticky top-28">
              <p className="mb-5 font-label text-[10px] font-bold uppercase tracking-[0.2em] text-theme-text/40">On this page</p>
              <nav aria-label="Dokumentasi"><ul className="space-y-1">{sections.map(([id, label]) => <li key={id}><a href={`#${id}`} aria-current={activeSection === id ? 'location' : undefined} className={`block border-l-4 py-2 pl-3 font-label text-[10px] font-bold uppercase tracking-[0.13em] ${activeSection === id ? 'border-[var(--color-primary)] text-theme-text' : 'border-transparent text-theme-text/40 hover:text-theme-text'}`}>{label}</a></li>)}</ul></nav>
              <div className="mt-8 border-2 border-theme-border bg-theme-muted p-4"><Fingerprint size={24} weight="bold" /><p className="mt-3 font-label text-[9px] font-bold uppercase tracking-widest text-theme-text/50">Core method</p><p className="mt-1 font-numeric text-xs font-bold">competition-quality-v2</p></div>
            </div>
          </aside>

          <div className="min-w-0 px-4 py-12 sm:px-6 lg:px-10 lg:py-16 xl:px-14">
            <section id="overview" className="scroll-mt-28 pb-24">
              <Heading eyebrow="01 / Prinsip transparansi" title="Angka, formula, keputusan. Dipisahkan.">Trickster membedakan data hasil observasi, transformasi matematis, dan input kurasi. Ketiganya tidak boleh dibaca sebagai hal yang sama.</Heading>
              <div className="mt-8 grid border-4 border-theme-border md:grid-cols-3">
                {[
                  [Database, 'Observed', 'Match, player, map, agent, dan statistik All Maps yang diekstrak dari halaman pertandingan VLR.', 'Automated'],
                  [Calculator, 'Derived', 'Aggregate, role-normalized performance, Elo, CQI, consistency percentile, utility, SMART, dan rank.', 'Formula'],
                  [ClipboardText, 'Curated', 'Tier agent per patch, direction, notes, map pool, dan rating yang dapat ditinjau admin.', 'Human input'],
                ].map(([Icon, title, body, tag], index) => (
                  <article key={String(title)} className={`p-6 sm:p-7 ${index < 2 ? 'border-b-4 border-theme-border md:border-b-0 md:border-r-4' : ''}`}>
                    <div className="flex justify-between"><Icon size={30} weight="bold" /><span className="font-label text-[9px] font-bold uppercase tracking-widest text-theme-text/40">{String(tag)}</span></div>
                    <h3 className="mt-9 font-display text-2xl uppercase tracking-tight">{String(title)}</h3><p className="mt-3 text-sm leading-6 text-theme-text/60">{String(body)}</p>
                  </article>
                ))}
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-[0.38fr_0.62fr]">
                <div className="border-4 border-theme-border bg-[var(--color-primary)] p-6 text-black"><ShieldCheck size={34} weight="fill" /><p className="mt-7 font-display text-3xl uppercase leading-none">Tidak ada satu angka absolut.</p></div>
                <div className="border-4 border-theme-border p-6"><p className="font-semibold leading-7">SMART adalah skor relatif terhadap cohort verified saat kalkulasi dilakukan.</p><p className="mt-3 text-sm leading-6 text-theme-text/60">Raw statistic dapat tetap sama, tetapi utility berubah saat batas cohort berubah. Baca score bersama profile, waktu kalkulasi, confidence, dan status verifikasi.</p></div>
              </div>
            </section>

            <section id="pipeline" className="scroll-mt-28 pb-24">
              <Heading eyebrow="02 / Data lineage" title="Dari halaman pertandingan ke layar.">Setiap tahap punya syarat lolos. Match yang belum lengkap tidak ikut menghitung statistik player atau SMART.</Heading>
              <div className="mt-8 grid gap-3 xl:grid-cols-5">
                {[
                  [GlobeHemisphereWest, 'Discover', 'Event VLR dibaca. Link match dimasukkan ke scrape queue.'],
                  [FileHtml, 'Capture', 'HTML disimpan. Team, winner, date, stage, dan format diperbarui.'],
                  [MagnifyingGlass, 'Validate', 'Parser mencari 10 row valid di All Maps dan winner yang diketahui.'],
                  [Stack, 'Aggregate', 'Satu observasi per player dan match menghitung stats, CI, CQI, role, MAI.'],
                  [Gauge, 'Score', 'Utility, SMART, verified rank, lalu cache invalidation.'],
                ].map(([Icon, title, body], index) => (
                  <div key={String(title)} className="relative border-4 border-theme-border p-5"><div className="flex justify-between"><span className="font-numeric text-xs text-theme-text/35">0{index + 1}</span><Icon size={25} weight="bold" /></div><h3 className="mt-10 font-display text-xl uppercase">{String(title)}</h3><p className="mt-2 text-xs leading-5 text-theme-text/55">{String(body)}</p>{index < 4 ? <span className="absolute -bottom-3 left-1/2 z-10 flex h-6 w-6 -translate-x-1/2 items-center justify-center border-2 border-theme-border bg-[var(--color-primary)] text-black xl:-right-4 xl:bottom-auto xl:left-auto xl:top-1/2 xl:-translate-y-1/2 xl:translate-x-0"><ArrowDown size={12} weight="bold" className="xl:-rotate-90" /></span> : null}</div>
                ))}
              </div>
              <div className="mt-7 border-l-8 border-[var(--color-primary)] bg-theme-muted p-6"><div className="flex gap-4"><Warning size={25} weight="fill" className="shrink-0" /><div><h3 className="font-display text-lg uppercase">Gate utama</h3><p className="mt-2 text-sm leading-6 text-theme-text/65">Row All Maps wajib memiliki kills, deaths, assists, ACS, KAST, ADR, rating, first kills, dan first deaths. ACS harus lebih dari nol. Kurang dari 10 row valid atau winner belum ada membuat match tertahan. Sumber primer dapat diperiksa di <a href="https://www.vlr.gg" target="_blank" rel="noreferrer" className="font-semibold underline decoration-[var(--color-primary)] decoration-2 underline-offset-4">VLR.gg</a>.</p></div></div></div>
            </section>

            <section id="statistics" className="scroll-mt-28 pb-24">
              <Heading eyebrow="03 / Statistik player" title="Satu match, satu observasi canonical.">Aggregate career memakai row All Maps agar satu match series tidak terhitung berkali-kali melalui tab individual map.</Heading>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {stats.map(([code, title, formula, note]) => <article key={code} className="border-4 border-theme-border p-5 hover:bg-theme-muted"><div className="flex justify-between"><span className="bg-theme-text px-2 py-1 font-numeric text-[10px] font-bold text-theme-bg">{code}</span><ChartBar size={22} weight="bold" /></div><h3 className="mt-7 font-display text-lg uppercase">{title}</h3><p className="mt-3 border-y-2 border-theme-divider py-3 font-numeric text-xs font-bold">{formula}</p><p className="mt-3 text-xs leading-5 text-theme-text/55">{note}</p></article>)}
              </div>
              <div className="mt-6 border-4 border-theme-border md:grid md:grid-cols-[180px_1fr]"><div className="flex items-center justify-center bg-[#111] p-7 text-[var(--color-primary)]"><Info size={44} weight="fill" /></div><div className="p-6"><h3 className="font-display text-xl uppercase">Catatan audit untuk transfer dan FD</h3><p className="mt-3 text-sm leading-6 text-theme-text/65">Win rate dan composition saat ini memakai team_id player yang sekarang. Transfer dapat memengaruhi rekonstruksi historis. Criterion bernama First Death Rate memakai average first deaths per match, belum dinormalisasi terhadap jumlah round.</p></div></div>
            </section>

            <section id="smart" className="scroll-mt-28 pb-24">
              <Heading eyebrow="04 / Simple Multi Attribute Rating Technique" title="SMART mengubah raw value menjadi utility.">Benefit memberi nilai lebih tinggi pada angka besar. Cost membalik arah. Consistency, CQI, dan Proven sudah berada pada skala percentile 0 sampai 100.</Heading>
              <div className="mt-8 grid gap-6 xl:grid-cols-[0.58fr_0.42fr]">
                <div className="border-4 border-theme-border p-5 sm:p-7"><div className="mb-7 flex justify-between"><div><p className="font-label text-[10px] font-bold uppercase tracking-widest text-theme-text/45">Interactive calculator</p><h3 className="mt-1 font-display text-2xl uppercase">Normalized utilities</h3></div><SlidersHorizontal size={30} weight="bold" /></div><div className="space-y-4">{criteria.map((item) => <Slider key={item.key} label={`${item.short} · weight ${Number((item.weight * 100).toFixed(2))}%`} value={utilities[item.key]} min={0} max={100} onChange={(value) => setUtilities((current) => ({ ...current, [item.key]: value }))} />)}</div></div>
                <div className="flex flex-col gap-6">
                  <div className="border-4 border-theme-border bg-[var(--color-primary)] p-7 text-black shadow-[8px_8px_0px_0px_var(--color-theme-shadow)]"><p className="font-label text-[10px] font-bold uppercase tracking-widest">Simulated SMART</p><p className="mt-5 font-display text-[clamp(4.5rem,10vw,7.5rem)] leading-none tracking-[-0.08em]">{smartScore.toFixed(1)}</p><p className="mt-4 text-sm font-semibold">Σ utility × weight. Ini simulasi, bukan data player aktual.</p></div>
                  <div className="border-4 border-theme-border p-5"><p className="mb-4 font-label text-[10px] font-bold uppercase tracking-widest text-theme-text/45">Contribution ledger</p><div className="space-y-3">{criteria.map((item) => <div key={item.key} className="grid grid-cols-[42px_1fr_52px] items-center gap-3"><span className="font-label text-[9px] font-bold">{item.short}</span><span className="h-2 bg-theme-divider"><span className="block h-full bg-[var(--color-primary)] transition-[width] motion-reduce:transition-none" style={{ width: `${utilities[item.key]}%` }} /></span><span className="text-right font-numeric text-[10px] font-bold">+{(utilities[item.key] * item.weight).toFixed(2)}</span></div>)}</div></div>
                </div>
              </div>
              <div className="mt-8 overflow-x-auto border-4 border-theme-border" data-lenis-prevent="true"><table className="w-full min-w-[720px] text-left"><thead className="bg-[#111] text-white"><tr className="font-label text-[9px] uppercase tracking-widest"><th className="p-4">Criterion</th><th className="p-4">Type</th><th className="p-4">Weight</th><th className="p-4">Normalization</th></tr></thead><tbody>{criteria.map((item) => <tr key={item.key} className="border-t-2 border-theme-divider text-sm"><td className="p-4 font-semibold">{item.name}</td><td className="p-4"><Tag tone={item.type === 'cost' ? 'yellow' : 'dark'}>{item.type}</Tag></td><td className="p-4 font-numeric font-bold">{Number((item.weight * 100).toFixed(2))}%</td><td className="p-4 font-numeric text-xs text-theme-text/60">{item.type === 'direct' ? 'direct utility 0–100' : item.type === 'benefit' ? '(x - min) / (max - min)' : '(max - x) / (max - min)'}</td></tr>)}</tbody></table></div>
              <div className="mt-6 grid gap-4 md:grid-cols-2"><div className="border-4 border-theme-border p-6"><TrendUp size={28} weight="bold" /><h3 className="mt-6 font-display text-xl uppercase">Normalization cohort</h3><p className="mt-3 text-sm leading-6 text-theme-text/60">Min dan max hanya dari verified. Provisional memakai bounds yang sama. Utility dibatasi 0 sampai 100. Jika min sama dengan max dan nilainya positif, utility menjadi 100.</p></div><div className="border-4 border-theme-border p-6"><UsersThree size={28} weight="bold" /><h3 className="mt-6 font-display text-xl uppercase">Ranking cohort</h3><p className="mt-3 text-sm leading-6 text-theme-text/60">RANK() hanya untuk verified, dipisahkan per profile, mode, dan patch. Nilai seri menerima rank sama.</p></div></div>
            </section>

            <section id="momentum" className="scroll-mt-28 pb-24">
              <Heading eyebrow="05 / Event performance dan momentum" title="Arah performa bukan bagian dari SMART.">Momentum membandingkan Event Performance Score player dengan event pembanding terdekat. SMART tetap menjadi snapshot kualitas career dan tidak menerima komponen momentum.</Heading>
              <div className="mt-8 overflow-x-auto border-4 border-theme-border" data-lenis-prevent="true">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="bg-[#111] text-white">
                    <tr className="font-label text-[9px] uppercase tracking-widest"><th className="p-4">Metric</th><th className="p-4">Weight</th><th className="p-4">Input</th><th className="p-4">Normalization</th></tr>
                  </thead>
                  <tbody>
                    {[
                      ['ACS', '33%', 'Average Combat Score', 'P5/P95 winsorized percentile'],
                      ['KAST', '28%', 'Kill, assist, survive, trade rate', 'P5/P95 winsorized percentile'],
                      ['ADR', '22%', 'Average Damage per Round', 'P5/P95 winsorized percentile'],
                      ['K/D', '17%', 'Total kills / total deaths', 'P5/P95 winsorized percentile'],
                    ].map(([metric, weight, input, normalization]) => <tr key={metric} className="border-t-2 border-theme-divider text-sm"><td className="p-4 font-semibold">{metric}</td><td className="p-4 font-numeric font-bold">{weight}</td><td className="p-4 text-theme-text/60">{input}</td><td className="p-4 font-numeric text-xs text-theme-text/60">{normalization}</td></tr>)}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 grid border-4 border-theme-border lg:grid-cols-[0.42fr_0.58fr]">
                <div className="border-b-4 border-theme-border bg-[var(--color-primary)] p-7 text-black lg:border-b-0 lg:border-r-4">
                  <p className="font-label text-[10px] font-bold uppercase tracking-widest">Event Performance Score</p>
                  <p className="mt-5 font-numeric text-sm font-bold leading-7">EPS = 0.33 ACS pct<br />+ 0.28 KAST pct<br />+ 0.22 ADR pct<br />+ 0.17 KD pct</p>
                  <p className="mt-5 text-xs font-semibold leading-5">Cohort dikunci pada season, role, dan event tier. Jika cohort role kurang dari 12 observasi, tier menjadi fallback.</p>
                </div>
                <div className="p-7">
                  <p className="font-label text-[10px] font-bold uppercase tracking-widest text-theme-text/45">Comparison contract</p>
                  <h3 className="mt-2 font-display text-2xl uppercase">Event sebelumnya, konteks yang setara.</h3>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <div><p className="font-label text-[9px] font-bold uppercase tracking-widest text-theme-text/40">Comparator</p><p className="mt-2 text-sm leading-6 text-theme-text/65">Event selesai terbaru sebelum event aktif, pada region dan tier event yang sama.</p></div>
                    <div><p className="font-label text-[9px] font-bold uppercase tracking-widest text-theme-text/40">Eligibility</p><p className="mt-2 text-sm leading-6 text-theme-text/65">Minimal 3 valid match di kedua event. Pergantian role ditandai context changed dan tidak diranking.</p></div>
                    <div><p className="font-label text-[9px] font-bold uppercase tracking-widest text-theme-text/40">Reliability</p><p className="mt-2 font-numeric text-xs leading-6 text-theme-text/65">r = n / (n + 5)<br />pair = sqrt(r current * r previous)</p></div>
                    <div><p className="font-label text-[9px] font-bold uppercase tracking-widest text-theme-text/40">Adjusted delta</p><p className="mt-2 font-numeric text-xs leading-6 text-theme-text/65">(current EPS - previous EPS) * pair reliability</p></div>
                  </div>
                </div>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="border-4 border-theme-border p-6"><GlobeHemisphereWest size={27} weight="bold" /><h3 className="mt-6 font-display text-xl uppercase">Regional by default</h3><p className="mt-3 text-xs leading-5 text-theme-text/55">Latest regional scope memilih event terbaru Americas, EMEA, Pacific, dan China. Rank dihitung di dalam region.</p></div>
                <div className="border-4 border-theme-border p-6"><ShieldCheck size={27} weight="bold" /><h3 className="mt-6 font-display text-xl uppercase">Global only on LAN</h3><p className="mt-3 text-xs leading-5 text-theme-text/55">Global rank hanya tersedia saat satu event International dipilih, karena semua player bertanding dalam event yang sama.</p></div>
                <div className="border-4 border-theme-border p-6"><TrendUp size={27} weight="bold" /><h3 className="mt-6 font-display text-xl uppercase">Signal categories</h3><p className="mt-3 text-xs leading-5 text-theme-text/55">Breakout, climber, improving, cooling, volatile, dan stable berasal dari adjusted delta serta trajectory. No baseline dan limited evidence tetap ditampilkan tanpa rank.</p></div>
              </div>
            </section>

            <section id="confidence" className="scroll-mt-28 pb-24">
              <Heading eyebrow="06 / Provisional dan verified" title="Score tersedia lebih cepat. Rank menunggu bukti.">Sample kecil tetap bisa mendapat SMART, tetapi percentile ditarik ke titik netral 50 dan tidak masuk ranking resmi.</Heading>
              <div className="mt-8 grid gap-6 xl:grid-cols-2">
                <div className="border-4 border-theme-border p-5 sm:p-7"><div className="mb-7 flex justify-between"><div><p className="font-label text-[10px] font-bold uppercase tracking-widest text-theme-text/45">Confidence simulator</p><h3 className="mt-1 font-display text-2xl uppercase">Shrinkage estimator</h3></div><Gauge size={30} weight="bold" /></div><div className="space-y-5"><Slider label="Sample matches" value={sampleSize} min={1} max={30} onChange={setSampleSize} /><Slider label="Distinct events" value={eventCount} min={0} max={4} onChange={setEventCount} /><Slider label="Observed percentile" value={observedCi} min={0} max={100} onChange={setObservedCi} /></div>{sampleSize < 2 ? <p className="mt-5 border-l-4 border-[var(--color-primary)] pl-3 text-xs leading-5 text-theme-text/60">Sample deviation belum terdefinisi. Observed percentile diabaikan dan estimator memakai prior netral 50.</p> : null}</div>
                <div className={`border-4 border-theme-border p-7 ${eligible ? 'bg-emerald-500 text-black' : 'bg-[#111] text-white'}`}><div className="flex justify-between"><Tag tone={eligible ? 'dark' : 'yellow'}>{eligible ? 'Verified' : 'Provisional'}</Tag>{eligible ? <CheckCircle size={31} weight="fill" /> : <Warning size={31} weight="fill" className="text-[var(--color-primary)]" />}</div><div className="mt-10 grid grid-cols-2 gap-5 border-y-2 border-current/25 py-6"><div><p className="font-label text-[9px] font-bold uppercase tracking-widest opacity-55">Confidence</p><p className="mt-2 font-display text-4xl">{(confidence * 100).toFixed(0)}%</p></div><div><p className="font-label text-[9px] font-bold uppercase tracking-widest opacity-55">Effective percentile</p><p className="mt-2 font-display text-4xl">{effectiveCi.toFixed(1)}</p></div></div><div className="mt-6 space-y-2 font-numeric text-[11px] leading-5 opacity-75"><p>sample confidence = min({sampleSize} / 20, 1) = {sampleConfidence.toFixed(2)}</p><p>event confidence = min({eventCount} / 2, 1) = {eventConfidence.toFixed(2)}</p><p>confidence = {sampleConfidence.toFixed(2)} × {eventConfidence.toFixed(2)} = {confidence.toFixed(2)}</p><p>effective = 50 + confidence × (observed - 50)</p></div><p className="mt-7 text-sm font-semibold leading-6">{eligible ? 'Threshold 20 match dan 2 event terpenuhi. Percentile dipakai tanpa shrinkage.' : 'Threshold belum terpenuhi. SMART dapat tampil, rank resmi tetap kosong.'}</p></div>
              </div>
              <div className="mt-6 grid border-4 border-theme-border md:grid-cols-2"><div className="border-b-4 border-theme-border p-6 md:border-b-0 md:border-r-4"><p className="font-label text-[10px] font-bold uppercase tracking-widest text-theme-text/40">Why 20 matches?</p><h3 className="mt-3 font-display text-xl uppercase">Variance butuh sample.</h3><p className="mt-3 text-sm leading-6 text-theme-text/60">Consistency memakai sample deviation dari performance utility per match. Dua observasi adalah minimum matematis, tetapi 20 match mengurangi instabilitas.</p></div><div className="p-6"><p className="font-label text-[10px] font-bold uppercase tracking-widest text-theme-text/40">Why 2 events?</p><h3 className="mt-3 font-display text-xl uppercase">Konteks harus beragam.</h3><p className="mt-3 text-sm leading-6 text-theme-text/60">Dua event mencegah verified hanya merefleksikan satu bracket, lawan, format, atau periode kompetisi.</p></div></div>
            </section>

            <section id="meta" className="scroll-mt-28 pb-24">
              <Heading eyebrow="07 / Patch, maps, agents" title="Meta adalah observasi plus kurasi.">Pick rate dan composition dihitung dari match. Tier patch dan final map rating memiliki lapisan review manusia.</Heading>
              <div className="mt-8 grid gap-4 lg:grid-cols-2"><article className="border-4 border-theme-border p-6"><div className="flex justify-between"><Tag tone="yellow">Curated</Tag><ClipboardText size={27} weight="bold" /></div><h3 className="mt-8 font-display text-2xl uppercase">Agent patch tier</h3><p className="mt-3 text-sm leading-6 text-theme-text/60">Admin menyimpan tier S sampai D, role, direction seperti buffed atau nerfed, dan notes per agent. Ini menjadi base tier untuk Meta Adaptability.</p></article><article className="border-4 border-theme-border p-6"><div className="flex justify-between"><Tag>Computed + reviewed</Tag><ChartBar size={27} weight="bold" /></div><h3 className="mt-8 font-display text-2xl uppercase">Agent map rating</h3><p className="mt-3 text-sm leading-6 text-theme-text/60">Snapshot turnamen dapat membuat proposal score 2, 4, 6, 8, atau 10. Admin menyimpan atau menggantinya dengan confidence dan source reference.</p></article></div>
              <div className="mt-6 overflow-hidden border-4 border-theme-border"><div className="grid bg-[#111] text-white md:grid-cols-5">{[['> 50','10','S'],['> 30','8','S'],['> 15','6','A'],['> 5','4','B'],['≤ 5','2','C']].map(([rate, score, tier], index) => <div key={score} className={`p-5 ${index < 4 ? 'border-b border-white/20 md:border-b-0 md:border-r' : ''}`}><p className="font-label text-[9px] font-bold uppercase tracking-widest text-white/40">Aggregated picks / maps</p><p className="mt-4 font-display text-3xl text-[var(--color-primary)]">{rate}%</p><p className="mt-2 font-numeric text-xs text-white/65">score {score} · tier {tier}</p></div>)}</div><div className="flex gap-4 p-6"><Warning size={25} weight="fill" className="shrink-0 text-amber-500" /><p className="text-sm leading-6 text-theme-text/65">Snapshot pick rate standar memakai picks / (maps × 2 teams). Proposal auto rating mengagregasi total picks / total maps sebelum threshold, sehingga nilai perantara dapat mencapai 200 persen. Final stored rating membawa confidence dan source reference.</p></div></div>
              <div className="mt-6 grid gap-4 xl:grid-cols-3">{[
                ['Map UI tiers', 'Score to tier', 'S ≥ 8 · A ≥ 6 · B ≥ 4 · C ≥ 2 · D < 2. Map pool eksplisit dipakai lebih dulu, lalu fallback ke map yang memiliki rating.'],
                ['Compositions', 'Exactly five agents', 'Agent diurutkan menjadi key. Jika patch punya event links, query dibatasi ke event tersebut. Lima composition teratas ditampilkan.'],
                ['Version history', 'Supersede, not erase', 'Koreksi map rating membuat record baru dan menandai record lama superseded.'],
              ].map(([label, title, body]) => <div key={label} className="border-4 border-theme-border p-6"><p className="font-label text-[10px] font-bold uppercase tracking-widest text-theme-text/40">{label}</p><h3 className="mt-3 font-display text-xl uppercase">{title}</h3><p className="mt-3 text-xs leading-5 text-theme-text/55">{body}</p></div>)}</div>
              <div className="mt-8 border-4 border-theme-border p-6 sm:p-8"><div className="flex flex-col gap-6 md:flex-row md:justify-between"><div className="max-w-2xl"><p className="font-label text-[10px] font-bold uppercase tracking-widest text-theme-text/40">Meta Adaptability Index</p><h3 className="mt-2 font-display text-3xl uppercase">60% alignment + 40% flexibility</h3><p className="mt-4 text-sm leading-6 text-theme-text/60">Alignment memakai base tier S=5 sampai D=1, lalu +1 jika pick rate agent pada map lebih dari 30 persen atau -1 jika di bawah 5 persen. Rata-rata diubah ke skala 0 sampai 100.</p></div><div className="min-w-[220px] bg-[var(--color-primary)] p-5 text-black"><p className="font-label text-[9px] font-bold uppercase tracking-widest">Flexibility events</p><ul className="mt-3 space-y-2 font-numeric text-[10px] font-bold"><li>switch equal / better = 100</li><li>switch worse = 50</li><li>stay after nerf = 0</li><li>stay without nerf = 50</li></ul></div></div></div>
            </section>

            <section id="queries" className="scroll-mt-28 pb-24">
              <Heading eyebrow="08 / Reproducible queries" title="Logika inti, dalam bentuk yang bisa diperiksa.">Snippet diringkas agar mudah dibaca, tetapi mempertahankan filter, cohort, arah utility, dan grouping yang menentukan hasil.</Heading>
              <div className="mt-8"><CodeWorkbench /></div>
              <div className="mt-7 grid gap-4 md:grid-cols-3">{[
                [Fingerprint, 'Consistency', 'Per-match performance dinormalisasi menurut role dan level event. Consistency = kebalikan percentile dari winsorized sample dispersion.'],
                [FlowArrow, 'Deduplication', 'Row terbaru lalu unique(match_id), sehingga satu completed match hanya memberi satu observasi.'],
                [Database, 'Cache', 'Endpoint utama dicache sampai satu jam. Kalkulasi SMART mengubah cache version.'],
              ].map(([Icon, title, body]) => <div key={String(title)} className="border-4 border-theme-border p-5"><Icon size={25} weight="bold" /><h3 className="mt-6 font-display text-lg uppercase">{String(title)}</h3><p className="mt-3 text-xs leading-5 text-theme-text/55">{String(body)}</p></div>)}</div>
            </section>

            <section id="verify" className="scroll-mt-28 pb-10">
              <Heading eyebrow="09 / User verification" title="Cara mengaudit satu angka di Trickster.">Mulai dari observasi, bukan score akhir. Catat patch dan waktu kalkulasi agar perbandingan memakai cohort yang sama.</Heading>
              <ol className="mt-8 border-4 border-theme-border">{[
                ['Temukan sumber match', 'Cocokkan event, tanggal, team, winner, dan statistik All Maps dengan halaman VLR.'],
                ['Periksa eligibility', 'Pastikan winner tersedia, ACS lebih dari nol, field wajib terisi, dan hanya satu row per match.'],
                ['Reproduksi aggregate', 'Jumlahkan K/D/A. Rata-ratakan ACS, KAST, ADR, first kills, dan first deaths.'],
                ['Audit event momentum', 'Cari event pembanding satu region dan tier, hitung percentile EPS, lalu terapkan pair reliability pada selisih score.'],
                ['Tentukan status CI', 'Hitung match dan distinct event. Official membutuhkan minimal 20 match serta 2 event.'],
                ['Ambil cohort bounds', 'Gunakan min dan max verified cohort pada profile, mode, patch, dan waktu yang sama.'],
                ['Hitung SMART', 'Terapkan benefit atau cost, kalikan utility dengan weight, lalu jumlahkan.'],
                ['Baca label', 'Periksa provisional, confidence, rank, source reference, patch, dan catatan kurasi.'],
              ].map(([title, body], index) => <li key={title} className="grid border-b-2 border-theme-divider last:border-b-0 md:grid-cols-[80px_230px_1fr]"><div className="flex min-h-16 items-center justify-center bg-theme-muted font-display text-2xl">{String(index + 1).padStart(2, '0')}</div><div className="flex items-center border-y-2 border-theme-divider px-5 py-4 font-display text-base uppercase md:border-y-0 md:border-x-2">{title}</div><p className="flex items-center px-5 py-4 text-sm leading-6 text-theme-text/60">{body}</p></li>)}</ol>
              <div className="mt-8 grid gap-6 lg:grid-cols-[0.64fr_0.36fr]">
                <div className="border-4 border-theme-border bg-[#111] p-6 text-white sm:p-8"><div className="flex items-center gap-3 text-[var(--color-primary)]"><Warning size={28} weight="fill" /><h3 className="font-display text-2xl uppercase">Known limitations</h3></div><ul className="mt-6 space-y-4 text-sm leading-6 text-white/60"><li className="border-l-2 border-[var(--color-primary)] pl-4">VLR adalah sumber pihak ketiga. Perubahan HTML dapat menunda ingest.</li><li className="border-l-2 border-[var(--color-primary)] pl-4">Percentile bersifat relatif; perubahan cohort dapat mengubah utility tanpa perubahan raw statistic.</li><li className="border-l-2 border-[var(--color-primary)] pl-4">Baris historis tanpa roster anchor dikeluarkan dari CQI agar konteks tim tidak ditebak.</li><li className="border-l-2 border-[var(--color-primary)] pl-4">Region hanya menjadi prior awal Elo dan tidak mengukur kualitas taktis secara langsung.</li><li className="border-l-2 border-[var(--color-primary)] pl-4">SMART tidak mengukur komunikasi, leadership, role fit, kondisi roster, atau hasil trial langsung.</li></ul></div>
                <div className="flex flex-col justify-between border-4 border-theme-border bg-[var(--color-primary)] p-6 text-black sm:p-8"><BookOpenText size={38} weight="fill" /><div className="mt-16"><p className="font-display text-3xl uppercase leading-none">Verification rule</p><p className="mt-4 text-sm font-semibold leading-6">Jika score tidak dapat ditelusuri ke raw observation, transformasi, cohort, weight, dan waktu kalkulasi, jangan gunakan score itu sendirian.</p></div><Link to="/app/players" className="mt-8 flex min-h-12 items-center justify-between border-4 border-black bg-black px-4 font-display text-xs uppercase tracking-widest text-white hover:bg-white hover:text-black">Inspect players <ArrowRight size={17} weight="bold" /></Link></div>
              </div>
              <div className="mt-8 flex flex-col items-start justify-between gap-5 border-t-4 border-theme-border pt-7 sm:flex-row sm:items-center"><p className="max-w-xl font-label text-[10px] font-bold uppercase leading-5 tracking-widest text-theme-text/45">Method: competition-quality-v2 · pre-match-elo-v1 · Balanced weights total 1.00</p><Link to="/" className="flex min-h-11 items-center gap-2 font-label text-[10px] font-bold uppercase tracking-widest hover:text-[var(--color-primary)]"><ArrowLeft size={16} weight="bold" /> Back to Trickster</Link></div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

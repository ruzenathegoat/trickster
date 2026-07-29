import { useState, useEffect, useMemo } from 'react';
import axios from '../../lib/axios';
import { toast } from 'sonner';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper
} from '@tanstack/react-table';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PencilSimple, X, ArrowLeft, MapPin } from '@phosphor-icons/react';

interface ValorantMap {
  id: string;
  name: string;
  is_active: boolean;
}

interface Patch {
  id: string;
  version: string;
  release_date: string;
}

interface Agent {
  agent: string;
  primary_role: string;
}

// Nested: ratings[mapName][agentName] = { score, confidence_level, source_reference }
interface AgentMapEntry {
  score: number;
  confidence_level: string;
  source_reference: string;
}
type RatingsState = Record<string, Record<string, AgentMapEntry>>;

const columnHelper = createColumnHelper<Patch>();

const DEFAULT_ENTRY: AgentMapEntry = { score: 5, confidence_level: 'early_speculative', source_reference: '' };

export default function MapRatings() {
  const [patches, setPatches] = useState<Patch[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [valorantMaps, setValorantMaps] = useState<ValorantMap[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialFetch, setInitialFetch] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatch, setSelectedPatch] = useState<Patch | null>(null);

  // Level 1: which maps are in the pool for this patch
  const [mapPool, setMapPool] = useState<Set<string>>(new Set());

  // Level 2: which map is being edited (null = level 1)
  const [activeMap, setActiveMap] = useState<string | null>(null);

  // ratings[mapName][agentName] = entry
  const [ratings, setRatings] = useState<RatingsState>({});

  // Lock body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = isModalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen]);

  const fetchData = async () => {
    try {
      const [patchesRes, agentsRes, mapsRes, eventsRes] = await Promise.all([
        axios.get('/api/v1/admin/patches'),
        axios.get('/api/v1/admin/agents'),
        axios.get('/api/v1/admin/valorant-maps'),
        axios.get('/api/v1/admin/events'),
      ]);
      setPatches(patchesRes.data);
      setAgents(agentsRes.data);
      setValorantMaps(mapsRes.data);
      setEvents(eventsRes.data);
      if (initialFetch) setInitialFetch(false);
    } catch (err) {
      toast.error('Failed to fetch data');
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = async (patch: Patch) => {
    setSelectedPatch(patch);
    setActiveMap(null);

    // Auto-select events based on Patch Version rules
    let recommendedEvents: string[] = [];
    const v = parseFloat(patch.version);

    if (v >= 12.00 && v <= 12.02) {
      recommendedEvents = events.filter(e => e.name.toLowerCase().includes('kickoff')).map(e => e.id);
    } else if (v === 12.03) {
      recommendedEvents = events.filter(e => e.name.toLowerCase().includes('santiago')).map(e => e.id);
    } else if (v >= 12.04 && v <= 12.09) {
      recommendedEvents = events.filter(e => e.name.toLowerCase().includes('stage 1')).map(e => e.id);
    } else if (v >= 12.10 && v <= 12.11) {
      recommendedEvents = events.filter(e => e.name.toLowerCase().includes('london')).map(e => e.id);
    } else if (v >= 13.01 && v <= 13.02) {
      recommendedEvents = events.filter(e => e.name.toLowerCase().includes('stage 2')).map(e => e.id);
    }
    setSelectedEvents(recommendedEvents);

    try {
      // Load existing ratings AND saved map pool in parallel
      const [ratingsRes, poolRes] = await Promise.all([
        axios.get(`/api/v1/admin/agent-map-ratings/by-patch/${patch.id}`),
        axios.get(`/api/v1/admin/patch-map-pool/${patch.id}`),
      ]);
      const existing: RatingsState = ratingsRes.data;
      const savedPool: string[] = poolRes.data; // array of map names

      // Saved pool takes priority; fallback to maps that already have ratings
      const poolFromRatings = Object.keys(existing);
      const poolNames = savedPool.length > 0 ? savedPool : poolFromRatings;
      setMapPool(new Set(poolNames));

      // Pre-fill ratings for ALL maps in master list
      const allMaps = valorantMaps.map(m => m.name);
      const initialRatings: RatingsState = {};
      for (const mapName of allMaps) {
        initialRatings[mapName] = {};
        for (const agent of agents) {
          const saved = existing[mapName]?.[agent.agent];
          initialRatings[mapName][agent.agent] = saved
            ? { score: saved.score, confidence_level: saved.confidence_level ?? 'early_speculative', source_reference: saved.source_reference ?? '' }
            : { ...DEFAULT_ENTRY };
        }
      }
      setRatings(initialRatings);
    } catch (err) {
      toast.error('Failed to load existing ratings');
      console.error(err);
    }

    setIsModalOpen(true);
  };

  const toggleMap = (mapName: string) => {
    setMapPool(prev => {
      const next = new Set(prev);
      if (next.has(mapName)) next.delete(mapName); else next.add(mapName);
      return next;
    });
  };

  const updateEntry = (mapName: string, agentName: string, field: keyof AgentMapEntry, value: string | number) => {
    setRatings(prev => ({
      ...prev,
      [mapName]: {
        ...prev[mapName],
        [agentName]: { ...prev[mapName][agentName], [field]: value }
      }
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatch) return;

    const payload: RatingsState = {};
    for (const mapName of mapPool) {
      payload[mapName] = ratings[mapName] ?? {};
    }

    setLoading(true);
    const toastId = toast.loading('Saving map ratings...');
    try {
      // Save pool definition + ratings in parallel
      await Promise.all([
        axios.post('/api/v1/admin/patch-map-pool', {
          patch_version: selectedPatch.version,
          maps: Array.from(mapPool),
        }),
        axios.post('/api/v1/admin/agent-map-ratings/bulk', {
          patch_version: selectedPatch.version,
          ratings: payload,
        }),
      ]);
      toast.success('Map ratings saved!', { id: toastId });
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Failed to save', { id: toastId });
      console.error(err);
    }
    setLoading(false);
  };

  const tableColumns = useMemo(() => [
    columnHelper.accessor('version', {
      header: 'Patch Version',
      cell: info => <span className="font-['JetBrains_Mono'] text-sm font-bold text-black">{info.getValue()}</span>
    }),
    columnHelper.accessor('release_date', {
      header: 'Release Date',
      cell: info => <span className="text-sm text-gray-600">{new Date(info.getValue()).toLocaleDateString()}</span>
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <button
          onClick={() => openModal(info.row.original)}
          className="flex items-center gap-1.5 bg-black text-white px-3 py-1.5 text-xs font-bold font-['JetBrains_Mono'] uppercase tracking-wider hover:bg-yellow-400 hover:text-black transition-colors"
        >
          <PencilSimple weight="bold" size={14} />
          Edit Ratings
        </button>
      )
    })
  ], [agents]);

  const table = useReactTable({ data: patches, columns: tableColumns, getCoreRowModel: getCoreRowModel() });

  // ── Score badge color
  const scoreBg = (s: number) =>
    s >= 8 ? 'bg-green-500 text-white' :
      s >= 6 ? 'bg-yellow-400 text-black' :
        s >= 4 ? 'bg-orange-400 text-white' :
          'bg-red-500 text-white';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Agent Map Ratings</h2>
          <p className="text-[13px] text-gray-500 mt-1">Manage per-patch map pool and per-agent scores for each map.</p>
        </div>
      </div>

      {/* ── Custom Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setIsModalOpen(false)}>
          <div className="absolute inset-0 bg-black/80" />
          <div
            className="relative w-full max-w-5xl mx-4 bg-white border-2 border-black shadow-[8px_8px_0px_0px_#111111] flex flex-col"
            style={{ maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-black bg-yellow-300 flex-shrink-0">
              <div className="flex items-center gap-3">
                {activeMap && (
                  <button
                    type="button"
                    onClick={() => setActiveMap(null)}
                    className="flex items-center gap-1 text-black hover:text-gray-700 font-['JetBrains_Mono'] text-[12px] font-bold uppercase"
                  >
                    <ArrowLeft size={16} weight="bold" />
                    Back
                  </button>
                )}
                <span className="text-[15px] font-['Archivo_Black'] uppercase tracking-wide text-black">
                  {activeMap
                    ? `PATCH ${selectedPatch?.version} — ${activeMap}`
                    : `MAP RATINGS — PATCH ${selectedPatch?.version}`}
                </span>
                {!activeMap && (
                  <span className="text-[11px] font-['JetBrains_Mono'] bg-black text-white px-2 py-0.5">
                    {mapPool.size} maps selected
                  </span>
                )}
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-black hover:text-red-600 transition-colors">
                <X size={20} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-scroll flex-1">

                {/* ── Level 1: Map Pool Selector ── */}
                {!activeMap && (
                  <div className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-200">
                      <p className="text-[12px] font-['JetBrains_Mono'] text-gray-500 uppercase">
                        Toggle maps in pool, then click a map to rate agents on it.
                      </p>
                      <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                        <div className="flex gap-2 w-full sm:w-auto">
                          <div className="border-2 border-black bg-white flex flex-col h-24 overflow-y-auto w-64 p-1">
                            {events.map(e => (
                              <label key={e.id} className="flex items-center gap-2 px-1 hover:bg-gray-100 cursor-pointer">
                                <input
                                  type="checkbox"
                                  value={e.id}
                                  checked={selectedEvents.includes(e.id)}
                                  onChange={(evt) => {
                                    if (evt.target.checked) {
                                      setSelectedEvents(prev => [...prev, e.id]);
                                    } else {
                                      setSelectedEvents(prev => prev.filter(id => id !== e.id));
                                    }
                                  }}
                                  className="accent-black"
                                />
                                <span className="text-[11px] font-['JetBrains_Mono'] truncate">{e.name}</span>
                              </label>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (selectedEvents.length === 0) return toast.error('Select at least one event');

                              const tid = toast.loading('Auto-calculating map ratings...');
                              try {
                                const res = await axios.post('/api/v1/admin/agent-map-ratings/auto-calc', {
                                  patch_id: selectedPatch?.id,
                                  event_ids: selectedEvents
                                });
                                toast.success(res.data.message, { id: tid });
                                // Refetch ratings for this patch
                                openModal(selectedPatch!);
                              } catch (err: any) {
                                toast.error(err.response?.data?.message || 'Failed to auto-calc', { id: tid });
                              }
                            }}
                            className="bg-black h-24 text-white px-3 py-1 text-[11px] font-bold font-['JetBrains_Mono'] uppercase hover:bg-yellow-400 hover:text-black transition-colors"
                          >
                            Auto-Calculate
                          </button>
                        </div>
                        {selectedEvents.length > 0 && (
                          <span className="text-[10px] font-['JetBrains_Mono'] text-gray-500">
                            {selectedEvents.length} event(s) selected
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {valorantMaps.map(({ name: mapName, is_active }) => {
                        const inPool = mapPool.has(mapName);
                        return (
                          <div
                            key={mapName}
                            className={`relative border-2 cursor-pointer transition-all ${!is_active ? 'border-gray-200 bg-gray-50 opacity-40 cursor-not-allowed' :
                              inPool ? 'border-black bg-black text-white shadow-[3px_3px_0px_0px_#F5A623]' : 'border-gray-300 bg-white text-gray-600 hover:border-black'
                              }`}
                          >
                            {/* Checkbox toggle */}
                            <button
                              type="button"
                              onClick={() => is_active && toggleMap(mapName)}
                              disabled={!is_active}
                              className="absolute top-2 right-2 w-4 h-4 border-2 flex items-center justify-center text-[10px] font-bold disabled:cursor-not-allowed"
                              style={{ borderColor: inPool ? '#fff' : '#000', color: inPool ? '#fff' : '#000' }}
                            >
                              {inPool ? '✓' : ''}
                            </button>
                            {/* Go to agent ratings */}
                            <button
                              type="button"
                              onClick={() => inPool && is_active && setActiveMap(mapName)}
                              disabled={!inPool || !is_active}
                              className="w-full px-4 py-5 text-left disabled:cursor-not-allowed"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <MapPin size={14} weight="bold" />
                                <span className="font-['JetBrains_Mono'] text-[12px] font-bold uppercase">{mapName}</span>
                              </div>
                              {inPool && (
                                <span className="text-[11px] opacity-70">
                                  {Object.values(ratings[mapName] ?? {}).filter(e => e.score !== 5).length} agents rated
                                </span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Level 2: Agent Ratings for activeMap ── */}
                {activeMap && (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 border-b-2 border-black">
                      <tr>
                        <th className="px-4 py-3 font-['JetBrains_Mono'] text-[11px] font-bold text-black uppercase">Agent</th>
                        <th className="px-4 py-3 font-['JetBrains_Mono'] text-[11px] font-bold text-black uppercase w-28">Score (1-10)</th>
                        <th className="px-4 py-3 font-['JetBrains_Mono'] text-[11px] font-bold text-black uppercase w-48">Confidence</th>
                        <th className="px-4 py-3 font-['JetBrains_Mono'] text-[11px] font-bold text-black uppercase">Source Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agents.map(agent => {
                        const entry = ratings[activeMap]?.[agent.agent] ?? { ...DEFAULT_ENTRY };
                        return (
                          <tr key={agent.agent} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className={`inline-block w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center ${scoreBg(entry.score)}`}>
                                  {entry.score}
                                </span>
                                <div>
                                  <div className="font-bold text-sm text-gray-900">{agent.agent}</div>
                                  <div className="text-[11px] text-gray-500 uppercase">{agent.primary_role}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="1" max="10" step="0.5"
                                value={entry.score}
                                onChange={e => updateEntry(activeMap, agent.agent, 'score', parseFloat(e.target.value))}
                                className="w-full px-2 py-1.5 text-sm font-['JetBrains_Mono'] rounded-none border-2 border-black bg-white focus:outline-none focus:shadow-[2px_2px_0px_0px_#111111] transition-shadow"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={entry.confidence_level}
                                onChange={e => updateEntry(activeMap, agent.agent, 'confidence_level', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm rounded-none border-2 border-black bg-white focus:outline-none focus:shadow-[2px_2px_0px_0px_#111111] transition-shadow"
                              >
                                <option value="early_speculative">Early / Speculative</option>
                                <option value="confirmed_by_tournament">Confirmed by Tournament</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={entry.source_reference}
                                onChange={e => updateEntry(activeMap, agent.agent, 'source_reference', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm rounded-none border-2 border-black bg-white focus:outline-none focus:shadow-[2px_2px_0px_0px_#111111] transition-shadow"
                                placeholder="e.g. VCT Masters picks"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t-2 border-black bg-gray-50 flex-shrink-0 flex justify-between items-center gap-3">
                <span className="text-[11px] font-['JetBrains_Mono'] text-gray-500 uppercase">
                  {activeMap ? `Editing: ${activeMap}` : `${mapPool.size} map(s) in pool`}
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-wider text-black hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || mapPool.size === 0}
                    className="bg-black border-2 border-black text-white px-6 py-2 font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-wider hover:bg-transparent hover:text-black transition-colors active:translate-y-0.5 disabled:opacity-50"
                  >
                    {loading ? 'SAVING...' : 'SAVE ALL RATINGS'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Main Table ── */}
      <div className="mb-10">
        <h3 className="font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-widest text-black bg-cyan-300 inline-block px-2 py-1 mb-2 border border-black shadow-[2px_2px_0px_0px_#111111]">
          agent_map_ratings.db
        </h3>
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#111111]">
          <Table>
            <TableHeader className="bg-gray-100 border-b-2 border-black">
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id} className="border-none hover:bg-transparent">
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id} className="h-10 px-4 font-['JetBrains_Mono'] text-[11px] font-bold text-black uppercase tracking-wider">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {initialFetch ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b-2 border-gray-100">
                    <TableCell className="p-4"><Skeleton className="h-4 w-20 bg-gray-200 rounded-none" /></TableCell>
                    <TableCell className="p-4"><Skeleton className="h-4 w-32 bg-gray-200 rounded-none" /></TableCell>
                    <TableCell className="p-4"><Skeleton className="h-6 w-24 bg-gray-200 rounded-none" /></TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} className="border-b-2 border-gray-100 hover:bg-gray-50 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-sm font-medium text-gray-500">
                    No patches found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

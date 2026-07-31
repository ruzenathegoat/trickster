import { useState, useEffect, useMemo } from 'react';
import axios from '../../lib/axios';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
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
import { PencilSimple, X, ArrowLeft, MapPin, Database, Terminal } from '@phosphor-icons/react';

interface ValorantMap {
  id: string;
  name: string;
  is_active: boolean;
  list_view_icon?: string;
}

interface Patch {
  id: string;
  version: string;
  release_date: string;
}

interface Agent {
  agent: string;
  primary_role: string;
  icon_url?: string;
}

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

  // Lock body scroll and collapse sidebar when modal open
  useEffect(() => {
    document.body.style.overflow = isModalOpen ? 'hidden' : '';
    // Dispatch custom event to tell AdminLayout to close/open sidebar
    window.dispatchEvent(new CustomEvent('toggleSidebar', { detail: { isOpen: !isModalOpen } }));
    
    return () => { 
      document.body.style.overflow = ''; 
    };
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
      const [ratingsRes, poolRes] = await Promise.all([
        axios.get(`/api/v1/admin/agent-map-ratings/by-patch/${patch.id}`),
        axios.get(`/api/v1/admin/patch-map-pool/${patch.id}`),
      ]);
      const existing: RatingsState = ratingsRes.data;
      const savedPool: string[] = poolRes.data;

      const poolFromRatings = Object.keys(existing);
      const poolNames = savedPool.length > 0 ? savedPool : poolFromRatings;
      setMapPool(new Set(poolNames));

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
    const toastId = toast.loading('Saving map ratings...', {
      style: { backgroundColor: '#000', color: '#fff', border: '4px solid #f5d90a' }
    });
    try {
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
      header: 'PATCH_VERSION',
      cell: info => <span className="font-label text-sm font-black uppercase tracking-widest text-black">{info.getValue()}</span>
    }),
    columnHelper.accessor('release_date', {
      header: 'DEPLOY_DATE',
      cell: info => <span className="font-label text-xs font-bold text-gray-700 tracking-widest uppercase">{new Date(info.getValue()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
    }),
    columnHelper.display({
      id: 'actions',
      header: 'COMMAND',
      cell: info => (
        <motion.button
          whileHover={{ scale: 1.05, y: -2, boxShadow: "4px 4px 0px 0px #111111" }}
          whileTap={{ scale: 0.95, y: 0, boxShadow: "0px 0px 0px 0px #111111" }}
          onClick={() => openModal(info.row.original)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 border-2 border-black font-label text-xs font-black uppercase tracking-wider transition-colors hover:bg-[var(--color-primary)] hover:text-black"
        >
          <PencilSimple weight="bold" size={16} />
          <span>Edit Config</span>
        </motion.button>
      )
    })
  ], [agents]);

  const table = useReactTable({ data: patches, columns: tableColumns, getCoreRowModel: getCoreRowModel() });

  const scoreBg = (s: number) =>
    s >= 8 ? 'bg-[#10b981] text-black border-black' :
      s >= 6 ? 'bg-yellow-400 text-black border-black' :
        s >= 4 ? 'bg-orange-500 text-white border-black' :
          'bg-[#ef4444] text-white border-black';

  const cardVariants: any = {
    hover: { scale: 1.02, y: -4, transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } },
    tap: { scale: 0.98, y: 0, boxShadow: "2px 2px 0px 0px #111111", transition: { duration: 0.1 } }
  };

  return (
    <div className="w-full relative z-10 space-y-12 pb-24">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-8 border-black pb-6 gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 font-label text-xs font-black uppercase tracking-widest">
            <Database weight="bold" size={16} />
            <span>sys.db // map.ratings</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter text-black leading-none">
            Map Ratings Engine
          </h2>
          <p className="font-label text-sm font-bold text-gray-700 uppercase tracking-widest max-w-xl">
            Configure agent viability scores and active map pools across historical patches.
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="space-y-4">
        <div className="inline-block bg-[var(--color-primary)] text-black px-4 py-2 border-4 border-black">
          <h3 className="font-label text-sm font-black uppercase tracking-widest">
            Patch_Registry.db
          </h3>
        </div>
        
        <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_#111111] overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#f4f4f4] border-b-4 border-black">
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id} className="border-none hover:bg-transparent">
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id} className="h-14 px-6 font-display text-sm font-black text-black uppercase tracking-widest border-r-4 border-black last:border-r-0">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {initialFetch ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b-4 border-black last:border-b-0">
                    <TableCell className="p-6 border-r-4 border-black last:border-r-0"><Skeleton className="h-5 w-20 bg-gray-200 rounded-none" /></TableCell>
                    <TableCell className="p-6 border-r-4 border-black last:border-r-0"><Skeleton className="h-4 w-32 bg-gray-200 rounded-none" /></TableCell>
                    <TableCell className="p-6 border-r-4 border-black last:border-r-0"><Skeleton className="h-8 w-32 bg-gray-200 rounded-none" /></TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} className="border-b-4 border-black last:border-b-0 hover:bg-[var(--color-primary)] transition-colors group">
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="px-6 py-4 border-r-4 border-black last:border-r-0">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="h-32 text-center text-sm font-label font-bold tracking-widest text-gray-500 uppercase">
                    No patches found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Extreme Brutalist Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12" onClick={() => setIsModalOpen(false)}>
          {/* Hard dotted backdrop */}
          <div className="absolute inset-0 bg-[#f4f4f4]/90" style={{ backgroundImage: 'radial-gradient(black 2px, transparent 2px)', backgroundSize: '16px 16px' }} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-7xl mx-auto bg-white border-4 border-black shadow-[16px_16px_0px_0px_#111111] flex flex-col h-full max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b-4 border-black bg-[var(--color-primary)] flex-shrink-0">
              <div className="flex flex-wrap items-center gap-4">
                {activeMap && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setActiveMap(null)}
                    className="flex items-center gap-2 bg-black text-white border-2 border-black px-3 py-1 font-label text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
                  >
                    <ArrowLeft size={16} weight="bold" />
                    <span>Return</span>
                  </motion.button>
                )}
                <span className="text-2xl md:text-3xl font-display font-black uppercase tracking-tighter text-black leading-none pt-1">
                  {activeMap
                    ? `PATCH ${selectedPatch?.version} // ${activeMap}`
                    : `MAP RATINGS // PATCH ${selectedPatch?.version}`}
                </span>
                {!activeMap && (
                  <span className="font-label text-xs font-black bg-black text-white px-3 py-1 uppercase tracking-widest border-2 border-black">
                    {mapPool.size} MAPS ACTIVE
                  </span>
                )}
              </div>
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="text-black bg-white border-4 border-black p-1 hover:bg-red-500 hover:text-white transition-colors"
              >
                <X size={24} weight="bold" />
              </motion.button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 bg-white">
              <div className="overflow-y-auto flex-1 p-6 md:p-8" data-lenis-prevent>

                {/* ── Level 1: Map Pool Selector ── */}
                {!activeMap && (
                  <div className="space-y-8">
                    
                    {/* Command Bar */}
                    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 border-b-4 border-black pb-8">
                      <div className="space-y-2 max-w-xl">
                        <div className="inline-block bg-black text-white px-3 py-1 font-label text-[10px] font-black uppercase tracking-widest">
                          STEP 01 // POOL DEFINITION
                        </div>
                        <p className="font-label text-sm font-bold text-gray-700 uppercase tracking-widest leading-relaxed">
                          Define the active competitive map pool for this patch. Select maps to include them in the pool, then click the map name to configure agent ratings.
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-3 w-full xl:w-auto bg-gray-100 p-4 border-4 border-black">
                        <div className="flex w-full sm:w-auto">
                          <div className="border-4 border-black border-r-0 bg-white flex flex-col h-28 overflow-y-auto w-full sm:w-72 p-2" data-lenis-prevent>
                            {events.map(e => (
                              <label key={e.id} className="flex items-center gap-3 px-2 py-1.5 hover:bg-[var(--color-primary)] cursor-pointer group transition-colors">
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
                                  className="w-4 h-4 border-2 border-black rounded-none checked:bg-black checked:text-white appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-[10px] after:text-white after:font-black after:opacity-0 checked:after:opacity-100 transition-all cursor-pointer"
                                />
                                <span className="text-xs font-label font-bold uppercase tracking-widest truncate group-hover:text-black">{e.name}</span>
                              </label>
                            ))}
                          </div>
                          <motion.button
                            whileHover={{ backgroundColor: '#111', color: '#fff' }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={async () => {
                              if (selectedEvents.length === 0) return toast.error('Select at least one event');
                              if (mapPool.size === 0) return toast.error('Select at least one map for the pool first');
                              const tid = toast.loading('Executing Auto-Calc Script...', { style: { backgroundColor: '#000', color: '#fff' }});
                              try {
                                const res = await axios.post('/api/v1/admin/agent-map-ratings/auto-calc', {
                                  patch_version: selectedPatch?.version,
                                  event_ids: selectedEvents,
                                  map_pool: Array.from(mapPool)
                                });
                                
                                // Merge calculated ratings into current state
                                const newRatings = res.data.ratings;
                                setRatings(prev => {
                                  const updated = { ...prev };
                                  for (const mapName in newRatings) {
                                    if (!updated[mapName]) updated[mapName] = {};
                                    for (const agentName in newRatings[mapName]) {
                                      updated[mapName][agentName] = { ...updated[mapName][agentName], ...newRatings[mapName][agentName] };
                                    }
                                  }
                                  return updated;
                                });

                                toast.success('Auto-calculation applied! Please review and save.', { id: tid });
                              } catch (err: any) {
                                toast.error(err.response?.data?.message || 'Failed to auto-calc', { id: tid });
                              }
                            }}
                            className="bg-[var(--color-primary)] h-28 text-black px-6 border-4 border-black flex flex-col justify-center items-center gap-2 font-display text-sm font-black uppercase transition-colors"
                          >
                            <Terminal weight="bold" size={24} />
                            <span>Auto-Calc</span>
                          </motion.button>
                        </div>
                        {selectedEvents.length > 0 && (
                          <span className="text-[10px] font-label font-black text-black uppercase bg-[var(--color-primary)] px-2 border-2 border-black">
                            {selectedEvents.length} DATASETS SELECTED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Map Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                      {valorantMaps.map(({ name: mapName, is_active, list_view_icon }) => {
                        const inPool = mapPool.has(mapName);
                        return (
                          <motion.div
                            variants={is_active ? cardVariants : undefined}
                            whileHover={is_active ? "hover" : ""}
                            whileTap={is_active ? "tap" : ""}
                            key={mapName}
                            className={`relative border-4 flex flex-col overflow-hidden transition-colors ${
                              !is_active ? 'border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed' :
                              inPool ? 'border-black bg-black text-white shadow-[6px_6px_0px_0px_var(--color-primary)]' : 
                              'border-black bg-white text-black shadow-[6px_6px_0px_0px_#111111]'
                            }`}
                          >
                            {/* Background Image */}
                            {list_view_icon && (
                              <div className="absolute inset-0 z-0">
                                <img 
                                  src={list_view_icon} 
                                  alt={mapName} 
                                  className={`w-full h-full object-cover transition-transform duration-500 grayscale ${is_active && 'group-hover:scale-110'} ${inPool ? 'opacity-30' : 'opacity-[0.05]'}`} 
                                />
                              </div>
                            )}

                            {/* Status Indicator */}
                            <div className="absolute top-0 left-0 w-full p-4 flex justify-end z-20 pointer-events-none">
                              <div className={`w-8 h-8 border-4 flex items-center justify-center font-display text-xl leading-none pt-1 transition-colors ${
                                inPool ? 'bg-[var(--color-primary)] border-black text-black' : 
                                'bg-white border-black text-transparent'
                              }`}>
                                {inPool ? '✓' : ''}
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => is_active && toggleMap(mapName)}
                              disabled={!is_active}
                              className="absolute inset-0 z-10 cursor-pointer disabled:cursor-not-allowed"
                              aria-label={`Toggle ${mapName}`}
                            />
                            
                            {/* Content & Action */}
                            <div className="relative z-30 mt-24 p-4 flex flex-col gap-3 pointer-events-none">
                              <h3 className="font-display text-3xl font-black uppercase tracking-tighter leading-none">
                                {mapName}
                              </h3>
                              
                              {inPool && (
                                <div className="inline-flex flex-col items-start gap-1">
                                  <span className="font-label text-[10px] font-black uppercase tracking-widest bg-[var(--color-primary)] text-black px-2 py-0.5 border-2 border-black">
                                    {Object.values(ratings[mapName] ?? {}).filter(e => e.score !== 5).length} AGENTS MODIFIED
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Deep Link to Rating Table */}
                            {inPool && is_active && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setActiveMap(mapName); }}
                                className="relative z-30 mt-auto bg-[var(--color-primary)] text-black border-t-4 border-black p-3 font-label text-xs font-black uppercase tracking-widest flex items-center justify-between hover:bg-white transition-colors cursor-pointer"
                              >
                                <span>Config Matrix</span>
                                <ArrowLeft size={16} weight="bold" className="rotate-180" />
                              </button>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Level 2: Agent Ratings Matrix ── */}
                {activeMap && (
                  <div className="space-y-6">
                    <div className="inline-block bg-black text-white px-3 py-1 font-label text-[10px] font-black uppercase tracking-widest">
                          STEP 02 // AGENT SCORING MATRIX
                    </div>
                    
                    <div className="border-4 border-black shadow-[6px_6px_0px_0px_#111111] overflow-x-auto">
                      <table className="w-full text-left border-collapse bg-white min-w-[800px]">
                        <thead className="bg-[#f4f4f4] border-b-4 border-black">
                          <tr>
                            <th className="px-6 py-4 font-display text-sm font-black text-black uppercase tracking-widest border-r-4 border-black">Agent ID</th>
                            <th className="px-6 py-4 font-display text-sm font-black text-black uppercase tracking-widest border-r-4 border-black w-32">Rating</th>
                            <th className="px-6 py-4 font-display text-sm font-black text-black uppercase tracking-widest border-r-4 border-black w-64">Trust Level</th>
                            <th className="px-6 py-4 font-display text-sm font-black text-black uppercase tracking-widest">Reference Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {agents.map(agent => {
                            const entry = ratings[activeMap]?.[agent.agent] ?? { ...DEFAULT_ENTRY };
                            return (
                              <tr key={agent.agent} className="border-b-4 border-black last:border-b-0 hover:bg-yellow-50 transition-colors">
                                <td className="px-6 py-4 border-r-4 border-black">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 border-4 border-black font-display text-lg pt-1 flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000] ${scoreBg(entry.score)}`}>
                                      {entry.score}
                                    </div>
                                    {agent.icon_url && (
                                      <div className="w-10 h-10 bg-black border-2 border-black flex items-center justify-center shrink-0 overflow-hidden shadow-[2px_2px_0px_var(--color-primary)]">
                                        <img src={agent.icon_url} alt={agent.agent} className="w-[120%] h-[120%] object-cover object-top scale-110 filter grayscale" />
                                      </div>
                                    )}
                                    <div className="flex flex-col">
                                      <span className="font-display text-xl uppercase tracking-tighter leading-none">{agent.agent}</span>
                                      <span className="font-label text-[10px] font-black text-gray-500 uppercase tracking-widest">{agent.primary_role}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 border-r-4 border-black">
                                  <input
                                    type="number"
                                    min="1" max="10" step="0.5"
                                    value={entry.score}
                                    onChange={e => updateEntry(activeMap, agent.agent, 'score', parseFloat(e.target.value))}
                                    className="w-full px-4 py-3 text-lg font-display font-black rounded-none border-4 border-black bg-white focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                                  />
                                </td>
                                <td className="px-6 py-4 border-r-4 border-black">
                                  <div className="relative">
                                    <select
                                      value={entry.confidence_level}
                                      onChange={e => updateEntry(activeMap, agent.agent, 'confidence_level', e.target.value)}
                                      className="w-full px-4 py-3 appearance-none text-xs font-label font-black tracking-widest uppercase rounded-none border-4 border-black bg-white focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                                    >
                                      <option value="early_speculative">Speculative</option>
                                      <option value="confirmed_by_tournament">Tournament Verified</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                      <ArrowLeft size={16} weight="bold" className="-rotate-90" />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <input
                                    type="text"
                                    value={entry.source_reference}
                                    onChange={e => updateEntry(activeMap, agent.agent, 'source_reference', e.target.value)}
                                    className="w-full px-4 py-3 text-sm font-label font-bold tracking-widest rounded-none border-4 border-black bg-white focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[4px_4px_0px_0px_#111111] transition-all placeholder:text-gray-300"
                                    placeholder="Enter source (e.g. VCT Masters)"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Command Line */}
              <div className="px-6 py-6 border-t-8 border-black bg-[#f4f4f4] flex-shrink-0 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="font-label text-xs font-black uppercase tracking-widest border-2 border-black px-4 py-2 bg-white">
                  {activeMap ? `EDITING_MATRIX: ${activeMap}` : `POOL_SIZE: ${mapPool.size} MAPS`}
                </div>
                <div className="flex w-full md:w-auto gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "4px 4px 0px 0px #111111" }}
                    whileTap={{ scale: 0.95, boxShadow: "0px 0px 0px 0px #111111" }}
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 md:flex-none px-6 py-4 border-4 border-black bg-white font-display text-lg font-black uppercase tracking-tight text-black transition-all"
                  >
                    Abort
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "4px 4px 0px 0px #111111" }}
                    whileTap={{ scale: 0.95, boxShadow: "0px 0px 0px 0px #111111" }}
                    type="submit"
                    disabled={loading || mapPool.size === 0}
                    className="flex-1 md:flex-none bg-[var(--color-primary)] border-4 border-black text-black px-8 py-4 font-display text-lg font-black uppercase tracking-tight transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'WRITING...' : 'SAVE CONFIGURATION'}
                  </motion.button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}

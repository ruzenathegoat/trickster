import { useState, useEffect, useMemo } from 'react';
import axios from '../../lib/axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  flexRender, 
  getCoreRowModel, 
  useReactTable, 
  createColumnHelper,
  getPaginationRowModel
} from '@tanstack/react-table';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PencilSimple, X, GitCommit, Target } from '@phosphor-icons/react';

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

interface PatchRating {
  id?: string;
  patch_id?: string;
  agent: string;
  role: string;
  tier: string;
  direction: string;
  notes: string;
  patch?: Patch;
  icon_url?: string;
}

const columnHelper = createColumnHelper<Patch>();

export default function PatchRatings() {
  const [patches, setPatches] = useState<Patch[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [existingRatings, setExistingRatings] = useState<PatchRating[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialFetch, setInitialFetch] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatch, setSelectedPatch] = useState<Patch | null>(null);
  const [bulkRatings, setBulkRatings] = useState<PatchRating[]>([]);

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
      const [patchesRes, agentsRes, ratingsRes] = await Promise.all([
        axios.get('/api/v1/admin/patches'),
        axios.get('/api/v1/admin/agents'),
        axios.get('/api/v1/admin/agent-patch-ratings')
      ]);
      setPatches(patchesRes.data);
      setAgents(agentsRes.data);
      setExistingRatings(ratingsRes.data);
      
      if (initialFetch) setInitialFetch(false);
    } catch (err) {
      toast.error('Failed to fetch patch data');
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openBulkEditModal = (patch: Patch) => {
    setSelectedPatch(patch);
    
    const patchRatings = existingRatings.filter(
      r => r.patch?.version === patch.version || r.patch_id === patch.id
    );
    
    const initialBulk = agents.map(agent => {
      const existing = patchRatings.find(r => r.agent === agent.agent);
      if (existing) {
        return { agent: existing.agent, role: existing.role, tier: existing.tier, direction: existing.direction, notes: existing.notes || '', icon_url: agent.icon_url };
      }
      return { agent: agent.agent, role: agent.primary_role, tier: 'C', direction: 'unchanged', notes: '', icon_url: agent.icon_url };
    });
    
    setBulkRatings(initialBulk);
    setIsModalOpen(true);
  };

  const handleBulkChange = (index: number, field: keyof PatchRating, value: string) => {
    const updated = [...bulkRatings];
    updated[index] = { ...updated[index], [field]: value };
    setBulkRatings(updated);
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatch) return;
    
    setLoading(true);
    const toastId = toast.loading('Executing mass configuration...', {
      style: { backgroundColor: '#000', color: '#fff', border: '4px solid #f5d90a' }
    });

    try {
      await axios.post('/api/v1/admin/agent-patch-ratings/bulk', {
        patch_version: selectedPatch.version,
        ratings: bulkRatings
      });
      await fetchData();
      toast.success('Mass configuration committed successfully', { id: toastId });
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Configuration sequence failed', { id: toastId });
      console.error(err);
    }
    setLoading(false);
  };

  const tableColumns = useMemo(() => [
    columnHelper.accessor('version', {
      header: 'PATCH_VERSION',
      cell: info => <span className="font-display text-xl font-black text-black">v{info.getValue()}</span>
    }),
    columnHelper.accessor('release_date', {
      header: 'DEPLOYMENT_DATE',
      cell: info => <span className="font-label text-sm font-bold text-gray-700 tracking-widest uppercase">{new Date(info.getValue()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
    }),
    columnHelper.display({
      id: 'actions',
      header: 'OPERATIONS',
      cell: info => (
        <motion.button 
          whileHover={{ scale: 1.05, y: -2, boxShadow: "4px 4px 0px 0px #111111" }}
          whileTap={{ scale: 0.95, y: 0, boxShadow: "0px 0px 0px 0px #111111" }}
          onClick={() => openBulkEditModal(info.row.original)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 border-2 border-black font-label text-xs font-black uppercase tracking-widest hover:bg-[var(--color-primary)] hover:text-black transition-colors w-fit"
        >
          <PencilSimple weight="bold" size={16} />
          CONFIG_RATINGS
        </motion.button>
      )
    })
  ], [agents, existingRatings]);

  const table = useReactTable({
    data: patches,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      }
    }
  });

  return (
    <div className="w-full relative z-10 space-y-12 pb-24">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-8 border-black pb-6 gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 font-label text-xs font-black uppercase tracking-widest">
            <GitCommit weight="bold" size={16} />
            <span>sys.db // patch.curation</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter text-black leading-none">
            Patch Ratings
          </h2>
          <p className="font-label text-sm font-bold text-gray-700 uppercase tracking-widest max-w-xl">
            Execute mass configuration of agent tier lists across global game patches.
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="space-y-4">
        <div className="inline-block bg-[var(--color-primary)] text-black px-4 py-2 border-4 border-black">
          <h3 className="font-label text-sm font-black uppercase tracking-widest">
            Patch_Archive_DB
          </h3>
        </div>
        
        <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_#111111] overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#f4f4f4] border-b-4 border-black">
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id} className="border-none hover:bg-transparent">
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id} className="h-14 px-6 font-display text-sm font-black text-black uppercase tracking-widest border-r-4 border-black last:border-r-0">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {initialFetch ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b-4 border-black last:border-b-0">
                    <TableCell className="p-6 border-r-4 border-black"><Skeleton className="h-6 w-24 bg-gray-200 rounded-none" /></TableCell>
                    <TableCell className="p-6 border-r-4 border-black"><Skeleton className="h-4 w-32 bg-gray-200 rounded-none" /></TableCell>
                    <TableCell className="p-6"><Skeleton className="h-10 w-40 bg-gray-200 rounded-none" /></TableCell>
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
                  <TableCell colSpan={tableColumns.length} className="h-32 text-center text-sm font-label font-bold tracking-widest text-gray-500 uppercase">
                    NO PATCH DATA FOUND.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Pagination Command Line */}
          {!initialFetch && table.getPageCount() > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t-4 border-black bg-[#f4f4f4]">
              <div className="font-label text-xs font-black text-black uppercase tracking-widest bg-white border-2 border-black px-3 py-1">
                SECTOR {table.getState().pagination.pageIndex + 1} // {table.getPageCount()}
              </div>
              <div className="flex gap-4">
                <motion.button
                  whileHover={table.getCanPreviousPage() ? { scale: 1.05, y: -2, boxShadow: "2px 2px 0px 0px #111111" } : {}}
                  whileTap={table.getCanPreviousPage() ? { scale: 0.95, y: 0, boxShadow: "0px 0px 0px 0px #111111" } : {}}
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="px-4 py-2 bg-white border-4 border-black font-display text-sm font-black uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-colors"
                >
                  Recall
                </motion.button>
                <motion.button
                  whileHover={table.getCanNextPage() ? { scale: 1.05, y: -2, boxShadow: "2px 2px 0px 0px #111111" } : {}}
                  whileTap={table.getCanNextPage() ? { scale: 0.95, y: 0, boxShadow: "0px 0px 0px 0px #111111" } : {}}
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-4 py-2 bg-white border-4 border-black font-display text-sm font-black uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-colors"
                >
                  Advance
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Extreme Brutalist Bulk Edit Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6" onClick={() => setIsModalOpen(false)}>
            {/* Hard dotted backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#f4f4f4]/95" 
              style={{ backgroundImage: 'radial-gradient(black 2px, transparent 2px)', backgroundSize: '16px 16px' }} 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-[95vw] md:max-w-[1200px] h-[90vh] bg-white border-4 md:border-8 border-black shadow-[16px_16px_0px_0px_#111111] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b-4 md:border-b-8 border-black bg-[var(--color-primary)] flex-shrink-0">
                <div className="flex items-center gap-4">
                  <Target size={32} weight="bold" />
                  <div className="flex flex-col">
                    <span className="text-xs font-label font-black uppercase tracking-widest text-black/70">MASS CONFIGURATION PROTOCOL</span>
                    <span className="text-2xl md:text-4xl font-display font-black uppercase tracking-tighter text-black leading-none pt-1">
                      PATCH v{selectedPatch?.version}
                    </span>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-black bg-white border-4 border-black p-2 hover:bg-red-500 hover:text-white transition-colors"
                >
                  <X size={24} weight="bold" />
                </motion.button>
              </div>
              
              <form onSubmit={handleBulkSubmit} className="flex flex-col flex-1 min-h-0 bg-white">
                <div className="overflow-auto flex-1 bg-white" data-lenis-prevent>
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-[#f4f4f4] border-b-8 border-black sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-4 font-display text-sm font-black text-black uppercase tracking-widest border-r-4 border-black">OPERATIVE (AGENT)</th>
                        <th className="px-6 py-4 font-display text-sm font-black text-black uppercase tracking-widest border-r-4 border-black w-48">TIER_CLASSIFICATION</th>
                        <th className="px-6 py-4 font-display text-sm font-black text-black uppercase tracking-widest border-r-4 border-black w-48">TRAJECTORY</th>
                        <th className="px-6 py-4 font-display text-sm font-black text-black uppercase tracking-widest">ADDITIONAL_DATA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkRatings.map((rating, idx) => (
                        <tr key={rating.agent} className="border-b-4 border-black hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 border-r-4 border-black bg-gray-50">
                            <div className="flex items-center gap-4">
                              {rating.icon_url ? (
                                <img src={rating.icon_url} alt={rating.agent} className="w-12 h-12 border-4 border-black bg-white" />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 border-4 border-black" />
                              )}
                              <div className="flex flex-col">
                                <span className="font-display text-2xl font-black uppercase tracking-tighter leading-none">{rating.agent}</span>
                                <span className="font-label text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{rating.role}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 border-r-4 border-black">
                            <div className="relative">
                              <select 
                                value={rating.tier} 
                                onChange={e => handleBulkChange(idx, 'tier', e.target.value)}
                                className={`w-full px-4 py-3 font-display text-xl font-black uppercase tracking-wider appearance-none border-4 border-black cursor-pointer focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[4px_4px_0px_0px_#111111] transition-all
                                  ${rating.tier === 'S' ? 'bg-[#ff7e67] text-white' : 
                                    rating.tier === 'A' ? 'bg-[#ffb167] text-black' : 
                                    rating.tier === 'B' ? 'bg-[#ffe467] text-black' : 
                                    rating.tier === 'C' ? 'bg-[#b7ff67] text-black' : 
                                    'bg-[#67ffd5] text-black'}`}
                              >
                                <option value="S">S-TIER (OP)</option>
                                <option value="A">A-TIER</option>
                                <option value="B">B-TIER</option>
                                <option value="C">C-TIER</option>
                                <option value="D">D-TIER</option>
                              </select>
                              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                <div className="w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-black"></div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 border-r-4 border-black">
                            <div className="relative">
                              <select 
                                value={rating.direction} 
                                onChange={e => handleBulkChange(idx, 'direction', e.target.value)}
                                className="w-full px-4 py-3 font-label text-sm font-black uppercase tracking-widest appearance-none border-4 border-black bg-white cursor-pointer focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                              >
                                <option value="buffed">BUFFED</option>
                                <option value="nerfed">NERFED</option>
                                <option value="unchanged">UNCHANGED</option>
                                <option value="reworked">REWORKED</option>
                              </select>
                              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                <div className="w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-black"></div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <input 
                              type="text" 
                              value={rating.notes} 
                              onChange={e => handleBulkChange(idx, 'notes', e.target.value)}
                              className="w-full px-4 py-3 font-label text-sm font-bold tracking-wider border-4 border-black bg-white focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[4px_4px_0px_0px_#111111] transition-all"
                              placeholder="INPUT METADATA..."
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Modal Footer Command Line */}
                <div className="px-6 py-6 border-t-8 border-black bg-[#f4f4f4] flex-shrink-0 flex flex-col sm:flex-row justify-end items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "4px 4px 0px 0px #111111" }}
                    whileTap={{ scale: 0.95, boxShadow: "0px 0px 0px 0px #111111" }}
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-full sm:w-auto px-6 py-4 border-4 border-black bg-white font-display text-lg font-black uppercase tracking-tight text-black transition-all"
                  >
                    ABORT SEQUENCE
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "4px 4px 0px 0px #111111" }}
                    whileTap={{ scale: 0.95, boxShadow: "0px 0px 0px 0px #111111" }}
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto bg-[var(--color-primary)] border-4 border-black text-black px-8 py-4 font-display text-lg font-black uppercase tracking-tight transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'WRITING...' : 'COMMIT MASS CONFIG'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

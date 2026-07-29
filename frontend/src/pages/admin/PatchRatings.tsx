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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PencilSimple, X } from '@phosphor-icons/react';

interface Patch {
  id: string;
  version: string;
  release_date: string;
}

interface Agent {
  agent: string;
  primary_role: string;
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

  // Lock / unlock body scroll when modal opens
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
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
        return { agent: existing.agent, role: existing.role, tier: existing.tier, direction: existing.direction, notes: existing.notes || '' };
      }
      return { agent: agent.agent, role: agent.primary_role, tier: 'C', direction: 'unchanged', notes: '' };
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
    const toastId = toast.loading('Saving bulk ratings...');
    try {
      await axios.post('/api/v1/admin/agent-patch-ratings/bulk', {
        patch_version: selectedPatch.version,
        ratings: bulkRatings
      });
      await fetchData();
      toast.success('Ratings saved successfully!', { id: toastId });
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Failed to save ratings', { id: toastId });
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
            onClick={() => openBulkEditModal(info.row.original)}
            className="flex items-center gap-1.5 bg-black text-white px-3 py-1.5 text-xs font-bold font-['JetBrains_Mono'] uppercase tracking-wider hover:bg-yellow-400 hover:text-black transition-colors"
          >
            <PencilSimple weight="bold" size={14} />
            Edit Ratings
          </button>
        )
      })
    ], [agents, existingRatings]);

  const table = useReactTable({
    data: patches,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Patch Ratings</h2>
          <p className="text-[13px] text-gray-500 mt-1">Manage bulk agent tier list ratings for each game patch.</p>
        </div>
      </div>

      {/* Custom modal — no Radix, no scroll lock interference */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setIsModalOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80" />

          {/* Panel */}
          <div
            className="relative w-full max-w-5xl mx-4 bg-white border-2 border-black shadow-[8px_8px_0px_0px_#111111] flex flex-col"
            style={{ maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-black bg-yellow-300 flex-shrink-0">
              <span className="text-[15px] font-['Archivo_Black'] uppercase tracking-wide text-black">
                BULK EDIT RATINGS — PATCH {selectedPatch?.version}
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-black hover:text-red-600 transition-colors"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* Scrollable body */}
            <form onSubmit={handleBulkSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-scroll flex-1">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100 border-b-2 border-black">
                    <tr>
                      <th className="px-4 py-3 font-['JetBrains_Mono'] text-[11px] font-bold text-black uppercase">Agent</th>
                      <th className="px-4 py-3 font-['JetBrains_Mono'] text-[11px] font-bold text-black uppercase w-32">Tier</th>
                      <th className="px-4 py-3 font-['JetBrains_Mono'] text-[11px] font-bold text-black uppercase w-40">Direction</th>
                      <th className="px-4 py-3 font-['JetBrains_Mono'] text-[11px] font-bold text-black uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkRatings.map((rating, idx) => (
                      <tr key={rating.agent} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-bold text-sm text-gray-900">{rating.agent}</div>
                          <div className="text-[11px] text-gray-500 uppercase">{rating.role}</div>
                        </td>
                        <td className="px-4 py-3">
                          <select 
                            value={rating.tier} 
                            onChange={e => handleBulkChange(idx, 'tier', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm rounded-none border-2 border-black bg-white focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_#111111] transition-shadow"
                          >
                            <option value="S">S-Tier</option>
                            <option value="A">A-Tier</option>
                            <option value="B">B-Tier</option>
                            <option value="C">C-Tier</option>
                            <option value="D">D-Tier</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select 
                            value={rating.direction} 
                            onChange={e => handleBulkChange(idx, 'direction', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm rounded-none border-2 border-black bg-white focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_#111111] transition-shadow"
                          >
                            <option value="buffed">Buffed</option>
                            <option value="nerfed">Nerfed</option>
                            <option value="unchanged">Unchanged</option>
                            <option value="reworked">Reworked</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="text" 
                            value={rating.notes} 
                            onChange={e => handleBulkChange(idx, 'notes', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm rounded-none border-2 border-black bg-white focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_#111111] transition-shadow"
                            placeholder="Optional notes..."
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t-2 border-black bg-gray-50 flex-shrink-0 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-wider text-black hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-black border-2 border-black text-white px-6 py-2 font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-wider hover:bg-transparent hover:text-black transition-colors active:translate-y-0.5 disabled:opacity-50"
                >
                  {loading ? 'SAVING...' : 'SAVE ALL RATINGS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-10">
        <h3 className="font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-widest text-black bg-cyan-300 inline-block px-2 py-1 mb-2 border border-black shadow-[2px_2px_0px_0px_#111111]">
          patches.db
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

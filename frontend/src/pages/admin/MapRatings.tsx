import { useState, useEffect } from 'react';
import axios from 'axios';
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
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, PencilSimple, Question, CheckCircle } from '@phosphor-icons/react';

interface Patch {
  id: string;
  version: string;
  release_date: string;
}

interface Agent {
  agent: string;
  primary_role: string;
}

interface MapRating {
  id: string;
  patch_id: string;
  agent: string;
  map: string;
  score: number;
  effective_date: string | null;
  source_reference: string | null;
  confidence_level: string | null;
  superseded_by_id: string | null;
  patch: Patch;
}

const columnHelper = createColumnHelper<MapRating>();

export default function MapRatings() {
  const [ratings, setRatings] = useState<MapRating[]>([]);
  const [patches, setPatches] = useState<Patch[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialFetch, setInitialFetch] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [supersedeId, setSupersedeId] = useState<string | null>(null);

  const [form, setForm] = useState({
    patch_id: '',
    agent: '',
    map: 'Ascent',
    score: 5,
    effective_date: '',
    source_reference: '',
    confidence_level: 'early_speculative'
  });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const mapsList = ["Ascent", "Bind", "Breeze", "Fracture", "Haven", "Icebox", "Lotus", "Pearl", "Split", "Sunset"];

  const fetchData = async () => {
    try {
      const [ratingsRes, patchesRes, agentsRes] = await Promise.all([
        axios.get('http://trickster.test/backend/public/api/v1/admin/agent-map-ratings', { headers }),
        axios.get('http://trickster.test/backend/public/api/v1/admin/patches', { headers }),
        axios.get('http://trickster.test/backend/public/api/v1/admin/agents', { headers })
      ]);
      setRatings(ratingsRes.data);
      setPatches(patchesRes.data);
      setAgents(agentsRes.data);
      
      if (patchesRes.data.length > 0 && form.patch_id === '') {
        setForm(f => ({ ...f, patch_id: patchesRes.data[0].id }));
      }
      if (agentsRes.data.length > 0 && form.agent === '') {
        setForm(f => ({ ...f, agent: agentsRes.data[0].agent }));
      }
      if (initialFetch) setInitialFetch(false);
    } catch (err) {
      toast.error('Failed to fetch map ratings');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading(supersedeId ? 'Superseding rating...' : 'Saving rating...');
    try {
      const payload = {
        ...form,
        effective_date: form.effective_date || null
      };

      if (supersedeId) {
        await axios.put(`http://trickster.test/backend/public/api/v1/admin/agent-map-ratings/${supersedeId}/supersede`, payload, { headers });
      } else {
        await axios.post('http://trickster.test/backend/public/api/v1/admin/agent-map-ratings', payload, { headers });
      }
      fetchData();
      toast.success(supersedeId ? 'Rating superseded successfully!' : 'Rating saved successfully!', { id: toastId });
      setSupersedeId(null);
      setForm({ ...form, source_reference: '' });
      setIsDialogOpen(false);
    } catch (err) {
      toast.error('Failed to save rating', { id: toastId });
      console.error(err);
    }
    setLoading(false);
  };

  const handleEdit = (r: MapRating) => {
    setSupersedeId(r.id);
    setForm({
      patch_id: r.patch_id,
      agent: r.agent,
      map: r.map,
      score: r.score,
      effective_date: r.effective_date || '',
      source_reference: r.source_reference || '',
      confidence_level: r.confidence_level || 'early_speculative'
    });
    setIsDialogOpen(true);
  };

  const handleDialogOpen = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setSupersedeId(null);
  };

  const table = useReactTable({
    data: ratings,
    columns: [
      columnHelper.accessor('patch.version', {
        header: 'Patch',
        cell: info => <span className="font-['JetBrains_Mono'] text-sm font-medium">{info.getValue()}</span>
      }),
      columnHelper.accessor('agent', {
        header: 'Agent',
        cell: info => <span className="font-medium text-gray-900">{info.getValue()}</span>
      }),
      columnHelper.accessor('map', {
        header: 'Map',
        cell: info => <span className="font-medium text-gray-900">{info.getValue()}</span>
      }),
      columnHelper.accessor('score', {
        header: 'Score',
        cell: info => <span className="font-['JetBrains_Mono'] font-bold text-[15px]">{info.getValue()}</span>
      }),
      columnHelper.accessor('confidence_level', {
        header: 'Confidence',
        cell: info => {
          const conf = info.getValue();
          const isConfirmed = conf !== 'early_speculative';
          return (
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-bold rounded-md ${
              isConfirmed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isConfirmed ? <CheckCircle weight="regular" size={12} /> : <Question weight="regular" size={12} />}
              {isConfirmed ? 'Confirmed' : 'Speculative'}
            </div>
          );
        }
      }),
      columnHelper.accessor('superseded_by_id', {
        header: 'Status',
        cell: info => info.getValue() ? (
          <span className="text-gray-400 font-bold uppercase text-xs line-through">Superseded</span>
        ) : (
          <span className="text-green-700 font-bold uppercase text-xs">Active</span>
        )
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: info => !info.row.original.superseded_by_id && (
          <button 
            onClick={() => handleEdit(info.row.original)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded hover:bg-gray-200 transition-colors duration-150 ease-out active:scale-[0.97]"
          >
            <PencilSimple weight="regular" size={14} />
            Supersede
          </button>
        )
      }),
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Agent Map Ratings</h2>
          <p className="text-[13px] text-gray-500 mt-1">Manage map-specific scores for each agent per patch.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors duration-150 ease-out active:scale-[0.97]">
              <Plus weight="regular" size={16} />
              Add Rating
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl rounded-xl border border-gray-200 bg-white p-0 shadow-xl overflow-hidden duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <DialogHeader>
                <DialogTitle className="text-[15px] font-semibold text-gray-900">
                  {supersedeId ? 'Supersede Rating' : 'Add New Rating'}
                </DialogTitle>
              </DialogHeader>
            </div>
            <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Patch</label>
                <select 
                  value={form.patch_id} 
                  onChange={e => setForm({...form, patch_id: e.target.value})}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors disabled:opacity-50"
                  disabled={!!supersedeId}
                  required
                >
                  {patches.map(p => (
                    <option key={p.id} value={p.id}>{p.version}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Agent</label>
                <select 
                  value={form.agent} 
                  onChange={e => setForm({...form, agent: e.target.value})}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors disabled:opacity-50"
                  disabled={!!supersedeId}
                  required
                >
                  {agents.map(a => (
                    <option key={a.agent} value={a.agent}>{a.agent}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Map</label>
                <select 
                  value={form.map} 
                  onChange={e => setForm({...form, map: e.target.value})}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors disabled:opacity-50"
                  disabled={!!supersedeId}
                  required
                >
                  {mapsList.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Score (1-10)</label>
                <input 
                  type="number" 
                  min="1" max="10" step="0.1"
                  value={form.score} 
                  onChange={e => setForm({...form, score: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 text-sm font-['JetBrains_Mono'] rounded-md border border-gray-300 bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Confidence Level</label>
                <select 
                  value={form.confidence_level} 
                  onChange={e => setForm({...form, confidence_level: e.target.value})}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors"
                >
                  <option value="early_speculative">Early / Speculative</option>
                  <option value="confirmed_by_tournament">Confirmed by Tournament</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Effective Date</label>
                <input 
                  type="date" 
                  value={form.effective_date} 
                  onChange={e => setForm({...form, effective_date: e.target.value})}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Source Reference</label>
                <input 
                  type="text" 
                  value={form.source_reference} 
                  onChange={e => setForm({...form, source_reference: e.target.value})}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors"
                  placeholder="e.g. VCT Masters Madrid Pick Rates"
                />
              </div>
              <div className="md:col-span-2 pt-2 flex gap-3">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors duration-150 ease-out active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Saving...' : supersedeId ? 'Confirm Supersede' : 'Save Rating'}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden mb-12">
        <Table>
          <TableHeader className="bg-gray-50/50 border-b border-gray-200">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className="border-none hover:bg-transparent">
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id} className="h-9 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {initialFetch ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-b border-gray-100">
                  <TableCell className="p-4"><Skeleton className="h-4 w-12 bg-gray-200" /></TableCell>
                  <TableCell className="p-4"><Skeleton className="h-4 w-20 bg-gray-200" /></TableCell>
                  <TableCell className="p-4"><Skeleton className="h-4 w-16 bg-gray-200" /></TableCell>
                  <TableCell className="p-4"><Skeleton className="h-5 w-8 rounded bg-gray-200" /></TableCell>
                  <TableCell className="p-4"><Skeleton className="h-4 w-24 bg-gray-200" /></TableCell>
                  <TableCell className="p-4"><Skeleton className="h-4 w-16 bg-gray-200" /></TableCell>
                  <TableCell className="p-4"><Skeleton className="h-8 w-20 bg-gray-200" /></TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => {
                const isSuperseded = !!row.original.superseded_by_id;
                return (
                  <TableRow 
                    key={row.id} 
                    className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-150 ${isSuperseded ? 'opacity-50 grayscale bg-gray-50' : ''}`}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-sm font-medium text-gray-500">
                  No map ratings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

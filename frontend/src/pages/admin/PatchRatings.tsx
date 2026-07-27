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
import { Plus, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';

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
  id: string;
  patch_id: string;
  agent: string;
  role: string;
  tier: string;
  direction: string;
  notes: string;
  patch: Patch;
}

const columnHelper = createColumnHelper<PatchRating>();

export default function PatchRatings() {
  const [ratings, setRatings] = useState<PatchRating[]>([]);
  const [patches, setPatches] = useState<Patch[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialFetch, setInitialFetch] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [form, setForm] = useState({
    patch_id: '',
    agent: '',
    role: '',
    tier: 'A',
    direction: 'unchanged',
    notes: ''
  });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const [ratingsRes, patchesRes, agentsRes] = await Promise.all([
        axios.get('http://trickster.test/backend/public/api/v1/admin/agent-patch-ratings', { headers }),
        axios.get('http://trickster.test/backend/public/api/v1/admin/patches', { headers }),
        axios.get('http://trickster.test/backend/public/api/v1/admin/agents', { headers })
      ]);
      setRatings(ratingsRes.data);
      setPatches(patchesRes.data);
      setAgents(agentsRes.data);
      
      if (patchesRes.data.length > 0 && !form.patch_id) {
        setForm(f => ({ ...f, patch_id: patchesRes.data[0].id }));
      }
      if (agentsRes.data.length > 0 && !form.agent) {
        setForm(f => ({ ...f, agent: agentsRes.data[0].agent, role: agentsRes.data[0].primary_role }));
      }
      if (initialFetch) setInitialFetch(false);
    } catch (err) {
      toast.error('Failed to fetch patch ratings data');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedAgent = agents.find(a => a.agent === e.target.value);
    setForm({
      ...form,
      agent: e.target.value,
      role: selectedAgent ? selectedAgent.primary_role : ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Saving rating...');
    try {
      await axios.post('http://trickster.test/backend/public/api/v1/admin/agent-patch-ratings', form, { headers });
      fetchData();
      toast.success('Rating saved successfully!', { id: toastId });
      setForm({ ...form, notes: '' });
      setIsDialogOpen(false);
    } catch (err) {
      toast.error('Failed to save rating', { id: toastId });
      console.error(err);
    }
    setLoading(false);
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
      columnHelper.accessor('tier', {
        header: 'Tier',
        cell: info => {
          const tier = info.getValue();
          return (
            <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-md ${
              tier === 'S' ? 'bg-[var(--color-primary)] text-[var(--color-text-on-primary)]' :
              tier === 'A' ? 'bg-green-100 text-green-800' :
              tier === 'B' ? 'bg-gray-100 text-gray-800' :
              tier === 'C' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
            }`}>
              {tier}
            </span>
          );
        }
      }),
      columnHelper.accessor('direction', {
        header: 'Direction',
        cell: info => {
          const dir = info.getValue();
          return (
            <div className="flex items-center gap-1.5 text-[13px] font-medium capitalize">
              {dir === 'buffed' && <TrendingUp size={14} className="text-green-600" />}
              {dir === 'nerfed' && <TrendingDown size={14} className="text-red-600" />}
              {dir === 'unchanged' && <Minus size={14} className="text-gray-400" />}
              {dir === 'reworked' && <RefreshCw size={14} className="text-blue-600" />}
              <span className={
                dir === 'buffed' ? 'text-green-700' :
                dir === 'nerfed' ? 'text-red-700' :
                dir === 'reworked' ? 'text-blue-700' : 'text-gray-600'
              }>{dir}</span>
            </div>
          );
        }
      }),
      columnHelper.accessor('notes', {
        header: 'Notes',
        cell: info => <span className="text-sm text-gray-600">{info.getValue()}</span>
      }),
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Patch Ratings</h2>
          <p className="text-[13px] text-gray-500 mt-1">Manage agent tier list ratings across different game patches.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors duration-150 ease-out active:scale-[0.97]">
              <Plus size={16} />
              Add Rating
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl rounded-xl border border-gray-200 bg-white p-0 shadow-xl overflow-hidden duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <DialogHeader>
                <DialogTitle className="text-[15px] font-semibold text-gray-900">Add New Rating</DialogTitle>
              </DialogHeader>
            </div>
            <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Patch</label>
                <select 
                  value={form.patch_id} 
                  onChange={e => setForm({...form, patch_id: e.target.value})}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors"
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
                  onChange={handleAgentChange}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors"
                  required
                >
                  {agents.map(a => (
                    <option key={a.agent} value={a.agent}>{a.agent}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-400 mb-1.5">Role (Auto-filled)</label>
                <input 
                  type="text" 
                  value={form.role} 
                  readOnly
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Tier</label>
                <select 
                  value={form.tier} 
                  onChange={e => setForm({...form, tier: e.target.value})}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors"
                >
                  <option value="S">S - S-Tier</option>
                  <option value="A">A - A-Tier</option>
                  <option value="B">B - B-Tier</option>
                  <option value="C">C - C-Tier</option>
                  <option value="D">D - D-Tier</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Direction</label>
                <select 
                  value={form.direction} 
                  onChange={e => setForm({...form, direction: e.target.value})}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors"
                >
                  <option value="buffed">Buffed</option>
                  <option value="nerfed">Nerfed</option>
                  <option value="unchanged">Unchanged</option>
                  <option value="reworked">Reworked</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Notes</label>
                <input 
                  type="text" 
                  value={form.notes} 
                  onChange={e => setForm({...form, notes: e.target.value})}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors"
                  placeholder="e.g. Flash duration increased"
                />
              </div>
              <div className="md:col-span-2 pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors duration-150 ease-out active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Rating'}
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
                  <TableCell className="p-4"><Skeleton className="h-5 w-8 rounded bg-gray-200" /></TableCell>
                  <TableCell className="p-4"><Skeleton className="h-4 w-16 bg-gray-200" /></TableCell>
                  <TableCell className="p-4"><Skeleton className="h-4 w-40 bg-gray-200" /></TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-150">
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-sm font-medium text-gray-500">
                  No ratings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

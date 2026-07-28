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
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, TrendUp, TrendDown, Minus, ArrowsClockwise } from '@phosphor-icons/react';

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
    patch_version: '',
    agent: '',
    role: '',
    tier: 'A',
    direction: 'unchanged',
    notes: ''
  });

  const fetchData = async () => {
    try {
      const [ratingsRes, patchesRes, agentsRes] = await Promise.all([
        axios.get('/api/v1/admin/agent-patch-ratings'),
        axios.get('/api/v1/admin/patches'),
        axios.get('/api/v1/admin/agents')
      ]);
      setRatings(ratingsRes.data);
      setPatches(patchesRes.data);
      setAgents(agentsRes.data);
      
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
      await axios.post('/api/v1/admin/agent-patch-ratings', form);
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

  const tableColumns = useMemo(() => [
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
              {dir === 'buffed' && <TrendUp weight="regular" size={14} className="text-green-600" />}
              {dir === 'nerfed' && <TrendDown weight="regular" size={14} className="text-red-600" />}
              {dir === 'unchanged' && <Minus weight="regular" size={14} className="text-gray-400" />}
              {dir === 'reworked' && <ArrowsClockwise weight="regular" size={14} className="text-blue-600" />}
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
    ], []);

  const table = useReactTable({
    data: ratings,
    columns: tableColumns,
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
            <button className="flex items-center justify-center gap-2 bg-black border-2 border-black text-white px-4 py-2 font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-wider hover:bg-transparent hover:text-black transition-colors active:translate-y-0.5 shadow-[4px_4px_0px_0px_#111111] hover:shadow-none">
              <Plus weight="regular" size={14} />
              ADD RATING
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl rounded-none border-2 border-black bg-white p-0 shadow-[8px_8px_0px_0px_#111111]">
            <div className="px-5 py-4 border-b-2 border-black bg-yellow-300">
              <DialogHeader>
                <DialogTitle className="text-[15px] font-['Archivo_Black'] uppercase tracking-wide text-black">ADD NEW RATING</DialogTitle>
              </DialogHeader>
            </div>
            <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-['JetBrains_Mono'] font-bold text-black uppercase mb-1.5">Patch</label>
                <input 
                  type="text"
                  value={form.patch_version} 
                  onChange={e => setForm({...form, patch_version: e.target.value})}
                  className="w-full px-3 py-2 text-sm rounded-none border-2 border-black bg-white focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_#111111] transition-shadow"
                  placeholder="e.g. 8.11"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-['JetBrains_Mono'] font-bold text-black uppercase mb-1.5">Agent</label>
                <select 
                  value={form.agent} 
                  onChange={handleAgentChange}
                  className="w-full px-3 py-2 text-sm rounded-none border-2 border-black bg-white focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_#111111] transition-shadow"
                  required
                >
                  {agents.map(a => (
                    <option key={a.agent} value={a.agent}>{a.agent}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-['JetBrains_Mono'] font-bold text-gray-500 uppercase mb-1.5">Role (Auto-filled)</label>
                <input 
                  type="text" 
                  value={form.role} 
                  readOnly
                  className="w-full px-3 py-2 text-sm rounded-none border-2 border-black bg-gray-200 text-gray-600 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-['JetBrains_Mono'] font-bold text-black uppercase mb-1.5">Tier</label>
                <select 
                  value={form.tier} 
                  onChange={e => setForm({...form, tier: e.target.value})}
                  className="w-full px-3 py-2 text-sm rounded-none border-2 border-black bg-white focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_#111111] transition-shadow"
                >
                  <option value="S">S - S-Tier</option>
                  <option value="A">A - A-Tier</option>
                  <option value="B">B - B-Tier</option>
                  <option value="C">C - C-Tier</option>
                  <option value="D">D - D-Tier</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-['JetBrains_Mono'] font-bold text-black uppercase mb-1.5">Direction</label>
                <select 
                  value={form.direction} 
                  onChange={e => setForm({...form, direction: e.target.value})}
                  className="w-full px-3 py-2 text-sm rounded-none border-2 border-black bg-white focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_#111111] transition-shadow"
                >
                  <option value="buffed">Buffed</option>
                  <option value="nerfed">Nerfed</option>
                  <option value="unchanged">Unchanged</option>
                  <option value="reworked">Reworked</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-['JetBrains_Mono'] font-bold text-black uppercase mb-1.5">Notes</label>
                <input 
                  type="text" 
                  value={form.notes} 
                  onChange={e => setForm({...form, notes: e.target.value})}
                  className="w-full px-3 py-2 text-sm rounded-none border-2 border-black bg-white focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_#111111] transition-shadow"
                  placeholder="e.g. Flash duration increased"
                />
              </div>
              <div className="md:col-span-2 pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-black border-2 border-black text-white px-4 py-2.5 font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-wider hover:bg-transparent hover:text-black transition-colors active:translate-y-0.5 disabled:opacity-50 mt-2"
                >
                  {loading ? 'SAVING...' : 'SAVE RATING'}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-10">
        <h3 className="font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-widest text-black bg-cyan-300 inline-block px-2 py-1 mb-2 border border-black shadow-[2px_2px_0px_0px_#111111]">
          agent_patch_ratings.db
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
                  <TableCell className="p-4"><Skeleton className="h-4 w-12 bg-gray-200 rounded-none" /></TableCell>
                  <TableCell className="p-4"><Skeleton className="h-4 w-20 bg-gray-200 rounded-none" /></TableCell>
                  <TableCell className="p-4"><Skeleton className="h-5 w-8 bg-gray-200 rounded-none" /></TableCell>
                  <TableCell className="p-4"><Skeleton className="h-4 w-16 bg-gray-200 rounded-none" /></TableCell>
                  <TableCell className="p-4"><Skeleton className="h-4 w-40 bg-gray-200 rounded-none" /></TableCell>
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
                <TableCell colSpan={5} className="h-24 text-center text-sm font-medium text-gray-500">
                  No ratings found.
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

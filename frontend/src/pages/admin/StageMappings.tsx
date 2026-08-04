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
import { Terminal, Plus } from '@phosphor-icons/react';

interface StageMapping {
  id: string;
  raw_label: string;
  normalized_stage: string;
  pressure_weight: number;
}

const columnHelper = createColumnHelper<StageMapping>();

export default function StageMappings() {
  const [mappings, setMappings] = useState<StageMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialFetch, setInitialFetch] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [form, setForm] = useState({
    raw_label: '',
    normalized_stage: 'regular_season',
    pressure_weight: 1.00
  });

  const fetchMappings = async () => {
    try {
      const res = await axios.get('/api/v1/admin/stage-mappings');
      setMappings(res.data);
      if (initialFetch) setInitialFetch(false);
    } catch (err) {
      toast.error('Failed to fetch stage mappings');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMappings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Saving stage mapping...');
    try {
      await axios.post('/api/v1/admin/stage-mappings', form);
      fetchMappings();
      toast.success('Mapping saved successfully!', { id: toastId });
      setForm({ ...form, raw_label: '' });
      setIsDialogOpen(false);
    } catch (err: any) {
      toast.error('Failed to save mapping: ' + (err.response?.data?.message || err.message), { id: toastId });
      console.error(err);
    }
    setLoading(false);
  };

  const tableColumns = useMemo(() => [
      columnHelper.accessor('raw_label', {
        header: 'RAW_LABEL',
        cell: info => <span className="font-['JetBrains_Mono'] text-[12px] uppercase font-bold">{info.getValue()}</span>
      }),
      columnHelper.accessor('normalized_stage', {
        header: 'NORMALIZED_STAGE',
        cell: info => {
          const val = info.getValue() || '';
          return (
            <span className={`font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 border ${
              val === 'grand_final' ? 'bg-red-100 border-red-900 text-red-900' :
              val === 'playoffs' ? 'bg-indigo-100 border-indigo-900 text-indigo-900' :
              'bg-green-100 border-green-900 text-green-900'
            }`}>
              [{val.replace('_', ' ')}]
            </span>
          );
        }
      }),
      columnHelper.accessor('pressure_weight', {
        header: 'WEIGHT',
        cell: info => {
          const w = info.getValue();
          return (
            <span className="font-['JetBrains_Mono'] font-bold text-[14px]">
              {w.toFixed(2)}x
            </span>
          );
        }
      }),
    ], []);

  const table = useReactTable({
    data: mappings,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="font-['Inter']">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-theme-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Terminal weight="regular" size={18} />
            <h2 className="text-2xl font-['Archivo_Black'] uppercase tracking-tight text-theme-text leading-none mt-1">
              Stage Mappings
            </h2>
          </div>
          <p className="text-[12px] font-['JetBrains_Mono'] text-gray-500 uppercase tracking-widest">
            Normalize scraped stage labels & pressure weights.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 bg-black border-2 border-theme-border text-white px-4 py-2 font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-wider hover:bg-transparent hover:text-theme-text transition-colors active:translate-y-0.5">
              <Plus weight="regular" size={14} />
              NEW MAPPING
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-[var(--color-background)] border-2 border-theme-border p-0 shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] rounded-none overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
            <div className="px-5 py-4 border-b-2 border-theme-border bg-theme-bg">
              <DialogHeader>
                <DialogTitle className="font-['Archivo_Black'] uppercase text-xl text-theme-text">Create Mapping</DialogTitle>
              </DialogHeader>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 gap-5 bg-theme-bg">
              <div>
                <label className="block text-[11px] font-['JetBrains_Mono'] font-bold text-gray-700 uppercase tracking-widest mb-1">Raw Label (VLR)</label>
                <input 
                  type="text" 
                  value={form.raw_label} 
                  onChange={e => setForm({...form, raw_label: e.target.value})}
                  className="w-full px-3 py-2 text-sm font-['JetBrains_Mono'] border-2 border-theme-border bg-gray-50 focus:bg-theme-bg focus:outline-none focus:ring-4 focus:ring-yellow-200 transition-all rounded-none"
                  placeholder="e.g. Playoffs - Grand Final"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-['JetBrains_Mono'] font-bold text-gray-700 uppercase tracking-widest mb-1">Normalized Stage</label>
                  <select 
                    value={form.normalized_stage} 
                    onChange={e => setForm({...form, normalized_stage: e.target.value})}
                    className="w-full px-3 py-2 text-sm font-['JetBrains_Mono'] border-2 border-theme-border bg-gray-50 focus:bg-theme-bg focus:outline-none focus:ring-4 focus:ring-yellow-200 transition-all rounded-none"
                    required
                  >
                    <option value="regular_season">Regular Season</option>
                    <option value="playoffs">Playoffs</option>
                    <option value="grand_final">Grand Final</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-['JetBrains_Mono'] font-bold text-gray-700 uppercase tracking-widest mb-1">Pressure Weight</label>
                  <input 
                    type="number" 
                    min="0" max="5" step="0.1"
                    value={form.pressure_weight} 
                    onChange={e => setForm({...form, pressure_weight: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 text-sm font-['JetBrains_Mono'] font-bold border-2 border-theme-border bg-gray-50 focus:bg-theme-bg focus:outline-none focus:ring-4 focus:ring-yellow-200 transition-all rounded-none"
                    required
                  />
                </div>
              </div>
              <div className="pt-2 mt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-black border-2 border-theme-border px-4 py-3 text-[14px] font-['Archivo_Black'] uppercase text-white hover:bg-transparent hover:text-theme-text transition-colors active:translate-y-1 shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] hover:shadow-none disabled:opacity-50 rounded-none"
                >
                  {loading ? 'SAVING...' : 'SAVE MAPPING'}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-10">
        <h3 className="font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-widest text-theme-text bg-yellow-300 inline-block px-2 py-1 mb-2 border border-theme-border">
          stage_mappings.db
        </h3>
        <div className="bg-theme-bg border border-theme-border">
          <Table>
            <TableHeader className="bg-gray-100 border-b border-theme-border">
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id} className="border-none">
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id} className="h-10 px-4 font-['JetBrains_Mono'] text-[11px] font-bold text-theme-text border-r border-theme-border last:border-r-0">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {initialFetch ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-theme-border last:border-b-0">
                    <TableCell className="p-3 border-r border-theme-border last:border-r-0"><Skeleton className="h-4 w-48 bg-gray-200 rounded-none" /></TableCell>
                    <TableCell className="p-3 border-r border-theme-border last:border-r-0"><Skeleton className="h-5 w-24 bg-gray-200 rounded-none" /></TableCell>
                    <TableCell className="p-3 border-r border-theme-border last:border-r-0"><Skeleton className="h-4 w-12 bg-gray-200 rounded-none" /></TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} className="border-b border-theme-border last:border-b-0 hover:bg-yellow-50 transition-none">
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="px-4 py-3 border-r border-theme-border last:border-r-0">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-sm font-['JetBrains_Mono'] text-gray-500">
                    No mappings found.
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

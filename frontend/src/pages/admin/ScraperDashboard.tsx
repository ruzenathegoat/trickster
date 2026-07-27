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
import { Terminal, Play, AlertTriangle } from 'lucide-react';

interface ScrapeLog {
  id: string;
  source: string;
  status: string;
  records_processed: number;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
}

interface ScrapeAlert {
  id: string;
  job_id: string;
  alert_type: string | null;
  message: string | null;
  is_resolved: boolean;
  created_at: string;
  job: ScrapeLog;
}

const logColumnHelper = createColumnHelper<ScrapeLog>();
const alertColumnHelper = createColumnHelper<ScrapeAlert>();

export default function ScraperDashboard() {
  const [logs, setLogs] = useState<ScrapeLog[]>([]);
  const [alerts, setAlerts] = useState<ScrapeAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialFetch, setInitialFetch] = useState(true);

  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const [logsRes, alertsRes] = await Promise.all([
        axios.get('http://trickster.test/backend/public/api/v1/admin/scraper/logs', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://trickster.test/backend/public/api/v1/admin/scraper/alerts', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setLogs(logsRes.data);
      setAlerts(alertsRes.data);
      if (initialFetch) setInitialFetch(false);
    } catch (err) {
      toast.error('Failed to fetch scraper data');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const runScraper = async () => {
    setLoading(true);
    const toastId = toast.loading('Starting scraper job...');
    try {
      await axios.post('http://trickster.test/backend/public/api/v1/admin/scraper/run', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Scraper job completed successfully!', { id: toastId });
      fetchData();
    } catch (err) {
      toast.error('Failed to trigger scraper', { id: toastId });
    }
    setLoading(false);
  };

  const logsTable = useReactTable({
    data: logs,
    columns: [
      logColumnHelper.accessor('source', {
        header: 'SOURCE',
        cell: info => <span className="font-['JetBrains_Mono'] font-bold text-[12px] uppercase">{info.getValue()}</span>
      }),
      logColumnHelper.accessor('status', {
        header: 'STATUS',
        cell: info => {
          const status = info.getValue();
          return (
            <span className={`font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-widest px-2 py-1 border ${
              status === 'success' ? 'bg-green-100 border-green-300 text-green-900' : 
              status === 'failed' ? 'bg-red-100 border-red-300 text-red-900' : 'bg-yellow-100 border-yellow-300 text-yellow-900 animate-pulse'
            }`}>
              [{status}]
            </span>
          );
        }
      }),
      logColumnHelper.accessor('records_processed', {
        header: 'RECORDS',
        cell: info => <span className="font-['JetBrains_Mono'] text-[12px]">{info.getValue()}</span>
      }),
      logColumnHelper.accessor('started_at', {
        header: 'TIMESTAMP',
        cell: info => <span className="text-[12px] text-gray-600 font-['JetBrains_Mono']">{new Date(info.getValue()).toISOString()}</span>
      }),
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  const alertsTable = useReactTable({
    data: alerts,
    columns: [
      alertColumnHelper.accessor('job.source', {
        header: 'JOB SOURCE',
        cell: info => <span className="font-['JetBrains_Mono'] text-[12px] uppercase">{info.getValue()}</span>
      }),
      alertColumnHelper.accessor('alert_type', {
        header: 'TYPE',
        cell: info => <span className="font-['JetBrains_Mono'] text-[11px] font-bold bg-black text-white px-2 py-0.5">{info.getValue()}</span>
      }),
      alertColumnHelper.accessor('message', {
        header: 'ERR_MESSAGE',
        cell: info => <span className="font-['JetBrains_Mono'] text-[12px] text-red-700">{info.getValue()}</span>
      }),
      alertColumnHelper.accessor('created_at', {
        header: 'TIMESTAMP',
        cell: info => <span className="text-[12px] text-gray-600 font-['JetBrains_Mono']">{new Date(info.getValue()).toISOString()}</span>
      }),
      alertColumnHelper.accessor('is_resolved', {
        header: 'RESOLVED',
        cell: info => {
          const resolved = info.getValue();
          return (
            <span className={`font-['JetBrains_Mono'] text-[11px] font-bold uppercase border px-2 py-0.5 ${resolved ? 'border-black' : 'bg-red-500 text-white border-red-500'}`}>
              {resolved ? 'YES' : 'NO'}
            </span>
          );
        }
      }),
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="font-['Inter']">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-black pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Terminal size={18} />
            <h2 className="text-2xl font-['Archivo_Black'] uppercase tracking-tight text-black leading-none mt-1">
              Scraper Daemon
            </h2>
          </div>
          <p className="text-[12px] font-['JetBrains_Mono'] text-gray-500 uppercase tracking-widest">
            Data Ingestion Pipeline Logs
          </p>
        </div>
        <button 
          onClick={runScraper} 
          disabled={loading}
          className="flex items-center gap-2 bg-black border-2 border-black text-white px-4 py-2 font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-wider hover:bg-transparent hover:text-black transition-colors active:translate-y-0.5 disabled:opacity-50"
        >
          <Play size={14} className={loading ? 'animate-pulse' : ''} />
          {loading ? 'EXECUTING...' : 'TRIGGER JOB'}
        </button>
      </div>

      {/* Logs Table */}
      <div className="mb-10">
        <h3 className="font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-widest text-black bg-gray-200 inline-block px-2 py-1 mb-2 border border-black">
          execution_logs.txt
        </h3>
        <div className="bg-white border border-black">
          <Table>
            <TableHeader className="bg-gray-100 border-b border-black">
              {logsTable.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id} className="border-none">
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id} className="h-10 px-4 font-['JetBrains_Mono'] text-[11px] font-bold text-black border-r border-black last:border-r-0">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {initialFetch ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-black last:border-b-0">
                    <TableCell className="p-3 border-r border-black last:border-r-0"><Skeleton className="h-4 w-24 bg-gray-200 rounded-none" /></TableCell>
                    <TableCell className="p-3 border-r border-black last:border-r-0"><Skeleton className="h-5 w-20 bg-gray-200 rounded-none" /></TableCell>
                    <TableCell className="p-3 border-r border-black last:border-r-0"><Skeleton className="h-4 w-12 bg-gray-200 rounded-none" /></TableCell>
                    <TableCell className="p-3 border-r border-black last:border-r-0"><Skeleton className="h-4 w-32 bg-gray-200 rounded-none" /></TableCell>
                  </TableRow>
                ))
              ) : logsTable.getRowModel().rows.length > 0 ? (
                logsTable.getRowModel().rows.map(row => (
                  <TableRow key={row.id} className="border-b border-black last:border-b-0 hover:bg-yellow-50 transition-none">
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="px-4 py-2 border-r border-black last:border-r-0">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-sm font-['JetBrains_Mono'] text-gray-500">
                    No logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="mb-10">
        <h3 className="font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-widest text-white bg-red-600 inline-block px-2 py-1 mb-2 border border-black flex items-center gap-2 w-max">
          <AlertTriangle size={12} />
          system_alerts.log
        </h3>
        <div className="bg-white border border-black">
          <Table>
            <TableHeader className="bg-gray-100 border-b border-black">
              {alertsTable.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id} className="border-none">
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id} className="h-10 px-4 font-['JetBrains_Mono'] text-[11px] font-bold text-black border-r border-black last:border-r-0">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {initialFetch ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-black last:border-b-0">
                    <TableCell className="p-3 border-r border-black last:border-r-0"><Skeleton className="h-4 w-24 bg-gray-200 rounded-none" /></TableCell>
                    <TableCell className="p-3 border-r border-black last:border-r-0"><Skeleton className="h-4 w-16 bg-gray-200 rounded-none" /></TableCell>
                    <TableCell className="p-3 border-r border-black last:border-r-0"><Skeleton className="h-4 w-full bg-gray-200 rounded-none" /></TableCell>
                    <TableCell className="p-3 border-r border-black last:border-r-0"><Skeleton className="h-4 w-32 bg-gray-200 rounded-none" /></TableCell>
                    <TableCell className="p-3 border-r border-black last:border-r-0"><Skeleton className="h-5 w-12 bg-gray-200 rounded-none" /></TableCell>
                  </TableRow>
                ))
              ) : alertsTable.getRowModel().rows.length > 0 ? (
                alertsTable.getRowModel().rows.map(row => (
                  <TableRow key={row.id} className="border-b border-black last:border-b-0 hover:bg-red-50 transition-none">
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="px-4 py-2 border-r border-black last:border-r-0">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-sm font-['JetBrains_Mono'] text-gray-500">
                    0 ALERTS
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

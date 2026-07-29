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
import { Terminal, Play, Warning, CheckCircle, Clock, SpinnerGap, XCircle } from '@phosphor-icons/react';

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

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

const logColumnHelper = createColumnHelper<ScrapeLog>();
const alertColumnHelper = createColumnHelper<ScrapeAlert>();

export default function ScraperDashboard() {
  const [logs, setLogs] = useState<ScrapeLog[]>([]);
  const [alerts, setAlerts] = useState<ScrapeAlert[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialFetch, setInitialFetch] = useState(true);

  const fetchData = async () => {
    try {
      const [logsRes, alertsRes, statsRes] = await Promise.all([
        axios.get('/api/v1/admin/scraper/logs'),
        axios.get('/api/v1/admin/scraper/alerts'),
        axios.get('/api/v1/admin/scraper/queue-stats')
      ]);
      setLogs(logsRes.data);
      setAlerts(alertsRes.data);
      setQueueStats(statsRes.data);
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

  const fetchEvents = async () => {
    setLoading(true);
    const toastId = toast.loading('Dispatching sync task...');
    try {
      const res = await axios.post('/api/v1/admin/scraper/fetch-events');
      toast.success(res.data.message || 'Sync task dispatched!', { id: toastId });
      fetchData();
    } catch (err) {
      toast.error('Failed to dispatch sync task', { id: toastId });
    }
    setLoading(false);
  };



  const logsColumns = useMemo(() => [
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
        cell: info => <span className="text-[12px] text-gray-600 font-['JetBrains_Mono']">{new Date(info.getValue()).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'medium' })}</span>
      }),
    ], []);

  const logsTable = useReactTable({
    data: logs,
    columns: logsColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const alertsColumns = useMemo(() => [
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
        cell: info => <span className="text-[12px] text-gray-600 font-['JetBrains_Mono']">{new Date(info.getValue()).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'medium' })}</span>
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
    ], []);

  const alertsTable = useReactTable({
    data: alerts,
    columns: alertsColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="font-['Inter']">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-black pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Terminal weight="regular" size={18} />
            <h2 className="text-2xl font-['Archivo_Black'] uppercase tracking-tight text-black leading-none mt-1">
              Scraper Dashboard
            </h2>
          </div>
          <p className="text-[12px] font-['JetBrains_Mono'] text-gray-500 uppercase tracking-widest">
            Manage data ingestion & vlr.gg crawling pipelines.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <button 
            onClick={fetchEvents} 
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-black border-2 border-black text-white px-4 py-2 font-['JetBrains_Mono'] text-[12px] font-bold uppercase tracking-wider hover:bg-transparent hover:text-black transition-colors active:translate-y-0.5 disabled:opacity-50 w-full sm:w-auto"
          >
            <Terminal weight="regular" size={14} className={loading ? 'animate-pulse' : ''} />
            {loading ? 'EXECUTING...' : 'SYNC EVENTS'}
          </button>
        </div>
      </div>

      {/* Queue Stats Widget */}
      <div className="mb-10">
        <h3 className="font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-widest text-black bg-yellow-300 inline-block px-2 py-1 mb-2 border border-black shadow-[2px_2px_0px_0px_#111111]">
          match_scrape_queues.db
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border-2 border-black p-4 flex items-center justify-between shadow-[4px_4px_0px_0px_#111111]">
            <div>
              <p className="text-[10px] font-['JetBrains_Mono'] font-bold text-gray-500 uppercase mb-1">Pending</p>
              <p className="text-3xl font-['Archivo_Black'] leading-none">{queueStats ? queueStats.pending : '-'}</p>
            </div>
            <Clock size={28} className="text-gray-400" weight="duotone" />
          </div>
          
          <div className="bg-white border-2 border-black p-4 flex items-center justify-between shadow-[4px_4px_0px_0px_#111111]">
            <div>
              <p className="text-[10px] font-['JetBrains_Mono'] font-bold text-gray-500 uppercase mb-1">Processing</p>
              <p className="text-3xl font-['Archivo_Black'] leading-none text-blue-600">{queueStats ? queueStats.processing : '-'}</p>
            </div>
            <SpinnerGap size={28} className="text-blue-500 animate-spin" weight="bold" />
          </div>

          <div className="bg-white border-2 border-black p-4 flex items-center justify-between shadow-[4px_4px_0px_0px_#111111]">
            <div>
              <p className="text-[10px] font-['JetBrains_Mono'] font-bold text-gray-500 uppercase mb-1">Completed</p>
              <p className="text-3xl font-['Archivo_Black'] leading-none text-green-600">{queueStats ? queueStats.completed : '-'}</p>
            </div>
            <CheckCircle size={28} className="text-green-500" weight="fill" />
          </div>

          <div className="bg-white border-2 border-black p-4 flex items-center justify-between shadow-[4px_4px_0px_0px_#111111]">
            <div>
              <p className="text-[10px] font-['JetBrains_Mono'] font-bold text-gray-500 uppercase mb-1">Failed</p>
              <p className="text-3xl font-['Archivo_Black'] leading-none text-red-600">{queueStats ? queueStats.failed : '-'}</p>
            </div>
            <XCircle size={28} className="text-red-500" weight="fill" />
          </div>
        </div>
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
          <Warning weight="regular" size={12} />
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

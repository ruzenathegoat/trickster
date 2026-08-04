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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Terminal, Warning, CheckCircle, Clock, SpinnerGap, XCircle, Lightning } from '@phosphor-icons/react';

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
    const toastId = toast.loading('Dispatching sync task...', {
      style: { backgroundColor: '#000', color: '#fff', border: '4px solid #f5d90a' }
    });
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
        cell: info => <span className="font-label text-xs font-black uppercase tracking-widest">{info.getValue()}</span>
      }),
      logColumnHelper.accessor('status', {
        header: 'STATUS',
        cell: info => {
          const status = info.getValue();
          return (
            <div className={`inline-flex items-center justify-center font-label text-[10px] font-black uppercase tracking-widest px-3 py-1 border-2 border-theme-border shadow-[2px_2px_0px_#000] ${
              status === 'success' ? 'bg-[#10b981] text-theme-text' : 
              status === 'failed' ? 'bg-[#ef4444] text-white' : 'bg-[var(--color-primary)] text-black animate-pulse'
            }`}>
              {status}
            </div>
          );
        }
      }),
      logColumnHelper.accessor('records_processed', {
        header: 'REC_COUNT',
        cell: info => <span className="font-label text-sm font-black">{info.getValue()}</span>
      }),
      logColumnHelper.accessor('started_at', {
        header: 'TIMESTAMP',
        cell: info => <span className="text-[11px] text-gray-800 font-label font-bold tracking-widest">{new Date(info.getValue()).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'medium' })}</span>
      }),
    ], []);

  const logsTable = useReactTable({
    data: logs,
    columns: logsColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const alertsColumns = useMemo(() => [
      alertColumnHelper.accessor('job.source', {
        header: 'JOB_SRC',
        cell: info => <span className="font-label text-xs font-black uppercase tracking-widest text-white">{info.getValue()}</span>
      }),
      alertColumnHelper.accessor('alert_type', {
        header: 'TYPE',
        cell: info => <span className="font-label text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-theme-text px-2 py-1 border-2 border-theme-border shadow-[2px_2px_0px_#000]">{info.getValue()}</span>
      }),
      alertColumnHelper.accessor('message', {
        header: 'DIAGNOSTIC_MSG',
        cell: info => <span className="font-label text-xs font-bold text-white uppercase tracking-widest">{info.getValue()}</span>
      }),
      alertColumnHelper.accessor('created_at', {
        header: 'INCIDENT_TIME',
        cell: info => <span className="text-[10px] text-gray-300 font-label tracking-widest">{new Date(info.getValue()).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'medium' })}</span>
      }),
      alertColumnHelper.accessor('is_resolved', {
        header: 'ACTION_REQ',
        cell: info => {
          const resolved = info.getValue();
          return (
            <span className={`inline-flex font-label text-[10px] font-black uppercase tracking-widest border-2 border-theme-border px-2 py-1 shadow-[2px_2px_0px_#000] ${resolved ? 'bg-[#10b981] text-theme-text' : 'bg-[#ef4444] text-white animate-pulse'}`}>
              {resolved ? 'CLEAR' : 'INVESTIGATE'}
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

  const statVariants: any = {
    hover: { scale: 1.02, y: -4, transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } },
    tap: { scale: 0.98, y: 0, boxShadow: "2px 2px 0px 0px #111111", transition: { duration: 0.1 } }
  };

  return (
    <div className="w-full relative z-10 space-y-12">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-8 border-theme-border pb-6 gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-black text-[var(--color-primary)] px-3 py-1 font-label text-xs font-black uppercase tracking-widest">
            <Terminal weight="bold" size={16} />
            <span>sys.log // root access</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter text-theme-text leading-none">
            Ingestion Pipeline
          </h2>
          <p className="font-label text-sm font-bold text-gray-700 uppercase tracking-widest max-w-xl">
            Monitor and control automated data extraction jobs, VLR.gg crawlers, and structural normalizations in real-time.
          </p>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.02, y: -2, boxShadow: "8px 8px 0px 0px #111111" }}
          whileTap={{ scale: 0.98, y: 2, boxShadow: "2px 2px 0px 0px #111111" }}
          onClick={fetchEvents} 
          disabled={loading}
          className="flex items-center justify-center gap-3 bg-[var(--color-primary)] text-black border-4 border-theme-border px-8 py-4 shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
        >
          <Lightning weight="fill" size={24} className={loading ? 'animate-pulse' : ''} />
          <span className="font-display text-lg font-black uppercase tracking-tight">
            {loading ? 'Executing...' : 'Force Sync'}
          </span>
        </motion.button>
      </div>

      {/* Queue Stats Widget */}
      <div className="space-y-4">
        <div className="inline-block bg-black text-white px-4 py-2 border-4 border-theme-border">
          <h3 className="font-label text-sm font-black uppercase tracking-widest">
            Job_Queue.db
          </h3>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div variants={statVariants} whileHover="hover" whileTap="tap" className="bg-theme-bg border-4 border-theme-border p-6 flex flex-col justify-between shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]">
            <div className="flex justify-between items-start mb-6">
              <span className="font-label text-xs font-black text-gray-500 uppercase tracking-widest">Pending</span>
              <Clock size={32} className="text-theme-text" weight="bold" />
            </div>
            <span className="font-display text-6xl font-black leading-none tracking-tighter">{queueStats ? queueStats.pending : '-'}</span>
          </motion.div>
          
          <motion.div variants={statVariants} whileHover="hover" whileTap="tap" className="bg-[var(--color-primary)] border-4 border-theme-border p-6 flex flex-col justify-between shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]">
            <div className="flex justify-between items-start mb-6">
              <span className="font-label text-xs font-black text-theme-text uppercase tracking-widest">Processing</span>
              <SpinnerGap size={32} className="text-theme-text animate-spin" weight="bold" />
            </div>
            <span className="font-display text-6xl font-black leading-none tracking-tighter">{queueStats ? queueStats.processing : '-'}</span>
          </motion.div>

          <motion.div variants={statVariants} whileHover="hover" whileTap="tap" className="bg-[#10b981] border-4 border-theme-border p-6 flex flex-col justify-between shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] text-theme-text">
            <div className="flex justify-between items-start mb-6">
              <span className="font-label text-xs font-black uppercase tracking-widest">Completed</span>
              <CheckCircle size={32} className="text-theme-text" weight="fill" />
            </div>
            <span className="font-display text-6xl font-black leading-none tracking-tighter">{queueStats ? queueStats.completed : '-'}</span>
          </motion.div>

          <motion.div variants={statVariants} whileHover="hover" whileTap="tap" className="bg-[#ef4444] border-4 border-theme-border p-6 flex flex-col justify-between shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] text-white">
            <div className="flex justify-between items-start mb-6">
              <span className="font-label text-xs font-black text-white uppercase tracking-widest">Failed</span>
              <XCircle size={32} className="text-white" weight="fill" />
            </div>
            <span className="font-display text-6xl font-black leading-none tracking-tighter">{queueStats ? queueStats.failed : '-'}</span>
          </motion.div>
        </div>
      </div>

      {/* System Alerts Table (Redesign) */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 bg-[#ef4444] text-white px-4 py-2 border-4 border-theme-border shadow-[4px_4px_0px_#000]">
          <Warning weight="bold" size={20} className="animate-pulse" />
          <h3 className="font-label text-sm font-black uppercase tracking-widest">
            Critical_Alerts.sys
          </h3>
        </div>
        
        <div className="bg-black border-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#111] border-b-4 border-theme-border">
              {alertsTable.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id} className="border-none hover:bg-transparent">
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id} className="h-14 px-6 font-display text-sm font-black text-gray-400 uppercase tracking-widest border-r-4 border-theme-border last:border-r-0">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {initialFetch ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i} className="border-b-4 border-theme-border last:border-b-0 hover:bg-[#222]">
                    <TableCell className="p-6 border-r-4 border-theme-border last:border-r-0"><Skeleton className="h-4 w-24 bg-gray-800 rounded-none" /></TableCell>
                    <TableCell className="p-6 border-r-4 border-theme-border last:border-r-0"><Skeleton className="h-4 w-16 bg-gray-800 rounded-none" /></TableCell>
                    <TableCell className="p-6 border-r-4 border-theme-border last:border-r-0"><Skeleton className="h-4 w-full bg-gray-800 rounded-none" /></TableCell>
                    <TableCell className="p-6 border-r-4 border-theme-border last:border-r-0"><Skeleton className="h-4 w-32 bg-gray-800 rounded-none" /></TableCell>
                    <TableCell className="p-6 border-r-4 border-theme-border last:border-r-0"><Skeleton className="h-5 w-12 bg-gray-800 rounded-none" /></TableCell>
                  </TableRow>
                ))
              ) : alertsTable.getRowModel().rows.length > 0 ? (
                alertsTable.getRowModel().rows.map(row => (
                  <TableRow key={row.id} className="border-b-4 border-theme-border last:border-b-0 hover:bg-[#1a1a1a] transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="px-6 py-4 border-r-4 border-theme-border last:border-r-0">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="h-32 text-center text-sm font-label font-bold tracking-widest text-gray-600 uppercase">
                    No critical alerts detected
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Logs Table (Redesign) */}
      <div className="space-y-4">
        <div className="inline-block bg-theme-bg text-theme-text px-4 py-2 border-4 border-theme-border">
          <h3 className="font-label text-sm font-black uppercase tracking-widest">
            Execution_Log.txt
          </h3>
        </div>
        
        <div className="bg-theme-bg border-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-100 border-b-4 border-theme-border">
              {logsTable.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id} className="border-none hover:bg-transparent">
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id} className="h-14 px-6 font-display text-sm font-black text-theme-text uppercase tracking-widest border-r-4 border-theme-border last:border-r-0">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {initialFetch ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b-4 border-theme-border last:border-b-0 hover:bg-gray-50">
                    <TableCell className="p-6 border-r-4 border-theme-border last:border-r-0"><Skeleton className="h-4 w-24 bg-gray-200 rounded-none" /></TableCell>
                    <TableCell className="p-6 border-r-4 border-theme-border last:border-r-0"><Skeleton className="h-5 w-20 bg-gray-200 rounded-none" /></TableCell>
                    <TableCell className="p-6 border-r-4 border-theme-border last:border-r-0"><Skeleton className="h-4 w-12 bg-gray-200 rounded-none" /></TableCell>
                    <TableCell className="p-6 border-r-4 border-theme-border last:border-r-0"><Skeleton className="h-4 w-32 bg-gray-200 rounded-none" /></TableCell>
                  </TableRow>
                ))
              ) : logsTable.getRowModel().rows.length > 0 ? (
                logsTable.getRowModel().rows.map(row => (
                  <TableRow key={row.id} className="border-b-4 border-theme-border last:border-b-0 hover:bg-[var(--color-primary)] transition-colors group">
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="px-6 py-4 border-r-4 border-theme-border last:border-r-0 group-hover:text-theme-text">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="h-32 text-center text-sm font-label font-bold tracking-widest text-gray-500 uppercase">
                    No execution logs found
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

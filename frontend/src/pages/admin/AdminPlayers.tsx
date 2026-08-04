import { useState, useEffect, useMemo } from 'react';
import axios from '@/lib/axios';
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
import { Users, MagnifyingGlass, CaretLeft, CaretRight, Star } from '@phosphor-icons/react';

interface Player {
  id: string;
  ign: string;
  name: string;
  is_igl: boolean;
  current_role: string;
}

const columnHelper = createColumnHelper<Player>();

export default function AdminPlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [initialFetch, setInitialFetch] = useState(true);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/players', { params: { limit: 500 } });
      setPlayers(res.data.data || res.data);
      if (initialFetch) setInitialFetch(false);
    } catch (error) {
      toast.error('Failed to load players');
    }
    setLoading(false);
  };

  const toggleIgl = async (playerId: string, currentStatus: boolean) => {
    try {
      setPlayers(players.map(p => p.id === playerId ? { ...p, is_igl: !currentStatus } : p));
      await axios.patch(`/api/v1/admin/players/${playerId}/toggle-igl`);
      toast.success('IGL status updated');
    } catch (error) {
      toast.error('Failed to update IGL status');
      setPlayers(players.map(p => p.id === playerId ? { ...p, is_igl: currentStatus } : p));
    }
  };

  const filteredPlayers = players.filter(p => 
    (p.ign || '').toLowerCase().includes(search.toLowerCase()) || 
    (p.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPlayers.length / 10);
  const paginatedPlayers = filteredPlayers.slice((currentPage - 1) * 10, currentPage * 10);

  const columns = useMemo(() => [
    columnHelper.accessor('ign', {
      header: 'IGN',
      cell: info => <span className="font-display font-black text-lg">{info.getValue()}</span>
    }),
    columnHelper.accessor('name', {
      header: 'NAME',
      cell: info => <span className="text-gray-600 font-bold">{info.getValue() || '-'}</span>
    }),
    columnHelper.accessor('current_role', {
      header: 'ROLE',
      cell: info => (
        <span className="inline-flex font-label text-[10px] font-black uppercase tracking-widest border-2 border-theme-border px-2 py-1 shadow-[2px_2px_0px_#000] bg-gray-100">
          {info.getValue() || 'N/A'}
        </span>
      )
    }),
    columnHelper.accessor('is_igl', {
      header: 'IGL STATUS',
      cell: info => {
        const isIgl = info.getValue();
        return (
          <span className={`inline-flex items-center gap-1 font-label text-[10px] font-black uppercase tracking-widest border-2 border-theme-border px-2 py-1 shadow-[2px_2px_0px_#000] ${isIgl ? 'bg-[var(--color-primary)] text-black' : 'bg-gray-100 text-gray-500'}`}>
            {isIgl && <Star weight="fill" size={12} />}
            {isIgl ? 'ACTIVE IGL' : 'NO'}
          </span>
        );
      }
    }),
    columnHelper.display({
      id: 'actions',
      header: 'ACTIONS',
      cell: info => {
        const player = info.row.original;
        return (
          <motion.button
            whileHover={{ scale: 1.05, y: -2, boxShadow: "4px 4px 0px 0px #111111" }}
            whileTap={{ scale: 0.95, y: 0, boxShadow: "0px 0px 0px 0px #111111" }}
            onClick={() => toggleIgl(player.id, player.is_igl)}
            className={`font-label text-[10px] font-black uppercase tracking-widest border-2 border-theme-border px-3 py-2 transition-colors ${
              player.is_igl 
                ? 'bg-[#ef4444] text-white hover:bg-red-600' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {player.is_igl ? 'REMOVE IGL' : 'SET AS IGL'}
          </motion.button>
        );
      }
    }),
  ], [players]);

  const table = useReactTable({
    data: paginatedPlayers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full relative z-10 space-y-12">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-8 border-theme-border pb-6 gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-black text-[var(--color-primary)] px-3 py-1 font-label text-xs font-black uppercase tracking-widest">
            <Users weight="bold" size={16} />
            <span>db.players // root</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter text-theme-text leading-none">
            Player Database
          </h2>
          <p className="font-label text-sm font-bold text-gray-700 uppercase tracking-widest max-w-xl">
            Manage active roster data, roles, and designate In-Game Leaders (IGL) for the Trickster simulation engine.
          </p>
        </div>
      </div>

      <div className="flex flex-col space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex bg-theme-bg border-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] max-w-md focus-within:shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] focus-within:-translate-y-1 transition-all w-full sm:w-auto">
            <div className="flex items-center justify-center px-4 bg-gray-100 border-r-4 border-theme-border">
              <MagnifyingGlass size={20} weight="bold" />
            </div>
            <input 
              type="text" 
              placeholder="SEARCH IGN OR NAME..." 
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-3 font-label font-bold uppercase tracking-widest text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-theme-bg text-theme-text px-4 py-2 border-4 border-theme-border shadow-[4px_4px_0px_#000]">
            <h3 className="font-label text-sm font-black uppercase tracking-widest">
              Players_List.csv
            </h3>
          </div>
          
          <div className="bg-theme-bg border-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-100 border-b-4 border-theme-border">
                {table.getHeaderGroups().map(headerGroup => (
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
                      <TableCell className="p-6 border-r-4 border-theme-border last:border-r-0"><Skeleton className="h-6 w-24 bg-gray-200 rounded-none" /></TableCell>
                      <TableCell className="p-6 border-r-4 border-theme-border last:border-r-0"><Skeleton className="h-4 w-32 bg-gray-200 rounded-none" /></TableCell>
                      <TableCell className="p-6 border-r-4 border-theme-border last:border-r-0"><Skeleton className="h-6 w-16 bg-gray-200 rounded-none" /></TableCell>
                      <TableCell className="p-6 border-r-4 border-theme-border last:border-r-0"><Skeleton className="h-6 w-24 bg-gray-200 rounded-none" /></TableCell>
                      <TableCell className="p-6 border-r-4 border-theme-border last:border-r-0"><Skeleton className="h-8 w-28 bg-gray-200 rounded-none" /></TableCell>
                    </TableRow>
                  ))
                ) : table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow key={row.id} className="border-b-4 border-theme-border last:border-b-0 hover:bg-gray-50 transition-colors">
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id} className="px-6 py-4 border-r-4 border-theme-border last:border-r-0">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="h-32 text-center text-sm font-label font-bold tracking-widest text-gray-500 uppercase">
                      No players found matching your query
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 bg-theme-bg border-4 border-theme-border shadow-[4px_4px_0px_#000] p-4">
              <span className="font-label text-xs font-black uppercase tracking-widest text-gray-500">
                SHOWING {((currentPage - 1) * 10) + 1} - {Math.min(currentPage * 10, filteredPlayers.length)} OF {filteredPlayers.length}
              </span>
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={currentPage > 1 ? { scale: 1.05, y: -2, boxShadow: "2px 2px 0px 0px #111111" } : {}}
                  whileTap={currentPage > 1 ? { scale: 0.95, y: 0, boxShadow: "0px 0px 0px 0px #111111" } : {}}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 font-label text-xs font-black uppercase tracking-widest border-2 border-theme-border px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <CaretLeft weight="bold" /> PREV
                </motion.button>
                <div className="font-display font-black text-lg">
                  {currentPage} <span className="text-gray-400">/ {totalPages}</span>
                </div>
                <motion.button
                  whileHover={currentPage < totalPages ? { scale: 1.05, y: -2, boxShadow: "2px 2px 0px 0px #111111" } : {}}
                  whileTap={currentPage < totalPages ? { scale: 0.95, y: 0, boxShadow: "0px 0px 0px 0px #111111" } : {}}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 font-label text-xs font-black uppercase tracking-widest border-2 border-theme-border px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  NEXT <CaretRight weight="bold" />
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

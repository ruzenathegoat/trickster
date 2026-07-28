import { useState, useEffect } from 'react';
import { 
  flexRender, 
  getCoreRowModel, 
  useReactTable, 
  createColumnHelper,
  getSortedRowModel,
} from '@tanstack/react-table';
import type { SortingState } from '@tanstack/react-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Funnel, MagnifyingGlass, User } from '@phosphor-icons/react';
import clsx from 'clsx';

interface PlayerRank {
  id: string;
  rank: number;
  name: string;
  team: string;
  role: string;
  acs: number;
  kast: number;
  adr: number;
  consistency: 'S' | 'A' | 'B' | 'C' | 'D';
  smartScore: number;
}

const columnHelper = createColumnHelper<PlayerRank>();

export default function Leaderboard() {
  const [data, setData] = useState<PlayerRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  
  // Filters
  const [activeRole, setActiveRole] = useState('All Roles');
  const roles = ['All Roles', 'Duelist', 'Initiator', 'Controller', 'Sentinel'];

  useEffect(() => {
    // Mock data fetch
    setTimeout(() => {
      setData([
        { id: '1', rank: 1, name: 'Derke', team: 'FNC', role: 'Duelist', acs: 268.4, kast: 74.2, adr: 165.8, consistency: 'S', smartScore: 94.5 },
        { id: '2', rank: 2, name: 'Alfajer', team: 'FNC', role: 'Sentinel', acs: 254.1, kast: 78.5, adr: 158.2, consistency: 'S', smartScore: 92.1 },
        { id: '3', rank: 3, name: 'Leo', team: 'FNC', role: 'Initiator', acs: 245.8, kast: 82.1, adr: 152.4, consistency: 'A', smartScore: 91.8 },
        { id: '4', rank: 4, name: 'Demon1', team: 'NRG', role: 'Duelist', acs: 262.3, kast: 71.4, adr: 161.1, consistency: 'A', smartScore: 90.2 },
        { id: '5', rank: 5, name: 'TenZ', team: 'SEN', role: 'Controller', acs: 238.9, kast: 76.8, adr: 148.5, consistency: 'B', smartScore: 88.7 },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const columns = [
    columnHelper.accessor('rank', {
      header: 'Rank',
      cell: info => <span className="font-['JetBrains_Mono'] font-bold text-gray-400 tabular-nums">#{info.getValue()}</span>,
      size: 60,
    }),
    columnHelper.accessor('name', {
      header: 'Player',
      cell: info => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
            <User weight="regular" size={16} className="text-gray-400" />
          </div>
          <div>
            <div className="font-bold text-[14px] leading-tight">{info.getValue()}</div>
            <div className="text-[11px] text-gray-500">{info.row.original.team}</div>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('role', {
      header: 'Role',
      cell: info => (
        <span className="text-[12px] bg-gray-100 px-2 py-1 rounded-md text-gray-600">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('acs', {
      header: 'ACS',
      cell: info => <span className="font-['JetBrains_Mono'] text-[13px] tabular-nums">{info.getValue().toFixed(1)}</span>,
    }),
    columnHelper.accessor('kast', {
      header: 'KAST %',
      cell: info => <span className="font-['JetBrains_Mono'] text-[13px] tabular-nums">{info.getValue().toFixed(1)}%</span>,
    }),
    columnHelper.accessor('adr', {
      header: 'ADR',
      cell: info => <span className="font-['JetBrains_Mono'] text-[13px] tabular-nums">{info.getValue().toFixed(1)}</span>,
    }),
    columnHelper.accessor('consistency', {
      header: 'Consistency',
      cell: info => {
        const val = info.getValue();
        const colors: Record<string, string> = {
          'S': 'bg-green-100 text-green-700 border-green-200',
          'A': 'bg-blue-100 text-blue-700 border-blue-200',
          'B': 'bg-yellow-100 text-yellow-700 border-yellow-200',
          'C': 'bg-orange-100 text-orange-700 border-orange-200',
          'D': 'bg-red-100 text-red-700 border-red-200',
        };
        return (
          <span className={clsx("font-['JetBrains_Mono'] font-bold text-[12px] px-2 py-0.5 rounded border", colors[val])}>
            {val}
          </span>
        );
      },
    }),
    columnHelper.accessor('smartScore', {
      header: 'Global SMART',
      cell: info => (
        <div className="flex items-center gap-2">
          <div className="w-full bg-gray-100 rounded-full h-1.5 max-w-[60px]">
            <div className="bg-[var(--color-primary)] h-1.5 rounded-full border-r border-black" style={{ width: `${info.getValue()}%` }} />
          </div>
          <span className="font-['JetBrains_Mono'] font-bold text-[14px] tabular-nums">{info.getValue().toFixed(1)}</span>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-['Archivo_Black'] uppercase tracking-tight mb-1">Global Leaderboard</h1>
        <p className="text-gray-500 text-[14px]">Rankings based on the Global Rating model. Not context-adjusted for specific teams.</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Funnel weight="regular" size={16} className="text-gray-400" />
          <span className="text-[13px] font-semibold text-gray-700 mr-2">Filters:</span>
          
          <div className="flex gap-2">
            {roles.map(r => (
              <button 
                key={r}
                onClick={() => setActiveRole(r)}
                className={clsx(
                  "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors border",
                  activeRole === r 
                    ? "bg-[var(--color-primary)] border-black text-black shadow-[2px_2px_0px_0px_#111111]" 
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-64">
          <MagnifyingGlass weight="regular" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search player..." 
            className="w-full pl-9 pr-3 py-1.5 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-gray-50/50 border-b border-gray-200">
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id} 
                    className="px-4 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-800 transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : 'auto' }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Skeleton className="h-6 w-16 rounded-md" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-6 w-8 rounded" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <User weight="regular" size={48} className="text-gray-300 mb-4" />
                    <p className="font-semibold text-gray-700 mb-1">No players found</p>
                    <p className="text-[13px]">Try adjusting your filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr 
                  key={row.id} 
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/app/players/${row.original.id}`}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

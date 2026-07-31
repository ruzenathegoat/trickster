import { useState, useEffect, useMemo } from 'react';
import axios from '../../lib/axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  flexRender, 
  getCoreRowModel, 
  useReactTable, 
  createColumnHelper,
  getPaginationRowModel
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
import { PencilSimple, Trash, Plus, X, Users as UsersIcon, HardDrives } from '@phosphor-icons/react';
import { useAuth } from '../../contexts/AuthContext';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

const columnHelper = createColumnHelper<User>();

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialFetch, setInitialFetch] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/v1/admin/users');
      setUsers(res.data);
      if (initialFetch) setInitialFetch(false);
    } catch (err) {
      toast.error('Failed to fetch users');
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Lock body scroll and collapse sidebar when any modal open
  useEffect(() => {
    const isAnyModalOpen = isModalOpen || userToDelete !== null;
    document.body.style.overflow = isAnyModalOpen ? 'hidden' : '';
    // Dispatch custom event to tell AdminLayout to close/open sidebar
    window.dispatchEvent(new CustomEvent('toggleSidebar', { detail: { isOpen: !isAnyModalOpen } }));
    
    return () => { 
      document.body.style.overflow = ''; 
    };
  }, [isModalOpen, userToDelete]);

  const openModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'user'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const toastId = toast.loading('Executing database operation...', {
      style: { backgroundColor: '#000', color: '#fff', border: '4px solid #f5d90a' }
    });

    try {
      if (editingUser) {
        // Exclude password if it's empty
        const { password, ...rest } = formData;
        const payload = password ? formData : rest;
        
        await axios.put(`/api/v1/admin/users/${editingUser.id}`, payload);
        toast.success('User record updated successfully', { id: toastId });
      } else {
        if (!formData.password) {
          toast.error('Password is required for new users', { id: toastId });
          setLoading(false);
          return;
        }
        await axios.post('/api/v1/admin/users', formData);
        toast.success('User clearance created successfully', { id: toastId });
      }
      closeModal();
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Transaction Failed', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (user: User) => {
    if (currentUser?.id === user.id) {
      toast.error('Critical Error: You cannot revoke your own clearance.');
      return;
    }
    setUserToDelete(user);
  };

  const executeDelete = async () => {
    if (!userToDelete) return;
    
    const toastId = toast.loading('Purging user record...', {
      style: { backgroundColor: '#ef4444', color: '#fff', border: '4px solid #000' }
    });
    try {
      await axios.delete(`/api/v1/admin/users/${userToDelete.id}`);
      toast.success('User purged from registry', { id: toastId });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to purge user', { id: toastId });
    } finally {
      setUserToDelete(null);
    }
  };

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'NAME',
      cell: info => <span className="font-display text-lg font-black uppercase tracking-tighter">{info.getValue()}</span>,
    }),
    columnHelper.accessor('email', {
      header: 'CONTACT_ADDRESS',
      cell: info => <span className="font-label text-xs font-bold text-gray-700 tracking-wider">{info.getValue()}</span>,
    }),
    columnHelper.accessor('role', {
      header: 'CLEARANCE',
      cell: info => (
        <span className={`px-3 py-1 font-label text-[10px] font-black uppercase tracking-widest border-2 border-black ${
          info.getValue() === 'admin' ? 'bg-red-500 text-white' : 'bg-gray-200 text-black'
        }`}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('created_at', {
      header: 'ONBOARDED_DATE',
      cell: info => <span className="font-label text-xs font-bold text-gray-700 tracking-widest uppercase">{new Date(info.getValue()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'OPERATIONS',
      cell: info => (
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1, y: -2, boxShadow: "2px 2px 0px 0px #111111" }}
            whileTap={{ scale: 0.9, y: 0, boxShadow: "0px 0px 0px 0px #111111" }}
            onClick={() => openModal(info.row.original)}
            className="p-2 border-2 border-black bg-white hover:bg-[var(--color-primary)] transition-colors"
            title="Edit User"
          >
            <PencilSimple size={18} weight="bold" />
          </motion.button>
          <motion.button
            whileHover={currentUser?.id !== info.row.original.id ? { scale: 1.1, y: -2, boxShadow: "2px 2px 0px 0px #111111" } : {}}
            whileTap={currentUser?.id !== info.row.original.id ? { scale: 0.9, y: 0, boxShadow: "0px 0px 0px 0px #111111" } : {}}
            onClick={() => confirmDelete(info.row.original)}
            className={`p-2 border-2 border-black transition-colors ${
              currentUser?.id === info.row.original.id 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50' 
                : 'bg-white hover:bg-red-500 hover:text-white'
            }`}
            title={currentUser?.id === info.row.original.id ? "Cannot delete yourself" : "Purge User"}
            disabled={currentUser?.id === info.row.original.id}
          >
            <Trash size={18} weight="bold" />
          </motion.button>
        </div>
      ),
    })
  ], [currentUser]);

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      }
    }
  });

  return (
    <div className="w-full relative z-10 space-y-12 pb-24">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-8 border-black pb-6 gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 font-label text-xs font-black uppercase tracking-widest">
            <HardDrives weight="bold" size={16} />
            <span>sys.db // user.registry</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter text-black leading-none">
            User Management
          </h2>
          <p className="font-label text-sm font-bold text-gray-700 uppercase tracking-widest max-w-xl">
            Grant or revoke administrative clearance and manage platform access.
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05, y: -2, boxShadow: "6px 6px 0px 0px #111111" }}
          whileTap={{ scale: 0.95, y: 0, boxShadow: "0px 0px 0px 0px #111111" }}
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-4 bg-[var(--color-primary)] text-black border-4 border-black font-display font-black uppercase text-xl shadow-[4px_4px_0px_0px_#111111] transition-all"
        >
          <Plus size={24} weight="bold" />
          <span>New Clearance</span>
        </motion.button>
      </div>

      {/* Main Table */}
      <div className="space-y-4">
        <div className="inline-block bg-[var(--color-primary)] text-black px-4 py-2 border-4 border-black">
          <h3 className="font-label text-sm font-black uppercase tracking-widest">
            Active_Personnel_DB
          </h3>
        </div>
        
        <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_#111111] overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#f4f4f4] border-b-4 border-black">
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id} className="border-none hover:bg-transparent">
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id} className="h-14 px-6 font-display text-sm font-black text-black uppercase tracking-widest border-r-4 border-black last:border-r-0">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {initialFetch ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b-4 border-black last:border-b-0">
                    <TableCell className="p-6 border-r-4 border-black"><Skeleton className="h-5 w-32 bg-gray-200 rounded-none" /></TableCell>
                    <TableCell className="p-6 border-r-4 border-black"><Skeleton className="h-4 w-48 bg-gray-200 rounded-none" /></TableCell>
                    <TableCell className="p-6 border-r-4 border-black"><Skeleton className="h-6 w-16 bg-gray-200 rounded-none" /></TableCell>
                    <TableCell className="p-6 border-r-4 border-black"><Skeleton className="h-4 w-24 bg-gray-200 rounded-none" /></TableCell>
                    <TableCell className="p-6"><Skeleton className="h-8 w-20 bg-gray-200 rounded-none" /></TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} className="border-b-4 border-black last:border-b-0 hover:bg-[var(--color-primary)] transition-colors group">
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="px-6 py-4 border-r-4 border-black last:border-r-0">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columns.length} className="h-32 text-center text-sm font-label font-bold tracking-widest text-gray-500 uppercase">
                    NO PERSONNEL DATA FOUND.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Pagination Command Line */}
          {!initialFetch && table.getPageCount() > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t-4 border-black bg-[#f4f4f4]">
              <div className="font-label text-xs font-black text-black uppercase tracking-widest bg-white border-2 border-black px-3 py-1">
                SECTOR {table.getState().pagination.pageIndex + 1} // {table.getPageCount()}
              </div>
              <div className="flex gap-4">
                <motion.button
                  whileHover={table.getCanPreviousPage() ? { scale: 1.05, y: -2, boxShadow: "2px 2px 0px 0px #111111" } : {}}
                  whileTap={table.getCanPreviousPage() ? { scale: 0.95, y: 0, boxShadow: "0px 0px 0px 0px #111111" } : {}}
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="px-4 py-2 bg-white border-4 border-black font-display text-sm font-black uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-colors"
                >
                  Recall
                </motion.button>
                <motion.button
                  whileHover={table.getCanNextPage() ? { scale: 1.05, y: -2, boxShadow: "2px 2px 0px 0px #111111" } : {}}
                  whileTap={table.getCanNextPage() ? { scale: 0.95, y: 0, boxShadow: "0px 0px 0px 0px #111111" } : {}}
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-4 py-2 bg-white border-4 border-black font-display text-sm font-black uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-colors"
                >
                  Advance
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Extreme Brutalist Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12" onClick={closeModal}>
            {/* Hard dotted backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#f4f4f4]/90" 
              style={{ backgroundImage: 'radial-gradient(black 2px, transparent 2px)', backgroundSize: '16px 16px' }} 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-white border-4 border-black shadow-[16px_16px_0px_0px_#111111] flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b-4 border-black bg-[var(--color-primary)] flex-shrink-0">
                <div className="flex items-center gap-3">
                  <UsersIcon size={28} weight="bold" />
                  <span className="text-2xl md:text-3xl font-display font-black uppercase tracking-tighter text-black leading-none pt-1">
                    {editingUser ? 'MODIFY PERSONNEL' : 'REGISTER PERSONNEL'}
                  </span>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  type="button" 
                  onClick={closeModal} 
                  className="text-black bg-white border-4 border-black p-1 hover:bg-red-500 hover:text-white transition-colors"
                >
                  <X size={24} weight="bold" />
                </motion.button>
              </div>
              
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 bg-white">
                <div className="overflow-y-auto flex-1 p-6 md:p-8 space-y-6" data-lenis-prevent>
                  
                  {/* Name Input */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 font-label text-xs font-black uppercase tracking-widest text-black">
                      <span className="bg-black text-white px-2 py-0.5">01</span> IDENTIFIER_NAME
                    </label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full border-4 border-black p-4 font-display text-xl uppercase tracking-wider font-black focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[4px_4px_0px_0px_#111111] transition-all bg-white"
                      placeholder="ENTER FULL NAME"
                      required
                    />
                  </div>
                  
                  {/* Email Input */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 font-label text-xs font-black uppercase tracking-widest text-black">
                      <span className="bg-black text-white px-2 py-0.5">02</span> CONTACT_ROUTING
                    </label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full border-4 border-black p-4 font-label text-sm tracking-wider font-bold focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[4px_4px_0px_0px_#111111] transition-all bg-white"
                      placeholder="OPERATIVE@TRICKSTER.APP"
                      required
                    />
                  </div>
                  
                  {/* Password Input */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 font-label text-xs font-black uppercase tracking-widest text-black">
                      <span className="bg-black text-white px-2 py-0.5">03</span> ENCRYPTION_KEY
                      {editingUser && <span className="text-gray-400 bg-gray-100 px-2 py-0.5 ml-2 border border-gray-300">LEAVE BLANK TO RETAIN EXISTING</span>}
                    </label>
                    <input 
                      type="password" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full border-4 border-black p-4 font-label text-xl tracking-[0.5em] font-black focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[4px_4px_0px_0px_#111111] transition-all bg-white"
                      placeholder="********"
                      required={!editingUser}
                      minLength={8}
                    />
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 font-label text-xs font-black uppercase tracking-widest text-black">
                      <span className="bg-black text-white px-2 py-0.5">04</span> CLEARANCE_LEVEL
                    </label>
                    <div className="relative">
                      <select 
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full border-4 border-black p-4 font-display text-lg uppercase tracking-wider font-black appearance-none focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[4px_4px_0px_0px_#111111] transition-all bg-white cursor-pointer"
                      >
                        <option value="user">STANDARD OPERATIVE (USER)</option>
                        <option value="admin">SYSTEM ADMINISTRATOR (ADMIN)</option>
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-black"></div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Modal Footer Command Line */}
                <div className="px-6 py-6 border-t-8 border-black bg-[#f4f4f4] flex-shrink-0 flex flex-col sm:flex-row justify-end items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "4px 4px 0px 0px #111111" }}
                    whileTap={{ scale: 0.95, boxShadow: "0px 0px 0px 0px #111111" }}
                    type="button"
                    onClick={closeModal}
                    className="w-full sm:w-auto px-6 py-4 border-4 border-black bg-white font-display text-lg font-black uppercase tracking-tight text-black transition-all"
                  >
                    Abort Sequence
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "4px 4px 0px 0px #111111" }}
                    whileTap={{ scale: 0.95, boxShadow: "0px 0px 0px 0px #111111" }}
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto bg-[var(--color-primary)] border-4 border-black text-black px-8 py-4 font-display text-lg font-black uppercase tracking-tight transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'WRITING...' : 'CONFIRM CONFIGURATION'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Extreme Brutalist Delete Confirmation Modal ── */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-12" onClick={() => setUserToDelete(null)}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-900/80" 
              style={{ backgroundImage: 'radial-gradient(black 2px, transparent 2px)', backgroundSize: '16px 16px' }} 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 400 }}
              className="relative w-full max-w-lg bg-red-500 border-8 border-black shadow-[16px_16px_0px_0px_#111111] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 text-center space-y-6 bg-white border-b-8 border-black">
                 <h2 className="text-4xl font-display font-black uppercase text-red-600">CRITICAL WARNING</h2>
                 <p className="font-label text-lg font-bold text-black uppercase tracking-widest">
                   You are about to permanently purge the clearance for operative: <br/>
                   <span className="text-3xl font-display font-black bg-black text-white px-4 py-2 inline-block mt-4">{userToDelete.name}</span>
                 </p>
                 <p className="font-label text-xs font-black text-gray-500 uppercase tracking-widest mt-4">
                   This action cannot be undone. All access will be immediately terminated.
                 </p>
              </div>
              <div className="flex flex-col sm:flex-row bg-[#f4f4f4] p-6 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "4px 4px 0px 0px #111111" }}
                    whileTap={{ scale: 0.95, boxShadow: "0px 0px 0px 0px #111111" }}
                    type="button"
                    onClick={() => setUserToDelete(null)}
                    className="flex-1 px-6 py-4 border-4 border-black bg-white font-display text-lg font-black uppercase tracking-tight text-black transition-all"
                  >
                    ABORT
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "4px 4px 0px 0px #111111" }}
                    whileTap={{ scale: 0.95, boxShadow: "0px 0px 0px 0px #111111" }}
                    onClick={executeDelete}
                    className="flex-1 bg-red-500 border-4 border-black text-white px-6 py-4 font-display text-lg font-black uppercase tracking-tight transition-all hover:bg-red-600"
                  >
                    EXECUTE PURGE
                  </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

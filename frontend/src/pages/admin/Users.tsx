import { useState, useEffect, useMemo } from 'react';
import axios from '../../lib/axios';
import { toast } from 'sonner';
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
import { PencilSimple, Trash, Plus, X } from '@phosphor-icons/react';
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

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen]);

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
    
    try {
      if (editingUser) {
        // Exclude password if it's empty
        const { password, ...rest } = formData;
        const payload = password ? formData : rest;
        
        await axios.put(`/api/v1/admin/users/${editingUser.id}`, payload);
        toast.success('User updated successfully');
      } else {
        if (!formData.password) {
          toast.error('Password is required for new users');
          setLoading(false);
          return;
        }
        await axios.post('/api/v1/admin/users', formData);
        toast.success('User created successfully');
      }
      closeModal();
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (currentUser?.id === user.id) {
      toast.error('You cannot delete yourself.');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete user ${user.name}?`)) {
      try {
        await axios.delete(`/api/v1/admin/users/${user.id}`);
        toast.success('User deleted successfully');
        fetchData();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: info => <span className="font-bold">{info.getValue()}</span>,
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('role', {
      header: 'Role',
      cell: info => (
        <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider ${
          info.getValue() === 'admin' ? 'bg-black text-white' : 'bg-gray-200 text-black'
        }`}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('created_at', {
      header: 'Created At',
      cell: info => new Date(info.getValue()).toLocaleDateString(),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openModal(info.row.original)}
            className="p-1 hover:bg-gray-200 transition-colors rounded"
            title="Edit User"
          >
            <PencilSimple size={16} />
          </button>
          <button
            onClick={() => handleDelete(info.row.original)}
            className={`p-1 transition-colors rounded ${currentUser?.id === info.row.original.id ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
            title={currentUser?.id === info.row.original.id ? "Cannot delete yourself" : "Delete User"}
            disabled={currentUser?.id === info.row.original.id}
          >
            <Trash size={16} />
          </button>
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
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end border-b-4 border-black pb-4">
        <div>
          <h1 className="text-4xl font-['Archivo_Black'] uppercase tracking-tight">Manage Users</h1>
          <p className="font-['JetBrains_Mono'] text-sm text-gray-600 mt-2">
            Add, edit, or remove administrators and users.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-black border-2 border-black font-['JetBrains_Mono'] font-bold uppercase text-sm hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
        >
          <Plus size={16} weight="bold" />
          Add User
        </button>
      </div>

      <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {initialFetch ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id} className="border-b-2 border-black bg-gray-50 hover:bg-gray-50">
                    {headerGroup.headers.map(header => (
                      <TableHead key={header.id} className="font-['JetBrains_Mono'] text-black font-bold uppercase tracking-wider text-xs">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow key={row.id} className="border-b border-gray-200">
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id} className="py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center font-['JetBrains_Mono']">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t-2 border-black bg-gray-50">
              <div className="font-['JetBrains_Mono'] text-xs font-bold text-gray-500">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="px-3 py-1 bg-white border-2 border-black font-['JetBrains_Mono'] text-xs font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-colors"
                >
                  Prev
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-3 py-1 bg-white border-2 border-black font-['JetBrains_Mono'] text-xs font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div 
            className="bg-white border-4 border-black w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b-4 border-black bg-[var(--color-primary)]">
              <h2 className="font-['Archivo_Black'] text-xl uppercase tracking-tighter">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button 
                onClick={closeModal}
                className="p-1 bg-black text-white hover:bg-white hover:text-black transition-colors"
              >
                <X size={20} weight="bold" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block font-['JetBrains_Mono'] text-xs font-bold uppercase mb-1">Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border-2 border-black p-2 font-['Inter'] focus:outline-none focus:ring-0 focus:border-[var(--color-primary)]"
                  required
                />
              </div>
              
              <div>
                <label className="block font-['JetBrains_Mono'] text-xs font-bold uppercase mb-1">Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full border-2 border-black p-2 font-['Inter'] focus:outline-none focus:ring-0 focus:border-[var(--color-primary)]"
                  required
                />
              </div>
              
              <div>
                <label className="block font-['JetBrains_Mono'] text-xs font-bold uppercase mb-1">
                  Password {editingUser && <span className="text-gray-500 lowercase normal-case font-normal">(Leave blank to keep current)</span>}
                </label>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full border-2 border-black p-2 font-['Inter'] focus:outline-none focus:ring-0 focus:border-[var(--color-primary)]"
                  required={!editingUser}
                  minLength={8}
                />
              </div>

              <div>
                <label className="block font-['JetBrains_Mono'] text-xs font-bold uppercase mb-1">Role</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full border-2 border-black p-2 font-['Inter'] focus:outline-none focus:ring-0 focus:border-[var(--color-primary)] appearance-none bg-white rounded-none"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-black border-2 border-transparent font-['JetBrains_Mono'] font-bold uppercase text-sm hover:border-black transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-black text-white border-2 border-black font-['JetBrains_Mono'] font-bold uppercase text-sm hover:bg-[var(--color-primary)] hover:text-black transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

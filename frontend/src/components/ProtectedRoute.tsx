import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      toast.error('Authentication Required', {
        description: 'You must be logged in to access the Trickster Dashboard.',
      });
    }
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="h-20 border-b-4 border-black flex items-center justify-between px-8 bg-[#f4f4f4]">
          <Skeleton className="h-8 w-40 bg-gray-300 border-2 border-black" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-10 bg-gray-300 border-2 border-black" />
            <Skeleton className="h-10 w-32 bg-gray-300 border-2 border-black hidden sm:block" />
          </div>
        </div>
        <div className="flex-1 p-8 md:p-12 space-y-12 max-w-7xl mx-auto w-full">
          <div className="space-y-4">
            <Skeleton className="h-16 w-3/4 max-w-md bg-gray-300 border-2 border-black" />
            <Skeleton className="h-6 w-full max-w-xl bg-gray-200" />
          </div>
          <Skeleton className="h-80 w-full bg-gray-200 border-4 border-black shadow-[8px_8px_0px_0px_#111111]" />
          <div className="flex flex-col md:flex-row gap-8">
            <Skeleton className="h-64 flex-1 bg-gray-200 border-4 border-black shadow-[8px_8px_0px_0px_#111111]" />
            <Skeleton className="h-64 flex-1 bg-gray-200 border-4 border-black shadow-[8px_8px_0px_0px_#111111]" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role === 'admin') {
    toast.error('Access Denied', {
      description: 'Admin accounts cannot access the user dashboard.',
    });
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}

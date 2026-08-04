import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function AuthLayout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col lg:flex-row bg-theme-bg">
        {/* Left Form Skeleton */}
        <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center p-8 md:p-12 relative z-10">
          <div className="w-full max-w-md space-y-8">
            <Skeleton className="w-12 h-12 border-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]" />
            <div className="space-y-4">
              <Skeleton className="h-16 w-64 border-2 border-theme-border" />
              <div className="w-16 h-2 bg-gray-200 border-2 border-theme-border" />
              <Skeleton className="h-6 w-80" />
            </div>
            <div className="space-y-6 mt-12">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-14 w-full border-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-14 w-full border-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]" />
              </div>
              <Skeleton className="h-16 w-full mt-8 border-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]" />
            </div>
          </div>
        </div>
        {/* Right Brand Skeleton */}
        <div className="hidden lg:flex lg:w-1/2 min-h-screen bg-black border-l-4 border-theme-border flex-col items-center justify-center p-12">
          <div className="w-full max-w-xl space-y-8">
            <Skeleton className="h-8 w-48 border-2 border-white bg-gray-800" />
            <Skeleton className="h-48 w-full bg-gray-900 border-none" />
            <Skeleton className="h-24 w-full bg-gray-800 border-none" />
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app/dashboard" state={{ from: location }} replace />;
  }

  // Pass through directly to Auth pages (Login, Register) which handle their own split-screen layouts
  return <Outlet />;
}

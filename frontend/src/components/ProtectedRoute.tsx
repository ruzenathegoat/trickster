import { Navigate, Outlet } from 'react-router-dom';
import { toast } from 'sonner';

export default function ProtectedRoute() {
  // TODO: Replace with actual auth context/state once backend auth is integrated
  const isAuthenticated = localStorage.getItem('trickster_token') !== null;
  // For development purposes, if you want to bypass auth, you can temporarily set a dummy token in localStorage: 
  // localStorage.setItem('trickster_token', 'dummy')

  if (!isAuthenticated) {
    // We defer the toast slightly so it doesn't fire during the initial render phase
    setTimeout(() => {
      toast.error('Authentication Required', {
        description: 'You must be logged in to access the Trickster Dashboard.',
      });
    }, 100);
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

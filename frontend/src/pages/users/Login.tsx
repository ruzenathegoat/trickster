import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { Envelope, Lock, ArrowRight } from '@phosphor-icons/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/app/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await login({ email, password });
      toast.success('Login Successful', {
        description: 'Welcome back to Trickster.'
      });
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error('Login Failed', {
        description: error.response?.data?.message || 'Invalid credentials or server error.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[var(--color-surface)] w-full max-w-md border-2 border-[var(--color-on-background)] brutal-shadow p-8 relative z-10 cut-corner">
      
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-['Archivo_Black'] text-[1.5rem] font-bold text-[var(--color-on-background)] mb-2 uppercase">
          Sign In to your account
        </h1>
        <p className="font-['Inter'] text-[1rem] text-[var(--color-secondary)]">
          Welcome back to the dashboard.
        </p>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Email Input */}
        <div className="space-y-2">
          <label className="block font-['JetBrains_Mono'] text-[0.75rem] font-bold uppercase tracking-wider text-[var(--color-on-background)]" htmlFor="email">
            Work Email
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--color-secondary)] pointer-events-none">
              <Envelope weight="bold" className="text-[1.25rem]" />
            </span>
            <input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="scout@trickster.gg" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--color-surface)] border-2 border-[var(--color-on-background)] py-3 pl-10 pr-4 font-['Inter'] text-[1rem] text-[var(--color-on-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow duration-200"
            />
          </div>
        </div>
        
        {/* Password Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <label className="block font-['JetBrains_Mono'] text-[0.75rem] font-bold uppercase tracking-wider text-[var(--color-on-background)]" htmlFor="password">
              Password
            </label>
            <Link to="/forgot-password" className="font-['JetBrains_Mono'] text-[0.7rem] text-[var(--color-on-background)] hover:text-[var(--color-primary)] hover:underline underline-offset-2 decoration-2 font-bold transition-colors">
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--color-secondary)] pointer-events-none">
              <Lock weight="bold" className="text-[1.25rem]" />
            </span>
            <input 
              id="password" 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--color-surface)] border-2 border-[var(--color-on-background)] py-3 pl-10 pr-4 font-['Inter'] text-[1rem] text-[var(--color-on-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow duration-200"
            />
          </div>
        </div>
        
        {/* Primary CTA */}
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-[var(--color-primary)] text-[var(--color-on-background)] border-2 border-[var(--color-on-background)] py-3 px-6 font-['JetBrains_Mono'] text-[0.875rem] font-bold uppercase brutal-shadow-sm brutal-hover flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-[var(--color-on-background)] border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              Sign In
              <ArrowRight weight="bold" className="text-[1.25rem]" />
            </>
          )}
        </button>
      </form>
      
      <div className="my-6 flex items-center gap-4">
        <div className="flex-1 h-[2px] bg-[var(--color-on-background)]"></div>
        <span className="font-['JetBrains_Mono'] text-[0.75rem] uppercase text-[var(--color-secondary)] font-bold">Or</span>
        <div className="flex-1 h-[2px] bg-[var(--color-on-background)]"></div>
      </div>
      
      {/* Secondary CTA */}
      <button 
        type="button" 
        className="w-full bg-[var(--color-surface)] text-[var(--color-on-background)] border-2 border-[var(--color-on-background)] py-3 px-6 font-['JetBrains_Mono'] text-[0.875rem] font-bold uppercase brutal-shadow-sm brutal-hover flex items-center justify-center gap-3"
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 127.14 96.36">
          <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.68,62.32c-5.22,0-9.49-4.77-9.49-10.6s4.19-10.6,9.49-10.6,9.54,4.77,9.49,10.6-4.23,10.6-9.49,10.6Zm41.74,0c-5.22,0-9.49-4.77-9.49-10.6s4.19-10.6,9.49-10.6,9.54,4.77,9.49,10.6-4.23,10.6-9.49,10.6Z"></path>
        </svg>
        Continue with Discord
      </button>

      <div className="mt-8 text-center">
        <p className="font-['Inter'] text-[0.875rem] text-[var(--color-secondary)]">
          Don't have an account? <Link to="/register" className="text-[var(--color-on-background)] font-bold hover:text-[var(--color-primary)] hover:underline decoration-2 underline-offset-2 transition-colors">Sign up</Link>
        </p>
      </div>

    </div>
  );
}

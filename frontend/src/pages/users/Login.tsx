import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { Envelope, Lock, ArrowRight, DiscordLogo, ChartBar } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/app/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const user = await login({ email, password });
      
      if (user.role === 'admin') {
        await logout();
        toast.error('Access Denied', {
          description: 'Admin accounts cannot access the user dashboard. Please use the Admin Gateway.',
        });
        navigate('/admin/login', { replace: true });
        return;
      }
      
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      
      {/* Left Panel: Form */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center p-6 md:p-12 relative z-10">
        
        {/* Subtle grid background for the form side */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(black 2px, transparent 2px)', backgroundSize: '24px 24px' }} />

        <div className="w-full max-w-md relative z-10">
          
          <Link to="/" className="inline-block mb-12 group">
            <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-display text-2xl font-black group-hover:bg-[var(--color-primary)] group-hover:text-black transition-colors border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              T
            </div>
          </Link>

          <div className="mb-8">
            <h1 className="font-display text-[2.5rem] md:text-[3rem] font-black text-black leading-none uppercase tracking-tighter mb-4 break-words">
              Access<br/>Portal
            </h1>
            <div className="w-16 h-2 bg-[var(--color-primary)] border-2 border-black mb-4" />
            <p className="font-body text-gray-600 font-medium text-lg">
              Authenticate to enter the data engine.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Input */}
            <div className="space-y-2">
              <label className="block font-label text-[0.75rem] font-bold uppercase tracking-widest text-black" htmlFor="email">
                Work Email
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-black transition-colors pointer-events-none">
                  <Envelope weight="bold" className="text-xl" />
                </span>
                <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="scout@trickster.gg" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#f4f4f4] border-4 border-black py-3 pl-12 pr-4 font-body text-base text-black focus:outline-none focus:bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_var(--color-primary)] transition-all duration-200"
                />
              </div>
            </div>
            
            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <label className="block font-label text-[0.75rem] font-bold uppercase tracking-widest text-black" htmlFor="password">
                  Password
                </label>
                <Link to="/forgot-password" className="font-label text-[0.7rem] text-gray-500 hover:text-black hover:underline underline-offset-4 decoration-2 font-bold transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-black transition-colors pointer-events-none">
                  <Lock weight="bold" className="text-xl" />
                </span>
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#f4f4f4] border-4 border-black py-3 pl-12 pr-4 font-body text-base text-black focus:outline-none focus:bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_var(--color-primary)] transition-all duration-200"
                />
              </div>
            </div>
            
            {/* Primary CTA */}
            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[var(--color-primary)] text-black border-4 border-black py-4 px-6 font-display text-lg font-black uppercase shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 mt-8 disabled:opacity-50 disabled:cursor-not-allowed transition-shadow"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Authenticate
                  <ArrowRight weight="bold" className="text-xl" />
                </>
              )}
            </motion.button>
          </form>
          
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-1 bg-black"></div>
            <span className="font-label text-[0.75rem] uppercase text-gray-500 font-bold tracking-widest">Or</span>
            <div className="flex-1 h-1 bg-black"></div>
          </div>
          
          {/* Secondary CTA */}
          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="button" 
            className="w-full bg-[#f4f4f4] text-black border-4 border-black py-3 px-6 font-label text-sm font-bold uppercase shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white flex items-center justify-center gap-3 transition-all"
          >
            <DiscordLogo weight="fill" className="text-2xl" />
            Continue with Discord
          </motion.button>

          <div className="mt-12 text-center">
            <p className="font-body text-[0.875rem] text-gray-500 font-medium">
              Don't have an account? <Link to="/register" className="text-black font-bold hover:text-[var(--color-primary)] hover:underline decoration-4 underline-offset-4 transition-colors ml-1">Sign up</Link>
            </p>
          </div>

        </div>
      </div>

      {/* Right Panel: Brand Visual */}
      <div className="hidden lg:flex lg:w-1/2 min-h-screen bg-black border-l-4 border-black flex-col items-center justify-center p-12 relative overflow-hidden text-white">
        
        {/* Halftone pattern background */}
        <div className="absolute inset-0 opacity-[0.1]" 
           style={{ backgroundImage: 'radial-gradient(white 2px, transparent 2px)', backgroundSize: '16px 16px' }} />

        {/* Huge background Icon */}
        <ChartBar weight="duotone" className="absolute -right-20 -bottom-20 text-[40rem] text-white opacity-5" />

        <div className="relative z-10 max-w-xl">
          <div className="inline-block border-4 border-[var(--color-primary)] p-2 mb-8 rotate-[-2deg]">
            <span className="bg-[var(--color-primary)] text-black font-label text-sm font-bold tracking-widest uppercase px-4 py-1">
              Data Engine Active
            </span>
          </div>
          
          <h2 className="font-display text-[5rem] font-black uppercase leading-[0.85] tracking-tighter mb-6 mix-blend-difference">
            DATA IS <br/>
            <span className="text-transparent" style={{ WebkitTextStroke: '2px var(--color-primary)' }}>SCATTERED.</span><br/>
            WE UNIFY IT.
          </h2>
          
          <div className="border-l-4 border-white pl-6 mt-12">
            <p className="font-body text-xl text-gray-400 leading-relaxed font-medium">
              Access the most comprehensive SMART scoring database in professional Valorant. Normalize performance, predict synergy, and scout with mathematical certainty.
            </p>
          </div>
        </div>

      </div>
      
    </div>
  );
}

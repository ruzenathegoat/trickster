import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { Warning, LockKey, ArrowRight } from '@phosphor-icons/react';

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login({ email, password });
      
      if (user.role !== 'admin') {
        await logout();
        throw new Error('Not an admin');
      }
      
      toast.success('Admin authenticated');
      navigate('/admin/scraper');
    } catch (err: any) {
      toast.error('Login Failed', {
        description: err.message === 'Not an admin' 
          ? 'You do not have administrative privileges.' 
          : 'Invalid credentials or server error.',
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-black">
      
      {/* Left Panel: Warning Visual */}
      <div className="hidden lg:flex lg:w-1/2 min-h-screen bg-[var(--color-primary)] border-r-4 border-black flex-col items-center justify-center relative overflow-hidden text-black z-10">
        
        {/* Halftone pattern background */}
        <div className="absolute inset-0 opacity-[0.1]" 
           style={{ backgroundImage: 'radial-gradient(black 2px, transparent 2px)', backgroundSize: '16px 16px' }} />

        {/* Diagonal Warning Stripes */}
        <div className="absolute top-0 left-0 w-full h-8 border-b-4 border-black bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CiAgPHBhdGggZD0iTTAgNDAgTDRwMCAwIEg0MCBMMCA0MCBaIiBmaWxsPSJibGFjayIvPgo8L3N2Zz4=')]" />
        <div className="absolute bottom-0 left-0 w-full h-8 border-t-4 border-black bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CiAgPHBhdGggZD0iTTAgNDAgTDRwMCAwIEg0MCBMMCA0MCBaIiBmaWxsPSJibGFjayIvPgo8L3N2Zz4=')]" />

        {/* Huge repeating typography */}
        <div className="absolute left-[-20%] top-0 h-full w-[140%] flex flex-col justify-between opacity-10 pointer-events-none select-none overflow-hidden">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="font-display text-[8rem] font-black uppercase whitespace-nowrap leading-none tracking-tighter transform -rotate-12">
              RESTRICTED ACCESS - RESTRICTED ACCESS - 
            </div>
          ))}
        </div>

        <div className="relative z-10 max-w-lg text-center flex flex-col items-center">
          <div className="w-32 h-32 bg-black border-4 border-black mb-8 flex items-center justify-center rotate-45">
            <Warning weight="fill" className="text-[4rem] text-[var(--color-primary)] -rotate-45" />
          </div>
          
          <h2 className="font-display text-[4rem] font-black uppercase leading-[0.85] tracking-tighter mb-6 text-black">
            ADMINISTRATIVE<br/>GATEWAY
          </h2>
          
          <p className="font-body text-xl text-gray-900 leading-relaxed font-bold border-4 border-black p-4 bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)]">
            UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED. ALL ACTIONS ARE LOGGED AND MONITORED.
          </p>
        </div>

      </div>

      {/* Right Panel: Form */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center p-8 md:p-12 relative z-10 bg-black text-white">
        
        {/* Subtle grid background for the form side */}
        <div className="absolute inset-0 opacity-[0.05]" 
           style={{ backgroundImage: 'radial-gradient(white 2px, transparent 2px)', backgroundSize: '24px 24px' }} />

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={mounted ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-md relative z-10"
        >
          
          <div className="mb-12">
            <div className="inline-block border-4 border-white p-2 mb-4">
              <LockKey weight="bold" className="text-3xl" />
            </div>
            <h1 className="font-display text-[2.5rem] font-black text-white leading-none uppercase tracking-tighter mb-4">
              System Login
            </h1>
            <p className="font-label text-gray-400 font-bold text-sm tracking-widest uppercase">
              Enter credentials to proceed
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Email Input */}
            <div className="space-y-2">
              <label className="block font-label text-[0.75rem] font-bold uppercase tracking-widest text-white" htmlFor="email">
                Admin Identifier
              </label>
              <input 
                id="email" 
                type="email" 
                placeholder="admin@trickster.gg" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border-4 border-[#333333] py-4 px-4 font-body text-base text-white focus:outline-none focus:border-[var(--color-primary)] shadow-[4px_4px_0px_#333333] focus:shadow-[6px_6px_0px_var(--color-primary)] transition-all duration-200 placeholder:text-[#555555]"
              />
            </div>
            
            {/* Password Input */}
            <div className="space-y-2">
              <label className="block font-label text-[0.75rem] font-bold uppercase tracking-widest text-white" htmlFor="password">
                Passcode
              </label>
              <input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border-4 border-[#333333] py-4 px-4 font-body text-base text-white focus:outline-none focus:border-[var(--color-primary)] shadow-[4px_4px_0px_#333333] focus:shadow-[6px_6px_0px_var(--color-primary)] transition-all duration-200 placeholder:text-[#555555]"
              />
            </div>
            
            {/* Primary CTA */}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={loading}
              className="w-full bg-[var(--color-primary)] text-black border-4 border-[var(--color-primary)] hover:border-white py-4 px-6 font-display text-lg font-black uppercase shadow-[6px_6px_0px_white] hover:shadow-[8px_8px_0px_white] flex items-center justify-between mt-12 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="flex items-center gap-4">
                  <div className="w-5 h-5 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                <>
                  <span>Authenticate</span>
                  <ArrowRight weight="bold" className="text-2xl" />
                </>
              )}
            </motion.button>
          </form>
          
          <div className="mt-16 text-left border-l-4 border-[#333333] pl-4">
            <button 
              onClick={() => navigate('/')} 
              className="font-label text-xs font-bold text-[#777777] hover:text-white transition-colors uppercase tracking-widest"
            >
              ← Return to Public Facing Site
            </button>
          </div>

        </motion.div>
      </div>
      
    </div>
  );
}

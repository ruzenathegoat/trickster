import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import axios from 'axios';

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://trickster.test/backend/public/api/v1/auth/login', {
        email,
        password
      });
      localStorage.setItem('token', res.data.access_token);
      navigate('/admin/scraper');
    } catch (err) {
      alert('Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] selection:bg-[var(--color-primary)] selection:text-black relative overflow-hidden">
      
      {/* Decorative background grid */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#111 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      <motion.div
        initial={{ opacity: 0, transform: "scale(0.95)" }}
        animate={mounted ? { opacity: 1, transform: "scale(1)" } : {}}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="neo-border bg-white p-8 neo-shadow relative">
          
          {/* Decorative cut corner */}
          <div className="absolute -top-[3px] -right-[3px] w-12 h-12 bg-[var(--color-background)] border-l-[3px] border-b-[3px] border-[var(--color-secondary)] rotate-45 translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none" />
          
          <div className="flex flex-col items-center mb-8 relative z-10">
            <div className="w-16 h-16 bg-[var(--color-primary)] neo-border flex items-center justify-center mb-4 p-2 cut-corner">
              <img src="/logo.png" alt="Trickster Admin Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-3xl font-['Archivo_Black'] uppercase text-center leading-tight">Admin<br/>Gateway</h2>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5 relative z-10">
            <div className="space-y-1">
              <label className="text-[11px] font-bold font-['JetBrains_Mono'] uppercase tracking-widest text-gray-500">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full neo-border p-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[var(--color-primary-subtle)] transition-all font-medium text-sm"
                placeholder="admin@example.com"
                required
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[11px] font-bold font-['JetBrains_Mono'] uppercase tracking-widest text-gray-500">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full neo-border p-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[var(--color-primary-subtle)] transition-all font-medium text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="mt-2 w-full bg-[var(--color-primary)] neo-border p-4 font-['Archivo_Black'] text-lg uppercase tracking-wide neo-shadow-hover neo-shadow-active disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Authenticating...' : 'Authenticate'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button 
              onClick={() => navigate('/')} 
              className="text-xs font-medium text-gray-400 hover:text-black transition-colors underline underline-offset-4"
            >
              Return to Public Site
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

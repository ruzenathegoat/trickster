import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Envelope, PaperPlaneTilt, ShieldCheck } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // ponytail: placeholder — wire to real API when backend endpoint exists
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSent(true);
      toast.success('Reset Link Sent', {
        description: 'Check your inbox for the password reset link.'
      });
    } catch (error: any) {
      toast.error('Request Failed', {
        description: error.response?.data?.message || 'Could not send reset link.'
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
              Reset<br/>Access
            </h1>
            <div className="w-16 h-2 bg-[var(--color-primary)] border-2 border-black mb-4" />
            <p className="font-body text-gray-600 font-medium text-lg">
              Enter your email and we'll send a recovery link.
            </p>
          </div>
          
          {isSent ? (
            /* Success State */
            <div className="space-y-6">
              <div className="bg-[#f4f4f4] border-4 border-black p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[var(--color-primary)] border-2 border-black flex items-center justify-center flex-shrink-0">
                    <PaperPlaneTilt weight="bold" className="text-xl text-black" />
                  </div>
                  <div>
                    <p className="font-label text-[0.75rem] font-bold uppercase tracking-widest text-black mb-2">
                      Link Sent
                    </p>
                    <p className="font-body text-gray-600 text-sm leading-relaxed">
                      We've sent a password reset link to <span className="font-bold text-black">{email}</span>. Check your inbox and follow the instructions.
                    </p>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => { setIsSent(false); setEmail(''); }}
                className="w-full bg-[#f4f4f4] text-black border-4 border-black py-3 px-6 font-label text-sm font-bold uppercase shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white flex items-center justify-center gap-3 transition-all"
              >
                Try a different email
              </motion.button>
            </div>
          ) : (
            /* Form State */
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
                    Send Reset Link
                    <PaperPlaneTilt weight="bold" className="text-xl" />
                  </>
                )}
              </motion.button>
            </form>
          )}

          <div className="mt-12 text-center">
            <p className="font-body text-[0.875rem] text-gray-500 font-medium">
              Remember your password? <Link to="/login" className="text-black font-bold hover:text-[var(--color-primary)] hover:underline decoration-4 underline-offset-4 transition-colors ml-1">Sign in</Link>
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
        <ShieldCheck weight="duotone" className="absolute -right-20 -bottom-20 text-[40rem] text-white opacity-5" />

        <div className="relative z-10 max-w-xl">
          <div className="inline-block border-4 border-[var(--color-primary)] p-2 mb-8 rotate-[-2deg]">
            <span className="bg-[var(--color-primary)] text-black font-label text-sm font-bold tracking-widest uppercase px-4 py-1">
              Account Recovery
            </span>
          </div>
          
          <h2 className="font-display text-[5rem] font-black uppercase leading-[0.85] tracking-tighter mb-6 mix-blend-difference">
            LOCKED<br/>
            <span className="text-transparent" style={{ WebkitTextStroke: '2px var(--color-primary)' }}>OUT?</span><br/>
            WE GOT IT.
          </h2>
          
          <div className="border-l-4 border-white pl-6 mt-12">
            <p className="font-body text-xl text-gray-400 leading-relaxed font-medium">
              Your scouting data and profiles are safe. Reset your credentials and get back to analyzing the meta in seconds.
            </p>
          </div>
        </div>

      </div>
      
    </div>
  );
}

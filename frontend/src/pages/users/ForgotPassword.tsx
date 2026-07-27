import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  return (
    <div className="bg-[var(--color-surface)] w-full max-w-md border-2 border-[var(--color-on-background)] brutal-shadow p-8 relative z-10 cut-corner">
      
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-['Archivo_Narrow'] text-[1.5rem] font-bold text-[var(--color-on-background)] mb-2 uppercase">
          Reset Password
        </h1>
        <p className="font-['Inter'] text-[1rem] text-[var(--color-secondary)]">
          Enter your email to receive a reset link.
        </p>
      </div>
      
      {/* Form */}
      <form className="space-y-6">
        
        {/* Email Input */}
        <div className="space-y-2">
          <label className="block font-['JetBrains_Mono'] text-[0.75rem] font-bold uppercase tracking-wider text-[var(--color-on-background)]" htmlFor="email">
            Work Email
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--color-secondary)] pointer-events-none">
              <span className="material-symbols-outlined text-[1.25rem]">mail</span>
            </span>
            <input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="scout@trickster.gg" 
              required 
              className="w-full bg-[var(--color-surface)] border-2 border-[var(--color-on-background)] py-3 pl-10 pr-4 font-['Inter'] text-[1rem] text-[var(--color-on-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow duration-200"
            />
          </div>
        </div>
        
        {/* Primary CTA */}
        <button 
          type="submit" 
          className="w-full bg-[var(--color-primary)] text-[var(--color-on-background)] border-2 border-[var(--color-on-background)] py-3 px-6 font-['JetBrains_Mono'] text-[0.875rem] font-bold uppercase brutal-shadow-sm brutal-hover flex items-center justify-center gap-2 mt-4"
        >
          Send Reset Link
          <span className="material-symbols-outlined text-[1.25rem]">mail</span>
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="font-['Inter'] text-[0.875rem] text-[var(--color-secondary)]">
          Remember your password? <Link to="/login" className="text-[var(--color-on-background)] font-bold hover:text-[var(--color-primary)] hover:underline decoration-2 underline-offset-2 transition-colors">Sign in</Link>
        </p>
      </div>

    </div>
  );
}

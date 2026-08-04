import { useState, useEffect } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../../lib/axios';


export default function RecommendFlow() {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [minScore, setMinScore] = useState<number>(45);
  const [playstyle, setPlaystyle] = useState<'Adaptable' | 'Specialist'>('Adaptable');
  const [scanProgress, setScanProgress] = useState(0);
  
  const [minBound, setMinBound] = useState<number>(20);
  const [maxBound, setMaxBound] = useState<number>(80);
  const [allAgents, setAllAgents] = useState<any[]>([]);
  const [preferredAgents, setPreferredAgents] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Derived state: perfectly syncs without side effects
  const agents = selectedRole ? allAgents.filter((a: any) => a.role === selectedRole) : [];

  useEffect(() => {
    // Fetch bounds
    axios.get('/api/v1/smart/bounds')
      .then(({ data }) => {
        setMinBound(data.min);
        setMaxBound(data.max);
        setMinScore(Math.floor((data.min + data.max) / 2));
      })
      .catch(console.error);

    // Fetch all agents ONCE on mount
    axios.get('/api/v1/valorant-agents')
      .then(({ data }) => {
        const agentsArray = data.data || data || [];
        setAllAgents(Array.isArray(agentsArray) ? agentsArray : []);
      })
      .catch(console.error);
  }, []);

  // Agent filtering is now handled synchronously in handleRoleSelect

  useEffect(() => {
    if (step === 3) {
      const interval = setInterval(() => {
        setScanProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep(4), 400);
            return 100;
          }
          return p + Math.floor(Math.random() * 15) + 5;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setPreferredAgents([]); // Reset preferences when changing or re-selecting a role
    setStep(2);
  };

  const handleStartScan = async () => {
    setScanProgress(0);
    setStep(3);
    setErrorMsg(null);

    try {
      const { data } = await axios.post('/api/v1/smart/scout', {
        role: selectedRole,
        min_score: minScore,
        playstyle,
        agent_preferences: preferredAgents
      });

      if (Array.isArray(data)) {
        setResults(data);
        setErrorMsg(null);
      } else {
        console.error('API returned non-array:', data);
        setErrorMsg(data?.message || 'Server Error: Invalid response format.');
        setResults([]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to fetch data.');
      setResults([]);
    }
  };

  const roles = ['Duelist', 'Initiator', 'Controller', 'Sentinel', 'Flex'];
  const roleDescriptions: Record<string, string> = {
    Duelist: 'Entry fragging and space creation',
    Initiator: 'Information gathering and offensive support',
    Controller: 'Vision blocking and map control',
    Sentinel: 'Flank watching and site anchoring',
    Flex: 'Multi-role adaptability',
  };



  const steps = ['Role', 'Standards', 'Scan'];

  return (
    <div className="max-w-5xl mx-auto pb-16">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="mb-12 border-b-4 border-theme-border pb-6"
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display uppercase tracking-tighter leading-none mb-3">
          Scouting Engine
        </h1>
        <p className="font-label text-sm text-gray-500 uppercase tracking-widest max-w-xl">
          Find the missing piece for your roster using SMART analysis.
        </p>
      </motion.div>

      {/* Step Indicator */}
      {step < 4 && (
        <div className="flex items-center gap-0 mb-12 border-4 border-theme-border w-fit">
          {steps.map((s, i) => (
            <div 
              key={s}
              className={`px-6 py-3 font-label text-[12px] font-bold uppercase tracking-widest ${
                i > 0 ? 'border-l-2 border-theme-border' : ''
              } ${
                step > i ? 'bg-black text-[var(--color-primary)]' : 
                step === i + 1 ? 'bg-[var(--color-primary)] text-black' : 
                'bg-theme-bg text-gray-400'
              }`}
            >
              {i + 1}. {s}
            </div>
          ))}
        </div>
      )}

      {/* STEP 1: ROLE SELECTION — Joined horizontal bar, not identical cards */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <h2 className="text-3xl font-display uppercase tracking-tight mb-8">
            What role is your team missing?
          </h2>
          
          {/* Role list — stacked rows, not identical cards */}
          <div className="border-4 border-theme-border divide-y-4 divide-black">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => handleRoleSelect(role)}
                className="w-full flex items-center justify-between px-8 py-6 bg-theme-bg hover:bg-black hover:text-white group transition-colors active:scale-[0.99]"
              >
                <div className="flex items-center gap-6">
                  <span className="font-display text-2xl md:text-3xl lg:text-4xl uppercase tracking-tighter group-hover:text-[var(--color-primary)] transition-colors">
                    {role}
                  </span>
                  <span className="font-label text-[11px] text-gray-400 uppercase tracking-widest group-hover:text-white/50 hidden md:inline transition-colors">
                    {roleDescriptions[role]}
                  </span>
                </div>
                <ArrowRight weight="bold" size={24} className="text-gray-300 group-hover:text-[var(--color-primary)] group-hover:translate-x-2 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* STEP 2: STANDARDS */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-display uppercase tracking-tight">Define Your Standards</h2>
            <button 
              onClick={() => setStep(1)}
              className="font-label text-[12px] font-bold text-gray-500 hover:text-theme-text transition-colors uppercase tracking-widest border-b-2 border-transparent hover:border-theme-border"
            >
              Back to Role
            </button>
          </div>
          
          <div className="border-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] bg-theme-bg">
            
            {/* Slider Section */}
            <div className="p-8 lg:p-10 border-b-4 border-theme-border">
              <div className="flex justify-between items-end mb-6">
                <label className="font-display text-xl uppercase">Minimum SMART Score</label>
                <span className="font-numeric font-black text-3xl bg-[var(--color-primary)] border-4 border-theme-border px-4 py-2 shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] tabular-nums">
                  {minScore}
                </span>
              </div>
              <input 
                type="range" 
                min={minBound} max={maxBound} 
                value={minScore} 
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-full h-4 bg-gray-200 border-2 border-theme-border appearance-none cursor-pointer accent-black"
                style={{
                  background: `linear-gradient(to right, black ${((minScore - minBound) / (maxBound - minBound)) * 100}%, #e5e7eb ${((minScore - minBound) / (maxBound - minBound)) * 100}%)`
                }}
              />
              <div className="flex justify-between mt-3 font-label text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Rookie ({minBound})</span>
                <span>Pro Level ({maxBound})</span>
              </div>
            </div>

            {/* Agent Preferences */}
            <div className="p-8 lg:p-10 border-b-4 border-theme-border">
              <div className="flex justify-between items-end mb-6">
                <label className="font-display text-xl uppercase">Agent Preferences (Optional)</label>
                <span className="font-label text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  {preferredAgents.length}/3 Selected
                </span>
              </div>
              <div className="flex flex-wrap gap-4">
                {agents.map((agent) => {
                  const isSelected = preferredAgents.includes(agent.name);
                  return (
                    <button
                      key={agent.id}
                      onClick={() => {
                        if (isSelected) {
                          setPreferredAgents(prev => prev.filter(a => a !== agent.name));
                        } else if (preferredAgents.length < 3) {
                          setPreferredAgents(prev => [...prev, agent.name]);
                        }
                      }}
                      className={`flex flex-col items-center gap-2 p-2 border-2 transition-all active:scale-95 ${
                        isSelected 
                          ? 'border-theme-border bg-black text-[var(--color-primary)]' 
                          : 'border-gray-200 hover:border-theme-border hover:bg-gray-50'
                      } ${!isSelected && preferredAgents.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <img src={agent.icon_url} alt={agent.name} className="w-12 h-12" />
                      <span className="font-label text-[10px] uppercase font-bold tracking-widest">{agent.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Playstyle Toggle */}
            <div className="p-8 lg:p-10 border-b-4 border-theme-border">
              <label className="font-display text-xl uppercase mb-6 block">Playstyle Preference</label>
              <div className="flex flex-col sm:flex-row border-4 border-theme-border">
                <button 
                  onClick={() => setPlaystyle('Adaptable')}
                  className={`flex-1 p-5 text-center transition-colors active:scale-[0.98] ${
                    playstyle === 'Adaptable' 
                      ? 'bg-black text-[var(--color-primary)]' 
                      : 'bg-theme-bg text-theme-text hover:bg-gray-50'
                  }`}
                >
                  <span className="block font-display text-xl uppercase mb-1">Adaptable</span>
                  <span className="font-label text-[11px] uppercase tracking-widest opacity-60">High Meta Adaptability</span>
                </button>
                <button 
                  onClick={() => setPlaystyle('Specialist')}
                  className={`flex-1 p-5 border-t-4 sm:border-t-0 sm:border-l-4 border-theme-border text-center transition-colors active:scale-[0.98] ${
                    playstyle === 'Specialist' 
                      ? 'bg-black text-[var(--color-primary)]' 
                      : 'bg-theme-bg text-theme-text hover:bg-gray-50'
                  }`}
                >
                  <span className="block font-display text-xl uppercase mb-1">Specialist</span>
                  <span className="font-label text-[11px] uppercase tracking-widest opacity-60">Deep Mastery</span>
                </button>
              </div>
            </div>

            {/* CTA */}
            <button 
              onClick={handleStartScan}
              className="w-full bg-[var(--color-primary)] p-6 font-display text-xl uppercase tracking-widest hover:bg-black hover:text-[var(--color-primary)] transition-colors active:scale-[0.98] flex justify-center items-center gap-4"
            >
              Initiate Database Scan
              <ArrowRight weight="bold" size={24} />
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 3: SCANNING STATE */}
      {step === 3 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="flex flex-col items-center justify-center py-24"
        >
          {/* Progress bar as the main visual, not a decorative radar */}
          <h2 className="font-display text-4xl uppercase tracking-tighter text-theme-text mb-2">
            Scanning
          </h2>
          <p className="font-label text-[12px] text-gray-400 uppercase tracking-widest mb-10">
            {selectedRole} / SMART &gt;{minScore} / {playstyle}
          </p>

          <div className="w-full max-w-md">
            <div className="h-6 border-4 border-theme-border bg-theme-bg">
              <motion.div 
                className="h-full bg-black"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(scanProgress, 100)}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <div className="flex justify-between mt-3">
              <span className="font-label text-[11px] font-bold text-gray-400 uppercase tracking-widest">Processing</span>
              <span className="font-numeric font-bold text-sm tabular-nums">{Math.min(scanProgress, 100)}%</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* STEP 4: RESULTS — Not identical cards. Rank 1 is a hero, rest are table rows. */}
      {step === 4 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="flex justify-between items-end mb-10 border-b-4 border-theme-border pb-6">
            <div>
              <h2 className="text-4xl font-display uppercase tracking-tighter text-theme-text mb-2">
                Scouting Report
              </h2>
              <p className="font-label text-[12px] text-gray-500 uppercase tracking-widest">
                {selectedRole} / SMART &gt;{minScore} / {playstyle}
              </p>
            </div>
            <button 
              onClick={() => setStep(1)}
              className="font-label text-[12px] font-bold bg-black text-white px-5 py-3 border-4 border-theme-border hover:bg-[var(--color-primary)] hover:text-black transition-colors active:scale-95 uppercase tracking-widest"
            >
              New Scan
            </button>
          </div>

          {(() => {
            const validResults = Array.isArray(results) ? results : [];
            const hero = validResults[0];
            const rest = validResults.slice(1);
            return (
              <div className="space-y-6">
                {validResults.length === 0 ? (
                  <div className="p-12 border-4 border-dashed border-gray-300 text-center bg-theme-bg">
                    {errorMsg ? (
                      <>
                        <p className="font-display text-2xl uppercase text-red-500 mb-2">Error Occurred</p>
                        <p className="font-label text-[11px] text-red-400 uppercase tracking-widest">
                          {errorMsg}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-display text-2xl uppercase text-theme-text mb-2">No players found</p>
                        <p className="font-label text-[11px] text-gray-400 uppercase tracking-widest">
                          Try lowering your SMART score threshold or changing agent preferences.
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                {/* Rank 1 — Full-width hero block */}
                {hero && (
                  <motion.div
                    initial={{ clipPath: 'inset(100% 0 0 0)' }}
                    animate={{ clipPath: 'inset(0% 0 0 0)' }}
                    transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                    className="border-4 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] bg-[var(--color-primary)] flex flex-col md:flex-row"
                  >
                    {/* Left: Score + Rank */}
                    <div className="md:w-48 bg-black text-[var(--color-primary)] flex flex-col items-center justify-center p-8 border-b-4 md:border-b-0 md:border-r-4 border-theme-border shrink-0">
                      <span className="font-label text-[11px] text-white/40 uppercase tracking-widest mb-2">Rank</span>
                      <span className="font-display text-6xl md:text-7xl leading-none">#1</span>
                    </div>
                    
                    {/* Hero Photo */}
                    {hero.photo_url ? (
                      <div className="w-full md:w-56 shrink-0 border-b-4 md:border-b-0 md:border-r-4 border-theme-border bg-[#111] flex items-end justify-center overflow-hidden">
                        <img src={hero.photo_url} alt={hero.name} className="w-[120%] h-auto object-cover object-bottom translate-y-4" />
                      </div>
                    ) : (
                      <div className="w-full md:w-56 shrink-0 border-b-4 md:border-b-0 md:border-r-4 border-theme-border bg-[#111] flex items-center justify-center">
                        <span className="font-label text-[10px] text-white/30 uppercase tracking-widest">No Photo</span>
                      </div>
                    )}

                    
                    {/* Right: Player data */}
                    <div className="flex-1 p-8 lg:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div>
                        <h3 className="font-display text-3xl md:text-4xl lg:text-5xl uppercase tracking-tighter text-theme-text leading-none mb-2">
                          {hero.name}
                        </h3>
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="font-label text-[11px] font-bold text-theme-text/60 uppercase tracking-widest">{hero.role}</span>
                          <span className="font-label text-[11px] font-bold text-theme-text/60 uppercase tracking-widest">Adapt: {hero.adaptability}</span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          {hero.top_agents?.map((agent: string, i: number) => (
                            <img key={i} src={agent} className="w-12 h-12 bg-black border-2 border-theme-border shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]" alt="agent" />
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
                        <span className="font-label text-[11px] text-theme-text/50 uppercase tracking-widest">SMART Score</span>
                        <span className="font-display text-5xl text-theme-text">{hero.smart_score}</span>
                        <Link 
                          to={`/app/players/${hero.id}`}
                          className="mt-2 font-label text-[11px] font-bold uppercase tracking-widest bg-black text-[var(--color-primary)] px-4 py-2 hover:bg-theme-bg hover:text-theme-text transition-colors flex items-center gap-2"
                        >
                          View Profile <ArrowRight weight="bold" size={14} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Rest — Compact horizontal rows */}
                {rest.map((player, idx) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + idx * 0.1, ease: [0.23, 1, 0.32, 1] }}
                    className="border-4 border-theme-border bg-theme-bg shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] flex flex-col md:flex-row md:items-center hover:bg-[var(--color-primary)] transition-colors group"
                  >
                    {/* Rank */}
                    <div className="md:w-24 bg-black text-white font-display text-2xl md:text-3xl flex items-center justify-center p-5 border-b-4 md:border-b-0 md:border-r-4 border-theme-border shrink-0">
                      #{idx + 2}
                    </div>
                    
                    {/* Row Photo */}
                    {player.photo_url && (
                      <div className="hidden md:flex w-24 shrink-0 border-r-4 border-theme-border bg-[#111] items-end justify-center overflow-hidden">
                        <img src={player.photo_url} alt={player.name} className="w-[120%] h-auto object-cover object-bottom translate-y-2" />
                      </div>
                    )}

                    {/* Data */}
                    <div className="flex-1 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <h3 className="font-display text-2xl uppercase tracking-tighter">{player.name}</h3>
                        <span className="font-label text-[11px] text-gray-400 group-hover:text-theme-text/50 uppercase tracking-widest">{player.role}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex gap-1.5">
                          {player.top_agents?.map((agent: string, i: number) => (
                            <img key={i} src={agent} className="w-9 h-9 bg-black border-2 border-theme-border" alt="agent" />
                          ))}
                        </div>
                        <span className="font-numeric font-bold text-lg tabular-nums">{player.smart_score}</span>
                        <Link 
                          to={`/app/players/${player.id}`}
                          className="font-label text-[11px] font-bold uppercase tracking-widest bg-black text-white px-3 py-2 hover:bg-[var(--color-primary)] hover:text-black border-2 border-theme-border transition-colors shrink-0"
                        >
                          Profile
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
                  </>
                )}
              </div>
            );
          })()}
        </motion.div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const MOCK_RESULTS_BY_ROLE: Record<string, { id: string; name: string; role: string; smart_score: number; adaptability: string; photo_url: string | null; top_agents: string[] }[]> = {
  Duelist: [
    {
      id: '2', name: 'something', role: 'Duelist (Top Agents)', smart_score: 62.4, adaptability: 'Specialist', photo_url: null,
      top_agents: [
        'https://media.valorant-api.com/agents/add6443a-41bd-3414-f6ad-e58d267f4e95/displayicon.png',
        'https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/displayicon.png',
        'https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5d4fc13def43/displayicon.png'
      ]
    },
    {
      id: '1', name: 'f0rsakeN', role: 'Duelist (Top Agents)', smart_score: 59.8, adaptability: 'Adaptable', photo_url: null,
      top_agents: [
        'https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/displayicon.png',
        'https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/displayicon.png',
        'https://media.valorant-api.com/agents/add6443a-41bd-3414-f6ad-e58d267f4e95/displayicon.png'
      ]
    }
  ],
  Controller: [
    {
      id: '3', name: 'mindfreak', role: 'Controller (Top Agents)', smart_score: 61.2, adaptability: 'Adaptable', photo_url: null,
      top_agents: [
        'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png',
        'https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/displayicon.png',
        'https://media.valorant-api.com/agents/41fb69c1-4189-7b37-f117-bcaf1e96f1bf/displayicon.png'
      ]
    }
  ],
  _default: [
    {
      id: '4', name: 'Player_XYZ', role: 'Flex (Top Agents)', smart_score: 58.1, adaptability: 'Adaptable', photo_url: null,
      top_agents: [
        'https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png',
        'https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/displayicon.png',
      ]
    }
  ]
};

export default function RecommendFlow() {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [minScore, setMinScore] = useState<number>(45);
  const [playstyle, setPlaystyle] = useState<'Adaptable' | 'Specialist'>('Adaptable');
  const [scanProgress, setScanProgress] = useState(0);

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
    setStep(2);
  };

  const handleStartScan = () => {
    setScanProgress(0);
    setStep(3);
  };

  const roles = ['Duelist', 'Initiator', 'Controller', 'Sentinel', 'Flex'];
  const roleDescriptions: Record<string, string> = {
    Duelist: 'Entry fragging and space creation',
    Initiator: 'Information gathering and offensive support',
    Controller: 'Vision blocking and map control',
    Sentinel: 'Flank watching and site anchoring',
    Flex: 'Multi-role adaptability',
  };

  const getFilteredResults = () => {
    if (!selectedRole) return [];
    return MOCK_RESULTS_BY_ROLE[selectedRole] || MOCK_RESULTS_BY_ROLE._default;
  };

  const steps = ['Role', 'Standards', 'Scan'];

  return (
    <div className="max-w-5xl mx-auto pb-16">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="mb-12 border-b-4 border-black pb-6"
      >
        <h1 className="text-5xl lg:text-6xl font-display uppercase tracking-tighter leading-none mb-3">
          Scouting Engine
        </h1>
        <p className="font-label text-sm text-gray-500 uppercase tracking-widest max-w-xl">
          Find the missing piece for your roster using SMART analysis.
        </p>
      </motion.div>

      {/* Step Indicator */}
      {step < 4 && (
        <div className="flex items-center gap-0 mb-12 border-4 border-black w-fit">
          {steps.map((s, i) => (
            <div 
              key={s}
              className={`px-6 py-3 font-label text-[12px] font-bold uppercase tracking-widest ${
                i > 0 ? 'border-l-2 border-black' : ''
              } ${
                step > i ? 'bg-black text-[var(--color-primary)]' : 
                step === i + 1 ? 'bg-[var(--color-primary)] text-black' : 
                'bg-white text-gray-400'
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
          <div className="border-4 border-black divide-y-4 divide-black">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => handleRoleSelect(role)}
                className="w-full flex items-center justify-between px-8 py-6 bg-white hover:bg-black hover:text-white group transition-colors active:scale-[0.99]"
              >
                <div className="flex items-center gap-6">
                  <span className="font-display text-3xl lg:text-4xl uppercase tracking-tighter group-hover:text-[var(--color-primary)] transition-colors">
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
              className="font-label text-[12px] font-bold text-gray-500 hover:text-black transition-colors uppercase tracking-widest border-b-2 border-transparent hover:border-black"
            >
              Back to Role
            </button>
          </div>
          
          <div className="border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] bg-white">
            
            {/* Slider Section */}
            <div className="p-8 lg:p-10 border-b-4 border-black">
              <div className="flex justify-between items-end mb-6">
                <label className="font-display text-xl uppercase">Minimum SMART Score</label>
                <span className="font-numeric font-black text-3xl bg-[var(--color-primary)] border-4 border-black px-4 py-2 shadow-[4px_4px_0px_rgba(0,0,0,1)] tabular-nums">
                  {minScore}
                </span>
              </div>
              <input 
                type="range" 
                min="20" max="65" 
                value={minScore} 
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-full h-4 bg-gray-200 border-2 border-black appearance-none cursor-pointer accent-black"
                style={{
                  background: `linear-gradient(to right, black ${((minScore - 20) / 45) * 100}%, #e5e7eb ${((minScore - 20) / 45) * 100}%)`
                }}
              />
              <div className="flex justify-between mt-3 font-label text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Rookie (20)</span>
                <span>Pro Level (65)</span>
              </div>
            </div>

            {/* Playstyle Toggle */}
            <div className="p-8 lg:p-10 border-b-4 border-black">
              <label className="font-display text-xl uppercase mb-6 block">Playstyle Preference</label>
              <div className="flex border-4 border-black">
                <button 
                  onClick={() => setPlaystyle('Adaptable')}
                  className={`flex-1 p-5 text-center transition-colors active:scale-[0.98] ${
                    playstyle === 'Adaptable' 
                      ? 'bg-black text-[var(--color-primary)]' 
                      : 'bg-white text-black hover:bg-gray-50'
                  }`}
                >
                  <span className="block font-display text-xl uppercase mb-1">Adaptable</span>
                  <span className="font-label text-[11px] uppercase tracking-widest opacity-60">High Meta Adaptability</span>
                </button>
                <button 
                  onClick={() => setPlaystyle('Specialist')}
                  className={`flex-1 p-5 border-l-4 border-black text-center transition-colors active:scale-[0.98] ${
                    playstyle === 'Specialist' 
                      ? 'bg-black text-[var(--color-primary)]' 
                      : 'bg-white text-black hover:bg-gray-50'
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
          <h2 className="font-display text-4xl uppercase tracking-tighter text-black mb-2">
            Scanning
          </h2>
          <p className="font-label text-[12px] text-gray-400 uppercase tracking-widest mb-10">
            {selectedRole} / SMART &gt;{minScore} / {playstyle}
          </p>

          <div className="w-full max-w-md">
            <div className="h-6 border-4 border-black bg-white">
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
          <div className="flex justify-between items-end mb-10 border-b-4 border-black pb-6">
            <div>
              <h2 className="text-4xl font-display uppercase tracking-tighter text-black mb-2">
                Scouting Report
              </h2>
              <p className="font-label text-[12px] text-gray-500 uppercase tracking-widest">
                {selectedRole} / SMART &gt;{minScore} / {playstyle}
              </p>
            </div>
            <button 
              onClick={() => setStep(1)}
              className="font-label text-[12px] font-bold bg-black text-white px-5 py-3 border-4 border-black hover:bg-[var(--color-primary)] hover:text-black transition-colors active:scale-95 uppercase tracking-widest"
            >
              New Scan
            </button>
          </div>

          {(() => {
            const results = getFilteredResults();
            const hero = results[0];
            const rest = results.slice(1);

            return (
              <div className="space-y-6">
                {/* Rank 1 — Full-width hero block */}
                {hero && (
                  <motion.div
                    initial={{ clipPath: 'inset(100% 0 0 0)' }}
                    animate={{ clipPath: 'inset(0% 0 0 0)' }}
                    transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                    className="border-4 border-black shadow-[12px_12px_0px_rgba(0,0,0,1)] bg-[var(--color-primary)] flex flex-col md:flex-row"
                  >
                    {/* Left: Score + Rank */}
                    <div className="md:w-48 bg-black text-[var(--color-primary)] flex flex-col items-center justify-center p-8 border-b-4 md:border-b-0 md:border-r-4 border-black shrink-0">
                      <span className="font-label text-[11px] text-white/40 uppercase tracking-widest mb-2">Rank</span>
                      <span className="font-display text-7xl leading-none">#1</span>
                    </div>
                    
                    {/* Right: Player data */}
                    <div className="flex-1 p-8 lg:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div>
                        <h3 className="font-display text-4xl lg:text-5xl uppercase tracking-tighter text-black leading-none mb-2">
                          {hero.name}
                        </h3>
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="font-label text-[11px] font-bold text-black/60 uppercase tracking-widest">{hero.role}</span>
                          <span className="font-label text-[11px] font-bold text-black/60 uppercase tracking-widest">Adapt: {hero.adaptability}</span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          {hero.top_agents.map((agent, i) => (
                            <img key={i} src={agent} className="w-12 h-12 bg-black border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]" alt="agent" />
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
                        <span className="font-label text-[11px] text-black/50 uppercase tracking-widest">SMART Score</span>
                        <span className="font-display text-5xl text-black">{hero.smart_score}</span>
                        <Link 
                          to={`/app/players/${hero.id}`}
                          className="mt-2 font-label text-[11px] font-bold uppercase tracking-widest bg-black text-[var(--color-primary)] px-4 py-2 hover:bg-white hover:text-black transition-colors flex items-center gap-2"
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
                    className="border-4 border-black bg-white shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row md:items-center hover:bg-[var(--color-primary)] transition-colors group"
                  >
                    {/* Rank */}
                    <div className="md:w-24 bg-black text-white font-display text-3xl flex items-center justify-center p-5 border-b-4 md:border-b-0 md:border-r-4 border-black shrink-0">
                      #{idx + 2}
                    </div>
                    {/* Data */}
                    <div className="flex-1 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <h3 className="font-display text-2xl uppercase tracking-tighter">{player.name}</h3>
                        <span className="font-label text-[11px] text-gray-400 group-hover:text-black/50 uppercase tracking-widest">{player.role}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex gap-1.5">
                          {player.top_agents.map((agent, i) => (
                            <img key={i} src={agent} className="w-9 h-9 bg-black border-2 border-black" alt="agent" />
                          ))}
                        </div>
                        <span className="font-numeric font-bold text-lg tabular-nums">{player.smart_score}</span>
                        <Link 
                          to={`/app/players/${player.id}`}
                          className="font-label text-[11px] font-bold uppercase tracking-widest bg-black text-white px-3 py-2 hover:bg-[var(--color-primary)] hover:text-black border-2 border-black transition-colors shrink-0"
                        >
                          Profile
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            );
          })()}

          <div className="mt-10 p-6 border-4 border-dashed border-gray-300 text-center">
            <p className="font-label text-[11px] text-gray-400 uppercase tracking-widest max-w-lg mx-auto">
              Mock data. Real API integration required for live scouting results.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

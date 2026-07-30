import { useState, useEffect } from 'react';
import { 
  Crosshair, 
  ShieldCheck, 
  Eye, 
  Fire, 
  ArrowsMerge,
  CaretRight,
  MagnifyingGlass,
  ArrowRight,
  UserFocus
} from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

// MOCK DATA FOR RESULTS
const MOCK_RESULTS = [
  {
    id: '1',
    name: 'f0rsakeN',
    role: 'Flex',
    smart_score: 94.2,
    adaptability: 'High',
    photo_url: null, // Will fallback to brutalist block
    top_agents: [
      'https://media.valorant-api.com/agents/add6443a-41bd-3414-f6ad-e58d267f4e95/displayicon.png', // Jett
      'https://media.valorant-api.com/agents/117ed9e3-49f4-6a4b-ea0c-ef9973f6a4cc/displayicon.png', // Cypher
      'https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/displayicon.png'  // Skye
    ]
  },
  {
    id: '2',
    name: 'something',
    role: 'Duelist',
    smart_score: 91.8,
    adaptability: 'Specialist',
    photo_url: null,
    top_agents: [
      'https://media.valorant-api.com/agents/add6443a-41bd-3414-f6ad-e58d267f4e95/displayicon.png', // Jett
      'https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/displayicon.png'  // Reyna
    ]
  },
  {
    id: '3',
    name: 'mindfreak',
    role: 'Controller',
    smart_score: 88.5,
    adaptability: 'Medium',
    photo_url: null,
    top_agents: [
      'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png', // Omen
      'https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/displayicon.png', // Viper
    ]
  }
];

export default function RecommendFlow() {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [minScore, setMinScore] = useState<number>(45);
  const [playstyle, setPlaystyle] = useState<'Adaptable' | 'Specialist'>('Adaptable');
  
  // Loading simulation state
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    if (step === 3) {
      // Simulate radar scanning
      const interval = setInterval(() => {
        setScanProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep(4), 400); // Wait a bit then show results
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

  const roles = [
    { name: 'Duelist', icon: Fire, desc: 'Entry fragging and space creation' },
    { name: 'Initiator', icon: Eye, desc: 'Information gathering and offensive support' },
    { name: 'Controller', icon: Crosshair, desc: 'Vision blocking and map control' },
    { name: 'Sentinel', icon: ShieldCheck, desc: 'Flank watching and site anchoring' },
    { name: 'Flex', icon: ArrowsMerge, desc: 'Multi-role adaptability' },
  ];

  // Dynamic mock filtering based on the new logic: Top agents must match the selected role
  // We simulate this by showing players whose agents align with the selected role.
  const getFilteredMockResults = () => {
    if (selectedRole === 'Duelist') {
      return [
        {
          id: '2', name: 'something', role: 'Duelist (Top Agents)', smart_score: 62.4, adaptability: 'Specialist', photo_url: null,
          top_agents: [
            'https://media.valorant-api.com/agents/add6443a-41bd-3414-f6ad-e58d267f4e95/displayicon.png', // Jett
            'https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/displayicon.png', // Reyna
            'https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5d4fc13def43/displayicon.png'  // Raze
          ]
        },
        {
          id: '1', name: 'f0rsakeN', role: 'Duelist (Top Agents)', smart_score: 59.8, adaptability: 'Adaptable', photo_url: null,
          top_agents: [
            'https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/displayicon.png', // Reyna
            'https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/displayicon.png', // Phoenix
            'https://media.valorant-api.com/agents/add6443a-41bd-3414-f6ad-e58d267f4e95/displayicon.png'  // Jett
          ]
        }
      ];
    } else if (selectedRole === 'Controller') {
      return [
        {
          id: '3', name: 'mindfreak', role: 'Controller (Top Agents)', smart_score: 61.2, adaptability: 'Adaptable', photo_url: null,
          top_agents: [
            'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png', // Omen
            'https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/displayicon.png', // Viper
            'https://media.valorant-api.com/agents/41fb69c1-4189-7b37-f117-bcaf1e96f1bf/displayicon.png'  // Astra
          ]
        }
      ];
    } else {
      // Generic fallback for other roles
      return [
        {
          id: '4', name: 'Player_XYZ', role: `${selectedRole} (Top Agents)`, smart_score: 58.1, adaptability: 'Adaptable', photo_url: null,
          top_agents: [
            'https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png', // Sova
            'https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/displayicon.png', // Skye
          ]
        }
      ];
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      
      {/* Header */}
      <div className="mb-12 border-b-4 border-black pb-6">
        <h1 className="text-4xl md:text-5xl font-['Archivo_Black'] uppercase tracking-tight text-black flex items-center gap-3">
          <MagnifyingGlass weight="bold" /> Scouting Engine
        </h1>
        <p className="text-gray-600 font-['JetBrains_Mono'] font-bold text-[15px] mt-3">
          Find the missing piece for your roster using Trickster's proprietary SMART analysis.
        </p>
      </div>

      {/* Step Indicator */}
      {step < 4 && (
        <div className="flex items-center gap-2 mb-10 font-['JetBrains_Mono'] text-sm font-bold uppercase tracking-widest">
          <span className={step >= 1 ? 'text-black' : 'text-gray-400'}>1. Role</span>
          <CaretRight weight="bold" className="text-gray-300" />
          <span className={step >= 2 ? 'text-black' : 'text-gray-400'}>2. Standards</span>
          <CaretRight weight="bold" className="text-gray-300" />
          <span className={step >= 3 ? 'text-[var(--color-primary)] bg-black px-2' : 'text-gray-400'}>3. Scan</span>
        </div>
      )}

      {/* STEP 1: ROLE SELECTION */}
      {step === 1 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h2 className="text-2xl font-['Archivo_Black'] uppercase mb-6">What role is your team missing?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((r) => (
              <button
                key={r.name}
                onClick={() => handleRoleSelect(r.name)}
                className="group bg-white border-2 border-black p-6 flex flex-col items-start gap-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] text-left"
              >
                <div className="w-12 h-12 bg-gray-100 border-2 border-black flex items-center justify-center group-hover:bg-[var(--color-primary)] transition-colors">
                  <r.icon size={24} weight="bold" className="text-black" />
                </div>
                <div>
                  <h3 className="font-['Archivo_Black'] text-xl uppercase tracking-wide">{r.name}</h3>
                  <p className="font-['JetBrains_Mono'] text-sm font-bold text-gray-500 mt-1">{r.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: STANDARDS (METRICS) */}
      {step === 2 && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-['Archivo_Black'] uppercase">Define Your Standards</h2>
            <button 
              onClick={() => setStep(1)}
              className="text-sm font-['JetBrains_Mono'] font-bold text-gray-500 hover:text-black transition-colors border-b-2 border-transparent hover:border-black"
            >
              ← Back to Role
            </button>
          </div>
          
          <div className="bg-white border-2 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] p-8 md:p-10 space-y-12">
            
            {/* Slider */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <label className="font-['Archivo_Black'] text-lg uppercase">Minimum SMART Score</label>
                <span className="font-['JetBrains_Mono'] font-black text-2xl bg-[var(--color-primary)] border-2 border-black px-3 py-1 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
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
              <div className="flex justify-between mt-2 font-['JetBrains_Mono'] text-xs font-bold text-gray-400">
                <span>Rookie (20)</span>
                <span>Pro Level (65)</span>
              </div>
            </div>

            {/* Playstyle Toggle */}
            <div>
              <label className="font-['Archivo_Black'] text-lg uppercase mb-4 block">Playstyle Preference</label>
              <div className="flex gap-4">
                <button 
                  onClick={() => setPlaystyle('Adaptable')}
                  className={`flex-1 border-2 border-black p-4 font-['JetBrains_Mono'] font-bold text-center transition-all duration-150 active:scale-[0.98] ${playstyle === 'Adaptable' ? 'bg-black text-[var(--color-primary)] shadow-[4px_4px_0px_rgba(0,0,0,1)]' : 'bg-white text-black hover:bg-gray-50'}`}
                >
                  <span className="block text-lg font-['Archivo_Black'] uppercase mb-1">Adaptable</span>
                  <span className="text-xs opacity-80">High Meta Adaptability</span>
                </button>
                <button 
                  onClick={() => setPlaystyle('Specialist')}
                  className={`flex-1 border-2 border-black p-4 font-['JetBrains_Mono'] font-bold text-center transition-all duration-150 active:scale-[0.98] ${playstyle === 'Specialist' ? 'bg-black text-[var(--color-primary)] shadow-[4px_4px_0px_rgba(0,0,0,1)]' : 'bg-white text-black hover:bg-gray-50'}`}
                >
                  <span className="block text-lg font-['Archivo_Black'] uppercase mb-1">Specialist</span>
                  <span className="text-xs opacity-80">One-Trick / Deep Mastery</span>
                </button>
              </div>
            </div>

            <button 
              onClick={handleStartScan}
              className="w-full bg-[var(--color-primary)] border-2 border-black p-4 font-['Archivo_Black'] text-xl uppercase tracking-widest shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] flex justify-center items-center gap-3"
            >
              Initiate Database Scan <MagnifyingGlass weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SCANNING STATE */}
      {step === 3 && (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in-95 duration-300">
          <div className="relative w-48 h-48 border-4 border-black rounded-full mb-8 overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,1)] bg-black">
             {/* Radar Sweep Effect */}
             <div className="absolute inset-0 border-4 border-[var(--color-primary)] rounded-full opacity-20" />
             <div className="absolute inset-0 flex items-center justify-center">
               <Crosshair size={64} className="text-[var(--color-primary)] opacity-50" />
             </div>
             {/* Sweeping line */}
             <div 
                className="absolute top-1/2 left-1/2 w-1/2 h-[2px] bg-[var(--color-primary)] origin-left"
                style={{
                  boxShadow: '0 0 20px 5px var(--color-primary)',
                  animation: 'radar-spin 1s linear infinite'
                }}
             />
             <style>{`
               @keyframes radar-spin {
                 from { transform: rotate(0deg); }
                 to { transform: rotate(360deg); }
               }
             `}</style>
          </div>
          
          <h2 className="font-['Archivo_Black'] text-2xl uppercase tracking-widest text-black animate-pulse">
            Scanning Database...
          </h2>
          <div className="mt-6 w-64 h-3 border-2 border-black bg-white p-0.5">
            <div 
              className="h-full bg-black transition-all duration-200" 
              style={{ width: `${scanProgress}%` }}
            />
          </div>
          <p className="font-['JetBrains_Mono'] font-bold text-sm text-gray-500 mt-3 tabular-nums">
            {Math.min(scanProgress, 100)}% COMPLETE
          </p>
        </div>
      )}

      {/* STEP 4: RESULTS */}
      {step === 4 && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="flex justify-between items-end mb-8 border-b-2 border-black pb-4">
            <div>
              <h2 className="text-3xl font-['Archivo_Black'] uppercase text-[var(--color-primary)] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                Scouting Report
              </h2>
              <p className="font-['JetBrains_Mono'] font-bold text-gray-600 mt-2 text-sm uppercase">
                {selectedRole} • &gt;{minScore} SMART • {playstyle}
              </p>
            </div>
            <button 
              onClick={() => setStep(1)}
              className="font-['JetBrains_Mono'] font-bold text-sm bg-black text-white px-4 py-2 border-2 border-black hover:bg-[var(--color-primary)] hover:text-black transition-colors active:scale-95"
            >
              Start New Scan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredMockResults().map((player, idx) => (
              <div 
                key={player.id} 
                className="bg-white border-2 border-black flex flex-col shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] hover:-translate-y-1.5 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Header (Score) */}
                <div className="bg-black p-4 flex justify-between items-center text-white">
                  <span className="font-['Archivo_Black'] uppercase tracking-widest text-sm text-gray-400">Match {idx + 1}</span>
                  <div className="bg-[var(--color-primary)] text-black border-2 border-black px-2 py-0.5 font-['JetBrains_Mono'] font-black text-lg shadow-[2px_2px_0px_rgba(255,255,255,0.2)]">
                    {player.smart_score}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col relative overflow-hidden">
                  <div className="absolute right-0 top-6 opacity-5 pointer-events-none -translate-y-4 translate-x-4">
                    <UserFocus weight="fill" size={140} />
                  </div>

                  <h3 className="font-['Archivo_Black'] text-2xl uppercase tracking-tight truncate mb-1 relative z-10">
                    {player.name}
                  </h3>
                  <p className="font-['JetBrains_Mono'] font-bold text-gray-500 text-sm mb-6 relative z-10">
                    Adaptability: <span className="text-black">{player.adaptability}</span>
                  </p>

                  <div className="mt-auto relative z-10">
                    <p className="font-['JetBrains_Mono'] text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Core Agents</p>
                    <div className="flex gap-2">
                      {player.top_agents.map((agent, i) => (
                        <img 
                          key={i} 
                          src={agent} 
                          className="w-10 h-10 bg-gray-100 border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]" 
                          alt="agent" 
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <Link 
                  to={`/app/players/${player.id}`}
                  className="w-full bg-white border-t-2 border-black p-4 font-['Archivo_Black'] uppercase text-sm flex items-center justify-between hover:bg-[var(--color-primary)] transition-colors group"
                >
                  View Full Profile
                  <ArrowRight weight="bold" className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-10 p-6 border-2 border-dashed border-gray-300 bg-gray-50 text-center flex flex-col items-center">
             <p className="font-['JetBrains_Mono'] font-bold text-gray-500 text-sm max-w-lg mx-auto">
               These are the top 3 players matching your criteria from the current database snapshot. Note: Real API integration is required to reflect up-to-date scraped data.
             </p>
          </div>
        </div>
      )}
    </div>
  );
}

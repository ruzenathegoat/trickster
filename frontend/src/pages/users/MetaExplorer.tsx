import { useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

const MOCK_PATCHES = ['v8.11', 'v8.10', 'v8.09', 'v8.08'];

const MOCK_MAP_META = [
  {
    id: 'ascent', name: 'Ascent',
    image: 'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png',
    agents: [
      { name: 'Jett', icon: 'https://media.valorant-api.com/agents/add6443a-41bd-3414-f6ad-e58d267f4e95/displayicon.png', tier: 'S', shift: null },
      { name: 'Omen', icon: 'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png', tier: 'S', shift: '+1' },
      { name: 'Sova', icon: 'https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png', tier: 'A', shift: null },
      { name: 'Killjoy', icon: 'https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/displayicon.png', tier: 'A', shift: null }
    ]
  },
  {
    id: 'bind', name: 'Bind',
    image: 'https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/splash.png',
    agents: [
      { name: 'Raze', icon: 'https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5d4fc13def43/displayicon.png', tier: 'S', shift: null },
      { name: 'Viper', icon: 'https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/displayicon.png', tier: 'S', shift: '-1' },
      { name: 'Skye', icon: 'https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/displayicon.png', tier: 'A', shift: null }
    ]
  },
  {
    id: 'breeze', name: 'Breeze',
    image: 'https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/splash.png',
    agents: [
      { name: 'Jett', icon: 'https://media.valorant-api.com/agents/add6443a-41bd-3414-f6ad-e58d267f4e95/displayicon.png', tier: 'S', shift: null },
      { name: 'Viper', icon: 'https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/displayicon.png', tier: 'S', shift: null },
      { name: 'Cypher', icon: 'https://media.valorant-api.com/agents/117ed9e3-49f4-6a4b-ea0c-ef9973f6a4cc/displayicon.png', tier: 'A', shift: '+1' },
      { name: 'Sova', icon: 'https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png', tier: 'A', shift: null }
    ]
  },
  {
    id: 'icebox', name: 'Icebox',
    image: 'https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279599c/splash.png',
    agents: [
      { name: 'Jett', icon: 'https://media.valorant-api.com/agents/add6443a-41bd-3414-f6ad-e58d267f4e95/displayicon.png', tier: 'S', shift: null },
      { name: 'Killjoy', icon: 'https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/displayicon.png', tier: 'S', shift: null },
      { name: 'Viper', icon: 'https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/displayicon.png', tier: 'S', shift: '-1' },
      { name: 'Sova', icon: 'https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png', tier: 'A', shift: null }
    ]
  },
  {
    id: 'lotus', name: 'Lotus',
    image: 'https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/splash.png',
    agents: [
      { name: 'Raze', icon: 'https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5d4fc13def43/displayicon.png', tier: 'S', shift: null },
      { name: 'Omen', icon: 'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png', tier: 'S', shift: null },
      { name: 'Killjoy', icon: 'https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/displayicon.png', tier: 'A', shift: null },
      { name: 'Breach', icon: 'https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/displayicon.png', tier: 'A', shift: '+1' }
    ]
  },
  {
    id: 'split', name: 'Split',
    image: 'https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/splash.png',
    agents: [
      { name: 'Raze', icon: 'https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5d4fc13def43/displayicon.png', tier: 'S', shift: null },
      { name: 'Omen', icon: 'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png', tier: 'S', shift: null },
      { name: 'Cypher', icon: 'https://media.valorant-api.com/agents/117ed9e3-49f4-6a4b-ea0c-ef9973f6a4cc/displayicon.png', tier: 'S', shift: null },
      { name: 'Skye', icon: 'https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/displayicon.png', tier: 'A', shift: '-1' }
    ]
  },
  {
    id: 'sunset', name: 'Sunset',
    image: 'https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/splash.png',
    agents: [
      { name: 'Raze', icon: 'https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5d4fc13def43/displayicon.png', tier: 'S', shift: null },
      { name: 'Omen', icon: 'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png', tier: 'S', shift: null },
      { name: 'Cypher', icon: 'https://media.valorant-api.com/agents/117ed9e3-49f4-6a4b-ea0c-ef9973f6a4cc/displayicon.png', tier: 'S', shift: '+1' },
      { name: 'Breach', icon: 'https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/displayicon.png', tier: 'A', shift: null }
    ]
  }
];

function AgentIcon({ agent }: { agent: { name: string; icon: string; tier: string; shift: string | null } }) {
  return (
    <div className="relative group/agent">
      <img 
        src={agent.icon} 
        alt={agent.name} 
        title={agent.name}
        className="w-12 h-12 bg-black border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/agent:-translate-y-1 group-hover/agent:scale-110 cursor-help"
      />
      {agent.shift && (
        <div className={`absolute -top-2 -right-2 px-1 border-2 border-black font-numeric font-bold text-[10px] z-20 shadow-[1px_1px_0px_rgba(0,0,0,1)] ${agent.shift.startsWith('+') ? 'bg-[#00E676] text-black' : 'bg-[#FF3366] text-white'}`}>
          {agent.shift}
        </div>
      )}
    </div>
  );
}

function TierRow({ tier, agents, label }: { tier: string; agents: typeof MOCK_MAP_META[0]['agents']; label: string }) {
  const filtered = agents.filter(a => a.tier === tier);
  if (filtered.length === 0) return null;
  return (
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 shrink-0 border-2 border-black flex items-center justify-center font-display text-lg shadow-[2px_2px_0px_rgba(0,0,0,1)] ${
        tier === 'S' ? 'bg-[var(--color-primary)]' : 'bg-white'
      }`}>
        {label}
      </div>
      <div className="flex gap-3 flex-wrap">
        {filtered.map(agent => <AgentIcon key={agent.name} agent={agent} />)}
      </div>
    </div>
  );
}

export default function MetaExplorer() {
  const [selectedPatch, setSelectedPatch] = useState(MOCK_PATCHES[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const heroMap = MOCK_MAP_META[0];
  const restMaps = MOCK_MAP_META.slice(1);

  return (
    <div className="max-w-7xl space-y-16 pb-16">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b-4 border-black"
      >
        <div>
          <h1 className="text-5xl lg:text-6xl font-display uppercase tracking-tighter leading-none mb-3">
            Map Meta
          </h1>
          <p className="font-label text-sm text-gray-500 uppercase tracking-widest max-w-xl">
            S-Tier and A-Tier agents per map. Shifts relative to the previous patch.
          </p>
        </div>

        {/* Patch Selector */}
        <div className="relative shrink-0">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="bg-[var(--color-primary)] border-4 border-black px-6 py-3 flex items-center gap-3 font-display text-lg uppercase shadow-[6px_6px_0px_rgba(0,0,0,1)] active:scale-[0.97] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all"
          >
            Patch: {selectedPatch}
            <CaretDown weight="bold" size={20} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {dropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-full min-w-[200px] bg-white border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] z-50">
              {MOCK_PATCHES.map((patch) => (
                <button
                  key={patch}
                  onClick={() => { setSelectedPatch(patch); setDropdownOpen(false); }}
                  className={`w-full text-left px-5 py-3 border-b-2 border-black last:border-b-0 font-label font-bold text-sm uppercase tracking-widest hover:bg-[var(--color-primary)] hover:text-black transition-colors ${selectedPatch === patch ? 'bg-black text-[var(--color-primary)]' : 'text-black'}`}
                >
                  {patch}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Featured Map — Full-bleed editorial block */}
      <motion.section
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: 'inset(0 0% 0 0)' }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="border-4 border-black shadow-[12px_12px_0px_rgba(0,0,0,1)] overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row min-h-[400px]">
          {/* Map Image */}
          <div className="lg:w-[45%] relative overflow-hidden border-b-4 lg:border-b-0 lg:border-r-4 border-black bg-black">
            <img 
              src={heroMap.image} 
              alt={heroMap.name}
              className="absolute inset-0 w-full h-full object-cover grayscale contrast-125 brightness-50 hover:grayscale-0 transition-all duration-700"
            />
            <div className="relative z-10 p-8 lg:p-10 flex flex-col justify-end h-full min-h-[300px]">
              <span className="font-label text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2">Featured Map</span>
              <h2 className="text-6xl lg:text-8xl font-display uppercase tracking-tighter leading-none text-white">
                {heroMap.name}
              </h2>
            </div>
          </div>

          {/* Agents */}
          <div className="lg:w-[55%] p-8 lg:p-10 flex flex-col justify-center gap-8 bg-white">
            <TierRow tier="S" agents={heroMap.agents} label="S" />
            <TierRow tier="A" agents={heroMap.agents} label="A" />

            <div className="border-t-2 border-gray-200 pt-4 mt-4">
              <p className="font-label text-[11px] text-gray-400 uppercase tracking-widest">
                {heroMap.agents.filter(a => a.shift).length > 0 
                  ? `${heroMap.agents.filter(a => a.shift).length} agent shift(s) from previous patch`
                  : 'No agent shifts from previous patch'
                }
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Remaining Maps — Alternating horizontal modules */}
      <section className="space-y-6">
        <h2 className="text-3xl font-display uppercase tracking-tight border-b-4 border-black pb-4">
          Full Map Pool
        </h2>

        <div className="space-y-4">
          {restMaps.map((map, index) => (
            <motion.div
              key={map.id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.06, ease: [0.23, 1, 0.32, 1] }}
              className="border-4 border-black bg-white hover:bg-[var(--color-primary)] transition-colors group flex flex-col md:flex-row items-stretch overflow-hidden"
            >
              {/* Map thumbnail */}
              <div className="md:w-48 h-32 md:h-auto relative overflow-hidden border-b-4 md:border-b-0 md:border-r-4 border-black bg-black shrink-0">
                <img 
                  src={map.image} 
                  alt={map.name}
                  className="absolute inset-0 w-full h-full object-cover grayscale contrast-125 brightness-50 group-hover:brightness-75 transition-all duration-500"
                />
                <div className="relative z-10 flex items-end p-4 h-full">
                  <h3 className="font-display text-2xl md:text-3xl uppercase tracking-tighter text-white leading-none">
                    {map.name}
                  </h3>
                </div>
              </div>

              {/* Tier data */}
              <div className="flex-1 p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                <TierRow tier="S" agents={map.agents} label="S" />
                <div className="hidden md:block w-px h-12 bg-gray-300 group-hover:bg-black/20" />
                <TierRow tier="A" agents={map.agents} label="A" />

                {/* Shift count */}
                <div className="md:ml-auto shrink-0">
                  {map.agents.filter(a => a.shift).length > 0 ? (
                    <span className="font-label text-[11px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-black/50 tabular-nums">
                      {map.agents.filter(a => a.shift).length} shift{map.agents.filter(a => a.shift).length > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="font-label text-[11px] font-bold uppercase tracking-widest text-gray-300 group-hover:text-black/30">
                      Stable
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

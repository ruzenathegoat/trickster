import { useState } from 'react';
import { CaretDown, TrendUp, Info } from '@phosphor-icons/react';

// MOCK DATA for maps and meta agents
const MOCK_PATCHES = ['v8.11', 'v8.10', 'v8.09', 'v8.08'];

const MOCK_MAP_META = [
  {
    id: 'ascent',
    name: 'Ascent',
    image: 'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png',
    agents: [
      { name: 'Jett', icon: 'https://media.valorant-api.com/agents/add6443a-41bd-3414-f6ad-e58d267f4e95/displayicon.png', tier: 'S', shift: null },
      { name: 'Omen', icon: 'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png', tier: 'S', shift: '+1' },
      { name: 'Sova', icon: 'https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png', tier: 'A', shift: null },
      { name: 'Killjoy', icon: 'https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/displayicon.png', tier: 'A', shift: null }
    ]
  },
  {
    id: 'bind',
    name: 'Bind',
    image: 'https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/splash.png',
    agents: [
      { name: 'Raze', icon: 'https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5d4fc13def43/displayicon.png', tier: 'S', shift: null },
      { name: 'Viper', icon: 'https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/displayicon.png', tier: 'S', shift: '-1' },
      { name: 'Skye', icon: 'https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/displayicon.png', tier: 'A', shift: null }
    ]
  },
  {
    id: 'breeze',
    name: 'Breeze',
    image: 'https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/splash.png',
    agents: [
      { name: 'Jett', icon: 'https://media.valorant-api.com/agents/add6443a-41bd-3414-f6ad-e58d267f4e95/displayicon.png', tier: 'S', shift: null },
      { name: 'Viper', icon: 'https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/displayicon.png', tier: 'S', shift: null },
      { name: 'Cypher', icon: 'https://media.valorant-api.com/agents/117ed9e3-49f4-6a4b-ea0c-ef9973f6a4cc/displayicon.png', tier: 'A', shift: '+1' },
      { name: 'Sova', icon: 'https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png', tier: 'A', shift: null }
    ]
  },
  {
    id: 'icebox',
    name: 'Icebox',
    image: 'https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279599c/splash.png',
    agents: [
      { name: 'Jett', icon: 'https://media.valorant-api.com/agents/add6443a-41bd-3414-f6ad-e58d267f4e95/displayicon.png', tier: 'S', shift: null },
      { name: 'Killjoy', icon: 'https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/displayicon.png', tier: 'S', shift: null },
      { name: 'Viper', icon: 'https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/displayicon.png', tier: 'S', shift: '-1' },
      { name: 'Sova', icon: 'https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png', tier: 'A', shift: null }
    ]
  },
  {
    id: 'lotus',
    name: 'Lotus',
    image: 'https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/splash.png',
    agents: [
      { name: 'Raze', icon: 'https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5d4fc13def43/displayicon.png', tier: 'S', shift: null },
      { name: 'Omen', icon: 'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png', tier: 'S', shift: null },
      { name: 'Killjoy', icon: 'https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/displayicon.png', tier: 'A', shift: null },
      { name: 'Breach', icon: 'https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/displayicon.png', tier: 'A', shift: '+1' }
    ]
  },
  {
    id: 'split',
    name: 'Split',
    image: 'https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/splash.png',
    agents: [
      { name: 'Raze', icon: 'https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5d4fc13def43/displayicon.png', tier: 'S', shift: null },
      { name: 'Omen', icon: 'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png', tier: 'S', shift: null },
      { name: 'Cypher', icon: 'https://media.valorant-api.com/agents/117ed9e3-49f4-6a4b-ea0c-ef9973f6a4cc/displayicon.png', tier: 'S', shift: null },
      { name: 'Skye', icon: 'https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/displayicon.png', tier: 'A', shift: '-1' }
    ]
  },
  {
    id: 'sunset',
    name: 'Sunset',
    image: 'https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/splash.png',
    agents: [
      { name: 'Raze', icon: 'https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5d4fc13def43/displayicon.png', tier: 'S', shift: null },
      { name: 'Omen', icon: 'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png', tier: 'S', shift: null },
      { name: 'Cypher', icon: 'https://media.valorant-api.com/agents/117ed9e3-49f4-6a4b-ea0c-ef9973f6a4cc/displayicon.png', tier: 'S', shift: '+1' },
      { name: 'Breach', icon: 'https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/displayicon.png', tier: 'A', shift: null }
    ]
  }
];

export default function MetaExplorer() {
  const [selectedPatch, setSelectedPatch] = useState(MOCK_PATCHES[0]);

  return (
    <div className="max-w-7xl space-y-10">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b-4 border-black">
        <div>
          <h1 className="text-4xl md:text-5xl font-['Archivo_Black'] uppercase tracking-tight text-black flex items-center gap-3">
            <TrendUp weight="bold" /> Map Meta
          </h1>
          <p className="text-gray-600 font-['JetBrains_Mono'] font-bold text-sm md:text-base mt-2 max-w-xl">
            S-Tier and A-Tier agents defining the optimal compositions across the active map pool. Data shifts shown relative to the previous patch.
          </p>
        </div>

        {/* Patch Selector */}
        <div className="relative group shrink-0">
          <button className="bg-[var(--color-primary)] border-2 border-black px-5 py-2.5 flex items-center gap-3 font-['Archivo_Black'] text-lg uppercase shadow-[4px_4px_0px_rgba(0,0,0,1)] active:scale-[0.98] transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)]">
            Patch: {selectedPatch}
            <CaretDown weight="bold" size={20} />
          </button>
          
          <div className="absolute top-full right-0 mt-2 w-full min-w-[200px] bg-white border-2 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform origin-top-right group-hover:scale-100 scale-95">
            {MOCK_PATCHES.map((patch) => (
              <button
                key={patch}
                onClick={() => setSelectedPatch(patch)}
                className={`w-full text-left px-5 py-3 border-b-2 border-black last:border-b-0 font-['JetBrains_Mono'] font-bold text-sm hover:bg-[var(--color-primary)] hover:text-black transition-colors ${selectedPatch === patch ? 'bg-black text-[var(--color-primary)]' : 'text-gray-800'}`}
              >
                {patch}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Maps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {MOCK_MAP_META.map((map, index) => (
          <div 
            key={map.id} 
            className="group relative bg-white border-2 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1.5 hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col min-h-[320px]"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Map Image Background with Neo-Brutalist Filter */}
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-black mix-blend-color" /> {/* Forces grayscale basically */}
              <div className="absolute inset-0 bg-[var(--color-primary)] mix-blend-multiply opacity-90" />
              <img 
                src={map.image} 
                alt={map.name} 
                className="w-full h-full object-cover grayscale contrast-125 brightness-75"
              />
            </div>

            {/* Content overlay */}
            <div className="relative z-10 flex flex-col h-full">
              {/* Map Name Header */}
              <div className="p-4 bg-black/80 backdrop-blur-sm border-b-2 border-black flex justify-between items-center">
                <h2 className="font-['Archivo_Black'] text-3xl uppercase tracking-widest text-white drop-shadow-md">
                  {map.name}
                </h2>
                <button className="w-8 h-8 flex items-center justify-center bg-white text-black border-2 border-black hover:bg-[var(--color-primary)] transition-colors rounded-sm active:scale-95">
                  <Info weight="bold" size={16} />
                </button>
              </div>

              {/* Agents Tier List */}
              <div className="p-5 flex-1 flex flex-col gap-5 justify-center mt-4">
                
                {/* S-Tier Row */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 shrink-0 bg-[#FFD600] border-2 border-black flex items-center justify-center font-['Archivo_Black'] text-lg shadow-[2px_2px_0px_rgba(0,0,0,1)] -rotate-3">
                    S
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {map.agents.filter(a => a.tier === 'S').map(agent => (
                      <div key={agent.name} className="relative group/agent">
                        <img 
                          src={agent.icon} 
                          alt={agent.name} 
                          title={agent.name}
                          className="w-12 h-12 bg-[#1a1a1a] border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/agent:-translate-y-1 group-hover/agent:scale-110 cursor-help"
                        />
                        {agent.shift && (
                          <div className={`absolute -top-2 -right-2 px-1 border-2 border-black font-['JetBrains_Mono'] font-bold text-[10px] z-20 shadow-[1px_1px_0px_rgba(0,0,0,1)] ${agent.shift.startsWith('+') ? 'bg-[#00E676] text-black' : 'bg-[#FF3366] text-white'}`}>
                            {agent.shift}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* A-Tier Row */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 shrink-0 bg-[#00E676] border-2 border-black flex items-center justify-center font-['Archivo_Black'] text-lg shadow-[2px_2px_0px_rgba(0,0,0,1)] rotate-2">
                    A
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {map.agents.filter(a => a.tier === 'A').map(agent => (
                      <div key={agent.name} className="relative group/agent">
                        <img 
                          src={agent.icon} 
                          alt={agent.name} 
                          title={agent.name}
                          className="w-10 h-10 bg-[#1a1a1a] border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/agent:-translate-y-1 group-hover/agent:scale-110 cursor-help"
                        />
                        {agent.shift && (
                          <div className={`absolute -top-1.5 -right-1.5 px-1 border-2 border-black font-['JetBrains_Mono'] font-bold text-[9px] z-20 shadow-[1px_1px_0px_rgba(0,0,0,1)] ${agent.shift.startsWith('+') ? 'bg-[#00E676] text-black' : 'bg-[#FF3366] text-white'}`}>
                            {agent.shift}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

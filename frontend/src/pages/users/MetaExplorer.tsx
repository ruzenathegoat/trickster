import { useState, useEffect } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import axios from '../../lib/axios';
import { Skeleton } from '@/components/ui/skeleton';

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

function TierRow({ tier, agents, label }: { tier: string; agents: any[]; label: string }) {
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

function CompositionsList({ compositions, compact = false }: { compositions: any[], compact?: boolean }) {
  if (!compositions || compositions.length === 0) return null;

  return (
    <div className={`mt-6 ${compact ? 'border-t-2 border-black/10 group-hover:border-black/20 pt-4' : 'border-t-4 border-black pt-6'}`}>
      <h3 className={`font-display ${compact ? 'text-lg text-black/70 group-hover:text-black' : 'text-2xl'} uppercase tracking-tighter mb-4`}>
        Top Compositions
      </h3>
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3`}>
        {compositions.map((comp, i) => (
          <div key={i} className={`border-2 border-black p-2.5 sm:p-3 flex flex-col justify-between gap-3 shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-colors ${compact ? 'bg-white group-hover:border-black' : 'hover:shadow-[4px_4px_0px_var(--color-primary)]'}`}>
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {comp.agents.map((agent: any, j: number) => (
                <div key={j} className="relative w-7 h-7 sm:w-8 sm:h-8 border border-black bg-black shrink-0 group/agentIcon" title={agent.name}>
                  {agent.icon ? (
                    <img src={agent.icon} alt={agent.name} className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-[9px] sm:text-[10px] font-bold">{agent.name.substring(0,2).toUpperCase()}</div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between items-end font-label text-[9px] sm:text-[10px] uppercase tracking-widest font-bold">
              <span className="text-gray-500 leading-none">{comp.total_matches} Matches</span>
              <span className={`leading-none ${comp.win_rate >= 50 ? 'text-[#00E676]' : 'text-[#FF3366]'}`}>
                {comp.win_rate}% WR
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PatchOption {
  version: string;
  label: string;
}

export default function MetaExplorer() {
  const [patches, setPatches] = useState<PatchOption[]>([]);
  const [selectedPatch, setSelectedPatch] = useState<PatchOption | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mapMeta, setMapMeta] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/v1/meta/patches')
      .then(res => {
        setPatches(res.data);
        if (res.data.length > 0) {
          setSelectedPatch(res.data[0]);
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedPatch) {
      setLoading(true);
      axios.get(`/api/v1/meta/map-pool/${selectedPatch.version}`)
        .then(res => {
          setMapMeta(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [selectedPatch]);

  if (loading && patches.length === 0) {
    return (
      <div className="max-w-7xl space-y-16 pb-16">
        <Skeleton className="h-[80px] w-full border-4 border-black" />
        <Skeleton className="h-[300px] md:h-[400px] w-full border-4 border-black" />
        <Skeleton className="h-[200px] w-full border-4 border-black" />
      </div>
    );
  }

  const heroMap = mapMeta.length > 0 ? mapMeta[0] : null;
  const restMaps = mapMeta.length > 1 ? mapMeta.slice(1) : [];

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
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display uppercase tracking-tighter leading-none mb-3">
            Map Meta
          </h1>
          <p className="font-label text-sm text-gray-500 uppercase tracking-widest max-w-xl">
            S-Tier and A-Tier agents per map. Shifts relative to the previous patch.
          </p>
        </div>

        {/* Patch Selector */}
        <div className="relative shrink-0 z-20">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="bg-[var(--color-primary)] border-4 border-black px-4 md:px-6 py-2 md:py-3 flex items-center gap-2 md:gap-3 font-display text-base md:text-lg uppercase shadow-[4px_4px_0px_rgba(0,0,0,1)] md:shadow-[6px_6px_0px_rgba(0,0,0,1)] active:scale-[0.97] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all"
          >
            {selectedPatch ? selectedPatch.label : 'Select Patch'}
            <CaretDown weight="bold" size={20} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {dropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-full min-w-[200px] bg-white border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] z-50 max-h-[300px] overflow-y-auto">
              {patches.map((patch) => (
                <button
                  key={patch.version}
                  onClick={() => { setSelectedPatch(patch); setDropdownOpen(false); }}
                  className={`w-full text-left px-5 py-3 border-b-2 border-black last:border-b-0 font-label font-bold text-sm uppercase tracking-widest hover:bg-[var(--color-primary)] hover:text-black transition-colors ${selectedPatch?.version === patch.version ? 'bg-black text-[var(--color-primary)]' : 'text-black'}`}
                >
                  {patch.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {loading && patches.length > 0 ? (
        <div className="space-y-8">
          <Skeleton className="h-[300px] md:h-[400px] w-full border-4 border-black" />
          <Skeleton className="h-[150px] w-full border-4 border-black" />
          <Skeleton className="h-[150px] w-full border-4 border-black" />
        </div>
      ) : heroMap ? (
        <>
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
                <div className="relative z-10 p-6 md:p-8 lg:p-10 flex flex-col justify-end h-full min-h-[200px] md:min-h-[300px]">
                  <span className="font-label text-[10px] md:text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2">Featured Map</span>
                  <h2 className="text-5xl md:text-6xl lg:text-8xl font-display uppercase tracking-tighter leading-none text-white">
                    {heroMap.name}
                  </h2>
                </div>
              </div>

              {/* Agents */}
              <div className="lg:w-[55%] p-6 md:p-8 lg:p-10 flex flex-col justify-center gap-6 md:gap-8 bg-white">
                <TierRow tier="S" agents={heroMap.agents} label="S" />
                <TierRow tier="A" agents={heroMap.agents} label="A" />

                <div className="border-t-2 border-gray-200 pt-4 mt-4">
                  <p className="font-label text-[11px] text-gray-400 uppercase tracking-widest">
                    {heroMap.agents.filter((a: any) => a.shift).length > 0 
                      ? `${heroMap.agents.filter((a: any) => a.shift).length} agent shift(s) from previous patch`
                      : 'No agent shifts from previous patch'
                    }
                  </p>
                </div>
                
                <CompositionsList compositions={heroMap.compositions} />
              </div>
            </div>
          </motion.section>


          {/* Remaining Maps — Alternating horizontal modules */}
          {restMaps.length > 0 && (
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
                        <h3 className="font-display text-xl md:text-3xl uppercase tracking-tighter text-white leading-none">
                          {map.name}
                        </h3>
                      </div>
                    </div>

                    {/* Tier data */}
                    <div className="flex-1 p-4 sm:p-5 md:p-6 flex flex-col">
                      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                        <TierRow tier="S" agents={map.agents} label="S" />
                        <div className="hidden md:block w-px h-12 bg-gray-300 group-hover:bg-black/20" />
                        <TierRow tier="A" agents={map.agents} label="A" />

                        {/* Shift count */}
                        <div className="md:ml-auto shrink-0">
                          {map.agents.filter((a: any) => a.shift).length > 0 ? (
                            <span className="font-label text-[11px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-black/50 tabular-nums">
                              {map.agents.filter((a: any) => a.shift).length} shift{map.agents.filter((a: any) => a.shift).length > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="font-label text-[11px] font-bold uppercase tracking-widest text-gray-300 group-hover:text-black/30">
                              Stable
                            </span>
                          )}
                        </div>
                      </div>

                      <CompositionsList compositions={map.compositions} compact={true} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="p-12 text-center text-gray-500 font-label font-bold uppercase tracking-widest">
          No map pool meta available for this patch.
        </div>
      )}
    </div>
  );
}

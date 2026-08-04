import { motion } from 'framer-motion';
import { Star, Plus } from '@phosphor-icons/react';
import { useDraggable } from '@dnd-kit/core';

interface Player {
  id: string;
  ign: string;
  name: string;
  photo_url: string;
  current_role: string;
  is_igl: boolean;
  playstyle_tags?: string[];
  avg_rating: number;
}

interface DraggablePlayerCardProps {
  player: Player;
  reason?: string;
  synergyScore?: number;
  onAdd?: (player: Player) => void;
  onDoubleClick?: () => void;
  isOverlay?: boolean;
}

export default function DraggablePlayerCard({ player, reason, synergyScore, onAdd, onDoubleClick, isOverlay }: DraggablePlayerCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: player.id,
    data: { player },
    disabled: isOverlay
  });
  return (
    <motion.div
      ref={isOverlay ? undefined : setNodeRef}
      {...(isOverlay ? {} : listeners)}
      {...(isOverlay ? {} : attributes)}
      whileHover={!isDragging && !isOverlay ? { scale: 1.02, y: -4, boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)' } : undefined}
      whileTap={!isDragging && !isOverlay ? { scale: 0.98, y: 0, boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)' } : undefined}
      onDoubleClick={onDoubleClick}
      className={`bg-theme-bg border-4 border-theme-border p-4 transition-all relative group ${
        isOverlay ? 'shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] scale-105 cursor-grabbing z-50' : 
        isDragging ? 'opacity-50 shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]' : 
        'shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] cursor-grab'
      }`}
      style={isOverlay ? { touchAction: 'none' } : undefined}
    >
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14 border-2 border-theme-border bg-black shadow-[2px_2px_0px_#000] shrink-0">
          <img 
            src={player.photo_url || `https://ui-avatars.com/api/?name=${player.ign}&background=random`} 
            alt={player.ign} 
            className="w-full h-full object-cover transition-all duration-300"
          />
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-display font-black text-xl uppercase truncate leading-none">{player.ign}</h4>
            <div className="flex items-center gap-2">
              <span className="font-numeric font-black bg-black text-[var(--color-primary)] px-2 py-0.5 text-sm border-2 border-theme-border shadow-[2px_2px_0px_#000]" title="VLR Average Rating">
                {Number(player.avg_rating || 0).toFixed(2)}
              </span>
              {onAdd && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd(player);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="bg-[var(--color-primary)] text-black border-2 border-theme-border p-0.5 shadow-[2px_2px_0px_#000] hover:bg-yellow-400 hover:shadow-[1px_1px_0px_#000] hover:translate-y-px transition-all"
                >
                  <Plus weight="bold" size={14} />
                </button>
              )}
            </div>
          </div>
          <p className="font-label text-xs font-bold text-gray-500 truncate mt-1">{player.name}</p>
          
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="font-label text-[9px] font-black uppercase tracking-widest border-2 border-theme-border px-1.5 py-0.5 bg-gray-100 shadow-[1px_1px_0px_#000]">
              {player.current_role}
            </span>
            {player.is_igl && (
              <span className="flex items-center gap-1 font-label text-[9px] font-black uppercase tracking-widest border-2 border-theme-border px-1.5 py-0.5 bg-[var(--color-primary)] text-black shadow-[1px_1px_0px_#000]">
                <Star weight="fill" size={10} /> IGL
              </span>
            )}
            {player.playstyle_tags?.slice(0, 2).map((tag, i) => (
              <span key={i} className="font-label text-[9px] font-bold uppercase tracking-widest border-2 border-theme-border px-1.5 py-0.5 bg-theme-bg shadow-[1px_1px_0px_#000]">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {reason && (
        <div className="mt-4 pt-3 border-t-4 border-theme-border">
          <div className="flex items-center justify-between mb-2">
            <div className="inline-block bg-[#10b981] text-theme-text font-label text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-2 border-theme-border shadow-[2px_2px_0px_#000]">
              AI Synergy Match
            </div>
            {synergyScore !== undefined && (
              <div className="font-numeric font-black text-xs px-2 border-2 border-theme-border bg-black text-[#10b981] shadow-[2px_2px_0px_#000]">
                {synergyScore} PTS
              </div>
            )}
          </div>
          <p className="font-label text-[11px] font-bold leading-snug text-gray-800">
            {reason}
          </p>
        </div>
      )}
    </motion.div>
  );
}

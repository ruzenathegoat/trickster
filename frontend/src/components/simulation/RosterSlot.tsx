import { motion } from 'framer-motion';
import { X, Star, UserPlus } from '@phosphor-icons/react';
import { useDroppable } from '@dnd-kit/core';

interface Player {
  id: string;
  ign: string;
  name: string;
  photo_url: string;
  current_role: string;
  is_igl: boolean;
  avg_rating: number;
}

interface RosterSlotProps {
  player: Player | null;
  onRemove: () => void;
  index: number;
}

export default function RosterSlot({ player, onRemove, index }: RosterSlotProps) {
  const { isOver, setNodeRef, active } = useDroppable({
    id: `roster-slot-${index}`,
    data: { index }
  });

  const draggedPlayer = active?.data.current?.player as Player | undefined;
  const isHoveredWithPlayer = isOver && draggedPlayer && !player;

  return (
    <div 
      ref={setNodeRef}
      id={`roster-slot-${index}`}
      className={`relative flex flex-col items-center border-4 rounded-none transition-all duration-200 ${
        player 
          ? 'border-theme-border border-solid bg-theme-bg shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]' 
          : isHoveredWithPlayer
            ? 'border-[var(--color-primary)] border-dashed bg-yellow-50 shadow-[4px_4px_0px_var(--color-primary)] scale-[1.02] z-10'
            : 'border-gray-400 border-dashed bg-gray-100/50 shadow-none'
      }`}
    >
      {player ? (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="w-full p-3 relative flex flex-col items-center text-center gap-2"
        >
          <button 
            onClick={onRemove}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-[#ef4444] text-white border-2 border-theme-border flex items-center justify-center hover:bg-red-600 transition-colors z-10 shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#000] hover:-translate-y-px active:shadow-[1px_1px_0px_#000] active:translate-y-px"
          >
            <X size={12} weight="bold" />
          </button>
          
          <div className="relative w-12 h-12 border-2 border-theme-border bg-black shadow-[2px_2px_0px_#000] shrink-0 rounded-full overflow-hidden">
            <img 
              src={player.photo_url || `https://ui-avatars.com/api/?name=${player.ign}&background=random`} 
              alt={player.ign} 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="w-full min-w-0">
            <h3 className="font-display font-black text-sm uppercase truncate leading-none">{player.ign}</h3>
            <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
              <span className="font-label text-[9px] font-black uppercase tracking-widest border-2 border-theme-border px-1.5 py-0.5 bg-gray-100 shadow-[1px_1px_0px_#000]">
                {player.current_role}
              </span>
              {player.is_igl && (
                <span className="flex items-center gap-0.5 font-label text-[9px] font-black uppercase tracking-widest border-2 border-theme-border px-1.5 py-0.5 bg-[var(--color-primary)] text-black shadow-[1px_1px_0px_#000]">
                  <Star weight="fill" size={9} /> IGL
                </span>
              )}
            </div>
            <span className="inline-block mt-1.5 font-numeric font-black bg-black text-[var(--color-primary)] px-1.5 py-0.5 text-xs border-2 border-theme-border shadow-[1px_1px_0px_#000]">
              {Number(player.avg_rating || 0).toFixed(2)}
            </span>
          </div>
        </motion.div>
      ) : isHoveredWithPlayer ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 0.6, scale: 1 }}
          className="w-full p-3 flex flex-col items-center text-center gap-2 pointer-events-none"
        >
          <div className="relative w-12 h-12 border-2 border-[var(--color-primary)] bg-black shadow-[2px_2px_0px_var(--color-primary)] shrink-0 rounded-full overflow-hidden grayscale">
            <img 
              src={draggedPlayer.photo_url || `https://ui-avatars.com/api/?name=${draggedPlayer.ign}&background=random`} 
              alt={draggedPlayer.ign} 
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="font-display font-black text-sm uppercase truncate leading-none text-[var(--color-primary)]">{draggedPlayer.ign}</h3>
          <span className="font-label text-[9px] font-black uppercase tracking-widest border-2 border-[var(--color-primary)] text-[var(--color-primary)] px-1.5 py-0.5 bg-transparent">
            {draggedPlayer.current_role}
          </span>
        </motion.div>
      ) : (
        <div className="w-full text-center p-4 opacity-50 flex flex-col items-center justify-center gap-1.5 min-h-[100px]">
          <div className="font-display font-black text-3xl text-gray-400 leading-none">
            {index + 1}
          </div>
          <UserPlus size={18} weight="bold" className="text-gray-400" />
          <p className="font-label text-[9px] font-black uppercase tracking-widest text-gray-500 leading-tight">
            Drop here
          </p>
        </div>
      )}
    </div>
  );
}

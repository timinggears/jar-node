import { motion } from 'motion/react';

export default function LittleMech({ miningState, isBoosted }: { miningState: 'idle' | 'mining' | 'success' | 'error', isBoosted?: boolean }) {
  const isExcited = miningState === 'success' || miningState === 'mining' || isBoosted;
  const isOverdrive = isBoosted;
  
  // FF6 Magitek Palette - Muted teals and industrial colors
  const colors = {
    armor: "#5A6A64",         // Muted teal armor
    armorLight: "#8A9A94",    // Highlight
    armorDark: "#2A3A34",     // Shadow
    mechanical: "#3E3E3E",    // Dark joints
    bronze: "#B08D57",        // Pipes/Accents
    core: isOverdrive ? "#FF0044" : "#00FFCC", // Visor glow
  };

  return (
    <motion.div
      className="fixed top-52 right-8 z-[60] pointer-events-none"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1.5 }} // Scale up to make individual pixels visible
      transition={{ delay: 3.5, type: "spring" }}
    >
      <motion.div
        animate={{
          y: isExcited ? [0, -4, 0] : [0, -1, 0],
          rotate: isOverdrive ? [-2, 2, -2] : 0
        }}
        transition={{
          duration: isOverdrive ? 0.08 : 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative"
      >
        {/* Pixel Art SVG with crispEdges */}
        <svg
          width="64"
          height="64"
          viewBox="0 0 32 32"
          fill="none"
          shapeRendering="crispEdges"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Back Exhaust Pipe */}
          <path d="M10 12h2v4h-2z" fill={colors.bronze} />
          <path d="M12 10h2v2h-2z" fill={colors.armorDark} />

          {/* Legs (Stout mechanical walker) */}
          <path d="M12 24h2v4h-2z M18 24h2v4h-2z" fill={colors.mechanical} />
          <path d="M11 28h4v2h-4z M17 28h4v2h-4z" fill={colors.armorDark} />

          {/* Main Body Pod */}
          <rect x="10" y="14" width="12" height="11" fill={colors.armor} />
          <path d="M10 14h12v2H10z" fill={colors.armorLight} />
          <path d="M10 23h12v2H10z" fill={colors.armorDark} />
          <path d="M21 14v11h1v-11z" fill={colors.armorDark} />
          
          {/* Rivets */}
          <path d="M11 16h1v1h-1z M20 16h1v1h-1z M11 22h1v1h-1z M20 22h1v1h-1z" fill={colors.armorDark} />

          {/* Head Unit */}
          <rect x="13" y="9" width="6" height="6" fill={colors.armor} />
          <path d="M13 9h6v1h-6z" fill={colors.armorLight} />
          
          {/* Visor Glow */}
          <motion.rect 
            x="14" y="11" width="4" height="2" 
            fill={colors.core}
            animate={{ 
              opacity: isOverdrive ? [1, 0, 1] : (isExcited ? [1, 0.4, 1] : 1)
            }}
            transition={{ duration: isOverdrive ? 0.1 : 0.8, repeat: Infinity }}
          />
          
          {/* Upper Fins */}
          <path d="M15 7h2v2h-2z" fill={colors.armorLight} />
          <path d="M12 8h1v1h-1z M19 8h1v1h-1z" fill={colors.armorDark} />

          {/* Arms */}
          <motion.g
            animate={{ x: isExcited ? [-1, 1, -1] : 0 }}
            transition={{ duration: 0.2, repeat: Infinity }}
          >
            <path d="M8 18h2v2H8z M22 18h2v2h-2z" fill={colors.mechanical} />
            <path d="M7 19h2v5H7z M23 19h2v5h-2z" fill={colors.armorDark} />
          </motion.g>

          {/* Steam/Exhaust for Overdrive */}
          {isOverdrive && (
            <motion.g
              animate={{ opacity: [0, 1, 0], y: [-2, -8] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <rect x="9" y="5" width="2" height="2" fill="white" opacity="0.6" />
              <rect x="21" y="5" width="2" height="2" fill="white" opacity="0.6" />
            </motion.g>
          )}
        </svg>

        {/* Retro UI Overlay */}
        {(miningState === 'mining' || isOverdrive) && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 pointer-events-none">
            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-sm tracking-tighter ${isOverdrive ? 'bg-red-600 text-white animate-pulse shadow-[0_0_8px_rgba(255,0,0,0.5)]' : 'bg-teal-900/80 text-teal-300 border border-teal-500/30'}`}>
              {isOverdrive ? 'BERSERK' : 'SYNC_OK'}
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

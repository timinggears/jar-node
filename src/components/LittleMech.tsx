import { motion } from 'motion/react';

export default function LittleMech({ miningState, isBoosted }: { miningState: 'idle' | 'mining' | 'success' | 'error', isBoosted?: boolean }) {
  const isExcited = miningState === 'success' || miningState === 'mining' || isBoosted;
  const isError = miningState === 'error';
  const isOverdrive = isBoosted;
  
  return (
    <motion.div
      className="fixed top-48 right-4 z-[60] pointer-events-none"
      initial={{ opacity: 0, x: 50, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: 3, duration: 1.2, ease: "easeOut" }}
    >
      <motion.div
        animate={{
          y: isExcited ? [0, -6, 0] : [0, -2, 0],
          rotate: isOverdrive ? [-1, 1, -1] : 0
        }}
        transition={{
          duration: isOverdrive ? 0.05 : (isExcited ? 0.3 : 4),
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative"
      >
        {/* Xenogears-style Mech (Weltall inspired) */}
        <svg
          width="90"
          height="100"
          viewBox="0 0 24 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`filter transition-all duration-500 ${isOverdrive ? 'drop-shadow-[0_0_15px_rgba(0,255,255,0.6)]' : 'drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]'}`}
        >
          {/* Back Units / Propulsors (Sharp Weltall Wings) */}
          <motion.path
            d="M3 12L-2 6L4 16M21 12L26 6L20 16"
            stroke={isOverdrive ? "#00FFFF" : "#1A202C"}
            strokeWidth="1.5"
            strokeLinejoin="round"
            animate={{ 
              rotate: isOverdrive ? [-10, 10, -10] : (isExcited ? [-5, 5, -5] : 0),
              scale: isOverdrive ? [1, 1.1, 1] : 1
            }}
          />

          {/* Aggressive Legs */}
          <path d="M9 22L6 27H10L11 22M15 22L18 27H14L13 22" fill="#10141D" />
          
          {/* Weltall Lower Body / Waist */}
          <path d="M7 16L5 21L12 24L19 21L17 16H7Z" fill="#1A202C" stroke="#2D3748" strokeWidth="0.5" />
          
          {/* Sharp Shoulders */}
          <path d="M2 10L6 8V14L2 15V10Z" fill="#1A202C" stroke="#2D3748" strokeWidth="0.5" />
          <path d="M22 10L18 8V14L22 15V10Z" fill="#1A202C" stroke="#2D3748" strokeWidth="0.5" />

          {/* Torso Section */}
          <path d="M6 10L5 16L12 19L19 16L18 10H6Z" fill="#2D3748" stroke="#1A202C" strokeWidth="0.5" />
          
          {/* Central Power Source (Zohar Point) */}
          <motion.circle
            cx="12"
            cy="14"
            r="1.2"
            fill={isError ? "#FF0000" : (isOverdrive ? "#00FFFF" : (isExcited ? "#4FD1C5" : "#2D3748"))}
            animate={{
              scale: isOverdrive ? [1, 2, 1] : (isExcited ? [1, 1.4, 1] : 1),
              opacity: isExcited ? [1, 0.4, 1] : 0.2
            }}
            transition={{ duration: isOverdrive ? 0.3 : 1, repeat: Infinity }}
          />

          {/* Head Unit (Weltall Shape) */}
          <motion.g
            animate={{
              y: isOverdrive ? [-1, 1, -1] : (isExcited ? [-1, 0, -1] : 0)
            }}
          >
            <path d="M8 4L12 2L16 4V9H8V4Z" fill="#1A202C" stroke="#2D3748" strokeWidth="0.5" />
            {/* Weltall Blade/Fins on head */}
            <path d="M12 3L9 0L12 4L15 0L12 3Z" fill={isOverdrive ? "#00FFFF" : (isExcited ? "#4FD1C5" : "#718096")} />
            
            {/* Mono-eye / Visor */}
            <motion.rect
              x="10.5" y="5.5" width="3" height="1" rx="0.5"
              fill={isError ? "#FF0000" : (isOverdrive ? "#00FFFF" : (isExcited ? "#4FD1C5" : "#2D3748"))}
              animate={{
                opacity: isOverdrive ? [1, 0.5, 1] : 1,
              }}
              transition={{ duration: 0.2, repeat: Infinity }}
            />
          </motion.g>

          {/* Arms (Weltall Claws/Sharp Hands) */}
          <motion.path
            d="M5 12V18L3 21M19 12V18L21 21"
            stroke="#1A202C"
            strokeWidth="1.8"
            strokeLinecap="round"
            animate={{
              y: isOverdrive ? [-2, 2, -2] : 0,
              rotate: isOverdrive ? [-3, 3, -3] : 0
            }}
          />
        </svg>

        {/* Tactical Overlay Text */}
        {(miningState === 'mining' || isOverdrive) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className={`absolute -left-16 top-0 text-[8px] font-black font-mono whitespace-nowrap bg-black/60 px-1 border-l-2 ${isOverdrive ? 'text-[#00FFFF] border-[#00FFFF]' : 'text-[#4FD1C5] border-[#4FD1C5]'}`}
          >
            {isOverdrive ? 'ID_SYSTEM: OVERDRIVE' : 'TARGET: NODAL_SYNC'}
          </motion.div>
        )}

        {/* Power Surge Spark Effect when Overdrive */}
        {isOverdrive && (
          <div className="absolute inset-0 overflow-visible">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-[2px] h-[2px] bg-cyan-400"
                style={{ top: '50%', left: '50%' }}
                animate={{
                  x: [0, (Math.random() - 0.5) * 100],
                  y: [0, (Math.random() - 0.5) * 100],
                  opacity: [1, 0],
                  scale: [1, 0]
                }}
                transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

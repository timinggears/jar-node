import { motion } from 'motion/react';

export default function LittleMech({ miningState }: { miningState: 'idle' | 'mining' | 'success' | 'error' }) {
  const isExcited = miningState === 'success' || miningState === 'mining';
  const isError = miningState === 'error';
  
  return (
    <motion.div
      className="fixed top-44 right-4 z-[60] pointer-events-none"
      initial={{ opacity: 0, x: 50, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: 3, duration: 1.2, ease: "easeOut" }}
    >
      <motion.div
        animate={{
          y: isExcited ? [0, -4, 0] : [0, -1, 0],
        }}
        transition={{
          duration: isExcited ? 0.2 : 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative"
      >
        {/* Anime Mech SVG */}
        <svg
          width="70"
          height="80"
          viewBox="0 0 24 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_12px_rgba(0,255,255,0.3)]"
        >
          {/* Back Unit / Wings */}
          <motion.path
            d="M4 10L1 8L3 14M20 10L23 8L21 14"
            stroke="#4A5568"
            strokeWidth="1.5"
            strokeLinejoin="round"
            animate={{ rotate: isExcited ? [-5, 5, -5] : [0, 2, 0] }}
          />

          {/* Legs */}
          <path d="M8 22L7 26H9L10 22M16 22L17 26H15L14 22" fill="#2D3748" />
          
          {/* Main Body Armor */}
          <path d="M7 12L5 18L12 22L19 18L17 12H7Z" fill="#718096" stroke="#2D3748" strokeWidth="0.5" />
          <path d="M12 12V22" stroke="#4A5568" strokeWidth="0.5" opacity="0.5" />
          
          {/* Shoulders */}
          <rect x="4" y="10" width="4" height="4" rx="1" fill="#4A5568" />
          <rect x="16" y="10" width="4" height="4" rx="1" fill="#4A5568" />

          {/* Head Unit */}
          <motion.g
            animate={{
              y: isExcited ? [0, -1, 0] : 0
            }}
          >
            <path d="M9 5L12 3L15 5V10H9V5Z" fill="#A0AEC0" stroke="#2D3748" strokeWidth="0.5" />
            {/* V-Fin Antennas */}
            <path d="M12 4L8 1L12 5L16 1L12 4Z" fill="#ED8936" />
            
            {/* Visor / Eyes */}
            <motion.path
              d="M10 6.5H14"
              stroke={isError ? "#F56565" : (isExcited ? "#00FFFF" : "#63B3ED")}
              strokeWidth="1.2"
              strokeLinecap="round"
              animate={{
                opacity: isExcited ? [0.4, 1, 0.4] : 1,
                strokeWidth: isExcited ? [1.2, 1.8, 1.2] : 1.2
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          </motion.g>

          {/* Power Core Chest Detail */}
          <motion.circle
            cx="12"
            cy="16"
            r="1.5"
            fill={isExcited ? "#00FFFF" : "#4A5568"}
            animate={{
              opacity: isExcited ? [1, 0.5, 1] : 0.3,
              scale: isExcited ? [1, 1.3, 1] : 1
            }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />

          {/* Arms */}
          <motion.path
            d="M5 14V19M19 14V19"
            stroke="#4A5568"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{
              y: isExcited ? [-1, 1, -1] : 0
            }}
          />
        </svg>

        {/* Tactical Overlay Text */}
        {miningState === 'mining' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute -left-12 top-2 text-[7px] text-[#00FFFF] font-mono whitespace-nowrap bg-black/40 px-1"
          >
            SYSTEM_OVERDRIVE
          </motion.div>
        )}

        {/* Success Particles */}
        {miningState === 'success' && (
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            {[0, 120, 240].map((deg) => (
              <motion.div
                key={deg}
                className="absolute w-1 h-3 bg-[#00FFFF] rounded-full"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${deg}deg) translateY(-35px)`,
                }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

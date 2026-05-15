import { motion } from 'motion/react';

export default function LittleSquirrel({ miningState, isStatic, bias = 50 }: { miningState: 'idle' | 'mining' | 'success' | 'error', isStatic?: boolean, bias?: number }) {
  const isExcited = miningState === 'success' || miningState === 'mining' || bias > 70;
  const biasScale = bias / 50;
  
  return (
    <motion.div
      className={`${isStatic ? 'relative' : 'fixed top-24 right-6'} z-[60] pointer-events-none`}
      initial={isStatic ? false : { opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 2.5, duration: 1 }}
    >
      <motion.div
        initial={{ y: 0, x: 0, scale: 1, opacity: 1 }}
        animate={{
          scale: isExcited ? [1, 1.1 * biasScale, 1] : [1, 1.02, 1],
          x: isExcited ? [0, -5 * biasScale, 5 * biasScale, 0] : 0,
          opacity: 1
        }}
        transition={{
          duration: isExcited ? 0.3 / biasScale : 2,
          repeat: Infinity,
          ease: "linear"
        }}
        className="relative"
      >
        {/* Cute Anime Squirrel SVG */}
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_8px_rgba(128,128,128,0.4)]"
        >
          {/* Tail */}
          <motion.path
            d="M18 10C18 6 22 4 22 8C22 12 18 14 16 14"
            stroke="#808080"
            strokeWidth="3"
            strokeLinecap="round"
            animate={{ 
              rotate: isExcited ? [-10, 10, -10] : [-2, 2, -2],
              y: isExcited ? [-2, 2, -2] : 0
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
          
          {/* Body */}
          <ellipse cx="12" cy="14" rx="5" ry="6" fill="#C0C0C0" stroke="#808080" strokeWidth="1" />
          
          {/* Head */}
          <circle cx="12" cy="8" r="4.5" fill="#C0C0C0" stroke="#808080" strokeWidth="1" />
          
          {/* Ears */}
          <path d="M9 5L8 2L10 4" fill="#808080" />
          <path d="M15 5L16 2L14 4" fill="#808080" />

          {/* Eyes */}
          <motion.circle 
            cx="10.5" cy="7.5" r="0.6" fill="#333" 
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, delay: Math.random() * 2 }}
          />
          <motion.circle 
            cx="13.5" cy="7.5" r="0.6" fill="#333" 
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, delay: Math.random() * 2 }}
          />
          
          {/* Little Nut */}
          <motion.path 
            d="M11 11L13 11L12.5 13L11.5 13Z" 
            fill="#8B4513"
            animate={{ y: [0, -1, 0] }}
            transition={{ duration: 0.4, repeat: Infinity }}
          />
          
          {/* Cheek Pink */}
          <circle cx="10" cy="9" r="0.8" fill="#FFB6C1" opacity="0.4" />
          <circle cx="14" cy="9" r="0.8" fill="#FFB6C1" opacity="0.4" />
        </svg>

        {/* Small "munching" heart when successful */}
        {miningState === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], y: [-10, -25] }}
            className="absolute top-0 right-0 text-[10px]"
          >
            🥜
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

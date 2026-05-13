import { motion } from 'motion/react';

export default function JumpingBunny({ miningState }: { miningState: 'idle' | 'mining' | 'success' | 'error' }) {
  return (
    <motion.div
      className="fixed top-6 right-6 z-[60] pointer-events-none"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2 }}
    >
      <motion.div
        animate={{
          y: miningState === 'success' ? [0, -25, 0] : [0, -15, 0],
          scaleX: miningState === 'success' ? [1, 0.7, 1.3, 1] : [1, 0.9, 1.1, 1],
          scaleY: miningState === 'success' ? [1, 1.3, 0.7, 1] : [1, 1.1, 0.9, 1],
          rotate: miningState === 'success' ? [0, 360] : 0
        }}
        transition={{
          duration: miningState === 'success' ? 0.4 : 0.8,
          repeat: miningState === 'success' ? 2 : Infinity,
          ease: "easeInOut",
        }}
        className="relative"
      >
        {/* Cute Anime Bunny SVG */}
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_8px_rgba(255,105,180,0.6)]"
        >
          {/* Ears */}
          <motion.path
            d="M8 8C8 6 9 3 10 3C11 3 12 6 12 8"
            stroke="#FFB6C1"
            strokeWidth="1.5"
            strokeLinecap="round"
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.path
            d="M12 8C12 6 13 3 14 3C15 3 16 6 16 8"
            stroke="#FFB6C1"
            strokeWidth="1.5"
            strokeLinecap="round"
            animate={{ rotate: [5, -5, 5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Face/Body */}
          <circle cx="12" cy="13" r="6" fill="#FFF0F5" stroke="#FFB6C1" strokeWidth="1" />
          
          {/* Eyes */}
          <circle cx="10" cy="12" r="0.8" fill="#555" />
          <circle cx="14" cy="12" r="0.8" fill="#555" />
          
          {/* Pink Cheeks */}
          <circle cx="9" cy="13.5" r="1" fill="#FFC0CB" opacity="0.6" />
          <circle cx="15" cy="13.5" r="1" fill="#FFC0CB" opacity="0.6" />
          
          {/* Nose/Mouth */}
          <path d="M11.5 14L12 14.5L12.5 14" stroke="#FFB6C1" strokeWidth="0.8" strokeLinecap="round" />
          
          {/* Simple Feet */}
          <circle cx="9.5" cy="18.5" r="1.5" fill="#FFF0F5" stroke="#FFB6C1" strokeWidth="0.8" />
          <circle cx="14.5" cy="18.5" r="1.5" fill="#FFF0F5" stroke="#FFB6C1" strokeWidth="0.8" />
        </svg>

        {/* Small jumping "dust" or sparks */}
        <motion.div
           animate={{
             scale: [0, 1.5, 0],
             opacity: [0, 1, 0],
             y: [0, 5, 10]
           }}
           transition={{
             duration: 0.8,
             repeat: Infinity,
             ease: "easeOut"
           }}
           className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-[#00ffcc]/30 rounded-full blur-[2px]"
        />
      </motion.div>
    </motion.div>
  );
}

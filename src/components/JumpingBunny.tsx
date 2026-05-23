import { motion } from 'motion/react';

export default function JumpingBunny({ miningState, isStatic, bias = 50 }: { miningState: 'idle' | 'mining' | 'success' | 'error', isStatic?: boolean, bias?: number }) {
  const isExcited = miningState === 'success' || miningState === 'mining' || bias > 70;
  const biasScale = bias / 50;
  
  return (
    <motion.div
      className={`${isStatic ? 'relative' : 'fixed top-6 right-6'} z-[60] pointer-events-none`}
      initial={isStatic ? false : { opacity: 0, y: -20, rotate: -20 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ delay: 2, duration: 1 }}
    >
      <motion.div
        animate={{
          y: isExcited ? [0, -30 * biasScale, 0] : [0, -12, 0],
          scaleX: isExcited ? [1, 0.7, 1.4, 1] : [1, 0.95, 1.05, 1],
          scaleY: isExcited ? [1, 1.4, 0.7, 1] : [1, 1.05, 0.95, 1],
          rotate: miningState === 'success' ? [0, 360] : (bias > 90 ? [0, 15, -15, 0] : 0)
        }}
        transition={{
          duration: miningState === 'success' ? 0.3 : ((miningState === 'mining' || bias > 70) ? 0.5 / biasScale : 1.2),
          repeat: Infinity,
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

        {/* Sparkles when excited */}
        {isExcited && [1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full translate-x-[-50%] translate-y-[-50%]"
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{
              scale: [0, 1.2, 0],
              x: [0, (i - 2) * 20, (i - 2) * 30],
              y: [0, -20 - (i * 10), -10],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.2,
            }}
            style={{ left: '50%', top: '50%' }}
          />
        ))}

        {/* Small jumping "dust" or sparks */}
        <motion.div
           initial={{ opacity: 0, scale: 0, y: 0 }}
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

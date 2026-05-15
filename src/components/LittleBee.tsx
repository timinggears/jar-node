import { motion } from 'motion/react';

export default function LittleBee({ miningState, isStatic, bias = 50 }: { miningState: 'idle' | 'mining' | 'success' | 'error', isStatic?: boolean, bias?: number }) {
  const isMining = miningState === 'mining' || miningState === 'success';
  const biasScale = bias / 50;
  
  return (
    <motion.div
      className={`${isStatic ? 'relative' : 'fixed top-64 right-14'} z-[55] pointer-events-none`}
      initial={isStatic ? false : { opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: isStatic ? 1 : 1.2 }}
      transition={{ delay: 4, type: "spring" }}
    >
      <motion.div
        animate={{
          y: isMining || bias > 70 ? [0, -2 * biasScale, 0, -1 * biasScale, 0] : [0, -4, 0],
          x: [0, 2 * biasScale, 0, -2 * biasScale, 0],
          opacity: 1 
        }}
        initial={{ opacity: 1, y: 0, x: 0 }}
        transition={{
          duration: (isMining || bias > 70) ? 0.2 / biasScale : 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative"
      >
        {/* Pixel Bee SVG */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 16 16"
          fill="none"
          shapeRendering="crispEdges"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Wings */}
          <motion.path 
            d="M6 4h4v2H6z" 
            fill="#ffffff" 
            initial={{ opacity: 0.6 }}
            animate={{ opacity: isMining ? [0.2, 0.8, 0.2] : [0.4, 0.6, 0.4] }}
            transition={{ duration: 0.1, repeat: Infinity }}
          />
          
          {/* Body */}
          <path d="M5 6h6v5H5z" fill="#f0d020" /> {/* Yellow */}
          <path d="M5 7h6v1H5z M5 9h6v1H5z" fill="#101018" /> {/* Black Stripes */}
          
          {/* Eye */}
          <path d="M10 7h1v1h-1z" fill="white" />
          
          {/* Stinger */}
          <path d="M4 8h1v1H4z" fill="#101018" />
        </svg>

        {/* Buzzing Text */}
        {isMining && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0], y: [-5, -15] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="absolute -top-4 left-0 text-[6px] font-bold text-yellow-400"
          >
            BZZZT
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

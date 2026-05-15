import { motion } from 'motion/react';

export default function LittleMech({ miningState, isBoosted, isStatic, bias = 50 }: { miningState: 'idle' | 'mining' | 'success' | 'error', isBoosted?: boolean, isStatic?: boolean, bias?: number }) {
  const isExcited = miningState === 'success' || miningState === 'mining' || isBoosted;
  const isOverdrive = isBoosted;
  const biasScale = bias / 50; // 1.0 is normal
  
  // Classic SNES Palette (Vibrant & High Contrast)
  const colors = isOverdrive ? {
    // Berserk Mode (Dark/Red Shift) - v147 Extreme
    primary: "#202028",      // Darker Armor
    secondary: "#c01010",    // Brighter Crimson trim
    accent: "#ff0000",       // Glow
    detail: "#404050",       // Shadow
    frame: "#08080c",        // Outline
  } : {
    // Classic Mode (Gundam/Weltall inspired)
    primary: "#ffffff",      // White Armor
    secondary: "#3050C0",    // Royal Blue trim
    accent: "#f0d020",       // Yellow V-Fin/Glow
    detail: "#a0a0b0",       // Grey shadow
    frame: "#101018",        // Outline
  };

  return (
    <motion.div
      className={`${isStatic ? 'relative' : 'fixed top-44 right-8'} z-[60] pointer-events-none`}
      initial={isStatic ? false : { opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: isStatic ? 1 : 1.2 }}
      transition={{ delay: 3.5, type: "spring" }}
    >
        <motion.div
        initial={{ y: 0, x: 0, scale: 1, opacity: 1 }}
        animate={{
          // Idle bobing, Success jump, or Overdrive vibration
          y: isOverdrive 
            ? [-1 * biasScale, 1 * biasScale, -1 * biasScale] 
            : (miningState === 'success' ? [0, -20, 0] : [0, -1.5 * biasScale, 0]),
          x: isOverdrive ? [-1.5 * biasScale, 1.5 * biasScale, -1.5 * biasScale] : 0,
          scale: miningState === 'success' ? [1, 1.1, 1] : 1,
          opacity: 1
        }}
        transition={{
          y: {
            duration: isOverdrive ? 0.06 / biasScale : (miningState === 'success' ? 0.4 : 3 / biasScale),
            repeat: isOverdrive ? Infinity : (miningState === 'success' ? 0 : Infinity),
            ease: isOverdrive ? "linear" : "easeInOut"
          },
          x: {
            duration: 0.05 / biasScale,
            repeat: Infinity,
            ease: "linear"
          },
          scale: {
            duration: 0.4
          }
        }}
        className="relative"
      >
        {/* Gundam Pixel Art SVG */}
        <div className="relative">
          {/* Overdrive Glow Effect */}
          {(isOverdrive || bias > 80) && (
            <motion.div
              className={`absolute inset-0 blur-2xl rounded-full z-[-1] ${isOverdrive ? 'bg-red-600/30' : 'bg-[#00ffcc]/20'}`}
              animate={{
                scale: [0.8, 1.2 * biasScale, 0.8],
                opacity: [0.3, 0.7 * (bias / 100), 0.3],
              }}
              transition={{
                duration: 1 / biasScale,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}

          {/* Energy Trail Particles (Floating Embers) */}
          {isOverdrive && (
            <div className="absolute inset-0 z-[-1] flex items-center justify-center">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-[2px] h-[2px] bg-red-500 rounded-full shadow-[0_0_8px_#ff0000]"
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                    x: [(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 80],
                    y: [0, -60 - (Math.random() * 40)],
                  }}
                  transition={{
                    duration: 1 + Math.random(),
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeOut"
                  }}
                />
              ))}
              {/* Vertical Pulse Streams */}
              {[...Array(2)].map((_, i) => (
                <motion.div
                  key={`pulse-${i}`}
                  className="absolute w-px h-24 bg-gradient-to-t from-red-600/0 via-red-500/40 to-red-600/0"
                  animate={{
                    y: [60, -60],
                    opacity: [0, 1, 1, 0],
                    scaleX: [1, 2, 1]
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: "linear"
                  }}
                  style={{ left: i === 0 ? '20%' : '80%' }}
                />
              ))}
            </div>
          )}

          <svg
            width="48"
            height="56"
            viewBox="0 0 24 28"
            fill="none"
            shapeRendering="crispEdges"
            xmlns="http://www.w3.org/2000/svg"
          >
          {/* --- SHADOW / OUTLINE LAYER --- */}
          <path d="M7 3h10v2h2v2h2v4h1v10h-1v2h-2v2h-12v-2h-2v-2h-1v-10h1v-4h2v-2h2z" fill={colors.frame} opacity="0.4" />

          {/* --- LEGS (White with red feet) --- */}
          <path d="M7 21h4v4h-4z M13 21h4v4h-4z" fill={colors.primary} />
          <path d="M7 25h4v1h-4z M13 25h4v1h-4z" fill="#e02020" /> {/* Red Feet */}
          
          {/* --- WAIST --- */}
          <path d="M7 19h10v2H7z" fill={colors.primary} />
          <path d="M11 19h2v1h-2z" fill="#e02020" /> {/* Red Waist accent */}

          {/* --- MAIN BODY (Blue with yellow vents) --- */}
          <rect x="7" y="11" width="10" height="8" fill={isOverdrive ? "#401010" : "#24449c"} />
          <path d="M8 12h2v2H8z M14 12h2v2h-2z" fill={isOverdrive ? "#ff0000" : colors.accent} /> {/* Yellow Vents */}
          
          {/* Cockpit Hatch */}
          <path d="M11 15h2v3h-2z" fill={isOverdrive ? "#ff0000" : "#e02020"} />

          {/* --- HEAD UNIT --- */}
          <rect x="9" y="5" width="6" height="6" fill={colors.primary} />
          <path d="M11 10h2v1h-2z" fill="#e02020" /> {/* Red Chin */}

          {/* Gundam V-Fin */}
          <path d="M11 3h2v2h-2z" fill={isOverdrive ? "#ff0000" : colors.accent} />
          <path d="M8 2h2v1H8z M14 2h2v1h-2z" fill={isOverdrive ? "#ff4040" : colors.accent} />
          
          {/* Visor */}
          <motion.rect
            x="10" y="7" width="4" height="1"
            fill={isOverdrive ? "#ff0000" : "#00ffcc"}
            initial={{ opacity: 1 }}
            animate={{ opacity: isOverdrive ? [1, 0.5, 1] : 1 }}
            transition={{ duration: 0.1, repeat: Infinity }}
          />

          {/* --- ARMS / SHOULDERS --- */}
          <path d="M5 11h2v4H5z M17 11h2v4h-2z" fill={colors.primary} />
          <path d="M4 14h2v6H4z M18 14h2v6h-2z" fill={colors.primary} />
          <path d="M4 15h2v1H4z M18 15h2v1h-2z" fill="#24449c" opacity="0.5" />

          {/* --- OVERDRIVE FX --- */}
          {isOverdrive && (
            <motion.g animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.2, repeat: Infinity }}>
              <path d="M1 10h2v2H1z M21 10h2v2h-2z M1 20h1v1H1z M22 20h1v1h-2z" fill="#ff0000" />
            </motion.g>
          )}
        </svg>
      </div>

        {/* Retro UI Overlay */}
        {(miningState === 'mining' || isOverdrive) && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap">
            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-sm tracking-widest ${isOverdrive ? 'bg-red-600 text-white animate-pulse' : 'bg-blue-600 text-white'}`}>
              {isOverdrive ? 'LIMIT_BREAK' : 'SYNC_STABLE'}
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

import { motion, useDragControls } from 'motion/react';
import { X, Minus, Maximize2, Minimize2, ChevronUp } from 'lucide-react';
import { ReactNode, useState } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface DesktopWindowProps {
  id: string;
  key?: string | number;
  title: string;
  icon: ReactNode;
  children: ReactNode;
  onClose: () => void;
  onFocus: () => void;
  isActive: boolean;
  initialPos?: { x: number; y: number };
  width?: string;
  height?: string;
}

export default function DesktopWindow({ 
  id, 
  title, 
  icon, 
  children, 
  onClose, 
  onFocus, 
  isActive, 
  initialPos = { x: 50, y: 50 },
  width = 'max-w-2xl w-full',
  height = 'h-auto max-h-[85vh]'
}: DesktopWindowProps) {
  const dragControls = useDragControls();
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <motion.div
      drag={!isMaximized}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      onPointerDown={onFocus}
      initial={{ opacity: 0, scale: 0.95, x: initialPos.x, y: initialPos.y }}
      animate={
        isMaximized
          ? {
              opacity: 1,
              scale: 1,
              x: 0,
              y: 0,
              zIndex: isActive ? 55 : 40,
              boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(0,255,204,0.2)'
            }
          : isMinimized
          ? {
              opacity: 0.92,
              scale: 0.98,
              zIndex: isActive ? 45 : 10,
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
            }
          : { 
              opacity: 1, 
              scale: 1,
              zIndex: isActive ? 50 : 10,
              boxShadow: isActive ? '0 20px 50px rgba(0,0,0,0.6), 0 0 20px rgba(0,255,204,0.15)' : '0 10px 30px rgba(0,0,0,0.4)'
            }
      }
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={`absolute ${
        isMaximized 
          ? '!fixed !inset-x-3 !top-12 !bottom-20 !w-auto !h-auto !max-w-none !max-h-none' 
          : isMinimized 
          ? 'w-72 !h-11 overflow-hidden' 
          : `${width} ${height}`
      } flex flex-col bg-[#070b09] border border-white/15 rounded-xl overflow-hidden pointer-events-auto shadow-2xl transition-[width,height,inset] duration-150 will-change-transform ${isActive ? 'ring-1 ring-[#00ffcc]/40' : ''}`}
      id={`window-${id}`}
    >
      {/* Title Bar */}
      <div 
        onPointerDown={(e) => {
          if (!isMaximized) {
            dragControls.start(e);
          }
        }}
        onDoubleClick={() => setIsMaximized(prev => !prev)}
        className="h-10 shrink-0 bg-[#0c120f] border-b border-white/10 flex items-center justify-between px-3 sm:px-4 cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className={`p-1 rounded shrink-0 ${isActive ? 'text-[#00ffcc]' : 'text-zinc-500'}`}>
            {icon}
          </div>
          <span className={`text-[9.5px] sm:text-[10px] uppercase tracking-widest font-black truncate ${isActive ? 'text-[#00ffcc]' : 'text-zinc-400'}`}>
            {title}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {/* Minimize / Restore Toggle */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(prev => !prev);
              if (isMaximized) setIsMaximized(false);
            }}
            className="p-1 hover:bg-white/10 rounded-md transition-colors text-zinc-400 hover:text-white cursor-pointer"
            title={isMinimized ? "Restore Window" : "Minimize Window"}
          >
            {isMinimized ? <ChevronUp size={13} /> : <Minus size={13} />}
          </button>

          {/* Maximize / Restore Toggle */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsMaximized(prev => !prev);
              if (isMinimized) setIsMinimized(false);
            }}
            className="p-1 hover:bg-white/10 rounded-md transition-colors text-zinc-400 hover:text-white cursor-pointer"
            title={isMaximized ? "Restore Size" : "Maximize Window"}
          >
            {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          {/* Close Window */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-colors text-zinc-400 cursor-pointer"
            title="Close Window"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Content Area (Hidden if minimized, wrapped in ErrorBoundary) */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <ErrorBoundary fallbackTitle={`${title} RECOVERY`}>
            {children}
          </ErrorBoundary>
        </div>
      )}

      {/* Bottom Status Edge */}
      <div className="h-1 bg-[#00ffcc]/10 overflow-hidden">
        {isActive && (
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="h-full w-1/3 bg-[#00ffcc]/30"
          />
        )}
      </div>
    </motion.div>
  );
}

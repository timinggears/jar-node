import { motion } from 'motion/react';
import { X, Minus, Maximize2 } from 'lucide-react';
import { ReactNode } from 'react';

interface DesktopWindowProps {
  id: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
  onClose: () => void;
  onFocus: () => void;
  isActive: boolean;
  initialPos?: { x: number; y: number };
}

export default function DesktopWindow({ 
  id, 
  title, 
  icon, 
  children, 
  onClose, 
  onFocus, 
  isActive, 
  initialPos = { x: 50, y: 50 } 
}: DesktopWindowProps) {
  return (
    <motion.div
      drag
      dragMomentum={false}
      onPointerDown={onFocus}
      initial={{ opacity: 0, scale: 0.9, x: initialPos.x, y: initialPos.y }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        zIndex: isActive ? 50 : 10,
        boxShadow: isActive ? '0 20px 50px rgba(0,0,0,0.5), 0 0 20px rgba(0,255,204,0.1)' : '0 10px 30px rgba(0,0,0,0.3)'
      }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className={`absolute w-full max-w-2xl h-[500px] flex flex-col bg-black/85 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden pointer-events-auto ${isActive ? 'ring-1 ring-[#00ffcc]/30' : ''}`}
      id={`window-${id}`}
    >
      {/* Title Bar */}
      <div className="h-10 shrink-0 bg-white/5 border-b border-white/10 flex items-center justify-between px-4 cursor-grab active:cursor-grabbing select-none">
        <div className="flex items-center gap-3">
          <div className={`p-1 rounded ${isActive ? 'text-[#00ffcc]' : 'text-zinc-500'}`}>
            {icon}
          </div>
          <span className={`text-[10px] uppercase tracking-widest font-black ${isActive ? 'text-[#00ffcc]' : 'text-zinc-400'}`}>
            {title}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-1 hover:bg-white/10 rounded-md transition-colors text-zinc-500">
            <Minus size={14} />
          </button>
          <button className="p-1 hover:bg-white/10 rounded-md transition-colors text-zinc-500">
            <Maximize2 size={14} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-colors text-zinc-500"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>

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

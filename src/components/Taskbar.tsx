import { motion } from 'motion/react';
import { Terminal, Cpu, Layout, Folder, Settings, Search, Zap, Activity, ShieldCheck } from 'lucide-react';
import { ReactNode } from 'react';

interface TaskbarProps {
  onToggleWindow: (id: string) => void;
  openWindows: string[];
  activeWindow: string | null;
  isMining: boolean;
  onToggleMining: () => void;
}

interface AppIconProps {
  id: string;
  icon: ReactNode;
  label: string;
  isOpen: boolean;
  isActive: boolean;
  onClick: () => void;
}

function AppIcon({ id, icon, label, isOpen, isActive, onClick }: AppIconProps) {
  return (
    <div className="relative group p-1" id={`dock-icon-${id}`}>
      <motion.button
        whileHover={{ y: -5, scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all relative ${
          isActive 
            ? 'bg-[#00ffcc]/20 text-[#00ffcc] shadow-[0_0_15px_rgba(0,255,204,0.3)] border border-[#00ffcc]/30' 
            : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5'
        }`}
      >
        {icon}
        {isOpen && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#00ffcc]" />
        )}
      </motion.button>
      
      {/* Tooltip */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 border border-white/10 rounded text-[9px] uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {label}
      </div>
    </div>
  );
}

export default function Taskbar({ 
  onToggleWindow, 
  openWindows, 
  activeWindow, 
  isMining, 
  onToggleMining 
}: TaskbarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl gap-2">
      <AppIcon 
        id="terminal"
        icon={<Terminal size={20} />} 
        label="Terminal" 
        isOpen={openWindows.includes('terminal')} 
        isActive={activeWindow === 'terminal'}
        onClick={() => onToggleWindow('terminal')}
      />
      <AppIcon 
        id="stats"
        icon={<Activity size={20} />} 
        label="Monitor" 
        isOpen={openWindows.includes('stats')} 
        isActive={activeWindow === 'stats'}
        onClick={() => onToggleWindow('stats')}
      />
      <AppIcon 
        id="visualizer"
        icon={<Layout size={20} />} 
        label="Visualizer" 
        isOpen={openWindows.includes('visualizer')} 
        isActive={activeWindow === 'visualizer'}
        onClick={() => onToggleWindow('visualizer')}
      />
      <AppIcon 
        id="stabilizer"
        icon={<ShieldCheck size={20} />} 
        label="Stabilizer" 
        isOpen={openWindows.includes('stabilizer')} 
        isActive={activeWindow === 'stabilizer'}
        onClick={() => onToggleWindow('stabilizer')}
      />
      <AppIcon 
        id="files"
        icon={<Folder size={20} />} 
        label="Files" 
        isOpen={openWindows.includes('files')} 
        isActive={activeWindow === 'files'}
        onClick={() => onToggleWindow('files')}
      />
      <AppIcon 
        id="settings"
        icon={<Settings size={20} />} 
        label="Settings" 
        isOpen={openWindows.includes('settings')} 
        isActive={activeWindow === 'settings'}
        onClick={() => onToggleWindow('settings')}
      />
      
      <div className="w-[1px] h-8 bg-white/10 mx-2" />
      
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggleMining}
        className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${
          isMining 
            ? 'bg-[#cc5500]/20 text-[#cc5500] border border-[#cc5500]/30 shadow-[0_0_15px_rgba(204,85,0,0.3)]' 
            : 'bg-[#00ffcc]/10 text-[#00ffcc] border border-[#00ffcc]/20'
        }`}
      >
        <Zap size={20} className={isMining ? 'animate-pulse' : 'opacity-50'} />
      </motion.button>
    </div>
  );
}

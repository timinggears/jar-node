import { motion } from 'motion/react';
import { Terminal, Cpu, Layout, Folder, Settings, Search, Zap, Activity, ShieldCheck, RefreshCw, Cloud, Brain, Database, Box, HardDrive, GitBranch, Binary, Network, Lock } from 'lucide-react';
import { ReactNode } from 'react';

interface TaskbarProps {
  onToggleWindow: (id: string) => void;
  openWindows: string[];
  activeWindow: string | null;
  isSyncing: boolean;
  onSync: () => void;
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
  isSyncing,
  onSync,
  isMining, 
  onToggleMining 
}: TaskbarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl gap-2">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onSync}
        disabled={isSyncing}
        className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all mr-2 ${
          isSyncing 
            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
            : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5'
        }`}
      >
        <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
      </motion.button>

      <div className="w-[1px] h-8 bg-white/10 mr-2" />

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
        id="ascii_reservoir"
        icon={<Database size={20} />} 
        label="ASCII Reservoir" 
        isOpen={openWindows.includes('ascii_reservoir')} 
        isActive={activeWindow === 'ascii_reservoir'}
        onClick={() => onToggleWindow('ascii_reservoir')}
      />
      <AppIcon 
        id="substrate_io"
        icon={<HardDrive size={20} />} 
        label="I/O Box (Memory)" 
        isOpen={openWindows.includes('substrate_io')} 
        isActive={activeWindow === 'substrate_io'}
        onClick={() => onToggleWindow('substrate_io')}
      />
      <AppIcon 
        id="memtest"
        icon={<Binary size={20} className="text-[#00ffcc]" />} 
        label="Substrate MemTest86" 
        isOpen={openWindows.includes('memtest')} 
        isActive={activeWindow === 'memtest'}
        onClick={() => onToggleWindow('memtest')}
      />
      <AppIcon 
        id="reservoir_lab"
        icon={<Network size={20} className="text-purple-400" />} 
        label="PRC Quantum Lab (ESN, Hysteresis, Oracle)" 
        isOpen={openWindows.includes('reservoir_lab')} 
        isActive={activeWindow === 'reservoir_lab'}
        onClick={() => onToggleWindow('reservoir_lab')}
      />
      <AppIcon 
        id="quantum_cipher"
        icon={<Lock size={20} className="text-[#a855f7]" />} 
        label="Quantum &amp; Chaos Cipher Lab (PURLE • Hyperchaos • Q-OTP)" 
        isOpen={openWindows.includes('quantum_cipher')} 
        isActive={activeWindow === 'quantum_cipher'}
        onClick={() => onToggleWindow('quantum_cipher')}
      />
      <AppIcon 
        id="visualizer"
        icon={<Box size={20} />} 
        label="The Cube" 
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
        id="cognitive_bridge"
        icon={<Brain size={20} />} 
        label="Cognitive Bridge" 
        isOpen={openWindows.includes('cognitive_bridge')} 
        isActive={activeWindow === 'cognitive_bridge'}
        onClick={() => onToggleWindow('cognitive_bridge')}
      />
      <AppIcon 
        id="settings"
        icon={<Settings size={20} />} 
        label="Settings" 
        isOpen={openWindows.includes('settings')} 
        isActive={activeWindow === 'settings'}
        onClick={() => onToggleWindow('settings')}
      />
      <AppIcon 
        id="git_repo"
        icon={<GitBranch size={20} className="text-[#00ffcc]" />} 
        label="Git Repository & Specs" 
        isOpen={openWindows.includes('git_repo')} 
        isActive={activeWindow === 'git_repo'}
        onClick={() => onToggleWindow('git_repo')}
      />
      <AppIcon 
        id="empyrean_sandbox"
        icon={<Box size={20} className="text-amber-400" />} 
        label="Empyrean Sandbox Emulator" 
        isOpen={openWindows.includes('empyrean_sandbox')} 
        isActive={activeWindow === 'empyrean_sandbox'}
        onClick={() => onToggleWindow('empyrean_sandbox')}
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

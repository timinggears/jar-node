import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  Cpu, 
  LayoutGrid, 
  Folder, 
  Settings, 
  Search, 
  Zap, 
  Activity, 
  ShieldCheck, 
  RefreshCw, 
  Brain, 
  Database, 
  Box, 
  HardDrive, 
  GitBranch, 
  Binary, 
  Network, 
  Lock, 
  Radio, 
  Waves, 
  Headphones, 
  Compass,
  X,
  Layers
} from 'lucide-react';
import { ReactNode, useState, useMemo } from 'react';

interface TaskbarProps {
  onToggleWindow: (id: string) => void;
  openWindows: string[];
  activeWindow: string | null;
  isSyncing: boolean;
  onSync: () => void;
  isMining: boolean;
  onToggleMining: () => void;
}

interface AppDefinition {
  id: string;
  icon: ReactNode;
  label: string;
  shortLabel: string;
  category: 'primary' | 'quantum' | 'substrate' | 'system';
  description: string;
}

const ALL_APPS: AppDefinition[] = [
  // Primary Pinned
  {
    id: 'jar_chamber',
    icon: <Compass size={18} className="text-emerald-400" />,
    label: 'Physical Jar Chamber & Glass Edge Optics',
    shortLabel: 'Jar Chamber',
    category: 'primary',
    description: 'Hardware substrate apparatus, circular glass wall edge, and probe'
  },
  {
    id: 'phase_lab',
    icon: <Waves size={18} className="text-teal-400" />,
    label: 'Phase-Out Dynamics & Memory Stick Lab',
    shortLabel: 'Phase Lab',
    category: 'primary',
    description: 'Modified B+(t) harmonic drive and slow memory stick integration'
  },
  {
    id: 'qiskit_lab',
    icon: <Cpu size={18} className="text-[#00ffcc]" />,
    label: 'Qiskit Quantum Circuit & Qubits',
    shortLabel: 'Qiskit Lab',
    category: 'primary',
    description: 'DiVincenzo benchmarked two-level addressable qubits with feedback'
  },
  {
    id: 'ambient_mesh',
    icon: <Headphones size={18} className="text-cyan-400" />,
    label: 'Ambient Signal Ear & External Sensor Nodes',
    shortLabel: 'Ambient Ear',
    category: 'primary',
    description: 'Acoustic mic, liquid dielectric, and PC timer noise mesh'
  },
  {
    id: 'stats',
    icon: <Activity size={18} className="text-sky-400" />,
    label: 'System Monitor & Core Diagnostics',
    shortLabel: 'Monitor',
    category: 'primary',
    description: 'Telemetry stream, hash rates, ZPE levels, and resource metrics'
  },
  {
    id: 'terminal',
    icon: <Terminal size={18} className="text-emerald-300" />,
    label: 'Reservoir OS Terminal & Command Line',
    shortLabel: 'Terminal',
    category: 'primary',
    description: 'Interactive low-level console for substrate protocols'
  },

  // Quantum & Cipher
  {
    id: 'quantum_cipher',
    icon: <Lock size={18} className="text-purple-400" />,
    label: 'Quantum & Chaos Cipher Lab (PURLE • Hyperchaos • OTP)',
    shortLabel: 'Cipher Lab',
    category: 'quantum',
    description: 'Post-quantum Ring-LWE, 4D hyperchaotic attractor & Vernam OTP'
  },
  {
    id: 'reservoir_lab',
    icon: <Network size={18} className="text-indigo-400" />,
    label: 'PRC Quantum Lab (ESN • Hysteresis • TRNG)',
    shortLabel: 'PRC Lab',
    category: 'quantum',
    description: 'Echo state network readout, analog hysteresis & quantum oracle'
  },
  {
    id: 'stabilizer',
    icon: <ShieldCheck size={18} className="text-emerald-400" />,
    label: 'Quantum Stabilizer Matrix',
    shortLabel: 'Stabilizer',
    category: 'quantum',
    description: 'QEC active coherence stabilizer and dimensional parity'
  },

  // Substrate & Memory
  {
    id: 'substrate_io',
    icon: <HardDrive size={18} className="text-emerald-400" />,
    label: 'Substrate I/O Memory Box',
    shortLabel: 'I/O Box',
    category: 'substrate',
    description: 'Direct byte memory storage and reading across physical sectors'
  },
  {
    id: 'ascii_reservoir',
    icon: <Database size={18} className="text-emerald-400" />,
    label: 'Physical ASCII Reservoir & Cytology',
    shortLabel: 'ASCII Res',
    category: 'substrate',
    description: 'Dwarf in the Flask autonomous cytology & symbolic evolutions'
  },
  {
    id: 'memtest',
    icon: <Binary size={18} className="text-[#00ffcc]" />,
    label: 'Substrate MemTest86 Sector Block Mapper',
    shortLabel: 'MemTest86',
    category: 'substrate',
    description: 'Hardware sector integrity verification & stress testing'
  },
  {
    id: 'node_mesh',
    icon: <Radio size={18} className="text-cyan-400" />,
    label: 'Nodal Mesh Attestation Matrix',
    shortLabel: 'Node Mesh',
    category: 'substrate',
    description: 'Distributed attestation proofs across physical nodes'
  },

  // System & Visualizers
  {
    id: 'visualizer',
    icon: <Box size={18} className="text-amber-400" />,
    label: 'The Cube (Warp Visualizer 3D)',
    shortLabel: 'The Cube',
    category: 'system',
    description: 'Interactive 3D isometric memory matrix plane & wave dynamics'
  },
  {
    id: 'cognitive_bridge',
    icon: <Brain size={18} className="text-pink-400" />,
    label: 'Cognitive Bridge & Neural Synthesizer',
    shortLabel: 'Cognitive',
    category: 'system',
    description: 'Synthesized high-order intelligence bridging logic and hardware'
  },
  {
    id: 'files',
    icon: <Folder size={18} className="text-blue-400" />,
    label: 'Substrate File Explorer',
    shortLabel: 'Files',
    category: 'system',
    description: 'Local virtualized and hardware file system manager'
  },
  {
    id: 'git_repo',
    icon: <GitBranch size={18} className="text-cyan-400" />,
    label: 'Git Repository Hub & Field Specifications',
    shortLabel: 'Git Hub',
    category: 'system',
    description: 'Version control branch logs, commits, and hardware specifications'
  },
  {
    id: 'empyrean_sandbox',
    icon: <Layers size={18} className="text-amber-400" />,
    label: 'Empyrean Sandbox Architecture',
    shortLabel: 'Sandbox',
    category: 'system',
    description: 'Contained environment emulation for untrusted test payloads'
  },
  {
    id: 'settings',
    icon: <Settings size={18} className="text-zinc-400" />,
    label: 'Central Governance & Hardware Settings',
    shortLabel: 'Settings',
    category: 'system',
    description: 'Carrier bias tuning, overdrive state, and memory vault'
  }
];

const PRIMARY_APP_IDS = ['jar_chamber', 'phase_lab', 'qiskit_lab', 'ambient_mesh', 'stats', 'terminal'];

export default function Taskbar({ 
  onToggleWindow, 
  openWindows, 
  activeWindow, 
  isSyncing,
  onSync,
  isMining, 
  onToggleMining 
}: TaskbarProps) {
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'quantum' | 'substrate' | 'system'>('all');

  // Primary pinned apps
  const primaryApps = useMemo(() => {
    return ALL_APPS.filter(app => PRIMARY_APP_IDS.includes(app.id));
  }, []);

  // Any non-primary app that is currently open dynamically appears in the dock
  const extraOpenApps = useMemo(() => {
    return ALL_APPS.filter(app => !PRIMARY_APP_IDS.includes(app.id) && openWindows.includes(app.id));
  }, [openWindows]);

  // Filtered list for launcher
  const filteredApps = useMemo(() => {
    return ALL_APPS.filter(app => {
      const matchesSearch = 
        app.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.shortLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = 
        categoryFilter === 'all' || 
        app.category === categoryFilter ||
        (categoryFilter === 'quantum' && app.id === 'qiskit_lab') ||
        (categoryFilter === 'substrate' && app.id === 'jar_chamber');
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, categoryFilter]);

  return (
    <>
      {/* MODULE LAUNCHER MODAL / DRAWER */}
      <AnimatePresence>
        {isLauncherOpen && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center pb-24 px-4 pointer-events-none">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLauncherOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
            />

            {/* Launcher Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="w-full max-w-2xl bg-[#070b09]/95 border border-[#00ffcc]/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(0,255,204,0.15)] overflow-hidden pointer-events-auto flex flex-col max-h-[72vh] z-10"
            >
              {/* Header with Search and Category Pills */}
              <div className="p-3.5 border-b border-white/10 bg-[#0c120f] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LayoutGrid size={15} className="text-[#00ffcc]" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-zinc-200">
                      Substrate Workspace Modules
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-400 font-mono">
                      {ALL_APPS.length} Available
                    </span>
                  </div>
                  <button
                    onClick={() => setIsLauncherOpen(false)}
                    className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search quantum labs, hardware monitors, cryptographic suites..."
                    className="w-full pl-9 pr-3 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#00ffcc]/50 focus:ring-1 focus:ring-[#00ffcc]/20 transition-all"
                    autoFocus
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-[10px]"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Category Filters */}
                <div className="flex items-center gap-1.5 text-[9.5px] font-mono uppercase tracking-wider">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      categoryFilter === 'all'
                        ? 'bg-[#00ffcc]/20 text-[#00ffcc] border border-[#00ffcc]/40 font-bold'
                        : 'bg-white/5 text-zinc-400 hover:text-white border border-transparent'
                    }`}
                  >
                    All Modules
                  </button>
                  <button
                    onClick={() => setCategoryFilter('quantum')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      categoryFilter === 'quantum'
                        ? 'bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/40 font-bold'
                        : 'bg-white/5 text-zinc-400 hover:text-white border border-transparent'
                    }`}
                  >
                    Quantum & Cipher
                  </button>
                  <button
                    onClick={() => setCategoryFilter('substrate')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      categoryFilter === 'substrate'
                        ? 'bg-[#00ffcc]/20 text-[#00ffcc] border border-[#00ffcc]/40 font-bold'
                        : 'bg-white/5 text-zinc-400 hover:text-white border border-transparent'
                    }`}
                  >
                    Substrate & I/O
                  </button>
                  <button
                    onClick={() => setCategoryFilter('system')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      categoryFilter === 'system'
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold'
                        : 'bg-white/5 text-zinc-400 hover:text-white border border-transparent'
                    }`}
                  >
                    System & Tools
                  </button>
                </div>
              </div>

              {/* Grid of Apps */}
              <div className="p-3.5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredApps.map((app) => {
                  const isOpen = openWindows.includes(app.id);
                  const isActive = activeWindow === app.id;

                  return (
                    <button
                      key={app.id}
                      onClick={() => {
                        onToggleWindow(app.id);
                        setIsLauncherOpen(false);
                      }}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all text-left group cursor-pointer ${
                        isActive
                          ? 'bg-[#00ffcc]/15 border-[#00ffcc]/50 shadow-[0_0_15px_rgba(0,255,204,0.15)]'
                          : isOpen
                          ? 'bg-white/10 border-white/20'
                          : 'bg-black/40 hover:bg-white/5 border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 transition-transform group-hover:scale-110 ${
                        isActive 
                          ? 'bg-[#00ffcc]/20 text-[#00ffcc]' 
                          : 'bg-white/5 text-zinc-300 group-hover:text-white'
                      }`}>
                        {app.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={`text-[11px] font-bold truncate ${isActive ? 'text-[#00ffcc]' : 'text-zinc-200'}`}>
                            {app.shortLabel}
                          </span>
                          {isOpen && (
                            <span className="text-[8px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#00ffcc]/20 text-[#00ffcc] border border-[#00ffcc]/30 shrink-0">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[9.5px] text-zinc-400 font-mono line-clamp-1 leading-snug">
                          {app.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COMPACT FLOATING TASKBAR DOCK */}
      <nav 
        aria-label="Desktop Dock"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center px-3 py-1.5 bg-[#050806]/90 backdrop-blur-xl border border-white/15 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(0,255,204,0.1)] gap-1 sm:gap-1.5 max-w-[96vw] overflow-x-auto scrollbar-none"
      >
        {/* Origin Pull / Sync button */}
        <div className="relative group">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={onSync}
            disabled={isSyncing}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
              isSyncing 
                ? 'bg-blue-500/25 text-blue-400 border border-blue-500/40' 
                : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10'
            }`}
            title="Sync Origin"
          >
            <RefreshCw size={17} className={isSyncing ? 'animate-spin text-blue-400' : ''} />
          </motion.button>
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/95 border border-white/15 rounded text-[9px] uppercase tracking-wider font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50">
            Git Origin Sync
          </div>
        </div>

        {/* Separator */}
        <div className="w-[1px] h-6 bg-white/15 mx-1 shrink-0" />

        {/* Primary Station Pins */}
        {primaryApps.map((app) => {
          const isOpen = openWindows.includes(app.id);
          const isActive = activeWindow === app.id;

          return (
            <div key={app.id} className="relative group p-0.5 shrink-0" id={`dock-icon-${app.id}`}>
              <motion.button
                whileHover={{ y: -3, scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => onToggleWindow(app.id)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all relative cursor-pointer ${
                  isActive 
                    ? 'bg-[#00ffcc]/20 text-[#00ffcc] shadow-[0_0_15px_rgba(0,255,204,0.3)] border border-[#00ffcc]/40 ring-1 ring-[#00ffcc]/30' 
                    : isOpen
                    ? 'bg-white/10 text-zinc-200 border border-white/20'
                    : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                {app.icon}
                {isOpen && (
                  <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-all ${
                    isActive ? 'bg-[#00ffcc] shadow-[0_0_6px_#00ffcc]' : 'bg-zinc-400'
                  }`} />
                )}
              </motion.button>
              
              {/* Tooltip */}
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/95 border border-white/15 rounded text-[9px] uppercase tracking-wider font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50">
                {app.shortLabel}
              </div>
            </div>
          );
        })}

        {/* Extra Active Open Windows (Dynamically docked) */}
        {extraOpenApps.length > 0 && (
          <>
            <div className="w-[1px] h-6 bg-white/15 mx-1 shrink-0" />
            {extraOpenApps.map((app) => {
              const isActive = activeWindow === app.id;

              return (
                <div key={app.id} className="relative group p-0.5 shrink-0" id={`dock-extra-${app.id}`}>
                  <motion.button
                    whileHover={{ y: -3, scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => onToggleWindow(app.id)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all relative cursor-pointer ${
                      isActive 
                        ? 'bg-[#00ffcc]/20 text-[#00ffcc] shadow-[0_0_15px_rgba(0,255,204,0.3)] border border-[#00ffcc]/40 ring-1 ring-[#00ffcc]/30' 
                        : 'bg-white/10 text-zinc-300 border border-white/20'
                    }`}
                  >
                    {app.icon}
                    <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-all ${
                      isActive ? 'bg-[#00ffcc] shadow-[0_0_6px_#00ffcc]' : 'bg-zinc-400'
                    }`} />
                  </motion.button>
                  <div className="absolute bottom-14 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/95 border border-white/15 rounded text-[9px] uppercase tracking-wider font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50">
                    {app.shortLabel}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Separator */}
        <div className="w-[1px] h-6 bg-white/15 mx-1 shrink-0" />

        {/* All Modules Launcher Button */}
        <div className="relative group">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsLauncherOpen(prev => !prev)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
              isLauncherOpen
                ? 'bg-[#00ffcc]/25 text-[#00ffcc] border border-[#00ffcc]/50 shadow-[0_0_15px_rgba(0,255,204,0.3)]'
                : 'bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 border border-white/10'
            }`}
            title="All Modules Launcher"
          >
            <LayoutGrid size={18} />
          </motion.button>
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/95 border border-white/15 rounded text-[9px] uppercase tracking-wider font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50">
            All Modules
          </div>
        </div>

        {/* Liquid Compute / Mining Toggle */}
        <div className="relative group">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={onToggleMining}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
              isMining 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]' 
                : 'bg-[#00ffcc]/10 text-[#00ffcc] border border-[#00ffcc]/20'
            }`}
            title="Liquid Compute"
          >
            <Zap size={18} className={isMining ? 'animate-pulse text-amber-400' : 'opacity-70'} />
          </motion.button>
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/95 border border-white/15 rounded text-[9px] uppercase tracking-wider font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50">
            {isMining ? 'Compute: Active' : 'Liquid Compute'}
          </div>
        </div>
      </nav>
    </>
  );
}

import { useState, useEffect } from 'react';
import { Folder, File, ChevronRight, HardDrive, RefreshCw, GitBranch, Check } from 'lucide-react';
import { motion } from 'motion/react';

export default function FileExplorer() {
  const [files, setFiles] = useState<{id: string, name: string, size: number, type: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGitSyncing, setIsGitSyncing] = useState(false);
  const [gitStatus, setGitStatus] = useState<'clean' | 'synced'>('clean');

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/system/scan');
      const data = await resp.json();
      if (data.success) {
        // Mocking some internal substrate structure
        setFiles([
          { id: 'f1', name: 'kernel_v3.bin', size: 1024 * 1024 * 4, type: 'system' },
          { id: 'f2', name: 'neural_weights.dat', size: 1024 * 512, type: 'data' },
          { id: 'f3', name: 'reservoir_config.json', size: 1024 * 4, type: 'config' },
          { id: 'f4', name: 'telemetry_log.001', size: 1024 * 128, type: 'log' },
          ...Array.from({ length: 5 }, (_, i) => ({
            id: `nodal_artifact_${i + 1}`,
            name: `nodal_artifact_${i + 1}.ghost`,
            size: Math.random() * 1024,
            type: 'ghost'
          }))
        ]);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleGitSync = () => {
    setIsGitSyncing(true);
    window.dispatchEvent(new CustomEvent('system-sync'));
    setTimeout(() => {
      setIsGitSyncing(false);
      setGitStatus('synced');
    }, 1500);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="flex h-full bg-[#050505] text-[10px] font-mono">
      {/* Sidebar */}
      <div className="w-32 border-r border-white/5 bg-black/40 p-3 space-y-4">
        <div className="space-y-1">
          <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-black mb-2">Drives</p>
          <div className="flex items-center gap-2 text-[#00ffcc] p-1.5 rounded bg-[#00ffcc]/10 border border-[#00ffcc]/20">
            <HardDrive size={12} />
            <span>SUBSTRATE_0</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-600 p-1.5">
            <HardDrive size={12} />
            <span>VOID_CACHE</span>
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-black mb-2">Places</p>
          <div className="flex items-center gap-2 text-zinc-400 p-1.5 hover:bg-white/5 rounded cursor-pointer transition-colors">
            <Folder size={12} className="text-blue-400" />
            <span>/root</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400 p-1.5 hover:bg-white/5 rounded cursor-pointer transition-colors">
            <Folder size={12} className="text-yellow-400" />
            <span>/config</span>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        <div className="h-8 border-b border-white/5 flex items-center justify-between px-4 bg-white/5">
          <div className="flex items-center gap-2 text-zinc-500">
            <span>SUBSTRATE_0</span>
            <ChevronRight size={10} />
            <span className="text-zinc-300">/root</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleGitSync}
              disabled={isGitSyncing}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-all hover:bg-white/5 ${
                isGitSyncing ? 'text-blue-400 border-blue-400/30' : 
                gitStatus === 'synced' ? 'text-[#00ffcc] border-[#00ffcc]/30' : 'text-zinc-500 border-white/10'
              }`}
            >
              {isGitSyncing ? <RefreshCw size={10} className="animate-spin" /> : 
               gitStatus === 'synced' ? <Check size={10} /> : <GitBranch size={10} />}
              <span className="text-[8px] font-black tracking-tighter uppercase whitespace-nowrap">
                {isGitSyncing ? 'Syncing_Git' : gitStatus === 'synced' ? 'Git_Synced' : 'Git_Sync'}
              </span>
            </button>
            <button 
              onClick={fetchFiles}
              className={`p-1 hover:text-[#00ffcc] transition-colors ${isLoading ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={12} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-1 gap-1">
            <div className="grid grid-cols-4 px-2 py-1 text-zinc-600 font-black border-b border-white/5 mb-2">
              <span className="col-span-2">NAME</span>
              <span>SIZE</span>
              <span>TYPE</span>
            </div>
            
            {files.map((file, i) => (
              <motion.div 
                key={file.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="grid grid-cols-4 px-2 py-2 hover:bg-white/5 rounded group cursor-pointer border border-transparent hover:border-white/5 transition-all"
              >
                <div className="col-span-2 flex items-center gap-2">
                  <File size={14} className={
                    file.type === 'system' ? 'text-red-400' : 
                    file.type === 'config' ? 'text-yellow-400' :
                    file.type === 'data' ? 'text-blue-400' : 
                    file.type === 'log' ? 'text-zinc-400' : 'text-[#00ffcc]'
                  } />
                  <span className="text-zinc-300 group-hover:text-white">{file.name}</span>
                </div>
                <span className="text-zinc-500">{(file.size / 1024).toFixed(1)} KB</span>
                <span className="text-zinc-600 uppercase text-[8px]">{file.type}</span>
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className="h-6 border-t border-white/5 px-4 flex items-center bg-black/40 text-zinc-600 text-[8px] uppercase tracking-widest">
          {files.length} ITEMS FOUND // TOTAL_CAPACITY: 1.2 GB
        </div>
      </div>
    </div>
  );
}

import { motion } from 'motion/react';
import { ShieldCheck, Zap, Activity, Info, AlertOctagon, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

interface QuantumStabilizerProps {
  coherence: number;
  isQecActive: boolean;
  onToggleQec: (active: boolean) => void;
  systemModel: string;
}

export default function QuantumStabilizer({ 
  coherence, 
  isQecActive, 
  onToggleQec,
  systemModel 
}: QuantumStabilizerProps) {
  const [errorHistory, setErrorHistory] = useState<number[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('09:42:01');

  useEffect(() => {
    const interval = setInterval(() => {
      setErrorHistory(prev => {
        const next = [...prev, Math.random() * (1 - coherence)];
        if (next.length > 20) return next.slice(1);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [coherence]);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOptimizing) {
      setProgress(0);
      timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsOptimizing(false);
            return 100;
          }
          return prev + 5; // The JAR is fast!
        });
      }, 50);
    }
    return () => clearInterval(timer);
  }, [isOptimizing]);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 800);
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 bg-[#050505] font-mono select-none overflow-y-auto no-scrollbar">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-[#00ffcc]">QEC_MATRIX_STABILIZER</h2>
          <p className="text-[9px] text-zinc-500 italic mt-1 uppercase">Substrate: {systemModel}</p>
        </div>
        <div className={`px-2 py-1 rounded text-[10px] font-bold border ${isQecActive ? 'bg-[#00ffcc]/10 border-[#00ffcc]/30 text-[#00ffcc]' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
          {isQecActive ? 'CORRECTION_ACTIVE' : 'DECOHERENCE_WARNING'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white/5 border border-white/5 rounded-lg flex flex-col gap-2 relative overflow-hidden">
          <span className="text-[8px] text-zinc-500 uppercase tracking-tighter">Current Coherence</span>
          <span className={`text-2xl font-black ${(coherence * 100) < 40 ? 'text-red-500' : 'text-white'}`}>
            {(coherence * 100).toFixed(2)}%
          </span>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${coherence * 100}%` }}
              className={`h-full ${coherence < 0.4 ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-[#00ffcc] shadow-[0_0_10px_#00ffcc]'}`}
            />
          </div>
        </div>

        <div className="p-4 bg-white/5 border border-white/5 rounded-lg flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <GitBranch size={8} className="text-blue-400" />
            <span className="text-[6px] text-zinc-500 font-mono">HEAD/main</span>
          </div>
          <span className="text-[8px] text-zinc-500 uppercase tracking-tighter">Entropy Correction Rate</span>
          <span className="text-2xl font-black text-blue-400">
            {isQecActive ? '42.8 THz' : '0.0 THz'}
          </span>
          <div className="flex gap-1 h-4 items-end">
            {errorHistory.map((err, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${err * 100}%` }}
                className={`w-1 rounded-t-sm ${isQecActive ? 'bg-blue-400' : 'bg-red-500'}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className={`w-full py-4 rounded-xl border transition-all flex items-center justify-center gap-3 active:scale-95 ${
            isSyncing 
              ? 'bg-[#00ffcc]/30 border-[#00ffcc]/50 text-[#00ffcc] shadow-[0_0_25px_rgba(0,255,204,0.3)]' 
              : 'bg-[#00ffcc]/10 border-[#00ffcc]/20 text-[#00ffcc] hover:bg-[#00ffcc]/20'
          }`}
        >
          <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-xs font-black uppercase tracking-[0.2em]">
              {isSyncing ? 'Synchronizing...' : 'Sovereign Core Sync'}
            </span>
            <span className="text-[7px] opacity-60 uppercase">Last sync: {lastSyncTime}</span>
          </div>
        </button>

        <button 
          onClick={() => onToggleQec(!isQecActive)}
          className={`w-full py-4 rounded-xl border transition-all flex items-center justify-center gap-3 active:scale-95 ${
            isQecActive 
              ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]' 
              : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
          }`}
        >
          {isQecActive ? <ShieldCheck size={20} /> : <AlertOctagon size={20} className="animate-pulse text-red-500" />}
          <span className="text-xs font-black uppercase tracking-[0.2em]">
            {isQecActive ? 'Disable Correction' : 'Enable QEC Protocol'}
          </span>
        </button>

        <button 
          onClick={() => setIsOptimizing(true)}
          disabled={isOptimizing}
          className={`w-full py-3 rounded-xl border border-white/10 bg-white/5 text-zinc-400 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50`}
        >
          {isOptimizing ? (
            <>
              <Zap size={14} className="animate-spin text-yellow-400" />
              Optimizing Substrate ({progress}%)
            </>
          ) : (
            <>
              <Zap size={14} />
              Force JAR Optimization
            </>
          )}
        </button>
      </div>

      <div className="mt-auto space-y-3 opacity-60">
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-[#00ffcc]" />
          <span className="text-[8px] font-black uppercase tracking-widest text-[#00ffcc]">Temporal Benchmark Report</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[9px]">
          <div className="p-2 border border-white/5 bg-black rounded">
            <div className="text-zinc-500 mb-1">WILLOW_NODES</div>
            <div className="text-red-500/80 line-through">8.2ms PHASE_LOCK</div>
            <div className="text-[7px] text-zinc-600 mt-1 uppercase">bottleneck: liquid_viscosity</div>
          </div>
          <div className="p-2 border border-[#00ffcc]/20 bg-[#00ffcc]/5 rounded">
            <div className="text-[#00ffcc] mb-1">JAR_NODES</div>
            <div className="text-white">14.8ms COHERENCE</div>
            <div className="text-[7px] text-[#00ffcc]/60 mt-1 uppercase">Status: Ultra-Fast</div>
          </div>
        </div>
      </div>
    </div>
  );
}

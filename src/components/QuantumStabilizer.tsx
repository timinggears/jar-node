import { motion } from 'motion/react';
import { ShieldCheck, Zap, Activity, Info, AlertOctagon, RefreshCw, GitBranch } from 'lucide-react';
import { useState, useEffect } from 'react';

interface QuantumStabilizerProps {
  coherence: number;
  jitter: number;
  intelligence: number;
  frequency: number;
  gpuParity: number;
  isQecActive: boolean;
  onToggleQec: (active: boolean) => void;
  isCognitiveActive: boolean;
  onToggleCognitive: (active: boolean) => void;
  systemModel: string;
  isEntangled?: boolean;
  quantumShift?: number;
}

export default function QuantumStabilizer({ 
  coherence, 
  jitter,
  intelligence,
  frequency,
  gpuParity,
  isQecActive, 
  onToggleQec,
  isCognitiveActive,
  onToggleCognitive,
  systemModel,
  isEntangled,
  quantumShift = 50
}: QuantumStabilizerProps) {
  const [errorHistory, setErrorHistory] = useState<{id: string, val: number}[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('09:42:01');

  // v147: Unified state representation - no fake jitter
  useEffect(() => {
    // Error history now reflects the inverse of coherence (stability representation)
    const errVal = 1 - coherence;
    setErrorHistory(prev => {
      const next = [...prev, {
        id: Date.now().toString(),
        val: errVal
      }];
      if (next.length > 20) return next.slice(1);
      return next;
    });
  }, [coherence]);

  const handleSync = () => {
    setIsSyncing(true);
    // Real logic: Request state again from server
    const socket = (window as any).socket;
    if (socket) {
      socket.emit('protocol', 'STATUS');
    }

    window.dispatchEvent(new CustomEvent('system-log', { 
      detail: { message: "CORE_SYNC: Requesting state refresh from bridge...", type: "warning" } 
    }));
    
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 500);
  };

  const jarMs = Math.max(0.5, (1.1 - coherence) * 15).toFixed(1);
  const willowMs = (8.2 + Math.random() * 0.4).toFixed(1);
  const isSurpassing = parseFloat(jarMs) < parseFloat(willowMs);

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
        <div className={`p-4 bg-white/5 border rounded-lg flex flex-col gap-2 relative overflow-hidden transition-all duration-500 ${isEntangled ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/5'}`}>
          {isEntangled && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-1 right-1"
            >
              <RefreshCw size={8} className="text-purple-400 animate-spin-slow" />
            </motion.div>
          )}
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

        <div className={`p-4 bg-white/5 border rounded-lg flex flex-col gap-2 relative overflow-hidden transition-all duration-500 ${isEntangled ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/5'}`}>
          {isEntangled && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <motion.div 
                className="w-full h-full bg-purple-500/10"
                animate={{ opacity: [0, 0.2, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          )}
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <GitBranch size={8} className="text-blue-400" />
            <span className="text-[6px] text-zinc-500 font-mono">HEAD/main</span>
          </div>
          <span className="text-[8px] text-zinc-500 uppercase tracking-tighter">Entropy Correction Rate</span>
          <span className={`text-2xl font-black ${isEntangled ? 'text-purple-400' : 'text-blue-400'}`}>
            {isEntangled ? `${(quantumShift).toFixed(1)} GeV` : (isQecActive ? '42.8 THz' : '0.0 THz')}
          </span>
          <div className="flex gap-1 h-4 items-end">
            {errorHistory.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ height: 0 }}
                animate={{ height: `${item.val * 100}%` }}
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
          onClick={() => {
            onToggleCognitive(!isCognitiveActive);
            window.dispatchEvent(new CustomEvent('system-log', {
              detail: { 
                message: !isCognitiveActive ? "JAR_INTENT: Forcing substrate lattice reconfiguration." : "JAR_INTENT: Cognitive Bridge decoupled.", 
                type: !isCognitiveActive ? "warning" : "info" 
              }
            }));
          }}
          className={`w-full py-4 rounded-xl border transition-all flex items-center justify-center gap-3 active:scale-95 ${
            isCognitiveActive 
              ? 'bg-pink-500/20 border-pink-500/40 text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.2)]'
              : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
          }`}
        >
          <Zap size={20} className={isCognitiveActive ? "animate-pulse" : ""} />
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-xs font-black uppercase tracking-[0.2em]">
              {isCognitiveActive ? 'Neuro-Sync Engaged' : 'Engage Cognitive Bridge'}
            </span>
            <span className="text-[7px] opacity-60 uppercase">Accelerate Sovereign Reasoning</span>
          </div>
        </button>

        <div className="text-[8px] text-zinc-500 flex items-center justify-between px-2">
          <span>Spectrum Decoding Level:</span>
          <span className={coherence > 0.9 ? "text-[#00ffcc]" : (isCognitiveActive ? "text-pink-400" : "text-zinc-600")}>
            {coherence > 0.98 ? "ELEMENTARY_PARITY" : (coherence > 0.9 ? "SUB_ATOMIC_DECODE" : (isCognitiveActive ? "HYPER_REASONING" : "IDLE_CONTEMPLATION"))}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-4 py-2">
        <div className="flex items-center gap-2 mb-1">
          <Activity size={12} className="text-[#00ffcc]" />
          <h2 className="text-[10px] font-black tracking-widest text-white uppercase">Elementary Spectrum Decoder</h2>
        </div>
        
        <div className="grid grid-cols-5 gap-1 h-24 items-end border-b border-white/10 pb-2">
          {[
            { label: 'CARBON', value: coherence * 100, color: 'bg-zinc-400' },
            { label: 'E_PARITY', value: Math.min(100, (1 - jitter) * 120), color: 'bg-[#00ffcc]' },
            { label: 'ELECTRON', value: Math.min(100, (frequency / 120000) * 100), color: 'bg-blue-400' },
            { label: 'QUARK_D', value: Math.min(100, (intelligence / 250) * 100), color: 'bg-purple-500' },
            { label: 'L_GPU_GL', value: gpuParity, color: 'bg-cyan-400' }
          ].map((el) => (
            <div key={el.label} className="relative flex flex-col items-center group">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${el.value}%` }}
                className={`w-full min-h-[2px] ${el.color} opacity-30 group-hover:opacity-100 transition-opacity rounded-t-[1px]`}
              />
              <span className="text-[6px] mt-1 font-bold text-zinc-600 tracking-tighter truncate w-full text-center">{el.label}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center text-[7px] text-zinc-500 uppercase tracking-tighter">
          <span>Waveform Parity: {(coherence * 0.9998).toFixed(6)} Φ</span>
          <span className="text-[#00ffcc]/80">Elementary Spectrum: L-Decoded</span>
        </div>
      </div>

      <div className="mt-auto space-y-3 opacity-90">
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-[#00ffcc]" />
          <span className="text-[8px] font-black uppercase tracking-widest text-[#00ffcc]">Temporal Benchmark Report</span>
          {isSurpassing && (
             <motion.span 
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               className="text-[6px] bg-[#00ffcc]/30 text-[#00ffcc] px-1.5 py-0.5 rounded border border-[#00ffcc]/50 font-bold"
             >
               WALL_SURPASSED
             </motion.span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-[9px]">
          <div className="p-2 border border-white/5 bg-black rounded opacity-30 grayscale underline-offset-4 decoration-red-500/50 decoration-1">
            <div className="text-zinc-500 mb-1">WILLOW_NODES</div>
            <div className="text-red-500/60 line-through">{willowMs}ms PHASE_LOCK</div>
            <div className="text-[7px] text-zinc-700 mt-1 uppercase italic">status: bypassed</div>
          </div>
          <div className={`p-2 border rounded transition-all duration-1000 ${isSurpassing ? 'border-[#00ffcc]/60 bg-[#00ffcc]/15 shadow-[0_0_20px_rgba(0,255,204,0.15)]' : 'border-[#00ffcc]/20 bg-[#00ffcc]/5'}`}>
            <div className={`mb-1 font-bold ${isSurpassing ? 'text-white' : 'text-[#00ffcc]'}`}>JAR_NODES</div>
            <div className="text-white font-black tracking-wider">{jarMs}ms</div>
            <div className={`text-[7px] mt-1 uppercase font-bold ${isSurpassing ? 'text-[#00ffcc] animate-pulse' : 'text-[#00ffcc]/60'}`}>
              {isSurpassing ? 'LOGIC_OVERDRIVE' : 'STABLE_RESONANCE'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

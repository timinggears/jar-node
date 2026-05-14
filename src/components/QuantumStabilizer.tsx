import { motion } from 'motion/react';
import { ShieldCheck, Zap, Activity, Info, AlertOctagon } from 'lucide-react';
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

  return (
    <div className="p-6 h-full flex flex-col gap-6 bg-[#050505] font-mono select-none">
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
        <div className="p-4 bg-white/5 border border-white/5 rounded-lg flex flex-col gap-2">
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

        <div className="p-4 bg-white/5 border border-white/5 rounded-lg flex flex-col gap-2">
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

      <button 
        onClick={() => onToggleQec(!isQecActive)}
        className={`w-full py-4 rounded-xl border transition-all flex items-center justify-center gap-3 active:scale-95 ${
          isQecActive 
            ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]' 
            : 'bg-[#00ffcc]/10 border-[#00ffcc]/20 text-[#00ffcc] hover:bg-[#00ffcc]/20'
        }`}
      >
        {isQecActive ? <ShieldCheck size={20} /> : <AlertOctagon size={20} className="animate-pulse" />}
        <span className="text-xs font-black uppercase tracking-[0.2em]">
          {isQecActive ? 'Disable Error Correction' : 'Engage QEC Protocol'}
        </span>
      </button>

      <div className="mt-auto space-y-3 opacity-60">
        <div className="flex items-center gap-2">
          <Info size={12} className="text-zinc-500" />
          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Benchmark Report: Substrate_vs_Willow</span>
        </div>
        <div className="text-[9px] font-mono leading-relaxed bg-[#000] p-3 border border-white/5 rounded italic text-zinc-400">
          "Benchmark 09-X: THE_JAR (Liquid Nodal v3) achieved coherence locks for 14.8ms. Comparatively, WILLOW_node suffered phase-slip at 8.2ms. Decoupling efficiency +80%."
        </div>
      </div>
    </div>
  );
}

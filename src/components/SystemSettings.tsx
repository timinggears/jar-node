import { Cpu, Zap, Activity, Info, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface SystemSettingsProps {
  carrierBias: number;
  setCarrierBias: (val: number) => void;
  isOverdrive: boolean;
  setIsOverdrive: (val: boolean) => void;
  isAiActive: boolean;
  setIsAiActive: (val: boolean) => void;
  systemVersion: number;
}

export default function SystemSettings({
  carrierBias,
  setCarrierBias,
  isOverdrive,
  setIsOverdrive,
  isAiActive,
  setIsAiActive,
  systemVersion
}: SystemSettingsProps) {
  return (
    <div className="p-6 h-full overflow-y-auto space-y-8 custom-scrollbar">
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <Cpu size={16} className="text-[#00ffcc]" />
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-300">Compute Parameters</h2>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-zinc-500 uppercase font-bold">Carrier Bias (Modulation)</label>
              <span className="text-xs font-mono text-[#00ffcc]">{(carrierBias * 0.5).toFixed(1)} GHz</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={carrierBias}
              onChange={(e) => setCarrierBias(parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#00ffcc]"
            />
            <p className="text-[9px] text-zinc-600 italic">Adjusts the fundamental frequency offset for the nodal reservoir.</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Zap size={14} className={isOverdrive ? "text-yellow-400" : "text-zinc-600"} />
                <span className="text-[10px] font-bold uppercase tracking-tight">Tachyonic Overdrive</span>
              </div>
              <p className="text-[9px] text-zinc-500">Forces high-frequency excitations. [+350% Hashrate / -40% Coherence]</p>
            </div>
            <button 
              onClick={() => setIsOverdrive(!isOverdrive)}
              className={`w-12 h-6 rounded-full relative transition-colors ${isOverdrive ? 'bg-yellow-400' : 'bg-zinc-800'}`}
            >
              <motion.div 
                animate={{ x: isOverdrive ? 26 : 4 }}
                className="absolute top-1 left-0 w-4 h-4 rounded-full bg-black shadow-lg"
              />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <Activity size={16} className="text-[#ffff00]" />
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-300">Substrate Interface</h2>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className={isAiActive ? "text-green-400" : "text-zinc-600"} />
              <span className="text-[10px] font-bold uppercase tracking-tight">VOID_LINK: AI Resonance</span>
            </div>
            <p className="text-[9px] text-zinc-500">Enables Gemini-powered insights from the liquid substrate.</p>
          </div>
          <button 
            onClick={() => setIsAiActive(!isAiActive)}
            className={`w-12 h-6 rounded-full relative transition-colors ${isAiActive ? 'bg-green-400' : 'bg-zinc-800'}`}
          >
            <motion.div 
              animate={{ x: isAiActive ? 26 : 4 }}
              className="absolute top-1 left-0 w-4 h-4 rounded-full bg-black shadow-lg"
            />
          </button>
        </div>
      </div>

      <div className="pt-4 mt-8 border-t border-white/5 opacity-50">
        <div className="flex items-center gap-2 mb-2">
          <Info size={12} className="text-zinc-500" />
          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">System Info</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-[9px] font-mono text-zinc-400">
          <div className="space-y-1">
            <p>OS_VERSION: v{systemVersion.toFixed(2)}_PRO</p>
            <p>KERNEL_TYPE: LIQUID_NODAL_v3</p>
          </div>
          <div className="space-y-1 text-right">
            <p>BRIDGE_STATE: READY</p>
            <p>UPTIME: {Math.floor(performance.now() / 1000)}s</p>
          </div>
        </div>
      </div>
    </div>
  );
}

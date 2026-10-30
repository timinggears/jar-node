import { useState, useEffect } from 'react';
import { Cpu, Zap, Activity, Info, ShieldCheck, HardDrive, ExternalLink, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import MemoryVault from './MemoryVault';

interface SystemSettingsProps {
  carrierBias: number;
  setCarrierBias: (val: number) => void;
  isOverdrive: boolean;
  setIsOverdrive: (val: boolean) => void;
  isAiActive: boolean;
  setIsAiActive: (val: boolean) => void;
  isEntangled: boolean;
  setIsEntangled: (val: boolean) => void;
  isBoost2B: boolean;
  setIsBoost2B: (val: boolean) => void;
  systemVersion: number;
  currentFreq: number;
  onSendCommand?: (cmd: string) => void;
  vault: any[];
  onSaveVault: () => void;
  onLoadVault: (id: string) => void;
  onDeleteVault: (id: string) => void;
  poolUrl: string;
  minerUser: string;
  minerPass: string;
  onUpdateMinerConfig: (pool: string, user: string, pass: string) => void;
  pythonBridgeActive?: boolean;
  onTogglePythonBridge?: (active: boolean) => void;
}

export default function SystemSettings({
  carrierBias,
  setCarrierBias,
  isOverdrive,
  setIsOverdrive,
  isAiActive,
  setIsAiActive,
  isEntangled,
  setIsEntangled,
  isBoost2B,
  setIsBoost2B,
  systemVersion,
  currentFreq,
  onSendCommand,
  vault,
  onSaveVault,
  onLoadVault,
  onDeleteVault,
  poolUrl,
  minerUser,
  minerPass,
  onUpdateMinerConfig,
  pythonBridgeActive = false,
  onTogglePythonBridge
}: SystemSettingsProps) {
  const freqKHz = currentFreq / 1000;

  const [localPool, setLocalPool] = useState(poolUrl);
  const [localUser, setLocalUser] = useState(minerUser);
  const [localPass, setLocalPass] = useState(minerPass);

  useEffect(() => {
    setLocalPool(poolUrl);
  }, [poolUrl]);

  useEffect(() => {
    setLocalUser(minerUser);
  }, [minerUser]);

  useEffect(() => {
    setLocalPass(minerPass);
  }, [minerPass]);
  
  return (
    <div className="p-6 h-full overflow-y-auto space-y-8 custom-scrollbar pb-24">
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <Cpu size={16} className="text-[#00ffcc]" />
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-300">Compute Parameters</h2>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Resonance Frequency (GHz)</label>
              <span className="text-xs font-mono text-[#00ffcc] animate-pulse">{carrierBias.toFixed(1)} GHz</span>
            </div>
            <input 
              type="range" 
              min="1.0" 
              max="400.0" 
              step="1.0"
              value={carrierBias}
              onChange={(e) => setCarrierBias(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#00ffcc]"
            />
            <p className="text-[9px] text-zinc-600 italic leading-relaxed">
              Direct tuning: 1.0 to 400.0 GHz. Quantum logic substrate alignment active and unlimited.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-blue-500 uppercase font-bold">Resonance Octaves</label>
              <span className="text-xs font-mono text-blue-400">
                v1.47_LIVE: {(currentFreq / 1000).toFixed(4)} GHz
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[24, 100, 250, 400].map(h => {
                const target = 1000 * h;
                const isActive = Math.abs(currentFreq - target) < 25000;
                return (
                   <button 
                    key={h} 
                    onClick={() => setCarrierBias(h)}
                    className={`border p-2 rounded text-center transition-all duration-300 ${isActive ? 'bg-blue-900/40 border-blue-400/50 ring-1 ring-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.3)]' : 'bg-white/5 border-white/5 opacity-40 hover:bg-white/10'}`}
                  >
                    <p className={`text-[7px] uppercase ${isActive ? 'text-blue-300' : 'text-zinc-600'}`}>
                      {`${h} GHz`}
                    </p>
                    <p className={`text-[9px] font-mono ${isActive ? 'text-white' : 'text-zinc-400'}`}>{h.toFixed(1)}G</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Zap size={14} className={isOverdrive ? "text-[#00ffcc]" : "text-zinc-600"} />
                <span className="text-[10px] font-bold uppercase tracking-tight">Tachyonic Overdrive</span>
              </div>
              <p className="text-[9px] text-zinc-500">Forces high-frequency excitations. Access multi-THz harmonics.</p>
            </div>
            <button 
              onClick={() => setIsOverdrive(!isOverdrive)}
              className={`w-12 h-6 rounded-full relative transition-colors ${isOverdrive ? 'bg-[#00ffcc]' : 'bg-zinc-800'}`}
            >
              <motion.div 
                initial={{ x: 4 }}
                animate={{ x: isOverdrive ? 26 : 4 }}
                className="absolute top-1 left-0 w-4 h-4 rounded-full bg-black shadow-lg"
              />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <Activity size={16} className="text-[#00ffcc]" />
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
              initial={{ x: 4 }}
              animate={{ x: isAiActive ? 26 : 4 }}
              className="absolute top-1 left-0 w-4 h-4 rounded-full bg-black shadow-lg"
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity size={14} className={isEntangled ? "text-purple-400" : "text-zinc-600"} />
              <span className="text-[10px] font-bold uppercase tracking-tight">Quantum Entanglement</span>
            </div>
            <p className="text-[9px] text-zinc-500">Links Resonance Bias with the Nodal Flux harmonics.</p>
          </div>
          <button 
            onClick={() => setIsEntangled(!isEntangled)}
            className={`w-12 h-6 rounded-full relative transition-colors ${isEntangled ? 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-zinc-800'}`}
          >
            <motion.div 
              initial={{ x: 4 }}
              animate={{ x: isEntangled ? 26 : 4 }}
              className="absolute top-1 left-0 w-4 h-4 rounded-full bg-black shadow-lg"
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg border-cyan-500/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap size={14} className={isBoost2B ? "text-cyan-400" : "text-zinc-600"} />
              <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-200">2B Singularity Uplink</span>
            </div>
            <p className="text-[9px] text-zinc-500">Excites virtual substrate hashrate to 2 Billion H/s.</p>
          </div>
          <button 
            onClick={() => setIsBoost2B(!isBoost2B)}
            className={`w-12 h-6 rounded-full relative transition-colors ${isBoost2B ? 'bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'bg-zinc-800'}`}
          >
            <motion.div 
              initial={{ x: 4 }}
              animate={{ x: isBoost2B ? 26 : 4 }}
              className="absolute top-1 left-0 w-4 h-4 rounded-full bg-black shadow-lg"
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg border-emerald-500/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Cpu size={14} className={pythonBridgeActive ? "text-emerald-400" : "text-zinc-600"} />
              <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-200">Python Serial Tunnel</span>
            </div>
            <p className="text-[9px] text-zinc-500">
              {pythonBridgeActive ? "Bridged & Streaming virtual Pico telemetry over Websockets." : "Spawns Python tunnel process to pipe serial flow."}
            </p>
          </div>
          <button 
            onClick={() => onTogglePythonBridge?.(!pythonBridgeActive)}
            className={`w-12 h-6 rounded-full relative transition-colors ${pythonBridgeActive ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-zinc-800'}`}
          >
            <motion.div 
              initial={{ x: 4 }}
              animate={{ x: pythonBridgeActive ? 26 : 4 }}
              className="absolute top-1 left-0 w-4 h-4 rounded-full bg-black shadow-lg"
            />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => onSendCommand?.('SAVE')}
            className="flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/5 rounded-lg hover:bg-[#00ffcc]/10 group transition-all"
          >
            <ShieldCheck size={14} className="text-zinc-500 group-hover:text-[#00ffcc]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white">Save State</span>
          </button>
          <button 
            onClick={() => onSendCommand?.('LOAD')}
            className="flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/5 rounded-lg hover:bg-blue-500/10 group transition-all"
          >
            <Activity size={14} className="text-zinc-500 group-hover:text-blue-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white">Load State</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <HardDrive size={16} className="text-orange-400" />
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-300">Crypto Miner Identity (unMineable)</h2>
        </div>
        
        {(() => {
          const userParts = localUser.split(':');
          const hasCoin = userParts.length > 1 && userParts[0].length >= 2 && userParts[0].length <= 6;
          const detectedCoin = hasCoin ? userParts[0].toUpperCase() : '';
          const addressPart = hasCoin ? userParts.slice(1).join(':').split('.')[0].split('#')[0].trim() : '';
          const unmineableUrl = hasCoin && addressPart.length > 5 
            ? `https://unmineable.com/coins/${detectedCoin}/address/${addressPart}` 
            : null;

          return (
            <div className="p-4 bg-orange-950/20 border border-orange-500/20 rounded-lg space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono uppercase text-orange-400 font-bold tracking-wider">Pool Stratum URL</label>
                <input 
                  type="text"
                  value={localPool}
                  onChange={(e) => setLocalPool(e.target.value)}
                  placeholder="rx.unmineable.com:3333"
                  className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-mono uppercase text-orange-400 font-bold tracking-wider">Wallet / Username</label>
                  <span className="text-[8px] font-mono text-zinc-500">Format: COIN:ADDRESS.WorkerName#Referral</span>
                </div>
                <input 
                  type="text"
                  value={localUser}
                  onChange={(e) => setLocalUser(e.target.value)}
                  placeholder="e.g. DOGE:D8vNv...JarSingularity#qh6m-7m98"
                  className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
                />

                {/* Coin prefix validation indicator */}
                {!hasCoin ? (
                  <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[8.5px] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                      <AlertTriangle size={12} className="text-amber-400 shrink-0" />
                      <span>Missing Coin & Wallet Address for unMineable!</span>
                    </div>
                    <p className="text-zinc-400 leading-relaxed">
                      unMineable requires your payout coin and wallet address in the format: <span className="text-amber-300 font-mono font-bold">COIN:YOUR_WALLET.Worker#Ref</span>.
                      Without this, the pool accepts your connection but unMineable cannot track your worker or credit your coins!
                    </p>
                    <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                      <span className="text-[7.5px] uppercase text-zinc-500 font-bold">Quick format templates:</span>
                      {['DOGE', 'XMR', 'SOL', 'BTC', 'LTC'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            const workerSuffix = localUser.includes('.') ? localUser.slice(localUser.indexOf('.')) : '.JarSingularity#qh6m-7m98';
                            setLocalUser(`${c}:YOUR_${c}_ADDRESS${workerSuffix}`);
                          }}
                          className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[7.5px] font-mono font-bold transition-all cursor-pointer"
                        >
                          +{c}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-[8px] flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                      <span>Valid unMineable syntax: <strong>{detectedCoin}</strong> coin to address <code className="text-emerald-300 font-mono">{addressPart.slice(0, 10)}...</code></span>
                    </div>
                    {unmineableUrl && (
                      <a 
                        href={unmineableUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 font-bold text-[8px] rounded transition-all"
                      >
                        <span>Check Stats</span>
                        <ExternalLink size={9} />
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono uppercase text-orange-400 font-bold tracking-wider">Worker Password</label>
                <input 
                  type="text"
                  value={localPass}
                  onChange={(e) => setLocalPass(e.target.value)}
                  placeholder="x"
                  className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
                />
              </div>

              <button
                onClick={() => onUpdateMinerConfig(localPool, localUser, localPass)}
                className="w-full py-2 bg-orange-500/20 hover:bg-orange-500/35 border border-orange-500/40 hover:border-orange-500 text-orange-300 font-black uppercase text-[9px] tracking-widest rounded-md active:scale-[0.98] transition-all cursor-pointer"
              >
                Apply Config & Reconnect Miner
              </button>
            </div>
          );
        })()}

        <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-2">
          <div className="flex items-center gap-1.5">
            <Info size={12} className="text-orange-400" />
            <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-tight">Why workers don't show up immediately on unMineable:</span>
          </div>
          <ul className="text-[8.5px] text-zinc-400 space-y-1 list-disc pl-4 leading-relaxed font-mono">
            <li>
              <strong className="text-zinc-200">1. Address Format:</strong> unMineable indexes workers strictly by <span className="text-orange-300">COIN:ADDRESS</span>. A generic username like <code className="text-zinc-500">1683397408...</code> is ignored by the website search.
            </li>
            <li>
              <strong className="text-zinc-200">2. First Accepted Share Rule:</strong> unMineable will <em>never</em> show a worker as online until it submits its <strong>first valid share</strong> (<code className="text-emerald-400">accepted 1/0</code> at diff 100,001).
            </li>
            <li>
              <strong className="text-zinc-200">3. CPU Light Mode Speed:</strong> 2 lightweight container CPU threads hash at ~50–120 H/s. Finding a share at difficulty 100,001 takes ~10–20 minutes of continuous hashing.
            </li>
          </ul>
        </div>
      </div>

      <div className="pt-6 border-t border-white/10">
        <MemoryVault 
          vault={vault} 
          onSave={onSaveVault} 
          onLoad={onLoadVault} 
          onDelete={onDeleteVault} 
        />
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

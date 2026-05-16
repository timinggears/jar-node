/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Save, HardDrive, Trash2, Zap } from 'lucide-react';

interface VaultEntry {
  id: string;
  bias: number;
  overdrive: boolean;
  depth: number;
  timestamp: number;
}

interface MemoryVaultProps {
  vault: VaultEntry[];
  onSave: () => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function MemoryVault({ vault, onSave, onLoad, onDelete }: MemoryVaultProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-[#00ffcc]" />
          <h3 className="text-xs font-bold tracking-widest text-[#00ffcc] uppercase">Memory Vault</h3>
        </div>
        <button
          onClick={onSave}
          className="flex items-center gap-1 px-2 py-1 bg-[#00ffcc]/10 hover:bg-[#00ffcc]/20 border border-[#00ffcc]/30 rounded text-[10px] text-[#00ffcc] transition-colors"
        >
          <Save className="w-3 h-3" />
          ARCHIVE CURRENT
        </button>
      </div>

      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
        {vault.length === 0 ? (
          <div className="text-[10px] text-zinc-500 italic py-4 text-center border border-white/5 rounded-lg">
            No resonance fingerprints archived.
          </div>
        ) : (
          vault.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 bg-white/5 border border-white/10 rounded-lg hover:border-[#00ffcc]/30 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-[#00ffcc]">FP_{entry.id}</span>
                <span className="text-[8px] text-zinc-500">{new Date(entry.timestamp).toLocaleTimeString()}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="space-y-1">
                   <p className="text-[8px] text-zinc-500">BIAS</p>
                   <p className="text-[10px] text-white font-mono">{entry.bias.toFixed(1)} GHz</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[8px] text-zinc-500">DRIVE</p>
                   <p className={`text-[10px] font-mono ${entry.overdrive ? 'text-orange-400' : 'text-zinc-400'}`}>
                     {entry.overdrive ? 'OVERDRIVE' : 'NORMAL'}
                   </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-1">
                   <Zap className="w-3 h-3 text-yellow-400 opacity-50" />
                   <span className="text-[9px] text-zinc-400">Depth: {entry.depth.toFixed(2)} Φ</span>
                 </div>
                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button
                     onClick={() => onLoad(entry.id)}
                     className="px-2 py-1 bg-[#00ffcc]/20 hover:bg-[#00ffcc]/30 text-[#00ffcc] text-[9px] rounded"
                   >
                     RESTORE
                   </button>
                   <button
                     onClick={() => onDelete(entry.id)}
                     className="p-1 px-2 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded"
                   >
                     <Trash2 className="w-3 h-3" />
                   </button>
                 </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

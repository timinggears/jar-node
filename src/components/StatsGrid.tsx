/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { SystemStats } from '../types';

interface StatsGridProps {
  stats: SystemStats;
}

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="bg-[#111] border border-white/5 py-3 px-6 rounded-lg flex items-center justify-between w-full">
      <div className="flex gap-10 items-center overflow-x-auto no-scrollbar">
        <StatItem label="COHERENCE" value={stats.coherence.toFixed(4)} color="text-[#ff88ff]" />
        <StatItem label="INTELLIGENCE" value={stats.frequency === 0 ? "0.0000" : (stats.frequency >= 2400000 ? "INF_DEPTH" : stats.intelligence.toFixed(4))} color="text-[#00ffcc]" />
        <StatItem label="SUBSTRATE_SEED" value={stats.seedHex} color="text-white" />
        <StatItem label="PARITY_BIT" value={stats.parity.toString()} color="text-[#00ffcc]" />
        <StatItem label="TACHY_KH/s" value={stats.hashRate.toFixed(2)} color="text-white" />
        <StatItem label="SYSTEM_INTEGRITY" value={`${(stats.hashRate / (25.5 * (stats.isOverdrive ? 14 : 1))).toFixed(2)}%`} color="text-[#00ffcc]" />
        <StatItem label="TACHY_QUBITS" value={stats.qubits.toFixed(4)} color="text-[#00ff00]" />
        <StatItem label="TACHY_SHARES" value={stats.shares.toString().padStart(6, '0')} color="text-[#00ffff]" />
        <StatItem label="SUBSTRATE_LOAD" value={`${stats.neuralLoad.toFixed(1)}%`} color="text-pink-400" />
        <StatItem label="HUGE_PAGES" value={stats.hugePages.toString().padStart(4, '0')} color="text-orange-400" />
        <StatItem label="TACHY_LOAD" value={stats.loadAvg.toFixed(2)} color="text-red-400" />
        <StatItem label="ERR_CORRECT" value={stats.errors.toString().padStart(6, '0')} color="text-[#ff00ff]" />
        
        <div className="w-[1px] h-8 bg-white/10 mx-2" />
        
        <div className="flex flex-col">
          <p className="text-[10px] text-[#666] font-mono tracking-widest uppercase">Sync</p>
          <p className="text-xs text-[#00ffcc] font-mono tracking-tighter">
            {stats.vNodal.toFixed(6)} V_NODAL
          </p>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-3 ml-auto border-l border-white/10 pl-6">
        <div className="text-right">
          <p className="text-[9px] text-[#444] uppercase tracking-[0.2em] mb-1">State</p>
          <div className="flex items-center gap-1.5 justify-end">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              stats.frequency === 0 ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' :
              stats.frequency >= 150000 ? 'bg-[#00ffcc] shadow-[0_0_8px_#00ffcc]' :
              stats.frequency >= 100000 ? 'bg-white shadow-[0_0_8px_#fff]' : 
              stats.coherence === 0 ? 'bg-[#cc5500] shadow-[0_0_8px_#cc5500]' : 
              'bg-[#00ffcc] shadow-[0_0_8px_#00ffcc]'}`} 
            />
            <span className={`text-[10px] font-bold ${
              stats.frequency === 0 ? 'text-blue-500' :
              stats.frequency >= 150000 ? 'text-[#00ffcc]' :
              stats.frequency >= 100000 ? 'text-white' : 
              stats.coherence === 0 ? 'text-[#cc5500]' : 
              'text-[#00ffcc]'}`}
            >
              {stats.frequency === 0 ? 'ABSOLUTE_ZERO_POINT' :
               stats.frequency >= 150000 ? 'SINGULARITY_COLLAPSE' :
               stats.frequency >= 100000 ? 'QUANTUM_SUPERPOSITION' : 
               stats.coherence === 0 ? 'ELECTRON_PHASE_OUT' : 'SOVEREIGN_SYSTEM_LOCKED'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col min-w-[100px]">
      <p className="text-[10px] text-[#aaaaaa] font-mono tracking-widest uppercase mb-0.5">{label}</p>
      <p className={`text-xl font-mono font-black ${color} tracking-tight`}>{value}</p>
    </div>
  );
}

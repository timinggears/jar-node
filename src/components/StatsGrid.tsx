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
    <div className="flex flex-col gap-6 h-full">
      {/* Top row: Big Primary Stats */}
      <div className="grid grid-cols-2 gap-4">
        {/* Coherence */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f0f0f] p-6 rounded-xl border border-[#ff88ff20] flex flex-col justify-between h-[200px]"
        >
          <p className="text-xs text-[#ff88ff] font-bold tracking-[0.2em] uppercase">Coherence</p>
          <div>
            <p className="text-5xl font-mono font-bold text-[#ff88ff] leading-none">
              {stats.coherence.toFixed(2)}
            </p>
            <div className="w-full h-1.5 bg-[#222] mt-4 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#ff88ff]"
                initial={{ width: 0 }}
                animate={{ width: `${stats.coherence * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Intelligence */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0f0f0f] p-6 rounded-xl border border-[#ffff0020] flex flex-col justify-between h-[200px]"
        >
          <p className="text-xs text-[#ffff00] font-bold tracking-[0.2em] uppercase">Intelligence</p>
          <div>
            <p className="text-5xl font-mono font-bold text-[#ffff00] leading-none">
              {stats.intelligence.toFixed(1)}
            </p>
            <p className="text-[10px] text-[#666] font-mono mt-3 racking-wider">
              {stats.intelligence > 42 ? '+0.45 JAR_INCREMENT' : 'INITIALIZING_NODAL_SYNERGY'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Telemetry Stream Box */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#0f0f0f] p-6 rounded-xl border border-[#ffffff08] flex-1 flex flex-col gap-6"
      >
        <h3 className="text-[10px] text-[#666] tracking-[0.3em] uppercase border-b border-[#ffffff10] pb-2">
          Telemetry Stream
        </h3>
        
        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
          <TelemetryItem label="Throughput (PH/s)" value={(stats.hashRate / 1000).toFixed(2)} color="text-white" />
          <TelemetryItem label="Fundamental (Hz)" value={(stats.frequency ?? 35000).toString()} color="text-[#ffff00]" />
          <TelemetryItem label="Qubit Density" value={stats.qubits.toFixed(1)} color="text-[#00ff00]" />
          <TelemetryItem label="Accepted Shares" value={stats.shares.toString()} color="text-[#00ffff]" />
        </div>

        {/* Action button integrated into the telemetry area or below */}
        <div className="pt-4 mt-auto">
           <div className="flex items-center gap-2 text-[9px] text-white/20 uppercase tracking-[0.2em]">
             <span className="w-1.5 h-1.5 rounded-full bg-[#00ffcc] animate-pulse" />
             Matrix_Sync: Validated
           </div>
        </div>
      </motion.div>
    </div>
  );
}

function TelemetryItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-[#444] uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-mono font-bold ${color}`}>{value}</p>
    </div>
  );
}

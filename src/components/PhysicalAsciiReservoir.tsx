/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Binary, Zap, Trash2, Shield, Activity, Share2, HelpCircle } from 'lucide-react';

interface AsciiPacket {
  id: string;
  ascii: number;
  char: string;
  stability: number;
  timestamp: number;
  type: 'single' | 'combined';
}

interface ReservoirProps {
  coherence: number;
  intelligence: number;
  phaseOut: number;
  voltage: number;
  jitter: number;
  hardwareState: 'disconnected' | 'bridged' | 'connected';
  onAddLog?: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function PhysicalAsciiReservoir({
  coherence,
  intelligence,
  phaseOut,
  voltage,
  jitter,
  hardwareState,
  onAddLog
}: ReservoirProps) {
  const [memoryBank, setMemoryBank] = useState<Record<string, AsciiPacket>>({});
  const [logEntries, setLogEntries] = useState<{ id: string; text: string; type: 'physical' | 'combined' }[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const packetCountRef = useRef(0);
  const prevVoltageRef = useRef(voltage);

  // Auto-scroll the logger terminal to the bottom when new logs appear
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logEntries]);

  // Handle packet generation of Physical JAR state
  useEffect(() => {
    // Generate ASCII packets on voltage changes or periodic cycles
    // (Ensure we don't floods state machine too aggressively)
    if (voltage === prevVoltageRef.current) return;
    prevVoltageRef.current = voltage;

    // 1. Calculate the ASCII mapped value: int(65 + (voltage * 28) % 58)
    const asciiVal = Math.floor(65 + ((voltage * 28) % 58));
    const character = String.fromCharCode(asciiVal);

    // 2. Compute stability under PRC
    const stability = Math.max(0.1, coherence * 1.8);
    const packetId = `pkt_${packetCountRef.current++}`;

    const newPacket: AsciiPacket = {
      id: packetId,
      ascii: asciiVal,
      char: character,
      stability: stability,
      timestamp: Date.now(),
      type: 'single'
    };

    setMemoryBank(prev => {
      const updated = { ...prev, [packetId]: newPacket };

      // 3. Keep memory bank capped to latest 24 entries to prevent visual bloat and browser lag
      const keys = Object.keys(updated);
      if (keys.length > 24) {
        delete updated[keys[0]];
      }
      return updated;
    });

    const logMsg = `PHYSICAL → ASCII: "${character}" (code ${asciiVal}) | V: ${voltage.toFixed(4)}V | Stability: ${stability.toFixed(3)}`;
    setLogEntries(prev => [...prev.slice(-30), { id: `log_${Date.now()}_${Math.random()}`, text: logMsg, type: 'physical' }]);

    // Trigger combined packet logic conditionally if coherence > 0.68 and random roll passes
    if (coherence > 0.68 && Math.random() < coherence * 0.6) {
      setTimeout(() => {
        setMemoryBank(prev => {
          const keys = Object.keys(prev);
          if (keys.length >= 2) {
            const p1 = prev[keys[keys.length - 1]];
            const p2 = prev[keys[keys.length - 2]];

            // Combined ASCII formula from Python spec: (p1.ascii + p2.ascii) % 58 + 65
            const combAscii = ((p1.ascii + p2.ascii) % 58) + 65;
            const combChar = String.fromCharCode(combAscii);
            const combId = `comb_${packetCountRef.current++}`;

            const combinedPacket: AsciiPacket = {
              id: combId,
              ascii: combAscii,
              char: combChar,
              stability: (p1.stability + p2.stability) * 0.7,
              timestamp: Date.now(),
              type: 'combined'
            };

            const afterComb = { ...prev, [combId]: combinedPacket };
            
            // Limit to original size limit
            const combKeys = Object.keys(afterComb);
            if (combKeys.length > 24) {
              delete afterComb[combKeys[0]];
            }

            const combineMsg = `COMBINED → RESONANCE CHARACTER: "${combChar}" | Combined Stability: ${combinedPacket.stability.toFixed(3)} (Coherence: ${coherence.toFixed(3)})`;
            
            setLogEntries(prevLogs => [...prevLogs.slice(-30), { 
              id: `log_${Date.now()}_comb`, 
              text: combineMsg, 
              type: 'combined' 
            }]);

            if (onAddLog) {
              onAddLog(`[ASCII_COMBINATION]: Spatially combined ASCII "${combChar}" from chaotic attractors`, 'success');
            }

            return afterComb;
          }
          return prev;
        });
      }, 50);
    }
  }, [voltage, coherence, onAddLog]);

  const clearBank = () => {
    setMemoryBank({});
    setLogEntries(prev => [...prev, { id: `log_${Date.now()}_clear`, text: '--- MEMORY BANK PURGED ---', type: 'physical' }]);
  };

  return (
    <div className="h-full flex flex-col bg-[#050505] text-zinc-300 font-mono text-xs select-none p-4 gap-4 overflow-y-auto" id="ascii-reservoir-container">
      {/* Header bar and connection stats */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[#ff88ff] animate-pulse" />
          <h2 className="text-sm font-black tracking-widest text-[#ff88ff]">PHYSICAL ASCII RESERVOIR v0.10</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] uppercase">
            <span className={`w-2 h-2 rounded-full ${hardwareState === 'connected' ? 'bg-[#00ffcc] animate-ping' : hardwareState === 'bridged' ? 'bg-orange-500' : 'bg-red-500'}`} />
            <span className="text-zinc-400">
              {hardwareState === 'connected' ? 'PICO ACTIVE' : hardwareState === 'bridged' ? 'BRIDGED (SIM)' : 'OILSIM ACTIVE'}
            </span>
          </div>
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="p-1 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white transition-colors"
            title="Help information"
          >
            <HelpCircle size={14} />
          </button>
        </div>
      </div>

      {showHelp && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-lg text-[10px] text-indigo-200 leading-relaxed"
        >
          <strong className="text-pink-300 block mb-1">How raw voltage converts to silicon thoughts:</strong>
          Our mineral oil reservoir and physical carbon particles act as active, high-dimensional nodes.
          Voltage fluctuations input through the Pico are translated into raw ASCII values. When <strong className="text-yellow-300">Coherence</strong> is high,
          the system triggers <em className="italic">Combined Attractor States</em>—merging single waveforms into advanced combined coordinates.
        </motion.div>
      )}

      {/* Grid of central metrics */}
      <div className="grid grid-cols-3 gap-3">
        {/* Coherence */}
        <div className="p-3 bg-zinc-900/40 border border-[#ff88ff]/20 rounded-lg flex flex-col justify-between" id="stat-coherence">
          <span className="text-[9px] tracking-wider text-zinc-500 font-black uppercase">coherence</span>
          <div className="my-1.5 text-lg font-black text-[#ff88ff] drop-shadow-[0_0_8px_rgba(255,136,255,0.4)]">
            {coherence.toFixed(3)}
          </div>
          <div className="w-full bg-[#ff88ff]/10 h-1 rounded overflow-hidden">
            <div className="h-full bg-[#ff88ff]" style={{ width: `${coherence * 100}%` }} />
          </div>
        </div>

        {/* Intelligence */}
        <div className="p-3 bg-zinc-900/40 border border-[#ffff00]/20 rounded-lg flex flex-col justify-between" id="stat-intelligence">
          <span className="text-[9px] tracking-wider text-zinc-500 font-black uppercase">intelligence score</span>
          <div className="my-1.5 text-lg font-black text-[#ffff00] drop-shadow-[0_0_8px_rgba(255,255,0,0.4)]">
            {intelligence.toFixed(1)}
          </div>
          <div className="w-full bg-[#ffff00]/10 h-1 rounded overflow-hidden">
            <div className="h-full bg-[#ffff00]" style={{ width: `${Math.min(100, (intelligence / 120) * 100)}%` }} />
          </div>
        </div>

        {/* Phase Out */}
        <div className="p-3 bg-zinc-900/40 border border-[#00ccff]/20 rounded-lg flex flex-col justify-between" id="stat-phaseout">
          <span className="text-[9px] tracking-wider text-zinc-500 font-black uppercase">phase-out angle</span>
          <div className="my-1.5 text-lg font-black text-[#00ccff] drop-shadow-[0_0_8px_rgba(0,204,255,0.4)]">
            {phaseOut >= 0 ? '+' : ''}{phaseOut.toFixed(1)}°
          </div>
          <div className="w-full bg-zinc-800 h-1 rounded overflow-hidden relative">
            <div 
              className="absolute top-0 bottom-0 bg-[#00ccff] w-1" 
              style={{ left: `${50 + (phaseOut / 200) * 50}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Memory Bank Visual Array */}
      <div className="flex-1 flex flex-col min-h-[160px] gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Binary className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[9px] font-black uppercase text-zinc-400">active memory bank cells ({Object.keys(memoryBank).length}/24)</span>
          </div>
          <button 
            onClick={clearBank}
            className="flex items-center gap-1 hover:bg-red-500/10 hover:text-red-400 border border-white/5 hover:border-red-500/30 px-2 py-0.5 rounded text-[8px] tracking-widest text-zinc-500 uppercase transition-all"
            title="Wipe current reservoir state"
          >
            <Trash2 size={10} />
            WIPE BANK
          </button>
        </div>

        {/* The Grid */}
        <div className="flex-1 bg-[#020202] border border-white/5 rounded-lg p-2.5 overflow-y-auto max-h-[190px]">
          {Object.keys(memoryBank).length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[10px] text-zinc-600 gap-1.5 py-8">
              <Zap className="w-4 h-4 text-zinc-700 animate-pulse" />
              <span>Awaiting physical voltage oscillation stream...</span>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              <AnimatePresence>
                {Object.values(memoryBank).map((pkt: AsciiPacket) => (
                  <motion.div
                    key={pkt.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className={`flex flex-col p-2 bg-white/5 border rounded-md relative ${
                      pkt.type === 'combined'
                        ? 'border-[#ff88ff]/40 bg-pink-950/10 shadow-[inner_0_0_10px_rgba(255,136,255,0.15)]'
                        : 'border-white/5 hover:border-[#00ffcc]/30'
                    }`}
                  >
                    <div className="text-[7px] text-zinc-600 tracking-tighter uppercase font-bold truncate">
                      {pkt.id}
                    </div>
                    <div className="my-1 text-center font-sans text-xl font-extrabold text-[#f3f4f6]">
                      {pkt.char}
                    </div>
                    <div className="flex flex-col gap-0.5 mt-auto">
                      <div className="flex items-center justify-between text-[7px] text-zinc-500">
                        <span>STAB</span>
                        <span>{pkt.stability.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-0.5 rounded overflow-hidden">
                        <div 
                          className={`h-full ${pkt.type === 'combined' ? 'bg-[#ff88ff]' : 'bg-[#00ffcc]'}`} 
                          style={{ width: `${Math.min(100, (pkt.stability / 1.8) * 100)}%` }} 
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Live ASCII Stream Feed */}
      <div className="h-32 flex flex-col bg-[#020202] border border-white/10 rounded-lg overflow-hidden shrink-0">
        <div className="h-6 bg-white/5 border-b border-white/5 flex items-center justify-between px-3 text-[8px] uppercase tracking-widest font-black text-zinc-500">
          <span>Real-time Reservoir Stream</span>
          <span className="text-[#00ffcc] animate-pulse">Running</span>
        </div>
        <div 
          ref={terminalRef}
          className="flex-1 p-2 overflow-y-auto space-y-1 font-mono text-[9px] leading-relaxed select-text" 
          style={{ scrollBehavior: 'smooth' }}
        >
          {logEntries.map((log) => (
            <div 
              key={log.id} 
              className={
                log.type === 'combined' 
                  ? 'text-[#ff88ff] border-l-2 border-[#ff88ff] pl-1.5 py-0.5 bg-pink-950/10' 
                  : 'text-[#00ccff]'
              }
            >
              {log.text}
            </div>
          ))}
          {logEntries.length === 0 && (
            <div className="text-zinc-600 italic">No cycles parsed yet. Initialize reservoir input voltage ...</div>
          )}
        </div>
      </div>
    </div>
  );
}

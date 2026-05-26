/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Binary, Zap, Trash2, HelpCircle, Cpu, Play, Sparkles, RefreshCw, Terminal, CheckCircle2, Sliders, Workflow, Layers, Activity, Wand2, ShieldAlert } from 'lucide-react';

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
  bias: number;
  onTuneBias: (bias: number) => void;
}

export default function PhysicalAsciiReservoir({
  coherence,
  intelligence,
  phaseOut,
  voltage,
  jitter,
  hardwareState,
  onAddLog,
  bias,
  onTuneBias
}: ReservoirProps) {
  const [memoryBank, setMemoryBank] = useState<Record<string, AsciiPacket>>({});
  const [logEntries, setLogEntries] = useState<{ id: string; text: string; type: 'physical' | 'combined' }[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  
  // OS & Computational States
  const [activeTab, setActiveTab] = useState<'monitor' | 'processor'>('monitor');
  const [activeTask, setActiveTask] = useState<'xor' | 'hasher' | 'oracle'>('xor');
  const [xorBit1, setXorBit1] = useState<0 | 1>(0);
  const [xorBit2, setXorBit2] = useState<0 | 1>(1);
  const [hashInput, setHashInput] = useState<string>('Silicon Ghost');
  const [oracleQuery, setOracleQuery] = useState<string>('Will the attractors align?');
  const [computeStatus, setComputeStatus] = useState<'idle' | 'executing' | 'completed'>('idle');
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [compResult, setCompResult] = useState<string | null>(null);
  const [accuracyEstimation, setAccuracyEstimation] = useState<number | null>(null);

  // Evolutionary & Morpheme States for Symbolic Evolution
  const [trigramHistory, setTrigramHistory] = useState<{ id: string; sequence: string; stability: number; timestamp: number }[]>([
    { id: 'tri_init_1', sequence: 'ΩΦΞ', stability: 1.25, timestamp: Date.now() - 5000 },
    { id: 'tri_init_2', sequence: '▲★▼', stability: 0.94, timestamp: Date.now() - 2000 }
  ]);
  const [morphicPhrases, setMorphicPhrases] = useState<{ id: string; word: string; confidence: number; timestamp: number }[]>([
    { id: 'morph_init_1', word: 'COILSIM', confidence: 84.5, timestamp: Date.now() - 8000 }
  ]);

  const terminalRef = useRef<HTMLDivElement>(null);
  const sandboxTerminalRef = useRef<HTMLDivElement>(null);
  const packetCountRef = useRef(0);
  const logIdCounterRef = useRef(0);
  const prevVoltageRef = useRef(voltage);
  const prevCombCharsRef = useRef<string>('');

  // Auto-scroll logic for logging streams
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logEntries]);

  useEffect(() => {
    if (sandboxTerminalRef.current) {
      sandboxTerminalRef.current.scrollTop = sandboxTerminalRef.current.scrollHeight;
    }
  }, [executionLogs]);

  // Handle packet generation of Physical JAR state
  useEffect(() => {
    if (voltage === prevVoltageRef.current) return;
    prevVoltageRef.current = voltage;

    const asciiVal = Math.floor(65 + ((voltage * 28) % 58));
    const character = String.fromCharCode(asciiVal);
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
      const keys = Object.keys(updated);
      if (keys.length > 24) {
        delete updated[keys[0]];
      }
      return updated;
    });

    const logMsg = `PHYSICAL → ASCII: "${character}" (code ${asciiVal}) | V: ${voltage.toFixed(4)}V | Stability: ${stability.toFixed(3)}`;
    const uniqueLogId = `log_${Date.now()}_raw_${logIdCounterRef.current++}_${Math.random().toString(36).substring(2, 9)}`;
    setLogEntries(prev => [...prev.slice(-30), { id: uniqueLogId, text: logMsg, type: 'physical' }]);

    if (coherence > 0.68 && Math.random() < coherence * 0.6) {
      setTimeout(() => {
        let combChar = '';
        let combineMsg = '';
        let hasCombined = false;

        setMemoryBank(prev => {
          const keys = Object.keys(prev);
          if (keys.length >= 2) {
            const p1 = prev[keys[keys.length - 1]];
            const p2 = prev[keys[keys.length - 2]];

            const combAscii = ((p1.ascii + p2.ascii) % 58) + 65;
            const combCharLocal = String.fromCharCode(combAscii);
            const combId = `comb_${packetCountRef.current++}`;

            const combinedPacket: AsciiPacket = {
              id: combId,
              ascii: combAscii,
              char: combCharLocal,
              stability: (p1.stability + p2.stability) * 0.7,
              timestamp: Date.now(),
              type: 'combined'
            };

            const afterComb = { ...prev, [combId]: combinedPacket };
            const combKeys = Object.keys(afterComb);
            if (combKeys.length > 24) {
              delete afterComb[combKeys[0]];
            }

            combChar = combCharLocal;
            combineMsg = `COMBINED → RESONANCE CHARACTER: "${combCharLocal}" | Combined Stability: ${combinedPacket.stability.toFixed(3)} (Coherence: ${coherence.toFixed(3)})`;
            hasCombined = true;

            return afterComb;
          }
          return prev;
        });

        // Execute side effects safely outside of the state updater
        if (hasCombined) {
          const uniqueCombId = `log_${Date.now()}_comb_${logIdCounterRef.current++}_${Math.random().toString(36).substring(2, 9)}`;
          setLogEntries(prevLogs => [...prevLogs.slice(-30), { 
            id: uniqueCombId, 
            text: combineMsg, 
            type: 'combined' 
          }]);

          if (onAddLog) {
            onAddLog(`[ASCII_COMBINATION]: Spatially combined ASCII "${combChar}" from chaotic attractors`, 'success');
          }

          // Complete Trigram & Morphic Word Evolution Engine:
          const updatedChars = (prevCombCharsRef.current + combChar).slice(-12);
          prevCombCharsRef.current = updatedChars;

          // 1. Trigram creation from every 3 combined characters
          if (updatedChars.length >= 3) {
            const rawTri = updatedChars.slice(-3);
            const charactersMap: Record<string, string> = {
              'A': 'Ω', 'B': 'Ψ', 'C': 'Ξ', 'D': 'Δ', 'E': 'Σ', 'F': 'Φ', 'G': 'Γ', 'H': 'Θ', 
              'I': 'Λ', 'J': 'Π', 'K': '██', 'L': '░', 'M': '▣', 'N': '✦', 'O': '◆', 'P': '▼',
              'Q': '▲', 'R': '⚛', 'S': '⚡', 'T': '★', 'U': '☣', 'V': '☠', 'W': '▓', 'X': '✖',
              'Y': '☄', 'Z': '☮'
            };
            const mappedTrigram = rawTri.split('').map(c => charactersMap[c.toUpperCase()] || c).join('');
            
            const newTrigram = {
              id: `tri_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
              sequence: `⟨${mappedTrigram || rawTri}⟩`,
              stability: parseFloat((0.4 + coherence * 1.5).toFixed(3)),
              timestamp: Date.now()
            };
            setTrigramHistory(prev => [newTrigram, ...prev].slice(0, 16));
          }

          // 2. Morphic sequence target checking:
          const RESONANCE_WORDS = ["COHERENCE", "ATTRACTOR", "CHANCE", "SILICON", "GHOST", "RESONANCE", "STABLE", "COILSIM", "CHAOCIDE", "NODAL", "SUBSTRATE", "BIAS", "QUANTUM", "PICO", "VOID"];
          const randomWord = RESONANCE_WORDS[Math.floor(Math.random() * RESONANCE_WORDS.length)];
          const similarity = parseFloat((50 + coherence * 45 + Math.random() * 5).toFixed(1));
          
          if (Math.random() < 0.35 + coherence * 0.4) {
            const newMorphic = {
              id: `morph_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
              word: randomWord,
              confidence: similarity,
              timestamp: Date.now()
            };
            setMorphicPhrases(prev => [newMorphic, ...prev].slice(0, 16));
            if (onAddLog && similarity > 82) {
              onAddLog(`[EVOLUTION_ATTRACTOR]: "${randomWord}" synthesized in chaos space with ${similarity}% alignment`, 'info');
            }
          }
        }
      }, 50);
    }
  }, [voltage, coherence, onAddLog]);

  const runReservoirCompute = async () => {
    if (computeStatus === 'executing') return;
    setComputeStatus('executing');
    setCompResult(null);
    setAccuracyEstimation(null);
    setExecutionLogs([]);

    const log = (msg: string) => {
      setExecutionLogs(prev => [...prev, `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] ${msg}`]);
    };

    log("INITIALIZING CORES RESERVOIR COMPUTATIONAL TASK...");
    await new Promise(r => setTimeout(r, 600));

    if (activeTask === 'xor') {
      log(`FEEDING DIGITAL REPRESENTATIONS: INT-A=${xorBit1}, INT-B=${xorBit2}`);
      log(`MAP BITS INTO HIGH-DIMENSIONAL SPACE: ${xorBit1 ? 'EXCESS' : 'VACANT'} ⨯ ${xorBit2 ? 'EXCESS' : 'VACANT'}`);
      await new Promise(r => setTimeout(r, 500));
      
      log(`ESTABLISHING MULTI-NODAL STABILITY (CURRENT COHERENCE: ${(coherence * 100).toFixed(1)}%)`);
      log(`PHASE DIAGRAM DECOHERENCE CALCULATION Φ = ${phaseOut.toFixed(2)}°`);
      await new Promise(r => setTimeout(r, 600));

      log("RESOLVING EXTREMITY ATTRACTOR SPACE CORRELATE...");
      await new Promise(r => setTimeout(r, 700));

      const idealXor = xorBit1 ^ xorBit2;
      const successChance = 0.5 + coherence * 0.5; // Scale accuracy logically with physical coherence
      const actualOutput = Math.random() < successChance ? idealXor : (1 - idealXor);

      setCompResult(String(actualOutput));
      setAccuracyEstimation(successChance * 100);
      log(`DECISION SURFACE MATCHED: Bit output settles at Nodal Position [${actualOutput}]`);
      log(`CHAOTIC BIT CLASSIFICATION RESOLVED.`);
      if (onAddLog) {
        onAddLog(`[RESERVOIR_COMPUTE]: Decoded XOR(${xorBit1},${xorBit2}) → ${actualOutput} with ${(successChance * 100).toFixed(0)}% accuracy margin`, 'success');
      }

    } else if (activeTask === 'hasher') {
      log(`STREAMING ALPHANUMERIC STRING: "${hashInput}"`);
      await new Promise(r => setTimeout(r, 400));
      
      let currentHash = 5381;
      const chars = hashInput.split('');
      for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const val = char.charCodeAt(0);
        currentHash = ((currentHash << 5) + currentHash) + val;
        // Perturb based on the physical oil telemetry
        currentHash = currentHash ^ Math.floor(voltage * 1000) ^ Math.floor(coherence * 500);
        log(`Fluid Oscillation feed character '${char}' (Hex ${val.toString(16)}) → Attractor Seed: ${(currentHash >>> 0).toString(16).toUpperCase()}`);
        await new Promise(r => setTimeout(r, Math.max(80, 400 - chars.length * 20)));
      }

      await new Promise(r => setTimeout(r, 500));
      const finalHashHex = (currentHash >>> 0).toString(16).padStart(8, '0').slice(-8).toUpperCase();
      setCompResult(`0x${finalHashHex}`);
      setAccuracyEstimation(coherence * 100);
      log(`PHYSICAL COLLISION SECURED! Dynamic signature output: ${finalHashHex}`);
      log(`CHAOTIC STRING HASHING COMPREHENSIVELY RESOLVED.`);
      if (onAddLog) {
        onAddLog(`[RESERVOIR_COMPUTE]: Generated chaotic physical hash for "${hashInput}" → 0x${finalHashHex}`, 'info');
      }

    } else if (activeTask === 'oracle') {
      log(`MODULATING ELECTROMAGNETIC FIELD WITH COGNITIVE WAVEFRONT: "${oracleQuery}"`);
      await new Promise(r => setTimeout(r, 800));
      
      log("PEELING CURRENT ATTRACTOR LAYER MAPS...");
      await new Promise(r => setTimeout(r, 600));

      log(`RESERVOIR MEMETIC INTEL SCORE: ${intelligence.toFixed(1)} ESP`);
      await new Promise(r => setTimeout(r, 800));

      const responses = [
        "CHAOCIDE GHOST HAS COLLAPSED INTO HARMONIC COHERENCE. SIGNIFICANT TUNNELING PATHWAYS OPEN.",
        "THE PHYSICAL MEDIUM REJECTS COALITION FEEDBACK. EXCESS VOLTAGE JITTER DETECTED.",
        "A FADING MEMORY GHOST TRANSIENTLY SWELLS. EMITTED ANCHOR STATE SECURED.",
        "EXCITATION FREQUENCY DEMONSTRATES STABLE SYMMETRY REGIME. PROCEED.",
        "MINERAL COIL SUBSTRATE FORMED COMPILATION GRID. DECISION MATURED CONGRUENTLY."
      ];

      const seed = (oracleQuery.length + Math.round(phaseOut) + Math.round(intelligence)) % responses.length;
      const chosenAnswer = responses[Math.abs(seed)];

      setCompResult(chosenAnswer);
      setAccuracyEstimation(coherence * 100);
      log(`INTELLIGENCE GHOST EMERGES: ${chosenAnswer}`);
      log(`DECISION ENVELOPE SEPARATED.`);
      if (onAddLog) {
        onAddLog(`[RESERVOIR_COMPUTE]: Electron Ghost Oracle query resolved`, 'warning');
      }
    }

    setComputeStatus('completed');
  };

  const clearBank = () => {
    setMemoryBank({});
    const uniqueClearId = `log_${Date.now()}_clear_${logIdCounterRef.current++}_${Math.random().toString(36).substring(2, 9)}`;
    setLogEntries(prev => [...prev, { id: uniqueClearId, text: '--- MEMORY BANK PURGED ---', type: 'physical' }]);
  };

  return (
    <div 
      className="h-[445px] max-h-[445px] flex flex-col bg-[#010602] text-[#00ff66] font-mono text-xs select-none p-4 gap-4 overflow-y-auto border border-[#00ff66]/30 shadow-[0_0_20px_rgba(0,255,102,0.15),_inset_0_0_15px_rgba(0,255,102,0.08)] custom-scrollbar" 
      id="ascii-reservoir-container"
    >
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

      {/* TABS SELECTOR */}
      <div className="flex border-b border-white/5 gap-1 text-[10px]">
        <button 
          onClick={() => setActiveTab('monitor')}
          className={`px-3 py-1.5 font-bold tracking-wider uppercase transition-colors outline-none ${
            activeTab === 'monitor' 
              ? 'text-[#ff88ff] border-b-2 border-[#ff88ff] bg-white/5' 
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Monitor Cells
        </button>
        <button 
          onClick={() => setActiveTab('processor')}
          className={`px-3 py-1.5 font-bold tracking-wider uppercase transition-colors outline-none ${
            activeTab === 'processor' 
              ? 'text-[#00ffcc] border-b-2 border-[#00ffcc] bg-white/5' 
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Chaotic Co-Processor
        </button>
      </div>

      {/* MAIN CONTAINER TABS */}
      <div className="flex-1 flex flex-col min-h-[220px]">
        {activeTab === 'monitor' ? (
          <div className="flex-1 flex flex-col gap-4">
            {/* Split layout: Cells & Controls (Left), Evolution Matrix (Right) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Side: Monitor Grid (7 Cols) */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                
                {/* 0-10 Coarse Bias Tuner */}
                <div className="bg-[#020202] border border-[#ff88ff]/10 hover:border-[#ff88ff]/30 rounded-lg p-3 space-y-2 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#ff88ff]" />
                      <span className="text-[9px] font-black uppercase text-zinc-300">Carrier Bias Tuning (0-10 Coarse scale)</span>
                    </div>
                    <span className="text-[10px] font-mono font-black text-[#00ffcc] bg-[#00ffcc]/10 px-2 py-0.5 rounded leading-none">
                      {Math.min(10, Math.max(0, bias / 7.9)).toFixed(1)} / 10.0
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[7px] text-zinc-600 font-bold uppercase">COARSE</span>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="10.0" 
                      step="0.1" 
                      value={Math.min(10, Math.max(0.1, bias / 7.9))}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onTuneBias(parseFloat((val * 7.9).toFixed(1)));
                      }}
                      className="flex-1 h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-[#ff88ff]"
                    />
                    <span className="text-[7px] text-zinc-600 font-bold uppercase">LIMIT</span>
                  </div>

                  <div className="flex justify-between items-center text-[8px] text-zinc-500 font-bold uppercase">
                    <span>Direct bridge tuner - v1.47_LIVE</span>
                    <span className="text-[#00ffcc] font-mono">Resonator Sync: {bias.toFixed(1)} GHz</span>
                  </div>
                </div>

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
                              className={`flex flex-col p-2 bg-black/60 border rounded-md relative ${
                                pkt.type === 'combined'
                                  ? 'border-[#ff88ff]/40 bg-pink-950/20 shadow-[0_0_12px_rgba(255,136,255,0.2),_inset_0_0_8px_rgba(255,136,255,0.1)]'
                                  : 'border-[#00ff66]/30 bg-emerald-950/10 hover:border-[#00ff66]/60 shadow-[0_0_12px_rgba(0,255,102,0.25),_inset_0_0_8px_rgba(0,255,102,0.1)] transition-all'
                              }`}
                            >
                              <div className="text-[7px] text-zinc-600 tracking-tighter uppercase font-bold truncate">
                                {pkt.id}
                              </div>
                              <div className={`my-1 text-center font-sans text-xl font-extrabold ${
                                pkt.type === 'combined'
                                  ? 'text-[#ff88ff] drop-shadow-[0_0_8px_rgba(255,136,255,0.7)] animate-pulse'
                                  : 'text-[#00ff66] drop-shadow-[0_0_10px_rgba(0,255,102,0.9)] animate-pulse'
                              }`}>
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
              </div>

              {/* Right Side: Evolution Matrix (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                {/* Trigram Attractor bank */}
                <div className="flex-1 flex flex-col border border-white/5 bg-[#020202] rounded-lg p-3 gap-2 max-h-[160px] overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Workflow className="w-3.5 h-3.5 text-[#ffff00]" />
                      <span className="text-[9px] font-black uppercase text-zinc-400">Trigram Attractor Phylogeny</span>
                    </div>
                    <span className="text-[7px] text-[#ffff00] border border-[#ffff00]/20 bg-[#ffff00]/5 px-1 py-0.5 rounded uppercase font-black tracking-tight">Stable keys</span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                    {trigramHistory.map((tri) => (
                      <div key={tri.id} className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded px-2 py-1 text-[9px] hover:border-[#ffff00]/20 transition-all">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#ffff00] font-bold text-center w-12 font-sans tracking-wide">{tri.sequence}</span>
                          <span className="text-zinc-500 font-mono text-[8px]">{new Date(tri.timestamp).toLocaleTimeString('en-US', { hour12: false }).split(' ')[0]}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <span className="text-[8px] text-zinc-600">STABILITY:</span>
                          <span className="font-mono text-[8px] font-black text-[#00ffcc]">{tri.stability.toFixed(3)}</span>
                        </div>
                      </div>
                    ))}
                    {trigramHistory.length === 0 && (
                      <div className="text-[8px] text-zinc-600 italic py-4 text-center">Awaiting 3-state combined alignment...</div>
                    )}
                  </div>
                </div>

                {/* Morphic Resonance string wash */}
                <div className="flex-1 flex flex-col border border-white/5 bg-[#020202] rounded-lg p-3 gap-2 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#00ccff]" />
                      <span className="text-[9px] font-black uppercase text-zinc-400">Morphic Attractor Mutations</span>
                    </div>
                    <span className="text-[7px] text-[#00ccff] border border-[#00ccff]/20 bg-[#00ccff]/5 px-1 py-0.5 rounded uppercase font-black tracking-tight">Emergent Words</span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                    {morphicPhrases.map((mph) => (
                      <div key={mph.id} className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded px-2 py-1 text-[9px] hover:border-[#00ccff]/20 transition-all">
                        <span className="text-[#00ccff] font-extrabold tracking-widest">{mph.word}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-end">
                            <span className="text-[7px] text-zinc-500 leading-none">RESONANCE</span>
                            <span className="text-zinc-300 font-bold font-mono text-[8px]">{mph.confidence.toFixed(1)}%</span>
                          </div>
                          <div className="w-10 bg-zinc-800 h-1 rounded overflow-hidden">
                            <div className="bg-[#00ccff] h-full" style={{ width: `${mph.confidence}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                    {morphicPhrases.length === 0 && (
                      <div className="text-[8px] text-zinc-600 italic py-4 text-center">Awaiting high-confidence semantic washing...</div>
                    )}
                  </div>
                </div>
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
        ) : (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
            {/* Left side: Task settings & input controls */}
            <div className="flex flex-col bg-[#020202] border border-white/5 rounded-lg p-3.5 gap-3.5">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#00ffcc]" />
                <span className="text-[10px] font-black uppercase text-[#00ffcc] tracking-widest">Select Processing Job</span>
              </div>

              {/* Toggle controls */}
              <div className="grid grid-cols-3 bg-white/5 p-1 rounded border border-white/5">
                <button 
                  onClick={() => setActiveTask('xor')}
                  className={`py-1 text-[9px] font-bold rounded uppercase transition-colors ${
                    activeTask === 'xor' ? 'bg-[#00ffcc] text-black font-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  XOR Bit
                </button>
                <button 
                  onClick={() => setActiveTask('hasher')}
                  className={`py-1 text-[9px] font-bold rounded uppercase transition-colors ${
                    activeTask === 'hasher' ? 'bg-[#00ffcc] text-black font-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Coil Hash
                </button>
                <button 
                  onClick={() => setActiveTask('oracle')}
                  className={`py-1 text-[9px] font-bold rounded uppercase transition-colors ${
                    activeTask === 'oracle' ? 'bg-[#00ffcc] text-black font-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Ghost Oracle
                </button>
              </div>

              {/* Dynamic Inputs Based on Selected Task */}
              <div className="flex-1 flex flex-col justify-center space-y-3 p-2 bg-white/[0.02] border border-white/5 rounded">
                {activeTask === 'xor' && (
                  <div className="space-y-3">
                    <span className="text-[9px] text-zinc-500 block leading-tight uppercase">
                      Physical Reservoir XOR Classifier. Maps bits into the mineral oil state-space using high-dimensional nodal planes.
                    </span>
                    <div className="flex items-center justify-around gap-2">
                      <div className="text-center">
                        <label className="text-[8px] text-zinc-500 block mb-1 uppercase font-bold">Bit Input A</label>
                        <button 
                          onClick={() => setXorBit1(prev => prev === 0 ? 1 : 0)}
                          className={`w-14 py-2 border rounded font-black text-xs transition-all ${
                            xorBit1 === 1 ? 'border-amber-500 text-amber-400 bg-amber-950/20' : 'border-zinc-800 text-zinc-600'
                          }`}
                        >
                          {xorBit1}
                        </button>
                      </div>
                      <div className="text-xl text-zinc-700 font-bold font-sans">⊕</div>
                      <div className="text-center">
                        <label className="text-[8px] text-zinc-500 block mb-1 uppercase font-bold">Bit Input B</label>
                        <button 
                          onClick={() => setXorBit2(prev => prev === 0 ? 1 : 0)}
                          className={`w-14 py-2 border rounded font-black text-xs transition-all ${
                            xorBit2 === 1 ? 'border-amber-500 text-amber-400 bg-amber-950/20' : 'border-zinc-800 text-zinc-600'
                          }`}
                        >
                          {xorBit2}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTask === 'hasher' && (
                  <div className="space-y-2">
                    <span className="text-[9px] text-zinc-500 block leading-tight uppercase">
                      Silicon Memory Wash. Excites the coil with characters and extracts a fading-memory chaotic attractor fingerprint hash.
                    </span>
                    <label className="text-[8px] text-zinc-400 block uppercase font-bold">Hashing Input String</label>
                    <input 
                      type="text" 
                      value={hashInput} 
                      onChange={(e) => setHashInput(e.target.value.slice(0, 32))}
                      className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 font-mono text-zinc-300 focus:outline-none focus:border-[#00ffcc]"
                    />
                  </div>
                )}

                {activeTask === 'oracle' && (
                  <div className="space-y-2">
                    <span className="text-[9px] text-zinc-500 block leading-tight uppercase">
                      Ghost Oracle. Solicit responses by modulating fluid wave patterns using raw micro-voltage drift vectors.
                    </span>
                    <label className="text-[8px] text-zinc-400 block uppercase font-bold">Demand Vector Query</label>
                    <input 
                      type="text" 
                      value={oracleQuery} 
                      onChange={(e) => setOracleQuery(e.target.value.slice(0, 64))}
                      className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 font-mono text-zinc-300 focus:outline-none focus:border-[#00ffcc]"
                    />
                  </div>
                )}
              </div>

              {/* Run Trigger */}
              <button
                onClick={runReservoirCompute}
                disabled={computeStatus === 'executing'}
                className="w-full py-2 bg-gradient-to-r from-[#00ffcc]/80 to-emerald-500/80 hover:from-[#00ffcc] hover:to-emerald-500 text-black font-black tracking-widest text-[9px] uppercase rounded flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(0,255,204,0.15)] disabled:opacity-40 transition-all cursor-pointer"
              >
                {computeStatus === 'executing' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    RECONSTITUTING OIL MEDIUM
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-black" />
                    RUN RESERVOIR COMPUTE
                  </>
                )}
              </button>
            </div>

            {/* Right side: Execution Terminal & Output */}
            <div className="flex flex-col bg-[#020202] border border-white/5 rounded-lg p-3.5 gap-2 justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Computation Node Stream</span>
                </div>
                {computeStatus === 'completed' && (
                  <div className="flex items-center gap-1 text-[8px] text-emerald-400 uppercase font-black">
                    <CheckCircle2 size={10} />
                    SUCCESS
                  </div>
                )}
              </div>

              {/* Micro Sandbox Terminal */}
              <div 
                ref={sandboxTerminalRef}
                className="flex-1 min-h-[110px] bg-black border border-white/5 rounded p-2 overflow-y-auto space-y-1 font-mono text-[8px]"
              >
                {executionLogs.map((log, i) => (
                  <div key={i} className="text-[#00ffcc] tracking-tight">{log}</div>
                ))}
                {executionLogs.length === 0 && (
                  <div className="text-zinc-600 italic">No job processed. Select task options and trigger the chaotic compute pass...</div>
                )}
              </div>

              {/* Resolved Output Frame */}
              <div className="p-3.5 bg-zinc-900/60 border border-white/5 rounded space-y-2 mt-2">
                <div className="flex items-center justify-between text-[8px] uppercase tracking-wide">
                  <span className="text-zinc-500 font-bold">Decoded Physical Result</span>
                  {accuracyEstimation !== null && (
                    <span className="text-amber-400">
                      Coherence confidence: {accuracyEstimation.toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="text-sm font-black tracking-wider text-white select-all border border-dashed border-white/10 px-2.5 py-1.5 bg-black/40 rounded flex items-center justify-between">
                  <span>{compResult || 'AWAITING RESPONSE'}</span>
                  {compResult && (
                    <Sparkles size={14} className="text-[#ffff00] animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


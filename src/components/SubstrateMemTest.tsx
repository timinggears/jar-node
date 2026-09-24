import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  Cpu, 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Crosshair, 
  Wrench, 
  Copy, 
  Flame, 
  Binary, 
  Layers, 
  Database,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Volume2,
  VolumeX,
  FileCode,
  Grid,
  DownloadCloud,
  UploadCloud,
  Activity,
  Snowflake,
  Edit3
} from 'lucide-react';

export type SectorStatus = 'untested' | 'reading' | 'writing' | 'pass' | 'warning' | 'corrupt' | 'remapped';

export interface MemoryBlock {
  address: number;
  hex: string;
  bank: number;
  status: SectorStatus;
  voltage: number;
  expectedPattern: number;
  actualPattern: number;
  flipCount: number;
  retention: number;
  remappedTo?: string;
  temperature: number;
}

interface SubstrateMemTestProps {
  coherence: number;
  jitter: number;
  frequency: number;
  onAddLog?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  onClose?: () => void;
}

export const BANK_PAGES = [
  { id: 0, label: 'Page 0: [0x0000 - 0x03FF] (1 KB Base Substrate Bank)', baseAddr: 0x0000, desc: 'Base direct substrate capacitor cells' },
  { id: 1, label: 'Page 1: [0x0400 - 0x07FF] (1 KB Aux Resonance Bank)', baseAddr: 0x0400, desc: 'Dual-tone carrier resonance retention' },
  { id: 2, label: 'Page 2: [0x0800 - 0x0BFF] (1 KB NVM Flash Shadow)', baseAddr: 0x0800, desc: 'Persistent non-volatile shadow sectors' },
  { id: 3, label: 'Page 3: [0x0C00 - 0x0FFF] (1 KB Entangled QEC Buffer)', baseAddr: 0x0C00, desc: 'Quantum error correction parity pool' },
  { id: 4, label: 'Page 4: [0x1000 - 0x13FF] (1 KB 28kHz Acoustic Carrier)', baseAddr: 0x1000, desc: 'Analog acoustic modulation register' },
  { id: 5, label: 'Page 5: [0x2000 - 0x27FF] (2 KB RP2040 High-SRAM)', baseAddr: 0x2000, desc: 'Microcontroller high memory boundary' }
];

export const WINDOW_SIZES = [
  { sectors: 128, bytes: 1024, label: '1024 B (128 Sectors / 8 Banks)' },
  { sectors: 256, bytes: 2048, label: '2048 B (256 Sectors / 16 Banks)' }
];

const PATTERNS = [
  { id: 'checkerboard', name: '0x55 / 0xAA Checkerboard', desc: 'Alternating bit pattern stress' },
  { id: 'walking_ones', name: 'Walking 1s & 0s', desc: 'Single-bit adjacent crosstalk test' },
  { id: 'thermal_sag', name: 'Thermodynamic Sag (28kHz)', desc: 'Tests analog capacitor retention under frequency noise' },
  { id: 'random_chaos', name: 'Chaos Attractor Inversion', desc: 'Nonlinear pseudorandom bit distribution' },
  { id: 'row_hammer', name: 'Row Hammer Substrate Pulse', desc: 'High-frequency toggling of adjacent sectors' }
];

const createBlocks = (pageIdx: number, count: number): MemoryBlock[] => {
  const page = BANK_PAGES[pageIdx] || BANK_PAGES[0];
  return Array.from({ length: count }, (_, i) => {
    const absAddress = page.baseAddr + i;
    return {
      address: i,
      hex: `0x${absAddress.toString(16).padStart(4, '0').toUpperCase()}`,
      bank: Math.floor(i / 16),
      status: 'untested',
      voltage: 1.650,
      expectedPattern: i % 2 === 0 ? 0x55 : 0xAA,
      actualPattern: i % 2 === 0 ? 0x55 : 0xAA,
      flipCount: 0,
      retention: 99.5,
      temperature: 28.2
    };
  });
};

// --- ANALOG CAPACITOR DISCHARGE OSCILLOSCOPE ---
function CellOscilloscope({
  voltage,
  frequency,
  jitter,
  isCorrupt,
  retention
}: {
  voltage: number;
  frequency: number;
  jitter: number;
  isCorrupt: boolean;
  retention: number;
}) {
  const width = 260;
  const height = 48;
  const vThreshold = 1.40;
  const vMax = 1.80;
  const vMin = 0.90;

  const getY = (v: number) => {
    const clamped = Math.max(vMin, Math.min(vMax, v));
    return height - ((clamped - vMin) / (vMax - vMin)) * (height - 8) - 4;
  };

  const threshY = getY(vThreshold);

  // Generate waveform
  const points: string[] = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const decayFactor = isCorrupt ? Math.exp(-t * 2.8) : Math.exp(-t * 0.25);
    const ripple = Math.sin(t * Math.PI * 10) * (jitter * 0.06 + (isCorrupt ? 0.04 : 0.008));
    const vVal = (voltage * decayFactor) + ripple;
    const x = (i / steps) * width;
    const y = getY(vVal);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  const margin = voltage - vThreshold;

  return (
    <div className="bg-black/80 border border-white/10 rounded-lg p-2 flex flex-col gap-1">
      <div className="flex items-center justify-between text-[8px] font-mono">
        <span className="text-zinc-400 uppercase flex items-center gap-1 font-bold">
          <Activity size={10} className="text-[#00ffcc]" />
          <span>RC DECAY &amp; 28kHz CARRIER SCOPE</span>
        </span>
        <span className={margin < 0 ? 'text-pink-400 font-bold' : 'text-emerald-400 font-bold'}>
          {margin >= 0 ? '+' : ''}{margin.toFixed(3)}V Margin
        </span>
      </div>
      <div className="relative w-full h-[48px] bg-[#020b08] border border-[#00ffcc]/20 rounded overflow-hidden">
        <div 
          className="absolute left-0 right-0 border-b border-dashed border-amber-500/60 z-0" 
          style={{ top: `${threshY}px` }}
        />
        <span 
          className="absolute right-1 text-[7px] text-amber-500 font-bold select-none pointer-events-none" 
          style={{ top: `${Math.max(2, threshY - 9)}px` }}
        >
          V_TH (1.40V)
        </span>
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`}>
          <polyline
            fill="none"
            stroke={isCorrupt ? '#ef4444' : '#00ffcc'}
            strokeWidth="1.6"
            strokeLinecap="round"
            points={points.join(' ')}
          />
        </svg>
      </div>
      <div className="flex justify-between items-center text-[7px] text-zinc-500 font-mono">
        <span>t=0 (Pre-charge)</span>
        <span className="text-zinc-400">τ = 42ms RC Hold</span>
        <span>t=Refresh Loop</span>
      </div>
    </div>
  );
}

// --- HEX & ASCII DUMP VIEWER ---
function HexDumpViewer({
  blocks,
  selectedIdx,
  onSelect
}: {
  blocks: MemoryBlock[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
}) {
  const rowCount = Math.ceil(blocks.length / 16);

  return (
    <div className="flex-1 flex flex-col font-mono text-[9px] bg-black/90 p-2.5 rounded-lg border border-white/10 overflow-y-auto max-h-[380px] custom-scrollbar select-text">
      {/* Table Header */}
      <div className="flex items-center text-zinc-500 border-b border-white/10 pb-1 mb-1.5 font-bold text-[8px] tracking-wider">
        <span className="w-16 shrink-0">OFFSET</span>
        <div 
          className="gap-0.5 text-center px-2 flex-1"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}
        >
          {['00','01','02','03','04','05','06','07','08','09','0A','0B','0C','0D','0E','0F'].map((h, i) => (
            <span key={h} className={i === 8 ? 'border-l border-white/15' : ''}>{h}</span>
          ))}
        </div>
        <span className="w-36 shrink-0 text-center border-l border-white/15">ASCII DECODE</span>
      </div>

      {/* Rows */}
      {Array.from({ length: rowCount }, (_, r) => {
        const rowBlocks = blocks.slice(r * 16, r * 16 + 16);
        const firstHex = rowBlocks[0]?.hex || `0x${(r * 16).toString(16)}`;

        return (
          <div key={r} className="flex items-center hover:bg-white/5 py-0.5 rounded transition-colors group">
            {/* Offset */}
            <span className="w-16 shrink-0 text-[#00ffcc] font-bold group-hover:text-white">
              {firstHex}
            </span>

            {/* 16 Hex Bytes */}
            <div 
              className="gap-0.5 px-2 flex-1"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}
            >
              {rowBlocks.map((b, i) => {
                const isSelected = selectedIdx === b.address;
                const hexVal = (b.actualPattern & 0xFF).toString(16).padStart(2, '0').toUpperCase();
                
                let textColor = 'text-zinc-400';
                if (b.status === 'pass') textColor = 'text-emerald-400';
                else if (b.status === 'corrupt') textColor = 'text-pink-400 font-black animate-pulse';
                else if (b.status === 'warning') textColor = 'text-amber-400';
                else if (b.status === 'remapped') textColor = 'text-purple-400';

                return (
                  <button
                    key={b.address}
                    onClick={() => onSelect(b.address)}
                    className={`text-center py-0.5 rounded text-[8.5px] cursor-pointer transition-all ${textColor} ${
                      i === 8 ? 'border-l border-white/15' : ''
                    } ${isSelected ? 'bg-white text-black font-black scale-110 shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'hover:bg-white/10'}`}
                    title={`Addr: ${b.hex} | Val: 0x${hexVal} (${b.actualPattern}) | Char: '${String.fromCharCode(b.actualPattern)}'`}
                  >
                    {hexVal}
                  </button>
                );
              })}
            </div>

            {/* ASCII String on Right */}
            <div className="w-36 shrink-0 border-l border-white/15 px-2 tracking-widest text-zinc-300 font-mono text-[9px] truncate">
              |{rowBlocks.map(b => {
                const code = b.actualPattern & 0xFF;
                return (code >= 32 && code <= 126) ? String.fromCharCode(code) : '·';
              }).join('')}|
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SubstrateMemTest({
  coherence,
  jitter,
  frequency,
  onAddLog,
  onClose
}: SubstrateMemTestProps) {
  const [selectedPageIdx, setSelectedPageIdx] = useState(0);
  const [selectedSectorCount, setSelectedSectorCount] = useState(128);

  // State for active memory blocks window
  const [blocks, setBlocks] = useState<MemoryBlock[]>(() => {
    return createBlocks(0, 128);
  });

  const [isRunning, setIsRunning] = useState(false);
  const [currentScanIdx, setCurrentScanIdx] = useState<number | null>(null);
  const [passCount, setPassCount] = useState(0);
  const [activePattern, setActivePattern] = useState(PATTERNS[0].id);
  const [selectedBlockIdx, setSelectedBlockIdx] = useState<number>(0);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [stressMode, setStressMode] = useState(false);
  const [testSpeed, setTestSpeed] = useState<'normal' | 'fast' | 'turbo'>('normal');

  // Advanced features state
  const [viewMode, setViewMode] = useState<'grid' | 'hex'>('grid');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [thermalProfile, setThermalProfile] = useState<'nominal' | 'bake' | 'cryo'>('nominal');
  const [isSyncingReservoir, setIsSyncingReservoir] = useState(false);
  const [byteEditHex, setByteEditHex] = useState('55');
  const [byteEditChar, setByteEditChar] = useState('U');

  const runnerIntervalRef = useRef<any>(null);
  const currentIndexRef = useRef(0);
  const passCountRef = useRef(0);
  const isRunningRef = useRef(false);
  isRunningRef.current = isRunning;
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastTickTimeRef = useRef(0);

  // Synchronized refs to avoid re-creating testNextBlock and interval on every block/prop update
  const paramsRef = useRef({ coherence, jitter, thermalProfile, stressMode, soundEnabled, testSpeed });
  useEffect(() => {
    paramsRef.current = { coherence, jitter, thermalProfile, stressMode, soundEnabled, testSpeed };
  }, [coherence, jitter, thermalProfile, stressMode, soundEnabled, testSpeed]);

  // Clean up AudioContext on unmount to prevent browser out-of-memory
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  // Stats calculation
  const passedCount = blocks.filter(b => b.status === 'pass').length;
  const corruptCount = blocks.filter(b => b.status === 'corrupt').length;
  const warningCount = blocks.filter(b => b.status === 'warning').length;
  const remappedCount = blocks.filter(b => b.status === 'remapped').length;
  const untestedCount = blocks.filter(b => b.status === 'untested').length;

  const avgRetention = (
    blocks.reduce((acc, b) => acc + b.retention, 0) / (blocks.length || 1)
  ).toFixed(1);

  // Sound/Vibe feedback helper
  const notify = useCallback((msg: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    if (onAddLog) onAddLog(msg, type);
  }, [onAddLog]);

  // Web Audio Synthesizer: emits subtle authentic hardware bios ticks and tones with node cleanup
  const playAudioTick = useCallback((type: 'tick' | 'error' | 'heal' | 'remap') => {
    if (!paramsRef.current.soundEnabled) return;
    try {
      const nowMs = Date.now();
      // Throttle rapid ticks to at most once per 60ms to eliminate audio memory choke
      if (type === 'tick') {
        if (nowMs - lastTickTimeRef.current < 60) return;
        lastTickTimeRef.current = nowMs;
      }

      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      // Auto-disconnect audio nodes on playback end to free native browser memory
      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (_) {}
      };

      const now = ctx.currentTime;
      if (type === 'tick') {
        osc.frequency.setValueAtTime(680 + (currentIndexRef.current % 16) * 20, now);
        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
        osc.start(now);
        osc.stop(now + 0.025);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'heal') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.09);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'remap') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.1);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch (e) {}
  }, []);

  // Handle switching page window
  const handlePageChange = (pageIdx: number) => {
    setSelectedPageIdx(pageIdx);
    setIsRunning(false);
    if (runnerIntervalRef.current) clearInterval(runnerIntervalRef.current);
    currentIndexRef.current = 0;
    setCurrentScanIdx(null);
    setSelectedBlockIdx(0);
    setBlocks(createBlocks(pageIdx, selectedSectorCount));
    notify(`[MEMTEST_PAGE]: Switched to ${BANK_PAGES[pageIdx].label}`, 'info');
  };

  // Handle switching window sector count
  const handleWindowSizeChange = (sectorCount: number) => {
    setSelectedSectorCount(sectorCount);
    setIsRunning(false);
    if (runnerIntervalRef.current) clearInterval(runnerIntervalRef.current);
    currentIndexRef.current = 0;
    setCurrentScanIdx(null);
    setSelectedBlockIdx(0);
    setBlocks(createBlocks(selectedPageIdx, sectorCount));
    notify(`[MEMTEST_WINDOW]: Switched diagnostic frame to ${sectorCount} sectors (${sectorCount * 8} Bytes)`, 'info');
  };

  // Pull real stored ASCII text from physical backend reservoir into Bank 0
  const handlePullFromReservoir = async () => {
    setIsSyncingReservoir(true);
    try {
      const res = await fetch('/api/reservoir/recall');
      const data = await res.json();
      if (data.success) {
        const text = data.reconstructed_string || '';
        const rawCells = data.raw_cells || [];
        if (text.length > 0 || rawCells.length > 0) {
          setBlocks(prev => {
            const next = [...prev];
            const maxLen = Math.min(next.length, Math.max(text.length, rawCells.length));
            for (let i = 0; i < maxLen; i++) {
              let byteVal = 0x00;
              if (i < text.length) {
                byteVal = text.charCodeAt(i);
              } else if (rawCells[i]) {
                byteVal = rawCells[i].ascii || (rawCells[i].char ? rawCells[i].char.charCodeAt(0) : 0);
              }
              next[i] = {
                ...next[i],
                status: 'pass',
                expectedPattern: byteVal,
                actualPattern: byteVal,
                voltage: 1.650,
                retention: 99.9,
                temperature: 28.0
              };
            }
            return next;
          });
          notify(`[RESERVOIR_SYNC]: Imported ${text.length || rawCells.length} cells ("${text.slice(0, 16)}") from physical reservoir into Bank 0.`, 'success');
          playAudioTick('heal');
        } else {
          notify('[RESERVOIR_SYNC]: Reservoir is currently empty. Write some text in I/O Box first!', 'warning');
        }
      }
    } catch (err: any) {
      notify(`[RESERVOIR_SYNC_ERR]: ${err.message}`, 'error');
    } finally {
      setIsSyncingReservoir(false);
    }
  };

  // Flash current memory blocks' ASCII values back to persistent server reservoir
  const handleFlashToReservoir = async () => {
    setIsSyncingReservoir(true);
    try {
      const chars = blocks
        .slice(0, 32)
        .map(b => (b.actualPattern >= 32 && b.actualPattern <= 126 ? String.fromCharCode(b.actualPattern) : ' '))
        .join('')
        .trim();

      const textToFlash = chars.length > 0 ? chars : 'CYBER_SUBSTRATE';
      const res = await fetch('/api/reservoir/write-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToFlash })
      });
      const data = await res.json();
      if (data.success) {
        notify(`[RESERVOIR_FLASH]: Burned "${textToFlash}" (${data.written_count} cells) into physical reservoir capacitor array!`, 'success');
        playAudioTick('remap');
      } else {
        notify(`[RESERVOIR_FLASH_FAIL]: ${data.error}`, 'error');
      }
    } catch (err: any) {
      notify(`[RESERVOIR_FLASH_ERR]: ${err.message}`, 'error');
    } finally {
      setIsSyncingReservoir(false);
    }
  };

  // Run next single step of testing
  const testNextBlock = useCallback(() => {
    const total = blocks.length;
    if (total === 0) return;
    const idx = currentIndexRef.current % total;
    setCurrentScanIdx(idx);

    const { coherence: coh, jitter: jit, thermalProfile: thProf, stressMode: sMode } = paramsRef.current;

    setBlocks(prev => {
      const next = [...prev];
      if (!next[idx]) return prev;
      const target = { ...next[idx] };

      // If already remapped, skip corruption unless tested
      if (target.status === 'remapped') {
        currentIndexRef.current = (idx + 1) % total;
        if (currentIndexRef.current === 0) {
          passCountRef.current += 1;
          setPassCount(passCountRef.current);
        }
        return next;
      }

      // Check if corrupt artificially
      if (target.status === 'corrupt') {
        // Keeps being corrupt
        target.voltage = 1.320 + Math.random() * 0.1;
        target.retention = Math.max(10, target.retention - 5);
        playAudioTick('error');
      } else {
        // Simulated thermodynamic retention check with thermal profile
        let baseNoise = (1 - coh) * 0.4 + jit * 2.0;
        if (thProf === 'bake') baseNoise *= 3.5;
        else if (thProf === 'cryo') baseNoise = 0.0001;

        const roll = Math.random();

        if (roll < baseNoise * 0.05) {
          // Warning state: Analog jitter detected
          target.status = 'warning';
          target.voltage = 1.650 - (Math.random() * 0.15);
          target.retention = Math.max(70, 95 - Math.random() * 15);
          playAudioTick('tick');
        } else {
          // Healthy pass
          target.status = 'pass';
          target.voltage = 1.650 + (Math.random() - 0.5) * 0.012;
          target.retention = thProf === 'cryo' ? 99.99 : Math.min(100, 98 + Math.random() * 2);
          target.actualPattern = target.expectedPattern;
          playAudioTick('tick');
        }
      }

      if (thProf === 'bake') {
        target.temperature = +(72.0 + Math.random() * 6).toFixed(1);
      } else if (thProf === 'cryo') {
        target.temperature = 4.2;
      } else {
        target.temperature = +(28.0 + (sMode ? 14.5 : 2.5) + (Math.random() * 1.5)).toFixed(1);
      }

      next[idx] = target;
      return next;
    });

    // Advance cursor
    const nextIdx = (idx + 1) % total;
    currentIndexRef.current = nextIdx;

    if (nextIdx === 0) {
      passCountRef.current += 1;
      setPassCount(passCountRef.current);
      notify(`[MEMTEST]: Pass ${passCountRef.current} completed.`, 'info');
      if (!sMode && passCountRef.current >= 1) {
        setIsRunning(false);
      }
    }
  }, [blocks.length, notify, playAudioTick]);

  // Interval manager - now only restarts when isRunning or testSpeed changes
  useEffect(() => {
    if (isRunning) {
      const delay = testSpeed === 'turbo' ? 32 : testSpeed === 'fast' ? 60 : 120;
      runnerIntervalRef.current = setInterval(() => {
        testNextBlock();
      }, delay);
    } else {
      if (runnerIntervalRef.current) {
        clearInterval(runnerIntervalRef.current);
        runnerIntervalRef.current = null;
      }
      setCurrentScanIdx(null);
    }

    return () => {
      if (runnerIntervalRef.current) {
        clearInterval(runnerIntervalRef.current);
        runnerIntervalRef.current = null;
      }
    };
  }, [isRunning, testSpeed, testNextBlock]);

  // Start / Pause
  const handleToggleRun = () => {
    if (!isRunning) {
      notify(`[MEMTEST]: Initiated ${activePattern} sweep on 128 substrate blocks.`, 'info');
      setIsRunning(true);
    } else {
      setIsRunning(false);
      notify('[MEMTEST]: Sweep paused by operator.', 'warning');
    }
  };

  // Reset all blocks
  const handleReset = () => {
    setIsRunning(false);
    currentIndexRef.current = 0;
    passCountRef.current = 0;
    setPassCount(0);
    setCurrentScanIdx(null);
    setBlocks(prev => prev.map(b => ({
      ...b,
      status: 'untested',
      voltage: 1.650,
      actualPattern: b.expectedPattern,
      flipCount: 0,
      retention: 99.5,
      remappedTo: undefined,
      temperature: 28.0
    })));
    notify('[MEMTEST]: Reset sector block table to default uncharged state.', 'info');
  };

  // Inject Chaos Bit-Flip into selected block
  const handleInjectBitFlip = (idx: number) => {
    setBlocks(prev => {
      const next = [...prev];
      const target = { ...next[idx] };
      target.status = 'corrupt';
      target.actualPattern = target.expectedPattern ^ 0xFF; // Invert all bits
      target.flipCount += 1;
      target.voltage = 1.284;
      target.retention = 34.2;
      next[idx] = target;
      return next;
    });
    notify(`[MEMTEST_FAULT]: Injected artificial bit-flip at address ${blocks[idx].hex} (Pattern mismatch: expected 0x${blocks[idx].expectedPattern.toString(16)} vs actual 0x${(blocks[idx].expectedPattern ^ 0xFF).toString(16)})`, 'error');
  };

  // Inject random chaos burst across 4-6 random blocks
  const handleChaosBurst = () => {
    const indices: number[] = [];
    const total = blocks.length;
    while (indices.length < Math.min(5, total)) {
      const rand = Math.floor(Math.random() * total);
      if (!indices.includes(rand)) indices.push(rand);
    }

    setBlocks(prev => {
      const next = [...prev];
      indices.forEach(idx => {
        next[idx] = {
          ...next[idx],
          status: 'corrupt',
          actualPattern: Math.floor(Math.random() * 256),
          flipCount: next[idx].flipCount + 1,
          voltage: 1.150 + Math.random() * 0.2,
          retention: 25.0 + Math.random() * 20
        };
      });
      return next;
    });

    notify(`[COSMIC_RAY_SIM]: Injected multi-sector chaos wave into blocks: ${indices.map(i => blocks[i].hex).join(', ')}`, 'error');
  };

  // Re-map a single corrupt block to a spare block
  const handleRemapBlock = (idx: number) => {
    const spareHex = `0xSP_${(idx + 128).toString(16).toUpperCase()}`;
    setBlocks(prev => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        status: 'remapped',
        remappedTo: spareHex,
        retention: 99.8,
        voltage: 1.650,
        actualPattern: next[idx].expectedPattern
      };
      return next;
    });
    notify(`[QEC_REMAP]: Bad sector ${blocks[idx].hex} successfully reallocated to spare pool ${spareHex}. Parity restored.`, 'success');
  };

  // Auto-heal all corrupt/warning blocks via QEC
  const handleAutoHealAll = () => {
    let healed = 0;
    setBlocks(prev => {
      return prev.map(b => {
        if (b.status === 'corrupt' || b.status === 'warning') {
          healed++;
          return {
            ...b,
            status: 'pass',
            actualPattern: b.expectedPattern,
            voltage: 1.650,
            retention: 99.4,
            temperature: 28.5
          };
        }
        return b;
      });
    });
    notify(`[QEC_CONVERGENCE]: Autonomous reservoir crystallizer repaired ${healed} affected sectors.`, 'success');
  };

  // Direct byte injection handler
  const handleWriteByte = () => {
    let byteVal: number | null = null;
    if (byteEditHex.trim().length > 0) {
      const parsed = parseInt(byteEditHex.trim(), 16);
      if (!isNaN(parsed)) byteVal = parsed & 0xFF;
    }
    if (byteVal === null && byteEditChar.length > 0) {
      byteVal = byteEditChar.charCodeAt(0) & 0xFF;
    }
    if (byteVal === null) return;

    setBlocks(prev => {
      const next = [...prev];
      if (next[selectedBlockIdx]) {
        next[selectedBlockIdx] = {
          ...next[selectedBlockIdx],
          actualPattern: byteVal!,
          expectedPattern: byteVal!,
          status: 'pass',
          voltage: 1.650,
          retention: 99.9,
          flipCount: 0
        };
      }
      return next;
    });
    playAudioTick('heal');
    notify(`[BYTE_WRITE]: Burned 0x${byteVal.toString(16).padStart(2, '0').toUpperCase()} ('${String.fromCharCode(byteVal)}') into address ${selectedBlock.hex}`, 'success');
  };

  // Sync byte edit inputs when selected block changes
  useEffect(() => {
    const b = blocks[selectedBlockIdx];
    if (b) {
      setByteEditHex((b.actualPattern & 0xFF).toString(16).padStart(2, '0').toUpperCase());
      const char = (b.actualPattern >= 32 && b.actualPattern <= 126) ? String.fromCharCode(b.actualPattern) : '·';
      setByteEditChar(char);
    }
  }, [selectedBlockIdx]);

  // Copy ASCII memory map to clipboard
  const handleCopyMap = () => {
    const header = `=== CYBEROS PHYSICAL SUBSTRATE MEMORY MAP (${blocks[0]?.hex} - ${blocks[blocks.length - 1]?.hex}) ===\nPass: ${passCount} | Retention: ${avgRetention}% | Corrupt: ${corruptCount}\n\n`;
    let body = '';
    const rowCount = Math.ceil(blocks.length / 16);
    for (let r = 0; r < rowCount; r++) {
      const bankBlocks = blocks.slice(r * 16, (r + 1) * 16);
      const rowChars = bankBlocks.map(b => {
        if (b.status === 'pass') return '.';
        if (b.status === 'corrupt') return 'X';
        if (b.status === 'warning') return '?';
        if (b.status === 'remapped') return 'R';
        return '_';
      }).join(' ');
      body += `Bank ${r} [0x${(r * 16).toString(16).padStart(2, '0').toUpperCase()}]: ${rowChars}\n`;
    }
    const legend = `\nLegend: [.] Pass  [X] Corrupt/Bitflip  [?] Jitter  [R] Remapped  [_] Untested\n`;

    navigator.clipboard.writeText(header + body + legend);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
    notify('[MEMTEST]: Exported ASCII sector map to clipboard.', 'info');
  };

  const selectedBlock = blocks[selectedBlockIdx] || blocks[0];

  return (
    <div className="flex flex-col h-full bg-[#030705] text-zinc-200 font-mono text-xs select-none overflow-hidden">
      {/* --- TOP STATUS & TELEMETRY HEADER --- */}
      <div className="p-3 bg-gradient-to-r from-[#00ffcc]/10 via-zinc-950 to-purple-950/20 border-b border-white/10 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00ffcc]/15 border border-[#00ffcc]/40 flex items-center justify-center text-[#00ffcc] shadow-[0_0_12px_rgba(0,255,204,0.3)]">
              <Binary size={18} className={isRunning ? 'animate-pulse' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-black text-[#00ffcc] tracking-wider uppercase">
                  SUBSTRATE MEMTEST86 // SECTOR MAPPER
                </h2>
                <span className={`text-[8px] px-2 py-0.5 rounded font-black tracking-wider uppercase border ${
                  isRunning 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {isRunning ? `SCANNING PASS ${passCount + 1}` : 'STANDBY'}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Physical non-volatile cell retention &amp; address fault diagnostic
              </p>
            </div>
          </div>

          {/* Action buttons & Hardware Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Audio Feedback Toggle */}
            <button
              onClick={() => {
                const nextSound = !soundEnabled;
                setSoundEnabled(nextSound);
                if (nextSound) playAudioTick('heal');
              }}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                soundEnabled 
                  ? 'bg-[#00ffcc]/20 border-[#00ffcc]/50 text-[#00ffcc] shadow-[0_0_8px_rgba(0,255,204,0.3)]' 
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
              }`}
              title={soundEnabled ? 'Acoustic Synthesizer: ON' : 'Acoustic Synthesizer: MUTED'}
            >
              {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>

            {/* Thermal Profile Switcher */}
            <div className="flex items-center gap-0.5 bg-black/60 border border-white/10 rounded-lg p-0.5">
              {(['nominal', 'bake', 'cryo'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => {
                    setThermalProfile(p);
                    notify(`[THERMAL_PROFILE]: Set to ${p.toUpperCase()} mode.`, 'info');
                  }}
                  className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase transition-all ${
                    thermalProfile === p 
                      ? p === 'bake' 
                        ? 'bg-orange-500 text-black shadow-[0_0_8px_rgba(249,115,22,0.4)]' 
                        : p === 'cryo' 
                        ? 'bg-cyan-300 text-black shadow-[0_0_8px_rgba(103,232,249,0.4)]' 
                        : 'bg-emerald-400 text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title={
                    p === 'bake' ? '75°C High-Heat Sag (Accelerates leakage)' :
                    p === 'cryo' ? '4 Kelvin Superconducting (Zero jitter / infinite hold)' :
                    '28°C Ambient Nominal operation'
                  }
                >
                  {p === 'bake' ? '🔥 75°C' : p === 'cryo' ? '❄️ 4K' : '28°C'}
                </button>
              ))}
            </div>

            {/* Pull / Flash Physical Reservoir */}
            <button
              onClick={handlePullFromReservoir}
              disabled={isSyncingReservoir}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-[#00ffcc] border border-[#00ffcc]/30 text-[9px] uppercase font-bold transition-all cursor-pointer disabled:opacity-50"
              title="Import physical reservoir stored ASCII cells from server into Bank 0"
            >
              <DownloadCloud size={11} className={isSyncingReservoir ? 'animate-bounce' : ''} />
              <span>PULL RESERVOIR</span>
            </button>

            <button
              onClick={handleFlashToReservoir}
              disabled={isSyncingReservoir}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] uppercase font-bold transition-all cursor-pointer disabled:opacity-50"
              title="Flash current block characters back into persistent server reservoir"
            >
              <UploadCloud size={11} className={isSyncingReservoir ? 'animate-bounce' : ''} />
              <span>FLASH RESERVOIR</span>
            </button>

            {/* Test Run / Pause */}
            <button
              onClick={handleToggleRun}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95 ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/30'
                  : 'bg-[#00ffcc] hover:bg-teal-300 text-black shadow-[#00ffcc]/30'
              }`}
            >
              {isRunning ? <Pause size={12} /> : <Play size={12} />}
              <span>{isRunning ? 'PAUSE TEST' : 'START MEMTEST'}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-all cursor-pointer"
              title="Reset all test results"
            >
              <RotateCcw size={14} />
            </button>

            <button
              onClick={handleCopyMap}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-[9px] uppercase font-bold transition-all cursor-pointer"
              title="Copy terminal ASCII map"
            >
              <Copy size={11} />
              <span>{copyFeedback ? 'COPIED!' : 'DUMP ASCII'}</span>
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mt-2.5 pt-2.5 border-t border-white/5 text-[10px]">
          <div className="p-2 bg-black/60 rounded border border-white/5">
            <span className="text-[8px] text-zinc-500 uppercase block">PASS COUNT</span>
            <span className="text-xs font-black text-white">{passCount}</span>
          </div>
          <div className="p-2 bg-black/60 rounded border border-white/5">
            <span className="text-[8px] text-zinc-500 uppercase block">HEALTHY SECTORS</span>
            <span className="text-xs font-black text-emerald-400">{passedCount} / {blocks.length}</span>
          </div>
          <div className="p-2 bg-black/60 rounded border border-white/5">
            <span className="text-[8px] text-zinc-500 uppercase block">BIT FLIPS (CORRUPT)</span>
            <span className={`text-xs font-black ${corruptCount > 0 ? 'text-pink-500 animate-pulse' : 'text-zinc-400'}`}>
              {corruptCount}
            </span>
          </div>
          <div className="p-2 bg-black/60 rounded border border-white/5">
            <span className="text-[8px] text-zinc-500 uppercase block">JITTER WARNINGS</span>
            <span className="text-xs font-black text-amber-400">{warningCount}</span>
          </div>
          <div className="p-2 bg-black/60 rounded border border-white/5">
            <span className="text-[8px] text-zinc-500 uppercase block">SPARE RE-MAPPED</span>
            <span className="text-xs font-black text-purple-400">{remappedCount}</span>
          </div>
          <div className="p-2 bg-black/60 rounded border border-white/5">
            <span className="text-[8px] text-zinc-500 uppercase block">AVG RETENTION</span>
            <span className="text-xs font-black text-[#00ffcc]">{avgRetention}%</span>
          </div>
        </div>
      </div>

      {/* --- MIDDLE CONTAINER: 2D SECTOR GRID + INSPECTOR --- */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-y-auto custom-scrollbar">
        {/* LEFT / CENTER: THE SECTOR BLOCK MAP */}
        <div className="lg:col-span-8 flex flex-col bg-black/50 border border-white/10 rounded-xl p-3 gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-[#00ffcc]" />
              <span className="text-[11px] font-black uppercase text-zinc-300">
                PHYSICAL SECTOR MAP ({blocks[0]?.hex} - {blocks[blocks.length - 1]?.hex})
              </span>

              {/* View Mode Toggle: Grid vs Hex */}
              <div className="flex items-center gap-0.5 bg-white/5 border border-white/10 rounded p-0.5 ml-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase transition-all cursor-pointer ${
                    viewMode === 'grid' ? 'bg-[#00ffcc] text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Grid size={10} />
                  <span>GRID</span>
                </button>
                <button
                  onClick={() => setViewMode('hex')}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase transition-all cursor-pointer ${
                    viewMode === 'hex' ? 'bg-[#00ffcc] text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <FileCode size={10} />
                  <span>HEX &amp; ASCII</span>
                </button>
              </div>
            </div>

            {/* Config Selectors: Page Bank, Window Size, Pattern */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Bank Page Selector */}
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-zinc-500 uppercase">BANK PAGE:</span>
                <select
                  value={selectedPageIdx}
                  onChange={(e) => handlePageChange(Number(e.target.value))}
                  disabled={isRunning}
                  className="bg-black border border-white/10 rounded px-1.5 py-0.5 text-[9px] text-[#00ffcc] focus:outline-none cursor-pointer max-w-[190px] truncate"
                  title="Switch memory bank address window"
                >
                  {BANK_PAGES.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* Window Size Selector */}
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-zinc-500 uppercase">FRAME:</span>
                <select
                  value={selectedSectorCount}
                  onChange={(e) => handleWindowSizeChange(Number(e.target.value))}
                  disabled={isRunning}
                  className="bg-black border border-white/10 rounded px-1.5 py-0.5 text-[9px] text-amber-400 focus:outline-none cursor-pointer"
                  title="Toggle sector window density (1024 B vs 2048 B)"
                >
                  {WINDOW_SIZES.map(w => (
                    <option key={w.sectors} value={w.sectors}>{w.label}</option>
                  ))}
                </select>
              </div>

              {/* Pattern Selector */}
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-zinc-500 uppercase">PATTERN:</span>
                <select
                  value={activePattern}
                  onChange={(e) => setActivePattern(e.target.value)}
                  disabled={isRunning}
                  className="bg-black border border-white/10 rounded px-1.5 py-0.5 text-[9px] text-zinc-300 focus:outline-none cursor-pointer"
                >
                  {PATTERNS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* VIEW: 2D GRID OR HEX DUMP */}
          {viewMode === 'grid' ? (
            <div className="flex-1 flex flex-col justify-start gap-1.5 overflow-y-auto max-h-[380px] custom-scrollbar pr-1">
              {Array.from({ length: Math.ceil(blocks.length / 16) }, (_, bankIdx) => {
                const bankStart = bankIdx * 16;
                const bankBlocks = blocks.slice(bankStart, bankStart + 16);
                const firstHex = bankBlocks[0]?.hex || `0x${(bankStart).toString(16)}`;

                return (
                  <div key={bankIdx} className="flex items-center gap-2">
                    {/* Bank Label */}
                    <div className="w-16 shrink-0 flex items-center justify-between text-[8px] font-mono text-zinc-500 px-1.5 py-0.5 bg-white/5 rounded border border-white/5">
                      <span>B{bankIdx}</span>
                      <span className="text-zinc-400 font-bold">{firstHex}</span>
                    </div>

                    {/* 16 Blocks in this Bank */}
                    <div 
                      className="gap-1 flex-1"
                      style={{ display: 'grid', gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}
                    >
                      {bankBlocks.map((b) => {
                        const isCurrent = currentScanIdx === b.address;
                        const isSelected = selectedBlockIdx === b.address;

                        // Status color mapping
                        let bgStyle = 'bg-zinc-900/80 border-white/10 text-zinc-600';
                        if (b.status === 'pass') {
                          bgStyle = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_6px_rgba(16,185,129,0.2)]';
                        } else if (b.status === 'corrupt') {
                          bgStyle = 'bg-pink-500/30 border-pink-500 text-pink-200 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]';
                        } else if (b.status === 'warning') {
                          bgStyle = 'bg-amber-500/25 border-amber-500/60 text-amber-300';
                        } else if (b.status === 'remapped') {
                          bgStyle = 'bg-purple-500/25 border-purple-500/60 text-purple-300 shadow-[0_0_6px_rgba(168,85,247,0.25)]';
                        }

                        return (
                          <button
                            key={b.address}
                            onClick={() => setSelectedBlockIdx(b.address)}
                            className={`relative aspect-square rounded flex flex-col items-center justify-center border text-[8px] font-mono transition-all cursor-pointer select-none ${bgStyle} ${
                              isSelected ? 'ring-2 ring-white scale-110 z-10' : ''
                            } ${isCurrent ? 'ring-2 ring-[#00ffcc] animate-ping scale-125 z-20' : 'hover:scale-105'}`}
                            title={`Address: ${b.hex} | Pattern: 0x${(b.actualPattern & 0xFF).toString(16).toUpperCase()} | Status: ${b.status} | V: ${b.voltage.toFixed(3)}V`}
                          >
                            <span className="leading-none text-[7px] font-bold">
                              {b.status === 'corrupt' ? '✖' : b.status === 'remapped' ? 'R' : b.status === 'pass' ? '✓' : b.status === 'warning' ? '!' : '·'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <HexDumpViewer
              blocks={blocks}
              selectedIdx={selectedBlockIdx}
              onSelect={(idx) => setSelectedBlockIdx(idx)}
            />
          )}

          {/* GRID LEGEND */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-[9px]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500/70" />
                <span className="text-zinc-400">Stable (Pass)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-pink-500/30 border border-pink-500" />
                <span className="text-zinc-400">Bit Flip (Corrupt)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500/30 border border-amber-500" />
                <span className="text-zinc-400">Thermal Jitter</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-purple-500/30 border border-purple-500" />
                <span className="text-zinc-400">Remapped (Spare)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-zinc-800 border border-zinc-700" />
                <span className="text-zinc-400">Untested</span>
              </span>
            </div>

            {/* Test speed toggles */}
            <div className="flex items-center gap-1 bg-black/60 border border-white/10 rounded-md p-0.5">
              <span className="text-[8px] text-zinc-500 px-1 uppercase font-bold">SPEED:</span>
              {(['normal', 'fast', 'turbo'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setTestSpeed(s)}
                  className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase transition-all cursor-pointer ${
                    testSpeed === s ? 'bg-[#00ffcc] text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: BLOCK DETAIL INSPECTOR & FAULT INJECTION PANEL (4 Columns) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* INSPECTOR CARD */}
          <div className="p-3 bg-black/60 border border-white/10 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <div className="flex items-center gap-2">
                <Crosshair size={14} className="text-[#00ffcc]" />
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-200">
                  SECTOR INSPECTOR: {selectedBlock.hex}
                </span>
              </div>
              <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-bold border ${
                selectedBlock.status === 'pass' 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : selectedBlock.status === 'corrupt'
                  ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}>
                {selectedBlock.status}
              </span>
            </div>

            {/* Analog Capacitor Oscilloscope */}
            <CellOscilloscope
              voltage={selectedBlock.voltage}
              frequency={frequency}
              jitter={jitter}
              isCorrupt={selectedBlock.status === 'corrupt'}
              retention={selectedBlock.retention}
            />

            {/* Direct Byte / Char Burning Tool */}
            <div className="p-2 bg-black/80 border border-white/10 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between text-[8px] text-zinc-400 font-bold uppercase">
                <span className="flex items-center gap-1">
                  <Edit3 size={10} className="text-[#00ffcc]" />
                  <span>DIRECT BYTE / CHAR INJECTION</span>
                </span>
                <span className="text-zinc-500 font-mono">{selectedBlock.hex}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  maxLength={2}
                  placeholder="HEX (41)"
                  value={byteEditHex}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setByteEditHex(val);
                    const parsed = parseInt(val, 16);
                    if (!isNaN(parsed) && parsed >= 32 && parsed <= 126) {
                      setByteEditChar(String.fromCharCode(parsed));
                    }
                  }}
                  className="w-16 bg-black border border-white/15 rounded px-1.5 py-0.5 text-[9px] font-mono text-center text-[#00ffcc] uppercase focus:outline-none focus:border-[#00ffcc]"
                />
                <input
                  type="text"
                  maxLength={1}
                  placeholder="CHR (A)"
                  value={byteEditChar}
                  onChange={(e) => {
                    const char = e.target.value;
                    setByteEditChar(char);
                    if (char.length > 0) {
                      setByteEditHex(char.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase());
                    }
                  }}
                  className="w-14 bg-black border border-white/15 rounded px-1.5 py-0.5 text-[9px] font-mono text-center text-amber-300 focus:outline-none focus:border-amber-400"
                />
                <button
                  onClick={handleWriteByte}
                  className="flex-1 px-2 py-1 rounded bg-[#00ffcc]/20 hover:bg-[#00ffcc]/30 text-[#00ffcc] border border-[#00ffcc]/40 text-[8.5px] font-bold uppercase cursor-pointer transition-all active:scale-95"
                >
                  BURN BYTE
                </button>
              </div>
            </div>

            {/* Analog & Binary Telemetry Table */}
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between py-0.5 border-b border-white/5">
                <span className="text-zinc-500">Address Space:</span>
                <span className="font-mono text-zinc-300">{selectedBlock.hex} (Offset {selectedBlock.address})</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-white/5">
                <span className="text-zinc-500">Substrate Bank:</span>
                <span className="font-mono text-zinc-300">Bank #{selectedBlock.bank}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-white/5">
                <span className="text-zinc-500">Capacitor Voltage:</span>
                <span className={`font-mono font-bold ${selectedBlock.voltage < 1.4 ? 'text-pink-400' : 'text-emerald-400'}`}>
                  {selectedBlock.voltage.toFixed(3)} V
                </span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-white/5">
                <span className="text-zinc-500">Stored Byte:</span>
                <span className="font-mono text-cyan-400 font-bold">
                  0x{(selectedBlock.actualPattern & 0xFF).toString(16).padStart(2, '0').toUpperCase()} (
                  '{(selectedBlock.actualPattern >= 32 && selectedBlock.actualPattern <= 126) ? String.fromCharCode(selectedBlock.actualPattern) : '·'}'
                  )
                </span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-white/5">
                <span className="text-zinc-500">Binary Bitmask:</span>
                <span className="font-mono text-zinc-400 text-[9px]">
                  {(selectedBlock.actualPattern & 0xFF).toString(2).padStart(8, '0')}
                </span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-white/5">
                <span className="text-zinc-500">Retention Reliability:</span>
                <span className="font-mono font-bold text-[#00ffcc]">{selectedBlock.retention.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-white/5">
                <span className="text-zinc-500">Cell Temperature:</span>
                <span className={`font-mono font-bold ${selectedBlock.temperature > 50 ? 'text-orange-400' : selectedBlock.temperature < 10 ? 'text-cyan-300' : 'text-amber-400'}`}>
                  {selectedBlock.temperature}°C
                </span>
              </div>
              {selectedBlock.remappedTo && (
                <div className="flex justify-between py-0.5 text-purple-300 bg-purple-950/20 px-1 rounded">
                  <span>Reallocated Spare:</span>
                  <span className="font-mono font-bold">{selectedBlock.remappedTo}</span>
                </div>
              )}
            </div>

            {/* Interactive Block Actions */}
            <div className="pt-1 flex flex-col gap-1.5">
              <button
                onClick={() => handleInjectBitFlip(selectedBlockIdx)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.2)] active:scale-95"
              >
                <Zap size={11} className="text-pink-400" />
                <span>INJECT BIT-FLIP FAULT</span>
              </button>

              <button
                onClick={() => handleRemapBlock(selectedBlockIdx)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95"
              >
                <Wrench size={11} />
                <span>RE-MAP TO SPARE SECTOR</span>
              </button>
            </div>
          </div>

          {/* CHAOS & AUTONOMOUS REPAIR SUITE */}
          <div className="p-3.5 bg-black/60 border border-white/10 rounded-xl space-y-2.5 flex-1">
            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-wider block">
              Autonomous QEC &amp; Stress Suite
            </span>

            <button
              onClick={handleChaosBurst}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold uppercase transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Flame size={12} className="text-amber-400" />
                <span>Inject Chaos Wave (5 Sectors)</span>
              </div>
              <span className="text-[8px] bg-amber-500/20 px-1 py-0.5 rounded text-amber-200">FAULT</span>
            </button>

            <button
              onClick={handleAutoHealAll}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold uppercase transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span>QEC Auto-Heal All Faults</span>
              </div>
              <span className="text-[8px] bg-emerald-500/20 px-1 py-0.5 rounded text-emerald-200">CONVERGE</span>
            </button>

            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-zinc-400">Continuous Stress Loop:</span>
                <button
                  onClick={() => setStressMode(!stressMode)}
                  className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all ${
                    stressMode 
                      ? 'bg-orange-500 text-black shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                      : 'bg-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  {stressMode ? 'ACTIVE' : 'OFF'}
                </button>
              </div>
              <p className="text-[8px] text-zinc-500 leading-tight">
                Simulates 28.0 kHz subcarrier resonance heating, stressing non-volatile memory cell boundary retention.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- FOOTER STATUS --- */}
      <div className="p-2.5 bg-black/80 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[9px] text-zinc-500 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <span>DIAGNOSTIC: <strong className="text-zinc-300">Physical Substrate MemTest v2.5</strong></span>
          <span>&bull;</span>
          <span>ACTIVE WINDOW: <strong className="text-[#00ffcc]">{blocks.length} Sectors ({blocks.length * 8} Bytes)</strong></span>
          <span>&bull;</span>
          <span>RANGE: <strong className="text-amber-400">{blocks[0]?.hex} - {blocks[blocks.length - 1]?.hex}</strong></span>
          <span>&bull;</span>
          <span>SUBSTRATE POOL: <strong className="text-purple-300">264 KB RP2040 SRAM / 2 MB FLASH / 512 MB HOST</strong></span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-2.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white uppercase font-bold cursor-pointer"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}

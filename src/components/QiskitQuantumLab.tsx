/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * QISKIT QUANTUM CIRCUIT LABORATORY
 * Variational Quantum State Encoding & Feature Mapping of the Jar-Node Feedback Loop
 * 
 * Mapping Blueprint:
 * 1. Input Signal:       instant -> Rx(theta_0) on Qubit 0
 * 2. Memory Stick:       memory  -> Ry(theta_1) on Qubit 1 + CNOT(0, 1) feedback
 * 3. Base Harmony:       osc 28G -> Rz(theta_2) on Qubit 2 + CNOT(1, 2) driving field
 * 4. Phase-Out Output:   Expectation value Z-measurement M(q2 -> c0) -> collapsed wave
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Zap, 
  Activity, 
  RotateCcw, 
  Sliders, 
  Copy, 
  Check, 
  Layers, 
  Share2, 
  Play, 
  Pause, 
  ExternalLink, 
  Sparkles, 
  Compass, 
  Radio, 
  Flame, 
  Code, 
  FileText, 
  ArrowRight,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  Binary,
  Waves
} from 'lucide-react';
import { 
  executeQuantumJarStep, 
  QuantumCircuitState, 
  runHybridStep, 
  HybridStepResult, 
  PhaseOutState, 
  cedarCircuitAngles 
} from '../quantum/qiskitEngine';

interface QiskitQuantumLabProps {
  initialVoltage?: number;
  initialMemory?: number;
  carrierBias?: number;
  onLog?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  onOpenPhaseLab?: () => void;
}

export default function QiskitQuantumLab({
  initialVoltage = 1.42,
  initialMemory = 12.0,
  carrierBias = 50,
  onLog,
  onOpenPhaseLab
}: QiskitQuantumLabProps) {
  // Navigation tabs: simulator, hybrid_runner, circuit_diagram, bloch_states, qiskit_code, ibm_hardware
  const [activeTab, setActiveTab] = useState<'simulator' | 'hybrid_runner' | 'circuit_diagram' | 'bloch_states' | 'qiskit_code' | 'ibm_hardware'>('hybrid_runner');

  // Interactive Parameter Controls
  const [voltage, setVoltage] = useState<number>(initialVoltage);
  const [memoryStick, setMemoryStick] = useState<number>(initialMemory);
  const [jitter, setJitter] = useState<number>(0.015);
  const [shots, setShots] = useState<number>(1024);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [driveActive, setDriveActive] = useState<boolean>(true);
  const [clockSpeed, setClockSpeed] = useState<number>(1.0); // Multiplier for 28 GHz clock

  // Copy feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Live Quantum State
  const [currentState, setCurrentState] = useState<QuantumCircuitState>(() => 
    executeQuantumJarStep(voltage, memoryStick, 0, jitter, shots)
  );

  // Dedicated One-Shot Hybrid Step Runner State (Matching Jar -> Memory Stick -> 3-Qubit Circuit -> Phase-Out)
  const hybridStateRef = useRef<PhaseOutState>(new PhaseOutState(initialMemory));
  const [hybridVoltage, setHybridVoltage] = useState<number>(initialVoltage);
  const [hybridJitter, setHybridJitter] = useState<number>(0.01);
  const [hybridShots, setHybridShots] = useState<number>(1024);
  const [hybridTime, setHybridTime] = useState<number>(0.0);
  const [lastHybridResult, setLastHybridResult] = useState<HybridStepResult>(() => {
    const dummyState = new PhaseOutState(initialMemory);
    return runHybridStep(initialVoltage, 0.01, 0.0, dummyState, 1024);
  });
  const [hybridHistory, setHybridHistory] = useState<Array<HybridStepResult & { stepIndex: number; t: number; voltage: number }>>([]);

  // Oscilloscope Canvas & History buffer
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<Array<{
    t: number;
    classicalPhaseOut: number;
    quantumPhaseOut: number;
    prob1: number;
    memory: number;
    instant: number;
    oscAngle: number;
    driveOn: boolean;
  }>>([]);

  const animRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const memRef = useRef<number>(memoryStick);

  // Synchronize memory changes
  useEffect(() => {
    memRef.current = memoryStick;
  }, [memoryStick]);

  // Handlers for One-Shot Hybrid Loop
  const handleRunHybridStep = () => {
    const nextT = hybridTime + 0.001;
    const res = runHybridStep(hybridVoltage, hybridJitter, nextT, hybridStateRef.current, hybridShots);
    setHybridTime(nextT);
    setLastHybridResult(res);
    setHybridHistory(prev => [
      { ...res, stepIndex: prev.length + 1, t: nextT, voltage: hybridVoltage },
      ...prev.slice(0, 19)
    ]);
    onLog?.(`[HYBRID_STEP]: V=${hybridVoltage.toFixed(3)}V | MemoryStick=${res.memory.toFixed(2)} | θ₁=${res.memory_angle_deg.toFixed(1)}° | QuantumPO=${res.quantum_po.toFixed(2)}° (P1=${(res.p1 * 100).toFixed(1)}%)`, 'info');
  };

  const handleRun10HybridSteps = () => {
    let currentT = hybridTime;
    let latestRes: HybridStepResult = lastHybridResult;
    const newItems: Array<HybridStepResult & { stepIndex: number; t: number; voltage: number }> = [];

    for (let i = 0; i < 10; i++) {
      currentT += 0.001;
      latestRes = runHybridStep(hybridVoltage, hybridJitter, currentT, hybridStateRef.current, hybridShots);
      newItems.push({
        ...latestRes,
        stepIndex: hybridHistory.length + i + 1,
        t: currentT,
        voltage: hybridVoltage
      });
    }

    setHybridTime(currentT);
    setLastHybridResult(latestRes);
    setHybridHistory(prev => [...newItems.reverse(), ...prev].slice(0, 25));
    onLog?.(`[HYBRID_BATCH_10]: Executed 10 hybrid steps. Latest memory stick: ${latestRes.memory.toFixed(2)}, QuantumPO: ${latestRes.quantum_po.toFixed(2)}°`, 'success');
  };

  const handleResetHybridState = () => {
    hybridStateRef.current = new PhaseOutState(0.0);
    setHybridTime(0.0);
    const initialRes = runHybridStep(hybridVoltage, hybridJitter, 0.0, hybridStateRef.current, hybridShots);
    setLastHybridResult(initialRes);
    setHybridHistory([]);
    onLog?.('[HYBRID_RESET]: Substrate memory stick and hybrid timer zeroed.', 'info');
  };

  const handleSyncVoltageFromJar = () => {
    setHybridVoltage(voltage);
    onLog?.(`[HYBRID_SYNC]: Synced hybrid input voltage to Jar V_nodal (${voltage.toFixed(3)} V).`, 'info');
  };

  // Main animation / simulation loop
  useEffect(() => {
    let lastStamp = performance.now();

    const loop = (timestamp: number) => {
      const dt = (timestamp - lastStamp) / 1000.0;
      lastStamp = timestamp;

      if (isPlaying) {
        timeRef.current += dt * clockSpeed;

        const curV = driveActive ? voltage : 0.05;
        const curJit = driveActive ? jitter : 0.002;

        const stepResult = executeQuantumJarStep(
          curV,
          memRef.current,
          timeRef.current,
          curJit,
          shots
        );

        memRef.current = stepResult.updatedMemory;
        setMemoryStick(stepResult.updatedMemory);
        setCurrentState(stepResult);

        // Append to history buffer
        const buf = historyRef.current;
        buf.push({
          t: timeRef.current,
          classicalPhaseOut: stepResult.classicalPhaseOut,
          quantumPhaseOut: stepResult.quantumPhaseOut,
          prob1: stepResult.prob1Sampled,
          memory: stepResult.updatedMemory,
          instant: stepResult.instant,
          oscAngle: stepResult.oscAngle,
          driveOn: driveActive
        });

        // Limit buffer to 220 samples
        if (buf.length > 220) {
          buf.shift();
        }

        drawOscilloscope();
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, driveActive, voltage, jitter, shots, clockSpeed]);

  // Draw dual-trace oscilloscope comparing Classical vs Quantum wave collapse
  const drawOscilloscope = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const midY = h / 2;

    // Background
    ctx.fillStyle = '#050a07';
    ctx.fillRect(0, 0, w, h);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < w; x += 30) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y < h; y += 25) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Center 0° baseline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Stable Coherence Band [8° - 28°]
    const bandTop = midY - (28 / 65) * midY;
    const bandBottom = midY - (8 / 65) * midY;
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.fillRect(0, bandTop, w, bandBottom - bandTop);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.font = '8px monospace';
    ctx.fillText('STABLE COHERENCE WINDOW [8°–28°]', 10, bandTop + 10);

    const buf = historyRef.current;
    if (buf.length < 2) return;

    const drawTrace = (
      valExtractor: (pt: typeof buf[0]) => number,
      color: string,
      lineWidth: number,
      scale: number = (midY / 65),
      dashed: boolean = false
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      if (dashed) ctx.setLineDash([3, 3]);
      else ctx.setLineDash([]);
      ctx.beginPath();

      const stepX = w / 220;
      buf.forEach((pt, i) => {
        const x = i * stepX;
        const val = valExtractor(pt);
        const y = Math.max(4, Math.min(h - 4, midY - val * scale));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    };

    // 1. Classical Modified Phase-Out (Bright Green)
    drawTrace(pt => pt.classicalPhaseOut, '#00ff66', 2.0);

    // 2. Quantum Expectation Wave Theoretical (Dashed Cyan)
    drawTrace(pt => (pt.prob1 * 110.0) - 55.0, '#38bdf8', 1.8);

    // 3. Substrate Memory Stick (Magenta Trace)
    drawTrace(pt => pt.memory, '#ec4899', 1.6, (midY / 45));

    // Legend on canvas
    ctx.font = '8px monospace';
    ctx.fillStyle = '#00ff66';
    ctx.fillText('■ CLASSICAL PHASE-OUT Φ(t)', w - 165, 14);

    ctx.fillStyle = '#38bdf8';
    ctx.fillText('■ QUANTUM COLLAPSED M(q2)', w - 165, 26);

    ctx.fillStyle = '#ec4899';
    ctx.fillText('■ SUBSTRATE MEMORY Ry(θ1)', w - 165, 38);
  };

  const handleCopy = (text: string, id: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCode(id);
      onLog?.(`[QISKIT_EXPORT]: Copied ${id} specification to clipboard.`, 'success');
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  const handleResetMemory = () => {
    memRef.current = 0;
    setMemoryStick(0);
    onLog?.('[QISKIT_CIRCUIT]: Reset substrate memory stick register to 0.0', 'info');
  };

  return (
    <div className="flex flex-col h-full bg-[#030605] text-zinc-200 font-mono text-[11px] overflow-y-auto p-4 space-y-4">
      {/* Top Banner & Strategy Summary */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-gradient-to-r from-cyan-950/40 via-black to-purple-950/40 p-4 rounded-xl border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
        <div>
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h2 className="text-sm font-black tracking-widest text-cyan-300 uppercase">
              Qiskit Quantum Circuit Engine // Cedar Feedback Translation
            </h2>
            <span className="bg-cyan-500/20 text-[#00ffcc] text-[8px] font-bold px-2 py-0.5 rounded border border-cyan-400/40">
              3-QUBIT VQE ARCHITECTURE
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 max-w-3xl leading-relaxed">
            Direct mapping of continuous classical feedback equations into parameterized quantum gates (<code className="text-cyan-300">Rx</code>, <code className="text-cyan-300">Ry</code>, <code className="text-cyan-300">Rz</code>) with entangling <code className="text-purple-300">CNOT</code> cascades and projective Z-measurement collapse.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-black/70 p-1 rounded-lg border border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('hybrid_runner')}
            className={`px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'hybrid_runner'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            1-Shot Hybrid Loop
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'bg-cyan-500/20 text-[#00ffcc] border border-cyan-500/60 shadow-[0_0_12px_rgba(0,255,204,0.3)]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Dual Oscilloscope
          </button>

          <button
            onClick={() => setActiveTab('circuit_diagram')}
            className={`px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'circuit_diagram'
                ? 'bg-cyan-500/20 text-[#00ffcc] border border-cyan-500/60 shadow-[0_0_12px_rgba(0,255,204,0.3)]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Circuit Wire Diagram
          </button>

          <button
            onClick={() => setActiveTab('bloch_states')}
            className={`px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'bloch_states'
                ? 'bg-cyan-500/20 text-[#00ffcc] border border-cyan-500/60 shadow-[0_0_12px_rgba(0,255,204,0.3)]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Bloch &amp; Basis States
          </button>

          <button
            onClick={() => setActiveTab('qiskit_code')}
            className={`px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'qiskit_code'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Qiskit Code &amp; QASM
          </button>

          <button
            onClick={() => setActiveTab('ibm_hardware')}
            className={`px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'ibm_hardware'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            IBM Quantum
          </button>
        </div>
      </div>

      {/* Primary Status Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Metric 1: Quantum Phase-Out */}
        <div className="p-3 bg-zinc-950 border border-cyan-500/30 rounded-xl flex flex-col justify-between shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <span className="text-[9px] font-black tracking-wider text-cyan-400 uppercase flex items-center gap-1.5">
            <Sparkles size={12} />
            <span>Quantum Phase-Out</span>
          </span>
          <div className="text-xl font-black font-mono text-[#00ffcc] my-1">
            {currentState.quantumPhaseOut > 0 ? `+${currentState.quantumPhaseOut.toFixed(2)}°` : `${currentState.quantumPhaseOut.toFixed(2)}°`}
          </div>
          <span className="text-[8px] text-zinc-500">
            Remapped: (P(1) × 110) - 55
          </span>
        </div>

        {/* Metric 2: Classical Comparative Baseline */}
        <div className="p-3 bg-zinc-950 border border-emerald-500/30 rounded-xl flex flex-col justify-between">
          <span className="text-[9px] font-black tracking-wider text-emerald-400 uppercase flex items-center gap-1.5">
            <Waves size={12} />
            <span>Classical Modified</span>
          </span>
          <div className="text-xl font-black font-mono text-emerald-300 my-1">
            {currentState.classicalPhaseOut > 0 ? `+${currentState.classicalPhaseOut.toFixed(2)}°` : `${currentState.classicalPhaseOut.toFixed(2)}°`}
          </div>
          <span className="text-[8px] text-zinc-500">
            Δ Diff: {Math.abs(currentState.quantumPhaseOut - currentState.classicalPhaseOut).toFixed(2)}°
          </span>
        </div>

        {/* Metric 3: Measurement Probability P(1) */}
        <div className="p-3 bg-zinc-950 border border-purple-500/30 rounded-xl flex flex-col justify-between">
          <span className="text-[9px] font-black tracking-wider text-purple-400 uppercase flex items-center gap-1.5">
            <Binary size={12} />
            <span>P(q2 = |1⟩) Probability</span>
          </span>
          <div className="text-xl font-black font-mono text-purple-300 my-1">
            {(currentState.prob1Sampled * 100).toFixed(1)}%
          </div>
          <span className="text-[8px] text-zinc-500">
            Exact: {(currentState.prob1Exact * 100).toFixed(1)}% | Shots: {shots}
          </span>
        </div>

        {/* Metric 4: Substrate Memory Stick Angle */}
        <div className="p-3 bg-zinc-950 border border-pink-500/30 rounded-xl flex flex-col justify-between">
          <span className="text-[9px] font-black tracking-wider text-pink-400 uppercase flex items-center gap-1.5">
            <RotateCcw size={12} />
            <span>Memory Stick (Ry)</span>
          </span>
          <div className="text-xl font-black font-mono text-pink-300 my-1">
            {currentState.updatedMemory.toFixed(2)}
          </div>
          <span className="text-[8px] text-zinc-500">
            θ₁ = {currentState.angles.theta1_deg.toFixed(1)}° (Ry Gate)
          </span>
        </div>

        {/* Metric 5: Quantum Entanglement Entropy */}
        <div className="p-3 bg-zinc-950 border border-amber-500/30 rounded-xl flex flex-col justify-between">
          <span className="text-[9px] font-black tracking-wider text-amber-400 uppercase flex items-center gap-1.5">
            <Zap size={12} />
            <span>Von Neumann Entropy</span>
          </span>
          <div className="text-xl font-black font-mono text-amber-300 my-1">
            {currentState.entanglementEntropy.toFixed(3)}
          </div>
          <span className="text-[8px] text-zinc-500">
            CNOT Correlation: S(q₀:q₁q₂)
          </span>
        </div>
      </div>

      {/* TAB 1: DUAL-TRACE OSCILLOSCOPE SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="flex flex-col gap-4">
          <div className="bg-zinc-950 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-cyan-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Live Oscilloscope: Classical Green Wave vs Quantum Circuit Collapse (M: q2 → c0)
                </span>
              </div>

              {/* Play / Pause / Drive Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    isPlaying ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                  }`}
                >
                  {isPlaying ? <Pause size={10} /> : <Play size={10} />}
                  <span>{isPlaying ? 'PAUSE' : 'RUN'}</span>
                </button>

                <button
                  onClick={() => {
                    const next = !driveActive;
                    setDriveActive(next);
                    if (!next) onLog?.('[DRIVE_CUTOFF]: External drive removed. Observing quantum state relaxation...', 'warning');
                    else onLog?.('[DRIVE_RESTORED]: External multi-harmonic drive restored.', 'success');
                  }}
                  className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all border ${
                    driveActive 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : 'bg-red-500/30 text-red-300 border-red-500/50 animate-pulse'
                  }`}
                >
                  <Zap size={10} />
                  <span>{driveActive ? 'DRIVE ON (1.42V)' : 'DRIVE CUTOFF (RELAXATION)'}</span>
                </button>

                <button
                  onClick={handleResetMemory}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded text-[9px] font-bold uppercase border border-white/10 transition-all"
                  title="Zero out the memory stick"
                >
                  Reset Mem
                </button>
              </div>
            </div>

            {/* Scope Canvas */}
            <div className="relative rounded-lg overflow-hidden border border-cyan-500/20 shadow-inner">
              <canvas 
                ref={canvasRef} 
                width={880} 
                height={260} 
                className="w-full h-[260px] block"
              />
            </div>

            <div className="text-[9px] text-zinc-500 flex items-center justify-between px-1">
              <span>Time window: ~3.5 seconds | Horizontal division: 30px</span>
              <span className="text-zinc-400">
                Notice: The Quantum Collapsed Wave (Cyan) matches the Classical Phase-Out (Green) expectation curve with realistic physical quantum shot noise!
              </span>
            </div>
          </div>

          {/* Interactive Parameter Tuning Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-zinc-950 p-4 rounded-xl border border-white/10">
            {/* Slider 1: Input Voltage */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-cyan-300 font-bold">Input Voltage (V_nodal)</span>
                <span className="text-[#00ffcc] font-mono font-bold">{voltage.toFixed(2)} V</span>
              </div>
              <input 
                type="range"
                min="0.30"
                max="1.65"
                step="0.01"
                value={voltage}
                onChange={(e) => setVoltage(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[8px] text-zinc-500 block">
                Encodes instant = ({voltage.toFixed(2)} - 0.68) × 42 into Rx gate (q0)
              </span>
            </div>

            {/* Slider 2: Substrate Memory Stick */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-pink-300 font-bold">Memory Stick Register</span>
                <span className="text-pink-400 font-mono font-bold">{memoryStick.toFixed(2)}</span>
              </div>
              <input 
                type="range"
                min="-40.0"
                max="40.0"
                step="0.5"
                value={memoryStick}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setMemoryStick(val);
                  memRef.current = val;
                }}
                className="w-full accent-pink-400 cursor-pointer"
              />
              <span className="text-[8px] text-zinc-500 block">
                Slow integration memory encoded into Ry gate (q1)
              </span>
            </div>

            {/* Slider 3: Quantum Measurement Shots */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-purple-300 font-bold">Quantum Shots (Sampling)</span>
                <span className="text-purple-400 font-mono font-bold">
                  {shots === 0 ? 'Exact (Statevector)' : `${shots} shots`}
                </span>
              </div>
              <select
                value={shots}
                onChange={(e) => setShots(parseInt(e.target.value))}
                className="w-full bg-black border border-purple-500/40 rounded p-1.5 text-[10px] text-purple-200 font-mono focus:outline-none"
              >
                <option value={1024}>1024 shots (Qiskit Aer Standard)</option>
                <option value={4096}>4096 shots (High Precision Low Noise)</option>
                <option value={512}>512 shots (Moderate Shot Noise)</option>
                <option value={128}>128 shots (High Quantum Projection Noise)</option>
                <option value={0}>Exact Statevector (Infinite Shots)</option>
              </select>
              <span className="text-[8px] text-zinc-500 block">
                Fewer shots increase quantum collapse fluctuations
              </span>
            </div>

            {/* Slider 4: Clock Speed Multiplier */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-amber-300 font-bold">28 GHz Clock Time Base</span>
                <span className="text-amber-400 font-mono font-bold">{clockSpeed.toFixed(1)}x</span>
              </div>
              <input 
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={clockSpeed}
                onChange={(e) => setClockSpeed(parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="text-[8px] text-zinc-500 block">
                osc = 6 × sin(2π·28·t) encoded into Rz gate (q2)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB: INTERACTIVE 1-SHOT HYBRID STEP RUNNER */}
      {activeTab === 'hybrid_runner' && (
        <div className="flex flex-col gap-4">
          {/* Working Hybrid Architectural Manifesto Card */}
          <div className="bg-gradient-to-r from-amber-950/40 via-zinc-950 to-cyan-950/40 border border-amber-500/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_0_25px_rgba(245,158,11,0.15)]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
                <span className="text-sm font-black text-amber-300 tracking-wider uppercase">
                  Working Hybrid Realization: Jar Voltage → Classical Memory Stick → Quantum Circuit → Measured Phase-Out
                </span>
              </div>
              <p className="text-[10px] text-zinc-300 max-w-3xl leading-relaxed">
                The classical stick/memory runs directly from the Jar’s physical voltage, and the 3-qubit circuit is driven in real time by those values so the quantum side is no longer a detached afterthought.
              </p>
            </div>

            {/* Step Controls */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={handleRunHybridStep}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
                title="Execute run_hybrid_step(voltage, jitter, t, state, shots)"
              >
                <Play size={12} className="fill-black" />
                <span>RUN 1-SHOT HYBRID STEP</span>
              </button>

              <button
                onClick={handleRun10HybridSteps}
                className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[10px] font-bold uppercase rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                title="Execute 10 consecutive hybrid loop steps"
              >
                <TrendingUp size={12} />
                <span>RUN ×10 STEPS</span>
              </button>

              <button
                onClick={handleSyncVoltageFromJar}
                className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold uppercase rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                title="Set hybrid input voltage to live Jar V_nodal"
              >
                <Radio size={12} />
                <span>SYNC V_JAR ({voltage.toFixed(2)}V)</span>
              </button>

              <button
                onClick={handleResetHybridState}
                className="px-2.5 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer"
                title="Reset memory stick and timer"
              >
                <RotateCcw size={12} />
                <span>RESET</span>
              </button>
            </div>
          </div>

          {/* Interactive Parameters for Hybrid Execution */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-zinc-950 p-4 rounded-xl border border-white/10">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-amber-300 font-bold">Input Jar Voltage (V)</span>
                <span className="text-amber-400 font-mono font-bold">{hybridVoltage.toFixed(3)} V</span>
              </div>
              <input
                type="range"
                min="0.30"
                max="1.65"
                step="0.01"
                value={hybridVoltage}
                onChange={(e) => setHybridVoltage(parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="text-[8px] text-zinc-500 block">
                Directly sets rotation θ₀ = clip((V - 0.4) × 3.5, 0, π)
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-pink-300 font-bold">Jitter Noise (σ)</span>
                <span className="text-pink-400 font-mono font-bold">{hybridJitter.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0.00"
                max="0.05"
                step="0.002"
                value={hybridJitter}
                onChange={(e) => setHybridJitter(parseFloat(e.target.value))}
                className="w-full accent-pink-400 cursor-pointer"
              />
              <span className="text-[8px] text-zinc-500 block">
                shimmer = 22.0 + (jitter × 38.0)
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-purple-300 font-bold">Measurement Shots</span>
                <span className="text-purple-400 font-mono font-bold">{hybridShots}</span>
              </div>
              <select
                value={hybridShots}
                onChange={(e) => setHybridShots(parseInt(e.target.value))}
                className="w-full bg-black border border-purple-500/40 rounded p-1.5 text-[10px] text-purple-200 font-mono focus:outline-none"
              >
                <option value={1024}>1024 shots (AerSimulator standard)</option>
                <option value={4096}>4096 shots (Ultra-low shot noise)</option>
                <option value={512}>512 shots (Realistic physical QPU)</option>
                <option value={128}>128 shots (High noise)</option>
              </select>
              <span className="text-[8px] text-zinc-500 block">
                AerSimulator job = sim.run(..., shots={hybridShots})
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-cyan-300 font-bold">Simulation Step Clock</span>
                <span className="text-cyan-400 font-mono font-bold">t = {hybridTime.toFixed(4)} s</span>
              </div>
              <div className="bg-black/60 p-2 rounded border border-white/10 text-[9px] text-zinc-400 flex items-center justify-between">
                <span>dt = 0.001 s</span>
                <span className="text-emerald-300 font-mono font-bold">Step #{hybridHistory.length}</span>
              </div>
              <span className="text-[8px] text-zinc-500 block">
                osc = 6 × sin(2π × 28 × t) base resonance
              </span>
            </div>
          </div>

          {/* 3-Stage Pipeline Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Stage 1: Classical Side */}
            <div className="bg-zinc-950 border border-emerald-500/30 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                    <Waves size={14} />
                    <span>1. Classical side (Jar → Memory)</span>
                  </div>
                  <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                    PhaseOutState
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-[10px]">
                  <div className="p-2 bg-black/60 rounded border border-white/5 space-y-1 font-mono text-[9px]">
                    <div className="text-zinc-400">
                      instant = ({hybridVoltage.toFixed(3)} - 0.68) * 42.0 - 0.15 * shimmer
                    </div>
                    <div className="text-emerald-300 font-bold">
                      = {lastHybridResult.instant.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-2 bg-black/60 rounded border border-white/5 space-y-1 font-mono text-[9px]">
                    <div className="text-zinc-400">
                      memory += 0.08 * (instant - memory)
                    </div>
                    <div className="text-pink-300 font-bold">
                      memory stick = {lastHybridResult.memory.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-2 bg-black/60 rounded border border-white/5 space-y-1 font-mono text-[9px]">
                    <div className="text-zinc-400">
                      po = 0.65*instant + 0.90*memory + 0.25*osc
                    </div>
                    <div className="text-emerald-300 font-bold text-xs">
                      classical_po = {lastHybridResult.classical_po > 0 ? `+${lastHybridResult.classical_po.toFixed(2)}°` : `${lastHybridResult.classical_po.toFixed(2)}°`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[8px] text-zinc-500 border-t border-white/5 pt-2">
                Substrate slow integration bounded inside [-40.0, 40.0]
              </div>
            </div>

            {/* Stage 2: Quantum Side */}
            <div className="bg-zinc-950 border border-cyan-500/30 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                    <Cpu size={14} />
                    <span>2. Quantum side (cedar_circuit)</span>
                  </div>
                  <span className="text-[8px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono">
                    3 Qubits, 1 Clbit
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-[10px]">
                  <div className="p-2 bg-black/60 rounded border border-white/5 space-y-1 font-mono text-[9px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">q0 = input voltage → Rx</span>
                      <span className="text-cyan-300 font-bold">{lastHybridResult.theta0.toFixed(3)} rad</span>
                    </div>
                    <span className="text-[8px] text-zinc-500">θ₀ = clip(({hybridVoltage.toFixed(3)} - 0.4) * 3.5, 0, π)</span>
                  </div>

                  <div className="p-2 bg-black/60 rounded border border-pink-500/30 space-y-1 font-mono text-[9px] bg-pink-950/10">
                    <div className="flex justify-between">
                      <span className="text-pink-300 font-bold">q1 = substrate memory → Ry (stick)</span>
                      <span className="text-pink-400 font-bold">{lastHybridResult.theta1.toFixed(3)} rad</span>
                    </div>
                    <span className="text-[8px] text-pink-300/80">
                      θ₁ = clip(({lastHybridResult.memory.toFixed(2)} + 40)/80 * π, 0, π) → <strong>{lastHybridResult.memory_angle_deg.toFixed(1)}°</strong>
                    </span>
                  </div>

                  <div className="p-2 bg-black/60 rounded border border-white/5 space-y-1 font-mono text-[9px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">q2 = drive/clock → Rz</span>
                      <span className="text-amber-300 font-bold">{lastHybridResult.theta2.toFixed(3)} rad</span>
                    </div>
                    <span className="text-[8px] text-zinc-500">θ₂ = clip(|osc| * 0.4, 0, π)</span>
                  </div>

                  <div className="p-1.5 bg-black/70 rounded border border-purple-500/30 text-[8px] font-mono text-purple-300">
                    Gates: <code>cx(0, 1)</code> → <code>cx(1, 2)</code> → <code>measure(2, 0)</code>
                  </div>
                </div>
              </div>

              <div className="text-[8px] text-zinc-500 border-t border-white/5 pt-2">
                Memory stick is now physically encoded as a Bloch sphere latitude angle
              </div>
            </div>

            {/* Stage 3: Return Dictionary */}
            <div className="bg-zinc-950 border border-purple-500/40 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5 text-purple-300 font-bold text-xs">
                    <Binary size={14} />
                    <span>3. Return Dictionary (Live Output)</span>
                  </div>
                  <button
                    onClick={() => handleCopy(JSON.stringify({
                      classical_po: Number(lastHybridResult.classical_po.toFixed(3)),
                      memory: Number(lastHybridResult.memory.toFixed(3)),
                      memory_angle_deg: Number(lastHybridResult.memory_angle_deg.toFixed(2)),
                      quantum_po: Number(lastHybridResult.quantum_po.toFixed(3)),
                      p1: Number(lastHybridResult.p1.toFixed(4))
                    }, null, 2), 'hybrid_dict')}
                    className="text-[8px] bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 px-2 py-0.5 rounded border border-purple-400 flex items-center gap-1 cursor-pointer transition-all"
                  >
                    {copiedCode === 'hybrid_dict' ? <Check size={10} className="text-emerald-300" /> : <Copy size={10} />}
                    <span>{copiedCode === 'hybrid_dict' ? 'COPIED' : 'COPY JSON'}</span>
                  </button>
                </div>

                {/* Formatted Return Dictionary */}
                <div className="mt-3 p-3 bg-black/90 rounded-lg border border-purple-500/30 font-mono text-[10px] space-y-1">
                  <div className="text-zinc-500">{`{`}</div>
                  <div className="pl-4 flex justify-between">
                    <span className="text-emerald-400">'classical_po':</span>
                    <span className="text-emerald-300 font-bold">{lastHybridResult.classical_po.toFixed(3)},</span>
                  </div>
                  <div className="pl-4 flex justify-between">
                    <span className="text-pink-400">'memory':</span>
                    <span className="text-pink-300 font-bold">{lastHybridResult.memory.toFixed(3)},</span>
                  </div>
                  <div className="pl-4 flex justify-between">
                    <span className="text-pink-400">'memory_angle_deg':</span>
                    <span className="text-pink-300 font-bold">{lastHybridResult.memory_angle_deg.toFixed(2)},</span>
                  </div>
                  <div className="pl-4 flex justify-between">
                    <span className="text-[#00ffcc]">'quantum_po':</span>
                    <span className="text-[#00ffcc] font-bold">{lastHybridResult.quantum_po.toFixed(3)},</span>
                  </div>
                  <div className="pl-4 flex justify-between">
                    <span className="text-purple-400">'p1':</span>
                    <span className="text-purple-300 font-bold">{lastHybridResult.p1.toFixed(4)}</span>
                  </div>
                  <div className="text-zinc-500">{`}`}</div>
                </div>

                {/* Quick Diagnostics */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-[9px] font-mono">
                  <div className="p-2 bg-black/60 rounded border border-white/5">
                    <span className="text-zinc-400 block">Δ (Quant - Class)</span>
                    <span className="text-white font-bold">
                      {Math.abs(lastHybridResult.quantum_po - lastHybridResult.classical_po).toFixed(2)}°
                    </span>
                  </div>
                  <div className="p-2 bg-black/60 rounded border border-white/5">
                    <span className="text-zinc-400 block">Qubit 2 P(1)</span>
                    <span className="text-purple-300 font-bold">
                      {(lastHybridResult.p1 * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[8px] text-zinc-400 border-t border-white/5 pt-2 flex items-center justify-between">
                <span>Remap: quantum_po = (p1 * 110) - 55</span>
                <span className="text-emerald-400 font-bold">HYBRID LOCKED</span>
              </div>
            </div>
          </div>

          {/* Telemetry Execution History Table */}
          <div className="bg-zinc-950 border border-white/10 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={14} className="text-[#00ffcc]" />
                <span>Recent Hybrid Step Telemetry History</span>
              </span>
              <span className="text-[9px] text-zinc-500 font-mono">
                Showing last {Math.min(hybridHistory.length, 20)} steps
              </span>
            </div>

            {hybridHistory.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-[10px]">
                No steps executed yet. Click <strong className="text-amber-300">"RUN 1-SHOT HYBRID STEP"</strong> above to evaluate the circuit.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[9px]">
                  <thead>
                    <tr className="border-b border-white/10 text-zinc-400 uppercase text-[8px]">
                      <th className="py-1 px-2">Step</th>
                      <th className="py-1 px-2">Time (t)</th>
                      <th className="py-1 px-2">V_jar</th>
                      <th className="py-1 px-2">Memory</th>
                      <th className="py-1 px-2">θ₁ (Stick°)</th>
                      <th className="py-1 px-2">Classical PO</th>
                      <th className="py-1 px-2">Quantum PO</th>
                      <th className="py-1 px-2">P(1)</th>
                      <th className="py-1 px-2">Δ Diff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hybridHistory.map((item) => {
                      const diff = Math.abs(item.quantum_po - item.classical_po);
                      return (
                        <tr key={item.stepIndex} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-1 px-2 text-zinc-500">#{item.stepIndex}</td>
                          <td className="py-1 px-2 text-zinc-300">{item.t.toFixed(4)}s</td>
                          <td className="py-1 px-2 text-amber-300 font-bold">{item.voltage.toFixed(3)}V</td>
                          <td className="py-1 px-2 text-pink-300">{item.memory.toFixed(2)}</td>
                          <td className="py-1 px-2 text-pink-400 font-bold">{item.memory_angle_deg.toFixed(1)}°</td>
                          <td className="py-1 px-2 text-emerald-300">
                            {item.classical_po > 0 ? `+${item.classical_po.toFixed(2)}°` : `${item.classical_po.toFixed(2)}°`}
                          </td>
                          <td className="py-1 px-2 text-[#00ffcc] font-bold">
                            {item.quantum_po > 0 ? `+${item.quantum_po.toFixed(2)}°` : `${item.quantum_po.toFixed(2)}°`}
                          </td>
                          <td className="py-1 px-2 text-purple-300">{(item.p1 * 100).toFixed(1)}%</td>
                          <td className="py-1 px-2">
                            <span className={`px-1 rounded text-[8px] ${diff < 5 ? 'text-emerald-300 bg-emerald-950/40' : 'text-amber-300 bg-amber-950/40'}`}>
                              {diff.toFixed(2)}°
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab === 'circuit_diagram' && (
        <div className="flex flex-col gap-4">
          <div className="bg-zinc-950 border border-cyan-500/30 rounded-xl p-5 flex flex-col gap-4 shadow-[0_0_25px_rgba(6,182,212,0.1)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  3-Qubit Quantum Circuit Wire Architecture (Qiskit Mapping)
                </span>
              </div>
              <span className="text-[9px] text-zinc-400 font-mono">
                Circuit Depth: 4 | Gates: 5 (3 Parameterized Rotations + 2 CNOTs) | 1 Measurement
              </span>
            </div>

            {/* Circuit Wire Rendering */}
            <div className="bg-black/80 rounded-xl p-6 border border-white/10 flex flex-col gap-6 overflow-x-auto">
              {/* Qubit 0: Input Signal */}
              <div className="flex items-center gap-4 min-w-[650px]">
                <div className="w-20 shrink-0 font-mono text-[10px]">
                  <span className="text-cyan-400 font-bold">q₀: |0⟩</span>
                  <span className="text-[8px] text-zinc-500 block">Input Voltage</span>
                </div>
                <div className="flex-1 relative flex items-center">
                  <div className="h-[2px] bg-zinc-700 w-full absolute" />
                  
                  {/* Gate 1: Rx */}
                  <div className="relative z-10 ml-12 bg-cyan-950 border border-cyan-400 text-cyan-200 px-3 py-2 rounded-lg flex flex-col items-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    <span className="font-bold text-[10px]">Rx(θ₀)</span>
                    <span className="text-[7.5px] text-[#00ffcc] font-mono font-bold">
                      {currentState.angles.theta0_instant.toFixed(3)} rad ({currentState.angles.theta0_deg.toFixed(1)}°)
                    </span>
                  </div>

                  {/* CNOT 0 -> 1 Control point */}
                  <div className="relative z-10 ml-28 flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                    <div className="w-[2px] h-12 bg-cyan-400 absolute top-2" />
                  </div>
                </div>
              </div>

              {/* Qubit 1: Substrate Memory Stick */}
              <div className="flex items-center gap-4 min-w-[650px]">
                <div className="w-20 shrink-0 font-mono text-[10px]">
                  <span className="text-pink-400 font-bold">q₁: |0⟩</span>
                  <span className="text-[8px] text-zinc-500 block">Substrate Memory</span>
                </div>
                <div className="flex-1 relative flex items-center">
                  <div className="h-[2px] bg-zinc-700 w-full absolute" />
                  
                  {/* Gate 1: Ry */}
                  <div className="relative z-10 ml-12 bg-pink-950 border border-pink-400 text-pink-200 px-3 py-2 rounded-lg flex flex-col items-center shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                    <span className="font-bold text-[10px]">Ry(θ₁)</span>
                    <span className="text-[7.5px] text-pink-300 font-mono font-bold">
                      {currentState.angles.theta1_memory.toFixed(3)} rad ({currentState.angles.theta1_deg.toFixed(1)}°)
                    </span>
                  </div>

                  {/* CNOT 0 -> 1 Target point */}
                  <div className="relative z-10 ml-28 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-cyan-400 flex items-center justify-center bg-black">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    </div>
                  </div>

                  {/* CNOT 1 -> 2 Control point */}
                  <div className="relative z-10 ml-28 flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                    <div className="w-[2px] h-12 bg-purple-400 absolute top-2" />
                  </div>
                </div>
              </div>

              {/* Qubit 2: 28 GHz Clock & Output Readout */}
              <div className="flex items-center gap-4 min-w-[650px]">
                <div className="w-20 shrink-0 font-mono text-[10px]">
                  <span className="text-amber-400 font-bold">q₂: |0⟩</span>
                  <span className="text-[8px] text-zinc-500 block">28 GHz Field Clock</span>
                </div>
                <div className="flex-1 relative flex items-center">
                  <div className="h-[2px] bg-zinc-700 w-full absolute" />
                  
                  {/* Gate 1: Rz */}
                  <div className="relative z-10 ml-12 bg-amber-950 border border-amber-400 text-amber-200 px-3 py-2 rounded-lg flex flex-col items-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    <span className="font-bold text-[10px]">Rz(θ₂)</span>
                    <span className="text-[7.5px] text-amber-300 font-mono font-bold">
                      {currentState.angles.theta2_osc.toFixed(3)} rad ({currentState.angles.theta2_deg.toFixed(1)}°)
                    </span>
                  </div>

                  {/* CNOT 1 -> 2 Target point */}
                  <div className="relative z-10 ml-64 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-purple-400 flex items-center justify-center bg-black">
                      <div className="w-2 h-2 rounded-full bg-purple-400" />
                    </div>
                  </div>

                  {/* Measurement Meter */}
                  <div className="relative z-10 ml-20 bg-emerald-950 border border-emerald-400 text-emerald-200 px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <span className="font-bold text-[10px]">M(Z)</span>
                    <span className="text-[8px] font-mono text-[#00ffcc]">→ c₀</span>
                  </div>
                </div>
              </div>

              {/* Classical Register c0 */}
              <div className="flex items-center gap-4 min-w-[650px] pt-2 border-t border-zinc-800">
                <div className="w-20 shrink-0 font-mono text-[10px]">
                  <span className="text-emerald-400 font-bold">c₀: [1 bit]</span>
                  <span className="text-[8px] text-zinc-500 block">Output Wave</span>
                </div>
                <div className="flex-1 relative flex items-center">
                  <div className="h-[1px] bg-zinc-600 w-full absolute top-1" />
                  <div className="h-[1px] bg-zinc-600 w-full absolute bottom-1" />
                  <div className="relative z-10 ml-[470px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40 text-[9px] font-bold font-mono">
                    Expectation: {(currentState.prob1Sampled * 100).toFixed(1)}% → {currentState.quantumPhaseOut.toFixed(1)}°
                  </div>
                </div>
              </div>
            </div>

            {/* Mapping Strategy Reference Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400 uppercase text-[8px]">
                    <th className="py-2 px-3">Classical Element</th>
                    <th className="py-2 px-3">Cedar / Substrate Formula</th>
                    <th className="py-2 px-3">Quantum / Qiskit Equivalent</th>
                    <th className="py-2 px-3">Physical Mechanism</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  <tr>
                    <td className="py-2.5 px-3 text-cyan-300 font-bold">Input Signal</td>
                    <td className="py-2.5 px-3 text-zinc-300">instant = (voltage - 0.68) * 42 ...</td>
                    <td className="py-2.5 px-3 text-[#00ffcc]">Parameterized Rotation Rx(θ₀)</td>
                    <td className="py-2.5 px-3 text-zinc-400">Encodes instantaneous analog amplitude as a physical phase angle on qubit 0.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-pink-300 font-bold">Memory Stick</td>
                    <td className="py-2.5 px-3 text-zinc-300">memory += 0.08 * (instant - memory)</td>
                    <td className="py-2.5 px-3 text-pink-400">Parameterized Rotation Ry(θ₁) + CNOT(0,1)</td>
                    <td className="py-2.5 px-3 text-zinc-400">Uses entanglement to store short-term historical dependencies across multiple steps.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-amber-300 font-bold">Base Harmony</td>
                    <td className="py-2.5 px-3 text-zinc-300">osc = 6 * sin(2π * 28 * t)</td>
                    <td className="py-2.5 px-3 text-amber-400">Periodic Phase Modulation Rz(θ₂)</td>
                    <td className="py-2.5 px-3 text-zinc-400">Continuous driving field frequency vector tracking time (t) along the Z-axis.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-emerald-300 font-bold">Phase-Out Green Wave</td>
                    <td className="py-2.5 px-3 text-zinc-300">phase_out = clamp(...)</td>
                    <td className="py-2.5 px-3 text-emerald-400">Z-Axis Expectation Measurement M(q2)</td>
                    <td className="py-2.5 px-3 text-zinc-400">Collapses the quantum state upon measurement to yield the classical output stream.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BLOCH SPHERE & BASIS STATE PROBABILITIES */}
      {activeTab === 'bloch_states' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bloch Qubit 0: Input Voltage */}
            <div className="bg-zinc-950 border border-cyan-500/30 rounded-xl p-4 flex flex-col items-center gap-3">
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-bold text-cyan-300 uppercase">Qubit 0: Voltage Input</span>
                <span className="text-[8px] bg-cyan-500/20 text-[#00ffcc] px-1.5 py-0.5 rounded">Rx(θ₀)</span>
              </div>

              {/* 2D Polar Projection of Bloch Sphere */}
              <div className="w-32 h-32 rounded-full border-2 border-dashed border-cyan-500/40 relative flex items-center justify-center bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <div className="absolute top-1 text-[8px] text-zinc-500">|0⟩</div>
                <div className="absolute bottom-1 text-[8px] text-zinc-500">|1⟩</div>
                <div className="w-full h-[1px] bg-zinc-700/50 absolute" />
                <div className="h-full w-[1px] bg-zinc-700/50 absolute" />

                {/* State Vector */}
                <div 
                  className="w-1 bg-[#00ffcc] h-14 origin-bottom rounded-full absolute bottom-16 shadow-[0_0_10px_#00ffcc]"
                  style={{
                    transform: `rotate(${currentState.angles.theta0_deg}deg)`
                  }}
                />
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 z-10" />
              </div>

              <div className="w-full space-y-1 font-mono text-[9px] bg-black/60 p-2.5 rounded">
                <div className="flex justify-between">
                  <span className="text-zinc-500">⟨X₀⟩:</span>
                  <span className="text-zinc-300">{currentState.blochVectors.q0.x.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">⟨Y₀⟩:</span>
                  <span className="text-cyan-300">{currentState.blochVectors.q0.y.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">⟨Z₀⟩:</span>
                  <span className="text-cyan-300">{currentState.blochVectors.q0.z.toFixed(3)}</span>
                </div>
              </div>
            </div>

            {/* Bloch Qubit 1: Substrate Memory */}
            <div className="bg-zinc-950 border border-pink-500/30 rounded-xl p-4 flex flex-col items-center gap-3">
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-bold text-pink-300 uppercase">Qubit 1: Substrate Memory</span>
                <span className="text-[8px] bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded">Ry(θ₁)</span>
              </div>

              {/* 2D Polar Projection of Bloch Sphere */}
              <div className="w-32 h-32 rounded-full border-2 border-dashed border-pink-500/40 relative flex items-center justify-center bg-pink-950/20 shadow-[0_0_20px_rgba(236,72,153,0.15)]">
                <div className="absolute top-1 text-[8px] text-zinc-500">|0⟩</div>
                <div className="absolute bottom-1 text-[8px] text-zinc-500">|1⟩</div>
                <div className="w-full h-[1px] bg-zinc-700/50 absolute" />
                <div className="h-full w-[1px] bg-zinc-700/50 absolute" />

                {/* State Vector */}
                <div 
                  className="w-1 bg-pink-400 h-14 origin-bottom rounded-full absolute bottom-16 shadow-[0_0_10px_#ec4899]"
                  style={{
                    transform: `rotate(${currentState.angles.theta1_deg}deg)`
                  }}
                />
                <div className="w-2.5 h-2.5 rounded-full bg-pink-400 z-10" />
              </div>

              <div className="w-full space-y-1 font-mono text-[9px] bg-black/60 p-2.5 rounded">
                <div className="flex justify-between">
                  <span className="text-zinc-500">⟨X₁⟩:</span>
                  <span className="text-pink-300">{currentState.blochVectors.q1.x.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">⟨Y₁⟩:</span>
                  <span className="text-zinc-300">{currentState.blochVectors.q1.y.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">⟨Z₁⟩:</span>
                  <span className="text-pink-300">{currentState.blochVectors.q1.z.toFixed(3)}</span>
                </div>
              </div>
            </div>

            {/* Bloch Qubit 2: 28 GHz Clock Field */}
            <div className="bg-zinc-950 border border-amber-500/30 rounded-xl p-4 flex flex-col items-center gap-3">
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-bold text-amber-300 uppercase">Qubit 2: 28 GHz Clock Field</span>
                <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">Rz(θ₂)</span>
              </div>

              {/* 2D Polar Projection of Bloch Sphere */}
              <div className="w-32 h-32 rounded-full border-2 border-dashed border-amber-500/40 relative flex items-center justify-center bg-amber-950/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                <div className="absolute top-1 text-[8px] text-zinc-500">|0⟩</div>
                <div className="absolute bottom-1 text-[8px] text-zinc-500">|1⟩</div>
                <div className="w-full h-[1px] bg-zinc-700/50 absolute" />
                <div className="h-full w-[1px] bg-zinc-700/50 absolute" />

                {/* State Vector */}
                <div 
                  className="w-1 bg-amber-400 h-14 origin-bottom rounded-full absolute bottom-16 shadow-[0_0_10px_#f59e0b]"
                  style={{
                    transform: `rotate(${currentState.angles.theta2_deg}deg)`
                  }}
                />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 z-10" />
              </div>

              <div className="w-full space-y-1 font-mono text-[9px] bg-black/60 p-2.5 rounded">
                <div className="flex justify-between">
                  <span className="text-zinc-500">⟨X₂⟩:</span>
                  <span className="text-amber-300">{currentState.blochVectors.q2.x.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">⟨Y₂⟩:</span>
                  <span className="text-amber-300">{currentState.blochVectors.q2.y.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">⟨Z₂⟩:</span>
                  <span className="text-amber-300">{currentState.blochVectors.q2.z.toFixed(3)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3-Qubit Basis State Distribution (|000> to |111>) */}
          <div className="bg-zinc-950 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
            <span className="text-xs font-black text-white uppercase tracking-wider">
              3-Qubit Superposition Probabilities: |q₀ q₁ q₂⟩ Statevector
            </span>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {(Object.entries(currentState.basisProbabilities) as [string, number][]).map(([basis, prob]) => (
                <div key={basis} className="bg-black/70 border border-white/10 rounded-lg p-2.5 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-cyan-300">|{basis}⟩</span>
                  <div className="w-full bg-zinc-900 h-20 rounded relative flex items-end overflow-hidden">
                    <div 
                      className={`w-full transition-all duration-100 ${
                        prob > 0.01 ? 'bg-gradient-to-t from-cyan-600 to-[#00ffcc]' : 'bg-transparent'
                      }`}
                      style={{ height: `${Math.round(prob * 100)}%` }}
                    />
                  </div>
                  <span className="text-[8px] font-mono text-zinc-400">
                    {(prob * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: QISKIT PYTHON CODE & OPENQASM HUB */}
      {activeTab === 'qiskit_code' && (
        <div className="flex flex-col gap-4">
          {/* Header banner */}
          <div className="bg-gradient-to-r from-purple-950/40 via-zinc-950 to-cyan-950/40 p-4 rounded-xl border border-purple-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-2">
                <Code size={16} />
                <span>Qiskit Python Architecture: 3-Part Modular Realization</span>
              </span>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                The classical memory stick runs from Jar voltage; the 3-qubit circuit carries that stick; one-shot hybrid loop measures the quantum Phase-Out.
              </p>
            </div>
            <button
              onClick={() => handleCopy(currentState.pythonCode, 'qiskit_py_full')}
              className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[9px] font-black uppercase rounded-lg flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] cursor-pointer shrink-0"
            >
              {copiedCode === 'qiskit_py_full' ? <Check size={12} className="text-emerald-300" /> : <Copy size={12} />}
              <span>{copiedCode === 'qiskit_py_full' ? 'COPIED FULL SCRIPT!' : 'COPY FULL SCRIPT (.PY)'}</span>
            </button>
          </div>

          {/* PART 1: Classical side (Jar -> Phase-Out + Memory) */}
          <div className="bg-zinc-950 border border-emerald-500/30 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold">1</span>
                <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                  Classical side (Jar → Phase-Out + Memory)
                </span>
              </div>
              <button
                onClick={() => handleCopy(`import math

class PhaseOutState:
    def __init__(self):
        self.po = 0.0
        self.memory = 0.0

    def update(self, voltage, jitter, t, dt=0.001):
        shimmer = 22.0 + (jitter * 38.0)
        instant = (voltage - 0.68) * 42.0 - 0.15 * shimmer

        self.memory += 0.08 * (instant - self.memory) * (dt / 0.001)
        self.memory = max(-40.0, min(40.0, self.memory))

        osc = 6.0 * math.sin(2 * math.pi * 28.0 * t)
        self.po = 0.65 * instant + 0.90 * self.memory + 0.25 * osc
        self.po = max(-55.0, min(55.0, self.po))
        return self.po, self.memory`, 'part1_code')}
                className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400 text-emerald-200 text-[8px] font-bold uppercase rounded flex items-center gap-1 transition-all cursor-pointer"
              >
                {copiedCode === 'part1_code' ? <Check size={10} className="text-emerald-300" /> : <Copy size={10} />}
                <span>{copiedCode === 'part1_code' ? 'COPIED' : 'COPY PART 1'}</span>
              </button>
            </div>
            <pre className="p-3 bg-black/90 rounded-lg border border-emerald-500/20 text-emerald-200 text-[9px] font-mono overflow-x-auto leading-relaxed">
{`import math

class PhaseOutState:
    def __init__(self):
        self.po = 0.0
        self.memory = 0.0

    def update(self, voltage, jitter, t, dt=0.001):
        shimmer = 22.0 + (jitter * 38.0)
        instant = (voltage - 0.68) * 42.0 - 0.15 * shimmer

        self.memory += 0.08 * (instant - self.memory) * (dt / 0.001)
        self.memory = max(-40.0, min(40.0, self.memory))

        osc = 6.0 * math.sin(2 * math.pi * 28.0 * t)
        self.po = 0.65 * instant + 0.90 * self.memory + 0.25 * osc
        self.po = max(-55.0, min(55.0, self.po))
        return self.po, self.memory`}
            </pre>
          </div>

          {/* PART 2: Quantum side (memory & voltage -> 3-qubit circuit) */}
          <div className="bg-zinc-950 border border-cyan-500/30 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold">2</span>
                <span className="text-xs font-black text-cyan-300 uppercase tracking-wider">
                  Quantum side (memory & voltage → 3-qubit circuit)
                </span>
              </div>
              <button
                onClick={() => handleCopy(`from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
import numpy as np

def cedar_circuit(voltage, memory, osc=0.0):
    """
    Direct mapping:
    q0 = input voltage   → Rx
    q1 = substrate memory → Ry   (the stick)
    q2 = drive/clock     → Rz
    """
    # scale classical values into rotation angles (radians)
    theta0 = np.clip((voltage - 0.4) * 3.5, 0, np.pi)      # Rx
    theta1 = np.clip((memory + 40) / 80 * np.pi, 0, np.pi) # Ry (memory stick)
    theta2 = np.clip(abs(osc) * 0.4, 0, np.pi)             # Rz

    qc = QuantumCircuit(3, 1)
    qc.rx(theta0, 0)
    qc.ry(theta1, 1)
    qc.rz(theta2, 2)
    qc.cx(0, 1)
    qc.cx(1, 2)
    qc.measure(2, 0)
    return qc, theta1`, 'part2_code')}
                className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400 text-cyan-200 text-[8px] font-bold uppercase rounded flex items-center gap-1 transition-all cursor-pointer"
              >
                {copiedCode === 'part2_code' ? <Check size={10} className="text-emerald-300" /> : <Copy size={10} />}
                <span>{copiedCode === 'part2_code' ? 'COPIED' : 'COPY PART 2'}</span>
              </button>
            </div>
            <pre className="p-3 bg-black/90 rounded-lg border border-cyan-500/20 text-cyan-200 text-[9px] font-mono overflow-x-auto leading-relaxed">
{`from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
import numpy as np

def cedar_circuit(voltage, memory, osc=0.0):
    """
    Direct mapping:
    q0 = input voltage   → Rx
    q1 = substrate memory → Ry   (the stick)
    q2 = drive/clock     → Rz
    """
    # scale classical values into rotation angles (radians)
    theta0 = np.clip((voltage - 0.4) * 3.5, 0, np.pi)      # Rx
    theta1 = np.clip((memory + 40) / 80 * np.pi, 0, np.pi) # Ry (memory stick)
    theta2 = np.clip(abs(osc) * 0.4, 0, np.pi)             # Rz

    qc = QuantumCircuit(3, 1)
    qc.rx(theta0, 0)
    qc.ry(theta1, 1)
    qc.rz(theta2, 2)
    qc.cx(0, 1)
    qc.cx(1, 2)
    qc.measure(2, 0)
    return qc, theta1`}
            </pre>
          </div>

          {/* PART 3: One-shot hybrid loop */}
          <div className="bg-zinc-950 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-bold">3</span>
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  One-shot hybrid loop (run_hybrid_step)
                </span>
              </div>
              <button
                onClick={() => handleCopy(`def run_hybrid_step(voltage, jitter, t, state, shots=1024):
    po, memory = state.update(voltage, jitter, t)
    qc, mem_angle = cedar_circuit(voltage, memory)
    
    sim = AerSimulator()
    job = sim.run(transpile(qc, sim), shots=shots)
    counts = job.result().get_counts()
    
    p1 = counts.get('1', 0) / shots
    quantum_po = (p1 * 110) - 55          # same remap used in the UI
    
    return {
        'classical_po': po,
        'memory': memory,
        'memory_angle_deg': np.degrees(mem_angle),
        'quantum_po': quantum_po,
        'p1': p1
    }`, 'part3_code')}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400 text-amber-200 text-[8px] font-bold uppercase rounded flex items-center gap-1 transition-all cursor-pointer"
              >
                {copiedCode === 'part3_code' ? <Check size={10} className="text-emerald-300" /> : <Copy size={10} />}
                <span>{copiedCode === 'part3_code' ? 'COPIED' : 'COPY PART 3'}</span>
              </button>
            </div>
            <pre className="p-3 bg-black/90 rounded-lg border border-amber-500/20 text-amber-200 text-[9px] font-mono overflow-x-auto leading-relaxed">
{`def run_hybrid_step(voltage, jitter, t, state, shots=1024):
    po, memory = state.update(voltage, jitter, t)
    qc, mem_angle = cedar_circuit(voltage, memory)
    
    sim = AerSimulator()
    job = sim.run(transpile(qc, sim), shots=shots)
    counts = job.result().get_counts()
    
    p1 = counts.get('1', 0) / shots
    quantum_po = (p1 * 110) - 55          # same remap used in the UI
    
    return {
        'classical_po': po,
        'memory': memory,
        'memory_angle_deg': np.degrees(mem_angle),
        'quantum_po': quantum_po,
        'p1': p1
    }`}
            </pre>
          </div>

          {/* Dynamic OpenQASM 2.0 Output */}
          <div className="bg-zinc-950 border border-cyan-500/30 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-cyan-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Live Dynamic OpenQASM 2.0 Representation
                </span>
              </div>
              <button
                onClick={() => handleCopy(currentState.qasm2, 'qasm2')}
                className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400 text-cyan-200 text-[8px] font-bold uppercase rounded flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedCode === 'qasm2' ? <Check size={10} className="text-emerald-300" /> : <Copy size={10} />}
                <span>{copiedCode === 'qasm2' ? 'COPIED!' : 'COPY QASM'}</span>
              </button>
            </div>

            <pre className="p-3 bg-black/90 rounded-lg border border-cyan-500/20 text-[#00ffcc] text-[9px] font-mono overflow-x-auto leading-relaxed">
              <code>{currentState.qasm2}</code>
            </pre>
          </div>
        </div>
      )}

      {/* TAB 5: IBM QUANTUM HARDWARE INTEGRATION BLUEPRINT */}
      {activeTab === 'ibm_hardware' && (
        <div className="flex flex-col gap-4">
          <div className="bg-zinc-950 border border-purple-500/40 rounded-xl p-5 flex flex-col gap-4 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Deploying Cedar Feedback Loops to Physical Quantum Hardware (IBM Quantum)
                </span>
              </div>
              <span className="text-[9px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/40 font-bold">
                QISKIT RUNTIME PRIMITIVES
              </span>
            </div>

            <p className="text-[11px] text-zinc-300 leading-relaxed">
              To send the Cedar feedback loop from software simulation to real superconducting transmon qubits, replace <code className="text-cyan-300">AerSimulator()</code> with an <strong className="text-purple-300">IBM Quantum Runtime Sampler</strong>. This sends the packed <code className="text-cyan-300">Rx(instant)</code>, <code className="text-pink-300">Ry(memory)</code>, and <code className="text-amber-300">Rz(osc)</code> gates over the IBM Quantum API to execute directly on a physical quantum processor unit (QPU).
            </p>

            {/* Implementation Step 1 & 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-black/80 p-3.5 rounded-lg border border-purple-500/20 space-y-2">
                <span className="text-[10px] font-bold text-purple-300 uppercase">
                  Step 1: Authenticate with IBM Quantum Token
                </span>
                <pre className="p-2.5 bg-zinc-950 rounded text-[9px] text-zinc-300 font-mono overflow-x-auto">
{`from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2

# 1. Save your IBM Quantum API Token
QiskitRuntimeService.save_account(
    channel="ibm_quantum",
    token="YOUR_IBM_QUANTUM_API_TOKEN",
    overwrite=True
)

service = QiskitRuntimeService()
backend = service.least_busy(operational=True, simulator=False)
print("Connected to Physical QPU:", backend.name)`}
                </pre>
              </div>

              <div className="bg-black/80 p-3.5 rounded-lg border border-purple-500/20 space-y-2">
                <span className="text-[10px] font-bold text-cyan-300 uppercase">
                  Step 2: Stream Feedback Loop into Physical Sampler
                </span>
                <pre className="p-2.5 bg-zinc-950 rounded text-[9px] text-zinc-300 font-mono overflow-x-auto">
{`# 2. Transpile and execute on hardware
from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager

pm = generate_preset_pass_manager(backend=backend, optimization_level=1)
isa_circuit = pm.run(qc)

sampler = SamplerV2(mode=backend)
job = sampler.run([isa_circuit], shots=1024)
result = job.result()

# Extract real quantum measurement counts
counts = result[0].data.c0.get_counts()`}
                </pre>
              </div>
            </div>

            <div className="bg-purple-950/20 border border-purple-500/30 rounded-lg p-3 text-[10px] text-zinc-300 flex items-center justify-between">
              <div>
                <strong className="text-purple-300">Continuous Real-Time Telemetry:</strong>
                <span className="text-zinc-400 ml-1">
                  The local statevector engine running in CyberOS will continue driving your live oscilloscope, while asynchronous batch jobs can query physical QPUs and stream back empirical state distributions.
                </span>
              </div>
              {onOpenPhaseLab && (
                <button
                  onClick={onOpenPhaseLab}
                  className="px-3 py-1.5 bg-[#00ffcc] hover:bg-teal-300 text-black text-[9px] font-black uppercase rounded shrink-0 transition-all cursor-pointer"
                >
                  Return to Phase-Out Lab
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

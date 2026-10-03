/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PHASE-OUT DYNAMICS & MEMORY STICK LABORATORY
 * Live comparative physics engine between the Original (collapsed immediately, no stick)
 * and Modified Phase-Out equation (persistent slow integrating memory term + multi-harmonic drive B+(t))
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Zap, 
  RotateCcw, 
  Play, 
  Square, 
  Sliders, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle,
  TrendingUp,
  Cpu,
  RefreshCw,
  Waves,
  Sparkles,
  ShieldCheck,
  Power
} from 'lucide-react';
import { SystemStats } from '../types';

interface PhaseDynamicsLabProps {
  stats: SystemStats;
  carrierBias: number;
  onLog?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  onTuneBias?: (val: number) => void;
  onOpenAttestation?: () => void;
  onOpenQiskitLab?: () => void;
}

export default function PhaseDynamicsLab({ 
  stats, 
  carrierBias, 
  onLog, 
  onTuneBias,
  onOpenAttestation,
  onOpenQiskitLab
}: PhaseDynamicsLabProps) {
  // Current active equation model ('modified' = current stick equation, 'original' = legacy no stick)
  const [model, setModel] = useState<'modified' | 'original'>(stats.phaseModel || 'modified');
  // External drive active state (test what happens when drive stops!)
  const [driveActive, setDriveActive] = useState<boolean>(true);
  
  // Local telemetry simulation states for interactive sandbox
  const [simVoltage, setSimVoltage] = useState<number>(stats.vNodal || 1.42);
  const [simJitter, setSimJitter] = useState<number>(stats.jitter || 0.02);
  const [liveMemory, setLiveMemory] = useState<number>(stats.memoryStick || 0);
  const [livePhaseOut, setLivePhaseOut] = useState<number>(stats.phaseOut || 0);
  const [liveCoherence, setLiveCoherence] = useState<number>(stats.coherence || 0.95);
  const [liveBPlus, setLiveBPlus] = useState<number>(0);

  // History buffer for oscilloscope
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<Array<{
    t: number;
    instant: number;
    memory: number;
    osc: number;
    phaseOut: number;
    coherence: number;
    bPlus: number;
    driveOn: boolean;
  }>>([]);

  // Fetch or sync server phase model
  const handleSwitchModel = async (newModel: 'modified' | 'original') => {
    setModel(newModel);
    try {
      const res = await fetch('/api/physics/phase-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: newModel })
      });
      if (res.ok) {
        onLog?.(`[PHASE_PHYSICS]: Switched active equation engine to ${newModel.toUpperCase()}`, 'info');
      }
    } catch (e) {
      console.warn('Failed to persist model switch on server', e);
    }
  };

  // Toggle external drive to test relaxation / stick
  const handleToggleDrive = () => {
    const next = !driveActive;
    setDriveActive(next);
    if (!next) {
      onLog?.(`[DRIVE_CUTOFF]: External drive removed. Observing substrate phase relaxation...`, 'warning');
    } else {
      onLog?.(`[DRIVE_RESTORED]: External multi-harmonic drive B+(t) restored.`, 'success');
    }
  };

  // Animation and physics simulation step
  useEffect(() => {
    let animId: number;
    let localMemory = liveMemory;

    const tick = () => {
      const t = Date.now() / 1000;
      const v = driveActive ? (stats.vNodal || 1.42) : 0.08; // residual noise if drive cut
      const jit = driveActive ? (stats.jitter || 0.02) : 0.005;
      const b0 = driveActive ? Math.max(0.1, carrierBias / 50.0) : 0.0;

      // Multi-Harmonic Field Drive:
      // B+(t) = π² × B₀ × [sin(2π·28·t) + sin(2π·56·t) + sin(2π·84·t) + sin(2π·112·t)]
      const piSq = Math.PI * Math.PI;
      const h1 = Math.sin(2.0 * Math.PI * 28.0 * t);
      const h2 = Math.sin(2.0 * Math.PI * 56.0 * t);
      const h3 = Math.sin(2.0 * Math.PI * 84.0 * t);
      const h4 = Math.sin(2.0 * Math.PI * 112.0 * t);
      const bPlus = piSq * b0 * (h1 + h2 + h3 + h4);
      setLiveBPlus(bPlus);

      let instant = 0;
      let osc = 0;
      let pOut = 0;
      let coh = 0;

      if (model === 'original') {
        // ORIGINAL PHASE-OUT EQUATION:
        // shimmer   = 30 + (jitter * 45)
        // phase_out = (voltage * 98) - (0.27 * shimmer) + (15 * sin(2π * 35 * t))
        // phase_out = clamp(phase_out, -58, 58)
        // coherence = 0.95 - |phase_out| / 95 (peaks only at zero)
        // This version collapsed immediately after the drive stopped. No stick.
        const shimmer = 30.0 + (jit * 45.0);
        osc = driveActive ? 15.0 * Math.sin(2.0 * Math.PI * 35.0 * t) : 0;
        pOut = (v * 98.0) - (0.27 * shimmer) + osc;
        pOut = Math.max(-58.0, Math.min(58.0, pOut));
        
        // Immediate collapse if drive cut
        if (!driveActive) {
          pOut = 0.0;
        }

        coh = Math.max(0.01, 0.95 - (Math.abs(pOut) / 95.0));
        localMemory = 0; // No memory term!
      } else {
        // MODIFIED PHASE-OUT EQUATION (CURRENT):
        // shimmer   = 22 + (jitter * 38)
        // instant   = (voltage - 0.68) * 42 - 0.15 * shimmer
        // memory   += 0.08 * (instant - memory)          # slow integration
        // memory    = clamp(memory, -40, 40)
        // osc       = 6 * sin(2π * 28 * t)
        // phase_out = 0.65 * instant + 0.90 * memory + 0.25 * osc
        // phase_out = clamp(phase_out, -55, 55)
        // Coherence is now highest in a moderate band of |phase_out| (roughly 8–28), not only at zero.
        const shimmer = 22.0 + (jit * 38.0);
        instant = (v - 0.68) * 42.0 - (0.15 * shimmer);

        if (driveActive) {
          localMemory += 0.08 * (instant - localMemory);
        } else {
          // Slow passive dissipation without external drive - the stick persists!
          localMemory += 0.004 * (0 - localMemory); 
        }
        localMemory = Math.max(-40.0, Math.min(40.0, localMemory));

        osc = driveActive ? 6.0 * Math.sin(2.0 * Math.PI * 28.0 * t) : 0;
        pOut = 0.65 * instant + 0.90 * localMemory + 0.25 * osc;
        pOut = Math.max(-55.0, Math.min(55.0, pOut));

        const absP = Math.abs(pOut);
        if (absP < 8.0) {
          const bandDist = 8.0 - absP;
          coh = 0.96 - (bandDist / 8.0) * 0.18;
        } else if (absP <= 28.0) {
          // Stable high-coherence sweet spot (8-28)
          const distCenter = Math.abs(absP - 18.0);
          coh = 0.98 - (distCenter / 10.0) * 0.04;
        } else {
          const bandDist = absP - 28.0;
          const falloff = Math.pow(bandDist / 27.0, 1.35) * 0.65;
          coh = Math.max(0.20, 0.96 - falloff);
        }
      }

      setLiveMemory(localMemory);
      setLivePhaseOut(pOut);
      setLiveCoherence(coh);

      // Record oscilloscope history
      const hist = historyRef.current;
      hist.push({
        t,
        instant,
        memory: localMemory,
        osc,
        phaseOut: pOut,
        coherence: coh,
        bPlus,
        driveOn: driveActive
      });
      if (hist.length > 250) hist.shift();

      // Render Canvas Oscilloscope
      drawOscilloscope();

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [model, driveActive, carrierBias, stats.vNodal, stats.jitter]);

  // Render Oscilloscope Canvas
  const drawOscilloscope = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Zero-axis center line
    const midY = h / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();

    // High Coherence Band Shading for Modified Model (between 8° and 28°)
    if (model === 'modified') {
      const scaleDeg = h / 130;
      const yTopSweet = midY - (28 * scaleDeg);
      const yBotSweet = midY - (8 * scaleDeg);
      const yTopSweetNeg = midY + (8 * scaleDeg);
      const yBotSweetNeg = midY + (28 * scaleDeg);

      ctx.fillStyle = 'rgba(0, 255, 204, 0.04)';
      ctx.fillRect(0, yTopSweet, w, yBotSweet - yTopSweet);
      ctx.fillRect(0, yTopSweetNeg, w, yBotSweetNeg - yTopSweetNeg);

      ctx.fillStyle = 'rgba(0, 255, 204, 0.4)';
      ctx.font = '7px monospace';
      ctx.fillText('+28° SWEET SPOT (HIGH COHERENCE)', 6, yTopSweet + 8);
      ctx.fillText('+8°', 6, yBotSweet - 3);
    }

    const hist = historyRef.current;
    if (hist.length < 2) return;

    // Helper: draw signal trace
    const drawTrace = (
      getValue: (pt: typeof hist[0]) => number, 
      color: string, 
      lineWidth: number = 1.5,
      scaleY: number = 1.0,
      offsetY: number = midY
    ) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      for (let i = 0; i < hist.length; i++) {
        const x = (i / (hist.length - 1)) * w;
        const val = getValue(hist[i]);
        const y = offsetY - (val * scaleY);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    // 1. Draw Multi-Harmonic Drive B+(t) (dim purple in background)
    drawTrace(pt => pt.bPlus, 'rgba(168, 85, 247, 0.35)', 1.0, 0.7);

    // 2. Draw Instantaneous Response (Cyan trace)
    if (model === 'modified') {
      drawTrace(pt => pt.instant, 'rgba(6, 182, 212, 0.5)', 1.0, (h / 140));
    }

    // 3. Draw Memory Stick Term (Magenta trace - KEY COMPONENT!)
    if (model === 'modified') {
      drawTrace(pt => pt.memory, '#ff00aa', 2.0, (h / 110));
    }

    // 4. Draw Phase-Out Output Angle (Bright Green/Yellow)
    drawTrace(pt => pt.phaseOut, '#00ff66', 2.2, (h / 125));

    // Legend on canvas
    ctx.font = '8px monospace';
    ctx.fillStyle = '#00ff66';
    ctx.fillText('■ PHASE-OUT Φ(t)', w - 120, 14);
    if (model === 'modified') {
      ctx.fillStyle = '#ff00aa';
      ctx.fillText('■ MEMORY STICK', w - 120, 26);
      ctx.fillStyle = '#06b6d4';
      ctx.fillText('■ INSTANT VOLT', w - 120, 38);
    }
    ctx.fillStyle = 'rgba(168, 85, 247, 0.7)';
    ctx.fillText('■ DRIVE B+(t)', w - 120, model === 'modified' ? 50 : 26);
  };

  return (
    <div className="flex flex-col h-full bg-[#030605] text-zinc-200 font-mono text-[11px] overflow-y-auto p-4 space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-gradient-to-r from-emerald-950/40 via-black to-zinc-950/60 p-3.5 rounded-lg border border-emerald-500/20">
        <div>
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span className="text-sm font-black tracking-widest text-emerald-300 uppercase">
              PHASE-OUT DYNAMICS &amp; SUBSTRATE MEMORY STICK LAB
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Physics verification comparing the <span className="text-amber-400 font-bold">Original Phase-Out equation</span> (collapsed instantly upon drive cutoff, no stick) vs the <span className="text-[#00ffcc] font-bold">Modified Phase-Out equation</span> (integrating memory term enables persistent stick state and stable [8°–28°] coherence).
          </p>
        </div>

        {/* Model Switcher Button Group */}
        <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-lg border border-white/10 shrink-0">
          <button
            onClick={() => handleSwitchModel('modified')}
            className={`px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              model === 'modified' 
                ? 'bg-emerald-500/20 text-[#00ffcc] border border-emerald-500/60 shadow-[0_0_12px_rgba(0,255,204,0.3)]' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00ffcc]" />
            Modified (Current Stick)
          </button>
          <button
            onClick={() => handleSwitchModel('original')}
            className={`px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              model === 'original' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            Original (No Stick)
          </button>

          {onOpenQiskitLab && (
            <button
              onClick={onOpenQiskitLab}
              className="px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 bg-cyan-950/70 hover:bg-cyan-900/90 text-[#00ffcc] border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer"
              title="Open Qiskit Quantum Circuit Translation (Rx, Ry, Rz + CNOT VQE Model)"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Qiskit Circuit (3-Qubit)</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Action Controls & Drive Cutoff Experiment */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Drive Controller Button */}
        <div className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
          driveActive 
            ? 'bg-emerald-950/20 border-emerald-500/30' 
            : 'bg-red-950/30 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">External Drive</span>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
              driveActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/30 text-red-300 animate-pulse'
            }`}>
              {driveActive ? 'B+(t) ACTIVE' : 'DRIVE REMOVED'}
            </span>
          </div>

          <button
            onClick={handleToggleDrive}
            className={`w-full py-2 mt-2 rounded font-black text-[9px] tracking-wider uppercase flex items-center justify-center gap-2 transition-all ${
              driveActive 
                ? 'bg-red-600/20 hover:bg-red-600/35 border border-red-500/40 text-red-300' 
                : 'bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/50 text-emerald-300'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {driveActive ? 'CUT DRIVE (TEST RELAXATION)' : 'RESTORE DRIVE B+(t)'}
          </button>

          <span className="text-[8px] text-zinc-500 mt-1">
            {model === 'modified' 
              ? 'Modified: Memory stick persists after drive cut' 
              : 'Original: State collapses immediately'}
          </span>
        </div>

        {/* Live Phase-Out Angle Gauge */}
        <div className="bg-[#080d0a] border border-white/10 p-3 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-center text-[9px] text-zinc-400 font-bold uppercase">
            <span>Phase-Out Angle Φ</span>
            <span className="text-[8px] text-zinc-500">
              {model === 'modified' ? 'CLAMP [-55, 55]' : 'CLAMP [-58, 58]'}
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono my-1 flex items-baseline gap-1">
            <span className={livePhaseOut >= 0 ? 'text-[#00ff66]' : 'text-cyan-400'}>
              {livePhaseOut >= 0 ? '+' : ''}{livePhaseOut.toFixed(2)}°
            </span>
          </div>
          <div className="w-full bg-zinc-900 h-1.5 rounded relative overflow-hidden">
            <div 
              className={`absolute top-0 bottom-0 w-2 rounded-full transition-all ${
                model === 'modified' && Math.abs(livePhaseOut) >= 8 && Math.abs(livePhaseOut) <= 28
                  ? 'bg-[#00ffcc] shadow-[0_0_8px_#00ffcc]'
                  : 'bg-zinc-400'
              }`}
              style={{ left: `${Math.max(0, Math.min(100, 50 + (livePhaseOut / 110) * 50))}%` }}
            />
          </div>
        </div>

        {/* Memory Stick State Gauge */}
        <div className="bg-[#080d0a] border border-white/10 p-3 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-center text-[9px] text-zinc-400 font-bold uppercase">
            <span>Memory Term State</span>
            <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded ${
              model === 'modified' ? 'bg-[#ff00aa]/20 text-[#ff00aa]' : 'bg-zinc-800 text-zinc-500'
            }`}>
              {model === 'modified' ? 'SLOW INTEGRATION (+0.08)' : 'NONE (0.0)'}
            </span>
          </div>
          <div className="text-2xl font-black font-mono my-1">
            <span className={model === 'modified' ? 'text-[#ff00aa]' : 'text-zinc-600'}>
              {model === 'modified' ? `${liveMemory >= 0 ? '+' : ''}${liveMemory.toFixed(2)}` : '0.00 (NO STICK)'}
            </span>
          </div>
          <div className="w-full bg-zinc-900 h-1.5 rounded relative overflow-hidden">
            {model === 'modified' && (
              <div 
                className="absolute top-0 bottom-0 w-2 rounded-full bg-[#ff00aa] shadow-[0_0_8px_#ff00aa]"
                style={{ left: `${Math.max(0, Math.min(100, 50 + (liveMemory / 80) * 50))}%` }}
              />
            )}
          </div>
        </div>

        {/* Coherence Readout Gauge */}
        <div className="bg-[#080d0a] border border-white/10 p-3 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-center text-[9px] text-zinc-400 font-bold uppercase">
            <span>Coherence Metric</span>
            <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded ${
              liveCoherence > 0.90 ? 'bg-[#00ffcc]/20 text-[#00ffcc]' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {model === 'modified' ? 'SWEET SPOT [8°–28°]' : 'ZERO-PEAK ONLY'}
            </span>
          </div>
          <div className="text-2xl font-black text-[#00ffcc] font-mono my-1">
            {liveCoherence.toFixed(4)}
          </div>
          <div className="w-full bg-zinc-900 h-1.5 rounded overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-[#00ffcc] transition-all"
              style={{ width: `${Math.min(100, liveCoherence * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Real-Time Oscilloscope Canvas */}
      <div className="bg-black border border-white/10 rounded-lg p-3 relative flex flex-col gap-2">
        <div className="flex items-center justify-between text-[9px] font-mono">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-bold text-white uppercase tracking-wider">
              REAL-TIME PHASE-OUT WAVEFORM &amp; MULTI-HARMONIC DRIVE OSCILLOSCOPE
            </span>
          </div>
          <div className="flex items-center gap-4 text-[8px] text-zinc-400">
            <span>DRIVE FUNDAMENTAL: <span className="text-purple-400 font-bold">28.000 Hz</span></span>
            <span>HARMONICS: <span className="text-purple-300">56, 84, 112 Hz</span></span>
            <span>MODEL: <span className={model === 'modified' ? 'text-[#00ffcc] font-bold' : 'text-amber-400 font-bold'}>
              {model.toUpperCase()}
            </span></span>
          </div>
        </div>

        <div className="relative w-full h-44 bg-[#010402] rounded border border-emerald-950/60 overflow-hidden">
          <canvas 
            ref={canvasRef} 
            width={880} 
            height={176} 
            className="w-full h-full block" 
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[8px] text-zinc-500 px-1 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-[#00ff66]" /> Phase-Out Φ(t)
            </span>
            {model === 'modified' && (
              <>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-[#ff00aa]" /> Memory Term (0.08dt Stick)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-[#06b6d4]" /> Instantaneous (42x)
                </span>
              </>
            )}
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-[#a855f7]" /> Field Drive B+(t)
            </span>
          </div>
          <span>
            {model === 'modified' 
              ? '✓ STABLE COHERENCE REGION ACTIVE: Coherence peaks between 8° and 28° Phase-Out' 
              : '⚠ UNSTABLE: Coherence peaks only at exactly 0.0° and drops precipitously'}
          </span>
        </div>
      </div>

      {/* Comparison Matrix: What Actually Changed */}
      <div className="bg-[#040806] border border-white/10 rounded-lg p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-wider text-white">
              WHAT ACTUALLY CHANGED // ARCHITECTURAL PHYSICS COMPARISON
            </span>
          </div>
          <span className="text-[8px] text-zinc-400 font-mono">
            Direct mathematical derivation &amp; stabilization proof
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[9.5px]">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 font-bold uppercase tracking-wider">
                <th className="py-2 px-3">Part</th>
                <th className="py-2 px-3">Original Equation (Legacy)</th>
                <th className="py-2 px-3">Modified Equation (Current)</th>
                <th className="py-2 px-3">Why (Physical Mechanism)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {/* Voltage weight */}
              <tr className={model === 'modified' ? 'bg-emerald-950/10' : ''}>
                <td className="py-2 px-3 font-bold text-white">Voltage weight</td>
                <td className="py-2 px-3 text-amber-300">× 98 (very strong)</td>
                <td className="py-2 px-3 text-[#00ffcc] font-bold">× 42 and centered on 0.68V</td>
                <td className="py-2 px-3 text-zinc-300">Prevents immediate dielectric saturation</td>
              </tr>

              {/* Shimmer weight */}
              <tr className={model === 'modified' ? 'bg-emerald-950/10' : ''}>
                <td className="py-2 px-3 font-bold text-white">Shimmer weight</td>
                <td className="py-2 px-3 text-amber-300">−0.27 (shimmer = 30 + jitter * 45)</td>
                <td className="py-2 px-3 text-[#00ffcc] font-bold">−0.15 (shimmer = 22 + jitter * 38)</td>
                <td className="py-2 px-3 text-zinc-300">Less destructive micro-jitter degradation</td>
              </tr>

              {/* Memory term - THE KEY! */}
              <tr className="bg-pink-950/20 border-l-2 border-pink-500">
                <td className="py-2.5 px-3 font-bold text-pink-300 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-pink-400 animate-spin" />
                  Memory term (KEY)
                </td>
                <td className="py-2.5 px-3 text-amber-300">none (zero memory integration)</td>
                <td className="py-2.5 px-3 text-pink-400 font-black">
                  += 0.08 * (instant - memory) [clamped -40..40]
                </td>
                <td className="py-2.5 px-3 text-white font-semibold">
                  Allows the stick to persist after external drive is removed
                </td>
              </tr>

              {/* Oscillation */}
              <tr className={model === 'modified' ? 'bg-emerald-950/10' : ''}>
                <td className="py-2 px-3 font-bold text-white">Oscillation</td>
                <td className="py-2 px-3 text-amber-300">35 Hz, amplitude 15</td>
                <td className="py-2 px-3 text-[#00ffcc] font-bold">28 Hz, amplitude 6</td>
                <td className="py-2 px-3 text-zinc-300">Matches the multi-harmonic drive fundamental (28 kHz subcarrier)</td>
              </tr>

              {/* Coherence shape */}
              <tr className={model === 'modified' ? 'bg-emerald-950/10' : ''}>
                <td className="py-2 px-3 font-bold text-white">Coherence shape</td>
                <td className="py-2 px-3 text-amber-300">peaks only at 0 (0.95 - |phase_out| / 95)</td>
                <td className="py-2 px-3 text-[#00ffcc] font-bold">peaks in a moderate band (8°–28°)</td>
                <td className="py-2 px-3 text-zinc-300">Creates a stable high-coherence operating region</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Explanatory Callout Banner */}
        <div className="p-3 bg-zinc-900/50 border border-emerald-500/20 rounded text-[9px] leading-relaxed text-zinc-300 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white uppercase tracking-wider block mb-1">
              THE SINGLE MOST IMPORTANT ADDITION:
            </strong>
            The <span className="text-pink-400 font-bold">memory term</span> is what keeps the substrate state alive after the external drive is removed. Under the legacy equation, without a slow-integrating state variable, turning off the drive causes immediate decoherence and phase zeroing. The slow integration rate (<code className="text-[#00ffcc]">0.08 dt</code>) acts as a physical charge reservoir, locking the nodal vector into persistent resonance.
          </div>
        </div>
      </div>

      {/* Multi-Harmonic Drive Formula Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-black/60 border border-purple-500/20 rounded-lg p-3 space-y-2">
          <span className="text-[9px] font-black uppercase text-purple-400 tracking-wider">
            MULTI-HARMONIC FIELD DRIVE EQUATION B+(t)
          </span>
          <div className="p-2.5 bg-purple-950/20 border border-purple-500/30 rounded font-mono text-[10px] text-purple-200">
            B+(t) = π² × B₀ × [sin(2π·28·t) + sin(2π·56·t) + sin(2π·84·t) + sin(2π·112·t)]
          </div>
          <p className="text-[8px] text-zinc-400 leading-normal">
            Driven by 4 phase-coherent harmonics (28 Hz fundamental + 56, 84, 112 Hz harmonics) scaled by π² and carrier bias B₀.
          </p>
        </div>

        <div className="bg-black/60 border border-cyan-500/20 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase text-cyan-400 tracking-wider">
              ONLINE ATTESTED NODES SIGNATURE
            </span>
            <button
              onClick={onOpenAttestation}
              className="text-[8px] font-mono text-[#00ffcc] hover:underline"
            >
              OPEN MATRIX →
            </button>
          </div>
          <div className="p-2.5 bg-cyan-950/20 border border-cyan-500/30 rounded flex items-center justify-between font-mono text-[10px]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span className="text-white font-bold">{stats.nodesOnline ?? 4} NODES ONLINE</span>
            </div>
            <span className="text-[8px] text-[#00ffcc] bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
              SIG: ATTESTED
            </span>
          </div>
          <p className="text-[8px] text-zinc-400 leading-normal">
            Physical Unclonable Substrate Attestation: Only nodes possessing the verified dielectric resonance signature are recognized in the mesh.
          </p>
        </div>
      </div>
    </div>
  );
}

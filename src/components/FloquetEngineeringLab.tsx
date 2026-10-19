/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * FLOQUET ENGINEERING LABORATORY
 * High-Frequency Truncated Hamiltonian Hybridization & Super-Spin Suite
 * 
 * Formula:
 * H_F ≈ H_0 + (1/ω) ∑_{n=1}^∞ (1/n) [H_n, H_{-n}] + (1/ω²) ∑_{n=1}^∞ (1/n²) [H_n, [H_0, H_{-n}]] + ...
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Zap, 
  Layers, 
  Sliders, 
  RotateCcw, 
  Copy, 
  Check, 
  Play, 
  Pause, 
  Activity, 
  Code, 
  FileText, 
  Compass, 
  ArrowRight, 
  HelpCircle, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  Waves, 
  RefreshCw, 
  Cpu, 
  Binary, 
  ExternalLink 
} from 'lucide-react';
import { SystemStats } from '../types';
import { 
  computeFloquetEngineering, 
  FloquetEngineeringState, 
  generateFloquetCode,
  Matrix2x2,
  Complex,
  cAbs
} from '../quantum/floquetEngine';

interface FloquetEngineeringLabProps {
  stats: SystemStats;
  carrierBias?: number;
  onLog?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  onInjectFloquetFeedback?: (feedback: {
    hybridizationRatio: number;
    effectiveCoupling: number;
    dynamicShift: number;
    superSpinZ: number;
    deltaV: number;
  }) => void;
  onOpenPhaseLab?: () => void;
  onOpenQiskitLab?: () => void;
}

export default function FloquetEngineeringLab({
  stats,
  carrierBias = 50,
  onLog,
  onInjectFloquetFeedback,
  onOpenPhaseLab,
  onOpenQiskitLab
}: FloquetEngineeringLabProps) {
  // Navigation tabs: 'hybridization' | 'matrices' | 'harmonics' | 'code' | 'theory'
  const [activeTab, setActiveTab] = useState<'hybridization' | 'matrices' | 'harmonics' | 'code' | 'theory'>('hybridization');

  // Interactive Drive Controls
  const [driveFreqHz, setDriveFreqHz] = useState<number>(28.0); // 28 Hz base drive
  const [driveAmpB0, setDriveAmpB0] = useState<number>(1.25);
  const [harmonicsCount, setHarmonicsCount] = useState<number>(4);
  const [staticSplitting, setStaticSplitting] = useState<number>(2.4);
  const [staticDetuning, setStaticDetuning] = useState<number>(0.4);
  const [phaseLag, setPhaseLag] = useState<number>(0.35); // non-commuting quadrature phase
  const [lockToJarTelemetry, setLockToJarTelemetry] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [activeOrder, setActiveOrder] = useState<'all' | '0' | '1' | '2'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Canvas refs for visualizer
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  // Compute live Floquet state
  const floquetState: FloquetEngineeringState = useMemo(() => {
    const omega = 2 * Math.PI * driveFreqHz;
    return computeFloquetEngineering({
      omega,
      b0: driveAmpB0,
      harmonicsCount,
      staticSplitting,
      staticDetuning,
      vNodal: lockToJarTelemetry ? (stats.vNodal || 1.42) : 1.42,
      carrierBias: lockToJarTelemetry ? carrierBias : 50,
      memoryStick: lockToJarTelemetry ? (stats.memoryStick || 12.0) : 12.0,
      phaseLag
    });
  }, [
    driveFreqHz, 
    driveAmpB0, 
    harmonicsCount, 
    staticSplitting, 
    staticDetuning, 
    phaseLag, 
    lockToJarTelemetry, 
    stats.vNodal, 
    stats.memoryStick, 
    carrierBias
  ]);

  // Code generation
  const generatedCode = useMemo(() => {
    return generateFloquetCode(floquetState);
  }, [floquetState]);

  // Handle Injecting Super-Spin Feedback to Jar Chamber
  const handleInjectFeedback = () => {
    const deltaV = (floquetState.superSpinPolarization.z * 0.04) + (floquetState.effectiveTransverseCoupling * 0.02);
    if (onInjectFloquetFeedback) {
      onInjectFloquetFeedback({
        hybridizationRatio: floquetState.branchHybridizationRatio,
        effectiveCoupling: floquetState.effectiveTransverseCoupling,
        dynamicShift: floquetState.effectiveDynamicLambShift,
        superSpinZ: floquetState.superSpinPolarization.z,
        deltaV
      });
    }
    onLog?.(
      `[FLOQUET_INJECTED]: Super-spin state synthesized! Hybridization: ${(floquetState.branchHybridizationRatio * 100).toFixed(1)}%, Jeff: ${floquetState.effectiveTransverseCoupling.toFixed(3)}, ΔV: ${(deltaV * 1000).toFixed(1)} mV`,
      'success'
    );
  };

  // Canvas Animation: Top/Bottom Branch Hybridization + Super-Spin Precession
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;
      timeRef.current += isSimulating ? 0.03 : 0;
      const t = timeRef.current;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background grid
      ctx.fillStyle = '#050a08';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(0, 255, 204, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
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

      // Visual split: Left 60% = Branch Hybridization Energy Level & Wavefunction Dispersion,
      // Right 40% = Super-Spin Bloch Sphere & Phase-Space Projection
      const splitX = w * 0.58;

      // Divider line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(splitX, 10);
      ctx.lineTo(splitX, h - 10);
      ctx.stroke();

      // ==========================================
      // SECTION 1: TOP & BOTTOM BRANCH HYBRIDIZATION
      // ==========================================
      const midY = h * 0.5;
      const bareGapPx = Math.min(100, Math.max(30, floquetState.bareGap * 22));
      const hybridGapPx = Math.min(150, Math.max(40, floquetState.hybridizedGap * 24));
      const couplingPx = floquetState.effectiveTransverseCoupling * 35;

      // Title
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('BRANCH HYBRIDIZATION & ANTI-CROSSING GAP (2Δ)', 20, 24);

      // 1. Bare Top Branch (E_top^0) - Unperturbed
      const bareTopY = midY - bareGapPx / 2;
      const bareBotY = midY + bareGapPx / 2;

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(30, bareTopY);
      ctx.lineTo(160, bareTopY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(30, bareBotY);
      ctx.lineTo(160, bareBotY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.fillText('Bare Top |T⟩', 30, bareTopY - 6);
      ctx.fillText('Bare Bottom |B⟩', 30, bareBotY + 14);

      // 2. Hybridizing Bridge: Non-equilibrium Commutator Drive (1/ω)[Hn, H-n]
      const bridgeStartX = 160;
      const bridgeEndX = splitX - 110;
      const midBridgeX = (bridgeStartX + bridgeEndX) / 2;

      // Gradient representing Floquet drive interaction
      const drivePulse = Math.sin(t * 3.5) * 0.2 + 0.8;
      ctx.strokeStyle = `rgba(168, 85, 247, ${0.4 * drivePulse})`;
      ctx.lineWidth = Math.max(1, couplingPx * 0.15);
      
      // Draw anti-crossing curves
      // Upper branch: curves from bareTopY to hybridTopY
      const hybridTopY = midY - hybridGapPx / 2;
      const hybridBotY = midY + hybridGapPx / 2;

      ctx.beginPath();
      ctx.moveTo(bridgeStartX, bareTopY);
      ctx.bezierCurveTo(
        midBridgeX - 30, bareTopY,
        midBridgeX, midY - (hybridGapPx * 0.65),
        bridgeEndX, hybridTopY
      );
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Lower branch: curves from bareBotY to hybridBotY
      ctx.beginPath();
      ctx.moveTo(bridgeStartX, bareBotY);
      ctx.bezierCurveTo(
        midBridgeX - 30, bareBotY,
        midBridgeX, midY + (hybridGapPx * 0.65),
        bridgeEndX, hybridBotY
      );
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Glowing commutator exchange particles
      const numParticles = 6;
      for (let p = 0; p < numParticles; p++) {
        const progress = ((t * 0.8 + p / numParticles) % 1);
        const px = bridgeStartX + (bridgeEndX - bridgeStartX) * progress;
        const py = midY + Math.sin(progress * Math.PI * 4 + t * 4) * (hybridGapPx * 0.35);
        ctx.fillStyle = p % 2 === 0 ? '#00ffcc' : '#e879f9';
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hybridized Super-Spin levels on right of Section 1
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bridgeEndX, hybridTopY);
      ctx.lineTo(splitX - 25, hybridTopY);
      ctx.stroke();

      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bridgeEndX, hybridBotY);
      ctx.lineTo(splitX - 25, hybridBotY);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`Floquet Top |+⟩ (${floquetState.topBranchEnergy.toFixed(2)} rad/s)`, bridgeEndX, hybridTopY - 7);

      ctx.fillStyle = '#a855f7';
      ctx.fillText(`Floquet Bottom |-⟩ (${floquetState.bottomBranchEnergy.toFixed(2)} rad/s)`, bridgeEndX, hybridBotY + 16);

      // Anti-crossing gap indicator
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      const gapX = splitX - 45;
      ctx.beginPath();
      ctx.moveTo(gapX, hybridTopY);
      ctx.lineTo(gapX, hybridBotY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`2Δ = ${floquetState.hybridizedGap.toFixed(2)}`, gapX - 55, midY + 3);

      // Bottom info summary bar in Section 1
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(20, h - 38, splitX - 40, 26);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeRect(20, h - 38, splitX - 40, 26);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '8.5px monospace';
      ctx.fillText(
        `Hybridization Ratio: ${(floquetState.branchHybridizationRatio * 100).toFixed(1)}% | Commutator Coupling Jeff: ${floquetState.effectiveTransverseCoupling.toFixed(3)} | Dyn Lamb Shift: ${floquetState.effectiveDynamicLambShift.toFixed(3)}`,
        28,
        h - 22
      );

      // ==========================================
      // SECTION 2: SUPER-SPIN BLOCH SPHERE PROJECTION
      // ==========================================
      const sphereCenterX = splitX + (w - splitX) / 2;
      const sphereCenterY = midY;
      const sphereRadius = Math.min(80, (w - splitX) * 0.32);

      // Title
      ctx.fillStyle = '#a78bfa';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('SUPER-SPIN BLOCH DYNAMICS', splitX + 20, 24);

      // Sphere Outline & Equator Ellipse
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sphereCenterX, sphereCenterY, sphereRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Equator
      ctx.strokeStyle = 'rgba(0, 255, 204, 0.2)';
      ctx.beginPath();
      ctx.ellipse(sphereCenterX, sphereCenterY, sphereRadius, sphereRadius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Axes: Z vertical, X forward-left, Y right
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.moveTo(sphereCenterX, sphereCenterY - sphereRadius - 12);
      ctx.lineTo(sphereCenterX, sphereCenterY + sphereRadius + 12);
      ctx.stroke();

      ctx.fillStyle = '#67e8f9';
      ctx.font = '8px monospace';
      ctx.fillText('+Z (|T⟩)', sphereCenterX + 6, sphereCenterY - sphereRadius - 4);
      ctx.fillText('-Z (|B⟩)', sphereCenterX + 6, sphereCenterY + sphereRadius + 10);

      // Super-spin vector calculation:
      // Real time precession around effective magnetic field H_F
      const { x: sx, y: sy, z: sz } = floquetState.superSpinPolarization;
      const precFreq = floquetState.hybridizedGap * 0.8;
      const thetaPrec = t * precFreq;
      
      // Rotated coordinates for 3D projection
      const dynamicSx = sx * Math.cos(thetaPrec) - sy * Math.sin(thetaPrec);
      const dynamicSy = sx * Math.sin(thetaPrec) + sy * Math.cos(thetaPrec);
      const dynamicSz = sz;

      const projX = sphereCenterX + dynamicSy * sphereRadius * 0.85 - dynamicSx * sphereRadius * 0.4;
      const projY = sphereCenterY - dynamicSz * sphereRadius + dynamicSx * sphereRadius * 0.2;

      // Draw precession ring
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.ellipse(
        sphereCenterX, 
        sphereCenterY - dynamicSz * sphereRadius, 
        Math.sqrt(Math.max(0, 1 - dynamicSz * dynamicSz)) * sphereRadius, 
        Math.sqrt(Math.max(0, 1 - dynamicSz * dynamicSz)) * sphereRadius * 0.35, 
        0, 0, Math.PI * 2
      );
      ctx.stroke();
      ctx.setLineDash([]);

      // Vector from center to tip
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(sphereCenterX, sphereCenterY);
      ctx.lineTo(projX, projY);
      ctx.stroke();

      // Tip sphere
      ctx.fillStyle = '#00ffcc';
      ctx.shadowColor = '#00ffcc';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(projX, projY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Vector labels
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '8.5px monospace';
      ctx.fillText(`⟨Sx⟩: ${dynamicSx.toFixed(2)}`, splitX + 20, h - 34);
      ctx.fillText(`⟨Sy⟩: ${dynamicSy.toFixed(2)}`, splitX + 20, h - 22);
      ctx.fillText(`⟨Sz⟩: ${dynamicSz.toFixed(2)}`, splitX + 20, h - 10);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [floquetState, isSimulating]);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="flex flex-col h-full bg-[#070b09] text-zinc-200 select-none font-mono overflow-hidden">
      {/* Top Banner / Formula Bar */}
      <div className="bg-[#0b130e] border-b border-emerald-500/20 px-3 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Zap size={14} className="text-emerald-400" />
            FLOQUET ENGINEERING SUITE
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            TRUNCATED EXPANSION
          </span>
          {floquetState.isHighFrequencyRegimeValid ? (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 flex items-center gap-1">
              <ShieldCheck size={10} />
              HIGH-FREQ REGIME (ω/||H|| = {floquetState.regimeRatio.toFixed(1)})
            </span>
          ) : (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
              LOW-FREQ TRANSITION
            </span>
          )}
        </div>

        {/* Live Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleInjectFeedback}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[9px] transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.4)]"
            title="Inject Floquet super-spin shift directly into Jar chamber nodal feedback"
          >
            <Sparkles size={11} />
            <span>INJECT SUPER-SPIN FEEDBACK</span>
          </button>

          <button
            onClick={() => setIsSimulating(prev => !prev)}
            className="p-1 rounded bg-black/40 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 text-[9px]"
            title={isSimulating ? 'Pause live Floquet precession' : 'Resume live Floquet precession'}
          >
            {isSimulating ? <Pause size={12} /> : <Play size={12} />}
          </button>
        </div>
      </div>

      {/* Floquet Engineering Equation Reference Header (Matches user's diagram) */}
      <div className="bg-[#09100c] border-b border-white/10 px-4 py-2.5 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span>Practical truncated form used in most Floquet engineering</span>
              <span className="text-[8.5px] text-zinc-500 font-normal">
                (Keeping first two corrections to H₀)
              </span>
            </div>
            
            {/* The exact formula from the user's diagram */}
            <div className="p-2 rounded bg-black/60 border border-emerald-500/30 font-serif text-[13px] md:text-[14px] text-emerald-200 tracking-wide flex items-center justify-center overflow-x-auto shadow-inner">
              <span className="font-bold">H<sub>F</sub></span>
              <span className="mx-2 text-zinc-400">≈</span>
              <span className="text-amber-300 font-bold">H<sub>0</sub></span>
              <span className="mx-2 text-zinc-400">+</span>
              <div className="inline-flex flex-col items-center justify-center text-[11px] mx-1">
                <span>1</span>
                <span className="w-full border-t border-zinc-400">ω</span>
              </div>
              <span className="text-purple-300 font-bold">∑<sub>n=1</sub><sup>∞</sup></span>
              <div className="inline-flex flex-col items-center justify-center text-[11px] mx-1">
                <span>1</span>
                <span className="w-full border-t border-zinc-400">n</span>
              </div>
              <span className="text-purple-300 font-bold">[H<sub>n</sub>, H<sub>-n</sub>]</span>
              <span className="mx-2 text-zinc-400">+</span>
              <div className="inline-flex flex-col items-center justify-center text-[11px] mx-1">
                <span>1</span>
                <span className="w-full border-t border-zinc-400">ω²</span>
              </div>
              <span className="text-sky-300 font-bold">∑<sub>n=1</sub><sup>∞</sup></span>
              <div className="inline-flex flex-col items-center justify-center text-[11px] mx-1">
                <span>1</span>
                <span className="w-full border-t border-zinc-400">n²</span>
              </div>
              <span className="text-sky-300 font-bold">[H<sub>n</sub>, [H<sub>0</sub>, H<sub>-n</sub>]]</span>
              <span className="mx-2 text-zinc-400">+</span>
              <span className="text-zinc-500">···</span>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="hidden lg:flex flex-col gap-1 text-[9px] bg-black/40 border border-white/10 p-2 rounded shrink-0 w-56">
            <div className="flex justify-between">
              <span className="text-zinc-400">Base Drive ω:</span>
              <span className="text-emerald-300 font-bold">{(floquetState.omega).toFixed(1)} rad/s ({floquetState.driveFreqHz.toFixed(1)} Hz)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Emergent Gap 2Δ:</span>
              <span className="text-amber-300 font-bold">{floquetState.hybridizedGap.toFixed(3)} rad/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Truncation Error:</span>
              <span className="text-teal-300 font-bold">{floquetState.truncationError.toFixed(4)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-[#080d0a] border-b border-white/10 shrink-0 text-[10px]">
        <button
          onClick={() => setActiveTab('hybridization')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all cursor-pointer font-bold ${
            activeTab === 'hybridization'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Activity size={12} />
          <span>BRANCH HYBRIDIZATION & SUPER-SPIN</span>
        </button>

        <button
          onClick={() => setActiveTab('matrices')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all cursor-pointer font-bold ${
            activeTab === 'matrices'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers size={12} />
          <span>EXPANSION MATRICES (H₀, H_F^(1), H_F^(2))</span>
        </button>

        <button
          onClick={() => setActiveTab('harmonics')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all cursor-pointer font-bold ${
            activeTab === 'harmonics'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Waves size={12} />
          <span>HARMONICS B+(t) BREAKDOWN</span>
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all cursor-pointer font-bold ${
            activeTab === 'code'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Code size={12} />
          <span>QISKIT & QUTIP SYNTHESIS</span>
        </button>

        <button
          onClick={() => setActiveTab('theory')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all cursor-pointer font-bold ${
            activeTab === 'theory'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText size={12} />
          <span>PHYSICS THEORY & REFERENCE</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Interactive Canvas or Tab Content */}
        <div className="flex-1 flex flex-col overflow-y-auto p-3">
          {activeTab === 'hybridization' && (
            <div className="flex-1 flex flex-col gap-3 min-h-[420px]">
              {/* Canvas Container */}
              <div className="flex-1 relative bg-black/80 rounded-lg border border-emerald-500/20 overflow-hidden shadow-2xl min-h-[300px]">
                <canvas
                  ref={canvasRef}
                  width={820}
                  height={380}
                  className="w-full h-full block"
                />
              </div>

              {/* Live Metric Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0">
                <div className="bg-[#0b130e] border border-white/10 p-2 rounded">
                  <div className="text-[8.5px] text-zinc-400 uppercase">Super-Spin Hybridization</div>
                  <div className="text-sm font-bold text-emerald-300">
                    {(floquetState.branchHybridizationRatio * 100).toFixed(1)}%
                  </div>
                  <div className="text-[8px] text-zinc-500">1.0 = equal branch superposition</div>
                </div>

                <div className="bg-[#0b130e] border border-white/10 p-2 rounded">
                  <div className="text-[8.5px] text-purple-400 uppercase">1st Order J_eff [H_n, H_-n]</div>
                  <div className="text-sm font-bold text-purple-300">
                    {floquetState.effectiveTransverseCoupling.toFixed(4)} <span className="text-[8px] text-zinc-500">rad/s</span>
                  </div>
                  <div className="text-[8px] text-zinc-500">Generates top/bottom coupling</div>
                </div>

                <div className="bg-[#0b130e] border border-white/10 p-2 rounded">
                  <div className="text-[8.5px] text-sky-400 uppercase">2nd Order Lamb Shift</div>
                  <div className="text-sm font-bold text-sky-300">
                    {floquetState.effectiveDynamicLambShift.toFixed(4)} <span className="text-[8px] text-zinc-500">rad/s</span>
                  </div>
                  <div className="text-[8px] text-zinc-500">Dynamic energy offset correction</div>
                </div>

                <div className="bg-[#0b130e] border border-white/10 p-2 rounded">
                  <div className="text-[8.5px] text-amber-400 uppercase">Stroboscopic Error</div>
                  <div className="text-sm font-bold text-amber-300">
                    {floquetState.truncationError.toFixed(5)}
                  </div>
                  <div className="text-[8px] text-zinc-500">||H_F^trunc - H_F^exact||</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'matrices' && (
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
              <div className="text-xs text-zinc-300">
                Inspecting the individual complex matrix representations of the truncated Floquet expansion terms:
              </div>

              {/* Order selector buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveOrder('all')}
                  className={`px-2 py-1 rounded text-[9px] font-bold border ${activeOrder === 'all' ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-black/50 text-zinc-400 border-white/10'}`}
                >
                  FULL SUM (H₀ + H_F^(1) + H_F^(2))
                </button>
                <button
                  onClick={() => setActiveOrder('0')}
                  className={`px-2 py-1 rounded text-[9px] font-bold border ${activeOrder === '0' ? 'bg-amber-500 text-black border-amber-400' : 'bg-black/50 text-zinc-400 border-white/10'}`}
                >
                  H₀ ONLY (STATIC)
                </button>
                <button
                  onClick={() => setActiveOrder('1')}
                  className={`px-2 py-1 rounded text-[9px] font-bold border ${activeOrder === '1' ? 'bg-purple-500 text-black border-purple-400' : 'bg-black/50 text-zinc-400 border-white/10'}`}
                >
                  H_F^(1) COMMUTATOR SUM
                </button>
                <button
                  onClick={() => setActiveOrder('2')}
                  className={`px-2 py-1 rounded text-[9px] font-bold border ${activeOrder === '2' ? 'bg-sky-500 text-black border-sky-400' : 'bg-black/50 text-zinc-400 border-white/10'}`}
                >
                  H_F^(2) DOUBLE COMMUTATOR SUM
                </button>
              </div>

              {/* Matrices Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* H0 */}
                <div className="bg-[#0b130e] border border-amber-500/30 rounded p-3">
                  <div className="text-[10px] text-amber-300 font-bold mb-1 flex items-center justify-between">
                    <span>H₀ (Average / Static Piece)</span>
                    <span className="text-[8px] text-zinc-400">Norm: {cAbs(floquetState.H0[0][0]).toFixed(3)}</span>
                  </div>
                  <div className="text-[8px] text-zinc-400 mb-2">Original static branch splitting + DC drive component.</div>
                  <MatrixDisplay matrix={floquetState.H0} accentColor="#f59e0b" />
                </div>

                {/* H_F^(1) */}
                <div className="bg-[#0b130e] border border-purple-500/30 rounded p-3">
                  <div className="text-[10px] text-purple-300 font-bold mb-1 flex items-center justify-between">
                    <span>H_F^(1) = (1/ω) ∑ (1/n) [H_n, H_-n]</span>
                    <span className="text-[8px] text-zinc-400">Jeff: {floquetState.effectiveTransverseCoupling.toFixed(3)}</span>
                  </div>
                  <div className="text-[8px] text-zinc-400 mb-2">Generates new effective interactions that hybridize top and bottom branches.</div>
                  <MatrixDisplay matrix={floquetState.HF1} accentColor="#c084fc" />
                </div>

                {/* H_F^(2) */}
                <div className="bg-[#0b130e] border border-sky-500/30 rounded p-3">
                  <div className="text-[10px] text-sky-300 font-bold mb-1 flex items-center justify-between">
                    <span>H_F^(2) = (1/ω²) ∑ (1/n²) [H_n, [H₀, H_-n]]</span>
                    <span className="text-[8px] text-zinc-400">Lamb: {floquetState.effectiveDynamicLambShift.toFixed(3)}</span>
                  </div>
                  <div className="text-[8px] text-zinc-400 mb-2">Renormalizes couplings, produces pseudo-magnetic fields, corrects offsets.</div>
                  <MatrixDisplay matrix={floquetState.HF2} accentColor="#38bdf8" />
                </div>

                {/* H_F_total */}
                <div className="bg-[#0b130e] border border-emerald-500/30 rounded p-3">
                  <div className="text-[10px] text-emerald-300 font-bold mb-1 flex items-center justify-between">
                    <span>H_F^total (Composite Floquet Effective)</span>
                    <span className="text-[8px] text-zinc-400">Gap 2Δ: {floquetState.hybridizedGap.toFixed(3)}</span>
                  </div>
                  <div className="text-[8px] text-zinc-400 mb-2">Synthesizes the complete super-spin Hamiltonian governing stroboscopic dynamics.</div>
                  <MatrixDisplay matrix={floquetState.HF_total} accentColor="#10b981" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'harmonics' && (
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
              <div className="text-[10px] text-zinc-400">
                Detailed decomposition of the periodic drive <span className="text-emerald-300 font-bold">B+(t)</span> into its harmonic Fourier modes n = 1, 2, 3, 4:
              </div>

              <div className="overflow-x-auto border border-white/10 rounded">
                <table className="w-full text-left text-[9px] font-mono border-collapse">
                  <thead>
                    <tr className="bg-black/60 border-b border-white/10 text-zinc-400">
                      <th className="p-2">MODE n</th>
                      <th className="p-2">FREQUENCY</th>
                      <th className="p-2">COMMUTATOR [H_n, H_-n] NORM</th>
                      <th className="p-2">DOUBLE COMMUTATOR NORM</th>
                      <th className="p-2">HYBRIDIZATION WEIGHT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {floquetState.harmonics.map((h) => (
                      <tr key={h.n} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-2 font-bold text-emerald-400">n = {h.n}</td>
                        <td className="p-2 text-zinc-300">
                          {(h.frequency).toFixed(1)} rad/s ({(h.frequency / (2*Math.PI)).toFixed(1)} Hz)
                        </td>
                        <td className="p-2 text-purple-300">
                          {cAbs(h.commutator1[0][1]).toFixed(4)}
                        </td>
                        <td className="p-2 text-sky-300">
                          {cAbs(h.doubleCommutator2[0][0]).toFixed(4)}
                        </td>
                        <td className="p-2 text-emerald-300 font-bold">
                          {(h.couplingContribution * 100).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-400">Executable Python QuTiP and Qiskit code for this exact expansion:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyText(generatedCode.pythonQutip, 'qutip')}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-black/60 hover:bg-white/10 border border-white/10 text-[9px] text-zinc-300"
                  >
                    {copiedCode === 'qutip' ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                    <span>COPY QUTIP</span>
                  </button>
                  <button
                    onClick={() => copyText(generatedCode.qiskitPulse, 'qiskit')}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-black/60 hover:bg-white/10 border border-white/10 text-[9px] text-zinc-300"
                  >
                    {copiedCode === 'qiskit' ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                    <span>COPY QISKIT</span>
                  </button>
                </div>
              </div>

              <div className="bg-black/90 p-3 rounded border border-white/10 text-[9.5px] font-mono text-zinc-300 overflow-x-auto leading-relaxed max-h-[360px]">
                <pre>{generatedCode.pythonQutip}</pre>
              </div>
            </div>
          )}

          {activeTab === 'theory' && (
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto text-xs text-zinc-300 leading-relaxed p-2">
              <div className="bg-[#0b130e] border border-emerald-500/20 rounded p-4">
                <h3 className="text-sm font-bold text-emerald-300 mb-2">
                  Practical Truncated Form in Floquet Engineering
                </h3>
                <p className="mb-3 text-zinc-300">
                  Periodic driving allows one to synthesize non-equilibrium quantum Hamiltonians with properties completely unachievable in static equilibrium.
                  Under high-frequency driving with frequency <span className="text-emerald-400 font-bold">ω</span>, the time-dependent system <span className="font-mono">H(t) = H₀ + ∑_{'{n≠0}'} H_n e^{'{inωt}'}</span> is mapped onto a time-independent effective Floquet Hamiltonian <span className="font-mono">H_F</span> via the Magnus or Van Vleck expansion:
                </p>

                <div className="p-3 bg-black/60 rounded border border-white/10 my-2 font-mono text-[11px] text-emerald-200">
                  H_F ≈ H₀ + (1/ω) ∑_{'{n=1}'}^∞ (1/n) [H_n, H_-n] + (1/ω²) ∑_{'{n=1}'}^∞ (1/n²) [H_n, [H₀, H_-n]] + ···
                </div>

                <h4 className="text-xs font-bold text-amber-300 mt-4 mb-1">What the terms do:</h4>
                <ul className="list-disc list-inside space-y-2 text-zinc-400">
                  <li>
                    <strong className="text-zinc-200">H₀</strong> — the average Hamiltonian (often the original static piece plus any DC component of the drive).
                  </li>
                  <li>
                    <strong className="text-purple-300">(1/ω)[H_n, H_-n]</strong> — generates <span className="text-purple-200 font-semibold">new effective interactions that were not present statically</span>. These are the terms that can hybridize the top and bottom branches and create the super-spin structure.
                  </li>
                  <li>
                    <strong className="text-sky-300">Higher-order terms</strong> — further renormalize couplings, produce effective fields, and correct the energy offsets.
                  </li>
                </ul>

                <h4 className="text-xs font-bold text-teal-300 mt-4 mb-1">Direct Coupling to Substrate Jar:</h4>
                <p className="text-zinc-400">
                  In this OS, the multi-harmonic field drive <span className="text-emerald-300 font-mono">B+(t) = π² B₀ [sin(2π·28·t) + sin(2π·56·t) + sin(2π·84·t) + sin(2π·112·t)]</span> provides the fundamental Fourier harmonics <span className="font-mono">n ∈ {'{1, 2, 3, 4}'}</span>. Combined with the non-equilibrium jar nodal voltage <span className="font-mono">V_nodal</span> and slow integrating memory stick <span className="font-mono">M(t)</span>, it synthesizes an emergent topological super-spin state that dynamically stabilizes the substrate against decoherence.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Live Parameter Controls & Substrate Coupling */}
        <div className="w-full md:w-72 bg-[#090f0c] border-t md:border-t-0 md:border-l border-white/10 p-3 flex flex-col gap-3 shrink-0 overflow-y-auto text-[9px]">
          <div className="flex items-center justify-between pb-1 border-b border-white/10">
            <span className="font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders size={12} className="text-emerald-400" />
              DRIVE PARAMETERS
            </span>
            <button
              onClick={() => {
                setDriveFreqHz(28.0);
                setDriveAmpB0(1.25);
                setHarmonicsCount(4);
                setStaticSplitting(2.4);
                setStaticDetuning(0.4);
                setPhaseLag(0.35);
              }}
              className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white"
              title="Reset parameters to standard 28Hz substrate drive"
            >
              <RotateCcw size={11} />
            </button>
          </div>

          {/* Substrate Telemetry Sync Switch */}
          <div className="p-2 rounded bg-black/40 border border-white/10 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-bold text-zinc-300">Live Nodal Coupling</span>
              <span className="text-[8px] text-zinc-500">Sync with V_nodal &amp; Memory</span>
            </div>
            <button
              onClick={() => setLockToJarTelemetry(prev => !prev)}
              className={`px-2 py-0.5 rounded text-[8px] font-bold border transition-all ${
                lockToJarTelemetry
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                  : 'bg-black/60 text-zinc-500 border-white/10'
              }`}
            >
              {lockToJarTelemetry ? 'LOCKED' : 'MANUAL'}
            </button>
          </div>

          {/* Slider 1: Drive Frequency ω */}
          <div className="space-y-1">
            <div className="flex justify-between text-zinc-400">
              <span>Drive Frequency ω:</span>
              <span className="text-emerald-300 font-bold">{driveFreqHz.toFixed(1)} Hz ({(2 * Math.PI * driveFreqHz).toFixed(1)} rad/s)</span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              step="1"
              value={driveFreqHz}
              onChange={(e) => setDriveFreqHz(parseFloat(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>

          {/* Slider 2: Drive Amplitude B0 */}
          <div className="space-y-1">
            <div className="flex justify-between text-zinc-400">
              <span>Drive Amplitude B₀:</span>
              <span className="text-purple-300 font-bold">{driveAmpB0.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.05"
              value={driveAmpB0}
              onChange={(e) => setDriveAmpB0(parseFloat(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>

          {/* Slider 3: Harmonics Included */}
          <div className="space-y-1">
            <div className="flex justify-between text-zinc-400">
              <span>Harmonic Depth (n):</span>
              <span className="text-cyan-300 font-bold">1 to {harmonicsCount}</span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              step="1"
              value={harmonicsCount}
              onChange={(e) => setHarmonicsCount(parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Slider 4: Static Splitting Δ0 */}
          <div className="space-y-1">
            <div className="flex justify-between text-zinc-400">
              <span>Static Splitting Δ₀:</span>
              <span className="text-amber-300 font-bold">{staticSplitting.toFixed(2)} rad/s</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="6.0"
              step="0.1"
              value={staticSplitting}
              onChange={(e) => setStaticSplitting(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Slider 5: Quadrature Phase Lag */}
          <div className="space-y-1">
            <div className="flex justify-between text-zinc-400">
              <span>Quadrature Non-Commutativity φ:</span>
              <span className="text-sky-300 font-bold">{(phaseLag / Math.PI).toFixed(2)} π</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.57"
              step="0.02"
              value={phaseLag}
              onChange={(e) => setPhaseLag(parseFloat(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          {/* Quick Nav Links */}
          <div className="mt-auto pt-2 border-t border-white/10 flex flex-col gap-1.5">
            <div className="text-[8px] text-zinc-500 uppercase font-bold">Connected Laboratories</div>
            <button
              onClick={onOpenPhaseLab}
              className="flex items-center justify-between p-1.5 rounded bg-black/40 hover:bg-white/10 text-emerald-400 border border-white/5 cursor-pointer text-[8.5px]"
            >
              <span className="flex items-center gap-1.5">
                <Waves size={10} />
                <span>Phase Dynamics Lab</span>
              </span>
              <ArrowRight size={10} />
            </button>
            <button
              onClick={onOpenQiskitLab}
              className="flex items-center justify-between p-1.5 rounded bg-black/40 hover:bg-white/10 text-[#00ffcc] border border-white/5 cursor-pointer text-[8.5px]"
            >
              <span className="flex items-center gap-1.5">
                <Cpu size={10} />
                <span>Qiskit Quantum Lab</span>
              </span>
              <ArrowRight size={10} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Matrix Display Component helper
function MatrixDisplay({ matrix, accentColor }: { matrix: Matrix2x2; accentColor: string }) {
  const formatComp = (c: Complex) => {
    const reStr = c.re.toFixed(3);
    const imStr = c.im >= 0 ? `+${c.im.toFixed(3)}i` : `${c.im.toFixed(3)}i`;
    return (
      <div className="flex flex-col">
        <span className="text-zinc-200">{reStr}</span>
        <span className="text-[7.5px] text-zinc-400">{imStr}</span>
      </div>
    );
  };

  return (
    <div className="bg-black/70 p-2 rounded border border-white/10 font-mono text-[9px] flex items-center justify-center">
      <div className="border-l-2 border-r-2 border-zinc-500 px-3 py-1 grid grid-cols-2 gap-4 text-center">
        <div className="p-1 rounded hover:bg-white/5">{formatComp(matrix[0][0])}</div>
        <div className="p-1 rounded hover:bg-white/5">{formatComp(matrix[0][1])}</div>
        <div className="p-1 rounded hover:bg-white/5">{formatComp(matrix[1][0])}</div>
        <div className="p-1 rounded hover:bg-white/5">{formatComp(matrix[1][1])}</div>
      </div>
    </div>
  );
}

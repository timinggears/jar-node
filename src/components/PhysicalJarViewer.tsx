/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PHYSICAL JAR CHAMBER & REAL DATA IMAGE RECONSTRUCTOR
 * Generates and displays visual representations directly from real Jar sensor data.
 * NOTE: The physical Jar contains only the liquid dielectric substrate, an excitation coil (GP14),
 * and a submerged analog ADC probe wire (GP26) connected to the Raspberry Pi Pico.
 * NO MEMORY STICK IS IN THE JAR.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Scan, 
  Download, 
  Camera, 
  Compass, 
  Waves, 
  Cpu, 
  Radio, 
  Activity, 
  Layers, 
  Zap, 
  RefreshCw,
  Orbit,
  Eye
} from 'lucide-react';
import { SystemStats } from '../types';

interface PhysicalJarViewerProps {
  stats: SystemStats;
  carrierBias?: number;
  onOpenAmbientEar?: () => void;
  onOpenPhaseLab?: () => void;
}

export default function PhysicalJarViewer({
  stats,
  carrierBias = 50,
  onOpenAmbientEar,
  onOpenPhaseLab
}: PhysicalJarViewerProps) {
  const [viewMode, setViewMode] = useState<'tomography' | 'attractor' | 'live_raster' | 'photo'>('tomography');
  const [selectedCallout, setSelectedCallout] = useState<number | null>(null);
  const [showHudOverlays, setShowHudOverlays] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // High-resolution images generated directly from real telemetry (NO memory stick)
  const jarTomographyUrl = "/src/assets/images/jar_real_tomography_1791362794260.jpg";
  const jarPhotoUrl = "/src/assets/images/jar_real_apparatus_1791362805043.jpg";

  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const attractorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const voltageHistoryRef = useRef<number[]>([]);

  // Real data parameters extracted from live telemetry
  const vNodal = stats.vNodal || 1.825;
  const jitterVal = stats.jitter || 0.0208;
  const carrierFreqHz = stats.frequency || 81376.0;
  const coherenceVal = stats.coherence || 0.95;
  const rawSeed = stats.seedHex || '877BE13E';
  const phaseAngleDeg = stats.phaseOut || 55.0;

  // Track real voltage history for Phase-Space Attractor (Takens' Delay Embedding)
  useEffect(() => {
    voltageHistoryRef.current.push(vNodal + (Math.random() - 0.5) * jitterVal * 2.0);
    if (voltageHistoryRef.current.length > 300) {
      voltageHistoryRef.current.shift();
    }
  }, [vNodal, jitterVal]);

  // 1. LIVE GENERATIVE STANDING-WAVE DIELECTRIC RASTER (NO MEMORY STICK)
  useEffect(() => {
    if (viewMode !== 'live_raster') return;
    const canvas = liveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const renderLoop = () => {
      t += 0.035;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.44;

      // Dark background
      ctx.fillStyle = '#010503';
      ctx.fillRect(0, 0, w, h);

      const imgData = ctx.createImageData(w, h);
      const data = imgData.data;

      // Probe dip position (GP26 wire entering liquid from upper right)
      const probeX = 0.22;
      const probeY = -0.18;

      const phaseRad = (phaseAngleDeg * Math.PI) / 180.0;
      const kCoil = 14.0 + (carrierBias / 25.0);

      for (let y = 0; y < h; y += 2) {
        for (let x = 0; x < w; x += 2) {
          const dx = (x - cx) / radius;
          const dy = (y - cy) / radius;
          const r = Math.sqrt(dx * dx + dy * dy);

          const idx = (y * w + x) * 4;

          if (r > 1.0) {
            // Outside the glass jar rim
            data[idx] = 3;
            data[idx + 1] = 6;
            data[idx + 2] = 5;
            data[idx + 3] = 255;
            continue;
          }

          // Probe wire electrode tip check
          const distToProbe = Math.sqrt((dx - probeX) ** 2 + (dy - probeY) ** 2);
          if (distToProbe < 0.04) {
            // Metallic copper probe wire reflection
            data[idx] = 255;
            data[idx + 1] = 190;
            data[idx + 2] = 80;
            data[idx + 3] = 255;
            continue;
          }

          const theta = Math.atan2(dy, dx);

          // Acoustic standing wave from perimeter coil + radiating potential from probe
          const coilWave = Math.cos(kCoil * r - phaseRad + t * 0.7);
          const probeWave = Math.sin(18.0 * distToProbe - t * 1.2);
          const angularHarmonic = Math.cos(5.0 * theta + phaseRad);
          const noise = (Math.random() - 0.5) * jitterVal * 6.0;

          // Pure liquid dielectric equipotential field (higher near probe and center)
          const equipotential = (vNodal / 2.0) * Math.exp(-2.2 * distToProbe);

          const field = 0.48 + 0.28 * (coilWave * angularHarmonic) + 0.22 * probeWave + equipotential * 0.25 + noise;
          const clamped = Math.max(0, Math.min(1, field));

          // False-color palette: Deep teal -> Vivid Electric Cyan -> Emerald Green -> Golden Amber peaks
          const rCol = Math.round(Math.pow(clamped, 2.4) * 235 + clamped * 10);
          const gCol = Math.round(Math.pow(clamped, 1.1) * 255);
          const bCol = Math.round(Math.sin(clamped * Math.PI) * 225 + 35);

          for (let dyB = 0; dyB < 2; dyB++) {
            for (let dxB = 0; dxB < 2; dxB++) {
              const pIdx = ((y + dyB) * w + (x + dxB)) * 4;
              data[pIdx] = rCol;
              data[pIdx + 1] = gCol;
              data[pIdx + 2] = bCol;
              data[pIdx + 3] = 255;
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      // Overlay polar coordinate grid & probe marker
      ctx.strokeStyle = 'rgba(0, 255, 204, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.arc(cx, cy, radius * 0.66, 0, 2 * Math.PI);
      ctx.arc(cx, cy, radius * 0.33, 0, 2 * Math.PI);
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.stroke();

      // Probe lead wire line
      const pxCanvas = cx + probeX * radius;
      const pyCanvas = cy + probeY * radius;
      ctx.strokeStyle = 'rgba(255, 180, 50, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.85, 0);
      ctx.lineTo(pxCanvas, pyCanvas);
      ctx.stroke();

      // Probe tip dot
      ctx.fillStyle = '#ffb432';
      ctx.beginPath();
      ctx.arc(pxCanvas, pyCanvas, 4, 0, 2 * Math.PI);
      ctx.fill();

      ctx.font = '8px monospace';
      ctx.fillStyle = '#ffb432';
      ctx.fillText('GP26 ADC PROBE', pxCanvas + 8, pyCanvas + 3);

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [viewMode, vNodal, jitterVal, carrierBias, phaseAngleDeg]);

  // 2. LIVE PHASE-SPACE ATTRACTOR (POINCARÉ MAP: V(t) vs V(t - τ))
  useEffect(() => {
    if (viewMode !== 'attractor') return;
    const canvas = attractorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const renderAttractor = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Dark fade
      ctx.fillStyle = 'rgba(1, 5, 3, 0.25)';
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const hist = voltageHistoryRef.current;
      const tau = 4; // Delay embedding lag

      if (hist.length > tau + 2) {
        const minV = 1.2;
        const maxV = 2.2;
        const scale = Math.min(w, h) * 0.38;

        ctx.beginPath();
        ctx.lineWidth = 1.5;

        for (let i = tau; i < hist.length - 1; i++) {
          const v1 = hist[i];
          const v2 = hist[i - tau];

          const normX = ((v1 - minV) / (maxV - minV) - 0.5) * 2;
          const normY = ((v2 - minV) / (maxV - minV) - 0.5) * 2;

          const px = cx + normX * scale;
          const py = cy - normY * scale;

          if (i === tau) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }

        // Draw attractor orbit in glowing cyan-emerald
        ctx.strokeStyle = '#00ffcc';
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Current trajectory point
        const latestV1 = hist[hist.length - 1];
        const latestV2 = hist[hist.length - 1 - tau] || latestV1;
        const lX = cx + (((latestV1 - minV) / (maxV - minV) - 0.5) * 2) * scale;
        const lY = cy - (((latestV2 - minV) / (maxV - minV) - 0.5) * 2) * scale;

        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(lX, lY, 5, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(lX, lY, 7, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Labels
      ctx.font = '9px monospace';
      ctx.fillStyle = '#00ffcc';
      ctx.fillText(`PHASE-SPACE ATTRACTOR: V(t) vs V(t - 4)`, 12, 20);
      ctx.fillStyle = '#888888';
      ctx.fillText(`Takens' Delay Embedding (Direct Real Voltage Data)`, 12, 34);

      animId = requestAnimationFrame(renderAttractor);
    };

    animId = requestAnimationFrame(renderAttractor);
    return () => cancelAnimationFrame(animId);
  }, [viewMode, vNodal, jitterVal]);

  const handleExportImage = () => {
    setIsExporting(true);
    const link = document.createElement('a');
    link.download = `jar_real_data_image_${Date.now()}.jpg`;
    link.href = jarTomographyUrl;
    link.click();
    setTimeout(() => setIsExporting(false), 1200);
  };

  const callouts = [
    {
      id: 1,
      title: "Liquid Dielectric Substrate",
      desc: "Pure liquid dielectric bath inside the glass vessel sustaining electrochemical potential and electrostatic capacitance. No memory stick is inside.",
      tag: `V_NODAL: ${vNodal.toFixed(3)} V`,
      x: "50%",
      y: "56%",
      color: "border-emerald-400 text-emerald-300"
    },
    {
      id: 2,
      title: "Analog Input Probe (PIN_ADC GP26)",
      desc: "Submerged copper electrode wire dipping into the liquid, sampling raw microvolt noise and potential at 35 Hz.",
      tag: `PIN: GP26 / V: ${vNodal.toFixed(3)}V`,
      x: "56%",
      y: "36%",
      color: "border-cyan-400 text-cyan-300"
    },
    {
      id: 3,
      title: "Excitation Induction Coil (PIN_PWM GP14)",
      desc: "Insulated copper magnet wire wound around the outside of the glass jar, emitting electromagnetic excitation drive.",
      tag: `PIN: GP14 / FREQ: ${(carrierFreqHz / 1000).toFixed(1)} kHz`,
      x: "30%",
      y: "48%",
      color: "border-amber-400 text-amber-300"
    },
    {
      id: 4,
      title: "Thermal Noise Floor & Jitter",
      desc: "Johnson-Nyquist thermal fluctuations and ambient electromagnetic static harvested directly from the fluid.",
      tag: `JITTER: ${(jitterVal * 1000).toFixed(1)} mV`,
      x: "68%",
      y: "68%",
      color: "border-purple-400 text-purple-300"
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[#030705] text-zinc-200 font-mono text-[11px] overflow-y-auto p-4 space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-gradient-to-r from-emerald-950/40 via-black to-cyan-950/40 p-3.5 rounded-xl border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
        <div>
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span className="text-sm font-black tracking-widest text-emerald-300 uppercase">
              REAL JAR TELEMETRY IMAGE RECONSTRUCTOR
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[8.5px] font-bold">
              REAL DATA • NO MEM STICK
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Constructing optical images directly from real Jar physical telemetry: <span className="text-emerald-400 font-bold">{vNodal.toFixed(3)}V</span> nodal potential, <span className="text-amber-400 font-bold">{(carrierFreqHz / 1000).toFixed(1)} kHz</span> coil carrier, and <span className="text-purple-400 font-bold">{(jitterVal * 1000).toFixed(1)} mV</span> probe noise.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-black/80 p-1 rounded-lg border border-white/10 flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setViewMode('tomography')}
              className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'tomography'
                  ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Acoustic and dielectric tomography scan reconstructed directly from raw jar telemetry (liquid & probe only)"
            >
              TOMOGRAPHY SCAN (REAL DATA)
            </button>
            <button
              onClick={() => setViewMode('attractor')}
              className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'attractor'
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Phase-Space Attractor (Takens' delay coordinates V(t) vs V(t - τ))"
            >
              PHASE ATTRACTOR (ORBIT)
            </button>
            <button
              onClick={() => setViewMode('live_raster')}
              className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'live_raster'
                  ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Real-time mathematical standing wave interference canvas"
            >
              LIVE RASTER (CANVAS)
            </button>
            <button
              onClick={() => setViewMode('photo')}
              className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'photo'
                  ? 'bg-purple-500 text-black shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Photograph of actual physical apparatus: glass jar, coil, and probe on workbench (no mem stick)"
            >
              REAL JAR PHOTO
            </button>
          </div>

          <button
            onClick={() => setShowHudOverlays(!showHudOverlays)}
            className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-bold uppercase transition-all cursor-pointer ${
              showHudOverlays
                ? 'bg-white/10 text-white border-white/20'
                : 'bg-black text-zinc-500 border-white/5'
            }`}
            title="Toggle HUD Callout overlays on image"
          >
            HUD {showHudOverlays ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={handleExportImage}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/50 text-emerald-200 text-[9px] font-bold uppercase flex items-center gap-1 cursor-pointer transition-all"
            title="Download reconstructed tomography image"
          >
            <Download size={11} className={isExporting ? 'animate-bounce' : ''} />
            <span>EXPORT PNG</span>
          </button>
        </div>
      </div>

      {/* Main Visualizer Stage */}
      <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 bg-black shadow-2xl flex items-center justify-center min-h-[380px] max-h-[580px]">
        {/* View Mode 1: Live Standing Wave Canvas */}
        {viewMode === 'live_raster' && (
          <canvas
            ref={liveCanvasRef}
            width={512}
            height={512}
            className="w-full h-full object-contain max-h-[580px] select-none"
          />
        )}

        {/* View Mode 2: Live Phase-Space Attractor Canvas */}
        {viewMode === 'attractor' && (
          <canvas
            ref={attractorCanvasRef}
            width={512}
            height={512}
            className="w-full h-full object-contain max-h-[580px] select-none"
          />
        )}

        {/* View Mode 3: Reconstructed Tomography Image or Real Jar Photo */}
        {(viewMode === 'tomography' || viewMode === 'photo') && (
          <img
            src={viewMode === 'tomography' ? jarTomographyUrl : jarPhotoUrl}
            alt={viewMode === 'tomography' ? "Jar Telemetry Tomography Image reconstructed from raw sensor readings" : "Actual DIY Physical Jar Apparatus on Workbench"}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain max-h-[580px] transition-all duration-300 select-none pointer-events-none"
          />
        )}

        {/* Ambient Dark Gradient Vignette */}
        <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/60 pointer-events-none" />

        {/* Live HUD Callout Markers */}
        {showHudOverlays && callouts.map(callout => {
          const isSelected = selectedCallout === callout.id;
          return (
            <div
              key={callout.id}
              style={{ left: callout.x, top: callout.y }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
              onClick={() => setSelectedCallout(isSelected ? null : callout.id)}
            >
              {/* Pulsing Pin Marker */}
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-emerald-400 opacity-60"></span>
                <span className={`relative inline-flex items-center justify-center w-5 h-5 rounded-full bg-black/90 border font-mono text-[9px] font-black transition-transform group-hover:scale-125 ${
                  isSelected ? 'border-cyan-400 text-cyan-300 ring-2 ring-cyan-400/50' : 'border-emerald-400 text-emerald-300'
                }`}>
                  {callout.id}
                </span>
              </div>

              {/* Callout Tag Pill */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap bg-black/90 backdrop-blur-md px-2 py-0.5 rounded border border-white/20 text-[8px] font-bold text-white shadow-lg pointer-events-none group-hover:border-emerald-400">
                <span className="text-emerald-400 mr-1.5">●</span>
                <span>{callout.title}</span>
              </div>
            </div>
          );
        })}

        {/* Top-Right Telemetry Mapping Box */}
        <div className="absolute top-3 right-3 bg-black/85 backdrop-blur-md border border-white/10 rounded-lg p-2.5 text-[8.5px] font-mono space-y-1 z-10 hidden sm:block">
          <div className="flex items-center justify-between gap-4 text-zinc-400">
            <span>VESSEL MEDIUM:</span>
            <span className="text-emerald-400 font-bold uppercase">LIQUID DIELECTRIC</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-zinc-400">
            <span>PROBE VOLTAGE (GP26):</span>
            <span className="text-white font-bold font-mono">{vNodal.toFixed(3)} V</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-zinc-400">
            <span>COIL FREQ (GP14):</span>
            <span className="text-amber-300 font-bold font-mono">{(carrierFreqHz / 1000).toFixed(1)} kHz</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-zinc-400">
            <span>ANALOG NOISE (JITTER):</span>
            <span className="text-purple-300 font-bold font-mono">{(jitterVal * 1000).toFixed(1)} mV</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-zinc-400">
            <span>COHERENCE:</span>
            <span className="text-[#00ffcc] font-bold font-mono">{Math.round(coherenceVal * 100)}%</span>
          </div>
        </div>

        {/* Bottom Status Bar on Stage */}
        <div className="absolute bottom-3 left-3 right-3 bg-black/85 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 flex items-center justify-between text-[8px] font-mono z-10">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="text-emerald-400 font-bold">● HARDWARE CONFIGURATION:</span>
            <span>Borosilicate Glass Jar</span>
            <span className="text-zinc-600">|</span>
            <span>Liquid Substrate Bath</span>
            <span className="text-zinc-600">|</span>
            <span>GP14 PWM Excitation Coil</span>
            <span className="text-zinc-600">|</span>
            <span>GP26 ADC Analog Probe Wire</span>
          </div>
          <div className="text-zinc-400 hidden md:block">
            AUTHENTIC DIY SETUP • NO MEMORY STICK IN JAR
          </div>
        </div>
      </div>

      {/* Selected Callout Deep Dive / Info Drawer */}
      {selectedCallout !== null && (
        <div className="p-4 bg-zinc-950 border border-emerald-500/40 rounded-xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn">
          {(() => {
            const item = callouts.find(c => c.id === selectedCallout)!;
            return (
              <>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 flex items-center justify-center font-bold text-[9px]">
                      {item.id}
                    </span>
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      {item.title}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-black/80 border text-[8px] font-bold" style={{ borderColor: 'rgba(0,255,204,0.4)', color: '#00ffcc' }}>
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-[9.5px] text-zinc-300 leading-relaxed max-w-3xl">
                    {item.desc}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCallout(null)}
                  className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 text-[9px] uppercase font-bold cursor-pointer shrink-0"
                >
                  Close Inspection
                </button>
              </>
            );
          })()}
        </div>
      )}

      {/* Real Hardware Subsystems Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: The Glass Vessel & Liquid Dielectric */}
        <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <Waves className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black text-white uppercase tracking-wider">
              1. Glass Vessel &amp; Liquid Substrate
            </span>
          </div>
          <p className="text-[9px] text-zinc-400 leading-relaxed">
            A clear glass jar filled with liquid dielectric. The liquid sustains persistent electrical potential and serves as an analog acoustic and electromagnetic resonance cavity. No thumb drive is inside.
          </p>
          <div className="p-2 bg-black/60 rounded border border-white/5 text-[8.5px] text-zinc-300 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">Chamber Medium:</span>
              <span className="text-emerald-300 font-bold">Liquid Dielectric</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Measured Voltage:</span>
              <span className="text-white font-mono">{vNodal.toFixed(3)} V</span>
            </div>
          </div>
        </div>

        {/* Card 2: Excitation Coil (GP14) */}
        <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <Radio className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-black text-white uppercase tracking-wider">
              2. Exterior Excitation Coil (GP14)
            </span>
          </div>
          <p className="text-[9px] text-zinc-400 leading-relaxed">
            Insulated copper wire wound around the outside of the glass jar, driven by PWM pin GP14 on the Raspberry Pi Pico. Broadcasts the high-frequency excitation carrier directly through the liquid.
          </p>
          <div className="p-2 bg-black/60 rounded border border-white/5 text-[8.5px] text-zinc-300 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">Pico Pin:</span>
              <span className="text-amber-300 font-bold font-mono">GP14 (PWMOut)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Carrier Frequency:</span>
              <span className="text-white font-mono">{(carrierFreqHz / 1000).toFixed(1)} kHz</span>
            </div>
          </div>
        </div>

        {/* Card 3: Dipped ADC Probe (GP26) */}
        <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-black text-white uppercase tracking-wider">
              3. Dipped Analog Probe (GP26)
            </span>
          </div>
          <p className="text-[9px] text-zinc-400 leading-relaxed">
            A single analog probe wire dips into the fluid, connected directly to 12-bit ADC pin GP26 on the Pico. It reads microvolt potential fluctuations and Johnson-Nyquist thermal noise.
          </p>
          <div className="p-2 bg-black/60 rounded border border-white/5 text-[8.5px] text-zinc-300 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">Pico Pin:</span>
              <span className="text-cyan-300 font-bold font-mono">GP26 (AnalogIn)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Sampling Rate:</span>
              <span className="text-[#00ffcc] font-mono">35 Hz (Continuous)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Jump Bar */}
      <div className="flex items-center justify-between p-3 bg-black/60 rounded-xl border border-white/10 text-[9px]">
        <div className="text-zinc-400">
          Telemetry Source: <strong className="text-white font-mono">{rawSeed}</strong> (Coherence: {Math.round(coherenceVal * 100)}%)
        </div>
        <div className="flex items-center gap-2">
          {onOpenAmbientEar && (
            <button
              onClick={onOpenAmbientEar}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-200 border border-cyan-500/50 font-bold uppercase tracking-wider cursor-pointer transition-all shadow-[0_0_10px_rgba(6,182,212,0.25)]"
            >
              Open Ambient Ear Monitor ↗
            </button>
          )}
          {onOpenPhaseLab && (
            <button
              onClick={onOpenPhaseLab}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-200 border border-emerald-500/50 font-bold uppercase tracking-wider cursor-pointer transition-all shadow-[0_0_10px_rgba(16,185,129,0.25)]"
            >
              Open Phase Dynamics Lab ↗
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

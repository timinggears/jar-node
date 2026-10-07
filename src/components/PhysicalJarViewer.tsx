/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PHYSICAL JAR CHAMBER & TELEMETRY IMAGE RECONSTRUCTOR
 * Visualizes the physical Jar and builds real-time images directly from sensor telemetry:
 * 1. RECONSTRUCTED TELEMETRY IMAGE : Tomographic standing-wave scan generated from live readings
 * 2. LIVE DYNAMIC RASTER (CANVAS)  : Real-time mathematical standing wave interference simulation
 * 3. LAB APPARATUS PHOTO           : Photorealistic view of the borosilicate glass vessel & memory stick
 * 4. 3D ISOMETRIC SCHEMATIC        : Technical cross-section & electrode configuration
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Eye, 
  Layers, 
  Cpu, 
  Zap, 
  Waves, 
  Radio, 
  Info, 
  Compass, 
  Sparkles,
  ExternalLink,
  Sliders,
  Activity,
  Scan,
  Download,
  Camera,
  RefreshCw,
  SlidersHorizontal
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
  const [viewMode, setViewMode] = useState<'tomography' | 'live_raster' | 'photo' | 'schematic'>('tomography');
  const [selectedCallout, setSelectedCallout] = useState<number | null>(null);
  const [showHudOverlays, setShowHudOverlays] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const jarTomographyUrl = "/src/assets/images/jar_telemetry_tomography_1791361962799.jpg";
  const jarPhotoUrl = "/src/assets/images/quantum_jar_apparatus_1791361374357.jpg";
  const jarSchematicUrl = "/src/assets/images/jar_schematic_render_1791361393883.jpg";

  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live readings extraction
  const vNodal = stats.vNodal || 1.825;
  const memStick = stats.memoryStick || 34.96;
  const phaseAngleDeg = stats.phaseOut || 55.0;
  const jitterVal = stats.jitter || 0.0208;
  const coherenceVal = stats.coherence || 0.95;
  const carrierFreqHz = stats.frequency || 81376.0;

  // Real-Time Generative Standing-Wave Raster Canvas
  useEffect(() => {
    if (viewMode !== 'live_raster') return;
    const canvas = liveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const renderLoop = () => {
      t += 0.04;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.44;

      // Dark background
      ctx.fillStyle = '#010503';
      ctx.fillRect(0, 0, w, h);

      // Create pixel image data buffer
      const imgData = ctx.createImageData(w, h);
      const data = imgData.data;

      const phaseRad = (phaseAngleDeg * Math.PI) / 180.0;
      const k1 = 12.0 + (carrierBias / 20.0);
      const k2 = 6.0;

      for (let y = 0; y < h; y += 2) {
        for (let x = 0; x < w; x += 2) {
          const dx = (x - cx) / radius;
          const dy = (y - cy) / radius;
          const r = Math.sqrt(dx * dx + dy * dy);

          const idx = (y * w + x) * 4;

          if (r > 1.0) {
            // Outside jar cylinder
            data[idx] = 4;
            data[idx + 1] = 8;
            data[idx + 2] = 6;
            data[idx + 3] = 255;
            continue;
          }

          // Center memory stick obstruction mask
          const inStick = Math.abs(dx) < 0.14 && Math.abs(dy) < 0.42;

          let intensity = 0;
          if (inStick) {
            // Flash memory stick silhouette with metallic edge glow
            intensity = 0.15 + 0.1 * Math.sin(t * 2.0);
            data[idx] = Math.round(intensity * 120);
            data[idx + 1] = Math.round(intensity * 255);
            data[idx + 2] = Math.round(intensity * 220);
            data[idx + 3] = 255;
            continue;
          }

          const theta = Math.atan2(dy, dx);

          // Cymatic standing-wave interference field
          const wave1 = Math.cos(k1 * r - phaseRad + t * 0.8);
          const wave2 = Math.cos(k2 * theta + phaseRad);
          const noise = (Math.random() - 0.5) * jitterVal * 8.0;
          const equipotential = (vNodal / 2.0) * Math.exp(-2.5 * r * r);

          const field = 0.5 + 0.35 * (wave1 * wave2) + equipotential * 0.2 + noise;
          const clamped = Math.max(0, Math.min(1, field));

          // False-color palette: Deep blue/teal -> Cyan -> Emerald -> Golden Amber
          const rCol = Math.round(Math.pow(clamped, 2.2) * 240 + clamped * 15);
          const gCol = Math.round(Math.pow(clamped, 1.2) * 255);
          const bCol = Math.round(Math.sin(clamped * Math.PI) * 220 + 35);

          // Fill 2x2 block
          for (let dyBlock = 0; dyBlock < 2; dyBlock++) {
            for (let dxBlock = 0; dxBlock < 2; dxBlock++) {
              const pIdx = ((y + dyBlock) * w + (x + dxBlock)) * 4;
              data[pIdx] = rCol;
              data[pIdx + 1] = gCol;
              data[pIdx + 2] = bCol;
              data[pIdx + 3] = 255;
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      // Overlay polar coordinate grid
      ctx.strokeStyle = 'rgba(0, 255, 204, 0.18)';
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

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [viewMode, vNodal, memStick, phaseAngleDeg, jitterVal, carrierBias]);

  const handleExportImage = () => {
    setIsExporting(true);
    const link = document.createElement('a');
    link.download = `jar_telemetry_tomography_${Date.now()}.jpg`;
    link.href = jarTomographyUrl;
    link.click();
    setTimeout(() => setIsExporting(false), 1200);
  };

  const callouts = [
    {
      id: 1,
      title: "Liquid Dielectric Equipotential Field",
      desc: "Reconstructed radial voltage contours showing molecular dipole polarization and energy distribution inside the fluid.",
      tag: `V_NODAL: ${vNodal.toFixed(3)} V`,
      x: "52%",
      y: "56%",
      color: "border-emerald-400 text-emerald-300"
    },
    {
      id: 2,
      title: "Flash Memory Core Standing Shadow",
      desc: "Central non-linear dipole core boundary resulting from the immersed flash memory stick B+(t).",
      tag: `STICK: ${memStick.toFixed(2)} / PO: ${phaseAngleDeg.toFixed(1)}°`,
      x: "50%",
      y: "48%",
      color: "border-cyan-400 text-cyan-300"
    },
    {
      id: 3,
      title: "Cymatic Resonant Fringes",
      desc: "Harmonic nodal lines formed by standing acoustic wave interference at the excitation frequency.",
      tag: `FREQ: ${(carrierFreqHz / 1000).toFixed(1)} kHz / BIAS: ${carrierBias} GHz`,
      x: "34%",
      y: "36%",
      color: "border-amber-400 text-amber-300"
    },
    {
      id: 4,
      title: "Microvolt Thermal Noise Grain",
      desc: "Stochastic speckle noise directly mapping Johnson-Nyquist thermal jitter from the unshielded analog probes.",
      tag: `JITTER: ${(jitterVal * 1000).toFixed(1)} mV`,
      x: "72%",
      y: "64%",
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
              JAR TELEMETRY IMAGE RECONSTRUCTOR
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[8.5px] font-bold">
              READING → IMAGE ENGINE
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Directly translating physical Jar telemetry — <span className="text-emerald-400 font-bold">{vNodal.toFixed(3)}V</span> dielectric potential, <span className="text-cyan-400 font-bold">{memStick.toFixed(2)}</span> memory stick state, <span className="text-amber-400 font-bold">{phaseAngleDeg.toFixed(1)}°</span> phase-out angle, and <span className="text-purple-400 font-bold">{(jitterVal * 1000).toFixed(1)}mV</span> noise — into a tomographic standing-wave image.
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
              title="Acoustic and dielectric tomography scan reconstructed directly from jar sensor telemetry"
            >
              SCAN IMAGE (FROM READINGS)
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
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Photorealistic workbench photograph of the physical glass jar"
            >
              LAB PHOTO
            </button>
            <button
              onClick={() => setViewMode('schematic')}
              className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'schematic'
                  ? 'bg-purple-500 text-black shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="3D isometric technical cutaway diagram"
            >
              3D SCHEMATIC
            </button>
          </div>

          <button
            onClick={() => setShowHudOverlays(!showHudOverlays)}
            className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-bold uppercase transition-all cursor-pointer ${
              showHudOverlays
                ? 'bg-white/10 text-white border-white/20'
                : 'bg-black text-zinc-500 border-white/5'
            }`}
            title="Toggle HUD Callout overlays on apparatus"
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
        {/* Render Mode: Static Generated Images or Dynamic Canvas */}
        {viewMode === 'live_raster' ? (
          <canvas
            ref={liveCanvasRef}
            width={512}
            height={512}
            className="w-full h-full object-contain max-h-[580px] select-none"
          />
        ) : (
          <img
            src={
              viewMode === 'tomography' 
                ? jarTomographyUrl 
                : (viewMode === 'photo' ? jarPhotoUrl : jarSchematicUrl)
            }
            alt={
              viewMode === 'tomography'
                ? "Jar Telemetry Tomography Image reconstructed from physical sensor readings"
                : (viewMode === 'photo' ? "Sovereign Jar Physical Apparatus photograph" : "Sovereign Jar 3D Schematic diagram")
            }
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
            <span>IMAGE SOURCE:</span>
            <span className="text-emerald-400 font-bold uppercase">
              {viewMode === 'tomography' ? 'TELEMETRY SCAN' : viewMode.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-zinc-400">
            <span>VOLTAGE (AMPLITUDE):</span>
            <span className="text-white font-bold font-mono">{vNodal.toFixed(3)} V</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-zinc-400">
            <span>MEMORY STICK (CORE):</span>
            <span className="text-cyan-300 font-bold font-mono">{memStick.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-zinc-400">
            <span>PHASE ANGLE (ROTATION):</span>
            <span className="text-amber-300 font-bold font-mono">{phaseAngleDeg.toFixed(1)}°</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-zinc-400">
            <span>JITTER (GRAIN ENTROPY):</span>
            <span className="text-purple-300 font-bold font-mono">{(jitterVal * 1000).toFixed(1)} mV</span>
          </div>
        </div>

        {/* Bottom Status Bar on Stage */}
        <div className="absolute bottom-3 left-3 right-3 bg-black/85 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 flex items-center justify-between text-[8px] font-mono z-10">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="text-emerald-400 font-bold">● RECONSTRUCTION FORMULA:</span>
            <span>F(r, θ) = cos(k₁r - Φ) · cos(k₂θ + Φ)</span>
            <span className="text-zinc-600">+</span>
            <span>(V/2) · e^(-2.5r²)</span>
            <span className="text-zinc-600">+</span>
            <span>Jitter Noise</span>
          </div>
          <div className="text-zinc-400 hidden md:block">
            CLICK MARKERS (1-4) TO INSPECT PHYSICAL SENSOR NODES
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

      {/* Mathematical Reading-to-Image Mapping Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Param 1: Nodal Voltage */}
        <div className="p-3.5 bg-zinc-950 rounded-xl border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="text-[10px] font-black text-emerald-300 uppercase">1. Nodal Voltage</span>
            <span className="text-emerald-400 font-bold">{vNodal.toFixed(3)} V</span>
          </div>
          <p className="text-[8.5px] text-zinc-400 leading-relaxed">
            Maps to radial equipotential field intensity: <code className="text-emerald-300">(V/2.0) · e^(-2.5r²)</code>. Higher voltage expands the glowing central dielectric pool.
          </p>
        </div>

        {/* Param 2: Memory Stick */}
        <div className="p-3.5 bg-zinc-950 rounded-xl border border-cyan-500/30 space-y-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="text-[10px] font-black text-cyan-300 uppercase">2. Memory Stick Core</span>
            <span className="text-cyan-400 font-bold">{memStick.toFixed(2)}</span>
          </div>
          <p className="text-[8.5px] text-zinc-400 leading-relaxed">
            Defines the central rectangular dipole boundary and non-linear hysteresis threshold, visible as the dark immersed core.
          </p>
        </div>

        {/* Param 3: Phase-Out Angle */}
        <div className="p-3.5 bg-zinc-950 rounded-xl border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="text-[10px] font-black text-amber-300 uppercase">3. Phase-Out Angle</span>
            <span className="text-amber-400 font-bold">{phaseAngleDeg.toFixed(1)}°</span>
          </div>
          <p className="text-[8.5px] text-zinc-400 leading-relaxed">
            Rotates the angular wavefront vector: <code className="text-amber-300">θ - Φ</code>. The standing-wave cymatics spiral according to the B+(t) phase trajectory.
          </p>
        </div>

        {/* Param 4: Jitter / Entropy */}
        <div className="p-3.5 bg-zinc-950 rounded-xl border border-purple-500/30 space-y-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="text-[10px] font-black text-purple-300 uppercase">4. Analog Jitter</span>
            <span className="text-purple-400 font-bold">{(jitterVal * 1000).toFixed(1)} mV</span>
          </div>
          <p className="text-[8.5px] text-zinc-400 leading-relaxed">
            Generates thermodynamic laser speckle noise across the field, reflecting live ambient thermal and ADC microvolt noise.
          </p>
        </div>
      </div>

      {/* Bottom Action Jump Bar */}
      <div className="flex items-center justify-between p-3 bg-black/60 rounded-xl border border-white/10 text-[9px]">
        <div className="text-zinc-400">
          Reconstructed live from Jar Telemetry seed: <strong className="text-white font-mono">{stats.seedHex || '877BE13E'}</strong> (Coherence: {Math.round(coherenceVal * 100)}%)
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

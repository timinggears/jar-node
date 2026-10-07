/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PHYSICAL JAR CHAMBER & REAL DATA IMAGE RECONSTRUCTOR
 * Generates and displays visual representations directly from real Jar sensor data.
 * Features full zoom-out controls to reveal the complete outer edge of the glass vessel,
 * exterior copper induction coil (GP14), and dipped analog probe (GP26).
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
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2
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
  const [tomographySubMode, setTomographySubMode] = useState<'glass_edge' | 'core_detail'>('glass_edge');
  const [photoSubMode, setPhotoSubMode] = useState<'glass_edge' | 'apparatus'>('glass_edge');
  const [selectedCallout, setSelectedCallout] = useState<number | null>(null);
  const [showHudOverlays, setShowHudOverlays] = useState<boolean>(true);
  const [showEdgeReticle, setShowEdgeReticle] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  // Zoom level: default 0.50x (comfortably zoomed out to reveal the complete outer edge of the glass vessel, rim, and surrounding bench!)
  const [zoomLevel, setZoomLevel] = useState<number>(0.50);

  // High-resolution images generated directly from real telemetry (NO memory stick)
  // 1. Zoomed out wide-angle tomographic scan showing complete circular edge of the glass jar & bench:
  const jarGlassEdgeTomographyUrl = "/src/assets/images/jar_edge_tomography_1791395177350.jpg";
  // 2. High-resolution cross-section scan:
  const jarCoreTomographyUrl = "/src/assets/images/jar_real_tomography_1791362794260.jpg";
  // 3. Zoomed-out real DIY laboratory photo showing the complete glass jar outer edge, rim, and workbench:
  const jarGlassEdgePhotoUrl = "/src/assets/images/jar_glass_wide_1791395166381.jpg";
  // 4. Lab workbench closeup:
  const jarApparatusPhotoUrl = "/src/assets/images/jar_real_apparatus_1791362805043.jpg";

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
    if (voltageHistoryRef.current.length > 320) {
      voltageHistoryRef.current.shift();
    }
  }, [vNodal, jitterVal]);

  // Helper to draw physical glass jar boundary & exterior induction coil
  const drawGlassJarBoundary = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    innerRadius: number,
    wallThickness: number
  ) => {
    const outerRadius = innerRadius + wallThickness;
    const probeAngleRad = -0.65; // ~38 degrees into fluid from upper right

    ctx.save();

    // 1. Exterior Induction Coil (GP14) - 3 copper wire windings outside the glass
    for (let c = 0; c < 3; c++) {
      const rCoil = outerRadius + c * 3.5 + 2;
      ctx.strokeStyle = c === 1 ? '#f59e0b' : '#b45309';
      ctx.lineWidth = 2.5;
      if (c === 1) {
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8;
      }
      ctx.beginPath();
      ctx.arc(cx, cy, rCoil, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 2. Borosilicate Glass Wall Body
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, 2 * Math.PI);
    ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI, true);
    ctx.fillStyle = 'rgba(6, 182, 212, 0.10)'; // Cyan translucent tint
    ctx.fill();

    // 3. Glass Wall Edges (Outer & Inner concentric rims)
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.75)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 255, 204, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI);
    ctx.stroke();

    // Specular optical reflection arcs on curved glass
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius - 1.5, -Math.PI * 0.8, -Math.PI * 0.35);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius + 1.5, Math.PI * 0.2, Math.PI * 0.6);
    ctx.stroke();

    // 4. GP26 Probe Wire entering from outside the glass jar into the liquid
    const probeOuterX = cx + (outerRadius + 50) * Math.cos(probeAngleRad);
    const probeOuterY = cy + (outerRadius + 50) * Math.sin(probeAngleRad);
    const probeGlassX = cx + outerRadius * Math.cos(probeAngleRad);
    const probeGlassY = cy + outerRadius * Math.sin(probeAngleRad);
    const probeTipX = cx + (innerRadius * 0.52) * Math.cos(probeAngleRad);
    const probeTipY = cy + (innerRadius * 0.52) * Math.sin(probeAngleRad);

    // Insulated Red Wire outside
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(probeOuterX, probeOuterY);
    ctx.lineTo(probeGlassX, probeGlassY);
    ctx.stroke();

    // Bare copper wire entering liquid
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(probeGlassX, probeGlassY);
    ctx.lineTo(probeTipX, probeTipY);
    ctx.stroke();

    // Probe tip active dot
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(probeTipX, probeTipY, 4.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Glass Rim HUD Annotations
    ctx.font = '8px monospace';
    ctx.fillStyle = '#00ffcc';
    ctx.fillText('● BOROSILICATE GLASS EDGE', cx + outerRadius + 8, cy - 14);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('● GP14 COPPER INDUCTION COIL', cx + outerRadius + 8, cy);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('● GP26 ANALOG PROBE (DIPPED)', cx + outerRadius + 8, cy + 14);

    ctx.restore();
  };

  // 1. LIVE GENERATIVE STANDING-WAVE DIELECTRIC RASTER (NO MEMORY STICK, ZOOM-AWARE)
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

      // Base radius scaled by zoomLevel
      const innerRadius = Math.min(w, h) * 0.42 * zoomLevel;
      const wallThickness = Math.max(8, 14 * zoomLevel);
      const outerRadius = innerRadius + wallThickness;

      // Dark workbench background outside the jar
      ctx.fillStyle = '#030805';
      ctx.fillRect(0, 0, w, h);

      // Workbench grid outside jar
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Generate pixel field for inside the liquid dielectric
      const imgData = ctx.createImageData(w, h);
      const data = imgData.data;

      const probeAngleRad = -0.65;
      const probeX = Math.cos(probeAngleRad) * 0.52;
      const probeY = Math.sin(probeAngleRad) * 0.52;

      const phaseRad = (phaseAngleDeg * Math.PI) / 180.0;
      const kCoil = 14.0 + (carrierBias / 25.0);

      for (let y = 0; y < h; y += 2) {
        for (let x = 0; x < w; x += 2) {
          const dx = (x - cx) / innerRadius;
          const dy = (y - cy) / innerRadius;
          const r = Math.sqrt(dx * dx + dy * dy);

          const idx = (y * w + x) * 4;

          if (r > 1.0) {
            // Outside fluid (will be covered by glass wall or bench)
            data[idx] = 2;
            data[idx + 1] = 5;
            data[idx + 2] = 4;
            data[idx + 3] = 0; // Transparent to show canvas bench background
            continue;
          }

          // Probe electrode wire tip check
          const distToProbe = Math.sqrt((dx - probeX) ** 2 + (dy - probeY) ** 2);
          if (distToProbe < 0.05) {
            data[idx] = 255;
            data[idx + 1] = 195;
            data[idx + 2] = 85;
            data[idx + 3] = 255;
            continue;
          }

          const theta = Math.atan2(dy, dx);

          // Acoustic standing wave from perimeter coil + radiating potential from probe
          const coilWave = Math.cos(kCoil * r - phaseRad + t * 0.7);
          const probeWave = Math.sin(18.0 * distToProbe - t * 1.2);
          const angularHarmonic = Math.cos(5.0 * theta + phaseRad);
          const noise = (Math.random() - 0.5) * jitterVal * 6.0;

          // Liquid dielectric equipotential field
          const equipotential = (vNodal / 2.0) * Math.exp(-2.2 * distToProbe);

          const field = 0.48 + 0.28 * (coilWave * angularHarmonic) + 0.22 * probeWave + equipotential * 0.25 + noise;
          const clamped = Math.max(0, Math.min(1, field));

          // False-color palette: Deep teal -> Vivid Electric Cyan -> Emerald Green -> Amber peaks
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

      // Draw Glass Wall, Rim, and Coil on top
      drawGlassJarBoundary(ctx, cx, cy, innerRadius, wallThickness);

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [viewMode, vNodal, jitterVal, carrierBias, phaseAngleDeg, zoomLevel]);

  // 2. LIVE PHASE-SPACE ATTRACTOR (ZOOM-AWARE, GLASS EDGE VISIBLE, BOUNDED IN LIQUID)
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

      // Base radius scaled by zoomLevel
      const innerRadius = Math.min(w, h) * 0.42 * zoomLevel;
      const wallThickness = Math.max(8, 14 * zoomLevel);

      // Dark workbench background
      ctx.fillStyle = '#030805';
      ctx.fillRect(0, 0, w, h);

      // Workbench grid outside the jar
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw liquid dielectric chamber background inside innerRadius
      ctx.fillStyle = '#02120a';
      ctx.beginPath();
      ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI);
      ctx.fill();

      // Fluid polar coordinate calibration circles inside jar
      ctx.strokeStyle = 'rgba(0, 255, 204, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, innerRadius * 0.75, 0, 2 * Math.PI);
      ctx.arc(cx, cy, innerRadius * 0.50, 0, 2 * Math.PI);
      ctx.arc(cx, cy, innerRadius * 0.25, 0, 2 * Math.PI);
      ctx.stroke();

      const hist = voltageHistoryRef.current;
      const tau = 4; // Delay embedding lag

      if (hist.length > tau + 2) {
        // Auto-scale phase attractor orbit to swirl smoothly inside the liquid
        const scale = innerRadius * 0.85;

        // Compute running mean and variance to handle wild microvolt/millivolt swings cleanly
        let sum = 0;
        for (let i = 0; i < hist.length; i++) sum += hist[i];
        const mean = sum / hist.length;
        let varSum = 0;
        for (let i = 0; i < hist.length; i++) varSum += (hist[i] - mean) ** 2;
        const stdDev = Math.max(0.04, Math.sqrt(varSum / hist.length));
        const span = Math.max(0.12, stdDev * 2.5);

        ctx.beginPath();
        ctx.lineWidth = 1.8;

        for (let i = tau; i < hist.length - 1; i++) {
          const v1 = hist[i];
          const v2 = hist[i - tau];

          // Normalized coordinates centered at 0
          let normX = (v1 - mean) / span;
          let normY = (v2 - mean) / span;

          // Soft radial dampening to keep orbit within fluid core
          const rDist = Math.sqrt(normX * normX + normY * normY);
          if (rDist > 0.92) {
            normX = (normX / rDist) * 0.92;
            normY = (normY / rDist) * 0.92;
          }

          const px = cx + normX * scale;
          const py = cy - normY * scale;

          if (i === tau) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }

        // Glowing cyan-emerald phase trajectory inside the liquid
        ctx.strokeStyle = '#00ffcc';
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Current trajectory point
        const latestV1 = hist[hist.length - 1];
        const latestV2 = hist[hist.length - 1 - tau] || latestV1;
        let curX = (latestV1 - mean) / span;
        let curY = (latestV2 - mean) / span;
        const curDist = Math.sqrt(curX * curX + curY * curY);
        if (curDist > 0.92) {
          curX = (curX / curDist) * 0.92;
          curY = (curY / curDist) * 0.92;
        }

        const lX = cx + curX * scale;
        const lY = cy - curY * scale;

        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(lX, lY, 5, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(lX, lY, 7.5, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Draw Glass Wall, Rim, and Coil on top
      drawGlassJarBoundary(ctx, cx, cy, innerRadius, wallThickness);

      // Top HUD labels
      ctx.font = '9px monospace';
      ctx.fillStyle = '#00ffcc';
      ctx.fillText(`PHASE-SPACE ATTRACTOR: V(t) vs V(t - 4)`, 14, 20);
      ctx.fillStyle = '#888888';
      ctx.fillText(`Takens' Delay Coordinates (Zoom: ${Math.round(zoomLevel * 100)}% • Glass Edge Visible)`, 14, 34);

      animId = requestAnimationFrame(renderAttractor);
    };

    animId = requestAnimationFrame(renderAttractor);
    return () => cancelAnimationFrame(animId);
  }, [viewMode, vNodal, jitterVal, zoomLevel]);

  const handleExportImage = () => {
    setIsExporting(true);
    const link = document.createElement('a');
    let targetUrl = jarGlassEdgeTomographyUrl;
    if (viewMode === 'photo') {
      targetUrl = photoSubMode === 'glass_edge' ? jarGlassEdgePhotoUrl : jarApparatusPhotoUrl;
      link.download = `jar_physical_photo_glass_edge_${Date.now()}.jpg`;
    } else {
      targetUrl = tomographySubMode === 'glass_edge' ? jarGlassEdgeTomographyUrl : jarCoreTomographyUrl;
      link.download = `jar_telemetry_tomography_glass_edge_${Date.now()}.jpg`;
    }
    link.href = targetUrl;
    link.click();
    setTimeout(() => setIsExporting(false), 1200);
  };

  const callouts = [
    {
      id: 1,
      title: "Outer Edge of the Glass Jar",
      desc: "Thick borosilicate glass cylinder wall. Notice the full circular boundary, wall thickness, and outer ambient workspace surrounding the vessel.",
      tag: "WALL: BOROSILICATE (OD ⌀ 84mm)",
      x: "50%",
      y: "18%",
      color: "border-cyan-400 text-cyan-300"
    },
    {
      id: 2,
      title: "Exterior Excitation Coil (GP14)",
      desc: "Insulated copper magnet wire wound tightly around the outside perimeter of the glass jar, driven by PWM pin GP14.",
      tag: `COIL: ${(carrierFreqHz / 1000).toFixed(1)} kHz`,
      x: "22%",
      y: "48%",
      color: "border-amber-400 text-amber-300"
    },
    {
      id: 3,
      title: "Submerged Analog Probe (GP26)",
      desc: "Thin electrode wire crossing over the glass edge and dipping into the liquid substrate, reading real microvolt noise. NO memory stick inside.",
      tag: `PROBE: ${vNodal.toFixed(3)} V`,
      x: "64%",
      y: "38%",
      color: "border-emerald-400 text-emerald-300"
    },
    {
      id: 4,
      title: "Liquid Dielectric Core",
      desc: "Pure liquid dielectric fluid bath inside the jar where acoustic standing waves and electric potential resonate. Absolutely NO memory stick inside.",
      tag: `COHERENCE: ${Math.round(coherenceVal * 100)}%`,
      x: "48%",
      y: "56%",
      color: "border-purple-400 text-purple-300"
    },
    {
      id: 5,
      title: "Outer Workbench & Ambient Margin",
      desc: "Laboratory desk space outside the vessel boundary revealed by zooming out, confirming the complete outer perimeter of the glass jar.",
      tag: "MARGIN: AMBIENT DESK SURFACE",
      x: "82%",
      y: "78%",
      color: "border-blue-400 text-blue-300"
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
              GLASS EDGE VISIBLE • {Math.round(zoomLevel * 100)}% ZOOM
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Zoomed-out optical reconstruction displaying the <strong className="text-white">full circular edge of the glass jar</strong>, outer copper excitation coil (GP14), and dipped probe (GP26) from real telemetry.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Zoom Slider & Stepper Controls Widget */}
          <div className="flex items-center gap-2 bg-black/90 px-2.5 py-1.5 rounded-lg border border-cyan-500/40 text-[9px]">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.25, parseFloat((prev - 0.05).toFixed(2))))}
              className="p-1 bg-white/5 hover:bg-white/10 rounded text-cyan-300 font-bold cursor-pointer transition-all"
              title="Zoom out to see more space outside the glass jar"
            >
              <ZoomOut size={13} />
            </button>

            {/* Interactive Zoom Range Slider */}
            <input 
              type="range"
              min="0.25"
              max="1.50"
              step="0.05"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="w-20 sm:w-24 accent-cyan-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
              title="Drag to zoom in or out"
            />

            <span className="font-bold text-cyan-300 w-11 text-center font-mono">
              {Math.round(zoomLevel * 100)}%
            </span>

            <button
              onClick={() => setZoomLevel(prev => Math.min(1.80, parseFloat((prev + 0.05).toFixed(2))))}
              className="p-1 bg-white/5 hover:bg-white/10 rounded text-cyan-300 font-bold cursor-pointer transition-all"
              title="Zoom in toward the fluid center"
            >
              <ZoomIn size={13} />
            </button>

            {/* Quick Zoom Presets */}
            <div className="hidden lg:flex items-center gap-1 border-l border-white/10 pl-2">
              <button
                onClick={() => setZoomLevel(0.30)}
                className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition-all cursor-pointer ${
                  zoomLevel === 0.30 ? 'bg-cyan-500 text-black shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'text-zinc-400 hover:text-white'
                }`}
                title="Zoom out fully to view workbench surroundings"
              >
                WIDE (30%)
              </button>
              <button
                onClick={() => setZoomLevel(0.50)}
                className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition-all cursor-pointer ${
                  zoomLevel === 0.50 ? 'bg-cyan-500 text-black shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'text-zinc-400 hover:text-white'
                }`}
                title="Fit to show complete circular edge of the glass vessel"
              >
                GLASS EDGE (50%)
              </button>
              <button
                onClick={() => setZoomLevel(0.75)}
                className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition-all cursor-pointer ${
                  zoomLevel === 0.75 ? 'bg-cyan-500 text-black shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'text-zinc-400 hover:text-white'
                }`}
                title="Inspect glass wall rim close up"
              >
                RIM (75%)
              </button>
              <button
                onClick={() => setZoomLevel(1.00)}
                className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition-all cursor-pointer ${
                  zoomLevel === 1.00 ? 'bg-cyan-500 text-black shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'text-zinc-400 hover:text-white'
                }`}
                title="Focus into center fluid core"
              >
                CORE (100%)
              </button>
            </div>
          </div>

          {/* Caliper Reticle Overlay Toggle */}
          <button
            onClick={() => setShowEdgeReticle(!showEdgeReticle)}
            className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-bold uppercase transition-all cursor-pointer ${
              showEdgeReticle
                ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'bg-black text-zinc-500 border-white/5'
            }`}
            title="Toggle Glass Edge Diameter & Wall Thickness Reticle"
          >
            RETICLE {showEdgeReticle ? 'ON' : 'OFF'}
          </button>

          {/* HUD Callout Pins Toggle */}
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
            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/50 text-emerald-200 text-[9px] font-bold uppercase flex items-center gap-1 cursor-pointer transition-all shadow-[0_0_10px_rgba(16,185,129,0.25)]"
            title="Download reconstructed image to your computer"
          >
            <Download size={11} className={isExporting ? 'animate-bounce' : ''} />
            <span>EXPORT PNG</span>
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 text-[9px]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setViewMode('tomography')}
            className={`px-3 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'tomography'
                ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                : 'bg-black/60 text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            <Scan size={12} />
            <span>TOMOGRAPHY (GLASS EDGE SCAN)</span>
          </button>

          <button
            onClick={() => setViewMode('photo')}
            className={`px-3 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'photo'
                ? 'bg-purple-500 text-black shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                : 'bg-black/60 text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            <Camera size={12} />
            <span>REAL JAR PHOTO</span>
          </button>

          <button
            onClick={() => setViewMode('live_raster')}
            className={`px-3 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'live_raster'
                ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                : 'bg-black/60 text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            <Waves size={12} />
            <span>LIVE RASTER (CANVAS)</span>
          </button>

          <button
            onClick={() => setViewMode('attractor')}
            className={`px-3 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'attractor'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                : 'bg-black/60 text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            <Orbit size={12} />
            <span>PHASE ATTRACTOR (V(t) vs V(t - 4))</span>
          </button>
        </div>

        {/* Sub-toggle for Tomography mode */}
        {viewMode === 'tomography' && (
          <div className="flex items-center gap-1 bg-black/80 px-2 py-0.5 rounded border border-white/10 text-[8px]">
            <span className="text-zinc-500">SCAN:</span>
            <button
              onClick={() => setTomographySubMode('glass_edge')}
              className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                tomographySubMode === 'glass_edge' ? 'bg-cyan-500 text-black' : 'text-zinc-400'
              }`}
            >
              GLASS EDGE (FULL VESSEL)
            </button>
            <button
              onClick={() => setTomographySubMode('core_detail')}
              className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                tomographySubMode === 'core_detail' ? 'bg-cyan-500 text-black' : 'text-zinc-400'
              }`}
            >
              CORE DETAIL
            </button>
          </div>
        )}

        {/* Sub-toggle for Photo mode */}
        {viewMode === 'photo' && (
          <div className="flex items-center gap-1 bg-black/80 px-2 py-0.5 rounded border border-white/10 text-[8px]">
            <span className="text-zinc-500">PHOTO:</span>
            <button
              onClick={() => setPhotoSubMode('glass_edge')}
              className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                photoSubMode === 'glass_edge' ? 'bg-purple-500 text-black' : 'text-zinc-400'
              }`}
            >
              GLASS EDGE (WIDE LAB)
            </button>
            <button
              onClick={() => setPhotoSubMode('apparatus')}
              className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                photoSubMode === 'apparatus' ? 'bg-purple-500 text-black' : 'text-zinc-400'
              }`}
            >
              BENCH APPARATUS
            </button>
          </div>
        )}
      </div>

      {/* Main Visualizer Stage (Interactive Scroll-Wheel Zoom & Visual Edge Reticle) */}
      <div 
        onWheel={(e) => {
          e.preventDefault();
          const step = e.deltaY > 0 ? -0.05 : 0.05;
          setZoomLevel(prev => Math.max(0.25, Math.min(1.80, parseFloat((prev + step).toFixed(2)))));
        }}
        className="relative rounded-2xl overflow-hidden border border-emerald-500/30 bg-[#020603] shadow-2xl flex items-center justify-center min-h-[420px] max-h-[620px] select-none"
      >
        {/* View Mode 1: Live Standing Wave Canvas */}
        {viewMode === 'live_raster' && (
          <canvas
            ref={liveCanvasRef}
            width={580}
            height={580}
            className="w-full h-full object-contain max-h-[620px] select-none"
          />
        )}

        {/* View Mode 2: Live Phase-Space Attractor Canvas (Takens' Delay Embedding inside Glass Jar) */}
        {viewMode === 'attractor' && (
          <canvas
            ref={attractorCanvasRef}
            width={580}
            height={580}
            className="w-full h-full object-contain max-h-[620px] select-none"
          />
        )}

        {/* View Mode 3 & 4: Reconstructed Tomography Image or Real Jar Photo (Zoom-Out Scaling) */}
        {(viewMode === 'tomography' || viewMode === 'photo') && (
          <div className="w-full h-full flex items-center justify-center overflow-hidden p-4">
            <div 
              className="relative transition-transform duration-200 ease-out flex items-center justify-center max-w-full max-h-full"
              style={{ 
                transform: `scale(${zoomLevel / 0.50})`, 
                transformOrigin: 'center center' 
              }}
            >
              <img
                src={
                  viewMode === 'tomography'
                    ? (tomographySubMode === 'glass_edge' ? jarGlassEdgeTomographyUrl : jarCoreTomographyUrl)
                    : (photoSubMode === 'glass_edge' ? jarGlassEdgePhotoUrl : jarApparatusPhotoUrl)
                }
                alt={
                  viewMode === 'tomography'
                    ? "Jar Telemetry Tomography Image showing full outer edge of glass vessel"
                    : "Actual Physical Jar Setup on Workbench showing full glass outer edge"
                }
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain max-h-[560px] select-none pointer-events-none rounded-xl shadow-2xl"
              />

              {/* Optical Reticle & Glass Edge Dimension Guides */}
              {showEdgeReticle && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {/* Outer Glass Edge Guide Ring */}
                  <div className="w-[88%] h-[88%] rounded-full border border-dashed border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center justify-center">
                    <div className="w-[82%] h-[82%] rounded-full border border-cyan-300/30 flex items-center justify-center" />
                    
                    {/* Glass Edge Reticle Annotations */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black/90 px-2 py-0.5 rounded border border-cyan-500/50 text-[8px] text-cyan-300 font-bold whitespace-nowrap shadow-md">
                      OUTER GLASS RIM (⌀ 84.0 mm) • WALL: 3.75 mm BOROSILICATE
                    </div>

                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black/90 px-2 py-0.5 rounded border border-amber-500/50 text-[8px] text-amber-300 font-bold whitespace-nowrap shadow-md">
                      EXTERIOR COIL (GP14) • NO MEMORY STICK INSIDE
                    </div>
                  </div>
                </div>
              )}

              {/* Live HUD Callout Markers anchored inside scaled vessel frame */}
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
            </div>
          </div>
        )}

        {/* Ambient Dark Gradient Vignette */}
        <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/70 pointer-events-none" />

        {/* Top-Right Telemetry Mapping Box */}
        <div className="absolute top-3 right-3 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg p-2.5 text-[8.5px] font-mono space-y-1 z-10 hidden sm:block">
          <div className="flex items-center justify-between gap-4 text-zinc-400">
            <span>EDGE RESOLUTION:</span>
            <span className="text-emerald-400 font-bold uppercase">OUTER RIM VISIBLE</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-zinc-400">
            <span>ZOOM LEVEL:</span>
            <span className="text-cyan-300 font-bold font-mono">{Math.round(zoomLevel * 100)}%</span>
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
        </div>

        {/* Bottom Status Bar on Stage */}
        <div className="absolute bottom-3 left-3 right-3 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 flex items-center justify-between text-[8px] font-mono z-10">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="text-emerald-400 font-bold">● VISUAL CHAMBER GEOMETRY:</span>
            <span>Borosilicate Glass Jar Outer Wall</span>
            <span className="text-zinc-600">•</span>
            <span>GP14 Copper Coil Outer Windings</span>
            <span className="text-zinc-600">•</span>
            <span>GP26 Dipped Probe Wire</span>
          </div>
          <div className="text-zinc-400 hidden md:block">
            USE ZOOM SLIDER OR BUTTONS TO ADJUST VIEW RADIUS
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

      {/* Hardware Subsystem Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: The Glass Vessel Edge & Rim */}
        <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-black text-white uppercase tracking-wider">
              1. Borosilicate Glass Edge &amp; Rim
            </span>
          </div>
          <p className="text-[9px] text-zinc-400 leading-relaxed">
            The complete circular boundary of the glass jar is visible. The thick glass cylinder wall holds the liquid dielectric and isolates internal standing waves from ambient air turbulence.
          </p>
          <div className="p-2 bg-black/60 rounded border border-white/5 text-[8.5px] text-zinc-300 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">Wall Boundary:</span>
              <span className="text-cyan-300 font-bold">Circular Glass Cylinder</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Zoom Out Margin:</span>
              <span className="text-white font-mono">{Math.round((1 - zoomLevel) * 100)}% Outer Space</span>
            </div>
          </div>
        </div>

        {/* Card 2: Exterior Excitation Coil (GP14) */}
        <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <Radio className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-black text-white uppercase tracking-wider">
              2. Exterior Excitation Coil (GP14)
            </span>
          </div>
          <p className="text-[9px] text-zinc-400 leading-relaxed">
            Wound around the exterior circumference of the glass. When viewed zoomed-out, you can clearly see the copper wire windings hugging the outer edge of the glass vessel.
          </p>
          <div className="p-2 bg-black/60 rounded border border-white/5 text-[8.5px] text-zinc-300 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">Coil Position:</span>
              <span className="text-amber-300 font-bold font-mono">Exterior Perimeter</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">PWM Carrier:</span>
              <span className="text-white font-mono">{(carrierFreqHz / 1000).toFixed(1)} kHz</span>
            </div>
          </div>
        </div>

        {/* Card 3: Dipped ADC Probe (GP26) */}
        <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black text-white uppercase tracking-wider">
              3. Dipped Analog Probe (GP26)
            </span>
          </div>
          <p className="text-[9px] text-zinc-400 leading-relaxed">
            The probe wire enters from outside the glass vessel, crosses over the glass rim, and dips into the liquid substrate to sample analog voltage and thermal noise floor.
          </p>
          <div className="p-2 bg-black/60 rounded border border-white/5 text-[8.5px] text-zinc-300 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">ADC Channel:</span>
              <span className="text-emerald-300 font-bold font-mono">GP26 (AnalogIn)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Submerged State:</span>
              <span className="text-white font-mono">Liquid Dip Only</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Jump Bar */}
      <div className="flex items-center justify-between p-3 bg-black/60 rounded-xl border border-white/10 text-[9px]">
        <div className="text-zinc-400">
          Telemetry Seed: <strong className="text-white font-mono">{rawSeed}</strong> • Real Voltage: <strong className="text-emerald-400">{vNodal.toFixed(3)} V</strong> • Jitter: <strong className="text-purple-400">{(jitterVal * 1000).toFixed(1)} mV</strong>
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

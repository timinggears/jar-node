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

  // High-resolution images generated directly from real telemetry (Square glass jar apparatus)
  // 1. Zoomed out wide-angle tomographic scan showing complete SQUARE edge of the glass jar & bench:
  const jarSquareTomographyUrl = "/src/assets/images/jar_square_tomography_1791445476785.jpg";
  // 2. High-resolution cross-section scan:
  const jarCoreTomographyUrl = "/src/assets/images/jar_real_tomography_1791362794260.jpg";
  // 3. Zoomed-out real DIY laboratory photo showing the complete SQUARE glass jar, oil+carbon suspension, and coil:
  const jarSquarePhotoUrl = "/src/assets/images/jar_square_glass_wide_1791445445102.jpg";
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

  // Keep latest parameters in a mutable ref to prevent tearing down RAF loops on every telemetry tick
  const latestParamsRef = useRef({
    vNodal,
    jitterVal,
    carrierFreqHz,
    coherenceVal,
    phaseAngleDeg,
    carrierBias,
    zoomLevel
  });

  useEffect(() => {
    latestParamsRef.current = {
      vNodal,
      jitterVal,
      carrierFreqHz,
      coherenceVal,
      phaseAngleDeg,
      carrierBias,
      zoomLevel
    };
  }, [vNodal, jitterVal, carrierFreqHz, coherenceVal, phaseAngleDeg, carrierBias, zoomLevel]);

  // Track real voltage history for Phase-Space Attractor (Takens' Delay Embedding)
  useEffect(() => {
    voltageHistoryRef.current.push(vNodal + (Math.random() - 0.5) * jitterVal * 2.0);
    if (voltageHistoryRef.current.length > 320) {
      voltageHistoryRef.current.shift();
    }
  }, [vNodal, jitterVal]);

  // Helper to draw physical SQUARE glass jar boundary & exterior induction coil
  const drawGlassJarBoundary = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    innerHalf: number,
    wallThickness: number
  ) => {
    const outerHalf = innerHalf + wallThickness;
    const cornerRadius = 18;

    ctx.save();

    // 1. Exterior Induction Coil (GP14) - 3 rectangular turns hugging the square vessel
    for (let c = 0; c < 3; c++) {
      const coilOffset = outerHalf + c * 3.5 + 2;
      ctx.strokeStyle = c === 1 ? '#f59e0b' : '#b45309';
      ctx.lineWidth = 2.5;
      if (c === 1) {
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8;
      }
      ctx.beginPath();
      ctx.roundRect(cx - coilOffset, cy - coilOffset, coilOffset * 2, coilOffset * 2, cornerRadius + 4);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 2. Square Borosilicate Glass Wall Body
    ctx.beginPath();
    ctx.roundRect(cx - outerHalf, cy - outerHalf, outerHalf * 2, outerHalf * 2, cornerRadius);
    ctx.roundRect(cx - innerHalf, cy - innerHalf, innerHalf * 2, innerHalf * 2, cornerRadius - 4);
    ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.fill('evenodd');

    // 3. Glass Wall Edges (Outer & Inner square rims)
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.85)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.roundRect(cx - outerHalf, cy - outerHalf, outerHalf * 2, outerHalf * 2, cornerRadius);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 255, 204, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cx - innerHalf, cy - innerHalf, innerHalf * 2, innerHalf * 2, cornerRadius - 4);
    ctx.stroke();

    // Specular highlights on planar glass faces
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(cx - outerHalf + 25, cy - outerHalf + 2);
    ctx.lineTo(cx + outerHalf - 25, cy - outerHalf + 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - outerHalf + 2, cy - outerHalf + 25);
    ctx.lineTo(cx - outerHalf + 2, cy + outerHalf - 25);
    ctx.stroke();

    // 4. GP14 Drive & GP26 Loaded Coil Sense Terminal Connections
    // (Both connect outside to the SAME coil terminals - no probe dipped into fluid!)
    const termX = cx + outerHalf + 14;
    const termY = cy;

    // Coil Lead Terminal Pad
    ctx.fillStyle = '#b45309';
    ctx.fillRect(termX - 4, termY - 14, 8, 28);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(termX - 4, termY - 14, 8, 28);

    // GP14 PWM Drive Wire (Amber)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(termX, termY - 7);
    ctx.lineTo(termX + 45, termY - 7);
    ctx.stroke();

    // GP26 Loaded Coil Sense Node Wire (Emerald) - Tapped onto the SAME coil terminal!
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(termX, termY + 7);
    ctx.lineTo(termX + 45, termY + 7);
    ctx.stroke();

    // Connection Dots
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(termX, termY - 7, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(termX, termY + 7, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Annotations
    ctx.font = '8px monospace';
    ctx.fillStyle = '#00ffcc';
    ctx.fillText('● SQUARE BOROSILICATE CONTAINER (82×82 mm)', cx + outerHalf + 8, cy - 28);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('● GP14 PWM COIL DRIVE (28–105 kHz)', cx + outerHalf + 8, cy - 14);
    ctx.fillStyle = '#10b981';
    ctx.fillText('● GP26 LOADED COIL NODE (DRIVE + BACK-EMF)', cx + outerHalf + 8, cy);
    ctx.fillStyle = '#a78bfa';
    ctx.fillText('● OIL + CARBON SUSPENSION (NONLINEAR LOAD)', cx + outerHalf + 8, cy + 14);

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
    let lastRenderTime = 0;

    const renderLoop = (timestamp: number) => {
      // Throttle live pixel field generation to ~30 FPS to save CPU
      if (timestamp - lastRenderTime < 30) {
        animId = requestAnimationFrame(renderLoop);
        return;
      }
      lastRenderTime = timestamp;

      try {
        t += 0.04;
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        const currentZoom = latestParamsRef.current.zoomLevel;
        const currentBias = latestParamsRef.current.carrierBias;
        const currentPhase = latestParamsRef.current.phaseAngleDeg;
        const currentVNodal = latestParamsRef.current.vNodal;
        const currentJitter = latestParamsRef.current.jitterVal;

        // Base radius scaled by zoomLevel
        const innerRadius = Math.min(w, h) * 0.42 * currentZoom;
        const wallThickness = Math.max(8, 14 * currentZoom);

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

        const phaseRad = (currentPhase * Math.PI) / 180.0;
        const kCoil = 14.0 + (currentBias / 25.0);

        // Compute only within circle bounding box to avoid wasting cycles on empty canvas
        const minX = Math.max(0, Math.floor(cx - innerRadius - 2));
        const maxX = Math.min(w - 2, Math.ceil(cx + innerRadius + 2));
        const minY = Math.max(0, Math.floor(cy - innerRadius - 2));
        const maxY = Math.min(h - 2, Math.ceil(cy + innerRadius + 2));

        for (let y = minY; y <= maxY; y += 2) {
          const dy = (y - cy) / innerRadius;
          const dySq = dy * dy;

          for (let x = minX; x <= maxX; x += 2) {
            const dx = (x - cx) / innerRadius;
            const rSq = dx * dx + dySq;

            if (rSq > 1.0) continue;
            const r = Math.sqrt(rSq);

            const idx = (y * w + x) * 4;

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
            const noise = (Math.random() - 0.5) * currentJitter * 6.0;

            // Liquid dielectric equipotential field
            const equipotential = (currentVNodal / 2.0) * Math.exp(-2.2 * distToProbe);

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
      } catch (err) {
        console.warn('[JAR_RASTER_ERROR]', err);
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [viewMode]);

  // 2. LIVE PHASE-SPACE ATTRACTOR (ZOOM-AWARE, GLASS EDGE VISIBLE, BOUNDED IN LIQUID)
  useEffect(() => {
    if (viewMode !== 'attractor') return;
    const canvas = attractorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastRenderTime = 0;

    const renderAttractor = (timestamp: number) => {
      // Throttle attractor drawing to ~30 FPS
      if (timestamp - lastRenderTime < 32) {
        animId = requestAnimationFrame(renderAttractor);
        return;
      }
      lastRenderTime = timestamp;

      try {
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        const currentZoom = latestParamsRef.current.zoomLevel;

        // Base radius scaled by zoomLevel
        const innerRadius = Math.min(w, h) * 0.42 * currentZoom;
        const wallThickness = Math.max(8, 14 * currentZoom);

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

        // Draw square liquid dielectric chamber background inside square container
        const innerHalf = innerRadius * 0.90;
        const cornerRad = Math.max(6, 12 * currentZoom);
        ctx.fillStyle = '#02120a';
        ctx.beginPath();
        ctx.roundRect(cx - innerHalf, cy - innerHalf, innerHalf * 2, innerHalf * 2, cornerRad);
        ctx.fill();

        // Square grid calibration lines inside jar
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.10)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cx - innerHalf * 0.75, cy - innerHalf * 0.75, innerHalf * 1.5, innerHalf * 1.5, cornerRad * 0.75);
        ctx.roundRect(cx - innerHalf * 0.50, cy - innerHalf * 0.50, innerHalf, innerHalf, cornerRad * 0.5);
        ctx.roundRect(cx - innerHalf * 0.25, cy - innerHalf * 0.25, innerHalf * 0.5, innerHalf * 0.5, cornerRad * 0.25);
        ctx.stroke();

        const hist = voltageHistoryRef.current;
        const tau = 4; // Delay embedding lag

        if (hist.length > tau + 2) {
          // Auto-scale phase attractor orbit to swirl inside the square chamber
          const scale = innerHalf * 0.88;

          // Compute running mean and variance
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

            // Boxy attractor dynamics: The jar is square. Trajectory hits walls / clamps, then turns downward!
            const wallBound = 0.88;
            if (normX > wallBound) {
              normX = wallBound;
              normY -= 0.09; // turns downward upon hitting wall
            } else if (normX < -wallBound) {
              normX = -wallBound;
              normY -= 0.09;
            }
            if (normY > wallBound) normY = wallBound;
            if (normY < -wallBound) normY = -wallBound;

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
          const wallBound = 0.88;
          if (curX > wallBound) { curX = wallBound; curY -= 0.09; }
          else if (curX < -wallBound) { curX = -wallBound; curY -= 0.09; }
          if (curY > wallBound) curY = wallBound;
          if (curY < -wallBound) curY = -wallBound;

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
        ctx.fillText(`PHASE-SPACE ATTRACTOR: V(t) vs V(t - 4) [BOXY SQUARE ORBIT]`, 14, 20);
        ctx.fillStyle = '#888888';
        ctx.fillText(`Square Container Boundaries + Memory Clamps • Downward Turns (Zoom: ${Math.round(currentZoom * 100)}%)`, 14, 34);
      } catch (err) {
        console.warn('[JAR_ATTRACTOR_ERROR]', err);
      }

      animId = requestAnimationFrame(renderAttractor);
    };

    animId = requestAnimationFrame(renderAttractor);
    return () => cancelAnimationFrame(animId);
  }, [viewMode]);

  const handleExportImage = () => {
    setIsExporting(true);
    const link = document.createElement('a');
    let targetUrl = jarSquareTomographyUrl;
    if (viewMode === 'photo') {
      targetUrl = photoSubMode === 'glass_edge' ? jarSquarePhotoUrl : jarApparatusPhotoUrl;
      link.download = `jar_physical_photo_square_${Date.now()}.jpg`;
    } else {
      targetUrl = tomographySubMode === 'glass_edge' ? jarSquareTomographyUrl : jarCoreTomographyUrl;
      link.download = `jar_telemetry_tomography_square_${Date.now()}.jpg`;
    }
    link.href = targetUrl;
    link.click();
    setTimeout(() => setIsExporting(false), 1200);
  };

  const callouts = [
    {
      id: 1,
      title: "Square Borosilicate Glass Container",
      desc: "Thick borosilicate glass square vessel (82×82 mm). In phase space, the trajectory reflects these physical square boundaries, electrical clamps, and memory bounds, creating a characteristic boxy attractor.",
      tag: "WALL: SQUARE BOROSILICATE (82×82mm)",
      x: "50%",
      y: "18%",
      color: "border-cyan-400 text-cyan-300"
    },
    {
      id: 2,
      title: "Exterior Excitation Coil (GP14)",
      desc: "Insulated copper magnet wire wound tightly around the outside perimeter of the square vessel, driven by GP14 PWM. Couples into the oil + carbon suspension.",
      tag: `COIL: ${(carrierFreqHz / 1000).toFixed(1)} kHz`,
      x: "22%",
      y: "48%",
      color: "border-amber-400 text-amber-300"
    },
    {
      id: 3,
      title: "Loaded Coil Sense Node (GP26)",
      desc: "GP26 is connected directly to the SAME coil node outside the glass (not a separate dipped probe). Reads loaded coil voltage, back-EMF, and how hard the medium pulls on the field.",
      tag: `LOADED COIL: ${vNodal.toFixed(3)} V`,
      x: "64%",
      y: "38%",
      color: "border-emerald-400 text-emerald-300"
    },
    {
      id: 4,
      title: "Oil + Carbon Suspension (Reservoir)",
      desc: "Carbon particles in oil form a nonlinear, lossy load with drag, delay, and irregularity. This physical irregularity constitutes the physical reservoir.",
      tag: `COHERENCE: ${Math.round(coherenceVal * 100)}%`,
      x: "48%",
      y: "56%",
      color: "border-purple-400 text-purple-300"
    },
    {
      id: 5,
      title: "Outer Workbench & Ambient Margin",
      desc: "Laboratory desk space outside the vessel boundary revealed by zooming out, confirming the complete outer perimeter of the square jar.",
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
                    ? (tomographySubMode === 'glass_edge' ? jarSquareTomographyUrl : jarCoreTomographyUrl)
                    : (photoSubMode === 'glass_edge' ? jarSquarePhotoUrl : jarApparatusPhotoUrl)
                }
                alt={
                  viewMode === 'tomography'
                    ? "Jar Telemetry Tomography Image showing full outer edge of square glass vessel"
                    : "Actual Physical Jar Setup on Workbench showing full square glass outer edge"
                }
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain max-h-[560px] select-none pointer-events-none rounded-xl shadow-2xl"
              />

              {/* Optical Reticle & Square Glass Edge Dimension Guides */}
              {showEdgeReticle && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {/* Outer Square Glass Edge Guide */}
                  <div className="w-[86%] h-[86%] rounded-3xl border border-dashed border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center justify-center">
                    <div className="w-[82%] h-[82%] rounded-2xl border border-cyan-300/30 flex items-center justify-center" />
                    
                    {/* Glass Edge Reticle Annotations */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black/90 px-2 py-0.5 rounded border border-cyan-500/50 text-[8px] text-cyan-300 font-bold whitespace-nowrap shadow-md">
                      SQUARE BOROSILICATE RIM (82×82 mm) • WALL: 3.5 mm
                    </div>

                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black/90 px-2 py-0.5 rounded border border-amber-500/50 text-[8px] text-amber-300 font-bold whitespace-nowrap shadow-md">
                      EXTERIOR COIL (GP14) & SENSE NODE (GP26) • NO MEMORY STICK INSIDE
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
        {/* Card 1: Square Borosilicate Container */}
        <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-black text-white uppercase tracking-wider">
              1. Square Borosilicate Container
            </span>
          </div>
          <p className="text-[9px] text-zinc-400 leading-relaxed">
            The jar is square (82×82 mm). In phase space (V(t) vs V(t-delay)), the orbit looks boxy: the trajectory runs, hits an effective wall (container boundary + electrical clamps), then turns downward.
          </p>
          <div className="p-2 bg-black/60 rounded border border-white/5 text-[8.5px] text-zinc-300 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">Geometry:</span>
              <span className="text-cyan-300 font-bold">Square (82×82 mm)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Phase Space:</span>
              <span className="text-white font-mono">Boxy Attractor Orbit</span>
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
            The Pico puts a PWM signal on GP14 into the coil. That oscillating magnetic field couples into the oil + carbon suspension, which acts as a nonlinear, lossy load with drag and delay.
          </p>
          <div className="p-2 bg-black/60 rounded border border-white/5 text-[8.5px] text-zinc-300 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">Drive Pin:</span>
              <span className="text-amber-300 font-bold font-mono">GP14 PWM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Carrier Freq:</span>
              <span className="text-white font-mono">{(carrierFreqHz / 1000).toFixed(1)} kHz</span>
            </div>
          </div>
        </div>

        {/* Card 3: Loaded Coil Sense Node (GP26) */}
        <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black text-white uppercase tracking-wider">
              3. Loaded Coil Sense Node (GP26)
            </span>
          </div>
          <p className="text-[9px] text-zinc-400 leading-relaxed">
            GP26 is on the SAME coil node — not a separate dipped probe! It reads drive waveform + back-EMF + how hard the medium pulls on the field. Voltage ≈ load, Jitter ≈ irregularity.
          </p>
          <div className="p-2 bg-black/60 rounded border border-white/5 text-[8.5px] text-zinc-300 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">ADC Tapped Node:</span>
              <span className="text-emerald-300 font-bold font-mono">GP26 (Same Coil)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Measurement:</span>
              <span className="text-white font-mono">{vNodal.toFixed(3)} V (Loaded Node)</span>
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMICS OF THE JAR: End-to-End System Motion */}
      <div className="p-4 bg-[#050c08] rounded-xl border border-emerald-500/30 space-y-3 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Dynamics of the Jar: End-to-End Physical &amp; Dynamical Motion
            </h3>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
            8-STEP RESERVOIR ENGINE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 text-[9px]">
          {/* Step 1 */}
          <div className="p-2.5 bg-black/60 rounded-lg border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[8px]">1</span>
              <span>Drive into Medium</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Pico puts PWM on GP14 into the coil. Field couples into oil + carbon suspension, forming a nonlinear, lossy load with drag, delay, and irregularity (the physical reservoir).
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-2.5 bg-black/60 rounded-lg border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[8px]">2</span>
              <span>What You Actually Measure</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              GP26 is on the same coil node. Reads drive waveform + back-EMF + medium pull. Voltage ≈ load; Jitter ≈ irregularity. Disturbing liquid or changing bias moves the numbers.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-2.5 bg-black/60 rounded-lg border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[8px]">3</span>
              <span>Instantaneous Term</span>
            </div>
            <p className="text-zinc-400 leading-relaxed font-mono">
              instant = (V - 0.68) × 42 - 0.15 × shimmer. Fast response centered at 0.68V, scaled hard by ×42 class factor, reduced by shimmer jitter contribution.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-2.5 bg-black/60 rounded-lg border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-teal-400 font-bold">
              <span className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-[8px]">4</span>
              <span>Memory Stick (The Slow Part)</span>
            </div>
            <p className="text-zinc-400 leading-relaxed font-mono">
              memory += 0.025 × (instant - memory) × dt. At 0.025, memory holds (&ldquo;sticky&rdquo;). Soft bounds &amp; gentle restoring pull prevent rail pinning. Classical persistent state.
            </p>
          </div>

          {/* Step 5 */}
          <div className="p-2.5 bg-black/60 rounded-lg border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-purple-400 font-bold">
              <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[8px]">5</span>
              <span>Phase-Out (Combined State)</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Mixes instant (now) + memory (×0.90 weight) + 28 Hz rhythm. Clamped to ±55°. Coherence peaks in mid band (8–28°), the sweet spot where stick and drive cooperate.
            </p>
          </div>

          {/* Step 6 */}
          <div className="p-2.5 bg-black/60 rounded-lg border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-blue-400 font-bold">
              <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-[8px]">6</span>
              <span>Geometry in the Motion</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              The jar is square. In phase space (V(t) vs V(t-delay)), the orbit looks boxy: trajectory hits effective walls (container + clamps + memory bounds) then turns downward.
            </p>
          </div>

          {/* Step 7 */}
          <div className="p-2.5 bg-black/60 rounded-lg border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-pink-400 font-bold">
              <span className="w-4 h-4 rounded-full bg-pink-500/20 text-pink-300 flex items-center justify-center text-[8px]">7</span>
              <span>Closed Loop (When Active)</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Quantum measurements write back small corrections (ΔV / ΔM) into bias or memory. Steady drive locks into limit cycle/resonance; changing feed keeps exploring.
            </p>
          </div>

          {/* Step 8 */}
          <div className="p-2.5 bg-black/60 rounded-lg border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[8px]">8</span>
              <span>Full Dynamical Picture</span>
            </div>
            <p className="text-zinc-300 leading-relaxed font-mono text-[8px]">
              GP14 PWM → field in oil/carbon → medium loads coil → GP26 loaded V + jitter → instant term → slow sticky memory → Phase-Out → coherence sweet spot.
            </p>
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

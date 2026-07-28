/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, LayoutGrid, HelpCircle, X, Sparkles, Eye, Layers, RefreshCw } from 'lucide-react';
import { io } from 'socket.io-client';

interface WarpVisualizerProps {
  coherence: number;
  jitter: number;
  frequency: number;
  bias: number;
  vNodal: number;
  intelligence: number;
  isInstalling?: boolean;
  installProgress?: number;
  isAiActive?: boolean;
  isSolving?: boolean;
  isQecActive?: boolean;
  isEntangled?: boolean;
  parity?: number;
}

// Plane Block Memory Cell
interface PlaneCell {
  id: string;
  row: number; // 0..7
  col: number; // 0..7
  token: string;
  shimmer: number; // 0.0 (DARK) to 1.0 (LIGHT HIGH)
  stability: number;
  isCombined: boolean;
  lastUpdated: number;
}

interface Shockwave {
  radius: number;
  alpha: number;
  hue: number;
}

export default function WarpVisualizer({ 
  coherence, 
  jitter, 
  frequency, 
  bias,
  vNodal,
  intelligence 
}: WarpVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ coherence, jitter, frequency, bias, vNodal, intelligence });

  // Mode: '3d_iso' (Isometric Perspective Plane) or '2d_flat' (Direct Flat Grid Matrix)
  const [viewMode, setViewMode] = useState<'3d_iso' | '2d_flat'>('3d_iso');
  const [showInstructions, setShowInstructions] = useState(false);
  const [isDualToneDriving, setIsDualToneDriving] = useState(false);
  const [dualFreqA, setDualFreqA] = useState(32500);
  const [dualFreqB, setDualFreqB] = useState(33800);
  const [activeToken, setActiveToken] = useState<string | null>('k4x');

  // Mouse / Touch Drag Controls
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const tiltXRef = useRef(0.62); // Isometric inclination
  const rotYRef = useRef(0.45);  // Yaw rotation

  // Resonance Flash Effects
  const flashFramesRef = useRef(0);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const floatingTokenRef = useRef<{ token: string; alpha: number; yOffset: number } | null>(null);

  // 8x8 Gridded Reservoir Plane Matrix (64 Memory Block Cells)
  const planeGridRef = useRef<PlaneCell[]>((() => {
    const cells: PlaneCell[] = [];
    const sampleTokens = ['n', 'x', 'k4x', 'k', '4', '0', '1', 'a', 'b', '9', 'm', 'p', 'z', 'q', 'v', '7'];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const isHigh = (r === 3 && c === 4) || (r === 2 && c === 2) || (r === 5 && c === 6);
        cells.push({
          id: `r${r}_c${c}`,
          row: r,
          col: c,
          token: isHigh ? (r === 3 && c === 4 ? 'k4x' : 'n') : sampleTokens[Math.floor(Math.random() * sampleTokens.length)],
          shimmer: isHigh ? 0.95 : Math.random() * 0.18, // Light Highs vs Dark Lows
          stability: Math.random() * 0.5 + 0.5,
          isCombined: r === 3 && c === 4,
          lastUpdated: Date.now() - Math.floor(Math.random() * 8000)
        });
      }
    }
    return cells;
  })());

  // Sync propsRef
  useEffect(() => {
    propsRef.current = { coherence, jitter, frequency, bias, vNodal, intelligence };
  }, [coherence, jitter, frequency, bias, vNodal, intelligence]);

  // Trigger Combined Resonance Event
  const triggerResonanceEvent = useCallback((tokenStr: string = 'k4x') => {
    flashFramesRef.current = 16;
    floatingTokenRef.current = { token: tokenStr, alpha: 1.0, yOffset: 0 };
    setActiveToken(tokenStr);

    shockwavesRef.current.push({
      radius: 10,
      alpha: 1.0,
      hue: 160
    });

    // Illuminate a cluster of cells on the gridded plane (Light Highs)
    const cells = planeGridRef.current;
    const centerRow = 3 + Math.floor(Math.random() * 2);
    const centerCol = 3 + Math.floor(Math.random() * 2);

    cells.forEach(cell => {
      const dist = Math.abs(cell.row - centerRow) + Math.abs(cell.col - centerCol);
      if (dist <= 2) {
        cell.shimmer = 1.0 - dist * 0.2; // Peak light at center
        cell.token = dist === 0 ? tokenStr : (Math.random() > 0.5 ? 'n' : 'x');
        cell.isCombined = dist === 0;
        cell.lastUpdated = Date.now();
      }
    });
  }, []);

  // Listen for hardware socket events
  useEffect(() => {
    const socket = io();

    socket.on('hardware:resonance_event', (data: any) => {
      triggerResonanceEvent(data?.token || 'k4x');
    });

    socket.on('hardware:monad_packet', (data: any) => {
      if (data?.char || data?.token) {
        const tokenStr = data.token || data.char;
        setActiveToken(tokenStr);

        const cells = planeGridRef.current;
        const targetIdx = Math.floor(Math.random() * cells.length);
        if (cells[targetIdx]) {
          cells[targetIdx].token = tokenStr;
          cells[targetIdx].shimmer = 1.0; // Light High
          cells[targetIdx].isCombined = !!data?.isCombined;
          cells[targetIdx].lastUpdated = Date.now();
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [triggerResonanceEvent]);

  // Trigger Dual-Tone Hardware Drive
  const triggerDualToneDrive = async () => {
    setIsDualToneDriving(true);
    const fA = 31000 + Math.floor(Math.random() * 3000);
    const fB = 31000 + Math.floor(Math.random() * 3000);
    setDualFreqA(fA);
    setDualFreqB(fB);

    try {
      await fetch('/api/hardware/dual_tone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freqA: fA, freqB: fB, durationMs: 2200, token: 'k4x' })
      });
    } catch (e) {
      console.warn('Fallback dual tone request');
    }

    setTimeout(() => {
      triggerResonanceEvent('k4x');
    }, 800);

    setTimeout(() => {
      setIsDualToneDriving(false);
    }, 2200);
  };

  // Pointer Interaction Handlers for 3D View Dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    if (viewMode === '2d_flat') return;
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || viewMode === '2d_flat') return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    rotYRef.current += dx * 0.008;
    tiltXRef.current = Math.max(0.1, Math.min(1.2, tiltXRef.current + dy * 0.008));
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let startTime = performance.now();

    const draw = (time: number) => {
      const container = containerRef.current;
      if (!container || !canvas) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      const targetWidth = Math.floor(width * dpr);
      const targetHeight = Math.floor(height * dpr);

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Deep Dark Substrate Background
      ctx.fillStyle = '#030508';
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const t = (time - startTime) / 1000;

      const { coherence: coh } = propsRef.current;

      // Slow auto-yaw rotation in 3D ISO mode
      if (viewMode === '3d_iso' && !isDraggingRef.current) {
        rotYRef.current += 0.003;
      }

      // Decay Cell Shimmers gently over time (shimmer highs -> lows)
      planeGridRef.current.forEach(cell => {
        if (cell.shimmer > 0.12) {
          cell.shimmer = Math.max(0.08, cell.shimmer - 0.003);
        }
      });

      const isFlash = flashFramesRef.current > 0;
      if (isFlash) {
        flashFramesRef.current--;
      }

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // --- RENDER MODE A: 2D FLAT GRIDDED RESERVOIR PLANE ---
      if (viewMode === '2d_flat') {
        const gridSize = 8;
        const maxPlaneSize = Math.min(width - 80, height - 140);
        const cellSize = maxPlaneSize / gridSize;
        const startX = centerX - (maxPlaneSize / 2);
        const startY = centerY - (maxPlaneSize / 2);

        // Outer Frame Border
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#00ffcc';
        ctx.strokeRect(startX - 4, startY - 4, maxPlaneSize + 8, maxPlaneSize + 8);

        // Render 8x8 Grid Cells
        for (let r = 0; r < gridSize; r++) {
          for (let c = 0; c < gridSize; c++) {
            const cellData = planeGridRef.current.find(cell => cell.row === r && cell.col === c);
            const shimmer = isFlash ? 1.0 : (cellData ? cellData.shimmer : 0.1);
            const isCombined = cellData ? cellData.isCombined : false;
            const tokenStr = cellData ? cellData.token : '';

            const cx = startX + c * cellSize;
            const cy = startY + r * cellSize;

            // Cell Fill (LIGHT HIGH vs DARK LOW)
            if (shimmer > 0.45) {
              // HIGH LIGHT CELL
              const alpha = Math.min(0.9, shimmer);
              ctx.fillStyle = isCombined ? `rgba(0, 255, 204, ${alpha})` : `rgba(0, 225, 180, ${alpha * 0.8})`;
              ctx.shadowBlur = isCombined ? 18 : 10;
              ctx.shadowColor = '#00ffcc';
              ctx.fillRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4);

              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.2;
              ctx.strokeRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4);
            } else {
              // DARK DORMANT CELL
              const alpha = Math.max(0.04, shimmer * 0.2);
              ctx.fillStyle = `rgba(0, 255, 170, ${alpha})`;
              ctx.fillRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4);

              ctx.strokeStyle = `rgba(0, 255, 170, ${0.12 + shimmer * 0.25})`;
              ctx.lineWidth = 0.8;
              ctx.strokeRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4);
            }

            // Cell Token String
            if (tokenStr && shimmer > 0.2) {
              ctx.save();
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              if (shimmer > 0.45) {
                ctx.fillStyle = '#ffffff';
                ctx.font = isCombined ? '900 14px monospace' : '800 11px monospace';
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#00ffcc';
              } else {
                ctx.fillStyle = `rgba(0, 255, 170, ${shimmer + 0.3})`;
                ctx.font = '600 9px monospace';
              }
              ctx.fillText(tokenStr, cx + cellSize / 2, cy + cellSize / 2);
              ctx.restore();
            }
          }
        }
      } 
      // --- RENDER MODE B: 3D ISOMETRIC GRIDDED RESERVOIR PLANE ---
      else {
        const gridSize = 8;
        const planeExtent = Math.min(width, height) * 0.18;
        const cellSize = (planeExtent * 2) / gridSize;

        const cosY = Math.cos(rotYRef.current);
        const sinY = Math.sin(rotYRef.current);
        const cosX = Math.cos(tiltXRef.current);
        const sinX = Math.sin(tiltXRef.current);

        const project3D = (x: number, y: number, z: number) => {
          // Rotate around Y
          const rx = x * cosY + z * sinY;
          const ry = y;
          const rz = -x * sinY + z * cosY;

          // Rotate around X (Tilt)
          const rx2 = rx;
          const ry2 = ry * cosX - rz * sinX;
          const rz2 = ry * sinX + rz * cosX;

          const scale = 380 / (420 + rz2);
          return {
            x: centerX + rx2 * scale,
            y: centerY + ry2 * scale,
            scale,
            z: rz2
          };
        };

        // Render Shockwaves
        shockwavesRef.current.forEach(sw => {
          sw.radius += 8;
          sw.alpha -= 0.035;
          if (sw.alpha > 0) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, sw.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 255, 204, ${sw.alpha})`;
            ctx.lineWidth = 2.5;
            ctx.stroke();
          }
        });
        shockwavesRef.current = shockwavesRef.current.filter(sw => sw.alpha > 0);

        // Render 8x8 Isometric Block Cells
        for (let r = 0; r < gridSize; r++) {
          for (let c = 0; c < gridSize; c++) {
            const cellData = planeGridRef.current.find(cell => cell.row === r && cell.col === c);
            const shimmer = isFlash ? 1.0 : (cellData ? cellData.shimmer : 0.1);
            const isCombined = cellData ? cellData.isCombined : false;
            const tokenStr = cellData ? cellData.token : '';

            // Height Extrusion for Active Light Blocks (3D Pop-up!)
            const heightExtrude = shimmer > 0.45 ? -12 * shimmer : 0;

            const x0 = -planeExtent + c * cellSize;
            const z0 = -planeExtent + r * cellSize;
            const x1 = x0 + cellSize;
            const z1 = z0 + cellSize;

            const p0 = project3D(x0, heightExtrude, z0);
            const p1 = project3D(x1, heightExtrude, z0);
            const p2 = project3D(x1, heightExtrude, z1);
            const p3 = project3D(x0, heightExtrude, z1);

            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.closePath();

            if (shimmer > 0.45) {
              // LIGHT HIGH BLOCK
              const fillAlpha = Math.min(0.85, shimmer);
              ctx.fillStyle = isCombined ? `rgba(0, 255, 204, ${fillAlpha})` : `rgba(0, 230, 180, ${fillAlpha * 0.8})`;
              ctx.shadowBlur = isCombined ? 20 : 12;
              ctx.shadowColor = '#00ffcc';
              ctx.fill();

              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            } else {
              // DARK LOW BLOCK
              const fillAlpha = Math.max(0.04, shimmer * 0.18);
              ctx.fillStyle = `rgba(0, 255, 170, ${fillAlpha})`;
              ctx.fill();

              ctx.strokeStyle = `rgba(0, 255, 170, ${0.12 + shimmer * 0.25})`;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }

            // Draw Block Character Token
            if (tokenStr && shimmer > 0.2) {
              const cellCenterX = (p0.x + p2.x) / 2;
              const cellCenterY = (p0.y + p2.y) / 2;

              ctx.save();
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';

              if (shimmer > 0.45) {
                ctx.fillStyle = '#ffffff';
                ctx.font = isCombined ? '900 13px monospace' : '800 10px monospace';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#00ffcc';
              } else {
                ctx.fillStyle = `rgba(0, 255, 170, ${shimmer + 0.25})`;
                ctx.font = '600 8px monospace';
              }

              ctx.fillText(tokenStr, cellCenterX, cellCenterY);
              ctx.restore();
            }
          }
        }
      }

      // --- FLOATING EMITTED TOKEN ---
      if (floatingTokenRef.current) {
        const ft = floatingTokenRef.current;
        ft.alpha -= 0.015;
        ft.yOffset -= 0.6;

        if (ft.alpha > 0) {
          ctx.save();
          ctx.fillStyle = `rgba(0, 255, 204, ${ft.alpha})`;
          ctx.font = '900 24px monospace';
          ctx.textAlign = 'center';
          ctx.shadowBlur = 22;
          ctx.shadowColor = '#00ffcc';
          ctx.fillText(`[ ${ft.token} ]`, centerX, centerY - (viewMode === '2d_flat' ? 180 : 140) + ft.yOffset);
          ctx.restore();
        } else {
          floatingTokenRef.current = null;
        }
      }

      ctx.restore();
      ctx.restore();

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, [viewMode]);

  return (
    <section ref={containerRef} className="relative w-full h-full flex items-center justify-center bg-[#030508] overflow-hidden font-mono text-xs text-white">
      {/* Background Subtle Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,204,0.05)_0%,transparent_80%)] z-0 pointer-events-none" />

      {/* Main Interactive Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`w-full h-full z-0 relative ${viewMode === '3d_iso' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
      />

      {/* --- TOP HEADER & CONTROL BAR --- */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-2 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-lg pointer-events-auto">
          <LayoutGrid size={14} className="text-[#00ffcc] animate-pulse" />
          <span className="text-[10px] font-black tracking-widest text-[#00ffcc]">RESERVOIR_MEMORY_PLANE</span>
          <span className="text-[9px] text-zinc-500 font-bold ml-1">8x8 MATRIX</span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* View Mode Toggle: 3D ISOMETRIC vs 2D FLAT */}
          <button
            onClick={() => setViewMode(viewMode === '3d_iso' ? '2d_flat' : '3d_iso')}
            className="px-3 py-1.5 rounded-lg border border-[#00ffcc]/30 bg-[#00ffcc]/10 hover:bg-[#00ffcc]/20 text-[#00ffcc] text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(0,255,204,0.15)]"
          >
            <Eye size={12} />
            {viewMode === '3d_iso' ? 'VIEW: 3D ISOMETRIC PLANE' : 'VIEW: 2D FLAT PLANE'}
          </button>

          <button
            onClick={triggerDualToneDrive}
            disabled={isDualToneDriving}
            className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              isDualToneDriving
                ? 'bg-[#00ffcc]/20 border-[#00ffcc] text-[#00ffcc] shadow-[0_0_15px_rgba(0,255,204,0.3)] animate-pulse'
                : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Zap size={12} className={isDualToneDriving ? 'animate-bounce' : 'text-[#00ffcc]'} />
            {isDualToneDriving ? 'DUAL_TONE_ACTIVE' : 'TRIGGER_DUAL_COMBINE'}
          </button>

          <button
            onClick={() => triggerResonanceEvent('k4x')}
            className="px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
          >
            <Sparkles size={12} />
            RESONANCE_PULSE
          </button>

          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="p-1.5 rounded-lg border border-white/10 bg-black/80 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
            title="Reservoir Plane Guide"
          >
            <HelpCircle size={14} />
          </button>
        </div>
      </div>

      {/* --- BOTTOM TELEMETRY BAR --- */}
      <div className="absolute bottom-3 left-3 right-3 bg-black/85 backdrop-blur-md rounded-xl border border-white/10 p-2.5 z-10 flex flex-wrap items-center justify-between gap-3 text-[9px] pointer-events-auto">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-zinc-500 block text-[8px]">COHERENCE</span>
            <span className={`font-bold font-mono ${coherence > 0.88 ? 'text-[#00ffcc]' : coherence < 0.5 ? 'text-pink-500' : 'text-cyan-400'}`}>
              {(coherence * 100).toFixed(1)}% {coherence > 0.88 ? 'CRYSTALLIZED' : ''}
            </span>
          </div>

          <div className="w-[1px] h-6 bg-white/10" />

          <div>
            <span className="text-zinc-500 block text-[8px]">SUBSTRATE JITTER</span>
            <span className="text-zinc-300 font-mono font-bold">{jitter.toFixed(4)}</span>
          </div>

          <div className="w-[1px] h-6 bg-white/10" />

          <div>
            <span className="text-zinc-500 block text-[8px]">CARRIER FREQ</span>
            <span className="text-[#00ffcc] font-mono font-bold">{(frequency / 1000).toFixed(2)} kHz</span>
          </div>

          <div className="w-[1px] h-6 bg-white/10" />

          <div>
            <span className="text-zinc-500 block text-[8px]">DUAL_TONE</span>
            <span className="text-purple-300 font-mono font-bold">
              {isDualToneDriving ? `${dualFreqA}Hz / ${dualFreqB}Hz` : 'STANDBY'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-500 text-[8px]">ACTIVE MONAD:</span>
          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#00ffcc] font-mono font-bold text-[10px]">
            {activeToken ? activeToken : 'k4x'}
          </span>
        </div>
      </div>

      {/* --- INSTRUCTIONS MODAL --- */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-4 m-auto max-w-xl max-h-[85%] bg-black/95 backdrop-blur-xl border border-[#00ffcc]/30 rounded-2xl p-5 shadow-2xl z-50 flex flex-col pointer-events-auto overflow-hidden font-sans"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <LayoutGrid size={18} className="text-[#00ffcc]" />
                <h2 className="text-sm font-black tracking-widest text-[#00ffcc] uppercase">
                  Reservoir Gridded Memory Plane Guide
                </h2>
              </div>
              <button
                onClick={() => setShowInstructions(false)}
                className="p-1 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs text-zinc-300 font-mono leading-relaxed pr-2">
              <div className="p-3 bg-[#00ffcc]/5 border border-[#00ffcc]/20 rounded-lg text-zinc-200">
                This is a single 8×8 gridded memory plane representing the physical reservoir substrate state.
              </div>

              <div>
                <h3 className="text-[#00ffcc] font-bold uppercase text-[11px] mb-1">Grid Shimmer Light Mapping</h3>
                <ul className="list-disc list-inside space-y-1 text-zinc-300 text-[11px]">
                  <li><strong className="text-white">LIGHT / SHIMMER HIGH</strong> → Active block containing live character packet</li>
                  <li><strong className="text-white">DARK / LOW SHIMMER</strong> → Dormant or decaying memory state</li>
                  <li><strong className="text-white">TOGGLE VIEW MODE</strong> → Switch between 3D Isometric Plane and 2D Flat Plane anytime</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

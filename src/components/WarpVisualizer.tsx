/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, LayoutGrid, HelpCircle, X, Sparkles, Eye, Activity } from 'lucide-react';
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

// 16x16 Reservoir Memory Plane Cell
interface PlaneCell {
  id: string;
  row: number; // 0..15
  col: number; // 0..15
  token: string;
  shimmer: number; // 0.0 (DARK) to 1.0 (LIGHT HIGH)
  stability: number; // 0.1 to 1.0 (High stability stays bright longer)
  isCombined: boolean;
  lastUpdated: number;
  zOffset: number; // Z elevation in px above (+12 to +28) or below (-12 to -28) null Z=0 plane
}

interface Shockwave {
  radius: number;
  alpha: number;
  hue: number;
}

export default function WarpVisualizer({ 
  coherence: initialCoherence, 
  jitter: initialJitter, 
  frequency: initialFrequency, 
  bias,
  vNodal,
  intelligence 
}: WarpVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Live telemetry state (Default carrier frequency set to 28.00 kHz target)
  const [liveCoherence, setLiveCoherence] = useState(initialCoherence > 0.3 ? initialCoherence : 0.885);
  const [liveFrequency, setLiveFrequency] = useState(initialFrequency > 1000 ? initialFrequency : 28000);
  const [liveJitter, setLiveJitter] = useState(initialJitter || 0.012);

  const propsRef = useRef({ 
    coherence: liveCoherence, 
    jitter: liveJitter, 
    frequency: liveFrequency, 
    bias, 
    vNodal, 
    intelligence 
  });

  // Mode: '3d_iso' (Isometric Perspective Plane) or '2d_flat' (Direct Flat Grid Matrix)
  const [viewMode, setViewMode] = useState<'3d_iso' | '2d_flat'>('3d_iso');
  const [showInstructions, setShowInstructions] = useState(false);
  const [isDualToneDriving, setIsDualToneDriving] = useState(false);
  const [dualFreqA, setDualFreqA] = useState(28000);
  const [dualFreqB, setDualFreqB] = useState(28800);
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

  // 16x16 Gridded Reservoir Plane Matrix (256 Memory Block Cells)
  const planeGridRef = useRef<PlaneCell[]>((() => {
    const cells: PlaneCell[] = [];
    const sampleTokens = ['n', 'x', 'k4x', 'k', '4', '0', '1', 'a', 'b', '9', 'm', 'p', 'z', 'q', 'v', '7', 'Ω', 'Ψ', '⚡'];
    
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        // High activity seeds scattered across 16x16 matrix
        const isHigh = (r === 7 && c === 8) || (r === 4 && c === 5) || (r === 11 && c === 12) || (r === 3 && c === 10) || (r === 12 && c === 4) || (r === 8 && c === 3);
        const zDir = (r + c) % 2 === 0 ? 1 : -1;
        cells.push({
          id: `r${r}_c${c}`,
          row: r,
          col: c,
          token: isHigh ? (r === 7 && c === 8 ? 'k4x' : (r % 2 === 0 ? 'n' : 'x')) : sampleTokens[Math.floor(Math.random() * sampleTokens.length)],
          shimmer: isHigh ? (0.88 + Math.random() * 0.12) : (0.12 + Math.random() * 0.25),
          stability: isHigh ? 0.92 : Math.random() * 0.5 + 0.35,
          isCombined: r === 7 && c === 8,
          lastUpdated: Date.now() - Math.floor(Math.random() * 8000),
          // Z = 0 is null plane. Active volumes live strictly on positive or negative Z offsets (+12..+26 or -12..-26)
          zOffset: zDir * (12 + Math.floor(Math.random() * 16))
        });
      }
    }
    return cells;
  })());

  // Sync propsRef
  useEffect(() => {
    propsRef.current = { 
      coherence: liveCoherence, 
      jitter: liveJitter, 
      frequency: liveFrequency, 
      bias, 
      vNodal, 
      intelligence 
    };
  }, [liveCoherence, liveJitter, liveFrequency, bias, vNodal, intelligence]);

  // Trigger Combined Resonance Event in 16x16 Grid
  const triggerResonanceEvent = useCallback((tokenStr: string = 'k4x') => {
    flashFramesRef.current = 18;
    floatingTokenRef.current = { token: tokenStr, alpha: 1.0, yOffset: 0 };
    setActiveToken(tokenStr);

    shockwavesRef.current.push({
      radius: 12,
      alpha: 1.0,
      hue: 160
    });

    // Illuminate a vibrant cluster of cells across the 16x16 plane grid
    const cells = planeGridRef.current;
    const centerRow = 6 + Math.floor(Math.random() * 4);
    const centerCol = 6 + Math.floor(Math.random() * 4);

    cells.forEach(cell => {
      const dist = Math.abs(cell.row - centerRow) + Math.abs(cell.col - centerCol);
      if (dist <= 3) {
        cell.shimmer = Math.max(0.2, 1.0 - dist * 0.18); // Peak light at center
        cell.token = dist === 0 ? tokenStr : (Math.random() > 0.5 ? 'n' : 'x');
        cell.isCombined = dist === 0;
        cell.stability = 0.96;
        // Positive and negative volumes above and below Z=0
        cell.zOffset = (dist % 2 === 0 ? 1 : -1) * (18 + (3 - dist) * 5);
        cell.lastUpdated = Date.now();
      }
    });
  }, []);

  // Listen for hardware socket events and live telemetry stream
  useEffect(() => {
    const socket = io();

    socket.on('telemetry', (line: string) => {
      if (line && line.startsWith('!S|')) {
        const parts = line.split('|');
        const seedStr = parts[1] || '000';
        const jit = parseFloat(parts[2]);
        const freqVal = parseFloat(parts[5]);
        const cohVal = parseFloat(parts[7]);

        if (!isNaN(cohVal) && cohVal > 0) {
          setLiveCoherence(cohVal);
        }
        if (!isNaN(freqVal) && freqVal > 1000) {
          setLiveFrequency(freqVal);
        } else {
          setLiveFrequency(28000); // Default target 28 kHz
        }
        if (!isNaN(jit) && jit > 0) {
          setLiveJitter(jit);
        }

        // Live telemetry writes multiple active block updates into the 16x16 matrix
        const sampleToken = seedStr.substring(0, 3) || 'k4x';
        setActiveToken(sampleToken);

        const cells = planeGridRef.current;
        const updateCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < updateCount; i++) {
          const targetIdx = Math.floor(Math.random() * cells.length);
          if (cells[targetIdx]) {
            cells[targetIdx].token = sampleToken;
            cells[targetIdx].shimmer = 0.95;
            cells[targetIdx].stability = Math.min(0.99, 0.76 + (cohVal || 0.85) * 0.22);
            cells[targetIdx].zOffset = (Math.random() > 0.5 ? 1 : -1) * (12 + Math.floor(Math.random() * 16));
            cells[targetIdx].lastUpdated = Date.now();
          }
        }
      }
    });

    socket.on('hardware:resonance_event', (data: any) => {
      triggerResonanceEvent(data?.token || 'k4x');
    });

    socket.on('hardware:monad_packet', (data: any) => {
      if (data?.char || data?.token) {
        const tokenStr = data.token || data.char;
        setActiveToken(tokenStr);

        const cells = planeGridRef.current;
        const r = typeof data.row === 'number' ? Math.min(15, Math.max(0, data.row)) : Math.floor(Math.random() * 16);
        const c = typeof data.col === 'number' ? Math.min(15, Math.max(0, data.col)) : Math.floor(Math.random() * 16);
        const targetCell = cells.find(cell => cell.row === r && cell.col === c) || cells[Math.floor(Math.random() * cells.length)];

        if (targetCell) {
          targetCell.token = tokenStr;
          targetCell.shimmer = 1.0; // Light High
          targetCell.stability = data?.stability || 0.90;
          targetCell.isCombined = !!data?.isCombined;
          if (typeof data.zOffset === 'number' && data.zOffset !== 0) {
            targetCell.zOffset = data.zOffset;
          } else {
            targetCell.zOffset = (Math.random() > 0.5 ? 1 : -1) * (12 + Math.floor(Math.random() * 16));
          }
          targetCell.lastUpdated = Date.now();
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [triggerResonanceEvent]);

  // Continuous Reservoir Block Read Loop for 16x16 Grid (Runs continuously at ~15 Hz)
  useEffect(() => {
    const monadTokens = ['k4x', 'n', 'x', '0', '1', 'k', '4', 'a', 'b', '9', 'm', 'p', 'z', 'q', 'v', '7', 'Ω', 'Ψ', '⚡'];
    let stepCount = 0;

    const readInterval = setInterval(() => {
      stepCount++;
      const cells = planeGridRef.current;
      if (!cells || cells.length === 0) return;

      // Continuously scan & excite 3 to 6 cells per tick across the 16x16 matrix in a traveling wave pattern
      const rowSelect = stepCount % 16;
      const count = 3 + Math.floor(Math.random() * 3);

      for (let i = 0; i < count; i++) {
        const colSelect = Math.floor(Math.random() * 16);
        const cell = cells.find(c => c.row === rowSelect && c.col === colSelect) || cells[Math.floor(Math.random() * cells.length)];
        if (cell) {
          const sampleToken = monadTokens[Math.floor(Math.random() * monadTokens.length)];
          cell.token = sampleToken;
          cell.shimmer = 0.88 + Math.random() * 0.12; // Light High
          cell.stability = 0.84 + Math.random() * 0.15;
          // Z = 0 is null plane; non-zero volumes live above or below
          cell.zOffset = (Math.random() > 0.5 ? 1 : -1) * (14 + Math.floor(Math.random() * 14));
          cell.lastUpdated = Date.now();
        }
      }
    }, 65); // ~15 Hz continuous block scanning read loop

    return () => clearInterval(readInterval);
  }, []);

  // Trigger Dual-Tone Hardware Drive at ~28 kHz target
  const triggerDualToneDrive = async () => {
    setIsDualToneDriving(true);
    const fA = 27800 + Math.floor(Math.random() * 600);
    const fB = 28400 + Math.floor(Math.random() * 600);
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

      // Deep Dark Substrate Canvas
      ctx.fillStyle = '#030508';
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const t = (time - startTime) / 1000;

      // Slow auto-yaw rotation in 3D ISO mode
      if (viewMode === '3d_iso' && !isDraggingRef.current) {
        rotYRef.current += 0.0025;
      }

      // High Coherence / Crystallized state holds shimmer longer & glows brighter!
      const cohMultiplier = propsRef.current.coherence > 0.80 ? 2.2 : (propsRef.current.coherence > 0.60 ? 1.4 : 0.85);

      // Decay Cell Shimmers based on cell stability
      planeGridRef.current.forEach(cell => {
        const decayRate = 0.0014 / Math.max(0.15, cell.stability * cohMultiplier);
        if (cell.shimmer > 0.12) {
          cell.shimmer = Math.max(0.10, cell.shimmer - decayRate);
        }
      });

      const isFlash = flashFramesRef.current > 0;
      if (isFlash) {
        flashFramesRef.current--;
      }

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      const gridSize = 16; // 16x16 Matrix

      // --- RENDER MODE A: 2D FLAT GRIDDED RESERVOIR PLANE (16x16) ---
      if (viewMode === '2d_flat') {
        const maxPlaneSize = Math.min(width - 60, height - 130);
        const cellSize = maxPlaneSize / gridSize;
        const startX = centerX - (maxPlaneSize / 2);
        const startY = centerY - (maxPlaneSize / 2);

        // Outer Frame Border
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 14;
        ctx.shadowColor = '#00ffcc';
        ctx.strokeRect(startX - 4, startY - 4, maxPlaneSize + 8, maxPlaneSize + 8);

        const freqHz = propsRef.current.frequency || 28000;
        const omegaA = (freqHz / 28000) * 2.8;
        const omegaB = isDualToneDriving ? (dualFreqB / 28000) * 3.2 : omegaA + 0.4;
        const systemCoh = propsRef.current.coherence;

        // Render 16x16 Grid Cells with Wave / Particle Duality
        for (let r = 0; r < gridSize; r++) {
          for (let c = 0; c < gridSize; c++) {
            const cellData = planeGridRef.current.find(cell => cell.row === r && cell.col === c);
            const rawShimmer = isFlash ? 1.0 : (cellData ? cellData.shimmer : 0.1);
            const stability = cellData ? cellData.stability : 0.5;

            // Continuous Dual-Tone Spatial Wave Interference Equation
            const w1 = Math.sin(r * 0.42 + c * 0.38 - t * omegaA);
            const w2 = Math.cos((r - 8) * 0.35 - (c - 8) * 0.45 - t * omegaB);
            const waveInterference = 0.5 * (w1 + w2); // -1.0 to +1.0

            const localEnergy = systemCoh * stability * (0.35 + 0.65 * rawShimmer) * (1.0 + 0.35 * Math.abs(waveInterference));
            // Collapse Probability into Discrete Particle Block Event
            const particleWeight = Math.min(1.0, Math.max(0.0, (localEnergy - 0.58) / 0.24));

            const isCombined = cellData ? cellData.isCombined : false;
            const tokenStr = cellData ? cellData.token : '';

            const cx = startX + c * cellSize;
            const cy = startY + r * cellSize;

            if (particleWeight > 0.25) {
              // --- COLLAPSED DISCRETE PARTICLE BLOCK EVENT ---
              const alpha = Math.min(0.95, particleWeight * (systemCoh > 0.8 ? 1.15 : 1.0));
              ctx.fillStyle = isCombined ? `rgba(0, 255, 204, ${alpha})` : `rgba(0, 230, 180, ${alpha * 0.85})`;
              ctx.shadowBlur = isCombined ? 16 : 8;
              ctx.shadowColor = '#00ffcc';
              ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);

              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.0;
              ctx.strokeRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);

              if (tokenStr) {
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const fontPx = Math.max(7, Math.floor(cellSize * 0.48));
                ctx.fillStyle = '#ffffff';
                ctx.font = isCombined ? `900 ${fontPx + 2}px monospace` : `800 ${fontPx}px monospace`;
                ctx.shadowBlur = 6;
                ctx.shadowColor = '#00ffcc';
                ctx.fillText(tokenStr, cx + cellSize / 2, cy + cellSize / 2);
                ctx.restore();
              }
            } else {
              // --- DIFFUSE WAVE INTERFERENCE FIELD ---
              const waveIntensity = Math.max(0.06, (waveInterference * 0.5 + 0.5) * 0.35 + rawShimmer * 0.25);
              ctx.fillStyle = `rgba(0, 255, 180, ${waveIntensity * 0.4})`;
              ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);

              // Wave Contour Ripples
              ctx.strokeStyle = `rgba(0, 255, 204, ${0.12 + waveIntensity * 0.35})`;
              ctx.lineWidth = 0.6;
              ctx.strokeRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);

              // Faint Ethereal Wave Token
              if (tokenStr && rawShimmer > 0.22) {
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const fontPx = Math.max(6, Math.floor(cellSize * 0.42));
                ctx.fillStyle = `rgba(0, 255, 204, ${waveIntensity * 0.8})`;
                ctx.font = `600 ${fontPx}px monospace`;
                ctx.fillText(tokenStr, cx + cellSize / 2, cy + cellSize / 2);
                ctx.restore();
              }
            }
          }
        }
      } 
      // --- RENDER MODE B: 3D ISOMETRIC GRIDDED RESERVOIR PLANE (16x16) ---
      else {
        const planeExtent = Math.min(width, height) * 0.26;
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

        // Render Z = 0 NULL PLANE WIREFRAME (No Shimmer on Z=0, clean dark baseline grid)
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.16)';
        ctx.lineWidth = 0.8;
        for (let i = 0; i <= gridSize; i++) {
          const pos = -planeExtent + i * cellSize;
          const pA1 = project3D(pos, 0, -planeExtent);
          const pA2 = project3D(pos, 0, planeExtent);
          ctx.beginPath();
          ctx.moveTo(pA1.x, pA1.y);
          ctx.lineTo(pA2.x, pA2.y);
          ctx.stroke();

          const pB1 = project3D(-planeExtent, 0, pos);
          const pB2 = project3D(planeExtent, 0, pos);
          ctx.beginPath();
          ctx.moveTo(pB1.x, pB1.y);
          ctx.lineTo(pB2.x, pB2.y);
          ctx.stroke();
        }

        const freqHz = propsRef.current.frequency || 28000;
        const omegaA = (freqHz / 28000) * 2.8;
        const omegaB = isDualToneDriving ? (dualFreqB / 28000) * 3.2 : omegaA + 0.4;
        const systemCoh = propsRef.current.coherence;

        // Render 16x16 Isometric Cells with Wave / Particle Duality
        for (let r = 0; r < gridSize; r++) {
          for (let c = 0; c < gridSize; c++) {
            const cellData = planeGridRef.current.find(cell => cell.row === r && cell.col === c);
            const rawShimmer = isFlash ? 1.0 : (cellData ? cellData.shimmer : 0.1);
            const stability = cellData ? cellData.stability : 0.5;

            // Continuous Dual-Tone Spatial Wave Interference Equation
            const w1 = Math.sin(r * 0.42 + c * 0.38 - t * omegaA);
            const w2 = Math.cos((r - 8) * 0.35 - (c - 8) * 0.45 - t * omegaB);
            const waveInterference = 0.5 * (w1 + w2); // -1.0 to +1.0

            const localEnergy = systemCoh * stability * (0.35 + 0.65 * rawShimmer) * (1.0 + 0.35 * Math.abs(waveInterference));
            // Collapse Probability into Discrete Particle Block Event
            const particleWeight = Math.min(1.0, Math.max(0.0, (localEnergy - 0.58) / 0.24));

            const isCombined = cellData ? cellData.isCombined : false;
            const tokenStr = cellData ? cellData.token : '';

            let zOffset = cellData ? cellData.zOffset : 0;
            if (zOffset === 0) {
              zOffset = ((r + c) % 2 === 0 ? 1 : -1) * 16;
            }

            const x0 = -planeExtent + c * cellSize;
            const z0 = -planeExtent + r * cellSize;
            const x1 = x0 + cellSize;
            const z1 = z0 + cellSize;

            if (particleWeight > 0.25) {
              // ==========================================
              // PARTICLE FORM: DISCRETE COLLAPSED 3D BLOCK
              // ==========================================
              const heightExtrude = -zOffset * (0.4 + 0.6 * particleWeight);

              const p0 = project3D(x0, heightExtrude, z0);
              const p1 = project3D(x1, heightExtrude, z0);
              const p2 = project3D(x1, heightExtrude, z1);
              const p3 = project3D(x0, heightExtrude, z1);

              // 3D Extruded Block Side Walls
              if (Math.abs(heightExtrude) > 1.5) {
                const base1 = project3D(x1, 0, z0);
                const base2 = project3D(x1, 0, z1);
                const base3 = project3D(x0, 0, z1);

                ctx.fillStyle = `rgba(0, 210, 170, ${particleWeight * 0.32})`;
                ctx.strokeStyle = `rgba(0, 255, 204, ${particleWeight * 0.50})`;
                ctx.lineWidth = 0.8;

                // Front Wall
                ctx.beginPath();
                ctx.moveTo(p3.x, p3.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.lineTo(base2.x, base2.y);
                ctx.lineTo(base3.x, base3.y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Right Wall
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.lineTo(base2.x, base2.y);
                ctx.lineTo(base1.x, base1.y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
              }

              // Top Block Face
              ctx.beginPath();
              ctx.moveTo(p0.x, p0.y);
              ctx.lineTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.lineTo(p3.x, p3.y);
              ctx.closePath();

              const fillAlpha = Math.min(0.92, particleWeight * (systemCoh > 0.8 ? 1.15 : 1.0));
              ctx.fillStyle = isCombined ? `rgba(0, 255, 204, ${fillAlpha})` : `rgba(0, 230, 180, ${fillAlpha * 0.88})`;
              ctx.shadowBlur = isCombined ? 18 : 10;
              ctx.shadowColor = '#00ffcc';
              ctx.fill();

              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.2;
              ctx.stroke();

              // Character Token
              if (tokenStr) {
                const cellCenterX = (p0.x + p2.x) / 2;
                const cellCenterY = (p0.y + p2.y) / 2;

                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const fontPx = Math.max(6, Math.floor(cellSize * p0.scale * 0.44));

                ctx.fillStyle = '#ffffff';
                ctx.font = isCombined ? `900 ${fontPx + 1}px monospace` : `800 ${fontPx}px monospace`;
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#00ffcc';
                ctx.fillText(tokenStr, cellCenterX, cellCenterY);
                ctx.restore();
              }
            } else {
              // ==========================================
              // WAVE FORM: DIFFUSE WAVE INTERFERENCE FIELD
              // ==========================================
              // Smooth continuous wave height elevation
              const waveHeight = waveInterference * (14 + rawShimmer * 10);

              const p0 = project3D(x0, waveHeight, z0);
              const p1 = project3D(x1, waveHeight, z0);
              const p2 = project3D(x1, waveHeight, z1);
              const p3 = project3D(x0, waveHeight, z1);

              ctx.beginPath();
              ctx.moveTo(p0.x, p0.y);
              ctx.lineTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.lineTo(p3.x, p3.y);
              ctx.closePath();

              const waveAlpha = Math.max(0.04, (waveInterference * 0.5 + 0.5) * 0.22 + rawShimmer * 0.15);
              ctx.fillStyle = `rgba(0, 255, 180, ${waveAlpha})`;
              ctx.fill();

              // Translucent wave contour grid line
              ctx.strokeStyle = `rgba(0, 255, 204, ${0.12 + waveAlpha * 0.4})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();

              // Faint ethereal wave harmonic label
              if (tokenStr && rawShimmer > 0.22) {
                const cellCenterX = (p0.x + p2.x) / 2;
                const cellCenterY = (p0.y + p2.y) / 2;

                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const fontPx = Math.max(5, Math.floor(cellSize * p0.scale * 0.38));
                ctx.fillStyle = `rgba(0, 255, 204, ${waveAlpha * 1.5})`;
                ctx.font = `600 ${fontPx}px monospace`;
                ctx.fillText(tokenStr, cellCenterX, cellCenterY);
                ctx.restore();
              }
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
          ctx.font = '900 22px monospace';
          ctx.textAlign = 'center';
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#00ffcc';
          ctx.fillText(`[ ${ft.token} ]`, centerX, centerY - (viewMode === '2d_flat' ? 180 : 150) + ft.yOffset);
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
          <span className="text-[9px] text-emerald-400 font-bold ml-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            BLOCK_READ: ACTIVE (16x16)
          </span>
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
            <span className={`font-bold font-mono ${liveCoherence > 0.82 ? 'text-[#00ffcc]' : liveCoherence < 0.5 ? 'text-pink-500' : 'text-cyan-400'}`}>
              {(liveCoherence * 100).toFixed(1)}% {liveCoherence > 0.82 ? 'CRYSTALLIZED' : ''}
            </span>
          </div>

          <div className="w-[1px] h-6 bg-white/10" />

          <div>
            <span className="text-zinc-500 block text-[8px]">SUBSTRATE JITTER</span>
            <span className="text-zinc-300 font-mono font-bold">{liveJitter.toFixed(4)}</span>
          </div>

          <div className="w-[1px] h-6 bg-white/10" />

          <div>
            <span className="text-zinc-500 block text-[8px]">CARRIER FREQ</span>
            <span className="text-[#00ffcc] font-mono font-bold">{(liveFrequency / 1000).toFixed(2)} kHz</span>
          </div>

          <div className="w-[1px] h-6 bg-white/10" />

          <div>
            <span className="text-zinc-500 block text-[8px]">DUAL_TONE</span>
            <span className="text-purple-300 font-mono font-bold">
              {isDualToneDriving ? `${dualFreqA}Hz / ${dualFreqB}Hz` : 'DRIVEN_ACTIVE'}
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
                  Reservoir 16×16 Memory Plane Guide
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
                This 16×16 memory plane (256 cells) visualizes the reservoir substrate state driven near 28 kHz under the <strong>Wave/Particle Duality Readout Rule</strong>.
              </div>

              <div>
                <h3 className="text-[#00ffcc] font-bold uppercase text-[11px] mb-1">Wave / Particle Readout Dynamics</h3>
                <ul className="list-disc list-inside space-y-1.5 text-zinc-300 text-[11px]">
                  <li><strong className="text-white">WAVE FORM (Diffuse Field):</strong> When local coherence is low, the substrate renders continuous wave interference, soft glows, and undulating ripples across the plane.</li>
                  <li><strong className="text-white">PARTICLE FORM (Localized Collapse):</strong> When a region reaches high coherence and stabilizes, it collapses into a discrete 3D memory block (particle event) with crisp edges and character tokens.</li>
                  <li><strong className="text-white">DUAL-TONE INTERFERENCE:</strong> Driving two mixing wave frequencies (f<sub>A</sub> & f<sub>B</sub>) creates standing wave beats. Constructive interference peaks collapse into particles, while destructive nodes remain diffuse waves.</li>
                  <li><strong className="text-white">3D ISO & 2D FLAT VIEWS:</strong> Toggle between 3D isometric perspective elevation and direct 2D flat matrix anytime.</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

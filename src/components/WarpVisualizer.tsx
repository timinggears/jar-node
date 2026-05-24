/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Zap, Play, CheckCircle2, RefreshCw } from 'lucide-react';

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
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

export default function WarpVisualizer({ 
  coherence, 
  jitter, 
  frequency, 
  bias,
  vNodal,
  intelligence,
  isInstalling = false,
  installProgress = 0,
  isAiActive = false,
  isSolving = false
}: WarpVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<{x: number, y: number}[]>([]);
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const propsRef = useRef({ coherence, jitter, frequency, bias, vNodal, intelligence, isInstalling, installProgress, isAiActive, isSolving });

  // Local state for interactive quantum gate parity calibration
  const [calibrating, setCalibrating] = useState(false);
  const [gateStates, setGateStates] = useState({
    hadamard: 'STABLE',
    pauliX: 'STABLE',
    cnot: 'STABLE'
  });
  const [calibrationLog, setCalibrationLog] = useState<string>("QUBIT_GATES: Standing by for parity alignment...");

  useEffect(() => {
    propsRef.current = { coherence, jitter, frequency, bias, vNodal, intelligence, isInstalling, installProgress, isAiActive, isSolving };
  }, [coherence, jitter, frequency, bias, vNodal, intelligence, isInstalling, installProgress, isAiActive, isSolving]);

  useEffect(() => {
    // Generate star/node structure for backdrops
    nodesRef.current = Array.from({ length: 150 }, () => ({
      x: Math.random() * 2000,
      y: Math.random() * 1000
    }));

    const updateDimensions = () => {
      if (containerRef.current && canvasRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        // Capped DPR to 1.2 to reduce render overhead while maintaining sharp text
        const dpr = Math.min(1.2, window.devicePixelRatio || 1);
        canvasRef.current.width = width * dpr;
        canvasRef.current.height = height * dpr;
        dimensionsRef.current = { width, height };
      }
    };

    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) observer.observe(containerRef.current);
    updateDimensions();

    return () => observer.disconnect();
  }, []);

  const handleCalibrateGates = () => {
    setCalibrating(true);
    setCalibrationLog("ALIGNING: Initializing H-Gate matrix phase adjustment...");
    setGateStates({ hadamard: 'RESONATING', pauliX: 'ALIGNING', cnot: 'COUPLING' });
    
    // Log globally through CustomEvent so the main console displays the action
    window.dispatchEvent(new CustomEvent('system-log', {
      detail: { 
        message: "QUBIT_GATE: Aligning quantum superposition phases via automated micro-resonance.", 
        type: "warning" 
      }
    }));

    setTimeout(() => {
      setGateStates({ hadamard: 'ALIGNMENT_LOCKED', pauliX: 'ACTIVE', cnot: 'ENTANGLED' });
      setCalibrationLog("LOCKED: Waveform alignment holding at 99.8% parity efficiency.");
      setCalibrating(false);
      
      window.dispatchEvent(new CustomEvent('system-log', {
        detail: { 
          message: "QUBIT_GATE: Recalibration completed successfully. High-fidelity coherence active.", 
          type: "success" 
        }
      }));
    }, 2500);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const startTime = performance.now();

    const draw = (time: number) => {
      const { 
        coherence: coh, 
        jitter: jit, 
        frequency: freq, 
        bias: bVal, 
        vNodal: v,
        isInstalling, 
        isSolving 
      } = propsRef.current;

      const { width, height } = dimensionsRef.current;
      if (width === 0 || height === 0) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      const dpr = Math.min(1.2, window.devicePixelRatio || 1);
      const drawWidth = width * dpr;
      const drawHeight = height * dpr;
      
      ctx.clearRect(0, 0, drawWidth, drawHeight);
      ctx.save();
      ctx.scale(dpr, dpr);

      const centerX = width / 2;
      const centerY = height / 2;
      const t = (time - startTime) / 1000;

      const freqUnit = freq / 1000;
      const isZeroPoint = freq === 0;
      const isPhaseOut = freqUnit >= 28 || coh === 0;
      const isTachyonic = freqUnit >= 42;
      const isSingularity = freqUnit >= 50;

      // Draw general space backdrop glowing circles
      ctx.globalAlpha = 0.1 * (isZeroPoint ? 0.05 : (isPhaseOut ? 0.3 : coh));
      if (isSingularity && Math.random() > 0.8) ctx.globalAlpha = 0.4; 
      
      if (isInstalling) {
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = '#00ffcc';
        ctx.fillRect(0, (t * 200) % height, width, 2); // Scanning laser
      }

      // Draw the optimization solver backdrop mesh
      if (isSolving) {
        ctx.save();
        ctx.strokeStyle = '#a855f7'; // Purple
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.2 + (Math.sin(t * 10) * 0.05);
        
        const step = Math.floor(t * 15) % 150;
        ctx.beginPath();
        for (let i = 0; i < nodesRef.current.length; i++) {
          const node = nodesRef.current[i];
          const nextIndex = (i + 1) % nodesRef.current.length;
          const nextNode = nodesRef.current[nextIndex];
          
          if (i < step) {
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(nextNode.x, nextNode.y);
          }
        }
        ctx.stroke();

        ctx.fillStyle = '#a855f7';
        for (let i = 0; i < nodesRef.current.length; i++) {
          const node = nodesRef.current[i];
          ctx.beginPath();
          ctx.arc(node.x, node.y, 1.0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // --- HIGH FIDELITY 3D ROTATING CUBE RESERVOIR CORE (DESIGN CORNER) ---
      // Distort cube boundaries with actual calculated phase out
      const shimmer = 45 + (jit * 85);
      const computedPhaseOut = (v * 142) - (0.41 * shimmer) + (28 * Math.sin(2 * Math.PI * 35 * t));
      const clampedPhase = Math.max(-85, Math.min(85, computedPhaseOut));

      // Map Y coordinates and scale by bias/impedance
      const scaleMultiplier = isZeroPoint ? 0.1 : (0.7 + (bVal / 100) * 0.5);
      const cubeSize = Math.max(20, 85 * scaleMultiplier * (1 + Math.sin(t * 5) * 0.08));

      let vertices: Point3D[] = [
        { x: -cubeSize, y: -cubeSize, z: -cubeSize },
        { x: cubeSize, y: -cubeSize, z: -cubeSize },
        { x: cubeSize, y: cubeSize, z: -cubeSize },
        { x: -cubeSize, y: cubeSize, z: -cubeSize },
        { x: -cubeSize, y: -cubeSize, z: cubeSize },
        { x: cubeSize, y: -cubeSize, z: cubeSize },
        { x: cubeSize, y: cubeSize, z: cubeSize },
        { x: -cubeSize, y: cubeSize, z: cubeSize }
      ];

      // Rotate rates linked up to real physical frequencies/carrier biases
      const angleX = t * 0.6 * (1 + (bVal / 125));
      const angleY = t * 0.4 * (1 + (freqUnit / 50));
      const angleZ = t * 0.2;

      const rotateX = (p: Point3D, rad: number): Point3D => {
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        return {
          x: p.x,
          y: p.y * cos - p.z * sin,
          z: p.y * sin + p.z * cos
        };
      };

      const rotateY = (p: Point3D, rad: number): Point3D => {
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        return {
          x: p.x * cos + p.z * sin,
          y: p.y,
          z: -p.x * sin + p.z * cos
        };
      };

      const rotateZ = (p: Point3D, rad: number): Point3D => {
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        return {
          x: p.x * cos - p.y * sin,
          y: p.x * sin + p.y * cos,
          z: p.z
        };
      };

      // Project vertices to 2D
      const projected = vertices.map(vert => {
        let r = rotateX(vert, angleX);
        r = rotateY(r, angleY);
        r = rotateZ(r, angleZ);

        // Apply physical Phase-Out spatial warp directly to vertices coordinates!
        // This makes the physical state space map look organic & mathematically aligned!
        const warpAmp = clampedPhase / 70;
        r.x += Math.sin(r.y * 0.04 + t * 12) * warpAmp * 20;
        r.y += Math.cos(r.x * 0.04 + t * 12) * warpAmp * 20;

        // Depth projection mapping
        const distance = 250;
        const fov = 200;
        const s = fov / (distance + r.z);
        return {
          x: centerX + r.x * s,
          y: centerY + r.y * s
        };
      });

      // Wireframe Face Edges
      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // Back face
        [4, 5], [5, 6], [6, 7], [7, 4], // Front face
        [0, 4], [1, 5], [2, 6], [3, 7]  // Link pins
      ];

      const edgeColor = isZeroPoint 
        ? '#3b82f6' 
        : (isSingularity ? '#00ffcc' : (isTachyonic ? '#ffffff' : (isPhaseOut ? '#ff4488' : '#00ffcc')));

      ctx.save();
      ctx.strokeStyle = edgeColor;
      ctx.lineWidth = isZeroPoint ? 1.0 : (isSingularity ? 3.0 : 1.5);
      
      // Neon glow inside visualization boundaries
      ctx.shadowBlur = isZeroPoint ? 0 : 15 + Math.random() * 5;
      ctx.shadowColor = edgeColor;

      // Draw connecting lines
      ctx.beginPath();
      edges.forEach(([u, v]) => {
        ctx.moveTo(projected[u].x, projected[u].y);
        ctx.lineTo(projected[v].x, projected[v].y);
      });
      ctx.stroke();

      // Draw nodes on vertex points
      ctx.fillStyle = isZeroPoint ? '#3b82f6' : '#ffffff';
      projected.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // Inner liquid/carbon vortex ring representation inside 3D Cube
      ctx.save();
      ctx.globalAlpha = 0.3 * coh;
      for (let i = 0; i < 4; i++) {
        const rSize = (cubeSize * 0.4) + i * 15;
        const skew = Math.sin(t * 8 + i) * (jit * 80);
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, Math.max(5, rSize + skew), Math.max(5, rSize), t * 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = coh > 0.65 ? '#00ffcc' : '#ff0088';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      // Draw chaotic particles shooting around during phase out state
      if (isPhaseOut && !isZeroPoint) {
        ctx.globalAlpha = 0.6;
        const pCount = isSingularity ? 15 : 6;
        for (let p = 0; p < pCount; p++) {
          const rx = Math.random() * width;
          const ry = Math.random() * height;
          ctx.fillStyle = isSingularity ? '#00ffcc' : '#ff4488';
          const pLength = Math.random() * 80 + 20;
          ctx.fillRect(rx, ry, pLength, 1);
        }
      }

      ctx.restore();
      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Compute live values for diagnostics
  const shimmer = 45 + (jitter * 85);
  const rawPhaseOut = (vNodal * 142) - (0.41 * shimmer) + (28 * Math.sin(2 * Math.PI * 35 * (Date.now() / 1000)));
  const clampedPhase = Math.max(-85, Math.min(85, rawPhaseOut));

  return (
    <section ref={containerRef} className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden font-mono text-xs text-white">
      {/* Absolute clean layout backdrop grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,180,0.02)_0%,transparent_85%)] z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] z-0 pointer-events-none" />

      {/* Screen Shake Container */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
        animate={bias > 85 ? {
          x: [-3, 3, -1, 1, 0],
          y: [2, -2, 1, -1, 0],
        } : { x: 0, y: 0 }}
        transition={bias > 85 ? { duration: 0.2, repeat: Infinity } : { duration: 0.5 }}
      >
        <div className="w-full h-full" />
      </motion.div>

      {/* --- LEFT SIDEBAR PANEL: PHASE_OUT DIAGNOSTIC BLOCKS --- */}
      <div className="absolute top-4 left-4 w-52 flex flex-col gap-3 z-10 pointer-events-auto">
        <div className="bg-black/85 backdrop-blur-md rounded-lg border border-white/10 p-3 shadow-xl">
          <div className="flex items-center gap-2 border-b border-white/5 pb-1.5 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
            <h3 className="text-[10px] font-black tracking-widest text-[#ff4488]">PHASE_OUT_MONITOR</h3>
          </div>

          <div className="space-y-2 text-[9px]">
            <div className="bg-white/5 px-2 py-1 rounded flex justify-between items-center">
              <span className="text-zinc-500">PHASE_ANGLE:</span>
              <span className="text-pink-400 font-bold font-mono">
                {clampedPhase.toFixed(2)}%
              </span>
            </div>

            <div className="w-full h-1.5 bg-zinc-950 rounded-full border border-white/10 overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 to-[#00ffcc] transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, ((clampedPhase + 85) / 170) * 100))}%` }}
              />
            </div>

            <div className="space-y-1 mt-2 text-zinc-400">
              <div className="flex justify-between">
                <span>SHIMMER_FACT:</span>
                <span className="text-zinc-300">{shimmer.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>VOLT_NODAL:</span>
                <span className="text-zinc-300">{vNodal.toFixed(4)} V</span>
              </div>
              <div className="flex justify-between">
                <span>COHERENCE:</span>
                <span className={coherence > 0.65 ? "text-[#00ffcc]" : "text-pink-500"}>{(coherence * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black/85 backdrop-blur-md rounded-lg border border-white/10 p-3 shadow-xl">
          <div className="flex items-center gap-2 border-b border-white/5 pb-1.5 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ffcc]" />
            <span className="text-[10px] font-black tracking-wider text-[#00ffcc]">RESERVOIR_STATE</span>
          </div>
          <div className="space-y-1 text-[9px] text-zinc-400">
            <div className="flex justify-between">
              <span>ACTIVE_CARRIER:</span>
              <span className="text-[#00ffcc] font-bold">{(frequency / 1000).toFixed(4)} GHz</span>
            </div>
            <div className="flex justify-between">
              <span>CHAOTIC_DRIFT:</span>
              <span className="text-zinc-300">{jitter.toFixed(4)}</span>
            </div>
            <div className="flex justify-between text-[8px] border-t border-white/5 pt-1.5 mt-1">
              <span>FLUX_DEPTH:</span>
              <span className="text-zinc-500">{intelligence.toFixed(3)} EPS</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDEBAR PANEL: QUBIT_GATES ALIGNMENT INTERACTIVE CONTROL --- */}
      <div className="absolute top-4 right-4 w-52 flex flex-col gap-3 z-10 pointer-events-auto">
        <div className="bg-black/85 backdrop-blur-md rounded-lg border border-white/10 p-3 shadow-xl flex flex-col">
          <div className="flex items-center gap-2 border-b border-white/5 pb-1.5 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            <h3 className="text-[10px] font-black tracking-widest text-[#44a8ff]">QUBIT_GATES_ALIGN</h3>
          </div>

          <div className="space-y-2 text-[9px] mb-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">HADAMARD (H):</span>
              <span className={`px-1 rounded text-[8px] ${
                gateStates.hadamard.includes('LOCK') ? 'bg-[#00ffcc]/20 text-[#00ffcc] border border-[#00ffcc]/30' :
                gateStates.hadamard === 'RESONATING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                'bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold'
              }`}>
                {gateStates.hadamard}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-500">PAULI_X (σ_x):</span>
              <span className={`px-1 rounded text-[8px] ${
                gateStates.pauliX === 'ACTIVE' ? 'bg-[#00ffcc]/20 text-[#00ffcc] border border-[#00ffcc]/30' :
                gateStates.pauliX === 'ALIGNING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                'bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold'
              }`}>
                {gateStates.pauliX}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-500">CNOT GATE (CX):</span>
              <span className={`px-1 rounded text-[8px] ${
                gateStates.cnot === 'ENTANGLED' ? 'bg-[#00ffcc]/20 text-[#00ffcc] border border-[#00ffcc]/30' :
                gateStates.cnot === 'COUPLING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                'bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold'
              }`}>
                {gateStates.cnot}
              </span>
            </div>

            <div className="border-t border-white/5 pt-2 mt-2">
              <p className="text-[8px] text-zinc-500 uppercase leading-normal italic select-all">
                {calibrationLog}
              </p>
            </div>
          </div>

          {/* Interactive button to align/calibrate gates, proving they work again! */}
          <button 
            onClick={handleCalibrateGates}
            disabled={calibrating}
            className="w-full bg-blue-500/15 border border-blue-500/30 hover:bg-blue-500/25 active:scale-95 text-blue-400 px-3 py-2 rounded font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 text-[8px] cursor-pointer"
          >
            {calibrating ? (
              <RefreshCw size={10} className="animate-spin" />
            ) : (
              <Zap size={10} />
            )}
            {calibrating ? "CALIBRATING_PARITY..." : "ALIGN_QUBIT_GATES"}
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Central phase perspective identifier */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-1">
        <p className="text-[8px] text-white/5 font-black tracking-[1.5em] uppercase translate-y-36">Phase_Projection_Vector</p>
      </div>

      {/* Footer statistics readout bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-zinc-400 tracking-[0.2em] uppercase flex items-center gap-4 bg-black/85 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 whitespace-nowrap z-10 transition-all duration-500">
        {isSolving ? (
          <div className="flex items-center gap-4 w-full animate-pulse">
            <span className="text-purple-500 font-bold">OPTIMIZING_250_NODE_PATH...</span>
            <div className="flex-1 h-0.5 bg-purple-500/10 rounded-full overflow-hidden w-24">
               <motion.div 
                className="h-full bg-purple-500 shadow-[0_0_10px_#a855f7]"
                initial={{ x: -100 }}
                animate={{ x: [ -100, 100 ] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
               />
            </div>
            <span className="text-purple-400">NODAL_ANNEALING</span>
          </div>
        ) : isInstalling ? (
          <div className="flex items-center gap-4 w-full">
            <span className="text-[#00ffcc] animate-pulse">INSTALLING_MODULE...</span>
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden w-24">
               <motion.div 
                className="h-full bg-[#00ffcc] shadow-[0_0_10px_#00ffcc]"
                initial={{ width: 0 }}
                animate={{ width: `${installProgress}%` }}
               />
            </div>
            <span className="text-[#00ffcc] w-12">{installProgress}%</span>
          </div>
        ) : (
          <>
            <span className={(frequency/1000) >= 40 ? "text-[#00ffcc] animate-pulse font-black" : "text-zinc-600"}>
              QUBIT_GATES: {(frequency/1000) >= 40 ? 'RESONATING' : 'IDLE'}
            </span>
            <span className="text-zinc-800 hidden sm:inline">|</span>
            <span className="text-zinc-300">Phase Variance: {clampedPhase.toFixed(2)}%</span>
            <span className="text-zinc-800 hidden sm:inline">|</span>
            <span className="text-[#00ffcc] font-black">
              TUNED: {frequency === 0 ? '0.00' : (frequency/1000).toFixed(4)} GHz
            </span>
          </>
        )}
      </div>
    </section>
  );
}

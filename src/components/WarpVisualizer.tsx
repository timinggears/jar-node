/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface WarpVisualizerProps {
  coherence: number;
  jitter: number;
  frequency: number;
  bias: number;
  isInstalling?: boolean;
  installProgress?: number;
  isAiActive?: boolean;
  isSolving?: boolean;
}

export default function WarpVisualizer({ 
  coherence, 
  jitter, 
  frequency, 
  bias,
  isInstalling = false, 
  installProgress = 0,
  isAiActive = false,
  isSolving = false
}: WarpVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<{x: number, y: number}[]>([]);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    // Generate 500 random nodes for TSP visualization (more for background density)
    nodesRef.current = Array.from({ length: 500 }, () => ({
      x: Math.random() * 2000,
      y: Math.random() * 1000
    }));

    const updateDimensions = () => {
      if (containerRef.current && canvasRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvasRef.current.width = width * dpr;
        canvasRef.current.height = height * dpr;
        dimensionsRef.current = { width, height };
        
        // Re-generate nodes for new dimension if needed, or just scale drawing
      }
    };

    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) observer.observe(containerRef.current);
    updateDimensions();

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const startTime = performance.now();

    const draw = (time: number) => {
      const { width, height } = dimensionsRef.current;
      if (width === 0 || height === 0) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const drawWidth = width * dpr;
      const drawHeight = height * dpr;
      
      ctx.clearRect(0, 0, drawWidth, drawHeight);
      ctx.save();
      ctx.scale(dpr, dpr);

      const centerX = width / 2;
      const centerY = height / 2;
      const t = (time - startTime) / 1000;

      const freqUnit = frequency / 1000;
      const isZeroPoint = frequency === 0;
      const isPhaseOut = freqUnit >= 28 || coherence === 0;
      const isTachyonic = freqUnit >= 42;
      const isSingularity = freqUnit >= 50;

      // Draw Reservoir Resonance (Liquid State Background)
      ctx.globalAlpha = 0.3 * (isZeroPoint ? 0.05 : (isPhaseOut ? 1.0 : coherence));
      if (isSingularity && Math.random() > 0.8) ctx.globalAlpha = 1.0; 
      
      if (isInstalling) {
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#00ffcc';
        ctx.fillRect(0, (t * 200) % height, width, 2); // Scanning laser
      }

      if (isAiActive) {
        // AI Analysis overlay removed as per user request to clean up background
      }

      // 500 City Solve Mesh
      if (isSolving) {
        ctx.save();
        ctx.strokeStyle = '#a855f7'; // Purple
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.4 + (Math.sin(t * 10) * 0.1);
        
        // Draw partial connections to simulate optimization
        const step = Math.floor(t * 15) % 500;
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

        // Draw nodes
        ctx.fillStyle = '#a855f7';
        for (let i = 0; i < nodesRef.current.length; i++) {
          const node = nodesRef.current[i];
          ctx.beginPath();
          ctx.arc(node.x, node.y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        
        // v147: Dramatic Bias Scaling - Dampened for v149 to preserve resources
        // normalized bias (0.0 to 1.0)
        const b = bias / 100;
        const biasScale = bias <= 50 
          ? 0.2 + (bias / 50) * 0.8 
          : 1.0 + ((bias - 50) / 50) * 2.5; // Reduced from 5.0 to 2.5

        for (let x = 0; x < width + 25; x += 25) { // Increased step from 10 to 25 to reduce segments
          let baseIntensity = 15 + jitter * 80; // Reduced base intensity
          if (isZeroPoint) baseIntensity = 2;
          else if (isSingularity) baseIntensity = 25 + Math.random() * 15; // Reduced from 80+40
          else if (isTachyonic) baseIntensity = 20 + Math.random() * 10; // Reduced from 40+20
          else if (isPhaseOut) baseIntensity = 30 + Math.random() * 15; // Reduced from 50+20

          // Add jitter-based noise to peak intensity if boosted
          const noise = bias > 70 ? (Math.random() - 0.5) * (bias - 70) * 0.5 : 0;
          const intensity = baseIntensity * biasScale + noise;
          
          // v147: Drive wave speed and frequency strictly by the Hz value
          const freqMulti = frequency / 50000;
          const speedMulti = (1 + (b * 3)) * freqMulti;
          const wavelength = (isZeroPoint ? 0.001 : (isPhaseOut ? 0.05 : 0.01)) * (1 / Math.sqrt(freqMulti));
          
          const y = centerY + Math.sin(x * wavelength + t * ((isZeroPoint ? 0.1 : (0.5 + j)) * speedMulti)) * intensity;
          ctx.lineTo(x, y);
        }

        const color = isZeroPoint ? '#3b82f6' : (isSingularity ? '#00ffcc' : (isTachyonic ? '#ffffff' : (isPhaseOut ? '#cc5500' : (j === 0 ? '#00ffcc' : '#ff0088'))));
        ctx.strokeStyle = color;
        ctx.lineWidth = (isZeroPoint ? 1.0 : (isSingularity ? 4.0 : (isPhaseOut ? 2.0 : 1.2))) * (0.8 + b * 2.0);
        
        if (bias > 70) {
          // Manual multi-pass glow for more intensity
          ctx.shadowBlur = 10 + (b * 20);
          ctx.shadowColor = color;
          
          // Glitch secondary line
          if (bias > 90 && Math.random() > 0.9) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth *= 3;
            ctx.stroke();
            ctx.strokeStyle = color;
            ctx.lineWidth /= 3;
          }

          // v147: Chromatic Aberration Glitch
          if (Math.random() > 0.7 && bias > 85) {
            ctx.save();
            ctx.translate((Math.random() - 0.5) * (bias / 5), 0);
            ctx.globalAlpha = 0.4;
            ctx.strokeStyle = '#ff0088'; // Magenta shift
            ctx.stroke();
            ctx.translate((Math.random() - 0.5) * (bias / 5), 0);
            ctx.strokeStyle = '#00ffcc'; // Cyan shift
            ctx.stroke();
            ctx.restore();
          }
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.stroke();
      }

      // Draw chaotic particles during phase out
      if (isPhaseOut && !isZeroPoint) {
        ctx.globalAlpha = 0.8;
        const pCount = isSingularity ? 40 : (isTachyonic ? 15 : 8); // Reduced particle counts
        for (let p = 0; p < pCount; p++) {
          const rx = Math.random() * width;
          const ry = Math.random() * height;
          ctx.fillStyle = isSingularity ? (Math.random() > 0.5 ? '#00ffcc' : '#ffffff') : (isTachyonic ? '#ffffff' : '#cc5500');
          const pw = isSingularity ? Math.random() * 400 : (isTachyonic ? Math.random() * 200 : Math.random() * 80 + 20);
          ctx.fillRect(rx, ry, pw, isSingularity ? Math.random() * 2 : 1);
        }
      }
      ctx.globalAlpha = 1.0;

      // Draw 12 rings
      const ringCount = isPhaseOut ? (isTachyonic ? 1 : 3) : 12;
      for (let i = 0; i < 12; i++) {
        if (isPhaseOut && i >= ringCount) continue;
        const r = 20 + i * 15;
        let col = coherence > 0.7 ? '#00ffcc' : '#ff0088';
        if (isPhaseOut) col = '#cc5500';
        if (isTachyonic) col = '#ffffff';
        
        ctx.globalAlpha = (0.2 + (i / 12) * 0.8) * (isPhaseOut ? 0.1 : coherence + 0.1);
        
        // At 28GHz (phase out), the orbit becomes chaotic
        const chaos = freqUnit >= 28 ? Math.random() * 50 : 0;
        const warp = Math.sin(t * 15 + i) * (jitter * 250) + chaos;
        
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, Math.max(5, r + warp), Math.max(5, r), 0, 0, Math.PI * 2);
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (!isPhaseOut && coherence > 0.8 && i % 4 === 0) {
          const px = centerX + (r + warp);
          ctx.globalAlpha = 1.0;
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(px, centerY, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, [coherence, jitter, frequency, bias, isInstalling, isAiActive, isSolving]);

  return (
    <section ref={containerRef} className="relative w-full h-full flex items-center justify-center bg-transparent overflow-hidden font-mono">
      {/* Screen Shake Container */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
        animate={bias > 85 ? {
          x: [0, (Math.random() - 0.5) * 10, 0],
          y: [0, (Math.random() - 0.5) * 10, 0],
        } : { x: 0, y: 0 }}
        transition={bias > 85 ? { duration: 0.1, repeat: Infinity } : { duration: 0.5 }}
      >
        <div className="w-full h-full" />
      </motion.div>
      {/* Decorative overlays from design */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
        <span className={`px-2 py-1 rounded text-[10px] border backdrop-blur-sm transition-colors ${
          (frequency) === 0 ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' :
          (frequency/1000) >= 150 ? 'bg-[#00ffcc] text-black border-[#00ffcc] font-black animate-pulse' :
          (frequency/1000) >= 100 ? 'bg-white text-black border-white' :
          (frequency/1000) >= 50 ? 'bg-[#cc5500]/20 text-[#cc5500] border-[#cc5500]/40' : 
          'bg-[#00ffcc20] text-[#00ffcc] border-[#00ffcc40]'
        }`}>
          RESERVOIR_STATE: {(frequency) === 0 ? 'ABSOLUTE_NULL' : (frequency/1000) >= 150 ? 'SINGULARITY_COLLAPSE' : (frequency/1000) >= 100 ? 'QUANTUM_SUPERPOSITION' : (frequency/1000) >= 50 ? 'STABLE_ANCHOR' : 'LOW_POWER'}
        </span>
        <span className="px-2 py-1 rounded bg-[#ff008820] text-[#ff0088] text-[10px] border border-[#ff008840] backdrop-blur-sm">
          NODAL_DRIFT: {jitter.toFixed(3)}
        </span>
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,204,0.03)_0%,transparent_70%)]" />
      
      <canvas
        ref={canvasRef}
        className={`w-full h-full transition-opacity duration-1000 ${(frequency/1000) >= 28 || frequency === 0 ? 'opacity-100' : 'opacity-80'}`}
      />
      
      {/* Central focus point */}
      <div className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-[#00ffcc15] to-transparent flex items-center justify-center pointer-events-none">
        <div className={`w-8 h-8 rounded-full shadow-[0_0_30px_#00ffcc90] transition-all duration-300 ${
          (frequency) === 0 ? 'bg-blue-900 border border-blue-400/50 shadow-[0_0_20px_#3b82f644] scale-[0.5]' :
          (frequency/1000) >= 50 ? 'bg-[#00ffcc] shadow-[0_0_100px_#00ffcc] scale-[5] animate-ping' :
          (frequency/1000) >= 42 ? 'bg-white shadow-[0_0_60px_#fff] scale-[2.5] blur-[2px]' :
          (frequency/1000) >= 28 ? 'bg-[#cc5500] shadow-[0_0_40px_#cc5500] scale-150 animate-ping' : 
          'bg-[#00ffcc] shadow-[0_0_30px_#00ffcc90] animate-pulse'
        }`} />
      </div>

      {/* Footer text in visualizer */}
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 text-[10px] text-white/40 tracking-[0.2em] uppercase flex items-center gap-4 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 whitespace-nowrap z-10 transition-all duration-500">
        {isSolving ? (
          <div className="flex items-center gap-4 w-full px-12 animate-pulse">
            <span className="text-purple-500 font-bold">OPTIMIZING_250_NODE_PATH...</span>
            <div className="flex-1 h-0.5 bg-purple-500/10 rounded-full overflow-hidden">
               <motion.div 
                className="h-full bg-purple-500 shadow-[0_0_10px_#a855f7]"
                initial={{ x: -1000 }}
                animate={{ x: [-1000, 1000] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
               />
            </div>
            <span className="text-purple-400">NODAL_ANNEALING</span>
          </div>
        ) : isInstalling ? (
          <div className="flex items-center gap-4 w-full px-12">
            <span className="text-[#00ffcc] animate-pulse">INSTALLING_MODULE...</span>
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
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
            <span className={(frequency/1000) >= 50 && (frequency/1000) < 100 ? "text-[#cc5500] animate-pulse" : "text-white/20"}>
              QUBIT_GATES: {(frequency/1000) >= 50 && (frequency/1000) < 100 ? 'RESONATING' : 'IDLE'}
            </span>
            <span className="text-white/10 hidden sm:inline">|</span>
            <span>NODAL FLUX: {(frequency / 247).toFixed(2)} Hz</span>
            <span className="text-white/10 hidden sm:inline">|</span>
            <span className={(frequency) === 0 ? 'text-blue-500 font-mono tracking-widest' : (frequency/1000) >= 150 ? 'text-yellow-400 font-black animate-bounce' : (frequency/1000) >= 100 ? 'text-white font-bold' : (frequency/1000) >= 50 ? 'text-[#cc5500] animate-pulse' : ''}>
              CARRIER: {(frequency/1000).toFixed(4)} GHz
            </span>
          </>
        )}
      </div>
    </section>
  );
}

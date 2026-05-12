/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

interface WarpVisualizerProps {
  coherence: number;
  jitter: number;
}

export default function WarpVisualizer({ coherence, jitter }: WarpVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const startTime = performance.now();

    const draw = (time: number) => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const t = (time - startTime) / 1000;

      // Draw Reservoir Resonance (Liquid State Background)
      ctx.globalAlpha = 0.3;
      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        for (let x = 0; x < width; x += 10) {
          const y = centerY + Math.sin(x * 0.01 + t * (0.5 + j)) * (20 + jitter * 100);
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = j === 0 ? '#00ffcc' : '#ff0088';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      // Draw 12 rings
      for (let i = 0; i < 12; i++) {
        const r = 40 + i * 18;
        const col = coherence > 0.7 
          ? `rgba(0, 255, 204, ${0.3 + (i / 12) * 0.7})` 
          : `rgba(255, 0, 136, ${0.3 + (i / 12) * 0.7})`;
        
        const warp = Math.sin(t * 12 + i) * (jitter * 180);
        
        ctx.beginPath();
        // Create an oval-ish shape using scale or just adjusting x/y
        // We'll simulate drawing an oval manually or using ellipse
        ctx.ellipse(centerX, centerY, r + warp, r, 0, 0, Math.PI * 2);
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Add some "nodal" points on the rings
        if (i % 3 === 0) {
          const angle = t * 2 + i;
          const px = centerX + (r + warp) * Math.cos(angle);
          const py = centerY + r * Math.sin(angle);
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, [coherence, jitter]);

  return (
    <section className="relative w-full h-[400px] flex items-center justify-center bg-[#0a0a0a] rounded-xl border border-[#ffffff10] overflow-hidden shadow-inner">
      {/* Decorative overlays from design */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        <span className="px-2 py-1 rounded bg-[#00ffcc20] text-[#00ffcc] text-[10px] font-mono border border-[#00ffcc40] backdrop-blur-sm">
          RESERVOIR_STATE: ACTIVE
        </span>
        <span className="px-2 py-1 rounded bg-[#ff008820] text-[#ff0088] text-[10px] font-mono border border-[#ff008840] backdrop-blur-sm">
          NODAL_DRIFT: {jitter.toFixed(3)}
        </span>
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,204,0.03)_0%,transparent_70%)]" />
      
      <canvas
        ref={canvasRef}
        width={1000}
        height={400}
        className="w-full h-full opacity-80"
      />
      
      {/* Central focus point */}
      <div className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-[#00ffcc15] to-transparent flex items-center justify-center pointer-events-none">
        <div className="w-8 h-8 bg-[#00ffcc] rounded-full shadow-[0_0_30px_#00ffcc90] animate-pulse" />
      </div>

      {/* Footer text in visualizer */}
      <div className="absolute bottom-4 text-[10px] font-mono text-[#444] tracking-[0.2em] uppercase">
        NODAL FLUX FREQUENCY: 142.42 Hz
      </div>
    </section>
  );
}

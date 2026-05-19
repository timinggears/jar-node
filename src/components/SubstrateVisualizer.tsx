/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

interface SubstrateVisualizerProps {
  gpuParity: number;
  coherence: number;
  frequency: number;
  zpeLevel: number;
}

export default function SubstrateVisualizer({ gpuParity, coherence, frequency, zpeLevel }: SubstrateVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ gpuParity, coherence, frequency, zpeLevel });

  // Update refs when props change without restarting loop
  useEffect(() => {
    propsRef.current = { gpuParity, coherence, frequency, zpeLevel };
  }, [gpuParity, coherence, frequency, zpeLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationId: number;
    let particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      const { gpuParity: gp, coherence: coh, frequency: freq, zpeLevel: zpe } = propsRef.current;
      
      // Background clear with slight trail
      // Lower ZPE = dimmer rendering
      const zpeFactor = zpe / 100;
      ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + (0.05 * (1 - zpeFactor))})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const intensity = (gp / 100) * zpeFactor;
      const particleCount = Math.floor(intensity * 5); 
      
      if (particles.length < (100 * zpeFactor) && Math.random() < intensity) {
        for(let i = 0; i < particleCount; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * (freq / 40000),
            vy: (Math.random() - 0.5) * (freq / 40000),
            life: 1.0,
            color: coh > 0.9 ? `rgba(0, 255, 204, ${(0.1 + Math.random() * 0.4) * zpeFactor})` : `rgba(255, 0, 255, ${(0.1 + Math.random() * 0.2) * zpeFactor})`
          });
        }
      }

      particles = particles.filter(p => p.life > 0);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.005;

        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.fillStyle = p.color;
        const size = (p.life * 2) * (coh * 1.5);
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();

        // Connect particles if GPU parity is high enough (Dimensional Weave)
        if (gp > 85 && Math.random() > 0.98) { // Rarer connections
          const nearest = particles[Math.floor(Math.random() * particles.length)];
          if (nearest && nearest !== p) {
            ctx.strokeStyle = `rgba(0, 255, 204, ${p.life * 0.05})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(nearest.x, nearest.y);
            ctx.stroke();
          }
        }
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []); // Only run once

  return (
    <canvas 
      ref={canvasRef}
      className="w-full h-full pointer-events-none opacity-40 mix-blend-screen"
      style={{ filter: 'blur(1px) contrast(1.2)' }}
    />
  );
}

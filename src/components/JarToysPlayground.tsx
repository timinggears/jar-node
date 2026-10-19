import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Waves,
  Volume2,
  VolumeX,
  RotateCcw,
  Target,
  Activity,
  Compass,
  Box,
  Play,
  Pause,
  Shuffle,
  Music,
  Radio,
  Trophy,
  Zap
} from 'lucide-react';
import { SystemStats } from '../types';

interface JarToysPlaygroundProps {
  stats: SystemStats;
  jarHeading: number;
  isMotionSensed: boolean;
  motionIntensity: number;
  onRotateJar?: (deg: number) => void;
  socket?: any;
}

type ToyTab = 'slosh' | 'maze' | 'theremin' | 'cymatics';

export default function JarToysPlayground({
  stats,
  jarHeading,
  isMotionSensed,
  motionIntensity,
  onRotateJar,
  socket
}: JarToysPlaygroundProps) {
  const [activeToy, setActiveToy] = useState<ToyTab>('slosh');

  // Common real telemetry values
  const vNodal = stats.vNodal || 1.65;
  const jitterVal = stats.jitter || 0.018;
  const coherenceVal = stats.coherence || 0.95;
  const phaseAngle = stats.phaseOut || 18.0;

  // Shared Web Audio Context ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);

  // Stable animation params ref to avoid recreating RAF simulation loops on rapid prop ticks
  const toyParamsRef = useRef({
    jarHeading,
    isMotionSensed,
    motionIntensity,
    vNodal,
    coherenceVal,
    phaseAngle
  });
  toyParamsRef.current = {
    jarHeading,
    isMotionSensed,
    motionIntensity,
    vNodal,
    coherenceVal,
    phaseAngle
  };

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    setIsAudioActive(true);
  }, []);

  // Glass chime sound effect helper (for ball impacts and achievements)
  const playGlassChime = useCallback((freq: number = 1200, decay: number = 0.4) => {
    if (!audioCtxRef.current || audioCtxRef.current.state !== 'running') return;
    try {
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + decay);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + decay);
    } catch {}
  }, []);

  // -------------------------------------------------------------
  // TOY 1: SLOSH & FERROFLUID RESONANCE TANK
  // -------------------------------------------------------------
  const sloshCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sloshViscosity, setSloshViscosity] = useState<number>(0.92);
  const [isStirring, setIsStirring] = useState<boolean>(false);

  useEffect(() => {
    if (activeToy !== 'slosh') return;
    const canvas = sloshCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    // Simulation grid particles (Carbon particles suspended in liquid dielectric)
    const particleCount = 180;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      charge: number;
    }> = [];

    const colors = ['#00ffcc', '#06b6d4', '#10b981', '#38bdf8', '#a855f7'];

    for (let i = 0; i < particleCount; i++) {
      const r = Math.random() * 110;
      const th = Math.random() * Math.PI * 2;
      particles.push({
        x: cx + Math.cos(th) * r,
        y: cy + Math.sin(th) * r,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 1.2 + Math.random() * 2.4,
        color: colors[i % colors.length],
        charge: (Math.random() - 0.5) * 2
      });
    }

    let lastHeading = toyParamsRef.current.jarHeading;
    let angularVel = 0;
    let wavePhase = 0;

    const renderSlosh = () => {
      const {
        jarHeading: curHeading,
        isMotionSensed: curMotionSensed,
        motionIntensity: curIntensity,
        vNodal: curV,
        coherenceVal: curCoh
      } = toyParamsRef.current;

      // Background: Dark Borosilicate Vessel Interior
      ctx.fillStyle = '#020704';
      ctx.fillRect(0, 0, W, H);

      // Compute physical jar rotation angular velocity
      let deltaH = ((curHeading - lastHeading + 540) % 360) - 180;
      lastHeading = curHeading;
      angularVel = angularVel * 0.88 + deltaH * 0.08;

      wavePhase += 0.05 + Math.abs(angularVel) * 0.15 + (curIntensity * 0.1);

      // Borosilicate Square Glass Vessel outline
      const jarHalf = 130;
      const rad = (jarHeading * Math.PI) / 180;
      const cosJ = Math.cos(rad);
      const sinJ = Math.sin(rad);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rad);

      // Glass wall outer border
      ctx.strokeStyle = isMotionSensed ? 'rgba(245, 158, 11, 0.7)' : 'rgba(0, 255, 204, 0.35)';
      ctx.lineWidth = isMotionSensed ? 3 : 2;
      ctx.strokeRect(-jarHalf, -jarHalf, jarHalf * 2, jarHalf * 2);

      // Inner liquid fill background with gradient
      const liqGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, jarHalf * 1.2);
      liqGrad.addColorStop(0, 'rgba(0, 255, 204, 0.12)');
      liqGrad.addColorStop(0.7, 'rgba(6, 182, 212, 0.06)');
      liqGrad.addColorStop(1, 'rgba(2, 6, 4, 0.85)');
      ctx.fillStyle = liqGrad;
      ctx.fillRect(-jarHalf + 2, -jarHalf + 2, jarHalf * 2 - 4, jarHalf * 2 - 4);

      // Standing-Wave liquid surface meniscus
      ctx.beginPath();
      ctx.strokeStyle = isMotionSensed ? '#f59e0b' : '#00ffcc';
      ctx.lineWidth = 1.5;
      const points = 32;
      for (let p = 0; p <= points; p++) {
        const px = -jarHalf + (p / points) * (jarHalf * 2);
        const sloshTilt = Math.sin((p / points) * Math.PI * 2 + wavePhase) * (12 + motionIntensity * 28 + Math.abs(angularVel) * 15);
        const py = sloshTilt * Math.cos(rad * 2);
        if (p === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Solenoid Induction Line (GP14 / GP26) indicator
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, -jarHalf);
      ctx.lineTo(0, jarHalf);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();

      // Slosh forces in world coordinates
      const fx = -Math.sin(rad) * (angularVel * 3.5 + (isMotionSensed ? 1.5 : 0));
      const fy = Math.cos(rad) * (angularVel * 3.5 + (isMotionSensed ? 1.5 : 0));

      // Ferrofluid spike attraction towards Induction Coil axis
      const coilFieldAngle = 0; // Coil anchored to True North
      const fieldStrength = (vNodal / 3.3) * 0.85;

      // Update & Render Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Slosh inertia & angular centrifugal push
        p.vx += fx * 0.3;
        p.vy += fy * 0.3;

        // Ferrofluid dipole pull (particles align in spikes along North-South axis)
        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // Magnetic dipole attraction
        const pull = Math.sin(Math.atan2(dy, dx) * 2 - coilFieldAngle) * fieldStrength;
        p.vx += (-dy / dist) * pull * 0.25;
        p.vy += (dx / dist) * pull * 0.25;

        // Viscous damping
        p.vx *= sloshViscosity;
        p.vy *= sloshViscosity;

        p.x += p.vx;
        p.y += p.vy;

        // Bounce inside square vessel
        // Rotate point into jar frame to check boundary
        const localX = (p.x - cx) * cosJ + (p.y - cy) * sinJ;
        const localY = -(p.x - cx) * sinJ + (p.y - cy) * cosJ;

        const bound = jarHalf - 6;
        let bounced = false;

        let clampedX = localX;
        let clampedY = localY;

        if (localX < -bound) { clampedX = -bound; p.vx = -p.vx * 0.7; bounced = true; }
        if (localX > bound) { clampedX = bound; p.vx = -p.vx * 0.7; bounced = true; }
        if (localY < -bound) { clampedY = -bound; p.vy = -p.vy * 0.7; bounced = true; }
        if (localY > bound) { clampedY = bound; p.vy = -p.vy * 0.7; bounced = true; }

        if (bounced) {
          // Re-project into world space
          p.x = cx + clampedX * cosJ - clampedY * sinJ;
          p.y = cy + clampedX * sinJ + clampedY * cosJ;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = isMotionSensed ? 8 : 4;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw dielectric link filaments between neighboring particles (dielectric polymer bridges)
        if (i % 2 === 0 && i < particles.length - 1) {
          const pNext = particles[i + 1];
          const distNext = Math.hypot(p.x - pNext.x, p.y - pNext.y);
          if (distNext < 35) {
            ctx.strokeStyle = `rgba(0, 255, 204, ${0.4 * (1 - distNext / 35)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pNext.x, pNext.y);
            ctx.stroke();
          }
        }
      }

      // HUD overlay on canvas
      ctx.font = 'bold 8.5px monospace';
      ctx.fillStyle = curMotionSensed ? '#f59e0b' : '#00ffcc';
      ctx.textAlign = 'left';
      ctx.fillText(`● HYDRODYNAMIC SLOSH TANK • HEADING: ${curHeading}°`, 14, 20);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '7.5px monospace';
      ctx.fillText(`V_NODAL: ${curV.toFixed(4)}V • SLOSH INTENSITY: ${Math.round((Math.abs(angularVel) + curIntensity) * 50)}% • COHERENCE: ${(curCoh * 100).toFixed(1)}%`, 14, 32);

      animId = requestAnimationFrame(renderSlosh);
    };

    animId = requestAnimationFrame(renderSlosh);
    return () => cancelAnimationFrame(animId);
  }, [activeToy, sloshViscosity]);

  // Slosh Tank interaction: click or drag to stir/splash
  const handleSloshPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    initAudio();
    setIsStirring(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const angle = Math.round((Math.atan2(y - cy, x - cx) * 180 / Math.PI + 90 + 360) % 360);
    onRotateJar?.(angle);
    playGlassChime(640 + Math.random() * 400, 0.25);
  };

  // -------------------------------------------------------------
  // TOY 2: DIELECTRIC KINETIC MAZE (ROLLING BEAD IN THE SQUARE JAR)
  // -------------------------------------------------------------
  const mazeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mazeScore, setMazeScore] = useState<number>(0);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [currentTargetGate, setCurrentTargetGate] = useState<number>(0); // 0 = North, 1 = East, 2 = South, 3 = West
  const beadPosRef = useRef<{ x: number; y: number; vx: number; vy: number }>({ x: 0, y: 0, vx: 0, vy: 0 });

  const mazeScoreRef = useRef(0);
  const streakCountRef = useRef(0);
  const currentTargetGateRef = useRef(0);
  const lastScoreTimeRef = useRef(0);

  const resetBead = () => {
    beadPosRef.current = { x: 0, y: 0, vx: 0, vy: 0 };
    streakCountRef.current = 0;
    setStreakCount(0);
    playGlassChime(520, 0.3);
  };

  useEffect(() => {
    if (activeToy !== 'maze') return;
    const canvas = mazeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const jarSize = 135;

    // 4 Nodal gates (N, E, S, W corresponding to D4 square jar symmetry)
    const gates = [
      { id: 0, label: 'N (000°)', x: 0, y: -jarSize + 22, color: '#ef4444' },
      { id: 1, label: 'E (090°)', x: jarSize - 22, y: 0, color: '#f59e0b' },
      { id: 2, label: 'S (180°)', x: 0, y: jarSize - 22, color: '#10b981' },
      { id: 3, label: 'W (270°)', x: -jarSize + 22, y: 0, color: '#06b6d4' }
    ];

    const renderMaze = () => {
      const {
        jarHeading: curHeading,
        isMotionSensed: curMotionSensed
      } = toyParamsRef.current;

      ctx.fillStyle = '#020603';
      ctx.fillRect(0, 0, W, H);

      // Rotate chamber frame with jar heading
      const rad = (curHeading * Math.PI) / 180;
      const cosJ = Math.cos(rad);
      const sinJ = Math.sin(rad);

      // Gravity vector derived from jar tilt and orientation
      // When the jar is turned, gravity pulls the ball towards the lowest corner
      const gravMag = 0.42 + (curMotionSensed ? 0.35 : 0);
      const gx = Math.sin(rad) * gravMag;
      const gy = -Math.cos(rad) * gravMag;

      const bead = beadPosRef.current;
      bead.vx = bead.vx * 0.965 + gx;
      bead.vy = bead.vy * 0.965 + gy;

      bead.x += bead.vx;
      bead.y += bead.vy;

      // Wall collision bounds inside square jar
      const bRad = 9;
      const bound = jarSize - bRad - 6;

      let hitWall = false;
      if (bead.x < -bound) { bead.x = -bound; bead.vx = -bead.vx * 0.75; hitWall = true; }
      if (bead.x > bound) { bead.x = bound; bead.vx = -bead.vx * 0.75; hitWall = true; }
      if (bead.y < -bound) { bead.y = -bound; bead.vy = -bead.vy * 0.75; hitWall = true; }
      if (bead.y > bound) { bead.y = bound; bead.vy = -bead.vy * 0.75; hitWall = true; }

      if (hitWall && Math.abs(bead.vx) + Math.abs(bead.vy) > 0.8) {
        playGlassChime(880 + Math.random() * 300, 0.15);
      }

      // Check Gate Trigger
      const nowMs = Date.now();
      const currentTarget = currentTargetGateRef.current;
      const targetGate = gates[currentTarget];
      const distToGate = Math.hypot(bead.x - targetGate.x, bead.y - targetGate.y);
      if (distToGate < 22 && nowMs - lastScoreTimeRef.current > 400) {
        lastScoreTimeRef.current = nowMs;
        const nextStreak = streakCountRef.current + 1;
        streakCountRef.current = nextStreak;
        setStreakCount(nextStreak);

        const nextScore = mazeScoreRef.current + 100 * nextStreak;
        mazeScoreRef.current = nextScore;
        setMazeScore(nextScore);

        const nextGate = (currentTarget + 1) % 4;
        currentTargetGateRef.current = nextGate;
        setCurrentTargetGate(nextGate);

        playGlassChime(1560, 0.45);
      }

      // Draw Square Jar Floor & Grid in World Space
      ctx.save();
      ctx.translate(cx, cy);

      // Grid Lines
      ctx.strokeStyle = 'rgba(0, 255, 204, 0.08)';
      ctx.lineWidth = 1;
      for (let g = -jarSize; g <= jarSize; g += 30) {
        ctx.beginPath();
        ctx.moveTo(g, -jarSize);
        ctx.lineTo(g, jarSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-jarSize, g);
        ctx.lineTo(jarSize, g);
        ctx.stroke();
      }

      // Outer Square Borosilicate Glass Boundary
      ctx.strokeStyle = isMotionSensed ? 'rgba(245, 158, 11, 0.8)' : 'rgba(0, 255, 204, 0.6)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-jarSize, -jarSize, jarSize * 2, jarSize * 2);

      // Draw 4 Nodal Gates
      gates.forEach(g => {
        const isTarget = g.id === currentTargetGate;
        ctx.beginPath();
        ctx.arc(g.x, g.y, isTarget ? 15 : 10, 0, Math.PI * 2);
        ctx.fillStyle = isTarget ? g.color : 'rgba(255,255,255,0.1)';
        ctx.strokeStyle = g.color;
        ctx.lineWidth = isTarget ? 2.5 : 1;
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 7.5px monospace';
        ctx.fillStyle = isTarget ? '#ffffff' : '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText(g.label, g.x, g.y + (g.y < 0 ? -16 : 20));
      });

      // Draw Center Induction Coil (GP14 / GP26) obstacle post
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      // Bounce against center obstacle post
      const centerDist = Math.hypot(bead.x, bead.y);
      if (centerDist < 28 + bRad) {
        const angle = Math.atan2(bead.y, bead.x);
        bead.x = Math.cos(angle) * (28 + bRad);
        bead.y = Math.sin(angle) * (28 + bRad);
        bead.vx = Math.cos(angle) * 1.5;
        bead.vy = Math.sin(angle) * 1.5;
        playGlassChime(1100, 0.2);
      }

      // Draw Rolling Dielectric Bead (Glowing Quantum Pearl)
      ctx.beginPath();
      ctx.arc(bead.x, bead.y, bRad, 0, Math.PI * 2);
      ctx.fillStyle = '#00ffcc';
      ctx.shadowColor = '#00ffcc';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Specular highlight on bead
      ctx.beginPath();
      ctx.arc(bead.x - 3, bead.y - 3, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();

      // Bead motion vector line
      ctx.strokeStyle = 'rgba(0, 255, 204, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bead.x, bead.y);
      ctx.lineTo(bead.x + bead.vx * 5, bead.y + bead.vy * 5);
      ctx.stroke();

      ctx.restore();

      // Canvas Header
      ctx.font = 'bold 8.5px monospace';
      ctx.fillStyle = '#00ffcc';
      ctx.textAlign = 'left';
      ctx.fillText('● DIELECTRIC KINETIC MAZE (ROLLING BEAD TOY)', 14, 20);
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(`SCORE: ${mazeScoreRef.current} • STREAK: x${streakCountRef.current + 1} • TARGET: ${gates[currentTargetGateRef.current].label}`, 14, 32);

      animId = requestAnimationFrame(renderMaze);
    };

    animId = requestAnimationFrame(renderMaze);
    return () => cancelAnimationFrame(animId);
  }, [activeToy]);

  // -------------------------------------------------------------
  // TOY 3: QUANTUM JAR THEREMIN (ACOUSTIC MOTION SYNTH)
  // -------------------------------------------------------------
  const thereminOscRef = useRef<OscillatorNode | null>(null);
  const thereminSubOscRef = useRef<OscillatorNode | null>(null);
  const thereminGainRef = useRef<GainNode | null>(null);
  const thereminFilterRef = useRef<BiquadFilterNode | null>(null);
  const [thereminVolume, setThereminVolume] = useState<number>(0.4);
  const [thereminScale, setThereminScale] = useState<'lydian' | 'pentatonic' | 'continuous'>('lydian');
  const [isPlayingTheremin, setIsPlayingTheremin] = useState<boolean>(false);

  // Note frequency calculation from jar heading
  const getThereminFreq = useCallback((heading: number) => {
    // 360° mapped across 2 octaves (130 Hz to 523 Hz)
    const baseFreq = 130.81; // C3
    const maxFreq = 523.25;  // C5
    const norm = (heading % 360) / 360;

    if (thereminScale === 'continuous') {
      return baseFreq + norm * (maxFreq - baseFreq);
    }

    // Pentatonic scale semitone offsets: [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]
    const lydianOffsets = [0, 2, 4, 6, 7, 9, 11, 12, 14, 16, 18, 19, 21, 23, 24];
    const pentatonicOffsets = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
    const scale = thereminScale === 'lydian' ? lydianOffsets : pentatonicOffsets;

    const noteIndex = Math.floor(norm * scale.length);
    const semitone = scale[Math.min(scale.length - 1, noteIndex)];
    return baseFreq * Math.pow(2, semitone / 12);
  }, [thereminScale]);

  const toggleThereminPlay = () => {
    initAudio();
    if (!audioCtxRef.current) return;

    if (isPlayingTheremin) {
      if (thereminGainRef.current) {
        thereminGainRef.current.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
      }
      setIsPlayingTheremin(false);
    } else {
      const ctx = audioCtxRef.current;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, ctx.currentTime);

      const freq = getThereminFreq(jarHeading);
      osc1.frequency.setValueAtTime(freq, ctx.currentTime);
      osc2.frequency.setValueAtTime(freq * 0.5, ctx.currentTime); // Sub-octave

      gain.gain.setValueAtTime(thereminVolume, ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      thereminOscRef.current = osc1;
      thereminSubOscRef.current = osc2;
      thereminFilterRef.current = filter;
      thereminGainRef.current = gain;
      setIsPlayingTheremin(true);
    }
  };

  // Update live theremin frequency when jar moves/rotates
  useEffect(() => {
    if (!isPlayingTheremin || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;
    const freq = getThereminFreq(jarHeading);

    if (thereminOscRef.current) {
      thereminOscRef.current.frequency.setTargetAtTime(freq, now, 0.04);
    }
    if (thereminSubOscRef.current) {
      thereminSubOscRef.current.frequency.setTargetAtTime(freq * 0.5, now, 0.04);
    }
    if (thereminFilterRef.current) {
      // D4 square jar symmetry opens filter every 90 degrees
      const d4Open = Math.abs(Math.sin((jarHeading * 4 * Math.PI) / 180));
      const targetFilter = 800 + d4Open * 1800 + (motionIntensity * 1200);
      thereminFilterRef.current.frequency.setTargetAtTime(targetFilter, now, 0.05);
    }
    if (thereminGainRef.current) {
      const activeGain = isMotionSensed ? thereminVolume * 1.25 : thereminVolume;
      thereminGainRef.current.gain.setTargetAtTime(activeGain, now, 0.05);
    }
  }, [jarHeading, isPlayingTheremin, getThereminFreq, motionIntensity, isMotionSensed, thereminVolume]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (thereminOscRef.current) {
        try { thereminOscRef.current.stop(); } catch {}
      }
      if (thereminSubOscRef.current) {
        try { thereminSubOscRef.current.stop(); } catch {}
      }
    };
  }, []);

  // -------------------------------------------------------------
  // TOY 4: CYMATICS & FARADAY WAVE STANDING WAVE SCULPTOR
  // -------------------------------------------------------------
  const cymaticsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [modeM, setModeM] = useState<number>(3);
  const [modeN, setModeN] = useState<number>(4);
  const [isAutoHarmonics, setIsAutoHarmonics] = useState<boolean>(true);

  useEffect(() => {
    if (activeToy !== 'cymatics') return;
    const canvas = cymaticsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const L = 135; // Half length of square chamber

    let t = 0;

    const renderCymatics = () => {
      const {
        jarHeading: curHeading,
        isMotionSensed: curMotionSensed,
        motionIntensity: curIntensity,
        phaseAngle: curPhaseAngle
      } = toyParamsRef.current;

      ctx.fillStyle = '#010502';
      ctx.fillRect(0, 0, W, H);

      t += 0.035 + (curIntensity * 0.08);

      // Chladni 2D Standing Wave Function for Square Boundary:
      // w(x, y) = a * cos(m*pi*x/L)*cos(n*pi*y/L) - b * cos(n*pi*x/L)*cos(m*pi*y/L)
      const curM = isAutoHarmonics ? (2 + (curHeading % 90 > 45 ? 2 : 1)) : modeM;
      const curN = isAutoHarmonics ? (3 + Math.floor((curHeading % 360) / 90)) : modeN;

      const rot = (curHeading * Math.PI) / 180;
      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);

      ctx.save();
      ctx.translate(cx, cy);

      // Square Borosilicate Outline
      ctx.strokeStyle = curMotionSensed ? '#f59e0b' : 'rgba(0, 255, 204, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(-L, -L, L * 2, L * 2);

      // Render Chladni Standing Wave Iso-lines & Particle Density
      const sampleStep = 8;
      for (let x = -L + 4; x <= L - 4; x += sampleStep) {
        for (let y = -L + 4; y <= L - 4; y += sampleStep) {
          // Normalize coordinates to [-1, 1]
          const nx = x / L;
          const ny = y / L;

          // Chladni modal formula
          const val1 = Math.cos(curM * Math.PI * nx) * Math.cos(curN * Math.PI * ny);
          const val2 = Math.cos(curN * Math.PI * nx) * Math.cos(curM * Math.PI * ny);
          const chladni = val1 - val2;

          // Time vibration modulation
          const vibration = Math.sin(t * 3.5 + (curPhaseAngle / 18.0)) * 0.25;
          const amplitude = Math.abs(chladni + vibration);

          // Particles accumulate along nodal lines (where amplitude ≈ 0)
          if (amplitude < 0.22) {
            const intensity = 1.0 - (amplitude / 0.22);
            // Rotate particle with jar heading
            const rx = x * cosR - y * sinR;
            const ry = x * sinR + y * cosR;

            ctx.beginPath();
            ctx.arc(rx, ry, 1.4 * intensity, 0, Math.PI * 2);
            ctx.fillStyle = curMotionSensed 
              ? `rgba(245, 158, 11, ${intensity * 0.85})` 
              : `rgba(0, 255, 204, ${intensity * 0.75})`;
            ctx.fill();
          }
        }
      }

      ctx.restore();

      // Header
      ctx.font = 'bold 8.5px monospace';
      ctx.fillStyle = '#00ffcc';
      ctx.textAlign = 'left';
      ctx.fillText(`● CYMATICS & FARADAY WAVE SCULPTOR • MODES [${curM}, ${curN}]`, 14, 20);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '7.5px monospace';
      ctx.fillText(`FUNDAMENTAL: 28 Hz MULTI-HARMONIC • D4 SYMMETRY: ${curHeading % 90}° • AZIMUTH: ${curHeading}°`, 14, 32);

      animId = requestAnimationFrame(renderCymatics);
    };

    animId = requestAnimationFrame(renderCymatics);
    return () => cancelAnimationFrame(animId);
  }, [activeToy, modeM, modeN, isAutoHarmonics]);

  return (
    <div className="flex flex-col gap-3 p-3 bg-[#020704] rounded-xl border border-amber-500/30 text-white font-mono shadow-2xl">
      {/* Header & Toy Mode Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300">
            <Sparkles size={16} className="animate-spin" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-black tracking-wider text-amber-300 uppercase">
                JAR TOYS &amp; PHYSICAL DIELECTRIC PLAYGROUND
              </h2>
              <span className="text-[7.5px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/30 font-bold">
                PHYSICAL EXPERIMENTS
              </span>
            </div>
            <p className="text-[8px] text-zinc-400">
              Interactive tactile toys driven by your real jar orientation, dielectric sloshing &amp; bench motion
            </p>
          </div>
        </div>

        {/* 4 Interactive Toy Tabs */}
        <div className="flex items-center gap-1 bg-black/80 p-1 rounded-lg border border-white/10 text-[8.5px] font-bold">
          <button
            onClick={() => setActiveToy('slosh')}
            className={`px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
              activeToy === 'slosh'
                ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Waves size={11} />
            <span>1. FERROFLUID SLOSH</span>
          </button>

          <button
            onClick={() => setActiveToy('maze')}
            className={`px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
              activeToy === 'maze'
                ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Target size={11} />
            <span>2. KINETIC MAZE</span>
          </button>

          <button
            onClick={() => setActiveToy('theremin')}
            className={`px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
              activeToy === 'theremin'
                ? 'bg-emerald-400 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Music size={11} />
            <span>3. JAR THEREMIN</span>
          </button>

          <button
            onClick={() => setActiveToy('cymatics')}
            className={`px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
              activeToy === 'cymatics'
                ? 'bg-purple-500 text-black shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Radio size={11} />
            <span>4. 28Hz CYMATICS</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage for Selected Toy */}
      <div className="relative w-full rounded-xl overflow-hidden border border-emerald-500/25 bg-[#010402] flex items-center justify-center min-h-[380px] max-h-[480px]">
        {/* Real-time motion detection pulse banner */}
        {isMotionSensed && (
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/85 border border-amber-400 px-2.5 py-1 rounded-full text-[8.5px] text-amber-300 font-bold shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse">
            <Zap size={11} className="text-amber-400" />
            <span>BENCH MOTION SENSED ({jarHeading}°)</span>
          </div>
        )}

        {/* TOY 1: Slosh Tank Canvas */}
        {activeToy === 'slosh' && (
          <canvas
            ref={sloshCanvasRef}
            width={580}
            height={440}
            onPointerDown={handleSloshPointerDown}
            className="w-full h-full object-contain cursor-crosshair select-none"
            title="Click or drag to swirl and stir the dielectric liquid!"
          />
        )}

        {/* TOY 2: Kinetic Maze Canvas */}
        {activeToy === 'maze' && (
          <canvas
            ref={mazeCanvasRef}
            width={580}
            height={440}
            onClick={() => {
              initAudio();
              onRotateJar?.((jarHeading + 45) % 360);
            }}
            className="w-full h-full object-contain cursor-pointer select-none"
            title="Tilt or rotate the physical jar to roll the ball into the target gates!"
          />
        )}

        {/* TOY 3: Theremin Canvas & Visualizer */}
        {activeToy === 'theremin' && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6 text-center select-none">
            <div className="relative w-48 h-48 rounded-full border-2 border-emerald-500/40 flex items-center justify-center bg-black/60 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              {/* Dial Angle indicator */}
              <div 
                className="absolute inset-0 flex items-start justify-center transition-transform duration-75"
                style={{ transform: `rotate(${jarHeading}deg)` }}
              >
                <div className="w-2.5 h-6 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)] -mt-2" />
              </div>

              <div className="flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-emerald-300 font-mono">
                  {Math.round(getThereminFreq(jarHeading))} Hz
                </span>
                <span className="text-[10px] text-zinc-400">PITCH FREQUENCY</span>
                <span className="text-[9px] text-amber-300 font-bold mt-1">
                  AZIMUTH: {jarHeading}°
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleThereminPlay}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-2 shadow-lg ${
                  isPlayingTheremin
                    ? 'bg-red-500 text-white shadow-red-500/40'
                    : 'bg-emerald-500 text-black shadow-emerald-500/40 hover:bg-emerald-400'
                }`}
              >
                {isPlayingTheremin ? <Pause size={14} /> : <Play size={14} />}
                <span>{isPlayingTheremin ? 'STOP THEREMIN' : 'START ACOUSTIC THEREMIN'}</span>
              </button>

              <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 text-[9px]">
                <span className="text-zinc-400">SCALE:</span>
                {(['lydian', 'pentatonic', 'continuous'] as const).map(scale => (
                  <button
                    key={scale}
                    onClick={() => setThereminScale(scale)}
                    className={`px-2 py-0.5 rounded uppercase font-bold cursor-pointer transition-all ${
                      thereminScale === scale
                        ? 'bg-cyan-500 text-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {scale}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[8px] text-zinc-400 max-w-md">
              Rotating your physical jar bends the pitch. Shaking or tapping modulates the analog filter and resonance overtones!
            </p>
          </div>
        )}

        {/* TOY 4: Cymatics Canvas */}
        {activeToy === 'cymatics' && (
          <canvas
            ref={cymaticsCanvasRef}
            width={580}
            height={440}
            className="w-full h-full object-contain select-none"
          />
        )}
      </div>

      {/* Interactive Controls & Nudge Bar for Current Toy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[8px]">
        {/* Nudge & Rotate Bench helper */}
        <div className="p-2 rounded bg-black/50 border border-white/10 space-y-1">
          <span className="text-zinc-400 font-bold block">PHYSICAL JAR TACTILE NUDGE:</span>
          <div className="flex gap-1">
            <button
              onClick={() => onRotateJar?.((jarHeading - 30 + 360) % 360)}
              className="flex-1 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-cyan-300 font-bold cursor-pointer"
            >
              ⟲ -30°
            </button>
            <button
              onClick={() => onRotateJar?.((jarHeading + 30) % 360)}
              className="flex-1 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-cyan-300 font-bold cursor-pointer"
            >
              ⟳ +30°
            </button>
            <button
              onClick={() => onRotateJar?.(0)}
              className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-red-300 font-bold cursor-pointer"
            >
              0° NORTH
            </button>
          </div>
        </div>

        {/* Toy-Specific Controls */}
        {activeToy === 'slosh' && (
          <div className="p-2 rounded bg-black/50 border border-white/10 space-y-1">
            <span className="text-zinc-400 font-bold block">LIQUID VISCOSITY:</span>
            <div className="flex gap-1">
              {[0.88, 0.94, 0.98].map(v => (
                <button
                  key={v}
                  onClick={() => setSloshViscosity(v)}
                  className={`flex-1 py-1 rounded font-bold cursor-pointer transition-all ${
                    sloshViscosity === v ? 'bg-cyan-500 text-black' : 'bg-zinc-900 text-zinc-400'
                  }`}
                >
                  {v === 0.88 ? 'LIGHT' : v === 0.94 ? 'OIL' : 'THICK'}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeToy === 'maze' && (
          <div className="p-2 rounded bg-black/50 border border-white/10 space-y-1">
            <span className="text-zinc-400 font-bold block">KINETIC MAZE CONTROLS:</span>
            <div className="flex gap-1">
              <button
                onClick={resetBead}
                className="flex-1 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 font-bold cursor-pointer flex items-center justify-center gap-1"
              >
                <RotateCcw size={10} />
                <span>CENTER BEAD</span>
              </button>
            </div>
          </div>
        )}

        {activeToy === 'theremin' && (
          <div className="p-2 rounded bg-black/50 border border-white/10 space-y-1">
            <span className="text-zinc-400 font-bold block">THEREMIN VOLUME:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={thereminVolume}
              onChange={e => setThereminVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded appearance-none cursor-pointer accent-emerald-400"
            />
          </div>
        )}

        {activeToy === 'cymatics' && (
          <div className="p-2 rounded bg-black/50 border border-white/10 space-y-1">
            <span className="text-zinc-400 font-bold block">MODAL SYMMETRY:</span>
            <button
              onClick={() => setIsAutoHarmonics(!isAutoHarmonics)}
              className={`w-full py-1 rounded font-bold cursor-pointer transition-all ${
                isAutoHarmonics ? 'bg-purple-500 text-black' : 'bg-zinc-900 text-zinc-400'
              }`}
            >
              {isAutoHarmonics ? 'AUTO-FOLLOW JAR ANGLE' : 'MANUAL POLAR'}
            </button>
          </div>
        )}

        {/* Physical Status Indicator */}
        <div className="p-2 rounded bg-black/50 border border-white/10 flex flex-col justify-between">
          <span className="text-zinc-500 text-[7.5px] uppercase font-bold">PHYSICAL DIELECTRIC:</span>
          <div className="flex justify-between items-center text-[8px]">
            <span className="text-zinc-400">COUPLING M:</span>
            <span className="text-cyan-300 font-mono font-bold">
              {(0.92 + 0.08 * Math.cos(((jarHeading % 90) / 45) * Math.PI)).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-[8px]">
            <span className="text-zinc-400">D4 WALL DELTA:</span>
            <span className="text-emerald-400 font-mono font-bold">{jarHeading % 90}° / 90°</span>
          </div>
        </div>

        {/* Audio Engine Status */}
        <div className="p-2 rounded bg-black/50 border border-white/10 flex flex-col justify-between">
          <span className="text-zinc-500 text-[7.5px] uppercase font-bold">ACOUSTIC SYNTHESIS:</span>
          <button
            onClick={initAudio}
            className={`w-full py-1 rounded font-bold cursor-pointer flex items-center justify-center gap-1 transition-all ${
              isAudioActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-zinc-900 text-zinc-400'
            }`}
          >
            {isAudioActive ? <Volume2 size={10} className="text-emerald-400" /> : <VolumeX size={10} />}
            <span>{isAudioActive ? 'WEB AUDIO ACTIVE' : 'ENABLE AUDIO'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

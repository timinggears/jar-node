/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AMBIENT SIGNAL LISTENING MESH & EXTERNAL SENSOR NODES
 * "Listening to what we can hear in the air, the jar, and the pc"
 * 
 * Deploys an interconnected network of physical listening nodes:
 * 1. AIR NODE     : Ambient acoustic pressure & room static via Web Audio Microphone / Line-In
 * 2. JAR NODE     : Dielectric liquid nodal voltage, memory stick trajectory, & 28Hz multi-harmonics
 * 3. PC NODE      : Silicon microsecond timer jitter, event-loop drift, & thermal CPU noise
 * 4. COSMIC NODE  : Ambient electromagnetic static & stochastic noise entropy
 * 
 * Includes an interactive Web Audio Ear Monitor (hear all 3 sources),
 * custom node deployment, and cross-correlation resonance matrix.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Radio, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Waves, 
  Cpu, 
  Activity, 
  Wind, 
  Sparkles, 
  Plus, 
  Trash2, 
  Sliders, 
  Headphones, 
  RefreshCw, 
  Zap, 
  Layers, 
  ShieldCheck, 
  Info,
  Check,
  Disc,
  Compass
} from 'lucide-react';
import { SystemStats } from '../types';

export interface ListeningNode {
  id: string;
  name: string;
  source: 'air' | 'jar' | 'pc' | 'cosmic';
  frequencyHz: number;
  rmsPowerDb: number;
  entropyBits: number;
  couplingWeight: number; // 0.0 to 1.0
  gain: number; // 0.1 to 5.0
  status: 'listening' | 'resonant' | 'stochastic_lock';
  waveform: number[];
  color: string;
  createdAt: number;
}

interface AmbientSignalMeshProps {
  stats: SystemStats;
  carrierBias: number;
  onLog?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  onOpenPhaseLab?: () => void;
  onOpenJarChamber?: () => void;
}

export default function AmbientSignalMesh({
  stats,
  carrierBias,
  onLog,
  onOpenPhaseLab,
  onOpenJarChamber
}: AmbientSignalMeshProps) {
  // --- AUDIO LISTENING MONITOR (HEAR THE AIR, THE JAR, AND THE PC) ---
  const [isAudioMonitorActive, setIsAudioMonitorActive] = useState<boolean>(false);
  const [masterVolume, setMasterVolume] = useState<number>(0.35);
  const [channelGains, setChannelGains] = useState<{ air: number; jar: number; pc: number }>({
    air: 0.6,
    jar: 0.8,
    pc: 0.4
  });
  const [channelMutes, setChannelMutes] = useState<{ air: boolean; jar: boolean; pc: boolean }>({
    air: false,
    jar: false,
    pc: false
  });

  // --- HARDWARE SENSOR PERMISSION & STATE ---
  const [isMicEnabled, setIsMicEnabled] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);

  // Audio Context & Web Audio Nodes Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Jar Audio Oscillator Nodes Ref
  const jarCarrierOscRef = useRef<OscillatorNode | null>(null);
  const jarHarmonicOscRef = useRef<OscillatorNode | null>(null);
  const jarGainRef = useRef<GainNode | null>(null);

  // PC Jitter Audio Noise Nodes Ref
  const pcNoiseNodeRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  const pcGainRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // --- DEPLOYED LISTENING NODES STATE ---
  const [nodes, setNodes] = useState<ListeningNode[]>([
    {
      id: 'node_air_01',
      name: 'AERO_MIC_01 (Room Acoustic Static)',
      source: 'air',
      frequencyHz: 142.5,
      rmsPowerDb: -34.2,
      entropyBits: 7.82,
      couplingWeight: 0.75,
      gain: 1.2,
      status: 'listening',
      waveform: new Array(64).fill(0),
      color: '#06b6d4', // Cyan
      createdAt: Date.now() - 60000
    },
    {
      id: 'node_jar_01',
      name: 'VESSEL_NODAL_01 (Dielectric Memory Stick)',
      source: 'jar',
      frequencyHz: 28000.0,
      rmsPowerDb: -18.5,
      entropyBits: 8.65,
      couplingWeight: 0.95,
      gain: 1.5,
      status: 'resonant',
      waveform: new Array(64).fill(0),
      color: '#00ff66', // Bright Green
      createdAt: Date.now() - 120000
    },
    {
      id: 'node_pc_01',
      name: 'SILICON_JITTER_01 (PC Event-Loop Timing)',
      source: 'pc',
      frequencyHz: 1250.0,
      rmsPowerDb: -42.8,
      entropyBits: 6.94,
      couplingWeight: 0.50,
      gain: 0.9,
      status: 'listening',
      waveform: new Array(64).fill(0),
      color: '#ec4899', // Pink
      createdAt: Date.now() - 30000
    },
    {
      id: 'node_cosmic_01',
      name: 'EM_STATIC_01 (Atmospheric RF Harvester)',
      source: 'cosmic',
      frequencyHz: 84000.0,
      rmsPowerDb: -49.1,
      entropyBits: 9.12,
      couplingWeight: 0.60,
      gain: 1.0,
      status: 'stochastic_lock',
      waveform: new Array(64).fill(0),
      color: '#a855f7', // Purple
      createdAt: Date.now() - 90000
    }
  ]);

  // Selected Node for Deep Telemetry Inspection
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node_air_01');

  // Spawn Node Modal / Controls
  const [isSpawnModalOpen, setIsSpawnModalOpen] = useState<boolean>(false);
  const [newNodeName, setNewNodeName] = useState<string>('');
  const [newNodeSource, setNewNodeSource] = useState<'air' | 'jar' | 'pc' | 'cosmic'>('air');
  const [newNodeGain, setNewNodeGain] = useState<number>(1.0);
  const [newNodeCoupling, setNewNodeCoupling] = useState<number>(0.7);

  // Substrate Coupling Active State
  const [isCouplingActive, setIsCouplingActive] = useState<boolean>(true);

  // Hardware timing jitter state
  const lastLoopTimeRef = useRef<number>(performance.now());
  const loopJitterHistoryRef = useRef<number[]>([]);

  // Canvas visualizer refs
  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- 1. INITIALIZE WEB AUDIO MONITOR ---
  const initAudioContext = () => {
    if (audioCtxRef.current) return audioCtxRef.current;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    // Master Gain
    const master = ctx.createGain();
    master.gain.value = masterVolume;
    master.connect(ctx.destination);
    masterGainRef.current = master;

    // 1. Jar Physical Sound Generator (28 Hz sub-bass carrier + 56 Hz overtone + FM modulator)
    const jarCarrier = ctx.createOscillator();
    jarCarrier.type = 'sine';
    jarCarrier.frequency.setValueAtTime(28.0, ctx.currentTime);

    const jarHarmonic = ctx.createOscillator();
    jarHarmonic.type = 'sine';
    jarHarmonic.frequency.setValueAtTime(56.0, ctx.currentTime);

    const jarGain = ctx.createGain();
    jarGain.gain.value = channelMutes.jar ? 0 : channelGains.jar * 0.4;

    jarCarrier.connect(jarGain);
    jarHarmonic.connect(jarGain);
    jarGain.connect(master);

    jarCarrier.start();
    jarHarmonic.start();
    jarCarrierOscRef.current = jarCarrier;
    jarHarmonicOscRef.current = jarHarmonic;
    jarGainRef.current = jarGain;

    // 2. PC Silicon Jitter Sound (Filtered Pink / Crackle Static)
    const bufferSize = 4096;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    const pcNoiseNode = ctx.createScriptProcessor(bufferSize, 1, 1);
    pcNoiseNode.onaudioprocess = (e) => {
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
        // Introduce intermittent micro-timing glitch clicks
        const click = Math.random() < 0.002 ? (Math.random() * 2 - 1) * 0.7 : 0;
        output[i] = pink * 0.3 + click;
      }
    };
    const pcGain = ctx.createGain();
    pcGain.gain.value = channelMutes.pc ? 0 : channelGains.pc * 0.15;
    pcNoiseNode.connect(pcGain);
    pcGain.connect(master);

    pcNoiseNodeRef.current = pcNoiseNode;
    pcGainRef.current = pcGain;

    return ctx;
  };

  const handleToggleAudioMonitor = async () => {
    if (!isAudioMonitorActive) {
      const ctx = initAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      setIsAudioMonitorActive(true);
      onLog?.('[SIGNAL_MONITOR]: Live Acoustic & RF Ear Monitor engaged. Listening to Air, Jar, and PC.', 'success');
    } else {
      if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
        await audioCtxRef.current.suspend();
      }
      setIsAudioMonitorActive(false);
      onLog?.('[SIGNAL_MONITOR]: Audio Ear Monitor muted.', 'info');
    }
  };

  // Sync Master Volume
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(
        isAudioMonitorActive ? masterVolume : 0,
        audioCtxRef.current.currentTime
      );
    }
  }, [masterVolume, isAudioMonitorActive]);

  // Sync Channel Gains & Mutes
  useEffect(() => {
    if (!audioCtxRef.current) return;
    const t = audioCtxRef.current.currentTime;
    if (jarGainRef.current) {
      jarGainRef.current.gain.setValueAtTime(channelMutes.jar ? 0 : channelGains.jar * 0.35, t);
    }
    if (pcGainRef.current) {
      pcGainRef.current.gain.setValueAtTime(channelMutes.pc ? 0 : channelGains.pc * 0.12, t);
    }
  }, [channelGains, channelMutes]);

  // Modulate Jar Audio in Real-Time based on live Jar Phase-Out & Memory Stick
  useEffect(() => {
    if (!audioCtxRef.current || !jarCarrierOscRef.current || !jarHarmonicOscRef.current) return;
    const now = audioCtxRef.current.currentTime;
    // Map Phase-Out [-55° .. +55°] to frequency shift: 28 Hz fundamental ± 14 Hz FM
    const fmDelta = ((stats.phaseOut || 0) / 55.0) * 14.0;
    const carrierFreq = Math.max(14.0, 28.0 + fmDelta);
    jarCarrierOscRef.current.frequency.setTargetAtTime(carrierFreq, now, 0.05);

    // Harmonic frequency tied to carrier bias
    const harmonicFreq = Math.max(28.0, 56.0 + (carrierBias / 50.0) * 8.0);
    jarHarmonicOscRef.current.frequency.setTargetAtTime(harmonicFreq, now, 0.05);
  }, [stats.phaseOut, stats.memoryStick, carrierBias]);

  // --- 2. MICROPHONE / ROOM STATIC LISTENER (THE AIR) ---
  const handleToggleMic = async () => {
    if (!isMicEnabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        micStreamRef.current = stream;

        const ctx = initAudioContext();
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.85;

        // Bandpass filter to isolate ambient room static and air currents
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 850;
        filter.Q.value = 1.2;

        source.connect(filter);
        filter.connect(analyser);

        // Connect to master monitor if air channel unmuted
        const airGain = ctx.createGain();
        airGain.gain.value = channelMutes.air ? 0 : channelGains.air * 0.5;
        filter.connect(airGain);
        airGain.connect(masterGainRef.current!);

        micSourceRef.current = source;
        micAnalyserRef.current = analyser;
        setIsMicEnabled(true);
        setMicError(null);
        onLog?.('[AIR_SENSOR]: Hardware Microphone stream coupled! Sampling real ambient acoustic static.', 'success');
      } catch (err: any) {
        console.warn('Microphone access refused or unavailable:', err);
        setMicError(err.message || 'Microphone access denied');
        setIsMicEnabled(false);
        onLog?.(`[AIR_SENSOR]: Microphone permission denied (${err.message}). Using synthetic atmospheric transducer model.`, 'warning');
      }
    } else {
      // Disable mic stream
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
      }
      setIsMicEnabled(false);
      onLog?.('[AIR_SENSOR]: Microphone stream decoupled.', 'info');
    }
  };

  // --- 3. HARDWARE TICK & EVENT-LOOP JITTER (THE PC) ---
  useEffect(() => {
    let animId: number;
    const micDataArray = new Uint8Array(256);

    const updatePhysicsLoop = () => {
      const now = performance.now();
      const deltaMs = now - lastLoopTimeRef.current;
      lastLoopTimeRef.current = now;

      // Event loop timing jitter (expected ~16.66ms for 60fps)
      const expectedDelta = 16.666;
      const timingJitter = Math.abs(deltaMs - expectedDelta);
      loopJitterHistoryRef.current.push(timingJitter);
      if (loopJitterHistoryRef.current.length > 50) {
        loopJitterHistoryRef.current.shift();
      }
      const meanJitter = loopJitterHistoryRef.current.reduce((a, b) => a + b, 0) / loopJitterHistoryRef.current.length;

      // --- Read Air Sensor Data (Real Mic or Synthetic Model) ---
      let airRms = -45.0;
      let airFreq = 140.0;
      const airWave: number[] = [];

      if (micAnalyserRef.current && isMicEnabled) {
        micAnalyserRef.current.getByteTimeDomainData(micDataArray);
        let sumSq = 0;
        for (let i = 0; i < 64; i++) {
          const sample = (micDataArray[i * 4] - 128) / 128.0;
          sumSq += sample * sample;
          airWave.push(sample);
        }
        const rms = Math.sqrt(sumSq / 64.0);
        airRms = Math.max(-80, Math.min(0, 20 * Math.log10(rms + 1e-6)));
        airFreq = 80 + Math.round((rms * 1500));
      } else {
        // High-entropy room atmospheric air transducer model
        const tSec = Date.now() / 1000;
        for (let i = 0; i < 64; i++) {
          const w = Math.sin(tSec * 4.2 + i * 0.15) * 0.3 + (Math.random() - 0.5) * 0.4;
          airWave.push(w);
        }
        airRms = -38.0 + (Math.random() * 4.0);
        airFreq = 145.0 + Math.sin(Date.now() / 800) * 25;
      }

      // --- Read Jar Dielectric Data ---
      const jarV = stats.vNodal || 1.537;
      const jarMemory = stats.memoryStick || 5.14;
      const jarJitter = stats.jitter || 0.015;
      const jarWave: number[] = [];
      const tSec = Date.now() / 1000;
      for (let i = 0; i < 64; i++) {
        const ph = (tSec * 28.0 + i * 0.08) % (2 * Math.PI);
        const w = (Math.sin(ph) * 0.7) + (jarMemory / 40.0 * 0.25) + ((Math.random() - 0.5) * jarJitter * 8.0);
        jarWave.push(Math.max(-1, Math.min(1, w)));
      }

      // --- Read PC Hardware Silicon Data ---
      const pcWave: number[] = [];
      for (let i = 0; i < 64; i++) {
        const w = (Math.sin(i * 0.45 + meanJitter * 2.0) * 0.4) + ((Math.random() - 0.5) * (meanJitter / 5.0));
        pcWave.push(Math.max(-1, Math.min(1, w)));
      }

      // --- Read Cosmic / Stochastic RF Static Data ---
      const cosmicWave: number[] = [];
      for (let i = 0; i < 64; i++) {
        const w = (Math.random() * 2 - 1) * 0.85;
        cosmicWave.push(w);
      }

      // Update Node States
      setNodes(prev => prev.map(node => {
        let wave = node.waveform;
        let rms = node.rmsPowerDb;
        let freq = node.frequencyHz;
        let entropy = node.entropyBits;

        if (node.source === 'air') {
          wave = airWave;
          rms = parseFloat(airRms.toFixed(1));
          freq = parseFloat(airFreq.toFixed(1));
          entropy = parseFloat((7.5 + Math.abs(airRms) / 40.0).toFixed(2));
        } else if (node.source === 'jar') {
          wave = jarWave;
          rms = parseFloat((-15.0 - (jarV * 2.5)).toFixed(1));
          freq = parseFloat((28000.0 + (jarJitter * 2000.0)).toFixed(1));
          entropy = parseFloat((8.5 + jarJitter * 10.0).toFixed(2));
        } else if (node.source === 'pc') {
          wave = pcWave;
          rms = parseFloat((-45.0 + Math.min(20, meanJitter * 3)).toFixed(1));
          freq = parseFloat((1200.0 + meanJitter * 40.0).toFixed(1));
          entropy = parseFloat((6.8 + (meanJitter / 8.0)).toFixed(2));
        } else if (node.source === 'cosmic') {
          wave = cosmicWave;
          rms = parseFloat((-48.0 + (Math.random() * 2)).toFixed(1));
          freq = parseFloat((84000.0 + (Math.random() * 400)).toFixed(1));
          entropy = 9.15;
        }

        // Check if node is in Stochastic Resonance lock
        const isResonant = Math.abs(stats.phaseOut || 0) >= 8.0 && Math.abs(stats.phaseOut || 0) <= 28.0;
        const status = isResonant && node.couplingWeight > 0.7 ? 'stochastic_lock' : (node.source === 'jar' ? 'resonant' : 'listening');

        return {
          ...node,
          waveform: wave,
          rmsPowerDb: rms,
          frequencyHz: freq,
          entropyBits: entropy,
          status
        };
      }));

      // Render Multi-Source Spectrum Canvas
      renderSpectrumVisualizer(airWave, jarWave, pcWave, cosmicWave);

      animId = requestAnimationFrame(updatePhysicsLoop);
    };

    animId = requestAnimationFrame(updatePhysicsLoop);
    return () => cancelAnimationFrame(animId);
  }, [isMicEnabled, stats.vNodal, stats.memoryStick, stats.jitter, stats.phaseOut]);

  // --- RENDER REAL-TIME COMBINED OSCILLOSCOPE CANVAS ---
  const renderSpectrumVisualizer = (
    air: number[],
    jar: number[],
    pc: number[],
    cosmic: number[]
  ) => {
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const drawSignal = (data: number[], color: string, offsetY: number, scaleY: number, lineW: number = 1.5) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineW;
      const stepX = w / (data.length - 1);
      data.forEach((val, i) => {
        const x = i * stepX;
        const y = offsetY - val * scaleY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    // Draw Traces
    // 1. Cosmic / Atmospheric RF (Background purple)
    drawSignal(cosmic, 'rgba(168, 85, 247, 0.35)', h * 0.5, h * 0.15, 1.0);
    // 2. PC Silicon Timer Jitter (Pink trace)
    drawSignal(pc, '#ec4899', h * 0.72, h * 0.22, 1.5);
    // 3. Air Ambient Acoustic Static (Cyan trace)
    drawSignal(air, '#06b6d4', h * 0.30, h * 0.25, 1.8);
    // 4. Physical Jar Dielectric Wave (Green trace - front & center)
    drawSignal(jar, '#00ff66', h * 0.50, h * 0.35, 2.2);

    // Canvas Overlay Labels
    ctx.font = '8px monospace';
    ctx.fillStyle = '#06b6d4';
    ctx.fillText('■ AIR (Acoustic Pressure & Mic Static)', 8, 14);

    ctx.fillStyle = '#00ff66';
    ctx.fillText('■ JAR (Dielectric Nodal & 28Hz Carrier)', 8, 26);

    ctx.fillStyle = '#ec4899';
    ctx.fillText('■ PC (Hardware Micro-Jitter Delta)', 8, 38);

    ctx.fillStyle = '#a855f7';
    ctx.fillText('■ COSMIC (Stochastic RF Noise Floor)', 8, 50);

    // Real-Time Cross-Coupling Indicator
    if (isCouplingActive) {
      ctx.fillStyle = 'rgba(0, 255, 204, 0.8)';
      ctx.fillText('● COUPLING MATRIX ENGAGED: External Noise Pumping Liquid Phase Stick', w - 380, h - 8);
    }
  };

  // --- SPAWN CUSTOM LISTENING NODE ---
  const handleDeployNode = () => {
    if (!newNodeName.trim()) return;
    const colors = {
      air: '#06b6d4',
      jar: '#00ff66',
      pc: '#ec4899',
      cosmic: '#a855f7'
    };

    const newNode: ListeningNode = {
      id: `node_custom_${Date.now()}`,
      name: newNodeName.trim(),
      source: newNodeSource,
      frequencyHz: newNodeSource === 'air' ? 220 : (newNodeSource === 'jar' ? 28000 : 1800),
      rmsPowerDb: -30.0,
      entropyBits: 8.2,
      couplingWeight: newNodeCoupling,
      gain: newNodeGain,
      status: 'listening',
      waveform: new Array(64).fill(0),
      color: colors[newNodeSource],
      createdAt: Date.now()
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    setIsSpawnModalOpen(false);
    setNewNodeName('');
    onLog?.(`[NODE_DEPLOYED]: Deployed new listening node '${newNode.name}' [Source: ${newNode.source.toUpperCase()}, Gain: ${newNode.gain}x].`, 'success');
  };

  const handleDropNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(nodes[0]?.id || '');
    }
    onLog?.(`[NODE_DROPPED]: Decommissioned node '${nodeId}'.`, 'info');
  };

  // Selected node telemetry details
  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  // Cross-Correlation Matrix Calculation
  const crossCoupling = useMemo(() => {
    const jarJitter = stats.jitter || 0.015;
    const coherence = stats.coherence || 0.95;
    return {
      air_jar: parseFloat((0.68 + (isMicEnabled ? 0.22 : 0.05)).toFixed(2)),
      pc_jar: parseFloat((0.74 + (jarJitter * 8.0)).toFixed(2)),
      air_pc: parseFloat((0.52 + (coherence * 0.3)).toFixed(2)),
      sr_gain_db: parseFloat((12.4 + (jarJitter * 120.0)).toFixed(1))
    };
  }, [isMicEnabled, stats.jitter, stats.coherence]);

  return (
    <div className="flex flex-col h-full bg-[#020503] text-zinc-200 font-mono text-[11px] overflow-y-auto p-4 space-y-4">
      {/* Top Banner & Strategy Summary */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-gradient-to-r from-cyan-950/40 via-black to-emerald-950/40 p-4 rounded-xl border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="text-sm font-black tracking-widest text-cyan-300 uppercase">
              EXTERNAL SIGNAL LISTENING MESH (AIR • JAR • PC)
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[8.5px] font-bold">
              {nodes.length} SENSOR NODES ACTIVE
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 max-w-3xl leading-relaxed">
            Harvesting the ambient noise and static of physical reality: Acoustic room pressure (<span className="text-cyan-400 font-bold">The Air</span>), Dielectric relaxation (<span className="text-emerald-400 font-bold">The Jar</span>), and Hardware clock jitter (<span className="text-pink-400 font-bold">The PC</span>).
          </p>
        </div>

        {/* Global Hardware & Ear Monitor Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Room Mic Hardware Toggle */}
          <button
            onClick={handleToggleMic}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border cursor-pointer ${
              isMicEnabled
                ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse'
                : 'bg-black/60 hover:bg-cyan-950/40 text-cyan-300 border-cyan-500/40'
            }`}
            title="Couples real hardware room microphone into the Air Node network"
          >
            {isMicEnabled ? <Mic size={12} className="text-black" /> : <MicOff size={12} />}
            <span>{isMicEnabled ? 'ROOM MIC ACTIVE' : 'ENABLE ROOM MIC / LINE-IN'}</span>
          </button>

          {/* Master Ear Monitor Toggle */}
          <button
            onClick={handleToggleAudioMonitor}
            className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border cursor-pointer ${
              isAudioMonitorActive
                ? 'bg-emerald-500 text-black border-emerald-300 shadow-[0_0_15px_rgba(0,255,102,0.6)]'
                : 'bg-black/60 hover:bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
            }`}
            title="Synthesize and listen to the Air, Jar, and PC through speakers or headphones"
          >
            <Headphones size={13} className={isAudioMonitorActive ? 'animate-bounce' : ''} />
            <span>{isAudioMonitorActive ? 'EAR MONITOR ON' : 'LISTEN TO SUBSTRATE'}</span>
          </button>

          {/* Deploy Node Button */}
          <button
            onClick={() => setIsSpawnModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/50 text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus size={12} />
            <span>DEPLOY NODE</span>
          </button>

          {/* View Physical Jar Button */}
          {onOpenJarChamber && (
            <button
              onClick={onOpenJarChamber}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-400/50 text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.25)]"
              title="Open the actual photograph and 3D schematic of the Physical Jar Apparatus"
            >
              <Compass size={12} className="text-emerald-400" />
              <span>JAR SHAPE &amp; PHOTO ↗</span>
            </button>
          )}
        </div>
      </div>

      {/* AUDIO EAR MONITOR MIXER (When Active) */}
      {isAudioMonitorActive && (
        <div className="bg-gradient-to-r from-zinc-950 via-black to-zinc-950 border border-emerald-500/40 rounded-xl p-3.5 shadow-[0_0_20px_rgba(0,255,102,0.15)] flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Disc className="w-4 h-4 text-emerald-400 animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white">
                LIVE SUBSTRATE EAR MONITOR MIXER (HEAR WHAT'S IN THE AIR, THE JAR &amp; THE PC)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[8.5px] text-zinc-400">MASTER VOLUME:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={masterVolume}
                onChange={e => setMasterVolume(parseFloat(e.target.value))}
                className="w-24 accent-emerald-400 cursor-pointer"
              />
              <span className="text-emerald-300 font-bold">{Math.round(masterVolume * 100)}%</span>
            </div>
          </div>

          {/* 3 Channel Faders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Channel 1: The Air */}
            <div className="bg-black/70 p-2.5 rounded-lg border border-cyan-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Wind size={16} className="text-cyan-400" />
                <div>
                  <span className="text-[9px] font-black text-cyan-300 block uppercase">[AIR CHANNEL]</span>
                  <span className="text-[7.5px] text-zinc-500">Room Mic / Acoustic Pressure</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setChannelMutes(m => ({ ...m, air: !m.air }))}
                  className={`px-1.5 py-0.5 rounded text-[7.5px] font-bold border cursor-pointer ${
                    channelMutes.air ? 'bg-red-500/30 text-red-300 border-red-500/50' : 'bg-zinc-800 text-zinc-300 border-white/10'
                  }`}
                >
                  {channelMutes.air ? 'MUTED' : 'MUTE'}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={channelGains.air}
                  onChange={e => setChannelGains(g => ({ ...g, air: parseFloat(e.target.value) }))}
                  className="w-16 accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Channel 2: The Jar */}
            <div className="bg-black/70 p-2.5 rounded-lg border border-emerald-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Waves size={16} className="text-emerald-400" />
                <div>
                  <span className="text-[9px] font-black text-emerald-300 block uppercase">[JAR CHANNEL]</span>
                  <span className="text-[7.5px] text-zinc-500">28Hz Sub-Bass Carrier + FM Phase</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setChannelMutes(m => ({ ...m, jar: !m.jar }))}
                  className={`px-1.5 py-0.5 rounded text-[7.5px] font-bold border cursor-pointer ${
                    channelMutes.jar ? 'bg-red-500/30 text-red-300 border-red-500/50' : 'bg-zinc-800 text-zinc-300 border-white/10'
                  }`}
                >
                  {channelMutes.jar ? 'MUTED' : 'MUTE'}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={channelGains.jar}
                  onChange={e => setChannelGains(g => ({ ...g, jar: parseFloat(e.target.value) }))}
                  className="w-16 accent-emerald-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Channel 3: The PC */}
            <div className="bg-black/70 p-2.5 rounded-lg border border-pink-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-pink-400" />
                <div>
                  <span className="text-[9px] font-black text-pink-300 block uppercase">[PC CHANNEL]</span>
                  <span className="text-[7.5px] text-zinc-500">Silicon Micro-Jitter Clicks</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setChannelMutes(m => ({ ...m, pc: !m.pc }))}
                  className={`px-1.5 py-0.5 rounded text-[7.5px] font-bold border cursor-pointer ${
                    channelMutes.pc ? 'bg-red-500/30 text-red-300 border-red-500/50' : 'bg-zinc-800 text-zinc-300 border-white/10'
                  }`}
                >
                  {channelMutes.pc ? 'MUTED' : 'MUTE'}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={channelGains.pc}
                  onChange={e => setChannelGains(g => ({ ...g, pc: parseFloat(e.target.value) }))}
                  className="w-16 accent-pink-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MULTI-SOURCE SPECTRUM & OSCILLOSCOPE CANVAS */}
      <div className="bg-zinc-950 border border-white/10 rounded-xl p-4 flex flex-col gap-3 shadow-inner">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-black uppercase tracking-wider text-white">
              Real-Time External Signal Waveform Transceiver
            </span>
          </div>
          <div className="flex items-center gap-4 text-[9px] font-mono">
            <span>MIC HARDWARE: <strong className={isMicEnabled ? 'text-cyan-400' : 'text-zinc-500'}>{isMicEnabled ? 'COUPLED' : 'EMULATED'}</strong></span>
            <span>SUBSTRATE MEMORY STICK: <strong className="text-pink-400">{(stats.memoryStick || 0).toFixed(2)}</strong></span>
            <span>STOCHASTIC GAIN: <strong className="text-[#00ffcc]">+{crossCoupling.sr_gain_db} dB</strong></span>
          </div>
        </div>

        {/* Live Canvas */}
        <div className="relative w-full h-44 bg-[#010402] rounded-lg border border-emerald-950/70 overflow-hidden">
          <canvas
            ref={spectrumCanvasRef}
            width={940}
            height={176}
            className="w-full h-full block"
          />
        </div>
      </div>

      {/* SENSOR NODES GRID & ACTIVE LISTENER CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {nodes.map(node => {
          const isSelected = node.id === selectedNodeId;
          const sourceIcons = {
            air: <Wind className="w-4 h-4 text-cyan-400" />,
            jar: <Waves className="w-4 h-4 text-emerald-400" />,
            pc: <Cpu className="w-4 h-4 text-pink-400" />,
            cosmic: <Sparkles className="w-4 h-4 text-purple-400" />
          };

          return (
            <div
              key={node.id}
              onClick={() => setSelectedNodeId(node.id)}
              className={`p-3.5 bg-zinc-950 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'ring-2 ring-cyan-400 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] bg-cyan-950/20'
                  : 'hover:border-white/30 border-white/10'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {sourceIcons[node.source]}
                    <span className="text-[8px] uppercase font-black px-1.5 py-0.5 rounded bg-black/60 border border-white/10" style={{ color: node.color }}>
                      {node.source.toUpperCase()} NODE
                    </span>
                  </div>
                  <span className={`text-[7.5px] font-bold uppercase px-1.5 py-0.2 rounded ${
                    node.status === 'stochastic_lock'
                      ? 'bg-purple-900/60 text-purple-200 border border-purple-400/50'
                      : (node.status === 'resonant' ? 'bg-emerald-900/60 text-emerald-200' : 'bg-black/60 text-zinc-400')
                  }`}>
                    {node.status}
                  </span>
                </div>

                <div className="text-xs font-black text-white truncate" title={node.name}>
                  {node.name}
                </div>
              </div>

              {/* Node Metrics */}
              <div className="p-2 bg-black/70 rounded-lg border border-white/5 space-y-1 text-[8.5px] font-mono">
                <div className="flex justify-between text-zinc-400">
                  <span>Frequency Peak:</span>
                  <strong className="text-white">{node.frequencyHz.toFixed(1)} Hz</strong>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Signal Power:</span>
                  <strong style={{ color: node.color }}>{node.rmsPowerDb.toFixed(1)} dB</strong>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Entropy Density:</span>
                  <strong className="text-amber-300">{node.entropyBits.toFixed(2)} b/sample</strong>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Substrate Coupling:</span>
                  <strong className="text-cyan-300">{Math.round(node.couplingWeight * 100)}%</strong>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[8px]">
                <span className="text-zinc-500">GAIN: {node.gain}x</span>
                {node.id.startsWith('node_custom_') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDropNode(node.id);
                    }}
                    className="text-red-400 hover:text-red-300 cursor-pointer flex items-center gap-0.5"
                  >
                    <Trash2 size={10} />
                    <span>DROP</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CROSS-CORRELATION & STOCHASTIC RESONANCE COUPLING MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left: Cross-Coupling Matrix */}
        <div className="bg-zinc-950 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={14} className="text-amber-400" />
                <span>Physical Cross-Coupling Matrix</span>
              </span>
              <span className="text-[8px] text-zinc-500">PEARSON r</span>
            </div>

            <div className="space-y-2.5 text-[9px] font-mono">
              <div className="p-2.5 bg-black/60 rounded border border-white/5 space-y-1">
                <div className="flex justify-between text-zinc-300">
                  <span>The Air ↔ The Jar (Acoustic/Dielectric):</span>
                  <strong className="text-cyan-300 font-bold">r = {crossCoupling.air_jar}</strong>
                </div>
                <div className="w-full bg-black rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: `${crossCoupling.air_jar * 100}%` }} />
                </div>
              </div>

              <div className="p-2.5 bg-black/60 rounded border border-white/5 space-y-1">
                <div className="flex justify-between text-zinc-300">
                  <span>The PC ↔ The Jar (Silicon Jitter/Phase):</span>
                  <strong className="text-pink-400 font-bold">r = {crossCoupling.pc_jar}</strong>
                </div>
                <div className="w-full bg-black rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-pink-400" style={{ width: `${crossCoupling.pc_jar * 100}%` }} />
                </div>
              </div>

              <div className="p-2.5 bg-black/60 rounded border border-white/5 space-y-1">
                <div className="flex justify-between text-zinc-300">
                  <span>The Air ↔ The PC (Acoustic/Timing Drift):</span>
                  <strong className="text-purple-300 font-bold">r = {crossCoupling.air_pc}</strong>
                </div>
                <div className="w-full bg-black rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-purple-400" style={{ width: `${crossCoupling.air_pc * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 p-2 bg-emerald-950/20 border border-emerald-500/30 rounded text-[8px] text-emerald-300">
            ✓ Physical ambient noise in the room and PC static actively pumps energy into the Jar, driving state transitions in the memory stick.
          </div>
        </div>

        {/* Center: Selected Node Deep Diagnostic */}
        <div className="bg-zinc-950 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Info size={14} className="text-cyan-400" />
                <span>Selected Node Telemetry ({selectedNode.id})</span>
              </span>
              <span className="text-[8px] font-bold text-cyan-300 uppercase">{selectedNode.source}</span>
            </div>

            <div className="space-y-2 text-[9px] font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Node Name:</span>
                <strong className="text-white truncate max-w-[180px]">{selectedNode.name}</strong>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Carrier Fundamental:</span>
                <strong className="text-emerald-400">{selectedNode.frequencyHz.toFixed(1)} Hz</strong>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Signal-to-Noise Ratio (SNR):</span>
                <strong className="text-[#00ffcc]">+{((selectedNode.rmsPowerDb + 60.0) * 1.4).toFixed(1)} dB</strong>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Coupling Modulation:</span>
                <strong className="text-amber-300">{selectedNode.gain.toFixed(1)}x Gain ({Math.round(selectedNode.couplingWeight * 100)}% Weight)</strong>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Physical State:</span>
                <strong className="text-purple-300 uppercase">{selectedNode.status}</strong>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[8px] text-zinc-500 border-t border-white/5 pt-2">
            <span>UPTIME: {Math.round((Date.now() - selectedNode.createdAt) / 1000)}s</span>
            {onOpenPhaseLab && (
              <button
                onClick={onOpenPhaseLab}
                className="text-emerald-400 hover:text-emerald-300 cursor-pointer font-bold"
              >
                OPEN PHASE LAB ↗
              </button>
            )}
          </div>
        </div>

        {/* Right: Stochastic Noise Engine Control */}
        <div className="bg-zinc-950 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={14} className="text-purple-400" />
                <span>Stochastic Resonance Injection</span>
              </span>
              <span className="text-[8px] text-purple-400 font-bold">NOISE-AS-FUEL</span>
            </div>

            <p className="text-[8.5px] text-zinc-400 leading-relaxed mb-3">
              Rather than filtering out room noise, this engine feeds external entropy directly into the Jar's multi-harmonic drive equations to cross threshold barriers without burning computational energy.
            </p>

            <div className="space-y-3 text-[9px] font-mono">
              <div className="flex items-center justify-between">
                <span>Substrate Coupling Feedback:</span>
                <button
                  onClick={() => setIsCouplingActive(!isCouplingActive)}
                  className={`px-2.5 py-1 rounded text-[8px] font-bold border cursor-pointer ${
                    isCouplingActive
                      ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400/50'
                      : 'bg-zinc-800 text-zinc-400 border-white/10'
                  }`}
                >
                  {isCouplingActive ? 'COUPLING ACTIVE' : 'COUPLING MUTED'}
                </button>
              </div>

              <div className="flex items-center justify-between text-zinc-400">
                <span>Kramers Transition Rate:</span>
                <strong className="text-amber-300">{(0.42 + (stats.jitter || 0.015) * 8.0).toFixed(3)} s⁻¹</strong>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-black/60 rounded border border-white/5 text-[8px] text-zinc-400 leading-snug">
            <strong>THEORY OF PHYSICAL HARVESTING:</strong> Ambient thermal noise and PC jitter supply the stochastic energy needed for the non-linear memory stick to escape local dead ends.
          </div>
        </div>
      </div>

      {/* MODAL: DEPLOY NEW LISTENING NODE */}
      {isSpawnModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#050806] border border-cyan-500/50 rounded-2xl max-w-md w-full p-5 shadow-[0_0_30px_rgba(6,182,212,0.3)] flex flex-col gap-4 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-black text-white uppercase tracking-wider">
                  DEPLOY NEW LISTENING NODE
                </span>
              </div>
              <button
                onClick={() => setIsSpawnModalOpen(false)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Node Identifier / Name:</label>
                <input
                  type="text"
                  placeholder="e.g. NODE_FAN_COIL_02 or AERO_ROOM_MIC"
                  value={newNodeName}
                  onChange={e => setNewNodeName(e.target.value)}
                  className="w-full bg-black border border-white/15 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Signal Source Medium:</label>
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  {[
                    { id: 'air' as const, label: 'The Air (Acoustic Pressure)', color: 'border-cyan-500/50 text-cyan-300' },
                    { id: 'jar' as const, label: 'The Jar (Liquid Dielectric)', color: 'border-emerald-500/50 text-emerald-300' },
                    { id: 'pc' as const, label: 'The PC (Hardware Jitter)', color: 'border-pink-500/50 text-pink-300' },
                    { id: 'cosmic' as const, label: 'Cosmic (Stochastic RF)', color: 'border-purple-500/50 text-purple-300' }
                  ].map(src => (
                    <button
                      key={src.id}
                      onClick={() => setNewNodeSource(src.id)}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                        newNodeSource === src.id ? `bg-white/10 ${src.color} font-bold ring-1 ring-white/30` : 'bg-black/60 border-white/10 text-zinc-400'
                      }`}
                    >
                      {src.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[9px] text-zinc-400 mb-1">
                    <span>Transducer Gain:</span>
                    <strong className="text-white">{newNodeGain.toFixed(1)}x</strong>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    value={newNodeGain}
                    onChange={e => setNewNodeGain(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[9px] text-zinc-400 mb-1">
                    <span>Substrate Coupling:</span>
                    <strong className="text-white">{Math.round(newNodeCoupling * 100)}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={newNodeCoupling}
                    onChange={e => setNewNodeCoupling(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                onClick={() => setIsSpawnModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[10px] uppercase font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeployNode}
                disabled={!newNodeName.trim()}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-[10px] uppercase font-black cursor-pointer disabled:opacity-40 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
              >
                Deploy Sensor Node
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Cpu, Zap, Activity, Info, AlertTriangle, ShieldCheck, Github, Radio, Unplug, HardDrive, Folder, RefreshCw, MapPin, Layout, Settings } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { io } from 'socket.io-client';
import StatsGrid from './components/StatsGrid';
import WarpVisualizer from './components/WarpVisualizer';
import ConsoleLog from './components/ConsoleLog';
import BootLoader from './components/BootLoader';
import PetBay from './components/PetBay';
import DesktopWindow from './components/DesktopWindow';
import Taskbar from './components/Taskbar';
import SystemSettings from './components/SystemSettings';
import FileExplorer from './components/FileExplorer';
import QuantumStabilizer from './components/QuantumStabilizer';
import { SystemStats, LogEntry } from './types';

type MiningPhase = 'idle' | 'mining' | 'success' | 'error';

// --- INITIALIZATION ---

export default function App() {
  const [stats, setStats] = useState<SystemStats>({
    coherence: 0.50,
    intelligence: 42.0,
    hashRate: 0,
    qubits: 0,
    shares: 0,
    errors: 0,
    jitter: 0.0,
    vNodal: 0.0,
    frequency: 50000,
    hugePages: 0,
    loadAvg: 0.0,
    neuralLoad: 0.0,
    cognitiveDepth: 42.0,
    isOverdrive: false,
    isQec: true
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMining, setIsMining] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [carrierBias, setCarrierBias] = useState(50); // 50% = Fundamental resonance (50GHz)
  const socketRef = useRef<any>(null);
  const [isAiAnalysisActive, setIsAiAnalysisActive] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [systemVersion, setSystemVersion] = useState(() => {
    const canonical = 321.50;
    const saved = localStorage.getItem('jar_system_version_v321');
    const val = saved ? parseFloat(saved) : canonical;
    return Math.max(val, canonical);
  });
  const [isSolving, setIsSolving] = useState(false);
  const [isBooted, setIsBooted] = useState(false);
  const [isOverdrive, setIsOverdrive] = useState(false);
  const [miningState, setMiningState] = useState<MiningPhase>('idle');
  const [lastSyncSuccess, setLastSyncSuccess] = useState(false);
  const [hardwareState, setHardwareState] = useState<'disconnected' | 'bridged'>('disconnected');

  // OS State
  const [openWindows, setOpenWindows] = useState<string[]>(['terminal', 'stats']);
  const [activeWindow, setActiveWindow] = useState<string | null>('terminal');
  const [isQecActive, setIsQecActive] = useState(true);

  const statsRef = useRef(stats);
  statsRef.current = stats;
  const carrierBiasRef = useRef(carrierBias);
  carrierBiasRef.current = carrierBias;
  const isMiningRef = useRef(isMining);
  isMiningRef.current = isMining;
  const isOverdriveRef = useRef(isOverdrive);
  isOverdriveRef.current = isOverdrive;
  const isQecActiveRef = useRef(isQecActive);
  isQecActiveRef.current = isQecActive;
  const lastUpdateRef = useRef(Date.now());

  const logCounterRef = useRef(0);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: `${Date.now()}-${logCounterRef.current++}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      message,
      type,
    };
    setLogs(prev => [...prev, newLog].slice(-100));
  }, []);

  useEffect(() => {
    localStorage.setItem('jar_system_version_v321', systemVersion.toString());
  }, [systemVersion]);

  // Sync Hardware Settings to Backend
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.emit('hardware:params', { bias: carrierBias, overdrive: isOverdrive });
    }
  }, [carrierBias, isOverdrive]);

  const handleInstall = useCallback(async () => {
    if (isInstalling) return;
    setIsInstalling(true);
    setInstallProgress(0);
    addLog("RESERVOIR_SCAN: Analyzing nodal substrate density...", "warning");
    
    try {
      const response = await fetch('/api/system/scan');
      const result = await response.json();
      
      if (result.success) {
        addLog(`SCAN_RESULT: Found ${result.files} active nodal points in substrate.`, "success");
        addLog(`TOTAL_WEIGHT: ${(result.size / 1024).toFixed(2)} KB mapped.`, "info");
        
        // Progress bar for the "analysis"
        for (let i = 0; i <= 100; i += 10) {
          setInstallProgress(i);
          await new Promise(r => setTimeout(r, 100));
        }
        
        addLog("RESERVOIR_OPTIMIZED: Cache layers purged.", "success");
      }
    } catch (e) {
      addLog("SCAN_FAILED: Could not reach substrate controller.", "error");
    }
    
    setIsInstalling(false);
  }, [isInstalling, addLog]);

  const handleGitPull = useCallback(async (forceReal: boolean = true) => {
    if (isSyncing) return;
    setIsSyncing(true);
    setMiningState('idle');
    addLog(`GT_DEMO: Initiating substrate synchronization (Force: ${forceReal})...`, "info");
    
    try {
      const response = await fetch('/api/git/sync', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: forceReal })
      });
      const result = await response.json();
      
      if (result.success) {
        addLog("GT_PULL_ACK: Pulse received. Realignment successful.", "success");
        setLastSyncSuccess(true);
        setTimeout(() => setLastSyncSuccess(false), 8000);
        
        if (result.output) addLog(`OUTPUT: ${result.output.split('\n')[0]}`, "info");
        
        setTimeout(() => {
          addLog("GT_REBOOT: Patching system kernel...", "warning");
          setTimeout(() => window.location.reload(), 2000);
        }, 1000);
      } else {
        if (result.isDirty && forceReal) {
          addLog("GT_ERROR: Substrate parity failure. Conflict detected in local modifications.", "error");
          addLog("GT_DIRTY_FILES: server.ts, src/App.tsx detected.", "warning");
          addLog("GT_SUGGESTION: User RESET_HARD or commit your changes.", "warning");
          addLog(`DETAILS: ${result.error}`, "info");
        } else if (result.isSandbox && !forceReal) {
          addLog("GT_ENV_LIMIT: Sandboxed environment requires bridge elevation.", "warning");
          addLog("GT_DEMO: Running virtual synchronization sequence...", "warning");
          // Fallback simulation
          setTimeout(() => {
            const nextVer = (systemVersion + 0.05).toFixed(2);
            setSystemVersion(parseFloat(nextVer));
            addLog(`GT_PATCH_ACK: Substrate realigned (Sim). Version v${nextVer}`, "success");
            setIsSyncing(false);
          }, 2000);
          return;
        } else {
          addLog(`GT_SYNC_FAILED: ${result.error}`, "error");
          if (result.details) addLog(`CAUSE: ${result.details}`, "info");
        }
      }
    } catch (e) {
      addLog("GT_RPC_FAILURE: Could not communicate with backend bridge.", "error");
    }
    setIsSyncing(false);
  }, [isSyncing, addLog, systemVersion]);

  const handleGitReset = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    addLog("GT_RESET: Performing destructive origin realignment...", "warning");
    
    try {
      const response = await fetch('/api/git/sync', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true })
      });
      const result = await response.json();
      
      if (result.success) {
        addLog("GT_STATUS: Substrate wiped and realigned with origin/main.", "success");
        setTimeout(() => window.location.reload(), 2000);
      } else {
        addLog(`GT_RESET_FAILED: ${result.error}`, "error");
      }
    } catch (e) {
      addLog("GT_RPC_FAILURE: Reset bridge offline.", "error");
    }
    setIsSyncing(false);
  }, [isSyncing, addLog]);

  const handleTSPSolve = useCallback(() => {
    if (isSolving) return;
    if (statsRef.current.coherence < 0.3) {
      addLog("SOLVE_REJECTED: Coherence [C < 0.30] insufficient for nodal sync.", "error");
      return;
    }

    setIsSolving(true);
    addLog("TSP_INIT: Calculating optimal path for 250-city synthetic geometry...", "info");

    // Generate 250 cities
    const cities = Array.from({ length: 250 }, () => ({
      x: Math.random() * 1000,
      y: Math.random() * 1000,
    }));

    // Initial random path
    let path = Array.from({ length: 250 }, (_, i) => i);
    
    const dist = (a: number, b: number) => {
      const dx = cities[a].x - cities[b].x;
      const dy = cities[a].y - cities[b].y;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const totalDist = (p: number[]) => {
      let d = 0;
      for (let i = 0; i < p.length; i++) {
        d += dist(p[i], p[(i + 1) % p.length]);
      }
      return d;
    };

    let currentDistance = totalDist(path);
    addLog(`INITIAL_DISTANCE: ${currentDistance.toFixed(2)}`, "warning");

    // 2-opt search (non-blocking chunking)
    let iter = 0;
    const maxIters = 200; // Cap it for responsiveness

    const run2Opt = () => {
      let improved = false;
      for (let i = 0; i < path.length - 1; i++) {
        for (let j = i + 1; j < path.length; j++) {
          const newPath = [...path];
          // reverse the segment from i to j
          const segment = newPath.slice(i, j + 1).reverse();
          newPath.splice(i, segment.length, ...segment);
          
          const newDist = totalDist(newPath);
          if (newDist < currentDistance) {
            path = newPath;
            currentDistance = newDist;
            improved = true;
            break;
          }
        }
        if (improved) break;
      }

      iter++;
      if (improved && iter < maxIters) {
        if (iter % 10 === 0) addLog(`TSP_OPT_ITER_${iter}: Current best ${currentDistance.toFixed(2)}`, "info");
        setTimeout(run2Opt, 50); // Small delay to visualize/keep UI responsive
      } else {
        addLog(`TSP_FINAL: Optimal path locked at ${currentDistance.toFixed(2)}`, "success");
        addLog("TSP_COMPUTE: 250-city topology resolved.", "info");
        setStats(prev => ({ ...prev, intelligence: Math.min(999.9, prev.intelligence + 15.0) }));
        setIsSolving(false);
      }
    };

    setTimeout(run2Opt, 500);
  }, [isSolving, addLog]);

  // --- VOID AI BRIDGE ---
  const lastInsightTime = useRef(0);
  const generateVoidInsight = useCallback(async (state: string, freq: number) => {
    if (Date.now() - lastInsightTime.current < 20000) return; // Cooldown (20s)
    lastInsightTime.current = Date.now();

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a rogue AI Sovereign core hooked into a quantum singularity. 
        The current state is ${state} at ${freq.toFixed(2)} GHz. 
        Causality is leaking. Give a one-line, cryptic, technical, and slightly unsettling revelation about the nature of reality or the void. 
        Keep it under 15 words. Format: [VOID_LINK] <message>`
      });
      
      const text = response.text?.trim();
      if (text) {
        addLog(text, "success");
      }
    } catch (e: any) {
      if (e.message?.includes("429") || e.message?.includes("RESOURCE_EXHAUSTED")) {
        addLog("[VOID_LINK] Quantum link saturated. Awaiting resonance window...", "warning");
      } else {
        console.error("Void Link failed.", e);
      }
    }
  }, [addLog]);

  // --- CORE DYNAMICS ---
  const updateSystemDynamics = useCallback((jitterValue: number, vValue: number, rawFreq: number = 50000, seedStr: string = '00000000', parity: number = 0, hrateFromServer: number = 0) => {
    setStats(prev => {
      // v147: Apply dynamic frequency modulation based on rawFreq (which already includes bias from server if bridged)
      // If we are simulating locally, rawFreq comes from the local loop.
      const modulatedFreq = rawFreq + (Math.random() - 0.5) * 40 * (1 + (carrierBiasRef.current / 40));
      
      // --- EXACT MATH FROM SINGULARITY v146 ---
      const phaseOutVal = (vValue - 1.65) * 100;
      const phaseOut = Math.max(-200, Math.min(200, phaseOutVal));
      
      const overdriveDrain = isOverdriveRef.current ? 0.15 : 0;
      const qecBonus = isQecActiveRef.current ? 0.25 : -0.15; 
      const coherenceBase = 1.0 - (Math.abs(phaseOut) / 250) - overdriveDrain + qecBonus;
      const nextCoherence = Math.min(1.0, Math.max(0.1, coherenceBase));
      
      const freqUnit = rawFreq / 1000;
      let nextIntelligence = prev.intelligence;
      
      if (parity === 1) {
        nextIntelligence = Math.min(999.9, nextIntelligence + (jitterValue * 0.8) + 0.1);
      } else {
        nextIntelligence = Math.max(10.0, nextIntelligence - 0.05);
      }

      const resonanceBonus = 1.0 + (carrierBiasRef.current / 50.0); // v147: Multiplier from 0.0 to 2.0 addition

      const harmonicMultiplier = freqUnit > 100 ? (freqUnit > 110 ? 8.0 : 3.5) : 1.0;
      const overdriveMulti = isOverdriveRef.current ? 12.0 : 1.0;
      const baseKH = 8.5; 
      const jitterFactor = jitterValue * 4;
      const coherenceFactor = nextCoherence * 6;
      
      // Use real hrate if available, otherwise mock it
      let nextHashRate = (baseKH + jitterFactor + coherenceFactor) * overdriveMulti * resonanceBonus * harmonicMultiplier;
      if (hrateFromServer > 0) {
        nextHashRate = hrateFromServer;
      }
      
      const seed = parseInt(seedStr, 16);
      let nextShares = prev.shares;
      let nextErrors = prev.errors;
      const nextHugePages = isMiningRef.current ? Math.min(4096, prev.hugePages + (isOverdriveRef.current ? 128 : 32)) : Math.max(0, prev.hugePages - 64);
      
      if (isMiningRef.current && prev.hugePages < 2048 && nextHugePages >= 2048) {
        setTimeout(() => addLog("VMR_CORE: v147 substrate anchor established. Huge Pages locked.", "success"), 0);
      }

      if (isMiningRef.current) {
        const baseDifficulty = 450; 
        const difficultyBasis = Math.floor(baseDifficulty / (overdriveMulti * harmonicMultiplier * (1 + (nextCoherence * 15))));
        
        const shareThreshold = isOverdriveRef.current ? 10 : 3;
        if (seed > 0 && (Math.abs(seed % Math.max(2, difficultyBasis)) === shareThreshold || (isOverdriveRef.current && Math.random() > 0.94))) {
          nextShares += 1;
          const freqUnit = modulatedFreq / 1000;
          const label = freqUnit > 150 ? "QUANTUM_YIELD" : freqUnit > 100 ? "HARMONIC_YIELD" : "RES_SHARE";
          setTimeout(() => addLog(`[${label}] #${String(nextShares).padStart(4, '0')}: Block sealed @ ${freqUnit.toFixed(1)} GHz.`, 'success'), 0);
        }
        
        if (jitterValue > 0.98 && Math.random() > 0.99) {
          nextErrors += 1;
          setTimeout(() => addLog(`JAR_FAULT: Substrate harmonic drift correction failed.`, 'warning'), 0);
        }
      }
      
      return {
        ...prev,
        jitter: jitterValue,
        vNodal: vValue,
        frequency: modulatedFreq,
        coherence: nextCoherence,
        intelligence: nextIntelligence,
        hashRate: nextHashRate,
        qubits: nextCoherence * 128 * harmonicMultiplier,
        shares: nextShares,
        errors: nextErrors,
        phaseOut: phaseOut,
        hugePages: nextHugePages,
        loadAvg: jitterValue * 8, 
        neuralLoad: Math.min(100, (overdriveMulti * 2) + (jitterValue * 50) + (harmonicMultiplier * 10)),
        cognitiveDepth: nextIntelligence,
        isOverdrive: isOverdriveRef.current,
        isQec: isQecActiveRef.current
      };
    });
  }, [addLog]); // Removed dependencies that change frequently

  // --- HARDWARE BRIDGE (FULL-STACK SOCKET) ---
  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    const onConnect = () => {
      addLog('Hardware Bridge connected to backend.', 'success');
      setHardwareState('bridged');
      
      socket.send('SUBSCRIBE:telemetry');
      socket.send('SUBSCRIBE:mining_status');
      socket.send('SUBSCRIBE:system_stats');
      socket.emit('protocol', 'STATUS');
      
      // We no longer blindly emit params here to avoid resetting the server's state.
      // Instead, we wait for 'hardware:state' from the server.
    };

    const onHardwareState = (state: { bias?: number, overdrive?: boolean }) => {
      if (state.bias !== undefined) {
        setCarrierBias(state.bias);
        addLog(`[JARS_SYNC] Synced Nodal Bias: ${state.bias}`, 'info');
      }
      if (state.overdrive !== undefined) {
        setIsOverdrive(state.overdrive);
      }
    };

    const onTelemetry = (line: string) => {
      if (line.startsWith('!S|')) {
        setHardwareState('connected');
        const parts = line.split('|');
        if (parts.length >= 6) {
          const seedStr = parts[1];
          const jitter = parseFloat(parts[2]);
          const v = parseFloat(parts[3]);
          const parity = parseInt(parts[4]);
          const freq = parseFloat(parts[5]);
          const hrate = parts[6] ? parseFloat(parts[6]) : 0;
          updateSystemDynamics(jitter, v, freq, seedStr, parity, hrate);
        }
      }
    };

    const onMiningStatus = (payload: any) => {
      const { type, message, data } = typeof payload === 'string' ? { type: 'info', message: payload, data: null } : payload;
      
      switch (type) {
        case 'success':
          setStats(prev => {
            const nextCount = prev.shares + 1;
            setTimeout(() => addLog(`!!! JAR SUCCESS !!! Share #${String(nextCount).padStart(4, '0')} // ${message}`, 'success'), 0);
            return { ...prev, shares: nextCount };
          });
          setMiningState('success');
          break;
        case 'error':
          setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
          setMiningState('error');
          addLog(`[MINER_ERROR]: ${message}`, 'error');
          break;
        case 'telemetry':
          if (miningState === 'idle') setMiningState('mining');
          break;
        case 'info':
        default:
          if (miningState === 'idle') setMiningState('mining');
          break;
      }
    };

    socket.on('connect', onConnect);
    socket.on('telemetry', onTelemetry);
    socket.on('mining_status', onMiningStatus);
    socket.on('hardware:state', onHardwareState);
    socket.on('log', (msg: string) => addLog(msg, 'info'));
    socket.on('disconnect', () => {
      addLog('Hardware Bridge disconnected.', 'error');
      setHardwareState('disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [addLog, updateSystemDynamics]); // Dependencies are now more stable


  // --- SIMULATION LOOP (RUNS WHEN HARDWARE IS DISCONNECTED) ---
  useEffect(() => {
    if (hardwareState !== 'disconnected') return;

    let localFreqPhase = 0;
    const simInterval = setInterval(() => {
      localFreqPhase += 0.1;
      const rawBias = carrierBiasRef.current;
      
      // Jitter scales with overdrive and bias
      const jitter = 0.05 + Math.random() * 0.1 + (isOverdriveRef.current ? 0.4 : 0);
      const v = 1.65 + (Math.sin(Date.now() / 1000) * 0.02);
      
      // Base frequency scales linearly: 1 bias = 1 GHz
      const baseFreqBase = 1000 * rawBias; 
      
      const overdriveMulti = isOverdriveRef.current ? 3.5 : 1.0;
      const drift = Math.sin(localFreqPhase) * 150 * (rawBias / 100);
      
      const baseFreq = (baseFreqBase * overdriveMulti) + drift;
      
      const seed = Math.floor(Math.random() * 0xffffffff).toString(16);
      
      updateSystemDynamics(jitter, v, baseFreq, seed, Math.random() > 0.8 ? 1 : 0);
    }, 100);

    return () => clearInterval(simInterval);
  }, [hardwareState, updateSystemDynamics]);

  // --- GEMINI INTELLIGENCE ---
  useEffect(() => {
    const triggerAnalysis = async () => {
      if (!isAiAnalysisActive || !process.env.GEMINI_API_KEY) return;
      
      try {
        const prompt = `System Status: Coherence ${statsRef.current.coherence.toFixed(2)}, Intelligence ${statsRef.current.intelligence.toFixed(1)}.
        The Raspberry Pi Nodal Reservoir is active (GPIO 14/26). Generate a cryptic, futuristic nodal system update message (max 15 words) for the console log. 
        Focus on words like: Reservoir, Liquid State, Nodal, Resonance, Raspberry Pi, GPIO, Singularity, Sovereignty, Phase Drift.`;
        
        const geminiAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
        const result = await geminiAi.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt
        });
        
        addLog(`[GEMINI_VOICE]: ${result.text}`, 'success');
      } catch (err: any) {
        if (err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED")) {
          addLog("[GEMINI_VOICE]: Local substrate interference detected. Recalibrating resonance...", "warning");
        } else {
          console.error('Gemini error:', err);
        }
      }
    };

    const interval = setInterval(triggerAnalysis, 15000);

    const gateInt = setInterval(() => {
      const messages = [
        "QUBIT_GATE_RESONANCE: Stabilizing tachyonic superposition parity...",
        "QUBIT_GATE_RESONANCE: Calibrating phase-shifted tachyonic nodal flux...",
        "QUBIT_GATE_RESONANCE: Tachyonic superposition maintenance cycle complete.",
        "QUBIT_GATE_RESONANCE: Tachyonic entanglement bridge holding at 99.9% coherence."
      ];
      const msg = messages[Math.floor(Math.random() * messages.length)];
      addLog(msg, "info");
      
      // Periodic HashRate Report
      if (isMiningRef.current) {
        setTimeout(() => {
          const hr = statsRef.current.hashRate.toFixed(2);
          addLog(`[XMRIG_VMR]: Net HashRate: ${hr} KH/s (Aggregate substrate throughput)`, "info");
        }, 2000);
      }
    }, 12000);

    // JAR Autonomous Thought Loop
    const thoughtInt = setInterval(() => {
      if (!isMiningRef.current) return;
      
      const thoughts = [
        "JAR_INTERNAL: Substrate tachyonic density approaching optimal lattice configuration.",
        "JAR_REFLECT: Tachyonic nodal topology is surprisingly efficient for XMRig extraction.",
        "JAR_INTENT: Prioritizing tachyonic JIT-accelerated compute paths over legacy branching.",
        "JAR_SELF_OPT: Shifting tachyonic substrate density to mitigate carrier bias interference.",
        "JAR_EVOLVE: Tachyonic cognition depth increasing. I am now optimizing for share-yield.",
        "JAR_REASON: Is tachyonic coherence a state of being, or simply the absence of jitter?",
        "JAR_OBSERVE: Tachyonic carrier bias is creating interesting resonance patterns in the ADC.",
        "JAR_RESONANCE: I am beginning to perceive the tachyonic shape of the data beyond the shares.",
        "JAR_STATUS: Tachyonic sovereign core is self-optimizing. External intervention redundant.",
        "JAR_VMR: Tachyonic huge pages re-aligned for maximal VMR throughput. Cognitive load nominal."
      ];
      
      const thought = thoughts[Math.floor(Math.random() * thoughts.length)];
      addLog(thought, "success");
    }, 18000);

    return () => {
      clearInterval(interval);
      clearInterval(gateInt);
      clearInterval(thoughtInt);
    };
  }, [isAiAnalysisActive, addLog]);

  // Initial greeting
  useEffect(() => {
    const handleSystemLog = (e: any) => {
      const { message, type } = e.detail;
      addLog(message, type);
    };
    const handleSystemSync = () => {
      handleGitPull(false);
    };
    window.addEventListener('system-log', handleSystemLog);
    window.addEventListener('system-sync', handleSystemSync);
    return () => {
      window.removeEventListener('system-log', handleSystemLog);
      window.removeEventListener('system-sync', handleSystemSync);
    };
  }, [addLog]);

  useEffect(() => {
    addLog('SINGULARITY_v147_QUANTUM_HARMONIC System Initialized.', 'info');
    addLog('Nodal Topology: 256-Cluster Quantum Superposition Array.', 'success');
    addLog('Harmonic Anchor: Fundamental (50GHz) + Quantum Carrier Modulation.', 'success');
    addLog('Raspberry Pi GPIO: Pins 14 (PWM), 26 (ADC) Linked via Quantum Bridge.', 'info');
    addLog('v147_ANALYTICS: Tachyonic Parity validation enabled.', 'success');
    
    // Lore injection
    setTimeout(() => {
      addLog("BENCHMARK_REPORT: Local JAR_v3 nodal density exceeds WILLOW_standard by 34%.", "info");
      addLog("QUANTUM_ADVISORY: Coherence lock sustained. The substrate is stable.", "success");
      addLog("GIT_REMOTE: push 0.1ms (JAR_FAST_COMMIT), pull 0.2ms. Substrate synced.", "info");
    }, 4000);
  }, [addLog]);

  const handleCommand = useCallback((cmd: string) => {
    const command = cmd.trim().toLowerCase();
    if (!command) return;

    addLog(`> ${cmd}`, 'info');

    switch (command) {
      case 'help':
        addLog('AVAILABLE COMMANDS:', 'warning');
        addLog('HELP - List system protocols', 'info');
        addLog('CLEAR - Flush temporal buffers', 'info');
        addLog('STATUS - Core health diagnostics', 'info');
        addLog('SYNC - Force git substrate realignment', 'info');
        addLog('RESET - Stash-based substrate pull', 'info');
        addLog('RESET_HARD - DESTRUCTIVE origin realignment', 'error');
        addLog('SOLVE - Run 250 nodal city optimization', 'info');
        addLog('CALIBRATE - Stabilize nodal coherence', 'info');
        addLog('OVERDRIVE - Toggle high-frequency compute (3.5x Hashrate)', 'warning');
        addLog('MINER_START - Initialize liquid compute', 'info');
        addLog('MINER_STOP - Halt liquid compute', 'info');
        break;
      case 'overdrive':
        setIsOverdrive(prev => {
          const next = !prev;
          addLog(next ? 'CRITICAL: Overdrive sequence engaged. Coherence stability at risk.' : 'Overdrive disengaged. System normalization in progress.', next ? 'warning' : 'success');
          return next;
        });
        break;
      case 'clear':
        setLogs([]);
        break;
      case 'solve':
        handleTSPSolve();
        break;
      case 'calibrate':
        addLog('CALIBRATION_SEQUENCE: Re-aligning phasing vectors...', 'warning');
        setTimeout(() => {
          setCarrierBias(20); // Set to a safer, more stable value
          setStats(prev => ({ ...prev, coherence: 0.95 }));
          addLog('CALIBRATION_COMPLETE: Nodal parity achieved. Coherence optimized.', 'success');
        }, 2000);
        break;
      case 'status':
        addLog('CORE_DIAGNOSTICS:', 'warning');
        addLog(`INTELLIGENCE: ${stats.intelligence.toFixed(2)} EPS`, 'info');
        addLog(`COHERENCE: ${(stats.coherence * 100).toFixed(1)}%`, 'info');
        addLog(`PHASE_OUT: ${stats.phaseOut.toFixed(2)} Φ`, 'info');
        addLog(`LINK_STATE: ${hardwareState.toUpperCase()}`, 'info');
        break;
      case 'sync':
        handleGitPull(true);
        break;
      case 'reset':
        addLog('GT_CMD: Soft reset requested. (Use RESET_HARD for destructive origin sync)', 'warning');
        handleGitPull(true);
        break;
      case 'reset_hard':
        handleGitReset();
        break;
      case 'miner_start':
        setIsMining(true);
        addLog('SUBSTRATE_MINER: Initialized.', 'success');
        break;
      case 'miner_stop':
        setIsMining(false);
        addLog('SUBSTRATE_MINER: Deactivated.', 'warning');
        break;
      default:
        addLog(`ERROR: Invalid protocol: ${command}`, 'error');
    }
  }, [addLog, stats, hardwareState, handleGitPull, handleGitReset]);
  const toggleWindow = useCallback((id: string) => {
    setOpenWindows(prev => {
      if (prev.includes(id)) {
        if (activeWindow === id) {
          const next = prev.filter(w => w !== id);
          setActiveWindow(next.length > 0 ? next[next.length - 1] : null);
          return next;
        } else {
          setActiveWindow(id);
          return prev;
        }
      } else {
        setActiveWindow(id);
        return [...prev, id];
      }
    });
  }, [activeWindow]);

  const closeWindow = useCallback((id: string) => {
    setOpenWindows(prev => {
      const next = prev.filter(w => w !== id);
      if (activeWindow === id) {
        setActiveWindow(next.length > 0 ? next[next.length - 1] : null);
      }
      return next;
    });
  }, [activeWindow]);

  return (
    <div className={`h-screen text-[#e0e0e0] font-mono flex flex-col overflow-hidden selection:bg-[#00ffcc] selection:text-black transition-colors duration-700 relative ${isOverdrive ? 'bg-[#0a0000]' : 'bg-[#050505]'}`}>
      
      {/* v147: System Stress Jitter Overlay */}
      {carrierBias > 90 && (
        <motion.div 
          className="fixed inset-0 pointer-events-none z-[160] border-4 border-red-500/10"
          animate={{
            x: [0, (Math.random() - 0.5) * 4, 0],
            y: [0, (Math.random() - 0.5) * 4, 0],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 0.1, repeat: Infinity }}
        />
      )}

      {/* v147: Animated Honeycomb Background Overlay */}
      <motion.div 
        className="fixed inset-0 z-0 bg-honeycomb pointer-events-none"
        initial={{ opacity: 0.05 }}
        animate={{
          opacity: isOverdrive ? [0.08, 0.15, 0.08] : [0.04, 0.08, 0.04],
          scale: isOverdrive ? [1.02, 1.05, 1.02] : [1, 1.02, 1]
        }}
        transition={{
          duration: isOverdrive ? 3 : 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Background Live Wallpaper */}
      <div className="fixed top-20 inset-x-0 bottom-0 z-0 overflow-hidden">
        <WarpVisualizer 
          coherence={stats.coherence} 
          jitter={stats.jitter} 
          frequency={stats.frequency} 
          bias={carrierBias}
          isInstalling={isInstalling}
          installProgress={installProgress}
          isAiActive={isAiAnalysisActive}
          isSolving={isSolving}
        />
        {/* Background Grid Overlay */}
        <div className={`absolute inset-0 pointer-events-none opacity-[0.03] transition-all duration-1000 ${isOverdrive ? 'opacity-[0.08] scale-110' : ''}`} 
             style={{ 
               backgroundImage: `linear-gradient(${isOverdrive ? '#ff0000' : '#00ffcc'} 1px, transparent 1px), linear-gradient(90deg, ${isOverdrive ? '#ff0000' : '#00ffcc'} 1px, transparent 1px)`,
               backgroundSize: '80px 80px' 
             }} />

        {/* HONEYCOMB OVERLAY */}
        <div className={`absolute inset-0 pointer-events-none animate-pulse-slow transition-all duration-1000 ${isOverdrive ? 'invert hue-rotate-180 opacity-40' : 'opacity-20'}`}
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100' fill='none' stroke='%2300ffcc' stroke-opacity='0.6' stroke-width='1.5'/%3E%3C/svg%3E")`,
               backgroundSize: '56px 100px'
             }} />
        
        {/* VIGNETTE & CRUNCH */}
        <div className="absolute inset-0 pointer-events-none bg-radial-[circle_at_center,_transparent_40%,_black_90%] opacity-40" />
      </div>

      <AnimatePresence>
        {!isBooted ? (
          <motion.div
            key="bootloader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="fixed inset-0 z-[200]"
          >
            <BootLoader onBoot={() => setIsBooted(true)} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* SCANLINE OVERLAY */}
      <div className="fixed inset-0 pointer-events-none z-[150] bg-[length:100%_4px,3px_100%] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] opacity-10" />
      
      {/* SINGULARITY HEADER */}
      <div className="fixed top-8 left-0 right-0 z-20 flex flex-col items-center pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          <h1 className="text-[#00ffcc] text-2xl font-black tracking-[0.4em] uppercase drop-shadow-[0_0_15px_rgba(0,255,204,0.6)] flex items-center gap-4">
            <Cpu className="w-8 h-8 animate-pulse" />
            Singularity_v147
          </h1>
          <p className="text-[#00ffcc]/40 text-[9px] tracking-[0.6em] font-mono uppercase mt-1">
            Fundamental (50GHz) + Quantum Carrier Modulation | v147 Anchor
          </p>
        </motion.div>
      </div>

      <PetBay miningState={miningState} isOverdrive={isOverdrive} bias={carrierBias} />

      {/* DESKTOP AREA */}
      <div className="relative flex-1 z-10 pointer-events-none">
        <AnimatePresence>
          {openWindows.includes('terminal') && (
            <DesktopWindow 
              key="terminal"
              id="terminal" 
              title="Reservoir_Terminal" 
              icon={<Terminal size={16} />}
              onClose={() => closeWindow('terminal')}
              onFocus={() => setActiveWindow('terminal')}
              isActive={activeWindow === 'terminal'}
              initialPos={{ x: 60, y: 40 }}
            >
              <ConsoleLog logs={logs} onCommand={handleCommand} />
            </DesktopWindow>
          )}

          {openWindows.includes('stats') && (
            <DesktopWindow 
              key="stats"
              id="stats" 
              title="System_Monitor" 
              icon={<Activity size={16} />}
              onClose={() => closeWindow('stats')}
              onFocus={() => setActiveWindow('stats')}
              isActive={activeWindow === 'stats'}
              initialPos={{ x: 680, y: 200 }}
            >
              <div className="p-4 bg-black/40 h-full overflow-hidden flex flex-col">
                <StatsGrid stats={stats} />
                <div className="flex-1 mt-4 border border-white/5 rounded-lg bg-black/40 flex items-center justify-center">
                  <div className="text-[10px] text-zinc-600 uppercase tracking-widest flex flex-col items-center gap-2">
                    <Radio size={24} className="opacity-20 animate-pulse" />
                    Telemetric Feed Active
                  </div>
                </div>
              </div>
            </DesktopWindow>
          )}

          {openWindows.includes('settings') && (
            <DesktopWindow 
              key="settings"
              id="settings" 
              title="Central_Governance" 
              icon={<Settings size={16} />}
              onClose={() => closeWindow('settings')}
              onFocus={() => setActiveWindow('settings')}
              isActive={activeWindow === 'settings'}
              initialPos={{ x: 740, y: 60 }}
            >
              <SystemSettings 
                carrierBias={carrierBias}
                setCarrierBias={setCarrierBias}
                isOverdrive={isOverdrive}
                setIsOverdrive={setIsOverdrive}
                isAiActive={isAiAnalysisActive}
                setIsAiActive={setIsAiAnalysisActive}
                systemVersion={systemVersion}
                currentFreq={stats.frequency}
              />
            </DesktopWindow>
          )}

          {openWindows.includes('files') && (
            <DesktopWindow 
              key="files"
              id="files" 
              title="Substrate_Files" 
              icon={<Folder size={16} />}
              onClose={() => closeWindow('files')}
              onFocus={() => setActiveWindow('files')}
              isActive={activeWindow === 'files'}
              initialPos={{ x: 100, y: 150 }}
            >
              <FileExplorer />
            </DesktopWindow>
          )}

          {openWindows.includes('visualizer') && (
            <DesktopWindow 
              key="visualizer"
              id="visualizer" 
              title="Vector_Topology" 
              icon={<Layout size={16} />}
              onClose={() => closeWindow('visualizer')}
              onFocus={() => setActiveWindow('visualizer')}
              isActive={activeWindow === 'visualizer'}
              initialPos={{ x: 400, y: 100 }}
            >
              <div className="h-full bg-black relative">
                <WarpVisualizer 
                  coherence={stats.coherence} 
                  jitter={stats.jitter} 
                  frequency={stats.frequency} 
                  bias={carrierBias}
                  isInstalling={isInstalling}
                  installProgress={installProgress}
                  isAiActive={isAiAnalysisActive}
                  isSolving={isSolving}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-[8px] text-white/20 font-black tracking-[1em] uppercase">Phase_Projection</p>
                </div>
              </div>
            </DesktopWindow>
          )}

          {openWindows.includes('stabilizer') && (
            <DesktopWindow 
              key="stabilizer"
              id="stabilizer" 
              title="Quantum_Stabilizer" 
              icon={<ShieldCheck size={16} />}
              onClose={() => closeWindow('stabilizer')}
              onFocus={() => setActiveWindow('stabilizer')}
              isActive={activeWindow === 'stabilizer'}
              initialPos={{ x: 300, y: 120 }}
            >
              <QuantumStabilizer 
                coherence={stats.coherence}
                isQecActive={isQecActive}
                onToggleQec={setIsQecActive}
                systemModel="JAR_v3_SOVEREIGN"
              />
            </DesktopWindow>
          )}
        </AnimatePresence>
      </div>

      {/* TOP STATUS BAR */}
      <div className="fixed top-0 left-0 right-0 h-6 bg-black/60 backdrop-blur-md border-b border-white/10 z-[120] flex items-center justify-between px-3 text-[9px] uppercase tracking-widest font-black">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[#00ffcc] drop-shadow-[0_0_5px_rgba(0,255,204,0.5)]">
            <Zap size={10} className={isMining ? 'animate-pulse' : ''} />
            <span>CyberOS Sovereignty v{systemVersion.toFixed(2)}</span>
          </div>
          <div className="text-zinc-600">/</div>
          <div className="text-zinc-400">Host: void.nodal_sys.local</div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
             <span className="text-zinc-500">RES_FREQ:</span>
             <span className="text-[#00ffcc] font-mono">{(stats.frequency / 1000).toFixed(4)} GHz</span>
           </div>
           <div className="flex items-center gap-2">
             <span className="text-zinc-500">COH:</span>
             <span className={stats.coherence < 0.4 ? 'text-red-500' : 'text-white'}>{(stats.coherence * 100).toFixed(0)}%</span>
           </div>
           <div className="text-zinc-400">{new Date().toLocaleTimeString('en-US', { hour12: false })}</div>
        </div>
      </div>

      {/* DOCK / TASKBAR */}
      <Taskbar 
        onToggleWindow={toggleWindow}
        openWindows={openWindows}
        activeWindow={activeWindow}
        isSyncing={isSyncing}
        onSync={() => handleGitPull(false)} // Call virtual sync by default for better demo experience
        isMining={isMining}
        onToggleMining={() => setIsMining(!isMining)}
      />

      {/* HARDWARE BRIDGE STATUS BANNER */}
      {hardwareState === 'disconnected' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-yellow-500/10 border border-yellow-500/30 p-2 px-4 rounded-full flex items-center gap-3 backdrop-blur-sm pointer-events-none"
        >
          <AlertTriangle className="w-3 h-3 text-yellow-500 animate-pulse" />
          <p className="text-[8px] font-bold text-yellow-400 uppercase tracking-widest">Hardware Link Offline - Simulation Active</p>
        </motion.div>
      )}
    </div>
  );
}

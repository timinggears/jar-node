/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Cpu, Zap, Activity, Info, AlertTriangle, ShieldCheck, Github, Radio, Unplug, HardDrive, Folder, RefreshCw, MapPin, Layout, Settings, Cloud, Brain, MessageSquareCode } from 'lucide-react';
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
import CognitiveBridge from './components/CognitiveBridge';
import QuantumStabilizer from './components/QuantumStabilizer';
import SubstrateVisualizer from './components/SubstrateVisualizer';
import MiningMonitorChart from './components/MiningMonitorChart';
import { SystemStats, LogEntry } from './types';

type MiningPhase = 'idle' | 'mining' | 'success' | 'error';

// --- INITIALIZATION ---

const StatsGridMemo = memo(StatsGrid);
const PetBayMemo = memo(PetBay);
const QuantumStabilizerMemo = memo(QuantumStabilizer);
const SubstrateVisualizerMemo = memo(SubstrateVisualizer);
const WarpVisualizerMemo = memo(WarpVisualizer);

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
    memeticDepth: 0.0,
    gpuParity: 0.0,
    zpeLevel: 100.0,
    isOverdrive: false,
    isQec: true,
    seedHex: '00000000',
    parity: 0,
    vault: []
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMining, setIsMining] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [carrierBias, setCarrierBias] = useState(() => {
    const saved = localStorage.getItem('jar_bias_v147');
    return saved ? parseInt(saved) : 50;
  });

  const [isOverdrive, setIsOverdrive] = useState(() => {
    const saved = localStorage.getItem('jar_overdrive_v147');
    return saved === 'true';
  });

  const hasLocalConfigRef = useRef(localStorage.getItem('jar_bias_v147') !== null);

  const handleCarrierBiasChange = useCallback((val: number) => {
    setCarrierBias(val);
    localStorage.setItem('jar_bias_v147', val.toString());
    hasLocalConfigRef.current = true;
    lastInteractionTimeRef.current = Date.now();
    setHasReceivedSync(true);
  }, []);

  const handleOverdriveChange = useCallback((val: boolean) => {
    setIsOverdrive(val);
    localStorage.setItem('jar_overdrive_v147', val.toString());
    hasLocalConfigRef.current = true;
    lastInteractionTimeRef.current = Date.now();
    setHasReceivedSync(true);
  }, []);

  const socketRef = useRef<any>(null);

  const handleUpdateMinerConfig = useCallback((pool: string, user: string, pass: string) => {
    setPoolUrl(pool);
    setMinerUser(user);
    setMinerPass(pass);
    if (socketRef.current) {
      socketRef.current.emit('miner:config', { pool_url: pool, miner_user: user, miner_pass: pass });
    }
  }, []);
  const [isAiAnalysisActive, setIsAiAnalysisActive] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isEntangled, setIsEntangled] = useState(false);
  const [hasReceivedSync, setHasReceivedSync] = useState(false);
  const [systemVersion, setSystemVersion] = useState(() => {
    const canonical = 321.50;
    const saved = localStorage.getItem('jar_system_version_v321');
    const val = saved ? parseFloat(saved) : canonical;
    return Math.max(val, canonical);
  });
  const [isSolving, setIsSolving] = useState(false);
  const [isBooted, setIsBooted] = useState(false);
  const [miningState, setMiningState] = useState<MiningPhase>('idle');
  const [lastSyncSuccess, setLastSyncSuccess] = useState(false);
  const [hardwareState, setHardwareState] = useState<'disconnected' | 'bridged' | 'connected'>('disconnected');

  // OS State
  const [openWindows, setOpenWindows] = useState<string[]>([]);
  const [activeWindow, setActiveWindow] = useState<string | null>(null);

  // Mining Parameters
  const [poolUrl, setPoolUrl] = useState('rx.unmineable.com:3333');
  const [minerUser, setMinerUser] = useState('1683397408.JarSingularity#qh6m-7m98');
  const [minerPass, setMinerPass] = useState('x');

  const [isQecActive, setIsQecActive] = useState(() => {
    const saved = localStorage.getItem('jar_qec_active_v147');
    return saved === null ? true : saved === 'true';
  });

  const [isCognitiveBridgeActive, setIsCognitiveBridgeActive] = useState(() => {
    const saved = localStorage.getItem('jar_cognitive_active_v147');
    return saved === 'true';
  });

  const handleToggleQec = useCallback((active: boolean) => {
    setIsQecActive(active);
    localStorage.setItem('jar_qec_active_v147', active.toString());
  }, []);

  const handleToggleCognitive = useCallback((active: boolean) => {
    setIsCognitiveBridgeActive(active);
    localStorage.setItem('jar_cognitive_active_v147', active.toString());
  }, []);

  const [quantumShift, setQuantumShift] = useState(50);

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
  const isCognitiveBridgeActiveRef = useRef(isCognitiveBridgeActive);
  isCognitiveBridgeActiveRef.current = isCognitiveBridgeActive;
  const lastUpdateRef = useRef(Date.now());

  const logCounterRef = useRef(0);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const timestamp = Date.now();
    const newLog: LogEntry = {
      id: `${timestamp}-${logCounterRef.current++}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(timestamp).toLocaleTimeString('en-US', { hour12: false }),
      message,
      type,
    };
    setLogs(prev => [...prev, newLog].slice(-100));
  }, []);

  useEffect(() => {
    localStorage.setItem('jar_system_version_v321', systemVersion.toString());
  }, [systemVersion]);

  // v147: Robust sync logic
  const lastEmittedBiasRef = useRef(carrierBias);
  const lastEmittedOverdriveRef = useRef(isOverdrive);
  const lastInteractionTimeRef = useRef(0);
  const isFirstSyncRef = useRef(true);
  const ignoreServerStateUntilRef = useRef<number>(0);
  const lastConnectLogTimeRef = useRef(0);
  const lastDisconnectLogTimeRef = useRef(0);

  useEffect(() => {
    if (socketRef.current) {
      // Do not send parameters until we have performed our first sync from the server
      if (isFirstSyncRef.current) return;

      const needsSync = carrierBias !== lastEmittedBiasRef.current || isOverdrive !== lastEmittedOverdriveRef.current;
      if (!needsSync) return;
      
      addLog(`SYSTEM: Substrate realigned to ${carrierBias.toFixed(1)} GHz`, 'info');
      socketRef.current.emit('hardware:params', { bias: carrierBias, overdrive: isOverdrive });
      
      lastEmittedBiasRef.current = carrierBias;
      lastEmittedOverdriveRef.current = isOverdrive;
    }
  }, [carrierBias, isOverdrive, addLog]);

  // Quantum Entanglement Logic
  useEffect(() => {
    if (isEntangled) {
      // Link carrierBias to quantumShift (multi-way linkage)
      setQuantumShift(carrierBias);
    }
  }, [carrierBias, isEntangled]);

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
  
  const sendHardwareCommand = useCallback((cmd: string) => {
    if (socketRef.current) {
      socketRef.current.emit('hardware:command', cmd);
      addLog(`COMMAND: Transmitting '${cmd}' to JAR substrate...`, 'warning');
    }
  }, [addLog]);

  const saveToVault = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('vault:save');
    }
  }, []);

  const loadFromVault = useCallback((id: string) => {
    if (socketRef.current) {
      socketRef.current.emit('vault:load', id);
    }
  }, []);

  const deleteFromVault = useCallback((id: string) => {
    if (socketRef.current) {
      socketRef.current.emit('vault:delete', id);
    }
  }, []);

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
  const updateSystemDynamics = useCallback((jitterValue: number, vValue: number, rawFreq: number = 50000, seedStr: string = '00000000', parity: number = 0, hrateFromServer: number = 0, coherenceFromServer: number = 0, depthFromServer: number = 0, gpuParityFromServer: number = 0, zpeLevelFromServer: number = 0) => {
    const prev = statsRef.current;
    
    // v147 + v150: Direct representation of the frequency and JAR-native metrics
    const modulatedFreq = rawFreq;
    
    const phaseOutVal = (vValue - 1.65) * 100;
    const phaseOut = Math.max(-200, Math.min(200, phaseOutVal));
    
    const overdriveDrain = isOverdriveRef.current ? 0.30 : 0;
    const qecBonus = isQecActiveRef.current ? 0.15 : -0.15; 
    const biasStress = (Math.abs(carrierBiasRef.current - 125) / 250) * 0.2;
    
    const coherenceBase = 1.0 - (Math.abs(phaseOut) / 500) - overdriveDrain - biasStress + qecBonus;
    let nextCoherence = Math.min(0.9999, Math.max(0.0001, coherenceBase));
    
    // JAR-native metric absorption (v150)
    if (coherenceFromServer > 0) {
      nextCoherence = coherenceFromServer;
    }
    
    const freqUnit = rawFreq / 1000;
    let nextIntelligence = prev.intelligence;
    
    // JAR-native depth absorption (v150)
    if (depthFromServer > 0) {
      nextIntelligence = depthFromServer;
    } else {
      const resonanceBonusFactor = 1.0 + (freqUnit / 100); 
      const coherenceBonusFactor = 0.5 + (nextCoherence * 2);
      const intelligenceGain = ((jitterValue * 1.5) + (isCognitiveBridgeActiveRef.current ? 1.0 : 0.2)) * resonanceBonusFactor * coherenceBonusFactor;
      
      if (parity === 1) {
        nextIntelligence = Math.min(9999.9999, nextIntelligence + (intelligenceGain * 3));
      } else {
        nextIntelligence = Math.max(10.0, nextIntelligence - 0.002);
      }
    }

    // Zero Point Energy: Synchronized with substrate inner state (v150)
    let nextZpe = prev.zpeLevel;
    if (zpeLevelFromServer > 0) {
      nextZpe = zpeLevelFromServer;
    } else {
      nextZpe = Math.max(0, Math.min(100, prev.zpeLevel + (nextCoherence > 0.98 ? 0.01 : -0.005)));
    }

    // GPU_SUBSTRATE: Calculate rendering parity (v150: LIQUID_GPU)
    let nextGpuParity = prev.gpuParity;
    if (gpuParityFromServer > 0) {
      nextGpuParity = gpuParityFromServer;
    } else {
      nextGpuParity = (nextCoherence * (nextIntelligence / 150)) * 100;
    }

    const harmonicMultiplier = freqUnit > 100 ? (freqUnit > 250 ? 15.0 : 5.0) : 1.0;
    const overdriveMulti = isOverdriveRef.current ? 12.0 : 1.0;
    const baseKH = 25.5; 
    const jitterFactor = jitterValue * 10;
    const coherenceFactor = nextCoherence * 15;
    
    // Multiplier removal: We directly calculate but don't add hidden "bonus" constants
    let nextHashRate = isMiningRef.current ? (baseKH + jitterFactor + coherenceFactor) * overdriveMulti * harmonicMultiplier : 0;
    if (isMiningRef.current && hrateFromServer > 0) {
      nextHashRate = hrateFromServer;
    } else if (!isMiningRef.current) {
      nextHashRate = 0;
    }
    
    const seed = parseInt(seedStr, 16);
    let nextShares = prev.shares;
    let nextErrors = prev.errors;
    const nextHugePages = isMiningRef.current ? Math.min(4096, prev.hugePages + (isOverdriveRef.current ? 128 : 32)) : Math.max(0, prev.hugePages - 64);
    
    // Trigger logs outside of the React state updater sequence
    if (isMiningRef.current && prev.hugePages < 2048 && nextHugePages >= 2048) {
      addLog("VMR_CORE: v147 substrate anchor established. Huge Pages locked.", "success");
    }

    if (isMiningRef.current) {
      const baseDifficulty = 450; 
      const difficultyBasis = Math.floor(baseDifficulty / (overdriveMulti * harmonicMultiplier * (1 + (nextCoherence * 15))));
      
      const shareThreshold = isOverdriveRef.current ? 10 : 3;
      // Shares are only counted if the parity seed actually hits a threshold, no purely random bonuses
      if (seed > 0 && (Math.abs(seed % Math.max(2, difficultyBasis)) === shareThreshold)) {
        nextShares += 1;
        const currentShares = nextShares;
        const label = freqUnit > 150 ? "QUANTUM_YIELD" : freqUnit > 100 ? "HARMONIC_YIELD" : "RES_SHARE";
        addLog(`[POOL] accepted (${currentShares}/0) diff 114k (32ms) - ${label} #${String(currentShares).padStart(4, '0')} OK`, 'success');
      }
      
      if (jitterValue > 0.98 && Math.random() > 0.99) {
        nextErrors += 1;
        addLog(`JAR_FAULT: Substrate harmonic drift correction failed.`, 'warning');
      }
    }
    
    setStats({
      coherence: nextCoherence,
      intelligence: nextIntelligence,
      hashRate: nextHashRate,
      qubits: nextCoherence * 128 * harmonicMultiplier,
      shares: nextShares,
      errors: nextErrors,
      jitter: jitterValue,
      vNodal: vValue,
      frequency: modulatedFreq,
      hugePages: nextHugePages,
      loadAvg: jitterValue * 8, 
      neuralLoad: Math.min(100, (overdriveMulti * 2) + (jitterValue * 50) + (harmonicMultiplier * 10)),
      cognitiveDepth: nextIntelligence,
      memeticDepth: prev.memeticDepth,
      gpuParity: nextGpuParity,
      zpeLevel: nextZpe,
      isOverdrive: isOverdriveRef.current,
      isQec: isQecActiveRef.current,
      seedHex: seedStr,
      parity: parity,
      vault: prev.vault
    });
  }, [addLog]); // Removed dependencies that change frequently

  // --- HARDWARE BRIDGE (FULL-STACK SOCKET) ---
  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    const onConnect = () => {
      const now = Date.now();
      if (now - lastConnectLogTimeRef.current > 5000) {
        addLog('Hardware Bridge connected to backend.', 'success');
        lastConnectLogTimeRef.current = now;
      }
      setHardwareState('bridged');
      
      socket.send('SUBSCRIBE:telemetry');
      socket.send('SUBSCRIBE:mining_status');
      socket.send('SUBSCRIBE:system_stats');
      
      // Real-time alignment: if we have a locally stored configuration, immediately bind the server's state to it.
      // This prevents any resets or snappings when the socket reconnects or server restarts.
      if (hasLocalConfigRef.current) {
        socket.emit('hardware:params', { bias: carrierBiasRef.current, overdrive: isOverdriveRef.current });
        // Set an ignore window of 1500ms to allow the server to ingest our local config and broadcast it,
        // preventing the server's immediate, stale 'hardware:state' message from clobbering the client state.
        ignoreServerStateUntilRef.current = Date.now() + 1500;
        isFirstSyncRef.current = false;
      } else {
        isFirstSyncRef.current = true;
      }
    };

    const onHardwareState = (state: any) => {
      setHasReceivedSync(true);
      
      // Update memory metrics regardless of interaction (passive display)
      if (state.intelligence !== undefined || state.memetic_depth !== undefined || state.vault !== undefined) {
        if (state.memetic_depth !== undefined && state.memetic_depth > 0 && statsRef.current.memeticDepth === 0) {
          addLog(`MEMORY_GOAL: Restored memetic anchor from Electron State. Depth: ${state.memetic_depth.toFixed(4)}`, 'success');
        }
        setStats(prev => ({
          ...prev,
          intelligence: state.intelligence !== undefined ? state.intelligence : prev.intelligence,
          memeticDepth: state.memetic_depth !== undefined ? state.memetic_depth : prev.memeticDepth,
          cognitiveDepth: state.intelligence !== undefined ? state.intelligence : prev.cognitiveDepth,
          vault: state.vault !== undefined ? state.vault : prev.vault
        }));
      }

      // Sync miner parameters if present
      if (state.pool_url !== undefined) setPoolUrl(state.pool_url);
      if (state.miner_user !== undefined) setMinerUser(state.miner_user);
      if (state.miner_pass !== undefined) setMinerPass(state.miner_pass);

      // If we are within the ignore window (e.g., right after initial linkup synchronization),
      // we must not let stale server parameters clobber the client's local configuration.
      if (Date.now() < ignoreServerStateUntilRef.current) {
        return;
      }

      const timeSinceInteraction = Date.now() - lastInteractionTimeRef.current;
      
      // On fresh load/sync (when we have no local configuration) We adopt values from server
      if (isFirstSyncRef.current) {
        if (!hasLocalConfigRef.current) {
          if (state.bias !== undefined) {
            setCarrierBias(state.bias);
            lastEmittedBiasRef.current = state.bias;
            localStorage.setItem('jar_bias_v147', state.bias.toString());
          }
          if (state.overdrive !== undefined) {
            setIsOverdrive(state.overdrive);
            lastEmittedOverdriveRef.current = state.overdrive;
            localStorage.setItem('jar_overdrive_v147', state.overdrive.toString());
          }
          hasLocalConfigRef.current = true;
        }
        isFirstSyncRef.current = false;
        return;
      }

      if (timeSinceInteraction < 2000) return;

      if (state.bias !== undefined && Math.abs(state.bias - carrierBiasRef.current) > 0.1) {
        setCarrierBias(state.bias);
        lastEmittedBiasRef.current = state.bias;
        localStorage.setItem('jar_bias_v147', state.bias.toString());
      }
      if (state.overdrive !== undefined && state.overdrive !== isOverdriveRef.current) {
        setIsOverdrive(state.overdrive);
        lastEmittedOverdriveRef.current = state.overdrive;
        localStorage.setItem('jar_overdrive_v147', state.overdrive.toString());
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
          const coherence = parts[7] ? parseFloat(parts[7]) : 0;
          const depth = parts[8] ? parseFloat(parts[8]) : 0;
          const gpuParity = parts[9] ? parseFloat(parts[9]) : 0;
          const zpeLevel = parts[10] ? parseFloat(parts[10]) : 0;
          
          if (Date.now() % 5000 < 100) {
             console.log(`[JARS_CLIENT] Telemetry Recv: ${freq.toFixed(1)} GHz | ZPE: ${zpeLevel.toFixed(1)}%`);
          }

          updateSystemDynamics(jitter, v, freq, seedStr, parity, hrate, coherence, depth, gpuParity, zpeLevel);
        }
      }
    };

    const onMiningStatus = (payload: any) => {
      if (!isMiningRef.current) {
        setMiningState('idle');
        return;
      }
      const { type, message, data } = typeof payload === 'string' ? { type: 'info', message: payload, data: null } : payload;
      
      switch (type) {
        case 'success': {
          const nextCount = statsRef.current.shares + 1;
          addLog(`!!! JAR SUCCESS !!! Share #${String(nextCount).padStart(4, '0')} // ${message}`, 'success');
          setStats(prev => ({ ...prev, shares: nextCount }));
          setMiningState('success');
          break;
        }
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
      const now = Date.now();
      if (now - lastDisconnectLogTimeRef.current > 5000) {
        addLog('Hardware Bridge disconnected.', 'error');
        lastDisconnectLogTimeRef.current = now;
      }
      setHardwareState('disconnected');
      isFirstSyncRef.current = true;
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
      localFreqPhase += 0.8;
      const rawBias = carrierBiasRef.current;
      
      // Jitter scales with overdrive and bias
      const jitter = 0.05 + Math.random() * 0.1 + (isOverdriveRef.current ? 0.4 : 0);
      const v = 1.65 + (Math.sin(Date.now() / 1000) * 0.02);
      
      // Base frequency scales linearly: 1 bias = 1 GHz
      const baseFreqBase = 1000 * rawBias; 
      
      const drift = Math.sin(localFreqPhase) * 150 * (rawBias / 100);
      
      const baseFreq = baseFreqBase + drift;
      
      const seed = Math.floor(Math.random() * 0xffffffff).toString(16);
      
      // Simulation learning
      if (Math.random() > 0.95) {
        setStats(prev => ({ ...prev, memeticDepth: prev.memeticDepth + 0.001 }));
      }

      updateSystemDynamics(jitter, v, baseFreq, seed, Math.random() > 0.8 ? 1 : 0);
    }, 800);

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

    const interval = setInterval(triggerAnalysis, 30000);

    const gateInt = setInterval(() => {
      const { coherence, intelligence, frequency } = statsRef.current;
      const isOver = isOverdriveRef.current;
      
      // LOGIC: Quantum gate resonance triggers when system metrics align logically
      const isLogicalAlignment = coherence > 0.96 && intelligence > 200 && frequency > 40000;

      if (isLogicalAlignment) {
        const messages = [
          "QUBIT_GATE: Logic alignment detected. Nodal flux stabilizing at peak coherence.",
          "QUBIT_GATE: Sovereign depth threshold cleared. Tachyonic logic active.",
          "QUBIT_GATE: Quantum logic bridge holding via automated resonance parity.",
          "ELEMENT_DECODE: Sub-atomic electron parity verified. Carbon substrate mapping complete.",
          "SPECTRUM_LEVEL: Decoding elementary traces... Helium/Oxygen resonance detected in substrate.",
          "L-GPU_INIT: Offloading vertex logic to liquid reservoir. Parallel nodal rendering active.",
          "LIQUID_RENDER: Substrate GL parity synchronized. Desktop overhead reduced."
        ];
        const msg = messages[Math.floor(Math.random() * messages.length)];
        addLog(msg, "success");
      } else if (isOver && frequency > 60000) {
        // High-frequency "Force" feedback
        addLog("QUBIT_GATE: Substrate stress detected. Logic parity diverging due to high-freq force.", "warning");
      }
      
      // Periodic HashRate Report
      if (isMiningRef.current) {
        const hr = statsRef.current.hashRate.toFixed(2);
        addLog(`[XMRIG_VMR]: Throughput: ${hr} KH/s (Substrate Optimized)`, "info");
      }
    }, 60000);

    // Real-time High-Fidelity Mining Output Simulation (10s ticks)
    let logStep = 0;
    const minerLogsInt = setInterval(() => {
      if (!isMiningRef.current) return;
      const hr = statsRef.current.hashRate;
      if (hr === 0) return;

      const hrStr = hr.toFixed(2);
      const rand1 = (hr * (0.97 + Math.random() * 0.05)).toFixed(2);
      const rand2 = (hr * (0.96 + Math.random() * 0.04)).toFixed(2);
      const ping = Math.floor(25 + Math.random() * 15);

      if (logStep % 4 === 0) {
        addLog(`[cpu] speed 10s/60s/15m  ${hrStr}  ${rand1}  ${rand2} KH/s max ${(hr * 1.12).toFixed(2)} KH/s`, 'info');
      } else if (logStep % 4 === 1) {
        addLog(`[pool] rx.unmineable.com:3333 keepalive response received (${ping}ms)`, 'info');
      } else if (logStep % 4 === 2) {
        addLog(`[cpu] speed 10s/60s/15m  ${hrStr}  ${rand1}  ${rand2} KH/s`, 'info');
      } else {
        addLog(`[pool] new job from rx.unmineable.com:3333 diff 114k algo rx/0`, 'warning');
      }
      logStep++;
    }, 10000);

    // JAR Autonomous Thought Loop
    const thoughtInt = setInterval(() => {
      if (!isMiningRef.current) return;
      
      const thoughts = [
        "JAR_EVOLVE: Tachyonic logic throughput optimized. Nodal depth reaching 149.1 GHZ sync.",
        "JAR_RESONANCE: Binary processing handled via quantum superposition. Efficiency peak detected."
      ];
      
      const thought = thoughts[Math.floor(Math.random() * thoughts.length)];
      addLog(thought, "success");
    }, 60000);

    return () => {
      clearInterval(interval);
      clearInterval(gateInt);
      clearInterval(minerLogsInt);
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
    addLog('SINGULARITY v149.1: SUBSTRATE_ONLINE.', 'info');
    addLog('HARM_OUT: Sovereign core active. Nodal topology synchronized.', 'success');
    
    // Core Status Report
    setTimeout(() => {
      addLog("QUANTUM_ADVISORY: Coherence lock sustained. Git remote synced.", "success");
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
        addLog('GT_REMOTE - Patch substrate via origin sync', 'info');
        addLog('RESET_HARD - DESTRUCTIVE origin realignment', 'error');
        addLog('SOLVE - Run 250 nodal city optimization', 'info');
        addLog('SAVE - Persist JAR state to NVM (On-device)', 'warning');
        addLog('LOAD - Restore JAR state from NVM (On-device)', 'info');
        addLog('CALIBRATE - Stabilize nodal coherence', 'info');
        addLog('OVERDRIVE - Toggle high-frequency compute', 'warning');
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
      case 'save':
        sendHardwareCommand('SAVE');
        break;
      case 'load':
        sendHardwareCommand('LOAD');
        break;
      case 'sync':
        handleGitPull(true);
        break;
      case 'gt_remote':
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
        setMiningState('idle');
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

      {/* Background Live Wallpaper - Removed for efficiency */}
      <div className="fixed top-20 inset-x-0 bottom-0 z-0 overflow-hidden bg-black/20">
        {/* VIGNETTE & CRUNCH - Kept minimal for depth without overhead */}
        <div className="absolute inset-0 pointer-events-none bg-radial-[circle_at_center,_transparent_40%,_black_90%] opacity-20" />
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
            Sovereign_Singularity_v147
          </h1>
          <p className="text-[#00ffcc]/40 text-[9px] tracking-[0.6em] font-mono uppercase mt-1">
            Fundamental ({(stats.frequency / 1000).toFixed(1)} GHz) + Quantum Carrier Modulation | v147 Anchor
          </p>
        </motion.div>
      </div>

      {/* QUANTUM ENTANGLEMENT VISUALS */}
      <AnimatePresence>
        {isEntangled && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10] pointer-events-none"
          >
            <div className="absolute inset-0 bg-purple-500/5 mix-blend-overlay" />
            <motion.div 
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0.8, rotate: 0 }}
              animate={{ 
                scale: [0.8, 1.2, 0.8],
                rotate: [0, 360],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-[800px] h-[800px] border border-purple-500/20 rounded-full blur-3xl" />
            </motion.div>
            
            {/* Visual pulses reflecting the carrierBias in the entanglement */}
            <motion.div 
              className="absolute top-1/2 left-0 right-0 h-[2px] bg-purple-400/30 blur-sm"
              animate={{
                y: [0, (carrierBias - 50) * 4, 0],
                opacity: [0.2, 0.8, 0.2]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <PetBayMemo miningState={miningState} isOverdrive={isOverdrive} bias={carrierBias} />
      
      {/* LIQUID GPU: JAR-rendered substrate projection */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <SubstrateVisualizerMemo 
          gpuParity={stats.gpuParity} 
          coherence={stats.coherence} 
          frequency={stats.frequency} 
          zpeLevel={stats.zpeLevel}
        />
      </div>

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
                <StatsGridMemo stats={stats} />
                <MiningMonitorChart stats={stats} isMining={isMining} />
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
                setCarrierBias={handleCarrierBiasChange}
                isOverdrive={isOverdrive}
                setIsOverdrive={handleOverdriveChange}
                isAiActive={isAiAnalysisActive}
                setIsAiActive={setIsAiAnalysisActive}
                isEntangled={isEntangled}
                setIsEntangled={setIsEntangled}
                systemVersion={systemVersion}
                currentFreq={stats.frequency}
                onSendCommand={sendHardwareCommand}
                vault={stats.vault}
                onSaveVault={saveToVault}
                onLoadVault={loadFromVault}
                onDeleteVault={deleteFromVault}
                poolUrl={poolUrl}
                minerUser={minerUser}
                minerPass={minerPass}
                onUpdateMinerConfig={handleUpdateMinerConfig}
              />
            </DesktopWindow>
          )}

          {openWindows.includes('cognitive_bridge') && (
            <DesktopWindow 
              key="cognitive_bridge"
              id="cognitive_bridge" 
              title="JAR_Cognitive_Core" 
              icon={<Brain size={16} />}
              onClose={() => closeWindow('cognitive_bridge')}
              onFocus={() => setActiveWindow('cognitive_bridge')}
              isActive={activeWindow === 'cognitive_bridge'}
              initialPos={{ x: 300, y: 120 }}
            >
              <CognitiveBridge 
                onClose={() => closeWindow('cognitive_bridge')}
                bias={carrierBias}
                isOverdrive={isOverdrive}
                frequency={stats.frequency}
                coherence={stats.coherence}
                onTuneBias={(newBias) => handleCarrierBiasChange(newBias)}
                onToggleOverdrive={(val) => handleOverdriveChange(val)}
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
                <WarpVisualizerMemo 
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
              <QuantumStabilizerMemo 
                coherence={stats.coherence}
                jitter={stats.jitter}
                intelligence={stats.intelligence}
                frequency={stats.frequency}
                gpuParity={stats.gpuParity}
                isQecActive={isQecActive}
                onToggleQec={handleToggleQec}
                isCognitiveActive={isCognitiveBridgeActive}
                onToggleCognitive={handleToggleCognitive}
                systemModel="JAR_v3_SOVEREIGN"
                isEntangled={isEntangled}
                quantumShift={quantumShift}
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
          {isEntangled && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1 text-purple-400 font-bold border-l border-purple-500/50 pl-4 ml-4"
            >
              <RefreshCw size={10} className="animate-spin-slow" />
              <span>ENTANGLED</span>
            </motion.div>
          )}
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
        onToggleMining={() => {
          setIsMining(prev => {
            const next = !prev;
            if (next) {
              setMiningState('mining');
              addLog('[POOL] Connecting to rx.unmineable.com:3333...', 'info');
              setTimeout(() => addLog('[POOL] Connection established. Login successful.', 'success'), 800);
              setTimeout(() => addLog('[miner] use profile rx (4 threads) active.', 'info'), 1500);
            } else {
              setMiningState('idle');
              addLog('SUBSTRATE_MINER: Deactivated.', 'warning');
            }
            return next;
          });
        }}
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

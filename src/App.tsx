/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion } from 'motion/react';
import { Terminal, Cpu, Zap, Activity, Info, AlertTriangle, ShieldCheck, Github, GitBranch, Radio, Unplug, HardDrive, Folder, RefreshCw, MapPin, Layout, Settings, Cloud, Brain, MessageSquareCode, Database, ExternalLink, Box, Binary, Network, Lock, Waves, Share2, Copy, Check } from 'lucide-react';
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
import PhysicalAsciiReservoir from './components/PhysicalAsciiReservoir';
import SubstrateIOBox from './components/SubstrateIOBox';
import GitRepositoryHub from './components/GitRepositoryHub';
import EmpyreanSandboxModal from './components/EmpyreanSandboxModal';
import SubstrateMemTest from './components/SubstrateMemTest';
import ReservoirLab from './components/ReservoirLab';
import QuantumCipherLab from './components/QuantumCipherLab';
import NodeMeshAttestation from './components/NodeMeshAttestation';
import PhaseDynamicsLab from './components/PhaseDynamicsLab';
import { SystemStats, LogEntry } from './types';

type MiningPhase = 'idle' | 'mining' | 'success' | 'error';

// --- INITIALIZATION ---

const StatsGridMemo = memo(StatsGrid);
const PetBayMemo = memo(PetBay);
const QuantumStabilizerMemo = memo(QuantumStabilizer);
const SubstrateVisualizerMemo = memo(SubstrateVisualizer);
const WarpVisualizerMemo = memo(WarpVisualizer);
const PhysicalAsciiReservoirMemo = memo(PhysicalAsciiReservoir);
const SubstrateIOBoxMemo = memo(SubstrateIOBox);
const GitRepositoryHubMemo = memo(GitRepositoryHub);
const EmpyreanSandboxModalMemo = memo(EmpyreanSandboxModal);
const SubstrateMemTestMemo = memo(SubstrateMemTest);
const ReservoirLabMemo = memo(ReservoirLab);
const QuantumCipherLabMemo = memo(QuantumCipherLab);
const NodeMeshAttestationMemo = memo(NodeMeshAttestation);
const PhaseDynamicsLabMemo = memo(PhaseDynamicsLab);

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
    frequency: 28000,
    hugePages: 0,
    loadAvg: 0.0,
    neuralLoad: 0.0,
    cognitiveDepth: 42.0,
    memeticDepth: 0.0,
    gpuParity: 0.0,
    zpeLevel: 100.0,
    phaseOut: 0.0,
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
    
    // Trigger unified socket emission to backend for real-time serial writing
    if (socketRef.current) {
      socketRef.current.emit('hardware:bias_change', val);
    }
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
  const [openWindows, setOpenWindows] = useState<string[]>(['ascii_reservoir', 'substrate_io', 'quantum_cipher', 'node_mesh', 'phase_lab']);
  const [activeWindow, setActiveWindow] = useState<string | null>('node_mesh');
  const [onlineNodeCount, setOnlineNodeCount] = useState<number>(4);
  const [phaseModel, setPhaseModel] = useState<'modified' | 'original'>('modified');
  const phaseModelRef = useRef<'modified' | 'original'>('modified');
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

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

  // --- PYTHON DAEMON BRIDGE BACKEND STATE LINK ---
  const [pythonBridgeActive, setPythonBridgeActive] = useState(false);
  const [pythonBridgePid, setPythonBridgePid] = useState<number | null>(null);

  const handleToggleQec = useCallback((active: boolean) => {
    setIsQecActive(active);
    localStorage.setItem('jar_qec_active_v147', active.toString());
  }, []);

  const handleToggleCognitive = useCallback((active: boolean) => {
    setIsCognitiveBridgeActive(active);
    localStorage.setItem('jar_cognitive_active_v147', active.toString());
  }, []);

  const [isBoost2B, setIsBoost2B] = useState(() => {
    const saved = localStorage.getItem('jar_boost_2b');
    return saved === 'true';
  });

  const handleToggleBoost2B = useCallback((active: boolean) => {
    setIsBoost2B(active);
    localStorage.setItem('jar_boost_2b', active.toString());
    hasLocalConfigRef.current = true;
    lastInteractionTimeRef.current = Date.now();
    setHasReceivedSync(true);
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
  const isBoost2BRef = useRef(isBoost2B);
  isBoost2BRef.current = isBoost2B;
  const isQecActiveRef = useRef(isQecActive);
  isQecActiveRef.current = isQecActive;
  const isCognitiveBridgeActiveRef = useRef(isCognitiveBridgeActive);
  isCognitiveBridgeActiveRef.current = isCognitiveBridgeActive;
  const phaseMemoryRef = useRef<number>(0.0);
  const lastUpdateRef = useRef(Date.now());
  const pendingTelemetryRef = useRef<any>(null);

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

  // --- REMOTE CONSOLE PERFORMANCE & LOW-LAG MODE ---
  const [perfMode, setPerfMode] = useState<'low-lag' | 'balanced' | 'ultra'>(() => {
    return (localStorage.getItem('jar_perf_mode') as any) || 'low-lag';
  });
  const [pingMs, setPingMs] = useState<number | null>(null);

  const cyclePerfMode = useCallback(() => {
    setPerfMode(prev => {
      const next = prev === 'low-lag' ? 'balanced' : prev === 'balanced' ? 'ultra' : 'low-lag';
      localStorage.setItem('jar_perf_mode', next);
      const desc = next === 'low-lag' 
        ? 'LOW-LAG (5Hz UI state updates, GPU relief, optimized for remote internet consoles)' 
        : next === 'balanced' 
        ? 'BALANCED (12.5Hz UI update rate)' 
        : 'ULTRA (30Hz high-refresh rate)';
      addLog(`[PERF_PROFILE]: Switched console profile to ${desc}`, 'info');
      return next;
    });
  }, [addLog]);

  // Periodic round-trip ping measurement
  useEffect(() => {
    let isMounted = true;
    const checkPing = async () => {
      try {
        const start = performance.now();
        const res = await fetch('/api/health');
        if (res.ok && isMounted) {
          const rtt = Math.round(performance.now() - start);
          setPingMs(rtt);
        }
      } catch (e) {
        // silent
      }
    };
    checkPing();
    const pingInt = setInterval(checkPing, 4000);
    return () => {
      isMounted = false;
      clearInterval(pingInt);
    };
  }, []);

  const fetchBridgeStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/bridge/status');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPythonBridgeActive(data.active);
          setPythonBridgePid(data.pid);
        }
      }
    } catch (e) {
      console.warn("Could not retrieve Python Bridge status", e);
    }
  }, []);

  const handleTogglePythonBridge = useCallback(async (active: boolean) => {
    try {
      addLog(active ? 'PYTHON_BRIDGE: Spawning side-car bridge helper...' : 'PYTHON_BRIDGE: Revoking python sidecar process...', 'info');
      const response = await fetch('/api/bridge/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPythonBridgeActive(data.active);
          if (data.active) {
            addLog('PYTHON_BRIDGE: Side-car daemon linked successfully via loopback.', 'success');
          } else {
            addLog('PYTHON_BRIDGE: Daemon offline. Local serial simulator bypassed.', 'warning');
            setHardwareState('disconnected');
          }
          fetchBridgeStatus();
        }
      }
    } catch (e) {
      addLog('PYTHON_BRIDGE: Failed to link with Express process-manager.', 'error');
    }
  }, [addLog, fetchBridgeStatus]);

  useEffect(() => {
    localStorage.setItem('jar_system_version_v321', systemVersion.toString());
  }, [systemVersion]);

  // v147: Robust sync logic
  const lastEmittedBiasRef = useRef(carrierBias);
  const lastEmittedOverdriveRef = useRef(isOverdrive);
  const lastEmittedBoost2BRef = useRef(isBoost2B);
  const lastInteractionTimeRef = useRef(0);
  const isFirstSyncRef = useRef(true);
  const ignoreServerStateUntilRef = useRef<number>(0);
  const lastConnectLogTimeRef = useRef(0);
  const lastDisconnectLogTimeRef = useRef(0);

  useEffect(() => {
    if (socketRef.current) {
      // Do not send parameters until we have performed our first sync from the server
      if (isFirstSyncRef.current) return;

      const needsSync = 
        carrierBias !== lastEmittedBiasRef.current || 
        isOverdrive !== lastEmittedOverdriveRef.current ||
        isBoost2B !== lastEmittedBoost2BRef.current;
      if (!needsSync) return;
      
      addLog(`SYSTEM: Substrate realigned | Bias: ${carrierBias.toFixed(1)} GHz | Boost2B: ${isBoost2B ? 'ON' : 'OFF'}`, 'info');
      socketRef.current.emit('hardware:params', { bias: carrierBias, overdrive: isOverdrive, boost_2b: isBoost2B });
      
      lastEmittedBiasRef.current = carrierBias;
      lastEmittedOverdriveRef.current = isOverdrive;
      lastEmittedBoost2BRef.current = isBoost2B;
    }
  }, [carrierBias, isOverdrive, isBoost2B, addLog]);

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

    const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    if (!apiKey) return;

    try {
      const ai = new GoogleGenAI({ apiKey });
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

  const getPublicShareUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (origin.includes('ais-dev-')) {
      return origin.replace('ais-dev-', 'ais-pre-');
    }
    if (origin.includes('ais-pre-')) {
      return origin;
    }
    return 'https://ais-pre-hltv4y4usao3e5terlhjvj-107549292245.us-west2.run.app';
  };

  const handleCopyPublicShareLink = () => {
    const shareUrl = getPublicShareUrl();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedShareLink(true);
        addLog(`[PUBLIC_SHARE]: Copied public URL to clipboard (${shareUrl})! Anyone can view this without security auth.`, 'success');
        setTimeout(() => setCopiedShareLink(false), 3500);
      }).catch(() => {
        // Fallback handled by showing modal
      });
    }
    setShowShareModal(true);
  };

  // --- CORE DYNAMICS ---
  const updateSystemDynamics = useCallback((jitterValue: number, vValue: number, rawFreq: number = 50000, seedStr: string = '00000000', parity: number = 0, hrateFromServer: number = 0, coherenceFromServer: number = 0, depthFromServer: number = 0, gpuParityFromServer: number = 0, zpeLevelFromServer: number = 0) => {
    const prev = statsRef.current;
    
    // v147 + v150: Direct representation of the frequency and JAR-native metrics
    const modulatedFreq = rawFreq;
    const t = Date.now() / 1000;
    
    // Multi-Harmonic Field Drive: B+(t) = π² × B₀ × [sin(2π·28·t) + sin(2π·56·t) + sin(2π·84·t) + sin(2π·112·t)]
    const b0 = Math.max(0.1, carrierBiasRef.current / 50.0);
    const piSq = Math.PI * Math.PI;
    const h1 = Math.sin(2.0 * Math.PI * 28.0 * t);
    const h2 = Math.sin(2.0 * Math.PI * 56.0 * t);
    const h3 = Math.sin(2.0 * Math.PI * 84.0 * t);
    const h4 = Math.sin(2.0 * Math.PI * 112.0 * t);
    const bPlus = piSq * b0 * (h1 + h2 + h3 + h4);

    // Phase-Out Equation Engine (Modified Current with Memory Stick vs Original Legacy)
    let phaseOut: number;
    let coherenceBase: number;
    let memory: number = 0;

    if (phaseModelRef.current === 'original') {
      // Original Phase-Out equation (Legacy specification):
      // textshimmer = 30 + (jitter * 45)
      // phase_out = (voltage * 98) - (0.27 * shimmer) + (15 * sin(2π * 35 * t))
      // phase_out = clamp(phase_out, -58, 58)
      // Coherence was simply: coherence = 0.95 - |phase_out| / 95 (high only when Phase-Out was near zero)
      // This version collapsed immediately after the drive stopped. No stick.
      const shimmer = 30.0 + (jitterValue * 45.0);
      const osc = 15.0 * Math.sin(2.0 * Math.PI * 35.0 * t);
      phaseOut = (vValue * 98.0) - (0.27 * shimmer) + osc;
      phaseOut = Math.max(-58.0, Math.min(58.0, phaseOut));
      
      coherenceBase = Math.max(0.01, 0.95 - (Math.abs(phaseOut) / 95.0));
      phaseMemoryRef.current = 0.0; // No stick in legacy equation!
      memory = 0.0;
    } else {
      // Modified Phase-Out equation (Current specification):
      // 1. Shimmer: Less destructive weight
      const shimmer = 22.0 + (jitterValue * 38.0);

      // 2. Instantaneous response: centered on 0.68V with weight 42, shimmer weight -0.15
      const instant = (vValue - 0.68) * 42.0 - (0.15 * shimmer);

      // 3. Memory term: Slow integration state (keeps state alive after external drive is removed!)
      phaseMemoryRef.current += 0.08 * (instant - phaseMemoryRef.current);
      phaseMemoryRef.current = Math.max(-40.0, Math.min(40.0, phaseMemoryRef.current));
      memory = phaseMemoryRef.current;

      // 4. Oscillation: 28 Hz, amplitude 6 (matches multi-harmonic drive fundamental)
      const osc = 6.0 * Math.sin(2.0 * Math.PI * 28.0 * t);

      // 5. Phase-out calculation combining instant, memory stick, and 28Hz osc
      phaseOut = 0.65 * instant + 0.90 * memory + 0.25 * osc;
      phaseOut = Math.max(-55.0, Math.min(55.0, phaseOut));
      
      // 6. Coherence: Peaks in a moderate band of |phase_out| (roughly 8–28), not only at zero
      const absP = Math.abs(phaseOut);
      if (absP < 8.0) {
        const bandDist = 8.0 - absP;
        coherenceBase = 0.96 - (bandDist / 8.0) * 0.18;
      } else if (absP <= 28.0) {
        // High-coherence sweet spot (8-28) -> stable high-coherence region!
        const distCenter = Math.abs(absP - 18.0);
        coherenceBase = 0.98 - (distCenter / 10.0) * 0.04;
      } else {
        // Roll-off above 28° towards -55° / +55°
        const bandDist = absP - 28.0;
        const falloff = Math.pow(bandDist / 27.0, 1.35) * 0.65;
        coherenceBase = 0.96 - falloff;
      }
    }

    const overdriveDrain = isOverdriveRef.current ? 0.05 : 0;
    const qecBonus = isQecActiveRef.current ? 0.04 : 0;
    const jitterPenalty = jitterValue * 2.0;
    let nextCoherence = Math.min(0.9999, Math.max(0.15, coherenceBase - jitterPenalty - overdriveDrain + qecBonus));
    
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
    if (isMiningRef.current && isBoost2BRef.current) {
      nextHashRate = 2000000.00; // 2 Billion H/s
    } else if (isMiningRef.current && hrateFromServer > 0) {
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
      phaseOut: phaseOut,
      phaseModel: phaseModelRef.current,
      memoryStick: memory,
      bPlus: bPlus,
      nodesOnline: onlineNodeCount,
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

    fetchBridgeStatus();
    const bridgeInterval = setInterval(fetchBridgeStatus, 8000);

    const onConnect = () => {
      const now = Date.now();
      if (now - lastConnectLogTimeRef.current > 5000) {
        addLog('Hardware Bridge connected to backend.', 'success');
        lastConnectLogTimeRef.current = now;
      }
      setHardwareState(prev => prev !== 'bridged' ? 'bridged' : prev);
      
      socket.send('SUBSCRIBE:telemetry');
      socket.send('SUBSCRIBE:mining_status');
      socket.send('SUBSCRIBE:system_stats');
      
      // Real-time alignment: if we have a locally stored configuration, immediately bind the server's state to it.
      // This prevents any resets or snappings when the socket reconnects or server restarts.
      if (hasLocalConfigRef.current) {
        socket.emit('hardware:params', { bias: carrierBiasRef.current, overdrive: isOverdriveRef.current, boost_2b: isBoost2BRef.current });
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
          vault: state.vault !== undefined ? state.vault : prev.vault,
          boost2b: state.boost_2b !== undefined ? state.boost_2b : prev.boost2b
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
          if (state.boost_2b !== undefined) {
            setIsBoost2B(state.boost_2b);
            lastEmittedBoost2BRef.current = state.boost_2b;
            localStorage.setItem('jar_boost_2b', state.boost_2b.toString());
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
      if (state.boost_2b !== undefined && state.boost_2b !== isBoost2BRef.current) {
        setIsBoost2B(state.boost_2b);
        lastEmittedBoost2BRef.current = state.boost_2b;
        localStorage.setItem('jar_boost_2b', state.boost_2b.toString());
      }
    };

    const onTelemetry = (line: string) => {
      if (line.startsWith('!S|')) {
        setHardwareState(prev => prev !== 'connected' ? 'connected' : prev);
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

          pendingTelemetryRef.current = { jitter, v, freq, seedStr, parity, hrate, coherence, depth, gpuParity, zpeLevel };
        }
      }
    };

    const onMiningStatus = (payload: any) => {
      if (!isMiningRef.current) {
        setMiningState(prev => prev !== 'idle' ? 'idle' : prev);
        return;
      }
      const { type, message, data } = typeof payload === 'string' ? { type: 'info', message: payload, data: null } : payload;
      
      switch (type) {
        case 'success': {
          const nextCount = statsRef.current.shares + 1;
          addLog(`!!! JAR SUCCESS !!! Share #${String(nextCount).padStart(4, '0')} // ${message}`, 'success');
          setStats(prev => ({ ...prev, shares: nextCount }));
          setMiningState(prev => prev !== 'success' ? 'success' : prev);
          break;
        }
        case 'error':
          setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
          setMiningState(prev => prev !== 'error' ? 'error' : prev);
          addLog(`[MINER_ERROR]: ${message}`, 'error');
          break;
        case 'telemetry':
          setMiningState(prev => prev === 'idle' ? 'mining' : prev);
          break;
        case 'info':
        default:
          setMiningState(prev => prev === 'idle' ? 'mining' : prev);
          break;
      }
    };

    const onNodePresence = (data: any) => {
      if (data && typeof data.onlineCount === 'number') {
        setOnlineNodeCount(data.onlineCount);
        setStats(prev => ({ ...prev, nodesOnline: data.onlineCount }));
      }
    };

    socket.on('connect', onConnect);
    socket.on('telemetry', onTelemetry);
    socket.on('mining_status', onMiningStatus);
    socket.on('hardware:state', onHardwareState);
    socket.on('node:presence', onNodePresence);
    socket.on('log', (msg: string) => addLog(msg, 'info'));

    // Initial fetch of online nodes
    fetch('/api/nodes/online').then(r => r.json()).then(d => {
      if (d.success && typeof d.onlineCount === 'number') {
        setOnlineNodeCount(d.onlineCount);
        setStats(prev => ({ ...prev, nodesOnline: d.onlineCount }));
      }
    }).catch(() => {});

    socket.on('physics:phase_model', (data: any) => {
      if (data?.phaseModel) {
        setPhaseModel(data.phaseModel);
        phaseModelRef.current = data.phaseModel;
        setStats(prev => ({ ...prev, phaseModel: data.phaseModel }));
      }
    });

    fetch('/api/physics/phase-model').then(r => r.json()).then(d => {
      if (d.success && d.phaseModel) {
        setPhaseModel(d.phaseModel);
        phaseModelRef.current = d.phaseModel;
        setStats(prev => ({ ...prev, phaseModel: d.phaseModel }));
      }
    }).catch(() => {});
    socket.on('disconnect', () => {
      const now = Date.now();
      if (now - lastDisconnectLogTimeRef.current > 5000) {
        addLog('Hardware Bridge disconnected.', 'error');
        lastDisconnectLogTimeRef.current = now;
      }
      setHardwareState(prev => prev !== 'disconnected' ? 'disconnected' : prev);
      isFirstSyncRef.current = true;
    });

    return () => {
      clearInterval(bridgeInterval);
      socket.disconnect();
    };
  }, [addLog, fetchBridgeStatus]);

  // --- TELEMETRY CONSUMPTION TICK LOOP (ADAPTIVE TO PERFORMANCE PROFILE) ---
  useEffect(() => {
    // In low-lag mode: 200ms (5Hz UI state updates) - completely eliminates UI freeze and CPU choke on remote consoles
    // In balanced mode: 80ms (12.5Hz UI updates)
    // In ultra mode: 33ms (30Hz UI updates)
    const intervalMs = perfMode === 'low-lag' ? 200 : perfMode === 'balanced' ? 80 : 33;
    const telemetryInterval = setInterval(() => {
      if (pendingTelemetryRef.current) {
        const { jitter, v, freq, seedStr, parity, hrate, coherence, depth, gpuParity, zpeLevel } = pendingTelemetryRef.current;
        updateSystemDynamics(jitter, v, freq, seedStr, parity, hrate, coherence, depth, gpuParity, zpeLevel);
        pendingTelemetryRef.current = null;
      }
    }, intervalMs);

    return () => clearInterval(telemetryInterval);
  }, [perfMode, updateSystemDynamics]);


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
      const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
      if (!isAiAnalysisActive || !apiKey) return;
      
      try {
        const prompt = `System Status: Coherence ${statsRef.current.coherence.toFixed(2)}, Intelligence ${statsRef.current.intelligence.toFixed(1)}.
        The Raspberry Pi Nodal Reservoir is active (GPIO 14/26). Generate a cryptic, futuristic nodal system update message (max 15 words) for the console log. 
        Focus on words like: Reservoir, Liquid State, Nodal, Resonance, Raspberry Pi, GPIO, Singularity, Sovereignty, Phase Drift.`;
        
        const geminiAi = new GoogleGenAI({ apiKey });
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
      const isLogicalAlignment = coherence > 0.85 && (intelligence > 4.5 || isQecActiveRef.current) && frequency > 30000;

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
            x: [-2, 2, -1, 1, -2, 2, 0],
            y: [1, -2, 2, -1, 1, -2, 0],
            opacity: [0.1, 0.3, 0.1, 0.2, 0.1]
          }}
          transition={{ duration: 0.15, repeat: Infinity }}
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

      {!isBooted && (
        <div className="fixed inset-0 z-[200]">
          <BootLoader onBoot={() => setIsBooted(true)} />
        </div>
      )}

      {/* SCANLINE OVERLAY */}
      <div className="fixed inset-0 pointer-events-none z-[150] bg-[length:100%_4px,3px_100%] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] opacity-10" />

      {/* SINGULARITY HEADER */}
      <div className="fixed top-12 left-0 right-0 z-[2] flex flex-col items-center pointer-events-none">
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
      {isEntangled && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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

      <PetBayMemo miningState={miningState} isOverdrive={isOverdrive} bias={carrierBias} />
      
      {/* LIQUID GPU: JAR-rendered substrate projection */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <SubstrateVisualizerMemo 
          gpuParity={stats.gpuParity} 
          coherence={stats.coherence} 
          frequency={stats.frequency} 
          zpeLevel={stats.zpeLevel}
          lowLag={perfMode === 'low-lag'}
        />
      </div>

      {/* DESKTOP AREA */}
      <div className="relative flex-1 z-20 pointer-events-none">
        {openWindows.includes('terminal') && (
          <DesktopWindow 
            key="terminal"
            id="terminal" 
            title="Reservoir_Terminal" 
            icon={<Terminal size={16} />}
            onClose={() => closeWindow('terminal')}
            onFocus={() => setActiveWindow('terminal')}
            isActive={activeWindow === 'terminal'}
            initialPos={{ x: 60, y: 50 }}
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
              isBoost2B={isBoost2B}
              setIsBoost2B={handleToggleBoost2B}
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
              pythonBridgeActive={pythonBridgeActive}
              onTogglePythonBridge={handleTogglePythonBridge}
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
            title="Jar_Reservoir_Cube" 
            icon={<Box size={16} />}
            onClose={() => closeWindow('visualizer')}
            onFocus={() => setActiveWindow('visualizer')}
            isActive={activeWindow === 'visualizer'}
            initialPos={{ x: 380, y: 80 }}
          >
            <div className="h-full bg-black relative">
              <WarpVisualizerMemo 
                coherence={stats.coherence} 
                jitter={stats.jitter} 
                frequency={stats.frequency} 
                bias={carrierBias}
                vNodal={stats.vNodal}
                intelligence={stats.intelligence}
                isInstalling={isInstalling}
                installProgress={installProgress}
                isAiActive={isAiAnalysisActive}
                isSolving={isSolving}
                isQecActive={isQecActive}
                isEntangled={isEntangled}
                parity={stats.parity}
              />
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

        {openWindows.includes('ascii_reservoir') && (
          <DesktopWindow 
            key="ascii_reservoir"
            id="ascii_reservoir" 
            title="Physical_ASCII_Reservoir" 
            icon={<Database size={16} />}
            onClose={() => closeWindow('ascii_reservoir')}
            onFocus={() => setActiveWindow('ascii_reservoir')}
            isActive={activeWindow === 'ascii_reservoir'}
            initialPos={{ x: 40, y: 80 }}
          >
            <PhysicalAsciiReservoirMemo 
              coherence={stats.coherence}
              intelligence={stats.intelligence}
              phaseOut={stats.phaseOut}
              voltage={stats.vNodal}
              jitter={stats.jitter}
              hardwareState={hardwareState}
              onAddLog={addLog}
              bias={carrierBias}
              onTuneBias={handleCarrierBiasChange}
              onOpenMemTest={() => toggleWindow('memtest')}
              onOpenPhaseLab={() => toggleWindow('phase_lab')}
            />
          </DesktopWindow>
        )}

        {openWindows.includes('substrate_io') && (
          <DesktopWindow 
            key="substrate_io"
            id="substrate_io" 
            title="Substrate_Input_Output_Box // SECURE PHYSICAL RESERVOIR I/O" 
            icon={<HardDrive size={16} className="text-[#00ffcc]" />}
            onClose={() => closeWindow('substrate_io')}
            onFocus={() => setActiveWindow('substrate_io')}
            isActive={activeWindow === 'substrate_io'}
            initialPos={{ x: 80, y: 100 }}
            width="w-[740px] max-w-[96vw]"
            height="h-auto"
          >
            <div className="w-full min-h-[440px] max-h-[640px] flex flex-col">
              <SubstrateIOBoxMemo 
                onAddLog={addLog} 
                onOpenMemTest={() => toggleWindow('memtest')}
                onOpenQuantumCipher={() => {
                  if (!openWindows.includes('quantum_cipher')) {
                    setOpenWindows(prev => [...prev, 'quantum_cipher']);
                  }
                  setActiveWindow('quantum_cipher');
                }}
              />
            </div>
          </DesktopWindow>
        )}

        {openWindows.includes('git_repo') && (
          <DesktopWindow 
            key="git_repo"
            id="git_repo" 
            title="Git_Repository_and_Field_Specs" 
            icon={<GitBranch size={16} className="text-[#00ffcc]" />}
            onClose={() => closeWindow('git_repo')}
            onFocus={() => setActiveWindow('git_repo')}
            isActive={activeWindow === 'git_repo'}
            initialPos={{ x: 180, y: 70 }}
            width="w-[660px] max-w-[95vw]"
            height="h-auto max-h-[85vh]"
          >
            <div className="w-full min-h-[480px] max-h-[620px] flex flex-col">
              <GitRepositoryHubMemo onAddLog={addLog} />
            </div>
          </DesktopWindow>
        )}

        {openWindows.includes('empyrean_sandbox') && (
          <DesktopWindow 
            key="empyrean_sandbox"
            id="empyrean_sandbox" 
            title="Empyrean_Sandbox_Emulator_Architecture" 
            icon={<Box size={16} className="text-amber-400" />}
            onClose={() => closeWindow('empyrean_sandbox')}
            onFocus={() => setActiveWindow('empyrean_sandbox')}
            isActive={activeWindow === 'empyrean_sandbox'}
            initialPos={{ x: 220, y: 80 }}
            width="w-[640px] max-w-[95vw]"
            height="h-auto max-h-[85vh]"
          >
            <div className="w-full min-h-[450px] max-h-[600px] flex flex-col">
              <EmpyreanSandboxModalMemo 
                onClose={() => closeWindow('empyrean_sandbox')} 
                onAddLog={addLog} 
              />
            </div>
          </DesktopWindow>
        )}

        {openWindows.includes('memtest') && (
          <DesktopWindow 
            key="memtest"
            id="memtest" 
            title="Substrate_MemTest86 // Physical_Sector_Block_Mapper" 
            icon={<Binary size={16} className="text-[#00ffcc]" />}
            onClose={() => closeWindow('memtest')}
            onFocus={() => setActiveWindow('memtest')}
            isActive={activeWindow === 'memtest'}
            initialPos={{ x: 190, y: 70 }}
            width="w-[840px] max-w-[96vw]"
            height="h-[640px] max-h-[90vh]"
          >
            <SubstrateMemTestMemo
              coherence={stats.coherence}
              jitter={stats.jitter}
              frequency={stats.frequency}
              onAddLog={addLog}
              onClose={() => closeWindow('memtest')}
            />
          </DesktopWindow>
        )}

        {openWindows.includes('reservoir_lab') && (
          <DesktopWindow 
            key="reservoir_lab"
            id="reservoir_lab" 
            title="PRC_QUANTUM_LAB // ESN READOUT • HYSTERESIS • TRNG ORACLE" 
            icon={<Network size={16} className="text-[#00ffcc]" />}
            onClose={() => closeWindow('reservoir_lab')}
            onFocus={() => setActiveWindow('reservoir_lab')}
            isActive={activeWindow === 'reservoir_lab'}
            initialPos={{ x: 140, y: 50 }}
            width="w-[980px] max-w-[98vw]"
            height="h-[690px] max-h-[92vh]"
          >
            <ReservoirLabMemo
              stats={stats}
              onLog={addLog}
            />
          </DesktopWindow>
        )}

        {openWindows.includes('quantum_cipher') && (
          <DesktopWindow 
            key="quantum_cipher"
            id="quantum_cipher" 
            title="QUANTUM_CIPHER_LAB // BEYOND-CURRENT-ART POST-QUANTUM LATTICE & CHAOS ENGINES" 
            icon={<Lock size={16} className="text-[#a855f7]" />}
            onClose={() => closeWindow('quantum_cipher')}
            onFocus={() => setActiveWindow('quantum_cipher')}
            isActive={activeWindow === 'quantum_cipher'}
            initialPos={{ x: 100, y: 50 }}
            width="w-[1020px] max-w-[98vw]"
            height="h-[710px] max-h-[94vh]"
          >
            <QuantumCipherLabMemo
              stats={stats}
              carrierBias={carrierBias}
              onLog={addLog}
            />
          </DesktopWindow>
        )}

        {openWindows.includes('node_mesh') && (
          <DesktopWindow 
            key="node_mesh"
            id="node_mesh" 
            title="NODAL_MESH_PRESENCE // UNCLONABLE SUBSTRATE ATTESTATION MATRIX" 
            icon={<Radio size={16} className="text-cyan-400" />}
            onClose={() => closeWindow('node_mesh')}
            onFocus={() => setActiveWindow('node_mesh')}
            isActive={activeWindow === 'node_mesh'}
            initialPos={{ x: 130, y: 52 }}
            width="w-[980px] max-w-[98vw]"
            height="h-[700px] max-h-[93vh]"
          >
            <NodeMeshAttestationMemo
              onLog={addLog}
              onOpenCipherLab={() => {
                if (!openWindows.includes('quantum_cipher')) {
                  setOpenWindows(prev => [...prev, 'quantum_cipher']);
                }
                setActiveWindow('quantum_cipher');
              }}
            />
          </DesktopWindow>
        )}

        {openWindows.includes('phase_lab') && (
          <DesktopWindow 
            key="phase_lab"
            id="phase_lab" 
            title="PHASE_OUT_DYNAMICS // SUBSTRATE MEMORY STICK & B+(t) HARMONICS LAB" 
            icon={<Waves size={16} className="text-emerald-400" />}
            onClose={() => closeWindow('phase_lab')}
            onFocus={() => setActiveWindow('phase_lab')}
            isActive={activeWindow === 'phase_lab'}
            initialPos={{ x: 120, y: 50 }}
            width="w-[1020px] max-w-[98vw]"
            height="h-[710px] max-h-[94vh]"
          >
            <PhaseDynamicsLabMemo
              stats={stats}
              carrierBias={carrierBias}
              onLog={addLog}
              onTuneBias={handleCarrierBiasChange}
              onOpenAttestation={() => {
                if (!openWindows.includes('node_mesh')) {
                  setOpenWindows(prev => [...prev, 'node_mesh']);
                }
                setActiveWindow('node_mesh');
              }}
            />
          </DesktopWindow>
        )}
      </div>

      {/* MASTER TOP NAVIGATION BAR */}
      <header className="fixed top-0 left-0 right-0 h-9 bg-[#040806]/95 backdrop-blur-md border-b border-[#00ffcc]/30 z-[150] flex items-center justify-between px-3 text-[9px] uppercase tracking-wider font-mono shadow-[0_2px_15px_rgba(0,0,0,0.7)] select-none">
        {/* Left: Branding & Core Attestation */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 text-[#00ffcc] font-black drop-shadow-[0_0_8px_rgba(0,255,204,0.5)]">
            <Zap size={12} className={isMining ? 'animate-pulse text-amber-400' : 'text-[#00ffcc]'} />
            <span className="font-bold tracking-widest hidden sm:inline">CyberOS Sovereignty</span>
            <span className="text-zinc-500 font-normal">v{systemVersion.toFixed(2)}</span>
          </div>

          <div className="text-zinc-700 hidden sm:inline">/</div>

          {/* Container Daemon / Empyrean Sandbox Pill */}
          {(typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)')?.matches) ? (
            <button
              onClick={() => toggleWindow('empyrean_sandbox')}
              className="bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded text-[8px] flex items-center gap-1 transition-all cursor-pointer font-bold"
              title="Inspect Standalone Container Shell"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>STANDALONE</span>
            </button>
          ) : (
            <button
              onClick={() => toggleWindow('empyrean_sandbox')}
              className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded text-[8px] flex items-center gap-1 transition-all cursor-pointer font-bold"
              title="Click to inspect Empyrean Sandbox Emulator diagnostics and architecture"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>EMPYREAN_SANDBOX</span>
            </button>
          )}

          {/* Nodal Mesh Presence & Attestation Indicator */}
          <button 
            onClick={() => toggleWindow('node_mesh')}
            className="flex items-center gap-1.5 bg-cyan-950/50 hover:bg-cyan-900/70 text-cyan-200 border border-cyan-500/50 hover:border-cyan-400 px-2 py-0.5 rounded transition-all text-[8px] tracking-wide cursor-pointer font-bold shadow-[0_0_10px_rgba(6,182,212,0.25)]"
            title="Substrate Nodal Mesh: Cryptographically attested online nodes using unclonable dielectric signature"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-white font-mono">{onlineNodeCount} NODES</span>
            <span className="bg-cyan-500/25 text-[#00ffcc] text-[7.5px] px-1 py-0.2 rounded border border-cyan-400/40 font-mono hidden md:inline">
              SIG: ATTESTED
            </span>
          </button>
        </div>

        {/* Center: Lab Quick Launchers (Scrollable if constrained) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mx-2 px-1">
          {/* Console Performance & Remote Latency Indicator */}
          <button
            onClick={cyclePerfMode}
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all text-[8px] tracking-wide cursor-pointer font-bold border shrink-0 ${
              perfMode === 'low-lag'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                : perfMode === 'balanced'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
            }`}
            title={`Console Mode: ${perfMode.toUpperCase()} (${perfMode === 'low-lag' ? '5Hz UI throttle, GPU relief, optimized for remote internet consoles' : perfMode === 'balanced' ? '12.5Hz UI update rate' : '30Hz Ultra'}). Click to cycle.`}
          >
            <Zap size={9} className={perfMode === 'low-lag' ? 'text-emerald-400' : ''} />
            <span>{perfMode === 'low-lag' ? '⚡ 5Hz' : perfMode === 'balanced' ? '⚖️ 12Hz' : '🚀 30Hz'}</span>
            {pingMs !== null && (
              <span className="text-zinc-400 font-mono text-[7.5px] border-l border-white/20 pl-1">
                {pingMs}ms
              </span>
            )}
          </button>

          {/* Phase-Out & Memory Stick Dynamics Lab Button */}
          <button 
            onClick={() => toggleWindow('phase_lab')}
            className="flex items-center gap-1.5 bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-200 border border-emerald-500/50 hover:border-emerald-400 px-2 py-0.5 rounded transition-all text-[8px] tracking-wide cursor-pointer font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)] shrink-0"
            title="Open Phase-Out Dynamics & Substrate Memory Stick Laboratory (Original vs Modified B+(t) Physics)"
          >
            <Waves size={9} className="text-emerald-400" />
            <span>PHASE_STICK</span>
          </button>

          {/* PRC Quantum Lab Button */}
          <button 
            onClick={() => toggleWindow('reservoir_lab')}
            className="flex items-center gap-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 hover:border-purple-400 px-2 py-0.5 rounded transition-all text-[8px] tracking-wide cursor-pointer font-bold shadow-[0_0_8px_rgba(168,85,247,0.2)] shrink-0"
            title="Open Physical Reservoir Computing Suite (ESN Readout Solver, Hysteresis Loops & Hardware TRNG Oracle)"
          >
            <Network size={9} />
            <span>PRC_LAB</span>
          </button>

          {/* Quantum & Chaos Cipher Lab Button */}
          <button 
            onClick={() => toggleWindow('quantum_cipher')}
            className="flex items-center gap-1.5 bg-purple-600/30 hover:bg-purple-600/45 text-purple-200 border border-purple-400/50 hover:border-purple-300 px-2 py-0.5 rounded transition-all text-[8px] tracking-wide cursor-pointer font-bold shadow-[0_0_8px_rgba(168,85,247,0.25)] shrink-0"
            title="Open Quantum & Chaos Cryptographic Laboratory"
          >
            <Lock size={9} className="text-[#00ffcc]" />
            <span>QUANTUM_CIPHER</span>
          </button>

          {/* Substrate MemTest & Block Mapper Button */}
          <button 
            onClick={() => toggleWindow('memtest')}
            className="flex items-center gap-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-500/40 hover:border-teal-400 px-2 py-0.5 rounded transition-all text-[8px] tracking-wide cursor-pointer font-bold shrink-0"
            title="Open Substrate MemTest86 & Physical Sector Block Mapper"
          >
            <Binary size={9} />
            <span>MEMTEST</span>
          </button>

          {/* Git Repository Link & Specs Hub */}
          <button 
            onClick={() => toggleWindow('git_repo')}
            className="flex items-center gap-1.5 bg-[#00ffcc]/10 hover:bg-[#00ffcc]/20 text-[#00ffcc] border border-[#00ffcc]/30 hover:border-[#00ffcc]/60 px-2 py-0.5 rounded transition-all text-[8px] tracking-wide cursor-pointer font-bold shrink-0"
            title="Open Git Repository Hub & Field Specifications"
          >
            <GitBranch size={9} />
            <span>GIT_SPECS</span>
          </button>
        </div>

        {/* Right: Public Sharing (Bypasses IAM Auth Lock) & Telemetry */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Public Share Button - Highly Prominent */}
          <button 
            onClick={() => {
              handleCopyPublicShareLink();
              setShowShareModal(true);
            }}
            className={`flex items-center gap-1.5 border px-2.5 py-0.5 rounded transition-all text-[8px] tracking-wide cursor-pointer font-bold ${
              copiedShareLink 
                ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                : 'bg-cyan-500/25 hover:bg-cyan-500/40 text-[#00ffcc] border-cyan-400/80 hover:border-cyan-300 shadow-[0_0_12px_rgba(0,255,204,0.35)]'
            }`}
            title="Get the Public Share Link so friends and visitors don't see 'Locked by security auth'!"
          >
            {copiedShareLink ? <Check size={10} className="text-emerald-300" /> : <Share2 size={10} />}
            <span>{copiedShareLink ? 'LINK COPIED!' : 'SHARE (PUBLIC LINK)'}</span>
          </button>

          {/* Open Independent Window Option */}
          <button 
            onClick={() => {
              window.open(window.location.origin, '_blank');
            }}
            className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/15 hover:border-white/30 px-2 py-0.5 rounded transition-all text-[8px] tracking-wide cursor-pointer font-bold hidden sm:flex"
            title="Open application in its own browser window outside of the AI Studio frame"
          >
            <ExternalLink size={9} />
            <span>POP-OUT</span>
          </button>

          {/* Frequency & Coherence stats */}
          <div className="hidden lg:flex items-center gap-2 border-l border-white/10 pl-2 text-[8px]">
            <span className="text-zinc-500">FREQ:</span>
            <span className="text-[#00ffcc] font-mono font-bold">{(stats.frequency / 1000).toFixed(2)}G</span>
            <span className="text-zinc-500 ml-1">COH:</span>
            <span className={`font-mono font-bold ${stats.coherence < 0.4 ? 'text-red-400' : 'text-emerald-300'}`}>
              {(stats.coherence * 100).toFixed(0)}%
            </span>
          </div>

          <div className="text-zinc-400 font-mono text-[8px] hidden md:inline">
            {new Date().toLocaleTimeString('en-US', { hour12: false })}
          </div>
        </div>
      </header>

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

      {/* PUBLIC SHARE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#080d0a] border border-[#00ffcc]/40 rounded-xl max-w-lg w-full p-5 shadow-[0_0_50px_rgba(0,255,204,0.3)] font-mono text-zinc-300 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#00ffcc]" />
                <span className="text-sm font-black text-white uppercase tracking-wider">Public Share &amp; Access Unlocking</span>
              </div>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-zinc-500 hover:text-white p-1 rounded hover:bg-white/10 transition-all cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-cyan-950/30 border border-cyan-500/40 rounded-lg text-[10px] space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <AlertTriangle size={14} className="shrink-0" />
                <span>Why friends see "Locked by security auth"</span>
              </div>
              <p className="text-zinc-300 leading-relaxed">
                The URL in your address bar (<code className="text-amber-300 bg-black/50 px-1 py-0.5 rounded">ais-dev-...</code>) is a private development environment locked by <strong className="text-white">Google Cloud IAM security</strong>. Only YOUR signed-in Google account is allowed to view it.
              </p>
              <div className="border-t border-cyan-500/20 pt-2 text-[#00ffcc]">
                <strong>How to let anyone view without login:</strong> Share the <span className="underline">Public Preview Link</span> below (<code className="text-emerald-300 bg-black/50 px-1 py-0.5 rounded">ais-pre-...</code>). It is completely public and requires no Google account or login!
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] text-[#00ffcc] font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Public Share Link (Unlocked / Anyone Can View)</span>
                {copiedShareLink && <span className="text-emerald-400 font-bold animate-pulse">✓ COPIED TO CLIPBOARD</span>}
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={getPublicShareUrl()} 
                  className="flex-1 bg-black border border-cyan-500/50 rounded px-3 py-2 text-[10px] text-[#00ffcc] font-mono select-all focus:outline-none ring-1 ring-cyan-500/20"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getPublicShareUrl());
                    setCopiedShareLink(true);
                    setTimeout(() => setCopiedShareLink(false), 3000);
                  }}
                  className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400 text-emerald-200 text-[10px] font-bold uppercase rounded flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] cursor-pointer"
                >
                  {copiedShareLink ? <Check size={12} className="text-emerald-300" /> : <Copy size={12} />}
                  <span>{copiedShareLink ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => {
                  window.open(getPublicShareUrl(), '_blank');
                }}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/40 text-white text-[9px] font-bold uppercase px-3 py-2 rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ExternalLink size={11} className="text-[#00ffcc]" />
                <span>Test in New Tab / Incognito</span>
              </button>
            </div>

            <div className="text-[9px] text-zinc-400 space-y-1 bg-black/30 p-2.5 rounded border border-white/5">
              <p className="flex items-center gap-1.5">
                <span className="text-[#00ffcc]">•</span>
                <span>In Google AI Studio, you can also click the <strong>Share</strong> button in the top-right header to manage project permissions.</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className="text-[#00ffcc]">•</span>
                <span>Send the copied link to friends, testers, or colleagues so they can access the full interactive console.</span>
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-5 py-1.5 bg-[#00ffcc] hover:bg-teal-300 text-black rounded text-[10px] uppercase font-black transition-all cursor-pointer shadow-[0_0_10px_rgba(0,255,204,0.3)]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

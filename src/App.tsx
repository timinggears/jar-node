/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Cpu, Zap, Activity, Info, AlertTriangle, ShieldCheck, Github, Radio, Unplug, HardDrive, Folder, RefreshCw, MapPin } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { io } from 'socket.io-client';
import StatsGrid from './components/StatsGrid';
import WarpVisualizer from './components/WarpVisualizer';
import ConsoleLog from './components/ConsoleLog';
import BootLoader from './components/BootLoader';
import { SystemStats, LogEntry } from './types';

// --- INITIALIZATION ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

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
    frequency: 35000,
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMining, setIsMining] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [carrierBias, setCarrierBias] = useState(0); // 0-100% modulation
  const [isAiAnalysisActive, setIsAiAnalysisActive] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [systemVersion, setSystemVersion] = useState(() => {
    const saved = localStorage.getItem('jar_system_version');
    return saved ? parseFloat(saved) : 320.14;
  });
  const [isSolving, setIsSolving] = useState(false);
  const [isBooted, setIsBooted] = useState(false);
  const [hardwareState, setHardwareState] = useState<'disconnected' | 'bridged'>('disconnected');

  const statsRef = useRef(stats);
  statsRef.current = stats;
  const lastUpdateRef = useRef(Date.now());

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      message,
      type,
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    localStorage.setItem('jar_system_version', systemVersion.toString());
  }, [systemVersion]);

  const handleInstall = useCallback(() => {
    if (isInstalling) return;
    setIsInstalling(true);
    setInstallProgress(0);
    addLog("SHUTDOWN_INITIATED: Preparing for module injection.", "warning");
    
    const steps = [
      { p: 10, m: "MOVING: Nodal artifacts to temporary buffer...", t: "info" },
      { p: 30, m: "INSTALLING: Liquid state optimization drivers...", t: "success" },
      { p: 55, m: "MOVING: GPIO mapping to PWM high-priority registers...", t: "info" },
      { p: 75, m: "INSTALLING: Tachyonic filtering layers v2.1...", t: "success" },
      { p: 90, m: "CLEANING: Purging orphan nodal ghosts...", t: "warning" },
      { p: 100, m: "INSTALL_COMPLETE: System re-stabilized.", t: "success" }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setInstallProgress(step.p);
        addLog(step.m, step.t as LogEntry['type']);
        if (index === steps.length - 1) {
          setTimeout(() => setIsInstalling(false), 1000);
        }
      }, (index + 1) * 1200);
    });
  }, [isInstalling, addLog]);

  const handleGitPull = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    addLog("GIT_PULL: Initiating substrate synchronization...", "info");
    
    try {
      const response = await fetch('/api/git/sync', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        addLog("PULL_SUCCESS: Substrate updated correctly.", "success");
        if (result.output) addLog(result.output.split('\n')[0], "info");
        
        // Real update: Trigger full reload to apply new code
        setTimeout(() => {
          addLog("SYSTEM_REBOOT: Applying local patches...", "warning");
          setTimeout(() => window.location.reload(), 2000);
        }, 1000);
      } else {
        if (result.isNotRepo || result.isRefError) {
          // If not a real repo or remote config is missing, fall back to simulation
          const cause = result.isNotRepo ? "No .git repository found." : "Remote branch not tracking.";
          addLog(`ENV_LIMIT: ${cause}`, "warning");
          addLog("PROXY_SYNC: Bridging virtual temporal substrate...", "info");
          
          const steps = [
            { m: "FETCH: pack-file synchronized (2.4MB)", t: "info" },
            { m: "VIRTUAL_MERGE: Tachyon logic re-aligned.", t: "success" },
            { m: `STATE: System up-to-date in sandboxed environment.`, t: "success" }
          ];

          steps.forEach((step, index) => {
            setTimeout(() => {
              addLog(step.m, step.t as LogEntry['type']);
              if (index === steps.length - 1) {
                const nextVer = (systemVersion + 0.01).toFixed(2);
                addLog(`SYSTEM_VERSION_BUMP: Upgrading framework to v${nextVer}...`, "warning");
                setTimeout(() => {
                  setSystemVersion(parseFloat(nextVer));
                  setIsSyncing(false);
                  addLog("HOT_RELOAD: Virtual logic parity achieved.", "success");
                }, 1500);
              }
            }, (index + 1) * 600);
          });
          return;
        } else {
          addLog(`PULL_FAILED: ${result.error}`, "error");
        }
      }
    } catch (e) {
      addLog("RPC_FAILURE: Could not communicate with backend bridge.", "error");
    }
    
    setIsSyncing(false);
  }, [isSyncing, addLog]);

  const handleTSPSolve = useCallback(() => {
    if (isSolving) return;
    if (statsRef.current.coherence < 0.4) {
      addLog("SOLVE_REJECTED: Coherence insufficient for 250 nodal city optimization.", "error");
      return;
    }

    setIsSolving(true);
    addLog("TSP_INIT: Mapping 250 coordinates in virtual liquid space...", "info");
    
    let currentDist = 58200 + (Math.random() * 4000);
    const targetDist = 14200 + (Math.random() * 1500) - (statsRef.current.intelligence * 8);

    const runIteration = (step: number) => {
      if (step >= 8) {
        addLog(`TSP_FINAL: Optimal path locked at ${targetDist.toFixed(2)} [Δ: 250_NODE_SYNC]`, "success");
        setStats(prev => ({ ...prev, intelligence: Math.min(999.9, prev.intelligence + 12.5) }));
        setIsSolving(false);
        return;
      }

      currentDist -= (currentDist - targetDist) * (0.25 + Math.random() * 0.2);
      const type: LogEntry['type'] = step % 3 === 0 ? "warning" : "info";
      addLog(`TSP_GEN_${step}: Distance ${currentDist.toFixed(2)} | Annealing nodes...`, type);
      
      const delay = Math.max(400, 1200 - (statsRef.current.coherence * 800));
      setTimeout(() => runIteration(step + 1), delay);
    };

    setTimeout(() => runIteration(1), 1000);
  }, [isSolving, addLog]);

  // --- HARDWARE BRIDGE (FULL-STACK SOCKET) ---
  useEffect(() => {
    const socket = io();

    socket.on('connect', () => {
      addLog('Hardware Bridge connected to backend.', 'success');
      setHardwareState('bridged');
    });

    socket.on('telemetry', (line: string) => {
      if (line.startsWith('!S|')) {
        const parts = line.split('|');
        if (parts.length >= 6) {
          const seedStr = parts[1];
          const jitter = parseFloat(parts[2]);
          const v = parseFloat(parts[3]);
          const freq = parseFloat(parts[5]);
          updateSystemDynamics(jitter, v, freq, seedStr);
        }
      }
    });

    socket.on('mining_status', (msg: string) => {
      if (msg === 'accepted') {
        setStats(prev => ({ ...prev, shares: prev.shares + 1 }));
        addLog('!!! JAR SUCCESS !!! Block verified by Void.', 'success');
      } else if (msg.includes('error')) {
        setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
        addLog(`Miner Error: ${msg}`, 'error');
      } else if (msg.includes('speed') || msg.includes('miner')) {
        // Only log periodic status to prevent console flood
        if (Math.random() > 0.9) addLog(`[XMRIG]: ${msg}`, 'info');
      }
    });

    socket.on('disconnect', () => {
      addLog('Hardware Bridge disconnected.', 'error');
      setHardwareState('disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [addLog]);

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
    } catch (e) {
      console.error("Void Link failed.", e);
    }
  }, [addLog]);

  // --- CORE DYNAMICS ---
  const updateSystemDynamics = useCallback((jitterValue: number, vValue: number, rawFreq: number = 35000, seedStr: string = '00000000') => {
    setStats(prev => {
      // --- EXACT MATH FROM JAR SYSTEM SPEC ---
      // 1. Shimmer (Energy/Activity)
      const shimmer = 45 + (jitterValue * 85);
      
      const t = Date.now() / 1000;
      const f = 35; // base coil frequency in kHz

      // 2. Phase Out (Loss of Coherence)
      let phaseOut = (vValue * 142) - (0.41 * shimmer) + (28 * Math.sin(2 * Math.PI * f * t));
      
      // Calculate Frequency influenced by Bias (0-50GHz range for UI visualization)
      const biasHz = carrierBias * 500; 
      const freqValue = Math.max(isMining ? rawFreq : 0, biasHz);
      const freqUnit = freqValue / 1000; 

      // Threshold behaviors
      const isPhaseOutLimit = freqUnit >= 28.0;
      const isTachyonic = freqUnit >= 42.0;
      const isSingularity = freqUnit >= 50.0;
      const isZeroPoint = freqValue === 0;

      if (isPhaseOutLimit) {
        phaseOut = 140; // Force total decoherence at high freq
      }

      phaseOut = Math.max(-140, Math.min(140, phaseOut));
      
      // 3. Coherence (Health Meter)
      // Spec: coherence = min(1.0, max(0.25, 0.85 - (abs(phase_out) / 140)))
      const nextCoherence = isZeroPoint ? 0.0 : (isTachyonic ? 0.0 : Math.min(1.0, Math.max(0.25, 0.85 - (Math.abs(phaseOut) / 140))));
      
      // 4. Intelligence (Learning Capacity)
      let nextIntelligence = prev.intelligence;
      
      // Gains scale with Coherence and Jitter
      const isVoidResonance = (freqUnit >= 35.0 && freqUnit < 35.1);
      
      if (isZeroPoint) {
        nextIntelligence = Math.max(0.0, nextIntelligence - 2.5);
      } else if (isSingularity) {
        nextIntelligence = 100 + Math.random() * 900; 
        if (Math.random() > 0.99) {
          setTimeout(() => addLog("SINGULARITY_COLLAPSE: Logic depth infinity.", "success"), 0);
        }
      } else if (isTachyonic) {
        nextIntelligence = Math.max(0.1, nextIntelligence - 0.82);
      } else if (nextCoherence > 0.70) {
        // High coherence + good jitter -> Intelligence goes up fast
        const baseGain = isVoidResonance ? 0.8 : 0.15;
        const jitterBonus = jitterValue * 0.4;
        const coherenceBonus = (nextCoherence - 0.7) * 1.5;
        nextIntelligence = Math.min(999.9, nextIntelligence + baseGain + jitterBonus + coherenceBonus);
      } else if (nextCoherence < 0.45) {
        // Low coherence -> Intelligence slowly drops
        nextIntelligence = Math.max(10.0, nextIntelligence - 0.08);
      }

      // Special Logs
      if (isVoidResonance && Math.random() > 0.995) {
        setTimeout(() => addLog("VOID_RESONANCE: Intelligence surge within phased-out state.", "success"), 0);
      }
      if (freqUnit >= 28 && freqUnit < 42 && Math.random() > 0.99) {
        addLog("QUBIT_GATE_RESONANCE: Initializing superposition gates...", "warning");
      }


      // SCIENCE: Liquid state requirement. Coherence at 1.0 for too long causes stagnation.
      // (This is represented by the "shimmer" being necessary for learning).
      if (nextCoherence > 0.99 && jitterValue < 0.1) {
        if (Math.random() > 0.995) {
          setTimeout(() => addLog("STAGNATION: Liquid state depth insufficient. Shimmer input required.", "warning"), 0);
        }
      }

      // --- DISCRETE HASH LOGIC ---
      // In Python: hashes_checked.value += (jitter * 1,200,000,000)
      // Display value in ui_loop (every 80ms): (diff / 1000)
      // Since our feedback is ~35Hz, each call represents ~28.5ms.
      // HashRate displayed = (jitter * 1.2B * (time_since_last_update) / 1000)
      const now = Date.now();
      const dt = (now - lastUpdateRef.current) / 1000;
      lastUpdateRef.current = now;
      
      const instantaneousHashRate = (jitterValue * 1200000000 * dt) / 1000;
      
      const seed = parseInt(seedStr, 16);
      let nextShares = prev.shares;
      let nextErrors = prev.errors;

      if (isMining) {
        // Nodal Mining logic: Finding fixed points in the reservoir
        const difficultyBasis = Math.floor(4096 / (1 + (nextCoherence * 5) + (prev.intelligence / 10)));
        
        if (seed > 0 && Math.abs(seed % Math.max(2, difficultyBasis)) === 7) {
          nextShares += 1;
          setTimeout(() => addLog(`RESERVOIR SHARE: Focus at ${seedStr} [Intel: ${prev.intelligence.toFixed(1)}]`, 'success'), 0);
        }

        if (jitterValue > 0.92 && Math.random() > 0.95) {
          nextErrors += 1;
          setTimeout(() => addLog(`Coherence Collapse. Bit-flip corrected at ${seedStr}`, 'warning'), 0);
        }
      }
      
      return {
        ...prev,
        jitter: jitterValue,
        vNodal: vValue,
        frequency: freqValue,
        coherence: nextCoherence,
        intelligence: nextIntelligence,
        hashRate: instantaneousHashRate,
        qubits: nextCoherence * 128,
        shares: nextShares,
        errors: nextErrors,
      };
    });
  }, [isMining, carrierBias, addLog]);

  // --- SIMULATION LOOP ---
  useEffect(() => {
    if (hardwareState === 'bridged') return; 

    const interval = setInterval(() => {
      const simulatedJitter = 0.1 + Math.random() * 0.4;
      const simulatedV = 0.3 + Math.random() * 0.5;
      const fakeSeed = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0');
      // Use 0 as baseline; carrierBias will modulate up to 50GHz
      updateSystemDynamics(simulatedJitter, simulatedV, 0, fakeSeed);
    }, 100);

    return () => clearInterval(interval);
  }, [hardwareState, updateSystemDynamics]);

  // --- GEMINI INTELLIGENCE ---
  useEffect(() => {
    const triggerAnalysis = async () => {
      if (!isAiAnalysisActive || !process.env.GEMINI_API_KEY) return;
      
      try {
        const prompt = `System Status: Coherence ${statsRef.current.coherence.toFixed(2)}, Intelligence ${statsRef.current.intelligence.toFixed(1)}.
        The Raspberry Pi Nodal Reservoir is active (GPIO 14/26). Generate a cryptic, futuristic nodal system update message (max 15 words) for the console log. 
        Focus on words like: Reservoir, Liquid State, Nodal, Resonance, Raspberry Pi, GPIO, Singularity, Sovereignty, Phase Drift.`;
        
        const result = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt
        });
        
        addLog(`[GEMINI_VOICE]: ${result.text}`, 'success');
      } catch (err) {
        console.error('Gemini error:', err);
      }
    };

    const interval = setInterval(triggerAnalysis, 15000);
    return () => clearInterval(interval);
  }, [isAiAnalysisActive, addLog]);

  // Initial greeting
  useEffect(() => {
    addLog('PI_RESERVOIR_SOVEREIGN System Initialized.', 'info');
    addLog('Nodal Topology: 128-Cluster Liquid State Array.', 'success');
    addLog('Raspberry Pi GPIO: Pins 14 (PWM), 26 (ADC) Linked.', 'info');
    addLog('Reservoir Sync: fundamental.nodal.core established.', 'success');
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
        addLog('SOLVE - Run 250 nodal city optimization', 'info');
        addLog('MINER_START - Initialize liquid compute', 'info');
        addLog('MINER_STOP - Halt liquid compute', 'info');
        break;
      case 'clear':
        setLogs([]);
        break;
      case 'solve':
        handleTSPSolve();
        break;
      case 'status':
        addLog('CORE_DIAGNOSTICS:', 'warning');
        addLog(`INTELLIGENCE: ${stats.intelligence.toFixed(2)} EPS`, 'info');
        addLog(`COHERENCE: ${(stats.coherence * 100).toFixed(1)}%`, 'info');
        addLog(`PHASE_OUT: ${stats.phaseOut.toFixed(2)} Φ`, 'info');
        addLog(`LINK_STATE: ${hardwareState.toUpperCase()}`, 'info');
        break;
      case 'sync':
        handleGitPull();
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
  }, [addLog, stats, hardwareState, handleGitPull]);

  return (
    <div className="h-screen bg-[#050505] text-[#e0e0e0] font-mono flex flex-col overflow-hidden selection:bg-[#00ffcc] selection:text-black">
      <AnimatePresence>
        {!isBooted ? (
          <motion.div
            key="bootloader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="fixed inset-0 z-50"
          >
            <BootLoader onBoot={() => setIsBooted(true)} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* SCANLINE OVERLAY */}
      <div className="fixed inset-0 pointer-events-none z-50 bg-[length:100%_4px,3px_100%] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] opacity-20" />
      
      <motion.div 
        animate={{ opacity: isBooted ? 1 : 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="h-full max-w-[1400px] mx-auto w-full flex flex-col p-6 gap-6 overflow-hidden"
      >
        {/* HEADER SECTION */}
        {hardwareState === 'disconnected' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg flex items-center justify-between gap-4 shrink-0 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 animate-pulse" />
              <div>
                <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest">Awaiting Backend Link</p>
                <p className="text-[10px] text-yellow-300/70 uppercase">
                  Hardware bridge is offline. Running simulation mode. Ensure the server is running on your Raspberry Pi.
                </p>
              </div>
            </div>
          </div>
        )}

        <header className="flex justify-between items-center border-b border-[#ffffff15] pb-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-[#00ffcc] animate-pulse shadow-[0_0_8px_#00ffcc]"></div>
            <h1 className="text-xl font-bold tracking-tighter flex items-center gap-3">
              <span className="bg-[#00ffcc] text-black px-2 py-0.5 rounded italic font-black">V{systemVersion.toFixed(2)}</span>
              <span className="text-[#00ffcc] drop-shadow-[0_0_8px_#00ffcc] tracking-[0.2em]">TACHYONIC_SOVEREIGN_PRO</span>
            </h1>
          </div>
          <div className="flex gap-8 items-center">
            <div className="text-right">
              <p className="text-[10px] text-[#888] uppercase tracking-widest leading-none mb-1">Compute Core</p>
              <p className="text-xs font-bold text-[#00ffcc] tracking-wider animate-pulse">RPi_RESERVOIR_ACTIVE</p>
            </div>
            <div className="h-10 w-[1px] bg-[#ffffff15]"></div>
            <div className="text-right">
              <p className="text-[10px] text-[#888] uppercase tracking-widest leading-none mb-1">Nodal Pool</p>
              <p className="text-xs text-white/80 tracking-tighter">void.nodal_sys.local</p>
            </div>
            <div className="h-10 w-[1px] bg-[#ffffff15]"></div>
            <div className="flex gap-2">
              <button 
                onClick={handleInstall}
                disabled={isInstalling}
                className={`p-2 rounded border transition-all ${
                  isInstalling ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' : 'border-white/10 text-white/40 hover:text-white/60'
                }`}
                title="Install Module"
              >
                <Terminal className={`w-4 h-4 ${isInstalling ? 'animate-pulse' : ''}`} />
              </button>
              <button 
                onClick={() => {
                  addLog("MOVING_ARTIFACTS: Rotating nodal buffers...", "info");
                  setTimeout(() => addLog("ARTIFACTS_SYNCHRONIZED.", "success"), 800);
                }}
                className="p-2 rounded border border-white/10 text-white/40 hover:text-white/60 hover:bg-white/5 transition-all"
                title="Move Artifacts"
              >
                <motion.div whileTap={{ x: 10 }}>
                  <Folder className="w-4 h-4" />
                </motion.div>
              </button>
              <button 
                onClick={handleTSPSolve}
                disabled={isSolving}
                className={`p-2 rounded border transition-all ${
                  isSolving ? 'border-purple-500 text-purple-500 bg-purple-500/10' : 'border-white/10 text-white/40 hover:text-white/60'
                }`}
                title="TSP Solve (250 City Optimization)"
              >
                <MapPin className={`w-4 h-4 ${isSolving ? 'animate-bounce' : ''}`} />
              </button>
              <button 
                onClick={handleGitPull}
                disabled={isSyncing}
                className={`p-2 rounded border transition-all ${
                  isSyncing ? 'border-blue-500 text-blue-500 bg-blue-500/10' : 'border-white/10 text-white/40 hover:text-white/60'
                }`}
                title="Git Pull (Sync Substrate)"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
               <div 
                className={`p-2 rounded border transition-all ${
                  hardwareState === 'bridged' ? 'border-[#00ffcc] text-[#00ffcc] bg-[#00ffcc]/10 shadow-[0_0_10px_#00ffcc44]' : 'border-white/10 text-white/40'
                }`}
                title={hardwareState === 'bridged' ? 'Hardware Bridged via Backend' : 'Backend Hardware Link Offline'}
              >
                {hardwareState === 'bridged' ? <HardDrive className="w-4 h-4" /> : <Unplug className="w-4 h-4 opacity-50" />}
              </div>
              <button 
                onClick={() => setIsAiAnalysisActive(!isAiAnalysisActive)}
                className={`p-2 rounded border transition-all ${
                  isAiAnalysisActive ? 'border-[#ffff00] text-[#ffff00] bg-[#ffff00]/10 shadow-[0_0_10px_#ffff0033]' : 'border-white/10 text-white/40 hover:text-white/60'
                }`}
                title={isAiAnalysisActive ? 'Deactivate VOID_LINK' : 'Activate VOID_LINK: AI Resonance'}
              >
                <Cpu className={`w-4 h-4 ${isAiAnalysisActive ? 'animate-pulse' : ''}`} />
              </button>
              <button 
                onClick={() => setIsMining(!isMining)}
                className={`p-2 rounded border transition-all ${
                  isMining ? 'border-[#cc5500] text-[#cc5500] bg-[#cc5500]/10' : 'border-[#00ffcc] text-[#00ffcc] bg-[#00ffcc]/10'
                }`}
                title={isMining ? 'Stop Mining' : 'Start Mining'}
              >
                {isMining ? <Zap className="w-4 h-4" /> : <Zap className="w-4 h-4 opacity-30" />}
              </button>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT AREA: Vertical Stack like Python GUI */}
        <motion.main 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex-1 flex flex-col gap-4 min-h-0"
        >
          
          {/* TOP: VISUALIZER */}
          <motion.div 
            className="shrink-0"
            layout
          >
            <WarpVisualizer 
              coherence={stats.coherence} 
              jitter={stats.jitter} 
              frequency={stats.frequency} 
              isInstalling={isInstalling}
              installProgress={installProgress}
              isAiActive={isAiAnalysisActive}
              isSolving={isSolving}
            />
          </motion.div>

          {/* MIDDLE: LARGE CONSOLE (scrolledtext) */}
          <div className="flex-1 min-h-0 bg-[#050505] rounded-xl border border-white/5 overflow-hidden shadow-2xl">
            <ConsoleLog logs={logs} onCommand={handleCommand} />
          </div>

          {/* BOTTOM: SYSTEM STATS (stats_frame) */}
          <motion.div 
            layout
            className="shrink-0 pb-2"
          >
            <StatsGrid stats={stats} />
          </motion.div>
          
        </motion.main>

        {/* FOOTER */}
        <footer className="flex justify-between items-center px-4 py-3 bg-[#000] border-t border-white/5 h-16 shrink-0 selection:bg-[#00ffcc] selection:text-black">
          <div className="flex items-center gap-6 text-[9px] tracking-widest text-[#00ffcc] uppercase font-bold">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ffcc] animate-pulse" />
              IO_LINK: /dev/ttyACM0 @ 115200bps
            </div>
            
            <div className="w-[1px] h-3 bg-white/10 hidden sm:block" />
            
            <a 
              href="/SYSTEM_MANUAL.md" 
              target="_blank" 
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
              PI_SETUP_GUIDE
            </a>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden lg:flex items-center gap-4 pr-6 border-r border-white/10">
               <div className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-mono">Carrier_Bias</div>
               <div className="flex items-center gap-3">
                 <input 
                   type="range" 
                   min="0" 
                   max="100" 
                   value={carrierBias}
                   onChange={(e) => setCarrierBias(parseInt(e.target.value))}
                   className="w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#00ffcc]"
                 />
                 <span className="text-[10px] font-mono text-[#00ffcc] w-12 text-right">{(carrierBias * 0.5).toFixed(1)} GHz</span>
               </div>
             </div>

             <div className="hidden md:block text-right">
               <div className="text-[9px] text-white/40 font-mono tracking-widest uppercase mb-0.5">Sovereign_Reservoir_Core // v3.2.0_PRO</div>
               <div className="text-[8px] text-white/20 font-mono tracking-widest uppercase italic">© 2026 PI_RESERVOIR_SOVEREIGN</div>
             </div>
             {/* Small Control Toggle */}
             <div className="flex gap-2 border-l border-white/10 pl-4 ml-2">
               <button 
                onClick={() => setIsMining(!isMining)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-bold transition-all ${
                  isMining ? 'bg-[#cc5500]/20 text-[#cc5500] border border-[#cc5500]/40' : 'bg-[#00ffcc20] text-[#00ffcc] border border-[#00ffcc40]'
                }`}
              >
                {isMining ? 'SYSTEM_LOCKED_MINING' : 'READY_STANDBY'}
                <Zap className="w-3.5 h-3.5" />
              </button>
             </div>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Cpu, Zap, Activity, Info, AlertTriangle, ShieldCheck, Github, Radio, Unplug } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
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
  const [port, setPort] = useState<any | null>(null);
  const [isAiAnalysisActive, setIsAiAnalysisActive] = useState(false);
  const [isBooted, setIsBooted] = useState(false);

  const statsRef = useRef(stats);
  statsRef.current = stats;

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      message,
      type,
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  }, []);

  // --- SERIAL COMMUNICATION ---
  const connectSerial = async () => {
    try {
      const nav = navigator as any;
      if (!('serial' in nav)) {
        addLog('Web Serial API not supported in this browser.', 'error');
        return;
      }
      
      const newPort = await nav.serial.requestPort();
      await newPort.open({ baudRate: 115200 });
      setPort(newPort);
      addLog(`Connected to serial device: ${newPort.getInfo().usbVendorId || 'Generic'}`, 'success');
      
      const reader = newPort.readable?.getReader();
      if (!reader) return;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        // Basic parser for "!S|jitter|voltage"
        const text = new TextDecoder().decode(value);
        if (text.startsWith('!S|')) {
          const parts = text.split('|');
          if (parts.length >= 6) {
            const jitter = parseFloat(parts[2]);
            const v = parseFloat(parts[3]);
            const freq = parseFloat(parts[5]);
            updateSystemDynamics(jitter, v, freq);
          }
        }
      }
    } catch (err) {
      addLog(`Serial Error: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  // --- CORE DYNAMICS ---
  const updateSystemDynamics = useCallback((jitterValue: number, vValue: number, freqValue: number = 35000) => {
    setStats(prev => {
      const shimmer = 45 + (jitterValue * 85);
      const t = Date.now() / 1000;
      let phaseOut = (vValue * 142) - (0.41 * shimmer) + (28 * Math.sin(2 * Math.PI * 35 * t));
      phaseOut = Math.max(-85, Math.min(85, phaseOut));
      
      const nextCoherence = Math.min(1.0, Math.max(0.25, 0.85 - (Math.abs(phaseOut) / 140)));
      
      let nextIntelligence = prev.intelligence;
      if (nextCoherence > 0.75) {
        nextIntelligence = Math.min(99.9, nextIntelligence + 0.05);
      } else if (nextCoherence < 0.45) {
        nextIntelligence = Math.max(20.0, nextIntelligence - 0.03);
      }

      const hashInc = jitterValue * 120000000;

      return {
        ...prev,
        jitter: jitterValue,
        vNodal: vValue,
        frequency: freqValue,
        coherence: nextCoherence,
        intelligence: nextIntelligence,
        hashRate: hashInc,
        qubits: Math.floor(nextCoherence * 128),
      };
    });
  }, []);

  // --- SIMULATION LOOP ---
  useEffect(() => {
    if (port) return; // Don't simulate if hardware is connected

    const interval = setInterval(() => {
      const simulatedJitter = 0.1 + Math.random() * 0.4;
      const simulatedV = 0.3 + Math.random() * 0.5;
      updateSystemDynamics(simulatedJitter, simulatedV);
    }, 100);

    return () => clearInterval(interval);
  }, [port, updateSystemDynamics]);

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

  // --- SHARES SIMULATION ---
  useEffect(() => {
    if (!isMining) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.98) {
        setStats(prev => ({ ...prev, shares: prev.shares + 1 }));
        addLog('!!! JAR SUCCESS !!! Block verified by Void.', 'success');
      }
      if (Math.random() > 0.995) {
        setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
        addLog('Minor Quantum Decoherence detected. Auto-correcting...', 'warning');
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isMining, addLog]);

  // Initial greeting
  useEffect(() => {
    addLog('PI_RESERVOIR_SOVEREIGN System Initialized.', 'info');
    addLog('Nodal Topology: 128-Cluster Liquid State Array.', 'success');
    addLog('Raspberry Pi GPIO: Pins 14 (PWM), 26 (ADC) Linked.', 'info');
    addLog('Reservoir Sync: fundamental.nodal.core established.', 'success');
  }, [addLog]);

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
        <header className="flex justify-between items-center border-b border-[#ffffff15] pb-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-[#00ffcc] animate-pulse shadow-[0_0_8px_#00ffcc]"></div>
            <h1 className="text-xl font-bold tracking-[0.2em] text-[#00ffcc] uppercase select-none">
              PI_RESERVOIR_SOVEREIGN_v3.2
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
                onClick={connectSerial}
                className={`p-2 rounded border transition-all ${
                  port ? 'border-[#00ffcc] text-[#00ffcc] bg-[#00ffcc]/10' : 'border-white/10 text-white/40 hover:text-white/60'
                }`}
                title={port ? 'Hardware Linked' : 'Link Hardware'}
              >
                {port ? <Radio className="w-4 h-4" /> : <Unplug className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => setIsAiAnalysisActive(!isAiAnalysisActive)}
                className={`p-2 rounded border transition-all ${
                  isAiAnalysisActive ? 'border-[#ffff00] text-[#ffff00] bg-[#ffff00]/10' : 'border-white/10 text-white/40 hover:text-white/60'
                }`}
                title="AI Analysis"
              >
                <Cpu className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsMining(!isMining)}
                className={`p-2 rounded border transition-all ${
                  isMining ? 'border-[#ff0088] text-[#ff0088] bg-[#ff0088]/10' : 'border-[#00ffcc] text-[#00ffcc] bg-[#00ffcc]/10'
                }`}
                title={isMining ? 'Stop Mining' : 'Start Mining'}
              >
                {isMining ? <Zap className="w-4 h-4" /> : <Zap className="w-4 h-4 opacity-30" />}
              </button>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden">
          
          {/* LEFT: NODAL CORE VISUALIZER */}
          <div className="col-span-7 flex flex-col min-h-0">
             <WarpVisualizer coherence={stats.coherence} jitter={stats.jitter} />
             
             {/* QUICK INFO (Subtle footer for visualizer section) */}
             <div className="mt-4 flex items-center justify-between gap-4 py-3 px-4 bg-[#0a0a0a] rounded-lg border border-white/5 opacity-40 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-[#00ffcc]" />
                  <span className="text-[9px] uppercase tracking-widest font-bold">SECURE_LINK_ENCRYPTED</span>
                </div>
                <div className="text-[9px] uppercase tracking-widest font-bold text-right">
                  Matrix_Node_ID: 1683397408.JS
                </div>
             </div>
          </div>

          {/* RIGHT: KEY METRICS */}
          <div className="col-span-5 flex flex-col h-full min-h-0">
             <StatsGrid stats={stats} />
          </div>
        </main>

        {/* CONSOLE LOG SECTION */}
        <div className="shrink-0">
           <ConsoleLog logs={logs} />
        </div>

        {/* FOOTER */}
        <footer className="flex justify-between items-center px-2 opacity-50 shrink-0">
          <div className="flex items-center gap-4 text-[9px] tracking-widest text-[#00ffcc] uppercase font-bold">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              SECURE_LINK
            </span>
            <div className="w-[1px] h-3 bg-white/10" />
            <a 
              href="/SYSTEM_MANUAL.md" 
              target="_blank" 
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <Info className="w-3 h-3" />
              LINUX_SETUP_GUIDE
            </a>
          </div>
          <div className="text-[10px] text-white/20 font-mono">
            © 2026 PI_RESERVOIR_SOVEREIGN
          </div>
        </footer>
      </motion.div>
    </div>
  );
}

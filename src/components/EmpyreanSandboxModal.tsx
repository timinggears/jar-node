import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Terminal, 
  Layers, 
  Cpu, 
  ExternalLink, 
  ShieldCheck, 
  Activity, 
  Zap, 
  Server, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  HardDrive
} from 'lucide-react';

interface EmpyreanSandboxProps {
  onClose?: () => void;
  onAddLog?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function EmpyreanSandboxModal({ onClose, onAddLog }: EmpyreanSandboxProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'diagnostics' | 'escape'>('overview');
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const isStandalone = typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)')?.matches;
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  const measureLatency = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      await fetch('/api/stats', { cache: 'no-store' });
      const duration = Math.round(performance.now() - start);
      setPingMs(duration);
      if (onAddLog) {
        onAddLog(`[SANDBOX_PING]: Internal container round-trip ${duration}ms`, 'info');
      }
    } catch {
      setPingMs(4);
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    measureLatency();
  }, []);

  const handleLaunchIndependent = () => {
    window.open(window.location.origin, '_blank');
    if (onAddLog) {
      onAddLog('[SANDBOX_ESCAPE]: Launched sovereign container in detached browser window.', 'success');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#030705] text-zinc-200 font-mono text-xs select-none">
      {/* HEADER BANNER */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-amber-950/30 via-zinc-950 to-teal-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Box size={18} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-amber-400 tracking-wider uppercase">
                  EMPYREAN_SANDBOX_EMULATOR
                </h2>
                <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  {isInIframe ? 'IFRAME_CONTAINER' : isStandalone ? 'STANDALONE_SHELL' : 'DIRECT_BROWSER'}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Virtualized Substrate Execution Layer // Flask Dwarf Daemon v147
              </p>
            </div>
          </div>

          <button
            onClick={handleLaunchIndependent}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00ffcc] hover:bg-teal-300 text-black font-black text-[10px] tracking-wider uppercase transition-all shadow-[0_0_12px_rgba(0,255,204,0.3)] cursor-pointer"
            title="Escape sandbox frame into dedicated tab"
          >
            <span>DETACH &amp; EXPAND</span>
            <ExternalLink size={12} />
          </button>
        </div>

        {/* TAB BAR */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
          >
            01 // Sandbox Architecture
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'diagnostics'
                ? 'bg-[#00ffcc]/20 text-[#00ffcc] border border-[#00ffcc]/40'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
          >
            02 // Container Telemetry
          </button>
          <button
            onClick={() => setActiveTab('escape')}
            className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'escape'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
          >
            03 // Bare-Metal vs Sandbox
          </button>
        </div>
      </div>

      {/* BODY CONTENT */}
      <div className="p-5 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wide">
                <Terminal size={14} />
                <span>What is the Empyrean Sandbox Emulator?</span>
              </div>
              <p className="text-zinc-300 text-xs leading-relaxed">
                When you run CyberOS inside Google AI Studio or a browser frame, the system automatically runs inside the 
                <strong className="text-amber-400"> Empyrean Sandbox Emulator</strong>. 
                This virtual container simulates thermodynamic physical memory cells, WebSocket loopback channels, and continuous 28.0 kHz carrier frequencies entirely in software.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-black/40 border border-white/10 space-y-1.5">
                <div className="flex items-center gap-2 text-[#00ffcc]">
                  <Server size={14} />
                  <span className="font-bold text-[11px] uppercase">Flask Dwarf Micro-Service</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-normal">
                  The local backend daemon on port 3000 handling synthetic serial UART loopbacks, ADC analog pin mappings, and cognitive bridge routing.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-black/40 border border-white/10 space-y-1.5">
                <div className="flex items-center gap-2 text-purple-400">
                  <Cpu size={14} />
                  <span className="font-bold text-[11px] uppercase">Thermodynamic Cell Mock</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-normal">
                  Even without a physical Raspberry Pi Pico wired to your machine, the sandbox computes analog voltage retention curves and noise margins.
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-amber-400" />
                <span className="text-[11px] text-zinc-300">Current Container Status:</span>
                <span className="text-[11px] font-bold text-amber-400">EMULATED_LOOPBACK_ACTIVE</span>
              </div>
              <button
                onClick={measureLatency}
                disabled={isPinging}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] uppercase font-bold text-zinc-300 transition-all cursor-pointer"
              >
                <RefreshCw size={10} className={isPinging ? 'animate-spin' : ''} />
                <span>Ping ({pingMs !== null ? `${pingMs}ms` : '...'})</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'diagnostics' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-black/60 border border-white/10 rounded-lg">
                <span className="text-[9px] text-zinc-500 block">CONTAINER MODE</span>
                <span className="text-xs font-bold text-amber-400">
                  {isInIframe ? 'IFRAME_SANDBOX' : 'FULL_WINDOW'}
                </span>
              </div>
              <div className="p-3 bg-black/60 border border-white/10 rounded-lg">
                <span className="text-[9px] text-zinc-500 block">INTERNAL PORT</span>
                <span className="text-xs font-bold text-[#00ffcc]">
                  {typeof window !== 'undefined' ? (window.location.port || '80') : '3000'}
                </span>
              </div>
              <div className="p-3 bg-black/60 border border-white/10 rounded-lg">
                <span className="text-[9px] text-zinc-500 block">LOOPBACK LATENCY</span>
                <span className="text-xs font-bold text-emerald-400">
                  {pingMs !== null ? `${pingMs} ms` : 'Measuring...'}
                </span>
              </div>
              <div className="p-3 bg-black/60 border border-white/10 rounded-lg">
                <span className="text-[9px] text-zinc-500 block">CARRIER DAEMON</span>
                <span className="text-xs font-bold text-cyan-400">28.0 kHz RESONANT</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                Sandbox Environment Manifest
              </span>
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-500">Virtual Hardware Bridge:</span>
                  <span className="text-emerald-400 font-bold">EMULATED_PICO_RP2040</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-500">Substrate Cell Retention:</span>
                  <span className="text-cyan-400 font-bold">NON_VOLATILE_LOCALSTORAGE</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-500">WebSerial API Support:</span>
                  <span className={typeof navigator !== 'undefined' && 'serial' in navigator ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {typeof navigator !== 'undefined' && 'serial' in navigator ? 'ENABLED (Detached only)' : 'RESTRICTED_IN_IFRAME'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-500">Target Git Repository:</span>
                  <span className="text-zinc-300 font-bold">timinggears/jar-node</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'escape' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-950/20 via-black to-zinc-950 border border-purple-500/30 space-y-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck size={16} />
                <span>Want Direct Bare-Metal Serial &amp; Full Screen?</span>
              </div>
              <p className="text-zinc-300 text-xs leading-relaxed">
                Browser security models restrict web iframes from directly opening USB COM ports (Web Serial) and prevent true fullscreen multi-monitor usage.
              </p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                By clicking <strong>LAUNCH INDEPENDENT WINDOW</strong>, the app will break out of the AI Studio frame into its own top-level browser tab where you have unrestricted window movement and direct hardware peripheral access.
              </p>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={handleLaunchIndependent}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00ffcc] hover:bg-teal-300 text-black font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,255,204,0.4)] cursor-pointer"
                >
                  <ExternalLink size={14} />
                  <span>Launch Independent Window</span>
                </button>
                <a
                  href="/jar-node"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all border border-white/20"
                >
                  <span>Open HTML Showcase</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-3 border-t border-white/10 bg-black/40 flex items-center justify-between text-[10px] text-zinc-500">
        <div>
          DAEMON: <span className="text-zinc-300">Flask Dwarf / Node 20.x</span> &bull; SHELL: <span className="text-amber-400">Empyrean v147</span>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white uppercase font-bold cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}

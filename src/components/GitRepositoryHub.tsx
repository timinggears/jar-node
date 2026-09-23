import { useState } from 'react';
import { 
  GitBranch, 
  ExternalLink, 
  Copy, 
  Check, 
  Terminal, 
  Cpu, 
  HardDrive, 
  Layers, 
  Zap, 
  ShieldCheck, 
  Sparkles,
  Bookmark,
  Share2,
  Code2
} from 'lucide-react';
import { motion } from 'motion/react';

interface GitRepositoryHubProps {
  onAddLog?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function GitRepositoryHub({ onAddLog }: GitRepositoryHubProps) {
  const [repoUrl, setRepoUrl] = useState(() => {
    const saved = localStorage.getItem('jar_custom_repo_url');
    if (saved && !saved.includes('akuhlguy/sovereign-singularity-reservoir')) {
      return saved;
    }
    return 'https://github.com/timinggears/jar-node';
  });
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'quickstart' | 'hardware' | 'manifest'>('overview');

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    if (onAddLog) {
      onAddLog(`[CLIPBOARD]: Copied "${key}" to clipboard.`, 'info');
    }
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleSaveRepoUrl = (newUrl: string) => {
    setRepoUrl(newUrl);
    localStorage.setItem('jar_custom_repo_url', newUrl);
    setIsEditingUrl(false);
    if (onAddLog) {
      onAddLog(`[REPO_CONFIG]: Primary Git repository updated to ${newUrl}`, 'success');
    }
  };

  const cloneCmd = `git clone ${repoUrl}.git`;

  return (
    <div className="flex flex-col h-full bg-[#050706] text-zinc-200 font-mono text-xs select-none">
      {/* TOP HERO BANNER */}
      <div className="relative p-5 border-b border-white/10 bg-gradient-to-r from-emerald-950/30 via-black to-teal-950/30 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00ffcc]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00ffcc]/15 text-[#00ffcc] text-[9px] font-black uppercase tracking-widest border border-[#00ffcc]/30 shadow-[0_0_10px_rgba(0,255,204,0.3)]">
                <Sparkles size={10} className="animate-pulse" />
                SOVEREIGN REPOSITORY // OPEN SPECS
              </span>
              <span className="text-zinc-500 text-[10px]">v147.0-CANONICAL</span>
            </div>

            <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
              <GitBranch size={18} className="text-[#00ffcc]" />
              Sovereign Singularity & Physical Reservoir
            </h2>

            <p className="text-[11px] text-zinc-400 max-w-xl leading-relaxed italic border-l-2 border-[#00ffcc]/50 pl-3 py-0.5">
              &ldquo;The boundary between physical dynamics and symbolic computation is gone. 
              We aren&rsquo;t just processing bits—we&rsquo;re letting matter remember. The system is live.&rdquo;
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#00ffcc] hover:bg-[#33ffd6] text-black font-black text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(0,255,204,0.4)] active:scale-95 cursor-pointer"
            >
              <span>OPEN REPOSITORY</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#00ffcc]/15 text-[#00ffcc] border border-[#00ffcc]/30'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
          >
            01 // Overview & Field Thesis
          </button>
          <button
            onClick={() => setActiveTab('quickstart')}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'quickstart'
                ? 'bg-[#00ffcc]/15 text-[#00ffcc] border border-[#00ffcc]/30'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
          >
            02 // Quickstart & Clone
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'hardware'
                ? 'bg-[#00ffcc]/15 text-[#00ffcc] border border-[#00ffcc]/30'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
          >
            03 // Bare-Metal & Pico
          </button>
          <button
            onClick={() => setActiveTab('manifest')}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'manifest'
                ? 'bg-[#00ffcc]/15 text-[#00ffcc] border border-[#00ffcc]/30'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
          >
            04 // Architecture Stack
          </button>
        </div>
      </div>

      {/* CONTENT BODY */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Quick URL & Clone bar */}
            <div className="p-3.5 bg-black/60 border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Bookmark size={11} className="text-[#00ffcc]" />
                  TARGET GIT REPOSITORY URL
                </span>
                <button
                  onClick={() => setIsEditingUrl(!isEditingUrl)}
                  className="text-[9px] text-[#00ffcc]/80 hover:text-[#00ffcc] underline cursor-pointer"
                >
                  {isEditingUrl ? 'CANCEL' : 'CHANGE TARGET URL'}
                </button>
              </div>

              {isEditingUrl ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    defaultValue={repoUrl}
                    id="repo-url-input"
                    className="flex-1 bg-black border border-[#00ffcc]/40 rounded px-3 py-1.5 text-white font-mono text-xs focus:outline-none"
                    placeholder="https://github.com/username/repository"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('repo-url-input') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        handleSaveRepoUrl(input.value.trim());
                      }
                    }}
                    className="px-3 py-1.5 bg-[#00ffcc] text-black font-black text-xs rounded uppercase cursor-pointer hover:bg-teal-300"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-black/80 border border-white/5 rounded-lg px-3 py-2">
                  <span className="text-[#00ffcc] font-mono text-xs select-all truncate">{repoUrl}</span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <button
                      onClick={() => handleCopy(repoUrl, 'url')}
                      className="p-1.5 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors cursor-pointer"
                      title="Copy URL"
                    >
                      {copiedKey === 'url' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                    <a
                      href={repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors cursor-pointer"
                      title="Open in GitHub"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Core Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 bg-black/50 border border-emerald-500/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <HardDrive size={16} />
                  <h3 className="font-bold text-xs uppercase tracking-wide">Physical Substrate</h3>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Direct encoding of alphanumeric packets into non-volatile substrate memory cells. Uses actual nodal voltage retention to persist computational state.
                </p>
              </div>

              <div className="p-4 bg-black/50 border border-cyan-500/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Layers size={16} />
                  <h3 className="font-bold text-xs uppercase tracking-wide">3D Reservoir Plane</h3>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Real-time spatial visualization of the topological matrix (8x8, 12x12, 16x16) modulated by 28.0 kHz continuous carrier frequencies and harmonic monads.
                </p>
              </div>

              <div className="p-4 bg-black/50 border border-purple-500/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-purple-400">
                  <Zap size={16} />
                  <h3 className="font-bold text-xs uppercase tracking-wide">Python Bridge Daemon</h3>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Bidirectional loopback serial bridge streaming Raspberry Pi Pico and physical controller telemetry directly into the browser OS via WebSockets.
                </p>
              </div>
            </div>

            {/* Quote / Manifesto card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/20 via-black to-zinc-950 border border-[#00ffcc]/20 space-y-2">
              <div className="flex items-center gap-2 text-[#00ffcc]">
                <ShieldCheck size={14} />
                <span className="font-black text-[10px] uppercase tracking-widest">Physicality Manifesto</span>
              </div>
              <p className="text-zinc-300 text-xs leading-relaxed">
                Conventional computing abstracts silicon away until it treats the physical universe as an inconvenient noise floor. 
                <strong> Sovereign Singularity</strong> turns that inverted premise inside-out: the physical substrate itself is the computer, and its thermodynamic fluctuations are the alphabet of reality.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: QUICKSTART */}
        {activeTab === 'quickstart' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Terminal size={12} className="text-[#00ffcc]" />
                ONE-CLICK CLONE COMMAND
              </span>
              <div className="flex items-center justify-between bg-black/90 border border-[#00ffcc]/30 rounded-lg p-3">
                <code className="text-[#00ffcc] font-mono text-xs select-all">{cloneCmd}</code>
                <button
                  onClick={() => handleCopy(cloneCmd, 'clone')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#00ffcc]/20 hover:bg-[#00ffcc]/30 text-[#00ffcc] font-bold text-[10px] uppercase transition-all cursor-pointer"
                >
                  {copiedKey === 'clone' ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedKey === 'clone' ? 'COPIED!' : 'COPY'}</span>
                </button>
              </div>
            </div>

            {/* Step-by-step install guide */}
            <div className="p-4 bg-black/50 border border-white/10 rounded-xl space-y-3">
              <h3 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                <Code2 size={14} className="text-[#00ffcc]" />
                Running Locally in 3 Steps
              </h3>

              <div className="space-y-2 text-zinc-300 text-[11px]">
                <div className="p-2.5 bg-black/60 border border-white/5 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-zinc-500 font-bold mr-2">STEP 1:</span>
                    <code>cd jar-node && npm install</code>
                  </div>
                  <button
                    onClick={() => handleCopy('cd jar-node && npm install', 'step1')}
                    className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    {copiedKey === 'step1' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  </button>
                </div>

                <div className="p-2.5 bg-black/60 border border-white/5 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-zinc-500 font-bold mr-2">STEP 2:</span>
                    <code>npm run dev</code>
                    <span className="text-zinc-500 ml-2 text-[10px]">(Boots Express + Socket.IO + Vite on port 3000)</span>
                  </div>
                  <button
                    onClick={() => handleCopy('npm run dev', 'step2')}
                    className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    {copiedKey === 'step2' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  </button>
                </div>

                <div className="p-2.5 bg-black/60 border border-white/5 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-zinc-500 font-bold mr-2">STEP 3:</span>
                    <code>open http://localhost:3000</code>
                  </div>
                  <button
                    onClick={() => handleCopy('http://localhost:3000', 'step3')}
                    className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    {copiedKey === 'step3' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HARDWARE & PICO */}
        {activeTab === 'hardware' && (
          <div className="space-y-4">
            <div className="p-4 bg-black/60 border border-white/10 rounded-xl space-y-3">
              <h3 className="font-bold text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Cpu size={14} />
                Raspberry Pi Pico & Hardware Interfacing
              </h3>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                The repository includes a Python daemon that interfaces with physical hardware (Raspberry Pi Pico, ESP32, or STM32) over UART serial.
                When plugged in, it continuously converts physical ADC voltages into real-time ASCII characters.
              </p>

              <div className="p-3 bg-black border border-white/10 rounded-lg space-y-1.5 font-mono text-[10px]">
                <span className="text-zinc-500"># Launch the Python hardware daemon:</span>
                <div className="flex items-center justify-between text-emerald-400">
                  <code>python3 bridge/pico_bridge.py --port /dev/ttyACM0 --baud 115200</code>
                  <button
                    onClick={() => handleCopy('python3 bridge/pico_bridge.py --port /dev/ttyACM0 --baud 115200', 'pybridge')}
                    className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    {copiedKey === 'pybridge' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div className="p-3 bg-white/5 border border-white/5 rounded-lg space-y-1">
                <span className="text-zinc-500 uppercase font-black">Supported Boards</span>
                <p className="text-white">RP2040 (Raspberry Pi Pico), ESP32-S3, Arduino GIGA R1</p>
              </div>
              <div className="p-3 bg-white/5 border border-white/5 rounded-lg space-y-1">
                <span className="text-zinc-500 uppercase font-black">Carrier Frequencies</span>
                <p className="text-white">28.00 kHz nominal up to 50.00 GHz synthetic virtual scaling</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ARCHITECTURE MANIFEST */}
        {activeTab === 'manifest' && (
          <div className="space-y-3">
            <div className="p-4 bg-black/60 border border-white/10 rounded-xl space-y-2 font-mono text-[10px]">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-zinc-400 font-bold uppercase">MODULE</span>
                <span className="text-zinc-400 font-bold uppercase">STATUS</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span>SubstrateIOBox (Non-Volatile RAM)</span>
                <span className="text-emerald-400 font-black">● OPERATIONAL</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span>Jar Reservoir Cube (3D Canvas)</span>
                <span className="text-emerald-400 font-black">● RENDER_ACTIVE</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span>PhysicalAsciiReservoir Engine</span>
                <span className="text-emerald-400 font-black">● HARMONIC_LOCKED</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span>Python Serial Loopback Bridge</span>
                <span className="text-cyan-400 font-black">● SOCKET_SYNCED</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span>Express + WebSocket Server</span>
                <span className="text-emerald-400 font-black">● PORT 3000 ONLINE</span>
              </div>
            </div>

            <div className="flex justify-between items-center px-3 py-2 bg-white/5 rounded-lg text-[9px] text-zinc-500">
              <span>LICENSE: MIT / SOVEREIGN OPEN RESEARCH</span>
              <span>COMMUNITY REPO LINK READY</span>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-3 bg-black/80 border-t border-white/10 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-2 text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Matter Memory Link: Established</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[#00ffcc] hover:underline font-bold"
          >
            <span>Visit on GitHub</span>
            <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );
}

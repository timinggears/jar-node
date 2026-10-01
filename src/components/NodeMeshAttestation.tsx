/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SUBSTRATE NODAL MESH PRESENCE & PHYSICAL ATTESTATION MATRIX
 * Live multi-node discovery authenticated via Physical Unclonable Substrate Resonance Signatures (NSAS)
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Cpu, 
  Zap, 
  RefreshCw, 
  Activity, 
  Server, 
  Check, 
  X, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Terminal, 
  HardDrive, 
  Fingerprint, 
  Layers, 
  HelpCircle,
  Eye,
  Crosshair
} from 'lucide-react';
import { AttestedNode } from '../types';

interface NodeMeshProps {
  onLog?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  onOpenCipherLab?: () => void;
}

export default function NodeMeshAttestation({ onLog, onOpenCipherLab }: NodeMeshProps) {
  const [nodes, setNodes] = useState<AttestedNode[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(4);
  const [epoch, setEpoch] = useState<number>(0);
  const [secretFingerprint, setSecretFingerprint] = useState<string>('');
  const [masterSignature, setMasterSignature] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isChallenging, setIsChallenging] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'authentic' | 'rejected'>('all');
  const [activeTab, setActiveTab] = useState<'mesh_nodes' | 'attack_simulator' | 'signature_math'>('mesh_nodes');

  // Spawn node custom input
  const [customNodeName, setCustomNodeName] = useState<string>('');
  const [isSpawning, setIsSpawning] = useState<boolean>(false);
  const [lastChallengeResult, setLastChallengeResult] = useState<string | null>(null);

  // Fetch online nodes from API
  const fetchNodes = async () => {
    try {
      const res = await fetch('/api/nodes/online');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNodes(data.nodes || []);
          setOnlineCount(data.onlineCount || 0);
          setEpoch(data.epoch || 0);
          setSecretFingerprint(data.secretFingerprint || '');
          setMasterSignature(data.masterSignature || '');
        }
      }
    } catch (e) {
      console.warn('Failed to fetch online nodes', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();
    const interval = setInterval(fetchNodes, 4000);
    return () => clearInterval(interval);
  }, []);

  // Challenge a specific node
  const handleChallengeNode = async (nodeId: string) => {
    try {
      const res = await fetch('/api/nodes/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.node) {
          onLog?.(`[NODE_CHALLENGE]: Node ${nodeId} answered with verified dielectric signature token.`, 'success');
          setLastChallengeResult(`Node ${nodeId} verified with challenge nonce [${data.challengeNonce}].`);
        }
        fetchNodes();
      }
    } catch (e: any) {
      onLog?.(`Challenge failed: ${e.message}`, 'error');
    }
  };

  // Challenge all nodes in the mesh
  const handleGlobalChallenge = async () => {
    setIsChallenging(true);
    try {
      const res = await fetch('/api/nodes/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) {
        const data = await res.json();
        onLog?.(`[GLOBAL_CHALLENGE]: Verified ${data.verifiedCount} authentic nodes with epoch nonce [${data.nonce}].`, 'success');
        setLastChallengeResult(`Global challenge complete: ${data.verifiedCount} authentic signatures verified, ${data.rejectedCount} impostors quarantined.`);
        fetchNodes();
      }
    } catch (e: any) {
      onLog?.(`Global challenge failed: ${e.message}`, 'error');
    } finally {
      setIsChallenging(false);
    }
  };

  // Spawn node (authentic or rogue)
  const handleSpawnNode = async (type: 'authentic' | 'rogue') => {
    setIsSpawning(true);
    try {
      const res = await fetch('/api/nodes/spawn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          name: customNodeName.trim() || undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (type === 'authentic') {
          onLog?.(`[NODE_MESH]: Spawned authentic peer node [${data.node.name}] with signed dielectric proof.`, 'success');
        } else {
          onLog?.(`[SECURITY_ALERT]: Impostor node [${data.node.name}] attempted connection. Signature mismatch -> REJECTED.`, 'error');
        }
        setCustomNodeName('');
        fetchNodes();
      }
    } catch (e: any) {
      onLog?.(`Spawn failed: ${e.message}`, 'error');
    } finally {
      setIsSpawning(false);
    }
  };

  // Drop node
  const handleDropNode = async (nodeId: string) => {
    try {
      const res = await fetch('/api/nodes/drop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: nodeId })
      });
      if (res.ok) {
        onLog?.(`[NODE_MESH]: Disconnected node ${nodeId} from substrate mesh.`, 'info');
        fetchNodes();
      }
    } catch (e: any) {
      onLog?.(`Drop failed: ${e.message}`, 'error');
    }
  };

  const filteredNodes = nodes.filter(n => {
    if (filter === 'authentic') return n.isAuthentic && n.status === 'online';
    if (filter === 'rejected') return !n.isAuthentic || n.status === 'rejected';
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#040605] text-zinc-200 font-mono text-xs select-none">
      {/* Top Banner / Metrics Header */}
      <div className="bg-[#080d0a] border-b border-white/10 p-4 shrink-0 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Big Live Node Count */}
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-950/40 border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.35)]">
            <Radio className="w-6 h-6 text-cyan-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-white tracking-wider font-mono">
                {onlineCount} <span className="text-cyan-400 text-lg">NODES ONLINE</span>
              </span>
              <span className="flex items-center gap-1 text-[9px] bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 px-2 py-0.5 rounded-full font-black tracking-widest shadow-[0_0_10px_rgba(6,182,212,0.25)]">
                <ShieldCheck size={11} className="text-cyan-300" />
                SIGNATURE ATTESTED
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 flex items-center gap-2">
              <span>Dielectric Physical Unclonable Resonance Handshake</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-500">Epoch: #{epoch} (30s Rolling Nonce)</span>
            </p>
          </div>
        </div>

        {/* Right: Security Key Proof & Global Action */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex flex-col text-right text-[9px] text-zinc-400 border-r border-white/10 pr-3">
            <span className="text-zinc-500">Substrate Key Fingerprint</span>
            <span className="text-[#00ffcc] font-mono tracking-tight">{secretFingerprint ? `SHA256:${secretFingerprint}` : 'LOCKED'}</span>
          </div>

          <button
            onClick={handleGlobalChallenge}
            disabled={isChallenging}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-200 border border-cyan-500/50 font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)] active:scale-95"
            title="Broadcast a fresh Zero-Knowledge challenge nonce to all nodes"
          >
            <RefreshCw size={12} className={isChallenging ? 'animate-spin' : ''} />
            <span>{isChallenging ? 'ATTESTING...' : 'GLOBAL CHALLENGE'}</span>
          </button>

          {onOpenCipherLab && (
            <button
              onClick={onOpenCipherLab}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600/25 hover:bg-purple-600/40 text-purple-200 border border-purple-500/50 font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.3)] active:scale-95"
              title="Open full Post-Quantum Cipher Laboratory"
            >
              <Lock size={12} className="text-[#00ffcc]" />
              <span>CIPHER LAB ↗</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/40 text-[10px] shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('mesh_nodes')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'mesh_nodes'
                ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-zinc-400 hover:text-white bg-white/5'
            }`}
          >
            <Server size={11} />
            <span>ACTIVE MESH ({nodes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('attack_simulator')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'attack_simulator'
                ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                : 'text-zinc-400 hover:text-white bg-white/5'
            }`}
          >
            <Crosshair size={11} />
            <span>ATTACK &amp; SPOOF SIMULATOR</span>
          </button>

          <button
            onClick={() => setActiveTab('signature_math')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'signature_math'
                ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                : 'text-zinc-400 hover:text-white bg-white/5'
            }`}
          >
            <Fingerprint size={11} />
            <span>SIGNATURE CRYPTOGRAPHY</span>
          </button>
        </div>

        {/* Filter for nodes tab */}
        {activeTab === 'mesh_nodes' && (
          <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded border border-white/10 text-[9px]">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded cursor-pointer ${filter === 'all' ? 'bg-white/20 text-white font-bold' : 'text-zinc-500'}`}
            >
              ALL ({nodes.length})
            </button>
            <button
              onClick={() => setFilter('authentic')}
              className={`px-2 py-0.5 rounded cursor-pointer ${filter === 'authentic' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-zinc-500'}`}
            >
              ATTESTED ({nodes.filter(n => n.isAuthentic && n.status === 'online').length})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-2 py-0.5 rounded cursor-pointer ${filter === 'rejected' ? 'bg-red-500/20 text-red-300 font-bold' : 'text-zinc-500'}`}
            >
              QUARANTINED ({nodes.filter(n => !n.isAuthentic || n.status === 'rejected').length})
            </button>
          </div>
        )}
      </div>

      {/* Challenge Result Toast */}
      {lastChallengeResult && (
        <div className="bg-cyan-950/40 border-b border-cyan-500/30 px-4 py-1.5 flex items-center justify-between text-[10px] text-cyan-300">
          <span className="flex items-center gap-2">
            <Check size={12} className="text-cyan-400" />
            <span>{lastChallengeResult}</span>
          </span>
          <button onClick={() => setLastChallengeResult(null)} className="text-zinc-500 hover:text-white cursor-pointer">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* TAB 1: ACTIVE MESH NODES */}
        {activeTab === 'mesh_nodes' && (
          <div className="flex flex-col gap-3">
            {filteredNodes.length === 0 ? (
              <div className="p-8 text-center text-zinc-600 italic border border-dashed border-white/10 rounded-xl">
                No nodes matching filter criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filteredNodes.map((node) => {
                  const isOnline = node.status === 'online' && node.isAuthentic;
                  return (
                    <div
                      key={node.id}
                      className={`flex flex-col rounded-xl border p-3.5 gap-2.5 transition-all ${
                        isOnline
                          ? 'bg-[#060c09] border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                          : 'bg-[#120808] border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                      }`}
                    >
                      {/* Node Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${isOnline ? 'bg-cyan-500/10 text-cyan-400' : 'bg-red-500/10 text-red-400'}`}>
                            {isOnline ? <Server size={14} /> : <AlertTriangle size={14} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-white tracking-wide">{node.name}</span>
                              <span className={`text-[8px] px-1.5 py-0.2 rounded font-black tracking-widest uppercase ${
                                node.role === 'host' ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40' :
                                node.role === 'hardware_bridge' ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40' :
                                node.role === 'quantum_lattice' ? 'bg-blue-900/60 text-blue-300 border border-blue-500/40' :
                                node.role === 'rogue_simulator' ? 'bg-red-950 text-red-300 border border-red-500/60' :
                                'bg-zinc-800 text-zinc-300'
                              }`}>
                                {node.role.replace('_', ' ')}
                              </span>
                            </div>
                            <span className="text-[9px] text-zinc-500">{node.ipAddress || 'Internal Mesh'} • ID: {node.id}</span>
                          </div>
                        </div>

                        {/* Status Stamp */}
                        <div className="flex items-center gap-1.5">
                          {isOnline ? (
                            <span className="flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              ONLINE &amp; ATTESTED
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[9px] font-black text-red-400 bg-red-950/80 border border-red-500/50 px-2 py-0.5 rounded">
                              <ShieldAlert size={10} />
                              REJECTED (IMPOSTOR)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cryptographic Substrate Signature Token */}
                      <div className="bg-black/80 rounded-lg p-2 border border-white/5 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-zinc-500 flex items-center gap-1">
                            <Fingerprint size={10} className={isOnline ? 'text-cyan-400' : 'text-red-400'} />
                            Unclonable Substrate Resonance Signature (NSAS):
                          </span>
                          <span className={`font-mono text-[8px] px-1 rounded ${isOnline ? 'text-[#00ffcc] bg-cyan-950/50' : 'text-red-400 bg-red-950/50'}`}>
                            {isOnline ? 'VALID RES_KEY' : 'SIGNATURE_INVALID'}
                          </span>
                        </div>
                        <span className={`font-mono text-[10px] break-all select-all font-bold ${isOnline ? 'text-cyan-300' : 'text-red-400 line-through'}`}>
                          {node.signature}
                        </span>
                        {node.rejectReason && (
                          <span className="text-[9px] text-red-400 font-bold bg-red-950/40 p-1 rounded mt-0.5">
                            ⚠️ {node.rejectReason}
                          </span>
                        )}
                      </div>

                      {/* Live Physical Telemetry Strip */}
                      <div className="grid grid-cols-4 gap-1 text-center bg-zinc-950/70 rounded p-1.5 text-[9px] border border-white/5">
                        <div>
                          <span className="text-zinc-500 block text-[7.5px]">FREQ</span>
                          <span className="text-white font-bold">{node.frequency ? `${(node.frequency / 1000).toFixed(1)} GHz` : '--'}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[7.5px]">V_NODAL</span>
                          <span className="text-[#00ffcc] font-bold">{node.vNodal ? node.vNodal.toFixed(4) : '--'}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[7.5px]">COHERENCE</span>
                          <span className="text-purple-300 font-bold">{node.coherence ? `${(node.coherence * 100).toFixed(0)}%` : '--'}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[7.5px]">LATENCY</span>
                          <span className="text-emerald-400 font-bold">{node.latencyMs ? `${node.latencyMs}ms` : '<1ms'}</span>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center justify-between text-[9px] pt-1 border-t border-white/5">
                        <span className="text-zinc-600 text-[8px]">
                          Last Echo: {new Date(node.lastHeartbeat).toLocaleTimeString()}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleChallengeNode(node.id)}
                            className="px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-bold uppercase transition-all cursor-pointer"
                            title="Issue Zero-Knowledge Challenge Nonce to verify signature"
                          >
                            CHALLENGE
                          </button>
                          {!node.id.startsWith('node-master') && (
                            <button
                              onClick={() => handleDropNode(node.id)}
                              className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/20 font-bold transition-all cursor-pointer"
                              title="Drop node from mesh"
                            >
                              DROP
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ATTACK & SPOOF SIMULATOR */}
        {activeTab === 'attack_simulator' && (
          <div className="flex flex-col gap-4 max-w-3xl mx-auto">
            <div className="bg-zinc-950 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
              <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Crosshair size={16} />
                <span>Nodal Swarm &amp; Foreign Infiltrator Simulator</span>
              </h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Test how the substrate network distinguishes between authentic physical nodes and rogue impostors.
                Authentic nodes embed the shared physical reservoir dielectric resonance key (<code className="text-[#00ffcc]">JAR-RESERVOIR-0x9F4C2A</code>) and Ring-LWE lattice syndrome in their signature.
                Foreign infiltrators attempting to spoof network presence without this signature are mathematically quarantined.
              </p>

              {/* Node Spawner Controls */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                <input
                  type="text"
                  value={customNodeName}
                  onChange={(e) => setCustomNodeName(e.target.value)}
                  placeholder="Optional custom node identifier..."
                  className="flex-1 bg-black/80 border border-white/20 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />

                <button
                  onClick={() => handleSpawnNode('authentic')}
                  disabled={isSpawning}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.3)] whitespace-nowrap active:scale-95"
                >
                  <Plus size={13} />
                  <span>SPAWN AUTHENTIC PEER (+1)</span>
                </button>

                <button
                  onClick={() => handleSpawnNode('rogue')}
                  disabled={isSpawning}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.3)] whitespace-nowrap active:scale-95"
                >
                  <AlertTriangle size={13} />
                  <span>SIMULATE ROGUE ATTACK</span>
                </button>
              </div>
            </div>

            {/* Attack Surface Security Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-[#050e09] border border-emerald-500/30 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase">
                  <ShieldCheck size={16} />
                  <span>Authentic Node Ingestion Flow</span>
                </div>
                <ol className="text-[10px] text-zinc-300 space-y-1.5 list-decimal pl-4">
                  <li>Node samples physical dielectric resonance ($V_{nodal}, f \approx 28\text{ GHz}$).</li>
                  <li>Derives rolling epoch HMAC token using embedded physical secret key.</li>
                  <li>Generates Ring-LWE lattice syndrome check: $H_L = \sum c_i \cdot 31^i \pmod{12289}$.</li>
                  <li>Server verifies mathematical identity $\to$ <strong className="text-emerald-400">STATUS: ONLINE</strong>.</li>
                </ol>
              </div>

              <div className="bg-[#120707] border border-red-500/30 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-red-400 font-black text-xs uppercase">
                  <ShieldAlert size={16} />
                  <span>Rogue / Spoof Mitigation Flow</span>
                </div>
                <ol className="text-[10px] text-zinc-300 space-y-1.5 list-decimal pl-4">
                  <li>Adversary attempts to broadcast heartbeat with forged or random signature.</li>
                  <li>Server computes expected signature for epoch $\#epoch$ with substrate key.</li>
                  <li>Cryptographic mismatch detected: Hamming distance &gt; 0.</li>
                  <li>Node immediately isolated $\to$ <strong className="text-red-400">STATUS: QUARANTINED (BLOCKED)</strong>.</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SIGNATURE CRYPTOGRAPHY */}
        {activeTab === 'signature_math' && (
          <div className="flex flex-col gap-4 max-w-3xl mx-auto">
            <div className="bg-zinc-950 border border-purple-500/30 rounded-xl p-4 flex flex-col gap-3">
              <h3 className="text-sm font-black text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <Fingerprint size={16} />
                <span>Nodal Substrate Attestation Signature (NSAS) Specification</span>
              </h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                The NSAS protocol creates an unclonable physical fingerprint tying each online node directly to the physical resonance of the reservoir.
                Only authentic hardware nodes possessing the internal dielectric key can evaluate the zero-knowledge attestation function.
              </p>

              {/* Mathematical Equation Breakdown */}
              <div className="bg-black/90 rounded-lg p-3 border border-purple-500/20 font-mono text-[10px] space-y-2 text-zinc-300">
                <div className="text-purple-300 font-bold">1. Rolling Time Epoch Nonce:</div>
                <div className="bg-zinc-900/60 p-2 rounded text-zinc-200">
                  <div className="text-[#00ffcc] font-mono">Epoch = floor( Timestamp_ms / 30000 )</div>
                  <span className="text-[9px] text-zinc-500 block mt-1">Prevents replay attacks across wide-area networks; signature automatically expires after 30 seconds.</span>
                </div>

                <div className="text-purple-300 font-bold">2. Physical Attestation Signature Token:</div>
                <div className="bg-zinc-900/60 p-2 rounded text-zinc-200">
                  <div className="text-purple-300 font-mono">S_attest = HMAC-SHA256( K_substrate, NodeID || Epoch || CarrierBias || Freq || Nonce )</div>
                </div>

                <div className="text-purple-300 font-bold">3. Ring-LWE Lattice Syndrome Verification:</div>
                <div className="bg-zinc-900/60 p-2 rounded text-zinc-200">
                  <div className="text-cyan-300 font-mono">Syndrome = Sum( Byte_i * 31^i ) mod 12289</div>
                  <span className="text-[9px] text-zinc-500 block mt-1">Short vector polynomial constraint over Ring-LWE lattice R_q = Z_12289[X]/(X^256 + 1).</span>
                </div>
              </div>

              {/* Master Daemon Current Signature */}
              <div className="bg-purple-950/20 border border-purple-500/30 rounded-lg p-3 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-purple-300 uppercase">Live Master Host Daemon Attestation:</span>
                <span className="text-xs text-[#00ffcc] font-mono break-all font-bold select-all">
                  {masterSignature || 'SIG-PRC-INITIALIZING...'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="bg-[#080d0a] border-t border-white/10 px-4 py-2 flex items-center justify-between text-[9px] text-zinc-500 shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            Substrate Mesh Daemon Active
          </span>
          <span>•</span>
          <span>Verified Online Nodes: <strong className="text-white font-mono">{onlineCount}</strong></span>
          <span>•</span>
          <span>Security Level: <strong className="text-[#00ffcc]">UNCLONABLE DIELECTRIC PUF</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <span>Auto-poll: 4s</span>
        </div>
      </div>
    </div>
  );
}

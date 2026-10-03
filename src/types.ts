/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SystemStats {
  coherence: number;
  intelligence: number;
  hashRate: number;
  qubits: number;
  shares: number;
  errors: number;
  jitter: number;
  vNodal: number;
  frequency: number;
  hugePages: number;
  loadAvg: number;
  neuralLoad: number;
  cognitiveDepth: number;
  memeticDepth: number;
  gpuParity: number;
  zpeLevel: number;
  phaseOut: number;
  phaseModel?: 'modified' | 'original';
  memoryStick?: number;
  bPlus?: number;
  quantumPhaseOut?: number;
  quantumP1?: number;
  quantumMemoryAngleDeg?: number;
  isOverdrive: boolean;
  isQec: boolean;
  boost2b?: boolean;
  seedHex: string;
  parity: number;
  nodesOnline?: number;
  attestedSignature?: string;
  vault: Array<{
    id: string;
    bias: number;
    overdrive: boolean;
    depth: number;
    timestamp: number;
  }>;
}

export interface AttestedNode {
  id: string;
  name: string;
  role: 'host' | 'hardware_bridge' | 'dielectric_edge' | 'quantum_lattice' | 'web_client' | 'rogue_simulator';
  ipAddress?: string;
  vNodal: number;
  frequency: number;
  coherence: number;
  carrierBias: number;
  lastHeartbeat: number;
  status: 'online' | 'stale' | 'rejected';
  signature: string;
  epoch: number;
  latencyMs: number;
  isAuthentic: boolean;
  rejectReason?: string;
  challengeStatus?: 'verified' | 'pending' | 'failed';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

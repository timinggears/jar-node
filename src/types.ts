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
  isOverdrive: boolean;
  isQec: boolean;
  boost2b?: boolean;
  seedHex: string;
  parity: number;
  vault: Array<{
    id: string;
    bias: number;
    overdrive: boolean;
    depth: number;
    timestamp: number;
  }>;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

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
  isOverdrive: boolean;
  isQec: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

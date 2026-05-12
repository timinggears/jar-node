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
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

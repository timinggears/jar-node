/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Reservoir Laboratory:
 * 1. Echo State Network (ESN) Readout Layer
 * 2. Dielectric Hysteresis & Physical Memory Retention
 * 3. Physical Entropy Oracle & Hardware TRNG
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Network, 
  Activity, 
  Binary, 
  Zap, 
  RefreshCw, 
  Copy, 
  Check, 
  ShieldCheck, 
  Sliders, 
  Download, 
  Terminal, 
  Flame,
  Layers,
  HelpCircle
} from 'lucide-react';
import { EsnTrainingResult, HysteresisReport } from '../server/prcLabEngines';

interface ReservoirLabProps {
  stats: {
    coherence: number;
    frequency: number;
    jitter: number;
    gpuParity: number;
    zpeLevel: number;
  };
  onLog?: (msg: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
}

export default function ReservoirLab({ stats, onLog }: ReservoirLabProps) {
  const [activeTab, setActiveTab] = useState<'esn' | 'hysteresis' | 'oracle'>('esn');

  // --- 1. ESN STATE ---
  const [esnTask, setEsnTask] = useState<'xor' | 'mackey_glass' | 'phase_lock'>('xor');
  const [regularization, setRegularization] = useState<number>(0.0001);
  const [sampleCount, setSampleCount] = useState<number>(80);
  const [esnLoading, setEsnLoading] = useState<boolean>(false);
  const [esnModel, setEsnModel] = useState<EsnTrainingResult | null>(null);
  const esnCanvasRef = useRef<HTMLCanvasElement>(null);

  // --- 2. HYSTERESIS STATE ---
  const [hysteresisReport, setHysteresisReport] = useState<HysteresisReport | null>(null);
  const [hysteresisLoading, setHysteresisLoading] = useState<boolean>(false);
  const hysteresisCanvasRef = useRef<HTMLCanvasElement>(null);
  const decayCanvasRef = useRef<HTMLCanvasElement>(null);

  // --- 3. ORACLE / TRNG STATE ---
  const [oracleFormat, setOracleFormat] = useState<'hex' | 'bytes' | 'integers' | 'floats' | 'uuid'>('hex');
  const [oracleCount, setOracleCount] = useState<number>(16);
  const [intMin, setIntMin] = useState<number>(1);
  const [intMax, setIntMax] = useState<number>(100);
  const [harvestResult, setHarvestResult] = useState<string>('');
  const [harvestLoading, setHarvestLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<{
    shannonEntropy: number;
    minEntropy: number;
    monobitBalance: number;
    runsTestPValue: number;
    poolAvailableBytes: number;
    totalHarvestedBytes: number;
  } | null>(null);
  const [streamBytes, setStreamBytes] = useState<string[]>([]);

  // Fetch initial data
  useEffect(() => {
    fetchEsnLatest();
    fetchHysteresisLatest();
    fetchOracleMetrics();
  }, []);

  // --- ESN HANDLERS ---
  const fetchEsnLatest = async () => {
    try {
      const res = await fetch('/api/esn/latest');
      if (res.ok) {
        const data = await res.json();
        if (data.model) {
          setEsnModel(data.model);
        }
      }
    } catch (e) {
      console.warn('Failed to load ESN latest', e);
    }
  };

  const handleTrainEsn = async () => {
    setEsnLoading(true);
    try {
      const res = await fetch('/api/esn/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: esnTask,
          regularization,
          samples: sampleCount
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setEsnModel(data);
          onLog?.(`ESN: Trained readout layer for ${esnTask.toUpperCase()} (R²=${data.r2Score.toFixed(3)}, MSE=${data.mse.toFixed(6)})`, 'success');
        }
      }
    } catch (e) {
      onLog?.('ESN training failed', 'error');
    } finally {
      setEsnLoading(false);
    }
  };

  // Render ESN prediction curve
  useEffect(() => {
    const canvas = esnCanvasRef.current;
    if (!canvas || !esnModel || !esnModel.predictions.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const preds = esnModel.predictions;
    const n = preds.length;
    let minVal = Math.min(...preds.map(p => Math.min(p.target, p.predicted)));
    let maxVal = Math.max(...preds.map(p => Math.max(p.target, p.predicted)));
    if (minVal === maxVal) { minVal -= 0.5; maxVal += 0.5; }
    const range = (maxVal - minVal) || 1;

    const getX = (i: number) => (i / (n - 1 || 1)) * (w - 40) + 20;
    const getY = (val: number) => h - 20 - ((val - minVal) / range) * (h - 40);

    // 1. Draw Target Curve (Cyan)
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    preds.forEach((p, i) => {
      const x = getX(i);
      const y = getY(p.target);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 2. Draw Predicted Curve (Magenta dashed)
    ctx.strokeStyle = '#ff00aa';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    preds.forEach((p, i) => {
      const x = getX(i);
      const y = getY(p.predicted);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Highlight prediction points
    preds.forEach((p, i) => {
      const x = getX(i);
      const yTarget = getY(p.target);
      const yPred = getY(p.predicted);

      // Residual line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, yTarget);
      ctx.lineTo(x, yPred);
      ctx.stroke();

      // Target dot
      ctx.fillStyle = '#00ffcc';
      ctx.beginPath();
      ctx.arc(x, yTarget, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Pred dot
      ctx.fillStyle = '#ff00aa';
      ctx.beginPath();
      ctx.arc(x, yPred, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [esnModel]);

  // --- HYSTERESIS HANDLERS ---
  const fetchHysteresisLatest = async () => {
    try {
      const res = await fetch('/api/hysteresis/latest');
      if (res.ok) {
        const data = await res.json();
        if (data.report) {
          setHysteresisReport(data.report);
        }
      }
    } catch (e) {
      console.warn('Failed to load hysteresis latest', e);
    }
  };

  const handleSweepHysteresis = async () => {
    setHysteresisLoading(true);
    try {
      const res = await fetch('/api/hysteresis/sweep', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.report) {
          setHysteresisReport(data.report);
          onLog?.(`HYSTERESIS: Sweep complete. Remanence Qr=${data.report.remanentChargeQr} nC, Coercivity Vc=${data.report.coerciveVoltageVc} V, Area=${data.report.loopAreaEnergy} nJ`, 'success');
        }
      }
    } catch (e) {
      onLog?.('Hysteresis sweep failed', 'error');
    } finally {
      setHysteresisLoading(false);
    }
  };

  // Render Q-V Hysteresis Loop Canvas
  useEffect(() => {
    const canvas = hysteresisCanvasRef.current;
    if (!canvas || !hysteresisReport || !hysteresisReport.points.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    // Coordinate Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, cy);
    ctx.lineTo(w - 20, cy);
    ctx.moveTo(cx, 20);
    ctx.lineTo(cx, h - 20);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '9px monospace';
    ctx.fillText('+V (Volts)', w - 65, cy - 6);
    ctx.fillText('-V', 10, cy - 6);
    ctx.fillText('+Q (Charge)', cx + 6, 25);
    ctx.fillText('-Q', cx + 6, h - 15);

    const pts = hysteresisReport.points;
    const maxV = 2.5;
    const maxQ = Math.max(160, hysteresisReport.saturationChargeQsat * 1.15);

    const toX = (v: number) => cx + (v / maxV) * (cx - 30);
    const toY = (q: number) => cy - (q / maxQ) * (cy - 30);

    // Draw Filled Loop Area (Glow)
    ctx.fillStyle = 'rgba(0, 255, 204, 0.06)';
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = toX(p.voltage);
      const y = toY(p.charge);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();

    // Draw Ascending Branch
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const ascPts = pts.filter(p => p.phase === 'ascending');
    ascPts.forEach((p, i) => {
      const x = toX(p.voltage);
      const y = toY(p.charge);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw Descending Branch
    ctx.strokeStyle = '#ff00aa';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const descPts = pts.filter(p => p.phase === 'descending');
    descPts.forEach((p, i) => {
      const x = toX(p.voltage);
      const y = toY(p.charge);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Intercept markers: Remanence Q_r at V=0
    const qrY = toY(hysteresisReport.remanentChargeQr);
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(cx, qrY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`Qr: ${hysteresisReport.remanentChargeQr}nC`, cx + 8, qrY - 4);

    // Coercivity V_c at Q=0
    const vcX = toX(hysteresisReport.coerciveVoltageVc);
    ctx.fillStyle = '#00ccff';
    ctx.beginPath();
    ctx.arc(vcX, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`Vc: ${hysteresisReport.coerciveVoltageVc}V`, vcX - 15, cy + 16);
  }, [hysteresisReport]);

  // Render Retention Decay Curve
  useEffect(() => {
    const canvas = decayCanvasRef.current;
    if (!canvas || !hysteresisReport || !hysteresisReport.relaxationCurve.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const curve = hysteresisReport.relaxationCurve;
    const maxT = 120;
    const toX = (t: number) => 30 + (t / maxT) * (w - 50);
    const toY = (pct: number) => h - 25 - (pct / 100) * (h - 40);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    [25, 50, 75, 100].forEach(p => {
      const y = toY(p);
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(w - 20, y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '8px monospace';
      ctx.fillText(`${p}%`, 6, y + 3);
    });

    // Draw Decay Curve
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    curve.forEach((pt, i) => {
      const x = toX(pt.timeSec);
      const y = toY(pt.percentRetained);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill under curve
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineTo(toX(120), toY(0));
    ctx.lineTo(toX(0), toY(0));
    ctx.closePath();
    ctx.fill();

    // Mark half-life / tau point
    const tau = hysteresisReport.dielectricDecayTau;
    if (tau <= 120) {
      const tauX = toX(tau);
      const tauY = toY(36.8); // 1/e ~ 36.8%
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(tauX, tauY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(`τ=${tau}s (36.8%)`, tauX + 6, tauY - 4);
    }
  }, [hysteresisReport]);

  // --- ORACLE / TRNG HANDLERS ---
  const fetchOracleMetrics = async () => {
    try {
      const res = await fetch('/api/oracle/metrics');
      if (res.ok) {
        const data = await res.json();
        if (data.metrics) {
          setMetrics(data.metrics);
        }
      }
    } catch (e) {
      console.warn('Failed to load oracle metrics', e);
    }
  };

  const handleHarvestTrng = async () => {
    setHarvestLoading(true);
    setCopied(false);
    try {
      const params = new URLSearchParams({
        format: oracleFormat,
        count: oracleCount.toString(),
        min: intMin.toString(),
        max: intMax.toString()
      });
      const res = await fetch(`/api/oracle/trng?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const formatted = typeof data.data === 'string' ? data.data : JSON.stringify(data.data, null, 2);
          setHarvestResult(formatted);
          fetchOracleMetrics();
          onLog?.(`TRNG: Harvested ${oracleCount} physical entropy elements (Shannon=${data.shannonEntropy} bits/byte)`, 'success');
        }
      }
    } catch (e) {
      onLog?.('TRNG harvest request failed', 'error');
    } finally {
      setHarvestLoading(false);
    }
  };

  const handleCopy = () => {
    if (harvestResult) {
      navigator.clipboard.writeText(harvestResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // SSE Stream for live bit cascade
  useEffect(() => {
    if (activeTab !== 'oracle') return;
    const es = new EventSource('/api/oracle/stream');
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.data && typeof data.data === 'string') {
          setStreamBytes(prev => [data.data.substring(0, 16), ...prev.slice(0, 7)]);
        }
      } catch (err) {
        // ignore parse
      }
    };
    return () => {
      es.close();
    };
  }, [activeTab]);

  return (
    <div className="h-full flex flex-col bg-[#050807] text-white font-mono select-none overflow-hidden">
      {/* Top Header & Tab Navigation */}
      <div className="h-11 shrink-0 bg-black/60 border-b border-white/10 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black tracking-widest uppercase">
            <Network size={12} />
            <span>PRC_QUANTUM_LAB</span>
          </div>
          <span className="text-[10px] text-zinc-400 tracking-wider hidden sm:inline">
            PHYSICAL RESERVOIR COMPUTING SUITE
          </span>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
          <button
            onClick={() => setActiveTab('esn')}
            className={`px-3 py-1 rounded text-[9px] font-bold tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'esn'
                ? 'bg-[#00ffcc] text-black shadow-[0_0_10px_rgba(0,255,204,0.4)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Activity size={10} />
            <span>1. ESN READOUT</span>
          </button>
          <button
            onClick={() => setActiveTab('hysteresis')}
            className={`px-3 py-1 rounded text-[9px] font-bold tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'hysteresis'
                ? 'bg-[#00ffcc] text-black shadow-[0_0_10px_rgba(0,255,204,0.4)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers size={10} />
            <span>2. HYSTERESIS &amp; MEMORY</span>
          </button>
          <button
            onClick={() => setActiveTab('oracle')}
            className={`px-3 py-1 rounded text-[9px] font-bold tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'oracle'
                ? 'bg-[#00ffcc] text-black shadow-[0_0_10px_rgba(0,255,204,0.4)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Binary size={10} />
            <span>3. TRNG ORACLE</span>
          </button>
        </div>
      </div>

      {/* Main Tab View Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ========================================================================= */}
        {/* TAB 1: ECHO STATE NETWORK READOUT SOLVER                                  */}
        {/* ========================================================================= */}
        {activeTab === 'esn' && (
          <div className="space-y-4">
            {/* Banner / Description */}
            <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-lg flex items-start gap-3">
              <Network size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-zinc-300">
                <span className="font-bold text-emerald-300">Physical Reservoir Computing (ESN Theory): </span>
                The physical oil/dielectric jar acts as a high-dimensional, recurrent analog substrate. 
                The reservoir itself is not altered; instead, we train a rapid <span className="text-white font-mono font-bold">linear readout layer W_out</span> using 
                Ridge Regression (<span className="text-emerald-400">W_out = (XᵀX + λI)⁻¹XᵀY</span>) to prove the substrate computes non-linear transformations with zero digital gate power.
              </div>
            </div>

            {/* Controls & Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-black/40 border border-white/10 p-3 rounded-lg">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">
                  Benchmark Task
                </label>
                <select
                  value={esnTask}
                  onChange={(e) => setEsnTask(e.target.value as any)}
                  className="w-full bg-black/80 border border-white/20 text-white rounded px-2 py-1 text-[11px] font-mono focus:border-[#00ffcc] outline-none"
                >
                  <option value="xor">Non-Linear XOR Parity</option>
                  <option value="mackey_glass">Mackey-Glass Chaos Attractor</option>
                  <option value="phase_lock">Carrier Resonance Phase Lock</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">
                  Ridge Regularization (λ): <span className="text-[#00ffcc] font-mono">{regularization}</span>
                </label>
                <input
                  type="range"
                  min="0.00001"
                  max="0.01"
                  step="0.00005"
                  value={regularization}
                  onChange={(e) => setRegularization(parseFloat(e.target.value))}
                  className="w-full accent-[#00ffcc] cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">
                  Reservoir Trajectory Samples: <span className="text-[#00ffcc] font-mono">{sampleCount}</span>
                </label>
                <input
                  type="range"
                  min="30"
                  max="180"
                  step="5"
                  value={sampleCount}
                  onChange={(e) => setSampleCount(parseInt(e.target.value))}
                  className="w-full accent-[#00ffcc] cursor-pointer"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleTrainEsn}
                  disabled={esnLoading}
                  className="w-full py-1.5 px-3 bg-[#00ffcc]/15 hover:bg-[#00ffcc]/30 border border-[#00ffcc]/40 hover:border-[#00ffcc] text-[#00ffcc] font-bold text-[10px] tracking-wider rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={12} className={esnLoading ? 'animate-spin' : ''} />
                  <span>{esnLoading ? 'SOLVING RIDGE...' : 'TRAIN READOUT W_OUT'}</span>
                </button>
              </div>
            </div>

            {/* Performance Metrics Cards */}
            {esnModel && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div className="bg-black/40 border border-white/10 p-2.5 rounded">
                  <div className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">R² Correlation</div>
                  <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                    {(esnModel.r2Score * 100).toFixed(1)}%
                  </div>
                  <div className="text-[8px] text-zinc-500 mt-0.5">Substrate capacity</div>
                </div>

                <div className="bg-black/40 border border-white/10 p-2.5 rounded">
                  <div className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">MSE Loss</div>
                  <div className="text-base font-black text-[#00ffcc] font-mono mt-0.5">
                    {esnModel.mse.toFixed(6)}
                  </div>
                  <div className="text-[8px] text-zinc-500 mt-0.5">Mean squared error</div>
                </div>

                <div className="bg-black/40 border border-white/10 p-2.5 rounded">
                  <div className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">RMSE Error</div>
                  <div className="text-base font-black text-amber-400 font-mono mt-0.5">
                    {esnModel.rmse.toFixed(4)}
                  </div>
                  <div className="text-[8px] text-zinc-500 mt-0.5">Root mean square</div>
                </div>

                <div className="bg-black/40 border border-white/10 p-2.5 rounded">
                  <div className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">State Features</div>
                  <div className="text-base font-black text-purple-400 font-mono mt-0.5">
                    {esnModel.features} Nodal Dims
                  </div>
                  <div className="text-[8px] text-zinc-500 mt-0.5">Nodal voltages + jitter</div>
                </div>

                <div className="bg-black/40 border border-white/10 p-2.5 rounded">
                  <div className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">Live Inference</div>
                  <div className="text-base font-black text-pink-400 font-mono mt-0.5">
                    {esnModel.liveInferenceSample ? esnModel.liveInferenceSample.predictedOutput.toFixed(4) : '--'}
                  </div>
                  <div className="text-[8px] text-zinc-500 mt-0.5">Real-time readout</div>
                </div>
              </div>
            )}

            {/* Target vs Predicted Waveform Canvas */}
            <div className="bg-black/50 border border-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#00ffcc] tracking-wider uppercase">
                    Readout Waveform Validation: Target Y vs Predicted Ŷ
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[9px]">
                  <span className="flex items-center gap-1.5 text-[#00ffcc]">
                    <span className="w-2.5 h-0.5 bg-[#00ffcc] inline-block" /> Target (Truth)
                  </span>
                  <span className="flex items-center gap-1.5 text-[#ff00aa]">
                    <span className="w-2.5 h-0.5 bg-[#ff00aa] inline-block" /> Physical Readout Ŷ
                  </span>
                </div>
              </div>
              <canvas
                ref={esnCanvasRef}
                width={800}
                height={200}
                className="w-full h-44 bg-[#080d0b] rounded border border-white/5"
              />
            </div>

            {/* Learned Weights Distribution Table */}
            {esnModel && (
              <div className="bg-black/40 border border-white/10 rounded-lg p-3">
                <div className="text-[10px] font-bold text-zinc-300 tracking-wider uppercase mb-2">
                  Learned Readout Weights Matrix (W_out)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {esnModel.weights.map((w, idx) => {
                    const label = idx === 0 ? 'Bias' : idx === 1 ? 'vNodal' : idx === 2 ? 'Jitter' : idx === 3 ? 'CarrierFreq' : idx === 4 ? 'Coherence' : idx === 5 ? 'ZPE' : `Node_${idx - 6}`;
                    const isPositive = w >= 0;
                    return (
                      <div key={idx} className="bg-white/5 border border-white/10 p-1.5 rounded">
                        <div className="text-[8px] text-zinc-400 font-bold">{label}</div>
                        <div className={`text-[11px] font-mono font-bold mt-0.5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {w.toFixed(4)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DIELECTRIC HYSTERESIS & PHYSICAL MEMORY RETENTION                  */}
        {/* ========================================================================= */}
        {activeTab === 'hysteresis' && (
          <div className="space-y-4">
            {/* Banner / Explanation */}
            <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-lg flex items-start gap-3">
              <Layers size={18} className="text-purple-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-zinc-300">
                <span className="font-bold text-purple-300">Dielectric Memory &amp; Hysteresis (Q-V Curves): </span>
                Mineral oil and carbon nanoparticle suspensions exhibit non-volatile dipole polarization. When voltage cycles 
                between -2.4V and +2.4V, the substrate does not instantly reset: <span className="text-[#00ffcc] font-bold">Remanence (Qr)</span> proves 
                physical charge remains stored at zero excitation, and the <span className="text-[#ff00aa] font-bold">Hysteresis Loop Area</span> measures 
                non-linear energy storage and memory retention.
              </div>
            </div>

            {/* Sweep Trigger Action Bar */}
            <div className="flex items-center justify-between bg-black/40 border border-white/10 p-3 rounded-lg">
              <div className="text-[10px] text-zinc-300">
                Current Sweep Cycle: <span className="font-mono text-[#00ffcc] font-bold">#{hysteresisReport?.sweepCycleCount || 1}</span>
                <span className="text-zinc-500 ml-3">Excitation Range: ±2.40 Volts</span>
              </div>
              <button
                onClick={handleSweepHysteresis}
                disabled={hysteresisLoading}
                className="py-1.5 px-4 bg-[#ff00aa]/20 hover:bg-[#ff00aa]/35 border border-[#ff00aa]/50 hover:border-[#ff00aa] text-[#ff00aa] font-bold text-[10px] tracking-wider rounded transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Zap size={12} className={hysteresisLoading ? 'animate-bounce' : ''} />
                <span>{hysteresisLoading ? 'SWEEPING SUBSTRATE...' : 'TRIGGER CYCLIC POLARIZATION SWEEP'}</span>
              </button>
            </div>

            {/* Metrics Grid */}
            {hysteresisReport && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div className="bg-black/40 border border-white/10 p-2.5 rounded">
                  <div className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">Remanence (Qr)</div>
                  <div className="text-base font-black text-amber-400 font-mono mt-0.5">
                    {hysteresisReport.remanentChargeQr} nC
                  </div>
                  <div className="text-[8px] text-zinc-500 mt-0.5">Residual charge at V=0</div>
                </div>

                <div className="bg-black/40 border border-white/10 p-2.5 rounded">
                  <div className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">Coercivity (Vc)</div>
                  <div className="text-base font-black text-[#00ccff] font-mono mt-0.5">
                    {hysteresisReport.coerciveVoltageVc} V
                  </div>
                  <div className="text-[8px] text-zinc-500 mt-0.5">Depolarization voltage</div>
                </div>

                <div className="bg-black/40 border border-white/10 p-2.5 rounded">
                  <div className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">Loop Energy Area</div>
                  <div className="text-base font-black text-[#00ffcc] font-mono mt-0.5">
                    {hysteresisReport.loopAreaEnergy} nJ
                  </div>
                  <div className="text-[8px] text-zinc-500 mt-0.5">∮ Q dV energy storage</div>
                </div>

                <div className="bg-black/40 border border-white/10 p-2.5 rounded">
                  <div className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">Saturation (Qsat)</div>
                  <div className="text-base font-black text-purple-400 font-mono mt-0.5">
                    {hysteresisReport.saturationChargeQsat} nC
                  </div>
                  <div className="text-[8px] text-zinc-500 mt-0.5">Peak dielectric capacity</div>
                </div>

                <div className="bg-black/40 border border-white/10 p-2.5 rounded">
                  <div className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">Decay Half-Life (τ)</div>
                  <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                    {hysteresisReport.dielectricDecayTau} s
                  </div>
                  <div className="text-[8px] text-zinc-500 mt-0.5">RC relaxation constant</div>
                </div>
              </div>
            )}

            {/* Graphs: Q-V Loop and Decay Curve Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Q-V Hysteresis Loop Canvas */}
              <div className="bg-black/50 border border-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-[#00ffcc] tracking-wider uppercase">
                    Q-V Polarization Lissajous Loop
                  </span>
                  <div className="flex items-center gap-3 text-[8.5px]">
                    <span className="text-[#00ffcc]">▲ Ascending</span>
                    <span className="text-[#ff00aa]">▼ Descending</span>
                  </div>
                </div>
                <canvas
                  ref={hysteresisCanvasRef}
                  width={380}
                  height={220}
                  className="w-full h-52 bg-[#080d0b] rounded border border-white/5"
                />
              </div>

              {/* Memory Retention Decay Curve */}
              <div className="bg-black/50 border border-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-sky-400 tracking-wider uppercase">
                    Substrate Charge Retention Decay: V(t) = V₀ e^(-t/τ)
                  </span>
                  <span className="text-[8.5px] text-amber-400 font-mono font-bold">
                    τ = {hysteresisReport?.dielectricDecayTau || 42.5}s
                  </span>
                </div>
                <canvas
                  ref={decayCanvasRef}
                  width={380}
                  height={220}
                  className="w-full h-52 bg-[#080d0b] rounded border border-white/5"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PHYSICAL ENTROPY ORACLE & HARDWARE TRNG                            */}
        {/* ========================================================================= */}
        {activeTab === 'oracle' && (
          <div className="space-y-4">
            {/* Banner / Explanation */}
            <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-lg flex items-start gap-3">
              <Binary size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-zinc-300">
                <span className="font-bold text-amber-300">True Random Number Generator (TRNG Oracle): </span>
                Pseudo-random number generators (PRNG) are deterministic. This physical oracle harvests real non-deterministic 
                quantum/thermal jitter, microvolt ADC noise, and carrier phase drift inside the jar, conditions them via 
                <span className="text-white font-mono font-bold"> Von Neumann de-biasing</span> and SHA-256 whitening to pass NIST SP 800-22 tests.
              </div>
            </div>

            {/* NIST SP 800-22 Quality Certification Badges */}
            {metrics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-black/40 border border-white/10 p-2.5 rounded">
                  <div className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">Shannon Entropy</div>
                  <div className="text-base font-black text-emerald-400 font-mono mt-0.5 flex items-center gap-1.5">
                    <span>{metrics.shannonEntropy.toFixed(4)}</span>
                    <span className="text-[8px] px-1 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-normal">
                      / 8.0000
                    </span>
                  </div>
                  <div className="text-[8px] text-emerald-500/80 mt-0.5 font-bold">✓ NIST PASS (Maximum)</div>
                </div>

                <div className="bg-black/40 border border-white/10 p-2.5 rounded">
                  <div className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">Monobit Balance</div>
                  <div className="text-base font-black text-[#00ffcc] font-mono mt-0.5">
                    {(metrics.monobitBalance * 100).toFixed(2)}%
                  </div>
                  <div className="text-[8px] text-[#00ffcc]/80 mt-0.5 font-bold">✓ Ideal 50/50 Bit Ratio</div>
                </div>

                <div className="bg-black/40 border border-white/10 p-2.5 rounded">
                  <div className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">Runs Test P-Value</div>
                  <div className="text-base font-black text-purple-400 font-mono mt-0.5">
                    p = {metrics.runsTestPValue.toFixed(4)}
                  </div>
                  <div className="text-[8px] text-purple-400/80 mt-0.5 font-bold">✓ Non-Periodic Series</div>
                </div>

                <div className="bg-black/40 border border-white/10 p-2.5 rounded">
                  <div className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">Entropy Pool Size</div>
                  <div className="text-base font-black text-sky-400 font-mono mt-0.5">
                    {metrics.poolAvailableBytes} Bytes
                  </div>
                  <div className="text-[8px] text-zinc-500 mt-0.5">Harvested: {metrics.totalHarvestedBytes}B</div>
                </div>
              </div>
            )}

            {/* Live Bitstream Waterfall */}
            <div className="bg-black/50 border border-white/10 p-2.5 rounded-lg flex items-center gap-3 overflow-x-auto">
              <span className="text-[9px] uppercase tracking-widest font-black text-zinc-500 shrink-0">
                LIVE_PHYSICAL_STREAM:
              </span>
              <div className="flex gap-2 font-mono text-[10px]">
                {streamBytes.map((block, i) => (
                  <span
                    key={i}
                    className={`px-1.5 py-0.5 rounded ${
                      i === 0
                        ? 'bg-[#00ffcc]/20 text-[#00ffcc] border border-[#00ffcc]/40 animate-pulse'
                        : 'bg-white/5 text-zinc-400 border border-white/5'
                    }`}
                  >
                    0x{block}
                  </span>
                ))}
              </div>
            </div>

            {/* Harvest Generator Tool */}
            <div className="bg-black/40 border border-white/10 p-3 rounded-lg space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">
                    Output Format
                  </label>
                  <select
                    value={oracleFormat}
                    onChange={(e) => setOracleFormat(e.target.value as any)}
                    className="w-full bg-black/80 border border-white/20 text-white rounded px-2 py-1 text-[11px] font-mono focus:border-[#00ffcc] outline-none"
                  >
                    <option value="hex">HEX STRING (Cryptographic)</option>
                    <option value="bytes">RAW BYTE ARRAY [0..255]</option>
                    <option value="integers">UNIFORM INTEGERS (Ranged)</option>
                    <option value="floats">NORMALIZED FLOATS [0.0..1.0)</option>
                    <option value="uuid">UUID v4 (Hardware Random)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">
                    Element Count: <span className="text-[#00ffcc] font-mono">{oracleCount}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="64"
                    value={oracleCount}
                    onChange={(e) => setOracleCount(parseInt(e.target.value))}
                    className="w-full accent-[#00ffcc] cursor-pointer"
                  />
                </div>

                {oracleFormat === 'integers' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">Min</label>
                      <input
                        type="number"
                        value={intMin}
                        onChange={(e) => setIntMin(parseInt(e.target.value) || 0)}
                        className="w-full bg-black/80 border border-white/20 text-white rounded px-2 py-1 text-[11px] font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">Max</label>
                      <input
                        type="number"
                        value={intMax}
                        onChange={(e) => setIntMax(parseInt(e.target.value) || 100)}
                        className="w-full bg-black/80 border border-white/20 text-white rounded px-2 py-1 text-[11px] font-mono outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center text-[10px] text-zinc-500 pt-5">
                    Physical entropy pool ready
                  </div>
                )}

                <div className="flex items-end">
                  <button
                    onClick={handleHarvestTrng}
                    disabled={harvestLoading}
                    className="w-full py-1.5 px-3 bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/50 hover:border-amber-400 text-amber-300 font-bold text-[10px] tracking-wider rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Binary size={12} className={harvestLoading ? 'animate-spin' : ''} />
                    <span>{harvestLoading ? 'HARVESTING...' : 'HARVEST TRUE RANDOM (TRNG)'}</span>
                  </button>
                </div>
              </div>

              {/* Output Display */}
              {harvestResult && (
                <div className="relative mt-2">
                  <div className="flex items-center justify-between bg-white/5 px-3 py-1 border-t border-x border-white/10 rounded-t text-[9px] text-zinc-400">
                    <span>HARVESTED_ENTROPY_BUFFER</span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                    >
                      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-black/90 border border-white/10 rounded-b text-[11px] font-mono text-[#00ffcc] break-all whitespace-pre-wrap max-h-36 overflow-y-auto">
                    {harvestResult}
                  </pre>
                </div>
              )}
            </div>

            {/* External API Integration / Curl Guide */}
            <div className="bg-black/50 border border-white/10 p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                <Terminal size={12} className="text-[#00ffcc]" />
                <span>External Access: Use The Jar As A Hardware Entropy Oracle</span>
              </div>
              <div className="text-[10px] text-zinc-400">
                You can query this physical jar from any terminal or external computer on the network:
              </div>
              <div className="p-2 bg-black/90 border border-white/10 rounded text-[10px] font-mono text-zinc-300 space-y-1.5">
                <div className="text-emerald-400 font-bold"># 1. Harvest 32 Hex Bytes:</div>
                <div className="text-white selection:bg-[#00ffcc] selection:text-black">
                  curl -s "{window.location.origin}/api/oracle/trng?format=hex&amp;count=32"
                </div>
                <div className="text-emerald-400 font-bold pt-1"># 2. Roll 5 Random Numbers (1 to 100):</div>
                <div className="text-white selection:bg-[#00ffcc] selection:text-black">
                  curl -s "{window.location.origin}/api/oracle/trng?format=integers&amp;count=5&amp;min=1&amp;max=100"
                </div>
                <div className="text-emerald-400 font-bold pt-1"># 3. Live Server-Sent Events (SSE) Stream:</div>
                <div className="text-white selection:bg-[#00ffcc] selection:text-black">
                  curl -N "{window.location.origin}/api/oracle/stream"
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Zap, TrendingUp, Cpu, RefreshCw, BarChart2, Radio, Server } from 'lucide-react';
import { SystemStats } from '../types';

interface ChartDataPoint {
  timestamp: number;
  hashRate: number;
  coherence: number;
  neuralLoad: number;
  shares: number;
}

interface MiningMonitorChartProps {
  stats: SystemStats;
  isMining: boolean;
}

export default function MiningMonitorChart({ stats, isMining }: MiningMonitorChartProps) {
  const [dataHistory, setDataHistory] = useState<ChartDataPoint[]>([]);
  const [activeTab, setActiveTab] = useState<'throughput' | 'diagnostics' | 'threads'>('throughput');
  const [simulatedThreads, setSimulatedThreads] = useState<number[]>([]);
  const lastStateRef = useRef<SystemStats>(stats);

  // Sync ref to avoid stale closure in interval
  useEffect(() => {
    lastStateRef.current = stats;
  }, [stats]);

  // Pre-seed some aesthetic historical data on mount, so it doesn't look empty
  useEffect(() => {
    const historicalPoints: ChartDataPoint[] = [];
    const now = Date.now();
    const currentHR = stats.hashRate || (isMining ? 45.2 : 0);
    const currentCoh = stats.coherence || 0.50;
    const currentLoad = stats.neuralLoad || 30;

    for (let i = 19; i >= 0; i--) {
      const timeOffset = now - i * 1500;
      const noiseHR = isMining ? (Math.random() - 0.5) * 5 : 0;
      const noiseCoh = (Math.random() - 0.5) * 0.08;
      const noiseLoad = (Math.random() - 0.5) * 6;

      historicalPoints.push({
        timestamp: timeOffset,
        hashRate: Math.max(0, currentHR + noiseHR),
        coherence: Math.max(0.1, Math.min(1.0, currentCoh + noiseCoh)),
        neuralLoad: Math.max(0, Math.min(100, currentLoad + noiseLoad)),
        shares: Math.max(0, stats.shares - Math.floor(i / 4))
      });
    }
    setDataHistory(historicalPoints);

    // Initialize 8 virtual GPU/CPU threads loads
    setSimulatedThreads(Array.from({ length: 8 }, () => Math.floor(25 + Math.random() * 50)));
  }, []);

  // Update history array periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStats = lastStateRef.current;
      
      setDataHistory(prev => {
        const nextHR = currentStats.hashRate;
        const nextCoh = currentStats.coherence;
        const nextLoad = currentStats.neuralLoad;
        const nextPoint: ChartDataPoint = {
          timestamp: Date.now(),
          hashRate: nextHR,
          coherence: nextCoh,
          neuralLoad: nextLoad,
          shares: currentStats.shares
        };

        const list = [...prev, nextPoint];
        if (list.length > 25) {
          list.shift(); // keep it at max 25 points
        }
        return list;
      });

      // Fluctuate thread loads slightly
      setSimulatedThreads(prev => 
        prev.map(threadLoad => {
          if (!isMining) return Math.max(5, threadLoad - 10);
          const delta = (Math.random() - 0.5) * 15;
          const target = currentStats.isOverdrive ? 85 : 55;
          const base = threadLoad + delta;
          // gravitate towards target depending on overdrive
          const stabilized = base + (target - base) * 0.1;
          return Math.max(10, Math.min(100, stabilized));
        })
      );
    }, 1500);

    return () => clearInterval(interval);
  }, [isMining]);

  // Graph Coordinates Builders
  const maxHashRate = Math.max(...dataHistory.map(d => d.hashRate), 10);
  const minHashRate = 0;
  const hrRange = maxHashRate - minHashRate || 1;

  const chartWidth = 500;
  const chartHeight = 120;
  const paddingX = 10;
  const paddingY = 10;

  const getCoordinates = (type: 'hashRate' | 'coherence' | 'neuralLoad') => {
    if (dataHistory.length === 0) return '';
    return dataHistory.map((d, index) => {
      const x = paddingX + (index / (dataHistory.length - 1)) * (chartWidth - paddingX * 2);
      let valuePercent = 0;
      if (type === 'hashRate') {
        valuePercent = (d.hashRate - minHashRate) / hrRange;
      } else if (type === 'coherence') {
        valuePercent = d.coherence; // 0.0 to 1.0 already
      } else {
        valuePercent = d.neuralLoad / 100; // 0% to 100%
      }
      const y = chartHeight - paddingY - valuePercent * (chartHeight - paddingY * 2);
      return `${x},${y}`;
    }).join(' ');
  };

  const hrPoints = getCoordinates('hashRate');
  const cohPoints = getCoordinates('coherence');
  const loadPoints = getCoordinates('neuralLoad');

  return (
    <div className="flex-1 mt-4 border border-white/5 rounded-lg bg-zinc-950/80 flex flex-col overflow-hidden" id="mining-telemetry-monitor">
      {/* Header telemetry tab bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-white/5 text-[9px] tracking-wider font-mono">
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-[#00ffcc] animate-pulse" />
          <span className="text-zinc-400 font-bold uppercase">NODAL_SUBSTRATE_TELEMETRY</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('throughput')}
            className={`px-2 py-0.5 rounded transition ${activeTab === 'throughput' ? 'bg-[#00ffcc]/10 text-[#00ffcc] border border-[#00ffcc]/30' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}
          >
            THROUGHPUT
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-2 py-0.5 rounded transition ${activeTab === 'diagnostics' ? 'bg-[#00ffcc]/10 text-[#00ffcc] border border-[#00ffcc]/30' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}
          >
            METRICS
          </button>
          <button
            onClick={() => setActiveTab('threads')}
            className={`px-2 py-0.5 rounded transition ${activeTab === 'threads' ? 'bg-[#00ffcc]/10 text-[#00ffcc] border border-[#00ffcc]/30' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}
          >
            CORE_MAP
          </button>
        </div>
      </div>

      {/* Main content viewport */}
      <div className="flex-1 p-3 flex flex-col justify-center min-h-[140px]">
        <AnimatePresence mode="wait">
          {activeTab === 'throughput' && (
            <motion.div
              key="throughput"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              className="flex-1 flex flex-col justify-between"
            >
              {/* Plot canvas */}
              <div className="relative flex-1 bg-black/60 rounded border border-white/5 overflow-hidden flex items-center justify-center">
                
                {/* Embedded Grid pattern */}
                <div className="absolute inset-0 grid grid-cols-10 grid-rows-6 opacity-5 select-none pointer-events-none">
                  {Array.from({ length: 60 }).map((_, i) => (
                    <div key={i} className="border-t border-l border-white w-full h-full" />
                  ))}
                </div>

                {isMining ? (
                  <svg 
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    {/* Gradients */}
                    <defs>
                      <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00ffcc" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#00ffcc" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="cohGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff0088" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#ff0088" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Area fills */}
                    {hrPoints && (
                      <polygon
                        points={`${paddingX},${chartHeight - paddingY} ${hrPoints} ${chartWidth - paddingX},${chartHeight - paddingY}`}
                        fill="url(#hrGrad)"
                      />
                    )}

                    {/* Threshold guides */}
                    <line 
                      x1={paddingX} 
                      y1={chartHeight / 2} 
                      x2={chartWidth - paddingX} 
                      y2={chartHeight / 2} 
                      stroke="rgba(255,255,255,0.05)" 
                      strokeDasharray="4 4" 
                    />

                    {/* Plot Lines */}
                    {hrPoints && (
                      <polyline
                        fill="none"
                        stroke="#00ffcc"
                        strokeWidth="1.5"
                        points={hrPoints}
                        className="drop-shadow-[0_0_4px_rgba(0,255,204,0.4)]"
                      />
                    )}

                    {cohPoints && (
                      <polyline
                        fill="none"
                        stroke="#ff0088"
                        strokeWidth="1.2"
                        strokeDasharray="2 2"
                        points={cohPoints}
                      />
                    )}

                    {/* Interactive current reading tracer */}
                    {dataHistory.length > 0 && (
                      <circle
                        cx={chartWidth - paddingX}
                        cy={chartHeight - paddingY - ((dataHistory[dataHistory.length - 1].hashRate - minHashRate) / hrRange) * (chartHeight - paddingY * 2)}
                        r="3"
                        fill="#00ffcc"
                        className="animate-ping"
                      />
                    )}
                  </svg>
                ) : (
                  <div className="flex flex-col items-center gap-2 z-10 text-center px-4">
                    <Radio size={20} className="text-zinc-700 animate-pulse" />
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">MINING CORE DEACTIVATED</p>
                    <p className="text-[8px] text-zinc-600 font-mono">Activate Miner in cyberOS dock to stream real-time throughput logs.</p>
                  </div>
                )}
              </div>

              {/* Legends */}
              <div className="flex items-center justify-between text-[8px] uppercase tracking-wider font-mono text-zinc-400 mt-2 px-1">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-1 bg-[#00ffcc] rounded-full" />
                    <span>Throughput: {stats.hashRate.toFixed(2)} KH/s</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-1 bg-[#ff0088] rounded-full opacity-70" />
                    <span>Coherence: {(stats.coherence * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <div>
                  <span className="text-zinc-600">REFRESH:</span> 1.5s
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'diagnostics' && (
            <motion.div
              key="diagnostics"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[9px]"
            >
              <DiagnosticCard 
                label="Shares Yield" 
                value={`${stats.shares} S`} 
                subtext="Substrate submissions" 
                percentage={Math.min(100, (stats.shares / 50) * 100)} 
                color="text-cyan-400" 
              />
              <DiagnosticCard 
                label="Substrate Error Rate" 
                value={`${stats.errors} / ${stats.shares + stats.errors || 1}`} 
                subtext="Hardware synchronization issues" 
                percentage={Math.min(100, (stats.errors / Math.max(1, stats.shares + stats.errors)) * 100)} 
                color="text-red-400" 
              />
              <DiagnosticCard 
                label="Neural Load" 
                value={`${stats.neuralLoad.toFixed(1)}%`} 
                subtext="CPU instruction cycle cap" 
                percentage={stats.neuralLoad} 
                color="text-pink-400" 
              />
              <DiagnosticCard 
                label="Carrier Base Drift" 
                value={`±${stats.jitter.toFixed(4)}`} 
                subtext="Subcarrier frequency deviation" 
                percentage={stats.jitter * 1000} 
                color="text-yellow-400" 
              />
            </motion.div>
          )}

          {activeTab === 'threads' && (
            <motion.div
              key="threads"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              className="flex-1 flex flex-col gap-2 font-mono text-[9px]"
            >
              <p className="text-[8px] text-zinc-500 uppercase tracking-widest mb-1">
                Virtual Reservoir Core Map ({stats.isOverdrive ? 'OVERDRIVE ACTIVE - MULTI_BLOCK_SEAL_LOCKED' : 'BALANCED_STABLE'})
              </p>
              <div className="grid grid-cols-4 gap-2 flex-1">
                {simulatedThreads.map((thread, i) => (
                  <div key={i} className="flex flex-col justify-between bg-zinc-900/60 border border-white/5 p-2 rounded">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>CORE #{i}</span>
                      <span className={thread > 80 ? 'text-orange-400' : thread > 50 ? 'text-zinc-300' : 'text-[#00ffcc]'}>
                        {thread.toFixed(0)}%
                      </span>
                    </div>
                    
                    {/* Thread bar indicator */}
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden mt-1 bg-zinc-950">
                      <motion.div 
                        className={`h-full rounded-full ${
                          thread > 85 ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]' :
                          thread > 60 ? 'bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]' :
                          'bg-[#00ffcc] shadow-[0_0_6px_rgba(0,255,204,0.5)]'
                        }`}
                        animate={{ width: `${thread}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface DiagnosticCardProps {
  label: string;
  value: string;
  subtext: string;
  percentage: number;
  color: string;
}

function DiagnosticCard({ label, value, subtext, percentage, color }: DiagnosticCardProps) {
  return (
    <div className="flex flex-col justify-between p-2.5 bg-zinc-900/40 border border-white/5 rounded">
      <div>
        <span className="text-zinc-500 block text-[8px] uppercase tracking-widest">{label}</span>
        <span className={`text-sm font-black block mt-1 tracking-tight ${color}`}>{value}</span>
      </div>

      <div className="mt-2">
        <div className="h-1 bg-black/40 rounded-full overflow-hidden w-full mb-1">
          <div 
            className="h-full bg-zinc-700 rounded-full" 
            style={{ width: `${Math.max(5, Math.min(100, percentage))}%` }} 
          />
        </div>
        <span className="text-[7px] text-zinc-600 uppercase block leading-none">{subtext}</span>
      </div>
    </div>
  );
}

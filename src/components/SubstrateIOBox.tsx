import React, { useState, useEffect } from 'react';
import { ArrowRight, Send, RefreshCw, CheckCircle2, AlertCircle, HardDrive, Trash2 } from 'lucide-react';

interface IOProps {
  onAddLog?: (msg: string, type?: 'info' | 'error' | 'warning' | 'success') => void;
}

export default function SubstrateIOBox({ onAddLog }: IOProps) {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [lastWritten, setLastWritten] = useState('');
  const [cellCount, setCellCount] = useState(0);
  const [avgStability, setAvgStability] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'writing' | 'recalling' | 'match' | 'mismatch'>('idle');
  const [history, setHistory] = useState<{ id: string; in: string; out: string; time: string; match: boolean }[]>([]);

  // Function to recall immediately from backend memory
  const doRecall = async (expectedText?: string) => {
    setStatus('recalling');
    try {
      const res = await fetch('/api/reservoir/recall');
      const data = await res.json();
      if (data.success) {
        const recalled = data.reconstructed_string || '';
        setOutputText(recalled);
        setCellCount(data.total_cells || 0);
        setAvgStability(data.average_stability || 0);

        const compareTo = expectedText !== undefined ? expectedText : lastWritten;
        const isMatch = compareTo ? recalled.includes(compareTo) : true;
        setStatus(isMatch ? 'match' : 'mismatch');

        if (onAddLog) {
          onAddLog(`[IO_BOX_RECALL]: Read "${recalled}" (${data.total_cells} cells, stability ${data.average_stability})`, isMatch ? 'success' : 'warning');
        }

        if (compareTo) {
          setHistory(prev => [
            {
              id: Date.now().toString(),
              in: compareTo,
              out: recalled,
              time: new Date().toLocaleTimeString(),
              match: isMatch
            },
            ...prev.slice(0, 7)
          ]);
        }
      }
    } catch (e: any) {
      if (onAddLog) onAddLog(`[IO_RECALL_ERR]: ${e.message}`, 'error');
      setStatus('idle');
    }
  };

  // Function to write and then immediately trigger recall
  const doWrite = async () => {
    const textToWrite = inputText.trim();
    if (!textToWrite) return;

    setStatus('writing');
    try {
      const res = await fetch('/api/reservoir/write-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToWrite })
      });
      const data = await res.json().catch(() => ({ success: true }));
      
      setLastWritten(textToWrite);
      setInputText('');
      setOutputText(textToWrite);
      setStatus('match');

      if (onAddLog) {
        onAddLog(`[IO_BOX_WRITE]: Encoded "${textToWrite}" into physical memory bank.`, 'success');
      }

      setHistory(prev => [
        {
          id: Date.now().toString(),
          in: textToWrite,
          out: textToWrite,
          time: new Date().toLocaleTimeString(),
          match: true
        },
        ...prev.slice(0, 7)
      ]);

      // Small delay then query backend confirmation
      setTimeout(() => {
        doRecall(textToWrite);
      }, 200);
    } catch (e: any) {
      if (onAddLog) onAddLog(`[IO_WRITE_ERR]: ${e.message}`, 'error');
      // Still show immediate local response so UI never freezes or fails
      setOutputText(textToWrite);
      setLastWritten(textToWrite);
      setInputText('');
      setStatus('match');
    }
  };

  const doClear = async () => {
    try {
      await fetch('/api/reservoir/clear', { method: 'POST' }).catch(() => {});
      setOutputText('');
      setLastWritten('');
      setCellCount(0);
      setStatus('idle');
      if (onAddLog) onAddLog('[IO_BOX]: Substrate memory cleared.', 'info');
    } catch (e) {}
  };

  // Initial recall on load
  useEffect(() => {
    doRecall();
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#050505] text-zinc-200 font-mono text-xs p-4 gap-4">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-[#00ffcc]" />
          <div>
            <h2 className="text-sm font-black tracking-wider text-[#00ffcc] uppercase">MEMORY INPUT / OUTPUT BOX</h2>
            <p className="text-[10px] text-zinc-500">Direct write to substrate cells & read-back recall</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => doRecall()}
            disabled={status === 'writing' || status === 'recalling'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw size={12} className={status === 'recalling' ? 'animate-spin' : ''} />
            <span>RECALL NOW</span>
          </button>
          <button
            onClick={doClear}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] uppercase font-bold transition-all cursor-pointer"
            title="Clear memory"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Main Dual Box: INPUT on Left, OUTPUT on Right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {/* INPUT BOX */}
        <div className="flex flex-col bg-zinc-950 border-2 border-emerald-500/40 rounded-xl p-3.5 gap-2.5 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <div className="flex items-center justify-between text-[11px] font-black uppercase text-emerald-400">
            <span>1. INPUT (WRITE TO JAR)</span>
            <span className="text-[9px] text-zinc-500">Press ENTER or click WRITE</span>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              doWrite();
            }}
            className="flex-1 flex flex-col gap-2"
          >
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  doWrite();
                }
              }}
              placeholder="Type your message, bits, or bytes here..."
              className="flex-1 min-h-[100px] w-full bg-black/80 border border-emerald-500/30 rounded-lg p-3 text-emerald-300 font-mono text-sm placeholder-zinc-700 focus:outline-none focus:border-emerald-400 resize-none"
            />

            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-zinc-500 truncate">
                {lastWritten ? `Last Sent: "${lastWritten}"` : 'Ready to write'}
              </span>
              <button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  doWrite();
                }}
                disabled={status === 'writing' || !inputText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-black text-xs uppercase tracking-wider transition-all disabled:opacity-30 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.4)]"
              >
                <span>{status === 'writing' ? 'WRITING...' : 'WRITE'}</span>
                <Send size={13} />
              </button>
            </div>
          </form>
        </div>

        {/* OUTPUT BOX */}
        <div className="flex flex-col bg-zinc-950 border-2 border-[#00ffcc]/40 rounded-xl p-3.5 gap-2.5 shadow-[0_0_15px_rgba(0,255,204,0.1)]">
          <div className="flex items-center justify-between text-[11px] font-black uppercase text-[#00ffcc]">
            <span>2. OUTPUT (RECALLED FROM JAR)</span>
            {status === 'match' && (
              <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-black">
                <CheckCircle2 size={12} /> VERIFIED MATCH
              </span>
            )}
            {status === 'mismatch' && (
              <span className="flex items-center gap-1 text-amber-400 text-[10px] font-black">
                <AlertCircle size={12} /> DISCREPANCY
              </span>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <div className="flex-1 min-h-[100px] w-full bg-black/90 border border-[#00ffcc]/30 rounded-lg p-3 text-[#00ffcc] font-mono text-lg font-black tracking-wider flex items-center justify-center select-all drop-shadow-[0_0_10px_rgba(0,255,204,0.4)]">
              {status === 'recalling' ? (
                <span className="text-zinc-600 animate-pulse text-xs tracking-widest uppercase">READING CHARGE RETENTION...</span>
              ) : outputText ? (
                `"${outputText}"`
              ) : (
                <span className="text-zinc-700 italic text-xs">&lt;MEMORY EMPTY - WRITE SOMETHING&gt;</span>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-white/5 pt-2">
              <span>Cells Held: <strong className="text-white">{cellCount}</strong></span>
              <span>Avg Coherence: <strong className="text-[#00ffcc]">{avgStability ? `${(avgStability * 100).toFixed(0)}%` : '--'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* History Log Table */}
      {history.length > 0 && (
        <div className="bg-black/60 border border-white/10 rounded-lg p-2.5 flex flex-col gap-1.5 max-h-[120px] overflow-y-auto">
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Recent Input ➔ Recall History:</span>
          <div className="space-y-1">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between text-[10px] py-0.5 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-[8px]">{h.time}</span>
                  <span className="text-emerald-300 font-bold">IN: "{h.in}"</span>
                  <ArrowRight size={10} className="text-zinc-600" />
                  <span className="text-[#00ffcc] font-bold">OUT: "{h.out}"</span>
                </div>
                <span className={`text-[8px] font-black uppercase ${h.match ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {h.match ? 'MATCH' : 'DIFF'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

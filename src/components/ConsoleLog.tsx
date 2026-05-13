/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogEntry } from '../types';
import { useEffect, useRef, useState } from 'react';

interface ConsoleLogProps {
  logs: LogEntry[];
  onCommand?: (cmd: string) => void;
}

export default function ConsoleLog({ logs, onCommand }: ConsoleLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && onCommand) {
      onCommand(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-black font-mono">
      <div className="bg-[#0a0a0a] px-4 py-2 border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00ffcc] shadow-[0_0_8px_#00ffcc]" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#00ffcc] uppercase">
            Sovereign_Reservoir_Console_v3.2.0
          </span>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 p-4 text-[11px] overflow-y-auto space-y-0.5 no-scrollbar scroll-smooth"
      >
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 leading-relaxed whitespace-pre-wrap">
            <span className="text-white/20 shrink-0 select-none">[{log.timestamp}]</span>
            <span className={`${getTypeStyles(log.type)}`}>{log.message}</span>
          </div>
        ))}
      </div>

      <form 
        onSubmit={handleSubmit}
        className="bg-[#050505] p-3 border-t border-white/5 flex items-center gap-3"
      >
        <span className="text-[#00ffcc] text-xs font-bold animate-pulse">{`>>`}</span>
        <input 
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="ENTER SYSTEM PROTOCOL..."
          className="flex-1 bg-transparent border-none outline-none text-[#00ffcc] text-xs placeholder:text-[#00ffcc40] tracking-widest"
          autoFocus
        />
      </form>
    </div>
  );
}

function getTypeStyles(type: LogEntry['type']) {
  switch (type) {
    case 'success': return 'text-[#00ffcc]';
    case 'error': return 'text-[#cc5500]';
    case 'warning': return 'text-[#ffff00]';
    default: return 'text-[#00ffcc80]';
  }
}

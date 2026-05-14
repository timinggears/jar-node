/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogEntry } from '../types';
import React, { useEffect, useRef, useState } from 'react';

interface ConsoleLogProps {
  logs: LogEntry[];
  onCommand?: (cmd: string) => void;
}

export default function ConsoleLog({ logs, onCommand }: ConsoleLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [isAtBottom, setIsAtBottom] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      // Using a 10px buffer for reliability
      const atBottom = scrollHeight - scrollTop - clientHeight < 10;
      setIsAtBottom(atBottom);
    }
  };

  useEffect(() => {
    if (scrollRef.current && isAtBottom) {
      const { scrollHeight, clientHeight } = scrollRef.current;
      scrollRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'auto'
      });
    }
  }, [logs, isAtBottom]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && onCommand) {
      onCommand(inputValue);
      setInputValue('');
      setIsAtBottom(true); // Force scroll to bottom on new command
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
        {!isAtBottom && (
          <button 
            onClick={() => {
              setIsAtBottom(true);
              if (scrollRef.current) {
                scrollRef.current.scrollTo({
                  top: scrollRef.current.scrollHeight,
                  behavior: 'smooth'
                });
              }
            }}
            className="text-[9px] bg-[#00ffcc] text-black px-2 py-0.5 rounded font-black animate-pulse"
          >
            RESUME_AUTO_SCROLL
          </button>
        )}
      </div>
      
      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex-1 p-4 text-[11px] overflow-y-auto space-y-1 no-scrollbar selection:bg-[#00ffcc] selection:text-black"
      >
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-left-1 duration-300">
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

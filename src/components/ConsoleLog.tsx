/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogEntry } from '../types';
import { useEffect, useRef } from 'react';

interface ConsoleLogProps {
  logs: LogEntry[];
}

export default function ConsoleLog({ logs }: ConsoleLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

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

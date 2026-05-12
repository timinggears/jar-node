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
      scrollRef.current.scrollTop = 0;
    }
  }, [logs]);

  return (
    <footer className="h-[180px] bg-black border border-[#ffffff15] rounded-lg overflow-hidden flex flex-col shadow-2xl">
      <div className="bg-[#111] px-4 py-1.5 border-b border-[#ffffff10] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00ffcc] animate-pulse" />
          <span className="text-[10px] font-mono font-bold tracking-wider text-[#00ffcc]">
            SYSTEM_CONSOLE_v3.2.0
          </span>
        </div>
        <div className="text-[10px] font-mono text-[#444] uppercase tracking-widest">
          BUFFER_SYNC: OK
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1 scrollbar-none"
      >
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 leading-tight animate-in fade-in slide-in-from-left-1 duration-200">
            <span className="text-[#444] shrink-0 select-none">[{log.timestamp}]</span>
            <span className={`${getTypeStyles(log.type)} tracking-tight`}>{log.message}</span>
          </div>
        ))}
      </div>
    </footer>
  );
}

function getTypeStyles(type: LogEntry['type']) {
  switch (type) {
    case 'success': return 'text-[#00ffcc]';
    case 'error': return 'text-[#ff0088]';
    case 'warning': return 'text-[#ffff00]';
    default: return 'text-[#00ffcc80]';
  }
}

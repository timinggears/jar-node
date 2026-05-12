/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Shield, Power } from 'lucide-react';

interface BootLoaderProps {
  onBoot: () => void;
}

export default function BootLoader({ onBoot }: BootLoaderProps) {
  const [status, setStatus] = useState('Booting from jar...');
  const [isBooting, setIsBooting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleBoot = () => {
    setIsBooting(true);
    setStatus('Loading v95 from jar...');
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(currentProgress);
      
      if (currentProgress === 20) setStatus('Raspberry Pi GPIO Initializing...');
      if (currentProgress === 40) setStatus('Synchronizing nodal frequencies...');
      if (currentProgress === 60) setStatus('Reservoir Kernel Loading...');
      if (currentProgress === 80) setStatus('Allocating tachyonic buffers...');
      if (currentProgress === 95) setStatus('Mounting Sovereign Desktop environment...');
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(onBoot, 500);
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/5 rounded-2xl p-10 shadow-2xl relative overflow-hidden">
        {/* Decorative background grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#00ffcc 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        
        <div className="relative z-10 flex flex-col items-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-[#00ffcc]/10 rounded-full flex items-center justify-center mb-8 border border-[#00ffcc]/20 shadow-[0_0_30px_rgba(0,255,204,0.1)]"
          >
            <Terminal className="w-10 h-10 text-[#00ffcc]" />
          </motion.div>

          <h1 className="text-3xl font-black tracking-[0.3em] text-[#00ffcc] mb-2 uppercase text-center">
            JAR OS BOOT
          </h1>
          <p className="text-[10px] text-white/30 tracking-[0.4em] uppercase mb-12">
            Sector 95 Initialization
          </p>

          <div className="w-full space-y-6">
            <div className="text-center h-6">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={status}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={`text-xs font-mono tracking-tight ${isBooting ? 'text-[#00ffcc]' : 'text-white/60'}`}
                >
                  {status}
                </motion.p>
              </AnimatePresence>
            </div>

            {isBooting ? (
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-[#00ffcc] shadow-[0_0_10px_#00ffcc]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            ) : (
              <button 
                onClick={handleBoot}
                className="group relative w-full py-4 bg-[#006666]/20 border border-[#00ffcc]/40 rounded-xl overflow-hidden transition-all hover:bg-[#006666]/30"
              >
                <div className="absolute inset-0 bg-[#00ffcc]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 font-black text-[#00ffcc] tracking-[0.2em] text-sm flex items-center justify-center gap-3">
                  <Power className="w-4 h-4" />
                  BOOT JAR DESKTOP
                </span>
              </button>
            )}

            <div className="pt-8 border-t border-white/5 text-center">
              <p className="text-[9px] text-[#666] font-mono leading-relaxed uppercase tracking-widest">
                v95.py and jar_memory.txt are now <br/> stored inside the jar
              </p>
            </div>
          </div>
        </div>

        {/* Corner Decorations */}
        <div className="absolute top-4 right-4 text-[8px] text-[#222] font-mono">MD_8172_LOADER</div>
        <div className="absolute bottom-4 left-4 flex gap-1">
          <div className="w-1 h-1 bg-[#00ffcc]/20 rounded-full" />
          <div className="w-1 h-1 bg-[#00ffcc]/20 rounded-full" />
          <div className="w-1 h-1 bg-[#00ffcc]/20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

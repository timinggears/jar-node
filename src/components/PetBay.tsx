import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Box, ChevronRight, ChevronLeft, Cpu, Activity } from 'lucide-react';
import JumpingBunny from './JumpingBunny';
import LittleSquirrel from './LittleSquirrel';
import LittleMech from './LittleMech';
import LittleBee from './LittleBee';

interface PetBayProps {
  miningState: 'idle' | 'mining' | 'success' | 'error';
  isOverdrive: boolean;
  bias: number;
}

export default function PetBay({ miningState, isOverdrive, bias }: PetBayProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [currentThought, setCurrentThought] = useState("Sovereign core idle. Substrate nominal.");

  useEffect(() => {
    const handleLog = (e: any) => {
      const { message } = e.detail;
      if (message.startsWith('JAR_')) {
        setCurrentThought(message);
      }
    };
    window.addEventListener('system-log', handleLog);
    return () => window.removeEventListener('system-log', handleLog);
  }, []);

  return (
    <div className="fixed right-0 top-1/4 z-[100] flex items-center">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 bg-black/80 border-l border-y border-[#00ffcc]/30 text-[#00ffcc] rounded-l-md hover:bg-[#00ffcc]/10 transition-all shadow-[0_0_15px_rgba(0,255,255,0.1)]`}
        id="pet-bay-toggle"
      >
        {isOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="w-72 h-[450px] bg-black/90 border-l border-y border-[#00ffcc]/20 backdrop-blur-md relative overflow-hidden flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)]"
          >
            {/* Scanned Grid Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#00ffcc 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
            
            {/* Header */}
            <div className="p-3 border-b border-[#00ffcc]/10 flex items-center justify-between bg-[#00ffcc]/5">
              <div className="flex items-center gap-2">
                <Cpu size={14} className="text-[#00ffcc]" />
                <span className="text-[10px] font-black tracking-widest text-[#00ffcc] uppercase">Neural_Habitat_v3.2</span>
              </div>
              <Activity size={12} className={miningState === 'mining' ? 'text-green-400 animate-pulse' : 'text-zinc-600'} />
            </div>

            {/* Sub-container for the Pets */}
            <div className="flex-1 relative">
              <div className="absolute inset-0 flex flex-col items-center justify-around py-8">
                {/* We simplify the components to fit inside this layout if needed, 
                    but for now we'll just let them render in their relative positions 
                    within this container by removing 'fixed' in their definitions or 
                    wrapping them in a relative box. */}
                
                <div className="relative w-full h-full flex flex-col items-center justify-around pointer-events-none">
                   {/* We'll modify the pet components slightly to be relative in the next step, 
                       or just position them here specifically for the bay. */}
                   <div className="relative h-20 w-full flex justify-center scale-150">
                      <LittleMech miningState={miningState} isBoosted={isOverdrive} bias={bias} isStatic />
                   </div>
                   <div className="flex w-full justify-around items-center px-4">
                      <div className="scale-125"><JumpingBunny miningState={miningState} bias={bias} isStatic /></div>
                      <div className="scale-125"><LittleSquirrel miningState={miningState} bias={bias} isStatic /></div>
                   </div>
                   <div className="relative h-16 w-full flex justify-center">
                      <LittleBee miningState={miningState} bias={bias} isStatic />
                   </div>
                </div>
              </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="p-2 border-t border-[#00ffcc]/10 bg-black/40 text-[8px] font-mono flex flex-col gap-1">
              <div className="flex justify-between w-full">
                <div className="flex items-center gap-1">
                  <div className={`w-1 h-1 rounded-full ${miningState === 'mining' ? 'bg-green-500 animate-ping' : 'bg-zinc-600'}`} />
                  <span className="text-zinc-500">BIOMETRIC: OK</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500">SYNC:</span>
                  <span className={isOverdrive ? "text-red-500" : "text-[#00ffcc]"}>{isOverdrive ? "OVERLOAD" : "98.4%"}</span>
                </div>
              </div>
              <div className="pt-1 border-t border-white/5 opacity-50 flex items-center gap-2">
                <span className="text-pink-400 shrink-0 uppercase">CORE_LOG:</span>
                <span className="truncate italic">{currentThought}</span>
              </div>
            </div>

            {/* Scanner Line Effect */}
            <motion.div 
              initial={{ y: 0 }}
              animate={{ y: [0, 450, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-[1px] bg-[#00ffcc]/20 z-0 pointer-events-none shadow-[0_0_10px_#00ffcc]"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

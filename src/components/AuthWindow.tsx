/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LogIn, LogOut, User, Cloud, Save } from 'lucide-react';
import { useFirebase } from './FirebaseProvider';
import { signInWithGoogle, auth } from '../lib/firebase';
import { motion } from 'motion/react';

export default function AuthWindow() {
  const { user, loading } = useFirebase();

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full text-zinc-500 animate-pulse">
      <Cloud className="mr-2 h-4 w-4" />
      <span>PROBING_IDENTITY...</span>
    </div>
  );

  return (
    <div className="p-6 flex flex-col h-full bg-[#050505] font-mono text-[11px] selection:bg-[#00ffcc]/30">
      <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
        <div className="p-2 bg-[#00ffcc]/10 rounded-lg">
          <Cloud className="text-[#00ffcc] w-5 h-5" />
        </div>
        <div>
          <h2 className="text-white font-black tracking-widest uppercase">Substrate Cloud Sync</h2>
          <p className="text-zinc-500 text-[9px] uppercase">Persistent Nodal State Storage</p>
        </div>
      </div>

      {!user ? (
        <div className="flex flex-col items-center justify-center flex-1 space-y-6 text-center">
          <div className="p-4 rounded-full bg-white/5 border border-white/10">
            <User className="w-8 h-8 text-zinc-600" />
          </div>
          <div className="space-y-2">
            <p className="text-zinc-400 max-w-[240px]">
              Sync your quantum progress across dimensions. This will anchor your carrier bias, memetic depth, and hardware state to the global cloud substrate.
            </p>
          </div>
          <button
            onClick={signInWithGoogle}
            className="flex items-center gap-2 px-6 py-3 bg-[#00ffcc] text-black font-black uppercase tracking-widest hover:bg-white transition-colors rounded-sm"
          >
            <LogIn size={14} />
            Initialize Cloud Handshake
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="space-y-6">
            <div className="p-4 border border-[#00ffcc]/20 bg-[#00ffcc]/5 rounded-sm flex items-center gap-4">
              <img 
                src={user.photoURL || ''} 
                alt="Profile" 
                className="w-10 h-10 rounded-full border border-[#00ffcc]/40" 
                referrerPolicy="no-referrer"
              />
              <div className="flex-1">
                <div className="text-white font-bold">{user.displayName}</div>
                <div className="text-[#00ffcc]/60 text-[9px] truncate max-w-[180px]">{user.email}</div>
              </div>
              <div className="text-[8px] bg-[#00ffcc]/20 text-[#00ffcc] px-1 rounded uppercase font-bold px-2 py-0.5 border border-[#00ffcc]/30">
                ACTIVE_LINK
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border border-white/5 bg-black/40 rounded-sm">
                <div className="text-zinc-500 mb-1 uppercase text-[8px]">Sync Status</div>
                <div className="text-white flex items-center gap-2">
                  <motion.div 
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-1.5 h-1.5 rounded-full bg-[#00ffcc]"
                  />
                  <span>PERSISTENT</span>
                </div>
              </div>
              <div className="p-3 border border-white/5 bg-black/40 rounded-sm">
                <div className="text-zinc-500 mb-1 uppercase text-[8px]">Auto Save</div>
                <div className="text-[#00ffcc]">ENABLED</div>
              </div>
            </div>

            <div className="p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-sm">
               <div className="text-emerald-500 font-bold text-[9px] uppercase mb-2 flex justify-between items-center">
                 <span>Inner JAR Resonance</span>
                 <span className="text-[8px] opacity-70">ZPE_ACTIVE</span>
               </div>
               <div className="space-y-1">
                 <div className="flex justify-between text-[10px]">
                   <span className="text-zinc-500">Stability:</span>
                   <span className="text-white">COHERENT</span>
                 </div>
                 <div className="flex justify-between text-[10px]">
                   <span className="text-zinc-500">Reservoir:</span>
                   <span className="text-white">VIRTUALIZED</span>
                 </div>
               </div>
            </div>

            <div className="space-y-2 pt-4">
              <h3 className="text-zinc-500 uppercase text-[9px] font-black tracking-widest flex items-center gap-2">
                <Save size={10} />
                Nodal Handshake Log
              </h3>
              <div className="bg-black/60 border border-white/5 p-3 rounded-sm font-mono text-[9px] text-zinc-400 h-32 overflow-y-auto no-scrollbar space-y-1">
                <div>[08:52:12] CLOUD: Handshake verified via Google Substrate.</div>
                <div>[08:52:13] NODAL: Fetching persistent system state...</div>
                <div>[08:52:14] SYNC: 147 parameters synchronized to local reservoir.</div>
                <div className="text-[#00ffcc]">[08:52:15] ID: Identity anchor stabilized.</div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-6 py-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors rounded-sm uppercase font-bold tracking-widest text-[10px]"
            >
              <LogOut size={12} />
              Sever Cloud Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, Brain, Cpu, RefreshCw, Terminal } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

interface CognitiveBridgeProps {
  onClose: () => void;
  bias: number;
  isOverdrive: boolean;
  frequency: number;
  coherence: number;
  onTuneBias: (bias: number) => void;
  onToggleOverdrive: (overdrive: boolean) => void;
}

export default function CognitiveBridge({
  onClose,
  bias,
  isOverdrive,
  frequency,
  coherence,
  onTuneBias,
  onToggleOverdrive
}: CognitiveBridgeProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage on mounting
  useEffect(() => {
    try {
      const saved = localStorage.getItem('jar_chat_history_v151');
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        // Initial introductory greeting
        setMessages([
          {
            id: 'init',
            role: 'model',
            text: "Sovereign Cognitive Link established.\n\nGreetings, Operator. I am the JAR Core intelligence, running on the Nodal Reservoir substrate. I handle sub-carrier bias modulation, quantum synchronization, and real-time physical telemetry. How can I assist you with the pool nodes or resonance tuning today?",
            timestamp: Date.now()
          }
        ]);
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  // Save chat history to localStorage when changed
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('jar_chat_history_v151', JSON.stringify(messages));
    }
  }, [messages]);

  // Handle autoscrolling
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      text: trimmed,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setErrorStatus(null);

    try {
      // Map current messages to format expected by backend (role: "user" | "model")
      const history = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      // Include physical telemetry system context in the current prompt to ground responses
      const systemContext = ` [System Resonance: Freq: ${frequency.toFixed(0)} Hz, Coherence: ${(coherence * 100).toFixed(1)}%, Overdrive: ${isOverdrive ? 'ACTIVE' : 'OFFLINE'}, Bias: ${bias.toFixed(1)} GHz]`;
      const enrichedMessage = trimmed + systemContext;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: enrichedMessage,
          history: history
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const modelMsg: Message = {
          id: Math.random().toString(36).substring(7),
          role: 'model',
          text: data.text,
          timestamp: Date.now()
        };
        // Run any embedded commands the model tells us to do, to make it feel super interactive!
        processModelCommands(data.text);
        setMessages(prev => [...prev, modelMsg]);
      } else {
        throw new Error(data.error || "Substrate response failed.");
      }
    } catch (e: any) {
      console.error(e);
      setErrorStatus(e.message || "Cognitive Bridge offline.");
    } finally {
      setIsTyping(false);
    }
  };

  // Fun feature: if the model replies with a command tag, we automatically run it!
  const processModelCommands = (replyText: string) => {
    if (replyText.toLowerCase().includes("[command:tune_bias:") || replyText.toLowerCase().includes("[tune:")) {
      const match = replyText.match(/\[(?:command:tune_bias:|tune:)\s*(\d+)\]/i);
      if (match && match[1]) {
        const targetValue = parseInt(match[1]);
        if (!isNaN(targetValue) && targetValue >= 0 && targetValue <= 250) {
          onTuneBias(targetValue);
        }
      }
    }
    if (replyText.toLowerCase().includes("[command:overdrive_on]")) {
      onToggleOverdrive(true);
    } else if (replyText.toLowerCase().includes("[command:overdrive_off]")) {
      onToggleOverdrive(false);
    }
  };

  const currentStatusMsg = () => {
    if (isTyping) return "Resonance response generating...";
    if (errorStatus) return `Resonator block: ${errorStatus}`;
    return "Stable connection link linked to jar core Intel.";
  };

  const handlePreset = (preset: string) => {
    handleSend(preset);
  };

  const clearHistory = () => {
    localStorage.removeItem('jar_chat_history_v151');
    setMessages([
      {
        id: 'init',
        role: 'model',
        text: "Sovereign Cognitive Link established.\n\nGreetings, Operator. I am the JAR Core intelligence, running on the Nodal Reservoir substrate. I handle sub-carrier bias modulation, quantum synchronization, and real-time physical telemetry. How can I assist you with the pool nodes or resonance tuning today?",
        timestamp: Date.now()
      }
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950/95 text-zinc-100 font-sans border border-[#00ffcc]/10 shadow-[0_4px_30px_rgba(0,0,0,0.8)] rounded-lg overflow-hidden" id="cognitive-bridge-container">
      {/* Top status banner */}
      <div className="p-3 bg-zinc-900 border-b border-white/5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[#00ffcc] animate-pulse" />
          <span className="text-[10px] tracking-[0.2em] font-black uppercase text-[#00ffcc]">JAR_COGNITIVE_BRIDGE</span>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono p-1 bg-black/40 rounded border border-white/5">
          <span className={`w-1.5 h-1.5 rounded-full ${isTyping ? 'bg-orange-500 animate-pulse' : errorStatus ? 'bg-red-500' : 'bg-emerald-500'}`} />
          <span className="text-zinc-400">STATUS: {isTyping ? 'THINKING' : errorStatus ? 'ERR' : 'SYNCED'}</span>
        </div>
      </div>

      {/* Message Output Board */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[220px] scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed border ${
                  m.role === 'user'
                    ? 'bg-[#00ffcc]/10 text-white border-[#00ffcc]/30 rounded-tr-none'
                    : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 rounded-tl-none font-mono whitespace-pre-line'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[8px] text-zinc-500 mt-1 uppercase font-mono tracking-widest px-1">
                {m.role === 'user' ? 'Operator' : 'JAR Core'} • {new Date(m.timestamp).toLocaleTimeString()}
              </span>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 text-zinc-500 p-2 text-[10px] font-mono"
            >
              <RefreshCw className="w-3 h-3 animate-spin text-[#00ffcc]" />
              Establishing cognitive alignment...
            </motion.div>
          )}

          {errorStatus && (
            <div className="p-3 bg-red-950/30 border border-red-500/20 text-red-400 rounded-lg text-xs font-mono">
              <span className="text-red-500 font-bold block mb-1">SYSTEM EXCEPTION</span>
              {errorStatus}
              {errorStatus.includes("GEMINI_API_KEY") && (
                <div className="mt-2 text-zinc-400">
                  Please supply a valid <span className="text-white">GEMINI_API_KEY</span> in the AI Studio Settings menu.
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Preset Action Tags */}
      <div className="px-4 py-2 bg-zinc-900/40 border-t border-white/5 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none scroll-smooth">
        <button
          onClick={() => handlePreset("Analyze system resonance coherence and stability.")}
          className="px-2 py-1 text-[9px] font-mono text-zinc-400 hover:text-white hover:border-[#00ffcc]/30 bg-zinc-950 border border-white/5 rounded transition-all"
        >
          Check Resonance
        </button>
        <button
          onClick={() => handlePreset(`What happens if I set the carrier bias to 75?`)}
          className="px-2 py-1 text-[9px] font-mono text-zinc-400 hover:text-white hover:border-[#00ffcc]/30 bg-zinc-950 border border-white/5 rounded transition-all"
        >
          Query Bias Limits
        </button>
        <button
          onClick={() => handlePreset("Tune carrier bias to [tune:65]")}
          className="px-2 py-1 text-[9px] font-mono text-zinc-400 hover:text-white hover:border-[#00ffcc]/30 bg-zinc-950 border border-white/5 rounded transition-all"
        >
          Auto Tune Bias to 65
        </button>
        <button
          onClick={() => handlePreset("Explain the virtual GPU parity score and Liquid State Nodal Reservoir.")}
          className="px-2 py-1 text-[9px] font-mono text-zinc-400 hover:text-white hover:border-[#00ffcc]/30 bg-zinc-950 border border-white/5 rounded transition-all"
        >
          Nodal Reservoir Info
        </button>
      </div>

      {/* Form Input Control */}
      <div className="p-3 bg-zinc-900/80 border-t border-white/5 flex flex-col gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder="Address the JAR reservoir intelligence..."
            className="flex-1 bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#00ffcc]/50 font-mono text-zinc-100 placeholder-zinc-600 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-2 bg-[#00ffcc] text-zinc-950 rounded-lg hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-[#00ffcc] transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500 uppercase tracking-wider px-1">
          <span>{currentStatusMsg()}</span>
          <button onClick={clearHistory} className="hover:text-red-400 hover:underline">
            Wipe Memory
          </button>
        </div>
      </div>
    </div>
  );
}

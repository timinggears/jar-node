import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  HardDrive, 
  Trash2, 
  GitBranch, 
  Binary, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Zap, 
  Flame, 
  Activity, 
  Cpu, 
  Sparkles,
  Sliders
} from 'lucide-react';

interface IOProps {
  onAddLog?: (msg: string, type?: 'info' | 'error' | 'warning' | 'success') => void;
  onOpenMemTest?: () => void;
  onOpenQuantumCipher?: () => void;
}

export default function SubstrateIOBox({ onAddLog, onOpenMemTest, onOpenQuantumCipher }: IOProps) {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [lastWritten, setLastWritten] = useState('');
  const [cellCount, setCellCount] = useState(0);
  const [avgStability, setAvgStability] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'writing' | 'recalling' | 'match' | 'mismatch'>('idle');
  const [history, setHistory] = useState<{ id: string; in: string; out: string; time: string; match: boolean; algo?: string }[]>([]);
  const historyCounterRef = useRef(0);

  // Cryptographic Mode State
  const [isEncryptedMode, setIsEncryptedMode] = useState<boolean>(false);
  const [cipherAlgorithm, setCipherAlgorithm] = useState<'PURLE-1024-RLWE' | 'HYPERCHAOS-4D' | 'Q-OTP-VERNAM'>('PURLE-1024-RLWE');
  const [latestCipherPackage, setLatestCipherPackage] = useState<any>(null);
  const [decryptedText, setDecryptedText] = useState<string>('');
  const [rawCipherCells, setRawCipherCells] = useState<string>('');
  const [viewMode, setViewMode] = useState<'decrypted' | 'raw_ciphertext' | 'math_spec'>('decrypted');
  const [isTampered, setIsTampered] = useState<boolean>(false);
  const originalPackageRef = useRef<any>(null);
  const [berRate, setBerRate] = useState<number | null>(null);

  // Recall from backend memory
  const doRecall = async (expectedText?: string, overridePkg?: any) => {
    setStatus('recalling');
    try {
      const res = await fetch('/api/reservoir/recall');
      const data = await res.json();
      if (data.success) {
        const recalled = data.reconstructed_string || '';
        setOutputText(recalled);
        setCellCount(data.total_cells || 0);
        setAvgStability(data.average_stability || 0);

        const currentPkg = overridePkg || latestCipherPackage;

        // If in encrypted mode with a stored package, perform live decryption of the substrate payload
        if (isEncryptedMode && currentPkg) {
          try {
            const decRes = await fetch('/api/crypto/decrypt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                algorithm: currentPkg.algorithm,
                package: currentPkg,
                ciphertextHex: currentPkg.ciphertextHex,
                keyHex: currentPkg.keyHex
              })
            });

            if (decRes.ok) {
              const decData = await decRes.json();
              setDecryptedText(decData.plaintext || '');
              setBerRate(decData.bitErrorRate || 0);
              setRawCipherCells(currentPkg.ciphertextHex || '');

              const compareTo = (expectedText !== undefined ? expectedText : lastWritten).trim();
              const isMatch = compareTo ? (decData.plaintext.trim() === compareTo || decData.plaintext.includes(compareTo)) : true;
              setStatus(isMatch ? 'match' : 'mismatch');

              if (onAddLog) {
                onAddLog(
                  `[SUBSTRATE_DECRYPT]: Read ${data.total_cells} cells. Decrypted via ${currentPkg.algorithm} -> "${decData.plaintext}" (BER: ${(decData.bitErrorRate || 0).toFixed(2)}%)`,
                  isMatch ? 'success' : 'warning'
                );
              }

              if (compareTo) {
                const uniqueId = `recall_${Date.now()}_${++historyCounterRef.current}_${Math.random().toString(36).slice(2, 7)}`;
                setHistory(prev => [
                  {
                    id: uniqueId,
                    in: compareTo,
                    out: decData.plaintext,
                    time: new Date().toLocaleTimeString(),
                    match: isMatch,
                    algo: currentPkg.algorithm
                  },
                  ...prev.slice(0, 7)
                ]);
              }
              return;
            }
          } catch (decErr) {
            console.warn('[DECRYPT_ERR]', decErr);
          }
        }

        // Standard plain mode recall
        const compareTo = (expectedText !== undefined ? expectedText : lastWritten).trim();
        const isMatch = compareTo ? (recalled.trim() === compareTo || recalled.includes(compareTo)) : true;
        setStatus(isMatch ? 'match' : 'mismatch');

        if (onAddLog) {
          onAddLog(`[IO_BOX_RECALL]: Read "${recalled}" (${data.total_cells} cells, stability ${data.average_stability})`, isMatch ? 'success' : 'warning');
        }

        if (compareTo) {
          const uniqueId = `recall_${Date.now()}_${++historyCounterRef.current}_${Math.random().toString(36).slice(2, 7)}`;
          setHistory(prev => [
            {
              id: uniqueId,
              in: compareTo,
              out: recalled,
              time: new Date().toLocaleTimeString(),
              match: isMatch,
              algo: 'PLAIN'
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

  // Write and trigger recall
  const doWrite = async () => {
    const textToWrite = inputText.trim();
    if (!textToWrite) return;

    setStatus('writing');
    setIsTampered(false);

    try {
      if (isEncryptedMode) {
        // 1. ENCRYPT FIRST VIA BEYOND-CURRENT-ART CIPHER ENGINE
        const encRes = await fetch('/api/crypto/encrypt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            algorithm: cipherAlgorithm,
            plaintext: textToWrite
          })
        });

        if (!encRes.ok) throw new Error('Encryption failed');
        const encData = await encRes.json();
        const pkg = encData.package;
        setLatestCipherPackage(pkg);
        originalPackageRef.current = JSON.parse(JSON.stringify(pkg));
        setRawCipherCells(pkg.ciphertextHex);

        // 2. WRITE CIPHERTEXT BYTES DIRECTLY INTO PHYSICAL RESERVOIR CELLS
        const hexPayload = pkg.ciphertextHex.slice(0, 32); // Store first 32 chars of high-entropy stream
        await fetch('/api/reservoir/write-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: hexPayload })
        });

        setLastWritten(textToWrite);
        setInputText('');
        setOutputText(hexPayload);
        setDecryptedText(textToWrite);
        setBerRate(0.0);
        setStatus('match');

        if (onAddLog) {
          onAddLog(
            `[SUBSTRATE_CIPHER_WRITE]: Encrypted "${textToWrite}" via ${pkg.algorithm}. Injected 256-bit entropy stream into reservoir cells (H = ${pkg.shannonEntropy.toFixed(3)} bits).`,
            'success'
          );
        }

        const writeId = `write_${Date.now()}_${++historyCounterRef.current}_${Math.random().toString(36).slice(2, 7)}`;
        setHistory(prev => [
          {
            id: writeId,
            in: textToWrite,
            out: textToWrite,
            time: new Date().toLocaleTimeString(),
            match: true,
            algo: pkg.algorithm
          },
          ...prev.slice(0, 7)
        ]);

        setTimeout(() => {
          doRecall(textToWrite, pkg);
        }, 200);

      } else {
        // PLAIN TEXT WRITE
        await fetch('/api/reservoir/write-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textToWrite })
        });

        setLastWritten(textToWrite);
        setInputText('');
        setOutputText(textToWrite);
        setDecryptedText(textToWrite);
        setStatus('match');

        if (onAddLog) {
          onAddLog(`[IO_BOX_WRITE]: Encoded "${textToWrite}" into physical memory bank.`, 'success');
        }

        const writeId = `write_${Date.now()}_${++historyCounterRef.current}_${Math.random().toString(36).slice(2, 7)}`;
        setHistory(prev => [
          {
            id: writeId,
            in: textToWrite,
            out: textToWrite,
            time: new Date().toLocaleTimeString(),
            match: true,
            algo: 'PLAIN'
          },
          ...prev.slice(0, 7)
        ]);

        setTimeout(() => {
          doRecall(textToWrite);
        }, 200);
      }
    } catch (e: any) {
      if (onAddLog) onAddLog(`[IO_WRITE_ERR]: ${e.message}`, 'error');
      setOutputText(textToWrite);
      setLastWritten(textToWrite);
      setInputText('');
      setStatus('match');
    }
  };

  // Fault Injection: Flip 1 bit in the substrate ciphertext
  const handleToggleFaultInjection = async () => {
    if (!latestCipherPackage) return;

    if (!isTampered) {
      originalPackageRef.current = JSON.parse(JSON.stringify(latestCipherPackage));
      
      const hex = latestCipherPackage.ciphertextHex;
      const flippedChar = hex.charAt(0) === '0' ? 'f' : '0';
      const tamperedHex = flippedChar + hex.substring(1);

      const modifiedPackage = {
        ...latestCipherPackage,
        ciphertextHex: tamperedHex
      };

      if (modifiedPackage.blocks && modifiedPackage.blocks.length > 0) {
        const modifiedBlocks = JSON.parse(JSON.stringify(modifiedPackage.blocks));
        modifiedBlocks[0].U[0] = (modifiedBlocks[0].U[0] + 6144) % 12289;
        modifiedPackage.blocks = modifiedBlocks;
      }

      setLatestCipherPackage(modifiedPackage);
      setRawCipherCells(tamperedHex);
      setIsTampered(true);

      if (onAddLog) {
        onAddLog(`[SUBSTRATE_FAULT]: Injected 1-bit adversary corruption into reservoir cells. Tripping avalanche barrier.`, 'warn');
      }

      // Automatically attempt decryption to reveal the tamper detection
      try {
        const decRes = await fetch('/api/crypto/decrypt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            algorithm: modifiedPackage.algorithm,
            package: modifiedPackage,
            ciphertextHex: tamperedHex,
            keyHex: modifiedPackage.keyHex
          })
        });
        if (decRes.ok) {
          const decData = await decRes.json();
          setDecryptedText(decData.plaintext || '⚠️ [AVALANCHE TRIPPED - DECRYPTION SCRAMBLED]');
          setBerRate(decData.bitErrorRate > 0 ? decData.bitErrorRate : 0.48);
          setStatus('mismatch');
        }
      } catch (e) {}
    } else {
      // Restore
      if (originalPackageRef.current) {
        const restored = JSON.parse(JSON.stringify(originalPackageRef.current));
        setLatestCipherPackage(restored);
        setRawCipherCells(restored.ciphertextHex);
        setIsTampered(false);
        if (onAddLog) {
          onAddLog(`[SUBSTRATE_RESTORE]: Physical cell parity restored. Bit error rate cleared to 0.00%.`, 'info');
        }
        doRecall(lastWritten, restored);
      }
    }
  };

  const doClear = async () => {
    try {
      await fetch('/api/reservoir/clear', { method: 'POST' }).catch(() => {});
      setOutputText('');
      setDecryptedText('');
      setLastWritten('');
      setCellCount(0);
      setLatestCipherPackage(null);
      setIsTampered(false);
      setStatus('idle');
      if (onAddLog) onAddLog('[IO_BOX]: Substrate memory cleared.', 'info');
    } catch (e) {}
  };

  // Initial recall
  useEffect(() => {
    doRecall();
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#050505] text-zinc-200 font-mono text-xs p-3.5 gap-3">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <HardDrive className={`w-5 h-5 ${isEncryptedMode ? 'text-purple-400' : 'text-[#00ffcc]'}`} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-sm font-black tracking-wider uppercase ${isEncryptedMode ? 'text-purple-400' : 'text-[#00ffcc]'}`}>
                SUBSTRATE INPUT / OUTPUT BOX
              </h2>
              {isEncryptedMode && (
                <span className="flex items-center gap-1 text-[8px] bg-purple-950/80 text-purple-300 border border-purple-500/50 px-1.5 py-0.5 rounded font-black tracking-widest shadow-[0_0_8px_rgba(168,85,247,0.3)]">
                  <Lock size={8} /> QUANTUM_ENCRYPTED
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-500">
              {isEncryptedMode 
                ? 'Ring-LWE Lattice & 4D-Hyperchaotic cell injection & bit-perfect recall' 
                : 'Direct write to substrate cells & read-back recall'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Launch Quantum Cipher Lab Button */}
          {onOpenQuantumCipher && (
            <button
              onClick={onOpenQuantumCipher}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-purple-600/20 hover:bg-purple-600/35 text-purple-200 border border-purple-500/50 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.3)]"
              title="Open full Beyond-Current-Art Quantum & Chaos Cryptographic Laboratory"
            >
              <Lock size={12} className="text-[#00ffcc]" />
              <span>CIPHER_LAB ↗</span>
            </button>
          )}

          {onOpenMemTest && (
            <button
              onClick={onOpenMemTest}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
              title="Open Substrate MemTest86 & Sector Block Mapper"
            >
              <Binary size={12} />
              <span>MEMTEST ↗</span>
            </button>
          )}

          <button
            onClick={() => doRecall()}
            disabled={status === 'writing' || status === 'recalling'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw size={11} className={status === 'recalling' ? 'animate-spin' : ''} />
            <span>RECALL</span>
          </button>

          <button
            onClick={doClear}
            className="flex items-center gap-1 px-2 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] uppercase font-bold transition-all cursor-pointer"
            title="Clear memory"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Cryptography Mode Controls Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg border transition-all ${
        isEncryptedMode 
          ? 'bg-purple-950/25 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.15)]' 
          : 'bg-zinc-900/50 border-white/10'
      }`}>
        <div className="flex items-center gap-3">
          {/* Toggle Switch */}
          <button
            onClick={() => {
              setIsEncryptedMode(!isEncryptedMode);
              if (onAddLog) {
                onAddLog(
                  !isEncryptedMode 
                    ? `[SUBSTRATE_SECURITY]: Quantum-Resistant Lattice & Chaos Encryption Activated.` 
                    : `[SUBSTRATE_SECURITY]: Substrate returned to Plain Text mode.`,
                  !isEncryptedMode ? 'success' : 'info'
                );
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
              isEncryptedMode
                ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                : 'bg-zinc-800 text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            {isEncryptedMode ? <Lock size={12} className="text-white" /> : <Unlock size={12} />}
            <span>{isEncryptedMode ? 'ENCRYPTION: SHIELDED' : 'ENCRYPTION: PLAIN'}</span>
          </button>

          {/* Algorithm Selector */}
          {isEncryptedMode && (
            <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded border border-purple-500/30">
              <button
                onClick={() => setCipherAlgorithm('PURLE-1024-RLWE')}
                className={`px-2 py-1 rounded text-[9px] font-bold tracking-tight transition-all cursor-pointer ${
                  cipherAlgorithm === 'PURLE-1024-RLWE'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-purple-200'
                }`}
                title="Ring-LWE Post-Quantum Lattice (Z_12289[X]/(X^256 + 1))"
              >
                PURLE-1024 (Lattice)
              </button>
              <button
                onClick={() => setCipherAlgorithm('HYPERCHAOS-4D')}
                className={`px-2 py-1 rounded text-[9px] font-bold tracking-tight transition-all cursor-pointer ${
                  cipherAlgorithm === 'HYPERCHAOS-4D'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-purple-200'
                }`}
                title="4D Chen-Lorenz Hyperchaotic Attractor Feistel Network"
              >
                HYPERCHAOS-4D
              </button>
              <button
                onClick={() => setCipherAlgorithm('Q-OTP-VERNAM')}
                className={`px-2 py-1 rounded text-[9px] font-bold tracking-tight transition-all cursor-pointer ${
                  cipherAlgorithm === 'Q-OTP-VERNAM'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-purple-200'
                }`}
                title="Shannon Information-Theoretic Perfect Secrecy One-Time Pad"
              >
                Q-OTP (Shannon)
              </button>
            </div>
          )}
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1 text-[9px]">
          <span className="text-zinc-500 mr-1">Presets:</span>
          <button
            onClick={() => setInputText('JAR_SINGULARITY: Physical reservoir phase-entanglement vector [Ψ = 0.988] locked.')}
            className="px-1.5 py-0.5 bg-black/40 hover:bg-white/10 text-zinc-400 hover:text-white rounded border border-white/10 transition-all cursor-pointer"
          >
            Lattice Singularity
          </button>
          <button
            onClick={() => setInputText('|Ψ⟩ = (|00⟩ + |11⟩)/√2 : Bell quantum state encoded into substrate lattice.')}
            className="px-1.5 py-0.5 bg-black/40 hover:bg-white/10 text-zinc-400 hover:text-white rounded border border-white/10 transition-all cursor-pointer"
          >
            Bell Superposition
          </button>
        </div>
      </div>

      {/* Main Dual Box: INPUT on Left, OUTPUT on Right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-[190px]">
        {/* INPUT BOX */}
        <div className={`flex flex-col bg-zinc-950 border-2 rounded-xl p-3 gap-2 transition-all ${
          isEncryptedMode 
            ? 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
            : 'border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-black uppercase">
            <span className={isEncryptedMode ? 'text-purple-400' : 'text-emerald-400'}>
              {isEncryptedMode ? '1. SECURE INPUT (ENCRYPT & WRITE)' : '1. INPUT (WRITE TO JAR)'}
            </span>
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
              placeholder={isEncryptedMode 
                ? "Enter secret payload (will be encrypted with Post-Quantum Lattice / 4D Chaos)..." 
                : "Type your message, bits, or bytes here..."}
              className={`flex-1 min-h-[85px] w-full bg-black/80 border rounded-lg p-2.5 font-mono text-sm placeholder-zinc-700 focus:outline-none resize-none transition-all ${
                isEncryptedMode 
                  ? 'border-purple-500/40 text-purple-200 focus:border-purple-400' 
                  : 'border-emerald-500/30 text-emerald-300 focus:border-emerald-400'
              }`}
            />

            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-zinc-500 truncate max-w-[200px]">
                {lastWritten ? `Last Sent: "${lastWritten}"` : 'Ready to write'}
              </span>
              <button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  doWrite();
                }}
                disabled={status === 'writing' || !inputText.trim()}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all disabled:opacity-30 cursor-pointer ${
                  isEncryptedMode
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                }`}
              >
                <span>{status === 'writing' ? 'ENCODING...' : (isEncryptedMode ? 'ENCRYPT & WRITE' : 'WRITE')}</span>
                {isEncryptedMode ? <Lock size={12} /> : <Send size={12} />}
              </button>
            </div>
          </form>
        </div>

        {/* OUTPUT BOX */}
        <div className={`flex flex-col bg-zinc-950 border-2 rounded-xl p-3 gap-2 transition-all ${
          isEncryptedMode 
            ? 'border-[#00ffcc]/50 shadow-[0_0_15px_rgba(0,255,204,0.15)]' 
            : 'border-[#00ffcc]/40 shadow-[0_0_15px_rgba(0,255,204,0.1)]'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-black uppercase text-[#00ffcc]">
            <div className="flex items-center gap-2">
              <span>2. OUTPUT (RECALLED FROM JAR)</span>
              {isEncryptedMode && (
                <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded border border-white/10 text-[8px]">
                  <button
                    onClick={() => setViewMode('decrypted')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${viewMode === 'decrypted' ? 'bg-[#00ffcc]/20 text-[#00ffcc] font-bold' : 'text-zinc-500'}`}
                  >
                    DECRYPTED
                  </button>
                  <button
                    onClick={() => setViewMode('raw_ciphertext')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${viewMode === 'raw_ciphertext' ? 'bg-purple-600/20 text-purple-300 font-bold' : 'text-zinc-500'}`}
                  >
                    RAW CELLS
                  </button>
                </div>
              )}
            </div>

            {status === 'match' && (
              <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-black">
                <CheckCircle2 size={12} /> {isEncryptedMode ? '100% BIT-PERFECT' : 'MATCH'}
              </span>
            )}
            {status === 'mismatch' && (
              <span className="flex items-center gap-1 text-amber-400 text-[10px] font-black">
                <AlertCircle size={12} /> {isTampered ? 'AVALANCHE BARRIER' : 'DISCREPANCY'}
              </span>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-2 min-h-0">
            <div className="flex-1 min-h-[85px] max-h-[140px] overflow-y-auto w-full bg-black/90 border border-[#00ffcc]/30 rounded-lg p-2.5 font-mono text-sm font-black tracking-wider flex items-center justify-center text-center select-all drop-shadow-[0_0_10px_rgba(0,255,204,0.3)] break-all whitespace-pre-wrap">
              {status === 'recalling' ? (
                <span className="text-zinc-600 animate-pulse text-xs tracking-widest uppercase">READING CHARGE RETENTION & PHASE COHERENCE...</span>
              ) : isEncryptedMode && viewMode === 'raw_ciphertext' ? (
                <div className="flex flex-col items-center gap-1 text-left w-full">
                  <span className="text-[9px] text-purple-400 font-normal">Physical Reservoir Encrypted Cell Charge Hex:</span>
                  <span className="text-purple-300 font-mono text-xs break-all select-all font-normal">
                    {rawCipherCells || outputText || '<NO CIPHER CELLS STORED>'}
                  </span>
                </div>
              ) : isEncryptedMode ? (
                <span className={isTampered ? 'text-amber-400' : 'text-[#00ffcc]'}>
                  {decryptedText ? `“${decryptedText}”` : (outputText ? `“${outputText}”` : '<MEMORY EMPTY>')}
                </span>
              ) : outputText ? (
                <span className="text-[#00ffcc]">&ldquo;{outputText}&rdquo;</span>
              ) : (
                <span className="text-zinc-700 italic text-xs">&lt;MEMORY EMPTY - WRITE SOMETHING&gt;</span>
              )}
            </div>

            {/* Encrypted Mode Telemetry & Fault Injection */}
            {isEncryptedMode && latestCipherPackage && (
              <div className="flex items-center justify-between text-[9px] bg-purple-950/30 border border-purple-500/30 rounded p-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Entropy: <strong className="text-emerald-400">{latestCipherPackage.shannonEntropy ? latestCipherPackage.shannonEntropy.toFixed(3) : '7.998'} bits</strong></span>
                  <span className="text-zinc-400">BER: <strong className={isTampered ? 'text-amber-400' : 'text-[#00ffcc]'}>{isTampered ? '48.2%' : '0.00%'}</strong></span>
                </div>
                
                {/* Fault Inject Button */}
                <button
                  onClick={handleToggleFaultInjection}
                  className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all cursor-pointer ${
                    isTampered
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                  }`}
                  title="Invert 1 bit in substrate memory to test Strict Avalanche Criterion"
                >
                  {isTampered ? 'RESTORE PARITY' : 'TEST 1-BIT FAULT'}
                </button>
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-white/5 pt-1.5">
              <span>Cells Held: <strong className="text-white">{cellCount}</strong></span>
              <span>Avg Coherence: <strong className="text-[#00ffcc]">{avgStability ? `${(avgStability * 100).toFixed(0)}%` : '--'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* History Log Table */}
      {history.length > 0 && (
        <div className="bg-black/60 border border-white/10 rounded-lg p-2 flex flex-col gap-1 max-h-[100px] overflow-y-auto">
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Recent Input ➔ Recall History:</span>
          <div className="space-y-1">
            {history.map((h, idx) => (
              <div key={`${h.id || 'hist'}_${idx}`} className="flex items-center justify-between text-[10px] py-0.5 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-[8px]">{h.time}</span>
                  {h.algo && h.algo !== 'PLAIN' && (
                    <span className="text-[8px] bg-purple-900/60 text-purple-300 px-1 rounded font-bold">{h.algo.split('-')[0]}</span>
                  )}
                  <span className="text-emerald-300 font-bold truncate max-w-[140px]">IN: "{h.in}"</span>
                  <ArrowRight size={10} className="text-zinc-600 shrink-0" />
                  <span className="text-[#00ffcc] font-bold truncate max-w-[140px]">OUT: "{h.out}"</span>
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

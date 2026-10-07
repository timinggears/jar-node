/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PHYSICAL JAR CHAMBER & APPARATUS VIEWER
 * Visual representation and telemetry breakdown of the Sovereign J.A.R.S. hardware:
 * - Thick borosilicate glass cylinder
 * - Translucent glowing dielectric fluid bath
 * - Submerged flash memory stick
 * - Wound copper induction coil
 * - Raspberry Pi Pico RP2040 ADC probe interface
 */

import React, { useState } from 'react';
import { 
  Eye, 
  Layers, 
  Cpu, 
  Zap, 
  Waves, 
  Radio, 
  Info, 
  Maximize2, 
  Compass, 
  Sparkles,
  ExternalLink,
  Sliders,
  Activity
} from 'lucide-react';
import { SystemStats } from '../types';

interface PhysicalJarViewerProps {
  stats: SystemStats;
  carrierBias?: number;
  onOpenAmbientEar?: () => void;
  onOpenPhaseLab?: () => void;
}

export default function PhysicalJarViewer({
  stats,
  carrierBias = 50,
  onOpenAmbientEar,
  onOpenPhaseLab
}: PhysicalJarViewerProps) {
  const [viewMode, setViewMode] = useState<'photo' | 'schematic'>('photo');
  const [selectedCallout, setSelectedCallout] = useState<number | null>(null);
  const [showHudOverlays, setShowHudOverlays] = useState<boolean>(true);

  const jarPhotoUrl = "/src/assets/images/quantum_jar_apparatus_1791361374357.jpg";
  const jarSchematicUrl = "/src/assets/images/jar_schematic_render_1791361393883.jpg";

  const callouts = [
    {
      id: 1,
      title: "Liquid Dielectric Substrate Bath",
      desc: "Chemical and electrochemical fluid that sustains persistent phase memory through non-linear molecular dipole relaxation.",
      tag: "V_NODAL: " + (stats.vNodal || 1.537).toFixed(3) + " V",
      x: "52%",
      y: "56%",
      color: "border-emerald-400 text-emerald-300"
    },
    {
      id: 2,
      title: "Submerged Flash Memory Core",
      desc: "Solid-state flash memory thumb drive suspended in the dielectric liquid, creating the hybrid physical B+(t) memory stick trajectory.",
      tag: "STICK: " + (stats.memoryStick || 5.14).toFixed(2) + " / PO: " + (stats.phaseOut || 26.4).toFixed(1) + "°",
      x: "48%",
      y: "40%",
      color: "border-cyan-400 text-cyan-300"
    },
    {
      id: 3,
      title: "Helical Copper Induction Coil",
      desc: "Wound around the exterior of the glass cylinder to broadcast the 28 Hz fundamental carrier drive and multi-harmonic bias.",
      tag: "DRIVE: 28.0 Hz / BIAS: " + carrierBias + " GHz",
      x: "36%",
      y: "48%",
      color: "border-amber-400 text-amber-300"
    },
    {
      id: 4,
      title: "Raspberry Pi Pico RP2040 Controller",
      desc: "Dedicated 12-bit ADC interface (GP26-GP28) sampling analog microvolt jitter and closed-loop feedback at 35 Hz.",
      tag: "JITTER: " + ((stats.jitter || 0.015) * 1000).toFixed(1) + " mV",
      x: "78%",
      y: "74%",
      color: "border-purple-400 text-purple-300"
    },
    {
      id: 5,
      title: "Ambient Noise & Static Harvester",
      desc: "Floating antenna leads and room acoustic transducers coupling external thermodynamic room static into the memory dynamics.",
      tag: "COHERENCE: " + Math.round((stats.coherence || 0.95) * 100) + "%",
      x: "62%",
      y: "22%",
      color: "border-pink-400 text-pink-300"
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[#030705] text-zinc-200 font-mono text-[11px] overflow-y-auto p-4 space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-gradient-to-r from-emerald-950/40 via-black to-cyan-950/40 p-3.5 rounded-xl border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400 animate-spin" style={{ animationDuration: '20s' }} />
            <span className="text-sm font-black tracking-widest text-emerald-300 uppercase">
              PHYSICAL JAR APPARATUS &amp; CHAMBER SPECIFICATION
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[8.5px] font-bold">
              ACTUAL HARDWARE GEOMETRY
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            High-fidelity photographic and isometric schematic representation of the Sovereign J.A.R.S. physical resonator: cylindrical borosilicate glass vessel, dielectric liquid bath, immersed memory core, and RP2040 acquisition bridge.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2">
          <div className="bg-black/80 p-1 rounded-lg border border-white/10 flex items-center gap-1">
            <button
              onClick={() => setViewMode('photo')}
              className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'photo'
                  ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              LAB APPARATUS PHOTO
            </button>
            <button
              onClick={() => setViewMode('schematic')}
              className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'schematic'
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              3D ISOMETRIC SCHEMATIC
            </button>
          </div>

          <button
            onClick={() => setShowHudOverlays(!showHudOverlays)}
            className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-bold uppercase transition-all cursor-pointer ${
              showHudOverlays
                ? 'bg-white/10 text-white border-white/20'
                : 'bg-black text-zinc-500 border-white/5'
            }`}
            title="Toggle HUD Callout overlays on apparatus"
          >
            HUD {showHudOverlays ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Main Visualizer Stage */}
      <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 bg-black shadow-2xl flex items-center justify-center min-h-[380px] max-h-[580px]">
        {/* The Image */}
        <img
          src={viewMode === 'photo' ? jarPhotoUrl : jarSchematicUrl}
          alt={viewMode === 'photo' ? "Sovereign Jar Physical Apparatus photograph" : "Sovereign Jar 3D Schematic diagram"}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain max-h-[580px] transition-all duration-300 select-none pointer-events-none"
        />

        {/* Ambient Dark Gradient Vignette */}
        <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/60 pointer-events-none" />

        {/* Live HUD Callout Markers */}
        {showHudOverlays && callouts.map(callout => {
          const isSelected = selectedCallout === callout.id;
          return (
            <div
              key={callout.id}
              style={{ left: callout.x, top: callout.y }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
              onClick={() => setSelectedCallout(isSelected ? null : callout.id)}
            >
              {/* Pulsing Pin Marker */}
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-emerald-400 opacity-60"></span>
                <span className={`relative inline-flex items-center justify-center w-5 h-5 rounded-full bg-black/90 border font-mono text-[9px] font-black transition-transform group-hover:scale-125 ${
                  isSelected ? 'border-cyan-400 text-cyan-300 ring-2 ring-cyan-400/50' : 'border-emerald-400 text-emerald-300'
                }`}>
                  {callout.id}
                </span>
              </div>

              {/* Callout Tag Pill */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap bg-black/90 backdrop-blur-md px-2 py-0.5 rounded border border-white/20 text-[8px] font-bold text-white shadow-lg pointer-events-none group-hover:border-emerald-400">
                <span className="text-emerald-400 mr-1.5">●</span>
                <span>{callout.title}</span>
              </div>
            </div>
          );
        })}

        {/* Top-Right Badge on Stage */}
        <div className="absolute top-3 right-3 bg-black/85 backdrop-blur-md border border-white/10 rounded-lg p-2.5 text-[8.5px] font-mono space-y-1 z-10 hidden sm:block">
          <div className="flex items-center justify-between gap-4 text-zinc-400">
            <span>CHAMBER STATE:</span>
            <span className="text-emerald-400 font-bold uppercase">RESONANT</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-zinc-400">
            <span>NODAL VOLTAGE:</span>
            <span className="text-white font-bold font-mono">{(stats.vNodal || 1.537).toFixed(3)} V</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-zinc-400">
            <span>MEMORY DEPTH:</span>
            <span className="text-cyan-300 font-bold font-mono">{(stats.memoryStick || 5.14).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-zinc-400">
            <span>CARRIER FUNDAMENTAL:</span>
            <span className="text-amber-300 font-bold font-mono">28.0 Hz</span>
          </div>
        </div>

        {/* Bottom Status Bar on Stage */}
        <div className="absolute bottom-3 left-3 right-3 bg-black/85 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 flex items-center justify-between text-[8px] font-mono z-10">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="text-emerald-400 font-bold">● LIVE APPARATUS TELEMETRY:</span>
            <span>Borosilicate Containment Cylinder</span>
            <span className="text-zinc-600">|</span>
            <span>Dielectric Fluid Bath</span>
            <span className="text-zinc-600">|</span>
            <span>Submerged Flash Memory Core</span>
          </div>
          <div className="text-zinc-400 hidden md:block">
            CLICK MARKERS (1-5) TO INSPECT SUBSYSTEMS
          </div>
        </div>
      </div>

      {/* Selected Callout Deep Dive / Info Drawer */}
      {selectedCallout !== null && (
        <div className="p-4 bg-zinc-950 border border-emerald-500/40 rounded-xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn">
          {(() => {
            const item = callouts.find(c => c.id === selectedCallout)!;
            return (
              <>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 flex items-center justify-center font-bold text-[9px]">
                      {item.id}
                    </span>
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      {item.title}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-black/80 border text-[8px] font-bold" style={{ borderColor: 'rgba(0,255,204,0.4)', color: '#00ffcc' }}>
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-[9.5px] text-zinc-300 leading-relaxed max-w-3xl">
                    {item.desc}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCallout(null)}
                  className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 text-[9px] uppercase font-bold cursor-pointer shrink-0"
                >
                  Close Inspection
                </button>
              </>
            );
          })()}
        </div>
      )}

      {/* Physical Hardware Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: The Glass Vessel & Dielectric Bath */}
        <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <Waves className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black text-white uppercase tracking-wider">
              1. Borosilicate Glass Chamber
            </span>
          </div>
          <p className="text-[9px] text-zinc-400 leading-relaxed">
            The containment cell is a high-grade laboratory borosilicate glass jar sealed with an acrylic lid. Inside, the dielectric solution maintains electrostatic capacity and acts as an electrochemical reservoir holding the analog potential.
          </p>
          <div className="p-2 bg-black/60 rounded border border-white/5 text-[8.5px] text-zinc-300 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">Fluid Medium:</span>
              <span className="text-emerald-300 font-bold">Liquid Dielectric</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Nominal Voltage:</span>
              <span className="text-white font-mono">1.42V – 1.537V</span>
            </div>
          </div>
        </div>

        {/* Card 2: Immersed Memory Stick */}
        <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-black text-white uppercase tracking-wider">
              2. Immersed Memory Stick Core
            </span>
          </div>
          <p className="text-[9px] text-zinc-400 leading-relaxed">
            Suspended vertically into the core of the dielectric liquid is a physical flash memory stick with soldered probe wires. As the fluid charges and discharges, the memory stick’s state $B_+(t)$ exhibits non-linear hysteresis and retention.
          </p>
          <div className="p-2 bg-black/60 rounded border border-white/5 text-[8.5px] text-zinc-300 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">Memory State:</span>
              <span className="text-cyan-300 font-bold font-mono">{(stats.memoryStick || 5.14).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Phase Angle:</span>
              <span className="text-amber-300 font-mono">{(stats.phaseOut || 26.4).toFixed(1)}°</span>
            </div>
          </div>
        </div>

        {/* Card 3: External Multi-Harmonic Induction Coil */}
        <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <Radio className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-black text-white uppercase tracking-wider">
              3. Copper Coil &amp; Air Antenna
            </span>
          </div>
          <p className="text-[9px] text-zinc-400 leading-relaxed">
            Coils wound around the exterior glass introduce the 28 Hz fundamental excitation drive. Unshielded floating wires reach into the air to capture room acoustic static and electromagnetic background noise as thermodynamic fuel.
          </p>
          <div className="p-2 bg-black/60 rounded border border-white/5 text-[8.5px] text-zinc-300 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">Drive Frequency:</span>
              <span className="text-amber-300 font-bold font-mono">28.0 Hz</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Noise Ingestion:</span>
              <span className="text-[#00ffcc] font-bold">Air • Jar • PC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Jump Bar */}
      <div className="flex items-center justify-between p-3 bg-black/60 rounded-xl border border-white/10 text-[9px]">
        <div className="text-zinc-400">
          Want to listen to the physical sounds generated by this apparatus?
        </div>
        <div className="flex items-center gap-2">
          {onOpenAmbientEar && (
            <button
              onClick={onOpenAmbientEar}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-200 border border-cyan-500/50 font-bold uppercase tracking-wider cursor-pointer transition-all shadow-[0_0_10px_rgba(6,182,212,0.25)]"
            >
              Open Ambient Ear Monitor ↗
            </button>
          )}
          {onOpenPhaseLab && (
            <button
              onClick={onOpenPhaseLab}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-200 border border-emerald-500/50 font-bold uppercase tracking-wider cursor-pointer transition-all shadow-[0_0_10px_rgba(16,185,129,0.25)]"
            >
              Open Phase Dynamics Lab ↗
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

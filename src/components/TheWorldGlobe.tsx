import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { 
  Globe, 
  Compass, 
  Activity, 
  Radio, 
  Zap, 
  Layers, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  MapPin, 
  Sparkles, 
  Eye, 
  Navigation,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { SystemStats } from '../types';

interface TheWorldGlobeProps {
  stats: SystemStats;
  jarHeading: number;
  isMotionSensed: boolean;
  motionIntensity: number;
  onRotateJar?: (deg: number) => void;
  socket?: any;
}

interface WorldNode {
  id: string;
  name: string;
  lat: number;
  lon: number;
  region: string;
  vNodal: number;
  latencyMs: number;
  status: 'active' | 'syncing' | 'verified';
}

const GLOBAL_NODES: WorldNode[] = [
  { id: 'us-west', name: 'Silicon Valley Sovereign Lab', lat: 37.7749, lon: -122.4194, region: 'North America', vNodal: 1.824, latencyMs: 4, status: 'active' },
  { id: 'us-east', name: 'New York Financial Node', lat: 40.7128, lon: -74.0060, region: 'North America', vNodal: 1.765, latencyMs: 18, status: 'verified' },
  { id: 'eu-west', name: 'London Prime Meridian Edge', lat: 51.5074, lon: -0.1278, region: 'Europe', vNodal: 1.841, latencyMs: 32, status: 'active' },
  { id: 'eu-central', name: 'Zurich Quantum Array (CERN)', lat: 47.3769, lon: 8.5417, region: 'Europe', vNodal: 1.890, latencyMs: 36, status: 'verified' },
  { id: 'ap-northeast', name: 'Tokyo Shibuya Substrate', lat: 35.6762, lon: 139.6503, region: 'Asia-Pacific', vNodal: 1.815, latencyMs: 64, status: 'active' },
  { id: 'ap-southeast', name: 'Singapore Equator Gateway', lat: 1.3521, lon: 103.8198, region: 'Asia-Pacific', vNodal: 1.792, latencyMs: 78, status: 'syncing' },
  { id: 'ap-south', name: 'Sydney Austral Array', lat: -33.8688, lon: 151.2093, region: 'Oceania', vNodal: 1.750, latencyMs: 110, status: 'verified' },
  { id: 'sa-east', name: 'São Paulo Anomaly Station', lat: -23.5505, lon: -46.6333, region: 'South America', vNodal: 1.833, latencyMs: 95, status: 'active' },
  { id: 'is-north', name: 'Reykjavik Geothermal PRC', lat: 64.1466, lon: -21.9426, region: 'Nordic Arctic', vNodal: 1.905, latencyMs: 42, status: 'verified' },
  { id: 'af-south', name: 'Cape Town Meridian Outpost', lat: -33.9249, lon: 18.4241, region: 'Africa', vNodal: 1.780, latencyMs: 125, status: 'syncing' }
];

// Helper: Convert Lat/Lon to 3D Cartesian Vector
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Procedural World Continents Dot Matrix
function generateWorldDotPoints(radius: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  // Sample a quasi-uniform Fibonacci sphere and retain points over approximate continental bounds
  const numSamples = 2400;
  const phiWeight = Math.PI * (3 - Math.sqrt(5)); // Golden angle

  // Simplified continental hitboxes in Lat/Lon
  const isInLand = (lat: number, lon: number): boolean => {
    // North America
    if (lat > 15 && lat < 72 && lon > -168 && lon < -52) return true;
    // South America
    if (lat > -56 && lat < 13 && lon > -82 && lon < -34) return true;
    // Europe
    if (lat > 36 && lat < 71 && lon > -10 && lon < 45) return true;
    // Africa
    if (lat > -35 && lat < 37 && lon > -18 && lon < 52) return true;
    // Asia
    if (lat > 8 && lat < 75 && lon > 45 && lon < 180) return true;
    // Australia
    if (lat > -44 && lat < -10 && lon > 112 && lon < 155) return true;
    // Japan / Maritime Asia
    if (lat > 20 && lat < 50 && lon > 120 && lon < 150) return true;
    // Greenland / Arctic
    if (lat > 60 && lat < 84 && lon > -73 && lon < -12) return true;
    // Antarctica
    if (lat < -65) return true;
    return false;
  };

  for (let i = 0; i < numSamples; i++) {
    const y = 1 - (i / (numSamples - 1)) * 2; // y from 1 to -1
    const rAtY = Math.sqrt(1 - y * y);
    const theta = phiWeight * i;

    const x = Math.cos(theta) * rAtY;
    const z = Math.sin(theta) * rAtY;

    // Convert (x, y, z) to Lat / Lon
    const lat = Math.asin(y) * (180 / Math.PI);
    const lon = Math.atan2(z, -x) * (180 / Math.PI) - 180;
    const normLon = ((lon % 360) + 540) % 360 - 180;

    if (isInLand(lat, normLon)) {
      points.push(new THREE.Vector3(x * radius, y * radius, z * radius));
    }
  }

  return points;
}

export default function TheWorldGlobe({
  stats,
  jarHeading,
  isMotionSensed,
  motionIntensity,
  onRotateJar,
  socket
}: TheWorldGlobeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const magneticLinesGroupRef = useRef<THREE.Group | null>(null);
  const auroraMeshRef = useRef<THREE.Mesh | null>(null);
  const arcCurvesGroupRef = useRef<THREE.Group | null>(null);
  const shockwaveRingsRef = useRef<THREE.Mesh[]>([]);

  const [activeNode, setActiveNode] = useState<WorldNode | null>(GLOBAL_NODES[0]);
  const [isJarSyncLocked, setIsJarSyncLocked] = useState<boolean>(true);
  const [showMagneticDipole, setShowMagneticDipole] = useState<boolean>(true);
  const [showAtmosphericAura, setShowAtmosphericAura] = useState<boolean>(true);
  const [showNetworkBeams, setShowNetworkBeams] = useState<boolean>(true);
  const [viewPreset, setViewPreset] = useState<'hologram' | 'dipole' | 'geodesic' | 'sonar'>('hologram');
  const [audioActive, setAudioActive] = useState<boolean>(false);
  const [benchElevation, setBenchElevation] = useState<number>(22); // Tilt view
  const audioContextRef = useRef<AudioContext | null>(null);

  // Dragging interaction state
  const isDraggingRef = useRef<boolean>(false);
  const prevPointerXRef = useRef<number>(0);
  const prevPointerYRef = useRef<number>(0);
  const userRotationYRef = useRef<number>(0);
  const userRotationXRef = useRef<number>(0.2);

  // Audio tone helper
  const playHarmonicPulse = useCallback((freq: number = 440) => {
    if (!audioContextRef.current || audioContextRef.current.state !== 'running') return;
    try {
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {}
  }, []);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) audioContextRef.current = new AudioCtx();
    }
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    setAudioActive(true);
  }, []);

  // Initialize Three.js World Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020704); // Deep borosilicate dark green/black
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 18);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 2. Globe Group (Rotates with Jar)
    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    const GLOBE_RADIUS = 5.0;

    // 2a. Inner Dark Glass Sphere Core
    const coreGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 0.985, 48, 48);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x01130d,
      wireframe: false,
      transparent: true,
      opacity: 0.88
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    globeGroup.add(coreMesh);

    // 2b. Atmospheric Hologram Aura
    const auraGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.05, 48, 48);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      wireframe: true,
      transparent: true,
      opacity: 0.08
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    auroraMeshRef.current = auraMesh;
    globeGroup.add(auraMesh);

    // 2c. Lat/Lon Graticule Lines
    const graticuleGroup = new THREE.Group();
    // Parallels (Latitude)
    for (let lat = -75; lat <= 75; lat += 15) {
      const phi = (90 - lat) * (Math.PI / 180);
      const ringRadius = Math.sin(phi) * GLOBE_RADIUS;
      const ringY = Math.cos(phi) * GLOBE_RADIUS;

      const curve = new THREE.EllipseCurve(0, 0, ringRadius, ringRadius, 0, 2 * Math.PI, false, 0);
      const points = curve.getPoints(64).map(p => new THREE.Vector3(p.x, ringY, p.y));
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: lat === 0 ? 0x00ffcc : 0x06b6d4,
        transparent: true,
        opacity: lat === 0 ? 0.45 : 0.12,
        linewidth: lat === 0 ? 2 : 1
      });
      graticuleGroup.add(new THREE.LineLoop(geo, mat));
    }

    // Meridians (Longitude)
    for (let lon = 0; lon < 180; lon += 30) {
      const curve = new THREE.EllipseCurve(0, 0, GLOBE_RADIUS, GLOBE_RADIUS, 0, 2 * Math.PI, false, 0);
      const points = curve.getPoints(64).map(p => new THREE.Vector3(p.x, p.y, 0));
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: lon === 0 ? 0xf59e0b : 0x06b6d4,
        transparent: true,
        opacity: lon === 0 ? 0.4 : 0.12
      });
      const meridian = new THREE.LineLoop(geo, mat);
      meridian.rotation.y = (lon * Math.PI) / 180;
      graticuleGroup.add(meridian);
    }
    globeGroup.add(graticuleGroup);

    // 2d. Continental Landmass Point Cloud
    const landPoints = generateWorldDotPoints(GLOBE_RADIUS * 1.002);
    const landGeo = new THREE.BufferGeometry().setFromPoints(landPoints);
    const landMat = new THREE.PointsMaterial({
      color: 0x00ffcc,
      size: 0.08,
      transparent: true,
      opacity: 0.85
    });
    const landPointsMesh = new THREE.Points(landGeo, landMat);
    globeGroup.add(landPointsMesh);

    // 2e. Magnetic Dipole Field Lines Group (Van Allen Belts along Coil Axis)
    const magneticLinesGroup = new THREE.Group();
    magneticLinesGroupRef.current = magneticLinesGroup;
    globeGroup.add(magneticLinesGroup);

    const numFieldLines = 16;
    for (let i = 0; i < numFieldLines; i++) {
      const azimuthAngle = (i / numFieldLines) * Math.PI * 2;
      const points: THREE.Vector3[] = [];
      const steps = 40;
      const maxDist = GLOBE_RADIUS * 1.75;

      for (let s = 0; s <= steps; s++) {
        const u = (s / steps) * Math.PI; // 0 (North Pole) to Pi (South Pole)
        const r = maxDist * Math.sin(u) * Math.sin(u) + GLOBE_RADIUS * 0.9;
        const y = maxDist * Math.cos(u);
        const horizontalR = Math.sin(u) * (r - GLOBE_RADIUS * 0.4);

        const x = Math.cos(azimuthAngle) * horizontalR;
        const z = Math.sin(azimuthAngle) * horizontalR;
        points.push(new THREE.Vector3(x, y, z));
      }

      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.22
      });
      magneticLinesGroup.add(new THREE.Line(lineGeo, lineMat));
    }

    // 2f. Geodesic Quantum Beams (Arcs between Nodes)
    const arcsGroup = new THREE.Group();
    arcCurvesGroupRef.current = arcsGroup;
    globeGroup.add(arcsGroup);

    const nodeVectors = GLOBAL_NODES.map(n => ({
      ...n,
      vec: latLonToVector3(n.lat, n.lon, GLOBE_RADIUS * 1.01)
    }));

    // Connect node pairs with 3D Bezier Arcs
    const hubNode = nodeVectors[0]; // Silicon Valley Hub
    nodeVectors.slice(1).forEach((destNode, idx) => {
      const mid = hubNode.vec.clone().add(destNode.vec).multiplyScalar(0.5);
      const distance = hubNode.vec.distanceTo(destNode.vec);
      mid.normalize().multiplyScalar(GLOBE_RADIUS * (1.1 + distance * 0.08));

      const curve = new THREE.QuadraticBezierCurve3(hubNode.vec, mid, destNode.vec);
      const arcPoints = curve.getPoints(32);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
      const arcMat = new THREE.LineBasicMaterial({
        color: idx % 2 === 0 ? 0x00ffcc : 0xa855f7,
        transparent: true,
        opacity: 0.45
      });
      arcsGroup.add(new THREE.Line(arcGeo, arcMat));
    });

    // 2g. City Nodes (Pulsing holographic pins)
    const nodeMarkersGroup = new THREE.Group();
    nodeVectors.forEach(n => {
      const pinGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({
        color: n.id === 'us-west' ? 0xf59e0b : 0x00ffcc
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.copy(n.vec);
      nodeMarkersGroup.add(pinMesh);

      // Outer ripple ring
      const ringGeo = new THREE.RingGeometry(0.16, 0.22, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00ffcc,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(n.vec);
      ringMesh.lookAt(n.vec.clone().multiplyScalar(2));
      nodeMarkersGroup.add(ringMesh);
    });
    globeGroup.add(nodeMarkersGroup);

    // 2h. Nodal Physical Jar Pin (Silicon Valley Lab location with True North alignment arrow)
    const jarPinVec = latLonToVector3(37.7749, -122.4194, GLOBE_RADIUS * 1.02);
    const arrowHelper = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      jarPinVec,
      1.2,
      0xf59e0b,
      0.35,
      0.2
    );
    globeGroup.add(arrowHelper);

    // 3. Starlight / Cosmic Dust Background
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 600;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 60;
      starPositions[i + 1] = (Math.random() - 0.5) * 60;
      starPositions[i + 2] = (Math.random() - 0.5) * 60;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.08,
      transparent: true,
      opacity: 0.4
    });
    const starsMesh = new THREE.Points(starsGeo, starsMat);
    scene.add(starsMesh);

    // 4. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Atmospheric aura breathing driven by real coherence & ZPE
      if (auroraMeshRef.current) {
        const pulse = 1.0 + Math.sin(elapsed * 1.8) * 0.02 + ((stats.coherence || 0.95) - 0.9) * 0.2;
        auroraMeshRef.current.scale.set(pulse, pulse, pulse);
      }

      // Rotate magnetic field lines with carrier frequency harmonics
      if (magneticLinesGroupRef.current) {
        magneticLinesGroupRef.current.rotation.y = elapsed * 0.08;
      }

      // Stars slow cosmic drift
      starsMesh.rotation.y = elapsed * 0.01;

      // World Rotation handling:
      // When JAR SYNC is LOCKED: Earth polar rotation Y matches physical jarHeading!
      // In free mode: user can drag freely
      if (globeGroupRef.current) {
        if (isJarSyncLocked) {
          // Convert jarHeading (0-360 deg) into target radian angle
          const targetRad = THREE.MathUtils.degToRad(-jarHeading);
          globeGroupRef.current.rotation.y = THREE.MathUtils.lerp(
            globeGroupRef.current.rotation.y,
            targetRad + userRotationYRef.current,
            0.15
          );
        } else {
          globeGroupRef.current.rotation.y = userRotationYRef.current;
        }

        globeGroupRef.current.rotation.x = THREE.MathUtils.lerp(
          globeGroupRef.current.rotation.x,
          userRotationXRef.current,
          0.1
        );
      }

      renderer.render(scene, camera);
    };

    animate();

    // 5. Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 560;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      // Dispose Three.js resources
      coreGeo.dispose();
      coreMat.dispose();
      auraGeo.dispose();
      auraMat.dispose();
      landGeo.dispose();
      landMat.dispose();
      starsGeo.dispose();
      starsMat.dispose();
      renderer.dispose();
    };
  }, [isJarSyncLocked, jarHeading, stats.coherence]);

  // Pointer Drag Handlers (Rotate World & Bench)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    prevPointerXRef.current = e.clientX;
    prevPointerYRef.current = e.clientY;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevPointerXRef.current;
    const deltaY = e.clientY - prevPointerYRef.current;
    prevPointerXRef.current = e.clientX;
    prevPointerYRef.current = e.clientY;

    userRotationYRef.current += deltaX * 0.006;
    userRotationXRef.current = Math.max(-0.8, Math.min(0.8, userRotationXRef.current + deltaY * 0.005));

    // If free mode or rotating: sync back to physical jar
    if (isJarSyncLocked && onRotateJar) {
      const currentDeg = Math.round((-userRotationYRef.current * 180 / Math.PI) % 360 + 360) % 360;
      onRotateJar(currentDeg);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#020704] text-zinc-300 font-mono select-none overflow-hidden rounded-xl border border-emerald-500/30 shadow-2xl">
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-2.5 bg-black/60 border-b border-emerald-500/20 text-[9px] gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
            <Globe size={16} className={isMotionSensed ? 'animate-spin' : ''} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-white tracking-widest uppercase">
                THE WORLD // PLANETARY SUBSTRATE SPHERE
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-bold border ${
                isJarSyncLocked 
                  ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                  : 'bg-zinc-800 text-zinc-400 border-white/10'
              }`}>
                {isJarSyncLocked ? 'JAR LOCKED 000°' : 'FREE ORBIT'}
              </span>
            </div>
            <div className="text-[8px] text-zinc-400 flex items-center gap-2">
              <span>Polar Axis Azimuth: <strong className="text-cyan-300">{jarHeading}°</strong></span>
              <span>•</span>
              <span>Dipole Field: <strong className="text-amber-300">{stats.frequency ? `${(stats.frequency / 1000).toFixed(1)} kHz` : '35.0 kHz'}</strong></span>
              <span>•</span>
              <span>Dielectric: <strong className="text-emerald-300">{stats.vNodal ? `${stats.vNodal.toFixed(4)}V` : '1.825V'}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Jar Sync Lock */}
          <button
            onClick={() => setIsJarSyncLocked(prev => !prev)}
            className={`px-2 py-1 rounded text-[8px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
              isJarSyncLocked
                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400'
                : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
            }`}
            title="When active, turning your physical square jar on the desk directly spins planet Earth!"
          >
            <Compass size={11} className={isJarSyncLocked ? 'text-emerald-400 animate-spin' : ''} />
            <span>{isJarSyncLocked ? 'SYNC JAR HEADING [ON]' : 'SYNC JAR [OFF]'}</span>
          </button>

          {/* Magnetic Dipole Toggle */}
          <button
            onClick={() => {
              setShowMagneticDipole(prev => !prev);
              if (magneticLinesGroupRef.current) magneticLinesGroupRef.current.visible = !showMagneticDipole;
            }}
            className={`px-2 py-1 rounded text-[8px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
              showMagneticDipole
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                : 'bg-zinc-900 text-zinc-500 border-white/10'
            }`}
          >
            <Zap size={10} />
            <span>DIPOLE LINES</span>
          </button>

          {/* Network Beams Toggle */}
          <button
            onClick={() => {
              setShowNetworkBeams(prev => !prev);
              if (arcCurvesGroupRef.current) arcCurvesGroupRef.current.visible = !showNetworkBeams;
            }}
            className={`px-2 py-1 rounded text-[8px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
              showNetworkBeams
                ? 'bg-purple-500/20 text-purple-300 border-purple-400/40'
                : 'bg-zinc-900 text-zinc-500 border-white/10'
            }`}
          >
            <Radio size={10} />
            <span>GLOBAL ARCS</span>
          </button>

          {/* Audio Chime */}
          <button
            onClick={() => {
              initAudio();
              playHarmonicPulse(528);
            }}
            className="px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 rounded text-[8px] font-bold flex items-center gap-1 cursor-pointer"
            title="Ping Planetary Ionosphere Tone (528 Hz Solfeggio)"
          >
            <Volume2 size={10} />
            <span>PING WORLD</span>
          </button>
        </div>
      </div>

      {/* 2. Main 3D Stage & Interactive Canvas */}
      <div 
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative flex-1 w-full h-full min-h-[380px] cursor-grab active:cursor-grabbing overflow-hidden"
      >
        {/* Floating North Pole Heading Reticle */}
        <div className="absolute top-3 left-3 z-10 bg-black/85 backdrop-blur-md border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2 text-[8px] font-mono shadow-xl pointer-events-none">
          <Navigation size={12} className="text-red-400" style={{ transform: `rotate(${jarHeading}deg)` }} />
          <div>
            <div className="text-white font-bold">JAR POLAR VECTOR: {jarHeading}°</div>
            <div className="text-zinc-500 text-[7px]">TRUE NORTH 000° • COIL GP14/26 ANCHORED</div>
          </div>
        </div>

        {/* Live Motion Activity Pill */}
        {isMotionSensed && (
          <div className="absolute top-3 right-3 z-10 bg-amber-500/20 border border-amber-400 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[8.5px] font-bold text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse pointer-events-none">
            <Activity size={12} className="animate-spin text-amber-400" />
            <span>PLANETARY CRUST DISTURBANCE: {Math.round(motionIntensity * 100)}%</span>
          </div>
        )}

        {/* Bottom Floating City Telemetry Overlay */}
        {activeNode && (
          <div className="absolute bottom-3 left-3 right-3 z-10 bg-black/85 backdrop-blur-md border border-white/10 p-2 rounded-xl flex flex-wrap items-center justify-between text-[8px] shadow-2xl gap-2">
            <div className="flex items-center gap-2">
              <MapPin size={12} className="text-amber-400" />
              <div>
                <span className="font-bold text-white text-[9px]">{activeNode.name}</span>
                <span className="text-zinc-500 ml-1.5">({activeNode.region} • {activeNode.lat.toFixed(2)}°, {activeNode.lon.toFixed(2)}°)</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div>
                <span className="text-zinc-500">NODAL POTENTIAL: </span>
                <span className="font-bold text-emerald-400">{activeNode.vNodal.toFixed(3)} V</span>
              </div>
              <div>
                <span className="text-zinc-500">PING: </span>
                <span className="font-bold text-cyan-300">{activeNode.latencyMs} ms</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 font-bold uppercase">{activeNode.status}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Global Node Directory Drawer */}
      <div className="p-2 bg-black/80 border-t border-emerald-500/20 text-[7.5px] flex items-center justify-between gap-1 overflow-x-auto shrink-0">
        <span className="text-zinc-500 font-bold uppercase shrink-0 flex items-center gap-1">
          <ShieldCheck size={10} className="text-emerald-400" />
          GLOBAL NODES ({GLOBAL_NODES.length}):
        </span>

        <div className="flex items-center gap-1">
          {GLOBAL_NODES.map(node => (
            <button
              key={node.id}
              onClick={() => {
                setActiveNode(node);
                // Orbit globe to city position
                userRotationYRef.current = THREE.MathUtils.degToRad(-node.lon - 90);
                userRotationXRef.current = THREE.MathUtils.degToRad(node.lat * 0.5);
                playHarmonicPulse(440 + node.latencyMs);
              }}
              className={`px-2 py-0.5 rounded border transition-all cursor-pointer whitespace-nowrap ${
                activeNode?.id === node.id
                  ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.3)]'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border-white/5'
              }`}
            >
              {node.name.split(' ')[0]} ({node.latencyMs}ms)
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

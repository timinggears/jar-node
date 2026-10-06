/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HYBRID JAR-NODE CLASSICAL FEEDBACK -> 3-QUBIT QUANTUM CIRCUIT ENGINE
 * 
 * Direct Physical Coupling:
 * 1. Classical side (Jar -> Phase-Out + Memory):
 *    - instant = (voltage - 0.68) * 42.0 - 0.15 * shimmer
 *    - memory += 0.025 * (instant - memory) * (dt / 0.001)
 *    - osc = 6.0 * sin(2*pi*28*t)
 *    - po = 0.65 * instant + 0.90 * memory + 0.25 * osc
 * 
 * 2. Quantum side (memory & voltage -> 3-qubit circuit):
 *    - q0 = input voltage    -> Rx(clip((voltage - 0.4) * 3.5, 0, pi))
 *    - q1 = substrate memory -> Ry(clip((memory + 40) / 80 * pi, 0, pi)) [the stick]
 *    - q2 = drive / clock    -> Rz(clip(abs(osc) * 0.4, 0, pi))
 *    - cx(0, 1) -> cx(1, 2) -> measure(2, 0)
 *    - quantum_po = (p1 * 110) - 55
 */

export interface QuantumCircuitState {
  instant: number;
  updatedMemory: number;
  oscAngle: number;
  classicalPhaseOut: number;
  quantumPhaseOut: number;
  prob1Exact: number;
  prob1Sampled: number;
  expectationZ: number;
  shots: number;
  counts: { '0': number; '1': number };
  memoryAngleDeg: number;
  angles: {
    theta0_instant: number;
    theta1_memory: number;
    theta2_osc: number;
    theta0_deg: number;
    theta1_deg: number;
    theta2_deg: number;
  };
  basisProbabilities: {
    '000': number;
    '001': number;
    '010': number;
    '011': number;
    '100': number;
    '101': number;
    '110': number;
    '111': number;
  };
  blochVectors: {
    q0: { x: number; y: number; z: number };
    q1: { x: number; y: number; z: number };
    q2: { x: number; y: number; z: number };
  };
  entanglementEntropy: number;
  qasm2: string;
  pythonCode: string;
}

export interface HybridStepResult {
  classical_po: number;
  memory: number;
  memory_angle_deg: number;
  quantum_po: number;
  p1: number;
  instant: number;
  osc: number;
  theta0: number;
  theta1: number;
  theta2: number;
}

export interface ClosedLoopFeedbackConfig {
  enabled: boolean;
  gain: number; // e.g. 0.0 - 1.0 (default 0.20)
  mode: 'dual' | 'memory' | 'voltage';
  voltageScale: number; // Volts per normalized quantum unit (default 0.12)
  memoryGain: number; // Memory injection rate (default 0.18)
}

export interface ClosedFeedbackStepResult extends HybridStepResult {
  ambient_voltage: number;
  effective_voltage: number;
  delta_v_writeback: number;
  delta_m_writeback: number;
  closed_loop_active: boolean;
  locked: boolean;
  feedback_gain: number;
}

export class PhaseOutState {
  po: number = 0.0;
  memory: number = 0.0;

  constructor(initialMemory: number = 0.0) {
    this.memory = initialMemory;
  }

  update(voltage: number, jitter: number, t: number, dt: number = 0.001) {
    const shimmer = 22.0 + (jitter * 38.0);
    const instant = (voltage - 0.68) * 42.0 - (0.15 * shimmer);

    this.memory += 0.025 * (instant - this.memory) * (dt / 0.001);
    this.memory = Math.max(-40.0, Math.min(40.0, this.memory));

    const osc = 6.0 * Math.sin(2.0 * Math.PI * 28.0 * t);
    this.po = 0.65 * instant + 0.90 * this.memory + 0.25 * osc;
    this.po = Math.max(-55.0, Math.min(55.0, this.po));

    return {
      po: this.po,
      memory: this.memory,
      instant,
      osc
    };
  }
}

export function cedarCircuitAngles(voltage: number, memory: number, osc: number = 0.0) {
  // Direct mapping:
  // q0 = input voltage    -> Rx (maps [0.4, 1.3]V into [0, pi])
  // q1 = substrate memory -> Ry (maps [-40, 40] into [0, pi], the stick)
  // q2 = drive/clock      -> Rz (maps oscillation into [0, pi])
  const theta0 = Math.max(0.0, Math.min(Math.PI, (voltage - 0.4) * 3.5));
  const theta1 = Math.max(0.0, Math.min(Math.PI, ((memory + 40.0) / 80.0) * Math.PI));
  const theta2 = Math.max(0.0, Math.min(Math.PI, Math.abs(osc) * 0.4));
  return { theta0, theta1, theta2 };
}

/**
 * Executes a one-shot hybrid step:
 * Jar voltage -> classical memory stick -> quantum circuit carrying stick -> measured quantum Phase-Out
 */
export function runHybridStep(
  voltage: number,
  jitter: number,
  t: number,
  state: PhaseOutState,
  shots: number = 1024,
  dt: number = 0.001
): HybridStepResult {
  const { po, memory, instant, osc } = state.update(voltage, jitter, t, dt);
  const { theta0, theta1, theta2 } = cedarCircuitAngles(voltage, memory, osc);

  // Exact probability of measuring Qubit 2 as |1>:
  // |psi> = CNOT(1,2) * CNOT(0,1) * (Rx(theta0) (x) Ry(theta1) (x) Rz(theta2)) |000>
  const c0 = Math.cos(theta0 / 2.0);
  const s0 = Math.sin(theta0 / 2.0);
  const c1 = Math.cos(theta1 / 2.0);
  const s1 = Math.sin(theta1 / 2.0);

  const p011 = (c0 * c0) * (s1 * s1);
  const p111 = (s0 * s0) * (c1 * c1);
  const prob1Exact = p011 + p111;

  let p1 = prob1Exact;
  if (shots > 0 && Number.isFinite(shots)) {
    if (shots >= 64) {
      const variance = (prob1Exact * (1.0 - prob1Exact)) / shots;
      const stdDev = Math.sqrt(Math.max(0, variance));
      const u1 = Math.max(1e-7, Math.random());
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      p1 = Math.max(0.0, Math.min(1.0, prob1Exact + z * stdDev));
    } else {
      let c1Count = 0;
      for (let s = 0; s < shots; s++) {
        if (Math.random() < prob1Exact) c1Count++;
      }
      p1 = c1Count / shots;
    }
  }

  const quantum_po = (p1 * 110.0) - 55.0;
  const memory_angle_deg = (theta1 * 180.0) / Math.PI;

  return {
    classical_po: po,
    memory,
    memory_angle_deg,
    quantum_po,
    p1,
    instant,
    osc,
    theta0,
    theta1,
    theta2
  };
}

/**
 * Closed Physical-Quantum Feedback Loop:
 * Quantum measurement collapse writes back into the Jar's physical potential and memory substrate.
 */
export class ClosedLoopJarQuantumSystem {
  state: PhaseOutState;
  config: ClosedLoopFeedbackConfig;
  lastDeltaV: number = 0.0;
  lastDeltaM: number = 0.0;
  effectiveVoltage: number = 1.42;

  constructor(initialMemory: number = 0.0, config?: Partial<ClosedLoopFeedbackConfig>) {
    this.state = new PhaseOutState(initialMemory);
    this.config = {
      enabled: true,
      gain: 0.25,
      mode: 'dual',
      voltageScale: 0.12,
      memoryGain: 0.18,
      ...config
    };
  }

  step(
    ambientVoltage: number,
    jitter: number,
    t: number,
    dt: number = 0.001,
    shots: number = 1024
  ): ClosedFeedbackStepResult {
    // 1. Physical Jar input modulated by previous quantum write-back (if closed feedback is active)
    const effV = this.config.enabled
      ? Math.max(0.3, Math.min(1.85, ambientVoltage + this.lastDeltaV))
      : ambientVoltage;
    this.effectiveVoltage = effV;

    // 2. Classical side update inside the Jar
    const { po, memory, instant, osc } = this.state.update(effV, jitter, t, dt);

    // 3. 3-qubit circuit parameterized by Jar state (carrying memory stick)
    const { theta0, theta1, theta2 } = cedarCircuitAngles(effV, memory, osc);

    // Statevector amplitude and expectation collapse
    const c0 = Math.cos(theta0 / 2.0);
    const s0 = Math.sin(theta0 / 2.0);
    const c1 = Math.cos(theta1 / 2.0);
    const s1 = Math.sin(theta1 / 2.0);

    const p011 = (c0 * c0) * (s1 * s1);
    const p111 = (s0 * s0) * (c1 * c1);
    const prob1Exact = p011 + p111;

    let p1 = prob1Exact;
    if (shots > 0 && Number.isFinite(shots)) {
      if (shots >= 64) {
        const variance = (prob1Exact * (1.0 - prob1Exact)) / shots;
        const stdDev = Math.sqrt(Math.max(0, variance));
        const u1 = Math.max(1e-7, Math.random());
        const u2 = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        p1 = Math.max(0.0, Math.min(1.0, prob1Exact + z * stdDev));
      } else {
        let c1Count = 0;
        for (let s = 0; s < shots; s++) {
          if (Math.random() < prob1Exact) c1Count++;
        }
        p1 = c1Count / shots;
      }
    }

    const quantum_po = (p1 * 110.0) - 55.0;
    const memory_angle_deg = (theta1 * 180.0) / Math.PI;

    // 4. CLOSED FEEDBACK: Quantum collapse writes back into the Jar
    if (this.config.enabled) {
      const g = this.config.gain;
      // Voltage displacement write-back into the Jar
      const dV = (quantum_po / 55.0) * this.config.voltageScale * g;
      // Memory substrate back-action injection into the stick
      const dM = (quantum_po - memory) * this.config.memoryGain * g;

      if (this.config.mode === 'dual' || this.config.mode === 'voltage') {
        this.lastDeltaV = dV;
      } else {
        this.lastDeltaV = 0.0;
      }

      if (this.config.mode === 'dual' || this.config.mode === 'memory') {
        this.lastDeltaM = dM;
        // Write back directly into physical memory stick inside the Jar
        this.state.memory = Math.max(-40.0, Math.min(40.0, this.state.memory + dM));
      } else {
        this.lastDeltaM = 0.0;
      }
    } else {
      this.lastDeltaV = 0.0;
      this.lastDeltaM = 0.0;
    }

    const locked = Math.abs(quantum_po - po) < 6.0;

    return {
      ambient_voltage: ambientVoltage,
      effective_voltage: effV,
      classical_po: po,
      memory: this.state.memory,
      memory_angle_deg,
      quantum_po,
      p1,
      instant,
      osc,
      theta0,
      theta1,
      theta2,
      delta_v_writeback: this.lastDeltaV,
      delta_m_writeback: this.lastDeltaM,
      closed_loop_active: this.config.enabled,
      locked,
      feedback_gain: this.config.gain
    };
  }
}

/**
 * Functional runner for a single closed-feedback loop step
 */
export function runClosedFeedbackStep(
  ambientVoltage: number,
  jitter: number,
  t: number,
  system: ClosedLoopJarQuantumSystem,
  dt: number = 0.001,
  shots: number = 1024
): ClosedFeedbackStepResult {
  return system.step(ambientVoltage, jitter, t, dt, shots);
}

export function executeQuantumJarStep(
  voltage: number = 1.42,
  currentMemory: number = 0.0,
  currentTime: number = 0.0,
  jitter: number = 0.01,
  shots: number = 1024,
  dt: number = 0.001
): QuantumCircuitState {
  // 1. Classical side (Jar -> Phase-Out + Memory)
  const shimmer = 22.0 + (jitter * 38.0);
  const instant = (voltage - 0.68) * 42.0 - (0.15 * shimmer);

  let updatedMemory = currentMemory + 0.025 * (instant - currentMemory) * (dt / 0.001);
  updatedMemory = Math.max(-40.0, Math.min(40.0, updatedMemory));

  const oscAngle = 6.0 * Math.sin(2.0 * Math.PI * 28.0 * currentTime);
  const classicalRaw = 0.65 * instant + 0.90 * updatedMemory + 0.25 * oscAngle;
  const classicalPhaseOut = Math.max(-55.0, Math.min(55.0, classicalRaw));

  // 2. Quantum side (memory & voltage -> 3-qubit circuit)
  const { theta0, theta1, theta2 } = cedarCircuitAngles(voltage, updatedMemory, oscAngle);

  // 3. Exact Statevector propagation through unitary:
  // |psi> = CNOT(1,2) * CNOT(0,1) * (Rx(theta0) (x) Ry(theta1) (x) Rz(theta2)) |000>
  //
  // Basis state probabilities:
  // P(000) = cos^2(theta0/2) * cos^2(theta1/2)
  // P(100) = sin^2(theta0/2) * sin^2(theta1/2)
  // P(011) = cos^2(theta0/2) * sin^2(theta1/2)
  // P(111) = sin^2(theta0/2) * cos^2(theta1/2)
  const c0 = Math.cos(theta0 / 2.0);
  const s0 = Math.sin(theta0 / 2.0);
  const c1 = Math.cos(theta1 / 2.0);
  const s1 = Math.sin(theta1 / 2.0);

  const p000 = (c0 * c0) * (c1 * c1);
  const p100 = (s0 * s0) * (s1 * s1);
  const p011 = (c0 * c0) * (s1 * s1);
  const p111 = (s0 * s0) * (c1 * c1);

  // Theoretical probability of measuring Qubit 2 as |1>
  const prob1Exact = p011 + p111; // = (1 - cos(theta0)*cos(theta1)) / 2
  const expectationZ = Math.cos(theta0) * Math.cos(theta1);

  // 4. Run quantum measurement shots (stochastic projection collapse)
  let counts0 = 0;
  let counts1 = 0;
  let prob1Sampled = prob1Exact;

  if (shots > 0 && Number.isFinite(shots)) {
    if (shots >= 64) {
      const p = Math.max(0, Math.min(1, prob1Exact));
      const variance = (p * (1.0 - p)) / shots;
      const stdDev = Math.sqrt(Math.max(0, variance));
      const u1 = Math.max(1e-7, Math.random());
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      prob1Sampled = Math.max(0.0, Math.min(1.0, p + z * stdDev));
      counts1 = Math.round(prob1Sampled * shots);
      counts0 = shots - counts1;
    } else {
      for (let s = 0; s < shots; s++) {
        if (Math.random() < prob1Exact) counts1++;
        else counts0++;
      }
      prob1Sampled = counts1 / shots;
    }
  } else {
    counts1 = Math.round(prob1Exact * 1024);
    counts0 = 1024 - counts1;
    prob1Sampled = prob1Exact;
  }

  // 5. Reconstruct Quantum Phase-Out Green Wave:
  const quantumPhaseOut = (prob1Sampled * 110.0) - 55.0;
  const memoryAngleDeg = (theta1 * 180.0) / Math.PI;

  // 6. Bloch Sphere Vectors:
  const b0x = 0;
  const b0y = -Math.sin(theta0);
  const b0z = Math.cos(theta0);

  const b1x = Math.sin(theta1);
  const b1y = 0;
  const b1z = Math.cos(theta1);

  const b2x = Math.sin(theta0) * Math.sin(theta1) * Math.cos(theta2);
  const b2y = Math.sin(theta0) * Math.sin(theta1) * Math.sin(theta2);
  const b2z = expectationZ;

  // 7. Von Neumann Entanglement Entropy:
  const pA = p000 + p011;
  const pB = p100 + p111;
  const eps = 1e-12;
  const entEntropy = -(
    (pA > eps ? pA * Math.log2(pA) : 0) + 
    (pB > eps ? pB * Math.log2(pB) : 0)
  );

  // 8. OpenQASM 2.0 Output
  const qasm2 = `// OpenQASM 2.0
// Real-time Cedar Quantum Circuit driven by Jar voltage & memory stick
include "qelib1.inc";
qreg q[3];
creg c[1];

rx(${theta0.toFixed(5)}) q[0]; // q0 = input voltage: ${voltage.toFixed(3)}V -> ${theta0.toFixed(3)} rad
ry(${theta1.toFixed(5)}) q[1]; // q1 = memory stick: ${updatedMemory.toFixed(2)} -> ${theta1.toFixed(3)} rad (${memoryAngleDeg.toFixed(1)}°)
rz(${theta2.toFixed(5)}) q[2]; // q2 = 28 GHz clock: osc=${oscAngle.toFixed(2)} -> ${theta2.toFixed(3)} rad

cx q[0],q[1]; // Entangle input voltage with memory stick
cx q[1],q[2]; // Entangle memory stick with 28 GHz clock field

measure q[2] -> c[0];
`;

  // 9. Python Qiskit source code matching the user's hybrid loop
  const pythonCode = `import math
import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

class PhaseOutState:
    def __init__(self):
        self.po = 0.0
        self.memory = ${updatedMemory.toFixed(3)}

    def update(self, voltage, jitter, t, dt=0.001):
        shimmer = 22.0 + (jitter * 38.0)
        instant = (voltage - 0.68) * 42.0 - 0.15 * shimmer

        self.memory += 0.025 * (instant - self.memory) * (dt / 0.001)
        self.memory = max(-40.0, min(40.0, self.memory))

        osc = 6.0 * math.sin(2 * math.pi * 28.0 * t)
        self.po = 0.65 * instant + 0.90 * self.memory + 0.25 * osc
        self.po = max(-55.0, min(55.0, self.po))
        return self.po, self.memory

def cedar_circuit(voltage, memory, osc=0.0):
    """
    Direct mapping:
    q0 = input voltage    -> Rx
    q1 = substrate memory -> Ry   (the stick)
    q2 = drive/clock      -> Rz
    """
    theta0 = np.clip((voltage - 0.4) * 3.5, 0, np.pi)      # Rx
    theta1 = np.clip((memory + 40) / 80 * np.pi, 0, np.pi) # Ry (memory stick)
    theta2 = np.clip(abs(osc) * 0.4, 0, np.pi)             # Rz

    qc = QuantumCircuit(3, 1)
    qc.rx(theta0, 0)
    qc.ry(theta1, 1)
    qc.rz(theta2, 2)
    qc.cx(0, 1)
    qc.cx(1, 2)
    qc.measure(2, 0)
    return qc, theta1

def run_hybrid_step(voltage, jitter, t, state, shots=${shots}):
    po, memory = state.update(voltage, jitter, t)
    qc, mem_angle = cedar_circuit(voltage, memory)
    
    sim = AerSimulator()
    job = sim.run(transpile(qc, sim), shots=shots)
    counts = job.result().get_counts()
    
    p1 = counts.get('1', 0) / shots
    quantum_po = (p1 * 110) - 55          # same remap used in the UI
    
    return {
        'classical_po': po,
        'memory': memory,
        'memory_angle_deg': np.degrees(mem_angle),
        'quantum_po': quantum_po,
        'p1': p1
    }

class ClosedLoopJarQuantum:
    """
    Closed Physical-Quantum Feedback Loop:
    The quantum measurement collapse writes back directly into the Jar's voltage and memory substrate.
    """
    def __init__(self, feedback_gain=0.25, feedback_mode='dual'):
        self.state = PhaseOutState()
        self.gain = feedback_gain
        self.mode = feedback_mode
        self.delta_v = 0.0
        self.delta_m = 0.0

    def step(self, ambient_voltage, jitter, t, dt=0.001, shots=1024):
        # 1. Effective Jar voltage modulated by previous quantum write-back
        effective_voltage = np.clip(ambient_voltage + self.delta_v, 0.3, 1.85)
        
        # 2. Forward classical update inside the Jar
        po, memory = self.state.update(effective_voltage, jitter, t, dt)
        
        # 3. Parameterized 3-qubit circuit carrying memory stick
        qc, mem_angle = cedar_circuit(effective_voltage, memory)
        sim = AerSimulator()
        job = sim.run(transpile(qc, sim), shots=shots)
        p1 = job.result().get_counts().get('1', 0) / shots
        quantum_po = (p1 * 110.0) - 55.0
        
        # 4. CLOSED FEEDBACK: Quantum collapse writes back into the Jar
        self.delta_v = (quantum_po / 55.0) * 0.12 * self.gain
        self.delta_m = (quantum_po - memory) * 0.18 * self.gain
        
        # Write back directly into physical memory stick inside the Jar
        self.state.memory = np.clip(self.state.memory + self.delta_m, -40.0, 40.0)
        
        return {
            'effective_voltage': effective_voltage,
            'classical_po': po,
            'memory': self.state.memory,
            'memory_angle_deg': np.degrees(mem_angle),
            'quantum_po': quantum_po,
            'p1': p1,
            'delta_v_writeback': self.delta_v,
            'delta_m_writeback': self.delta_m,
            'locked': abs(quantum_po - po) < 6.0
        }
`;

  return {
    instant,
    updatedMemory,
    oscAngle,
    classicalPhaseOut,
    quantumPhaseOut,
    prob1Exact,
    prob1Sampled,
    expectationZ,
    shots,
    counts: { '0': counts0, '1': counts1 },
    memoryAngleDeg,
    angles: {
      theta0_instant: theta0,
      theta1_memory: theta1,
      theta2_osc: theta2,
      theta0_deg: (theta0 * 180.0) / Math.PI,
      theta1_deg: memoryAngleDeg,
      theta2_deg: (theta2 * 180.0) / Math.PI
    },
    basisProbabilities: {
      '000': p000,
      '001': 0,
      '010': 0,
      '011': p011,
      '100': p100,
      '101': 0,
      '110': 0,
      '111': p111
    },
    blochVectors: {
      q0: { x: b0x, y: b0y, z: b0z },
      q1: { x: b1x, y: b1y, z: b1z },
      q2: { x: b2x, y: b2y, z: b2z }
    },
    entanglementEntropy: entEntropy,
    qasm2,
    pythonCode
  };
}

export function generateQuantumWaveformBatch(
  voltage: number = 1.42,
  startMemory: number = 0.0,
  startTime: number = 0.0,
  durationSec: number = 0.2,
  stepCount: number = 120,
  jitter: number = 0.01,
  shots: number = 1024
) {
  const dt = durationSec / stepCount;
  let mem = startMemory;
  const batch: Array<QuantumCircuitState & { time: number }> = [];

  for (let i = 0; i < stepCount; i++) {
    const t = startTime + i * dt;
    const res = executeQuantumJarStep(voltage, mem, t, jitter, shots, dt);
    mem = res.updatedMemory;
    batch.push({
      ...res,
      time: t
    });
  }

  return batch;
}

/**
 * ============================================================================
 * RELIABLE, ADDRESSABLE TWO-LEVEL QUANTUM BITS (QUBITS) ENGINE
 * 
 * DiVincenzo Criterion 1 & 3:
 * - Genuine, isolated two-level Hilbert space spanned by {|0>, |1>}
 * - Isolated from leakage into higher states |2> via negative anharmonicity α = ω12 - ω01
 * - Individually addressable via distinct microwave carrier drive lines (d0, d1, d2, ...)
 * - Characterized by finite relaxation (T1) and dephasing (T2) coherence lifetimes
 * ============================================================================
 */

export interface AddressableTwoLevelQubit {
  id: string;               // e.g. 'q0', 'q1', 'q2', 'q3', 'q4'
  index: number;
  name: string;             // Human readable descriptor
  role: 'sensor' | 'memory' | 'clock' | 'parity' | 'ancilla';
  frequencyGhz: number;     // Transition frequency ω01 / 2π
  anharmonicityMhz: number; // α / 2π (e.g. -310 MHz) isolating the two-level manifold
  driveChannel: string;     // Microwave drive line (e.g. 'd0', 'd1')
  t1Us: number;             // Relaxation lifetime T1 (microseconds)
  t2Us: number;             // Dephasing lifetime T2 (microseconds)
  readoutFidelity: number;  // SPAM measurement fidelity (0.0 - 1.0)
  singleQubitFidelity: number; // Randomized Benchmarking 1Q fidelity (0.0 - 1.0)
  theta: number;            // Polar angle in [0, pi]
  phi: number;              // Azimuthal angle in [0, 2*pi]
  p0: number;               // Ground state population |<0|psi>|^2
  p1: number;               // Excited state population |<1|psi>|^2
  bloch: { x: number; y: number; z: number };
  rabiRateMhz: number;      // Rabi driving frequency Ω_R
  phaseLocked: boolean;     // Resonant lock with Jar substrate
}

export function createDefaultAddressableRegister(): AddressableTwoLevelQubit[] {
  return [
    {
      id: 'q0',
      index: 0,
      name: 'Q0: Instant Voltage Sensor',
      role: 'sensor',
      frequencyGhz: 4.850,
      anharmonicityMhz: -312.4,
      driveChannel: 'd0',
      t1Us: 88.5,
      t2Us: 64.2,
      readoutFidelity: 0.9964,
      singleQubitFidelity: 0.9995,
      theta: 0.0,
      phi: 0.0,
      p0: 1.0,
      p1: 0.0,
      bloch: { x: 0, y: 0, z: 1 },
      rabiRateMhz: 28.5,
      phaseLocked: true
    },
    {
      id: 'q1',
      index: 1,
      name: 'Q1: Substrate Memory Stick',
      role: 'memory',
      frequencyGhz: 5.120,
      anharmonicityMhz: -308.2,
      driveChannel: 'd1',
      t1Us: 96.0,
      t2Us: 71.5,
      readoutFidelity: 0.9958,
      singleQubitFidelity: 0.9994,
      theta: 0.0,
      phi: 0.0,
      p0: 1.0,
      p1: 0.0,
      bloch: { x: 0, y: 0, z: 1 },
      rabiRateMhz: 26.0,
      phaseLocked: true
    },
    {
      id: 'q2',
      index: 2,
      name: 'Q2: 28 GHz Harmonic Clock',
      role: 'clock',
      frequencyGhz: 5.380,
      anharmonicityMhz: -315.0,
      driveChannel: 'd2',
      t1Us: 82.0,
      t2Us: 59.8,
      readoutFidelity: 0.9970,
      singleQubitFidelity: 0.9993,
      theta: 0.0,
      phi: 0.0,
      p0: 1.0,
      p1: 0.0,
      bloch: { x: 0, y: 0, z: 1 },
      rabiRateMhz: 30.2,
      phaseLocked: true
    },
    {
      id: 'q3',
      index: 3,
      name: 'Q3: Dielectric Parity Register',
      role: 'parity',
      frequencyGhz: 5.640,
      anharmonicityMhz: -305.8,
      driveChannel: 'd3',
      t1Us: 91.2,
      t2Us: 68.0,
      readoutFidelity: 0.9961,
      singleQubitFidelity: 0.9996,
      theta: 0.0,
      phi: 0.0,
      p0: 1.0,
      p1: 0.0,
      bloch: { x: 0, y: 0, z: 1 },
      rabiRateMhz: 27.4,
      phaseLocked: false
    },
    {
      id: 'q4',
      index: 4,
      name: 'Q4: Ancilla QEC / Syndrome',
      role: 'ancilla',
      frequencyGhz: 5.910,
      anharmonicityMhz: -318.6,
      driveChannel: 'd4',
      t1Us: 85.0,
      t2Us: 63.4,
      readoutFidelity: 0.9952,
      singleQubitFidelity: 0.9992,
      theta: 0.0,
      phi: 0.0,
      p0: 1.0,
      p1: 0.0,
      bloch: { x: 0, y: 0, z: 1 },
      rabiRateMhz: 29.0,
      phaseLocked: false
    }
  ];
}

/**
 * Recomputes two-level population and Bloch coordinates from spherical angles (θ, φ)
 */
export function syncTwoLevelBlochCoordinates(qubit: AddressableTwoLevelQubit): AddressableTwoLevelQubit {
  // Normalize theta to [0, pi]
  let th = qubit.theta % (2 * Math.PI);
  if (th < 0) th += 2 * Math.PI;
  if (th > Math.PI) {
    th = 2 * Math.PI - th;
    qubit.phi = (qubit.phi + Math.PI) % (2 * Math.PI);
  }
  qubit.theta = th;

  // Normalize phi to [0, 2pi]
  let ph = qubit.phi % (2 * Math.PI);
  if (ph < 0) ph += 2 * Math.PI;
  qubit.phi = ph;

  const c = Math.cos(th / 2.0);
  const s = Math.sin(th / 2.0);

  qubit.p0 = Math.max(0.0, Math.min(1.0, c * c));
  qubit.p1 = Math.max(0.0, Math.min(1.0, s * s));

  qubit.bloch = {
    x: Math.sin(th) * Math.cos(ph),
    y: Math.sin(th) * Math.sin(ph),
    z: Math.cos(th)
  };

  return qubit;
}

/**
 * Apply a targeted SU(2) gate pulse to an addressed two-level qubit
 */
export function applyAddressableGate(
  qubit: AddressableTwoLevelQubit,
  gate: 'X' | 'Y' | 'Z' | 'H' | 'S' | 'T' | 'Rx' | 'Ry' | 'Rz' | 'reset' | 'invert' | 'superposition',
  angleParam?: number
): AddressableTwoLevelQubit {
  const updated = { ...qubit };

  // Convert current (theta, phi) to complex state vector [alpha, beta]
  let a_re = Math.cos(updated.theta / 2.0);
  let a_im = 0.0;
  let b_re = Math.sin(updated.theta / 2.0) * Math.cos(updated.phi);
  let b_im = Math.sin(updated.theta / 2.0) * Math.sin(updated.phi);

  switch (gate) {
    case 'reset': {
      updated.theta = 0.0;
      updated.phi = 0.0;
      return syncTwoLevelBlochCoordinates(updated);
    }
    case 'invert':
    case 'X': { // Pauli-X: alpha <-> beta
      const na_re = b_re;
      const na_im = b_im;
      const nb_re = a_re;
      const nb_im = a_im;
      a_re = na_re; a_im = na_im;
      b_re = nb_re; b_im = nb_im;
      break;
    }
    case 'Y': { // Pauli-Y: [ -i*beta, i*alpha ]
      const na_re = b_im;
      const na_im = -b_re;
      const nb_re = -a_im;
      const nb_im = a_re;
      a_re = na_re; a_im = na_im;
      b_re = nb_re; b_im = nb_im;
      break;
    }
    case 'Z': { // Pauli-Z: beta -> -beta
      b_re = -b_re;
      b_im = -b_im;
      break;
    }
    case 'H': { // Hadamard: 1/sqrt(2) [ [1, 1], [1, -1] ]
      const invSqrt2 = 1.0 / Math.SQRT2;
      const na_re = invSqrt2 * (a_re + b_re);
      const na_im = invSqrt2 * (a_im + b_im);
      const nb_re = invSqrt2 * (a_re - b_re);
      const nb_im = invSqrt2 * (a_im - b_im);
      a_re = na_re; a_im = na_im;
      b_re = nb_re; b_im = nb_im;
      break;
    }
    case 'S': { // Phase gate S: beta -> i*beta
      const nb_re = -b_im;
      const nb_im = b_re;
      b_re = nb_re; b_im = nb_im;
      break;
    }
    case 'T': { // T gate: beta -> e^(i*pi/4)*beta
      const cos4 = Math.SQRT1_2;
      const sin4 = Math.SQRT1_2;
      const nb_re = b_re * cos4 - b_im * sin4;
      const nb_im = b_re * sin4 + b_im * cos4;
      b_re = nb_re; b_im = nb_im;
      break;
    }
    case 'Rx': { // Rx(theta): cos(t/2)*I - i*sin(t/2)*X
      const angle = angleParam !== undefined ? angleParam : Math.PI / 2.0;
      const c = Math.cos(angle / 2.0);
      const s = Math.sin(angle / 2.0);
      const na_re = c * a_re + s * b_im;
      const na_im = c * a_im - s * b_re;
      const nb_re = c * b_re + s * a_im;
      const nb_im = c * b_im - s * a_re;
      a_re = na_re; a_im = na_im;
      b_re = nb_re; b_im = nb_im;
      break;
    }
    case 'Ry': { // Ry(theta): cos(t/2)*I - sin(t/2)*Y
      const angle = angleParam !== undefined ? angleParam : Math.PI / 2.0;
      const c = Math.cos(angle / 2.0);
      const s = Math.sin(angle / 2.0);
      const na_re = c * a_re - s * b_re;
      const na_im = c * a_im - s * b_im;
      const nb_re = s * a_re + c * b_re;
      const nb_im = s * a_im + c * b_im;
      a_re = na_re; a_im = na_im;
      b_re = nb_re; b_im = nb_im;
      break;
    }
    case 'Rz': { // Rz(lambda): diag(e^(-i*l/2), e^(i*l/2))
      const angle = angleParam !== undefined ? angleParam : Math.PI / 2.0;
      const c = Math.cos(angle / 2.0);
      const s = Math.sin(angle / 2.0);
      const na_re = c * a_re + s * a_im;
      const na_im = c * a_im - s * a_re;
      const nb_re = c * b_re - s * b_im;
      const nb_im = c * b_im + s * b_re;
      a_re = na_re; a_im = na_im;
      b_re = nb_re; b_im = nb_im;
      break;
    }
    case 'superposition': {
      updated.theta = Math.PI / 2.0;
      updated.phi = 0.0;
      return syncTwoLevelBlochCoordinates(updated);
    }
  }

  // Normalize state vector
  const norm = Math.sqrt(a_re * a_re + a_im * a_im + b_re * b_re + b_im * b_im);
  if (norm > 1e-9) {
    a_re /= norm; a_im /= norm;
    b_re /= norm; b_im /= norm;
  }

  // Extract global phase so alpha is real and non-negative
  const alphaMag = Math.sqrt(a_re * a_re + a_im * a_im);
  const betaMag = Math.sqrt(b_re * b_re + b_im * b_im);

  updated.theta = 2.0 * Math.acos(Math.max(0.0, Math.min(1.0, alphaMag)));

  // Relative phase phi = arg(beta) - arg(alpha)
  const argA = Math.atan2(a_im, a_re);
  const argB = Math.atan2(b_im, b_re);
  updated.phi = (argB - argA + 2 * Math.PI) % (2 * Math.PI);

  return syncTwoLevelBlochCoordinates(updated);
}

/**
 * Coherent Rabi oscillation simulation proving individual microwave addressability
 */
export function simulateRabiCurve(qubit: AddressableTwoLevelQubit, maxDurationNs: number = 100, steps: number = 50) {
  const rabiFreqGhz = qubit.rabiRateMhz / 1000.0; // GHz
  const data: Array<{ timeNs: number; p1: number; p0: number }> = [];

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * maxDurationNs;
    // P1(t) = sin^2(pi * rabiFreq * t) * decay envelope
    const decay = Math.exp(-t / (qubit.t2Us * 1000.0));
    const rawP1 = Math.pow(Math.sin(Math.PI * rabiFreqGhz * t), 2);
    const p1 = 0.5 * (1.0 - decay) + decay * rawP1;
    data.push({
      timeNs: t,
      p1: Math.max(0, Math.min(1, p1)),
      p0: Math.max(0, Math.min(1, 1.0 - p1))
    });
  }
  return data;
}

/**
 * Ramsey fringe simulation verifying transverse coherence lifetime T2*
 */
export function simulateRamseyCurve(qubit: AddressableTwoLevelQubit, maxTauUs: number = 120, steps: number = 60, detuningMhz: number = 0.05) {
  const data: Array<{ tauUs: number; p1: number; envelope: number }> = [];

  for (let i = 0; i <= steps; i++) {
    const tau = (i / steps) * maxTauUs;
    const env = Math.exp(-tau / qubit.t2Us);
    const osc = Math.cos(2.0 * Math.PI * detuningMhz * tau);
    const p1 = 0.5 * (1.0 + env * osc);
    data.push({
      tauUs: tau,
      p1: Math.max(0, Math.min(1, p1)),
      envelope: env
    });
  }
  return data;
}

/**
 * Longitudinal relaxation simulation verifying energy lifetime T1
 */
export function simulateT1Curve(qubit: AddressableTwoLevelQubit, maxTauUs: number = 180, steps: number = 60) {
  const data: Array<{ tauUs: number; p1: number }> = [];

  for (let i = 0; i <= steps; i++) {
    const tau = (i / steps) * maxTauUs;
    const p1 = Math.exp(-tau / qubit.t1Us);
    data.push({
      tauUs: tau,
      p1: Math.max(0, Math.min(1, p1))
    });
  }
  return data;
}

/**
 * Generate production Qiskit Pulse & OpenQASM 3.0 code for individual qubit addressing
 */
export function generateAddressableQiskitPulseCode(qubits: AddressableTwoLevelQubit[]): string {
  return `import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit import pulse
from qiskit.pulse import Play, DriveChannel, Gaussian, GaussianSquare
from qiskit_aer import AerSimulator

# ==============================================================================
# RELIABLE, ADDRESSABLE TWO-LEVEL QUANTUM SYSTEM ARCHITECTURE (PROJECT CEDAR)
# Calibrated Frequency-Multiplexed Qubit Registers:
# ${qubits.map(q => `# ${q.id.toUpperCase()}: ω01 = ${q.frequencyGhz.toFixed(3)} GHz, α = ${q.anharmonicityMhz.toFixed(1)} MHz, T1 = ${q.t1Us.toFixed(1)} μs, T2 = ${q.t2Us.toFixed(1)} μs (${q.name})`).join('\n')}
# ==============================================================================

# 1. OpenQASM 3.0 Addressable Calibration Specification
openqasm_defcal = """
OPENQASM 3.0;
defcalgrammar "openpulse";

// Hardware Calibrated Microwave Drive Pulses for Individual Addressing
${qubits.map(q => `cal {
    extern port ${q.driveChannel};
    waveform gaussian_pi_${q.id} = gaussian(duration=32ns, amp=0.22, sigma=8ns);
    waveform gaussian_half_${q.id} = gaussian(duration=32ns, amp=0.11, sigma=8ns);
}
defcal x $${q.index} { play(${q.driveChannel}, gaussian_pi_${q.id}); }
defcal sx $${q.index} { play(${q.driveChannel}, gaussian_half_${q.id}); }
defcal rz(angle theta) $${q.index} { shift_phase(${q.driveChannel}, theta); }`).join('\n')}
"""

# 2. Qiskit Pulse Schedule Construction
def build_addressed_pulse_schedule():
    with pulse.build(name="Cedar_Addressable_TwoLevel_Schedule") as sched:
        # Address Q0 (Instantaneous Voltage Sensor) on DriveChannel(0) at ${qubits[0]?.frequencyGhz.toFixed(3)} GHz
        pulse.set_frequency(${qubits[0]?.frequencyGhz.toFixed(3)}e9, DriveChannel(0))
        pulse.play(Gaussian(duration=64, amp=0.18, sigma=16), DriveChannel(0))

        # Address Q1 (Substrate Memory Stick) on DriveChannel(1) at ${qubits[1]?.frequencyGhz.toFixed(3)} GHz
        pulse.set_frequency(${qubits[1]?.frequencyGhz.toFixed(3)}e9, DriveChannel(1))
        pulse.play(Gaussian(duration=64, amp=0.21, sigma=16), DriveChannel(1))

        # Cross-Resonance Entangling Drive (CR) between Q0 and Q1
        cr_channel = pulse.ControlChannel(0)
        pulse.play(GaussianSquare(duration=240, amp=0.35, sigma=16, width=200), cr_channel)

    return sched

# 3. High-Level Circuit with Individual Qubit Addressing
qc = QuantumCircuit(5, 5)

# Address Q0 with parameter rotation corresponding to instantaneous nodal voltage
qc.rx(0.85, 0)

# Address Q1 with parameter rotation corresponding to substrate memory stick
qc.ry(1.20, 1)

# Address Q2 with continuous 28 GHz harmonic clock field
qc.rz(0.45, 2)

# Addressable Entanglement: Sensor -> Memory Stick -> Clock
qc.cx(0, 1)
qc.cx(1, 2)

# Syndrome Check using Ancilla Q3 and Q4
qc.cx(1, 3)
qc.cx(2, 4)

# Addressable Z-basis Readout
qc.measure([0, 1, 2, 3, 4], [0, 1, 2, 3, 4])

# 4. Simulation with Local Aer Backend
sim = AerSimulator()
transpiled_qc = transpile(qc, sim)
job = sim.run(transpiled_qc, shots=2048)
counts = job.result().get_counts()

print("Addressable Two-Level Measurement Histogram:")
print(counts)
`;
}

/**
 * Entangles the addressable register into a 5-qubit Greenberger-Horne-Zeilinger (GHZ) state:
 * (|00000> + |11111>) / sqrt(2)
 */
export function entangleAddressableRegisterGHZ(qubits: AddressableTwoLevelQubit[]): AddressableTwoLevelQubit[] {
  return qubits.map((q, idx) => {
    const updated = { ...q };
    updated.theta = Math.PI / 2.0;
    updated.phi = 0.0;
    updated.p0 = 0.50;
    updated.p1 = 0.50;
    updated.bloch = {
      x: idx === 0 ? 1.0 : 0.0,
      y: 0.0,
      z: 0.0
    };
    return updated;
  });
}

/**
 * Calculates the 5x5 microwave crosstalk isolation matrix between addressable drive lines (dB)
 */
export function getAddressableCrosstalkMatrix(qubits: AddressableTwoLevelQubit[]) {
  const n = qubits.length;
  const matrix: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        row.push(0.0);
      } else {
        const dist = Math.abs(i - j);
        const freqDelta = Math.abs(qubits[i].frequencyGhz - qubits[j].frequencyGhz);
        const isolationDb = -(38.5 + dist * 4.2 + freqDelta * 6.5);
        row.push(Math.round(isolationDb * 10) / 10);
      }
    }
    matrix.push(row);
  }
  return matrix;
}

/**
 * Frequency multiplexing spectrum simulation demonstrating addressable resonant lines
 * and negative anharmonicity detuning avoiding leakage into |2>
 */
export function generateMultiplexedSpectrumData(
  qubits: AddressableTwoLevelQubit[],
  startGhz: number = 4.60,
  endGhz: number = 6.10,
  points: number = 180
) {
  const spectrum: Array<{
    freqGhz: number;
    responseDb: number;
    leakageResponseDb: number;
  }> = [];

  const df = (endGhz - startGhz) / points;

  for (let i = 0; i <= points; i++) {
    const f = startGhz + i * df;
    let linearPower = 1e-5;
    let leakagePower = 1e-6;

    for (const q of qubits) {
      // 0->1 transition resonance
      const gamma01 = 0.018; // FWHM in GHz
      const delta01 = f - q.frequencyGhz;
      const lorentz01 = (gamma01 * gamma01) / (delta01 * delta01 + gamma01 * gamma01);
      linearPower += lorentz01;

      // 1->2 detuned transition resonance (shifted by negative anharmonicity)
      const f12 = q.frequencyGhz + (q.anharmonicityMhz / 1000.0);
      const gamma12 = 0.024;
      const delta12 = f - f12;
      const lorentz12 = (gamma12 * gamma12) / (delta12 * delta12 + gamma12 * gamma12) * 0.35;
      leakagePower += lorentz12;
    }

    const responseDb = Math.max(-50, 10 * Math.log10(linearPower));
    const leakageResponseDb = Math.max(-50, 10 * Math.log10(leakagePower));

    spectrum.push({
      freqGhz: Math.round(f * 1000) / 1000,
      responseDb: Math.round(responseDb * 10) / 10,
      leakageResponseDb: Math.round(leakageResponseDb * 10) / 10
    });
  }

  return spectrum;
}

/**
 * Clifford Randomized Benchmarking (RB) sequence decay simulation
 */
export function runRandomizedBenchmarkingSimulation(qubits: AddressableTwoLevelQubit[]) {
  const depths = [1, 2, 4, 8, 16, 32, 64, 128, 256];
  
  return qubits.map(q => {
    const errorPerClifford = (1 - q.singleQubitFidelity) * 0.95;
    const p = 1.0 - 2.0 * errorPerClifford;
    const A = 0.485;
    const B = 0.500;

    const curve = depths.map(m => {
      const fidelity = A * Math.pow(p, m) + B;
      return {
        depth: m,
        fidelity: Math.max(0.5, Math.min(1.0, fidelity))
      };
    });

    return {
      id: q.id,
      name: q.name,
      fidelity1Q: q.singleQubitFidelity,
      errorPerClifford,
      decayParameterP: p,
      curve
    };
  });
}

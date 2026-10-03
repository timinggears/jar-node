/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HYBRID JAR-NODE CLASSICAL FEEDBACK -> 3-QUBIT QUANTUM CIRCUIT ENGINE
 * 
 * Direct Physical Coupling:
 * 1. Classical side (Jar -> Phase-Out + Memory):
 *    - instant = (voltage - 0.68) * 42.0 - 0.15 * shimmer
 *    - memory += 0.08 * (instant - memory) * (dt / 0.001)
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

    this.memory += 0.08 * (instant - this.memory) * (dt / 0.001);
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

  let updatedMemory = currentMemory + 0.08 * (instant - currentMemory) * (dt / 0.001);
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

        self.memory += 0.08 * (instant - self.memory) * (dt / 0.001)
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

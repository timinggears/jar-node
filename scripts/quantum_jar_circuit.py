#!/usr/bin/env python3
"""
Hybrid Jar-Node Classical Feedback Loop -> 3-Qubit Quantum Circuit (Qiskit)

Direct Coupling:
- The classical stick/memory runs from the Jar's physical voltage.
- The 3-qubit circuit is driven directly in real time by those values:
    q0 = input voltage    -> Rx((voltage - 0.4) * 3.5)
    q1 = substrate memory  -> Ry((memory + 40) / 80 * pi)  (the stick)
    q2 = drive / clock     -> Rz(abs(osc) * 0.4)
    cx(0, 1), cx(1, 2), measure(2, 0)
    p1 = counts['1'] / shots
    quantum_po = (p1 * 110) - 55

Usage:
    python3 scripts/quantum_jar_circuit.py --voltage 1.42 --jitter 0.01 --time 0.05 --shots 1024
"""

import math
import sys
import json
import argparse

class PhaseOutState:
    def __init__(self):
        self.po = 0.0
        self.memory = 0.0

    def update(self, voltage, jitter, t, dt=0.001):
        shimmer = 22.0 + (jitter * 38.0)
        instant = (voltage - 0.68) * 42.0 - 0.15 * shimmer

        self.memory += 0.08 * (instant - self.memory) * (dt / 0.001)
        self.memory = max(-40.0, min(40.0, self.memory))

        osc = 6.0 * math.sin(2.0 * math.pi * 28.0 * t)
        self.po = 0.65 * instant + 0.90 * self.memory + 0.25 * osc
        self.po = max(-55.0, min(55.0, self.po))
        return self.po, self.memory, instant, osc

def cedar_circuit_angles(voltage, memory, osc=0.0):
    """
    Direct mapping angles (radians):
    q0 = input voltage    -> Rx
    q1 = substrate memory -> Ry (the stick)
    q2 = drive/clock      -> Rz
    """
    theta0 = max(0.0, min(math.pi, (voltage - 0.4) * 3.5))
    theta1 = max(0.0, min(math.pi, (memory + 40.0) / 80.0 * math.pi))
    theta2 = max(0.0, min(math.pi, abs(osc) * 0.4))
    return theta0, theta1, theta2

def run_hybrid_step(voltage, jitter, t, state, shots=1024, dt=0.001):
    po, memory, instant, osc = state.update(voltage, jitter, t, dt=dt)
    theta0, theta1, theta2 = cedar_circuit_angles(voltage, memory, osc)

    # Try executing on Qiskit if available
    try:
        from qiskit import QuantumCircuit, transpile
        from qiskit_aer import AerSimulator

        qc = QuantumCircuit(3, 1)
        qc.rx(theta0, 0)
        qc.ry(theta1, 1)
        qc.rz(theta2, 2)
        qc.cx(0, 1)
        qc.cx(1, 2)
        qc.measure(2, 0)

        sim = AerSimulator()
        job = sim.run(transpile(qc, sim), shots=shots)
        counts = job.result().get_counts()

        p1 = counts.get('1', 0) / float(shots)
        quantum_po = (p1 * 110.0) - 55.0

        return {
            'classical_po': po,
            'memory': memory,
            'memory_angle_deg': math.degrees(theta1),
            'quantum_po': quantum_po,
            'p1': p1,
            'counts': counts,
            'angles': {
                'theta0_voltage': theta0,
                'theta1_memory': theta1,
                'theta2_osc': theta2
            },
            'instant': instant,
            'osc': osc,
            'engine': 'qiskit_aer'
        }
    except ImportError:
        # High-fidelity analytical statevector simulation matching Qiskit unitary
        # P(1) = cos^2(theta0/2)*sin^2(theta1/2) + sin^2(theta0/2)*cos^2(theta1/2)
        #      = (1 - cos(theta0)*cos(theta1)) / 2.0
        prob_1_exact = (1.0 - math.cos(theta0) * math.cos(theta1)) / 2.0

        if shots and shots > 0:
            import random
            shots_1 = 0
            for _ in range(shots):
                if random.random() < prob_1_exact:
                    shots_1 += 1
            p1 = shots_1 / float(shots)
            counts = {'0': shots - shots_1, '1': shots_1}
        else:
            p1 = prob_1_exact
            counts = {'0': int(1024 * (1.0 - p1)), '1': int(1024 * p1)}

        quantum_po = (p1 * 110.0) - 55.0

        return {
            'classical_po': po,
            'memory': memory,
            'memory_angle_deg': math.degrees(theta1),
            'quantum_po': quantum_po,
            'p1': p1,
            'prob_1_exact': prob_1_exact,
            'counts': counts,
            'angles': {
                'theta0_voltage': theta0,
                'theta1_memory': theta1,
                'theta2_osc': theta2
            },
            'instant': instant,
            'osc': osc,
            'engine': 'analytical_statevector'
        }

def get_openqasm_string(theta0, theta1, theta2):
    return f"""// OpenQASM 2.0
// Real-time Cedar Quantum Circuit driven by Jar voltage & memory stick
include "qelib1.inc";
qreg q[3];
creg c[1];

rx({theta0:.6f}) q[0]; // q0 = input voltage
ry({theta1:.6f}) q[1]; // q1 = substrate memory (the stick)
rz({theta2:.6f}) q[2]; // q2 = drive/clock

cx q[0],q[1];
cx q[1],q[2];

measure q[2] -> c[0];
"""

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Hybrid Jar-Node Classical Feedback Loop -> 3-Qubit Quantum Circuit")
    parser.add_argument("--voltage", type=float, default=1.42, help="Jar physical voltage")
    parser.add_argument("--memory", type=float, default=0.0, help="Initial memory stick level")
    parser.add_argument("--jitter", type=float, default=0.01, help="Dielectric jitter")
    parser.add_argument("--time", type=float, default=0.05, help="Time t in seconds")
    parser.add_argument("--shots", type=int, default=1024, help="Quantum measurement shots")
    parser.add_argument("--json", action="store_true", help="Output in JSON format")
    parser.add_argument("--qasm", action="store_true", help="Print OpenQASM representation")

    args = parser.parse_args()

    state = PhaseOutState()
    state.memory = args.memory

    res = run_hybrid_step(args.voltage, args.jitter, args.time, state, shots=args.shots)

    if args.qasm:
        angles = res.get('angles', {})
        print(get_openqasm_string(angles['theta0_voltage'], angles['theta1_memory'], angles['theta2_osc']))
    elif args.json:
        print(json.dumps(res, indent=2))
    else:
        print("=== WORKING HYBRID: JAR -> MEMORY STICK -> 3-QUBIT CIRCUIT ===")
        print(f"Jar Voltage:          {args.voltage:.3f} V")
        print(f"Classical Memory:     {res['memory']:.4f}")
        print(f"Memory Angle (Ry):    {res['memory_angle_deg']:.2f} deg")
        print(f"Classical Phase-Out:  {res['classical_po']:.4f} deg")
        print(f"Quantum P(|1>):       {res['p1']:.4f}")
        print(f"Quantum Phase-Out:    {res['quantum_po']:.4f} deg")
        print(f"Shot Measurement:     {res['counts']}")

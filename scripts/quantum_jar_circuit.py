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

        # 4. Memory term: Slow integration + soft bounds
        self.memory += 0.025 * (instant - self.memory) * (dt / 0.001)

        # Gentle restoring forces so it doesn't pin at the rails
        if self.memory < -25.0:
            self.memory += 0.04 * (-15.0 - self.memory)
        elif self.memory > 35.0:
            self.memory += 0.03 * (25.0 - self.memory)

        self.memory = max(-32.0, min(38.0, self.memory))

        osc = 6.0 * math.sin(2.0 * math.pi * 28.0 * t)
        self.po = 0.65 * instant + 0.90 * self.memory + 0.25 * osc
        self.po = max(-55.0, min(55.0, self.po))
        return self.po, self.memory, instant, osc

class ClosedLoopJarQuantumSystem:
    def __init__(self, initial_memory=0.0, enabled=True, gain=0.25, mode='dual'):
        self.state = PhaseOutState()
        self.state.memory = initial_memory
        self.enabled = enabled
        self.gain = gain
        self.mode = mode
        self.voltage_scale = 0.12
        self.memory_gain = 0.18
        self.last_delta_v = 0.0
        self.last_delta_m = 0.0
        self.effective_voltage = 0.0

    def step(self, ambient_voltage, jitter, t, dt=0.001, shots=1024):
        eff_v = max(0.3, min(1.85, ambient_voltage + self.last_delta_v)) if self.enabled else ambient_voltage
        self.effective_voltage = eff_v

        po, memory, instant, osc = self.state.update(eff_v, jitter, t, dt=dt)
        theta0, theta1, theta2 = cedar_circuit_angles(eff_v, memory, osc)

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
        memory_angle_deg = math.degrees(theta1)

        if self.enabled:
            g = self.gain
            dV = (quantum_po / 55.0) * self.voltage_scale * g
            dM = (quantum_po - memory) * self.memory_gain * g

            if self.mode in ('dual', 'voltage'):
                self.last_delta_v = dV
            else:
                self.last_delta_v = 0.0

            if self.mode in ('dual', 'memory'):
                self.last_delta_m = dM
                self.state.memory += dM
                if self.state.memory < -25.0:
                    self.state.memory += 0.04 * (-15.0 - self.state.memory)
                elif self.state.memory > 35.0:
                    self.state.memory += 0.03 * (25.0 - self.state.memory)
                self.state.memory = max(-32.0, min(38.0, self.state.memory))
            else:
                self.last_delta_m = 0.0
        else:
            self.last_delta_v = 0.0
            self.last_delta_m = 0.0

        locked = abs(quantum_po - po) < 6.0
        return {
            'voltage': ambient_voltage,
            'effective_voltage': self.effective_voltage,
            'memory': self.state.memory,
            'memory_angle_deg': memory_angle_deg,
            'classical_po': po,
            'quantum_po': quantum_po,
            'p1': p1,
            'counts': counts,
            'delta_v': self.last_delta_v,
            'delta_m': self.last_delta_m,
            'locked': locked,
            'instant': instant,
            'osc': osc
        }

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
    parser.add_argument("--dt", type=float, default=0.001, help="Time delta dt (default 0.001s)")
    parser.add_argument("--shots", type=int, default=1024, help="Quantum measurement shots")
    parser.add_argument("--steps", type=int, default=1, help="Number of steps to evaluate")
    parser.add_argument("--closed", action="store_true", help="Enable closed physical-quantum write-back feedback")
    parser.add_argument("--gain", type=float, default=0.25, help="Feedback loop gain (0.0 - 1.0)")
    parser.add_argument("--mode", type=str, default="dual", choices=["dual", "voltage", "memory"], help="Feedback back-action mode")
    parser.add_argument("--json", action="store_true", help="Output in JSON format")
    parser.add_argument("--qasm", action="store_true", help="Print OpenQASM representation")

    args = parser.parse_args()

    if args.steps > 1 or args.closed:
        system = ClosedLoopJarQuantumSystem(
            initial_memory=args.memory,
            enabled=args.closed,
            gain=args.gain,
            mode=args.mode
        )
        history = []
        cur_t = args.time
        for i in range(1, args.steps + 1):
            cur_t += args.dt
            res = system.step(args.voltage, args.jitter, cur_t, dt=args.dt, shots=args.shots)
            res['step'] = i
            res['time'] = cur_t
            history.append(res)

        if args.json:
            print(json.dumps(history, indent=2))
        else:
            status_str = f"CLOSED WRITE-BACK (Gain: {args.gain:.2f}, Mode: {args.mode})" if args.closed else "OPEN-LOOP"
            print(f"=== SOVEREIGN JARS: QUANTUM-PHYSICAL FEEDBACK TELEMETRY [{status_str}] ===")
            print(f"{'Step':<6} {'Memory':<10} {'Classical PO':<15} {'Quantum PO':<14} {'P(1)':<8} {'ΔV(mV)':<9} {'ΔM':<8} {'V_eff':<8} {'Lock':<6}")
            print("-" * 88)
            for r in history:
                cl_po_str = f"+{r['classical_po']:.2f}°" if r['classical_po'] >= 0 else f"{r['classical_po']:.2f}°"
                qu_po_str = f"+{r['quantum_po']:.2f}°" if r['quantum_po'] >= 0 else f"{r['quantum_po']:.2f}°"
                p1_str = f"{r['p1'] * 100:.1f}%"
                dv_str = f"{r['delta_v'] * 1000:+.1f}"
                dm_str = f"{r['delta_m']:+.2f}"
                lock_str = "LOCKED" if r['locked'] else "TRACK"
                print(f"#{r['step']:<5} {r['memory']:<10.2f} {cl_po_str:<15} {qu_po_str:<14} {p1_str:<8} {dv_str:<9} {dm_str:<8} {r['effective_voltage']:<8.3f} {lock_str:<6}")
    else:
        state = PhaseOutState()
        state.memory = args.memory

        res = run_hybrid_step(args.voltage, args.jitter, args.time, state, shots=args.shots, dt=args.dt)

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

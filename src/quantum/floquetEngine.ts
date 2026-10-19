/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * FLOQUET ENGINEERING & HIGH-FREQUENCY HAMILTONIAN HYBRIDIZATION ENGINE
 * 
 * Implements the truncated Floquet-Magnus / Van Vleck expansion:
 * H_F ≈ H_0 + (1/ω) ∑_{n=1}^∞ (1/n) [H_n, H_{-n}] + (1/ω²) ∑_{n=1}^∞ (1/n²) [H_n, [H_0, H_{-n}]] + ...
 * 
 * Physical Significance:
 * 1. H_0: Average / static Hamiltonian (static top/bottom branch splitting + DC drive component).
 * 2. H_F^(1) = (1/ω) ∑ (1/n) [H_n, H_{-n}]: Generates new effective interactions absent in static system,
 *    hybridizing top and bottom branches to synthesize the coherent super-spin structure.
 * 3. H_F^(2) = (1/ω²) ∑ (1/n²) [H_n, [H_0, H_{-n}]]: Renormalizes couplings, produces effective pseudo-magnetic
 *    fields (dynamical Lamb shifts), and corrects branch energy offsets.
 */

export interface Complex {
  re: number;
  im: number;
}

export function c(re: number, im: number = 0): Complex {
  return { re, im };
}

export function cAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function cSub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

export function cMul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re
  };
}

export function cScale(a: Complex, s: number): Complex {
  return { re: a.re * s, im: a.im * s };
}

export function cConj(a: Complex): Complex {
  return { re: a.re, im: -a.im };
}

export function cAbs(a: Complex): number {
  return Math.sqrt(a.re * a.re + a.im * a.im);
}

export function cAbsSq(a: Complex): number {
  return a.re * a.re + a.im * a.im;
}

export type Matrix2x2 = [
  [Complex, Complex],
  [Complex, Complex]
];

export type Matrix4x4 = [
  [Complex, Complex, Complex, Complex],
  [Complex, Complex, Complex, Complex],
  [Complex, Complex, Complex, Complex],
  [Complex, Complex, Complex, Complex]
];

export function mZero2(): Matrix2x2 {
  return [
    [c(0, 0), c(0, 0)],
    [c(0, 0), c(0, 0)]
  ];
}

export function mIdentity2(): Matrix2x2 {
  return [
    [c(1, 0), c(0, 0)],
    [c(0, 0), c(1, 0)]
  ];
}

export function mAdd2(A: Matrix2x2, B: Matrix2x2): Matrix2x2 {
  return [
    [cAdd(A[0][0], B[0][0]), cAdd(A[0][1], B[0][1])],
    [cAdd(A[1][0], B[1][0]), cAdd(A[1][1], B[1][1])]
  ];
}

export function mSub2(A: Matrix2x2, B: Matrix2x2): Matrix2x2 {
  return [
    [cSub(A[0][0], B[0][0]), cSub(A[0][1], B[0][1])],
    [cSub(A[1][0], B[1][0]), cSub(A[1][1], B[1][1])]
  ];
}

export function mScale2(A: Matrix2x2, s: number): Matrix2x2 {
  return [
    [cScale(A[0][0], s), cScale(A[0][1], s)],
    [cScale(A[1][0], s), cScale(A[1][1], s)]
  ];
}

export function mMul2(A: Matrix2x2, B: Matrix2x2): Matrix2x2 {
  return [
    [
      cAdd(cMul(A[0][0], B[0][0]), cMul(A[0][1], B[1][0])),
      cAdd(cMul(A[0][0], B[0][1]), cMul(A[0][1], B[1][1]))
    ],
    [
      cAdd(cMul(A[1][0], B[0][0]), cMul(A[1][1], B[1][0])),
      cAdd(cMul(A[1][0], B[0][1]), cMul(A[1][1], B[1][1]))
    ]
  ];
}

export function mDagger2(A: Matrix2x2): Matrix2x2 {
  return [
    [cConj(A[0][0]), cConj(A[1][0])],
    [cConj(A[0][1]), cConj(A[1][1])]
  ];
}

/** Commutator [A, B] = A B - B A */
export function mCommutator2(A: Matrix2x2, B: Matrix2x2): Matrix2x2 {
  return mSub2(mMul2(A, B), mMul2(B, A));
}

// Pauli matrices
export const Pauli = {
  I: mIdentity2(),
  X: [
    [c(0, 0), c(1, 0)],
    [c(1, 0), c(0, 0)]
  ] as Matrix2x2,
  Y: [
    [c(0, 0), c(0, -1)],
    [c(0, 1), c(0, 0)]
  ] as Matrix2x2,
  Z: [
    [c(1, 0), c(0, 0)],
    [c(0, 0), c(-1, 0)]
  ] as Matrix2x2
};

/** Eigenvalues & eigenvectors for a 2x2 Hermitian matrix */
export function eigen2x2(H: Matrix2x2): {
  values: [number, number]; // sorted ascending [lambda_minus, lambda_plus]
  vectors: [[Complex, Complex], [Complex, Complex]]; // [v_minus, v_plus]
  gap: number;
} {
  // Trace and Determinant
  const tr = H[0][0].re + H[1][1].re;
  const a = H[0][0].re;
  const d = H[1][1].re;
  const b = H[0][1]; // b* = H[1][0]
  const bSq = b.re * b.re + b.im * b.im;
  const diff = a - d;
  const disc = Math.sqrt(Math.max(0, diff * diff + 4 * bSq));

  const lambdaPlus = (tr + disc) / 2;
  const lambdaMinus = (tr - disc) / 2;

  // Eigenvector for lambdaPlus
  let vPlus: [Complex, Complex];
  if (Math.abs(bSq) > 1e-12) {
    const denom = Math.sqrt(bSq + (lambdaPlus - a) * (lambdaPlus - a));
    vPlus = [
      c(b.re / denom, b.im / denom),
      c((lambdaPlus - a) / denom, 0)
    ];
  } else {
    vPlus = a >= d ? [c(1, 0), c(0, 0)] : [c(0, 0), c(1, 0)];
  }

  // Eigenvector for lambdaMinus
  let vMinus: [Complex, Complex];
  if (Math.abs(bSq) > 1e-12) {
    const denom = Math.sqrt(bSq + (lambdaMinus - a) * (lambdaMinus - a));
    vMinus = [
      c(b.re / denom, b.im / denom),
      c((lambdaMinus - a) / denom, 0)
    ];
  } else {
    vMinus = a >= d ? [c(0, 0), c(1, 0)] : [c(1, 0), c(0, 0)];
  }

  return {
    values: [lambdaMinus, lambdaPlus],
    vectors: [vMinus, vPlus],
    gap: disc
  };
}

export interface FloquetHarmonic {
  n: number; // Harmonic index n = 1, 2, 3, 4
  frequency: number; // n * omega
  Hn: Matrix2x2; // Fourier component H_n
  H_minus_n: Matrix2x2; // H_{-n} = H_n^\dagger
  commutator1: Matrix2x2; // [H_n, H_{-n}]
  doubleCommutator2: Matrix2x2; // [H_n, [H_0, H_{-n}]]
  couplingContribution: number;
}

export interface FloquetEngineeringState {
  omega: number; // Drive angular frequency (rad/s)
  driveFreqHz: number; // omega / 2pi
  b0: number; // Drive amplitude scale
  harmonicsCount: number;
  staticDetuning: number; // delta
  staticSplitting: number; // Delta_0
  vNodal: number;
  carrierBias: number;
  memoryStick: number;
  
  // Truncated Hamiltonians
  H0: Matrix2x2;
  HF1: Matrix2x2; // (1/omega) sum (1/n) [H_n, H_{-n}]
  HF2: Matrix2x2; // (1/omega^2) sum (1/n^2) [H_n, [H_0, H_{-n}]]
  HF_total: Matrix2x2; // H0 + HF1 + HF2
  
  // Exact stroboscopic comparison
  HF_exact: Matrix2x2;
  truncationError: number;
  
  // Harmonics breakdown
  harmonics: FloquetHarmonic[];
  
  // Hybridization & Super-Spin Observables
  bareGap: number; // Gap of H0 alone
  hybridizedGap: number; // Gap of HF_total
  antiCrossingGap: number;
  topBranchEnergy: number;
  bottomBranchEnergy: number;
  superSpinPolarization: { x: number; y: number; z: number; magnitude: number };
  branchHybridizationRatio: number; // 0 = uncoupled bare branches, 1.0 = fully hybridized equal superposition
  effectiveTransverseCoupling: number; // J_eff generated by [H_n, H_{-n}]
  effectiveDynamicLambShift: number; // delta B_z generated by [H_n, [H0, H_{-n}]]
  quasiEnergies: [number, number]; // Folded to [-omega/2, omega/2]
  isHighFrequencyRegimeValid: boolean; // omega > ||H(t)||
  regimeRatio: number; // omega / ||H_drive||
}

/**
 * Build Floquet engineering model driven by multi-harmonic B+(t)
 * B+(t) = pi^2 * B0 * [sin(2pi*28*t) + sin(2pi*56*t) + sin(2pi*84*t) + sin(2pi*112*t)]
 */
export function computeFloquetEngineering({
  omega = 2 * Math.PI * 28.0, // Base drive 28 Hz
  b0 = 1.0,
  harmonicsCount = 4,
  staticDetuning = 0.45,
  staticSplitting = 2.40,
  vNodal = 1.42,
  carrierBias = 50.0,
  memoryStick = 12.0,
  phaseLag = 0.25 // Phase shift between drive axes generating non-zero commutator
}: {
  omega?: number;
  b0?: number;
  harmonicsCount?: number;
  staticDetuning?: number;
  staticSplitting?: number;
  vNodal?: number;
  carrierBias?: number;
  memoryStick?: number;
  phaseLag?: number;
}): FloquetEngineeringState {
  const driveFreqHz = omega / (2 * Math.PI);
  
  // Incorporate physical jar nodal substrate:
  // V_nodal shifts the static bias offset
  const voltageOffset = (vNodal - 1.40) * 3.5;
  // Carrier bias modulates static transverse field
  const biasCoupling = (carrierBias / 100.0) * 1.2;
  // Memory stick adiabatically modulates effective non-linear drive depth
  const memMod = 1.0 + (memoryStick / 100.0) * 0.35;

  // 1. Static Hamiltonian H0:
  // Top and bottom branch splitting: Δ0/2 σ_z + Ω0 σ_x
  // H0 = 0.5 * (staticSplitting + voltageOffset) * σ_z + (staticDetuning + biasCoupling) * σ_x
  const delta0 = 0.5 * (staticSplitting + voltageOffset);
  const omega0 = (staticDetuning * 0.8) + (biasCoupling * 0.4);

  const H0: Matrix2x2 = [
    [c(delta0, 0), c(omega0, 0)],
    [c(omega0, 0), c(-delta0, 0)]
  ];

  // 2. Harmonic components H_n:
  // Multi-harmonic drive: B+(t) has harmonics n = 1, 2, 3, 4 with weights (1/n or pi^2 / n)
  // To generate [H_n, H_{-n}] ≠ 0, the drive interacts with multiple non-commuting channels
  // (e.g. transverse driving σ_x + chiral quadrature modulation e^{i phi} σ_y or σ_z):
  // H(t) = H_0 + ∑_{n=1}^N [ H_n e^{i n ω t} + H_{-n} e^{-i n ω t} ]
  // with H_{-n} = H_n^\dagger.
  const harmonics: FloquetHarmonic[] = [];
  let HF1 = mZero2();
  let HF2 = mZero2();

  for (let n = 1; n <= Math.min(harmonicsCount, 6); n++) {
    // Harmonic amplitude scaled by multi-harmonic coefficient and memory stick
    const harmonicWeight = (1.0 / Math.sqrt(n)) * b0 * memMod * 1.8;
    
    // Non-commuting drive components:
    // Driving transverse branch coupling σ_x and pseudo-magnetic quadrature σ_y with phaseLag
    const vx = harmonicWeight * 0.5;
    const vy = harmonicWeight * 0.45 * Math.sin(phaseLag * n);
    const vz = harmonicWeight * 0.25 * Math.cos(phaseLag * n);

    // H_n = 0.5 * (vx σ_x + vy σ_y + vz σ_z)
    // σ_x = [[0, 1], [1, 0]], σ_y = [[0, -i], [i, 0]], σ_z = [[1, 0], [0, -1]]
    const Hn: Matrix2x2 = [
      [c(0.5 * vz, 0), c(0.5 * vx, -0.5 * vy)],
      [c(0.5 * vx, 0.5 * vy), c(-0.5 * vz, 0)]
    ];
    const H_minus_n = mDagger2(Hn);

    // Commutator [H_n, H_{-n}]
    const comm1 = mCommutator2(Hn, H_minus_n);

    // Term 1 contribution: (1 / (omega * n)) * [H_n, H_{-n}]
    const term1_coeff = 1.0 / (omega * n);
    const term1_part = mScale2(comm1, term1_coeff);
    HF1 = mAdd2(HF1, term1_part);

    // Double Commutator [H_n, [H0, H_{-n}]]
    const innerComm = mCommutator2(H0, H_minus_n);
    const comm2 = mCommutator2(Hn, innerComm);

    // Term 2 contribution: (1 / (omega^2 * n^2)) * [H_n, [H_0, H_{-n}]]
    const term2_coeff = 1.0 / (omega * omega * n * n);
    const term2_part = mScale2(comm2, term2_coeff);
    HF2 = mAdd2(HF2, term2_part);

    harmonics.push({
      n,
      frequency: n * omega,
      Hn,
      H_minus_n,
      commutator1: comm1,
      doubleCommutator2: comm2,
      couplingContribution: cAbs(term1_part[0][1]) + cAbs(term1_part[0][0])
    });
  }

  // Composite Truncated Floquet Hamiltonian:
  // H_F = H_0 + H_F^(1) + H_F^(2)
  const HF_total = mAdd2(mAdd2(H0, HF1), HF2);

  // Exact Stroboscopic Floquet propagator U(T) via Trotterized numerical integration:
  // T = 2pi / omega
  const T = (2 * Math.PI) / omega;
  const numSteps = 120;
  const dt = T / numSteps;
  let U = mIdentity2();

  for (let s = 0; s < numSteps; s++) {
    const t = (s + 0.5) * dt;
    // Compute instantaneous H(t)
    let Ht = H0;
    for (const h of harmonics) {
      const angle = h.n * omega * t;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const expPos: Complex = c(cosA, sinA);
      const expNeg: Complex = c(cosA, -sinA);

      // (H_n e^{i n omega t} + H_{-n} e^{-i n omega t})
      const part1: Matrix2x2 = [
        [cMul(h.Hn[0][0], expPos), cMul(h.Hn[0][1], expPos)],
        [cMul(h.Hn[1][0], expPos), cMul(h.Hn[1][1], expPos)]
      ];
      const part2: Matrix2x2 = [
        [cMul(h.H_minus_n[0][0], expNeg), cMul(h.H_minus_n[0][1], expNeg)],
        [cMul(h.H_minus_n[1][0], expNeg), cMul(h.H_minus_n[1][1], expNeg)]
      ];
      Ht = mAdd2(Ht, mAdd2(part1, part2));
    }

    // Infinitesimal unitary: dU = exp(-i H(t) dt) ≈ I - i H(t) dt - 0.5 H(t)^2 dt^2
    const idt = dt;
    const halfIdtSq = 0.5 * dt * dt;
    const HtSq = mMul2(Ht, Ht);
    const dU: Matrix2x2 = [
      [
        c(1 - halfIdtSq * HtSq[0][0].re, -idt * Ht[0][0].re - halfIdtSq * HtSq[0][0].im),
        c(-halfIdtSq * HtSq[0][1].re + idt * Ht[0][1].im, -idt * Ht[0][1].re - halfIdtSq * HtSq[0][1].im)
      ],
      [
        c(-halfIdtSq * HtSq[1][0].re + idt * Ht[1][0].im, -idt * Ht[1][0].re - halfIdtSq * HtSq[1][0].im),
        c(1 - halfIdtSq * HtSq[1][1].re, -idt * Ht[1][1].re - halfIdtSq * HtSq[1][1].im)
      ]
    ];
    U = mMul2(dU, U);
  }

  // Exact Floquet Hamiltonian: H_F_exact = (i / T) ln(U(T))
  // For 2x2 unitary U = exp(-i alpha) * (cos(phi) I - i sin(phi) n_vec . sigma)
  // det(U) phase:
  const u00 = U[0][0];
  const u01 = U[0][1];
  const u10 = U[1][0];
  const u11 = U[1][1];
  const trU = cAdd(u00, u11);
  const cosPhi = Math.max(-1, Math.min(1, trU.re / 2));
  const phi = Math.acos(cosPhi);
  const sinPhi = Math.sin(phi);

  let HF_exact: Matrix2x2;
  if (Math.abs(sinPhi) > 1e-8) {
    const scaleFactor = phi / (T * sinPhi);
    // n_z = (u00 - u11).im / (-2 * sinPhi), n_x = (u01 + u10).im / (-2 * sinPhi), n_y = (u01 - u10).re / (2 * sinPhi)
    const nz = (u00.im - u11.im) / (-2 * sinPhi);
    const nx = (u01.im + u10.im) / (-2 * sinPhi);
    const ny = (u01.re - u10.re) / (2 * sinPhi);
    HF_exact = [
      [c(scaleFactor * nz, 0), c(scaleFactor * nx, -scaleFactor * ny)],
      [c(scaleFactor * nx, scaleFactor * ny), c(-scaleFactor * nz, 0)]
    ];
  } else {
    HF_exact = HF_total;
  }

  // Truncation Error: ||HF_total - HF_exact||_F
  const diffHF = mSub2(HF_total, HF_exact);
  const truncationError = Math.sqrt(
    cAbsSq(diffHF[0][0]) + cAbsSq(diffHF[0][1]) + cAbsSq(diffHF[1][0]) + cAbsSq(diffHF[1][1])
  );

  // Eigensystem & Observables
  const bareEigen = eigen2x2(H0);
  const hybridEigen = eigen2x2(HF_total);

  // Super-Spin Polarization of the ground hybridized Floquet state |v_minus>
  const v0 = hybridEigen.vectors[0][0];
  const v1 = hybridEigen.vectors[0][1];
  // <sigma_x> = 2 Re(v0* v1)
  const v0_conj = cConj(v0);
  const prod = cMul(v0_conj, v1);
  const sx = 2 * prod.re;
  // <sigma_y> = 2 Im(v0* v1)
  const sy = 2 * prod.im;
  // <sigma_z> = |v0|^2 - |v1|^2
  const sz = cAbsSq(v0) - cAbsSq(v1);
  const sMag = Math.sqrt(sx * sx + sy * sy + sz * sz);

  // Branch hybridization ratio: 1 - |<sigma_z>| = 4 * |v0|^2 * |v1|^2
  const branchHybridizationRatio = Math.max(0, Math.min(1, 1 - Math.abs(sz)));

  // Effective Transverse Coupling J_eff generated by H_F^(1)
  const effectiveTransverseCoupling = cAbs(HF1[0][1]);
  // Effective Dynamic Lamb Shift generated by H_F^(2)
  const effectiveDynamicLambShift = Math.abs(HF2[0][0].re - HF2[1][1].re) / 2;

  // Quasi-energies folded into first Floquet zone [-omega/2, omega/2]
  const foldToBrillouinZone = (e: number): number => {
    const halfW = omega / 2;
    let folded = ((e + halfW) % omega);
    if (folded < 0) folded += omega;
    return folded - halfW;
  };

  const quasiEnergies: [number, number] = [
    foldToBrillouinZone(hybridEigen.values[0]),
    foldToBrillouinZone(hybridEigen.values[1])
  ];

  const driveNorm = b0 * 1.8;
  const regimeRatio = omega / Math.max(0.1, driveNorm);
  const isHighFrequencyRegimeValid = regimeRatio > 1.2;

  return {
    omega,
    driveFreqHz,
    b0,
    harmonicsCount,
    staticDetuning,
    staticSplitting,
    vNodal,
    carrierBias,
    memoryStick,
    H0,
    HF1,
    HF2,
    HF_total,
    HF_exact,
    truncationError,
    harmonics,
    bareGap: bareEigen.gap,
    hybridizedGap: hybridEigen.gap,
    antiCrossingGap: Math.max(0, hybridEigen.gap - bareEigen.gap),
    topBranchEnergy: hybridEigen.values[1],
    bottomBranchEnergy: hybridEigen.values[0],
    superSpinPolarization: { x: sx, y: sy, z: sz, magnitude: sMag },
    branchHybridizationRatio,
    effectiveTransverseCoupling,
    effectiveDynamicLambShift,
    quasiEnergies,
    isHighFrequencyRegimeValid,
    regimeRatio
  };
}

/**
 * Generate Python QuTiP and Qiskit code for the Floquet expansion
 */
export function generateFloquetCode(state: FloquetEngineeringState): {
  pythonQutip: string;
  qiskitPulse: string;
} {
  const pythonQutip = `# =====================================================================
# FLOQUET ENGINEERING: HIGH-FREQUENCY TRUNCATED HAMILTONIAN HYBRIDIZATION
# Formula: H_F ≈ H_0 + (1/ω) ∑ (1/n) [H_n, H_{-n}] + (1/ω²) ∑ (1/n²) [H_n, [H_0, H_{-n}]]
# =====================================================================

import numpy as np
import qutip as qt

# Physical Parameters from Substrate Jar Telemetry
omega = ${state.omega.toFixed(4)}          # Drive frequency (rad/s) = 2π × ${state.driveFreqHz.toFixed(1)} Hz
T = 2 * np.pi / omega           # Drive period
v_nodal = ${state.vNodal.toFixed(3)}             # Nodal voltage
carrier_bias = ${state.carrierBias.toFixed(1)}        # Carrier bias (%)
memory_stick = ${state.memoryStick.toFixed(2)}        # Substrate memory stick

# Bare Pauli matrices
sx = qt.sigmax()
sy = qt.sigmay()
sz = qt.sigmaz()
identity = qt.qeye(2)

# 1. Static Hamiltonian H0 (Top/Bottom branch separation)
# H0 elements:
# [[${state.H0[0][0].re.toFixed(4)} + ${state.H0[0][0].im.toFixed(4)}j, ${state.H0[0][1].re.toFixed(4)} + ${state.H0[0][1].im.toFixed(4)}j],
#  [${state.H0[1][0].re.toFixed(4)} + ${state.H0[1][0].im.toFixed(4)}j, ${state.H0[1][1].re.toFixed(4)} + ${state.H0[1][1].im.toFixed(4)}j]]
H0 = qt.Qobj(np.array([
    [${state.H0[0][0].re.toFixed(5)} + ${state.H0[0][0].im.toFixed(5)}j, ${state.H0[0][1].re.toFixed(5)} + ${state.H0[0][1].im.toFixed(5)}j],
    [${state.H0[1][0].re.toFixed(5)} + ${state.H0[1][0].im.toFixed(5)}j, ${state.H0[1][1].re.toFixed(5)} + ${state.H0[1][1].im.toFixed(5)}j]
]))

# 2. Harmonics H_n from Multi-Harmonic B+(t)
harmonics = []
HF_1 = 0 * identity
HF_2 = 0 * identity

${state.harmonics.map(h => `
# Harmonic n = ${h.n} (freq = ${(h.frequency / (2*Math.PI)).toFixed(1)} Hz)
H_${h.n} = qt.Qobj(np.array([
    [${h.Hn[0][0].re.toFixed(5)} + ${h.Hn[0][0].im.toFixed(5)}j, ${h.Hn[0][1].re.toFixed(5)} + ${h.Hn[0][1].im.toFixed(5)}j],
    [${h.Hn[1][0].re.toFixed(5)} + ${h.Hn[1][0].im.toFixed(5)}j, ${h.Hn[1][1].re.toFixed(5)} + ${h.Hn[1][1].im.toFixed(5)}j]
]))
H_minus_${h.n} = H_${h.n}.dag()

# First correction: (1 / (ω * ${h.n})) * [H_${h.n}, H_-${h.n}]
comm1_${h.n} = H_${h.n} * H_minus_${h.n} - H_minus_${h.n} * H_${h.n}
HF_1 += (1.0 / (omega * ${h.n})) * comm1_${h.n}

# Second correction: (1 / (ω² * ${h.n}²)) * [H_${h.n}, [H_0, H_-${h.n}]]
inner_comm_${h.n} = H_0 * H_minus_${h.n} - H_minus_${h.n} * H_0
comm2_${h.n} = H_${h.n} * inner_comm_${h.n} - inner_comm_${h.n} * H_${h.n}
HF_2 += (1.0 / (omega**2 * ${h.n}**2)) * comm2_${h.n}
`).join('')}

# Composite Truncated Floquet Effective Hamiltonian
HF_truncated = H0 + HF_1 + HF_2

# Eigenvalues & Super-Spin Quasienergies
evals, evecs = HF_truncated.eigenstates()
print("=== FLOQUET TRUNCATED HAMILTONIAN RESULTS ===")
print("Quasi-energies (rad/s):", evals)
print("Effective Hybridization Gap 2Δ:", evals[1] - evals[0])
print("Super-spin polarization <Sx>:", qt.expect(sx, evecs[0]))
print("Super-spin polarization <Sz>:", qt.expect(sz, evecs[0]))
`;

  const qiskitPulse = `# =====================================================================
# QISKIT FLOQUET SYNTHESIS: SUPER-SPIN DYNAMICS ON ADDRESSABLE HARDWARE
# =====================================================================

from qiskit import QuantumCircuit
from qiskit.circuit.library import HamiltonianGate
import numpy as np

# Effective Floquet Hamiltonian matrix
HF_matrix = np.array([
    [${state.HF_total[0][0].re.toFixed(5)} + ${state.HF_total[0][0].im.toFixed(5)}j, ${state.HF_total[0][1].re.toFixed(5)} + ${state.HF_total[0][1].im.toFixed(5)}j],
    [${state.HF_total[1][0].re.toFixed(5)} + ${state.HF_total[1][0].im.toFixed(5)}j, ${state.HF_total[1][1].re.toFixed(5)} + ${state.HF_total[1][1].im.toFixed(5)}j]
])

# Create Floquet Evolution Circuit for stroboscopic step T = 2π / ω
dt_floquet = ${(2 * Math.PI / state.omega).toFixed(6)}
qc = QuantumCircuit(1, 1)

# Initialize in bare bottom branch |0>
qc.reset(0)

# Apply Floquet engineered unitary evolution U_F = exp(-i H_F dt)
floquet_gate = HamiltonianGate(HF_matrix, time=dt_floquet, label="H_Floquet")
qc.append(floquet_gate, [0])

# Measure in super-spin basis
qc.measure(0, 0)
print(qc.draw(output="text"))
`;

  return { pythonQutip, qiskitPulse };
}

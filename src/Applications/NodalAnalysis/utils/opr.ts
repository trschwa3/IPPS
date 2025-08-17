/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { gas_visc_PT, z_PT } from '../../../Correlations/GasCorrelations';
import type { FrictionModel } from '../types';

export function calculateOilOPR(params: any): { p_wf: number; q_o: number }[] {
  const {
    // geometry & path
    L,             // ft
    D_in,          // inches
    thetaDeg = 90, // deg from horizontal; + up
    eps = 0.0006,  // can be absolute(ft) or relative(ε/D) if small
    // fluid & surface pressures
    rho,           // lbm/ft3
    muo,           // cP
    p_wh = 0,      // psi
    // spacing
    spacingMethod = 'Number of Points',
    spacingValue,
    // hint & model
    qHint,         // optional: use IPR max q if available
    frictionModel = 'Chen (1979)',
  } = params;

  if (![L, D_in, rho, muo].every(Number.isFinite)) return [];

  const thetaRad = (thetaDeg * Math.PI) / 180.0;
  const D_ft = D_in / 12;

  // Treat very small ε as relative roughness and convert to absolute(ft)
  // (e.g., user enters 0.0006 → absolute ε = 0.0006 * D_ft)
  let eps_ft = eps;
  if (eps <= 0.01) eps_ft = eps * D_ft;

  const gamma = rho / 62.4; // specific gravity
  const deltaP_PE = 0.433 * gamma * (L * Math.sin(thetaRad)); // psi

  const Re_of = (q: number) => Math.max(1, 1.4777 * rho * q / (D_in * muo));

  function fanning(Re: number): number {
    if (Re < 2100) return 16 / Re; // laminar
    switch (frictionModel as FrictionModel) {
      case 'Swamee-Jain': {
        const rel = eps_ft / D_ft;
        const fM = 0.25 / Math.pow(Math.log10(rel / 3.7 + 5.74 / Math.pow(Re, 0.9)), 2);
        return fM / 4;
      }
      case 'Colebrook-White': {
        const rel = eps_ft / D_ft;
        let fM = 0.02;
        for (let i = 0; i < 25; i++) {
          const rhs = -2 * Math.log10(rel / 3.7 + 2.51 / (Re * Math.sqrt(fM)));
          fM = 1 / (rhs * rhs);
        }
        return fM / 4;
      }
      case 'Laminar (auto)':
      case 'Chen (1979)':
      default: {
        const rel = eps_ft / D_ft;
        const A = -2 * Math.log10(
          rel / 3.7065
          - (5.0452 / Re) * Math.log10(Math.pow(rel, 1.1098) / 2.8257 + Math.pow(7.149 / Re, 0.8981))
        );
        const fM = 1 / (A * A);
        return fM / 4;
      }
    }
  }

  const frictionDP = (q: number) => {
    const Re = Re_of(q);
    const fF = fanning(Re);
    return 7.35e-7 * fF * rho * q * q * L / Math.pow(D_in, 5); // psi
  };

  // ---- choose q-range automatically (no q_max input) ----
  // Prefer IPR hint; otherwise pick a Reynolds-based span around Re≈1e5
  let qSpan = Number.isFinite(qHint) && qHint > 0
    ? (qHint as number) * 1.25
    : (1e5 * D_in * muo) / (1.4777 * rho) * 1.2; // ~Re=1e5

  // clamp to a reasonable plotting band
  qSpan = Math.min(Math.max(qSpan, 300), 20000);

  const points: { p_wf: number; q_o: number }[] = [];
  const defaultN = 25;
  const val = Number(spacingValue);

  if (spacingMethod === 'Delta Flowrate') {
    const dq = val > 0 ? val : Math.max(10, qSpan / defaultN);
    for (let q = 0; q <= qSpan + 1e-9; q += dq) {
      const p_wf = p_wh + deltaP_PE + frictionDP(q);
      points.push({ p_wf, q_o: q });
    }
  } else {
    const N = val > 0 ? val : defaultN;
    for (let i = 0; i < N; i++) {
      const frac = i / (N - 1);
      const q = qSpan * frac;
      const p_wf = p_wh + deltaP_PE + frictionDP(q);
      points.push({ p_wf, q_o: q });
    }
  }

  return points;
}

// --- OPR: Single-phase GAS (field units: q in Mscf/d, p=psia, D=in) --------
export function calculateGasOPR(params: any): { p_wf: number; q_o: number }[] {
  const {
    // geometry
    L,              // ft
    D_in,           // inches
    thetaDeg = 90,  // deg from horizontal (+ up)
    eps = 0.0006,   // absolute(ft) if >0.01 else relative -> converted below
    // gas props
    sg_g,           // specific gravity (air=1)  (dimensionless)
    T_surf,         // °F
    T_res,          // °F
    // surface pressure
    p_wh = 0,       // psia
    // spacing
    spacingMethod = 'Number of Points',
    spacingValue,
    // friction & z model
    frictionModel = 'Chen (1979)',
    zMethodCode,
  } = params;

  if (![L, D_in, sg_g, T_surf, T_res].every(Number.isFinite)) return [];

  const theta = (thetaDeg * Math.PI) / 180;
  const Dft = D_in / 12;
  const eps_ft = eps <= 0.01 ? eps * Dft : eps; // treat tiny ε as relative → absolute(ft)

  // --- helpers --------------------------------------------------------------
  const fanningLaminar = (Re: number) => 16 / Re;
  const fanningFromModel = (Re: number, rel: number) => {
    if (Re < 2100) return fanningLaminar(Re);
    switch (frictionModel as FrictionModel) {
      case 'Swamee-Jain': {
        const fM = 0.25 / Math.pow(Math.log10(rel / 3.7 + 5.74 / Math.pow(Re, 0.9)), 2);
        return fM / 4;
      }
      case 'Colebrook-White': {
        let fM = 0.02;
        for (let i = 0; i < 25; i++) {
          const rhs = -2 * Math.log10(rel / 3.7 + 2.51 / (Re * Math.sqrt(fM)));
          fM = 1 / (rhs * rhs);
        }
        return fM / 4;
      }
      case 'Laminar (auto)':
      case 'Chen (1979)':
      default: {
        const A = -2 * Math.log10(
          rel / 3.7065 -
            (5.0452 / Re) * Math.log10(Math.pow(rel, 1.1098) / 2.8257 + Math.pow(7.149 / Re, 0.8981))
        );
        const fM = 1 / (A * A);
        return fM / 4;
      }
    }
  };

  // Reynolds (field) for gas (q in Mscf/d, μ in cP, D in in)
  const reynoldsGas = (qMscfd: number, mu_cp: number) =>
    Math.max(1, 20.09 * sg_g * qMscfd / (D_in * mu_cp));

  // per-rate iteration: solve for p_wf using averages in the terms
  const iterate_pwf = (qM: number): number => {
    let p1 = Math.max(p_wh + 50, p_wh * 1.1); // initial guess
    for (let iter = 0; iter < 8; iter++) {
      const pAvg = 0.5 * (p1 + p_wh);
      const TAvgF = 0.5 * (T_surf + T_res);
      const TbarR = TAvgF + 459.67;

      const Zbar = z_PT(pAvg, TAvgF, sg_g, zMethodCode);
      const mu   = gas_visc_PT(pAvg, TAvgF, sg_g);
      const Re   = reynoldsGas(qM, mu);
      const fF   = fanningFromModel(Re, eps_ft / Dft);

      // inclined single-phase relation (field constants)
      // s = -0.0375 * sg_g * (L sinθ) / (Zbar * TbarR)
      const s = -0.0375 * sg_g * (L * Math.sin(theta)) / (Zbar * TbarR);
      const expNegS = Math.exp(-s);

      // p1^2 = e^{-s} p2^2 - 2.686e-3 * fF * Zbar * TbarR * q^2 / (D^5 sinθ) * (1 - e^{-s})
      const denomSin = Math.max(1e-9, Math.sin(theta)); // guard near-horizontal
      const term = 2.686e-3 * fF * Zbar * TbarR * (qM * qM) / (Math.pow(D_in, 5) * denomSin);
      const p1sq = expNegS * (p_wh * p_wh) - term * (1 - expNegS);

      p1 = p1sq > 0 ? Math.sqrt(p1sq) : 0;
    }
    return p1;
  };

  // choose a reasonable span (you can make this smarter later)
  const N = Number(spacingValue) > 0 ? Number(spacingValue) : 25;
  const qSpan = 5000; // Mscf/d default envelope

  const pts: { p_wf: number; q_o: number }[] = [];
  if (spacingMethod === 'Delta Flowrate') {
    const dq = Number(spacingValue) > 0 ? Number(spacingValue) : Math.max(25, qSpan / N);
    for (let q = 0; q <= qSpan + 1e-9; q += dq) pts.push({ p_wf: iterate_pwf(q), q_o: q });
  } else {
    for (let i = 0; i < N; i++) {
      const q = (qSpan * i) / (N - 1);
      pts.push({ p_wf: iterate_pwf(q), q_o: q });
    }
  }
  return pts;
}

export function calculateTwoPhaseOPR(_params: any): { p_wf: number; q_o: number }[] {
  return [];
}

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { gas_visc_PT, z_PT } from '../../../Correlations/GasCorrelations';
import { fanningFromModel } from '../friction';

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

  const frictionDP = (q: number) => {
    const Re = Re_of(q);
    const rel = eps_ft / D_ft;
    const fF = fanningFromModel(Re, rel, frictionModel);
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

export function calculateGasOPR(params: any): { p_wf: number; q_o: number }[] {
  const {
    // geometry
    L,              // ft
    D_in,           // inches
    thetaDeg = 90,  // deg from horizontal (+ up)
    eps = 0.0006,   // absolute(ft) if >0.01; else relative ε/D
    // gas props
    sg_g,           // dimensionless
    T_surf,         // °F
    T_res,          // °F
    // surface pressure
    p_wh = 0,       // psia
    // spacing
    spacingMethod = 'Number of Points',
    spacingValue,
    // friction & z model
    frictionModel = 'Chen (1979)',
    zMethodCode = 0,
  } = params;

  if (![L, D_in, sg_g, T_surf, T_res].every(Number.isFinite)) return [];
  // Solve p_wf per rate with averaged properties
  // inside calculateGasOPR
  const iterate_pwf = (qM: number): number => {
    if (qM < 0) return p_wh;

    const Nseg = 40;                      // 20–50 is fine
    const dL = L / Nseg;                  // ft
    const Dft = D_in / 12;                // ft
    const A = Math.PI * (Dft * Dft) / 4;  // ft^2
    const theta = (thetaDeg * Math.PI) / 180;
    const rel = eps <= 0.01 ? Number(eps) : Number(eps) / Dft; // ε/D
    const g_c = 32.174;                   // lbm·ft/(lbf·s^2)
    const Psc = 14.7;                     // psia
    const TscR = 520;                     // °R
    const Zsc = 1.0;

    const Qstd_scf_s = qM * 1000 / 86400; // std ft^3/s

    let p = p_wh;                         // start at wellhead, integrate downhole
    for (let i = 0; i < Nseg; i++) {
      // linear T profile along the string (use average of surface & reservoir)
      const frac = (i + 0.5) / Nseg;
      const T_F = T_surf + (T_res - T_surf) * frac;
      const T_R = T_F + 459.67;

      // real gas properties at local p,T
      const Z = z_PT(p, T_F, sg_g, zMethodCode);
      const mu_cp = gas_visc_PT(p, T_F, sg_g, 0, zMethodCode);  // cp
      const mu_lbmfts = mu_cp * 0.000672;                       // lbm/(ft·s)

      // std → actual volumetric flow at local P,T
      // ṅ = pQ/(ZRT) = p_sc Q_std/(Z_sc R T_sc)  =>  Q = Q_std * (Z T / p) * (p_sc/(Z_sc T_sc))
      const Qact_ft3_s = Qstd_scf_s * (Z * T_R / p) * (Psc / (Zsc * TscR));
      const V = Qact_ft3_s / A;                                 // ft/s

      // gas density (lbm/ft^3)
      const rho = (28.97 * sg_g * p) / (10.73 * Z * T_R);

      // Reynolds & fanning
      const Re = Math.max(1, (rho * V * Dft) / mu_lbmfts);
      const fF = fanningFromModel(Re, rel, frictionModel);

      // Darcy–Weisbach friction (psi)
      const dP_fric_psi = (4 * fF) * (dL / Dft) * (rho * V * V / (2 * g_c)) / 144;

      // elevation (psi)
      const dP_grav_psi = 0.433 * (rho / 62.4) * (dL * Math.sin(theta));

      p += dP_fric_psi + dP_grav_psi;
      if (!Number.isFinite(p)) return p_wh; // safety
    }
    return p;
  };


  // Build the curve
  const N = Number(spacingValue) > 0 ? Number(spacingValue) : 25;
  const qSpan = 5000; // default envelope (Mscf/d)

  const out: { p_wf: number; q_o: number }[] = [];
  if (spacingMethod === 'Delta Flowrate') {
    const dq = Number(spacingValue) > 0 ? Number(spacingValue) : Math.max(25, qSpan / N);
    for (let q = 0; q <= qSpan + 1e-9; q += dq) out.push({ p_wf: iterate_pwf(q), q_o: q });
  } else {
    for (let i = 0; i < N; i++) {
      const q = (qSpan * i) / (N - 1);
      out.push({ p_wf: iterate_pwf(q), q_o: q });
    }
  }
  return out;
}

export function calculateTwoPhaseOPR(_params: any): { p_wf: number; q_o: number }[] {
  return [];
}

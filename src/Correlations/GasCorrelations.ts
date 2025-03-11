// GasCorrelations.ts
// Comprehensive gas correlations converted from VBA.
// Valid for temperatures 100–340°F and pressures 100–8000 psia.

// --- Constants ---
export const Tabsolut = 310;  // Constant used in correlations (as in your oil correlations)
export const Mwair = 28.97;   // Molecular weight of air in g/mol

// --- Helper Functions ---

/**
 * Returns the pseudo-critical pressure and temperature for a gas.
 * This uses a default correlation (Standing’s) for natural gases.
 * (Optional method parameters and contaminant mole fractions are available but ignored in the default.)
 */
function getPseudoCritical(
  Sg_g: number,
  _methodC: number = 0,
  _methodA: number = 0,
  _YN2: number = 0,
  _YCO2: number = 0,
  _YH2S: number = 0
): { Ppc: number; Tpc: number } {
  // Default (Standing’s correlation for natural gas):
  // Tpc in Rankine and Ppc in psia.
  // Many correlations exist; here we use:
  //   Tpc = 168 + 325 * Sg_g   (Rankine)
  //   Ppc = 677 - 15 * Sg_g      (psia)
  const Tpc = 168 + 325 * Sg_g;
  const Ppc = 677 - 15 * Sg_g;
  return { Ppc, Tpc };
}

/**
 * Returns the reduced temperature (dimensionless).
 * Converts T (in °F) to absolute (Rankine) and divides by Tpc.
 */
function Tr_reduced(T: number, Tpc: number): number {
  const T_abs = T + 459.67; // Rankine
  return T_abs / Tpc;
}

/**
 * Returns the reduced pressure (dimensionless).
 */
function Pr_reduced(P: number, Ppc: number): number {
  return P / Ppc;
}

/**
 * Calculate gas density at test conditions.
 * Uses the ideal gas law with a compressibility correction.
 * P: pressure in psia, T: temperature in °F, Sg_g: gas specific gravity,
 * Z: compressibility factor.
 * Returns density in lbm/ft³.
 */
function gas_dens_PT(P: number, T: number, Sg_g: number, Z: number): number {
  const T_abs = T + 459.67; // Rankine
  const M = Sg_g * Mwair;   // molecular weight of gas
  // R = 10.731 psi*ft³/(lbm*R)
  return (P * M) / (Z * 10.731 * T_abs);
}

// --- Gas Viscosity Functions ---

/**
 * Calculates the gas viscosity at test conditions in cp.
 * Valid for T from 100–340°F and P from 100–8000 psia.
 *
 * @param P - Pressure in psia.
 * @param T - Temperature in °F.
 * @param Sg_g - Gas specific gravity (dimensionless).
 * @param methodv - Method for viscosity calculation:
 *                  0: Lee, Gonzales and Eakin-0 (default),
 *                  1: Lee, Gonzales and Eakin-1,
 *                  2: Lee, Gonzales and Eakin - modified,
 *                  3: Carr et al. 1954.
 * @param methodz - Method to calculate z factor (default 0).
 * @param methodC - Method for pseudo-critical pressure (default 0).
 * @param methodA - Method for pseudo-critical correction due to contaminants (default 0).
 * @param YN2, YCO2, YH2S - Mole fractions of contaminants (default 0).
 */
export function gas_visc_PT(
  P: number,
  T: number,
  Sg_g: number,
  methodv: number = 0,
  methodz: number = 0,
  methodC: number = 0,
  methodA: number = 0,
  YN2: number = 0,
  YCO2: number = 0,
  YH2S: number = 0
): number {
  const { Ppc, Tpc } = getPseudoCritical(Sg_g, methodC, methodA, YN2, YCO2, YH2S);
  const Tpr = Tr_reduced(T, Tpc);
  const Ppr = Pr_reduced(P, Ppc);
  //console.log("Ppr and Tpr in gas_visc_function:", Ppr, Tpr)
  const Z = z_gas(Ppr, Tpr, methodz);
  return gas_viscosity(P, T, Sg_g, Ppc, Tpc, Z, methodv, YN2, YCO2, YH2S);
}

/**
 * Calculates the gas viscosity (in cp) using several methods.
 */
function gas_viscosity(
  P: number,
  T: number,
  Sg_g: number,
  Ppc: number,
  Tpc: number,
  Z: number,
  methodv: number = 0,
  YN2: number = 0,
  YCO2: number = 0,
  YH2S: number = 0
): number {
  // Ensure the gas has a sufficient specific gravity.
  if (Sg_g < 0.56) {
    // Optionally, throw an error or return a default.
    return 0;
  }

  // Calculate gas density at test conditions (lbm/ft³).
  let gasdensPT = gas_dens_PT(P, T, Sg_g, Z);
  // Convert to g/cm³:
  // 1 lbm = 453.59237 g, 1 ft³ = 28316.8466 cm³
  const gasdens = (gasdensPT * 453.59237) / 28316.8466;

  // Molecular weight of gas.
  const Mwg = Sg_g * Mwair;

  let XK: number, x: number, Y: number;
  let gasVisc: number = 0;

  switch (methodv) {
    case 0: // Lee, Gonzales and Eakin-0 (1966)
      XK = (7.77 + 0.0063 * Mwg) * Math.pow(T + Tabsolut, 1.5) / (122.4 + 12.9 * Mwg + (T + Tabsolut));
      x = 2.57 + 1914.5 / (T + Tabsolut) + 0.0095 * Mwg;
      Y = 1.11 + 0.04 * x;
      gasVisc = (XK / 10000) * Math.exp(x * Math.pow(gasdens, Y));
      break;
    case 1: // Lee, Gonzales and Eakin-1 (1966)
      XK = (9.4 + 0.02 * Mwg) * Math.pow(T + Tabsolut, 1.5) / (209 + 19 * Mwg + (T + Tabsolut));
      x = 3.5 + 986 / (T + Tabsolut) + 0.01 * Mwg;
      Y = 2.4 - 0.2 * x;
      gasVisc = (XK / 10000) * Math.exp(x * Math.pow(gasdens, Y));
      break;
    case 2: // Lee, Gonzales and Eakin - modified (1966)
      XK = (9.379 + 0.01607 * Mwg) * Math.pow(T + Tabsolut, 1.5) / (209.2 + 19.26 * Mwg + (T + Tabsolut));
      x = 3.448 + 986.4 / (T + Tabsolut) + 0.01009 * Mwg;
      Y = 2.447 - 0.2224 * x;
      gasVisc = (XK / 10000) * Math.exp(x * Math.pow(gasdens, Y));
      break;
    case 3: // Carr et al. 1954
      {
        const gasViscPatm = gas_visc_Patm(T, Sg_g) + gas_visc_sour(Sg_g, YN2, YCO2, YH2S);
        const Ppr = Pr_reduced(P, Ppc);
        const Tpr = Tr_reduced(T, Tpc);
        const GasViscRatio = gas_visc_ratio(Ppr, Tpr);
        gasVisc = gasViscPatm * GasViscRatio;
      }
      break;
    default:
      gasVisc = 0;
  }
  return gasVisc;
}

/**
 * Calculates the gas viscosity at standard atmospheric pressure.
 * Based on: gas_visc_Patm = (1.709/100000 - 2.062/1000000 * Sg_g)*T + 8.188/1000 - 6.15/1000 * Log10(Sg_g)
 * Returns viscosity in cp.
 */
export function gas_visc_Patm(T: number, Sg_g: number): number {
  const log10_Sg = Math.log(Sg_g) / Math.LN10;
  return (1.709 / 100000 - 2.062 / 1000000 * Sg_g) * T + 8.188 / 1000 - 6.15 / 1000 * log10_Sg;
}

/**
 * Calculates the gas viscosity ratio (gas_visc_PT / gas_visc_Patm) using Carr et al.'s method.
 * PR: reduced pressure, TR: reduced temperature.
 */
export function gas_visc_ratio(PR: number, TR: number): number {
  let ln_Tr =
    -2.4621182 +
    2.970547414 * PR -
    0.286264054 * Math.pow(PR, 2) +
    0.00805420522 * Math.pow(PR, 3);
  ln_Tr +=
    TR *
    (2.80860949 -
      3.49803305 * PR +
      0.36037302 * Math.pow(PR, 2) -
      0.01044324 * Math.pow(PR, 3));
  ln_Tr +=
    Math.pow(TR, 2) *
    (-0.793385648 +
      1.39643306 * PR -
      0.149144925 * Math.pow(PR, 2) +
      0.00441015512 * Math.pow(PR, 3));
  ln_Tr +=
    Math.pow(TR, 3) *
    (0.0839387178 -
      0.186408848 * PR +
      0.0203367881 * Math.pow(PR, 2) -
      0.000609579263 * Math.pow(PR, 3));
  return Math.exp(ln_Tr) / TR;
}

/**
 * Sour gas correction for viscosity.
 * YN2, YCO2, YH2S are the mole fractions of N2, CO2, and H2S respectively.
 */
function gas_visc_sour(
  Sg_g: number,
  YN2: number = 0,
  YCO2: number = 0,
  YH2S: number = 0
): number {
  const log10_Sg = Math.log(Sg_g) / Math.LN10;
  const N2 = YN2 * (8.48 / 1000 * log10_Sg + 9.59 / 1000);
  const CO2 = YCO2 * (9.08 / 1000 * log10_Sg + 6.24 / 1000);
  const H2S = YH2S * (8.49 / 1000 * log10_Sg + 3.73 / 1000);
  return N2 + CO2 + H2S;
}

// --- Exports ---
// Export gas_visc_PT as the main entry point for gas viscosity calculations.
// ========================
// Gas z-factor correlations
// ========================

/**
 * Calculates the dimensionless compressibility factor z for a gas given P, T, and Sg_g.
 * Also calculates the pseudo-reduced pressure and temperature.
 * @param P Pressure in psia.
 * @param T Temperature in °F.
 * @param Sg_g Gas specific gravity (dimensionless).
 * @param methodz Method for z factor calculation:
 *                0: Dranchuk & Abou-Kassem 1975 (Default),
 *                1: Dranchuk, Purvis & Robinson 1974,
 *                2: Hall & Yarborough 1974,
 *                3: Redlich Kwong 1949,
 *                4: Brill & Beggs 1974,
 *                5: Chart interpolation.
 * @param methodC Method for pseudo-critical properties (default 0).
 * @param methodA Method for contaminant correction (default 0).
 * @param YN2 Mole fraction of N2.
 * @param YCO2 Mole fraction of CO2.
 * @param YH2S Mole fraction of H2S.
 * @returns The compressibility factor z.
 */
export function z_PT(
    P: number,
    T: number,
    Sg_g: number,
    methodz: number = 0,
    methodC: number = 0,
    methodA: number = 0,
    YN2: number = 0,
    YCO2: number = 0,
    YH2S: number = 0
  ): number {
    if (Sg_g >= 0.56) {
      // Assume getPseudoCritical is defined elsewhere (or define it similarly to your oil correlations)
      const { Ppc, Tpc } = getPseudoCritical(Sg_g, methodC, methodA, YN2, YCO2, YH2S);
      const Tpr = Tr_reduced(T, Tpc); // Reduced temperature (dimensionless)
      const Ppr = Pr_reduced(P, Ppc); // Reduced pressure (dimensionless)
      return z_gas(Ppr, Tpr, methodz); // 0,1,2,3 work
    } else {
      throw new Error("gas z-factor: Sg_g is less than 0.56");
    }
  }
  
  /**
   * Calculates the gas compressibility factor z using the pseudo reduced pressure and temperature.
   * @param P_pr Pseudo reduced pressure (dimensionless).
   * @param T_pr Pseudo reduced temperature (dimensionless).
   * @param method Method for z calculation (see z_PT documentation).
   * @returns z (dimensionless).
   */
  export function z_gas(P_pr: number, T_pr: number, method: number = 0): number {
    if (P_pr > 0 && T_pr > 0) {
        //console.log("debug in z_gas, value of method:", method) // other methods do not work right now!!!
      switch (method) {
        case 0:
          return Z_DAK1975(P_pr, T_pr); // Dranchuk & Abou-Kassem - 1975 (Default)
        case 1:
          return Z_DPR1974(P_pr, T_pr); // Dranchuk, Purvis & Robinson - 1974
        //case 2:
          //return Z_HallYarborough1974(P_pr, T_pr); // Hall & Yarborough - 1974
        case 3:
          return Z_RedlichKwong1949(P_pr, T_pr); // Redlich Kwong - 1949
        case 4:
          return Z_BrillBeggs1974(P_pr, T_pr); // Brill & Beggs - 1974
        //case 5:
          return Z_table(P_pr, T_pr); // Chart interpolation
        default:
          return NaN;
      }
    }
    return NaN;
  }
  
  /**
 * Dranchuk & Abou-Kassem (1975) correlation for z factor
 * using the recommended iterative approach in terms of rho_pr.
 *
 * Valid for: 0 < Ppr < 30, 1 < Tpr <= 3 (approx).
 */
  function Z_DAK1975(Ppr: number, Tpr: number): number {
    // Check domain
    if (!(Ppr > 0 && Ppr < 30 && Tpr > 1 && Tpr <= 3)) {
      throw new Error("Z_DAK1975: out of recommended correlation limits");
    }

    // DAK coefficients
    const A1 = 0.3265,
      A2 = -1.07,
      A3 = -0.5339,
      A4 = 0.01569,
      A5 = -0.05165,
      A6 = 0.5475,
      A7 = -0.7361,
      A8 = 0.1844,
      A9 = 0.1056,
      A10 = 0.6134,
      A11 = 0.721;

    // Start with a guess for rho_pr
    // Common practice: use the initial guess for Z ~ 0.27 * Ppr / (Tpr)
    // => rho_pr ~ Ppr / Z / Tpr, so guess Z=1 => rho_pr = 0.27 * Ppr / Tpr
    let rho_pr = 0.27 * (Ppr / Tpr);

    let iteration = 0;
    const maxIter = 100;
    const tol = 1e-6;

    while (iteration < maxIter) {
      const rhoOld = rho_pr;

      // 1) Compute polynomial coefficients
      const C1 = A1 + A2 / Tpr + A3 / (Tpr ** 3) + A4 / (Tpr ** 4) + A5 / (Tpr ** 5);
      const C2 = A6 + A7 / Tpr + A8 / (Tpr ** 2);
      const C3 = A9 * (A7 / Tpr + A8 / (Tpr ** 2));

      // 2) Evaluate Z from the current rho_pr
      //    Z = 1 + C1*rho + C2*rho^2 - C3*rho^5 + A10*(1 + A11*rho^2)*rho^2 / Tpr^3 * exp(-A11*rho^2)
      const rho2 = rho_pr * rho_pr;
      const rho5 = rho2 * rho2 * rho_pr;
      const C4 = A11 * rho2;
      const Z = 1
        + C1 * rho_pr
        + C2 * rho2
        - C3 * rho5
        + A10 * (1 + C4) * rho2 / (Tpr ** 3) * Math.exp(-C4);

      // 3) Update rho_pr from Z
      //    rho_pr = 0.27 * Ppr / (Z * Tpr)
      rho_pr = (0.27 * Ppr) / (Z * Tpr);

      // 4) Check convergence
      if (Math.abs(rho_pr - rhoOld) < tol) {
        // Converged
        // Return the final Z
        return Z;
      }

      iteration++;
    }

    // If we exit loop => not converged
    return 999; // or throw an Error
  }

  // Dranchuk, Purvis & Robinson (1974) using a similar fixed‐point scheme.
  function Z_DPR1974(Ppr: number, Tpr: number): number {
    if (!(Ppr > 0 && Ppr < 15 && Tpr > 1 && Tpr <= 3)) {
      throw new Error("Z_DPR1974: out of recommended correlation limits");
    }
    const A1 = 0.31506237,
      A2 = -1.0467099,
      A3 = -0.57832729,
      A4 = 0.53530771,
      A5 = -0.61232032,
      A6 = -0.10488813,
      A7 = 0.68157001,
      A8 = 0.68446549;
    const B1 = A1 + A2 / Tpr + A3 / Math.pow(Tpr, 3);
    const B2 = A4 + A5 / Tpr;
    const B3 = A5 * A6 / Tpr;
    const B4 = A7 / Math.pow(Tpr, 3);

    // Initial guess for ρₚᵣ.
    let rho_pr = 0.27 * (Ppr / Tpr);
    let iteration = 0;
    const maxIter = 100;
    const tol = 1e-6;
    let Z = 0;

    while (iteration < maxIter) {
      const B5 = A8 * rho_pr * rho_pr;
      Z =
        1 +
        B1 * rho_pr +
        B2 * Math.pow(rho_pr, 2) +
        B3 * Math.pow(rho_pr, 5) +
        B4 * (rho_pr * rho_pr) * (1 + B5) * Math.exp(-B5);
      const newRho = (0.27 * Ppr) / (Z * Tpr);
      if (Math.abs(newRho - rho_pr) < tol) return Z;
      rho_pr = newRho;
      iteration++;
    }
    return 999;
  }
  /*
  // Hall & Yarborough (1974) using Newton's method on an auxiliary variable Y.
  export function Z_HallYarborough1974(Ppr: number, Tpr: number): number {
    // Domain check
    if (!((Ppr > 0 && Ppr < 30 && Tpr > 1 && Tpr <= 3) || (Ppr < 1 && Tpr > 0.7 && Tpr < 1))) {
      throw new Error("Z_HallYarborough1974: out of recommended correlation limits");
    }
    const A = 0.06125 * Ppr * Tpr * Math.exp(-1.2 * Math.pow(1 - Tpr, 2));
    const b = Tpr * (14.76 - 9.76 * Tpr + 4.58 * Math.pow(Tpr, 2));
    const c = Tpr * (90.7 - 242.2 * Tpr + 42.4 * Math.pow(Tpr, 2));
    const d = 2.18 + 2.82 * Tpr;
  
    // Use Y as the iterative variable.
    // Instead of starting with Y = A, choose the minimum of A and 0.5 as initial guess.
    let Y = Math.min(A, 0.5);
    let iteration = 0;
    const maxIter = 100;
    const tol = 1e-6;
  
    while (iteration < maxIter) {
      // Instead of abruptly forcing Y to 0.6 when Y > 1,
      // gently bring it back into a plausible range.
      if (Y > 1) {
        Y = 0.9;
      }
      const numerator = Y + Math.pow(Y, 2) + Math.pow(Y, 3) - Math.pow(Y, 4);
      const denominator = Math.pow(1 - Y, 3);
      const F = numerator / denominator - b * Y * Y + c * Math.pow(Y, d) - A;
      
      // Derivative calculation:
      const N = Y + Math.pow(Y, 2) + Math.pow(Y, 3) - Math.pow(Y, 4);
      const Nprime = 1 + 2 * Y + 3 * Math.pow(Y, 2) - 4 * Math.pow(Y, 3);
      const D = Math.pow(1 - Y, 3);
      const Dprime = 3 * Math.pow(1 - Y, 2);
      const Fprime = (Nprime * D - N * Dprime) / (D * D) - 2 * b * Y + c * d * Math.pow(Y, d - 1);
      
      // Newton update
      const Ynew = Y - F / Fprime;
      if (Math.abs(Ynew - Y) < tol) {
        return A / Ynew; // z = A / Ynew
      }
      Y = Ynew;
      iteration++;
    }
    return 999; // Indicate failure to converge.
  }
  */

  // Redlich-Kwong (1949) using Newton's method on Z directly.
  export function Z_RedlichKwong1949(Ppr: number, Tpr: number): number {
    if (!(Ppr >= 0 && Ppr < 15 && Tpr > 1 && Tpr <= 3)) {
      throw new Error("Z_RedlichKwong1949: out of recommended correlation limits");
    }
    console.log("Ppr and Tpr in Z_RedlichKwong1949:", Ppr, Tpr)
    const u = Math.pow(2, 1 / 3) - 1;
    const A = Ppr / (9 * u * Math.pow(Tpr, 5 / 2));
    const b = (Ppr * u) / (3 * Tpr);
    const AB = Math.pow(Ppr, 2) / (27 * Math.pow(Tpr, 7 / 2));

    let Z = 1;
    let iteration = 0;
    const maxIter = 100;
    const tol = 1e-5;

    while (iteration < maxIter) {
      const Zold = Z;
      const f = Math.pow(Zold, 3) - Math.pow(Zold, 2) - (b * b + b - A) * Zold - AB;
      const df = 3 * Math.pow(Zold, 2) - 2 * Zold - (b * b + b - A);
      Z = Zold - f / df;
      if (Math.abs(Z - Zold) < tol) return Z;
      iteration++;
    }
    return 999;
  }
  
  /**
   * Brill & Beggs (1974) correlation for z factor.
   */
  function Z_BrillBeggs1974(P_pr: number, T_pr: number): number {
    if ((P_pr >= 0 && P_pr < 15) && (T_pr > 1.15 && T_pr <= 2.4)) {
      const A = 1.39 * Math.sqrt(T_pr - 0.92) - 0.36 * T_pr - 0.101;
      // Note: VBA code for B was modified; here we use the provided expression:
      const b = (0.62 - 0.23 * T_pr) * P_pr + (0.066 / (T_pr - 0.86) - 0.037) * Math.pow(P_pr, 2) + (0.32 * Math.pow(P_pr, 6)) / Math.pow(10, 9 * (T_pr - 1));
      const c = 0.132 - 0.32 * Math.log10(T_pr);
      const d = Math.pow(10, (0.3106 - 0.49 * T_pr + 0.1824 * Math.pow(T_pr, 2)));
      return A + (1 - A) / Math.exp(b) + c * Math.pow(P_pr, d);
    } else {
      throw new Error("Z_BrillBeggs1974: Out of correlation limits");
    }
  }
  
  /**
   * Table interpolation for z factor.
   * This function uses helper functions Z_xT and Z_xP and Z_tableData.
   */
  function Z_table(P_pr: number, T_pr: number): number {
    // Get interpolation variables from T_pr and P_pr
    const { xT, iColumn } = Z_xT(T_pr);
    const { xP, irow } = Z_xP(P_pr);
    // Retrieve the four surrounding table data values
    const A1 = Z_tableData(irow, iColumn);
    const A2 = Z_tableData(irow, iColumn + 1);
    const A3 = Z_tableData(irow + 1, iColumn);
    const A4 = Z_tableData(irow + 1, iColumn + 1);
    return A1 + xP * (A3 - A1) + xT * (A2 - A1) + xT * xP * ((A4 - A3) - (A2 - A1));
  }
  
  /**
   * Interpolates in T for table data.
   * Returns an object with xT (fractional distance) and iColumn (base column index).
   */
  function Z_xT(T_pr: number): { xT: number; iColumn: number } {
    const arr: number[] = [1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35, 1.4, 1.45, 1.5, 1.6, 1.7, 1.8, 1.9, 2, 2.2, 2.4, 2.6, 2.8, 3];
    let iColumn = 0;
    if (T_pr < 1.05 || T_pr > 3) {
      return { xT: 999, iColumn: 0 };
    } else {
      if (T_pr < 1.5) {
        iColumn = Math.floor((T_pr - 1) * 20 + 1);
      } else if (T_pr < 2) {
        iColumn = Math.floor((T_pr - 1) * 10 + 6);
      } else {
        iColumn = Math.floor((T_pr - 1) * 5 + 11);
      }
      if (T_pr === 3) {
        iColumn = 20;
      }
      // Adjust to zero-based index:
      iColumn = iColumn - 1;
      const lower = arr[iColumn];
      const upper = arr[iColumn + 1];
      const xT = (T_pr - lower) / (upper - lower);
      return { xT, iColumn };
    }
  }
  
  /**
   * Interpolates in P for table data.
   * Returns an object with xP (fractional distance) and irow (base row index).
   */
  function Z_xP(P_pr: number): { xP: number; irow: number } {
    const arr: number[] = [
      0, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85,
      0.9, 0.95, 1, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35, 1.4, 1.45, 1.5, 1.55, 1.6,
      1.65, 1.7, 1.75, 1.8, 1.85, 1.9, 1.95, 2, 2.05, 2.1, 2.15, 2.2, 2.25, 2.3, 2.35,
      2.4, 2.45, 2.5, 2.55, 2.6, 2.65, 2.7, 2.75, 2.8, 2.85, 2.9, 2.95, 3, 3.05, 3.1,
      3.15, 3.2, 3.25, 3.3, 3.35, 3.4, 3.45, 3.5, 3.55, 3.6, 3.65, 3.7, 3.75, 3.8, 3.85,
      3.9, 3.95, 4, 4.05, 4.1, 4.15, 4.2, 4.25, 4.3, 4.35, 4.4, 4.45, 4.5, 4.55, 4.6,
      4.65, 4.7, 4.75, 4.8, 4.85, 4.9, 4.95, 5, 5.05, 5.1, 5.15, 5.2, 5.25, 5.3, 5.35,
      5.4, 5.45, 5.5, 5.55, 5.6, 5.65, 5.7, 5.75, 5.8, 5.85, 5.9, 5.95, 6, 6.05, 6.1,
      6.15, 6.2, 6.25, 6.3, 6.35, 6.4, 6.45, 6.5, 6.55, 6.6, 6.65, 6.7, 6.75, 6.8, 6.85,
      6.9, 6.95, 7, 7.05, 7.1, 7.15, 7.2, 7.25, 7.3, 7.35, 7.4, 7.45, 7.5, 7.55, 7.6,
      7.65, 8, 9, 10, 11, 12, 13, 14, 15
    ];
    let irow = 0;
    if (P_pr < 0 || P_pr > 15) {
      return { xP: 999, irow: 0 };
    } else {
      if (P_pr < 0.2) {
        irow = 2;
      } else if (P_pr < 7.65) {
        irow = Math.floor(P_pr * 20 - 1);
      } else if (P_pr < 15) {
        irow = 152 + Math.floor(P_pr - 7);
      } else if (P_pr === 15) {
        irow = 159;
      }
      irow = irow - 1;
      const lower = arr[irow];
      const upper = arr[irow + 1];
      const xP = (P_pr - lower) / (upper - lower);
      return { xP, irow };
    }
  }
  
  /**
   * Returns table data for z-factor given row and column indices.
   * @param irow Row index (1-based).
   * @param iColumn Column index (1-based).
   */
  function Z_tableData(irow: number, iColumn: number): number {
    switch (iColumn) {
      case 1: return Z_tableData01(irow);
      case 2: return Z_tableData02(irow);
      case 3: return Z_tableData03(irow);
      case 4: return Z_tableData04(irow);
      case 5: return Z_tableData05(irow);
      case 6: return Z_tableData06(irow);
      case 7: return Z_tableData07(irow);
      case 8: return Z_tableData08(irow);
      case 9: return Z_tableData09(irow);
      case 10: return Z_tableData10(irow);
      case 11: return Z_tableData11(irow);
      case 12: return Z_tableData12(irow);
      case 13: return Z_tableData13(irow);
      case 14: return Z_tableData14(irow);
      case 15: return Z_tableData15(irow);
      case 16: return Z_tableData16(irow);
      case 17: return Z_tableData17(irow);
      case 18: return Z_tableData18(irow);
      case 19: return Z_tableData19(irow);
      case 20: return Z_tableData20(irow);
      default: return NaN;
    }
  }
  
  // --- Z_tableData functions --- //
  
  function Z_tableData01(irow: number): number {
    const myarray = [1, 0.938, 0.922, 0.905, 0.887, 0.868, 0.849, 0.829, 0.81, 0.79, 0.769, 0.747, 0.722, 0.698, 0.672, 0.645, 0.618, 0.59, 0.555, 0.52, 0.482, 0.444, 0.398, 0.351, 0.307, 0.273, 0.259, 0.254, 0.253, 0.251, 0.251, 0.252, 0.256, 0.26, 0.265, 0.27, 0.275, 0.28, 0.286, 0.292, 0.298, 0.305, 0.311, 0.318, 0.324, 0.33, 0.336, 0.343, 0.349, 0.356, 0.362, 0.369, 0.375, 0.381, 0.387, 0.394, 0.401, 0.407, 0.413, 0.42, 0.426, 0.432, 0.438, 0.445, 0.451, 0.458, 0.464, 0.471, 0.477, 0.483, 0.49, 0.497, 0.503, 0.509, 0.515, 0.522, 0.528, 0.534, 0.54, 0.547, 0.553, 0.56, 0.566, 0.572, 0.579, 0.586, 0.592, 0.599, 0.605, 0.612];
    return myarray[irow - 1];
  }
  
  function Z_tableData02(irow: number): number {
    const myarray = [1, 0.948, 0.934, 0.92, 0.905, 0.889, 0.872, 0.855, 0.839, 0.822, 0.804, 0.785, 0.767, 0.748, 0.729, 0.71, 0.69, 0.67, 0.647, 0.624, 0.602, 0.58, 0.555, 0.53, 0.505, 0.48, 0.453, 0.425, 0.409, 0.393, 0.386, 0.378, 0.374, 0.37, 0.37, 0.369, 0.369, 0.37, 0.371, 0.372, 0.374, 0.376, 0.378, 0.38, 0.383, 0.387, 0.39, 0.394, 0.398, 0.402, 0.406, 0.41, 0.414, 0.419, 0.424, 0.429, 0.434, 0.44, 0.446, 0.452, 0.457, 0.463, 0.469, 0.475, 0.481, 0.488, 0.494, 0.5, 0.505, 0.511, 0.517, 0.523, 0.529, 0.535, 0.541, 0.547, 0.552, 0.558, 0.564, 0.57, 0.575, 0.581, 0.587, 0.593, 0.598, 0.604, 0.61, 0.616, 0.621, 0.627, 0.633, 0.639, 0.644, 0.65, 0.655, 0.661, 0.666, 0.672, 0.677, 0.683, 0.689, 0.695, 0.7, 0.706, 0.712, 0.718, 0.723, 0.729, 0.734, 0.74, 0.745, 0.751, 0.756, 0.762, 0.768, 0.774, 0.779, 0.785, 0.79, 0.796, 0.801, 0.807, 0.812, 0.818, 0.824, 0.83, 0.835, 0.841, 0.846, 0.852, 0.857, 0.863, 0.868, 0.874, 0.879, 0.885, 0.89, 0.896, 0.901, 0.907, 0.912, 0.918, 0.923, 0.929, 0.934, 0.94, 0.945, 0.951, 0.956, 0.961, 0.966, 0.972, 0.977, 1.017, 1.125, 1.232, 1.339, 1.444, 1.547, 1.652, 1.754];
    return myarray[irow - 1];
  }
  
  function Z_tableData03(irow: number): number {
    const myarray = [1, 0.953, 0.941, 0.928, 0.914, 0.9, 0.887, 0.874, 0.862, 0.849, 0.835, 0.82, 0.806, 0.791, 0.776, 0.761, 0.748, 0.734, 0.719, 0.703, 0.688, 0.672, 0.656, 0.64, 0.623, 0.605, 0.588, 0.57, 0.556, 0.541, 0.529, 0.517, 0.507, 0.497, 0.489, 0.48, 0.474, 0.467, 0.462, 0.457, 0.454, 0.45, 0.449, 0.448, 0.448, 0.449, 0.45, 0.451, 0.454, 0.458, 0.46, 0.463, 0.467, 0.472, 0.476, 0.481, 0.485, 0.489, 0.494, 0.499, 0.503, 0.507, 0.511, 0.516, 0.52, 0.525, 0.53, 0.535, 0.539, 0.544, 0.548, 0.553, 0.558, 0.563, 0.568, 0.573, 0.577, 0.582, 0.587, 0.592, 0.596, 0.601, 0.606, 0.611, 0.616, 0.621, 0.626, 0.631, 0.636, 0.641, 0.646, 0.651, 0.655, 0.662, 0.667, 0.672, 0.677, 0.683, 0.688, 0.693, 0.698, 0.703];
    return myarray[irow - 1];
  }
  
  function Z_tableData04(irow: number): number {
    const myarray = [1, 0.959, 0.949, 0.938, 0.927, 0.916, 0.905, 0.894, 0.883, 0.872, 0.861, 0.85, 0.839, 0.827, 0.815, 0.802, 0.791, 0.78, 0.768, 0.755, 0.743, 0.731, 0.719, 0.707, 0.695, 0.682, 0.67, 0.657, 0.646, 0.634, 0.623, 0.612, 0.602, 0.592, 0.582, 0.572, 0.564, 0.555, 0.547, 0.539, 0.534, 0.528, 0.525, 0.522, 0.521, 0.52, 0.52, 0.519, 0.519, 0.52, 0.521, 0.522, 0.524, 0.526, 0.528, 0.53, 0.532, 0.534, 0.537, 0.54, 0.543, 0.546, 0.548, 0.551, 0.555, 0.559, 0.562, 0.566, 0.569, 0.572, 0.577, 0.582, 0.586, 0.59, 0.594, 0.599, 0.603, 0.608, 0.612, 0.616];
    return myarray[irow - 1];
  }
  
  function Z_tableData05(irow: number): number {
    const myarray = [1, 0.964, 0.955, 0.946, 0.937, 0.928, 0.919, 0.909, 0.9, 0.89, 0.881, 0.871, 0.861, 0.851, 0.842, 0.832, 0.823, 0.813, 0.803, 0.793, 0.783, 0.773, 0.763, 0.753, 0.743, 0.732, 0.721, 0.71, 0.701, 0.691, 0.682, 0.672, 0.664, 0.656, 0.648, 0.64, 0.634, 0.627, 0.62, 0.612, 0.607, 0.602, 0.598, 0.593, 0.59, 0.586, 0.583, 0.581, 0.58, 0.58, 0.579, 0.579, 0.579, 0.579, 0.58, 0.58, 0.581, 0.582, 0.584, 0.586, 0.588, 0.59, 0.592, 0.594, 0.597, 0.599, 0.602, 0.605, 0.608, 0.611, 0.614, 0.617, 0.62, 0.623, 0.627, 0.63, 0.633, 0.636, 0.64, 0.644, 0.648, 0.651, 0.655, 0.658, 0.662, 0.666, 0.67, 0.673, 0.677, 0.681, 0.685, 0.689, 0.693, 0.697];
    return myarray[irow - 1];
  }
  
  function Z_tableData06(irow: number): number {
    const myarray = [1, 0.969, 0.96, 0.951, 0.943, 0.934, 0.926, 0.918, 0.909, 0.9, 0.893, 0.885, 0.878, 0.87, 0.861, 0.852, 0.845, 0.838, 0.829, 0.82, 0.812, 0.804, 0.797, 0.789, 0.781, 0.772, 0.765, 0.757, 0.75, 0.742, 0.735, 0.728, 0.72, 0.712, 0.706, 0.699, 0.693, 0.687, 0.681, 0.674, 0.669, 0.663, 0.658, 0.652, 0.649, 0.645, 0.642, 0.638, 0.636, 0.633, 0.631, 0.629, 0.628, 0.627, 0.626, 0.625, 0.625, 0.624, 0.624, 0.625, 0.625, 0.626, 0.627, 0.628, 0.629, 0.631, 0.632, 0.633, 0.635, 0.637, 0.639, 0.641, 0.642, 0.644, 0.646, 0.649, 0.651, 0.653, 0.656, 0.659];
    return myarray[irow - 1];
  }
  
  function Z_tableData07(irow: number): number {
    const myarray = [1, 0.971, 0.964, 0.956, 0.949, 0.942, 0.934, 0.926, 0.919, 0.912, 0.905, 0.898, 0.89, 0.883, 0.876, 0.87, 0.863, 0.856, 0.849, 0.842, 0.836, 0.829, 0.823, 0.817, 0.81, 0.803, 0.797, 0.791, 0.785, 0.779, 0.773, 0.767, 0.761, 0.755, 0.75, 0.744, 0.738, 0.732, 0.727, 0.721, 0.716, 0.711, 0.707, 0.702, 0.699, 0.695, 0.692, 0.688, 0.685, 0.682, 0.68, 0.678, 0.676, 0.673, 0.672, 0.67, 0.67, 0.669, 0.669, 0.668, 0.668, 0.668, 0.668, 0.669, 0.669, 0.67, 0.67, 0.67, 0.672, 0.673, 0.675, 0.677, 0.678, 0.68, 0.681, 0.683, 0.685, 0.687, 0.689, 0.692];
    return myarray[irow - 1];
  }
  
  function Z_tableData08(irow: number): number {
    const myarray = [1, 0.974, 0.967, 0.961, 0.955, 0.949, 0.943, 0.937, 0.93, 0.923, 0.917, 0.911, 0.905, 0.899, 0.893, 0.887, 0.881, 0.875, 0.869, 0.862, 0.856, 0.85, 0.845, 0.839, 0.834, 0.828, 0.824, 0.817, 0.811, 0.805, 0.8, 0.795, 0.79, 0.784, 0.779, 0.774, 0.771, 0.767, 0.762, 0.757, 0.753, 0.748, 0.745, 0.741, 0.737, 0.733, 0.731, 0.728, 0.725, 0.722, 0.72, 0.718, 0.716, 0.713, 0.712, 0.71, 0.709, 0.707, 0.706, 0.705, 0.704, 0.703, 0.701, 0.702, 0.702, 0.703, 0.703, 0.704, 0.705, 0.706, 0.707, 0.708, 0.709, 0.71, 0.711, 0.713, 0.714, 0.716, 0.717, 0.719];
    return myarray[irow - 1];
  }
  
  function Z_tableData09(irow: number): number {
    const myarray = [1, 0.976, 0.97, 0.965, 0.959, 0.953, 0.948, 0.942, 0.937, 0.931, 0.926, 0.921, 0.916, 0.91, 0.905, 0.899, 0.895, 0.89, 0.885, 0.879, 0.874, 0.869, 0.864, 0.859, 0.855, 0.85, 0.846, 0.841, 0.837, 0.832, 0.828, 0.823, 0.819, 0.815, 0.811, 0.806, 0.803, 0.799, 0.795, 0.791, 0.788, 0.784, 0.781, 0.778, 0.775, 0.771, 0.768, 0.765, 0.763, 0.76, 0.758, 0.756, 0.754, 0.752, 0.75, 0.748, 0.747, 0.745, 0.744, 0.742, 0.742, 0.741, 0.741, 0.74, 0.74, 0.739, 0.739, 0.739, 0.739, 0.74, 0.74, 0.741, 0.741, 0.742, 0.742, 0.743, 0.744, 0.746, 0.747, 0.749];
    return myarray[irow - 1];
  }
  
  function Z_tableData10(irow: number): number {
    const myarray = [1, 0.979, 0.974, 0.969, 0.964, 0.959, 0.954, 0.949, 0.944, 0.939, 0.935, 0.93, 0.925, 0.92, 0.916, 0.911, 0.906, 0.901, 0.897, 0.893, 0.889, 0.884, 0.88, 0.876, 0.872, 0.868, 0.864, 0.859, 0.855, 0.851, 0.847, 0.843, 0.84, 0.837, 0.834, 0.83, 0.827, 0.824, 0.82, 0.818, 0.815, 0.811, 0.808, 0.805, 0.803, 0.8, 0.798, 0.796, 0.793, 0.791, 0.789, 0.787, 0.785, 0.783, 0.781, 0.779, 0.778, 0.777, 0.776, 0.775, 0.774, 0.773, 0.773, 0.772, 0.772, 0.771, 0.771, 0.771, 0.771, 0.771, 0.771, 0.772, 0.772, 0.773, 0.773, 0.774, 0.775, 0.776, 0.777, 0.779];
    return myarray[irow - 1];
  }
  
  function Z_tableData11(irow: number): number {
    const myarray = [1, 0.984, 0.98, 0.976, 0.972, 0.968, 0.964, 0.96, 0.956, 0.952, 0.949, 0.945, 0.942, 0.938, 0.935, 0.931, 0.927, 0.923, 0.92, 0.917, 0.913, 0.909, 0.905, 0.901, 0.898, 0.895, 0.892, 0.889, 0.886, 0.882, 0.88, 0.877, 0.874, 0.871, 0.869, 0.866, 0.864, 0.861, 0.859, 0.856, 0.854, 0.851, 0.85, 0.848, 0.846, 0.843, 0.842, 0.84, 0.839, 0.837, 0.835, 0.833, 0.832, 0.83, 0.829, 0.828, 0.827, 0.825, 0.823, 0.822, 0.822, 0.821, 0.82, 0.819, 0.819, 0.818, 0.818, 0.817, 0.817, 0.816, 0.816, 0.816, 0.816, 0.816, 0.816, 0.817, 0.817, 0.818, 0.819, 0.82];
    return myarray[irow - 1];
  }
  
  function Z_tableData12(irow: number): number {
    const myarray = [1, 0.987, 0.984, 0.981, 0.978, 0.975, 0.972, 0.969, 0.966, 0.963, 0.961, 0.958, 0.955, 0.952, 0.95, 0.947, 0.944, 0.941, 0.939, 0.936, 0.933, 0.93, 0.928, 0.925, 0.923, 0.92, 0.918, 0.915, 0.913, 0.91, 0.908, 0.905, 0.903, 0.9, 0.899, 0.897, 0.895, 0.893, 0.891, 0.889, 0.887, 0.885, 0.884, 0.882, 0.881, 0.879, 0.878, 0.876, 0.875, 0.873, 0.872, 0.871, 0.87, 0.869, 0.868, 0.867, 0.866, 0.864, 0.863, 0.862, 0.862, 0.861, 0.86, 0.859, 0.859, 0.858, 0.858, 0.858, 0.858, 0.857, 0.857, 0.856, 0.856, 0.855, 0.855, 0.855, 0.855, 0.856, 0.856, 0.857, 0.857, 0.859, 0.859, 0.861, 0.861, 0.862, 0.862, 0.864, 0.865, 0.867, 0.868, 0.869, 0.87, 0.872, 0.873, 0.875, 0.877, 0.879, 0.88, 0.882, 0.884, 0.886, 0.887, 0.889, 0.892, 0.894, 0.897, 0.899, 0.902, 0.904, 0.907, 0.909, 0.911, 0.913, 0.915, 0.918, 0.92, 0.922, 0.924, 0.927, 0.93, 0.931, 0.932, 0.936, 0.938, 0.941, 0.943, 0.945, 0.947, 0.95, 0.952, 0.955, 0.957, 0.96, 0.962, 0.965, 0.967, 0.97, 0.972, 0.975, 0.977, 0.98, 0.982, 0.985, 0.988, 0.991, 0.993, 0.996, 0.998, 1.017, 1.073, 1.13, 1.193, 1.243, 1.293, 1.341, 1.39];
    return myarray[irow - 1];
  }
  
  function Z_tableData13(irow: number): number {
    const myarray = [1, 0.99, 0.987, 0.985, 0.982, 0.98, 0.978, 0.976, 0.974, 0.971, 0.969, 0.967, 0.965, 0.962, 0.96, 0.958, 0.956, 0.953, 0.951, 0.949, 0.947, 0.945, 0.943, 0.941, 0.94, 0.938, 0.936, 0.934, 0.932, 0.93, 0.929, 0.927, 0.925, 0.923, 0.922, 0.921, 0.92, 0.918, 0.917, 0.915, 0.914, 0.912, 0.911, 0.909, 0.908, 0.907, 0.906, 0.904, 0.903, 0.902, 0.901, 0.9, 0.9, 0.899, 0.898, 0.897, 0.897, 0.896, 0.896, 0.895, 0.895, 0.894, 0.894, 0.893, 0.893, 0.892, 0.892, 0.891, 0.891, 0.89, 0.89, 0.89, 0.89, 0.891, 0.891, 0.891, 0.891, 0.892, 0.892, 0.893, 0.894, 0.895, 0.896, 0.897, 0.897, 0.898, 0.899, 0.9, 0.901, 0.902, 0.903, 0.904, 0.905, 0.907, 0.908, 0.91, 0.911, 0.912, 0.914, 0.916, 0.917, 0.919, 0.92, 0.923, 0.925, 0.926, 0.928, 0.929, 0.931, 0.933, 0.935, 0.937, 0.939, 0.94, 0.942, 0.944, 0.946, 0.948, 0.95, 0.952, 0.954, 0.956, 0.958, 0.96, 0.962, 0.964, 0.966, 0.968, 0.97, 0.972, 0.974, 0.976, 0.979, 0.981, 0.983, 0.985, 0.988, 0.99, 0.992, 0.994, 0.997, 0.999, 1.001, 1.003, 1.005, 1.007, 1.01, 1.012, 1.015, 1.017, 1.033, 1.084, 1.136, 1.19, 1.25, 1.308];
    return myarray[irow - 1];
  }
  
  function Z_tableData14(irow: number): number {
    const myarray = [1, 0.992, 0.99, 0.988, 0.986, 0.983, 0.981, 0.979, 0.978, 0.976, 0.974, 0.972, 0.971, 0.969, 0.967, 0.965, 0.963, 0.961, 0.96, 0.958, 0.957, 0.955, 0.954, 0.952, 0.951, 0.949, 0.947, 0.946, 0.945, 0.943, 0.942, 0.941, 0.94, 0.938, 0.937, 0.936, 0.935, 0.933, 0.932, 0.931, 0.93, 0.929, 0.928, 0.927, 0.927, 0.926, 0.925, 0.924, 0.923, 0.922, 0.922, 0.921, 0.921, 0.92, 0.92, 0.919, 0.919, 0.918, 0.918, 0.917, 0.917, 0.917, 0.917, 0.916, 0.916, 0.916, 0.916, 0.915, 0.915, 0.915, 0.915, 0.916, 0.916, 0.916, 0.916, 0.917, 0.917, 0.917, 0.917, 0.918];
    return myarray[irow - 1];
  }
  
  function Z_tableData15(irow: number): number {
    const myarray = [1, 0.994, 0.992, 0.99, 0.989, 0.987, 0.985, 0.983, 0.982, 0.981, 0.98, 0.978, 0.977, 0.975, 0.974, 0.972, 0.971, 0.97, 0.969, 0.967, 0.966, 0.964, 0.963, 0.962, 0.961, 0.96, 0.959, 0.957, 0.956, 0.954, 0.953, 0.952, 0.951, 0.95, 0.949, 0.948, 0.948, 0.947, 0.946, 0.945, 0.945, 0.944, 0.943, 0.942, 0.942, 0.941, 0.941, 0.941, 0.941, 0.94, 0.94, 0.939, 0.939, 0.938, 0.938, 0.938, 0.938, 0.938, 0.938, 0.937, 0.937, 0.937, 0.937, 0.937, 0.937, 0.937, 0.937, 0.937, 0.937, 0.937, 0.937, 0.937, 0.937, 0.937, 0.937, 0.938, 0.938, 0.939, 0.939, 0.94, 0.94, 0.941, 0.941, 0.942, 0.942, 0.943, 0.943, 0.944, 0.945, 0.946, 0.947, 0.948, 0.949, 0.95, 0.951, 0.952, 0.953, 0.954, 0.955, 0.957, 0.958, 0.96, 0.961, 0.963, 0.964, 0.966, 0.967, 0.969, 0.97, 0.972, 0.974, 0.976, 0.977, 0.979, 0.98, 0.982, 0.984, 0.986, 0.987, 0.989, 0.991, 0.993, 0.995, 0.997, 0.998, 1, 1.001, 1.003, 1.005, 1.007, 1.008, 1.01, 1.011, 1.013, 1.015, 1.017, 1.018, 1.02, 1.022, 1.024, 1.026, 1.028, 1.029, 1.031, 1.033, 1.035, 1.037, 1.039, 1.041, 1.043, 1.045, 1.058, 1.1, 1.144, 1.193, 1.243, 1.293, 1.341, 1.39];
    return myarray[irow - 1];
  }
  
  function Z_tableData16(irow: number): number {
    const myarray = [1, 0.996, 0.995, 0.994, 0.993, 0.992, 0.991, 0.99, 0.989, 0.988, 0.987, 0.986, 0.985, 0.984, 0.983, 0.983, 0.982, 0.981, 0.98, 0.979, 0.979, 0.978, 0.978, 0.977, 0.976, 0.975, 0.975, 0.974, 0.973, 0.972, 0.972, 0.971, 0.971, 0.97, 0.97, 0.969, 0.969, 0.968, 0.968, 0.967, 0.967, 0.966, 0.966, 0.965, 0.965, 0.964, 0.964, 0.963, 0.963, 0.963, 0.963, 0.962, 0.962, 0.962, 0.962, 0.962, 0.962, 0.962, 0.962, 0.962, 0.962, 0.962, 0.962, 0.962, 0.962, 0.963, 0.963, 0.963, 0.963, 0.964, 0.964, 0.965, 0.965, 0.966, 0.966, 0.967, 0.967, 0.968, 0.968, 0.969];
    return myarray[irow - 1];
  }
  
  function Z_tableData17(irow: number): number {
    const myarray = [1, 0.998, 0.998, 0.997, 0.997, 0.996, 0.995, 0.994, 0.994, 0.993, 0.993, 0.992, 0.992, 0.991, 0.991, 0.99, 0.99, 0.989, 0.989, 0.988, 0.988, 0.987, 0.987, 0.987, 0.986, 0.986, 0.986, 0.985, 0.985, 0.984, 0.984, 0.983, 0.983, 0.983, 0.983, 0.982, 0.982, 0.982, 0.982, 0.981, 0.981, 0.981, 0.981, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.981, 0.981, 0.981, 0.981, 0.982, 0.982, 0.982, 0.982, 0.983, 0.983, 0.984, 0.984, 0.985, 0.985, 0.986, 0.988, 0.989, 0.989, 0.99, 0.991, 0.992, 0.993];
    return myarray[irow - 1];
  }
  
  function Z_tableData18(irow: number): number {
    const myarray = [1, 0.999, 0.999, 0.999, 0.999, 0.998, 0.998, 0.998, 0.998, 0.997, 0.997, 0.997, 0.997, 0.997, 0.997, 0.996, 0.996, 0.996, 0.996, 0.996, 0.996, 0.996, 0.996, 0.996, 0.996, 0.996, 0.996, 0.996, 0.995, 0.995, 0.995, 0.995, 0.995, 0.995, 0.995, 0.995, 0.995, 0.995, 0.995, 0.995, 0.995, 0.995, 0.995, 0.995, 0.995, 0.995, 0.995, 0.995, 0.995, 0.995, 0.995, 0.995, 0.996, 0.996, 0.996, 0.996, 0.997, 0.997, 0.997, 0.997, 0.998, 0.998, 0.998, 0.998, 0.999, 0.999, 1, 1, 1, 1, 1.001, 1.001, 1.002, 1.002, 1.003, 1.004, 1.005, 1.006, 1.007, 1.008, 1.009, 1.01, 1.011, 1.012, 1.013, 1.013, 1.014, 1.015, 1.016, 1.017, 1.018, 1.019, 1.02, 1.021, 1.022, 1.023, 1.024, 1.025, 1.027, 1.028, 1.029, 1.03, 1.031, 1.032, 1.033, 1.034, 1.035, 1.036, 1.038, 1.039, 1.04, 1.041, 1.042, 1.043, 1.045, 1.046, 1.048, 1.049, 1.05, 1.051, 1.052, 1.053, 1.055, 1.056, 1.057, 1.058, 1.059, 1.06, 1.062, 1.063, 1.064, 1.065, 1.067, 1.068, 1.069, 1.07, 1.071, 1.072, 1.073, 1.075, 1.077, 1.078, 1.079, 1.08, 1.081, 1.082, 1.083, 1.084, 1.085, 1.086, 1.087, 1.088, 1.089, 1.091, 1.092, 1.093, 1.094, 1.095, 1.096, 1.098, 1.099, 1.1, 1.101, 1.11, 1.138, 1.167, 1.199, 1.232, 1.267, 1.301];
    return myarray[irow - 1];
  }
  
  function Z_tableData19(irow: number): number {
    const myarray = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.001, 1.001, 1.001, 1.001, 1.001, 1.001, 1.001, 1.001, 1.002, 1.002, 1.002, 1.002, 1.002, 1.002, 1.002, 1.002, 1.003, 1.003, 1.003, 1.003, 1.004, 1.004, 1.004, 1.004, 1.005, 1.005, 1.006, 1.006, 1.007, 1.007, 1.007, 1.007, 1.008, 1.008, 1.008, 1.008, 1.009, 1.009, 1.009, 1.009, 1.01, 1.01, 1.01, 1.01, 1.011, 1.011, 1.012, 1.012, 1.013, 1.013, 1.014, 1.014, 1.015, 1.015, 1.016, 1.016, 1.017, 1.017, 1.018, 1.019, 1.019, 1.019, 1.02, 1.021, 1.022, 1.022, 1.023, 1.023, 1.024,
      1.025, 1.026, 1.026, 1.027, 1.028, 1.029, 1.029, 1.03, 1.031, 1.032, 1.033, 1.034, 1.035, 1.036, 1.037, 1.038, 1.038, 1.039, 1.04, 1.041, 1.042, 1.043, 1.044, 1.045, 1.046, 1.047, 1.048, 1.049, 1.05, 1.051, 1.052, 1.053, 1.054, 1.055, 1.056, 1.057, 1.058, 1.059, 1.06, 1.061, 1.062, 1.063, 1.064, 1.065, 1.066, 1.067, 1.068, 1.069, 1.07, 1.072, 1.073, 1.074, 1.075, 1.077, 1.078, 1.079, 1.08, 1.081, 1.082, 1.083, 1.084, 1.086, 1.087, 1.088, 1.089, 1.091, 1.092, 1.093, 1.094, 1.096, 1.097, 1.106, 1.133, 1.1635, 1.199, 1.233, 1.269, 1.303];
    return myarray[irow - 1];
  }
  
  function Z_tableData20(irow: number): number {
    const myarray = [1, 1.001, 1.001, 1.001, 1.001, 1.002, 1.002, 1.002, 1.002, 1.003, 1.003, 1.004, 1.004, 1.005, 1.005, 1.006, 1.006, 1.007, 1.007, 1.008, 1.008, 1.008, 1.008, 1.009, 1.009, 1.01, 1.01, 1.01, 1.01, 1.011, 1.011, 1.012, 1.012, 1.012, 1.012, 1.013, 1.013, 1.014, 1.014, 1.015, 1.015, 1.016, 1.016, 1.017, 1.017, 1.018, 1.018, 1.019, 1.019, 1.02, 1.02, 1.021, 1.021, 1.022, 1.022, 1.023, 1.023, 1.024, 1.024, 1.025, 1.025, 1.026, 1.026, 1.027, 1.027, 1.028, 1.029, 1.03, 1.03, 1.031, 1.031, 1.032, 1.032, 1.033, 1.033, 1.034, 1.034, 1.035, 1.035, 1.036,
      1.036, 1.037, 1.037, 1.038, 1.039, 1.04, 1.04, 1.041, 1.042, 1.043, 1.043, 1.044, 1.045, 1.046, 1.047, 1.048, 1.048, 1.049, 1.05, 1.051, 1.051, 1.052, 1.052, 1.053, 1.053, 1.055, 1.056, 1.057, 1.058, 1.058, 1.059, 1.06, 1.061, 1.062, 1.063, 1.064, 1.065, 1.066, 1.067, 1.068, 1.069, 1.07, 1.071, 1.072, 1.072, 1.073, 1.074, 1.075, 1.076, 1.077, 1.078, 1.08, 1.081, 1.082, 1.083, 1.084, 1.085, 1.086, 1.087, 1.088, 1.089, 1.091, 1.092, 1.093, 1.094, 1.095, 1.096, 1.098, 1.099, 1.1, 1.101, 1.11, 1.138, 1.167, 1.199, 1.232, 1.267, 1.301, 1.333];
    return myarray[irow - 1];
  }
  
  // -------------------------------
  // Function descriptions (for documentation purposes)
  // -------------------------------
  
  export function describe_z_factor(): void {
    //const category = "MyPETEfunctions";
    // You might wish to log these or integrate with your documentation system.
    console.log("z_PT: Calculates the dimensionless compressibility factor z (with pseudo reduced conditions).");
    console.log("z_gas: Calculates z given pseudo reduced P and T.");
    console.log("Z_DAK1975: Dranchuk & Abou-Kassem (1975) correlation.");
    console.log("Z_DPR1974: Dranchuk, Purvis & Robinson (1974) correlation.");
    console.log("Z_HallYarborough1974: Hall & Yarborough (1974) correlation.");
    console.log("Z_RedlichKwong1949: Redlich Kwong (1949) correlation.");
    console.log("Z_BrillBeggs1974: Brill & Beggs (1974) correlation.");
    console.log("Z_table: Interpolated z value from chart data.");
    // (Additional descriptions for Z_xT, Z_xP, and table data functions can be added here.)
  }
  
// src/Correlations/OilCorrelations.ts
// This file contains oil property correlations (oil density, FVF, compressibility, gas–oil ratio, oil viscosity, and surface tension)
// Adapted from VBA code.

const Patm = 14.7;
const Tabsolut = 310; // used in correlations (e.g., ASTM)
const waterDensStd = 0.999012; // g/cc for water at standard conditions
const airDensStd = 0.0765;     // lbm/ft³ for air at standard conditions
const cfBbl = 5.615;          // conversion factor

export class CrudeOilCorrelations {
    static Patm = 14.7;
  // *********************
  // Basic Oil Property Correlations
  // *********************

  static Sg_API(API: number): number {
    return 141.5 / (131.5 + API);
  }

  static API_Sg(Sg_o: number): number {
    return Sg_o > 0 ? 141.5 / Sg_o - 131.5 : 0;
  }

  static oil_dens_PT(Sg_o: number, Sg_gdo: number, Rso: number, Bo: number): number {
    if (Bo > 0 && Rso >= 0) {
      return (Sg_o * waterDensStd + Sg_gdo * airDensStd * Rso / cfBbl) / Bo;
    }
    return 0;
  }

  static oil_Bo(
    P: number,
    T: number,
    Sg_o: number,
    Sg_g: number,
    Psat: number,
    Rso: number,
    Co: number,
    method: number = 0,
    Psep: number = 140,
    Tsep: number = 80
  ): number {
    let BoSat = this.Bo_saturated(T, Sg_o, Sg_g, Rso, method, Psep, Tsep);
    if ((P + Patm) > Psat) {
      BoSat = BoSat * Math.exp(Co * (Psat - (P + Patm)));
    }
    return BoSat;
  }

  static Bo_saturated(
    T: number,
    Sg_o: number,
    Sg_g: number,
    Rso: number,
    method: number = 0,
    Psep: number = 140,
    Tsep: number = 80
  ): number {
    let API: number, aux: number;
    let BoSat = 0;
    if (method === 0 || method === 1) {
      BoSat = 0.9759 + 0.00012 * Math.pow(Rso * Math.sqrt(Sg_g / Sg_o) + 1.25 * T, 1.2);
    } else if (method === 2) {
      API = this.API_Sg(Sg_o);
      aux = (T - 60) * (API / this.gas_Sg_100(API, Sg_g, Psep, Tsep));
      if (API > 30) {
        BoSat = 1 + 0.000467 * Rso + 0.000011 * aux + 0.1337 * 1e-8 * Rso * aux;
      } else {
        BoSat = 1 + 0.0004677 * Rso + 0.00001751 * aux - 1.8106 * 1e-8 * Rso * aux;
      }
    } else if (method === 3) {
      aux = Rso * Math.pow(Sg_g / Sg_o, 0.526) + 0.968 * T;
      aux = -6.58511 + 2.91329 * Math.log10(aux) - 0.27683 * Math.pow(Math.log10(aux), 2);
      BoSat = 1 + Math.pow(10, aux);
    } else if (method === 4) {
      aux = Math.pow(Rso, 0.3738) * Math.pow(Sg_g, 0.2914) / Math.pow(Sg_o, 0.6265) + 0.24626 * Math.pow(T, 0.5371);
      aux = Math.pow(aux, 3.0936);
      BoSat = 1.0113 + 0.000072046 * aux;
    } else if (method === 5) {
      // Not implemented; return dummy value
      BoSat = 1;
    }
    return BoSat;
  }

  static oil_Co(
    P: number,
    T: number,
    API: number,
    Sg_g: number,
    Psat: number,
    Rso_sat: number,
    method: number = 0,
    Psep: number = 140,
    Tsep: number = 80
  ): number {
    let A1: number, A2: number, A3: number, A4: number, A5: number, A6: number, Z: number;
    let Co: number = 0;
    if ((P + Patm) > Psat) {
      if (method === 0) {
        A1 = this.gas_Sg_100(API, Sg_g, Psep, Tsep);
        Co = (5 * Rso_sat - 1433 + 17.2 * T - 1180 * A1 + 12.61 * API) / ((P + Patm) * 100000);
      } else if (method === 1) {
        A1 = Math.log(API);
        A2 = Math.log(Sg_g);
        A3 = Math.log(Psat);
        A4 = Math.log((P + Patm) / Psat);
        A5 = Math.log(Rso_sat);
        A6 = Math.log(T);
        A1 = -13.25 + 13.75 * A1 - 4.8 * Math.pow(A1, 2) + 0.556 * Math.pow(A1, 3);
        A2 = -0.0718 - 0.0882 * A2 + 0.0422 * Math.pow(A2, 2) - 2 * Math.pow(A2, 3);
        A3 = 17.6 - 6.192 * A3 + 0.848 * Math.pow(A3, 2) - 0.0447 * Math.pow(A3, 3);
        A4 = 0.396 - 0.915 * A4 + 0.379 * Math.pow(A4, 2) - 0.0653 * Math.pow(A4, 3);
        A5 = -6.58 + 2.28 * A5 - 0.449 * Math.pow(A5, 2) + 0.0406 * Math.pow(A5, 3);
        A6 = -31 + 17.78 * A6 - 3.742 * Math.pow(A6, 2) + 0.282 * Math.pow(A6, 3);
        Z = A1 + A2 + A3 + A4 + A5 + A6;
        Co = (11.84 + 4.8 * Z + 1.5 * Math.pow(Z, 2) + 0.6 * Math.pow(Z, 3)) * Math.pow(10, -6);
      }
    }
    return Co;
  }

  static oil_Rso(
    P: number,
    T: number,
    API: number,
    Sg_g: number,
    Psat: number,
    method: number = 0,
    Psep: number = 140,
    Tsep: number = 80
  ): number {
    let Pcalc = P;
    if (Pcalc > Psat - Patm) {
      Pcalc = Psat - Patm;
    }
    let Rso = 0;
    if (method === 0) {
      Rso = this.Rso_Standing(Pcalc, T, API, Sg_g);
    } else if (method === 1) {
      Rso = this.Rso_Lasater(Pcalc, T, API, Sg_g);
    } else if (method === 2) {
      Rso = this.Rso_Vazquez(Pcalc, T, API, Sg_g, Psep, Tsep);
    } else if (method === 3) {
      Rso = this.Rso_Glaso(Pcalc, T, API, Sg_g);
    } else if (method === 4) {
      Rso = this.Rso_PetroskyFarshad(Pcalc, T, API, Sg_g);
    } else if (method === 5) {
      Rso = this.Rso_VelardeBlasingameMcCain(Pcalc, T, API, Sg_g, Psat);
      if (Pcalc > Psat - Patm) {
        Rso = this.Rso_5at(Psat - Patm, T, API, Sg_g);
      }
    }
    if (P <= 0) {
      Rso = 0;
    }
    return Rso;
  }

  static Rso_Standing(P: number, T: number, API: number, Sg_g: number): number {
    return Sg_g * Math.pow(((P + Patm) / 18.2 + 1.4) * Math.pow(10, 0.0125 * API - 0.00091 * T), 1 / 0.83);
  }

  static Rso_Lasater(P: number, T: number, API: number, Sg_g: number): number {
    const Sg_o = this.Sg_API(API);
    const A1 = Sg_g * (P + Patm) / (T + Tabsolut);
    const Yg = Math.log(A1 / 0.9131 + 1) / 2.475;
    const mw = 798.09426 / Math.exp(0.03165 * API);
    return ((350 * Sg_o * 379.3) / mw) * (Yg / (1 - Yg));
  }

  static Rso_Vazquez(P: number, T: number, API: number, Sg_g: number, Psep: number = 140, Tsep: number = 80): number {
    const A1 = this.gas_Sg_100(API, Sg_g, Psep, Tsep);
    const A2 = API / (T + Tabsolut);
    if (API > 30) {
      return (A1 * Math.pow(P + Patm, 1.187) / 56.06) * Math.pow(10, 10.393 * A2);
    } else {
      return (A1 * Math.pow(P + Patm, 1.0937) / 27.64) * Math.pow(10, 11.172 * A2);
    }
  }

  static Rso_Glaso(P: number, T: number, API: number, Sg_g: number): number {
    let A1 = (-1.7447 + Math.sqrt(1.7447 * 1.7447 - 4 * (-0.30218) * (1.7669 - Math.log10(P + Patm)))) / (2 * (-0.30218));
    A1 = Math.pow(10, A1);
    return Sg_g * Math.pow(A1 * Math.pow(API, 0.989) / Math.pow(T, 0.172), 1 / 0.816);
  }

  static Rso_PetroskyFarshad(P: number, T: number, API: number, Sg_g: number): number {
    const A1 = 0.0007916 * Math.pow(API, 1.541) - 0.00004561 * Math.pow(T, 1.3911);
    return Math.pow(((P + Patm) / 112.727 + 12.34) * Math.pow(Sg_g, 0.8439) * Math.pow(10, A1), 1.73184);
  }

  static Rso_VelardeBlasingameMcCain(P: number, T: number, API: number, Sg_g: number, Psat: number): number {
    const Rso_sat_calc = this.Rso_5at(Psat, T, API, Sg_g);
    const A1 = 0.000000973 * Math.pow(Sg_g, 1.672608) * Math.pow(API, 0.92987) * Math.pow(T, 0.247235) * Math.pow(Psat - 14.7, 1.056052);
    const A2 = 0.022339 * Math.pow(Sg_g, -1.00475) * Math.pow(API, 0.337711) * Math.pow(T, 0.132795) * Math.pow(Psat - 14.7, 0.302065);
    const A3 = 0.725167 * Math.pow(Sg_g, -1.48548) * Math.pow(API, -0.164741) * Math.pow(T, -0.09133) * Math.pow(Psat - 14.7, 0.047094);
    const PR = P / (Psat - 14.7);
    const Rsr = A1 * Math.pow(PR, A2) + (1 - A1) * Math.pow(PR, A3);
    return Rsr * Rso_sat_calc;
  }

  static Rso_5at(Psat: number, T: number, API: number, Sg_g: number): number {
    const tol = 1e-7;
    let i = 0;
    let Rso_5at_val = this.Rso_Standing(Psat - Patm, T, API, Sg_g);
    let Rso_x = this.Rso_Standing(Psat * 1.01 - Patm, T, API, Sg_g);
    let deriv = (Rso_x - Rso_5at_val) / (Psat * 0.01);
    let Psat_calc = this.P_saturation(T, API, Sg_g, Rso_5at_val, 5);
    while (Math.abs(Psat - Psat_calc) > tol && i < 30) {
      Rso_5at_val = Rso_5at_val + (Psat - Psat_calc) * deriv;
      Psat_calc = this.P_saturation(T, API, Sg_g, Rso_5at_val, 5);
      i++;
    }
    return Rso_5at_val;
  }

  // Stub: returns a dummy value for gas specific gravity at standard conditions
  static gas_Sg_100(API: number, Sg_g: number, Psep: number, Tsep: number): number {
    return 0.8;
  }

  // Stub: returns a dummy saturation pressure (psia)
  static P_saturation(T: number, API: number, Sg_g: number, Rso: number, method: number): number {
    return 1000;
  }

  // ================================
  // Oil Viscosity Correlations (in cp)
  // ================================

  static oil_visc_std(
    T: number,
    API: number,
    method: number = 0,
    T1?: number,
    oilVisc1?: number,
    T2?: number,
    oilVisc2?: number
  ): number {
    let A: number, b: number, c: number;
    switch (method) {
      case 0: // Beal
        A = 0.32 + 18000000 / Math.pow(10, Math.log10(API) * 4.53);
        b = 360 / (T + 200);
        c = Math.pow(10, 0.43 + 8.33 / API);
        return A * Math.pow(b, c);
      case 1: // Glaso
        A = 31410000000 * Math.pow(10, Math.log10(T) * (-3.444));
        b = 10.313 * Math.log10(T) - 36.447;
        return A * Math.pow(Math.log10(API), b);
      case 2: // Beggs & Robinson
        A = 3.0324 - 0.02023 * API;
        b = Math.pow(10, A);
        c = b * Math.pow(T, -1.163);
        return Math.pow(10, c) - 1;
      case 3: // Beggs & Robinson modified
        A = 1.8653 - 0.025086 * API;
        b = Math.pow(10, A);
        c = b * Math.pow(T, -0.5644);
        return Math.pow(10, c) - 1;
      case 4: // Bergman method (requires T1, oilVisc1, T2, oilVisc2)
        if (T1 === undefined || oilVisc1 === undefined || T2 === undefined || oilVisc2 === undefined) {
          throw new Error("Bergman method requires T1, oilVisc1, T2, and oilVisc2.");
        }
        b = (Math.log(Math.log(oilVisc2 + 1)) - Math.log(Math.log(oilVisc1 + 1))) / (Math.log(T2 + 310) - Math.log(T1 + 310));
        A = Math.log(Math.log(oilVisc1 + 1)) - b * Math.log(T1 + 310);
        return Math.exp(Math.exp(A + b * Math.log(T + 310))) - 1;
      case 5: // Bergman & Sutton
        return this.oil_visc_std_BS(T, API);
      case 6: // ASTM
        if (T1 === undefined || oilVisc1 === undefined || T2 === undefined || oilVisc2 === undefined) {
          throw new Error("ASTM method requires T1, oilVisc1, T2, and oilVisc2.");
        }
        return this.oil_visc_std_ASTM(T, API, T1, oilVisc1, T2, oilVisc2);
      default:
        throw new Error("Method out of range for standard oil viscosity.");
    }
  }

  static oil_visc_std_BS(T: number, API: number): number {
    let A: number, b: number, Sg_o: number, oil_dens_STD: number, oil_dens_T: number, alfa60: number, VCF: number, Kw: number, Mo: number, aux: number;
    let Tb: number, alfa: number, v1: number, v2: number, v100: number, v210: number, deltaSg: number, Sg_o_o: number, abs_x: number, F1: number, F2: number;
    let oilvis_100: number, oildens_100: number, oilvis_210: number, oildens_210: number;
    
    Sg_o = this.Sg_API(API);
    oil_dens_STD = 0.999012 * Sg_o;
    alfa60 = 0.0003410957 / Math.pow(oil_dens_STD, 2);
    alfa60 = (0.00025042 + 0.00008302 * oil_dens_STD) / Math.pow(oil_dens_STD, 2);
    VCF = Math.exp(-alfa60 * (T - 60) * (1 + 0.8 * alfa60 * (T - 60)));
    oil_dens_T = oil_dens_STD * VCF;
    Mo = 798.09426 / Math.exp(0.03165 * API);
    Kw = 4.5579 * Math.pow(Mo, 0.15178) * Math.pow(Sg_o, -0.84573);
    Kw = Math.pow(16.80642 * Math.exp(0.00016514 * Mo + 1.4103 * Sg_o - 0.00075152 * Mo * Sg_o) * Math.pow(Mo, 0.5369) * Math.pow(Sg_o, -0.7276), 0.3333) / Sg_o;
    Kw = Math.pow(2012.84 * Math.exp(-0.0018519 * Mo - 3.70833 * Sg_o + 0.00131441 * Mo * Sg_o) * Math.pow(Mo, 0.589485) * Math.pow(Sg_o, 3.36211), 0.3333) / Sg_o;
    Tb = Math.pow(Sg_o * Kw, 3);
    alfa = 1 - (0.533272 + 1.91017e-4 * Tb + 7.79681e-8 * Math.pow(Tb, 2) - 2.84376e-11 * Math.pow(Tb, 3) + 9.59468e27 * Math.pow(Tb, -13));
    aux = 2.40219 - 9.59688 * alfa + 3.45656 * Math.pow(alfa, 2) - 143.632 * Math.pow(alfa, 4);
    v2 = Math.exp(aux) + 0.152995;
    v1 = Math.exp(0.701254 + 1.38359 * Math.log(v2) + 0.103604 * Math.pow(Math.log(v2), 2));
    Sg_o_o = 0.843593 - 0.128624 * alfa - 3.36159 * Math.pow(alfa, 3) - 13749.5 * Math.pow(alfa, 12);
    deltaSg = Sg_o - Sg_o_o;
    abs_x = Math.abs(2.68316 - 62.0863 / Math.pow(Tb, 0.5));
    F2 = abs_x * deltaSg - 47.6033 * Math.pow(deltaSg, 2) / Math.pow(Tb, 0.5);
    aux = Math.log(v2 + 232.442 / Tb) * Math.pow((1 + 2 * F2) / (1 - 2 * F2), 2);
    v210 = Math.exp(aux) - 232.442 / Tb;
    F1 = 0.980633 * abs_x * deltaSg - 47.6033 * Math.pow(deltaSg, 2) / Math.pow(Tb, 0.5);
    aux = Math.log(v1 + 232.442 / Tb) * Math.pow((1 + 2 * F1) / (1 - 2 * F1), 2);
    v100 = Math.exp(aux) - 232.442 / Tb;
    VCF = Math.exp(-alfa60 * (100 - 60) * (1 + 0.8 * alfa60 * (100 - 60)));
    oildens_100 = 0.999012 * Sg_o * VCF;
    oilvis_100 = v100 * oildens_100;
    VCF = Math.exp(-alfa60 * (210 - 60) * (1 + 0.8 * alfa60 * (210 - 60)));
    oildens_210 = 0.999012 * Sg_o * VCF;
    oilvis_210 = v210 * oildens_210;
    b = (Math.log(Math.log(oilvis_210 + 1)) - Math.log(Math.log(oilvis_100 + 1))) / (Math.log(520) - Math.log(410));
    return Math.exp(Math.exp(Math.log(Math.log(oilvis_100 + 1)) + b * (Math.log(T + 310) - Math.log(410)))) - 1;
  }

  static oil_visc_std_ASTM(T: number, API: number, T1: number, oilVisc1: number, T2: number, oilVisc2: number): number {
    let A: number, b: number, ZT: number, ZT1: number, ZT2: number, k_vis: number;
    let Sg_o: number, oil_dens_STD: number, oil_dens_T: number, alfa60: number, VCF: number;
    Sg_o = this.Sg_API(API);
    oil_dens_STD = 0.999012 * Sg_o;
    alfa60 = 0.0003410957 / Math.pow(oil_dens_STD, 2);
    alfa60 = (0.00025042 + 0.00008302 * oil_dens_STD) / Math.pow(oil_dens_STD, 2);
    VCF = Math.exp(-alfa60 * (T - 60) * (1 + 0.8 * alfa60 * (T - 60)));
    oil_dens_T = oil_dens_STD * VCF;
    k_vis = oilVisc1 / oil_dens_T;
    ZT1 = k_vis + 0.7 + Math.exp(-1.47 - 1.84 * k_vis - 0.51 * k_vis * k_vis);
    k_vis = oilVisc2 / oil_dens_T;
    ZT2 = k_vis + 0.7 + Math.exp(-1.47 - 1.84 * k_vis - 0.51 * k_vis * k_vis);
    b = (Math.log(Math.log(ZT2)) - Math.log(Math.log(ZT1))) / (Math.log(T2 + Tabsolut) - Math.log(T1 + Tabsolut));
    A = (Math.log(Math.log(ZT1)) - b * Math.log(T1 + Tabsolut) + Math.log(Math.log(ZT2)) - b * Math.log(T2 + Tabsolut)) / 2;
    ZT = Math.exp(Math.exp(A + b * Math.log(T + Tabsolut)));
    k_vis = ZT - 0.7 - Math.exp(-0.7487 - 3.295 * (ZT - 0.7) + 0.6119 * Math.pow(ZT - 0.7, 2) - 0.3193 * Math.pow(ZT - 0.7, 3));
    return k_vis * oil_dens_T;
  }

  static oil_visc_saturated(oilViscStd: number, Rso: number, method: number = 0): number {
    let A: number, b: number;
    if (method === 0) {
      A = 10.715 * Math.pow(Rso + 100, -0.515);
      b = 5.44 * Math.pow(Rso + 150, -0.338);
      return A * Math.pow(oilViscStd, b);
    } else if (method === 1) {
      A = Math.pow(10, Rso * (2.2e-7 - 7.4e-4));
      b = 0.68 / Math.pow(10, 8.62e-5 * Rso) + 0.25 / Math.pow(10, 1.1e-3 * Rso) + 0.062 / Math.pow(10, 3.74e-3 * Rso);
      return A * Math.pow(oilViscStd, b);
    } else {
      throw new Error("Unsupported method for unsaturated viscosity.");
    }
  }

  static oil_visc_sat(oilViscPT: number, P: number, Psat: number, method: number = 0): number {
    let A: number;
    if (method === 0) {
      A = 0.024 * Math.pow(oilViscPT, 1.6) + 0.038 * Math.pow(oilViscPT, 0.56);
      return oilViscPT + (A * (P + Patm - Psat)) / 1000;
    } else if (method === 1) {
      A = 2.6 * Math.pow(P + Patm, 1.187) * Math.exp(-11.513 - 0.0000898 * (P + Patm));
      return oilViscPT * Math.pow((P + Patm) / Psat, A);
    } else {
      throw new Error("Unsupported method for saturated viscosity.");
    }
  }

  static oil_surft(P: number, T: number, API: number, method: number = 0): number {
    let surft_atm68F: number, surft_atm100F: number, factor: number;
    const xpressure = [0, 200, 400, 600, 1000, 1400, 2200, 2800];
    const yfactor = [100, 86, 73, 63, 48, 37, 20, 12];
    surft_atm68F = 39 - 0.2571 * API;
    surft_atm100F = 37.5 - 0.2571 * API;
    factor = this.Interpolation(xpressure, yfactor, P + Patm) / 100;
    if (T > 68 && T < 100) {
      return (surft_atm68F - (surft_atm68F - surft_atm100F) * (T - 68) / 32) * factor;
    } else {
      if (T <= 68) return surft_atm68F * factor;
      if (T >= 100) return surft_atm100F * factor;
    }
    return 0;
  }

  static oil_visc_PT(
    P: number,
    T: number,
    API: number,
    Psat: number,
    Rso: number,
    method1: number = 0,
    method2: number = 0,
    method3: number = 0,
    T1?: number,
    oilVisc1?: number,
    T2?: number,
    oilVisc2?: number
  ): number {
    // Calculate oil viscosity at standard conditions
    let oilViscPT = this.oil_visc_std(T, API, method1, T1, oilVisc1, T2, oilVisc2);

    if (P > 0) {
      // Adjust viscosity for saturated conditions
      oilViscPT = this.oil_visc_saturated(oilViscPT, Rso, method2);

      // Adjust viscosity for pressures above the bubble point
      if ((P + this.Patm) >= Psat) {
        oilViscPT = this.oil_visc_sat(oilViscPT, P, Psat, method3);
      }
    }

    return oilViscPT;
  }

  // Simple linear interpolation
  static Interpolation(x: number[], y: number[], x_val: number): number {
    let i = 0;
    while (i < x.length && x_val > x[i]) {
      i++;
    }
    if (i === 0) return y[0];
    if (i === x.length) return y[x.length - 1];
    const x1 = x[i - 1], x2 = x[i];
    const y1 = y[i - 1], y2 = y[i];
    return y1 + ((y2 - y1) * (x_val - x1)) / (x2 - x1);
  }

  // ================================
  // End Oil Viscosity Correlations
  // ================================

}

export const TabsolutConst = Tabsolut;

import { gas_visc_PT, z_PT } from "../../Correlations/GasCorrelations"

export function calculateIPR(params: any, iprPhase: string, flowRegime: string, zMethod: string) {
    const correlationMap: Record<string, number> = {
      'Dranchuk & Abou-Kassem - 1975': 0,
      'Dranchuk, Purvis & Robinson - 1974': 1,
      'Hall & Yarborough - 1974': 2,
      'Redlich Kwong - 1949': 3,
      'Brill & Beggs - 1974': 4,
      'Chart Interpolation': 5,
    };
    const zMethodCode = correlationMap[zMethod] ?? 0;
    params.zMethodCode = zMethodCode;

    if (iprPhase === 'Liquid') {
      switch (flowRegime) {
        case 'Transient':
          return oil_calculateTransientIPR(params);
        case 'Pseudosteady-State':
          return oil_calculatePseudosteadyIPR(params);
        case 'Steady-State':
          return oil_calculateSteadyStateIPR(params);
        default:
          return [];
      }
    } else if (iprPhase === 'Gas') {
      switch (flowRegime) {
        case 'Transient':
          return gas_calculateTransientIPR(params);
        case 'Pseudosteady-State':
          return gas_calculatePseudosteadyIPR(params);
        case 'Steady-State':
          return gas_calculateSteadyStateIPR(params);
        default:
          return [];
      }
    } else if (iprPhase === 'Two-phase') {
      switch (flowRegime) {
        case "Pseudosteady-State":
          return two_calculatePseudosteadyIPR(params);
    }}
    return [];
  }
  
  // For Transient
  function oil_calculateTransientIPR({
    k,
    h,
    Bo,
    muo,
    s,
    pi,
    t,
    phi,
    ct,
    rw,
    spacingMethod,
    spacingValue,
  }: any) {
    /*
      Typical formula:
      q_o = [ (k*h)/(162.6 * Bo * muo) ] * ( (pi - p_wf) / [ LogTerm ] )
      Where LogTerm = log(t) + log(k/(phi * muo * ct * rw^2)) - 3.23 + 0.869*s
    */
    const points = [];
    const method = spacingMethod || '';    // '' or 'NumPoints' or 'DeltaP' or 'DeltaQ'
    const val = spacingValue || 0;         // numeric user input
    const defaultN = 25;                 // fallback number of points
  
    const logTerm =
      Math.log(t) +
      Math.log(k / ((phi / 100) * muo * ct * rw * rw)) -
      3.23 +
      0.869 * s;
  
    const factor = (k * h) / (162.6 * Bo * muo);
  
    if (method === 'Number of Points') {
      const N = val > 0 ? val : defaultN; // if user typed 50, use 50. Otherwise 100
      for (let i = 0; i < N; i++) {
        const frac = i / (N - 1); // so last point is fraction=1
        const p_wf = pi * (1 - frac); // from pi down to 0.2 * pi
        const q_o = factor * (pi - p_wf) / logTerm;
        points.push({ p_wf, q_o });
      }
    } else if (method === "Delta Pressure") {
      const deltaP = val > 0 ? val : 100; // fallback if user didn't input
      let p_wf = pi;
      while (p_wf > 0) {
        const q_o = factor * (pi - p_wf) / logTerm;
        points.push({ p_wf, q_o });
        p_wf -= deltaP;
      }
    } else if (method === 'Delta Flowrate') {
      // We invert to solve for p_wf given q_o:
      // q_o = factor*(pi - p_wf)/logTerm => p_wf = pi - q_o*(logTerm/factor)
      const dq = val > 0 ? val : 50;
      // approximate max flow if p_wf=0
      const qMax = factor * pi / logTerm;
      for (let q = 0; q <= qMax; q += dq) {
        const p_wf = pi - (q * logTerm) / factor;
        if (p_wf < 0) break;
        points.push({ p_wf, q_o: q });
      }
    } else {
      // default approach if user didn't pick a spacing method
      const N = defaultN;
      for (let i = 0; i < N; i++) {
        const frac = i / (N - 1);
        const p_wf = pi * (1 - frac);
        const q_o = factor * (pi - p_wf) / logTerm;
        points.push({ p_wf, q_o });
      }
    }
  
    return points;
  }
  
  // Pseudosteady example
  function oil_calculatePseudosteadyIPR({
    k,
    h,
    Bo,
    muo,
    s,
    p_avg,
    re,
    rw,
    spacingMethod,
    spacingValue,
  }: any) {
    /*
      q_o = [ (k*h)/(141.2 * Bo * muo) ] * [1 / ( ln(re/rw) -0.75 + s ) ] * (p_avg - p_wf)
    */
    const points = [];
    const method = spacingMethod || '';
    const val = spacingValue || 0;
    const defaultN = 25;
  
    const denom = Math.log(re / rw) - 0.75 + s;
    const factor = (k * h) / (141.2 * Bo * muo) / denom;
  
    if (method === 'Number of Points') {
      const N = val > 0 ? val : defaultN;
      for (let i = 0; i < N; i++) {
        const frac = i / (N - 1);
        const p_wf = p_avg * (1 - frac);
        const q_o = factor * (p_avg - p_wf);
        points.push({ p_wf, q_o });
      }
    } else if (method === "Delta Pressure") {
      const deltaP = val > 0 ? val : 100;
      let p_wf = p_avg;
      while (p_wf > 0) {
        const q_o = factor * (p_avg - p_wf);
        points.push({ p_wf, q_o });
        p_wf -= deltaP;
      }
    } else if (method === 'Delta Flowrate') {
      // invert: q = factor*(p_avg - p_wf) => p_wf = p_avg - q/factor
      const dq = val > 0 ? val : 50;
      // approximate max flow if p_wf=0
      const qMax = factor * p_avg;
      for (let q = 0; q <= qMax; q += dq) {
        const p_wf = p_avg - q / factor;
        if (p_wf < 0) break;
        points.push({ p_wf, q_o: q });
      }
    } else {
      // default
      const N = defaultN;
      for (let i = 0; i < N; i++) {
        const frac = i / (N - 1);
        const p_wf = p_avg * (1 - frac);
        const q_o = factor * (p_avg - p_wf);
        points.push({ p_wf, q_o });
      }
    }
  
    return points;
  }
  
  // Steady example
  function oil_calculateSteadyStateIPR({
    k,
    h,
    Bo,
    muo,
    s,
    pe,
    re,
    rw,
    spacingMethod,
    spacingValue,
  }: any) {
    /*
      q_o = [ (k*h)/(141.2*Bo*muo ) ] * [1 / ( ln(re/rw) + s ) ] * (pe - p_wf)
    */
    const points = [];
    const method = spacingMethod || '';
    const val = spacingValue || 0;
    const defaultN = 25;
  
    const denom = Math.log(re / rw) + s;
    const factor = (k * h) / (141.2 * Bo * muo) / denom;
  
    if (method === 'Number of Points') {
      const N = val > 0 ? val : defaultN;
      for (let i = 0; i < N; i++) {
        const frac = i / (N - 1);
        const p_wf = pe * (1 - frac);
        const q_o = factor * (pe - p_wf);
        points.push({ p_wf, q_o });
      }
    } else if (method === 'Delta Pressure') {
      const deltaP = val > 0 ? val : 100;
      let p_wf = pe;
      while (p_wf > 0) {
        const q_o = factor * (pe - p_wf);
        points.push({ p_wf, q_o });
        p_wf -= deltaP;
      }
    } else if (method === 'Delta Flowrate') {
      // invert: q = factor*(pe - p_wf) => p_wf = pe - q/factor
      const dq = val > 0 ? val : 50;
      const qMax = factor * pe;
      for (let q = 0; q <= qMax; q += dq) {
        const p_wf = pe - q / factor;
        if (p_wf < 0) break;
        points.push({ p_wf, q_o: q });
      }
    } else {
      // default
      const N = defaultN;
      for (let i = 0; i < N; i++) {
        const frac = i / (N - 1);
        const p_wf = pe * (1 - frac);
        const q_o = factor * (pe - p_wf);
        points.push({ p_wf, q_o });
      }
    }
  
    return points;
  }
  
  function two_calculatePseudosteadyIPR({
    k,
    h,
    Bo,
    muo,
    s,
    p_avg,
    pb,   // Bubble point / saturation pressure (assumed already in psi)
    re,
    rw,
    a, // fetkovich to vogel
    spacingMethod,
    spacingValue,
  }: any) {

    const points: { p_wf: number; q_o: number }[] = [];
    const method = spacingMethod || '';
    const val = spacingValue || 0;
    const defaultN = 25;
  
    // Calculate productivity index
    const denom = Math.log(re / rw) - 0.75 + s;
    const J = (k * h) / (141.2 * Bo * muo) / denom;
  
    // For p_avg > pb, define q_bubble and q_vmax.
    const q_bubble = J * (p_avg - pb);
    const q_vmax = q_bubble / 1.8;
  
    // Piecewise function (same for both NumPoints and DeltaQ)
    function getFlow(p_wf: number): number {
      if (p_avg <= pb) {
        // Entire reservoir below bubble point:
        return (J * p_avg / (1+a)) * (1 - (1-a) * (p_wf / p_avg) - a * Math.pow(p_wf / p_avg, 2));
      } else {
        // p_avg > pb:
        if (p_wf >= pb) {
          return J * (p_avg - p_wf);
        } else {
          return J * (p_avg - pb) + (J * pb / (1+a)) * (1 - (1-a) * (p_wf / pb) - a * Math.pow(p_wf / pb, 2));
        }
      }
    }
  
    // DeltaQ inversion function
    function invertFlow(q: number): number | null {
      if (p_avg <= pb) {
        const A_sat = J * p_avg / (1+a);
        const A_coef = a;
        const B_coef = 1-a;
        const C_coef = (q / A_sat) - 1;
        const disc = B_coef * B_coef - 4 * A_coef * C_coef;
        if (disc < 0) return null;
        const sqrtDisc = Math.sqrt(disc);
        const x1 = (-B_coef + sqrtDisc) / (2 * A_coef);
        const x2 = (-B_coef - sqrtDisc) / (2 * A_coef);
        const candidates = [x1, x2].filter(x => x >= 0 && x <= 1);
        if (candidates.length === 0) return null;
        const x = Math.max(...candidates);
        return x * p_avg;
      } else {
        // p_avg > pb: first check if the flow falls in the single-phase (Darcy) region.
        const p_wf_single = p_avg - q / J;
        if (p_wf_single >= pb) {
          return p_wf_single;
        }
        //two phaseregion
        const Q_offset = J * (p_avg - pb);
        const A_vog = J * pb / (1+a);

        const A_coef = a;
        const B_coef = 1-a;
        const C_coef = ((q - Q_offset) / A_vog) - 1;
        const disc = B_coef * B_coef - 4 * A_coef * C_coef;
        if (disc < 0) return null;
        const sqrtDisc = Math.sqrt(disc);
        const x1 = (-B_coef + sqrtDisc) / (2 * A_coef);
        const x2 = (-B_coef - sqrtDisc) / (2 * A_coef);
        const candidates = [x1, x2].filter(x => x >= 0 && x <= 1);
        if (candidates.length === 0) return null;
        const x = Math.max(...candidates);
        return x * pb;
      }
    }
  
    // DeltaQ branch: step in flow increments (q) and invert to get p_wf.
    if (method === 'Delta Flowrate') {
      const dq = val > 0 ? val : 50;
      let qMax: number;
      if (p_avg <= pb) {
        // Saturated case: maximum flow occurs at p_wf = 0.
        qMax = (J * p_avg) / (1+a); 
      } else {
        // For p_avg > pb, maximum flow in single-phase is J*p_avg, while in Vogel region it's q_bubble + q_vmax.
        const q_singleMax = J * p_avg;
        const q_vogelMax = q_bubble + q_vmax;
        qMax = Math.max(q_singleMax, q_vogelMax);
      }
      
      for (let q = 0; q <= qMax; q += dq) {
        const p_wf = invertFlow(q);
        if (p_wf !== null) {
          points.push({ q_o: q, p_wf });
        }
      }
      return points;
    }
    // For NumPoints (or default) and DeltaP, use the forward approach.
    else if (method === 'Number of Points' || method === '') {
      const N = val > 0 ? val : defaultN;
      for (let i = 0; i < N; i++) {
        const frac = i / (N - 1);
        // For two-phase, span p_wf from p_avg down to 0.
        const p_wf = p_avg * (1 - frac);
        const q_o = getFlow(p_wf);
        points.push({ p_wf, q_o });
      }
      return points;
    } else if (method === "Delta Pressure") {
      const deltaP = val > 0 ? val : 100;
      let p_wf = p_avg;
      while (p_wf >= 0) {
        points.push({ p_wf, q_o: getFlow(p_wf) });
        p_wf -= deltaP;
      }
      return points;
    } else {
      return points;
    }
  
  }

    // New gas IPR function for pseudosteady-state gas flow.
    function gas_calculatePseudosteadyIPR({
      k, h, rw, re, s,
      T_res, sg_g,
      p_avg, pavg,                  // accept both just in case
      spacingMethod, spacingValue,
      zMethodCode,
    }: any): { p_wf: number; q_o: number }[] {
      // fallback alias + numeric coercion
      if (!Number.isFinite(p_avg)) p_avg = Number(pavg);

      // hard guards
      if (!Number.isFinite(p_avg) || p_avg <= 0) return [];
      if (!Number.isFinite(k) || k <= 0) return [];
      if (!Number.isFinite(h) || h <= 0) return [];
      if (!Number.isFinite(rw) || rw <= 0) return [];
      if (!Number.isFinite(re) || re <= rw) return [];
      if (!Number.isFinite(T_res)) return [];
      if (!Number.isFinite(sg_g)) return [];

      const denom = Math.log(re / rw) - 0.75 + s;
      if (!Number.isFinite(denom) || denom <= 0) return [];

      const J = (k * h) / (1424 * (T_res + 459.67) * denom);

      const points: { p_wf: number; q_o: number }[] = [];
      const methodUsed = spacingMethod || '';
      const val = spacingValue || 0;
      const N = val > 0 ? val : 25;

      const getGasFlow = (p_wf: number) => {
        const Pmid = (p_wf + p_avg) / 2;
        const mu = gas_visc_PT(Pmid, T_res, sg_g);
        const z  = z_PT(Pmid, T_res, sg_g, zMethodCode);
        if (!Number.isFinite(mu) || mu <= 0) return NaN;
        if (!Number.isFinite(z)  || z  <= 0) return NaN;
        return J * ((p_avg * p_avg - p_wf * p_wf) / (mu * z));
      };

      if (methodUsed === 'Number of Points' || methodUsed === '') {
        for (let i = 0; i < N; i++) {
          const frac = i / (N - 1);
          const p_wf = p_avg * (1 - frac);
          const q = getGasFlow(p_wf);
          if (Number.isFinite(q)) points.push({ p_wf, q_o: q });
        }
      } else if (methodUsed === 'Delta Pressure') {
        const dP = val > 0 ? val : 100;
        for (let p_wf = p_avg; p_wf >= 0; p_wf -= dP) {
          const q = getGasFlow(p_wf);
          if (Number.isFinite(q)) points.push({ p_wf, q_o: q });
        }
      }
      return points;
    }


    function gas_calculateSteadyStateIPR({
      k,
      h,
      rw,
      re,
      s,
      // Gas reservoir properties
      T_res,
      sg_g,
      pe,    // boundary pressure
      // UI spacing
      spacingMethod,
      spacingValue,
      // Model
      zMethodCode,
    }: any): { p_wf: number; q_o: number }[] {
      console.log("Case", zMethodCode);
      const J = (k * h) / (1424 * (T_res + 459.67) * (Math.log(re / rw) + s));
      console.log("J value", J);
      // 3) Prepare output
      const points: { p_wf: number; q_o: number }[] = [];
      const methodUsed = spacingMethod || "";
      const val = spacingValue || 0;
      const defaultN = 25;
    
      // 4) getGasFlow
      function getGasFlow(p_wf: number): number {
        const mu_avg = gas_visc_PT((p_wf+pe)/2, T_res, sg_g); //T in f
        const z_avg = z_PT((p_wf+pe)/2, T_res, sg_g, zMethodCode);   
        const delta_m = (Math.pow(pe,2) - Math.pow(p_wf,2))/(mu_avg * z_avg);
        return J * delta_m;
        } 
    
      // 5) spacing
      if (methodUsed === 'Number of Points' || methodUsed === '') {
        const N = val > 0 ? val : defaultN;
        for (let i = 0; i < N; i++) {
          // Here, we linearly span p_wf from p_avg down to 0.
          const frac = i / (N - 1);
          const p_wf = pe * (1 - frac);
          const q_o = getGasFlow(p_wf);
          console.log("gas flow value of:", q_o, "MCF/d");
          points.push({ p_wf, q_o });
        }
        return points;
      } else if (methodUsed === "Delta Pressure") {
        const deltaP = val > 0 ? val : 100;
        let p_wf = pe;
        while (p_wf >= 0) {
          const q_o = getGasFlow(p_wf);
          points.push({ p_wf, q_o });
          p_wf -= deltaP;
        }
        return points;
      } else {
        return points;
      }
    }
    
    function gas_calculateTransientIPR({
      k,
      h,
      rw,
      s,
      t,
      phi,
      ct,
      // Gas reservoir properties
      T_res,  // in °F
      sg_g,
      pi,     // initial reservoir pressure (psia)
      // UI / spacing
      spacingMethod,
      spacingValue,
      // Model selection
      zMethodCode,
    }: any): { p_wf: number; q_o: number }[] {
      // 2) Compute the "factor" from the transient formula
      console.log(zMethodCode);
      const logTerm =
        Math.log(t) + Math.log(k / (phi * 0.01 * gas_visc_PT(pi, T_res, sg_g) * ct * rw * rw)) - 3.23 + 0.869 * s;

      const factor = (k * h) / (1424 * (T_res + 459.67) * logTerm);
      // 3) Prepare the output array
      const points: { p_wf: number; q_o: number }[] = [];
      const methodUsed = spacingMethod || "";
      const val = spacingValue || 0;
      const defaultN = 25;
      // 4) Helper function: average gas properties between p_wf and pi, then compute Δm
      function getGasFlow(p_wf: number): number {
        const mu_avg = gas_visc_PT((p_wf+pi)/2, T_res, sg_g);
        //console.log("mu avg value of:", mu_avg);
        const z_avg = z_PT((p_wf+pi)/2, T_res, sg_g, zMethodCode);
        //console.log("z value of:", z_avg);
          const delta_m = (pi * pi - p_wf * p_wf) / (mu_avg * z_avg);
          return factor * delta_m;
        
      }
    
      // 5) Implement spacing methods
      if (methodUsed === 'Number of Points' || methodUsed === "") {
        const N = val > 0 ? val : defaultN;
        for (let i = 0; i < N; i++) {
          // linearly span from pi down to 0
          const frac = i / (N - 1);
          const p_wf = pi * (1 - frac); // e.g. from pi down to 0
          if (p_wf <= 0) break;
          const q_o = getGasFlow(p_wf); //mcf/d
          console.log("gas flow value of:", q_o, "MCF/d");
          points.push({ p_wf, q_o });
        }
        return points;
      } else if (methodUsed === "Delta Pressure") {
        const deltaP = val > 0 ? val : 100;
        let p_wf = pi;
        while (p_wf > 0) {
          const q_o = getGasFlow(p_wf); //mcf/d
          points.push({ p_wf, q_o });
          p_wf -= deltaP;
        }
        return points;
      } else {
        // we skip DeltaQ for simplicity
        return points;
      }
    }
    
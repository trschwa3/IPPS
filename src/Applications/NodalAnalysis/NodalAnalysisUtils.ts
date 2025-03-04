import { gas_visc_PT, z_PT } from "../../Correlations/GasCorrelations"

export function calculateIPR(params: any, iprPhase: string, flowRegime: string) {
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
  
    if (method === 'NumPoints') {
      const N = val > 0 ? val : defaultN; // if user typed 50, use 50. Otherwise 100
      for (let i = 0; i < N; i++) {
        const frac = i / (N - 1); // so last point is fraction=1
        const p_wf = pi * (1 - frac * 0.8); // from pi down to 0.2 * pi
        const q_o = factor * (pi - p_wf) / logTerm;
        points.push({ p_wf, q_o });
      }
    } else if (method === 'DeltaP') {
      const deltaP = val > 0 ? val : 100; // fallback if user didn't input
      let p_wf = pi;
      while (p_wf > 0) {
        const q_o = factor * (pi - p_wf) / logTerm;
        points.push({ p_wf, q_o });
        p_wf -= deltaP;
      }
    } else if (method === 'DeltaQ') {
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
        const p_wf = pi * (1 - frac * 0.8);
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
    pavg,
    re,
    rw,
    spacingMethod,
    spacingValue,
  }: any) {
    /*
      q_o = [ (k*h)/(141.2 * Bo * muo) ] * [1 / ( ln(re/rw) -0.75 + s ) ] * (pavg - p_wf)
    */
    const points = [];
    const method = spacingMethod || '';
    const val = spacingValue || 0;
    const defaultN = 25;
  
    const denom = Math.log(re / rw) - 0.75 + s;
    const factor = (k * h) / (141.2 * Bo * muo) / denom;
  
    if (method === 'NumPoints') {
      const N = val > 0 ? val : defaultN;
      for (let i = 0; i < N; i++) {
        const frac = i / (N - 1);
        const p_wf = pavg * (1 - frac * 0.8);
        const q_o = factor * (pavg - p_wf);
        points.push({ p_wf, q_o });
      }
    } else if (method === 'DeltaP') {
      const deltaP = val > 0 ? val : 100;
      let p_wf = pavg;
      while (p_wf > 0) {
        const q_o = factor * (pavg - p_wf);
        points.push({ p_wf, q_o });
        p_wf -= deltaP;
      }
    } else if (method === 'DeltaQ') {
      // invert: q = factor*(pavg - p_wf) => p_wf = pavg - q/factor
      const dq = val > 0 ? val : 50;
      // approximate max flow if p_wf=0
      const qMax = factor * pavg;
      for (let q = 0; q <= qMax; q += dq) {
        const p_wf = pavg - q / factor;
        if (p_wf < 0) break;
        points.push({ p_wf, q_o: q });
      }
    } else {
      // default
      const N = defaultN;
      for (let i = 0; i < N; i++) {
        const frac = i / (N - 1);
        const p_wf = pavg * (1 - frac * 0.8);
        const q_o = factor * (pavg - p_wf);
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
  
    if (method === 'NumPoints') {
      const N = val > 0 ? val : defaultN;
      for (let i = 0; i < N; i++) {
        const frac = i / (N - 1);
        const p_wf = pe * (1 - frac * 0.8);
        const q_o = factor * (pe - p_wf);
        points.push({ p_wf, q_o });
      }
    } else if (method === 'DeltaP') {
      const deltaP = val > 0 ? val : 100;
      let p_wf = pe;
      while (p_wf > 0) {
        const q_o = factor * (pe - p_wf);
        points.push({ p_wf, q_o });
        p_wf -= deltaP;
      }
    } else if (method === 'DeltaQ') {
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
        const p_wf = pe * (1 - frac * 0.8);
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
    pavg,
    pb,   // Bubble point / saturation pressure (assumed already in psi)
    re,
    rw,
    spacingMethod,
    spacingValue,
  }: any) {
    /*
      Two-phase pseudo-steady IPR:
        J = (k * h) / (141.2 * Bo * muo) / [ ln(re/rw) - 0.75 + s ]
        
        For p_wf >= pb (above bubble point):
           q = J * (pavg - p_wf)
        For p_wf < pb (below bubble point, Vogel region):
           q = q_bubble + q_vmax * (1 - 0.2*(p_wf/pb) - 0.8*(p_wf/pb)^2)
        where:
           q_bubble = J*(pavg - pb)
           q_vmax = q_bubble / 1.8
  
      In the saturated case (pavg ≤ pb) we use a pure Vogel:
           q = (J * pavg / 1.8) * [1 - 0.2*(p_wf/pavg) - 0.8*(p_wf/pavg)^2]
    */
  
    const points: { p_wf: number; q_o: number }[] = [];
    const method = spacingMethod || '';
    const val = spacingValue || 0;
    const defaultN = 25;
  
    // Calculate productivity index
    const denom = Math.log(re / rw) - 0.75 + s;
    const J = (k * h) / (141.2 * Bo * muo) / denom;
  
    // For pavg > pb, define q_bubble and q_vmax.
    const q_bubble = J * (pavg - pb);
    const q_vmax = q_bubble / 1.8;
  
    // Piecewise function (same for both NumPoints and DeltaQ)
    function getFlow(p_wf: number): number {
      if (pavg <= pb) {
        // Entire reservoir below bubble point:
        return (J * pavg / 1.8) * (1 - 0.2 * (p_wf / pavg) - 0.8 * Math.pow(p_wf / pavg, 2));
      } else {
        // pavg > pb:
        if (p_wf >= pb) {
          // Single-phase Darcy region:
          return J * (pavg - p_wf);
        } else {
          // Two-phase (Vogel) region:
          return J * (pavg - pb) + (J * pb / 1.8) * (1 - 0.2 * (p_wf / pb) - 0.8 * Math.pow(p_wf / pb, 2));
        }
      }
    }
  
    // DeltaQ inversion function
    function invertFlow(q: number): number | null {
      if (pavg <= pb) {
        // Saturated: invert q = (J*pavg/1.8) * [1 - 0.2*x - 0.8*x^2] where x = p_wf/pavg.
        const A_sat = J * pavg / 1.8;
        // Rearranged quadratic: 0.8*x^2 + 0.2*x + (q/A_sat - 1) = 0.
        const A_coef = 0.8;
        const B_coef = 0.2;
        const C_coef = (q / A_sat) - 1;
        const disc = B_coef * B_coef - 4 * A_coef * C_coef;
        if (disc < 0) return null;
        const sqrtDisc = Math.sqrt(disc);
        const x1 = (-B_coef + sqrtDisc) / (2 * A_coef);
        const x2 = (-B_coef - sqrtDisc) / (2 * A_coef);
        const candidates = [x1, x2].filter(x => x >= 0 && x <= 1);
        if (candidates.length === 0) return null;
        const x = Math.max(...candidates);
        return x * pavg;
      } else {
        // pavg > pb: first check if the flow falls in the single-phase (Darcy) region.
        const p_wf_single = pavg - q / J;
        if (p_wf_single >= pb) {
          return p_wf_single;
        }
        // Otherwise, in the two-phase (Vogel) region.
        // In this region: q = J*(pavg - pb) + (J*pb/1.8)*[1 - 0.2*(p_wf/pb) - 0.8*(p_wf/pb)^2].
        const Q_offset = J * (pavg - pb);
        const A_vog = J * pb / 1.8;
        // Solve: 0.8*x^2 + 0.2*x + ((q - Q_offset)/A_vog - 1) = 0, where x = p_wf / pb.
        const A_coef = 0.8;
        const B_coef = 0.2;
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
    if (method === 'DeltaQ') {
      const dq = val > 0 ? val : 50;
      let qMax: number;
      if (pavg <= pb) {
        // Saturated case: maximum flow occurs at p_wf = 0.
        qMax = (J * pavg) / 1.8;  // because getFlow(0) = J*pavg/1.8.
      } else {
        // For pavg > pb, maximum flow in single-phase is J*pavg, while in Vogel region it's q_bubble + q_vmax.
        const q_singleMax = J * pavg;
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
    else if (method === 'NumPoints' || method === '') {
      const N = val > 0 ? val : defaultN;
      for (let i = 0; i < N; i++) {
        const frac = i / (N - 1);
        // For two-phase, span p_wf from pavg down to 0.
        const p_wf = pavg * (1 - frac);
        const q_o = getFlow(p_wf);
        points.push({ p_wf, q_o });
      }
      return points;
    } else if (method === 'DeltaP') {
      const deltaP = val > 0 ? val : 100;
      let p_wf = pavg;
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
      k,
      h,
      rw,
      re,
      s,
      // Gas reservoir properties:
      T_res,    // Reservoir temperature (°F)
      sg_g,     // Gas specific gravity (dimensionless)
      p_avg,    // Average reservoir pressure (psia)
      // Spacing options:
      spacingMethod,
      spacingValue,
      // New parameter from the form:
      gasModel  // string: "muz" or "p_over_muz"
    }: any): { p_wf: number; q_o: number }[] {
      const J = (k * h) / (1424 * (T_res + 459.67) * (Math.log(re/rw) - 0.75 + s)); // T in rankine

      const points: { p_wf: number; q_o: number }[] = [];
      const methodUsed = spacingMethod || '';
      const val = spacingValue || 0;
      const defaultN = 25;

      function getGasFlow(p_wf: number): number {
        const mu_avg = (gas_visc_PT(p_wf, T_res, sg_g) + gas_visc_PT(p_avg, T_res, sg_g))/2 ; //T in f
        const z_avg = (z_PT(p_wf, T_res, sg_g) + z_PT(p_avg, T_res, sg_g))/2;   
      
        if (gasModel === "muz") {   
          const delta_m = (Math.pow(p_avg,2) - Math.pow(p_wf,2))/(mu_avg * z_avg);
          return J * delta_m;
      
        } else if (gasModel === "p_over_muz") {
          const delta_m = 2 * (p_avg - p_wf) * ((p_avg + p_wf)/ (2 * mu_avg * z_avg));
          return J * delta_m;
      
        } else {
          // fallback or error if user picks an unknown gasModel
          // e.g. return J * delta_m using "muz" as default
          const delta_m = (Math.pow(p_avg,2) - Math.pow(p_wf,2)) / (mu_avg * z_avg);
          return J * delta_m;
        }
      }
      
      // 5. Implement the spacing methods. (Here we show the "NumPoints" approach.)
      if (methodUsed === 'NumPoints' || methodUsed === '') {
        const N = val > 0 ? val : defaultN;
        for (let i = 0; i < N; i++) {
          // Here, we linearly span p_wf from p_avg down to 0.
          const frac = i / (N - 1);
          const p_wf = p_avg * (1 - frac);
          const q_o = getGasFlow(p_wf);
          points.push({ p_wf, q_o });
        }
        return points;
      } else if (methodUsed === 'DeltaP') {
        const deltaP = val > 0 ? val : 100;
        let p_wf = p_avg;
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
      gasModel,
    }: any): { p_wf: number; q_o: number }[] {
      // 2) Factor (like J). Suppose 1424 is the constant from your references
      const denom = Math.log(re / rw) + s;
      const factor = (k * h) / (1424 * (T_res + 459.67) * denom);
    
      // 3) Prepare output
      const points: { p_wf: number; q_o: number }[] = [];
      const methodUsed = spacingMethod || "";
      const val = spacingValue || 0;
      const defaultN = 25;
    
      // 4) getGasFlow
      function getGasFlow(p_wf: number): number {
        // average mu and z between p_wf and pe
        const mu_wf = gas_visc_PT(p_wf, T_res, sg_g);
        const mu_pe = gas_visc_PT(pe, T_res, sg_g);
        const mu_avg = (mu_wf + mu_pe) / 2;
    
        const z_wf = z_PT(p_wf, T_res, sg_g);
        const z_pe = z_PT(pe, T_res, sg_g);
        const z_avg = (z_wf + z_pe) / 2;
    
        if (gasModel === "muz") {
          // ∆m = (p_e^2 - p_wf^2)/(mu_avg * z_avg)
          const delta_m = (pe * pe - p_wf * p_wf) / (mu_avg * z_avg);
          return factor * delta_m;
        } else if (gasModel === "p_over_muz") {
          // ∆m = 2*(p_e - p_wf)*((p_e + p_wf)/(2*mu_avg*z_avg))
          const delta_m =
            2 * (pe - p_wf) * ((pe + p_wf) / (2 * mu_avg * z_avg));
          return factor * delta_m;
        } else {
          // default
          const delta_m = (pe * pe - p_wf * p_wf) / (mu_avg * z_avg);
          return factor * delta_m;
        }
      }
    
      // 5) spacing
      if (methodUsed === "NumPoints" || methodUsed === "") {
        const N = val > 0 ? val : defaultN;
        for (let i = 0; i < N; i++) {
          const frac = i / (N - 1);
          const p_wf = pe * (1 - frac); // from pe down to 0
          if (p_wf < 0) break;
          const q_o = getGasFlow(p_wf);
          points.push({ p_wf, q_o });
        }
        return points;
      } else if (methodUsed === "DeltaP") {
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
      gasModel,  // "muz" or "p_over_muz"
    }: any): { p_wf: number; q_o: number }[] {
      // 2) Compute the "factor" from the transient formula
      const logTerm =
        Math.log(t) +
        Math.log(k / (phi * 0.01 * gas_visc_PT(pi, T_res, sg_g) * ct * rw * rw)) -
        3.23 +
        0.869 * s;
      const z_method = 0; // change this and get diff. curves

      const factor = (k * h) / (1424 * (T_res + 459.67) * logTerm);
      const mu_pi = gas_visc_PT(pi, T_res, sg_g);
      const z_pi = z_PT(pi, T_res, sg_g, z_method);
      console.log("mui value of:", mu_pi);
      console.log("zi value of:", z_pi);
      // 3) Prepare the output array
      const points: { p_wf: number; q_o: number }[] = [];
      const methodUsed = spacingMethod || "";
      const val = spacingValue || 0;
      const defaultN = 25;
      // 4) Helper function: average gas properties between p_wf and pi, then compute Δm
      function getGasFlow(p_wf: number): number {
        // Compute average mu and z by sampling at p_wf and pi
        console.log("getting mu values")
        //console.log("pwf, pi, tres", p_wf, pi, T_res);
        const mu_wf = gas_visc_PT(p_wf, T_res, sg_g);
        const mu_avg = (mu_wf + mu_pi) / 2;
        console.log("mu avg value of:", mu_avg);
        const z_wf = z_PT(p_wf, T_res, sg_g, z_method);
        const z_avg = (z_wf + z_pi) / 2;
        console.log("z value of:", z_avg);
    
        if (gasModel === "muz") {
          // ∆m = (p_i^2 - p_wf^2) / (mu_avg * z_avg)
          const delta_m = (pi * pi - p_wf * p_wf) / (mu_avg * z_avg);
          return factor * delta_m;
        } else if (gasModel === "p_over_muz") {
          // ∆m = 2*(p_i - p_wf)*((p_i + p_wf)/(2 * mu_avg * z_avg))
          const delta_m =
            2 * (pi - p_wf) * ((pi + p_wf) / (2 * mu_avg * z_avg));
          return factor * delta_m;
        } else {
          // Default to "muz" if not specified
          const delta_m = (pi * pi - p_wf * p_wf) / (mu_avg * z_avg);
          return factor * delta_m;
        }
      }
    
      // 5) Implement spacing methods
      if (methodUsed === "NumPoints" || methodUsed === "") {
        const N = val > 0 ? val : defaultN;
        for (let i = 0; i < N; i++) {
          // linearly span from pi down to 0
          const frac = i / (N - 1);
          const p_wf = pi * (1 - frac); // e.g. from pi down to 0
          if (p_wf < 14.7) break;
          const q_o = getGasFlow(p_wf);
          points.push({ p_wf, q_o });
        }
        return points;
      } else if (methodUsed === "DeltaP") {
        const deltaP = val > 0 ? val : 100;
        let p_wf = pi;
        while (p_wf >= 14.7) {
          const q_o = getGasFlow(p_wf);
          points.push({ p_wf, q_o });
          p_wf -= deltaP;
        }
        return points;
      } else {
        // we skip DeltaQ for simplicity
        return points;
      }
    }
    
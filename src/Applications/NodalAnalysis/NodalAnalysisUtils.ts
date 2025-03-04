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
      return calculateGasIPR(params);
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
  
  // Gas and Two-phase stubs
  function calculateGasIPR(_params: any) {
    // ...
    return [];
  }
  function two_calculatePseudosteadyIPR({
    k,
    h,
    Bo,
    muo,
    s,
    pavg,
    pb,   // Bubble point / saturation pressure (assumed to be in psi, or converted beforehand)
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
    */
  
    const points: { p_wf: number; q_o: number }[] = [];
    const method = spacingMethod || '';
    const val = spacingValue || 0;
    const defaultN = 25;
  
    // Calculate productivity index
    const denom = Math.log(re / rw) - 0.75 + s;
    const J = (k * h) / (141.2 * Bo * muo) / denom;
  
    // Calculate flow at bubble point and Vogel's maximum extra flow
    const q_bubble = J * (pavg - pb);
    const q_vmax = q_bubble / 1.8;
  
    // Helper function to calculate q for a given p_wf (piecewise)
    function getFlow(p_wf: number): number {
      if (p_wf >= pb) {
        return J * (pavg - p_wf);
      } else {
        return q_bubble + q_vmax * (1 - 0.2 * (p_wf / pb) - 0.8 * Math.pow(p_wf / pb, 2));
      }
    }
  
    // Here we implement the "NumPoints" approach (the default) similar to oil_calculatePseudosteadyIPR
    if (method === 'NumPoints' || method === '') {
      const N = val > 0 ? val : defaultN;
      for (let i = 0; i < N; i++) {
        // For two-phase, you might choose p_wf from pavg down to a minimum of 0
        const frac = i / (N - 1);
        const p_wf = pavg * (1 - frac); // Linear spacing from pavg to 0
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
    } else if (method === 'DeltaQ') {
      // DeltaQ method: step in flow increments and invert the piecewise function.
      // (See previous implementation for the inversion logic.)
      const dq = val > 0 ? val : 50;
      const q_singleMax = J * pavg;
      const q_vogelMax = q_bubble + q_vmax;
      const qMax = Math.max(q_singleMax, q_vogelMax);
      
      // Use a helper that inverts q->p_wf (see previous code)
      function invertFlow(q: number): number | null {
        // Check single-phase inversion first:
        const p_wf_single = pavg - q / J;
        if (pavg > pb && p_wf_single >= pb) {
          return p_wf_single;
        }
        // Otherwise, solve the Vogel quadratic:
        // q - q_bubble = q_vmax * [1 - 0.2*x - 0.8*x^2], where x = p_wf/pb.
        const A = 0.8;
        const B = 0.2;
        const C = (q - q_bubble) / q_vmax - 1;
        const discriminant = B * B - 4 * A * C;
        if (discriminant < 0) return null;
        const sqrtD = Math.sqrt(discriminant);
        const x1 = (-B + sqrtD) / (2 * A);
        const x2 = (-B - sqrtD) / (2 * A);
        const candidates = [x1, x2].filter((x) => x >= 0 && x <= 1);
        if (candidates.length === 0) return null;
        const x = Math.max(...candidates);
        return x * pb;
      }
  
      for (let q = 0; q <= qMax; q += dq) {
        const p_wf = invertFlow(q);
        if (p_wf !== null) {
          points.push({ q_o: q, p_wf });
        }
      }
      return points;
    } else {
      return points;
    }
  }
  
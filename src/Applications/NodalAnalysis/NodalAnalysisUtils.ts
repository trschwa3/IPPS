// src/Applications/NodalAnalysis/NodalAnalysisUtils.ts
export function calculateIPR(params: any, iprPhase: string, flowRegime: string) {
    if (iprPhase === 'Liquid') {
      switch (flowRegime) {
        case 'Transient':
          return calculateTransientIPR(params);
        case 'Pseudosteady-State':
          return calculatePseudosteadyIPR(params);
        case 'Steady-State':
          return calculateSteadyStateIPR(params);
        default:
          return [];
      }
    } else if (iprPhase === 'Gas') {
      return calculateGasIPR(params);
    } else if (iprPhase === 'Two-phase') {
      return calculateTwoPhaseIPR(params);
    }
    return [];
  }
  
  // For Transient, we assume the user provided t, phi, ct, etc.
  function calculateTransientIPR({
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
  }: any) {
    /*
      q_o = (k * h / (162.6 * Bo * muo)) *
            [ log(t) + log(k / (phi * muo * ct * rw^2)) - 3.23 + 0.87 * s ] *
            (pi - p_wf)
    */
    const points = [];
    const n = 10;
    for (let i = 0; i < n; i++) {
      const frac = i / n;
      // bottomhole pressure from pi down to 0.2 pi
      const p_wf = pi * (1 - frac * 0.8);
  
      // Evaluate the log portion
      // Adjust constants if your reference uses -7.432 or 3.23
      const logTerm =
        Math.log(t) +
        Math.log(k / ((phi/100) * muo * ct * rw * rw)) -
        3.23 + 0.869 * s;
  
      const q_o =
        ((k * h) * (pi - p_wf) / (162.6 * Bo * muo)) /
        logTerm
        ;
  
      points.push({ p_wf, q_o });
    }
    return points;
  }
  
  // Pseudosteady: re, rw, s, etc.
  function calculatePseudosteadyIPR({
    k,
    h,
    Bo,
    muo,
    s,
    pavg, // or pi
    re,
    rw,
  }: any) {
    /* 
       q_o = (k*h) / (141.2 * Bo * muo) *
             [1 / ( ln(re/rw) - 0.75 + s )] *
             ( pavg - p_wf )
    */
    const points = [];
    const denom = Math.log(re / rw) - 0.75 + s;
    const n = 10;
    for (let i = 0; i < n; i++) {
      const fraction = i / n;
      // from pavg down to 0.2 of pavg, for example
      const p_wf = pavg * (1 - fraction * 0.8);
  
      const q_o =
        ((k * h) / (141.2 * Bo * muo)) *
        (1 / denom) *
        (pavg - p_wf);
  
      points.push({ p_wf, q_o });
    }
    return points;
  }
  
  
  function calculateSteadyStateIPR({
    k,
    h,
    Bo,
    muo,
    s,
    pe, // boundary reservoir pressure
    re,
    rw,
  }: any) {
    const points = [];
    const denom = Math.log(re / rw) + s;
    const n = 10;
    for (let i = 0; i < n; i++) {
      const fraction = i / n;
      // e.g. from pe down to 0.2 * pe
      const p_wf = pe * (1 - fraction * 0.8);
  
      const q_o =
        ((k * h) / (141.2 * Bo * muo)) *
        (1 / denom) *
        (pe - p_wf);
  
      points.push({ p_wf, q_o });
    }
    return points;
  }
  
  
  function calculateGasIPR(params: any) {
    // Your Gas IPR formula
    return [];
  }
  
  function calculateTwoPhaseIPR(params: any) {
    // Your Two-phase IPR formula
    return [];
  }
  
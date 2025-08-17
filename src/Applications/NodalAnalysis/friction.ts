export type FrictionModel =
  | 'Chen (1979)'
  | 'Swamee–Jain (1976)'
  | 'Colebrook–White (1939)'
  | 'Haaland (1983)'
  | 'Churchill (1977)';

/** Returns *Fanning* friction factor from model; handles laminar automatically */
export function fanningFromModel(Re: number, rel: number, model: FrictionModel): number {
  if (Re < 2100) return 16 / Re; // laminar

  switch (model) {
    case 'Swamee–Jain (1976)': {
      // Darcy-Weisbach
      const fM = 0.25 / Math.pow(Math.log10(rel / 3.7 + 5.74 / Math.pow(Re, 0.9)), 2);
      return fM / 4;
    }
    case 'Colebrook–White (1939)': {
      let fM = 0.02;
      for (let i = 0; i < 25; i++) {
        const rhs = -2 * Math.log10(rel / 3.7 + 2.51 / (Re * Math.sqrt(fM)));
        fM = 1 / (rhs * rhs);
      }
      return fM / 4;
    }
    case 'Haaland (1983)': {
      const invSqrt = -1.8 * Math.log10(Math.pow(rel / 3.7, 1.11) + 6.9 / Re);
      const fM = 1 / (invSqrt * invSqrt);
      return fM / 4;
    }
    case 'Churchill (1977)': {
      const A = Math.pow(2.457 * Math.log(1 / Math.pow(7 / Re, 0.9) + 0.27 * rel), 16);
      const B = Math.pow(37530 / Re, 16);
      const fM = 8 * Math.pow(Math.pow(8 / Re, 12) + 1 / Math.pow(A + B, 1.5), 1 / 12);
      return fM / 4;
    }
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
}

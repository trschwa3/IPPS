class UnitConverter {
    // Conversion factors relative to a chosen base unit for each dimension
    // e.g., for "pressure" you define Pa -> 1, bar -> 1e5, etc.
    
    // Mass (base: kg)
    static massFactors: Record<string, number> = {
      kg: 1,
      lbm: 0.45359237,
      slug: 14.5939029,
      g: 0.001,
    };
  
    // Force (base: N)
    static forceFactors: Record<string, number> = {
      N: 1,
      lbf: 4.44822162,
      kgf: 9.80665,
      kip: 4448.22162,
      dyne: 1e-5,
    };
  
    // Velocity (base: m/s)
    static velocityFactors: Record<string, number> = {
      'm/s': 1,
      'ft/s': 0.3048,
      mph: 0.44704,
      'km/h': 0.27777778,
    };
  
    // Flowrate (base: m³/day)
    static flowrateFactors: Record<string, number> = {
      'm³/day': 1,
      'bbl/day': 0.158987,    // 1 bbl = 0.158987 m³
      'Mcf/day': 28.3168466,  // 1000 ft³ = 28.3168466 m³
      'm³/s': 86400,          // 1 m³/s = 86400 m³/day
      'L/s': 86.4,            // 1 L/s = 86.4 m³/day
    };
  
    // Volume (base: m³)
    static volumeFactors: Record<string, number> = {
      'm³': 1,
      'ft³': 0.0283168466,
      bbl: 0.158987, // oil barrel
      gal: 0.00378541,
      L: 0.001,
      Mscf: 28.3168466, // thousand cubic feet
    };
  
    // Density (base: kg/m³)
    static densityFactors: Record<string, number> = {
      'kg/m³': 1,
      'lbm/ft³': 16.0184634,
      'lbm/gal': 119.826,
    };
  
    // Pressure (base: Pa)
    static pressureFactors: Record<string, number> = {
      Pa: 1,
      kPa: 1000,
      MPa: 1e6,
      mmHg: 133.322,
      torr: 133.322,
      bar: 100000,
      psi: 6894.76,
    };
  
    // Length (base: m)
    static lengthFactors: Record<string, number> = {
      m: 1,
      cm: 0.01,
      mm: 0.001,
      km: 1000,
      ft: 0.3048,
      in: 0.0254,
    };
  
    // Area (base: m²)
    static areaFactors: Record<string, number> = {
      'm²': 1,
      'ft²': 0.092903,
      acre: 4046.86,
      hectare: 10000,
      'km²': 1e6,
    };
  
    // Viscosity (base: Pa·s)
    static viscosityFactors: Record<string, number> = {
      'Pa·s': 1,
      cp: 0.001,
      'lbm/(ft·s)': 1.48816394, // 1 lbm/(ft·s) ≈ 1.48816394 Pa·s
    };
  
    // Permeability (base: m²)
    static permeabilityFactors: Record<string, number> = {
      'm²': 1,
      darcy: 9.869233e-13,
      mD: 9.869233e-16,
      'ft²': 0.092903,
    };
  
    // Compressibility (base: 1/Pa or Pa⁻¹)
    // 1/psi ≈ 6894.76 × 1/Pa
    static compressibilityFactors: Record<string, number> = {
      'Pa^-1': 1,
      'Pa⁻¹': 1,      // some systems might store it with a minus sign
      'psi^-1': 6894.76,
      'psi⁻¹': 6894.76,
    };
  
    /**
     * Converts a value from one unit to another for a given dimension.
     *
     * @param dimension The dimension (e.g. "mass", "pressure", "temperature", etc.)
     * @param value The numerical value to convert.
     * @param fromUnit The unit of the input value.
     * @param toUnit The target unit for conversion.
     * @returns The converted value.
     */
    static convert(dimension: string, value: number, fromUnit: string, toUnit: string): number {
      // 1) Special handling: temperature
      if (dimension === 'temperature') {
        let valueInK: number;
        switch (fromUnit) {
          case 'K':
            valueInK = value;
            break;
          case '°C':
            valueInK = value + 273.15;
            break;
          case '°F':
            valueInK = (value + 459.67) * (5 / 9);
            break;
          case '°R':
            valueInK = value * (5 / 9);
            break;
          default:
            throw new Error(`Unsupported temperature unit: ${fromUnit}`);
        }
        switch (toUnit) {
          case 'K':
            return valueInK;
          case '°C':
            return valueInK - 273.15;
          case '°F':
            return valueInK * (9 / 5) - 459.67;
          case '°R':
            return valueInK * (9 / 5);
          default:
            throw new Error(`Unsupported temperature unit: ${toUnit}`);
        }
      }
  
      // 2) Flowrate
      else if (dimension === 'flowrate') {
        const factors = UnitConverter.flowrateFactors;
        if (!(fromUnit in factors) || !(toUnit in factors)) {
          throw new Error(`Unsupported flowrate unit: ${fromUnit} or ${toUnit}`);
        }
        const valueInBase = value * factors[fromUnit]; // to m³/day
        return valueInBase / factors[toUnit];
      }
  
      // 3) Compressibility
      else if (dimension === 'compressibility') {
        const factors = UnitConverter.compressibilityFactors;
        if (!(fromUnit in factors) || !(toUnit in factors)) {
          throw new Error(
            `Unsupported compressibility unit: ${fromUnit} or ${toUnit}`
          );
        }
        const valueInBase = value * factors[fromUnit]; // to base (1/Pa)
        return valueInBase / factors[toUnit];          // then to target
      }
  
      // 4) Everything else (mass, pressure, length, etc.)
      else {
        let factors: Record<string, number>;
        switch (dimension) {
          case 'mass':
            factors = UnitConverter.massFactors;
            break;
          case 'force':
            factors = UnitConverter.forceFactors;
            break;
          case 'velocity':
            factors = UnitConverter.velocityFactors;
            break;
          case 'volume':
            factors = UnitConverter.volumeFactors;
            break;
          case 'density':
            factors = UnitConverter.densityFactors;
            break;
          case 'pressure':
            factors = UnitConverter.pressureFactors;
            break;
          case 'length':
            factors = UnitConverter.lengthFactors;
            break;
          case 'area':
            factors = UnitConverter.areaFactors;
            break;
          case 'viscosity':
            factors = UnitConverter.viscosityFactors;
            break;
          case 'permeability':
            factors = UnitConverter.permeabilityFactors;
            break;
          default:
            throw new Error(`Unsupported dimension: ${dimension}`);
        }
        if (!(fromUnit in factors) || !(toUnit in factors)) {
          throw new Error(
            `Unsupported unit conversion from ${fromUnit} to ${toUnit} for dimension ${dimension}`
          );
        }
        const valueInBase = value * factors[fromUnit];
        return valueInBase / factors[toUnit];
      }
    }
  }
  
  export default UnitConverter;
  
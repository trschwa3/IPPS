export interface UnitSystemDefinition {
    mass: string,
    force: string,
    velocity: string;
    flowrate: string;
    volume: string;
    density: string;
    pressure: string;
    length: string;
    area: string;
    viscosity: string;
    permeability: string;
    temperature: string;
    compressibility: string;
    gasFVF: string,
    oilFVF:string,
    gor:string
    // Add any other properties you have
  }
  
  export interface UnitSystems {
    [systemName: string]: UnitSystemDefinition;
  }
  
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
    // Add any other properties you have
  }
  
  export interface UnitSystems {
    [systemName: string]: UnitSystemDefinition;
  }
  
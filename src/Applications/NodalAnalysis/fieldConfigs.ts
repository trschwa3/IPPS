export interface FieldConfig {
  name: string;
  label: string;
  dimension: string; // used to select conversion factors (e.g. "pressure", "length", etc.)
  baseMin?: number;
  baseMax?: number;
  unit: string; // the base unit for the field (e.g., "psi")
}

// Oil common fields
export const oilCommonFields: FieldConfig[] = [
  { name: 'k',   label: 'Permeability, k',        dimension: 'permeability', baseMin: 1e-6,   unit: 'mD'       },
  { name: 'h',   label: 'Thickness, h',           dimension: 'length',       baseMin: 1,      unit: 'ft'       },
  { name: 'Bo',  label: 'Formation Vol. Factor, B₀', dimension: 'oil FVF',    baseMin: 0.1,    unit: 'bbl/STB'  },
  { name: 'muo', label: 'Oil Viscosity, μ₀',      dimension: 'viscosity',    baseMin: 0.01,   unit: 'cp'       },
  { name: 's',   label: 'Skin Factor, s',         dimension: 'skin',         baseMin: -7,     baseMax: 100,    unit: 'dimensionless' },
  { name: 'rw',  label: 'Well Radius, rₒ',        dimension: 'length',       baseMin: 0.01,   unit: 'ft'       },
];

// Gas common fields
export const gasCommonFields: FieldConfig[] = [
  { name: 'k',    label: 'Permeability, k',      dimension: 'permeability', baseMin: 0,    unit: 'mD'   },
  { name: 'h',    label: 'Thickness, h',         dimension: 'length',       baseMin: 1,    unit: 'ft'   },
  { name: 's',    label: 'Skin Factor, s',       dimension: 'skin',         baseMin: -7,   baseMax: 100, unit: 'dimensionless' },
  { name: 'rw',   label: 'Well Radius, rₒ',      dimension: 'length',       baseMin: 0.01, baseMax: 1,   unit: 'ft' },
  { name: 'sg_g', label: 'Gas Specific Gravity, Sg', dimension: 'gasSG',    baseMin: 0.56, baseMax: 1,   unit: 'dimensionless' },
  { name: 'T_res',label: 'Reservoir Temperature, Tᵣ', dimension: 'temperature', baseMin: 100, baseMax: 350, unit: '°F' },
];

// Liquid transient fields
export const TransientFields: FieldConfig[] = [
  { name: 'phi', label: 'Porosity, φ (%)',           dimension: 'porosity',       baseMin: 1,    baseMax: 50,   unit: '%'     },
  { name: 'ct',  label: 'Total Compressibility, cₜ', dimension: 'compressibility', baseMin: 1e-7, baseMax: 1e-3, unit: 'psi⁻¹' },
  { name: 't',   label: 'Time, t',                   dimension: 'time',            baseMin: 1e-3, baseMax: 10000, unit: 'hrs'   },
  { name: 'pi',  label: 'Initial Reservoir Pressure, pi', dimension: 'pressure',  baseMin: 500,  baseMax: 20000, unit: 'psi'   },
];

// Pseudosteady fields (for both oil and gas)
export const PseudosteadyFields: FieldConfig[] = [
  { name: 'p_avg', label: 'Average Reservoir Pressure, p_avg', dimension: 'pressure', baseMin: 500, baseMax: 20000, unit: 'psi' },
  { name: 're',   label: 'Reservoir Radius, rᵣ',            dimension: 'length',   baseMin: 0.1, unit: 'ft'      },
];

// Steady-state fields (for both oil and gas)
export const SteadystateFields: FieldConfig[] = [
  { name: 'pe', label: 'Boundary Pressure, pe', dimension: 'pressure', baseMin: 500,  baseMax: 20000, unit: 'psi' },
  { name: 're', label: 'Reservoir Radius, rᵣ',  dimension: 'length',   baseMin: 0.1,  unit: 'ft'      },
];

// Two-phase fields (for two-phase calculations)
export const TwoPhaseFields: FieldConfig[] = [
  { name: 'p_avg', label: 'Average Reservoir Pressure, p_avg', dimension: 'pressure', baseMin: 500,  baseMax: 20000, unit: 'psi' },
  { name: 'pb',   label: 'Saturation Pressure, pb',           dimension: 'pressure', baseMin: 300,  baseMax: 5000,  unit: 'psi' },
  { name: 'a',    label: 'Bowedness, a',                      dimension: 'bowedness', baseMin: 0.8, baseMax: 1,     unit: 'dimensionless' },
  { name: 're',   label: 'Reservoir Radius, rᵣ',              dimension: 'length',    baseMin: 0.1, unit: 'ft'      },
];


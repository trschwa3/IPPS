import React, { useEffect } from 'react';
import unitSystems from '../../unit/unitSystems.json';
import UnitConverter from '../../unit/UnitConverter';

// --- Field configuration types and dictionaries ---

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
  { name: 'h',   label: 'Thickness, h',           dimension: 'length',       baseMin: 1,   unit: 'ft'       },
  { name: 'Bo',  label: 'Formation Vol. Factor, B₀', dimension: 'oil FVF',  baseMin: 0.1,   unit: 'bbl/STB'  },
  { name: 'muo', label: 'Oil Viscosity, μ₀',      dimension: 'viscosity',    baseMin: 0.01,   unit: 'cp'       },
  { name: 's',   label: 'Skin Factor, s',         dimension: 'skin',         baseMin: -7,  baseMax: 100, unit: 'dimensionless' },
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
  { name: 'pavg', label: 'Average Reservoir Pressure, pavg', dimension: 'pressure', baseMin: 500, baseMax: 20000, unit: 'psi' },
  { name: 're',   label: 'Reservoir Radius, rᵣ',            dimension: 'length',   baseMin: 0.1, unit: 'ft'      },
];

// Steady-state fields (for both oil and gas)
export const SteadystateFields: FieldConfig[] = [
  { name: 'pe', label: 'Boundary Pressure, pe', dimension: 'pressure', baseMin: 500,  baseMax: 20000, unit: 'psi' },
  { name: 're', label: 'Reservoir Radius, rᵣ',  dimension: 'length',   baseMin: 0.1,  unit: 'ft'      },
];

// Two-phase fields (for two-phase calculations)
export const TwoPhaseFields: FieldConfig[] = [
  { name: 'pavg', label: 'Average Reservoir Pressure, pavg', dimension: 'pressure', baseMin: 500,  baseMax: 20000, unit: 'psi' },
  { name: 'pb',   label: 'Saturation Pressure, pb',           dimension: 'pressure', baseMin: 300,  baseMax: 5000,  unit: 'psi' },
  { name: 'a',    label: 'Bowedness, a',                      dimension: 'bowedness', baseMin: 0.8, baseMax: 1,     unit: 'dimensionless' },
  { name: 're',   label: 'Reservoir Radius, rᵣ',              dimension: 'length',    baseMin: 0.1, unit: 'ft'      },
];

// --- Component Props & Main Component ---

interface NodalAnalysisFormProps {
  iprPhase: string;
  zMethod: string;
  setIprPhase: (phase: string) => void;
  setzMethod: (phase: string) => void;
  flowRegime: string;
  setFlowRegime: (regime: string) => void;
  formValues: any;
  setFormValues: (vals: any) => void;
  onCalculate: () => void;
  selectedUnitSystem: string;
}

/** A helper that formats numeric limits with “smart” rules:
 *  - If abs(value) < 1e-3 or >= 1e4, show e-notation with 1 decimal (e.g. 1.0e-6)
 *  - If >= 100, show as integer
 *  - Else show up to 2 decimals
 */
function formatLimit(value: number): string {
  if (value === 0) return '0';
  const absVal = Math.abs(value);
  if (absVal <= 1e-3 || absVal >= 1e4) {
    // exponential with 1 digit
    return value.toExponential(1).replace('+', ''); 
  } else if (absVal >= 100) {
    // integer
    return Math.round(value).toString();
  } else {
    // up to 2 decimals
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
}

const NodalAnalysisForm: React.FC<NodalAnalysisFormProps> = ({
  iprPhase,
  zMethod,
  setIprPhase,
  setzMethod,
  flowRegime,
  setFlowRegime,
  formValues,
  setFormValues,
  onCalculate,
  selectedUnitSystem,
}) => {
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});

  // Force pseudosteady-state for Two-phase
  useEffect(() => {
    if (iprPhase === 'Two-phase' && flowRegime !== 'Pseudosteady-State') {
      setFlowRegime('Pseudosteady-State');
    }
  }, [iprPhase, flowRegime, setFlowRegime]);

  const gasOilPhaseOptions = ['Liquid', 'Two-phase', 'Gas'];
  // For Two-phase, only Pseudosteady-State is allowed; otherwise, all three are allowed.
  const regimeOptions =
    iprPhase === 'Two-phase'
      ? ['Pseudosteady-State']
      : ['Transient', 'Pseudosteady-State', 'Steady-State'];

  // For Gas, show the z‑method dropdown.
  const zmethodOptions = [
    'Dranchuk & Abou-Kassem - 1975',
    'Dranchuk, Purvis & Robinson - 1974',
    'Redlich Kwong - 1949',
    'Brill & Beggs - 1974',
  ];

  // Spacing methods
  let spacingMethods = ['Number of Points', 'Delta Pressure', 'Delta Flowrate'];
  if (iprPhase === 'Gas' || iprPhase === 'Two-phase') {
    spacingMethods = ['Number of Points', 'Delta Pressure', 'Delta Flowrate'];
  }
  if (iprPhase === 'Gas') {
    spacingMethods = ['Number of Points', 'Delta Pressure'];
  }

  // Get the user's unit definitions as a Record<string, string>
  const userUnitsTyped = (unitSystems[selectedUnitSystem as keyof typeof unitSystems] ||
    {}) as Record<string, string>;

  // Enable editing only if iprPhase is selected and, for liquids, flowRegime is selected.
  const canEditFields = iprPhase !== '' && (iprPhase !== 'Liquid' || flowRegime !== '');

  /** Handler for numeric inputs */
  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value === '') {
      // User cleared the field
      setErrors((prev) => ({ ...prev, [name]: '' }));
      setFormValues((prev: any) => ({ ...prev, [name]: '' }));
      return;
    }
    let parsed = parseFloat(value);
    if (isNaN(parsed)) {
      parsed = 0; // or do something else
    }
    // Example: special logic for pb if needed
    if (name === 'pb' && isNaN(parsed)) {
      parsed = formValues.pavg || 3000;
    }
    const errorMsg = validateField(name, parsed);
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
    setFormValues((prev: any) => ({ ...prev, [name]: parsed }));
  };

  /** Handler for text/select inputs */
  const handleTextChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'iprPhase') {
      setIprPhase(value);
    } else if (name === 'flowRegime') {
      setFlowRegime(value);
    } else if (name === 'zMethod') {
      setzMethod(value);
    } else {
      setFormValues((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  // Inline style helpers
  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.8rem',
  };
  const labelStyle: React.CSSProperties = {
    minWidth: '180px',
    marginRight: '0.5rem',
    fontWeight: 500,
  };
  const inputStyle: React.CSSProperties = {
    width: '100px',
    marginRight: '0.5rem',
  };
  const selectStyle: React.CSSProperties = {
    width: '220px',
    marginRight: '0.5rem',
  };
  const unitStyle: React.CSSProperties = {
    fontStyle: 'italic',
    color: '#666',
  };

  // Determine which fields to render based on iprPhase and flowRegime.
  let fieldsToRender: FieldConfig[] = [];
  if (iprPhase === 'Liquid') {
    if (flowRegime === 'Transient') {
      fieldsToRender = [...oilCommonFields, ...TransientFields];
    } else if (flowRegime === 'Pseudosteady-State') {
      fieldsToRender = [...oilCommonFields, ...PseudosteadyFields];
    } else if (flowRegime === 'Steady-State') {
      fieldsToRender = [...oilCommonFields, ...SteadystateFields];
    }
  } else if (iprPhase === 'Gas') {
    if (flowRegime === 'Transient') {
      fieldsToRender = [...gasCommonFields, ...TransientFields];
    } else if (flowRegime === 'Pseudosteady-State') {
      fieldsToRender = [...gasCommonFields, ...PseudosteadyFields];
    } else if (flowRegime === 'Steady-State') {
      fieldsToRender = [...gasCommonFields, ...SteadystateFields];
    }
  } else if (iprPhase === 'Two-phase') {
    fieldsToRender = [...oilCommonFields, ...TwoPhaseFields];
  }

  // For certain dimensions, we skip unit text in the error message
  const noConversionDimensions = ['porosity', 'skin', 'gasSG', 'bowedness'];

  /** Validation function: convert baseMin/baseMax to user units (except for certain dims),
   *  then check if the user's input is in range. Format with our `formatLimit()` function.
   */
  const validateField = (fieldName: string, value: number): string => {
    const allFields: FieldConfig[] = [
      ...oilCommonFields,
      ...gasCommonFields,
      ...TransientFields,
      ...PseudosteadyFields,
      ...SteadystateFields,
      ...TwoPhaseFields,
    ];
    const field = allFields.find((f) => f.name === fieldName);
    if (!field) return '';

    const userUnit = userUnitsTyped[field.dimension] || field.unit;
    // Convert only if dimension is not in noConversionDimensions
    const isNoConv = noConversionDimensions.includes(field.dimension);

    // Compute minLimit, maxLimit in user units (or base if dimensionless)
    let minLimit: number | undefined = field.baseMin;
    let maxLimit: number | undefined = field.baseMax;
    if (!isNoConv) {
      if (minLimit !== undefined) {
        minLimit = UnitConverter.convert(field.dimension, minLimit, field.unit, userUnit);
      }
      if (maxLimit !== undefined) {
        maxLimit = UnitConverter.convert(field.dimension, maxLimit, field.unit, userUnit);
      }
    }
    // Check bounds
    if (minLimit !== undefined && value < minLimit) {
      const limitText = formatLimit(minLimit);
      // Omit unit if isNoConv
      const suffix = isNoConv ? '' : ` ${userUnit}`;
      return `Must be at least ${limitText}${suffix}`;
    }
    if (maxLimit !== undefined && value > maxLimit) {
      const limitText = formatLimit(maxLimit);
      const suffix = isNoConv ? '' : ` ${userUnit}`;
      return `Must be at most ${limitText}${suffix}`;
    }
    return '';
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px', maxWidth: '600px' }}>
      <h3>IPR Inputs (Units: {selectedUnitSystem || 'Unknown'})</h3>

      {/* IPR Phase Selector */}
      <div style={rowStyle}>
        <label style={labelStyle}>IPR Phase:</label>
        <select name="iprPhase" value={iprPhase} onChange={handleTextChange} style={selectStyle}>
          <option value="">-- Select --</option>
          {gasOilPhaseOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Flow Regime Selector */}
      <div style={rowStyle}>
        <label style={labelStyle}>Flow Regime:</label>
        <select
          name="flowRegime"
          value={iprPhase === 'Two-phase' ? 'Pseudosteady-State' : flowRegime}
          onChange={handleTextChange}
          style={selectStyle}
          disabled={iprPhase === 'Two-phase'}
        >
          {/* Show a blank option for flowRegime */}
          <option value="">-- Select --</option>
          {regimeOptions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* For Gas calculations, display the z‑Method dropdown */}
      {iprPhase === 'Gas' && (
        <div style={rowStyle}>
          <label style={labelStyle}>z Factor Correlation:</label>
          <select name="zMethod" value={zMethod} onChange={handleTextChange} style={selectStyle}>
            <option value="">-- Select --</option>
            {zmethodOptions.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Render dynamic fields */}
      {fieldsToRender.map((field) => {
        const userUnit = userUnitsTyped[field.dimension] || field.unit;
        // For the <input min=... max=...>, we do the same logic:
        // But typically these just limit the HTML input. You can keep or remove them as you wish.
        const isNoConv = noConversionDimensions.includes(field.dimension);

        let minLimit = field.baseMin;
        let maxLimit = field.baseMax;
        if (!isNoConv) {
          if (minLimit !== undefined) {
            minLimit = UnitConverter.convert(field.dimension, minLimit, field.unit, userUnit);
          }
          if (maxLimit !== undefined) {
            maxLimit = UnitConverter.convert(field.dimension, maxLimit, field.unit, userUnit);
          }
        }

        // Show 0 properly with ?? '' 
        const valueStr = formValues[field.name] ?? '';

        return (
          <div style={rowStyle} key={field.name}>
            <label style={labelStyle}>{field.label}:</label>
            <input
              type="number"
              step="any"
              name={field.name}
              min={minLimit}
              max={maxLimit}
              value={valueStr}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            {/* Show unit label unless dimensionless/no conversion */}
            {!isNoConv && <span style={unitStyle}>({userUnit})</span>}

            {errors[field.name] && (
              <div style={{ color: 'red', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                {errors[field.name]}
              </div>
            )}
          </div>
        );
      })}

      {/* Spacing Method Dropdown */}
      <div style={rowStyle}>
        <label style={labelStyle}>Spacing Method:</label>
        <select
          name="spacingMethod"
          value={formValues.spacingMethod ?? ''}
          onChange={handleTextChange}
          disabled={!canEditFields}
          style={selectStyle}
        >
          <option value="">-- Select --</option>
          {spacingMethods.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Spacing Value Input */}
      {formValues.spacingMethod && (
        <div style={rowStyle}>
          <label style={labelStyle}>Spacing Value:</label>
          <input
            type="number"
            step="any"
            name="spacingValue"
            value={formValues.spacingValue ?? ''}
            onChange={handleNumericChange}
            disabled={!canEditFields}
            style={inputStyle}
          />
          <span style={unitStyle}>
            {formValues.spacingMethod === 'Number of Points'
              ? 'points'
              : formValues.spacingMethod === 'Delta Pressure'
              ? userUnitsTyped['pressure'] || 'psi'
              : formValues.spacingMethod === 'Delta Flowrate'
              ? userUnitsTyped['flowrate'] || 'STB/day'
              : ''}
          </span>
          {errors['spacingValue'] && (
            <div style={{ color: 'red', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
              {errors['spacingValue']}
            </div>
          )}
        </div>
      )}

      {/* Calculate Button */}
      <button
        onClick={onCalculate}
        disabled={!iprPhase || (iprPhase === 'Liquid' && !flowRegime)}
        style={{ marginTop: '1rem' }}
      >
        Calculate
      </button>
    </div>
  );
};

export default NodalAnalysisForm;

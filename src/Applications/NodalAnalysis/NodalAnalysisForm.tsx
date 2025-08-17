/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from 'react';
import unitSystems from '../../unit/unitSystems.json';
import UnitConverter from '../../unit/UnitConverter';
import { FieldConfig, oilCommonFields, gasCommonFields, TransientFields, PseudosteadyFields, SteadystateFields, TwoPhaseFields } from './config/fieldConfigs';
import { FrictionModel } from './friction';
import OPROilFields from './OPROilFields';
import OPRGasFields from './OPRGasFields';

// NodalAnalysisForm.tsx (props)
interface NodalAnalysisFormProps {
  inputMode: 'IPR' | 'OPR';    
  setInputMode: (m: 'IPR' | 'OPR') => void;       
  iprPhase: string;
  setIprPhase: (phase: string) => void;
  oprPhase: string;
  setOprPhase: (phase: string) => void;
  flowRegime: string;
  setFlowRegime: (regime: string) => void;
  formValues: any;
  setFormValues: (vals: any) => void;
  onCalculate: () => void;
  selectedUnitSystem: string;
  zMethod?: string;
  setzMethod?: (m: string) => void;
  frictionModel?: FrictionModel;                
  setFrictionModel?: (m: FrictionModel) => void;
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
  inputMode,
  setInputMode,
  iprPhase,
  setIprPhase,
  oprPhase,
  setOprPhase,
  zMethod = '',
  setzMethod = () => {},   // ← default no-op fixes runtime + TS
  flowRegime,
  setFlowRegime,
  formValues,
  setFormValues,
  onCalculate,
  selectedUnitSystem,
  frictionModel = 'Chen (1979)',
  setFrictionModel = () => {}, // ← default no-op fixes runtime + TS
}) => {

  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});
  const diameterUnit = selectedUnitSystem === 'SI' ? 'cm' : 'in';
  // Force pseudosteady-state for Two-phase
  useEffect(() => {
    if (iprPhase === 'Two-phase' && flowRegime !== 'Pseudosteady-State') {
      setFlowRegime('Pseudosteady-State');
    }
  }, [iprPhase, flowRegime, setFlowRegime]);

  const phaseOptions = ['Liquid', 'Two-phase', 'Gas'];
  const allowedOprOptions = iprPhase ? phaseOptions.filter(p => p === iprPhase) : phaseOptions;
  // For Two-phase, only Pseudosteady-State is allowed; otherwise, all three are allowed.
  const regimeOptions =
    iprPhase === 'Two-phase'
      ? ['Pseudosteady-State']
      : ['Transient', 'Pseudosteady-State', 'Steady-State'];

  // For Gas, show the z‑method dropdown.
  const zmethodOptions = [
    'Dranchuk & Abou-Kassem - 1975',
    'Dranchuk, Purvis & Robinson - 1974',
    'Hall & Yarborough - 1974',
    'Redlich Kwong - 1949',
    'Brill & Beggs - 1974',
    'Chart Interpolation',
  ];

  // Spacing methods
  let spacingMethods = ['Number of Points', 'Delta Pressure', 'Delta Flowrate'];

  if (inputMode === 'OPR') {
    spacingMethods = ['Number of Points', 'Delta Flowrate'];
  } else {
    if (iprPhase === 'Gas') {
      spacingMethods = ['Number of Points', 'Delta Pressure'];
    } else if (iprPhase === 'Two-phase') {
      spacingMethods = ['Number of Points', 'Delta Pressure', 'Delta Flowrate'];
    } else {
      spacingMethods = ['Number of Points', 'Delta Pressure', 'Delta Flowrate'];
    }
  }


  // Get the user's unit definitions as a Record<string, string>
  const userUnitsTyped = (unitSystems[selectedUnitSystem as keyof typeof unitSystems] ||
    {}) as Record<string, string>;

  // Enable editing only if iprPhase is selected and, for liquids, flowRegime is selected.
  const canEditFields =
    inputMode === 'OPR'
      ? oprPhase !== ''
      : iprPhase !== '' && (iprPhase !== 'Liquid' || flowRegime !== '');

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
      parsed = formValues.p_avg || 3000;
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
      if (value !== oprPhase) setOprPhase('');
    } else if (name === 'oprPhase') {
      setOprPhase(value);
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

  // Label for the Spacing Value units when "Delta Flowrate" is selected
  const spacingFlowUnitLabel =
    formValues.spacingMethod === 'Delta Flowrate'
      ? ((inputMode === 'OPR' ? oprPhase === 'Gas' : iprPhase === 'Gas')
          // Gas: use MCF/day in Oil Field; otherwise use the user's flow unit (e.g., m³/day in SI)
          ? (selectedUnitSystem === 'Oil Field' ? 'MCF/day' : (userUnitsTyped['flowrate'] || 'm³/day'))
          // Liquids: use the user's flow unit (STB/day in Oil Field; m³/day in SI)
          : (userUnitsTyped['flowrate'] || (selectedUnitSystem === 'Oil Field' ? 'STB/day' : 'm³/day')))
      : '';

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px', maxWidth: '600px' }}>
      {/* Toolbar: IPR/OPR toggle + friction model (only when OPR) */}
<div className="inputs-toolbar" style={{ marginBottom: '0.75rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
  <div>
    <strong>Inputs:</strong>{' '}
    <label style={{ marginLeft: 6 }}>
      <input type="radio" checked={inputMode === 'IPR'} onChange={() => setInputMode('IPR')} /> IPR
    </label>
    <label style={{ marginLeft: 10 }}>
      <input type="radio" checked={inputMode === 'OPR'} onChange={() => setInputMode('OPR')} /> OPR
    </label>
  </div>
  {inputMode === 'OPR' && (
    <div>
      <strong>Friction:</strong>{' '}
      <select value={frictionModel} onChange={e => setFrictionModel(e.target.value as FrictionModel)}>
        <option>Chen (1979)</option>
        <option>Swamee–Jain (1976)</option>
        <option>Colebrook–White (1939)</option>
        <option>Haaland (1983)</option>
        <option>Churchill (1977)</option>
      </select>
    </div>
  )}
</div>

      <h3>{inputMode} Inputs (Units: {selectedUnitSystem || 'Unknown'})</h3>

      {inputMode === 'IPR' && (
        <>
          {/* IPR Phase Selector */}
          <div style={rowStyle}>
            <label style={labelStyle}>IPR Phase:</label>
            <select name="iprPhase" value={iprPhase} onChange={handleTextChange} style={selectStyle}>
              <option value="">-- Select --</option>
              {phaseOptions.map((p) => (
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
              <option value="">-- Select --</option>
              {regimeOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* z-Method for Gas */}
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
        </>
      )}

      {/* Render dynamic fields */}
      {inputMode === 'IPR' && fieldsToRender.map((field) => {
        const userUnit = userUnitsTyped[field.dimension] || field.unit;
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
            {!isNoConv && <span style={unitStyle}>({userUnit})</span>}

            {errors[field.name] && (
              <div style={{ color: 'red', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                {errors[field.name]}
              </div>
            )}
          </div>
        );
      })}

      {inputMode === 'OPR' && (
        <>
          <div style={rowStyle}>
            <label style={labelStyle}>OPR Phase:</label>
            <select name="oprPhase" value={oprPhase} onChange={handleTextChange} style={selectStyle}>
              <option value="">-- Select --</option>
              {allowedOprOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {oprPhase === 'Liquid' && (
            <OPROilFields
              formValues={formValues}
              handleNumericChange={handleNumericChange}
              userUnits={userUnitsTyped}
              diameterUnit={diameterUnit}
            />
          )}

          {oprPhase === 'Gas' && (
            <OPRGasFields
              formValues={formValues}
              handleNumericChange={handleNumericChange}
              handleTextChange={handleTextChange}
              userUnits={userUnitsTyped}
              diameterUnit={diameterUnit}
              zMethod={zMethod}
              zmethodOptions={zmethodOptions}
            />
          )}

          {oprPhase === 'Two-phase' && <p>Two-phase OPR not implemented.</p>}
        </>
      )}


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
              ? (userUnitsTyped['pressure'] || 'psi')
              : spacingFlowUnitLabel}
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
        disabled={inputMode === 'IPR' && (!iprPhase || (iprPhase === 'Liquid' && !flowRegime))}
        style={{ marginTop: '1rem' }}
      >
        Calculate
      </button>
    </div>
  );
};

export default NodalAnalysisForm;


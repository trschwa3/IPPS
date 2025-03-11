import React, { useEffect } from 'react';
import unitSystems from '../../unit/unitSystems.json';

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
  
  const isFormComplete = (): boolean => {
    // iprPhase must be set
    if (!iprPhase) return false;
    // For Liquid and Gas, flowRegime must be set.
    if ((iprPhase === "Liquid" || iprPhase === "Gas") && !flowRegime) return false;
  
    // Build an array of required field names.
    let requiredFields: string[] = [];
    if (iprPhase === "Liquid" || iprPhase === "Two-phase") {
      // Oil common fields (s is required but we don't check negativity on s)
      requiredFields.push("k", "h", "Bo", "muo", "s", "rw");
      if (flowRegime === "Transient") {
        // Transient for Liquid requires these fields:
        requiredFields.push("phi", "ct", "t", "pi");
      } else if (flowRegime === "Pseudosteady-State") {
        // Pseudosteady-State for Liquid (or Two-phase) requires:
        requiredFields.push("pavg", "re");
        if (iprPhase === "Two-phase") {
          // Two-phase adds these:
          requiredFields.push("pb", "a");
        }
      } else if (flowRegime === "Steady-State") {
        // Steady-State for Liquid requires:
        requiredFields.push("pe", "re");
      }
    } else if (iprPhase === "Gas") {
      // Gas common fields:
      requiredFields.push("k", "h", "s", "rw", "sg_g", "T_res");
      if (flowRegime === "Transient") {
        // Gas Transient requires:
        requiredFields.push("phi", "ct", "t", "pi");
      } else if (flowRegime === "Pseudosteady-State") {
        // Gas pseudosteady requires:
        requiredFields.push("p_avg", "re");
      } else if (flowRegime === "Steady-State") {
        // Gas steady requires:
        requiredFields.push("pe", "re");
      }
    }
  
    // Check that every required field is filled and non-negative (except for "s")
    for (const field of requiredFields) {
      if (formValues[field] === undefined || formValues[field] === "") {
        return false;
      }
      if (field !== "s" && Number(formValues[field]) < 0) {
        return false;
      }
    }
    return true;
  };
  

  useEffect(() => {
    if (iprPhase === 'Two-phase' && flowRegime !== 'Pseudosteady-State') {
      setFlowRegime('Pseudosteady-State');
    }
  }, [iprPhase, flowRegime, setFlowRegime]);

  const gas_oil_phaseOptions = ['Liquid', 'Two-phase', 'Gas'];
  const regimeOptions = ['Transient', 'Pseudosteady-State', 'Steady-State'];
  const zmethodOptions = ['Dranchuk & Abou-Kassem - 1975', 'Dranchuk, Purvis & Robinson - 1974', 
                          'Redlich Kwong - 1949', 'Brill & Beggs - 1974']
  let spacingMethods = ['NumPoints', 'DeltaP', 'DeltaQ'];
  if (iprPhase === 'Gas' || iprPhase === "Two-phase") {
    spacingMethods = ['NumPoints', 'DeltaP', 'DeltaQ'];
  }
  if (iprPhase === 'Gas') {
    spacingMethods = ['NumPoints', 'DeltaP'];
  }
  
  // Identify units from JSON (or fallback to Oil Field style)
  const userUnits = unitSystems[selectedUnitSystem as keyof typeof unitSystems] || {};

  // Disable fields if phase or (for Liquid & gas) flow regime is not selected
  const canEditFields =
    iprPhase !== '' && (iprPhase !== 'Liquid' || flowRegime !== '');

  /** Reusable numeric input handler */
  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let parsed = parseFloat(value);
    if (name === 'pb' && isNaN(parsed)) {
      parsed = formValues.pavg || 3000;
    }
    setFormValues((prev: any) => ({
      ...prev,
      [name]: parsed,
    }));
  };

  /** Reusable select/text input handler */
  const handleTextChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'iprPhase') {
      setIprPhase(value);
    } else if (name === 'flowRegime') {
      setFlowRegime(value);
    } else if (name === 'zMethod') {
      setzMethod(value);
    } else {
      setFormValues((prev: any) => ({
        ...prev,
        [name]: value,
      }));
    }} 

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
    width: '220px', // or 100% if you prefer
    marginRight: '0.5rem',
  };  
  const unitStyle: React.CSSProperties = {
    fontStyle: 'italic',
    color: '#666',
  };

  // Common reservoir parameters for Liquid
  const oilcommonFields = [
    { name: 'k', label: 'Permeability, k', unit: userUnits.permeability || 'mD' },
    { name: 'h', label: 'Thickness, h', unit: userUnits.length || 'ft' },
    { name: 'Bo', label: 'Formation Vol. Factor, B₀', unit: userUnits.oilFVF || 'bbl/STB' },
    { name: 'muo', label: 'Oil Viscosity, μ₂', unit: userUnits.viscosity || 'cp' },
    { name: 's', label: 'Skin Factor, s', unit: 'dimensionless' },
    { name: 'rw', label: 'Well radius, rₒ', unit: userUnits.length || 'ft' },
  ];

  // Gas-specific common fields
  const gascommonFields = [
    { name: 'k', label: 'Permeability, k', unit: userUnits.permeability || 'mD' },
    { name: 'h', label: 'Thickness, h', unit: userUnits.length || 'ft' },
    { name: 's', label: 'Skin Factor, s', unit: 'dimensionless' },
    { name: 'rw', label: 'Well radius, rₒ', unit: userUnits.length || 'ft' },
    { name: 'sg_g', label: 'Gas Specific Gravity, Sg', unit: 'dimensionless' },
    { name: 'T_res', label: 'Reservoir Temperature, Tᵣ', unit: userUnits.temperature || '°F' },
  ];

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px', maxWidth: '600px' }}>
      <h3>IPR Inputs (Units: {selectedUnitSystem || 'Unknown'})</h3>

      {/* IPR Phase Selector */}
      <div style={rowStyle}>
        <label style={labelStyle}>IPR Phase:</label>
        <select name="iprPhase" value={iprPhase} onChange={handleTextChange} style={selectStyle}>
          <option value="">-- Select --</option>
          {gas_oil_phaseOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Flow Regime for Liquid/Two-phase */}
      {(iprPhase === 'Liquid' || iprPhase === 'Two-phase') && (
        <div style={rowStyle}>
          <label style={labelStyle}>Flow Regime:</label>
          <select
            name="flowRegime"
            value={iprPhase === 'Two-phase' ? 'Pseudosteady-State' : flowRegime}
            onChange={handleTextChange}
            style={selectStyle}
            disabled={iprPhase === 'Two-phase'}
          >
            {iprPhase === 'Liquid' ? (
              <>
                <option value="">-- Select --</option>
                {regimeOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </>
            ) : (
              <option value="Pseudosteady-State">Pseudosteady-State</option>
            )}
          </select>
        </div>
      )}

      {/* Gas-Specific Section */}
      {iprPhase === 'Gas' && (
        <>
          {/* Gas Flow Regime Selector */}
          <div style={rowStyle}>
            <label style={labelStyle}>Flow Regime:</label>
            <select
              name="flowRegime"
              value={flowRegime}
              onChange={handleTextChange}
              style={selectStyle}
              disabled={!canEditFields}
            >
              <option value="">-- Select --</option>
              {regimeOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* z method selector */}
          <div style={rowStyle}>
            <label style={labelStyle}>z Factor Correlation:</label>
            <select name="zMethod" value={zMethod} onChange={handleTextChange} style={selectStyle}>
              <option value="">-- Select --</option>
              {zmethodOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </>
      )}


      {(iprPhase === 'Liquid' || iprPhase === 'Two-phase') && oilcommonFields.map((field) => (
        <div style={rowStyle} key={field.name}>
          <label style={labelStyle}>{field.label}:</label>
          <input
            type="number"
            step="any"
            name={field.name}
            value={formValues[field.name] || ''}
            onChange={handleNumericChange}
            disabled={!canEditFields}
            style={inputStyle}
          />
          <span style={unitStyle}>({field.unit})</span>
        </div>
      ))}
      {iprPhase === 'Gas' &&
        gascommonFields.map((field) => (
          <div style={rowStyle} key={field.name}>
            <label style={labelStyle}>{field.label}:</label>
            <input
              type="number"
              step="any"
              name={field.name}
              value={formValues[field.name] || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({field.unit})</span>
          </div>
        ))}

      {/* Additional Fields for Liquid */}
      {iprPhase === 'Liquid' && flowRegime === 'Transient' && (
        <>
          <div style={rowStyle}>
            <label style={labelStyle}>Porosity, φ (%):</label>
            <input
              type="number"
              step="any"
              name="phi"
              value={formValues.phi || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>%</span>
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>
              Total Compressibility, c<span style={{ fontSize: 'smaller' }}>t</span>:
            </label>
            <input
              type="number"
              step="any"
              name="ct"
              value={formValues.ct || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.compressibility || '1/psi'})</span>
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>Time, t:</label>
            <input
              type="number"
              step="any"
              name="t"
              value={formValues.t || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.time || 'hrs'})</span>
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>
              Initial Reservoir Pressure, pi<sub>i</sub>:
            </label>
            <input
              type="number"
              step="any"
              name="pi"
              value={formValues.pi || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.pressure || 'psi'})</span>
          </div>
        </>
      )}

      {/* Additional Fields for Liquid (Pseudosteady-State / Two-phase) */}
      {((iprPhase === 'Liquid' && flowRegime === 'Pseudosteady-State') || iprPhase === 'Two-phase') && (
        <>
          <div style={rowStyle}>
            <label style={labelStyle}>
              Avg Reservoir Pressure, pavg<sub>avg</sub>:
            </label>
            <input
              type="number"
              step="any"
              name="pavg"
              value={formValues.pavg || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.pressure || 'psi'})</span>
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>
              Reservoir radius, re<sub>e</sub>:
            </label>
            <input
              type="number"
              step="any"
              name="re"
              value={formValues.re || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.length || 'ft'})</span>
          </div>
          {iprPhase === 'Two-phase' && (
            <>
              <div style={rowStyle}>
                <label style={labelStyle}>
                  Saturation Pressure, p<sub>b</sub>:
                </label>
                <input
                  type="number"
                  step="any"
                  name="pb"
                  value={formValues.pb || ''}
                  onChange={handleNumericChange}
                  disabled={!canEditFields}
                  style={inputStyle}
                />
                <span style={unitStyle}>({userUnits.pressure || 'psi'})</span>
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>
                  Bowedness, a<sub>e</sub>:
                </label>
                <input
                  type="number"
                  step="any"
                  name="a"
                  value={formValues.a || ''}
                  onChange={handleNumericChange}
                  disabled={!canEditFields}
                  style={inputStyle}
                />
                <span style={unitStyle}>({'dimensionless'})</span>
              </div>
            </>
          )}
        </>
      )}

      {/* Additional Fields for Liquid (Steady-State) */}
      {iprPhase === 'Liquid' && flowRegime === 'Steady-State' && (
        <>
          <div style={rowStyle}>
            <label style={labelStyle}>
              Boundary Pressure, pe<sub>e</sub>:
            </label>
            <input
              type="number"
              step="any"
              name="pe"
              value={formValues.pe || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.pressure || 'psi'})</span>
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>
              Reservoir radius, re<sub>e</sub>:
            </label>
            <input
              type="number"
              step="any"
              name="re"
              value={formValues.re || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.length || 'ft'})</span>
          </div>
        </>
      )}

      {/* Additional Fields for Gas */}
      {iprPhase === 'Gas' && flowRegime === 'Transient' && (
        <>
          <div style={rowStyle}>
            <label style={labelStyle}>Porosity, φ (%):</label>
            <input
              type="number"
              step="any"
              name="phi"
              value={formValues.phi || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>(%)</span>
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>
              Total Compressibility, c<span style={{ fontSize: 'smaller' }}>t</span>:
            </label>
            <input
              type="number"
              step="any"
              name="ct"
              value={formValues.ct || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.compressibility || '1/psi'})</span>
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>Time, t:</label>
            <input
              type="number"
              step="any"
              name="t"
              value={formValues.t || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.time || 'hrs'})</span>
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>
              Initial Reservoir Pressure, p<sub>i</sub>:
            </label>
            <input
              type="number"
              step="any"
              name="pi"
              value={formValues.pi || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.pressure || 'psi'})</span>
          </div>
        </>
      )}
      {iprPhase === 'Gas' && flowRegime === 'Pseudosteady-State' && (
        <>
          <div style={rowStyle}>
            <label style={labelStyle}>Average Reservoir Pressure, pavg:</label>
            <input
              type="number"
              step="any"
              name="p_avg"
              value={formValues.p_avg || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.pressure || 'psi'})</span>
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>Reservoir Radius, re:</label>
            <input
              type="number"
              step="any"
              name="re"
              value={formValues.re || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.length || 'ft'})</span>
          </div>
        </>
      )}
      {iprPhase === 'Gas' && flowRegime === 'Steady-State' && (
        <>
          <div style={rowStyle}>
            <label style={labelStyle}>Boundary Pressure, pe:</label>
            <input
              type="number"
              step="any"
              name="pe"
              value={formValues.pe || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.pressure || 'psi'})</span>
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>Reservoir Radius, re:</label>
            <input
              type="number"
              step="any"
              name="re"
              value={formValues.re || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.length || 'ft'})</span>
          </div>
        </>
      )}

      {/* Spacing Method & Value */}
      <div style={rowStyle}>
        <label style={labelStyle}>Spacing Method:</label>
        <select
          name="spacingMethod"
          value={formValues.spacingMethod || ''}
          onChange={handleTextChange}
          disabled={!canEditFields}
          style={inputStyle}
        >
          <option value="">(Default 25 pts)</option>
          {spacingMethods.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      {formValues.spacingMethod && (
        <div style={rowStyle}>
          <label style={labelStyle}>Spacing Value:</label>
          <input
            type="number"
            step="any"
            name="spacingValue"
            value={formValues.spacingValue || ''}
            onChange={handleNumericChange}
            disabled={!canEditFields}
            style={inputStyle}
          />
          <span style={unitStyle}>
            {formValues.spacingMethod === 'NumPoints'
              ? '(e.g. 100 points)'
              : formValues.spacingMethod === 'DeltaP'
              ? '(psi increment)'
              : '(flowrate increment)'}
          </span>
        </div>
      )}

      <button
        onClick={onCalculate}
        disabled={!iprPhase || (iprPhase === 'Liquid' && !flowRegime) || !isFormComplete()}
        style={{ marginTop: '1rem' }}
      >
        Calculate
      </button>
    </div>
  );
};

export default NodalAnalysisForm;


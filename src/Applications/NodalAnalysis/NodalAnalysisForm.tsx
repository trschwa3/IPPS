import React, { useEffect } from 'react';
import unitSystems from '../../unit/unitSystems.json';

interface NodalAnalysisFormProps {
  iprPhase: string;
  setIprPhase: (phase: string) => void;
  flowRegime: string;
  setFlowRegime: (regime: string) => void;
  formValues: any;
  setFormValues: (vals: any) => void;
  onCalculate: () => void;
  selectedUnitSystem: string;
}

const NodalAnalysisForm: React.FC<NodalAnalysisFormProps> = ({
  iprPhase,
  setIprPhase,
  flowRegime,
  setFlowRegime,
  formValues,
  setFormValues,
  onCalculate,
  selectedUnitSystem,
}) => {
  
  useEffect(() => {
    if (iprPhase === 'Two-phase' && flowRegime !== 'Pseudosteady-State') {
      setFlowRegime('Pseudosteady-State');
    }
  }, [iprPhase, flowRegime, setFlowRegime]);

  const gas_oil_phaseOptions = ['Liquid', 'Two-phase', 'Gas'];
  const regimeOptions = ['Transient', 'Pseudosteady-State', 'Steady-State'];
  let spacingMethods = ['NumPoints', 'DeltaP', 'DeltaQ'];
  if (iprPhase === 'Gas' || iprPhase === "Two-phase") {
    spacingMethods = ['NumPoints', 'DeltaP', 'DeltaQ'];
  }
  if (iprPhase === 'Gas') {
    spacingMethods = ['NumPoints', 'DeltaP'];
  }
  
  // Identify units from JSON (or fallback to Oil Field style)
  const userUnits = unitSystems[selectedUnitSystem as keyof typeof unitSystems] || {};

  // Disable fields if phase or (for Liquid) flow regime is not selected
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
    } else {
      setFormValues((prev: any) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev: any) => ({
      ...prev,
      [name]: value,
    }));
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
    width: '90px',
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
    { name: 'T_res', label: 'Reservoir Temperature, Tᵣ', unit: '°F' },
  ];

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px', maxWidth: '600px' }}>
      <h3>IPR Inputs (Units: {selectedUnitSystem || 'Unknown'})</h3>

      {/* IPR Phase Selector */}
      <div style={rowStyle}>
        <label style={labelStyle}>IPR Phase:</label>
        <select name="iprPhase" value={iprPhase} onChange={handleTextChange} style={inputStyle}>
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
            style={inputStyle}
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
              style={inputStyle}
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

          {/* Gas IPR Model Radio Buttons */}
          <div style={rowStyle}>
            <label style={labelStyle}>Gas IPR Model:</label>
            <label style={{ marginRight: '1rem' }}>
              <input
                type="radio"
                name="gasModel"
                value="muz"
                checked={formValues.gasModel === 'muz'}
                onChange={handleRadioChange}
                disabled={!canEditFields}
              />
              mu * z constant
            </label>
            <label>
              <input
                type="radio"
                name="gasModel"
                value="p_over_muz"
                checked={formValues.gasModel === 'p_over_muz'}
                onChange={handleRadioChange}
                disabled={!canEditFields}
              />
              p / (mu * z) constant
            </label>
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
            <span style={unitStyle}>(hr)</span>
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

      {/* Additional Fields for Liquid (Pseudosteady-State / Two-phase) */}
      {((iprPhase === 'Liquid' && flowRegime === 'Pseudosteady-State') || iprPhase === 'Two-phase') && (
        <>
          <div style={rowStyle}>
            <label style={labelStyle}>
              Avg Reservoir Pressure, p<sub>avg</sub>:
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
              Reservoir radius, r<sub>e</sub>:
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
          )}
        </>
      )}

      {/* Additional Fields for Liquid (Steady-State) */}
      {iprPhase === 'Liquid' && flowRegime === 'Steady-State' && (
        <>
          <div style={rowStyle}>
            <label style={labelStyle}>
              Boundary Pressure, p<sub>e</sub>:
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
              Reservoir radius, r<sub>e</sub>:
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
            <label style={labelStyle}>Total Compressibility, ct:</label>
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
            <span style={unitStyle}>(hr)</span>
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
            <label style={labelStyle}>Average Reservoir Pressure, p_avg:</label>
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
            <label style={labelStyle}>Reservoir Radius, r_e:</label>
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
            <label style={labelStyle}>Boundary Pressure, p_e:</label>
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
            <label style={labelStyle}>Reservoir Radius, r_e:</label>
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
        disabled={!iprPhase || (iprPhase === 'Liquid' && !flowRegime)}
        style={{ marginTop: '1rem' }}
      >
        Calculate
      </button>
    </div>
  );
};

export default NodalAnalysisForm;

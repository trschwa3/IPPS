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
  const spacingMethods = ['NumPoints', 'DeltaP', 'DeltaQ'];

  // Identify units from JSON (or fallback to Oil Field style)
  const userUnits = unitSystems[selectedUnitSystem as keyof typeof unitSystems] || {};

  // If user hasn't selected phase + (if Liquid) a flow regime, disable fields
  const canEditFields =
    iprPhase !== '' && (iprPhase !== 'Liquid' || flowRegime !== '');

  /** Reusable numeric input handler */
  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let parsed = parseFloat(value);
    // For saturation pressure, if empty, use a default (e.g. pavg or a fixed value)
    if (name === 'pb' && isNaN(parsed)) {
      // Option 1: Default pb to pavg (if pavg exists) or a typical value
      parsed = formValues.pavg || 3000; // example: 3000 psi
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

  // Common reservoir parameters that apply to all flow regimes for single phase oil
  const commonFields = [
    { name: 'k',   label: 'Permeability, k',     unit: userUnits.permeability || 'mD' },
    { name: 'h',   label: 'Thickness, h',       unit: userUnits.length || 'ft' },
    { name: 'Bo',  label: 'Formation Vol. Factor, B\u2080', unit: userUnits.oilFVF || 'bbl/STB' },
    { name: 'muo', label: 'Oil Viscosity, μ\u2092', unit: userUnits.viscosity || 'cp' },
    { name: 's',   label: 'Skin Factor, s',     unit: 'dimensionless' },
    { name: 'rw',  label: 'Well radius, r\u2090', unit: userUnits.length || 'ft' },
  ];

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px', maxWidth: '600px' }}>
      <h3>IPR Inputs (Units: {selectedUnitSystem || 'Unknown'})</h3>

      {/* IPR Phase */}
      <div style={rowStyle}>
        <label style={labelStyle}>IPR Phase:</label>
        <select
          name="iprPhase"
          value={iprPhase}
          onChange={handleTextChange}
          style={inputStyle}
        >
          <option value="">-- Select --</option>
          {gas_oil_phaseOptions.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Flow Regime (if Liquid or Two-phase is selected) */}
      {(iprPhase === 'Liquid' || iprPhase === 'Two-phase') && (
        <div style={rowStyle}>
          <label style={labelStyle}>Flow Regime:</label>
          <select
            name="flowRegime"
            value={iprPhase === 'Two-phase' ? 'Pseudosteady-State' : flowRegime}
            onChange={handleTextChange}
            style={inputStyle}
            disabled={iprPhase === 'Two-phase'} // force pseudosteady-state for two-phase
          >
            {iprPhase === 'Liquid'
              ? <>
                  <option value="">-- Select --</option>
                  {regimeOptions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </>
              : <option value="Pseudosteady-State">Pseudosteady-State</option>}
          </select>
        </div>
      )}


      {/* Common fields */}
      {commonFields.map((field) => (
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

      {/* Transient Only: phi + ct + time + pi */}
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
            <span style={unitStyle}>(%)</span>
          </div>

          <div style={rowStyle}>
            <label style={labelStyle}>Total Compressibility, c<span style={{ fontSize: 'smaller' }}>t</span>:</label>
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
            <span style={unitStyle}>
              ({userUnits.pressure || 'psi'})
            </span>
          </div>
        </>
      )}

      {/* Pseudosteady-State Fields (for Liquid pseudosteady-state OR Two-phase) */}
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
            <span style={unitStyle}>
              ({userUnits.pressure || 'psi'})
            </span>
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
            <span style={unitStyle}>
              ({userUnits.length || 'ft'})
            </span>
          </div>

          {/* New field for Two-phase: Saturation Pressure (Bubble Point) */}
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
              <span style={unitStyle}>
                ({userUnits.pressure || 'psi'})
              </span>
            </div>
          )}
        </>
      )}


      {/* Steady Only */}
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
            <span style={unitStyle}>
              ({userUnits.pressure || 'psi'})
            </span>
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
            <span style={unitStyle}>
              ({userUnits.length || 'ft'})
            </span>
          </div>
        </>
      )}

      {/* Spacing Method */}
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
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Single numeric input for spacingValue */}
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

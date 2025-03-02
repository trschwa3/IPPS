import React from 'react';
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
  const phaseOptions = ['Liquid', 'Two-phase', 'Gas'];
  const regimeOptions = ['Transient', 'Pseudosteady-State', 'Steady-State'];

  // Determine user units (or fallback)
  const userUnits = unitSystems[selectedUnitSystem as keyof typeof unitSystems] || {};

  // If user hasn't selected phase + (if Liquid) a flow regime, disable fields
  const canEditFields =
    iprPhase !== '' && (iprPhase !== 'Liquid' || flowRegime !== '');

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const parsed = parseFloat(value);
    // If it's NaN, default to 0 or some fallback
    setFormValues((prev: any) => ({
        ...prev,
        [name]: isNaN(parsed) ? 0 : parsed,
    }));
  };


  const handleTextChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'iprPhase') setIprPhase(value);
    if (name === 'flowRegime') setFlowRegime(value);
  };

  // Inline styles so each param is on one row:
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
          {phaseOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Flow Regime (if Liquid) */}
      {iprPhase === 'Liquid' && (
        <div style={rowStyle}>
          <label style={labelStyle}>Flow Regime:</label>
          <select
            name="flowRegime"
            value={flowRegime}
            onChange={handleTextChange}
            style={inputStyle}
          >
            <option value="">-- Select --</option>
            {regimeOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Shared fields */}
      <div style={rowStyle}>
        <label style={labelStyle}>Permeability, k:</label>
        <input
          type="number"
          step="any"
          name="k"
          value={formValues.k || ''}
          onChange={handleNumericChange}
          disabled={!canEditFields}
          style={inputStyle}
        />
        <span style={unitStyle}>
          ({userUnits.permeability || 'mD'})
        </span>
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Thickness, h:</label>
        <input
          type="number"
          step="any"
          name="h"
          value={formValues.h || ''}
          onChange={handleNumericChange}
          disabled={!canEditFields}
          style={inputStyle}
        />
        <span style={unitStyle}>
          ({userUnits.length || 'ft'})
        </span>
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>
          Formation Volume Factor, B<sub>o</sub>:
        </label>
        <input
          type="number"
          step="any"
          name="Bo"
          value={formValues.Bo || ''}
          onChange={handleNumericChange}
          disabled={!canEditFields}
          style={inputStyle}
        />
        <span style={unitStyle}>(bbl/STB)</span>
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>
          Oil Viscosity, μ<sub>o</sub>:
        </label>
        <input
          type="number"
          step="any"
          name="muo"
          value={formValues.muo || ''}
          onChange={handleNumericChange}
          disabled={!canEditFields}
          style={inputStyle}
        />
        <span style={unitStyle}>
          ({userUnits.viscosity || 'cp'})
        </span>
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Skin Factor, s:</label>
        <input
          type="number"
          step="any"
          name="s"
          value={formValues.s || ''}
          onChange={handleNumericChange}
          disabled={!canEditFields}
          style={inputStyle}
        />
        <span style={unitStyle}>(dimensionless)</span>
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Porosity, φ:</label>
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
          Total Compressibility, c<sub>t</sub>:
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
        <span style={unitStyle}>
          ({userUnits.compressibility || '1/psi'})
        </span>
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>
          Well radius, r<sub>w</sub>:
        </label>
        <input
          type="number"
          step="any"
          name="rw"
          value={formValues.rw || ''}
          onChange={handleNumericChange}
          disabled={!canEditFields}
          style={inputStyle}
        />
        <span style={unitStyle}>
          ({userUnits.length || 'ft'})
        </span>
      </div>

      {/* Transient Only */}
      {iprPhase === 'Liquid' && flowRegime === 'Transient' && (
        <>
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

      {/* Pseudosteady Only */}
      {iprPhase === 'Liquid' && flowRegime === 'Pseudosteady-State' && (
        <>
          <div style={rowStyle}>
            <label style={labelStyle}>
              Average Reservoir Pressure, p<sub>avg</sub>:
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
        </>
      )}

      {/* Steady Only */}
      {iprPhase === 'Liquid' && flowRegime === 'Steady-State' && (
        <>
          <div style={rowStyle}>
            <label style={labelStyle}>
              Boundary Reservoir Pressure, p<sub>e</sub>:
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

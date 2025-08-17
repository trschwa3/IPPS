/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

interface OPRGasFieldsProps {
  formValues: any;
  handleNumericChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTextChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  userUnits: Record<string, string>;
  diameterUnit: string;
  zMethod: string;
  zmethodOptions: string[];
}

export const OPRGasFields: React.FC<OPRGasFieldsProps> = ({
  formValues,
  handleNumericChange,
  handleTextChange,
  userUnits,
  diameterUnit,
  zMethod,
  zmethodOptions,
}) => (
  <fieldset style={{ marginTop: 12 }}>
    <legend>OPR — Single-phase Gas</legend>

    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.8rem' }}>
      <label style={{ width: '12rem' }}>Wellhead Pressure, pₕ:</label>
      <input type="number" step="any" name="p_wh" value={formValues.p_wh ?? ''} onChange={handleNumericChange} style={{ flex: 1 }} />
      <span style={{ marginLeft: '0.5rem' }}>({userUnits['pressure'] || 'psi'})</span>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.8rem' }}>
      <label style={{ width: '12rem' }}>Tubing I.D., D:</label>
      <input type="number" step="any" name="D" value={formValues.D ?? ''} onChange={handleNumericChange} style={{ flex: 1 }} />
      <span style={{ marginLeft: '0.5rem' }}>({diameterUnit})</span>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.8rem' }}>
      <label style={{ width: '12rem' }}>Relative Roughness, ε/D:</label>
      <input type="number" step="any" name="eps" value={formValues.eps ?? ''} onChange={handleNumericChange} style={{ flex: 1 }} />
      <span style={{ marginLeft: '0.5rem' }}>(dimensionless)</span>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.8rem' }}>
      <label style={{ width: '12rem' }}>Measured Length, L:</label>
      <input type="number" step="any" name="L" value={formValues.L ?? ''} onChange={handleNumericChange} style={{ flex: 1 }} />
      <span style={{ marginLeft: '0.5rem' }}>({userUnits['length'] || 'ft'})</span>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.8rem' }}>
      <label style={{ width: '12rem' }}>Inclination from horizontal, θ:</label>
      <input type="number" step="any" name="thetaDeg" value={formValues.thetaDeg ?? 90} onChange={handleNumericChange} style={{ flex: 1 }} />
      <span style={{ marginLeft: '0.5rem' }}>(deg)</span>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.8rem' }}>
      <label style={{ width: '12rem' }}>Gas Specific Gravity, Sg:</label>
      <input type="number" step="any" name="sg_g" value={formValues.sg_g ?? ''} onChange={handleNumericChange} style={{ flex: 1 }} />
      <span style={{ marginLeft: '0.5rem' }}>(dimensionless)</span>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.8rem' }}>
      <label style={{ width: '12rem' }}>Surface Temperature, Tₛ:</label>
      <input type="number" step="any" name="T_surf" value={formValues.T_surf ?? ''} onChange={handleNumericChange} style={{ flex: 1 }} />
      <span style={{ marginLeft: '0.5rem' }}>({userUnits['temperature'] || '°F'})</span>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.8rem' }}>
      <label style={{ width: '12rem' }}>Reservoir Temperature, Tᵣ:</label>
      <input type="number" step="any" name="T_res" value={formValues.T_res ?? ''} onChange={handleNumericChange} style={{ flex: 1 }} />
      <span style={{ marginLeft: '0.5rem' }}>({userUnits['temperature'] || '°F'})</span>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.8rem' }}>
      <label style={{ width: '12rem' }}>z Factor Correlation:</label>
      <select name="zMethod" value={zMethod} onChange={handleTextChange} style={{ flex: 1 }}>
        <option value="">-- Select --</option>
        {zmethodOptions.map((z) => (
          <option key={z} value={z}>
            {z}
          </option>
        ))}
      </select>
    </div>
  </fieldset>
);

export default OPRGasFields;

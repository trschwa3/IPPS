/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

interface OPROilFieldsProps {
  formValues: any;
  handleNumericChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  userUnits: Record<string, string>;
  diameterUnit: string;
}

export const OPROilFields: React.FC<OPROilFieldsProps> = ({ formValues, handleNumericChange, userUnits, diameterUnit }) => (
  <div style={{ marginTop: 12 }}>

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
      <label style={{ width: '12rem' }}>Density, ρ:</label>
      <input type="number" step="any" name="rho" value={formValues.rho ?? ''} onChange={handleNumericChange} style={{ flex: 1 }} />
      <span style={{ marginLeft: '0.5rem' }}>({userUnits['density'] || 'lbm/ft3'})</span>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.8rem' }}>
      <label style={{ width: '12rem' }}>Oil Viscosity, μ₀:</label>
      <input type="number" step="any" name="muo" value={formValues.muo ?? ''} onChange={handleNumericChange} style={{ flex: 1 }} />
      <span style={{ marginLeft: '0.5rem' }}>({userUnits['viscosity'] || 'cp'})</span>
    </div>
  </div>
);

export default OPROilFields;

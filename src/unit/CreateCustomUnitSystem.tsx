import React, { useState } from 'react';
import { UnitSystemDefinition } from './UnitSystems';

interface CreateCustomUnitSystemProps {
  onSave: (systemName: string, systemDefinition: UnitSystemDefinition) => void;
  onCancel: () => void;
}

// Predefined unit options for each dimension
const availableUnits = {
  mass: ['kg', 'lbm', 'slug', 'g'],
  force: ['N', 'lbf', 'kgf', 'kip', 'dyne'],
  velocity: ['m/s', 'ft/s', 'mph', 'km/h'],
  volume: ['m³', 'ft³', 'bbl', 'gal', 'L', 'Mscf'],
  density: ['kg/m³', 'lbm/ft³', 'lbm/gal'],
  pressure: ['Pa', 'kPa', 'MPa', 'mmHg', 'torr', 'bar', 'psi'],
  length: ['m', 'cm', 'mm', 'km', 'ft', 'in'],
  area: ['m²', 'ft²', 'acre', 'hectare', 'km²'],
  viscosity: ['Pa·s', 'cp', 'lbm/(ft·s)'],
  permeability: ['m²', 'darcy', 'mD', 'ft²'],
  temperature: ['K', '°C', '°F', '°R'],
} as const;

const CreateCustomUnitSystem: React.FC<CreateCustomUnitSystemProps> = ({ onSave, onCancel }) => {
  const [systemName, setSystemName] = useState('');
  const [systemDefinition, setSystemDefinition] = useState<UnitSystemDefinition>({
    mass: '',
    force: '',
    velocity: '',
    volume: '',
    density: '',
    pressure: '',
    length: '',
    area: '',
    viscosity: '',
    permeability: '',
    temperature: '',
  });

  const handleSystemNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSystemName(e.target.value);
  };

  // Update the specific dimension when a new unit is selected
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSystemDefinition((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!systemName.trim()) {
      alert('Please provide a system name.');
      return;
    }
    // Ensure every dimension has a selected unit
    for (const key of Object.keys(systemDefinition) as Array<keyof UnitSystemDefinition>) {
      if (!systemDefinition[key]) {
        alert(`Please select a unit for "${key}".`);
        return;
      }
    }
    onSave(systemName, systemDefinition);
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
      <h3>Create Custom Unit System</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            System Name:
            <input
              type="text"
              value={systemName}
              onChange={handleSystemNameChange}
              required
              style={{ marginLeft: '0.5rem' }}
            />
          </label>
        </div>

        {/* Render a dropdown for each dimension */}
        {Object.keys(availableUnits).map((dimension) => {
          const options = availableUnits[dimension as keyof typeof availableUnits];
          return (
            <div key={dimension} style={{ marginBottom: '0.5rem' }}>
              <label>
                {dimension}:
                <select
                  name={dimension}
                  value={systemDefinition[dimension as keyof UnitSystemDefinition]}
                  onChange={handleSelectChange}
                  required
                  style={{ marginLeft: '0.5rem' }}
                >
                  <option value="">-- select a unit --</option>
                  {options.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          );
        })}

        <div>
          <button type="submit">Save</button>
          <button type="button" onClick={onCancel} style={{ marginLeft: '0.5rem' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCustomUnitSystem;

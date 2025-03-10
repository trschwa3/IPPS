import React, { useState } from 'react';
import { UnitSystemDefinition } from './UnitSystems';
import UnitConverter from './UnitConverter';

interface CreateCustomUnitSystemProps {
  onSave: (systemName: string, systemDefinition: UnitSystemDefinition) => void;
  onCancel: () => void;
}

// Build available units from UnitConverter properties
const availableUnits = {
  mass: Object.keys(UnitConverter.massFactors),
  force: Object.keys(UnitConverter.forceFactors),
  velocity: Object.keys(UnitConverter.velocityFactors),
  flowrate: Object.keys(UnitConverter.flowrateFactors),
  volume: Object.keys(UnitConverter.volumeFactors),
  density: Object.keys(UnitConverter.densityFactors),
  pressure: Object.keys(UnitConverter.pressureFactors),
  length: Object.keys(UnitConverter.lengthFactors),
  area: Object.keys(UnitConverter.areaFactors),
  viscosity: Object.keys(UnitConverter.viscosityFactors),
  permeability: Object.keys(UnitConverter.permeabilityFactors),
  compressibility: Object.keys(UnitConverter.compressibilityFactors),
  oilFVF: Object.keys(UnitConverter.oilFVFFactors),
  gasFVF: Object.keys(UnitConverter.gasFVFFactors),
  GOR: Object.keys(UnitConverter.oilFVFFactors),
  energy: Object.keys(UnitConverter.energyFactors),
  time: Object.keys(UnitConverter.timeFactors),
  // Temperature is not defined in UnitConverter factors, so list manually:
  temperature: ['K', '°C', '°F', '°R'],
} as const;

const CreateCustomUnitSystem: React.FC<CreateCustomUnitSystemProps> = ({ onSave, onCancel }) => {
  const [systemName, setSystemName] = useState('');
  const [systemDefinition, setSystemDefinition] = useState<UnitSystemDefinition>({
    mass: '',
    force: '',
    velocity: '',
    flowrate: '',
    volume: '',
    density: '',
    pressure: '',
    length: '',
    area: '',
    viscosity: '',
    permeability: '',
    temperature: '',
    compressibility: '',
    gasFVF:'',
    oilFVF:'',
    gor:'',
    energy:'',
    time:''
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

        {/* Render a dropdown for each dimension based on availableUnits */}
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

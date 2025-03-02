import React, { useEffect, useState } from 'react';
import rawUnitSystems from './unit/unitSystems.json';
import type { UnitSystems, UnitSystemDefinition } from './unit/UnitSystems';
import CreateCustomUnitSystem from './unit/CreateCustomUnitSystem';
import './HomePage.css';
import { useNavigate } from 'react-router-dom';

// Default unit systems imported from JSON
const defaultUnitSystems = rawUnitSystems as UnitSystems;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedUnitSystem, setSelectedUnitSystem] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<string>('');
  // Holds both default and custom systems
  const [unitSystemsState, setUnitSystemsState] = useState<UnitSystems>(defaultUnitSystems);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Load custom systems from localStorage on mount
  useEffect(() => {
    const savedSystems = localStorage.getItem('customUnitSystems');
    if (savedSystems) {
      const parsed = JSON.parse(savedSystems) as UnitSystems;
      setUnitSystemsState((prev) => ({ ...prev, ...parsed }));
    }
  }, []);

  // Save only custom systems (those not in defaultUnitSystems) to localStorage
  useEffect(() => {
    const customSystems = Object.keys(unitSystemsState).reduce<UnitSystems>((acc, key) => {
      if (!defaultUnitSystems[key]) {
        acc[key] = unitSystemsState[key];
      }
      return acc;
    }, {});
    localStorage.setItem('customUnitSystems', JSON.stringify(customSystems));
  }, [unitSystemsState]);

  // Separate the keys for default and custom systems
  const defaultSystemKeys = Object.keys(defaultUnitSystems);
  const customSystemKeys = Object.keys(unitSystemsState).filter(
    (key) => !defaultSystemKeys.includes(key)
  );

  const handleUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedUnitSystem(e.target.value);
  };

  const handleAppChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const app = e.target.value;
    setSelectedApp(app);
    if (app === 'nodalAnalysis' && selectedUnitSystem) {
        navigate('/nodal-analysis', {
        state: { unitSystem: selectedUnitSystem },
        });
    }
    
  };

  const currentUnits = unitSystemsState[selectedUnitSystem as keyof UnitSystems];

  // Called when a custom system is saved
  const handleSaveCustomSystem = (systemName: string, definition: UnitSystemDefinition) => {
    setUnitSystemsState((prev) => ({
      ...prev,
      [systemName]: definition,
    }));
    setShowCreateForm(false);
  };

  // Delete a custom unit system
  const handleDeleteCustomSystem = (systemName: string) => {
    setUnitSystemsState((prev) => {
      const newSystems = { ...prev };
      delete newSystems[systemName];
      return newSystems;
    });
    if (selectedUnitSystem === systemName) {
      setSelectedUnitSystem('');
    }
  };

  return (
    <div className="container">
      <h1>Welcome to IPPS</h1>

      {/* Toggle the custom unit system creation form */}
      <button onClick={() => setShowCreateForm(!showCreateForm)}>
        {showCreateForm ? 'Close Custom System Form' : 'Add Custom Unit System'}
      </button>

      {showCreateForm && (
        <CreateCustomUnitSystem
          onSave={handleSaveCustomSystem}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Render default unit systems */}
      <section>
        <h2>Default Unit Systems</h2>
        {defaultSystemKeys.map((systemName) => (
          <label key={systemName} style={{ marginRight: '1rem' }}>
            <input
              type="radio"
              name="unitSystem"
              value={systemName}
              checked={selectedUnitSystem === systemName}
              onChange={handleUnitChange}
            />
            {systemName}
          </label>
        ))}
      </section>

      {/* Render custom unit systems if any exist */}
      {customSystemKeys.length > 0 && (
        <section>
          <h2>Custom Unit Systems</h2>
          {customSystemKeys.map((systemName) => (
            <div
              key={systemName}
              style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}
            >
              <label style={{ marginRight: '1rem' }}>
                <input
                  type="radio"
                  name="unitSystem"
                  value={systemName}
                  checked={selectedUnitSystem === systemName}
                  onChange={handleUnitChange}
                />
                {systemName}
              </label>
              <button onClick={() => handleDeleteCustomSystem(systemName)}>
                Delete
              </button>
            </div>
          ))}
        </section>
      )}

        <section>
        <h2>Select Application Window</h2>
        <select
            value={selectedApp}
            onChange={handleAppChange}
            disabled={!selectedUnitSystem} // Disable if no system is selected
        >
            <option value="">-- Choose an application --</option>
            <option value="nodalAnalysis">Nodal Analysis</option>
            {/* Other apps */}
        </select>
        </section>


      <section>
        <p>
          <strong>Selected Unit System:</strong> {selectedUnitSystem || 'None'}
        </p>
        <p>
          <strong>Selected Application:</strong> {selectedApp || 'None'}
        </p>
        {selectedUnitSystem && currentUnits && (
          <>
            <h3>Units for {selectedUnitSystem}:</h3>
            <ul>
              {(Object.entries(currentUnits) as [string, string][]).map(([property, unit]) => (
                <li key={property}>
                  <strong>{property}:</strong> {unit}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
};

export default HomePage;

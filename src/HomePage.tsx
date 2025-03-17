import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import rawUnitSystems from './unit/unitSystems.json';
import type { UnitSystems, UnitSystemDefinition } from './unit/UnitSystems';
import CreateCustomUnitSystem from './unit/CreateCustomUnitSystem';
import './HomePage.css';

import euFlag from "./Images/flags/eu.svg";
import ukFlag from "./Images/flags/gb.svg";
import usFlag from "./Images/flags/us.svg";
import SplashScreen from "./SplashScreen";

// Default unit systems imported from JSON
const defaultUnitSystems = rawUnitSystems as unknown as UnitSystems;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedUnitSystem, setSelectedUnitSystem] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<string>('');
  const [unitSystemsState, setUnitSystemsState] = useState<UnitSystems>(defaultUnitSystems);
  const [showCreateForm, setShowCreateForm] = useState(false);
  // Initialize showSplash based on sessionStorage: if already seen, do not show again.
  const [showSplash, setShowSplash] = useState(() => {
    return sessionStorage.getItem("hasSeenSplash") ? false : true;
  });

  // When the splash finishes (video ends or skip clicked), hide it and mark it in sessionStorage.
  const handleFinishSplash = () => {
    console.log("Splash finished");
    sessionStorage.setItem("hasSeenSplash", "true");
    setShowSplash(false);
  };

  useEffect(() => {
    console.log("showSplash:", showSplash);
  }, [showSplash]);

  // Load custom systems from localStorage on mount
  useEffect(() => {
    const savedSystems = localStorage.getItem('customUnitSystems');
    if (savedSystems) {
      const parsed = JSON.parse(savedSystems) as UnitSystems;
      setUnitSystemsState((prev) => ({ ...prev, ...parsed }));
    }
  }, []);

  // Save custom systems to localStorage when unitSystemsState changes
  useEffect(() => {
    const customSystems = Object.keys(unitSystemsState).reduce<UnitSystems>((acc, key) => {
      if (!defaultUnitSystems[key]) {
        acc[key] = unitSystemsState[key];
      }
      return acc;
    }, {});
    localStorage.setItem('customUnitSystems', JSON.stringify(customSystems));
  }, [unitSystemsState]);

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

  const handleSaveCustomSystem = (systemName: string, definition: UnitSystemDefinition) => {
    setUnitSystemsState((prev) => ({
      ...prev,
      [systemName]: definition,
    }));
    setShowCreateForm(false);
  };

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

  const getFlagForSystem = (systemName: string): { src?: string; alt?: string } => {
    if (systemName === 'SI') {
      return { src: euFlag, alt: 'EU Flag' };
    } else if (systemName === 'Imperial') {
      return { src: ukFlag, alt: 'UK Flag' };
    } else if (systemName === 'Oil Field') {
      return { src: usFlag, alt: 'US Flag' };
    }
    return {};
  };

  return (
    <>
      {/* Always render the splash screen. It will be visible only when showSplash is true. */}
      {showSplash && <SplashScreen onFinish={handleFinishSplash} />}
      
      {/* Main HomePage content, hidden while splash is active */}
      <div className="container" style={{ display: showSplash ? 'none' : 'block' }}>
        <h1>Welcome to IPPS</h1>

        <button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Close Custom System Form' : 'Add Custom Unit System'}
        </button>

        {showCreateForm && (
          <CreateCustomUnitSystem
            onSave={handleSaveCustomSystem}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        <section>
          <h2>Default Unit Systems</h2>
          {defaultSystemKeys.map((systemName) => {
            const { src, alt } = getFlagForSystem(systemName);
            return (
              <label key={systemName} style={{ marginRight: '1rem' }}>
                <input
                  type="radio"
                  name="unitSystem"
                  value={systemName}
                  checked={selectedUnitSystem === systemName}
                  onChange={handleUnitChange}
                />
                {src && (
                  <img
                    src={src}
                    alt={alt}
                    style={{ width: '24px', marginLeft: '0.5rem', marginRight: '0.25rem' }}
                  />
                )}
                {systemName}
              </label>
            );
          })}
        </section>

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
                <button onClick={() => handleDeleteCustomSystem(systemName)}>Delete</button>
              </div>
            ))}
          </section>
        )}

        <section>
          <h2>Select Application Window</h2>
          <select
            value={selectedApp}
            onChange={handleAppChange}
            disabled={!selectedUnitSystem}
          >
            <option value="">-- Choose an application --</option>
            <option value="nodalAnalysis">Nodal Analysis</option>
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
    </>
  );
};

export default HomePage;

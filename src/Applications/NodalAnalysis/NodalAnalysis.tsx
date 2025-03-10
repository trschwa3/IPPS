import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './NodalAnalysis.css';
import NodalAnalysisForm from './NodalAnalysisForm';
import IPRChart from './IPRChart';
import { calculateIPR } from './NodalAnalysisUtils';
import UnitConverter from '../../unit/UnitConverter';
import { OilFVFWidget } from "../../Widgets/OilFVFWidget";
import { OilViscosityWidget } from "../../Widgets/OilViscosityWidget";


import unitSystemsData from '../../unit/unitSystems.json';

interface UnitSystemDefinition {
  [key: string]: string | undefined; // allow string indexing
  pressure?: string;
  flowrate?: string;
  length?: string;
  permeability?: string;
  viscosity?: string;
  compressibility?: string;
  density?: string;
  oilFVF?: string; // If your JSON has a key for oil FVF
  time?: string;   // If your JSON tracks time units
  temperature?: string; // If your JSON tracks temperature units
}

const unitSystems = unitSystemsData as Record<string, UnitSystemDefinition>;

const NodalAnalysis: React.FC = () => {
  const [activeWidget, setActiveWidget] = useState<"visc" | "fvf" | "none">("none");
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { unitSystem: string } | null };
  const selectedUnitSystem = state?.unitSystem || 'Oil Field';

  const [iprPhase, setIprPhase] = useState('');
  const [flowRegime, setFlowRegime] = useState('');
  const [formValues, setFormValues] = useState<any>({});
  const [iprData, setIprData] = useState<Array<{ p_wf: number; q_o: number }>>([]);

  function convertToOilfield(values: any) {
    // Look up the user’s base units from the JSON
    const userUnits = unitSystems[selectedUnitSystem] || {};
  
    // Make a copy of the values
    const result = { ...values };

    const conversionMap = [
      { key: 'pi', type: 'pressure', standard: 'psi' },
      { key: 'pavg', type: 'pressure', standard: 'psi' },
      { key: 'pe', type: 'pressure', standard: 'psi' },
      { key: 'h', type: 'length', standard: 'ft' },
      { key: 'rw', type: 'length', standard: 'ft' },
      { key: 're', type: 'length', standard: 'ft' },
      { key: 'k', type: 'permeability', standard: 'mD' },
      { key: 'muo', type: 'viscosity', standard: 'cp' },
      { key: 'ct', type: 'compressibility', standard: '1/psi' },
      { key: 'T_res', type: 'temperature', standard: '°F' },
      // For oil FVF, check a specific key in userUnits (if available)
      { key: 'Bo', type: 'oil FVF', standard: 'bbl/STB', userKey: 'oilFVF' },
      { key: 't', type: 'time', standard: 'hrs' },
    ];
  
    conversionMap.forEach(({ key, type, standard, userKey }) => {
      if (result[key] !== undefined) {
        // Use the user's unit if available, otherwise use the standard unit.
        const fromUnit = (userKey ? userUnits[userKey] : userUnits[type]) || standard;
        result[key] = UnitConverter.convert(type, result[key], fromUnit, standard);
      }
    });
  
    // Handle spacingValue based on spacingMethod.
    if (result.spacingMethod === 'DeltaP' && result.spacingValue !== undefined) {
      const fromUnit = userUnits.pressure || 'psi';
      result.spacingValue = UnitConverter.convert('pressure', result.spacingValue, fromUnit, 'psi');
    } else if (result.spacingMethod === 'DeltaQ' && result.spacingValue !== undefined) {
      const fromUnit = userUnits.flowrate || 'STB/d';
      result.spacingValue = UnitConverter.convert('flowrate', result.spacingValue, fromUnit, 'STB/d');
    }
  
    return result;
  }
  

  const handleCalculate = () => {
    // Convert user inputs to Oil Field standard for everything.
    const oilfieldVals = convertToOilfield(formValues);

    // Now compute the IPR points in standard units.
    const newIprData = calculateIPR(
      {
        ...oilfieldVals,
        spacingMethod: oilfieldVals.spacingMethod,
        spacingValue: oilfieldVals.spacingValue,
      },
      iprPhase,
      flowRegime
    );

    // Save the result.
    setIprData(newIprData);
  };

  return (
    <div className="nodal-analysis-container">
      <h1>Nodal Analysis</h1>
      <button onClick={() => navigate('/')}>Go Back</button>

      {/* Dropdown to choose which widget to display */}
      <select
        value={activeWidget}
        onChange={(e) => setActiveWidget(e.target.value as "visc" | "fvf" | "none")}
      >
        <option value="none">Select a widget...</option>
        <option value="visc">Oil Viscosity</option>
        <option value="fvf">Oil FVF</option>
      </select>

      <div className="content-container">
        <NodalAnalysisForm
          iprPhase={iprPhase}
          setIprPhase={setIprPhase}
          flowRegime={flowRegime}
          setFlowRegime={setFlowRegime}
          formValues={formValues}
          setFormValues={setFormValues}
          onCalculate={handleCalculate}
          selectedUnitSystem={selectedUnitSystem}
        />
        <IPRChart 
        iprData={iprData} 
        selectedUnitSystem={selectedUnitSystem} 
        iprPhase={iprPhase} 
        />

        {/* Conditionally render the selected widget */}
        <div style={{ marginTop: "2rem" }}>
          {activeWidget === "visc" && (
            <OilViscosityWidget selectedUnitSystem={selectedUnitSystem} />
          )}
          {activeWidget === "fvf" && (
            <OilFVFWidget selectedUnitSystem={selectedUnitSystem} />
          )}
        </div>
      </div>
    </div>
  );
};

export default NodalAnalysis;

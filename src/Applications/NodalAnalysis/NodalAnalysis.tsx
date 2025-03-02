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
  pressure?: string;
  flowrate?: string;
  length?: string;
  permeability?: string;
  viscosity?: string;
  compressibility?: string;
  density?: string;
  oilFVF?: string; // If your JSON has a key for oil FVF
  time?: string;   // If your JSON tracks time units
  // ... any others
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

    // Copy the user’s form values
    const result = { ...values };

    // 1) Convert all relevant PRESSURE fields (psi)
    if (result.pi !== undefined) {
      result.pi = UnitConverter.convert(
        'pressure',
        result.pi,
        userUnits.pressure || 'psi',
        'psi'
      );
    }
    if (result.pavg !== undefined) {
      result.pavg = UnitConverter.convert(
        'pressure',
        result.pavg,
        userUnits.pressure || 'psi',
        'psi'
      );
    }
    if (result.pe !== undefined) {
      result.pe = UnitConverter.convert(
        'pressure',
        result.pe,
        userUnits.pressure || 'psi',
        'psi'
      );
    }

    // 2) Convert LENGTH fields (ft)
    if (result.h !== undefined) {
      result.h = UnitConverter.convert(
        'length',
        result.h,
        userUnits.length || 'ft',
        'ft'
      );
    }
    if (result.rw !== undefined) {
      result.rw = UnitConverter.convert(
        'length',
        result.rw,
        userUnits.length || 'ft',
        'ft'
      );
    }
    if (result.re !== undefined) {
      result.re = UnitConverter.convert(
        'length',
        result.re,
        userUnits.length || 'ft',
        'ft'
      );
    }

    // 3) Convert PERMEABILITY (mD)
    if (result.k !== undefined) {
      result.k = UnitConverter.convert(
        'permeability',
        result.k,
        userUnits.permeability || 'mD',
        'mD'
      );
    }

    // 4) Convert VISCOSITY (cp)
    if (result.muo !== undefined) {
      result.muo = UnitConverter.convert(
        'viscosity',
        result.muo,
        userUnits.viscosity || 'cp',
        'cp'
      );
    }

    // 5) Convert COMPRESSIBILITY (1/psi)
    if (result.ct !== undefined) {
      result.ct = UnitConverter.convert(
        'compressibility',
        result.ct,
        userUnits.compressibility || '1/psi',
        '1/psi'
      );
    }

    // 6) Convert FORMATION VOLUME FACTOR, Bo (bbl/STB)
    //    Only if your JSON has a key for FVF, e.g. "oilFVF"
    if (result.Bo !== undefined && userUnits.oilFVF) {
      result.Bo = UnitConverter.convert(
        'oil FVF',
        result.Bo,
        userUnits.oilFVF,
        'bbl/STB'
      );
    }

    // 7) Convert TIME, t (hr) if your code uses hours
    if (result.t !== undefined && userUnits.time && userUnits.time !== 'hr') {
      result.t = UnitConverter.convert('time', result.t, userUnits.time, 'hr');
    }

    // 8) Convert spacingValue if it’s a pressure increment or flowrate increment
    //    (DeltaP => psi, DeltaQ => STB/d). If your code uses STB/d for flow.
    if (result.spacingMethod === 'DeltaP' && result.spacingValue !== undefined) {
      result.spacingValue = UnitConverter.convert(
        'pressure',
        result.spacingValue,
        userUnits.pressure || 'psi',
        'psi'
      );
    } else if (result.spacingMethod === 'DeltaQ' && result.spacingValue !== undefined) {
      result.spacingValue = UnitConverter.convert(
        'flowrate',
        result.spacingValue,
        userUnits.flowrate || 'STB/d',
        'STB/d'
      );
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
        <IPRChart iprData={iprData} selectedUnitSystem={selectedUnitSystem} />

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

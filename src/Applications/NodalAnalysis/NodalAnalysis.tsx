// NodalAnalysis.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './NodalAnalysis.css';
import NodalAnalysisForm from './NodalAnalysisForm';
import IPRChart from './IPRChart';
import { calculateIPR, calculateOPR_SinglePhaseOil } from './NodalAnalysisUtils'; // ⬅️ add OPR import
import UnitConverter from '../../unit/UnitConverter';
import { OilFVFWidget } from "../../Widgets/OilFVFWidget";
import { OilViscosityWidget } from "../../Widgets/OilViscosityWidget";
import unitSystemsData from '../../unit/unitSystems.json';

type FrictionModel =
  | 'Chen (1979)'
  | 'Swamee-Jain'
  | 'Colebrook-White'
  | 'Laminar (auto)';

interface UnitSystemDefinition {
  [key: string]: string | undefined;
  pressure?: string;
  flowrate?: string;
  length?: string;
  permeability?: string;
  viscosity?: string;
  compressibility?: string;
  density?: string;
  oilFVF?: string;
  time?: string;
  temperature?: string;
}

const unitSystems = unitSystemsData as Record<string, UnitSystemDefinition>;

const NodalAnalysis: React.FC = () => {
  const [activeWidget, setActiveWidget] = useState<"visc" | "fvf" | "none">("none");
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { unitSystem: string } | null };
  const selectedUnitSystem = state?.unitSystem || 'Oil Field';

  // NEW: IPR/OPR mode + friction-factor model
  const [inputMode, setInputMode] = useState<'IPR' | 'OPR'>('IPR');
  const [frictionModel, setFrictionModel] = useState<FrictionModel>('Chen (1979)');

  const [iprPhase, setIprPhase] = useState('');
  const [zMethod, setzMethod] = useState('');
  const [flowRegime, setFlowRegime] = useState('');
  interface FormValues { [key: string]: number | string | undefined }
  const [formValues, setFormValues] = useState<FormValues>({});

  const [iprData, setIprData] = useState<Array<{ p_wf: number; q_o: number }>>([]);
  const [oprData, setOprData] = useState<Array<{ p_wf: number; q_o: number }>>([]); // ⬅️ NEW

  function convertToOilfield(values: FormValues) {
    const userUnits = (unitSystems[selectedUnitSystem] as Record<string, string>) || {};
    const result: FormValues = { ...values };

    const conversionMap: Array<{ key: string; type: string; standard: string; userKey?: string }> = [
      { key: 'pi', type: 'pressure', standard: 'psi' },
      { key: 'p_avg', type: 'pressure', standard: 'psi' },
      { key: 'pe', type: 'pressure', standard: 'psi' },
      { key: 'h', type: 'length', standard: 'ft' },
      { key: 'rw', type: 'length', standard: 'ft' },
      { key: 're', type: 'length', standard: 'ft' },
      { key: 'k', type: 'permeability', standard: 'mD' },
      { key: 'muo', type: 'viscosity', standard: 'cp' },
      { key: 'ct', type: 'compressibility', standard: '1/psi' },
      { key: 'T_res', type: 'temperature', standard: '°F' },
      { key: 'Bo', type: 'oil FVF', standard: 'bbl/STB', userKey: 'oilFVF' },
      { key: 't', type: 'time', standard: 'hrs' },
      // OPR
      { key: 'L', type: 'length', standard: 'ft' },
      { key: 'eps', type: 'length', standard: 'ft' },
      { key: 'p_wh', type: 'pressure', standard: 'psi' },
    ];

    conversionMap.forEach(({ key, type, standard, userKey }) => {
      const value = result[key];
      if (value !== undefined) {
        const fromUnit = userUnits[userKey ?? type] || standard;
        result[key] = UnitConverter.convert(type, Number(value), fromUnit, standard);
      }
    });

    // Density: support lbm/gal → lbm/ft3 directly
    if (result.rho !== undefined) {
      const fromRhoUnit = userUnits.density || 'lbm/ft3';
      if (String(fromRhoUnit).toLowerCase().includes('lbm/gal')) {
        result.rho = Number(result.rho) * 7.48051945; // gal→ft3
      } else {
        result.rho = UnitConverter.convert('density', Number(result.rho), fromRhoUnit, 'lbm/ft3');
      }
    }

    // Convert tubing ID → inches (store D_in)
    if (result.D !== undefined) {
      const fromLen = userUnits.length || 'ft';
      const D_ft = UnitConverter.convert('length', Number(result.D), fromLen, 'ft');
      result.D_in = D_ft * 12.0;
    }

    // Angle as number
    if (result.thetaDeg !== undefined) result.thetaDeg = Number(result.thetaDeg);

    // Spacing conversions (keep the labels you show in the UI)
    if (result.spacingMethod === 'Delta Pressure' && result.spacingValue !== undefined) {
      const fromUnit = userUnits.pressure || 'psi';
      result.spacingValue = UnitConverter.convert('pressure', Number(result.spacingValue), fromUnit, 'psi');
    } else if (result.spacingMethod === 'Delta Flowrate' && result.spacingValue !== undefined) {
      const fromUnit = userUnits.flowrate || 'STB/day';
      result.spacingValue = UnitConverter.convert('flowrate', Number(result.spacingValue), fromUnit, 'STB/day');
    }

    return result;
  }


  const handleCalculate = () => {
    const oilfieldVals = convertToOilfield(formValues);

    if (inputMode === 'IPR') {
      const newIprData = calculateIPR({ ...oilfieldVals, spacingMethod: oilfieldVals.spacingMethod, spacingValue: oilfieldVals.spacingValue }, iprPhase, flowRegime, zMethod);
      setIprData(newIprData);
    } else {
      // hint: max IPR q if it’s an oil IPR; otherwise undefined
      const iprMaxQHint =
        iprData && iprData.length && iprPhase !== 'Gas'
          ? Math.max(...iprData.map(p => p.q_o))
          : undefined;

      const newOprData = calculateOPR_SinglePhaseOil({
        ...oilfieldVals,
        frictionModel,
        qHint: iprMaxQHint, // ← optional
      });
      setOprData(newOprData);
    }
  };


  return (
    <div className="nodal-analysis-container">
      <h1>Nodal Analysis</h1>
      <button onClick={() => navigate('/')}>Go Back</button>

      {/* Widget chooser (unchanged) */}
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
          inputMode={inputMode}
          setInputMode={setInputMode}
          iprPhase={iprPhase}
          zMethod={zMethod}
          setIprPhase={setIprPhase}
          setzMethod={setzMethod}
          flowRegime={flowRegime}
          setFlowRegime={setFlowRegime}
          formValues={formValues}
          setFormValues={setFormValues}
          onCalculate={handleCalculate}
          selectedUnitSystem={selectedUnitSystem}
          frictionModel={frictionModel}
          setFrictionModel={(m) => setFrictionModel(m as FrictionModel)}
        />

        {/* Chart now can plot both series */}
        <IPRChart
          iprData={iprData}
          oprData={oprData}                 // ⬅️ NEW
          selectedUnitSystem={selectedUnitSystem}
          iprPhase={iprPhase}
        />

        <div style={{ marginTop: "2rem" }}>
          {activeWidget === "visc" && <OilViscosityWidget selectedUnitSystem={selectedUnitSystem} />}
          {activeWidget === "fvf" && <OilFVFWidget selectedUnitSystem={selectedUnitSystem} />}
        </div>
      </div>
    </div>
  );
};

export default NodalAnalysis;

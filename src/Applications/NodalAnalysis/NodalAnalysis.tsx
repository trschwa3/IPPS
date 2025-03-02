// src/Applications/NodalAnalysis/NodalAnalysis.tsx

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './NodalAnalysis.css';
import NodalAnalysisForm from './NodalAnalysisForm';
import IPRChart from './IPRChart';
import { calculateIPR } from './NodalAnalysisUtils';
import './nodalAnalysis.css';

// 1) Define a type for each unit-system entry
interface UnitSystemConfig {
  permeability?: string;      // "mD", "m2", etc.
  length?: string;            // "ft", "m", etc.
  pressure?: string;          // "psi", "bar", etc.
  viscosity?: string;         // "cp", "cP", "Pa.s", etc.
  compressibility?: string;   // "1/psi", "1/Pa", ...
  time?: string;              // "hr", "s", ...
  flowrate?: string;          // "STB/day", "m3/s", ...
}

// 2) Import your JSON as a typed record
import unitSystemsData from '../../unit/unitSystems.json';
const unitSystems = unitSystemsData as Record<string, UnitSystemConfig>;

// 3) Import your converter (which presumably has the .convert(...) method)
import UnitConverter from '../../unit/UnitConverter';

interface IPRPoint {
  p_wf: number;
  q_o: number;
}

const NodalAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { unitSystem: string } | null };
  // Fallback to "Oil Field" if user didn't pass a system
  const selectedUnitSystem = state?.unitSystem || 'Oil Field';

  // Form states
  const [iprPhase, setIprPhase] = useState('');
  const [flowRegime, setFlowRegime] = useState('');
  const [formValues, setFormValues] = useState<Record<string, number | undefined>>({});
  const [iprData, setIprData] = useState<IPRPoint[]>([]);

  /**
   * Converts all user inputs from whatever the `selectedUnitSystem` is
   * into the "Oil Field" standard. If the user system is already "Oil Field,"
   * no numeric conversions are needed (besides e.g. fraction vs. percent for φ).
   */
  function convertToOilfield(values: Record<string, number | undefined>) {
    // 1) Identify user from-units
    const userPermeability = unitSystems[selectedUnitSystem]?.permeability ?? 'mD';
    const userLength       = unitSystems[selectedUnitSystem]?.length       ?? 'ft';
    const userPressure     = unitSystems[selectedUnitSystem]?.pressure     ?? 'psi';
    const userViscosity    = unitSystems[selectedUnitSystem]?.viscosity    ?? 'cp';
    const userComp         = unitSystems[selectedUnitSystem]?.compressibility ?? '1/psi';
    const userTime         = unitSystems[selectedUnitSystem]?.time         ?? 'hr';
    // etc. if you track flow rates, temperatures, etc.

    // 2) Extract user inputs (with fallback 0)
    let k_mD       = values.k   ?? 0;
    let h_ft       = values.h   ?? 0;
    let pi_psi     = values.pi  ?? 0;
    let muo_cp     = values.muo ?? 0;
    let re_ft      = values.re  ?? 0;
    let rw_ft      = values.rw  ?? 0;
    let t_input    = values.t   ?? 0;
    let ct_input   = values.ct  ?? 0;

    // B_o, s, phi, etc. can be dimensionless or partial conversions
    let Bo_user  = values.Bo  ?? 1; // if user always enters bbl/STB
    let s_user   = values.s   ?? 0; // dimensionless
    let phi_user = values.phi ?? 0; // if user typed % -> convert fraction

    // If your form says "Porosity (%)" but you store fraction,
    // convert from e.g. 20 -> 0.20
    // If the user is indeed entering fraction directly, skip this.
    phi_user = phi_user / 100; // if user typed 20 meaning 20%

    // 3) Convert each parameter from user’s units → Oil Field
    if (userPermeability !== 'mD') {
      k_mD = UnitConverter.convert('permeability', k_mD, userPermeability, 'mD');
    }
    if (userLength !== 'ft') {
      h_ft  = UnitConverter.convert('length', h_ft,  userLength, 'ft');
      re_ft = UnitConverter.convert('length', re_ft, userLength, 'ft');
      rw_ft = UnitConverter.convert('length', rw_ft, userLength, 'ft');
    }
    if (userPressure !== 'psi') {
      pi_psi = UnitConverter.convert('pressure', pi_psi, userPressure, 'psi');
    }
    if (userViscosity !== 'cp') {
      muo_cp = UnitConverter.convert('viscosity', muo_cp, userViscosity, 'cp');
    }

    // Compressibility might be from 1/Pa => 1/psi
    // If userComp is '1/Pa' or something, do the appropriate conversion.
    // You can refine this as needed.
    if (userComp !== '1/psi') {
      // Example logic if we see userComp = '1/Pa'
      if (userComp === '1/Pa') {
        ct_input = ct_input * 6894.76; // multiply by 1 psi / 6894.76 Pa
      } 
      // else if (userComp === '1/kPa') { ... } etc.
    }

    // Time -> if user typed seconds but your formula wants hours
    if (userTime !== 'hr') {
      // Example: if userTime is 's'
      if (userTime === 's') {
        t_input = t_input / 3600; // convert s to hr
      }
    }
    // 4) Return an object with the corrected / standardized values
    return {
      // Original object spread if you want
      ...values,

      // Overwrite or add the converted fields
      k:   k_mD,
      h:   h_ft,
      pi:  pi_psi,
      muo: muo_cp,
      re:  re_ft,
      rw:  rw_ft,
      t:   t_input,
      ct:  ct_input,

      // dimensionless or partially converted fields
      Bo:  Bo_user,
      s:   s_user,
      phi: phi_user,
    };
  }

  const handleCalculate = () => {
    const oilfieldVals = convertToOilfield(formValues);
    console.log('Converted values → Oil Field:', oilfieldVals, iprPhase, flowRegime);
    const newIprData = calculateIPR(oilfieldVals, iprPhase, flowRegime);
    console.log('Calculated IPR data:', newIprData);
    setIprData(newIprData);
  };

  return (
    <div className="nodal-analysis-container">
      <h1>Nodal Analysis</h1>
      <button onClick={() => navigate('/')}>Go Back</button>

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
        <IPRChart iprData={iprData} />
      </div>
    </div>
  );
};

export default NodalAnalysis;

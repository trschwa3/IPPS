import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './NodalAnalysis.css';
import NodalAnalysisForm from './NodalAnalysisForm';
import IPRChart from './IPRChart';
import { calculateIPR } from './NodalAnalysisUtils';
import unitSystems from '../../unit/unitSystems.json';
import UnitConverter from '../../unit/UnitConverter';

const NodalAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { unitSystem: string } | null };
  const selectedUnitSystem = state?.unitSystem || 'Oil Field';

  const [iprPhase, setIprPhase] = useState('');
  const [flowRegime, setFlowRegime] = useState('');
  const [formValues, setFormValues] = useState<any>({});
  const [iprData, setIprData] = useState<Array<{ p_wf: number; q_o: number }>>([]);

  // Example converter, same as before
  function convertToOilfield(values: any) {
    // Snip: your normal code that converts k->mD, h->ft, etc.
    // Just be sure to keep `spacingMethod` and `spacingValue` unaltered.
    return {
      ...values,
      // your unit conversions...
    };
  }

  const handleCalculate = () => {
    // Convert to standard units
    const oilfieldVals = convertToOilfield(formValues);

    // Call your IPR with spacingMethod/spacingValue
    const newIprData = calculateIPR(
      {
        ...oilfieldVals,
        spacingMethod: formValues.spacingMethod,
        spacingValue: formValues.spacingValue,
      },
      iprPhase,
      flowRegime
    );

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

// src/Applications/NodalAnalysis/NodalResults.tsx
import React from 'react';

interface NodalResultsProps {
  iprPhase: string;
  oprPhase: string;
  iprFlowRegime: string;
  iprData: Array<{ p_wf: number; q_o: number }>;
  oprData: Array<{ bottomHolePressure: number; tubingPressure: number }>;
}

const NodalResults: React.FC<NodalResultsProps> = ({
  iprPhase,
  oprPhase,
  iprFlowRegime,
  iprData,
  oprData,
}) => {
  return (
    <div>
      <h2>Nodal Analysis Results</h2>
      <p>
        <strong>IPR Phase:</strong> {iprPhase}
      </p>
      <p>
        <strong>OPR Phase:</strong> {oprPhase}
      </p>
      {iprPhase === 'Liquid' && (
        <p>
          <strong>Flow Regime:</strong> {iprFlowRegime}
        </p>
      )}

      {/* Example: Show raw IPR data */}
      <h3>IPR Data</h3>
      {iprData.length > 0 ? (
        <pre>{JSON.stringify(iprData, null, 2)}</pre>
      ) : (
        <p>No IPR data calculated yet.</p>
      )}

      {/* Example: Show raw OPR data */}
      <h3>OPR Data</h3>
      {oprData.length > 0 ? (
        <pre>{JSON.stringify(oprData, null, 2)}</pre>
      ) : (
        <p>No OPR data calculated yet.</p>
      )}

    </div>
  );
};

export default NodalResults;

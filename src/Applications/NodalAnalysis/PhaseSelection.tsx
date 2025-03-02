// src/Applications/NodalAnalysis/PhaseSelection.tsx
import React, { useState } from 'react';

interface PhaseSelectionProps {
  onSubmit: (iprPhase: string, oprPhase: string, iprFlowRegime: string) => void;
}

const PhaseSelection: React.FC<PhaseSelectionProps> = ({ onSubmit }) => {
  const iprOptions = ['Liquid', 'Two-phase', 'Gas'];
  const oprOptions = ['Liquid', 'Two-phase', 'Gas'];
  
  // Flow regime options for single-phase (liquid) IPR
  const flowRegimeOptions = ['Transient', 'Pseudosteady-State', 'Steady-State'];

  const [selectedIpr, setSelectedIpr] = useState('');
  const [selectedOpr, setSelectedOpr] = useState('');
  const [selectedFlowRegime, setSelectedFlowRegime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIpr || !selectedOpr) {
      alert('Please select a phase for both IPR and OPR.');
      return;
    }
    // If user picked "Liquid" for IPR, we require a flow regime
    if (selectedIpr === 'Liquid' && !selectedFlowRegime) {
      alert('Please select a flow regime for Liquid IPR.');
      return;
    }
    onSubmit(selectedIpr, selectedOpr, selectedFlowRegime);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          IPR Phase:
          <select value={selectedIpr} onChange={(e) => setSelectedIpr(e.target.value)}>
            <option value="">-- Select IPR Phase --</option>
            {iprOptions.map((phase) => (
              <option key={phase} value={phase}>
                {phase}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Conditionally show flow regime dropdown if user selected 'Liquid' for IPR */}
      {selectedIpr === 'Liquid' && (
        <div>
          <label>
            IPR Flow Regime:
            <select
              value={selectedFlowRegime}
              onChange={(e) => setSelectedFlowRegime(e.target.value)}
            >
              <option value="">-- Select Flow Regime --</option>
              {flowRegimeOptions.map((regime) => (
                <option key={regime} value={regime}>
                  {regime}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div>
        <label>
          OPR Phase:
          <select value={selectedOpr} onChange={(e) => setSelectedOpr(e.target.value)}>
            <option value="">-- Select OPR Phase --</option>
            {oprOptions.map((phase) => (
              <option key={phase} value={phase}>
                {phase}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button type="submit">Continue</button>
    </form>
  );
};

export default PhaseSelection;

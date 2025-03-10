import React, { useState, ChangeEvent, FormEvent } from 'react';

interface PhaseSelectionProps {
  onSubmit: (iprPhase: string, oprPhase: string, iprFlowRegime: string) => void;
}

const PhaseSelection: React.FC<PhaseSelectionProps> = ({ onSubmit }) => {
  const iprOptions = ['Liquid', 'Two-phase', 'Gas'];
  const oprOptions = ['Liquid', 'Two-phase', 'Gas'];
  const flowRegimeOptions = ['Transient', 'Pseudosteady-State', 'Steady-State'];

  // Consolidate all selection state into one object.
  const [selection, setSelection] = useState({
    iprPhase: '',
    oprPhase: '',
    iprFlowRegime: '',
  });

  // Single change handler that updates the state based on the select's "name" attribute.
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSelection(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selection.iprPhase || !selection.oprPhase) {
      alert('Please select a phase for both IPR and OPR.');
      return;
    }
    // For Liquid and Gas, require an explicit flow regime selection.
    // For Two-phase, default to Pseudosteady-State if none is chosen.
    const iprFlowRegime =
      selection.iprPhase === 'Two-phase'
        ? selection.iprFlowRegime || 'Pseudosteady-State'
        : selection.iprFlowRegime;
    if ((selection.iprPhase === 'Liquid' || selection.iprPhase === 'Gas') && !iprFlowRegime) {
      alert('Please select a flow regime for IPR.');
      return;
    }
    onSubmit(selection.iprPhase, selection.oprPhase, iprFlowRegime);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          IPR Phase:
          <select name="iprPhase" value={selection.iprPhase} onChange={handleChange}>
            <option value="">-- Select IPR Phase --</option>
            {iprOptions.map(phase => (
              <option key={phase} value={phase}>
                {phase}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Show flow regime selection for Liquid and Gas */}
      {(selection.iprPhase === 'Liquid' || selection.iprPhase === 'Gas') && (
        <div>
          <label>
            IPR Flow Regime:
            <select
              name="iprFlowRegime"
              value={selection.iprFlowRegime}
              onChange={handleChange}
            >
              <option value="">-- Select Flow Regime --</option>
              {flowRegimeOptions.map(regime => (
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
          <select name="oprPhase" value={selection.oprPhase} onChange={handleChange}>
            <option value="">-- Select OPR Phase --</option>
            {oprOptions.map(phase => (
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

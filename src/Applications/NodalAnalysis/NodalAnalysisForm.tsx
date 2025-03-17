import React, { useEffect } from 'react';
import unitSystems from '../../unit/unitSystems.json';

interface NodalAnalysisFormProps {
  iprPhase: string;
  zMethod: string;
  setIprPhase: (phase: string) => void;
  setzMethod: (phase: string) => void;
  flowRegime: string;
  setFlowRegime: (regime: string) => void;
  formValues: any;
  setFormValues: (vals: any) => void;
  onCalculate: () => void;
  selectedUnitSystem: string;
}


const NodalAnalysisForm: React.FC<NodalAnalysisFormProps> = ({
  iprPhase,
  zMethod,
  setIprPhase,
  setzMethod,
  flowRegime,
  setFlowRegime,
  formValues,
  setFormValues,
  onCalculate,
  selectedUnitSystem,
}) => {
  
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});
   

  useEffect(() => {
    if (iprPhase === 'Two-phase' && flowRegime !== 'Pseudosteady-State') {
      setFlowRegime('Pseudosteady-State');
    }
  }, [iprPhase, flowRegime, setFlowRegime]);

  const gas_oil_phaseOptions = ['Liquid', 'Two-phase', 'Gas'];
  const regimeOptions = ['Transient', 'Pseudosteady-State', 'Steady-State'];
  const zmethodOptions = ['Dranchuk & Abou-Kassem - 1975', 'Dranchuk, Purvis & Robinson - 1974', 
                          'Redlich Kwong - 1949', 'Brill & Beggs - 1974']
  let spacingMethods = ['NumPoints', 'DeltaP', 'DeltaQ'];
  if (iprPhase === 'Gas' || iprPhase === "Two-phase") {
    spacingMethods = ['NumPoints', 'DeltaP', 'DeltaQ'];
  }
  if (iprPhase === 'Gas') {
    spacingMethods = ['NumPoints', 'DeltaP'];
  }
  
  // Identify units from JSON (or fallback to Oil Field style)
  const userUnits = unitSystems[selectedUnitSystem as keyof typeof unitSystems] || {};

  // Disable fields if phase or (for Liquid & gas) flow regime is not selected
  const canEditFields =
    iprPhase !== '' && (iprPhase !== 'Liquid' || flowRegime !== '');

  /** Reusable numeric input handler */
  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // If user clears the input
    if (value === "") {
      setErrors((prev) => ({ ...prev, [name]: "" }));
      setFormValues((prev: any) => ({ ...prev, [name]: "" }));
      return;
    }
  
    let parsed = parseFloat(value);
  
    // Example special case for 'pb'
    if (name === "pb" && isNaN(parsed)) {
      parsed = formValues.pavg || 3000;
    }
  
    // 1) Validate using our helper
    const errorMsg = validateField(name, parsed);
  
    // 2) Update error state
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  
    // 3) Update the form value
    setFormValues((prev: any) => ({
      ...prev,
      [name]: parsed,
    }));
  };
  
  

  /** Reusable select/text input handler */
  const handleTextChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'iprPhase') {
      setIprPhase(value);
    } else if (name === 'flowRegime') {
      setFlowRegime(value);
    } else if (name === 'zMethod') {
      setzMethod(value);
    } else {
      setFormValues((prev: any) => ({
        ...prev,
        [name]: value,
      }));
    }} 

  // Inline style helpers
  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.8rem',
  };
  const labelStyle: React.CSSProperties = {
    minWidth: '180px',
    marginRight: '0.5rem',
    fontWeight: 500,
  };
  const inputStyle: React.CSSProperties = {
    width: '100px',
    marginRight: '0.5rem',
  };
  const selectStyle: React.CSSProperties = {
    width: '220px', // or 100% if you prefer
    marginRight: '0.5rem',
  };  
  const unitStyle: React.CSSProperties = {
    fontStyle: 'italic',
    color: '#666',
  };

  const oilcommonFields = [
    { name: 'k', label: 'Permeability, k', unit: userUnits.permeability || 'mD', min: 0 },
    { name: 'h', label: 'Thickness, h', unit: userUnits.length || 'ft', min: 1 },
    { name: 'Bo', label: 'Formation Vol. Factor, B₀', unit: userUnits.oilFVF || 'bbl/STB', min: 0 },
    { name: 'muo', label: 'Oil Viscosity, μ₂', unit: userUnits.viscosity || 'cp', min: 0 },
    { name: 's', label: 'Skin Factor, s', unit: 'dimensionless', min: -7, max: 100 },
    { name: 'rw', label: 'Well radius, rₒ', unit: userUnits.length || 'ft', min: 0 },
  ];
  
  const gascommonFields = [
    { name: 'k', label: 'Permeability, k', unit: userUnits.permeability || 'mD', min: 0 },
    { name: 'h', label: 'Thickness, h', unit: userUnits.length || 'ft', min: 1 },
    { name: 's', label: 'Skin Factor, s', unit: 'dimensionless', min: -7, max: 100 },
    { name: 'rw', label: 'Well radius, rₒ', unit: userUnits.length || 'ft', min: 0 },
    { name: 'sg_g', label: 'Gas Specific Gravity, Sg', unit: 'dimensionless', min: 0.56, max: 1},
    { name: 'T_res', label: 'Reservoir Temperature, Tᵣ', unit: userUnits.temperature || '°F', min: 100, max: 350 },
  ];
  
  const validateField = (fieldName: string, value: number): string => {
    //
    // 1) First, see if this field is in the oilcommonFields or gascommonFields arrays.
    //
    let field =
      oilcommonFields.find((f) => f.name === fieldName) ||
      gascommonFields.find((f) => f.name === fieldName);
  
    // If found in the arrays => apply min/max checks from the field object
    if (field) {
      if (field.min !== undefined && value < field.min) {
        return `Must be at least ${field.min}`;
      }
      if (field.max !== undefined && value > field.max) {
        return `Must be at most ${field.max}`;
      }
      // If it's in those arrays, we return here if valid
      return "";
    }

    if (fieldName === "phi") {
      // Porosity: 1 <= phi <= 50
      if (value < 1) return "Must be >= 1%";
      if (value > 50) return "Must be <= 50%";
      return "";
    }
    if (fieldName === "ct") {
      // Compressibility: 1e-7 <= ct <= 1e-3
      if (value < 1e-7) return "Must be at least 1e-7";
      if (value > 1e-3) return "Must be at most 1e-3";
      return "";
    }
    if (fieldName === "t") {
      // Time: 1e-3 <= t <= 10000
      if (value < 1e-3) return "Must be >= 0.001 hrs";
      if (value > 10000) return "Must be <= 10000 hrs";
      return "";
    }
    if (fieldName === "pi") {
      // initial reservoir pressure: 500 <= pi <= 20000
      if (value < 500) return "Must be >= 500 psi";
      if (value > 20000) return "Must be <= 20000 psi";
      return "";
    }
  
    // Liquid or Gas pseudosteady
    if (fieldName === "pavg" || fieldName === "p_avg") {
      // average reservoir pressure: 500 <= pavg <= 20000
      if (value < 500) return "Must be >= 500 psi";
      if (value > 20000) return "Must be <= 20000 psi";
      return "";
    }
    if (fieldName === "pb") {
      // saturation pressure: 300 <= pb <= 5000
      if (value < 300) return "Must be >= 300 psi";
      if (value > 5000) return "Must be <= 5000 psi";
      return "";
    }
    if (fieldName === "a") {
      // bowedness: 0.8 <= a <= 1
      if (value < 0.8) return "Must be at least 0.8";
      if (value > 1) return "Must be at most 1.0";
      return "";
    }
  
    // Liquid or Gas steady-state
    if (fieldName === "pe") {
      // boundary pressure: 500 <= pe <= 20000
      if (value < 500) return "Must be >= 500 psi";
      if (value > 20000) return "Must be <= 20000 psi";
      return "";
    }
  
    if (fieldName === "re") {
      if (value < 0) return "Reservoir radius must be >= 0";
      if (value > 20000) return "Must be <= 20000 ft";
      return "";
    }
  
    //
    // 3) Spacing fields (for spacingMethod, spacingValue, etc.)
    //
    if (fieldName === "spacingValue") {
      // By default, let's require spacingValue > 0
      if (isNaN(value) || value <= 0) {
        return "Spacing Value must be greater than 0";
      }
      // Potentially an upper bound if you want, e.g. "Must be <= 9999"
      return "";
    }
  
    return "";
  };
  
  
  
  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px', maxWidth: '600px' }}>
      <h3>IPR Inputs (Units: {selectedUnitSystem || 'Unknown'})</h3>

      {/* IPR Phase Selector */}
      <div style={rowStyle}>
        <label style={labelStyle}>IPR Phase:</label>
        <select name="iprPhase" value={iprPhase} onChange={handleTextChange} style={selectStyle}>
          <option value="">-- Select --</option>
          {gas_oil_phaseOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Flow Regime for Liquid/Two-phase */}
      {(iprPhase === 'Liquid' || iprPhase === 'Two-phase') && (
        <div style={rowStyle}>
          <label style={labelStyle}>Flow Regime:</label>
          <select
            name="flowRegime"
            value={iprPhase === 'Two-phase' ? 'Pseudosteady-State' : flowRegime}
            onChange={handleTextChange}
            style={selectStyle}
            disabled={iprPhase === 'Two-phase'}
          >
            {iprPhase === 'Liquid' ? (
              <>
                <option value="">-- Select --</option>
                {regimeOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </>
            ) : (
              <option value="Pseudosteady-State">Pseudosteady-State</option>
            )}
          </select>
        </div>
      )}

      {/* Gas-Specific Section */}
      {iprPhase === 'Gas' && (
        <>
          {/* Gas Flow Regime Selector */}
          <div style={rowStyle}>
            <label style={labelStyle}>Flow Regime:</label>
            <select
              name="flowRegime"
              value={flowRegime}
              onChange={handleTextChange}
              style={selectStyle}
              disabled={!canEditFields}
            >
              <option value="">-- Select --</option>
              {regimeOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* z method selector */}
          <div style={rowStyle}>
            <label style={labelStyle}>z Factor Correlation:</label>
            <select name="zMethod" value={zMethod} onChange={handleTextChange} style={selectStyle}>
              <option value="">-- Select --</option>
              {zmethodOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </>
      )}


      {(iprPhase === 'Liquid' || iprPhase === 'Two-phase') && oilcommonFields.map((field) => (
        <div style={rowStyle} key={field.name}>
          <label style={labelStyle}>{field.label}:</label>
          <input
            type="number"
            step="any"
            name={field.name}
            min={field.min}
            max={field.max}
            value={formValues[field.name] || ''}
            onChange={handleNumericChange}
            disabled={!canEditFields}
            style={inputStyle}
          />
          <span style={unitStyle}>({field.unit})</span>
          {errors[field.name] && (
            <div style={{ color: 'red', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
              {errors[field.name]}
            </div>
          )}
        </div>
      ))}
      {iprPhase === 'Gas' &&
        gascommonFields.map((field) => (
          <div style={rowStyle} key={field.name}>
            <label style={labelStyle}>{field.label}:</label>
            <input
              type="number"
              step="any"
              name={field.name}
              min={field.min}
              max={field.max}
              value={formValues[field.name] || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({field.unit})</span>
            {errors[field.name] && (
              <div style={{ color: 'red', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                {errors[field.name]}
              </div>
            )}
          </div>
        ))}

      {/* Additional Fields for Liquid */}
      {iprPhase === 'Liquid' && flowRegime === 'Transient' && (
        <>
          <div style={rowStyle}>
            <label style={labelStyle}>Porosity, φ (%):</label>
            <input
              type="number"
              step="any"
              name="phi"
              min={1}
              max={50}
              value={formValues.phi || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>%</span>
            {errors.phi && (
            <div style={{ color: "red", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
              {errors.phi}
            </div>
          )}
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>
              Total Compressibility, c<span style={{ fontSize: 'smaller' }}>t</span>:
            </label>
            <input
              type="number"
              step="any"
              name="ct"
              min={1e-7}
              max={1e-3}
              value={formValues.ct || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.compressibility || '1/psi'})</span>
            {errors.ct && (
            <div style={{ color: "red", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
              {errors.ct}
            </div>
          )}
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>Time, t:</label>
            <input
              type="number"
              step="any"
              name="t"
              min={1e-3}
              max={10000}
              value={formValues.t || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.time || 'hrs'})</span>
            {errors.t && (
            <div style={{ color: "red", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
              {errors.t}
            </div>
          )}
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>
              Initial Reservoir Pressure, pi<sub>i</sub>:
            </label>
            <input
              type="number"
              step="any"
              name="pi"
              min={500}
              max={20000}
              value={formValues.pi || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.pressure || 'psi'})</span>
            {errors.pi && (
            <div style={{ color: "red", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
              {errors.pi}
            </div>
          )}
          </div>
        </>
      )}

      {/* Additional Fields for Liquid (Pseudosteady-State / Two-phase) */}
      {((iprPhase === 'Liquid' && flowRegime === 'Pseudosteady-State') || iprPhase === 'Two-phase') && (
        <>
          <div style={rowStyle}>
            <label style={labelStyle}>
              Avg Reservoir Pressure, p<sub>avg</sub>:
            </label>
            <input
              type="number"
              step="any"
              name="pavg"
              min={500}
              max={20000}
              value={formValues.pavg || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.pressure || 'psi'})</span>
            {errors.pavg && (
            <div style={{ color: "red", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
              {errors.pavg}
            </div>
          )}
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>
              Reservoir radius, re<sub>e</sub>:
            </label>
            <input
              type="number"
              step="any"
              name="re"
              min={0}
              max={20000}
              value={formValues.re || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.length || 'ft'})</span>
            {errors.re && (
            <div style={{ color: "red", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
              {errors.re}
            </div>
          )}
          </div>
          {iprPhase === 'Two-phase' && (
            <>
              <div style={rowStyle}>
                <label style={labelStyle}>
                  Saturation Pressure, p<sub>b</sub>:
                </label>
                <input
                  type="number"
                  step="any"
                  name="pb"
                  min={300}
                  max={5000}
                  value={formValues.pb || ''}
                  onChange={handleNumericChange}
                  disabled={!canEditFields}
                  style={inputStyle}
                />
                <span style={unitStyle}>({userUnits.pressure || 'psi'})</span>
                {errors.pb && (
                <div style={{ color: "red", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
                  {errors.pb}
                </div>
              )}
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>
                  Bowedness, a:
                </label>
                <input
                  type="number"
                  step="any"
                  name="a"
                  min={0.8}
                  max={1}
                  value={formValues.a || ''}
                  onChange={handleNumericChange}
                  disabled={!canEditFields}
                  style={inputStyle}
                />
                <span style={unitStyle}>({'dimensionless'})</span>
                {errors.a && (
                <div style={{ color: "red", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
                  {errors.a}
                </div>
              )}
              </div>
            </>
          )}
        </>
      )}

      {/* Additional Fields for Liquid (Steady-State) */}
      {iprPhase === 'Liquid' && flowRegime === 'Steady-State' && (
        <>
          <div style={rowStyle}>
            <label style={labelStyle}>
              Boundary Pressure, pe<sub>e</sub>:
            </label>
            <input
              type="number"
              step="any"
              name="pe"
              min={500}
              max={20000}
              value={formValues.pe || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.pressure || 'psi'})</span>
            {errors.pe && (
            <div style={{ color: "red", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
              {errors.pe}
            </div>
          )}
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>
              Reservoir radius, re<sub>e</sub>:
            </label>
            <input
              type="number"
              step="any"
              name="re"
              min={0}
              max={20000}
              value={formValues.re || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.length || 'ft'})</span>
            {errors.re && (
            <div style={{ color: "red", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
              {errors.re}
            </div>
          )}
          </div>
        </>
      )}

      {/* Additional Fields for Gas */}
      {iprPhase === 'Gas' && flowRegime === 'Transient' && (
        <>
          <div style={rowStyle}>
            <label style={labelStyle}>Porosity, φ (%):</label>
            <input
              type="number"
              step="any"
              name="phi"
              min={1}
              max={50}
              value={formValues.phi || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>(%)</span>
            {errors.phi && (
            <div style={{ color: "red", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
              {errors.phi}
            </div>
          )}
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>
              Total Compressibility, c<span style={{ fontSize: 'smaller' }}>t</span>:
            </label>
            <input
              type="number"
              step="any"
              name="ct"
              min={1e-7}
              max={1e-3}
              value={formValues.ct || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.compressibility || '1/psi'})</span>
            {errors.ct && (
            <div style={{ color: "red", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
              {errors.ct}
            </div>
          )}
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>Time, t:</label>
            <input
              type="number"
              step="any"
              name="t"
              min={1e-3}
              max={10000}
              value={formValues.t || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.time || 'hrs'})</span>
            {errors.t && (
            <div style={{ color: "red", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
              {errors.t}
            </div>
          )}
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>
              Initial Reservoir Pressure, p<sub>i</sub>:
            </label>
            <input
              type="number"
              step="any"
              name="pi"
              min={500}
              max={20000}
              value={formValues.pi || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.pressure || 'psi'})</span>
            {errors.pi && (
            <div style={{ color: "red", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
              {errors.pi}
            </div>
          )}
          </div>
        </>
      )}
      {iprPhase === 'Gas' && flowRegime === 'Pseudosteady-State' && (
        <>
          <div style={rowStyle}>
            <label style={labelStyle}>Average Reservoir Pressure, p<sub>avg</sub>:</label>
            <input
              type="number"
              step="any"
              name="p_avg"
              min={500}
              max={20000}
              value={formValues.p_avg || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.pressure || 'psi'})</span>
            {errors.p_avg && (
            <div style={{ color: "red", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
              {errors.p_avg}
            </div>
          )}
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>Reservoir Radius, re:</label>
            <input
              type="number"
              step="any"
              name="re"
              min={0}
              max={20000}
              value={formValues.re || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.length || 'ft'})</span>
            {errors.re && (
            <div style={{ color: "red", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
              {errors.re}
            </div>
          )}
          </div>
        </>
      )}
      {iprPhase === 'Gas' && flowRegime === 'Steady-State' && (
        <>
          <div style={rowStyle}>
            <label style={labelStyle}>Boundary Pressure, pe:</label>
            <input
              type="number"
              step="any"
              name="pe"
              min={500}
              max={20000}
              value={formValues.pe || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.pressure || 'psi'})</span>
            {errors.pe && (
            <div style={{ color: "red", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
              {errors.pe}
            </div>
          )}
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>Reservoir Radius, re:</label>
            <input
              type="number"
              step="any"
              name="re"
              min={0}
              max={20000}
              value={formValues.re || ''}
              onChange={handleNumericChange}
              disabled={!canEditFields}
              style={inputStyle}
            />
            <span style={unitStyle}>({userUnits.length || 'ft'})</span>
            {errors.re && (
            <div style={{ color: "red", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
              {errors.re}
            </div>
          )}
          </div>
        </>
      )}

      {/* Spacing Method & Value */}
      <div style={rowStyle}>
        <label style={labelStyle}>Spacing Method:</label>
        <select
          name="spacingMethod"
          value={formValues.spacingMethod || ''}
          onChange={handleTextChange}
          disabled={!canEditFields}
          style={inputStyle}
        >
          <option value="">(Default 25 pts)</option>
          {spacingMethods.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      {formValues.spacingMethod && (
        <div style={rowStyle}>
          <label style={labelStyle}>Spacing Value:</label>
          <input
            type="number"
            step="any"
            name="spacingValue"
            value={formValues.spacingValue || ''}
            onChange={handleNumericChange}
            disabled={!canEditFields}
            style={inputStyle}
          />
          <span style={unitStyle}>
            {formValues.spacingMethod === 'NumPoints'
              ? '(e.g. 100 points)'
              : formValues.spacingMethod === 'DeltaP'
              ? '(psi increment)'
              : '(flowrate increment)'}
          </span>
        </div>
      )}

      <button
        onClick={onCalculate}
        disabled={!iprPhase || (iprPhase === 'Liquid' && !flowRegime)}
        style={{ marginTop: '1rem' }}
      >
        Calculate
      </button>
    </div>
  );
};

export default NodalAnalysisForm;


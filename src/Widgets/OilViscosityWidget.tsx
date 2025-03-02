import React, { useState } from "react";
import { CrudeOilCorrelations } from "../Correlations/OilCorrelations";
import UnitConverter from "../unit/UnitConverter";
import unitSystemsData from "../unit/unitSystems.json";

interface OilViscosityWidgetProps {
  selectedUnitSystem: string;
}

const unitSystems = unitSystemsData as Record<string, any>;

export const OilViscosityWidget: React.FC<OilViscosityWidgetProps> = ({ selectedUnitSystem }) => {
  // Lookup base units from JSON (with defaults).
  const pressureUnit = unitSystems[selectedUnitSystem]?.pressure || "psi";
  const viscosityUnit = unitSystems[selectedUnitSystem]?.viscosity || "cp";
  const temperatureUnit = unitSystems[selectedUnitSystem]?.temperature || "°F";
  // For density: if the unit system is NOT "oilfield", we expect density input.
  const densityUnit = unitSystems[selectedUnitSystem]?.density || "lbm/ft³";
  const gorUnit = unitSystems[selectedUnitSystem]?.gor || "scf/STB";
  // Store all inputs as strings (to match IPR entry formatting).
  const [PText, setPText] = useState<string>("");
  const [TText, setTText] = useState<string>("");
  const [densityText, setDensityText] = useState<string>("");

  const [PsatText, setPsatText] = useState<string>("");
  const [RsoText, setRsoText] = useState<string>("");

  const [method1, setMethod1] = useState<number>(0);
  const [method2, setMethod2] = useState<number>(0);
  const [method3, setMethod3] = useState<number>(0);

  // Additional inputs for correlations that require them (methods 4 and 6)
  const [T1Text, setT1Text] = useState<string>("");
  const [oilVisc1Text, setOilVisc1Text] = useState<string>("");
  const [T2Text, setT2Text] = useState<string>("");
  const [oilVisc2Text, setOilVisc2Text] = useState<string>("");

  const [resultText, setResultText] = useState<string>("");

  const method1Options = [
    { value: 0, label: "Beal (default)" },
    { value: 1, label: "Glaso" },
    { value: 2, label: "Beggs & Robinson" },
    { value: 3, label: "Beggs & Robinson modified" },
    { value: 4, label: "Bergman" },
    { value: 5, label: "Bergman & Sutton" },
    { value: 6, label: "ASTM" },
  ];
  const method2Options = [
    { value: 0, label: "Beggs & Robinson (default)" },
    { value: 1, label: "Chew & Connally" },
  ];
  const method3Options = [
    { value: 0, label: "Beal (default)" },
    { value: 1, label: "Vazquez & Beggs" },
  ];

  // Regex pattern to accept only a standard decimal number (disallow exponential notation)
  const numberPattern = "^-?[0-9]*\\.?[0-9]+$";

  const handleCalculate = () => {
    // Parse and convert inputs from the user's units to internal units.
    const PInput = parseFloat(PText);
    const P_internal = UnitConverter.convert("pressure", PInput, pressureUnit, "psi");

    const TInput = parseFloat(TText);
    const T_internal = UnitConverter.convert("temperature", TInput, temperatureUnit, "°F");

    const RsoInput = parseFloat(RsoText);
    const Rso_internal = UnitConverter.convert("gor", RsoInput, gorUnit, "scf/STB");
    
    // Determine API value.
    let API: number;

    // User entered density instead of API.
    const densityInput = parseFloat(densityText);
    // Convert density to lbm/ft³ using UnitConverter.
    const density_converted = UnitConverter.convert("density", densityInput, densityUnit, "lbm/ft³");
    // Compute API from density:
    // API = (141.5 * 62.4) / density_converted - 131.5
    API = (141.5 * 62.4) / density_converted - 131.5;


    const PsatInput = parseFloat(PsatText);
    const Psat_internal = UnitConverter.convert("pressure", PsatInput, pressureUnit, "psi");

    let T1_internal: number | undefined = undefined;
    let oilVisc1_internal: number | undefined = undefined;
    let T2_internal: number | undefined = undefined;
    let oilVisc2_internal: number | undefined = undefined;

    // Only convert T1 and oilVisc1 (and T2, oilVisc2) if the selected method requires them (methods 4 and 6).
    if ((method1 === 4 || method1 === 6) && T1Text.trim() !== "") {
      const T1Input = parseFloat(T1Text);
      T1_internal = UnitConverter.convert("temperature", T1Input, temperatureUnit, "°F");
    }
    if ((method1 === 4 || method1 === 6) && oilVisc1Text.trim() !== "") {
      const oilVisc1Input = parseFloat(oilVisc1Text);
      oilVisc1_internal = UnitConverter.convert("viscosity", oilVisc1Input, viscosityUnit, "cp");
    }
    if ((method1 === 4 || method1 === 6) && T2Text.trim() !== "") {
      const T2Input = parseFloat(T2Text);
      T2_internal = UnitConverter.convert("temperature", T2Input, temperatureUnit, "°F");
    }
    if ((method1 === 4 || method1 === 6) && oilVisc2Text.trim() !== "") {
      const oilVisc2Input = parseFloat(oilVisc2Text);
      oilVisc2_internal = UnitConverter.convert("viscosity", oilVisc2Input, viscosityUnit, "cp");
    }

    try {
      const result = CrudeOilCorrelations.oil_visc_PT(
        P_internal,
        T_internal,
        API,
        Psat_internal,
        Rso_internal,
        method1,
        method2,
        method3,
        T1_internal,
        oilVisc1_internal,
        T2_internal,
        oilVisc2_internal
      );
      // Convert the result (internal unit: cp) back to the user's viscosity unit.
      const convertedResult = UnitConverter.convert("viscosity", result, "cp", viscosityUnit);
      setResultText(convertedResult.toFixed(4));
    } catch (error) {
      console.error("Error calculating oil viscosity:", error);
      setResultText("");
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: "1rem", width: "350px" }}>
      <h3>Oil Viscosity Widget</h3>

      <div className="input-row">
        <label>P</label>
        <input
          type="text"
          pattern={numberPattern}
          value={PText}
          onChange={(e) => setPText(e.target.value)}
        />
        <span>{pressureUnit}</span>
      </div>

      <div className="input-row">
        <label>T</label>
        <input
          type="text"
          pattern={numberPattern}
          value={TText}
          onChange={(e) => setTText(e.target.value)}
        />
        <span>{temperatureUnit}</span>
      </div>


      <div className="input-row">
        <label>Density</label>
        <input
        type="text"
        pattern={numberPattern}
        value={densityText}
        onChange={(e) => setDensityText(e.target.value)}
        />
        <span>{densityUnit}</span>
      </div>

      <div className="input-row">
        <label>Psat</label>
        <input
          type="text"
          pattern={numberPattern}
          value={PsatText}
          onChange={(e) => setPsatText(e.target.value)}
        />
        <span>{pressureUnit}</span>
      </div>

      <div className="input-row">
        <label>Rso</label>
        <input
          type="text"
          pattern={numberPattern}
          value={RsoText}
          onChange={(e) => setRsoText(e.target.value)}
        />
        <span>{gorUnit}</span>
      </div>

      <div className="input-row">
        <label>Method1</label>
        <select value={method1} onChange={(e) => setMethod1(parseInt(e.target.value))}>
          {method1Options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span></span>
      </div>

      <div className="input-row">
        <label>Method2</label>
        <select value={method2} onChange={(e) => setMethod2(parseInt(e.target.value))}>
          {method2Options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span></span>
      </div>

      <div className="input-row">
        <label>Method3</label>
        <select value={method3} onChange={(e) => setMethod3(parseInt(e.target.value))}>
          {method3Options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span></span>
      </div>

      {/* Only show T1, oilVisc1, T2, and oilVisc2 if the selected correlation requires them */}
      {(method1 === 4 || method1 === 6) && (
        <>
          <div className="input-row">
            <label>T1</label>
            <input
              type="text"
              pattern={numberPattern}
              value={T1Text}
              onChange={(e) => setT1Text(e.target.value)}
            />
            <span>{temperatureUnit}</span>
          </div>

          <div className="input-row">
            <label>oilVisc1</label>
            <input
              type="text"
              pattern={numberPattern}
              value={oilVisc1Text}
              onChange={(e) => setOilVisc1Text(e.target.value)}
            />
            <span>{viscosityUnit}</span>
          </div>

          <div className="input-row">
            <label>T2</label>
            <input
              type="text"
              pattern={numberPattern}
              value={T2Text}
              onChange={(e) => setT2Text(e.target.value)}
            />
            <span>{temperatureUnit}</span>
          </div>

          <div className="input-row">
            <label>oilVisc2</label>
            <input
              type="text"
              pattern={numberPattern}
              value={oilVisc2Text}
              onChange={(e) => setOilVisc2Text(e.target.value)}
            />
            <span>{viscosityUnit}</span>
          </div>
        </>
      )}

      <button onClick={handleCalculate}>Calculate Viscosity</button>

      <div style={{ marginTop: "1rem" }}>
        <strong>Result:</strong>{" "}
        {resultText ? `${resultText} ${viscosityUnit}` : "N/A"}
      </div>
    </div>
  );
};

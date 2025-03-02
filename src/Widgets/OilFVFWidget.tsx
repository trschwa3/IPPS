import React, { useState } from "react";
import { CrudeOilCorrelations } from "../Correlations/OilCorrelations";
import UnitConverter from "../unit/UnitConverter";
import unitSystemsData from "../unit/unitSystems.json";

interface OilFVFWidgetProps {
  selectedUnitSystem: string;
}

const unitSystems = unitSystemsData as Record<string, any>;

export const OilFVFWidget: React.FC<OilFVFWidgetProps> = ({ selectedUnitSystem }) => {
  // Lookup the user’s base units.
  const pressureUnit = unitSystems[selectedUnitSystem]?.pressure || "psi";
  const temperatureUnit = unitSystems[selectedUnitSystem]?.temperature || "°F";
  const compressibilityUnit = unitSystems[selectedUnitSystem]?.compressibility || "1/psi";
  const gorUnit = unitSystems[selectedUnitSystem]?.gor || "scf/STB";
  // All inputs are stored as text.
  const [PText, setPText] = useState<string>("");
  const [TText, setTText] = useState<string>("");
  const [Sg_oText, setSg_oText] = useState<string>("");
  const [Sg_gText, setSg_gText] = useState<string>("");
  const [PsatText, setPsatText] = useState<string>("");
  const [RsoText, setRsoText] = useState<string>("");
  const [CoText, setCoText] = useState<string>("");
  const [PsepText, setPsepText] = useState<string>("");
  const [TsepText, setTsepText] = useState<string>("");

  const [method, setMethod] = useState<number>(0);
  const [resultText, setResultText] = useState<string>("");

  const methodOptions = [
    { value: 0, label: "Standing (default)" },
    { value: 1, label: "Lasater" },
    { value: 2, label: "Vazquez" },
    { value: 3, label: "Glaso" },
    { value: 4, label: "Petrosky & Farshad" },
    { value: 5, label: "Velarde, Blasingame & McCain" },
  ];

  const numberPattern = "^-?[0-9]*\\.?[0-9]+$";

  const handleCalculate = () => {
    // Convert inputs from user's units to internal units.
    const PInput = parseFloat(PText);
    const P_internal = UnitConverter.convert("pressure", PInput, pressureUnit, "psi");

    const TInput = parseFloat(TText);
    const T_internal = UnitConverter.convert("temperature", TInput, temperatureUnit, "°F");

    const Sg_o = parseFloat(Sg_oText); // dimensionless
    const Sg_g = parseFloat(Sg_gText); // dimensionless

    const PsatInput = parseFloat(PsatText);
    const Psat_internal = UnitConverter.convert("pressure", PsatInput, pressureUnit, "psi");

    const RsoInput = parseFloat(RsoText);
    const Rso_internal = UnitConverter.convert("gor", RsoInput, gorUnit, "scf/STB");
    
    const CoInput = parseFloat(CoText);
    const Co_internal = UnitConverter.convert("compressibility", CoInput, compressibilityUnit, "psi⁻¹");

    const PsepInput = parseFloat(PsepText);
    const Psep_internal = UnitConverter.convert("pressure", PsepInput, pressureUnit, "psi");

    const TsepInput = parseFloat(TsepText);
    const Tsep_internal = UnitConverter.convert("temperature", TsepInput, temperatureUnit, "°F");

    try {
      const result = CrudeOilCorrelations.oil_Bo(
        P_internal,
        T_internal,
        Sg_o,
        Sg_g,
        Psat_internal,
        Rso_internal,
        Co_internal,
        method,
        Psep_internal,
        Tsep_internal
      );
      // FVF (bbl/stb) is dimensionless; here we assume no conversion is needed.
      setResultText(result.toFixed(4));
    } catch (error) {
      console.error("Error calculating oil FVF:", error);
      setResultText("");
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: "1rem", width: "350px" }}>
      <h3>Oil FVF Widget</h3>

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
        <label>Sg_o</label>
        <input
          type="text"
          pattern={numberPattern}
          value={Sg_oText}
          onChange={(e) => setSg_oText(e.target.value)}
        />
        <span></span>
      </div>

      <div className="input-row">
        <label>Sg_g</label>
        <input
          type="text"
          pattern={numberPattern}
          value={Sg_gText}
          onChange={(e) => setSg_gText(e.target.value)}
        />
        <span></span>
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
        <label>Co</label>
        <input
          type="text"
          pattern={numberPattern}
          value={CoText}
          onChange={(e) => setCoText(e.target.value)}
        />
        <span>{compressibilityUnit}</span>
      </div>

      <div className="input-row">
        <label>Method</label>
        <select value={method} onChange={(e) => setMethod(parseInt(e.target.value))}>
          {methodOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span></span>
      </div>

      <div className="input-row">
        <label>Psep</label>
        <input
          type="text"
          pattern={numberPattern}
          value={PsepText}
          onChange={(e) => setPsepText(e.target.value)}
        />
        <span>{pressureUnit}</span>
      </div>

      <div className="input-row">
        <label>Tsep</label>
        <input
          type="text"
          pattern={numberPattern}
          value={TsepText}
          onChange={(e) => setTsepText(e.target.value)}
        />
        <span>{temperatureUnit}</span>
      </div>

      <button onClick={handleCalculate}>Calculate Oil FVF</button>

      <div style={{ marginTop: "1rem" }}>
        <strong>Result:</strong>{" "}
        {resultText ? `${resultText} bbl/STB` : "N/A"}
      </div>
    </div>
  );
};

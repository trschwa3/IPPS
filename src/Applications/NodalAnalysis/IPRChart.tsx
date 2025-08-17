import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import unitSystems from '../../unit/unitSystems.json';
import UnitConverter from '../../unit/UnitConverter';
import type { UnitSystems, UnitSystemDefinition } from '../../unit/UnitSystems';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface IPRPoint {
  p_wf: number; // stored in psi (Oil Field standard)
  q_o: number;  // stored in STB/day (oil) or MCF/day (gas), field standard
}

interface IPRChartProps {
  iprData: IPRPoint[];
  oprData?: IPRPoint[];            // ⬅️ optional OPR overlay (single-phase oil)
  selectedUnitSystem: string;
  iprPhase: string;                // 'Gas' or otherwise (for IPR base unit only)
  oprPhase?: string;               // 'Gas' or 'Oil' (for OPR base unit)
}

const IPRChart: React.FC<IPRChartProps> = ({
  iprData,
  oprData,
  selectedUnitSystem,
  iprPhase,
  oprPhase,
}) => {
  // --- Units & defaults ------------------------------------------------------
  const flowUnits = useMemo(() => Object.keys(UnitConverter.flowrateFactors), []);
  const pressureUnits = useMemo(() => Object.keys(UnitConverter.pressureFactors), []);

  const allUnits = unitSystems as UnitSystems;
  const userUnits: UnitSystemDefinition = allUnits[selectedUnitSystem] || {} as UnitSystemDefinition;
  const userFlowUnit = userUnits.flowrate;
  const userPressUnit = userUnits.pressure;

  const fallbackFlowUnit = useMemo(() => flowUnits[0] || 'm³/day', [flowUnits]);
  const fallbackPressUnit = useMemo(() => pressureUnits[0] || 'Pa', [pressureUnits]);

  const computeDefaultFlowUnit = useCallback(() => {
    if (iprPhase === 'Gas' && selectedUnitSystem === 'Oil Field') return 'MCF/day';
    if (userFlowUnit && flowUnits.includes(userFlowUnit)) return userFlowUnit;
    return fallbackFlowUnit;
  }, [iprPhase, selectedUnitSystem, userFlowUnit, flowUnits, fallbackFlowUnit]);

  const defaultPressUnit = useMemo(() => {
    if (userPressUnit && pressureUnits.includes(userPressUnit)) return userPressUnit;
    return fallbackPressUnit;
  }, [userPressUnit, pressureUnits, fallbackPressUnit]);

  const [xUnit, setXUnit] = useState(computeDefaultFlowUnit());
  const [yUnit, setYUnit] = useState(defaultPressUnit);
  const [xMin, setXMin] = useState<number | undefined>(undefined);
  const [xMax, setXMax] = useState<number | undefined>(undefined);
  const [yMin, setYMin] = useState<number | undefined>(undefined);
  const [yMax, setYMax] = useState<number | undefined>(undefined);
  const [copyStatus, setCopyStatus] = useState<string>('');

  useEffect(() => {
    setXUnit(computeDefaultFlowUnit());
  }, [computeDefaultFlowUnit]);

  useEffect(() => {
    setYUnit(defaultPressUnit);
  }, [defaultPressUnit]);


  const safeXUnit = flowUnits.includes(xUnit) ? xUnit : fallbackFlowUnit;
  const safeYUnit = pressureUnits.includes(yUnit) ? yUnit : fallbackPressUnit;

  // Base flow units in native data
  // Base flow units in native data
  const baseFlowUnitIPR = iprPhase === 'Gas' ? 'MCF/day' : 'STB/day';

  // If oprPhase is not provided, assume it matches IPR (your app enforces this anyway)
  const effectiveOprPhase = oprPhase ?? iprPhase;
  const baseFlowUnitOPR = effectiveOprPhase === 'Gas' ? 'MCF/day' : 'STB/day';


  // Convert helpers
  const convertPts = (pts: IPRPoint[], baseFlowUnit: string) =>
    pts.map((pt) => ({
      x: UnitConverter.convert('flowrate', pt.q_o, baseFlowUnit, safeXUnit),
      y: UnitConverter.convert('pressure', pt.p_wf, 'psi', safeYUnit),
    })).sort((a, b) => a.x - b.x);

  const convertedIPR = convertPts(iprData, baseFlowUnitIPR);
  const convertedOPR = (oprData && oprData.length) ? convertPts(oprData, baseFlowUnitOPR) : [];

  // --- Chart datasets --------------------------------------------------------
  const data = {
    datasets: [
      {
        label: `IPR (${safeXUnit} vs ${safeYUnit})`,
        data: convertedIPR,
        borderColor: 'blue',
        backgroundColor: 'lightblue',
        fill: false,
      },
      ...(convertedOPR.length
        ? [{
            label: `OPR (${safeXUnit} vs ${safeYUnit})`,
            data: convertedOPR,
            borderColor: 'red',
            backgroundColor: 'pink',
            fill: false,
          }]
        : []),
    ],
  };

  const options = {
    responsive: false,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear' as const,
        title: { display: true, text: `Flow Rate (${safeXUnit})` },
        min: xMin !== undefined ? xMin : undefined,
        max: xMax !== undefined ? xMax : undefined,
      },
      y: {
        type: 'linear' as const,
        title: { display: true, text: `Bottomhole Pressure (${safeYUnit})` },
        min: yMin !== undefined ? yMin : undefined,
        max: yMax !== undefined ? yMax : undefined,
      },
    },
  };

  // --- CSV / Clipboard (now includes both series) ---------------------------
  const buildDelimitedText = (delim: string) => {
    const header = ['Series', `Flow Rate (${safeXUnit})`, `Bottomhole Pressure (${safeYUnit})`].join(delim);

    const toRows = (label: string, arr: {x:number; y:number}[]) =>
      arr.map((pt) => [label, pt.x, pt.y].join(delim));

    const rows = [
      ...toRows('IPR', convertedIPR),
      ...(convertedOPR.length ? toRows('OPR', convertedOPR) : []),
    ];

    return [header, ...rows].join('\n');
  };

  const copyTextToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && 'writeText' in navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 1500);
    } catch {
      setCopyStatus('Copy failed');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  const handleCopyTSV = () => copyTextToClipboard(buildDelimitedText('\t'));
  const handleCopyCSV = () => copyTextToClipboard(buildDelimitedText(','));

  const handleExportCSV = () => {
    const csv = buildDelimitedText(',');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Nodal_data_${safeXUnit}_vs_${safeYUnit}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- Render ---------------------------------------------------------------
  const hasData = iprData && iprData.length > 0;

  return (
    <div style={{ marginLeft: '1rem' }}>
      {!hasData ? (
        <p>No IPR data yet. Please select phase/regime, enter parameters, and click "Calculate."</p>
      ) : (
        <>
        <div style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
          <h4>Chart Options</h4>

        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ marginRight: '0.5rem' }}>Flow Axis Unit:</label>
          <select value={xUnit} onChange={(e) => setXUnit(e.target.value)}>
            {flowUnits.map((unitKey) => (
              <option key={unitKey} value={unitKey}>
                {unitKey}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ marginRight: '0.5rem' }}>Pressure Axis Unit:</label>
          <select value={yUnit} onChange={(e) => setYUnit(e.target.value)}>
            {pressureUnits.map((unitKey) => (
              <option key={unitKey} value={unitKey}>
                {unitKey}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ marginRight: '0.5rem' }}>xMin:</label>
          <input
            type="number"
            value={xMin ?? ''}
            onChange={(e) => setXMin(e.target.value ? Number(e.target.value) : undefined)}
            style={{ width: '70px', marginRight: '1rem' }}
          />
          <label style={{ marginRight: '0.5rem' }}>xMax:</label>
          <input
            type="number"
            value={xMax ?? ''}
            onChange={(e) => setXMax(e.target.value ? Number(e.target.value) : undefined)}
            style={{ width: '70px', marginRight: '1rem' }}
          />
        </div>

        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ marginRight: '0.5rem' }}>yMin:</label>
          <input
            type="number"
            value={yMin ?? ''}
            onChange={(e) => setYMin(e.target.value ? Number(e.target.value) : undefined)}
            style={{ width: '70px', marginRight: '1rem' }}
          />
          <label style={{ marginRight: '0.5rem' }}>yMax:</label>
          <input
            type="number"
            value={yMax ?? ''}
            onChange={(e) => setYMax(e.target.value ? Number(e.target.value) : undefined)}
            style={{ width: '70px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleExportCSV}>Export CSV</button>
          <button onClick={handleCopyTSV} title="Best for paste into Excel/Sheets">Copy (tab-delimited)</button>
          <button onClick={handleCopyCSV}>Copy (CSV)</button>
          {copyStatus && <span style={{ color: '#28a745' }}>{copyStatus}</span>}
        </div>
      </div>

          <Line data={data} options={options} width={600} height={400} />
        </>
      )}
    </div>
  );
};

export default IPRChart;

import React, { useState, useEffect } from 'react';
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
  p_wf: number; // stored in "psi" (Oil Field standard)
  q_o: number;  // stored in STB/day for oil or MCF/day for gas (field standard)
}

interface IPRChartProps {
  iprData: IPRPoint[];
  selectedUnitSystem: string;
  iprPhase: string; // so we know if Gas is selected
}

const IPRChart: React.FC<IPRChartProps> = ({ iprData, selectedUnitSystem, iprPhase }) => {
  if (!iprData || iprData.length === 0) {
    return (
      <p>
        No IPR data yet. Please select phase/regime, enter parameters, and click "Calculate."
      </p>
    );
  }

  // Available units:
  const flowUnits = Object.keys(UnitConverter.flowrateFactors);
  const pressureUnits = Object.keys(UnitConverter.pressureFactors);

  // User defaults from the selected system:
  const userUnits = unitSystems[selectedUnitSystem as keyof typeof unitSystems] || {};
  const userFlowUnit = userUnits.flowrate;
  const userPressUnit = userUnits.pressure;

  // Fallback defaults:
  const fallbackFlowUnit = flowUnits[0] || 'm³/day';
  const fallbackPressUnit = pressureUnits[0] || 'Pa';

  // Set default based on phase:
  const computeDefaultFlowUnit = () =>
    iprPhase === 'Gas' && selectedUnitSystem === 'Oil Field'
      ? 'MCF/day'
      : userFlowUnit && flowUnits.includes(userFlowUnit)
      ? userFlowUnit
      : fallbackFlowUnit;

  const defaultPressUnit =
    userPressUnit && pressureUnits.includes(userPressUnit)
      ? userPressUnit
      : fallbackPressUnit;

  // Local state for chart customization:
  const [xUnit, setXUnit] = useState(computeDefaultFlowUnit());
  const [yUnit, setYUnit] = useState(defaultPressUnit);
  const [xMin, setXMin] = useState<number | undefined>(undefined);
  const [xMax, setXMax] = useState<number | undefined>(undefined);
  const [yMin, setYMin] = useState<number | undefined>(undefined);
  const [yMax, setYMax] = useState<number | undefined>(undefined);

  // When iprPhase or selectedUnitSystem changes, update xUnit:
  useEffect(() => {
    setXUnit(computeDefaultFlowUnit());
  }, [iprPhase, selectedUnitSystem]);

  const safeXUnit = flowUnits.includes(xUnit) ? xUnit : fallbackFlowUnit;
  const safeYUnit = pressureUnits.includes(yUnit) ? yUnit : fallbackPressUnit;

  // Determine the base (native) unit for flowrate conversions:
  const baseFlowUnit = iprPhase === 'Gas' ? 'MCF/day' : 'STB/day';

  // Convert the data:
  const convertedData = iprData.map(pt => {
    const qConverted = UnitConverter.convert('flowrate', pt.q_o, baseFlowUnit, safeXUnit);
    const pConverted = UnitConverter.convert('pressure', pt.p_wf, 'psi', safeYUnit);
    return { x: qConverted, y: pConverted };
  });
  convertedData.sort((a, b) => a.x - b.x);

  const data = {
    datasets: [
      {
        label: `IPR Curve (${safeXUnit} vs. ${safeYUnit})`,
        data: convertedData,
        borderColor: 'blue',
        backgroundColor: 'lightblue',
        fill: false,
      },
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

  const handleExportCSV = () => {
    const rows = convertedData.map(pt => [pt.x, pt.y]);
    let csvContent = `data:text/csv;charset=utf-8,${safeXUnit},${safeYUnit}\n`;
    rows.forEach(row => {
      csvContent += row.join(',') + '\n';
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IPR_data_${safeXUnit}_vs_${safeYUnit}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ marginLeft: '1rem' }}>
      <div style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
        <h4>Chart Options</h4>
        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ marginRight: '0.5rem' }}>Flow Axis Unit:</label>
          <select value={xUnit} onChange={e => setXUnit(e.target.value)}>
            {flowUnits.map(unitKey => (
              <option key={unitKey} value={unitKey}>
                {unitKey}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ marginRight: '0.5rem' }}>Pressure Axis Unit:</label>
          <select value={yUnit} onChange={e => setYUnit(e.target.value)}>
            {pressureUnits.map(unitKey => (
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
            onChange={e => setXMin(e.target.value ? Number(e.target.value) : undefined)}
            style={{ width: '70px', marginRight: '1rem' }}
          />
          <label style={{ marginRight: '0.5rem' }}>xMax:</label>
          <input
            type="number"
            value={xMax ?? ''}
            onChange={e => setXMax(e.target.value ? Number(e.target.value) : undefined)}
            style={{ width: '70px', marginRight: '1rem' }}
          />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ marginRight: '0.5rem' }}>yMin:</label>
          <input
            type="number"
            value={yMin ?? ''}
            onChange={e => setYMin(e.target.value ? Number(e.target.value) : undefined)}
            style={{ width: '70px', marginRight: '1rem' }}
          />
          <label style={{ marginRight: '0.5rem' }}>yMax:</label>
          <input
            type="number"
            value={yMax ?? ''}
            onChange={e => setYMax(e.target.value ? Number(e.target.value) : undefined)}
            style={{ width: '70px' }}
          />
        </div>
        <button onClick={handleExportCSV} style={{ marginTop: '0.5rem' }}>
          Export CSV
        </button>
      </div>

      <Line data={data} options={options} width={600} height={400} />
    </div>
  );
};

export default IPRChart;

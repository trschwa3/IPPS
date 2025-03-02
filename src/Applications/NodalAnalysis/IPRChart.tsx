import React from 'react';
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
  p_wf: number; // psi
  q_o: number;  // STB/day
}

interface IPRChartProps {
  iprData: IPRPoint[];
}

const IPRChart: React.FC<IPRChartProps> = ({ iprData }) => {
  if (!iprData || iprData.length === 0) {
    return <p>No IPR data yet. Please select phase/regime, enter parameters, and click “Calculate.”</p>;
  }

  // If your data is not in ascending order by q_o, sort it:
  const sortedData = [...iprData].sort((a, b) => a.q_o - b.q_o);

  const data = {
    datasets: [
      {
        label: 'IPR Curve',
        data: sortedData.map(pt => ({ x: pt.q_o, y: pt.p_wf })),
        borderColor: 'blue',
        backgroundColor: 'lightblue',
        fill: false,
      },
    ],
  };

  const options = {
    responsive: false,
    maintainAspectRatio: false,
    // Both scales are linear; x is Flow Rate, y is Pressure
    scales: {
      x: {
        type: 'linear' as const,
        title: { display: true, text: 'Flow Rate (STB/day)' },
        // If you want the chart forced to start at zero flow, you can do:
        // min: 0,
      },
      y: {
        type: 'linear' as const,
        title: { display: true, text: 'Bottomhole Pressure (psi)' },
        // min: 0, // if you want pressure starting at zero, adjust as needed
      },
    },
  };

  return (
    <div style={{ marginLeft: '1rem' }}>
      <Line data={data} options={options} width={600} height={400} />
    </div>
  );
};

export default IPRChart;

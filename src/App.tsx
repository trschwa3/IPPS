import { Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import NodalAnalysis from './Applications/NodalAnalysis/NodalAnalysis';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/nodal-analysis" element={<NodalAnalysis />} />
    </Routes>
  );
}

export default App;

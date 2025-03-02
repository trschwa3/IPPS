// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import NodalAnalysis from './Applications/NodalAnalysis/NodalAnalysis';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/nodal-analysis" element={<NodalAnalysis />} />
      </Routes>
    </Router>
  );
}

export default App;

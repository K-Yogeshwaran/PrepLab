import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import Home from './pages/Home';
import Topics from './pages/Topics';
import Practice from './pages/Practice';
import Learn from './pages/Learn';
import LearnTables from './pages/LearnTables';
import LearnSquares from './pages/LearnSquares';
import LearnCubes from './pages/LearnCubes';
import Results from './pages/Results';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<Home />} />
        <Route path="practice" element={<Practice />} />
        <Route path="learn" element={<Learn />} />
        <Route path="learn/tables" element={<LearnTables />} />
        <Route path="learn/squares" element={<LearnSquares />} />
        <Route path="learn/cubes" element={<LearnCubes />} />
        <Route path="topics" element={<Topics />} />
        <Route path="results/:id" element={<Results />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="progress" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

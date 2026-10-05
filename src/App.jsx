import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import Home from './pages/Home';
import Topics from './pages/Topics';
import Practice from './pages/Practice';
import Results from './pages/Results';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<Home />} />
        <Route path="topics" element={<Topics />} />
        <Route path="practice" element={<Practice />} />
        <Route path="results/:id" element={<Results />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="progress" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

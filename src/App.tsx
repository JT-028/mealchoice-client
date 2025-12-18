import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Authenticated Routes (placeholder) */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Auth Routes (to be implemented) */}
        <Route path="/login" element={<LandingPage />} />
        <Route path="/register" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

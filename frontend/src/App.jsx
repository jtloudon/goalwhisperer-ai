import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ClaudePanel from './components/ClaudePanel';
import Dashboard from './pages/Dashboard';
import Objectives from './pages/Objectives';
import Plans from './pages/Plans';
import About from './pages/About';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/objectives" element={<Objectives />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
        <ClaudePanel />
      </div>
    </Router>
  );
}

export default App;

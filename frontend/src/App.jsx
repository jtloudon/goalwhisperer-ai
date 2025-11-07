import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TopNav from './components/TopNav';
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
        <TopNav />
        <div className="app-body">
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
      </div>
    </Router>
  );
}

export default App;

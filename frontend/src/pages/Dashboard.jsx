import { useState, useEffect } from 'react';
import './Dashboard.css';

const API_URL = 'http://localhost:3001/api';

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchDashboard();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  async function fetchDashboard() {
    try {
      // Only show loading spinner on initial load
      if (!dashboard) {
        setLoading(true);
      }

      // Save scroll position before fetch
      const scrollPosition = window.scrollY;

      const response = await fetch(`${API_URL}/dashboard`);
      const result = await response.json();

      if (result.success) {
        setDashboard(result.data);
        // Restore scroll position after state update
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollPosition);
        });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="loading">Loading your OKR data...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <button onClick={fetchDashboard}>Retry</button>
      </div>
    );
  }

  const { overview, objectives, recentCompletions, wins } = dashboard;

  // Calculate completed objectives
  const completedCount = objectives.filter(obj => obj.progress === 100).length;

  return (
    <div className="dashboard-page">
      {/* Overview Stats */}
      <section className="overview">
        <div className="stat-card">
          <div className="stat-value">Week {overview.currentWeek}</div>
          <div className="stat-label">Q{overview.currentQuarter} 2025</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{overview.overallProgress}%</div>
          <div className="stat-label">Overall Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{completedCount}/{overview.totalObjectives}</div>
          <div className="stat-label">Objectives Complete</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{overview.atRisk}/{overview.totalObjectives}</div>
          <div className="stat-label">Objectives At Risk</div>
        </div>
      </section>


      {/* Wins */}
      <section className="wins-section">
        <h2>🎉 Recent Wins</h2>
        <div className="wins-list">
          {wins.map((win, index) => (
            <div key={index} className="win-item">
              {win}
            </div>
          ))}
        </div>
      </section>

      <button onClick={fetchDashboard} className="refresh-button">
        🔄 Refresh Data
      </button>
    </div>
  );
}

export default Dashboard;

import { useState, useEffect, useRef } from 'react';
import WinsTrendline from '../components/WinsTrendline';
import EmptyState from '../components/EmptyState';
import AISparkle from '../components/AISparkle';
import './Dashboard.css';

const API_URL = 'http://localhost:3001/api';

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollPositionRef = useRef(0);

  async function fetchDashboard() {
    try {
      // Save scroll position before fetch
      scrollPositionRef.current = window.scrollY;

      const response = await fetch(`${API_URL}/dashboard`);
      const result = await response.json();

      if (result.success) {
        setDashboard(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Initial load and auto-refresh
  useEffect(() => {
    fetchDashboard();

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchDashboard();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Restore scroll position after data changes
  useEffect(() => {
    if (dashboard) {
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPositionRef.current);
      });
    }
  }, [dashboard]);

  if (loading) {
    return <div className="loading">Loading your OKR data...</div>;
  }

  if (error) {
    // Check if error is due to missing data
    if (error.includes('ENOENT') || error.includes('no such file') || error.includes('Cannot read')) {
      return <EmptyState />;
    }

    return (
      <div className="error">
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <button onClick={fetchDashboard}>Retry</button>
      </div>
    );
  }

  // Show empty state if no objectives exist
  if (!dashboard || !dashboard.objectives || dashboard.objectives.length === 0) {
    return <EmptyState />;
  }

  const { overview, objectives, recentCompletions, wins, winsTimeline } = dashboard;

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
        <h2>
          🎉 Recent Wins
          <AISparkle size={28} />
        </h2>

        {/* Wins Trendline */}
        {winsTimeline && winsTimeline.length > 0 && (
          <WinsTrendline data={winsTimeline} />
        )}

        <div className="wins-list">
          {wins.map((win, index) => {
            // Extract date from end of win string [YYYY-MM-DD]
            const dateMatch = win.match(/\[(\d{4}-\d{2}-\d{2})\]$/);
            const winText = dateMatch ? win.replace(/\s*\[(\d{4}-\d{2}-\d{2})\]$/, '') : win;
            const winDate = dateMatch ? dateMatch[1] : null;

            return (
              <div key={index} className="win-item">
                <span className="win-text">{winText}</span>
                {winDate && <span className="win-date">{winDate}</span>}
              </div>
            );
          })}
        </div>
      </section>

      <button onClick={fetchDashboard} className="refresh-button">
        🔄 Refresh Data
      </button>
    </div>
  );
}

export default Dashboard;

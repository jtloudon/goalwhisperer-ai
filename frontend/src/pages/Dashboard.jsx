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

  return (
    <div className="dashboard-page">
      {/* Overview Stats */}
      <section className="overview">
        <div className="stat-card">
          <div className="stat-value">{overview.overallProgress}%</div>
          <div className="stat-label">Overall Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">Week {overview.currentWeek}</div>
          <div className="stat-label">Q{overview.currentQuarter} 2025</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{overview.onTrack}/{overview.totalObjectives}</div>
          <div className="stat-label">Objectives On Track</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{overview.atRisk}/{overview.totalObjectives}</div>
          <div className="stat-label">Objectives At Risk</div>
        </div>
      </section>

      {/* Objectives */}
      <section className="objectives-section">
        <h2>Objectives</h2>
        {objectives.map(obj => {
          // Calculate KR stats for this objective
          const totalKRs = obj.keyResults.length;
          const completeKRs = obj.keyResults.filter(kr => kr.status === 'complete').length;
          const inProgressKRs = obj.keyResults.filter(kr => kr.status === 'in-progress').length;

          return (
            <div key={obj.id} className="objective-card">
              <div className="objective-header">
                <div>
                  <h3>Objective {obj.number}: {obj.title}</h3>
                  <div className="kr-summary">
                    {completeKRs > 0 && <span className="kr-stat status-complete">{completeKRs} Complete</span>}
                    {inProgressKRs > 0 && <span className="kr-stat status-in-progress">{inProgressKRs} In Progress</span>}
                    <span className="kr-stat total">({completeKRs}/{totalKRs} KRs Done)</span>
                  </div>
                </div>
                <div className="progress-circle">
                  <span>{obj.progress}%</span>
                </div>
              </div>

              <div className="key-results">
              {obj.keyResults.map(kr => (
                <div key={kr.id} className="key-result">
                  <div className="kr-header">
                    <span className="kr-title"><strong>KR {kr.number}:</strong> {kr.title}</span>
                    <span className={`kr-status-indicator status-${kr.status}`}></span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min(kr.progress, 100)}%` }}
                    />
                  </div>
                  <div className="kr-details">
                    {kr.measurement === 'metric' && kr.target > 0 && (
                      <span>{kr.current}/{kr.target}</span>
                    )}
                    {kr.measurement === 'incremental' && kr.target > 0 && (
                      <span>{kr.current}/{kr.target} completed</span>
                    )}
                    <span>Target: {kr.targetDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )
        })}
      </section>

      {/* Recent Completions */}
      <section className="completions-section">
        <h2>Recent Completions</h2>
        <div className="completions-list">
          {recentCompletions.map((completion, index) => (
            <div key={index} className="completion-item">
              <span className="completion-date">{completion.date}</span>
              <span className="completion-status">{completion.status}</span>
              <span className="completion-description">{completion.description}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Wins */}
      <section className="wins-section">
        <h2>🎉 Wins This Week</h2>
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

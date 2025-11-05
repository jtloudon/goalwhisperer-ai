import { useState, useEffect } from 'react';
import './Page.css';

const API_URL = 'http://localhost:3001/api';

function Progress() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  async function fetchProgress() {
    try {
      const response = await fetch(`${API_URL}/tracking/progress`);
      const result = await response.json();
      if (result.success) {
        setProgress(result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading">Loading progress summary...</div>;

  return (
    <div className="page-content">
      <h1>Progress Summary</h1>
      {progress && (
        <>
          <div className="summary-header">
            <h2>Week {progress.week}, Q{progress.quarter} {progress.year}</h2>
            <p className="generated-date">Generated: {progress.generatedDate}</p>
          </div>

          <div className="overview-section">
            <h3>Overview</h3>
            <div className="stats-grid">
              <div className="stat">
                <span className="stat-label">Overall Progress</span>
                <span className="stat-value">{progress.overview.overallProgress}%</span>
              </div>
              <div className="stat">
                <span className="stat-label">On Track</span>
                <span className="stat-value">{progress.overview.onTrack}</span>
              </div>
              <div className="stat">
                <span className="stat-label">At Risk</span>
                <span className="stat-value">{progress.overview.atRisk}</span>
              </div>
            </div>
          </div>

          {progress.wins && progress.wins.length > 0 && (
            <div className="wins-section">
              <h3>🎉 Wins This Week</h3>
              <ul>
                {progress.wins.map((win, idx) => (
                  <li key={idx}>{win}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Progress;

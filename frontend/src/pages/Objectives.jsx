import { useState, useEffect } from 'react';
import './Page.css';

const API_URL = 'http://localhost:3001/api';

function Objectives() {
  const [objectivesData, setObjectivesData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchObjectives();
  }, []);

  async function fetchObjectives() {
    try {
      const response = await fetch(`${API_URL}/objectives/annual`);
      const result = await response.json();
      if (result.success) {
        setObjectivesData(result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading">Loading objectives...</div>;

  const allCurrentObjectives = objectivesData?.current?.objectives || [];
  const activeObjectives = allCurrentObjectives.filter(obj => obj.progress < 100);
  const completedThisYear = allCurrentObjectives.filter(obj => obj.progress === 100);
  const completedYears = objectivesData?.completed || [];

  return (
    <div className="page-content">
      <h1>Objectives</h1>

      {/* Active Objectives */}
      {objectivesData?.current && activeObjectives.length > 0 && (
        <section className="current-objectives">
          <h2>Active Objectives ({objectivesData.current.year})</h2>
          {activeObjectives.map(obj => (
        <div key={obj.id} className="objective-card">
          <h2>Objective {obj.number}: {obj.title}</h2>
          <p>{obj.description}</p>
          <div className="progress-info">
            <strong>Overall Progress: {obj.progress}%</strong>
          </div>
          <h3>Key Results:</h3>
          {obj.keyResults.map(kr => (
            <div key={kr.id} className="kr-item">
              <div className="kr-title-row">
                <span><strong>KR {kr.number}:</strong> {kr.title}</span>
                <span className={`status-badge ${kr.status}`}>{kr.status}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${kr.progress}%` }} />
              </div>
              <div className="kr-meta">
                <span>Target: {kr.targetDate}</span>
                {kr.target > 0 && <span>{kr.current}/{kr.target}</span>}
              </div>
            </div>
          ))}
        </div>
      ))}
        </section>
      )}

      {/* Completed Objectives This Year */}
      {completedThisYear.length > 0 && (
        <section className="completed-objectives">
          <h2>Completed This Year ({objectivesData.current.year})</h2>
          {completedThisYear.map(obj => (
            <div key={obj.id} className="objective-card completed">
              <h2>Objective {obj.number}: {obj.title}</h2>
              <p>{obj.description}</p>
              <div className="progress-info">
                <strong>Overall Progress: {obj.progress}%</strong>
              </div>
              <h3>Key Results:</h3>
              {obj.keyResults.map(kr => (
                <div key={kr.id} className="kr-item">
                  <div className="kr-title-row">
                    <span><strong>KR {kr.number}:</strong> {kr.title}</span>
                    <span className={`status-badge ${kr.status}`}>{kr.status}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${kr.progress}%` }} />
                  </div>
                  <div className="kr-meta">
                    <span>Target: {kr.targetDate}</span>
                    {kr.target > 0 && <span>{kr.current}/{kr.target}</span>}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </section>
      )}

      {/* Completed Objectives from Previous Years */}
      {completedYears.length > 0 && (
        <section className="completed-objectives">
          <h2>Completed from Previous Years</h2>
          {completedYears.map(yearData => (
            <div key={yearData.year} className="year-section">
              <h3>{yearData.year}</h3>
              {yearData.objectives.map(obj => (
                <div key={obj.id} className="objective-card completed">
                  <h4>Objective {obj.number}: {obj.title}</h4>
                  <p>{obj.description}</p>
                  <div className="progress-info">
                    <strong>Final Progress: {obj.progress}%</strong>
                  </div>
                  <details>
                    <summary>View Key Results</summary>
                    {obj.keyResults.map(kr => (
                      <div key={kr.id} className="kr-item">
                        <div className="kr-title-row">
                          <span><strong>KR {kr.number}:</strong> {kr.title}</span>
                          <span className={`status-badge ${kr.status}`}>{kr.status}</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${kr.progress}%` }} />
                        </div>
                        <div className="kr-meta">
                          <span>Target: {kr.targetDate}</span>
                          {kr.target > 0 && <span>{kr.current}/{kr.target}</span>}
                        </div>
                      </div>
                    ))}
                  </details>
                </div>
              ))}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

export default Objectives;

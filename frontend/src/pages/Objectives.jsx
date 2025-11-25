import { useState, useEffect, useRef } from 'react';
import './Page.css';
import AISparkle from '../components/AISparkle';
import '../components/AISparkle.css';
import './Dashboard.css';

const API_URL = 'http://localhost:3001/api';

function Objectives() {
  const [objectivesData, setObjectivesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const scrollPositionRef = useRef(0);

  async function fetchObjectives() {
    try {
      // Save scroll position before fetch
      scrollPositionRef.current = window.scrollY;

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

  // Initial load and auto-refresh
  useEffect(() => {
    fetchObjectives();

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchObjectives();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Restore scroll position after data changes
  useEffect(() => {
    if (objectivesData) {
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPositionRef.current);
      });
    }
  }, [objectivesData]);

  if (loading) return <div className="loading">Loading objectives...</div>;

  const allCurrentObjectives = objectivesData?.current?.objectives || [];
  const activeObjectives = allCurrentObjectives.filter(obj => obj.progress < 100);
  const completedThisYear = allCurrentObjectives.filter(obj => obj.progress === 100);
  const completedYears = objectivesData?.completed || [];

  return (
    <div className="page-content">

      {/* Active Objectives */}
      {objectivesData?.current && activeObjectives.length > 0 && (
        <section className="current-objectives">
          {activeObjectives.map(obj => {
            return (
              <div key={obj.id} className="objective-card">
                <details>
                  <summary className="objective-header">
                    <div>
                      <h3>
                        <span className="objective-label">Objective {obj.number}:</span>
                        <span className="objective-title-text"> {obj.title}</span>
                      </h3>
                    </div>
                    <div className="progress-circle" title="AI-calculated progress">
                      <span>{obj.progress}%</span>
                      <AISparkle size={32} />
                    </div>
                  </summary>

                  <div className="key-results">
                    {obj.keyResults.map(kr => (
                      <div key={kr.id} className="key-result">
                        <div className="kr-header">
                          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <span className={`kr-status-indicator status-${kr.status}`}></span>
                            <span className="kr-title"><strong>KR {kr.number}:</strong> {kr.title}</span>
                          </div>
                          <span className="kr-target-date">Target: {kr.targetDate}</span>
                        </div>

                        {/* Progress bar with baseline/target endpoints and current value */}
                        {kr.baseline !== null && kr.baseline !== undefined && kr.target >= 0 ? (
                          <div className="progress-container">
                            <div className="progress-bar-with-labels">
                              <span className="progress-endpoint baseline">{kr.baseline}</span>
                              <div style={{ position: 'relative', flex: 1 }}>
                                <div className="progress-bar">
                                  <div
                                    className="progress-fill"
                                    style={{ width: `${Math.min(kr.progress, 100)}%` }}
                                  />
                                </div>
                                {/* Tooltip box with current value */}
                                <div
                                  style={{
                                    position: 'absolute',
                                    left: `${Math.min(kr.progress, 100)}%`,
                                    bottom: '100%',
                                    transform: 'translateX(-50%)',
                                    marginBottom: '8px',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    padding: '3px 6px',
                                    borderRadius: '3px',
                                    fontSize: '0.7rem',
                                    fontWeight: '600',
                                    whiteSpace: 'nowrap',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                  }}
                                >
                                  {kr.current}
                                  {/* Arrow pointing down */}
                                  <div
                                    style={{
                                      position: 'absolute',
                                      left: '50%',
                                      top: '100%',
                                      transform: 'translateX(-50%)',
                                      width: 0,
                                      height: 0,
                                      borderLeft: '5px solid transparent',
                                      borderRight: '5px solid transparent',
                                      borderTop: '5px solid var(--primary)'
                                    }}
                                  />
                                </div>
                              </div>
                              <span className="progress-endpoint target">{kr.target}</span>
                            </div>
                          </div>
                        ) : (
                          // Fallback for KRs without baseline
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{ width: `${Math.min(kr.progress, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            );
          })}
        </section>
      )}

      {/* Completed Objectives This Year */}
      {completedThisYear.length > 0 && (
        <section className="completed-objectives">
          <h2>Completed This Year ({objectivesData.current.year})</h2>
          {completedThisYear.map(obj => {
            return (
              <div key={obj.id} className="objective-card completed">
                <details>
                  <summary className="objective-header">
                    <div>
                      <h3>
                        <span className="objective-label">Objective {obj.number}:</span>
                        <span className="objective-title-text"> {obj.title}</span>
                      </h3>
                    </div>
                    <div className="progress-circle" title="AI-calculated progress">
                      <span>{obj.progress}%</span>
                      <AISparkle size={32} />
                    </div>
                  </summary>

                  <div className="key-results">
                    {obj.keyResults.map(kr => (
                      <div key={kr.id} className="key-result">
                        <div className="kr-header">
                          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <span className={`kr-status-indicator status-${kr.status}`}></span>
                            <span className="kr-title"><strong>KR {kr.number}:</strong> {kr.title}</span>
                          </div>
                          <span className="kr-target-date">Target: {kr.targetDate}</span>
                        </div>

                        {/* Progress bar with baseline/target endpoints and current value */}
                        {kr.baseline !== null && kr.baseline !== undefined && kr.target >= 0 ? (
                          <div className="progress-container">
                            <div className="progress-bar-with-labels">
                              <span className="progress-endpoint baseline">{kr.baseline}</span>
                              <div style={{ position: 'relative', flex: 1 }}>
                                <div className="progress-bar">
                                  <div
                                    className="progress-fill"
                                    style={{ width: `${Math.min(kr.progress, 100)}%` }}
                                  />
                                </div>
                                {/* Tooltip box with current value */}
                                <div
                                  style={{
                                    position: 'absolute',
                                    left: `${Math.min(kr.progress, 100)}%`,
                                    bottom: '100%',
                                    transform: 'translateX(-50%)',
                                    marginBottom: '8px',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    padding: '3px 6px',
                                    borderRadius: '3px',
                                    fontSize: '0.7rem',
                                    fontWeight: '600',
                                    whiteSpace: 'nowrap',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                  }}
                                >
                                  {kr.current}
                                  {/* Arrow pointing down */}
                                  <div
                                    style={{
                                      position: 'absolute',
                                      left: '50%',
                                      top: '100%',
                                      transform: 'translateX(-50%)',
                                      width: 0,
                                      height: 0,
                                      borderLeft: '5px solid transparent',
                                      borderRight: '5px solid transparent',
                                      borderTop: '5px solid var(--primary)'
                                    }}
                                  />
                                </div>
                              </div>
                              <span className="progress-endpoint target">{kr.target}</span>
                            </div>
                          </div>
                        ) : (
                          // Fallback for KRs without baseline
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{ width: `${Math.min(kr.progress, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            );
          })}
        </section>
      )}

      {/* Completed Objectives from Previous Years */}
      {completedYears.length > 0 && (
        <section className="completed-objectives">
          <h2>Completed from Previous Years</h2>
          {completedYears.map(yearData => (
            <div key={yearData.year} className="year-section">
              <h3>{yearData.year}</h3>
              {yearData.objectives.map(obj => {
                return (
                  <div key={obj.id} className="objective-card completed">
                    <div className="objective-header">
                      <div>
                        <h3>
                          <span className="objective-label">Objective {obj.number}:</span>
                          <span className="objective-title-text"> {obj.title}</span>
                        </h3>
                      </div>
                      <div className="progress-circle" title="AI-calculated progress">
                        <span>{obj.progress}%</span>
                      </div>
                    </div>

                    <details>
                      <summary>View Key Results</summary>
                      <div className="key-results">
                        {obj.keyResults.map(kr => (
                          <div key={kr.id} className="key-result">
                            <div className="kr-header">
                              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                <span className={`kr-status-indicator status-${kr.status}`}></span>
                                <span className="kr-title"><strong>KR {kr.number}:</strong> {kr.title}</span>
                              </div>
                              <span className="kr-target-date">Target: {kr.targetDate}</span>
                            </div>
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{ width: `${Math.min(kr.progress, 100)}%` }}
                              />
                            </div>
                            {kr.target > 0 && (
                              <div className="kr-details">
                                <span>
                                  {kr.baseline !== null && kr.baseline !== undefined
                                    ? `${kr.baseline} → ${kr.current} → ${kr.target}`
                                    : `${kr.current}/${kr.target}`
                                  }
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                );
              })}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

export default Objectives;

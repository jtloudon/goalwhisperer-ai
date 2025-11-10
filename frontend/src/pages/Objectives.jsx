import { useState, useEffect, useRef } from 'react';
import './Page.css';
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
                        <span className={`kr-status-indicator status-${kr.status}`}></span>
                        <span className="kr-title"><strong>KR {kr.number}:</strong> {kr.title}</span>
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
                              <span
                                className="progress-endpoint"
                                style={{
                                  position: 'absolute',
                                  left: `${Math.min(kr.progress, 100)}%`,
                                  top: '-4px',
                                  transform: 'translateX(5px)',
                                  whiteSpace: 'nowrap',
                                  fontWeight: '700',
                                  fontSize: '0.9rem',
                                  color: '#9b7ab8'
                                }}
                              >
                                {kr.current}
                              </span>
                            </div>
                            <span className="progress-endpoint target">{kr.target}</span>
                          </div>
                          <div className="kr-target-date">Target: {kr.targetDate}</div>
                        </div>
                      ) : (
                        // Fallback for KRs without baseline
                        <>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{ width: `${Math.min(kr.progress, 100)}%` }}
                            />
                          </div>
                          <div className="kr-details">
                            {kr.target > 0 && <span>{kr.current}/{kr.target}</span>}
                            <span>Target: {kr.targetDate}</span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
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
            // Calculate KR stats for this objective
            const totalKRs = obj.keyResults.length;
            const completeKRs = obj.keyResults.filter(kr => kr.status === 'complete').length;
            const inProgressKRs = obj.keyResults.filter(kr => kr.status === 'in-progress').length;

            return (
              <div key={obj.id} className="objective-card completed">
                <div className="objective-header">
                  <div>
                    <h3>Objective {obj.number}: {obj.title}</h3>
                    <div className="kr-summary">
                      {completeKRs > 0 && <span className="kr-stat status-complete">{completeKRs} Complete</span>}
                      {inProgressKRs > 0 && <span className="kr-stat status-in-progress">{inProgressKRs} In Progress</span>}
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
                        <span className={`kr-status-indicator status-${kr.status}`}></span>
                        <span className="kr-title"><strong>KR {kr.number}:</strong> {kr.title}</span>
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
                              <span
                                className="progress-endpoint"
                                style={{
                                  position: 'absolute',
                                  left: `${Math.min(kr.progress, 100)}%`,
                                  top: '-4px',
                                  transform: 'translateX(5px)',
                                  whiteSpace: 'nowrap',
                                  fontWeight: '700',
                                  fontSize: '0.9rem',
                                  color: '#9b7ab8'
                                }}
                              >
                                {kr.current}
                              </span>
                            </div>
                            <span className="progress-endpoint target">{kr.target}</span>
                          </div>
                          <div className="kr-target-date">Target: {kr.targetDate}</div>
                        </div>
                      ) : (
                        // Fallback for KRs without baseline
                        <>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{ width: `${Math.min(kr.progress, 100)}%` }}
                            />
                          </div>
                          <div className="kr-details">
                            {kr.target > 0 && <span>{kr.current}/{kr.target}</span>}
                            <span>Target: {kr.targetDate}</span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
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
                // Calculate KR stats for this objective
                const totalKRs = obj.keyResults.length;
                const completeKRs = obj.keyResults.filter(kr => kr.status === 'complete').length;
                const inProgressKRs = obj.keyResults.filter(kr => kr.status === 'in-progress').length;

                return (
                  <div key={obj.id} className="objective-card completed">
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

                    <details>
                      <summary>View Key Results</summary>
                      <div className="key-results">
                        {obj.keyResults.map(kr => (
                          <div key={kr.id} className="key-result">
                            <div className="kr-header">
                              <span className={`kr-status-indicator status-${kr.status}`}></span>
                              <span className="kr-title"><strong>KR {kr.number}:</strong> {kr.title}</span>
                            </div>
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{ width: `${Math.min(kr.progress, 100)}%` }}
                              />
                            </div>
                            <div className="kr-details">
                              {kr.measurement === 'metric' && kr.target > 0 && (
                                <span>
                                  {kr.baseline !== null && kr.baseline !== undefined
                                    ? `${kr.baseline} → ${kr.current} → ${kr.target}`
                                    : `${kr.current}/${kr.target}`
                                  }
                                </span>
                              )}
                              {kr.measurement === 'incremental' && kr.target > 0 && (
                                <span>
                                  {kr.baseline !== null && kr.baseline !== undefined
                                    ? `${kr.baseline} → ${kr.current} → ${kr.target} completed`
                                    : `${kr.current}/${kr.target} completed`
                                  }
                                </span>
                              )}
                              <span>Target: {kr.targetDate}</span>
                            </div>
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

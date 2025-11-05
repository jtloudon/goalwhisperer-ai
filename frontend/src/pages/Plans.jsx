import { useState, useEffect } from 'react';
import './Page.css';

const API_URL = 'http://localhost:3001/api';

function Plans() {
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const response = await fetch(`${API_URL}/plans`);
      const result = await response.json();
      if (result.success) {
        setPlans(result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading">Loading weekly goals...</div>;

  // Group actions by objective
  function groupActionsByObjective(actions) {
    const grouped = {};
    const ungrouped = [];

    for (const action of actions) {
      if (action.objectiveTitle) {
        if (!grouped[action.objectiveTitle]) {
          grouped[action.objectiveTitle] = [];
        }
        grouped[action.objectiveTitle].push(action);
      } else {
        ungrouped.push(action);
      }
    }

    return { grouped, ungrouped };
  }

  return (
    <div className="page-content">
      <h1>Weekly Goals</h1>
      <div className="plans-timeline">
        {plans && plans.map(plan => {
          const { grouped, ungrouped } = groupActionsByObjective(plan.actions);

          return (
            <div key={plan.file} className="plan-card">
              <div className="plan-header">
                <h3>Week {plan.week}, Q{plan.quarter} {plan.year}</h3>
                <span className="date-range">{plan.dateRange}</span>
              </div>

              {Object.keys(grouped).length > 0 && (
                <div className="actions-by-objective">
                  {Object.entries(grouped).map(([objectiveTitle, actions]) => (
                    <div key={objectiveTitle} className="objective-group">
                      <h4 className="objective-title">{objectiveTitle}</h4>
                      <ul className="actions-list">
                        {actions.map((action, idx) => (
                          <li key={idx}>
                            <span className="action-title">{action.title}</span>
                            {action.krTitle && (
                              <span className="kr-reference">→ {action.krTitle}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {ungrouped.length > 0 && (
                <div className="actions-ungrouped">
                  <h4>Other Actions:</h4>
                  <ul className="actions-list">
                    {ungrouped.map((action, idx) => (
                      <li key={idx}>
                        <span className="action-title">{action.title}</span>
                        {action.mapsTo && (
                          <span className="maps-to-note">{action.mapsTo}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Plans;

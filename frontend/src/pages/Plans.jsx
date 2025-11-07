import { useState, useEffect, useRef } from 'react';
import './Page.css';

const API_URL = 'http://localhost:3001/api';

function Plans() {
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const scrollPositionRef = useRef(0);
  const openWeeksRef = useRef(new Set());

  async function fetchPlans() {
    try {
      // Save scroll position and open states before fetch
      scrollPositionRef.current = window.scrollY;
      const openElements = document.querySelectorAll('details[open]');
      openWeeksRef.current = new Set(
        Array.from(openElements).map(el => el.getAttribute('data-week-id'))
      );

      const response = await fetch(`${API_URL}/plans`);
      const result = await response.json();
      if (result.success) {
        console.log('Plans fetched:', result.data.length, 'plans');
        // Force a new object reference to trigger React update
        setPlans([...result.data]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Initial load and auto-refresh
  useEffect(() => {
    fetchPlans();

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchPlans();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Restore scroll position and open states after data changes
  useEffect(() => {
    if (plans) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        // Restore scroll position
        window.scrollTo(0, scrollPositionRef.current);

        // Restore open state for details elements
        openWeeksRef.current.forEach(id => {
          const element = document.querySelector(`details[data-week-id="${id}"]`);
          if (element) element.open = true;
        });
      });
    }
  }, [plans]);

  if (loading) return <div className="loading">Loading weekly actions...</div>;

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

  // Helper to determine if a plan is current week
  function isCurrentWeek(dateRange) {
    const today = new Date();
    const match = dateRange.match(/(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})/);
    if (!match) return false;

    const startDate = new Date(match[1]);
    const endDate = new Date(match[2]);
    return today >= startDate && today <= endDate;
  }

  // Helper to calculate completion stats
  function getCompletionStats(actions) {
    const completed = actions.filter(a => a.status === 'completed').length;
    const total = actions.length;
    return { completed, total };
  }

  return (
    <div className="page-content">
      <div className="plans-timeline">
        {plans && plans.map((plan, index) => {
          const { grouped, ungrouped } = groupActionsByObjective(plan.actions);
          const isCurrent = isCurrentWeek(plan.dateRange);
          const stats = getCompletionStats(plan.actions);

          // Render content
          const renderContent = () => {
            let actionCounter = 0;

            return (
              <>
                {Object.keys(grouped).length > 0 && (
                  <div className="actions-by-objective">
                    {Object.entries(grouped).map(([objectiveTitle, actions]) => {
                      const objectiveNumber = actions[0]?.objectiveNumber;
                      return (
                        <div key={objectiveTitle} className="objective-group">
                          <h4 className="objective-title">
                            {objectiveNumber && `Objective ${objectiveNumber}: `}
                            {objectiveTitle}
                          </h4>
                          <ul className="actions-list">
                            {actions.map((action) => {
                              actionCounter++;
                              return (
                                <li key={actionCounter} className={action.status === 'completed' ? 'completed' : ''}>
                                  <div>
                                    <span className="action-number">{actionCounter}</span>
                                    <span className="action-checkbox">{action.status === 'completed' ? '☑' : '☐'}</span>
                                    <div>
                                      <span className="action-title">{action.title}</span>
                                      {action.krTitle && (
                                        <span className="kr-reference">
                                          → KR {action.krNumber}: {action.krTitle}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}

                {ungrouped.length > 0 && (
                  <div className="actions-ungrouped">
                    <h4>Other Actions:</h4>
                    <ul className="actions-list">
                      {ungrouped.map((action) => {
                        actionCounter++;
                        return (
                          <li key={actionCounter} className={action.status === 'completed' ? 'completed' : ''}>
                            <div>
                              <span className="action-number">{actionCounter}</span>
                              <span className="action-checkbox">{action.status === 'completed' ? '☑' : '☐'}</span>
                              <div>
                                <span className="action-title">{action.title}</span>
                                {action.mapsTo && (
                                  <span className="maps-to-note">{action.mapsTo}</span>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </>
            );
          };

          // Current week: always expanded
          if (isCurrent) {
            return (
              <div key={plan.file} className="plan-card current-week">
                <div className="plan-header">
                  <h3>Current Week: {plan.dateRange.replace(' to ', '  to  ')}</h3>
                  <span className="completion-badge">{stats.completed}/{stats.total} completed</span>
                </div>
                {renderContent()}
              </div>
            );
          }

          // Past weeks: collapsible
          return (
            <details key={plan.file} className="plan-card past-week" data-week-id={plan.file}>
              <summary className="plan-header">
                <h3>{plan.dateRange.replace(' to ', '  to  ')}</h3>
                <span className="completion-badge">{stats.completed}/{stats.total} completed</span>
              </summary>
              <div className="plan-content">
                {renderContent()}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

export default Plans;

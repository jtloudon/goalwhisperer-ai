import { useState, useEffect } from 'react';
import './Page.css';

const API_URL = 'http://localhost:3001/api';

function Completed() {
  const [completed, setCompleted] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompleted();

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchCompleted();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  async function fetchCompleted() {
    try {
      // Only show loading spinner on initial load
      if (!completed) {
        setLoading(true);
      }

      // Save scroll position before fetch
      const scrollPosition = window.scrollY;

      const response = await fetch(`${API_URL}/tracking/completed`);
      const result = await response.json();
      if (result.success) {
        setCompleted(result.data);
        // Restore scroll position after state update
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollPosition);
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading">Loading completed items...</div>;

  return (
    <div className="page-content">
      <h1>Completed Items</h1>
      {completed && completed.map(obj => (
        <div key={obj.id} className="objective-section">
          <h2>Objective {obj.number}: {obj.title}</h2>
          {obj.keyResults.map(kr => (
            <div key={kr.id} className="kr-section">
              <h3>KR {kr.number}: {kr.title}</h3>
              <div className="completions-list">
                {kr.completions.map((completion, idx) => (
                  <div key={idx} className="completion-row">
                    <span className="date">{completion.date}</span>
                    <span className="status">{completion.status}</span>
                    <span className="description">{completion.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default Completed;

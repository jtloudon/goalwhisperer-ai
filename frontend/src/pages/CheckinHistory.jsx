import { useState, useEffect, useRef } from 'react';
import './Page.css';
import AISparkle from '../components/AISparkle';
import '../components/AISparkle.css';

const API_URL = 'http://localhost:3001/api';

function CheckinHistory() {
  const [checkins, setCheckins] = useState(null);
  const [loading, setLoading] = useState(true);
  const scrollPositionRef = useRef(0);
  const openCheckinsRef = useRef(new Set());

  // Format date from YYYY-MM-DD to mmm-dd
  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}-${day}`;
  };

  async function fetchCheckins() {
    try {
      // Save scroll position and open states before fetch
      scrollPositionRef.current = window.scrollY;
      const openElements = document.querySelectorAll('details[open]');
      openCheckinsRef.current = new Set(
        Array.from(openElements).map(el => el.getAttribute('data-checkin-id'))
      );

      const response = await fetch(`${API_URL}/tracking/checkin-history`);
      const result = await response.json();
      if (result.success) {
        console.log('Check-ins fetched:', result.data.length, 'check-ins');
        setCheckins([...result.data]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Initial load and auto-refresh
  useEffect(() => {
    fetchCheckins();

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchCheckins();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Restore scroll position and open states after data changes
  useEffect(() => {
    if (checkins) {
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPositionRef.current);

        openCheckinsRef.current.forEach(id => {
          const element = document.querySelector(`details[data-checkin-id="${id}"]`);
          if (element) element.open = true;
        });
      });
    }
  }, [checkins]);

  if (loading) return <div className="loading">Loading check-in history...</div>;
  if (!checkins || checkins.length === 0) {
    return (
      <div className="page-content">
        <p className="empty-state">No check-in history yet. Complete a weekly check-in to see it here!</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="checkins-timeline">
        {checkins.map((checkin, index) => {
          const checkinId = `${checkin.weekStart}-${checkin.weekEnd}`;
          const isFirst = index === 0;

          const renderContent = () => (
            <div className="checkin-content">
              {checkin.date && (
                <div className="checkin-date">
                  <strong>Date:</strong> {checkin.date}
                </div>
              )}

              {checkin.completions && (
                <div className="checkin-section">
                  <h4>What Was Completed</h4>
                  <div className="section-content">{checkin.completions}</div>
                </div>
              )}

              {checkin.updates && (
                <div className="checkin-section">
                  <h4>Updates Made</h4>
                  <div className="section-content">{checkin.updates}</div>
                </div>
              )}

              {checkin.nextWeekFocus && (
                <div className="checkin-section">
                  <h4>Next Week Focus</h4>
                  <div className="section-content">{checkin.nextWeekFocus}</div>
                </div>
              )}

              {checkin.insights && (
                <div className="checkin-section">
                  <h4>Insights</h4>
                  <div className="section-content">{checkin.insights}</div>
                </div>
              )}
            </div>
          );

          // Most recent check-in: always expanded
          if (isFirst) {
            return (
              <div key={checkinId} className="checkin-card current-checkin">
                <div className="checkin-header">
                  <h3>
                    <span className="checkin-label">Check-in:</span>
                    <span className="checkin-date-range"> {formatDate(checkin.weekStart)} - {formatDate(checkin.weekEnd)}</span>
                  </h3>
                  <div className="badge-with-sparkle">
                    <span className="recent-badge">Most Recent</span>
                    <AISparkle size={22} />
                  </div>
                </div>
                {renderContent()}
              </div>
            );
          }

          // Past check-ins: collapsible
          return (
            <details key={checkinId} className="checkin-card past-checkin" data-checkin-id={checkinId}>
              <summary className="checkin-header">
                <h3>
                  <span className="checkin-label">Check-in:</span>
                  <span className="checkin-date-range"> {formatDate(checkin.weekStart)} - {formatDate(checkin.weekEnd)}</span>
                </h3>
              </summary>
              {renderContent()}
            </details>
          );
        })}
      </div>
    </div>
  );
}

export default CheckinHistory;

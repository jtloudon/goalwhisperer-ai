import './EmptyState.css';

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state-content">
        <h1>Let's Create Your First Goal!</h1>
        <p className="empty-state-subtitle">
          Your AI Coach is ready to help you get started
        </p>

        <div className="coach-spotlight">
          <div className="spotlight-content">
            <div className="spotlight-step">
              <div className="step-number">1</div>
              <h3>Look to your right</h3>
              <p>See the <strong>AI Coach</strong> panel?</p>
            </div>

            <div className="spotlight-arrow">→</div>

            <div className="spotlight-step">
              <div className="step-number">2</div>
              <h3>Start the conversation</h3>
              <p>Tell your coach what you want to achieve</p>
            </div>
          </div>

          <div className="example-prompts">
            <h3>Try saying...</h3>
            <div className="prompt-cards">
              <div className="prompt-card">
                <div className="prompt-icon">💼</div>
                <p>"Help me create a goal for launching my business"</p>
              </div>
              <div className="prompt-card">
                <div className="prompt-icon">📚</div>
                <p>"I want to learn web development this year"</p>
              </div>
              <div className="prompt-card">
                <div className="prompt-icon">💪</div>
                <p>"Set up a goal for getting fit and healthy"</p>
              </div>
            </div>
          </div>

          <div className="coach-benefits">
            <h3>Your AI Coach will help you:</h3>
            <ul>
              <li>✨ Define clear, measurable objectives</li>
              <li>🎯 Break goals into key results</li>
              <li>📅 Set realistic timelines</li>
              <li>📊 Track your progress over time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmptyState;
